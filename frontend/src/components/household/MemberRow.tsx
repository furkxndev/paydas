import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HouseholdMember, MemberRole } from '../../types';
import { colors, spacing, typography } from '../../theme';
import { formatDate } from '../../utils';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Ev sahibi',
  admin: 'Yönetici',
  member: 'Üye',
};

interface MemberRowProps {
  member: HouseholdMember;
  isCurrentUser?: boolean;
  /** Yönetici görünümünde üyeyi çıkarma eylemi */
  onRemove?: () => void;
  balanceLabel?: string;
  balanceColor?: string;
}

export const MemberRow = ({
  member,
  isCurrentUser = false,
  onRemove,
  balanceLabel,
  balanceColor,
}: MemberRowProps) => (
  <View style={styles.container}>
    <Avatar name={member.user.fullName} seed={member.userId} size={44} />
    <View style={styles.content}>
      <View style={styles.nameRow}>
        <Text style={typography.bodyStrong} numberOfLines={1}>
          {member.user.fullName}
          {isCurrentUser ? ' (sen)' : ''}
        </Text>
        {member.role !== 'member' ? (
          <Badge
            label={ROLE_LABELS[member.role]}
            tone={member.role === 'owner' ? 'primary' : 'info'}
            size="sm"
          />
        ) : null}
      </View>
      <Text style={typography.caption} numberOfLines={1}>
        {balanceLabel ?? `${formatDate(member.joinedAt)} tarihinde katıldı`}
      </Text>
    </View>
    {balanceLabel && balanceColor ? (
      <View style={[styles.balanceDot, { backgroundColor: balanceColor }]} />
    ) : null}
    {onRemove ? (
      <Pressable onPress={onRemove} hitSlop={8}>
        <Ionicons name="remove-circle-outline" size={22} color={colors.danger} />
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  content: { flex: 1, gap: 2 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
