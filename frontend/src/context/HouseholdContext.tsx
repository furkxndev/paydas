import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '../hooks/useAuth';
import { api, storage, StorageKeys } from '../services';
import {
  CreateHouseholdPayload,
  Household,
  HouseholdMember,
  JoinHouseholdPayload,
  UpdateHouseholdPayload,
} from '../types';

export interface HouseholdContextValue {
  households: Household[];
  activeHousehold: Household | null;
  activeHouseholdId: string | null;
  members: HouseholdMember[];
  /** Ev listesi ilk kez yükleniyor mu */
  loading: boolean;
  submitting: boolean;
  error: string | null;
  /** Kullanıcının aktif evdeki rolü */
  myRole: HouseholdMember['role'] | null;
  isAdmin: boolean;
  currency: string;
  refresh: () => Promise<void>;
  selectHousehold: (householdId: string) => Promise<void>;
  createHousehold: (payload: CreateHouseholdPayload) => Promise<Household>;
  joinHousehold: (payload: JoinHouseholdPayload) => Promise<Household>;
  updateHousehold: (payload: UpdateHouseholdPayload) => Promise<void>;
  regenerateInviteCode: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  /** userId -> üye eşlemesi; listelerde isim göstermek için */
  getMember: (userId: string) => HouseholdMember | undefined;
  getMemberName: (userId: string) => string;
}

export const HouseholdContext = createContext<HouseholdContextValue | undefined>(undefined);

export const HouseholdProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHousehold = useMemo(
    () => households.find((h) => h.id === activeHouseholdId) ?? households[0] ?? null,
    [households, activeHouseholdId],
  );

  const loadHouseholds = useCallback(async () => {
    setLoading(true);
    if (!isAuthenticated) {
      setHouseholds([]);
      setActiveHouseholdId(null);
      setLoading(false);
      return;
    }
    try {
      const list = await api.households.list();
      setHouseholds(list);
      const storedId = await storage.getItem(StorageKeys.activeHouseholdId);
      const nextId = list.some((h) => h.id === storedId) ? storedId : (list[0]?.id ?? null);
      setActiveHouseholdId(nextId);
      if (nextId) await storage.setItem(StorageKeys.activeHouseholdId, nextId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Oturum açıldığında/değiştiğinde ev listesini sunucudan çeker.
  useEffect(() => {
    loadHouseholds();
  }, [loadHouseholds]);

  const selectHousehold = useCallback(async (householdId: string) => {
    setActiveHouseholdId(householdId);
    await storage.setItem(StorageKeys.activeHouseholdId, householdId);
  }, []);

  const runMutation = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setSubmitting(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem tamamlanamadı');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const upsertHousehold = useCallback((household: Household) => {
    setHouseholds((prev) => {
      const index = prev.findIndex((h) => h.id === household.id);
      if (index === -1) return [...prev, household];
      const next = [...prev];
      next[index] = household;
      return next;
    });
  }, []);

  const createHousehold = useCallback(
    (payload: CreateHouseholdPayload) =>
      runMutation(async () => {
        const household = await api.households.create(payload);
        upsertHousehold(household);
        await selectHousehold(household.id);
        return household;
      }),
    [runMutation, selectHousehold, upsertHousehold],
  );

  const joinHousehold = useCallback(
    (payload: JoinHouseholdPayload) =>
      runMutation(async () => {
        const household = await api.households.join(payload);
        upsertHousehold(household);
        await selectHousehold(household.id);
        return household;
      }),
    [runMutation, selectHousehold, upsertHousehold],
  );

  const updateHousehold = useCallback(
    (payload: UpdateHouseholdPayload) =>
      runMutation(async () => {
        if (!activeHousehold) return;
        const updated = await api.households.update(activeHousehold.id, payload);
        upsertHousehold(updated);
      }),
    [activeHousehold, runMutation, upsertHousehold],
  );

  const regenerateInviteCode = useCallback(
    () =>
      runMutation(async () => {
        if (!activeHousehold) return;
        const updated = await api.households.regenerateInviteCode(activeHousehold.id);
        upsertHousehold(updated);
      }),
    [activeHousehold, runMutation, upsertHousehold],
  );

  const removeMember = useCallback(
    (userId: string) =>
      runMutation(async () => {
        if (!activeHousehold) return;
        const updated = await api.households.removeMember(activeHousehold.id, userId);
        upsertHousehold(updated);
      }),
    [activeHousehold, runMutation, upsertHousehold],
  );

  const leaveHousehold = useCallback(
    () =>
      runMutation(async () => {
        if (!activeHousehold) return;
        await api.households.leave(activeHousehold.id);
        await storage.removeItem(StorageKeys.activeHouseholdId);
        setHouseholds((prev) => prev.filter((h) => h.id !== activeHousehold.id));
        setActiveHouseholdId(null);
      }),
    [activeHousehold, runMutation],
  );

  const members = useMemo(() => activeHousehold?.members ?? [], [activeHousehold]);

  const memberIndex = useMemo(() => {
    const map = new Map<string, HouseholdMember>();
    members.forEach((member) => map.set(member.userId, member));
    return map;
  }, [members]);

  const myRole = useMemo(() => {
    if (!user) return null;
    return memberIndex.get(user.id)?.role ?? null;
  }, [memberIndex, user]);

  const value = useMemo<HouseholdContextValue>(
    () => ({
      households,
      activeHousehold,
      activeHouseholdId: activeHousehold?.id ?? null,
      members,
      loading,
      submitting,
      error,
      myRole,
      isAdmin: myRole === 'owner' || myRole === 'admin',
      currency: activeHousehold?.currency ?? 'TRY',
      refresh: loadHouseholds,
      selectHousehold,
      createHousehold,
      joinHousehold,
      updateHousehold,
      regenerateInviteCode,
      removeMember,
      leaveHousehold,
      getMember: (userId: string) => memberIndex.get(userId),
      getMemberName: (userId: string) =>
        memberIndex.get(userId)?.user.fullName ?? 'Bilinmeyen üye',
    }),
    [
      households,
      activeHousehold,
      members,
      loading,
      submitting,
      error,
      myRole,
      loadHouseholds,
      selectHousehold,
      createHousehold,
      joinHousehold,
      updateHousehold,
      regenerateInviteCode,
      removeMember,
      leaveHousehold,
      memberIndex,
    ],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
};
