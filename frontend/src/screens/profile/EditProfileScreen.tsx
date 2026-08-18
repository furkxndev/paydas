import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader, Avatar, Button, Input, Screen } from '../../components';
import { useAuth, useToast } from '../../hooks';
import { spacing } from '../../theme';
import type { AppScreenProps } from '../../navigation/types';

export const EditProfileScreen = ({ navigation }: AppScreenProps<'EditProfile'>) => {
  const { user, updateProfile, submitting } = useAuth();
  const { showSuccess, showError } = useToast();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [error, setError] = useState<string | undefined>();

  const submit = async () => {
    if (fullName.trim().length < 2) {
      setError('Ad soyad en az 2 karakter olmalı');
      return;
    }
    try {
      await updateProfile({ fullName: fullName.trim(), phone: phone.trim() || undefined });
      showSuccess('Profil güncellendi');
      navigation.goBack();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Profil güncellenemedi');
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader title="Profili düzenle" onBack={() => navigation.goBack()} />

      <View style={styles.avatarWrapper}>
        <Avatar name={fullName || (user?.fullName ?? '')} seed={user?.id} size={88} />
      </View>

      <View style={styles.form}>
        <Input
          label="Ad soyad"
          icon="person-outline"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            setError(undefined);
          }}
          error={error}
          autoCapitalize="words"
        />
        <Input
          label="Telefon (isteğe bağlı)"
          icon="call-outline"
          placeholder="+90 5xx xxx xx xx"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Input
          label="E-posta"
          icon="mail-outline"
          value={user?.email ?? ''}
          editable={false}
          hint="E-posta adresi değiştirilemez"
        />

        <Button
          label="Kaydet"
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
  avatarWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  form: { gap: spacing.lg },
  submit: { marginTop: spacing.sm },
});
