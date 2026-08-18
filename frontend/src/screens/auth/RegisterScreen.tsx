import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Button, Input, Screen } from '../../components/ui';
import { useAuth, useToast } from '../../hooks';
import { colors, spacing, typography } from '../../theme';
import { hasErrors, validateRegister, type ValidationErrors } from '../../utils';
import type { AuthScreenProps } from '../../navigation/types';

export const RegisterScreen = ({ navigation }: AuthScreenProps<'Register'>) => {
  const { register, submitting } = useAuth();
  const { showError } = useToast();
  const [values, setValues] = useState({
    fullName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState<ValidationErrors<typeof values>>({});
  const [secure, setSecure] = useState(true);

  const setField = (field: keyof typeof values) => (text: string) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async () => {
    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    try {
      await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Kayıt oluşturulamadı');
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader title="" onBack={() => navigation.goBack()} />

      <View style={styles.intro}>
        <Text style={typography.display}>Hesap oluştur</Text>
        <Text style={typography.caption}>
          Birkaç saniye içinde evini kurup arkadaşlarını davet edebilirsin.
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Ad soyad"
          placeholder="Adın ve soyadın"
          icon="person-outline"
          value={values.fullName}
          onChangeText={setField('fullName')}
          error={errors.fullName}
          autoCapitalize="words"
        />
        <Input
          label="E-posta"
          placeholder="ornek@eposta.com"
          icon="mail-outline"
          value={values.email}
          onChangeText={setField('email')}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Şifre"
          placeholder="En az 6 karakter"
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
        <Input
          label="Şifre tekrar"
          placeholder="Şifreni doğrula"
          icon="lock-closed-outline"
          value={values.passwordConfirm}
          onChangeText={setField('passwordConfirm')}
          error={errors.passwordConfirm}
          secureTextEntry={secure}
          autoCapitalize="none"
        />

        <Button
          label="Hesabımı oluştur"
          onPress={submit}
          loading={submitting}
          size="lg"
          fullWidth
          style={styles.submit}
        />
      </View>

      <View style={styles.footer}>
        <Text style={typography.caption}>Zaten hesabın var mı?</Text>
        <Pressable onPress={() => navigation.replace('Login')} hitSlop={8}>
          <Text style={styles.link}>Giriş yap</Text>
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
