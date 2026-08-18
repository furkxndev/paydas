import { ISODateString } from './common';

export type NotificationType =
  | 'bill_due'
  | 'bill_overdue'
  | 'bill_paid'
  | 'expense_added'
  | 'chore_assigned'
  | 'chore_due'
  | 'chore_completed'
  | 'settlement'
  | 'member_joined';

export interface AppNotification {
  id: string;
  householdId: string;
  /** Bildirimin hedef kullanıcısı */
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Derin bağlantı için taşınan ek veri */
  data?: Record<string, string>;
  read: boolean;
  createdAt: ISODateString;
}

export interface NotificationPreferences {
  enabled: boolean;
  billReminders: boolean;
  expenseAlerts: boolean;
  choreReminders: boolean;
  settlementAlerts: boolean;
  /** Fatura hatırlatmalarının gönderileceği saat (0-23) */
  reminderHour: number;
}

export interface RegisterPushTokenPayload {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
}
