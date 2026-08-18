import { DEFAULT_CURRENCY } from '../constants';

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const getCurrencySymbol = (currency: string = DEFAULT_CURRENCY): string =>
  CURRENCY_SYMBOLS[currency] ?? currency;

/** Kuruş hatalarını engellemek için 2 basamağa yuvarlar */
export const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const groupThousands = (integerPart: string): string =>
  integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * Türkçe biçimde para formatı: 1.234,56 ₺
 * Intl yerine elle biçimlendirilir; tüm JS motorlarında aynı çıktıyı verir.
 */
export const formatCurrency = (
  value: number,
  currency: string = DEFAULT_CURRENCY,
  options: { showSymbol?: boolean; maxDecimals?: number } = {},
): string => {
  const { showSymbol = true, maxDecimals = 2 } = options;
  const safe = Number.isFinite(value) ? value : 0;
  const negative = safe < 0;
  const fixed = Math.abs(round2(safe)).toFixed(maxDecimals);
  const [intPart, decPart] = fixed.split('.');
  const formatted = decPart ? `${groupThousands(intPart)},${decPart}` : groupThousands(intPart);
  const sign = negative ? '-' : '';
  return showSymbol
    ? `${sign}${formatted} ${getCurrencySymbol(currency)}`
    : `${sign}${formatted}`;
};

/** Kompakt gösterim: 12.400 -> 12,4B */
export const formatCompactCurrency = (
  value: number,
  currency: string = DEFAULT_CURRENCY,
): string => {
  const abs = Math.abs(value);
  if (abs < 10000) return formatCurrency(value, currency);
  const sign = value < 0 ? '-' : '';
  if (abs < 1_000_000) {
    return `${sign}${(abs / 1000).toFixed(1).replace('.', ',')}B ${getCurrencySymbol(currency)}`;
  }
  return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')}M ${getCurrencySymbol(currency)}`;
};

/** "1.234,56" ya da "1234.56" girdisini sayıya çevirir */
export const parseAmount = (input: string): number => {
  if (!input) return 0;
  const normalized = input
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Bir tutarı n kişiye böler ve kuruş artıklarını ilk kişilere dağıtır.
 * Toplam her zaman girilen tutara eşittir.
 */
export const splitEvenly = (amount: number, count: number): number[] => {
  if (count <= 0) return [];
  const cents = Math.round(round2(amount) * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  return Array.from({ length: count }, (_, index) =>
    round2((base + (index < remainder ? 1 : 0)) / 100),
  );
};
