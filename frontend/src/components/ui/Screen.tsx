import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '../../theme';

interface ScreenProps {
  children: ReactNode;
  /** İçerik kaydırılabilir olsun mu */
  scrollable?: boolean;
  /** Yatay iç boşluk uygulanmasın (tam genişlik listeler için) */
  edgeToEdge?: boolean;
  edges?: Edge[];
  background?: string;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  refreshControl?: ScrollViewProps['refreshControl'];
  keyboardAvoiding?: boolean;
  /**
   * Kaydırmadan bağımsız, ekrana sabitlenmiş içerik (FAB gibi).
   * ScrollView'ın dışında render edilir; aksi halde mutlak konumlandırma
   * ekrana değil kaydırılan içeriğe göre hesaplanır ve buton içerikle kayar.
   */
  floatingAction?: ReactNode;
}

/** Tüm ekranların ortak kabuğu: güvenli alan, arka plan ve iç boşluk */
export const Screen = ({
  children,
  scrollable = false,
  edgeToEdge = false,
  edges = ['top'],
  background = colors.background,
  style,
  contentContainerStyle,
  refreshControl,
  keyboardAvoiding = false,
  floatingAction,
}: ScreenProps) => {
  const padding = edgeToEdge ? undefined : { paddingHorizontal: layout.screenPadding };

  const content = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[padding, { paddingBottom: spacing.huge }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: background }, style]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
      {floatingAction}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
