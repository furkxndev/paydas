import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getBillTypeMeta } from '../../constants';
import { Bill } from '../../types';
import { colors, radius, spacing, typography } from '../../theme';
import { daysUntil, formatCurrency, formatDate, formatDueLabel } from '../../utils';
import { Badge } from '../ui/Badge';

interface BillListItemProps {
  bill: Bill;
  currency: string;
  onPress?: () => void;
  /** Sağ tarafta hızlı "Ödendi" düğmesi */
  onQuickPay?: () => void;
  compact?: boolean;
}

const statusBadge = (bill: Bill) => {
  if (bill.status === 'paid') {
    return { label: 'Ödendi', tone: 'success' as const, icon: 'checkmark-circle' as const };
  }
  const remaining = daysUntil(bill.dueDate);
  if (remaining < 0) {
    return {
      label: formatDueLabel(bill.dueDate),
      tone: 'danger' as const,
      icon: 'alert-circle' as const,
    };
  }
  if (remaining <= 3) {
    return {
      label: formatDueLabel(bill.dueDate),
      tone: 'warning' as const,
      icon: 'time' as const,
    };
  }
  return {
    label: formatDueLabel(bill.dueDate),
    tone: 'neutral' as const,
    icon: 'calendar' as const,
  };
};

export const BillListItem = ({
  bill,
  currency,
  onPress,
  onQuickPay,
  compact = false,
}: BillListItemProps) => {
  const meta = getBillTypeMeta(bill.type);
  const badge = statusBadge(bill);
  const isPaid = bill.status === 'paid';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: meta.softColor }]}>
        <Ionicons name={meta.icon as never} size={20} color={meta.color} />
      </View>

      <View style={styles.content}>
        <Text style={[typography.bodyStrong, isPaid && styles.paidText]} numberOfLines={1}>
          {bill.name}
        </Text>
        {compact ? (
          <Badge label={badge.label} tone={badge.tone} icon={badge.icon} size="sm" />
        ) : (
          <View style={styles.metaRow}>
            <Badge label={badge.label} tone={badge.tone} icon={badge.icon} size="sm" />
            <Text style={styles.dueDate}>{formatDate(bill.dueDate)}</Text>
          </View>
        )}
      </View>

      <View style={styles.right}>
        <Text style={[typography.bodyStrong, isPaid && styles.paidText]}>
          {formatCurrency(bill.amount, currency)}
        </Text>
        {onQuickPay && !isPaid ? (
          <Pressable onPress={onQuickPay} hitSlop={6} style={styles.payButton}>
            <Text style={styles.payLabel}>Ödendi</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: spacing.xs },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dueDate: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  paidText: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  payButton: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
  },
  payLabel: {
    ...typography.captionStrong,
    color: colors.successDark,
    fontSize: 11,
  },
  pressed: { opacity: 0.7 },
});
