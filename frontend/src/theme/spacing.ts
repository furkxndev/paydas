/** 4px tabanlı boşluk ölçeği */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const layout = {
  screenPadding: spacing.xl,
  cardPadding: spacing.lg,
  tabBarHeight: 60,
  headerHeight: 56,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;
