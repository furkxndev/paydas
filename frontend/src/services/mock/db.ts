import {
  AppNotification,
  Bill,
  Chore,
  Expense,
  Household,
  HouseholdMember,
  NotificationPreferences,
  Settlement,
  User,
} from '../../types';
import { storage, StorageKeys } from '../storage';

export interface StoredUser extends User {
  /** Yalnızca mock ortam için; gerçek backend hash'li saklar */
  password: string;
}

/** Üye listesi ayrı tutulur, okuma sırasında ev nesnesine gömülür */
export type StoredHousehold = Omit<Household, 'members'>;

export interface StoredMembership {
  id: string;
  householdId: string;
  userId: string;
  role: HouseholdMember['role'];
  joinedAt: string;
}

export interface MockDatabase {
  version: number;
  users: StoredUser[];
  households: StoredHousehold[];
  memberships: StoredMembership[];
  expenses: Expense[];
  bills: Bill[];
  chores: Chore[];
  settlements: Settlement[];
  notifications: AppNotification[];
  preferences: Record<string, NotificationPreferences>;
  /** Oturum açmış kullanıcının id'si */
  sessionUserId: string | null;
}

/**
 * Sürüm yükseltildiğinde cihazdaki eski veritabanı atılır ve boş bir veritabanı kurulur.
 * v2: demo kullanıcılar kaldırıldı, kullanıcılara platformRole/status alanları eklendi.
 */
export const DB_VERSION = 2;

export const emptyDatabase = (): MockDatabase => ({
  version: DB_VERSION,
  users: [],
  households: [],
  memberships: [],
  expenses: [],
  bills: [],
  chores: [],
  settlements: [],
  notifications: [],
  preferences: {},
  sessionUserId: null,
});

let cache: MockDatabase | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export const setCache = (db: MockDatabase) => {
  cache = db;
};

export const getCache = (): MockDatabase | null => cache;

export const readDatabase = async (): Promise<MockDatabase | null> => {
  if (cache) return cache;
  const stored = await storage.getObject<MockDatabase>(StorageKeys.mockDatabase);
  if (!stored || stored.version !== DB_VERSION) return null;
  cache = stored;
  return cache;
};

/** Yazma işlemleri sıraya alınır ki eşzamanlı çağrılar birbirini ezmesin */
export const writeDatabase = async (db: MockDatabase): Promise<void> => {
  cache = db;
  writeQueue = writeQueue.then(() => storage.setObject(StorageKeys.mockDatabase, db));
  return writeQueue;
};

export const clearDatabase = async (): Promise<void> => {
  cache = null;
  await storage.removeItem(StorageKeys.mockDatabase);
};

export const defaultPreferences = (): NotificationPreferences => ({
  enabled: true,
  billReminders: true,
  expenseAlerts: true,
  choreReminders: true,
  settlementAlerts: true,
  reminderHour: 10,
});

/** Ev nesnesine üye listesini gömer */
export const hydrateHousehold = (db: MockDatabase, household: StoredHousehold): Household => {
  const members: HouseholdMember[] = db.memberships
    .filter((m) => m.householdId === household.id)
    .map((membership) => {
      const user = db.users.find((u) => u.id === membership.userId);
      const { password, ...safeUser } = user ?? ({} as StoredUser);
      return {
        id: membership.id,
        householdId: membership.householdId,
        userId: membership.userId,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: safeUser as User,
      };
    })
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

  return { ...household, members };
};

export const toPublicUser = (user: StoredUser): User => {
  const { password, ...rest } = user;
  return rest;
};
