import { ISODateString } from './common';
import { PlatformRole, User, UserStatus } from './user';

/** Yönetim panelindeki genel sistem özeti */
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminCount: number;
  /** Son 7 günde kayıt olan kullanıcı sayısı */
  newUsersThisWeek: number;
  totalHouseholds: number;
  totalExpenses: number;
  totalExpenseAmount: number;
  totalBills: number;
  pendingBills: number;
  totalChores: number;
  pendingChores: number;
}

/** Kullanıcı listesinde gösterilen, kullanım bilgisiyle zenginleştirilmiş kayıt */
export interface AdminUserSummary {
  user: User;
  householdCount: number;
  householdNames: string[];
  expenseCount: number;
  /** Kullanıcının ev adına ödediği toplam tutar */
  totalPaid: number;
  completedChoreCount: number;
  /** En son gider/görev hareketinin tarihi */
  lastActivityAt?: ISODateString;
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
  createdAt: ISODateString;
}

export interface AdminUpdateUserPayload {
  fullName?: string;
  phone?: string;
  platformRole?: PlatformRole;
  status?: UserStatus;
}

export interface AdminUserFilters {
  search?: string;
  role?: PlatformRole | 'all';
  status?: UserStatus | 'all';
}
