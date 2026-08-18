import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';
import { MONTHS_TR, isSameDay, startOfDay } from '../../utils';

interface CalendarProps {
  value: Date;
  onChange: (date: Date) => void;
  /** Bu tarihten önceki günler seçilemez */
  minDate?: Date;
}

const WEEKDAY_LABELS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

/** Pazartesi ile başlayan hafta düzeni (0 = Pazartesi) */
const mondayFirstIndex = (day: number): number => (day + 6) % 7;

export const Calendar = ({ value, onChange, minDate }: CalendarProps) => {
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = mondayFirstIndex(firstDay.getDay());

    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [visibleMonth]);

  const shiftMonth = (delta: number) =>
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );

  const minTime = minDate ? startOfDay(minDate).getTime() : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} style={styles.navButton}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={typography.subheading}>
          {MONTHS_TR[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
        </Text>
        <Pressable onPress={() => shiftMonth(1)} hitSlop={10} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day, index) => {
          if (!day) return <View key={`blank-${index}`} style={styles.cell} />;

          const selected = isSameDay(day, value);
          const today = isSameDay(day, new Date());
          const disabled = minTime !== null && startOfDay(day).getTime() < minTime;

          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => !disabled && onChange(day)}
              disabled={disabled}
              style={styles.cell}
            >
              <View
                style={[
                  styles.dayBubble,
                  selected && styles.daySelected,
                  !selected && today && styles.dayToday,
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    selected && styles.daySelectedText,
                    disabled && styles.dayDisabledText,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    ...typography.caption,
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubble: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  daySelectedText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  dayDisabledText: {
    color: colors.textMuted,
    opacity: 0.5,
  },
});
