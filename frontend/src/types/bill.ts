import { ISODateString } from './common';

export type BillType = 'elektrik' | 'su' | 'dogalgaz' | 'internet' | 'kira' | 'aidat' | 'diger';

export type BillStatus = 'pending' | 'paid' | 'overdue';

export type BillRecurrence = 'none' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly';

export interface Bill {
  id: string;
  householdId: string;
  name: string;
  type: BillType;
  amount: number;
  dueDate: ISODateString;
  status: BillStatus;
  recurrence: BillRecurrence;
  /** Faturayı paylaşan üyeler; boşsa tüm ev */
  participantIds: string[];
  /** Son ödeme tarihinden kaç gün önce hatırlatılacağı */
  reminderDaysBefore: number;
  /** Ödendiğinde otomatik ortak gider oluşturulsun mu */
  autoCreateExpense: boolean;
  paidAt?: ISODateString;
  paidBy?: string;
  notes?: string;
  createdBy: string;
  createdAt: ISODateString;
}

export interface CreateBillPayload {
  name: string;
  type: BillType;
  amount: number;
  dueDate: ISODateString;
  recurrence: BillRecurrence;
  participantIds?: string[];
  reminderDaysBefore?: number;
  autoCreateExpense?: boolean;
  notes?: string;
}

export type UpdateBillPayload = Partial<CreateBillPayload>;

export interface PayBillPayload {
  /** Ödemeyi yapan üye */
  paidBy: string;
  /** Fiili ödenen tutar (fatura tutarından farklı olabilir) */
  amount?: number;
  paidAt?: ISODateString;
}
