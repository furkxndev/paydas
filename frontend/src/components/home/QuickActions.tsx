import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

export interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
  onPress: () => void;
}

/** Ana ekranda tek dokunuşla erişilen kısayollar */
export const QuickActions = ({ actions }: { actions: QuickAction[] }) => (
  <View style={styles.row}>
    {actions.map((action) => (
      <Pressable
        key={action.key}
        onPress={action.onPress}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <View style={[styles.icon, { backgroundColor: action.background }]}>
          <Ionicons name={action.icon} size={20} color={action.color} />
        </View>
        <Text style={styles.label} numberOfLines={2}>
          {action.label}
        </Text>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    textAlign: 'center',
    color: colors.text,
  },
  pressed: { opacity: 0.75 },
});
