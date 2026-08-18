import { useMemo, useState } from 'react';

import { useHouseholdData } from './useHouseholdData';
import { Expense, ExpenseCategory } from '../types';
import { getCategoryBreakdown, isWithinMonth, sumExpenses } from '../utils';

export type ExpensePeriod = 'month' | 'all';

export interface ExpenseFilterState {
  search: string;
  category: ExpenseCategory | 'all';
  paidBy: string | 'all';
  period: ExpensePeriod;
}

const initialFilters: ExpenseFilterState = {
  search: '',
  category: 'all',
  paidBy: 'all',
  period: 'month',
};

/** Gider listesi + filtreleme ve özet hesapları */
export const useExpenses = () => {
  const { expenses, addExpense, editExpense, deleteExpense, loading, refreshing, refresh } =
    useHouseholdData();
  const [filters, setFilters] = useState<ExpenseFilterState>(initialFilters);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLocaleLowerCase('tr-TR');
    return expenses.filter((expense: Expense) => {
      if (filters.period === 'month' && !isWithinMonth(expense.date)) return false;
      if (filters.category !== 'all' && expense.category !== filters.category) return false;
      if (filters.paidBy !== 'all' && expense.paidBy !== filters.paidBy) return false;
      if (needle && !expense.title.toLocaleLowerCase('tr-TR').includes(needle)) return false;
      return true;
    });
  }, [expenses, filters]);

  const total = useMemo(() => sumExpenses(filtered), [filtered]);
  const breakdown = useMemo(() => getCategoryBreakdown(filtered), [filtered]);

  const hasActiveFilters =
    filters.category !== 'all' || filters.paidBy !== 'all' || filters.search.trim().length > 0;

  return {
    expenses: filtered,
    allExpenses: expenses,
    total,
    breakdown,
    filters,
    setFilters,
    resetFilters: () => setFilters(initialFilters),
    hasActiveFilters,
    loading,
    refreshing,
    refresh,
    addExpense,
    editExpense,
    deleteExpense,
  };
};
