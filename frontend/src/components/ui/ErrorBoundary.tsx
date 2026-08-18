import { Ionicons } from '@expo/vector-icons';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../../theme';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Beklenmeyen bir render hatasında uygulamanın beyaz ekranda kalmasını engeller.
 * Kullanıcıya anlaşılır bir ekran gösterir; hata ayrıntısı yalnızca geliştirmede görünür.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Üretimde burası bir hata izleme servisine (Sentry vb.) bağlanmalıdır
    console.error('[Paydaş] Yakalanmamış hata:', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <Ionicons name="warning" size={30} color={colors.danger} />
          </View>
          <Text style={typography.title}>Bir şeyler ters gitti</Text>
          <Text style={[typography.caption, styles.centered]}>
            Beklenmeyen bir hata oluştu. Tekrar deneyebilir ya da uygulamayı yeniden
            başlatabilirsiniz.
          </Text>

          {__DEV__ ? (
            <ScrollView style={styles.details}>
              <Text style={styles.detailsText}>{error.message}</Text>
            </ScrollView>
          ) : null}

          <Button label="Tekrar dene" onPress={this.reset} size="lg" fullWidth />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centered: { textAlign: 'center', maxWidth: 300 },
  details: {
    maxHeight: 160,
    width: '100%',
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  detailsText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
