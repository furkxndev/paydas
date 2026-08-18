import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

interface LoadingStateProps {
  message?: string;
  fullscreen?: boolean;
}

export const LoadingState = ({ message, fullscreen = true }: LoadingStateProps) => (
  <View style={[styles.container, fullscreen && styles.fullscreen]}>
    <ActivityIndicator size="large" color={colors.primary} />
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
  fullscreen: { flex: 1 },
  message: {
    ...typography.caption,
  },
});
