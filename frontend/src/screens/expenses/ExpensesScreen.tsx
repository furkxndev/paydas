import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  ChipRow,
  EmptyState,
  ExpenseListItem,
  FAB,
  Input,
  ProgressBar,
  Screen,
  SegmentedControl,
} from '../../components';
import { EXPENSE_CATEGORIES, getCategoryMeta } from '../../constants';
import { useAuth, useExpenses, useHousehold } from '../../hooks';
import { colors, layout, radius, spacing, typography } from '../../theme';
import { formatCurrency, formatMonth, getFirstName } from '../../utils';
import type { ExpenseCategory } from '../../types';

export const ExpensesScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { currency, members, getMemberName } = useHousehold();
  const {
    expenses,
    total,
    breakdown,
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    refreshing,
    refresh,
  } = useExpenses();
  const [showFilters, setShowFilters] = useState(false);

  const categoryOptions = useMemo(
    () => [
      { key: 'all' as const, label: 'Tümü' },
      ...EXPENSE_CATEGORIES.map((category) => ({
        key: category.key,
        label: category.label,
        icon: category.icon as never,
        color: category.color,
      })),
    ],
    [],
  );

  const payerOptions = useMemo(
    () => [
      { key: 'all' as const, label: 'Herkes' },
      ...members.map((member) => ({
        key: member.userId,
        label: getFirstName(member.user.fullName),
      })),
    ],
    [members],
  );

  const myShareTotal = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) =>
          sum + (expense.shares.find((s) => s.userId === user?.id)?.amount ?? 0),
        0,
      ),
    [expenses, user?.id],
  );

  return (
    <Screen
      edgeToEdge
      floatingAction={
        <FAB onPress={() => navigation.navigate('AddExpense')} label="Gider ekle" />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={typography.title}>Giderler</Text>
            <Text style={typography.caption}>
              {filters.period === 'month' ? formatMonth(new Date()) : 'Tüm zamanlar'} ·{' '}
              {expenses.length} kayıt
            </Text>
          </View>
          <Pressable
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters((prev) => !prev)}
          >
            <Ionicons
              name={showFilters ? 'close' : 'options-outline'}
              size={20}
              color={hasActiveFilters ? colors.primary : colors.text}
            />
          </Pressable>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={typography.caption}>Toplam harcama</Text>
              <Text style={typography.title}>{formatCurrency(total, currency)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={typography.caption}>Senin payın</Text>
              <Text style={[typography.title, { color: colors.primary }]}>
                {formatCurrency(myShareTotal, currency)}
              </Text>
            </View>
          </View>

          {breakdown.length > 0 ? (
            <View style={styles.breakdown}>
              {breakdown.slice(0, 3).map((row) => {
                const meta = getCategoryMeta(row.category as ExpenseCategory);
                return (
                  <View key={row.category} style={styles.breakdownRow}>
                    <View style={styles.breakdownHeader}>
                      <Ionicons name={meta.icon as never} size={14} color={meta.color} />
                      <Text style={styles.breakdownLabel}>{meta.label}</Text>
                      <Text style={styles.breakdownValue}>
                        {formatCurrency(row.total, currency)}
                      </Text>
                    </View>
                    <ProgressBar progress={row.ratio} color={meta.color} height={5} />
                  </View>
                );
              })}
            </View>
          ) : null}
        </Card>

        <View style={styles.periodRow}>
          <SegmentedControl
            options={[
              { key: 'month', label: 'Bu ay' },
              { key: 'all', label: 'Tümü' },
            ]}
            value={filters.period}
            onChange={(period) => setFilters((prev) => ({ ...prev, period }))}
          />
        </View>

        {showFilters ? (
          <View style={styles.filterPanel}>
            <Input
              placeholder="Gider ara…"
              icon="search"
              value={filters.search}
              onChangeText={(search) => setFilters((prev) => ({ ...prev, search }))}
              autoCapitalize="none"
            />
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Kategori</Text>
              <ChipRow
                options={categoryOptions}
                value={filters.category}
                onChange={(category) => setFilters((prev) => ({ ...prev, category }))}
              />
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Ödeyen</Text>
              <ChipRow
                options={payerOptions}
                value={filters.paidBy}
                onChange={(paidBy) => setFilters((prev) => ({ ...prev, paidBy }))}
              />
            </View>
            {hasActiveFilters ? (
              <Pressable onPress={resetFilters} hitSlop={8}>
                <Text style={styles.clearFilters}>Filtreleri temizle</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refresh({ silent: true })}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="wallet-outline"
            title={hasActiveFilters ? 'Sonuç bulunamadı' : 'Henüz gider yok'}
            description={
              hasActiveFilters
                ? 'Filtreleri değiştirerek tekrar dene.'
                : 'İlk ortak gideri ekle; kimin ne kadar borçlu olduğunu Paydaş hesaplasın.'
            }
            actionLabel={hasActiveFilters ? 'Filtreleri temizle' : 'Gider ekle'}
            onAction={hasActiveFilters ? resetFilters : () => navigation.navigate('AddExpense')}
          />
        }
        renderItem={({ item }) => (
          <ExpenseListItem
            expense={item}
            currency={currency}
            payerName={getMemberName(item.paidBy)}
            isPaidByMe={item.paidBy === user?.id}
            myShare={item.shares.find((s) => s.userId === user?.id)?.amount}
            onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id })}
          />
        )}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  summaryCard: { gap: spacing.lg },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: { flex: 1, gap: 2 },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  breakdown: { gap: spacing.md },
  breakdownRow: { gap: spacing.xs },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownLabel: {
    ...typography.caption,
    flex: 1,
    color: colors.text,
  },
  breakdownValue: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  periodRow: {},
  filterPanel: {
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterGroup: { gap: spacing.sm },
  filterLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  clearFilters: {
    ...typography.captionStrong,
    color: colors.danger,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 100,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
