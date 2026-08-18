import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Sağ tarafta gösterilen sabit metin (₺, %, adet) */
  suffix?: string;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void };
  containerStyle?: ViewStyle;
  multilineHeight?: number;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      suffix,
      rightAction,
      containerStyle,
      multiline,
      multilineHeight = 96,
      ...inputProps
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View
          style={[
            styles.field,
            focused && styles.fieldFocused,
            Boolean(error) && styles.fieldError,
            multiline && { height: multilineHeight, alignItems: 'flex-start' },
          ]}
        >
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={focused ? colors.primary : colors.textMuted}
              style={multiline ? { marginTop: spacing.md } : undefined}
            />
          ) : null}
          <TextInput
            ref={ref}
            style={[styles.input, multiline && styles.inputMultiline]}
            placeholderTextColor={colors.textMuted}
            multiline={multiline}
            onFocus={(event) => {
              setFocused(true);
              inputProps.onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              inputProps.onBlur?.(event);
            }}
            {...inputProps}
          />
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
          {rightAction ? (
            <Ionicons
              name={rightAction.icon}
              size={20}
              color={colors.textSecondary}
              onPress={rightAction.onPress}
              suppressHighlighting
            />
          ) : null}
        </View>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : hint ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  input: {
    ...typography.input,
    flex: 1,
    paddingVertical: spacing.md,
    // Android'de tek satırlık girişte metni dikeyde ortalar
    textAlignVertical: 'center',
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: spacing.md,
    height: '100%',
  },
  suffix: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
