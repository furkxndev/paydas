import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader, Button, Card, ConfirmDialog, Input, Screen } from '../../components/ui';
import { useAuth, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import type { AppScreenProps } from '../../navigation/types';

const CONSEQUENCES = [
  'Hesabın ve profil bilgilerin kalıcı olarak silinir.',
  'Kurduğun evler, o evlere ait tüm gider, fatura ve görevlerle birlikte silinir.',
  'Katıldığın diğer evlerden çıkarılırsın; oradaki geçmiş kayıtlar korunur.',
  'Bu işlem geri alınamaz.',
];

export const DeleteAccountScreen = ({ navigation }: AppScreenProps<'DeleteAccount'>) => {
  const { deleteAccount, submitting } = useAuth();
  const { showError } = useToast();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      setError('Şifreni girmelisin');
      setConfirmVisible(false);
      return;
    }
    try {
      await deleteAccount({ password });
      // Oturum kapandığı için kök navigasyon karşılama ekranına döner
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hesap silinemedi';
      setError(message);
      showError(message);
    } finally {
      setConfirmVisible(false);
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader title="Hesabı sil" onBack={() => navigation.goBack()} />

      <Card style={styles.warning}>
        <View style={styles.warningHeader}>
          <View style={styles.iconWrapper}>
            <Ionicons name="alert-circle" size={22} color={colors.danger} />
          </View>
          <Text style={typography.subheading}>Bu işlem geri alınamaz</Text>
        </View>
        {CONSEQUENCES.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={[typography.caption, styles.bulletText]}>{line}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.form}>
        <Input
          label="Şifreni girerek onayla"
          icon="lock-closed-outline"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError(undefined);
          }}
          error={error}
          secureTextEntry
          autoCapitalize="none"
        />

        <Button
          label="Hesabımı kalıcı olarak sil"
          onPress={() => setConfirmVisible(true)}
          variant="danger"
          icon="trash-outline"
          size="lg"
          fullWidth
          disabled={!password}
        />
        <Button label="Vazgeç" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
      </View>

      <ConfirmDialog
        visible={confirmVisible}
        title="Hesabın silinsin mi?"
        message="Hesabın ve kurduğun evlerin tüm verisi kalıcı olarak silinecek. Bu işlem geri alınamaz."
        confirmLabel="Evet, sil"
        destructive
        loading={submitting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  warning: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: colors.dangerSoft,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bullet: { ...typography.caption, color: colors.dangerDark },
  bulletText: { flex: 1, color: colors.dangerDark },
  form: { gap: spacing.lg, marginTop: spacing.xl },
});
