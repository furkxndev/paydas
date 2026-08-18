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
import { ApiClient } from './contracts';
import { httpClient } from './httpClient';

/** NestJS REST uçlarına birebir karşılık gelen istemci. */
export const httpApi: ApiClient = {
  auth: {
    login: (payload: LoginPayload) =>
      httpClient.post<AuthSession>('/auth/login', payload, { skipAuth: true }),
    register: (payload: RegisterPayload) =>
      httpClient.post<AuthSession>('/auth/register', payload, { skipAuth: true }),
    me: () => httpClient.get<User>('/auth/me'),
    updateProfile: (payload: UpdateProfilePayload) =>
      httpClient.patch<User>('/users/me', payload),
    logout: (refreshToken?: string) =>
      httpClient.post<void>('/auth/logout', refreshToken ? { refreshToken } : {}),
    forgotPassword: (payload: ForgotPasswordPayload) =>
      httpClient.post<void>('/auth/forgot-password', payload, { skipAuth: true }),
    resetPassword: (payload: ResetPasswordPayload) =>
      httpClient.post<void>('/auth/reset-password', payload, { skipAuth: true }),
    changePassword: (payload: ChangePasswordPayload) =>
      httpClient.post<void>('/auth/change-password', payload),
    deleteAccount: (payload: DeleteAccountPayload) =>
      httpClient.request<void>('/users/me', { method: 'DELETE', body: payload }),
  },

  households: {
    list: () => httpClient.get<Household[]>('/households'),
    get: (householdId) => httpClient.get<Household>(`/households/${householdId}`),
    create: (payload: CreateHouseholdPayload) =>
      httpClient.post<Household>('/households', payload),
    join: (payload: JoinHouseholdPayload) =>
      httpClient.post<Household>('/households/join', payload),
    update: (householdId, payload: UpdateHouseholdPayload) =>
      httpClient.patch<Household>(`/households/${householdId}`, payload),
    regenerateInviteCode: (householdId) =>
      httpClient.post<Household>(`/households/${householdId}/invite-code`),
    removeMember: (householdId, userId) =>
      httpClient.delete<Household>(`/households/${householdId}/members/${userId}`),
    leave: (householdId) => httpClient.post<void>(`/households/${householdId}/leave`),
    summary: (householdId) =>
      httpClient.get<HouseholdSummary>(`/households/${householdId}/summary`),
  },

  expenses: {
    list: (householdId, filters?: ExpenseFilters) =>
      httpClient.get<Expense[]>(`/households/${householdId}/expenses`, { ...filters }),
    get: (expenseId) => httpClient.get<Expense>(`/expenses/${expenseId}`),
    create: (householdId, payload: CreateExpensePayload) =>
      httpClient.post<Expense>(`/households/${householdId}/expenses`, payload),
    update: (expenseId, payload: UpdateExpensePayload) =>
      httpClient.patch<Expense>(`/expenses/${expenseId}`, payload),
    remove: (expenseId) => httpClient.delete<void>(`/expenses/${expenseId}`),
  },

  balances: {
    get: (householdId) =>
      httpClient.get<{ balances: MemberBalance[]; debts: Debt[] }>(
        `/households/${householdId}/balances`,
      ),
    listSettlements: (householdId) =>
      httpClient.get<Settlement[]>(`/households/${householdId}/settlements`),
    settle: (householdId, payload: CreateSettlementPayload) =>
      httpClient.post<Settlement>(`/households/${householdId}/settlements`, payload),
  },

  bills: {
    list: (householdId) => httpClient.get<Bill[]>(`/households/${householdId}/bills`),
    get: (billId) => httpClient.get<Bill>(`/bills/${billId}`),
    create: (householdId, payload: CreateBillPayload) =>
      httpClient.post<Bill>(`/households/${householdId}/bills`, payload),
    update: (billId, payload: UpdateBillPayload) =>
      httpClient.patch<Bill>(`/bills/${billId}`, payload),
    pay: (billId, payload: PayBillPayload) =>
      httpClient.post<Bill>(`/bills/${billId}/pay`, payload),
    remove: (billId) => httpClient.delete<void>(`/bills/${billId}`),
  },

  chores: {
    list: (householdId) => httpClient.get<Chore[]>(`/households/${householdId}/chores`),
    create: (householdId, payload: CreateChorePayload) =>
      httpClient.post<Chore>(`/households/${householdId}/chores`, payload),
    update: (choreId, payload: UpdateChorePayload) =>
      httpClient.patch<Chore>(`/chores/${choreId}`, payload),
    toggleComplete: (choreId, completed) =>
      httpClient.post<Chore>(`/chores/${choreId}/${completed ? 'complete' : 'reopen'}`),
    remove: (choreId) => httpClient.delete<void>(`/chores/${choreId}`),
  },

  notifications: {
    list: (householdId) => httpClient.get<AppNotification[]>('/notifications', { householdId }),
    markRead: (notificationId) =>
      httpClient.patch<AppNotification>(`/notifications/${notificationId}/read`),
    markAllRead: (householdId) =>
      httpClient.post<void>('/notifications/read-all', { householdId }),
    getPreferences: () => httpClient.get<NotificationPreferences>('/notifications/preferences'),
    updatePreferences: (payload: Partial<NotificationPreferences>) =>
      httpClient.patch<NotificationPreferences>('/notifications/preferences', payload),
    registerPushToken: (payload: RegisterPushTokenPayload) =>
      httpClient.post<void>('/notifications/push-token', payload),
  },

  admin: {
    stats: () => httpClient.get<AdminStats>('/admin/stats'),
    listUsers: (filters?: AdminUserFilters) =>
      httpClient.get<AdminUserSummary[]>('/admin/users', { ...filters }),
    getUser: (userId) => httpClient.get<AdminUserSummary>(`/admin/users/${userId}`),
    updateUser: (userId, payload: AdminUpdateUserPayload) =>
      httpClient.patch<User>(`/admin/users/${userId}`, payload),
    deleteUser: (userId) => httpClient.delete<void>(`/admin/users/${userId}`),
    listHouseholds: () => httpClient.get<AdminHouseholdSummary[]>('/admin/households'),
  },
};
