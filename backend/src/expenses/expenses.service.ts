import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { NotificationType, SplitType } from '../common/enums';
import { formatCurrencyTR } from '../common/utils/date.util';
import { round2, splitEvenly } from '../common/utils/money.util';
import { HouseholdsService } from '../households/households.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import {
  CreateExpenseDto,
  ExpenseShareDto,
  QueryExpensesDto,
  UpdateExpenseDto,
} from './dto';
import { ExpenseShare } from './entities/expense-share.entity';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenses: Repository<Expense>,
    @InjectRepository(ExpenseShare)
    private readonly shares: Repository<ExpenseShare>,
    private readonly households: HouseholdsService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Payları hesaplar. shares verilmişse toplamı tutarla eşleşmelidir;
   * verilmemişse katılımcılar arasında kuruş artığı dağıtılarak eşit bölünür.
   */
  private async buildShares(
    householdId: string,
    amount: number,
    shares: ExpenseShareDto[] | undefined,
    participantIds: string[] | undefined,
    splitType: SplitType,
  ): Promise<Pick<ExpenseShare, 'userId' | 'amount' | 'weight'>[]> {
    if (shares?.length) {
      const total = round2(
        shares.reduce((sum, share) => sum + share.amount, 0),
      );
      if (Math.abs(total - round2(amount)) > 0.01) {
        throw new BadRequestException(
          `Payların toplamı (${total}) tutarla (${round2(amount)}) eşleşmiyor.`,
        );
      }
      return shares.map((share) => ({
        userId: share.userId,
        amount: round2(share.amount),
        weight: share.weight,
      }));
    }

    const members = await this.households.memberIds(householdId);
    const participants = participantIds?.length ? participantIds : members;

    const unknown = participants.filter((id) => !members.includes(id));
    if (unknown.length > 0) {
      throw new BadRequestException(
        'Seçilen kişilerden bazıları bu evin üyesi değil.',
      );
    }

    const parts = splitEvenly(amount, participants.length);
    return participants.map((userId, index) => ({
      userId,
      amount: parts[index],
      weight: splitType === SplitType.EQUAL ? undefined : 0,
    }));
  }

  async list(
    householdId: string,
    userId: string,
    query: QueryExpensesDto,
  ): Promise<Expense[]> {
    await this.households.requireMembership(householdId, userId);

    const where: FindOptionsWhere<Expense> = { householdId };
    if (query.category) where.category = query.category;
    if (query.paidBy) where.paidBy = query.paidBy;
    if (query.search) where.title = ILike(`%${query.search}%`);
    if (query.from && query.to)
      where.date = Between(new Date(query.from), new Date(query.to));
    else if (query.from) where.date = MoreThanOrEqual(new Date(query.from));
    else if (query.to) where.date = LessThanOrEqual(new Date(query.to));

    return this.expenses.find({
      where,
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  /** İlgili evin üyesi olmayan kullanıcıya gider gösterilmez */
  async findOne(expenseId: string, userId: string): Promise<Expense> {
    const expense = await this.expenses.findOne({ where: { id: expenseId } });
    if (!expense) throw new NotFoundException('Gider bulunamadı.');
    await this.households.requireMembership(expense.householdId, userId);
    return expense;
  }

  async create(
    householdId: string,
    user: User,
    dto: CreateExpenseDto,
  ): Promise<Expense> {
    await this.households.requireMembership(householdId, user.id);
    const household = await this.households.getRaw(householdId);

    const shares = await this.buildShares(
      householdId,
      dto.amount,
      dto.shares,
      dto.participantIds,
      dto.splitType,
    );

    const expense = await this.expenses.save(
      this.expenses.create({
        householdId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        amount: round2(dto.amount),
        category: dto.category,
        paidBy: dto.paidBy,
        date: new Date(dto.date),
        splitType: dto.splitType,
        billId: dto.billId,
        createdBy: user.id,
        shares: shares.map((share) => this.shares.create(share)),
      }),
    );

    // Paya dahil olan her üyeye kendi payını bildir
    await Promise.all(
      shares
        .filter((share) => share.userId !== user.id && share.amount > 0)
        .map((share) =>
          this.notifications.dispatch({
            householdId,
            type: NotificationType.EXPENSE_ADDED,
            title: `${user.fullName.split(' ')[0]} yeni bir gider ekledi`,
            body: `${expense.title} • ${formatCurrencyTR(expense.amount, household.currency)} • Payın: ${formatCurrencyTR(share.amount, household.currency)}`,
            data: { expenseId: expense.id, type: 'expense_added' },
            userIds: [share.userId],
            channelId: 'expenses',
          }),
        ),
    );

    return this.findOne(expense.id, user.id);
  }

  async update(
    expenseId: string,
    userId: string,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.findOne(expenseId, userId);

    const amount =
      dto.amount !== undefined ? round2(dto.amount) : expense.amount;
    const splitType = dto.splitType ?? expense.splitType;

    // Tutar, katılımcılar veya bölüşüm tipi değiştiyse paylar yeniden hesaplanır
    const sharesChanged =
      dto.amount !== undefined ||
      dto.shares !== undefined ||
      dto.participantIds !== undefined ||
      dto.splitType !== undefined;

    if (sharesChanged) {
      const nextShares = await this.buildShares(
        expense.householdId,
        amount,
        dto.shares,
        dto.participantIds ?? expense.shares.map((share) => share.userId),
        splitType,
      );
      await this.shares.delete({ expenseId: expense.id });
      expense.shares = nextShares.map((share) =>
        this.shares.create({ ...share, expenseId: expense.id }),
      );
    }

    Object.assign(expense, {
      title: dto.title?.trim() ?? expense.title,
      description: dto.description ?? expense.description,
      amount,
      category: dto.category ?? expense.category,
      paidBy: dto.paidBy ?? expense.paidBy,
      date: dto.date ? new Date(dto.date) : expense.date,
      splitType,
    });

    await this.expenses.save(expense);
    return this.findOne(expense.id, userId);
  }

  async remove(expenseId: string, userId: string): Promise<void> {
    const expense = await this.findOne(expenseId, userId);
    await this.expenses.delete({ id: expense.id });
  }

  /** Fatura ödemesinden otomatik gider oluşturur (BillsService kullanır) */
  async createFromBill(params: {
    householdId: string;
    title: string;
    amount: number;
    category: CreateExpenseDto['category'];
    paidBy: string;
    date: Date;
    participantIds: string[];
    billId: string;
    createdBy: string;
  }): Promise<Expense> {
    const parts = splitEvenly(params.amount, params.participantIds.length);
    return this.expenses.save(
      this.expenses.create({
        householdId: params.householdId,
        title: params.title,
        description: 'Fatura ödemesinden otomatik oluşturuldu',
        amount: round2(params.amount),
        category: params.category,
        paidBy: params.paidBy,
        date: params.date,
        splitType: SplitType.EQUAL,
        billId: params.billId,
        createdBy: params.createdBy,
        shares: params.participantIds.map((userId, index) =>
          this.shares.create({ userId, amount: parts[index] }),
        ),
      }),
    );
  }

  /** Bakiye hesabı için ham veri */
  findForBalances(householdId: string): Promise<Expense[]> {
    return this.expenses.find({ where: { householdId } });
  }
}
