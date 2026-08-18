import React, { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import {
  AmountInput,
  AppHeader,
  Button,
  Card,
  ChipRow,
  DateField,
  Input,
  MemberMultiSelect,
  Screen,
  SelectField,
} from '../../components';
import { BILL_TYPES, RECURRENCE_OPTIONS, REMINDER_DAY_OPTIONS } from '../../constants';
import { useHousehold, useHouseholdData, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import { formatCurrency, parseAmount, round2 } from '../../utils';
import type { BillRecurrence, BillType } from '../../types';
import type { AppScreenProps } from '../../navigation/types';

export const AddBillScreen = ({ navigation, route }: AppScreenProps<'AddBill'>) => {
  const billId = route.params?.billId;
  const isEditing = Boolean(billId);

  const { members, currency } = useHousehold();
  const { bills, addBill, editBill } = useHouseholdData();
  const { showSuccess, showError } = useToast();

  const existing = useMemo(() => bills.find((bill) => bill.id === billId), [bills, billId]);

  const defaultType: BillType = existing?.type ?? 'elektrik';

  const [type, setType] = useState<BillType>(defaultType);
  const [name, setName] = useState(
    () =>
      existing?.name ??
      `${BILL_TYPES.find((item) => item.key === defaultType)?.label} faturası`,
  );
  const [amountText, setAmountText] = useState(() =>
    existing ? String(existing.amount).replace('.', ',') : '',
  );
  const [dueDate, setDueDate] = useState<Date>(() =>
    existing ? new Date(existing.dueDate) : new Date(),
  );
  const [recurrence, setRecurrence] = useState<BillRecurrence>(
    () => existing?.recurrence ?? 'monthly',
  );
  const [participantIds, setParticipantIds] = useState<string[]>(
    () => existing?.participantIds ?? members.map((member) => member.userId),
  );
  const [reminderDays, setReminderDays] = useState(() => existing?.reminderDaysBefore ?? 3);
  const [autoCreateExpense, setAutoCreateExpense] = useState(
    () => existing?.autoCreateExpense ?? true,
  );
  const [notes, setNotes] = useState(() => existing?.notes ?? '');
  const [errors, setErrors] = useState<{
    name?: string;
    amount?: string;
    participants?: string;
  }>({});
  const [saving, setSaving] = useState(false);

  /** Tür değişince, kullanıcı adı elle değiştirmediyse başlığı da güncelle */
  const handleTypeChange = (nextType: BillType) => {
    const previousLabel = BILL_TYPES.find((item) => item.key === type)?.label;
    const nextLabel = BILL_TYPES.find((item) => item.key === nextType)?.label;
    setType(nextType);
    if (!name.trim() || name.trim() === `${previousLabel} faturası`) {
      setName(`${nextLabel} faturası`);
    }
  };

  const amount = parseAmount(amountText);
  const perPerson = participantIds.length > 0 ? round2(amount / participantIds.length) : 0;

  const submit = async () => {
    const nextErrors: typeof errors = {};
    if (name.trim().length < 2) nextErrors.name = 'Fatura adı en az 2 karakter olmalı';
    if (amount <= 0) nextErrors.amount = 'Tutar 0’dan büyük olmalı';
    if (participantIds.length === 0) nextErrors.participants = 'En az bir kişi seçmelisin';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        amount,
        dueDate: dueDate.toISOString(),
        recurrence,
        participantIds,
        reminderDaysBefore: reminderDays,
        autoCreateExpense,
        notes: notes.trim() || undefined,
      };

      if (isEditing && billId) {
        await editBill(billId, payload);
        showSuccess('Fatura güncellendi');
      } else {
        await addBill(payload);
        showSuccess('Fatura eklendi, hatırlatma kuruldu');
      }
      navigation.goBack();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Fatura kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader
        title={isEditing ? 'Faturayı düzenle' : 'Yeni fatura'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.form}>
        <AmountInput
          value={amountText}
          onChangeText={(text) => {
            setAmountText(text);
            setErrors((prev) => ({ ...prev, amount: undefined }));
          }}
          currency={currency}
          label="Fatura tutarı"
          error={errors.amount}
          autoFocus={!isEditing}
        />

        <SelectField
          label="Fatura türü"
          value={type}
          onChange={handleTypeChange}
          options={BILL_TYPES.map((item) => ({
            key: item.key,
            label: item.label,
            icon: item.icon as never,
            color: item.color,
          }))}
          sheetTitle="Fatura türü"
        />

        <Input
          label="Fatura adı"
          placeholder="Örn. Elektrik faturası"
          icon="text-outline"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
        />

        <DateField label="Son ödeme tarihi" value={dueDate} onChange={setDueDate} />

        <SelectField
          label="Tekrar"
          value={recurrence}
          onChange={setRecurrence}
          options={RECURRENCE_OPTIONS.map((item) => ({
            key: item.key,
            label: item.label,
            description:
              item.months > 0
                ? 'Ödendiğinde bir sonraki dönem otomatik oluşturulur'
                : 'Tek seferlik ödeme',
          }))}
          sheetTitle="Ne sıklıkla tekrarlansın?"
          icon="repeat"
        />

        <View style={styles.reminderBlock}>
          <Text style={styles.label}>Kaç gün önce hatırlatılsın?</Text>
          <ChipRow
            options={REMINDER_DAY_OPTIONS.map((days) => ({
              key: String(days),
              label: `${days} gün`,
            }))}
            value={String(reminderDays)}
            onChange={(value) => setReminderDays(Number(value))}
          />
        </View>

        <Card variant="outlined" style={styles.participantsCard}>
          <MemberMultiSelect
            label="Kimler paylaşıyor?"
            members={members}
            value={participantIds}
            onChange={(next) => {
              setParticipantIds(next);
              setErrors((prev) => ({ ...prev, participants: undefined }));
            }}
          />
          {amount > 0 && participantIds.length > 0 ? (
            <Text style={styles.perPerson}>
              Kişi başı {formatCurrency(perPerson, currency)}
            </Text>
          ) : null}
          {errors.participants ? <Text style={styles.error}>{errors.participants}</Text> : null}
        </Card>

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={typography.bodyStrong}>Ödenince ortak gidere ekle</Text>
            <Text style={typography.caption}>
              Fatura ödendi olarak işaretlendiğinde tutar otomatik olarak giderlere yazılır ve
              paylar hesaplanır.
            </Text>
          </View>
          <Switch
            value={autoCreateExpense}
            onValueChange={setAutoCreateExpense}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>

        <Input
          label="Not (isteğe bağlı)"
          placeholder="Abone no, ödeme yöntemi…"
          value={notes}
          onChangeText={setNotes}
          multiline
          multilineHeight={80}
        />

        <Button
          label={isEditing ? 'Değişiklikleri kaydet' : 'Faturayı kaydet'}
          onPress={submit}
          loading={saving}
          size="lg"
          fullWidth
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  reminderBlock: { gap: spacing.sm },
  participantsCard: { gap: spacing.md },
  perPerson: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchText: { flex: 1, gap: 2 },
});
