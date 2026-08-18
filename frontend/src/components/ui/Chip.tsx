import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export const Chip = ({ label, selected = false, onPress, icon, color }: ChipProps) => {
  const activeColor = color ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: activeColor, borderColor: activeColor }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? colors.textInverse : colors.textSecondary}
        />
      ) : null}
      <Text
        style={[
          typography.captionStrong,
          { color: selected ? colors.textInverse : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

interface ChipRowProps<T extends string> {
  options: { key: T; label: string; icon?: keyof typeof Ionicons.glyphMap; color?: string }[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
}

/** Yatay kaydırılabilir seçim satırı (kategori, filtre vb.) */
export const ChipRow = <T extends string>({
  options,
  value,
  onChange,
  scrollable = true,
}: ChipRowProps<T>) => {
  const content = options.map((option) => (
    <Chip
      key={option.key}
      label={option.label}
      icon={option.icon}
      color={option.color}
      selected={value === option.key}
      onPress={() => onChange(option.key)}
    />
  ));

  if (!scrollable) return <View style={styles.wrapRow}>{content}</View>;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollRow}
    >
      {content}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  scrollRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.75 },
});
