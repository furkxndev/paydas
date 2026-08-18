import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

interface InviteCardProps {
  inviteCode: string;
  onCopy: () => void;
  onShare: () => void;
  onRegenerate?: () => void;
}

/** Davet kodunu gösteren ve paylaşmayı kolaylaştıran kart */
export const InviteCard = ({ inviteCode, onCopy, onShare, onRegenerate }: InviteCardProps) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View>
        <Text style={styles.label}>Davet kodu</Text>
        <Text style={styles.hint}>Ev arkadaşların bu kodla katılabilir</Text>
      </View>
      {onRegenerate ? (
        <Pressable onPress={onRegenerate} hitSlop={8} style={styles.refresh}>
          <Ionicons name="refresh" size={16} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>

    <Pressable onPress={onCopy} style={styles.codeRow}>
      <Text style={styles.code}>{inviteCode}</Text>
      <Ionicons name="copy-outline" size={20} color={colors.primary} />
    </Pressable>

    <View style={styles.actions}>
      <Pressable onPress={onCopy} style={[styles.action, styles.actionSecondary]}>
        <Ionicons name="copy-outline" size={16} color={colors.text} />
        <Text style={styles.actionLabel}>Kodu kopyala</Text>
      </Pressable>
      <Pressable onPress={onShare} style={[styles.action, styles.actionPrimary]}>
        <Ionicons name="share-social-outline" size={16} color={colors.textInverse} />
        <Text style={[styles.actionLabel, { color: colors.textInverse }]}>Daveti paylaş</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  refresh: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  code: {
    ...typography.display,
    color: colors.primary,
    fontSize: 30,
    letterSpacing: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 44,
    borderRadius: radius.md,
  },
  actionSecondary: {
    backgroundColor: colors.surfaceAlt,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionLabel: {
    ...typography.captionStrong,
    color: colors.text,
  },
});
