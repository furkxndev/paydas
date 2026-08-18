/** Uygulama genelindeki yetki seviyesi (ev içi rollerden bağımsız) */
export enum PlatformRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

/** Ev içindeki rol */
export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum ExpenseCategory {
  MARKET = 'market',
  FATURA = 'fatura',
  KIRA = 'kira',
  TEMIZLIK = 'temizlik',
  YEMEK = 'yemek',
  ULASIM = 'ulasim',
  EGLENCE = 'eglence',
  BAKIM = 'bakim',
  DIGER = 'diger',
}

export enum SplitType {
  EQUAL = 'equal',
  EXACT = 'exact',
  PERCENTAGE = 'percentage',
  SHARES = 'shares',
}

export enum BillType {
  ELEKTRIK = 'elektrik',
  SU = 'su',
  DOGALGAZ = 'dogalgaz',
  INTERNET = 'internet',
  KIRA = 'kira',
  AIDAT = 'aidat',
  DIGER = 'diger',
}

export enum BillStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum BillRecurrence {
  NONE = 'none',
  MONTHLY = 'monthly',
  BIMONTHLY = 'bimonthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum ChoreStatus {
  PENDING = 'pending',
  DONE = 'done',
}

export enum ChorePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ChoreRecurrence {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum NotificationType {
  BILL_DUE = 'bill_due',
  BILL_OVERDUE = 'bill_overdue',
  BILL_PAID = 'bill_paid',
  EXPENSE_ADDED = 'expense_added',
  CHORE_ASSIGNED = 'chore_assigned',
  CHORE_DUE = 'chore_due',
  CHORE_COMPLETED = 'chore_completed',
  SETTLEMENT = 'settlement',
  MEMBER_JOINED = 'member_joined',
}

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}
