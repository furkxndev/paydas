import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  AdminUserRow,
  AppHeader,
  Card,
  ChipRow,
  EmptyState,
  Input,
  LoadingState,
  Screen,
  SectionHeader,
  StatTile,
} from '../../components';
import { useAdmin, useAuth } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import { formatCurrency, getFirstName } from '../../utils';

/**
 * Rol ve durum filtrelerini tek satırda toplayan ön ayarlar.
 * İki ayrı çip satırı ekranı gereksiz yere kalabalıklaştırıyordu.
 */
const FILTER_PRESETS = [
  { key: 'all', label: 'Tümü', role: 'all', status: 'all' },
  { key: 'admins', label: 'Yöneticiler', role: 'admin', status: 'all' },
  { key: 'users', label: 'Kullanıcılar', role: 'user', status: 'all' },
  { key: 'suspended', label: 'Askıdakiler', role: 'all', status: 'suspended' },
] as const;

type PresetKey = (typeof FILTER_PRESETS)[number]['key'];

export const AdminScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  /**
   * Ev kurulumu grubundaki rota adları "Setup" önekli olduğu için detay rotası
   * hangi grupta olduğumuza göre belirlenir (bkz. RootNavigator).
   */
  const detailRoute =
    route.name === 'SetupAdmin'
      ? ('SetupAdminUserDetail' as const)
      : ('AdminUserDetail' as const);
  const {
    stats,
    users,
    allUsers,
    households,
    loading,
    refreshing,
    error,
    search,
    setSearch,
    role,
    setRole,
    status,
    setStatus,
    hasActiveFilters,
    resetFilters,
    refresh,
  } = useAdmin();

  const activePreset: PresetKey =
    FILTER_PRESETS.find((p) => p.role === role && p.status === status)?.key ?? 'all';

  const applyPreset = (key: PresetKey) => {
    const preset = FILTER_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setRole(preset.role);
    setStatus(preset.status);
  };

  if (loading && !stats) {
    return (
      <Screen>
        <AppHeader title="Yönetim" onBack={() => navigation.goBack()} />
        <LoadingState message="Yönetim verileri yükleniyor…" />
      </Screen>
    );
  }

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => refresh({ silent: true })}
          tintColor={colors.primary}
        />
      }
    >
      <AppHeader
        title="Yönetim"
        subtitle={`${stats?.totalUsers ?? 0} kullanıcı · ${stats?.totalHouseholds ?? 0} ev`}
        onBack={() => navigation.goBack()}
      />

      {error ? (
        <Card style={styles.errorCard}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={[typography.caption, styles.errorText]}>{error}</Text>
        </Card>
      ) : null}

      <View style={styles.tiles}>
        <StatTile
          label="Toplam kullanıcı"
          value={String(stats?.totalUsers ?? 0)}
          icon="people"
          tone={colors.primary}
          toneSoft={colors.primarySoft}
          caption={`${stats?.newUsersThisWeek ?? 0} yeni (7 gün)`}
        />
        <StatTile
          label="Aktif / askıda"
          value={`${stats?.activeUsers ?? 0} / ${stats?.suspendedUsers ?? 0}`}
          icon="shield-checkmark"
          tone={(stats?.suspendedUsers ?? 0) > 0 ? colors.warning : colors.success}
          toneSoft={(stats?.suspendedUsers ?? 0) > 0 ? colors.warningSoft : colors.successSoft}
          caption={`${stats?.adminCount ?? 0} yönetici`}
        />
      </View>

      <View style={[styles.tiles, styles.tilesSpaced]}>
        <StatTile
          label="Toplam ev"
          value={String(stats?.totalHouseholds ?? 0)}
          icon="home"
          tone={colors.accent}
          toneSoft={colors.accentSoft}
          caption={`${stats?.totalExpenses ?? 0} gider kaydı`}
        />
        <StatTile
          label="İşlem hacmi"
          value={formatCurrency(stats?.totalExpenseAmount ?? 0)}
          icon="stats-chart"
          tone={colors.info}
          toneSoft={colors.infoSoft}
          caption={`${stats?.pendingBills ?? 0} bekleyen fatura`}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Kullanıcılar" count={users.length} />

        <View style={styles.filters}>
          <Input
            placeholder="İsim veya e-posta ara…"
            icon="search"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          <ChipRow
            options={FILTER_PRESETS.map((p) => ({ key: p.key, label: p.label }))}
            value={activePreset}
            onChange={applyPreset}
          />
        </View>

        <Card padded={false} style={styles.listCard}>
          {users.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title={hasActiveFilters ? 'Sonuç bulunamadı' : 'Kullanıcı yok'}
              description={
                hasActiveFilters
                  ? 'Arama veya filtreleri değiştirerek tekrar dene.'
                  : 'Yeni kayıtlar burada listelenecek.'
              }
              actionLabel={hasActiveFilters ? 'Filtreleri temizle' : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
              compact
            />
          ) : (
            users.map((row, index) => (
              <View key={row.user.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <AdminUserRow
                  row={row}
                  isCurrentUser={row.user.id === user?.id}
                  onPress={() => navigation.navigate(detailRoute, { userId: row.user.id })}
                />
              </View>
            ))
          )}
        </Card>
      </View>

      {households.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Evler" count={households.length} />
          <Card padded={false} style={styles.listCard}>
            {households.map((household, index) => (
              <View key={household.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <View style={styles.householdRow}>
                  <View style={styles.householdIcon}>
                    <Ionicons name="home" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.householdText}>
                    <Text style={typography.bodyStrong} numberOfLines={1}>
                      {household.name}
                    </Text>
                    <Text style={typography.caption} numberOfLines={1}>
                      {household.memberCount} üye · {getFirstName(household.ownerName)} kurdu
                    </Text>
                  </View>
                  <View style={styles.householdAmount}>
                    <Text style={typography.bodyStrong}>
                      {formatCurrency(household.totalExpenseAmount, household.currency)}
                    </Text>
                    <View style={styles.codePill}>
                      <Text style={styles.code}>{household.inviteCode}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <Text style={styles.note}>
        Sistemdeki ilk kayıt otomatik olarak yönetici olur. Toplam {allUsers.length} kayıtlı
        kullanıcı bulunuyor.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: colors.dangerSoft,
  },
  errorText: { flex: 1, color: colors.dangerDark },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tilesSpaced: { marginTop: spacing.md },
  section: { marginTop: spacing.xl },
  filters: { gap: spacing.md, marginBottom: spacing.md },
  listCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  householdIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  householdText: { flex: 1, gap: 2 },
  householdAmount: { alignItems: 'flex-end', gap: spacing.xs },
  codePill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  code: {
    ...typography.captionStrong,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
