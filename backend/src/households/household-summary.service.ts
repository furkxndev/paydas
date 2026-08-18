import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { BillStatus, ChoreStatus } from '../common/enums';
import { calculateBalances } from '../common/utils/balance.util';
import { startOfMonth } from '../common/utils/date.util';
import { round2 } from '../common/utils/money.util';
import { Settlement } from '../balances/entities/settlement.entity';
import { Bill } from '../bills/entities/bill.entity';
import { Chore } from '../chores/entities/chore.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { HouseholdsService } from './households.service';

export interface HouseholdSummary {
  monthTotal: number;
  allTimeTotal: number;
  myNet: number;
  myPaid: number;
  myOwed: number;
  pendingBillsCount: number;
  overdueBillsCount: number;
  upcomingBillsTotal: number;
  pendingChoresCount: number;
  myPendingChoresCount: number;
  memberCount: number;
}

/**
 * Ana ekrandaki özet.
 * Modüller arası döngüsel bağımlılığı önlemek için servisler yerine
 * doğrudan depolar (repository) kullanılır.
 */
@Injectable()
export class HouseholdSummaryService {
  constructor(
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(Bill) private readonly bills: Repository<Bill>,
    @InjectRepository(Chore) private readonly chores: Repository<Chore>,
    @InjectRepository(Settlement)
    private readonly settlements: Repository<Settlement>,
    private readonly households: HouseholdsService,
  ) {}

  async build(householdId: string, userId: string): Promise<HouseholdSummary> {
    await this.households.requireMembership(householdId, userId);

    const [expenses, monthExpenses, bills, chores, settlements, memberIds] =
      await Promise.all([
        this.expenses.find({ where: { householdId } }),
        this.expenses.find({
          where: { householdId, date: MoreThanOrEqual(startOfMonth()) },
        }),
        this.bills.find({ where: { householdId } }),
        this.chores.find({ where: { householdId } }),
        this.settlements.find({ where: { householdId } }),
        this.households.memberIds(householdId),
      ]);

    const balances = calculateBalances(memberIds, expenses, settlements);
    const mine = balances.find((balance) => balance.userId === userId);

    const unpaid = bills.filter((bill) => bill.status !== BillStatus.PAID);
    const pendingChores = chores.filter(
      (chore) => chore.status === ChoreStatus.PENDING,
    );

    const sum = (rows: { amount: number }[]) =>
      round2(rows.reduce((total, row) => total + Number(row.amount), 0));

    return {
      monthTotal: sum(monthExpenses),
      allTimeTotal: sum(expenses),
      myNet: mine?.net ?? 0,
      myPaid: mine?.paid ?? 0,
      myOwed: mine?.owed ?? 0,
      pendingBillsCount: unpaid.filter(
        (bill) => bill.status === BillStatus.PENDING,
      ).length,
      overdueBillsCount: unpaid.filter(
        (bill) => bill.status === BillStatus.OVERDUE,
      ).length,
      upcomingBillsTotal: sum(unpaid),
      pendingChoresCount: pendingChores.length,
      myPendingChoresCount: pendingChores.filter(
        (chore) => chore.assignedTo === userId,
      ).length,
      memberCount: memberIds.length,
    };
  }
}
