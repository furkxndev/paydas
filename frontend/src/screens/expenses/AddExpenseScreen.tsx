import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  AmountInput,
  AppHeader,
  Button,
  Card,
  DateField,
  Input,
  MemberMultiSelect,
  MemberSelect,
  Screen,
  SegmentedControl,
  SelectField,
} from '../../components';
import { EXPENSE_CATEGORIES } from '../../constants';
import { useAuth, useHousehold, useHouseholdData, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import {
  buildShares,
  formatCurrency,
  getFirstName,
  getShareDifference,
  parseAmount,
  round2,
  sumShares,
} from '../../utils';
import type { ExpenseCategory, SplitType } from '../../types';
import type { AppScreenProps } from '../../navigation/types';

const SPLIT_OPTIONS: { key: SplitType; label: string }[] = [
  { key: 'equal', label: 'Eşit böl' },
  { key: 'exact', label: 'Tutar gir' },
  { key: 'percentage', label: 'Yüzde' },
];

export const AddExpenseScreen = ({ navigation, route }: AppScreenProps<'AddExpense'>) => {
  const expenseId = route.params?.expenseId;
  const isEditing = Boolean(expenseId);

  const { user } = useAuth();
  const { members, currency } = useHousehold();
  const { expenses, addExpense, editExpense } = useHouseholdData();
  const { showSuccess, showError } = useToast();

  const existing = useMemo(
    () => expenses.find((expense) => expense.id === expenseId),
    [expenses, expenseId],
  );

  // Düzenleme modunda form mevcut gider ile, aksi halde varsayılanlarla başlar
  const [amountText, setAmountText] = useState(() =>
    existing ? String(existing.amount).replace('.', ',') : '',
  );
  const [title, setTitle] = useState(() => existing?.title ?? '');
  const [description, setDescription] = useState(() => existing?.description ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(
    () => existing?.category ?? 'market',
  );
  const [paidBy, setPaidBy] = useState<string>(() => existing?.paidBy ?? user?.id ?? '');
  const [date, setDate] = useState<Date>(() =>
    existing ? new Date(existing.date) : new Date(),
  );
  const [splitType, setSplitType] = useState<SplitType>(() => existing?.splitType ?? 'equal');
  const [participantIds, setParticipantIds] = useState<string[]>(() =>
    existing
      ? existing.shares.map((share) => share.userId)
      : members.map((member) => member.userId),
  );
  const [weights, setWeights] = useState<Record<string, string>>(() =>
    existing
      ? Object.fromEntries(
          existing.shares.map((share) => [
            share.userId,
            String(existing.splitType === 'exact' ? share.amount : (share.weight ?? 0)).replace(
              '.',
              ',',
            ),
          ]),
        )
      : {},
  );
  const [errors, setErrors] = useState<{ amount?: string; title?: string; shares?: string }>(
    {},
  );
  const [saving, setSaving] = useState(false);

  const amount = parseAmount(amountText);

  const numericWeights = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(weights).map(([userId, value]) => [userId, parseAmount(value)]),
      ),
    [weights],
  );

  const shares = useMemo(
    () => buildShares(amount, splitType, participantIds, numericWeights),
    [amount, splitType, participantIds, numericWeights],
  );

  const difference = useMemo(
    () => (splitType === 'exact' ? getShareDifference(amount, shares) : 0),
    [amount, shares, splitType],
  );

  const percentageTotal = useMemo(
    () =>
      splitType === 'percentage'
        ? participantIds.reduce((sum, id) => sum + (numericWeights[id] ?? 0), 0)
        : 0,
    [numericWeights, participantIds, splitType],
  );

  const shareOf = (userId: string): number =>
    shares.find((share) => share.userId === userId)?.amount ?? 0;

  const validate = (): boolean => {
    const nextErrors: typeof errors = {};
    if (amount <= 0) nextErrors.amount = 'Tutar 0’dan büyük olmalı';
    if (title.trim().length < 2) nextErrors.title = 'Başlık en az 2 karakter olmalı';
    if (participantIds.length === 0) nextErrors.shares = 'En az bir kişi seçmelisin';
    if (splitType === 'exact' && Math.abs(difference) > 0.01) {
      nextErrors.shares = `Payların toplamı tutarla eşleşmiyor (${formatCurrency(
        difference,
        currency,
      )} fark)`;
    }
    if (splitType === 'percentage' && Math.abs(percentageTotal - 100) > 0.5) {
      nextErrors.shares = `Yüzdelerin toplamı %100 olmalı (şu an %${round2(percentageTotal)})`;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        amount,
        category,
        paidBy,
        date: date.toISOString(),
        splitType,
        shares,
        participantIds,
      };

      if (isEditing && expenseId) {
        await editExpense(expenseId, payload);
        showSuccess('Gider güncellendi');
      } else {
        await addExpense(payload);
        showSuccess('Gider eklendi, paylar hesaplandı');
      }
      navigation.goBack();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Gider kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader
        title={isEditing ? 'Gideri düzenle' : 'Yeni gider'}
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
          error={errors.amount}
          autoFocus={!isEditing}
        />

        <Input
          label="Başlık"
          placeholder="Örn. Haftalık market alışverişi"
          icon="text-outline"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          error={errors.title}
        />

        <SelectField
          label="Kategori"
          value={category}
          onChange={setCategory}
          options={EXPENSE_CATEGORIES.map((item) => ({
            key: item.key,
            label: item.label,
            icon: item.icon as never,
            color: item.color,
          }))}
          sheetTitle="Kategori seç"
        />

        <MemberSelect
          label="Kim ödedi?"
          members={members}
          value={paidBy}
          onChange={setPaidBy}
        />

        <DateField label="Tarih" value={date} onChange={setDate} quickOptions={false} />

        <View style={styles.splitBlock}>
          <Text style={styles.label}>Nasıl bölünsün?</Text>
          <SegmentedControl
            options={SPLIT_OPTIONS}
            value={splitType}
            onChange={(next) => {
              setSplitType(next);
              setErrors((prev) => ({ ...prev, shares: undefined }));
              if (next === 'percentage') {
                const equalPercent = round2(100 / Math.max(participantIds.length, 1));
                setWeights(
                  Object.fromEntries(
                    participantIds.map((id) => [id, String(equalPercent).replace('.', ',')]),
                  ),
                );
              }
              if (next === 'exact') {
                setWeights(
                  Object.fromEntries(
                    participantIds.map((id) => [
                      id,
                      String(round2(amount / Math.max(participantIds.length, 1))).replace(
                        '.',
                        ',',
                      ),
                    ]),
                  ),
                );
              }
            }}
          />
        </View>

        <Card variant="outlined" style={styles.sharesCard}>
          <MemberMultiSelect
            label="Kimler paylaşıyor?"
            members={members}
            value={participantIds}
            onChange={(next) => {
              setParticipantIds(next);
              setErrors((prev) => ({ ...prev, shares: undefined }));
            }}
            renderTrailing={(member) => {
              if (!participantIds.includes(member.userId)) return null;

              if (splitType === 'equal') {
                return (
                  <Text style={styles.shareAmount}>
                    {formatCurrency(shareOf(member.userId), currency)}
                  </Text>
                );
              }

              return (
                <View style={styles.weightInputWrapper}>
                  <TextInput
                    value={weights[member.userId] ?? ''}
                    onChangeText={(text) =>
                      setWeights((prev) => ({
                        ...prev,
                        [member.userId]: text.replace(/[^\d,.]/g, '').replace('.', ','),
                      }))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    style={styles.weightInput}
                  />
                  <Text style={styles.weightSuffix}>
                    {splitType === 'percentage' ? '%' : currency === 'TRY' ? '₺' : ''}
                  </Text>
                </View>
              );
            }}
          />

          <View style={styles.summaryRow}>
            <Text style={typography.caption}>
              {participantIds.length} kişi ·{' '}
              {splitType === 'percentage'
                ? `Toplam %${round2(percentageTotal)}`
                : `Dağıtılan ${formatCurrency(sumShares(shares), currency)}`}
            </Text>
            {splitType === 'exact' && Math.abs(difference) > 0.01 ? (
              <Text style={styles.difference}>
                {difference > 0 ? 'Eksik' : 'Fazla'}{' '}
                {formatCurrency(Math.abs(difference), currency)}
              </Text>
            ) : null}
          </View>

          {errors.shares ? <Text style={styles.error}>{errors.shares}</Text> : null}
        </Card>

        <Input
          label="Not (isteğe bağlı)"
          placeholder="Detay eklemek istersen…"
          value={description}
          onChangeText={setDescription}
          multiline
          multilineHeight={84}
        />

        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Özet</Text>
          <Text style={typography.caption}>
            {getFirstName(members.find((m) => m.userId === paidBy)?.user.fullName ?? '')}{' '}
            {formatCurrency(amount, currency)} ödedi, {participantIds.length} kişi paylaşıyor.
            {participantIds.includes(user?.id ?? '')
              ? ` Senin payın ${formatCurrency(shareOf(user?.id ?? ''), currency)}.`
              : ' Bu gidere dahil değilsin.'}
          </Text>
        </View>

        <Button
          label={isEditing ? 'Değişiklikleri kaydet' : 'Gideri kaydet'}
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
  splitBlock: { gap: spacing.sm },
  sharesCard: { gap: spacing.md },
  shareAmount: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  weightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 78,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  weightInput: {
    ...typography.inputStrong,
    flex: 1,
    textAlign: 'right',
    padding: 0,
  },
  weightSuffix: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  difference: {
    ...typography.captionStrong,
    color: colors.danger,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  previewBox: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  previewTitle: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
