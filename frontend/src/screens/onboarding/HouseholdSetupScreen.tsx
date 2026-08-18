import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Screen } from '../../components/ui';
import { useAuth } from '../../hooks';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { getFirstName } from '../../utils';

const OPTIONS = [
  {
    key: 'SetupCreateHousehold' as const,
    icon: 'add-circle' as const,
    title: 'Yeni bir ev oluştur',
    description: 'Evini kur, davet kodunu paylaş, arkadaşların katılsın.',
    tone: colors.primary,
    toneSoft: colors.primarySoft,
  },
  {
    key: 'SetupJoinHousehold' as const,
    icon: 'enter' as const,
    title: 'Bir eve katıl',
    description: 'Ev arkadaşından aldığın davet kodunu gir.',
    tone: colors.success,
    toneSoft: colors.successSoft,
  },
];

export const HouseholdSetupScreen = () => {
  const navigation = useNavigation();
  const { user, logout, isPlatformAdmin } = useAuth();

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <View style={styles.userRow}>
          <Avatar name={user?.fullName ?? ''} seed={user?.id} size={44} />
          <View style={styles.userText}>
            <Text style={typography.caption}>Merhaba,</Text>
            <Text style={typography.subheading}>{getFirstName(user?.fullName ?? '')}</Text>
          </View>
          {isPlatformAdmin ? (
            <Badge label="Yönetici" tone="primary" icon="shield-checkmark" size="sm" />
          ) : null}
          <Pressable onPress={logout} hitSlop={8}>
            <Text style={styles.logout}>Çıkış</Text>
          </Pressable>
        </View>

        <Text style={[typography.display, styles.title]}>Hadi evini kuralım</Text>
        <Text style={typography.caption}>
          Paydaş, ortak giderleri ve ev işlerini bir arada tuttuğun ortak alandır. Başlamak için
          bir ev oluştur ya da mevcut bir eve katıl.
        </Text>
      </View>

      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => navigation.navigate(option.key)}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <View style={[styles.optionIcon, { backgroundColor: option.toneSoft }]}>
              <Ionicons name={option.icon} size={24} color={option.tone} />
            </View>
            <View style={styles.optionText}>
              <Text style={typography.subheading}>{option.title}</Text>
              <Text style={typography.caption}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      {isPlatformAdmin ? (
        <Pressable
          onPress={() => navigation.navigate('SetupAdmin')}
          style={({ pressed }) => [styles.adminLink, pressed && styles.pressed]}
        >
          <View style={styles.adminIcon}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          </View>
          <View style={styles.adminText}>
            <Text style={typography.bodyStrong}>Yönetim paneli</Text>
            <Text style={typography.caption}>
              Sistemdeki ilk kullanıcı olduğun için yöneticisin.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  userText: { flex: 1, gap: 2 },
  logout: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  title: { marginTop: spacing.sm },
  options: { gap: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.85 },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  adminIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminText: { flex: 1, gap: 2 },
});
