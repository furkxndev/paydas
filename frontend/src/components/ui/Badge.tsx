import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Özel renk (kategori renkleri için) */
  color?: string;
  background?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

const TONES: Record<BadgeTone, { fg: string; bg: string }> = {
  neutral: { fg: colors.textSecondary, bg: colors.surfaceAlt },
  primary: { fg: colors.primary, bg: colors.primarySoft },
  success: { fg: colors.successDark, bg: colors.successSoft },
  warning: { fg: colors.warningDark, bg: colors.warningSoft },
  danger: { fg: colors.dangerDark, bg: colors.dangerSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
};

export const Badge = ({
  label,
  tone = 'neutral',
  icon,
  color,
  background,
  style,
  size = 'md',
}: BadgeProps) => {
  const palette = TONES[tone];
  const fg = color ?? palette.fg;
  const bg = background ?? palette.bg;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={isSmall ? 11 : 13} color={fg} /> : null}
      <Text style={[typography.captionStrong, { color: fg, fontSize: isSmall ? 11 : 12 }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
