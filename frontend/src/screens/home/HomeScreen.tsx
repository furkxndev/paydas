import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  BalanceHeroCard,
  BillListItem,
  Card,
  ChoreListItem,
  EmptyState,
  ExpenseListItem,
  HomeHeader,
  LoadingState,
  QuickActions,
  Screen,
  SectionHeader,
  StatTile,
  type QuickAction,
} from '../../components';
import {
  useAuth,
  useBalances,
  useBills,
  useChores,
  useHousehold,
  useHouseholdData,
} from '../../hooks';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency, isWithinMonth } from '../../utils';

export const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { activeHousehold, currency, getMemberName } = useHousehold();
  const { summary, expenses, loading, refreshing, refresh, unreadCount } = useHouseholdData();
  const { totalOwed, totalReceivable } = useBalances();
  const { nextBills, payBill } = useBills();
  const { myPending, pending, toggleChore } = useChores();

  const recentExpenses = useMemo(() => expenses.slice(0, 4), [expenses]);

  const myMonthlyShare = useMemo(
    () =>
      expenses
        .filter((expense) => isWithinMonth(expense.date))
        .reduce(
          (total, expense) =>
            total + (expense.shares.find((s) => s.userId === user?.id)?.amount ?? 0),
          0,
        ),
    [expenses, user?.id],
  );

  const quickActions: QuickAction[] = [
    {
      key: 'expense',
      label: 'Gider ekle',
      icon: 'add-circle',
      color: colors.primary,
      background: colors.primarySoft,
      onPress: () => navigation.navigate('AddExpense'),
    },
    {
      key: 'bill',
      label: 'Fatura ekle',
      icon: 'receipt',
      color: colors.info,
      background: colors.infoSoft,
      onPress: () => navigation.navigate('AddBill'),
    },
    {
      key: 'chore',
      label: 'Görev ata',
      icon: 'clipboard',
      color: colors.accent,
      background: colors.accentSoft,
      onPress: () => navigation.navigate('AddChore'),
    },
    {
      key: 'settle',
      label: 'Borç öde',
      icon: 'swap-horizontal',
      color: colors.success,
      background: colors.successSoft,
      onPress: () => navigation.navigate('SettleUp'),
    },
  ];

  if (loading && expenses.length === 0) {
    return (
      <Screen>
        <LoadingState message="Evinin durumu yükleniyor…" />
      </Screen>
    );
  }

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
      <HomeHeader
        userName={user?.fullName ?? ''}
        userId={user?.id ?? ''}
        householdName={activeHousehold?.name ?? 'Evim'}
        unreadCount={unreadCount}
        onPressProfile={() => navigation.navigate('Tabs', { screen: 'Profile' })}
        onPressNotifications={() => navigation.navigate('Notifications')}
        onPressHousehold={() => navigation.navigate('Household')}
      />

      <BalanceHeroCard
        net={summary.myNet}
        totalOwed={totalOwed}
        totalReceivable={totalReceivable}
        currency={currency}
        monthTotal={summary.monthTotal}
        onPress={() => navigation.navigate('Balances')}
      />

      <View style={styles.section}>
        <QuickActions actions={quickActions} />
      </View>

      <View style={[styles.section, styles.tiles]}>
        <StatTile
          label="Bu ayki payın"
          value={formatCurrency(myMonthlyShare, currency)}
          icon="pie-chart"
          tone={colors.primary}
          toneSoft={colors.primarySoft}
          caption={`Ev toplamı ${formatCurrency(summary.monthTotal, currency)}`}
        />
        <StatTile
          label="Bekleyen fatura"
          value={String(summary.pendingBillsCount + summary.overdueBillsCount)}
          icon="document-text"
          tone={summary.overdueBillsCount > 0 ? colors.danger : colors.warning}
          toneSoft={summary.overdueBillsCount > 0 ? colors.dangerSoft : colors.warningSoft}
          caption={
            summary.overdueBillsCount > 0
              ? `${summary.overdueBillsCount} tanesi gecikmiş`
              : formatCurrency(summary.upcomingBillsTotal, currency)
          }
          onPress={() => navigation.navigate('Tabs', { screen: 'Bills' })}
        />
      </View>

      <View style={[styles.section, styles.tiles]}>
        <StatTile
          label="Sana ait ev işi"
          value={String(summary.myPendingChoresCount)}
          icon="checkmark-done-circle"
          tone={colors.accent}
          toneSoft={colors.accentSoft}
          caption={`Evde toplam ${pending.length} görev`}
          onPress={() => navigation.navigate('Tabs', { screen: 'Chores' })}
        />
        <StatTile
          label="Ev arkadaşların"
          value={String(summary.memberCount)}
          icon="people"
          tone={colors.success}
          toneSoft={colors.successSoft}
          caption="Üyeleri yönet"
          onPress={() => navigation.navigate('Household')}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Yaklaşan faturalar"
          actionLabel="Tümü"
          onAction={() => navigation.navigate('Tabs', { screen: 'Bills' })}
        />
        <Card padded={false} style={styles.listCard}>
          {nextBills.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="Bekleyen fatura yok"
              description="Düzenli ödemelerini ekleyerek son ödeme tarihlerini kaçırma."
              actionLabel="Fatura ekle"
              onAction={() => navigation.navigate('AddBill')}
              compact
            />
          ) : (
            nextBills.map((bill, index) => (
              <View key={bill.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <BillListItem
                  bill={bill}
                  currency={currency}
                  onPress={() => navigation.navigate('BillDetail', { billId: bill.id })}
                  onQuickPay={() =>
                    payBill(bill.id, { paidBy: user?.id ?? '' }).catch(() => undefined)
                  }
                />
              </View>
            ))
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Bugünün ev işleri"
          count={myPending.length}
          actionLabel="Tümü"
          onAction={() => navigation.navigate('Tabs', { screen: 'Chores' })}
        />
        <Card padded={false} style={styles.listCard}>
          {myPending.length === 0 ? (
            <EmptyState
              icon="sparkles-outline"
              title="Üzerinde görev yok"
              description="Şu an sana atanmış bekleyen bir ev işi bulunmuyor."
              actionLabel="Görev oluştur"
              onAction={() => navigation.navigate('AddChore')}
              compact
            />
          ) : (
            myPending.slice(0, 4).map((chore, index) => (
              <View key={chore.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <ChoreListItem
                  chore={chore}
                  assigneeName={chore.assignedTo ? getMemberName(chore.assignedTo) : undefined}
                  onToggle={() => toggleChore(chore.id, true)}
                  onPress={() => navigation.navigate('AddChore', { choreId: chore.id })}
                  hideAssignee
                />
              </View>
            ))
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Son harcamalar"
          actionLabel="Tümü"
          onAction={() => navigation.navigate('Tabs', { screen: 'Expenses' })}
        />
        <Card padded={false} style={styles.listCard}>
          {recentExpenses.length === 0 ? (
            <EmptyState
              icon="wallet-outline"
              title="Henüz harcama yok"
              description="İlk ortak gideri ekle, paylar otomatik hesaplansın."
              actionLabel="Gider ekle"
              onAction={() => navigation.navigate('AddExpense')}
              compact
            />
          ) : (
            recentExpenses.map((expense, index) => (
              <View key={expense.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <ExpenseListItem
                  expense={expense}
                  currency={currency}
                  payerName={getMemberName(expense.paidBy)}
                  isPaidByMe={expense.paidBy === user?.id}
                  myShare={expense.shares.find((s) => s.userId === user?.id)?.amount}
                  onPress={() =>
                    navigation.navigate('ExpenseDetail', { expenseId: expense.id })
                  }
                />
              </View>
            ))
          )}
        </Card>
      </View>

      <Text style={styles.footerNote}>
        Paydaş, ev arkadaşlarının parayı ve sorumlulukları birlikte yönetmesi için tasarlandı.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  listCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  footerNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});
