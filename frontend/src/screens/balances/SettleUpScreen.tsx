import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AmountInput,
  AppHeader,
  Avatar,
  Button,
  Card,
  Input,
  MemberSelect,
  Screen,
} from '../../components';
import { useAuth, useBalances, useHousehold, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import { formatCurrency, getFirstName, parseAmount } from '../../utils';
import type { AppScreenProps } from '../../navigation/types';

export const SettleUpScreen = ({ navigation, route }: AppScreenProps<'SettleUp'>) => {
  const { user } = useAuth();
  const { members, currency, getMemberName } = useHousehold();
  const { debts, settleDebt } = useBalances();
  const { showSuccess, showError } = useToast();

  const [fromUserId, setFromUserId] = useState(user?.id ?? '');
  const [toUserId, setToUserId] = useState(route.params?.toUserId ?? '');
  const [amountText, setAmountText] = useState(
    route.params?.amount ? String(route.params.amount).replace('.', ',') : '',
  );
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const amount = parseAmount(amountText);

  const receivers = useMemo(
    () => members.filter((member) => member.userId !== fromUserId),
    [members, fromUserId],
  );

  /** Seçilen iki kişi arasında hesaplanan güncel borç */
  const suggestedDebt = useMemo(
    () =>
      debts.find((debt) => debt.fromUserId === fromUserId && debt.toUserId === toUserId)
        ?.amount,
    [debts, fromUserId, toUserId],
  );

  const submit = async () => {
    if (!fromUserId || !toUserId) {
      setError('Ödeyen ve alan kişiyi seç');
      return;
    }
    if (fromUserId === toUserId) {
      setError('Ödeyen ve alan kişi aynı olamaz');
      return;
    }
    if (amount <= 0) {
      setError('Tutar 0’dan büyük olmalı');
      return;
    }

    setSaving(true);
    try {
      await settleDebt({ fromUserId, toUserId, amount, note: note.trim() || undefined });
      showSuccess('Ödeme kaydedildi, bakiyeler güncellendi');
      navigation.goBack();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ödeme kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader
        title="Ödeme kaydet"
        subtitle="Nakit veya havale ile yapılan ödemeyi işle"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.form}>
        <AmountInput
          value={amountText}
          onChangeText={(text) => {
            setAmountText(text);
            setError(undefined);
          }}
          currency={currency}
          label="Ödenen tutar"
          error={error}
        />

        {suggestedDebt && Math.abs(suggestedDebt - amount) > 0.01 ? (
          <Card variant="outlined" style={styles.suggestion}>
            <Ionicons name="information-circle" size={18} color={colors.info} />
            <Text style={styles.suggestionText}>
              Hesaplanan borç {formatCurrency(suggestedDebt, currency)}.
            </Text>
            <Text
              style={styles.suggestionAction}
              onPress={() => setAmountText(String(suggestedDebt).replace('.', ','))}
            >
              Uygula
            </Text>
          </Card>
        ) : null}

        <MemberSelect
          label="Kim ödedi?"
          members={members}
          value={fromUserId}
          onChange={(userId) => {
            setFromUserId(userId);
            if (userId === toUserId) setToUserId('');
            setError(undefined);
          }}
        />

        <MemberSelect
          label="Kime ödendi?"
          members={receivers}
          value={toUserId}
          onChange={(userId) => {
            setToUserId(userId);
            setError(undefined);
          }}
        />

        {fromUserId && toUserId ? (
          <Card style={styles.preview}>
            <Avatar name={getMemberName(fromUserId)} seed={fromUserId} size={40} />
            <View style={styles.previewArrow}>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </View>
            <Avatar name={getMemberName(toUserId)} seed={toUserId} size={40} />
            <View style={styles.previewText}>
              <Text style={typography.bodyStrong}>{formatCurrency(amount, currency)}</Text>
              <Text style={typography.caption} numberOfLines={1}>
                {getFirstName(getMemberName(fromUserId))} →{' '}
                {getFirstName(getMemberName(toUserId))}
              </Text>
            </View>
          </Card>
        ) : null}

        <Input
          label="Not (isteğe bağlı)"
          placeholder="Örn. Kira payı - havale"
          icon="chatbox-outline"
          value={note}
          onChangeText={setNote}
        />

        <Button label="Ödemeyi kaydet" onPress={submit} loading={saving} size="lg" fullWidth />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  suggestionText: {
    ...typography.caption,
    flex: 1,
  },
  suggestionAction: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewArrow: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    flex: 1,
    marginLeft: spacing.sm,
    gap: 2,
  },
});
