import { useMemo } from 'react';

import { useAuth } from './useAuth';
import { useHouseholdData } from './useHouseholdData';
import { getBalanceFor, splitDebtsForUser } from '../utils';

/** Kimin kime ne kadar borçlu olduğunu aktif kullanıcı perspektifinden döner */
export const useBalances = () => {
  const { user } = useAuth();
  const { balances, debts, settlements, settleDebt, loading, refreshing, refresh } =
    useHouseholdData();

  const myBalance = useMemo(
    () => getBalanceFor(balances, user?.id ?? ''),
    [balances, user?.id],
  );

  const { owes, isOwed } = useMemo(
    () => splitDebtsForUser(debts, user?.id ?? ''),
    [debts, user?.id],
  );

  const totalOwed = useMemo(() => owes.reduce((sum, debt) => sum + debt.amount, 0), [owes]);

  const totalReceivable = useMemo(
    () => isOwed.reduce((sum, debt) => sum + debt.amount, 0),
    [isOwed],
  );

  /** Kullanıcıyı ilgilendirmeyen, diğer üyeler arasındaki borçlar */
  const otherDebts = useMemo(
    () => debts.filter((d) => d.fromUserId !== user?.id && d.toUserId !== user?.id),
    [debts, user?.id],
  );

  return {
    balances,
    debts,
    myBalance,
    owes,
    isOwed,
    otherDebts,
    totalOwed,
    totalReceivable,
    settlements,
    settleDebt,
    isSettled: debts.length === 0,
    loading,
    refreshing,
    refresh,
  };
};
