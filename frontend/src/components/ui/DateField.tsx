import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';
import { addDays, formatDate, formatRelativeDate } from '../../utils';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Calendar } from './Calendar';
import { Chip } from './Chip';

interface DateFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  /** Hızlı seçim kısayolları gösterilsin mi */
  quickOptions?: boolean;
  error?: string;
}

const QUICK_OPTIONS = [
  { label: 'Bugün', days: 0 },
  { label: 'Yarın', days: 1 },
  { label: '3 gün sonra', days: 3 },
  { label: '1 hafta sonra', days: 7 },
];

export const DateField = ({
  label,
  value,
  onChange,
  minDate,
  quickOptions = true,
  error,
}: DateFieldProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const openSheet = () => {
    setDraft(value);
    setOpen(true);
  };

  const confirm = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={openSheet}
        style={[styles.field, Boolean(error) && styles.fieldError]}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
        <Text style={typography.body}>{formatDate(value)}</Text>
        <View style={styles.spacer} />
        <Text style={typography.caption}>{formatRelativeDate(value)}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label ?? 'Tarih seçin'}
        subtitle={formatDate(draft)}
      >
        {quickOptions ? (
          <View style={styles.quickRow}>
            {QUICK_OPTIONS.map((option) => (
              <Chip
                key={option.label}
                label={option.label}
                onPress={() => setDraft(addDays(new Date(), option.days))}
              />
            ))}
          </View>
        ) : null}
        <Calendar value={draft} onChange={setDraft} minDate={minDate} />
        <Button label="Tarihi seç" onPress={confirm} fullWidth />
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
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldError: { borderColor: colors.danger },
  spacer: { flex: 1 },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
