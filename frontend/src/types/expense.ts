import { ISODateString } from './common';

export type ExpenseCategory =
  | 'market'
  | 'fatura'
  | 'kira'
  | 'temizlik'
  | 'yemek'
  | 'ulasim'
  | 'eglence'
  | 'bakim'
  | 'diger';

/** Payların nasıl hesaplandığı */
export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export interface ExpenseShare {
  userId: string;
  /** Bu üyenin borçlandığı tutar (para birimi cinsinden) */
  amount: number;
  /** exact dışındaki modlarda girilen ham değer (yüzde ya da pay adedi) */
  weight?: number;
}

export interface Expense {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  /** Ödemeyi yapan üyenin userId'si */
  paidBy: string;
  date: ISODateString;
  splitType: SplitType;
  shares: ExpenseShare[];
  /** Bu gider bir faturadan otomatik oluştuysa faturanın id'si */
  billId?: string;
  createdBy: string;
  createdAt: ISODateString;
}

export interface CreateExpensePayload {
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string;
  date: ISODateString;
  splitType: SplitType;
  /** Boş bırakılırsa tüm üyeler eşit böler */
  shares?: ExpenseShare[];
  participantIds?: string[];
  billId?: string;
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export interface ExpenseFilters {
  category?: ExpenseCategory;
  paidBy?: string;
  from?: ISODateString;
  to?: ISODateString;
  search?: string;
}
