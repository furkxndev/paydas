import { ExpenseCategory } from '../types';
import { colors, palette } from '../theme';

export interface CategoryMeta {
  key: ExpenseCategory;
  label: string;
  icon: string;
  color: string;
  softColor: string;
}

/** Ionicons isimleri kullanılır (@expo/vector-icons) */
export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  {
    key: 'market',
    label: 'Market',
    icon: 'cart',
    color: palette.teal500,
    softColor: palette.teal50,
  },
  {
    key: 'fatura',
    label: 'Fatura',
    icon: 'receipt',
    color: palette.sky500,
    softColor: palette.sky50,
  },
  {
    key: 'kira',
    label: 'Kira',
    icon: 'home',
    color: palette.indigo500,
    softColor: palette.indigo50,
  },
  {
    key: 'temizlik',
    label: 'Temizlik',
    icon: 'sparkles',
    color: palette.violet500,
    softColor: palette.violet50,
  },
  {
    key: 'yemek',
    label: 'Yemek',
    icon: 'restaurant',
    color: palette.amber500,
    softColor: palette.amber50,
  },
  { key: 'ulasim', label: 'Ulaşım', icon: 'bus', color: '#EC4899', softColor: '#FDEAF4' },
  {
    key: 'eglence',
    label: 'Eğlence',
    icon: 'game-controller',
    color: '#14B8A6',
    softColor: '#E4FBF7',
  },
  {
    key: 'bakim',
    label: 'Tadilat/Bakım',
    icon: 'construct',
    color: palette.rose500,
    softColor: palette.rose50,
  },
  {
    key: 'diger',
    label: 'Diğer',
    icon: 'ellipsis-horizontal-circle',
    color: colors.textSecondary,
    softColor: colors.surfaceAlt,
  },
];

const categoryMap = new Map<ExpenseCategory, CategoryMeta>(
  EXPENSE_CATEGORIES.map((c) => [c.key, c]),
);

export const getCategoryMeta = (key: ExpenseCategory): CategoryMeta =>
  categoryMap.get(key) ?? categoryMap.get('diger')!;
