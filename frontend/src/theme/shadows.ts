import { Platform, ViewStyle } from 'react-native';

const make = (elevation: number, opacity: number, radius: number, offsetY: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0B1020',
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;

export const shadows = {
  none: {} as ViewStyle,
  xs: make(1, 0.04, 3, 1),
  sm: make(2, 0.06, 8, 2),
  md: make(4, 0.08, 16, 6),
  lg: make(8, 0.12, 28, 12),
} as const;
