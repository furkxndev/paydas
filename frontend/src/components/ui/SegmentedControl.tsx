import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

interface SegmentedControlProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** iOS tarzı sekmeli seçici; iki-dört seçenek için uygundur */
export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) => (
  <View style={styles.container}>
    {options.map((option) => {
      const selected = option.key === value;
      return (
        <Pressable
          key={option.key}
          onPress={() => onChange(option.key)}
          style={[styles.segment, selected && styles.segmentActive]}
        >
          <Text
            style={[
              typography.captionStrong,
              { color: selected ? colors.text : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
});
