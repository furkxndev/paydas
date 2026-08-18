import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils';

interface BalanceHeroCardProps {
  /** Aktif kullanıcının net durumu: pozitif alacak, negatif borç */
  net: number;
  totalOwed: number;
  totalReceivable: number;
  currency: string;
  monthTotal: number;
  onPress: () => void;
}

/** Ana ekranın üst kartı: "kimden alacaklısın, kime borçlusun" özeti */
export const BalanceHeroCard = ({
  net,
  totalOwed,
  totalReceivable,
  currency,
  monthTotal,
  onPress,
}: BalanceHeroCardProps) => {
  const settled = Math.abs(net) < 0.01;
  const isCreditor = net > 0;

  const gradient: [string, string] = settled
    ? [colors.success, colors.successDark]
    : isCreditor
      ? [colors.primary, colors.primaryDark]
      : [colors.danger, colors.dangerDark];

  const title = settled ? 'Hesaplar kapalı' : isCreditor ? 'Toplam alacağın' : 'Toplam borcun';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.label}>{title}</Text>
          <View style={styles.chevron}>
            <Ionicons name="arrow-forward" size={14} color={colors.textInverse} />
          </View>
        </View>

        <Text
          style={styles.amount}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {settled ? formatCurrency(0, currency) : formatCurrency(Math.abs(net), currency)}
        </Text>

        {settled ? (
          <Text style={styles.subtitle}>Kimseye borcun yok, harika gidiyorsun.</Text>
        ) : (
          <View style={styles.breakdown}>
            <View style={styles.breakdownItem}>
              <Ionicons name="arrow-down-circle" size={16} color="rgba(255,255,255,0.85)" />
              <Text style={styles.breakdownLabel}>Alacak</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(totalReceivable, currency)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownItem}>
              <Ionicons name="arrow-up-circle" size={16} color="rgba(255,255,255,0.85)" />
              <Text style={styles.breakdownLabel}>Borç</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(totalOwed, currency)}</Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Ionicons name="stats-chart" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={styles.footerText}>
            Bu ay evin toplam harcaması {formatCurrency(monthTotal, currency)}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.captionStrong,
    color: 'rgba(255,255,255,0.9)',
  },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    ...typography.display,
    color: colors.textInverse,
    fontSize: 38,
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  breakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  breakdownItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  breakdownLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  breakdownValue: {
    ...typography.captionStrong,
    color: colors.textInverse,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  footerText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
});
