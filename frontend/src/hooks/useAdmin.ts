import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from './useAuth';
import { api } from '../services';
import {
  AdminHouseholdSummary,
  AdminStats,
  AdminUpdateUserPayload,
  AdminUserSummary,
  PlatformRole,
  UserStatus,
} from '../types';

export type AdminRoleFilter = PlatformRole | 'all';
export type AdminStatusFilter = UserStatus | 'all';

/**
 * Yönetim paneli veri kaynağı.
 * Yalnızca platformRole === 'admin' olan kullanıcı için veri çeker.
 */
export const useAdmin = () => {
  const { user, isPlatformAdmin } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [households, setHouseholds] = useState<AdminHouseholdSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<AdminRoleFilter>('all');
  const [status, setStatus] = useState<AdminStatusFilter>('all');

  const load = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!isPlatformAdmin) {
        setLoading(false);
        return;
      }
      if (options.silent) setRefreshing(true);
      else setLoading(true);

      try {
        const [statsResult, userList, householdList] = await Promise.all([
          api.admin.stats(),
          api.admin.listUsers(),
          api.admin.listHouseholds(),
        ]);
        setStats(statsResult);
        setUsers(userList);
        setHouseholds(householdList);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Yönetim verileri yüklenemedi');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isPlatformAdmin],
  );

  useEffect(() => {
    load();
  }, [load]);

  /** Filtreleme istemci tarafında yapılır; liste boyutu küçüktür ve anında tepki verir */
  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('tr-TR');
    return users.filter((row) => {
      if (role !== 'all' && row.user.platformRole !== role) return false;
      if (status !== 'all' && row.user.status !== status) return false;
      if (
        needle &&
        !row.user.fullName.toLocaleLowerCase('tr-TR').includes(needle) &&
        !row.user.email.toLocaleLowerCase('tr-TR').includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [users, search, role, status]);

  const updateUser = useCallback(
    async (userId: string, payload: AdminUpdateUserPayload) => {
      await api.admin.updateUser(userId, payload);
      await load({ silent: true });
    },
    [load],
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      await api.admin.deleteUser(userId);
      await load({ silent: true });
    },
    [load],
  );

  const getUser = useCallback(
    (userId: string) => users.find((row) => row.user.id === userId),
    [users],
  );

  return {
    stats,
    users: filteredUsers,
    allUsers: users,
    households,
    loading,
    refreshing,
    error,
    search,
    setSearch,
    role,
    setRole,
    status,
    setStatus,
    hasActiveFilters: role !== 'all' || status !== 'all' || search.trim().length > 0,
    resetFilters: () => {
      setSearch('');
      setRole('all');
      setStatus('all');
    },
    refresh: load,
    updateUser,
    deleteUser,
    getUser,
    currentUserId: user?.id,
  };
};
