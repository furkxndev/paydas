import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificationType } from '../common/enums';
import {
  Debt,
  MemberBalance,
  calculateBalances,
  simplifyDebts,
} from '../common/utils/balance.util';
import { formatCurrencyTR } from '../common/utils/date.util';
import { round2 } from '../common/utils/money.util';
import { Expense } from '../expenses/entities/expense.entity';
import { HouseholdsService } from '../households/households.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { Settlement } from './entities/settlement.entity';

export interface BalancesResult {
  balances: MemberBalance[];
  debts: Debt[];
}

@Injectable()
export class BalancesService {
  constructor(
    @InjectRepository(Settlement)
    private readonly settlements: Repository<Settlement>,
    @InjectRepository(Expense)
    private readonly expenses: Repository<Expense>,
    private readonly households: HouseholdsService,
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
  ) {}

  /** Net bakiyeler ve en az sayıda transfere indirgenmiş borç listesi */
  async get(householdId: string, userId: string): Promise<BalancesResult> {
    await this.households.requireMembership(householdId, userId);

    const [expenses, settlements, memberIds] = await Promise.all([
      this.expenses.find({ where: { householdId } }),
      this.settlements.find({ where: { householdId } }),
      this.households.memberIds(householdId),
    ]);

    const balances = calculateBalances(memberIds, expenses, settlements);
    return { balances, debts: simplifyDebts(balances) };
  }

  async listSettlements(
    householdId: string,
    userId: string,
  ): Promise<Settlement[]> {
    await this.households.requireMembership(householdId, userId);
    return this.settlements.find({
      where: { householdId },
      order: { settledAt: 'DESC' },
    });
  }

  async settle(
    householdId: string,
    user: User,
    dto: CreateSettlementDto,
  ): Promise<Settlement> {
    await this.households.requireMembership(householdId, user.id);

    if (dto.fromUserId === dto.toUserId) {
      throw new BadRequestException('Ödeyen ve alan kişi aynı olamaz.');
    }

    const memberIds = await this.households.memberIds(householdId);
    if (
      !memberIds.includes(dto.fromUserId) ||
      !memberIds.includes(dto.toUserId)
    ) {
      throw new BadRequestException(
        'Seçilen kişilerden biri bu evin üyesi değil.',
      );
    }

    const settlement = await this.settlements.save(
      this.settlements.create({
        householdId,
        fromUserId: dto.fromUserId,
        toUserId: dto.toUserId,
        amount: round2(dto.amount),
        note: dto.note?.trim(),
        settledAt: new Date(),
      }),
    );

    const household = await this.households.getRaw(householdId);
    const [fromUser, toUser] = await Promise.all([
      this.users.findById(dto.fromUserId),
      this.users.findById(dto.toUserId),
    ]);

    await this.notifications.dispatch({
      householdId,
      type: NotificationType.SETTLEMENT,
      title: 'Ödeme kaydedildi',
      body: `${fromUser?.fullName ?? 'Bir üye'} → ${toUser?.fullName ?? 'bir üye'} • ${formatCurrencyTR(settlement.amount, household.currency)}`,
      data: { settlementId: settlement.id, type: 'settlement' },
      userIds: [dto.fromUserId, dto.toUserId],
      excludeUserId: user.id,
      channelId: 'expenses',
    });

    return settlement;
  }
}
