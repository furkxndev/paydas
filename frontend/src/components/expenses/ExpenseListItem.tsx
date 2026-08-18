import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getCategoryMeta } from '../../constants';
import { Expense } from '../../types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatCurrency, formatRelativeDate, getFirstName } from '../../utils';

interface ExpenseListItemProps {
  expense: Expense;
  currency: string;
  payerName: string;
  /** Aktif kullanıcının bu giderdeki payı */
  myShare?: number;
  isPaidByMe?: boolean;
  onPress?: () => void;
}

export const ExpenseListItem = ({
  expense,
  currency,
  payerName,
  myShare,
  isPaidByMe = false,
  onPress,
}: ExpenseListItemProps) => {
  const category = getCategoryMeta(expense.category);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: category.softColor }]}>
        <Ionicons name={category.icon as never} size={20} color={category.color} />
      </View>

      <View style={styles.content}>
        <Text style={typography.bodyStrong} numberOfLines={1}>
          {expense.title}
        </Text>
        <Text style={typography.caption} numberOfLines={1}>
          {isPaidByMe ? 'Sen ödedin' : `${getFirstName(payerName)} ödedi`} ·{' '}
          {formatRelativeDate(expense.date)}
        </Text>
      </View>

      <View style={styles.amounts}>
        <Text style={typography.bodyStrong}>{formatCurrency(expense.amount, currency)}</Text>
        {typeof myShare === 'number' && myShare > 0 ? (
          <Text style={styles.share}>Payın {formatCurrency(myShare, currency)}</Text>
        ) : (
          <Text style={styles.share}>Dahil değilsin</Text>
        )}
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
  content: { flex: 1, gap: 2 },
  amounts: { alignItems: 'flex-end', gap: 2 },
  share: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  pressed: { opacity: 0.7 },
});
