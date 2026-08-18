import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import {
  AppHeader,
  Card,
  ConfirmDialog,
  InviteCard,
  ListRow,
  MemberRow,
  Screen,
  SectionHeader,
} from '../../components';
import { APP_NAME } from '../../constants';
import { useAuth, useBalances, useHousehold, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import { formatCurrency, getBalanceFor } from '../../utils';
import type { AppScreenProps } from '../../navigation/types';

export const HouseholdScreen = ({ navigation }: AppScreenProps<'Household'>) => {
  const { user } = useAuth();
  const {
    activeHousehold,
    households,
    members,
    currency,
    isAdmin,
    myRole,
    selectHousehold,
    regenerateInviteCode,
    removeMember,
    leaveHousehold,
  } = useHousehold();
  const { balances } = useBalances();
  const { showSuccess, showError } = useToast();

  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [busy, setBusy] = useState(false);

  const inviteCode = activeHousehold?.inviteCode ?? '';

  const inviteMessage = useMemo(
    () =>
      `${APP_NAME} uygulamasında "${activeHousehold?.name}" evine katıl!\n\nDavet kodu: ${inviteCode}\n\nOrtak giderleri, faturaları ve ev işlerini birlikte yönetelim.`,
    [activeHousehold?.name, inviteCode],
  );

  const copyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Davet kodu kopyalandı');
  };

  const shareInvite = async () => {
    try {
      await Share.share({ message: inviteMessage });
    } catch {
      showError('Paylaşım açılamadı');
    }
  };

  const handleRegenerate = async () => {
    setBusy(true);
    try {
      await regenerateInviteCode();
      showSuccess('Yeni davet kodu oluşturuldu');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Kod yenilenemedi');
    } finally {
      setBusy(false);
      setConfirmRegenerate(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setBusy(true);
    try {
      await removeMember(removeTarget);
      showSuccess('Üye evden çıkarıldı');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Üye çıkarılamadı');
    } finally {
      setBusy(false);
      setRemoveTarget(null);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      await leaveHousehold();
      showSuccess('Evden ayrıldın');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Evden ayrılınamadı');
    } finally {
      setBusy(false);
      setConfirmLeave(false);
    }
  };

  return (
    <Screen scrollable>
      <AppHeader
        title={activeHousehold?.name ?? 'Evim'}
        subtitle={`${members.length} üye · ${myRole === 'owner' ? 'Ev sahibi' : myRole === 'admin' ? 'Yönetici' : 'Üye'}`}
        onBack={() => navigation.goBack()}
      />

      {activeHousehold?.address ? (
        <Card variant="outlined" style={styles.addressCard}>
          <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
          <Text style={[typography.caption, styles.address]}>{activeHousehold.address}</Text>
        </Card>
      ) : null}

      <View style={styles.section}>
        <InviteCard
          inviteCode={inviteCode}
          onCopy={copyCode}
          onShare={shareInvite}
          onRegenerate={isAdmin ? () => setConfirmRegenerate(true) : undefined}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Üyeler" count={members.length} />
        <Card padded={false} style={styles.listCard}>
          {members.map((member, index) => {
            const balance = getBalanceFor(balances, member.userId);
            const settled = Math.abs(balance.net) < 0.01;
            return (
              <View key={member.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <MemberRow
                  member={member}
                  isCurrentUser={member.userId === user?.id}
                  balanceLabel={
                    settled
                      ? 'Hesabı kapalı'
                      : balance.net > 0
                        ? `${formatCurrency(balance.net, currency)} alacaklı`
                        : `${formatCurrency(Math.abs(balance.net), currency)} borçlu`
                  }
                  balanceColor={
                    settled
                      ? colors.textMuted
                      : balance.net > 0
                        ? colors.success
                        : colors.danger
                  }
                  onRemove={
                    isAdmin && member.userId !== user?.id && member.role !== 'owner'
                      ? () => setRemoveTarget(member.userId)
                      : undefined
                  }
                />
              </View>
            );
          })}
        </Card>
      </View>

      {households.length > 1 ? (
        <View style={styles.section}>
          <SectionHeader title="Evlerin" count={households.length} />
          <Card padded={false} style={styles.listCard}>
            {households.map((household, index) => (
              <View key={household.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <ListRow
                  title={household.name}
                  subtitle={`${household.members.length} üye`}
                  icon="home-outline"
                  iconColor={
                    household.id === activeHousehold?.id ? colors.primary : colors.textSecondary
                  }
                  iconBackground={
                    household.id === activeHousehold?.id
                      ? colors.primarySoft
                      : colors.surfaceAlt
                  }
                  right={
                    household.id === activeHousehold?.id ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    ) : undefined
                  }
                  onPress={() => selectHousehold(household.id)}
                />
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Ev işlemleri" />
        <Card padded={false} style={styles.listCard}>
          <ListRow
            title="Yeni ev oluştur"
            subtitle="Farklı bir ev için ayrı bir alan aç"
            icon="add-circle-outline"
            iconColor={colors.primary}
            iconBackground={colors.primarySoft}
            onPress={() => navigation.navigate('CreateHousehold')}
            showChevron
          />
          <View style={styles.separator} />
          <ListRow
            title="Başka bir eve katıl"
            subtitle="Davet kodunla katıl"
            icon="enter-outline"
            iconColor={colors.success}
            iconBackground={colors.successSoft}
            onPress={() => navigation.navigate('JoinHousehold')}
            showChevron
          />
          {myRole !== 'owner' ? (
            <>
              <View style={styles.separator} />
              <ListRow
                title="Evden ayrıl"
                subtitle="Bu evin verilerine erişimin sona erer"
                icon="exit-outline"
                iconColor={colors.danger}
                iconBackground={colors.dangerSoft}
                danger
                onPress={() => setConfirmLeave(true)}
              />
            </>
          ) : null}
        </Card>
      </View>

      <Pressable onPress={shareInvite} style={styles.inviteHint}>
        <Ionicons name="people-outline" size={16} color={colors.primary} />
        <Text style={styles.inviteHintText}>
          Yeni bir ev arkadaşı mı geldi? Davet kodunu paylaş, saniyeler içinde katılsın.
        </Text>
      </Pressable>

      <ConfirmDialog
        visible={Boolean(removeTarget)}
        title="Üye çıkarılsın mı?"
        message="Üye evden çıkarılır ancak geçmiş harcama kayıtları korunur."
        confirmLabel="Çıkar"
        destructive
        loading={busy}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmDialog
        visible={confirmRegenerate}
        title="Davet kodu yenilensin mi?"
        message="Eski kod geçersiz olur; paylaştığın bağlantılar çalışmaz."
        confirmLabel="Yenile"
        loading={busy}
        onConfirm={handleRegenerate}
        onCancel={() => setConfirmRegenerate(false)}
      />

      <ConfirmDialog
        visible={confirmLeave}
        title="Evden ayrılmak istediğine emin misin?"
        message="Bu evin gider, fatura ve görevlerine erişimin sona erer."
        confirmLabel="Ayrıl"
        destructive
        loading={busy}
        onConfirm={handleLeave}
        onCancel={() => setConfirmLeave(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  address: { flex: 1 },
  section: { marginTop: spacing.xl },
  listCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  inviteHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  inviteHintText: {
    ...typography.caption,
    flex: 1,
    color: colors.primaryDark,
  },
});
