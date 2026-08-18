import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';

import {
  BillStatus,
  ChoreStatus,
  PlatformRole,
  UserStatus,
} from '../common/enums';
import { addDays } from '../common/utils/date.util';
import { round2 } from '../common/utils/money.util';
import { Settlement } from '../balances/entities/settlement.entity';
import { Bill } from '../bills/entities/bill.entity';
import { Chore } from '../chores/entities/chore.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { HouseholdMember } from '../households/entities/household-member.entity';
import { Household } from '../households/entities/household.entity';
import { User } from '../users/entities/user.entity';
import { AdminQueryUsersDto, AdminUpdateUserDto } from './dto';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminCount: number;
  newUsersThisWeek: number;
  totalHouseholds: number;
  totalExpenses: number;
  totalExpenseAmount: number;
  totalBills: number;
  pendingBills: number;
  totalChores: number;
  pendingChores: number;
}

export interface AdminUserSummary {
  user: User;
  householdCount: number;
  householdNames: string[];
  expenseCount: number;
  totalPaid: number;
  completedChoreCount: number;
  lastActivityAt?: string;
}

export interface AdminHouseholdSummary {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  expenseCount: number;
  totalExpenseAmount: number;
  currency: string;
  ownerName: string;
  createdAt: Date;
}

/** Yalnızca platform yöneticisi tarafından çağrılır (PlatformAdminGuard) */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Household)
    private readonly households: Repository<Household>,
    @InjectRepository(HouseholdMember)
    private readonly members: Repository<HouseholdMember>,
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(Bill) private readonly bills: Repository<Bill>,
    @InjectRepository(Chore) private readonly chores: Repository<Chore>,
    @InjectRepository(Settlement)
    private readonly settlements: Repository<Settlement>,
  ) {}

  async stats(): Promise<AdminStats> {
    const [users, households, expenses, bills, chores] = await Promise.all([
      this.users.find(),
      this.households.count(),
      this.expenses.find({ select: { id: true, amount: true } }),
      this.bills.find({ select: { id: true, status: true } }),
      this.chores.find({ select: { id: true, status: true } }),
    ]);

    const weekAgo = addDays(new Date(), -7);

    return {
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.status !== UserStatus.SUSPENDED)
        .length,
      suspendedUsers: users.filter(
        (user) => user.status === UserStatus.SUSPENDED,
      ).length,
      adminCount: users.filter(
        (user) => user.platformRole === PlatformRole.ADMIN,
      ).length,
      newUsersThisWeek: users.filter((user) => user.createdAt >= weekAgo)
        .length,
      totalHouseholds: households,
      totalExpenses: expenses.length,
      totalExpenseAmount: round2(
        expenses.reduce((sum, row) => sum + Number(row.amount), 0),
      ),
      totalBills: bills.length,
      pendingBills: bills.filter((bill) => bill.status !== BillStatus.PAID)
        .length,
      totalChores: chores.length,
      pendingChores: chores.filter(
        (chore) => chore.status === ChoreStatus.PENDING,
      ).length,
    };
  }

  private async buildUserSummary(user: User): Promise<AdminUserSummary> {
    const memberships = await this.members.find({ where: { userId: user.id } });
    const householdIds = memberships.map(
      (membership) => membership.householdId,
    );

    const [households, paidExpenses, completedChores] = await Promise.all([
      householdIds.length
        ? this.households.find({ where: { id: In(householdIds) } })
        : [],
      this.expenses.find({ where: { paidBy: user.id } }),
      this.chores.find({
        where: { completedBy: user.id, status: ChoreStatus.DONE },
      }),
    ]);

    const activity = [
      ...paidExpenses.map((expense) => expense.createdAt),
      ...completedChores.map((chore) => chore.completedAt ?? chore.createdAt),
      user.lastLoginAt,
    ]
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      user,
      householdCount: householdIds.length,
      householdNames: households.map((household) => household.name),
      expenseCount: paidExpenses.length,
      totalPaid: round2(
        paidExpenses.reduce((sum, row) => sum + Number(row.amount), 0),
      ),
      completedChoreCount: completedChores.length,
      lastActivityAt: activity.at(-1)?.toISOString(),
    };
  }

  async listUsers(query: AdminQueryUsersDto): Promise<AdminUserSummary[]> {
    const where: Record<string, unknown> = {};
    if (query.role && query.role !== 'all') where.platformRole = query.role;
    if (query.status && query.status !== 'all') where.status = query.status;

    const users = await this.users.find({
      where: query.search
        ? [
            { ...where, fullName: ILike(`%${query.search}%`) },
            { ...where, email: ILike(`%${query.search}%`) },
          ]
        : where,
      order: { createdAt: 'DESC' },
    });

    return Promise.all(users.map((user) => this.buildUserSummary(user)));
  }

  async getUser(userId: string): Promise<AdminUserSummary> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    return this.buildUserSummary(user);
  }

  async updateUser(
    actor: User,
    userId: string,
    dto: AdminUpdateUserDto,
  ): Promise<User> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const adminCount = await this.users.countBy({
      platformRole: PlatformRole.ADMIN,
    });

    // Son yöneticinin yetkisi alınamaz; yönetici kendini askıya alamaz
    if (
      dto.platformRole === PlatformRole.USER &&
      user.platformRole === PlatformRole.ADMIN &&
      adminCount <= 1
    ) {
      throw new BadRequestException('Sistemde en az bir yönetici kalmalı.');
    }
    if (user.id === actor.id && dto.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('Kendi hesabınızı askıya alamazsınız.');
    }
    if (user.id === actor.id && dto.platformRole === PlatformRole.USER) {
      throw new BadRequestException(
        'Kendi yönetici yetkinizi kaldıramazsınız.',
      );
    }

    Object.assign(user, {
      fullName: dto.fullName?.trim() ?? user.fullName,
      phone: dto.phone ?? user.phone,
      platformRole: dto.platformRole ?? user.platformRole,
      status: dto.status ?? user.status,
    });

    return this.users.save(user);
  }

  /** Kullanıcıyı ve kurduğu evleri (bağlı tüm verilerle) siler */
  async deleteUser(actor: User, userId: string): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    if (user.id === actor.id)
      throw new BadRequestException('Kendi hesabınızı silemezsiniz.');

    const adminCount = await this.users.countBy({
      platformRole: PlatformRole.ADMIN,
    });
    if (user.platformRole === PlatformRole.ADMIN && adminCount <= 1) {
      throw new BadRequestException('Sistemde en az bir yönetici kalmalı.');
    }

    // Ev kayıtları ON DELETE CASCADE ile bağlı verileri de temizler
    const owned = await this.households.find({ where: { createdBy: user.id } });
    if (owned.length > 0) {
      await this.households.delete({
        id: In(owned.map((household) => household.id)),
      });
    }
    await this.users.delete({ id: user.id });
  }

  async listHouseholds(): Promise<AdminHouseholdSummary[]> {
    const households = await this.households.find({
      relations: { creator: true },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      households.map(async (household) => {
        const [memberCount, expenses] = await Promise.all([
          this.members.countBy({ householdId: household.id }),
          this.expenses.find({
            where: { householdId: household.id },
            select: { id: true, amount: true },
          }),
        ]);

        return {
          id: household.id,
          name: household.name,
          inviteCode: household.inviteCode,
          memberCount,
          expenseCount: expenses.length,
          totalExpenseAmount: round2(
            expenses.reduce((sum, row) => sum + Number(row.amount), 0),
          ),
          currency: household.currency,
          ownerName: household.creator?.fullName ?? 'Bilinmiyor',
          createdAt: household.createdAt,
        };
      }),
    );
  }
}
