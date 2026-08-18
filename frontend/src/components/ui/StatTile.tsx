import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

interface StatTileProps {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: string;
  toneSoft?: string;
  caption?: string;
  onPress?: () => void;
}

/** Ana ekrandaki küçük özet kutucukları */
export const StatTile = ({
  label,
  value,
  icon,
  tone = colors.primary,
  toneSoft = colors.primarySoft,
  caption,
  onPress,
}: StatTileProps) => {
  const content = (
    <>
      <View style={styles.header}>
        {icon ? (
          <View style={[styles.iconWrapper, { backgroundColor: toneSoft }]}>
            <Ionicons name={icon} size={16} color={tone} />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      {caption ? (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.tile}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    flex: 1,
  },
  value: {
    ...typography.heading,
    fontSize: 20,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  pressed: { opacity: 0.85 },
});
