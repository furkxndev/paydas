import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader, Button, Input, Screen } from '../../components/ui';
import { useHousehold, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';

const CURRENCIES = ['TRY', 'USD', 'EUR'];

export const CreateHouseholdScreen = () => {
  const navigation = useNavigation();
  const { createHousehold, submitting } = useHousehold();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [error, setError] = useState<string | undefined>();

  const submit = async () => {
    if (name.trim().length < 2) {
      setError('Ev adı en az 2 karakter olmalı');
      return;
    }
    try {
      const household = await createHousehold({
        name: name.trim(),
        address: address.trim() || undefined,
        currency,
      });
      showSuccess(`${household.name} oluşturuldu. Davet kodu: ${household.inviteCode}`);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ev oluşturulamadı');
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader
        title="Yeni ev"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <View style={styles.intro}>
        <Text style={typography.title}>Evini tanımla</Text>
        <Text style={typography.caption}>
          Ev adı, ev arkadaşlarının uygulamada göreceği isimdir. Sonradan değiştirebilirsin.
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Ev adı"
          placeholder="Örn. Bahçelievler Evi"
          icon="home-outline"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(undefined);
          }}
          error={error}
          autoCapitalize="words"
        />
        <Input
          label="Adres (isteğe bağlı)"
          placeholder="Mahalle, sokak, no"
          icon="location-outline"
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.currencyBlock}>
          <Text style={styles.label}>Para birimi</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map((code) => {
              const selected = code === currency;
              return (
                <Text
                  key={code}
                  onPress={() => setCurrency(code)}
                  style={[styles.currency, selected && styles.currencySelected]}
                >
                  {code}
                </Text>
              );
            })}
          </View>
        </View>

        <Button
          label="Evi oluştur"
          onPress={submit}
          loading={submitting}
          size="lg"
          fullWidth
          style={styles.submit}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  intro: {
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  form: { gap: spacing.lg },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  currencyBlock: { gap: spacing.sm },
  currencyRow: { flexDirection: 'row', gap: spacing.sm },
  currency: {
    ...typography.bodyStrong,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    overflow: 'hidden',
  },
  currencySelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
  },
  submit: { marginTop: spacing.sm },
});
