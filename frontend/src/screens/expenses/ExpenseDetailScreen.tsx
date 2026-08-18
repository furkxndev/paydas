import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppHeader,
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Screen,
} from '../../components';
import { getCategoryMeta } from '../../constants';
import { useAuth, useHousehold, useHouseholdData, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import { formatCurrency, formatDate, formatTime, getFirstName } from '../../utils';
import type { AppScreenProps } from '../../navigation/types';

const SPLIT_LABELS: Record<string, string> = {
  equal: 'Eşit bölüşüm',
  exact: 'Elle girilen tutarlar',
  percentage: 'Yüzdeye göre',
  shares: 'Paya göre',
};

export const ExpenseDetailScreen = ({ navigation, route }: AppScreenProps<'ExpenseDetail'>) => {
  const { expenseId } = route.params;
  const { user } = useAuth();
  const { currency, getMemberName } = useHousehold();
  const { expenses, deleteExpense } = useHouseholdData();
  const { showSuccess, showError } = useToast();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const expense = useMemo(
    () => expenses.find((item) => item.id === expenseId),
    [expenses, expenseId],
  );

  if (!expense) {
    return (
      <Screen scrollable>
        <AppHeader title="Gider" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Gider bulunamadı"
          description="Bu gider silinmiş olabilir."
          actionLabel="Geri dön"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const category = getCategoryMeta(expense.category);
  const myShare = expense.shares.find((share) => share.userId === user?.id)?.amount ?? 0;
  const isPayer = expense.paidBy === user?.id;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpense(expense.id);
      showSuccess('Gider silindi');
      navigation.goBack();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Gider silinemedi');
    } finally {
      setDeleting(false);
      setConfirmVisible(false);
    }
  };

  return (
    <Screen scrollable>
      <AppHeader
        title="Gider detayı"
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            icon="create-outline"
            onPress={() => navigation.navigate('AddExpense', { expenseId: expense.id })}
            background={colors.surface}
            accessibilityLabel="Düzenle"
          />
        }
      />

      <Card style={styles.hero}>
        <View style={[styles.categoryIcon, { backgroundColor: category.softColor }]}>
          <Ionicons name={category.icon as never} size={26} color={category.color} />
        </View>
        <Text style={typography.title}>{expense.title}</Text>
        <Text style={styles.amount}>{formatCurrency(expense.amount, currency)}</Text>
        <View style={styles.badges}>
          <Badge
            label={category.label}
            color={category.color}
            background={category.softColor}
          />
          <Badge label={SPLIT_LABELS[expense.splitType] ?? 'Bölüşüm'} tone="neutral" />
          {expense.billId ? <Badge label="Faturadan" tone="info" icon="receipt" /> : null}
        </View>
        {expense.description ? (
          <Text style={[typography.caption, styles.description]}>{expense.description}</Text>
        ) : null}
      </Card>

      <Card style={styles.section}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={typography.caption}>Ödeyen</Text>
            <View style={styles.payerRow}>
              <Avatar name={getMemberName(expense.paidBy)} seed={expense.paidBy} size={26} />
              <Text style={typography.bodyStrong}>
                {isPayer ? 'Sen' : getFirstName(getMemberName(expense.paidBy))}
              </Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Text style={typography.caption}>Tarih</Text>
            <Text style={typography.bodyStrong}>{formatDate(expense.date)}</Text>
          </View>
        </View>

        <View style={styles.myShareBox}>
          <Ionicons
            name={isPayer ? 'trending-up' : 'trending-down'}
            size={18}
            color={isPayer ? colors.success : colors.danger}
          />
          <Text style={typography.caption}>
            {isPayer
              ? `Sen ödedin. Diğer üyelerden toplam ${formatCurrency(
                  expense.amount - myShare,
                  currency,
                )} alacaklısın.`
              : myShare > 0
                ? `Bu giderdeki payın ${formatCurrency(myShare, currency)}.`
                : 'Bu gidere dahil değilsin.'}
          </Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={typography.heading}>Paylar</Text>
        {expense.shares.map((share) => {
          const name = getMemberName(share.userId);
          const isMe = share.userId === user?.id;
          return (
            <View key={share.userId} style={styles.shareRow}>
              <Avatar name={name} seed={share.userId} size={34} />
              <Text style={[typography.body, styles.shareName]} numberOfLines={1}>
                {isMe ? `${name} (sen)` : name}
              </Text>
              {typeof share.weight === 'number' && expense.splitType === 'percentage' ? (
                <Text style={styles.weight}>%{share.weight}</Text>
              ) : null}
              <Text style={typography.bodyStrong}>
                {formatCurrency(share.amount, currency)}
              </Text>
            </View>
          );
        })}
      </Card>

      <Text style={styles.createdAt}>
        {formatDate(expense.createdAt)} {formatTime(expense.createdAt)} tarihinde{' '}
        {getFirstName(getMemberName(expense.createdBy))} tarafından eklendi
      </Text>

      <Button
        label="Gideri sil"
        onPress={() => setConfirmVisible(true)}
        variant="danger"
        icon="trash-outline"
        fullWidth
        style={styles.deleteButton}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="Gider silinsin mi?"
        message="Bu işlem geri alınamaz ve borç hesapları yeniden hesaplanır."
        confirmLabel="Sil"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  amount: {
    ...typography.display,
    fontSize: 32,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  description: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: { flex: 1, gap: spacing.xs },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  myShareBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  shareName: { flex: 1 },
  weight: {
    ...typography.caption,
    color: colors.textMuted,
  },
  createdAt: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  deleteButton: { marginTop: spacing.lg },
});
