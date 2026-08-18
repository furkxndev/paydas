const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const MONTHS_TR_SHORT = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export const toDate = (value: string | number | Date): Date =>
  value instanceof Date ? value : new Date(value);

/** Saat bilgisini sıfırlayarak gün karşılaştırmasını güvenli hale getirir */
export const startOfDay = (value: string | number | Date = new Date()): Date => {
  const date = toDate(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const startOfMonth = (value: string | number | Date = new Date()): Date => {
  const date = toDate(value);
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (value: string | number | Date = new Date()): Date => {
  const date = toDate(value);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const addDays = (value: string | number | Date, days: number): Date => {
  const date = toDate(value);
  return new Date(date.getTime() + days * MS_PER_DAY);
};

export const addMonths = (value: string | number | Date, months: number): Date => {
  const date = toDate(value);
  const result = new Date(date.getTime());
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  // 31 Ocak + 1 ay gibi durumlarda ay taşmasını engelle
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setDate(0);
  }
  return result;
};

/** Bugüne göre kalan gün sayısı. Geçmiş tarihlerde negatif döner. */
export const daysUntil = (value: string | number | Date): number =>
  Math.round((startOfDay(value).getTime() - startOfDay().getTime()) / MS_PER_DAY);

export const isSameDay = (a: string | number | Date, b: string | number | Date): boolean =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

export const isPast = (value: string | number | Date): boolean => daysUntil(value) < 0;

export const isToday = (value: string | number | Date): boolean => daysUntil(value) === 0;

/** 14 Mart 2026 */
export const formatDate = (value: string | number | Date): string => {
  const date = toDate(value);
  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
};

/** 14 Mar */
export const formatDateShort = (value: string | number | Date): string => {
  const date = toDate(value);
  return `${date.getDate()} ${MONTHS_TR_SHORT[date.getMonth()]}`;
};

/** Mart 2026 */
export const formatMonth = (value: string | number | Date): string => {
  const date = toDate(value);
  return `${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
};

export const formatDayName = (value: string | number | Date): string =>
  DAYS_TR[toDate(value).getDay()];

export const formatTime = (value: string | number | Date): string => {
  const date = toDate(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/** "Bugün", "Dün", "3 gün önce", "12 Mart" */
export const formatRelativeDate = (value: string | number | Date): string => {
  const diff = daysUntil(value);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  if (diff === -1) return 'Dün';
  if (diff > 1 && diff <= 7) return `${diff} gün sonra`;
  if (diff < -1 && diff >= -7) return `${Math.abs(diff)} gün önce`;
  return formatDate(value);
};

/** Son ödeme tarihi için okunabilir ifade */
export const formatDueLabel = (value: string | number | Date): string => {
  const diff = daysUntil(value);
  if (diff === 0) return 'Bugün son gün';
  if (diff === 1) return 'Yarın son gün';
  if (diff > 1) return `${diff} gün kaldı`;
  if (diff === -1) return '1 gün gecikti';
  return `${Math.abs(diff)} gün gecikti`;
};

/** 2026-03 formatında ay anahtarı */
export const getMonthKey = (value: string | number | Date = new Date()): string => {
  const date = toDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const isWithinMonth = (
  value: string | number | Date,
  reference: string | number | Date = new Date(),
): boolean => getMonthKey(value) === getMonthKey(reference);

/** YYYY-MM-DD -> Date. Girdi geçersizse null. */
export const parseDateInput = (input: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getMonth() !== Number(month) - 1) return null;
  return date;
};

/** Date -> YYYY-MM-DD (form alanları için) */
export const toDateInput = (value: string | number | Date = new Date()): string => {
  const date = toDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

export { MONTHS_TR, MONTHS_TR_SHORT, DAYS_TR };
