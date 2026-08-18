const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const startOfDay = (value: Date = new Date()): Date =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

export const addDays = (value: Date, days: number): Date =>
  new Date(value.getTime() + days * MS_PER_DAY);

/** 31 Ocak + 1 ay gibi durumlarda ay taşmasını engeller */
export const addMonths = (value: Date, months: number): Date => {
  const result = new Date(value.getTime());
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) result.setDate(0);
  return result;
};

/** Bugüne göre kalan gün sayısı; geçmiş tarihlerde negatif döner */
export const daysUntil = (value: Date): number =>
  Math.round(
    (startOfDay(value).getTime() - startOfDay().getTime()) / MS_PER_DAY,
  );

export const isSameDay = (a: Date, b: Date): boolean =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

export const startOfMonth = (value: Date = new Date()): Date =>
  new Date(value.getFullYear(), value.getMonth(), 1);

export const formatCurrencyTR = (value: number, currency = 'TRY'): string => {
  const symbols: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€' };
  const fixed = Math.abs(value).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '-' : ''}${grouped},${decPart} ${symbols[currency] ?? currency}`;
};

const RECURRENCE_MONTHS: Record<string, number> = {
  none: 0,
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  yearly: 12,
};

export const recurrenceToMonths = (recurrence: string): number =>
  RECURRENCE_MONTHS[recurrence] ?? 0;

const CHORE_RECURRENCE_DAYS: Record<string, number> = {
  none: 0,
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

export const choreRecurrenceToDays = (recurrence: string): number =>
  CHORE_RECURRENCE_DAYS[recurrence] ?? 0;
