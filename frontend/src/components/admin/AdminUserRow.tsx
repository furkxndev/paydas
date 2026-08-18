import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminUserSummary } from '../../types';
import { colors, spacing, typography } from '../../theme';
import { formatRelativeDate } from '../../utils';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface AdminUserRowProps {
  row: AdminUserSummary;
  isCurrentUser?: boolean;
  onPress: () => void;
}

export const AdminUserRow = ({ row, isCurrentUser = false, onPress }: AdminUserRowProps) => {
  const { user } = row;
  const suspended = user.status === 'suspended';

  /** Kullanım özeti tek satırda, simge kalabalığı olmadan */
  const meta = [
    `${row.householdCount} ev`,
    `${row.expenseCount} gider`,
    row.lastActivityAt ? formatRelativeDate(row.lastActivityAt) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Avatar
        name={user.fullName}
        seed={user.id}
        size={46}
        style={suspended ? styles.dimmed : undefined}
      />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[typography.bodyStrong, styles.name, suspended && styles.dimmedText]}
            numberOfLines={1}
          >
            {user.fullName}
            {isCurrentUser ? ' (sen)' : ''}
          </Text>
          {user.platformRole === 'admin' ? (
            <Badge label="Yönetici" tone="primary" size="sm" />
          ) : null}
          {suspended ? <Badge label="Askıda" tone="danger" size="sm" /> : null}
        </View>

        <Text style={typography.caption} numberOfLines={1}>
          {user.email}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  content: { flex: 1, gap: 3 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  /** İsim uzunsa kısalsın, rozetler ezilmesin */
  name: { flexShrink: 1 },
  meta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  dimmed: { opacity: 0.5 },
  dimmedText: { color: colors.textSecondary },
  pressed: { opacity: 0.7 },
});
