import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { APP_NAME } from '../../constants';
import { colors, radius, spacing, typography } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

const HIGHLIGHTS: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  {
    icon: 'wallet',
    title: 'Ortak kasa',
    text: 'Harcamaları ekle, paylar ve borçlar otomatik hesaplansın.',
  },
  {
    icon: 'notifications',
    title: 'Fatura takibi',
    text: 'Elektrik, su, kira… Son ödeme yaklaşınca haber ver.',
  },
  {
    icon: 'checkmark-done-circle',
    title: 'Ev işleri',
    text: 'Görevleri paylaştır, kimin ne yaptığı net olsun.',
  },
];

export const WelcomeScreen = ({ navigation }: AuthScreenProps<'Welcome'>) => (
  <View style={styles.root}>
    <LinearGradient
      colors={[colors.primary, colors.primaryDark, '#2E2C7A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="home" size={30} color={colors.primary} />
        </View>
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.tagline}>
          Ev arkadaşlarınla parayı ve sorumlulukları birlikte yönet.
        </Text>
      </View>

      <View style={styles.highlights}>
        {HIGHLIGHTS.map((item) => (
          <View key={item.title} style={styles.highlight}>
            <View style={styles.highlightIcon}>
              <Ionicons name={item.icon} size={20} color={colors.textInverse} />
            </View>
            <View style={styles.highlightText}>
              <Text style={styles.highlightTitle}>{item.title}</Text>
              <Text style={styles.highlightBody}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label="Hesap oluştur"
          onPress={() => navigation.navigate('Register')}
          variant="secondary"
          size="lg"
          fullWidth
        />
        <Button
          label="Zaten hesabım var"
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
          size="lg"
          fullWidth
          style={styles.ghostButton}
        />
      </View>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.huge,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    ...typography.display,
    color: colors.textInverse,
    fontSize: 40,
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    maxWidth: 300,
  },
  highlights: {
    gap: spacing.lg,
    marginVertical: spacing.xxl,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  highlightIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: { flex: 1, gap: 2 },
  highlightTitle: {
    ...typography.subheading,
    color: colors.textInverse,
  },
  highlightBody: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.78)',
  },
  actions: { gap: spacing.sm },
  ghostButton: { backgroundColor: 'transparent' },
});
