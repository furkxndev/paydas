import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  AppHeader,
  Card,
  DebtRow,
  EmptyState,
  MemberBalanceRow,
  Screen,
  SectionHeader,
} from '../../components';
import { useAuth, useBalances, useHousehold } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import { formatCurrency, formatDate, getFirstName } from '../../utils';
import type { AppScreenProps } from '../../navigation/types';

export const BalancesScreen = ({ navigation }: AppScreenProps<'Balances'>) => {
  const { user } = useAuth();
  const { currency, getMemberName } = useHousehold();
  const {
    balances,
    owes,
    isOwed,
    otherDebts,
    totalOwed,
    totalReceivable,
    settlements,
    myBalance,
    isSettled,
    refreshing,
    refresh,
  } = useBalances();

  const maxPaid = useMemo(
    () => Math.max(...balances.map((balance) => balance.paid), 1),
    [balances],
  );

  const netTone =
    Math.abs(myBalance.net) < 0.01
      ? colors.textSecondary
      : myBalance.net > 0
        ? colors.success
        : colors.danger;

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => refresh({ silent: true })}
          tintColor={colors.primary}
        />
      }
    >
      <AppHeader
        title="Borç durumu"
        subtitle="Kim kime ne kadar borçlu"
        onBack={() => navigation.goBack()}
        action={{
          icon: 'add',
          onPress: () => navigation.navigate('SettleUp'),
          label: 'Ödeme kaydet',
        }}
      />

      <Card style={styles.summaryCard}>
        <Text style={typography.caption}>Net durumun</Text>
        <Text style={[styles.net, { color: netTone }]}>
          {myBalance.net > 0 ? '+' : ''}
          {formatCurrency(myBalance.net, currency)}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={typography.caption}>Alacağın</Text>
            <Text style={typography.bodyStrong}>
              {formatCurrency(totalReceivable, currency)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <Text style={typography.caption}>Borcun</Text>
            <Text style={typography.bodyStrong}>{formatCurrency(totalOwed, currency)}</Text>
          </View>
        </View>
        <View style={styles.paidRow}>
          <Ionicons name="card-outline" size={14} color={colors.textMuted} />
          <Text style={styles.paidText}>
            Toplam {formatCurrency(myBalance.paid, currency)} ödedin, payına{' '}
            {formatCurrency(myBalance.owed, currency)} düştü.
          </Text>
        </View>
      </Card>

      {isSettled ? (
        <Card style={styles.section}>
          <EmptyState
            icon="checkmark-done-circle-outline"
            title="Tüm hesaplar kapalı"
            description="Evde kimsenin kimseye borcu yok. Yeni bir gider eklendiğinde burası güncellenir."
            compact
          />
        </Card>
      ) : null}

      {owes.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Ödemen gerekenler" count={owes.length} />
          <Card padded={false} style={styles.listCard}>
            {owes.map((debt, index) => (
              <View key={`${debt.fromUserId}-${debt.toUserId}`}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <DebtRow
                  fromId={debt.fromUserId}
                  fromName={getMemberName(debt.fromUserId)}
                  toId={debt.toUserId}
                  toName={getMemberName(debt.toUserId)}
                  amount={debt.amount}
                  currency={currency}
                  direction="owe"
                  onSettle={() =>
                    navigation.navigate('SettleUp', {
                      toUserId: debt.toUserId,
                      amount: debt.amount,
                    })
                  }
                />
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {isOwed.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Sana borçlu olanlar" count={isOwed.length} />
          <Card padded={false} style={styles.listCard}>
            {isOwed.map((debt, index) => (
              <View key={`${debt.fromUserId}-${debt.toUserId}`}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <DebtRow
                  fromId={debt.fromUserId}
                  fromName={getMemberName(debt.fromUserId)}
                  toId={debt.toUserId}
                  toName={getMemberName(debt.toUserId)}
                  amount={debt.amount}
                  currency={currency}
                  direction="receive"
                  onSettle={() =>
                    navigation.navigate('SettleUp', {
                      toUserId: user?.id,
                      amount: debt.amount,
                    })
                  }
                />
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {otherDebts.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Diğer üyeler arasında" count={otherDebts.length} />
          <Card padded={false} style={styles.listCard}>
            {otherDebts.map((debt, index) => (
              <View key={`${debt.fromUserId}-${debt.toUserId}`}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <DebtRow
                  fromId={debt.fromUserId}
                  fromName={getMemberName(debt.fromUserId)}
                  toId={debt.toUserId}
                  toName={getMemberName(debt.toUserId)}
                  amount={debt.amount}
                  currency={currency}
                  direction="other"
                />
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Üye bakiyeleri" subtitle="Ödenen / pay" />
        <Card padded={false} style={styles.listCard}>
          {balances.map((balance, index) => (
            <View key={balance.userId}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <MemberBalanceRow
                balance={balance}
                name={getMemberName(balance.userId)}
                currency={currency}
                maxPaid={maxPaid}
                isCurrentUser={balance.userId === user?.id}
              />
            </View>
          ))}
        </Card>
      </View>

      {settlements.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Ödeme geçmişi" count={settlements.length} />
          <Card padded={false} style={styles.listCard}>
            {settlements.slice(0, 8).map((settlement, index) => (
              <View key={settlement.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <View style={styles.settlementRow}>
                  <View style={styles.settlementIcon}>
                    <Ionicons name="swap-horizontal" size={16} color={colors.info} />
                  </View>
                  <View style={styles.settlementText}>
                    <Text style={typography.bodyStrong} numberOfLines={1}>
                      {getFirstName(getMemberName(settlement.fromUserId))} →{' '}
                      {getFirstName(getMemberName(settlement.toUserId))}
                    </Text>
                    <Text style={typography.caption} numberOfLines={1}>
                      {formatDate(settlement.settledAt)}
                      {settlement.note ? ` · ${settlement.note}` : ''}
                    </Text>
                  </View>
                  <Text style={typography.bodyStrong}>
                    {formatCurrency(settlement.amount, currency)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  net: {
    ...typography.display,
    fontSize: 34,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  paidText: {
    ...typography.caption,
    flex: 1,
    fontSize: 12,
  },
  section: { marginTop: spacing.xl },
  listCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  settlementIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlementText: { flex: 1, gap: 2 },
});
