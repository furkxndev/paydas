import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { NotificationType } from '../common/enums';
import {
  daysUntil,
  formatCurrencyTR,
  isSameDay,
} from '../common/utils/date.util';
import { TokenService } from '../auth/token.service';
import { BillsService } from '../bills/bills.service';
import { ChoresService } from '../chores/chores.service';
import { HouseholdsService } from '../households/households.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Fatura ve ev işi hatırlatmalarını üreten zamanlanmış görev.
 * Saat başı çalışır; aynı hatırlatmanın tekrar gönderilmesini
 * faturadaki/görevdeki "reminderSentAt" alanları engeller.
 */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly bills: BillsService,
    private readonly chores: ChoresService,
    private readonly households: HouseholdsService,
    private readonly notifications: NotificationsService,
    private readonly tokens: TokenService,
  ) {}

  /** Süresi dolmuş refresh/doğrulama token'larını her gece temizler */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredTokens(): Promise<void> {
    const removed = await this.tokens.purgeExpired();
    if (removed > 0)
      this.logger.log(`${removed} süresi dolmuş token temizlendi.`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    const billCount = await this.sendBillReminders();
    const choreCount = await this.sendChoreReminders();
    if (billCount + choreCount > 0) {
      this.logger.log(
        `${billCount} fatura, ${choreCount} ev işi hatırlatması gönderildi.`,
      );
    }
  }

  private async sendBillReminders(): Promise<number> {
    const bills = await this.bills.findUnpaid();
    let sent = 0;

    for (const bill of bills) {
      const remaining = daysUntil(bill.dueDate);
      const household = await this.households.getRaw(bill.householdId);
      const amount = formatCurrencyTR(bill.amount, household.currency);
      const label = this.bills.labelFor(bill.type);
      const userIds = bill.participants?.length
        ? bill.participants.map((participant) => participant.id)
        : await this.households.memberIds(bill.householdId);

      // Yaklaşan: hatırlatma penceresine girdi ve bugün henüz gönderilmedi
      const inWindow = remaining <= bill.reminderDaysBefore && remaining >= 0;
      const dueSentToday =
        bill.dueReminderSentAt && isSameDay(bill.dueReminderSentAt, new Date());

      if (inWindow && !dueSentToday) {
        await this.notifications.dispatch({
          householdId: bill.householdId,
          type: NotificationType.BILL_DUE,
          title:
            remaining === 0
              ? `${label} faturası bugün son gün`
              : `${label} faturası yaklaşıyor`,
          body:
            remaining === 0
              ? `${bill.name} • ${amount}`
              : `${remaining} gün içinde ödenmeli • ${amount}`,
          data: { billId: bill.id, type: 'bill_due' },
          userIds,
          channelId: 'bills',
        });
        await this.bills.markReminderSent(bill, 'due');
        sent += 1;
        continue;
      }

      // Gecikmiş: günde bir kez hatırlat
      const overdueSentToday =
        bill.overdueReminderSentAt &&
        isSameDay(bill.overdueReminderSentAt, new Date());

      if (remaining < 0 && !overdueSentToday) {
        await this.notifications.dispatch({
          householdId: bill.householdId,
          type: NotificationType.BILL_OVERDUE,
          title: `${label} faturası gecikti`,
          body: `${bill.name} • ${amount} hâlâ ödenmedi (${Math.abs(remaining)} gün).`,
          data: { billId: bill.id, type: 'bill_overdue' },
          userIds,
          channelId: 'bills',
        });
        await this.bills.markReminderSent(bill, 'overdue');
        sent += 1;
      }
    }

    return sent;
  }

  private async sendChoreReminders(): Promise<number> {
    const chores = await this.chores.findPendingWithDueDate();
    let sent = 0;

    for (const chore of chores) {
      if (!chore.dueDate || !chore.assignedTo) continue;

      const hoursUntilDue =
        (chore.dueDate.getTime() - Date.now()) / (60 * 60 * 1000);
      const alreadySent =
        chore.reminderSentAt && isSameDay(chore.reminderSentAt, new Date());

      // Son tarihe 3 saatten az kaldıysa, günde bir kez
      if (hoursUntilDue <= 3 && hoursUntilDue > -24 && !alreadySent) {
        await this.notifications.dispatch({
          householdId: chore.householdId,
          type: NotificationType.CHORE_DUE,
          title: 'Ev işi hatırlatması',
          body: `${chore.title} görevinin zamanı yaklaşıyor.`,
          data: { choreId: chore.id, type: 'chore_due' },
          userIds: [chore.assignedTo],
          channelId: 'chores',
        });
        await this.chores.markReminderSent(chore);
        sent += 1;
      }
    }

    return sent;
  }
}
