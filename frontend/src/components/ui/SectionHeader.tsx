import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  count?: number;
}

export const SectionHeader = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  count,
}: SectionHeaderProps) => (
  <View style={styles.container}>
    <View style={styles.titleGroup}>
      <Text style={typography.heading}>{title}</Text>
      {typeof count === 'number' ? (
        <View style={styles.countBubble}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : null}
    </View>
    {actionLabel && onAction ? (
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={styles.action}>{actionLabel}</Text>
      </Pressable>
    ) : subtitle ? (
      <Text style={typography.caption}>{subtitle}</Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countBubble: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...typography.captionStrong,
    color: colors.primary,
    fontSize: 12,
  },
  action: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
