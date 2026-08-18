import { Ionicons } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing, typography } from '../theme';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_STYLE: Record<ToastVariant, { icon: string; color: string; background: string }> =
  {
    success: {
      icon: 'checkmark-circle',
      color: colors.success,
      background: colors.successSoft,
    },
    error: { icon: 'alert-circle', color: colors.danger, background: colors.dangerSoft },
    info: { icon: 'information-circle', color: colors.primary, background: colors.primarySoft },
  };

const DURATION = 3200;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  // Animated değerleri render sırasında ref.current okumamak için useMemo ile oluşturulur
  const translateY = useMemo(() => new Animated.Value(-120), []);
  const opacity = useMemo(() => new Animated.Value(0), []);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, variant });
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 16 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
      timerRef.current = setTimeout(hide, DURATION);
    },
    [hide, opacity, translateY],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showError: (message: string) => showToast(message, 'error'),
      showSuccess: (message: string) => showToast(message, 'success'),
    }),
    [showToast],
  );

  const variantStyle = toast ? VARIANT_STYLE[toast.variant] : VARIANT_STYLE.info;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrapper,
            { top: insets.top + spacing.sm, transform: [{ translateY }], opacity },
          ]}
        >
          <Pressable
            onPress={hide}
            style={[styles.toast, { backgroundColor: variantStyle.background }]}
          >
            <Ionicons name={variantStyle.icon as never} size={20} color={variantStyle.color} />
            <Text style={styles.message} numberOfLines={3}>
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  message: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.text,
  },
});
