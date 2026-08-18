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
  ListRow,
  Screen,
} from '../../components';
import { getBillTypeMeta, getRecurrenceLabel } from '../../constants';
import { useAuth, useHousehold, useHouseholdData, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import {
  daysUntil,
  formatCurrency,
  formatDate,
  formatDueLabel,
  getFirstName,
  round2,
} from '../../utils';
import type { AppScreenProps } from '../../navigation/types';

export const BillDetailScreen = ({ navigation, route }: AppScreenProps<'BillDetail'>) => {
  const { billId } = route.params;
  const { user } = useAuth();
  const { currency, getMemberName, members } = useHousehold();
  const { bills, payBill, deleteBill } = useHouseholdData();
  const { showSuccess, showError } = useToast();

  const [confirmPay, setConfirmPay] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const bill = useMemo(() => bills.find((item) => item.id === billId), [bills, billId]);

  if (!bill) {
    return (
      <Screen scrollable>
        <AppHeader title="Fatura" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Fatura bulunamadı"
          description="Bu fatura silinmiş olabilir."
          actionLabel="Geri dön"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const meta = getBillTypeMeta(bill.type);
  const isPaid = bill.status === 'paid';
  const remaining = daysUntil(bill.dueDate);
  const participants = bill.participantIds.length
    ? bill.participantIds
    : members.map((m) => m.userId);
  const perPerson = round2(bill.amount / Math.max(participants.length, 1));

  const statusTone = isPaid
    ? 'success'
    : remaining < 0
      ? 'danger'
      : remaining <= 3
        ? 'warning'
        : 'neutral';

  const handlePay = async () => {
    setBusy(true);
    try {
      await payBill(bill.id, { paidBy: user?.id ?? '' });
      showSuccess(
        bill.autoCreateExpense
          ? 'Fatura ödendi ve ortak gidere yansıtıldı'
          : 'Fatura ödendi olarak işaretlendi',
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Fatura ödenemedi');
    } finally {
      setBusy(false);
      setConfirmPay(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteBill(bill.id);
      showSuccess('Fatura silindi');
      navigation.goBack();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Fatura silinemedi');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Screen scrollable>
      <AppHeader
        title="Fatura detayı"
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            icon="create-outline"
            onPress={() => navigation.navigate('AddBill', { billId: bill.id })}
            background={colors.surface}
            accessibilityLabel="Düzenle"
          />
        }
      />

      <Card style={styles.hero}>
        <View style={[styles.icon, { backgroundColor: meta.softColor }]}>
          <Ionicons name={meta.icon as never} size={26} color={meta.color} />
        </View>
        <Text style={typography.title}>{bill.name}</Text>
        <Text style={styles.amount}>{formatCurrency(bill.amount, currency)}</Text>
        <Badge
          label={isPaid ? 'Ödendi' : formatDueLabel(bill.dueDate)}
          tone={statusTone}
          icon={isPaid ? 'checkmark-circle' : remaining < 0 ? 'alert-circle' : 'time'}
          style={styles.heroBadge}
        />
      </Card>

      <Card style={styles.section} padded={false}>
        <View style={styles.rows}>
          <ListRow
            title="Son ödeme tarihi"
            icon="calendar-outline"
            value={formatDate(bill.dueDate)}
          />
          <ListRow
            title="Tekrar"
            icon="repeat-outline"
            value={getRecurrenceLabel(bill.recurrence)}
          />
          <ListRow
            title="Hatırlatma"
            icon="notifications-outline"
            value={`${bill.reminderDaysBefore} gün önce`}
          />
          <ListRow
            title="Kişi başı"
            icon="people-outline"
            value={formatCurrency(perPerson, currency)}
          />
          {isPaid && bill.paidBy ? (
            <ListRow
              title="Ödeyen"
              icon="checkmark-circle-outline"
              iconColor={colors.success}
              value={getFirstName(getMemberName(bill.paidBy))}
            />
          ) : null}
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={typography.heading}>Paylaşan üyeler</Text>
        {participants.map((userId) => (
          <View key={userId} style={styles.participantRow}>
            <Avatar name={getMemberName(userId)} seed={userId} size={34} />
            <Text style={[typography.body, styles.participantName]} numberOfLines={1}>
              {getMemberName(userId)}
              {userId === user?.id ? ' (sen)' : ''}
            </Text>
            <Text style={typography.bodyStrong}>{formatCurrency(perPerson, currency)}</Text>
          </View>
        ))}
      </Card>

      {bill.notes ? (
        <Card style={styles.section}>
          <Text style={typography.captionStrong}>Not</Text>
          <Text style={typography.body}>{bill.notes}</Text>
        </Card>
      ) : null}

      {bill.autoCreateExpense && !isPaid ? (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color={colors.info} />
          <Text style={styles.infoText}>
            Bu fatura ödendiğinde tutar otomatik olarak ortak giderlere eklenecek.
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {!isPaid ? (
          <Button
            label="Ödendi olarak işaretle"
            onPress={() => setConfirmPay(true)}
            icon="checkmark-circle"
            variant="success"
            size="lg"
            fullWidth
          />
        ) : null}
        <Button
          label="Faturayı sil"
          onPress={() => setConfirmDelete(true)}
          icon="trash-outline"
          variant="secondary"
          fullWidth
        />
      </View>

      <ConfirmDialog
        visible={confirmPay}
        title="Fatura ödendi mi?"
        message={`${bill.name} · ${formatCurrency(bill.amount, currency)}${
          bill.recurrence !== 'none'
            ? '\n\nBir sonraki dönem otomatik olarak oluşturulacak.'
            : ''
        }`}
        confirmLabel="Evet, ödendi"
        loading={busy}
        onConfirm={handlePay}
        onCancel={() => setConfirmPay(false)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="Fatura silinsin mi?"
        message="Bu işlem geri alınamaz."
        confirmLabel="Sil"
        destructive
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
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
  icon: {
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
  /** Badge varsayılan olarak alignSelf: 'flex-start' taşır; ortalanmış kartta ezilmeli */
  heroBadge: { alignSelf: 'center' },
  section: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  rows: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  participantName: { flex: 1 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
    fontSize: 12,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
