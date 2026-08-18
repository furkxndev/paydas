import { useMemo } from 'react';

import { useHousehold } from './useHousehold';
import { useHouseholdData } from './useHouseholdData';
import { useAuth } from './useAuth';
import { Chore, ChoreLeaderboardRow } from '../types';
import { daysUntil } from '../utils';

export type ChoreFilter = 'all' | 'mine' | 'unassigned' | 'done';

/** Görev listesi, filtreler ve katkı puanı sıralaması */
export const useChores = (filter: ChoreFilter = 'all') => {
  const { user } = useAuth();
  const { members } = useHousehold();
  const {
    chores,
    addChore,
    editChore,
    toggleChore,
    deleteChore,
    loading,
    refreshing,
    refresh,
  } = useHouseholdData();

  const filtered = useMemo(() => {
    switch (filter) {
      case 'mine':
        return chores.filter((c) => c.status === 'pending' && c.assignedTo === user?.id);
      case 'unassigned':
        return chores.filter((c) => c.status === 'pending' && !c.assignedTo);
      case 'done':
        return chores.filter((c) => c.status === 'done');
      default:
        return chores.filter((c) => c.status === 'pending');
    }
  }, [chores, filter, user?.id]);

  const pending = useMemo(() => chores.filter((c) => c.status === 'pending'), [chores]);

  const myPending = useMemo(
    () => pending.filter((c) => c.assignedTo === user?.id),
    [pending, user?.id],
  );

  const overdue = useMemo(
    () => pending.filter((c: Chore) => c.dueDate && daysUntil(c.dueDate) < 0),
    [pending],
  );

  const leaderboard = useMemo<ChoreLeaderboardRow[]>(() => {
    const rows = new Map<string, ChoreLeaderboardRow>();
    members.forEach((member) => {
      rows.set(member.userId, { userId: member.userId, completedCount: 0, points: 0 });
    });
    chores
      .filter((c) => c.status === 'done' && c.completedBy)
      .forEach((chore) => {
        const row = rows.get(chore.completedBy!) ?? {
          userId: chore.completedBy!,
          completedCount: 0,
          points: 0,
        };
        row.completedCount += 1;
        row.points += chore.points;
        rows.set(chore.completedBy!, row);
      });
    return Array.from(rows.values()).sort((a, b) => b.points - a.points);
  }, [chores, members]);

  return {
    chores: filtered,
    allChores: chores,
    pending,
    myPending,
    overdue,
    leaderboard,
    loading,
    refreshing,
    refresh,
    addChore,
    editChore,
    toggleChore,
    deleteChore,
  };
};
