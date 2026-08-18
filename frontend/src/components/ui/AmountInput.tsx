import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';
import { getCurrencySymbol } from '../../utils';

interface AmountInputProps {
  value: string;
  onChangeText: (value: string) => void;
  currency?: string;
  label?: string;
  error?: string;
  autoFocus?: boolean;
}

/** Tutar girişi için büyük puntolu özel alan */
export const AmountInput = ({
  value,
  onChangeText,
  currency = 'TRY',
  label = 'Tutar',
  error,
  autoFocus = false,
}: AmountInputProps) => {
  const handleChange = (input: string) => {
    // Yalnızca rakam ve tek bir ayraç kabul edilir
    const sanitized = input.replace(/[^\d,.]/g, '').replace(/\./g, ',');
    const parts = sanitized.split(',');
    const normalized =
      parts.length > 1 ? `${parts[0]},${parts.slice(1).join('').slice(0, 2)}` : parts[0];
    onChangeText(normalized);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, Boolean(error) && styles.fieldError]}>
        <TextInput
          value={value}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus}
          style={styles.input}
        />
        <Text style={styles.currency}>{getCurrencySymbol(currency)}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldError: { borderColor: colors.danger },
  input: {
    ...typography.inputLarge,
    flexShrink: 1,
    minWidth: 60,
    textAlign: 'center',
    padding: 0,
  },
  currency: {
    ...typography.title,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
