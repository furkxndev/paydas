import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

import { APP_NAME } from '../../constants';
import { colors, spacing, typography } from '../../theme';
import { BrandMark } from './BrandMark';

interface AnimatedSplashProps {
  /** Animasyon bittiğinde çağrılır; uygulama görünür hale gelir */
  onFinish: () => void;
}

/**
 * Uygulama açılış animasyonu.
 *
 * Sıra: işaret büyüyerek belirir → marka adı yükselir → slogan görünür →
 * kısa bekleme → katman kararmadan silinir.
 *
 * "Hareketi azalt" erişilebilirlik ayarı açıksa animasyon atlanır ve
 * yalnızca kısa bir duraklamayla geçilir.
 */
export const AnimatedSplash = ({ onFinish }: AnimatedSplashProps) => {
  // Animated değerleri render sırasında ref.current okumamak için useMemo ile oluşturulur
  const markScale = useMemo(() => new Animated.Value(0.72), []);
  const markOpacity = useMemo(() => new Animated.Value(0), []);
  const titleShift = useMemo(() => new Animated.Value(14), []);
  const titleOpacity = useMemo(() => new Animated.Value(0), []);
  const taglineOpacity = useMemo(() => new Animated.Value(0), []);
  const overlayOpacity = useMemo(() => new Animated.Value(1), []);

  const [reduceMotion, setReduceMotion] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    let active = true;

    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      onFinish();
    };

    const run = async () => {
      const prefersReduced = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!active) return;
      setReduceMotion(prefersReduced);

      if (prefersReduced) {
        markOpacity.setValue(1);
        markScale.setValue(1);
        titleOpacity.setValue(1);
        titleShift.setValue(0);
        taglineOpacity.setValue(1);
        setTimeout(() => {
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(finish);
        }, 500);
        return;
      }

      Animated.sequence([
        Animated.parallel([
          Animated.timing(markOpacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(markScale, {
            toValue: 1,
            damping: 11,
            stiffness: 120,
            mass: 0.9,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleShift, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(420),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished: done }) => {
        if (done) finish();
      });
    };

    run();

    // Animasyon herhangi bir nedenle tamamlanmazsa uygulama açılışta takılı kalmamalı
    const failsafe = setTimeout(finish, 4000);

    return () => {
      active = false;
      clearTimeout(failsafe);
    };
  }, [markOpacity, markScale, onFinish, overlayOpacity, taglineOpacity, titleOpacity, titleShift]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, { opacity: overlayOpacity }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, '#2E2C7A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Animated.View
          style={{ opacity: markOpacity, transform: [{ scale: markScale }] }}
        >
          <BrandMark size={104} />
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            { opacity: titleOpacity, transform: [{ translateY: titleShift }] },
          ]}
        >
          {APP_NAME}
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          {reduceMotion ? 'Dijital ev asistanın' : 'Evi birlikte yönetin'}
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.display,
    color: colors.textInverse,
    fontSize: 38,
    marginTop: spacing.lg,
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.82)',
  },
});
