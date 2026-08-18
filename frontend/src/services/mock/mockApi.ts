import {
  DEFAULT_CURRENCY,
  getBillTypeMeta,
  getChoreRecurrenceDays,
  getRecurrenceMonths,
} from '../../constants';
import {
  AdminHouseholdSummary,
  AdminStats,
  AdminUpdateUserPayload,
  AdminUserFilters,
  AdminUserSummary,
  AuthSession,
  Bill,
  Chore,
  CreateBillPayload,
  CreateChorePayload,
  CreateExpensePayload,
  CreateHouseholdPayload,
  CreateSettlementPayload,
  Expense,
  ExpenseFilters,
  HouseholdSummary,
  JoinHouseholdPayload,
  LoginPayload,
  NotificationPreferences,
  NotificationType,
  PayBillPayload,
  RegisterPayload,
  RegisterPushTokenPayload,
  Settlement,
  UpdateBillPayload,
  UpdateChorePayload,
  UpdateExpensePayload,
  UpdateHouseholdPayload,
  UpdateProfilePayload,
  User,
} from '../../types';
import {
  addDays,
  addMonths,
  calculateBalances,
  createId,
  createInviteCode,
  daysUntil,
  formatCurrency,
  getFirstName,
  isWithinMonth,
  round2,
  simplifyDebts,
  sumExpenses,
} from '../../utils';
import { ApiClient } from '../api/contracts';
import { HttpError } from '../api/httpClient';
import {
  MockDatabase,
  StoredUser,
  clearDatabase,
  defaultPreferences,
  emptyDatabase,
  hydrateHousehold,
  readDatabase,
  toPublicUser,
  writeDatabase,
} from './db';

/** Gerçek ağ gecikmesini taklit ederek yükleme durumlarının test edilmesini sağlar */
const LATENCY_MS = 220;
const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

const fail = (status: number, message: string): never => {
  throw new HttpError({ status, message });
};

const getDb = async (): Promise<MockDatabase> => {
  const existing = await readDatabase();
  if (existing) return existing;
  // İlk açılışta veritabanı boştur; ilk kayıt olan kullanıcı yönetici olur.
  const fresh = emptyDatabase();
  await writeDatabase(fresh);
  return fresh;
};

const requireSession = (db: MockDatabase): StoredUser => {
  const user = db.users.find((u) => u.id === db.sessionUserId);
  if (!user) return fail(401, 'Oturum bulunamadı. Lütfen tekrar giriş yapın.');
  return user;
};

/** Platform yöneticisi yetkisi ister */
const requireAdmin = (db: MockDatabase): StoredUser => {
  const user = requireSession(db);
  if (user.platformRole !== 'admin') {
    return fail(403, 'Bu bölüme yalnızca yöneticiler erişebilir.');
  }
  return user;
};

const requireMembership = (db: MockDatabase, householdId: string, userId: string) => {
  const membership = db.memberships.find(
    (m) => m.householdId === householdId && m.userId === userId,
  );
  if (!membership) return fail(403, 'Bu eve erişim yetkiniz yok.');
  return membership;
};

const memberIdsOf = (db: MockDatabase, householdId: string): string[] =>
  db.memberships.filter((m) => m.householdId === householdId).map((m) => m.userId);

const userName = (db: MockDatabase, userId: string): string =>
  db.users.find((u) => u.id === userId)?.fullName ?? 'Bir ev arkadaşın';

/** Ev üyelerine (isteğe bağlı olarak eylemi yapan hariç) bildirim yazar */
const pushNotifications = (
  db: MockDatabase,
  params: {
    householdId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, string>;
    targetUserIds?: string[];
    excludeUserId?: string;
  },
) => {
  const targets = (params.targetUserIds ?? memberIdsOf(db, params.householdId)).filter(
    (id) => id !== params.excludeUserId,
  );
  const createdAt = new Date().toISOString();
  targets.forEach((userId) => {
    db.notifications.unshift({
      id: createId('ntf'),
      householdId: params.householdId,
      userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
      read: false,
      createdAt,
    });
  });
};

const buildExpenseShares = (
  db: MockDatabase,
  householdId: string,
  payload: CreateExpensePayload,
): Expense['shares'] => {
  if (payload.shares && payload.shares.length > 0) {
    return payload.shares.map((share) => ({ ...share, amount: round2(share.amount) }));
  }
  const participants = payload.participantIds?.length
    ? payload.participantIds
    : memberIdsOf(db, householdId);
  const perPerson = round2(payload.amount / Math.max(participants.length, 1));
  return participants.map((userId) => ({ userId, amount: perPerson }));
};

/** Vadesi geçmiş faturaları işaretler; her okuma öncesi çalışır */
const refreshBillStatuses = (db: MockDatabase): boolean => {
  let changed = false;
  db.bills.forEach((bill) => {
    if (bill.status === 'paid') return;
    const nextStatus: Bill['status'] = daysUntil(bill.dueDate) < 0 ? 'overdue' : 'pending';
    if (bill.status !== nextStatus) {
      bill.status = nextStatus;
      changed = true;
    }
  });
  return changed;
};

/** Yönetim panelinde gösterilen kullanım istatistikleriyle kullanıcıyı zenginleştirir */
const buildUserSummary = (db: MockDatabase, user: StoredUser): AdminUserSummary => {
  const householdIds = db.memberships
    .filter((m) => m.userId === user.id)
    .map((m) => m.householdId);

  const paidExpenses = db.expenses.filter((e) => e.paidBy === user.id);
  const completedChores = db.chores.filter(
    (c) => c.status === 'done' && c.completedBy === user.id,
  );

  const activityDates = [
    ...paidExpenses.map((e) => e.createdAt),
    ...completedChores.map((c) => c.completedAt ?? c.createdAt),
    user.lastLoginAt,
  ].filter((value): value is string => Boolean(value));

  return {
    user: toPublicUser(user),
    householdCount: householdIds.length,
    householdNames: db.households.filter((h) => householdIds.includes(h.id)).map((h) => h.name),
    expenseCount: paidExpenses.length,
    totalPaid: sumExpenses(paidExpenses),
    completedChoreCount: completedChores.length,
    lastActivityAt: activityDates.sort().at(-1),
  };
};

const currencyOf = (db: MockDatabase, householdId: string): string =>
  db.households.find((h) => h.id === householdId)?.currency ?? DEFAULT_CURRENCY;

/**
 * Cihaz üzerinde çalışan sahte backend.
 * Gerçek API ile birebir aynı sözleşmeyi uygular (services/api/contracts.ts).
 */
export const mockApi: ApiClient = {
  auth: {
    async login({ email, password }: LoginPayload) {
      await delay();
      const db = await getDb();
      const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user || user.password !== password) {
        return fail(401, 'E-posta veya şifre hatalı.');
      }
      if (user.status === 'suspended') {
        return fail(403, 'Hesabınız askıya alınmış. Yöneticiyle iletişime geçin.');
      }
      user.lastLoginAt = new Date().toISOString();
      db.sessionUserId = user.id;
      await writeDatabase(db);
      const session: AuthSession = {
        user: toPublicUser(user),
        tokens: { accessToken: `mock_${user.id}`, refreshToken: `mock_refresh_${user.id}` },
      };
      return session;
    },

    async register({ fullName, email, password }: RegisterPayload) {
      await delay();
      const db = await getDb();
      const normalized = email.trim().toLowerCase();
      if (db.users.some((u) => u.email.toLowerCase() === normalized)) {
        return fail(409, 'Bu e-posta ile kayıtlı bir hesap zaten var.');
      }
      // Sistemdeki ilk kullanıcı platform yöneticisi olur
      const isFirstUser = db.users.length === 0;
      const now = new Date().toISOString();
      const user: StoredUser = {
        id: createId('usr'),
        fullName: fullName.trim(),
        email: normalized,
        password,
        platformRole: isFirstUser ? 'admin' : 'user',
        status: 'active',
        createdAt: now,
        lastLoginAt: now,
      };
      db.users.push(user);
      db.preferences[user.id] = defaultPreferences();
      db.sessionUserId = user.id;
      await writeDatabase(db);
      return {
        user: toPublicUser(user),
        tokens: { accessToken: `mock_${user.id}`, refreshToken: `mock_refresh_${user.id}` },
      };
    },

    async me() {
      await delay(80);
      const db = await getDb();
      return toPublicUser(requireSession(db));
    },

    async updateProfile(payload: UpdateProfilePayload) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      Object.assign(user, {
        fullName: payload.fullName?.trim() ?? user.fullName,
        phone: payload.phone ?? user.phone,
        avatarUrl: payload.avatarUrl ?? user.avatarUrl,
      });
      await writeDatabase(db);
      return toPublicUser(user);
    },

    async logout() {
      const db = await getDb();
      db.sessionUserId = null;
      await writeDatabase(db);
    },

    /**
     * Mock ortamda e-posta gönderilemediği için sıfırlama token'ı üretilmez;
     * akış korunur, gerçek işlem backend tarafından yapılır.
     */
    async forgotPassword() {
      await delay();
    },

    async resetPassword() {
      await delay();
      return fail(400, 'Şifre sıfırlama yalnızca sunucu bağlıyken kullanılabilir.');
    },

    async changePassword({ currentPassword, newPassword }) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      if (user.password !== currentPassword) {
        return fail(400, 'Mevcut şifreniz hatalı.');
      }
      user.password = newPassword;
      await writeDatabase(db);
    },

    async deleteAccount({ password }) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      if (user.password !== password) return fail(400, 'Şifreniz hatalı.');

      const adminCount = db.users.filter((u) => u.platformRole === 'admin').length;
      if (user.platformRole === 'admin' && adminCount <= 1) {
        return fail(
          403,
          'Sistemdeki tek yönetici sizsiniz. Önce başka bir kullanıcıyı yönetici yapın.',
        );
      }

      const ownedHouseholdIds = db.households
        .filter((h) => h.createdBy === user.id)
        .map((h) => h.id);
      db.households = db.households.filter((h) => !ownedHouseholdIds.includes(h.id));
      db.memberships = db.memberships.filter(
        (m) => m.userId !== user.id && !ownedHouseholdIds.includes(m.householdId),
      );
      db.expenses = db.expenses.filter((e) => !ownedHouseholdIds.includes(e.householdId));
      db.bills = db.bills.filter((b) => !ownedHouseholdIds.includes(b.householdId));
      db.chores = db.chores.filter((c) => !ownedHouseholdIds.includes(c.householdId));
      db.settlements = db.settlements.filter((x) => !ownedHouseholdIds.includes(x.householdId));
      db.notifications = db.notifications.filter((n) => n.userId !== user.id);
      db.users = db.users.filter((u) => u.id !== user.id);
      delete db.preferences[user.id];
      db.sessionUserId = null;
      await writeDatabase(db);
    },
  },

  households: {
    async list() {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      const ids = db.memberships.filter((m) => m.userId === user.id).map((m) => m.householdId);
      return db.households
        .filter((h) => ids.includes(h.id))
        .map((h) => hydrateHousehold(db, h));
    },

    async get(householdId: string) {
      await delay(120);
      const db = await getDb();
      const user = requireSession(db);
      requireMembership(db, householdId, user.id);
      const household = db.households.find((h) => h.id === householdId);
      if (!household) return fail(404, 'Ev bulunamadı.');
      return hydrateHousehold(db, household);
    },

    async create(payload: CreateHouseholdPayload) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      const now = new Date().toISOString();
      const household = {
        id: createId('hh'),
        name: payload.name.trim(),
        address: payload.address?.trim(),
        currency: payload.currency ?? DEFAULT_CURRENCY,
        inviteCode: createInviteCode(),
        createdBy: user.id,
        createdAt: now,
      };
      db.households.push(household);
      db.memberships.push({
        id: createId('mem'),
        householdId: household.id,
        userId: user.id,
        role: 'owner',
        joinedAt: now,
      });
      await writeDatabase(db);
      return hydrateHousehold(db, household);
    },

    async join({ inviteCode }: JoinHouseholdPayload) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      const code = inviteCode.trim().toUpperCase();
      const household = db.households.find((h) => h.inviteCode.toUpperCase() === code);
      if (!household)
        return fail(404, 'Davet kodu geçersiz. Kodu kontrol edip tekrar deneyin.');

      const alreadyMember = db.memberships.some(
        (m) => m.householdId === household.id && m.userId === user.id,
      );
      if (!alreadyMember) {
        db.memberships.push({
          id: createId('mem'),
          householdId: household.id,
          userId: user.id,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });
        pushNotifications(db, {
          householdId: household.id,
          type: 'member_joined',
          title: 'Eve yeni bir katılım var',
          body: `${user.fullName} ${household.name} evine katıldı.`,
          excludeUserId: user.id,
        });
      }
      await writeDatabase(db);
      return hydrateHousehold(db, household);
    },

    async update(householdId: string, payload: UpdateHouseholdPayload) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      const membership = requireMembership(db, householdId, user.id);
      if (membership.role === 'member') return fail(403, 'Bu işlem için yönetici olmalısınız.');
      const household = db.households.find((h) => h.id === householdId);
      if (!household) return fail(404, 'Ev bulunamadı.');
      Object.assign(household, {
        name: payload.name?.trim() ?? household.name,
        address: payload.address ?? household.address,
        currency: payload.currency ?? household.currency,
      });
      await writeDatabase(db);
      return hydrateHousehold(db, household);
    },

    async regenerateInviteCode(householdId: string) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      const membership = requireMembership(db, householdId, user.id);
      if (membership.role === 'member') return fail(403, 'Bu işlem için yönetici olmalısınız.');
      const household = db.households.find((h) => h.id === householdId);
      if (!household) return fail(404, 'Ev bulunamadı.');
      household.inviteCode = createInviteCode();
      await writeDatabase(db);
      return hydrateHousehold(db, household);
    },

    async removeMember(householdId: string, userId: string) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      const membership = requireMembership(db, householdId, user.id);
      if (membership.role === 'member') return fail(403, 'Bu işlem için yönetici olmalısınız.');
      const target = db.memberships.find(
        (m) => m.householdId === householdId && m.userId === userId,
      );
      if (target?.role === 'owner') return fail(400, 'Ev sahibi evden çıkarılamaz.');
      db.memberships = db.memberships.filter(
        (m) => !(m.householdId === householdId && m.userId === userId),
      );
      const household = db.households.find((h) => h.id === householdId)!;
      await writeDatabase(db);
      return hydrateHousehold(db, household);
    },

    async leave(householdId: string) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      const membership = requireMembership(db, householdId, user.id);
      if (membership.role === 'owner') {
        return fail(400, 'Ev sahibi evden ayrılamaz. Önce sahipliği devredin.');
      }
      db.memberships = db.memberships.filter((m) => m.id !== membership.id);
      await writeDatabase(db);
    },

    async summary(householdId: string): Promise<HouseholdSummary> {
      await delay(120);
      const db = await getDb();
      const user = requireSession(db);
      requireMembership(db, householdId, user.id);
      if (refreshBillStatuses(db)) await writeDatabase(db);

      const expenses = db.expenses.filter((e) => e.householdId === householdId);
      const bills = db.bills.filter((b) => b.householdId === householdId);
      const chores = db.chores.filter((c) => c.householdId === householdId);
      const members = hydrateHousehold(
        db,
        db.households.find((h) => h.id === householdId)!,
      ).members;
      const balances = calculateBalances(
        members,
        expenses,
        db.settlements.filter((s) => s.householdId === householdId),
      );
      const myBalance = balances.find((b) => b.userId === user.id);

      const upcoming = bills.filter((b) => b.status !== 'paid');

      return {
        monthTotal: sumExpenses(expenses.filter((e) => isWithinMonth(e.date))),
        allTimeTotal: sumExpenses(expenses),
        myNet: myBalance?.net ?? 0,
        myPaid: myBalance?.paid ?? 0,
        myOwed: myBalance?.owed ?? 0,
        pendingBillsCount: upcoming.filter((b) => b.status === 'pending').length,
        overdueBillsCount: upcoming.filter((b) => b.status === 'overdue').length,
        upcomingBillsTotal: round2(upcoming.reduce((sum, b) => sum + b.amount, 0)),
        pendingChoresCount: chores.filter((c) => c.status === 'pending').length,
        myPendingChoresCount: chores.filter(
          (c) => c.status === 'pending' && c.assignedTo === user.id,
        ).length,
        memberCount: members.length,
      };
    },
  },

  expenses: {
    async list(householdId: string, filters?: ExpenseFilters) {
      await delay(120);
      const db = await getDb();
      const user = requireSession(db);
      requireMembership(db, householdId, user.id);

      let items = db.expenses.filter((e) => e.householdId === householdId);
      if (filters?.category) items = items.filter((e) => e.category === filters.category);
      if (filters?.paidBy) items = items.filter((e) => e.paidBy === filters.paidBy);
      if (filters?.from) items = items.filter((e) => e.date >= filters.from!);
      if (filters?.to) items = items.filter((e) => e.date <= filters.to!);
      if (filters?.search) {
        const needle = filters.search.toLocaleLowerCase('tr-TR');
        items = items.filter((e) => e.title.toLocaleLowerCase('tr-TR').includes(needle));
      }
      return [...items].sort((a, b) => b.date.localeCompare(a.date));
    },

    async get(expenseId: string) {
      await delay(80);
      const db = await getDb();
      requireSession(db);
      const expense = db.expenses.find((e) => e.id === expenseId);
      if (!expense) return fail(404, 'Gider bulunamadı.');
      return expense;
    },

    async create(householdId: string, payload: CreateExpensePayload) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      requireMembership(db, householdId, user.id);

      const expense: Expense = {
        id: createId('exp'),
        householdId,
        title: payload.title.trim(),
        description: payload.description?.trim(),
        amount: round2(payload.amount),
        category: payload.category,
        paidBy: payload.paidBy,
        date: payload.date,
        splitType: payload.splitType,
        shares: buildExpenseShares(db, householdId, payload),
        billId: payload.billId,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };
      db.expenses.unshift(expense);

      const currency = currencyOf(db, householdId);
      expense.shares
        .filter((share) => share.userId !== user.id && share.amount > 0)
        .forEach((share) => {
          pushNotifications(db, {
            householdId,
            type: 'expense_added',
            title: `${getFirstName(user.fullName)} yeni bir gider ekledi`,
            body: `${expense.title} • ${formatCurrency(expense.amount, currency)} • Payın: ${formatCurrency(share.amount, currency)}`,
            data: { expenseId: expense.id },
            targetUserIds: [share.userId],
          });
        });

      await writeDatabase(db);
      return expense;
    },

    async update(expenseId: string, payload: UpdateExpensePayload) {
      await delay();
      const db = await getDb();
      requireSession(db);
      const expense = db.expenses.find((e) => e.id === expenseId);
      if (!expense) return fail(404, 'Gider bulunamadı.');

      const merged: CreateExpensePayload = {
        title: payload.title ?? expense.title,
        description: payload.description ?? expense.description,
        amount: payload.amount ?? expense.amount,
        category: payload.category ?? expense.category,
        paidBy: payload.paidBy ?? expense.paidBy,
        date: payload.date ?? expense.date,
        splitType: payload.splitType ?? expense.splitType,
        shares: payload.shares,
        participantIds: payload.participantIds ?? expense.shares.map((s) => s.userId),
      };

      Object.assign(expense, {
        ...merged,
        amount: round2(merged.amount),
        shares: buildExpenseShares(db, expense.householdId, merged),
      });
      await writeDatabase(db);
      return expense;
    },

    async remove(expenseId: string) {
      await delay();
      const db = await getDb();
      requireSession(db);
      db.expenses = db.expenses.filter((e) => e.id !== expenseId);
      await writeDatabase(db);
    },
  },

  balances: {
    async get(householdId: string) {
      await delay(120);
      const db = await getDb();
      const user = requireSession(db);
      requireMembership(db, householdId, user.id);
      const household = db.households.find((h) => h.id === householdId);
      if (!household) return fail(404, 'Ev bulunamadı.');

      const members = hydrateHousehold(db, household).members;
      const balances = calculateBalances(
        members,
        db.expenses.filter((e) => e.householdId === householdId),
        db.settlements.filter((s) => s.householdId === householdId),
      );
      return { balances, debts: simplifyDebts(balances) };
    },

    async listSettlements(householdId: string) {
      await delay(100);
      const db = await getDb();
      requireSession(db);
      return db.settlements
        .filter((s) => s.householdId === householdId)
        .sort((a, b) => b.settledAt.localeCompare(a.settledAt));
    },

    async settle(householdId: string, payload: CreateSettlementPayload) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      requireMembership(db, householdId, user.id);

      const settlement: Settlement = {
        id: createId('stl'),
        householdId,
        fromUserId: payload.fromUserId,
        toUserId: payload.toUserId,
        amount: round2(payload.amount),
        note: payload.note?.trim(),
        settledAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      db.settlements.unshift(settlement);

      pushNotifications(db, {
        householdId,
        type: 'settlement',
        title: 'Ödeme kaydedildi',
        body: `${userName(db, payload.fromUserId)} → ${userName(db, payload.toUserId)} • ${formatCurrency(settlement.amount, currencyOf(db, householdId))}`,
        data: { settlementId: settlement.id },
        targetUserIds: [payload.fromUserId, payload.toUserId],
        excludeUserId: user.id,
      });

      await writeDatabase(db);
      return settlement;
    },
  },

  bills: {
    async list(householdId: string) {
      await delay(120);
      const db = await getDb();
      const user = requireSession(db);
      requireMembership(db, householdId, user.id);
      if (refreshBillStatuses(db)) await writeDatabase(db);
      return db.bills
        .filter((b) => b.householdId === householdId)
        .sort((a, b) => {
          if (a.status === 'paid' && b.status !== 'paid') return 1;
          if (b.status === 'paid' && a.status !== 'paid') return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
    },

    async get(billId: string) {
      await delay(80);
      const db = await getDb();
      requireSession(db);
      const bill = db.bills.find((b) => b.id === billId);
      if (!bill) return fail(404, 'Fatura bulunamadı.');
      return bill;
    },

    async create(householdId: string, payload: CreateBillPayload) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      requireMembership(db, householdId, user.id);

      const bill: Bill = {
        id: createId('bill'),
        householdId,
        name: payload.name.trim(),
        type: payload.type,
        amount: round2(payload.amount),
        dueDate: payload.dueDate,
        status: daysUntil(payload.dueDate) < 0 ? 'overdue' : 'pending',
        recurrence: payload.recurrence,
        participantIds: payload.participantIds?.length
          ? payload.participantIds
          : memberIdsOf(db, householdId),
        reminderDaysBefore: payload.reminderDaysBefore ?? 3,
        autoCreateExpense: payload.autoCreateExpense ?? true,
        notes: payload.notes?.trim(),
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };
      db.bills.push(bill);

      pushNotifications(db, {
        householdId,
        type: 'bill_due',
        title: 'Yeni fatura eklendi',
        body: `${getBillTypeMeta(bill.type).label} • ${formatCurrency(bill.amount, currencyOf(db, householdId))}`,
        data: { billId: bill.id },
        excludeUserId: user.id,
      });

      await writeDatabase(db);
      return bill;
    },

    async update(billId: string, payload: UpdateBillPayload) {
      await delay();
      const db = await getDb();
      requireSession(db);
      const bill = db.bills.find((b) => b.id === billId);
      if (!bill) return fail(404, 'Fatura bulunamadı.');
      Object.assign(bill, {
        name: payload.name?.trim() ?? bill.name,
        type: payload.type ?? bill.type,
        amount: payload.amount !== undefined ? round2(payload.amount) : bill.amount,
        dueDate: payload.dueDate ?? bill.dueDate,
        recurrence: payload.recurrence ?? bill.recurrence,
        participantIds: payload.participantIds ?? bill.participantIds,
        reminderDaysBefore: payload.reminderDaysBefore ?? bill.reminderDaysBefore,
        autoCreateExpense: payload.autoCreateExpense ?? bill.autoCreateExpense,
        notes: payload.notes ?? bill.notes,
      });
      if (bill.status !== 'paid') {
        bill.status = daysUntil(bill.dueDate) < 0 ? 'overdue' : 'pending';
      }
      await writeDatabase(db);
      return bill;
    },

    /**
     * Faturayı öder; istenirse ortak gider olarak yansıtır ve
     * tekrarlayan faturalarda bir sonraki dönemi otomatik oluşturur.
     */
    async pay(billId: string, payload: PayBillPayload) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      const bill = db.bills.find((b) => b.id === billId);
      if (!bill) return fail(404, 'Fatura bulunamadı.');

      const paidAmount = round2(payload.amount ?? bill.amount);
      const paidAt = payload.paidAt ?? new Date().toISOString();
      bill.status = 'paid';
      bill.paidAt = paidAt;
      bill.paidBy = payload.paidBy;
      bill.amount = paidAmount;

      const currency = currencyOf(db, bill.householdId);

      if (bill.autoCreateExpense) {
        const participants = bill.participantIds.length
          ? bill.participantIds
          : memberIdsOf(db, bill.householdId);
        const perPerson = round2(paidAmount / Math.max(participants.length, 1));
        db.expenses.unshift({
          id: createId('exp'),
          householdId: bill.householdId,
          title: bill.name,
          description: 'Fatura ödemesinden otomatik oluşturuldu',
          amount: paidAmount,
          category: bill.type === 'kira' ? 'kira' : 'fatura',
          paidBy: payload.paidBy,
          date: paidAt,
          splitType: 'equal',
          shares: participants.map((userId) => ({ userId, amount: perPerson })),
          billId: bill.id,
          createdBy: user.id,
          createdAt: paidAt,
        });
      }

      const months = getRecurrenceMonths(bill.recurrence);
      if (months > 0) {
        db.bills.push({
          ...bill,
          id: createId('bill'),
          dueDate: addMonths(bill.dueDate, months).toISOString(),
          status: 'pending',
          paidAt: undefined,
          paidBy: undefined,
          createdAt: new Date().toISOString(),
        });
      }

      pushNotifications(db, {
        householdId: bill.householdId,
        type: 'bill_paid',
        title: `${getBillTypeMeta(bill.type).label} faturası ödendi`,
        body: `${userName(db, payload.paidBy)} ${formatCurrency(paidAmount, currency)} ödedi.`,
        data: { billId: bill.id },
        excludeUserId: user.id,
      });

      await writeDatabase(db);
      return bill;
    },

    async remove(billId: string) {
      await delay();
      const db = await getDb();
      requireSession(db);
      db.bills = db.bills.filter((b) => b.id !== billId);
      await writeDatabase(db);
    },
  },

  chores: {
    async list(householdId: string) {
      await delay(120);
      const db = await getDb();
      const user = requireSession(db);
      requireMembership(db, householdId, user.id);
      return db.chores
        .filter((c) => c.householdId === householdId)
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
          const aDue = a.dueDate ?? '9999';
          const bDue = b.dueDate ?? '9999';
          return aDue.localeCompare(bDue);
        });
    },

    async create(householdId: string, payload: CreateChorePayload) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      requireMembership(db, householdId, user.id);

      const chore: Chore = {
        id: createId('chore'),
        householdId,
        title: payload.title.trim(),
        description: payload.description?.trim(),
        assignedTo: payload.assignedTo ?? null,
        dueDate: payload.dueDate,
        status: 'pending',
        priority: payload.priority ?? 'medium',
        recurrence: payload.recurrence ?? 'none',
        points: payload.points ?? 10,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };
      db.chores.unshift(chore);

      if (chore.assignedTo && chore.assignedTo !== user.id) {
        pushNotifications(db, {
          householdId,
          type: 'chore_assigned',
          title: 'Sana yeni bir görev atandı',
          body: chore.dueDate
            ? `${chore.title} • Son tarih: ${chore.dueDate.slice(0, 10)}`
            : chore.title,
          data: { choreId: chore.id },
          targetUserIds: [chore.assignedTo],
        });
      }

      await writeDatabase(db);
      return chore;
    },

    async update(choreId: string, payload: UpdateChorePayload) {
      await delay();
      const db = await getDb();
      const user = requireSession(db);
      const chore = db.chores.find((c) => c.id === choreId);
      if (!chore) return fail(404, 'Görev bulunamadı.');

      const previousAssignee = chore.assignedTo;
      Object.assign(chore, {
        title: payload.title?.trim() ?? chore.title,
        description: payload.description ?? chore.description,
        assignedTo: payload.assignedTo !== undefined ? payload.assignedTo : chore.assignedTo,
        dueDate: payload.dueDate ?? chore.dueDate,
        priority: payload.priority ?? chore.priority,
        recurrence: payload.recurrence ?? chore.recurrence,
        points: payload.points ?? chore.points,
        status: payload.status ?? chore.status,
      });

      if (
        chore.assignedTo &&
        chore.assignedTo !== previousAssignee &&
        chore.assignedTo !== user.id
      ) {
        pushNotifications(db, {
          householdId: chore.householdId,
          type: 'chore_assigned',
          title: 'Sana yeni bir görev atandı',
          body: chore.title,
          data: { choreId: chore.id },
          targetUserIds: [chore.assignedTo],
        });
      }

      await writeDatabase(db);
      return chore;
    },

    /** Tamamlanan tekrarlayan görevler bir sonraki dönem için yeniden oluşturulur */
    async toggleComplete(choreId: string, completed: boolean) {
      await delay(150);
      const db = await getDb();
      const user = requireSession(db);
      const chore = db.chores.find((c) => c.id === choreId);
      if (!chore) return fail(404, 'Görev bulunamadı.');

      if (completed) {
        chore.status = 'done';
        chore.completedAt = new Date().toISOString();
        chore.completedBy = user.id;

        const recurrenceDays = getChoreRecurrenceDays(chore.recurrence);
        if (recurrenceDays > 0) {
          db.chores.unshift({
            ...chore,
            id: createId('chore'),
            status: 'pending',
            completedAt: undefined,
            completedBy: undefined,
            dueDate: chore.dueDate
              ? addDays(chore.dueDate, recurrenceDays).toISOString()
              : addDays(new Date(), recurrenceDays).toISOString(),
            createdAt: new Date().toISOString(),
          });
        }

        pushNotifications(db, {
          householdId: chore.householdId,
          type: 'chore_completed',
          title: 'Bir ev işi tamamlandı',
          body: `${getFirstName(user.fullName)} "${chore.title}" görevini tamamladı.`,
          data: { choreId: chore.id },
          excludeUserId: user.id,
        });
      } else {
        chore.status = 'pending';
        chore.completedAt = undefined;
        chore.completedBy = undefined;
      }

      await writeDatabase(db);
      return chore;
    },

    async remove(choreId: string) {
      await delay();
      const db = await getDb();
      requireSession(db);
      db.chores = db.chores.filter((c) => c.id !== choreId);
      await writeDatabase(db);
    },
  },

  notifications: {
    async list(householdId: string) {
      await delay(100);
      const db = await getDb();
      const user = requireSession(db);
      return db.notifications
        .filter((n) => n.householdId === householdId && n.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async markRead(notificationId: string) {
      const db = await getDb();
      requireSession(db);
      const notification = db.notifications.find((n) => n.id === notificationId);
      if (!notification) return fail(404, 'Bildirim bulunamadı.');
      notification.read = true;
      await writeDatabase(db);
      return notification;
    },

    async markAllRead(householdId: string) {
      const db = await getDb();
      const user = requireSession(db);
      db.notifications.forEach((n) => {
        if (n.householdId === householdId && n.userId === user.id) n.read = true;
      });
      await writeDatabase(db);
    },

    async getPreferences(): Promise<NotificationPreferences> {
      const db = await getDb();
      const user = requireSession(db);
      return db.preferences[user.id] ?? defaultPreferences();
    },

    async updatePreferences(payload: Partial<NotificationPreferences>) {
      const db = await getDb();
      const user = requireSession(db);
      const next = { ...(db.preferences[user.id] ?? defaultPreferences()), ...payload };
      db.preferences[user.id] = next;
      await writeDatabase(db);
      return next;
    },

    async registerPushToken(_payload: RegisterPushTokenPayload) {
      // Mock ortamda token backend'e gönderilmez; yalnızca akış korunur.
      await delay(50);
    },
  },

  admin: {
    async stats(): Promise<AdminStats> {
      await delay(120);
      const db = await getDb();
      requireAdmin(db);

      const weekAgo = addDays(new Date(), -7).toISOString();

      return {
        totalUsers: db.users.length,
        activeUsers: db.users.filter((u) => u.status !== 'suspended').length,
        suspendedUsers: db.users.filter((u) => u.status === 'suspended').length,
        adminCount: db.users.filter((u) => u.platformRole === 'admin').length,
        newUsersThisWeek: db.users.filter((u) => u.createdAt >= weekAgo).length,
        totalHouseholds: db.households.length,
        totalExpenses: db.expenses.length,
        totalExpenseAmount: sumExpenses(db.expenses),
        totalBills: db.bills.length,
        pendingBills: db.bills.filter((b) => b.status !== 'paid').length,
        totalChores: db.chores.length,
        pendingChores: db.chores.filter((c) => c.status === 'pending').length,
      };
    },

    async listUsers(filters?: AdminUserFilters): Promise<AdminUserSummary[]> {
      await delay(140);
      const db = await getDb();
      requireAdmin(db);

      let users = db.users;
      if (filters?.role && filters.role !== 'all') {
        users = users.filter((u) => u.platformRole === filters.role);
      }
      if (filters?.status && filters.status !== 'all') {
        users = users.filter((u) => (u.status ?? 'active') === filters.status);
      }
      if (filters?.search) {
        const needle = filters.search.toLocaleLowerCase('tr-TR');
        users = users.filter(
          (u) =>
            u.fullName.toLocaleLowerCase('tr-TR').includes(needle) ||
            u.email.toLocaleLowerCase('tr-TR').includes(needle),
        );
      }

      return users
        .map((user) => buildUserSummary(db, user))
        .sort((a, b) => b.user.createdAt.localeCompare(a.user.createdAt));
    },

    async getUser(userId: string): Promise<AdminUserSummary> {
      await delay(100);
      const db = await getDb();
      requireAdmin(db);
      const user = db.users.find((u) => u.id === userId);
      if (!user) return fail(404, 'Kullanıcı bulunamadı.');
      return buildUserSummary(db, user);
    },

    async updateUser(userId: string, payload: AdminUpdateUserPayload): Promise<User> {
      await delay();
      const db = await getDb();
      const admin = requireAdmin(db);
      const user = db.users.find((u) => u.id === userId);
      if (!user) return fail(404, 'Kullanıcı bulunamadı.');

      // Son yöneticinin yetkisi alınamaz, kendini askıya alamaz
      const adminCount = db.users.filter((u) => u.platformRole === 'admin').length;
      if (payload.platformRole === 'user' && user.platformRole === 'admin' && adminCount <= 1) {
        return fail(400, 'Sistemde en az bir yönetici kalmalı.');
      }
      if (user.id === admin.id && payload.status === 'suspended') {
        return fail(400, 'Kendi hesabınızı askıya alamazsınız.');
      }

      Object.assign(user, {
        fullName: payload.fullName?.trim() ?? user.fullName,
        phone: payload.phone ?? user.phone,
        platformRole: payload.platformRole ?? user.platformRole,
        status: payload.status ?? user.status,
      });
      await writeDatabase(db);
      return toPublicUser(user);
    },

    async deleteUser(userId: string): Promise<void> {
      await delay();
      const db = await getDb();
      const admin = requireAdmin(db);
      const user = db.users.find((u) => u.id === userId);
      if (!user) return fail(404, 'Kullanıcı bulunamadı.');
      if (user.id === admin.id) return fail(400, 'Kendi hesabınızı silemezsiniz.');

      const adminCount = db.users.filter((u) => u.platformRole === 'admin').length;
      if (user.platformRole === 'admin' && adminCount <= 1) {
        return fail(400, 'Sistemde en az bir yönetici kalmalı.');
      }

      // Kullanıcının sahibi olduğu evler ve o evlere ait tüm veriler kaldırılır
      const ownedHouseholdIds = db.households
        .filter((h) => h.createdBy === user.id)
        .map((h) => h.id);

      db.households = db.households.filter((h) => !ownedHouseholdIds.includes(h.id));
      db.memberships = db.memberships.filter(
        (m) => m.userId !== user.id && !ownedHouseholdIds.includes(m.householdId),
      );
      db.expenses = db.expenses.filter((e) => !ownedHouseholdIds.includes(e.householdId));
      db.bills = db.bills.filter((b) => !ownedHouseholdIds.includes(b.householdId));
      db.chores = db.chores.filter((c) => !ownedHouseholdIds.includes(c.householdId));
      db.settlements = db.settlements.filter((s) => !ownedHouseholdIds.includes(s.householdId));
      db.notifications = db.notifications.filter(
        (n) => n.userId !== user.id && !ownedHouseholdIds.includes(n.householdId),
      );
      db.users = db.users.filter((u) => u.id !== user.id);
      delete db.preferences[user.id];

      await writeDatabase(db);
    },

    async listHouseholds(): Promise<AdminHouseholdSummary[]> {
      await delay(140);
      const db = await getDb();
      requireAdmin(db);

      return db.households
        .map((household) => {
          const expenses = db.expenses.filter((e) => e.householdId === household.id);
          return {
            id: household.id,
            name: household.name,
            inviteCode: household.inviteCode,
            memberCount: db.memberships.filter((m) => m.householdId === household.id).length,
            expenseCount: expenses.length,
            totalExpenseAmount: sumExpenses(expenses),
            currency: household.currency,
            ownerName: userName(db, household.createdBy),
            createdAt: household.createdAt,
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  },
};

/** Tüm yerel veriyi siler; uygulama sıfırdan kurulmuş gibi başlar */
export const resetMockData = async (): Promise<void> => {
  await clearDatabase();
  await writeDatabase(emptyDatabase());
};

export const wipeMockData = resetMockData;
