import { useMemo } from 'react';

import { useHouseholdData } from './useHouseholdData';
import { Bill } from '../types';
import { daysUntil, round2 } from '../utils';

/** Faturaları duruma göre gruplar ve yaklaşanları öne çıkarır */
export const useBills = () => {
  const { bills, addBill, editBill, payBill, deleteBill, loading, refreshing, refresh } =
    useHouseholdData();

  const grouped = useMemo(() => {
    const overdue: Bill[] = [];
    const upcoming: Bill[] = [];
    const later: Bill[] = [];
    const paid: Bill[] = [];

    bills.forEach((bill) => {
      if (bill.status === 'paid') {
        paid.push(bill);
        return;
      }
      const remaining = daysUntil(bill.dueDate);
      if (remaining < 0) overdue.push(bill);
      else if (remaining <= 7) upcoming.push(bill);
      else later.push(bill);
    });

    return { overdue, upcoming, later, paid };
  }, [bills]);

  const unpaidTotal = useMemo(
    () =>
      round2(bills.filter((b) => b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0)),
    [bills],
  );

  /** Ana ekranda gösterilecek en yakın faturalar */
  const nextBills = useMemo(
    () => [...grouped.overdue, ...grouped.upcoming, ...grouped.later].slice(0, 3),
    [grouped],
  );

  return {
    bills,
    grouped,
    nextBills,
    unpaidTotal,
    loading,
    refreshing,
    refresh,
    addBill,
    editBill,
    payBill,
    deleteBill,
  };
};
