import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  left?: ReactNode;
  right?: ReactNode;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
  style?: ViewStyle;
}

/** Ayar listeleri ve özet satırları için standart satır bileşeni */
export const ListRow = ({
  title,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  left,
  right,
  value,
  valueColor,
  onPress,
  showChevron = false,
  danger = false,
  style,
}: ListRowProps) => {
  const content = (
    <>
      {left ??
        (icon ? (
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: iconBackground ?? colors.surfaceAlt },
            ]}
          >
            <Ionicons
              name={icon}
              size={18}
              color={iconColor ?? (danger ? colors.danger : colors.textSecondary)}
            />
          </View>
        ) : null)}
      <View style={styles.textGroup}>
        <Text
          style={[typography.bodyStrong, danger && { color: colors.danger }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={typography.caption} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={[typography.bodyStrong, valueColor ? { color: valueColor } : undefined]}>
          {value}
        </Text>
      ) : null}
      {right}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </>
  );

  if (!onPress) return <View style={[styles.row, style]}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
      android_ripple={{ color: colors.surfaceAlt }}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  pressed: { opacity: 0.7 },
});
