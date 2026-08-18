import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';
import { formatCurrency, getFirstName } from '../../utils';
import { Avatar } from '../ui/Avatar';

interface DebtRowProps {
  fromName: string;
  fromId: string;
  toName: string;
  toId: string;
  amount: number;
  currency: string;
  /** 'owe' = kullanıcı ödeyecek, 'receive' = kullanıcı tahsil edecek, 'other' = diğer üyeler arası */
  direction: 'owe' | 'receive' | 'other';
  onSettle?: () => void;
}

export const DebtRow = ({
  fromName,
  fromId,
  toName,
  toId,
  amount,
  currency,
  direction,
  onSettle,
}: DebtRowProps) => {
  const tone =
    direction === 'owe'
      ? colors.danger
      : direction === 'receive'
        ? colors.success
        : colors.textSecondary;

  const title =
    direction === 'owe'
      ? `${getFirstName(toName)} kişisine ödemen gerekiyor`
      : direction === 'receive'
        ? `${getFirstName(fromName)} sana ödeyecek`
        : `${getFirstName(fromName)} → ${getFirstName(toName)}`;

  return (
    <View style={styles.container}>
      <View style={styles.avatars}>
        <Avatar name={fromName} seed={fromId} size={34} />
        <View style={[styles.arrow, { backgroundColor: `${tone}1A` }]}>
          <Ionicons name="arrow-forward" size={12} color={tone} />
        </View>
        <Avatar name={toName} seed={toId} size={34} />
      </View>

      <View style={styles.content}>
        <Text style={typography.bodyStrong} numberOfLines={1}>
          {formatCurrency(amount, currency)}
        </Text>
        <Text style={typography.caption} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {onSettle ? (
        <Pressable onPress={onSettle} style={styles.settleButton} hitSlop={6}>
          <Text style={styles.settleLabel}>{direction === 'owe' ? 'Öde' : 'Kaydet'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  arrow: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 2 },
  settleButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  settleLabel: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
