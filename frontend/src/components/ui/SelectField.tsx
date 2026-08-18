import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';
import { BottomSheet } from './BottomSheet';

export interface SelectOption<T extends string> {
  key: T;
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

interface SelectFieldProps<T extends string> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  sheetTitle?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Alt sayfada liste açan seçim alanı */
export const SelectField = <T extends string>({
  label,
  placeholder = 'Seçiniz',
  value,
  options,
  onChange,
  sheetTitle,
  error,
  icon,
}: SelectFieldProps<T>) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.key === value);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, Boolean(error) && styles.fieldError]}
      >
        {selected?.icon || icon ? (
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: selected?.color ? `${selected.color}1A` : colors.surfaceAlt },
            ]}
          >
            <Ionicons
              name={(selected?.icon ?? icon)!}
              size={16}
              color={selected?.color ?? colors.textSecondary}
            />
          </View>
        ) : null}
        <Text
          style={[typography.body, !selected && { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <View style={styles.spacer} />
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={sheetTitle ?? label ?? 'Seçim yapın'}
      >
        {options.map((option) => {
          const isSelected = option.key === value;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                onChange(option.key);
                setOpen(false);
              }}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              {option.icon ? (
                <View
                  style={[
                    styles.iconWrapper,
                    { backgroundColor: option.color ? `${option.color}1A` : colors.surfaceAlt },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={option.color ?? colors.textSecondary}
                  />
                </View>
              ) : null}
              <View style={styles.optionText}>
                <Text style={typography.bodyStrong}>{option.label}</Text>
                {option.description ? (
                  <Text style={typography.caption}>{option.description}</Text>
                ) : null}
              </View>
              {isSelected ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </BottomSheet>
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
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldError: { borderColor: colors.danger },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { flex: 1 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  optionText: { flex: 1, gap: 2 },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
