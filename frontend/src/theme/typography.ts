import { Platform, TextStyle } from 'react-native';
import { colors } from './colors';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const fontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

export const typography = {
  display: {
    fontFamily: fontFamilyMedium,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
  } as TextStyle,
  title: {
    fontFamily: fontFamilyMedium,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  } as TextStyle,
  heading: {
    fontFamily: fontFamilyMedium,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  } as TextStyle,
  subheading: {
    fontFamily: fontFamilyMedium,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  body: {
    fontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    color: colors.text,
  } as TextStyle,
  bodyStrong: {
    fontFamily: fontFamilyMedium,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  caption: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,
  captionStrong: {
    fontFamily: fontFamilyMedium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  } as TextStyle,
  /**
   * TextInput'lara özel varyantlar.
   * iOS'ta TextInput'a lineHeight verildiğinde metin dikeyde aşağı kayar,
   * bu yüzden giriş alanlarında lineHeight tanımlanmaz.
   */
  input: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
  } as TextStyle,
  inputStrong: {
    fontFamily: fontFamilyMedium,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  inputLarge: {
    fontFamily: fontFamilyMedium,
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
  } as TextStyle,
  label: {
    fontFamily: fontFamilyMedium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;
