import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
  BillStatus,
  BillType,
  ExpenseCategory,
  NotificationType,
} from '../common/enums';
import {
  addMonths,
  daysUntil,
  formatCurrencyTR,
  recurrenceToMonths,
} from '../common/utils/date.util';
import { round2 } from '../common/utils/money.util';
import { ExpensesService } from '../expenses/expenses.service';
import { HouseholdsService } from '../households/households.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateBillDto, PayBillDto, UpdateBillDto } from './dto';
import { Bill } from './entities/bill.entity';

const BILL_TYPE_LABELS: Record<BillType, string> = {
  [BillType.ELEKTRIK]: 'Elektrik',
  [BillType.SU]: 'Su',
  [BillType.DOGALGAZ]: 'Doğalgaz',
  [BillType.INTERNET]: 'İnternet',
  [BillType.KIRA]: 'Kira',
  [BillType.AIDAT]: 'Aidat',
  [BillType.DIGER]: 'Diğer',
};

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private readonly bills: Repository<Bill>,
    private readonly households: HouseholdsService,
    private readonly notifications: NotificationsService,
    private readonly expenses: ExpensesService,
    private readonly users: UsersService,
  ) {}

  /** Vadesi geçmiş faturaları işaretler; okuma öncesi çalışır */
  private async refreshStatuses(bills: Bill[]): Promise<Bill[]> {
    const changed: Bill[] = [];
    bills.forEach((bill) => {
      if (bill.status === BillStatus.PAID) return;
      const next =
        daysUntil(bill.dueDate) < 0 ? BillStatus.OVERDUE : BillStatus.PENDING;
      if (bill.status !== next) {
        bill.status = next;
        changed.push(bill);
      }
    });
    if (changed.length > 0) await this.bills.save(changed);
    return bills;
  }

  private async resolveParticipants(
    householdId: string,
    ids?: string[],
  ): Promise<User[]> {
    const memberIds = await this.households.memberIds(householdId);
    const target = ids?.length
      ? ids.filter((id) => memberIds.includes(id))
      : memberIds;
    return this.users.findManyByIds(target);
  }

  async list(householdId: string, userId: string): Promise<Bill[]> {
    await this.households.requireMembership(householdId, userId);
    const bills = await this.bills.find({
      where: { householdId },
      order: { dueDate: 'ASC' },
    });
    await this.refreshStatuses(bills);

    // Ödenmişler listenin sonuna
    return bills.sort((a, b) => {
      if (a.status === BillStatus.PAID && b.status !== BillStatus.PAID)
        return 1;
      if (b.status === BillStatus.PAID && a.status !== BillStatus.PAID)
        return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }

  async findOne(billId: string, userId: string): Promise<Bill> {
    const bill = await this.bills.findOne({ where: { id: billId } });
    if (!bill) throw new NotFoundException('Fatura bulunamadı.');
    await this.households.requireMembership(bill.householdId, userId);
    await this.refreshStatuses([bill]);
    return bill;
  }

  async create(
    householdId: string,
    user: User,
    dto: CreateBillDto,
  ): Promise<Bill> {
    await this.households.requireMembership(householdId, user.id);
    const household = await this.households.getRaw(householdId);
    const dueDate = new Date(dto.dueDate);

    const bill = await this.bills.save(
      this.bills.create({
        householdId,
        name: dto.name.trim(),
        type: dto.type,
        amount: round2(dto.amount),
        dueDate,
        status:
          daysUntil(dueDate) < 0 ? BillStatus.OVERDUE : BillStatus.PENDING,
        recurrence: dto.recurrence,
        reminderDaysBefore: dto.reminderDaysBefore ?? 3,
        autoCreateExpense: dto.autoCreateExpense ?? true,
        notes: dto.notes?.trim(),
        createdBy: user.id,
        participants: await this.resolveParticipants(
          householdId,
          dto.participantIds,
        ),
      }),
    );

    await this.notifications.dispatch({
      householdId,
      type: NotificationType.BILL_DUE,
      title: 'Yeni fatura eklendi',
      body: `${BILL_TYPE_LABELS[bill.type]} • ${formatCurrencyTR(bill.amount, household.currency)}`,
      data: { billId: bill.id, type: 'bill_due' },
      userIds: await this.households.memberIds(householdId),
      excludeUserId: user.id,
      channelId: 'bills',
    });

    return bill;
  }

  async update(
    billId: string,
    userId: string,
    dto: UpdateBillDto,
  ): Promise<Bill> {
    const bill = await this.findOne(billId, userId);

    if (dto.participantIds) {
      bill.participants = await this.resolveParticipants(
        bill.householdId,
        dto.participantIds,
      );
    }

    Object.assign(bill, {
      name: dto.name?.trim() ?? bill.name,
      type: dto.type ?? bill.type,
      amount: dto.amount !== undefined ? round2(dto.amount) : bill.amount,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : bill.dueDate,
      recurrence: dto.recurrence ?? bill.recurrence,
      reminderDaysBefore: dto.reminderDaysBefore ?? bill.reminderDaysBefore,
      autoCreateExpense: dto.autoCreateExpense ?? bill.autoCreateExpense,
      notes: dto.notes ?? bill.notes,
    });

    if (bill.status !== BillStatus.PAID) {
      bill.status =
        daysUntil(bill.dueDate) < 0 ? BillStatus.OVERDUE : BillStatus.PENDING;
      // Tarih değiştiyse hatırlatmalar yeniden gönderilebilmeli
      bill.dueReminderSentAt = undefined;
      bill.overdueReminderSentAt = undefined;
    }

    return this.bills.save(bill);
  }

  /**
   * Faturayı öder; istenirse ortak gidere yansıtır ve
   * tekrarlayan faturalarda bir sonraki dönemi otomatik oluşturur.
   */
  async pay(billId: string, user: User, dto: PayBillDto): Promise<Bill> {
    const bill = await this.findOne(billId, user.id);
    const household = await this.households.getRaw(bill.householdId);

    const paidAmount = round2(dto.amount ?? bill.amount);
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    bill.status = BillStatus.PAID;
    bill.paidAt = paidAt;
    bill.paidBy = dto.paidBy;
    bill.amount = paidAmount;
    await this.bills.save(bill);

    if (bill.autoCreateExpense) {
      const participantIds = bill.participants?.length
        ? bill.participants.map((participant) => participant.id)
        : await this.households.memberIds(bill.householdId);

      await this.expenses.createFromBill({
        householdId: bill.householdId,
        title: bill.name,
        amount: paidAmount,
        category:
          bill.type === BillType.KIRA
            ? ExpenseCategory.KIRA
            : ExpenseCategory.FATURA,
        paidBy: dto.paidBy,
        date: paidAt,
        participantIds,
        billId: bill.id,
        createdBy: user.id,
      });
    }

    const months = recurrenceToMonths(bill.recurrence);
    if (months > 0) {
      await this.bills.save(
        this.bills.create({
          householdId: bill.householdId,
          name: bill.name,
          type: bill.type,
          amount: bill.amount,
          dueDate: addMonths(bill.dueDate, months),
          status: BillStatus.PENDING,
          recurrence: bill.recurrence,
          reminderDaysBefore: bill.reminderDaysBefore,
          autoCreateExpense: bill.autoCreateExpense,
          notes: bill.notes,
          createdBy: bill.createdBy,
          participants: bill.participants,
        }),
      );
    }

    const payer = await this.users.findById(dto.paidBy);
    await this.notifications.dispatch({
      householdId: bill.householdId,
      type: NotificationType.BILL_PAID,
      title: `${BILL_TYPE_LABELS[bill.type]} faturası ödendi`,
      body: `${payer?.fullName ?? 'Bir üye'} ${formatCurrencyTR(paidAmount, household.currency)} ödedi.`,
      data: { billId: bill.id, type: 'bill_paid' },
      userIds: await this.households.memberIds(bill.householdId),
      excludeUserId: user.id,
      channelId: 'bills',
    });

    return bill;
  }

  async remove(billId: string, userId: string): Promise<void> {
    const bill = await this.findOne(billId, userId);
    await this.bills.delete({ id: bill.id });
  }

  /** Hatırlatma görevinin kullandığı sorgular */
  findUnpaid(): Promise<Bill[]> {
    return this.bills.find({
      where: { status: In([BillStatus.PENDING, BillStatus.OVERDUE]) },
    });
  }

  markReminderSent(bill: Bill, kind: 'due' | 'overdue'): Promise<Bill> {
    if (kind === 'due') bill.dueReminderSentAt = new Date();
    else bill.overdueReminderSentAt = new Date();
    return this.bills.save(bill);
  }

  labelFor(type: BillType): string {
    return BILL_TYPE_LABELS[type];
  }
}
