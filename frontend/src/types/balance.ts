import { ISODateString } from './common';

/** Bir üyenin ev içindeki net durumu */
export interface MemberBalance {
  userId: string;
  /** Üyenin ev adına ödediği toplam */
  paid: number;
  /** Üyenin payına düşen toplam */
  owed: number;
  /** paid - owed. Pozitifse alacaklı, negatifse borçlu */
  net: number;
}

/** "A, B'ye X TL borçlu" şeklinde sadeleştirilmiş transfer */
export interface Debt {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface Settlement {
  id: string;
  householdId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  note?: string;
  settledAt: ISODateString;
  createdAt: ISODateString;
}

export interface CreateSettlementPayload {
  fromUserId: string;
  toUserId: string;
  amount: number;
  note?: string;
}

export interface HouseholdSummary {
  /** İçinde bulunulan ayın toplam ortak harcaması */
  monthTotal: number;
  /** Tüm zamanların toplamı */
  allTimeTotal: number;
  /** Aktif kullanıcının net durumu */
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

export interface CategoryBreakdownRow {
  category: string;
  total: number;
  ratio: number;
}
