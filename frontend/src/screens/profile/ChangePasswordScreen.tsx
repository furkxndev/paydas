import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader, Button, Input, Screen } from '../../components/ui';
import { useAuth, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import type { AppScreenProps } from '../../navigation/types';

export const ChangePasswordScreen = ({ navigation }: AppScreenProps<'ChangePassword'>) => {
  const { changePassword, submitting } = useAuth();
  const { showSuccess, showError } = useToast();

  const [values, setValues] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>(
    {},
  );
  const [secure, setSecure] = useState(true);

  const setField = (field: keyof typeof values) => (text: string) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async () => {
    const next: typeof errors = {};
    if (!values.current) next.current = 'Mevcut şifreni gir';
    if (values.next.length < 6) next.next = 'Yeni şifre en az 6 karakter olmalı';
    if (values.next !== values.confirm) next.confirm = 'Şifreler eşleşmiyor';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await changePassword({ currentPassword: values.current, newPassword: values.next });
      showSuccess('Şifren değiştirildi. Diğer cihazlardaki oturumlar kapatıldı.');
      navigation.goBack();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Şifre değiştirilemedi');
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader title="Şifre değiştir" onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <Input
          label="Mevcut şifre"
          icon="lock-closed-outline"
          value={values.current}
          onChangeText={setField('current')}
          error={errors.current}
          secureTextEntry={secure}
          autoCapitalize="none"
          rightAction={{
            icon: secure ? 'eye-outline' : 'eye-off-outline',
            onPress: () => setSecure((prev) => !prev),
          }}
        />
        <Input
          label="Yeni şifre"
          placeholder="En az 6 karakter"
          icon="key-outline"
          value={values.next}
          onChangeText={setField('next')}
          error={errors.next}
          secureTextEntry={secure}
          autoCapitalize="none"
        />
        <Input
          label="Yeni şifre tekrar"
          icon="key-outline"
          value={values.confirm}
          onChangeText={setField('confirm')}
          error={errors.confirm}
          secureTextEntry={secure}
          autoCapitalize="none"
        />

        <View style={styles.note}>
          <Text style={typography.caption}>
            Şifreni değiştirdiğinde güvenlik için tüm cihazlardaki oturumların kapatılır; bu
            cihazda açık kalırsın.
          </Text>
        </View>

        <Button
          label="Şifreyi değiştir"
          onPress={submit}
          loading={submitting}
          size="lg"
          fullWidth
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  form: { gap: spacing.lg, paddingBottom: spacing.xxl },
  note: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
});
