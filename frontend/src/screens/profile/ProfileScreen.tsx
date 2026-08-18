import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Avatar,
  Badge,
  Card,
  ConfirmDialog,
  ListRow,
  Screen,
  SectionHeader,
  StatTile,
} from '../../components';
import { APP_NAME } from '../../constants';
import {
  useAuth,
  useBalances,
  useHousehold,
  useHouseholdData,
  usePushNotifications,
  useToast,
} from '../../hooks';
import { isMockMode } from '../../config';
import { resetMockData } from '../../services';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils';

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout, isPlatformAdmin } = useAuth();
  const { activeHousehold, members, currency } = useHousehold();
  const { summary } = useHouseholdData();
  const { myBalance } = useBalances();
  const { preferences, permissionGranted } = usePushNotifications();
  const { showSuccess } = useToast();

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleReset = async () => {
    setBusy(true);
    try {
      await resetMockData();
      await logout();
      showSuccess('Tüm veriler silindi. Yeniden kayıt olabilirsiniz.');
    } finally {
      setBusy(false);
      setConfirmReset(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Avatar name={user?.fullName ?? ''} seed={user?.id} size={72} />
        <View style={styles.headerText}>
          <Text style={typography.title}>{user?.fullName}</Text>
          <Text style={typography.caption}>{user?.email}</Text>
          {isPlatformAdmin ? (
            <Badge
              label="Yönetici"
              tone="primary"
              icon="shield-checkmark"
              style={styles.roleBadge}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.tiles}>
        <StatTile
          label="Toplam ödediğin"
          value={formatCurrency(myBalance.paid, currency)}
          icon="card"
          tone={colors.primary}
          toneSoft={colors.primarySoft}
        />
        <StatTile
          label="Net durumun"
          value={formatCurrency(myBalance.net, currency)}
          icon={myBalance.net >= 0 ? 'trending-up' : 'trending-down'}
          tone={myBalance.net >= 0 ? colors.success : colors.danger}
          toneSoft={myBalance.net >= 0 ? colors.successSoft : colors.dangerSoft}
          onPress={() => navigation.navigate('Balances')}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Hesap" />
        <Card padded={false} style={styles.listCard}>
          <ListRow
            title="Profili düzenle"
            subtitle="Ad, telefon bilgilerin"
            icon="person-outline"
            iconColor={colors.primary}
            iconBackground={colors.primarySoft}
            onPress={() => navigation.navigate('EditProfile')}
            showChevron
          />
          <View style={styles.separator} />
          <ListRow
            title="Şifre değiştir"
            subtitle="Hesap güvenliğin için düzenli olarak güncelle"
            icon="key-outline"
            iconColor={colors.accent}
            iconBackground={colors.accentSoft}
            onPress={() => navigation.navigate('ChangePassword')}
            showChevron
          />
          <View style={styles.separator} />
          <ListRow
            title="Bildirim ayarları"
            subtitle={
              permissionGranted ? (preferences.enabled ? 'Açık' : 'Kapalı') : 'İzin verilmedi'
            }
            icon="notifications-outline"
            iconColor={colors.warning}
            iconBackground={colors.warningSoft}
            onPress={() => navigation.navigate('NotificationSettings')}
            showChevron
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Ev" />
        <Card padded={false} style={styles.listCard}>
          <ListRow
            title={activeHousehold?.name ?? 'Evim'}
            subtitle={`${members.length} üye · Davet kodu ${activeHousehold?.inviteCode ?? '—'}`}
            icon="home-outline"
            iconColor={colors.success}
            iconBackground={colors.successSoft}
            onPress={() => navigation.navigate('Household')}
            showChevron
          />
          <View style={styles.separator} />
          <ListRow
            title="Borç durumu"
            subtitle="Kim kime ne kadar borçlu"
            icon="swap-horizontal-outline"
            iconColor={colors.info}
            iconBackground={colors.infoSoft}
            onPress={() => navigation.navigate('Balances')}
            showChevron
          />
          <View style={styles.separator} />
          <ListRow
            title="Bu ayki ev harcaması"
            icon="stats-chart-outline"
            iconColor={colors.accent}
            iconBackground={colors.accentSoft}
            value={formatCurrency(summary.monthTotal, currency)}
          />
        </Card>
      </View>

      {isPlatformAdmin ? (
        <View style={styles.section}>
          <SectionHeader title="Yönetim" />
          <Card padded={false} style={styles.listCard}>
            <ListRow
              title="Kullanıcı yönetimi"
              subtitle="Kullanıcıları görüntüle, düzenle, yetkilendir"
              icon="shield-checkmark-outline"
              iconColor={colors.primary}
              iconBackground={colors.primarySoft}
              onPress={() => navigation.navigate('Admin')}
              showChevron
            />
          </Card>
          <Text style={styles.adminNote}>Bu bölüm yalnızca yöneticilere görünür.</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Uygulama" />
        <Card padded={false} style={styles.listCard}>
          {isMockMode() ? (
            <>
              <ListRow
                title="Tüm verileri sıfırla"
                subtitle="Kullanıcılar dahil her şeyi siler; ilk kayıt yeniden yönetici olur"
                icon="refresh-outline"
                iconColor={colors.danger}
                iconBackground={colors.dangerSoft}
                onPress={() => setConfirmReset(true)}
              />
              <View style={styles.separator} />
            </>
          ) : null}
          <ListRow
            title="Çıkış yap"
            icon="log-out-outline"
            iconColor={colors.textSecondary}
            iconBackground={colors.surfaceAlt}
            onPress={() => setConfirmLogout(true)}
          />
          <View style={styles.separator} />
          <ListRow
            title="Hesabı sil"
            subtitle="Hesabın ve verilerin kalıcı olarak silinir"
            icon="trash-outline"
            iconColor={colors.danger}
            iconBackground={colors.dangerSoft}
            danger
            onPress={() => navigation.navigate('DeleteAccount')}
            showChevron
          />
        </Card>
      </View>

      <Text style={styles.version}>
        {APP_NAME} · sürüm 1.0.0{isMockMode() ? ' · demo modu' : ''}
      </Text>

      <ConfirmDialog
        visible={confirmLogout}
        title="Çıkış yapılsın mı?"
        message="Tekrar giriş yaparak kaldığın yerden devam edebilirsin."
        confirmLabel="Çıkış yap"
        destructive
        onConfirm={logout}
        onCancel={() => setConfirmLogout(false)}
      />

      <ConfirmDialog
        visible={confirmReset}
        title="Tüm veriler sıfırlansın mı?"
        message="Kullanıcılar, evler, giderler, faturalar ve görevler dahil her şey silinir. Oturumun kapatılır ve ilk kayıt olan kişi yeniden yönetici olur."
        confirmLabel="Her şeyi sil"
        destructive
        loading={busy}
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerText: { alignItems: 'center', gap: 2 },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: { marginTop: spacing.xl },
  listCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  roleBadge: { alignSelf: 'center', marginTop: spacing.sm },
  adminNote: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
});
