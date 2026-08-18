import { BillRecurrence, BillType } from '../types';
import { palette, colors } from '../theme';

export interface BillTypeMeta {
  key: BillType;
  label: string;
  icon: string;
  color: string;
  softColor: string;
}

export const BILL_TYPES: BillTypeMeta[] = [
  {
    key: 'elektrik',
    label: 'Elektrik',
    icon: 'flash',
    color: palette.amber500,
    softColor: palette.amber50,
  },
  { key: 'su', label: 'Su', icon: 'water', color: palette.sky500, softColor: palette.sky50 },
  {
    key: 'dogalgaz',
    label: 'Doğalgaz',
    icon: 'flame',
    color: palette.rose500,
    softColor: palette.rose50,
  },
  {
    key: 'internet',
    label: 'İnternet',
    icon: 'wifi',
    color: palette.violet500,
    softColor: palette.violet50,
  },
  {
    key: 'kira',
    label: 'Kira',
    icon: 'home',
    color: palette.indigo500,
    softColor: palette.indigo50,
  },
  {
    key: 'aidat',
    label: 'Aidat',
    icon: 'business',
    color: palette.teal500,
    softColor: palette.teal50,
  },
  {
    key: 'diger',
    label: 'Diğer',
    icon: 'document-text',
    color: colors.textSecondary,
    softColor: colors.surfaceAlt,
  },
];

const billTypeMap = new Map<BillType, BillTypeMeta>(BILL_TYPES.map((b) => [b.key, b]));

export const getBillTypeMeta = (key: BillType): BillTypeMeta =>
  billTypeMap.get(key) ?? billTypeMap.get('diger')!;

export const RECURRENCE_OPTIONS: { key: BillRecurrence; label: string; months: number }[] = [
  { key: 'none', label: 'Tekrarlamaz', months: 0 },
  { key: 'monthly', label: 'Her ay', months: 1 },
  { key: 'bimonthly', label: '2 ayda bir', months: 2 },
  { key: 'quarterly', label: '3 ayda bir', months: 3 },
  { key: 'yearly', label: 'Yılda bir', months: 12 },
];

export const getRecurrenceMonths = (recurrence: BillRecurrence): number =>
  RECURRENCE_OPTIONS.find((r) => r.key === recurrence)?.months ?? 0;

export const getRecurrenceLabel = (recurrence: BillRecurrence): string =>
  RECURRENCE_OPTIONS.find((r) => r.key === recurrence)?.label ?? 'Tekrarlamaz';

export const REMINDER_DAY_OPTIONS = [1, 2, 3, 5, 7];
