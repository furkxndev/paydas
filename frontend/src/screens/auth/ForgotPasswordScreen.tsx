import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader, Button, Input, Screen } from '../../components/ui';
import { useAuth, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import { isValidEmail } from '../../utils';
import type { AuthScreenProps } from '../../navigation/types';

export const ForgotPasswordScreen = ({ navigation }: AuthScreenProps<'ForgotPassword'>) => {
  const { forgotPassword, submitting } = useAuth();
  const { showError } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setError('Geçerli bir e-posta girin');
      return;
    }
    try {
      await forgotPassword({ email: email.trim() });
      // Hesabın var olup olmadığı sızdırılmaz; her durumda aynı ekran gösterilir
      setSent(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'İstek gönderilemedi');
    }
  };

  if (sent) {
    return (
      <Screen scrollable>
        <AppHeader title="" onBack={() => navigation.goBack()} />
        <View style={styles.successBlock}>
          <View style={styles.successIcon}>
            <Ionicons name="mail-open" size={30} color={colors.success} />
          </View>
          <Text style={typography.title}>E-postanı kontrol et</Text>
          <Text style={[typography.caption, styles.centered]}>
            {email.trim()} adresine kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı
            gönderildi. Bağlantı 1 saat geçerlidir.
          </Text>
          <Button
            label="Giriş ekranına dön"
            onPress={() => navigation.navigate('Login')}
            size="lg"
            fullWidth
            style={styles.action}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader title="" onBack={() => navigation.goBack()} />

      <View style={styles.intro}>
        <Text style={typography.display}>Şifreni mi unuttun?</Text>
        <Text style={typography.caption}>
          Hesabına kayıtlı e-posta adresini gir; sıfırlama bağlantısını gönderelim.
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="E-posta"
          placeholder="ornek@eposta.com"
          icon="mail-outline"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(undefined);
          }}
          error={error}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Button
          label="Sıfırlama bağlantısı gönder"
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
  intro: { gap: spacing.xs, marginTop: spacing.lg, marginBottom: spacing.xxl },
  form: { gap: spacing.lg },
  successBlock: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.huge,
    paddingHorizontal: spacing.md,
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { textAlign: 'center', maxWidth: 320 },
  action: { marginTop: spacing.lg },
});
