import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MemberBalance } from '../../types';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils';
import { Avatar } from '../ui/Avatar';
import { ProgressBar } from '../ui/ProgressBar';

interface MemberBalanceRowProps {
  balance: MemberBalance;
  name: string;
  currency: string;
  /** Grup içindeki en yüksek harcama; çubuk ölçeği için */
  maxPaid: number;
  isCurrentUser?: boolean;
}

export const MemberBalanceRow = ({
  balance,
  name,
  currency,
  maxPaid,
  isCurrentUser = false,
}: MemberBalanceRowProps) => {
  const settled = Math.abs(balance.net) < 0.01;
  const tone = settled
    ? colors.textSecondary
    : balance.net > 0
      ? colors.success
      : colors.danger;

  return (
    <View style={styles.container}>
      <Avatar name={name} seed={balance.userId} size={40} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={typography.bodyStrong} numberOfLines={1}>
            {isCurrentUser ? `${name} (sen)` : name}
          </Text>
          <Text style={[typography.bodyStrong, { color: tone }]}>
            {settled
              ? '—'
              : `${balance.net > 0 ? '+' : ''}${formatCurrency(balance.net, currency)}`}
          </Text>
        </View>
        <ProgressBar
          progress={maxPaid > 0 ? balance.paid / maxPaid : 0}
          color={tone}
          height={6}
        />
        <Text style={styles.detail}>
          Ödedi {formatCurrency(balance.paid, currency)} · Payı{' '}
          {formatCurrency(balance.owed, currency)}
        </Text>
      </View>
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
  content: { flex: 1, gap: spacing.xs },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  detail: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
});
