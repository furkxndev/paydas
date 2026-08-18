import {
  AdminHouseholdSummary,
  AdminStats,
  AdminUpdateUserPayload,
  AdminUserFilters,
  AdminUserSummary,
  AppNotification,
  AuthSession,
  Bill,
  ChangePasswordPayload,
  DeleteAccountPayload,
  Chore,
  CreateBillPayload,
  CreateChorePayload,
  CreateExpensePayload,
  CreateHouseholdPayload,
  CreateSettlementPayload,
  Debt,
  Expense,
  ExpenseFilters,
  ForgotPasswordPayload,
  Household,
  HouseholdSummary,
  JoinHouseholdPayload,
  LoginPayload,
  MemberBalance,
  NotificationPreferences,
  PayBillPayload,
  RegisterPayload,
  RegisterPushTokenPayload,
  ResetPasswordPayload,
  Settlement,
  UpdateBillPayload,
  UpdateChorePayload,
  UpdateExpensePayload,
  UpdateHouseholdPayload,
  UpdateProfilePayload,
  User,
} from '../../types';

/**
 * Uygulamanın veri katmanı sözleşmesi.
 * Hem gerçek HTTP istemcisi hem de mock servis bu arayüzleri uygular,
 * böylece backend hazır olduğunda ekranlarda hiçbir değişiklik gerekmez.
 */

export interface AuthApi {
  login(payload: LoginPayload): Promise<AuthSession>;
  register(payload: RegisterPayload): Promise<AuthSession>;
  me(): Promise<User>;
  updateProfile(payload: UpdateProfilePayload): Promise<User>;
  /** refreshToken verilirse sunucuda iptal edilir; oturum gerçekten kapanır */
  logout(refreshToken?: string): Promise<void>;
  forgotPassword(payload: ForgotPasswordPayload): Promise<void>;
  resetPassword(payload: ResetPasswordPayload): Promise<void>;
  changePassword(payload: ChangePasswordPayload): Promise<void>;
  /** Hesabı kalıcı olarak siler (KVKK) */
  deleteAccount(payload: DeleteAccountPayload): Promise<void>;
}

export interface HouseholdsApi {
  list(): Promise<Household[]>;
  get(householdId: string): Promise<Household>;
  create(payload: CreateHouseholdPayload): Promise<Household>;
  join(payload: JoinHouseholdPayload): Promise<Household>;
  update(householdId: string, payload: UpdateHouseholdPayload): Promise<Household>;
  regenerateInviteCode(householdId: string): Promise<Household>;
  removeMember(householdId: string, userId: string): Promise<Household>;
  leave(householdId: string): Promise<void>;
  summary(householdId: string): Promise<HouseholdSummary>;
}

export interface ExpensesApi {
  list(householdId: string, filters?: ExpenseFilters): Promise<Expense[]>;
  get(expenseId: string): Promise<Expense>;
  create(householdId: string, payload: CreateExpensePayload): Promise<Expense>;
  update(expenseId: string, payload: UpdateExpensePayload): Promise<Expense>;
  remove(expenseId: string): Promise<void>;
}

export interface BalancesApi {
  get(householdId: string): Promise<{ balances: MemberBalance[]; debts: Debt[] }>;
  listSettlements(householdId: string): Promise<Settlement[]>;
  settle(householdId: string, payload: CreateSettlementPayload): Promise<Settlement>;
}

export interface BillsApi {
  list(householdId: string): Promise<Bill[]>;
  get(billId: string): Promise<Bill>;
  create(householdId: string, payload: CreateBillPayload): Promise<Bill>;
  update(billId: string, payload: UpdateBillPayload): Promise<Bill>;
  pay(billId: string, payload: PayBillPayload): Promise<Bill>;
  remove(billId: string): Promise<void>;
}

export interface ChoresApi {
  list(householdId: string): Promise<Chore[]>;
  create(householdId: string, payload: CreateChorePayload): Promise<Chore>;
  update(choreId: string, payload: UpdateChorePayload): Promise<Chore>;
  toggleComplete(choreId: string, completed: boolean): Promise<Chore>;
  remove(choreId: string): Promise<void>;
}

export interface NotificationsApi {
  list(householdId: string): Promise<AppNotification[]>;
  markRead(notificationId: string): Promise<AppNotification>;
  markAllRead(householdId: string): Promise<void>;
  getPreferences(): Promise<NotificationPreferences>;
  updatePreferences(
    payload: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences>;
  registerPushToken(payload: RegisterPushTokenPayload): Promise<void>;
}

/**
 * Yalnızca platform yöneticisinin (platformRole === 'admin') erişebildiği uçlar.
 * Yetkisiz çağrılarda 403 döner.
 */
export interface AdminApi {
  stats(): Promise<AdminStats>;
  listUsers(filters?: AdminUserFilters): Promise<AdminUserSummary[]>;
  getUser(userId: string): Promise<AdminUserSummary>;
  updateUser(userId: string, payload: AdminUpdateUserPayload): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  listHouseholds(): Promise<AdminHouseholdSummary[]>;
}

export interface ApiClient {
  auth: AuthApi;
  households: HouseholdsApi;
  expenses: ExpensesApi;
  balances: BalancesApi;
  bills: BillsApi;
  chores: ChoresApi;
  notifications: NotificationsApi;
  admin: AdminApi;
}
