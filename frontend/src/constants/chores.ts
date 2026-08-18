import { ChorePriority, ChoreRecurrence } from '../types';
import { colors } from '../theme';

export const CHORE_PRIORITIES: {
  key: ChorePriority;
  label: string;
  color: string;
  softColor: string;
}[] = [
  { key: 'low', label: 'Düşük', color: colors.textSecondary, softColor: colors.surfaceAlt },
  { key: 'medium', label: 'Orta', color: colors.warning, softColor: colors.warningSoft },
  { key: 'high', label: 'Yüksek', color: colors.danger, softColor: colors.dangerSoft },
];

export const getPriorityMeta = (key: ChorePriority) =>
  CHORE_PRIORITIES.find((p) => p.key === key) ?? CHORE_PRIORITIES[0];

export const CHORE_RECURRENCES: { key: ChoreRecurrence; label: string; days: number }[] = [
  { key: 'none', label: 'Tekrarlamaz', days: 0 },
  { key: 'daily', label: 'Her gün', days: 1 },
  { key: 'weekly', label: 'Haftalık', days: 7 },
  { key: 'biweekly', label: '2 haftada bir', days: 14 },
  { key: 'monthly', label: 'Aylık', days: 30 },
];

export const getChoreRecurrenceDays = (key: ChoreRecurrence): number =>
  CHORE_RECURRENCES.find((r) => r.key === key)?.days ?? 0;

export const getChoreRecurrenceLabel = (key: ChoreRecurrence): string =>
  CHORE_RECURRENCES.find((r) => r.key === key)?.label ?? 'Tekrarlamaz';

/** Hızlı görev oluşturma önerileri */
export const CHORE_TEMPLATES: { title: string; icon: string; points: number }[] = [
  { title: 'Çöp çıkarma', icon: 'trash', points: 5 },
  { title: 'Bulaşık', icon: 'water', points: 10 },
  { title: 'Salon temizliği', icon: 'sparkles', points: 15 },
  { title: 'Banyo temizliği', icon: 'brush', points: 20 },
  { title: 'Market alışverişi', icon: 'cart', points: 15 },
  { title: 'Çamaşır', icon: 'shirt', points: 10 },
];
