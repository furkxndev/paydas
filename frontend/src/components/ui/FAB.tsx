import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../../theme';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  /**
   * Ekranın altına binen bir katman varsa ek boşluk.
   * Sekmeli ekranlarda gerekmez: sekme çubuğu içeriğin üzerine binmez,
   * ekran alanı zaten çubuğun üstünde biter.
   */
  offsetBottom?: number;
}

export const FAB = ({ onPress, icon = 'add', label, offsetBottom = 0 }: FABProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        label ? styles.extended : styles.circle,
        { bottom: spacing.xl + offsetBottom },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.textInverse} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.xl,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.lg,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  extended: {
    height: 50,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
