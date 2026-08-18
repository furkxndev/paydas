import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import {
  AppHeader,
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  ListRow,
  Screen,
  SectionHeader,
  StatTile,
} from '../../components';
import { useAdmin, useAuth, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import { formatCurrency, formatDate, formatRelativeDate } from '../../utils';
import type { PlatformRole } from '../../types';
import type { AppStackParamList } from '../../navigation/types';

export const AdminUserDetailScreen = () => {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<AppStackParamList, 'AdminUserDetail' | 'SetupAdminUserDetail'>>();
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const { getUser, updateUser, deleteUser, loading } = useAdmin();
  const { showSuccess, showError } = useToast();

  const row = getUser(userId);

  const [fullName, setFullName] = useState(() => row?.user.fullName ?? '');
  const [phone, setPhone] = useState(() => row?.user.phone ?? '');
  const [nameError, setNameError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSelf = row?.user.id === currentUser?.id;

  const dirty = useMemo(
    () =>
      row
        ? fullName.trim() !== row.user.fullName || phone.trim() !== (row.user.phone ?? '')
        : false,
    [fullName, phone, row],
  );

  if (!row) {
    return (
      <Screen scrollable>
        <AppHeader title="Kullanıcı" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="person-outline"
          title={loading ? 'Yükleniyor…' : 'Kullanıcı bulunamadı'}
          description={loading ? undefined : 'Bu kullanıcı silinmiş olabilir.'}
          actionLabel="Geri dön"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const { user } = row;
  const suspended = user.status === 'suspended';

  const run = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    try {
      await action();
      showSuccess(successMessage);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'İşlem tamamlanamadı');
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = () => {
    if (fullName.trim().length < 2) {
      setNameError('Ad soyad en az 2 karakter olmalı');
      return;
    }
    run(
      () =>
        updateUser(user.id, {
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
        }),
      'Kullanıcı bilgileri güncellendi',
    );
  };

  const toggleRole = (nextRole: PlatformRole) =>
    run(
      () => updateUser(user.id, { platformRole: nextRole }),
      nextRole === 'admin' ? 'Kullanıcı yönetici yapıldı' : 'Yönetici yetkisi kaldırıldı',
    );

  const toggleStatus = (nextSuspended: boolean) =>
    run(
      () => updateUser(user.id, { status: nextSuspended ? 'suspended' : 'active' }),
      nextSuspended ? 'Hesap askıya alındı' : 'Hesap yeniden etkinleştirildi',
    );

  const handleDelete = () =>
    run(async () => {
      await deleteUser(user.id);
      navigation.goBack();
    }, 'Kullanıcı silindi').finally(() => setConfirmDelete(false));

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader title="Kullanıcı detayı" onBack={() => navigation.goBack()} />

      <Card style={styles.hero}>
        <Avatar name={user.fullName} seed={user.id} size={72} />
        <Text style={typography.title}>{user.fullName}</Text>
        <Text style={typography.caption}>{user.email}</Text>
        <View style={styles.badges}>
          <Badge
            label={user.platformRole === 'admin' ? 'Yönetici' : 'Kullanıcı'}
            tone={user.platformRole === 'admin' ? 'primary' : 'neutral'}
            icon={user.platformRole === 'admin' ? 'shield-checkmark' : 'person'}
          />
          <Badge
            label={suspended ? 'Askıda' : 'Aktif'}
            tone={suspended ? 'danger' : 'success'}
            icon={suspended ? 'pause-circle' : 'checkmark-circle'}
          />
          {isSelf ? <Badge label="Bu sensin" tone="info" /> : null}
        </View>
      </Card>

      <View style={[styles.tiles, styles.section]}>
        <StatTile
          label="Ödediği toplam"
          value={formatCurrency(row.totalPaid)}
          icon="card"
          tone={colors.primary}
          toneSoft={colors.primarySoft}
          caption={`${row.expenseCount} gider kaydı`}
        />
        <StatTile
          label="Tamamladığı görev"
          value={String(row.completedChoreCount)}
          icon="checkmark-done-circle"
          tone={colors.success}
          toneSoft={colors.successSoft}
          caption={`${row.householdCount} evde üye`}
        />
      </View>

      <Card style={styles.section} padded={false}>
        <View style={styles.rows}>
          <ListRow
            title="Kayıt tarihi"
            icon="calendar-outline"
            value={formatDate(user.createdAt)}
          />
          <ListRow
            title="Son giriş"
            icon="log-in-outline"
            value={user.lastLoginAt ? formatRelativeDate(user.lastLoginAt) : '—'}
          />
          <ListRow
            title="Son hareket"
            icon="pulse-outline"
            value={row.lastActivityAt ? formatRelativeDate(row.lastActivityAt) : '—'}
          />
          <ListRow
            title="Evleri"
            icon="home-outline"
            value={row.householdNames.length > 0 ? row.householdNames.join(', ') : '—'}
          />
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Bilgileri düzenle" />
        <Card style={styles.form}>
          <Input
            label="Ad soyad"
            icon="person-outline"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              setNameError(undefined);
            }}
            error={nameError}
            autoCapitalize="words"
          />
          <Input
            label="Telefon"
            icon="call-outline"
            placeholder="+90 5xx xxx xx xx"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="E-posta"
            icon="mail-outline"
            value={user.email}
            editable={false}
            hint="E-posta adresi yönetici tarafından değiştirilemez"
          />
          <Button
            label="Değişiklikleri kaydet"
            onPress={saveProfile}
            loading={busy}
            disabled={!dirty}
            fullWidth
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Yetki ve erişim" />
        <Card style={styles.form}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={typography.bodyStrong}>Yönetici yetkisi</Text>
              <Text style={typography.caption}>
                Yöneticiler tüm kullanıcıları görebilir ve düzenleyebilir.
              </Text>
            </View>
            <Switch
              value={user.platformRole === 'admin'}
              disabled={busy || isSelf}
              onValueChange={(value) => toggleRole(value ? 'admin' : 'user')}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={typography.bodyStrong}>Hesabı askıya al</Text>
              <Text style={typography.caption}>
                Askıya alınan kullanıcı giriş yapamaz; verileri korunur.
              </Text>
            </View>
            <Switch
              value={suspended}
              disabled={busy || isSelf}
              onValueChange={toggleStatus}
              trackColor={{ true: colors.danger, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>

          {isSelf ? (
            <View style={styles.selfNote}>
              <Ionicons name="information-circle" size={16} color={colors.info} />
              <Text style={styles.selfNoteText}>
                Kendi yetkinizi ve hesap durumunuzu bu ekrandan değiştiremezsiniz.
              </Text>
            </View>
          ) : null}
        </Card>
      </View>

      {!isSelf ? (
        <Button
          label="Kullanıcıyı sil"
          onPress={() => setConfirmDelete(true)}
          variant="danger"
          icon="trash-outline"
          fullWidth
          style={styles.deleteButton}
        />
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title="Kullanıcı silinsin mi?"
        message={`${user.fullName} hesabı ve kurduğu evler kalıcı olarak silinir. Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        destructive
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.xl,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: { marginTop: spacing.xl },
  rows: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  form: { gap: spacing.lg },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchText: { flex: 1, gap: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  selfNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
  selfNoteText: {
    ...typography.caption,
    flex: 1,
    fontSize: 12,
  },
  deleteButton: { marginTop: spacing.xl },
});
