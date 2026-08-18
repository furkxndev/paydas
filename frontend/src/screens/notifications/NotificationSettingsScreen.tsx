import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import {
  AppHeader,
  Button,
  Card,
  ChipRow,
  ListRow,
  Screen,
  SectionHeader,
} from '../../components';
import { usePushNotifications, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import type { NotificationPreferences } from '../../types';
import type { AppScreenProps } from '../../navigation/types';

const TOGGLES: {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
}[] = [
  {
    key: 'billReminders',
    title: 'Fatura hatırlatmaları',
    description: 'Son ödeme tarihi yaklaşınca ve geciktiğinde bildirim al.',
    icon: 'receipt-outline',
    color: colors.warning,
    background: colors.warningSoft,
  },
  {
    key: 'expenseAlerts',
    title: 'Yeni harcamalar',
    description: 'Ev arkadaşların gider eklediğinde payını gör.',
    icon: 'wallet-outline',
    color: colors.primary,
    background: colors.primarySoft,
  },
  {
    key: 'choreReminders',
    title: 'Ev işleri',
    description: 'Sana görev atandığında ve zamanı yaklaştığında haber ver.',
    icon: 'clipboard-outline',
    color: colors.accent,
    background: colors.accentSoft,
  },
  {
    key: 'settlementAlerts',
    title: 'Ödeme bildirimleri',
    description: 'Borç ödemesi kaydedildiğinde bilgilendirilirsin.',
    icon: 'swap-horizontal-outline',
    color: colors.info,
    background: colors.infoSoft,
  },
];

const HOURS = [8, 9, 10, 12, 18, 20];

export const NotificationSettingsScreen = ({
  navigation,
}: AppScreenProps<'NotificationSettings'>) => {
  const {
    preferences,
    permissionGranted,
    scheduledCount,
    requestPermission,
    updatePreferences,
    sendTestNotification,
  } = usePushNotifications();
  const { showSuccess, showError } = useToast();

  const handlePermission = async () => {
    const granted = await requestPermission();
    if (granted) showSuccess('Bildirim izni verildi');
    else showError('Bildirim izni reddedildi. Cihaz ayarlarından açabilirsin.');
  };

  return (
    <Screen scrollable>
      <AppHeader
        title="Bildirim ayarları"
        subtitle="Neyden haberdar olmak istediğini seç"
        onBack={() => navigation.goBack()}
      />

      {!permissionGranted ? (
        <Card style={styles.permissionCard}>
          <View style={styles.permissionIcon}>
            <Ionicons name="notifications-off" size={22} color={colors.danger} />
          </View>
          <View style={styles.permissionText}>
            <Text style={typography.subheading}>Bildirim izni kapalı</Text>
            <Text style={typography.caption}>
              Fatura ve ev işi hatırlatmalarını alabilmek için izin vermelisin.
            </Text>
          </View>
          <Button label="İzin ver" onPress={handlePermission} size="sm" />
        </Card>
      ) : null}

      <Card style={styles.masterCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={typography.subheading}>Bildirimler</Text>
            <Text style={typography.caption}>
              {preferences.enabled
                ? `${scheduledCount} hatırlatma planlandı`
                : 'Tüm bildirimler kapalı'}
            </Text>
          </View>
          <Switch
            value={preferences.enabled}
            onValueChange={(enabled) => updatePreferences({ enabled })}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Bildirim türleri" />
        <Card padded={false} style={styles.listCard}>
          {TOGGLES.map((toggle, index) => (
            <View key={toggle.key}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <ListRow
                title={toggle.title}
                subtitle={toggle.description}
                icon={toggle.icon}
                iconColor={toggle.color}
                iconBackground={toggle.background}
                right={
                  <Switch
                    value={Boolean(preferences[toggle.key]) && preferences.enabled}
                    disabled={!preferences.enabled}
                    onValueChange={(value) => updatePreferences({ [toggle.key]: value })}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor={colors.white}
                  />
                }
              />
            </View>
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Hatırlatma saati"
          subtitle="Fatura bildirimlerinin gönderileceği saat"
        />
        <ChipRow
          options={HOURS.map((hour) => ({
            key: String(hour),
            label: `${String(hour).padStart(2, '0')}:00`,
          }))}
          value={String(preferences.reminderHour)}
          onChange={(value) => updatePreferences({ reminderHour: Number(value) })}
        />
      </View>

      <Button
        label="Test bildirimi gönder"
        onPress={sendTestNotification}
        variant="secondary"
        icon="notifications-outline"
        fullWidth
        style={styles.testButton}
      />

      <Text style={styles.note}>
        Hatırlatmalar cihaz üzerinde planlanır; uygulama kapalıyken de çalışır. Uzak bildirimler
        için sunucu bağlantısı gerekir.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.dangerSoft,
  },
  permissionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: { flex: 1, gap: 2 },
  masterCard: { marginTop: spacing.lg },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchText: { flex: 1, gap: 2 },
  section: { marginTop: spacing.xl },
  listCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  testButton: { marginTop: spacing.xxl },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
