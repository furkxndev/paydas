/**
 * Paydaş renk paleti.
 * Tüm renkler burada tanımlanır; ekranlarda hex kullanılmaz.
 */
export const palette = {
  indigo50: '#EEF0FF',
  indigo100: '#DDE1FF',
  indigo300: '#A5ADFF',
  indigo500: '#5B5BD6',
  indigo600: '#4B4ACF',
  indigo700: '#3B39A8',

  teal50: '#E6FAF6',
  teal500: '#0FB39A',
  teal600: '#0A9280',

  amber50: '#FFF7E6',
  amber500: '#F5A524',
  amber600: '#D18A12',

  rose50: '#FFECEF',
  rose500: '#F03D5C',
  rose600: '#D22745',

  violet50: '#F4EEFF',
  violet500: '#8B5CF6',

  sky50: '#E8F4FF',
  sky500: '#2F9BF5',

  neutral0: '#FFFFFF',
  neutral50: '#F7F8FB',
  neutral100: '#EFF1F6',
  neutral200: '#E2E5EE',
  neutral300: '#CBD0DC',
  neutral400: '#9AA1B4',
  neutral500: '#6E7686',
  neutral600: '#4C5361',
  neutral700: '#343A46',
  neutral800: '#20242D',
  neutral900: '#12151B',
} as const;

export const colors = {
  /** Ana marka rengi */
  primary: palette.indigo500,
  primaryDark: palette.indigo600,
  primarySoft: palette.indigo50,
  primaryBorder: palette.indigo100,

  /** Alacak / olumlu durum */
  success: palette.teal500,
  successDark: palette.teal600,
  successSoft: palette.teal50,

  /** Uyarı / yaklaşan son ödeme */
  warning: palette.amber500,
  warningDark: palette.amber600,
  warningSoft: palette.amber50,

  /** Borç / gecikmiş durum */
  danger: palette.rose500,
  dangerDark: palette.rose600,
  dangerSoft: palette.rose50,

  info: palette.sky500,
  infoSoft: palette.sky50,

  accent: palette.violet500,
  accentSoft: palette.violet50,

  /** Yüzeyler */
  background: palette.neutral50,
  surface: palette.neutral0,
  surfaceAlt: palette.neutral100,
  border: palette.neutral200,
  borderStrong: palette.neutral300,
  overlay: 'rgba(18, 21, 27, 0.45)',

  /** Metin */
  text: palette.neutral900,
  textSecondary: palette.neutral500,
  textMuted: palette.neutral400,
  textInverse: palette.neutral0,

  white: palette.neutral0,
  black: palette.neutral900,
} as const;

/** Üye avatarları için deterministik renk seti */
export const avatarColors = [
  '#5B5BD6',
  '#0FB39A',
  '#F5A524',
  '#F03D5C',
  '#8B5CF6',
  '#2F9BF5',
  '#EC4899',
  '#14B8A6',
] as const;

export type ColorToken = keyof typeof colors;
