import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { api } from '../services';
import {
  AppNotification,
  Bill,
  Chore,
  CreateBillPayload,
  CreateChorePayload,
  CreateExpensePayload,
  CreateSettlementPayload,
  Debt,
  Expense,
  HouseholdSummary,
  MemberBalance,
  PayBillPayload,
  Settlement,
  UpdateBillPayload,
  UpdateChorePayload,
  UpdateExpensePayload,
} from '../types';

const emptySummary: HouseholdSummary = {
  monthTotal: 0,
  allTimeTotal: 0,
  myNet: 0,
  myPaid: 0,
  myOwed: 0,
  pendingBillsCount: 0,
  overdueBillsCount: 0,
  upcomingBillsTotal: 0,
  pendingChoresCount: 0,
  myPendingChoresCount: 0,
  memberCount: 0,
};

export interface HouseholdDataContextValue {
  expenses: Expense[];
  bills: Bill[];
  chores: Chore[];
  settlements: Settlement[];
  balances: MemberBalance[];
  debts: Debt[];
  notifications: AppNotification[];
  summary: HouseholdSummary;
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  refresh: (options?: { silent?: boolean }) => Promise<void>;

  addExpense: (payload: CreateExpensePayload) => Promise<Expense>;
  editExpense: (expenseId: string, payload: UpdateExpensePayload) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;

  addBill: (payload: CreateBillPayload) => Promise<Bill>;
  editBill: (billId: string, payload: UpdateBillPayload) => Promise<void>;
  payBill: (billId: string, payload: PayBillPayload) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;

  addChore: (payload: CreateChorePayload) => Promise<Chore>;
  editChore: (choreId: string, payload: UpdateChorePayload) => Promise<void>;
  toggleChore: (choreId: string, completed: boolean) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;

  settleDebt: (payload: CreateSettlementPayload) => Promise<void>;

  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

export const HouseholdDataContext = createContext<HouseholdDataContextValue | undefined>(
  undefined,
);

export const HouseholdDataProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { activeHouseholdId } = useHousehold();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [summary, setSummary] = useState<HouseholdSummary>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Ev değiştiğinde yarışan isteklerin eski veriyi yazmasını engeller */
  const requestIdRef = useRef(0);

  const resetState = useCallback(() => {
    setExpenses([]);
    setBills([]);
    setChores([]);
    setSettlements([]);
    setBalances([]);
    setDebts([]);
    setNotifications([]);
    setSummary(emptySummary);
  }, []);

  const refresh = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!isAuthenticated || !activeHouseholdId) {
        resetState();
        setLoading(false);
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (options.silent) {
        setRefreshing(true);
      } else {
        // Ev değiştiğinde önceki evin verisi görünmesin
        resetState();
        setLoading(true);
      }

      try {
        const [
          expenseList,
          billList,
          choreList,
          settlementList,
          balanceResult,
          notificationList,
          summaryResult,
        ] = await Promise.all([
          api.expenses.list(activeHouseholdId),
          api.bills.list(activeHouseholdId),
          api.chores.list(activeHouseholdId),
          api.balances.listSettlements(activeHouseholdId),
          api.balances.get(activeHouseholdId),
          api.notifications.list(activeHouseholdId),
          api.households.summary(activeHouseholdId),
        ]);

        if (requestIdRef.current !== requestId) return;

        setExpenses(expenseList);
        setBills(billList);
        setChores(choreList);
        setSettlements(settlementList);
        setBalances(balanceResult.balances);
        setDebts(balanceResult.debts);
        setNotifications(notificationList);
        setSummary(summaryResult);
        setError(null);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : 'Veriler yüklenemedi');
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [activeHouseholdId, isAuthenticated, resetState],
  );

  // Aktif ev değiştiğinde o eve ait tüm veriyi yeniden yükler.
  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Mutasyon sonrası veriyi sessizce tazeler */
  const mutate = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      const result = await action();
      await refresh({ silent: true });
      return result;
    },
    [refresh],
  );

  const requireHousehold = useCallback((): string => {
    if (!activeHouseholdId) throw new Error('Önce bir ev seçmelisiniz.');
    return activeHouseholdId;
  }, [activeHouseholdId]);

  const value = useMemo<HouseholdDataContextValue>(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
      expenses,
      bills,
      chores,
      settlements,
      balances,
      debts,
      notifications,
      summary,
      unreadCount,
      loading,
      refreshing,
      error,
      refresh,

      addExpense: (payload) => mutate(() => api.expenses.create(requireHousehold(), payload)),
      editExpense: async (expenseId, payload) => {
        await mutate(() => api.expenses.update(expenseId, payload));
      },
      deleteExpense: async (expenseId) => {
        await mutate(() => api.expenses.remove(expenseId));
      },

      addBill: (payload) => mutate(() => api.bills.create(requireHousehold(), payload)),
      editBill: async (billId, payload) => {
        await mutate(() => api.bills.update(billId, payload));
      },
      payBill: async (billId, payload) => {
        await mutate(() => api.bills.pay(billId, payload));
      },
      deleteBill: async (billId) => {
        await mutate(() => api.bills.remove(billId));
      },

      addChore: (payload) => mutate(() => api.chores.create(requireHousehold(), payload)),
      editChore: async (choreId, payload) => {
        await mutate(() => api.chores.update(choreId, payload));
      },
      toggleChore: async (choreId, completed) => {
        // Anında geri bildirim: listeyi önce yerelde güncelle
        setChores((prev) =>
          prev.map((chore) =>
            chore.id === choreId ? { ...chore, status: completed ? 'done' : 'pending' } : chore,
          ),
        );
        await mutate(() => api.chores.toggleComplete(choreId, completed));
      },
      deleteChore: async (choreId) => {
        await mutate(() => api.chores.remove(choreId));
      },

      settleDebt: async (payload) => {
        await mutate(() => api.balances.settle(requireHousehold(), payload));
      },

      markNotificationRead: async (notificationId) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        );
        await api.notifications.markRead(notificationId);
      },
      markAllNotificationsRead: async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        await api.notifications.markAllRead(requireHousehold());
      },
    };
  }, [
    expenses,
    bills,
    chores,
    settlements,
    balances,
    debts,
    notifications,
    summary,
    loading,
    refreshing,
    error,
    refresh,
    mutate,
    requireHousehold,
  ]);

  return (
    <HouseholdDataContext.Provider value={value}>{children}</HouseholdDataContext.Provider>
  );
};
