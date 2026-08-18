import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader, Button, Screen } from '../../components/ui';
import { INVITE_CODE_LENGTH } from '../../constants';
import { useHousehold, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';

export const JoinHouseholdScreen = () => {
  const navigation = useNavigation();
  const { joinHousehold, submitting } = useHousehold();
  const { showSuccess, showError } = useToast();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();

  const submit = async () => {
    if (code.trim().length < INVITE_CODE_LENGTH) {
      setError(`Davet kodu ${INVITE_CODE_LENGTH} karakter olmalı`);
      return;
    }
    try {
      const household = await joinHousehold({ inviteCode: code.trim() });
      showSuccess(`${household.name} evine katıldın`);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eve katılınamadı';
      setError(message);
      showError(message);
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader
        title="Eve katıl"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="key" size={26} color={colors.success} />
        </View>
        <Text style={typography.title}>Davet kodunu gir</Text>
        <Text style={[typography.caption, styles.centered]}>
          Ev arkadaşın uygulamadaki “Ev” sekmesinden davet kodunu paylaşabilir.
        </Text>
      </View>

      <TextInput
        value={code}
        onChangeText={(text) => {
          setCode(
            text
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, '')
              .slice(0, INVITE_CODE_LENGTH),
          );
          setError(undefined);
        }}
        placeholder="ABC123"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={INVITE_CODE_LENGTH}
        style={[styles.codeInput, Boolean(error) && styles.codeInputError]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label="Eve katıl"
        onPress={submit}
        loading={submitting}
        size="lg"
        fullWidth
        style={styles.submit}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centered: { textAlign: 'center', maxWidth: 300 },
  codeInput: {
    ...typography.inputLarge,
    height: 76,
    textAlign: 'center',
    letterSpacing: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  codeInputError: { borderColor: colors.danger },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  submit: { marginTop: spacing.xl },
});
