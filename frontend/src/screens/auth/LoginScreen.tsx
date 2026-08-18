import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Button, Input, Screen } from '../../components/ui';
import { useAuth, useToast } from '../../hooks';
import { colors, spacing, typography } from '../../theme';
import { hasErrors, validateLogin, type ValidationErrors } from '../../utils';
import type { AuthScreenProps } from '../../navigation/types';

export const LoginScreen = ({ navigation }: AuthScreenProps<'Login'>) => {
  const { login, submitting } = useAuth();
  const { showError } = useToast();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<ValidationErrors<typeof values>>({});
  const [secure, setSecure] = useState(true);

  const setField = (field: keyof typeof values) => (text: string) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async () => {
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    try {
      await login({ email: values.email.trim(), password: values.password });
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Giriş yapılamadı');
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader title="" onBack={() => navigation.goBack()} />

      <View style={styles.intro}>
        <Text style={typography.display}>Tekrar hoş geldin</Text>
        <Text style={typography.caption}>Evinin güncel durumunu görmek için giriş yap.</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="E-posta"
          placeholder="ornek@eposta.com"
          icon="mail-outline"
          value={values.email}
          onChangeText={setField('email')}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input
          label="Şifre"
          placeholder="••••••"
          icon="lock-closed-outline"
          value={values.password}
          onChangeText={setField('password')}
          error={errors.password}
          secureTextEntry={secure}
          autoCapitalize="none"
          rightAction={{
            icon: secure ? 'eye-outline' : 'eye-off-outline',
            onPress: () => setSecure((prev) => !prev),
          }}
        />

        <Pressable
          onPress={() => navigation.navigate('ForgotPassword')}
          hitSlop={8}
          style={styles.forgotWrapper}
        >
          <Text style={styles.link}>Şifremi unuttum</Text>
        </Pressable>

        <Button
          label="Giriş yap"
          onPress={submit}
          loading={submitting}
          size="lg"
          fullWidth
          style={styles.submit}
        />
      </View>

      <View style={styles.footer}>
        <Text style={typography.caption}>Hesabın yok mu?</Text>
        <Pressable onPress={() => navigation.replace('Register')} hitSlop={8}>
          <Text style={styles.link}>Hesap oluştur</Text>
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  intro: {
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  form: { gap: spacing.lg },
  submit: { marginTop: spacing.sm },
  forgotWrapper: { alignSelf: 'flex-end' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxl,
  },
  link: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
