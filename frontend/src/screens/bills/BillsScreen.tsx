import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  BillListItem,
  Card,
  ConfirmDialog,
  EmptyState,
  FAB,
  Screen,
  SectionHeader,
  StatTile,
} from '../../components';
import { useAuth, useBills, useHousehold, useToast } from '../../hooks';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils';
import type { Bill } from '../../types';

interface Group {
  key: string;
  title: string;
  bills: Bill[];
  emptyHidden?: boolean;
}

export const BillsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { currency } = useHousehold();
  const { grouped, unpaidTotal, bills, payBill, refreshing, refresh } = useBills();
  const { showSuccess, showError } = useToast();
  const [payTarget, setPayTarget] = useState<Bill | null>(null);
  const [paying, setPaying] = useState(false);

  const groups: Group[] = [
    { key: 'overdue', title: 'Gecikmiş', bills: grouped.overdue },
    { key: 'upcoming', title: 'Bu hafta', bills: grouped.upcoming },
    { key: 'later', title: 'İlerleyen günler', bills: grouped.later },
    { key: 'paid', title: 'Ödenmiş', bills: grouped.paid },
  ];

  const confirmPay = async () => {
    if (!payTarget) return;
    setPaying(true);
    try {
      await payBill(payTarget.id, { paidBy: user?.id ?? '' });
      showSuccess(
        payTarget.autoCreateExpense
          ? 'Fatura ödendi ve ortak gidere yansıtıldı'
          : 'Fatura ödendi olarak işaretlendi',
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Fatura ödenemedi');
    } finally {
      setPaying(false);
      setPayTarget(null);
    }
  };

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
      contentContainerStyle={styles.content}
      floatingAction={
        <FAB onPress={() => navigation.navigate('AddBill')} label="Fatura ekle" />
      }
    >
      <View style={styles.header}>
        <Text style={typography.title}>Faturalar</Text>
        <Text style={typography.caption}>Düzenli ödemelerini takip et, son tarihi kaçırma</Text>
      </View>

      <View style={styles.tiles}>
        <StatTile
          label="Ödenmemiş toplam"
          value={formatCurrency(unpaidTotal, currency)}
          icon="wallet"
          tone={colors.primary}
          toneSoft={colors.primarySoft}
          caption={`${grouped.overdue.length + grouped.upcoming.length + grouped.later.length} fatura`}
        />
        <StatTile
          label="Gecikmiş"
          value={String(grouped.overdue.length)}
          icon="alert-circle"
          tone={grouped.overdue.length > 0 ? colors.danger : colors.success}
          toneSoft={grouped.overdue.length > 0 ? colors.dangerSoft : colors.successSoft}
          caption={grouped.overdue.length > 0 ? 'Hemen ödenmeli' : 'Gecikmiş faturan yok'}
        />
      </View>

      {bills.length === 0 ? (
        <Card style={styles.emptyCard}>
          <EmptyState
            icon="receipt-outline"
            title="Henüz fatura yok"
            description="Elektrik, su, doğalgaz, internet ve kira gibi düzenli ödemelerini ekle; son ödeme tarihi yaklaşınca Paydaş seni uyarsın."
            actionLabel="İlk faturayı ekle"
            onAction={() => navigation.navigate('AddBill')}
          />
        </Card>
      ) : (
        groups
          .filter((group) => group.bills.length > 0)
          .map((group) => (
            <View key={group.key} style={styles.section}>
              <SectionHeader title={group.title} count={group.bills.length} />
              <Card padded={false} style={styles.listCard}>
                {group.bills.map((bill, index) => (
                  <View key={bill.id}>
                    {index > 0 ? <View style={styles.separator} /> : null}
                    <BillListItem
                      bill={bill}
                      currency={currency}
                      onPress={() => navigation.navigate('BillDetail', { billId: bill.id })}
                      onQuickPay={() => setPayTarget(bill)}
                    />
                  </View>
                ))}
              </Card>
            </View>
          ))
      )}

      {bills.length > 0 ? (
        <View style={styles.hint}>
          <Ionicons name="notifications-outline" size={16} color={colors.textMuted} />
          <Text style={styles.hintText}>
            Bildirimler açıkken son ödeme tarihinden önce hatırlatma alırsın.
          </Text>
        </View>
      ) : null}

      <ConfirmDialog
        visible={Boolean(payTarget)}
        title="Fatura ödendi mi?"
        message={
          payTarget
            ? `${payTarget.name} · ${formatCurrency(payTarget.amount, currency)}${
                payTarget.autoCreateExpense
                  ? '\n\nBu tutar ortak gider olarak eklenecek ve üyeler arasında bölüşülecek.'
                  : ''
              }`
            : undefined
        }
        confirmLabel="Ödendi olarak işaretle"
        loading={paying}
        onConfirm={confirmPay}
        onCancel={() => setPayTarget(null)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 100 },
  header: {
    gap: 2,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
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
  emptyCard: { marginTop: spacing.xl },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  hintText: {
    ...typography.caption,
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
  },
});
