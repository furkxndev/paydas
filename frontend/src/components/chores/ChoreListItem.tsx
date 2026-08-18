import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getPriorityMeta } from '../../constants';
import { Chore } from '../../types';
import { colors, radius, spacing, typography } from '../../theme';
import { daysUntil, formatDueLabel, getFirstName } from '../../utils';
import { Avatar } from '../ui/Avatar';
import { Checkbox } from '../ui/Checkbox';

interface ChoreListItemProps {
  chore: Chore;
  assigneeName?: string;
  onToggle: () => void;
  onPress?: () => void;
  /** Atanan kişi bilgisini gizle (kişisel listelerde) */
  hideAssignee?: boolean;
}

export const ChoreListItem = ({
  chore,
  assigneeName,
  onToggle,
  onPress,
  hideAssignee = false,
}: ChoreListItemProps) => {
  const done = chore.status === 'done';
  const priority = getPriorityMeta(chore.priority);
  const overdue = !done && chore.dueDate ? daysUntil(chore.dueDate) < 0 : false;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Checkbox
        checked={done}
        onPress={onToggle}
        round
        color={done ? colors.success : priority.color}
      />

      <View style={styles.content}>
        <Text style={[typography.bodyStrong, done && styles.doneText]} numberOfLines={1}>
          {chore.title}
        </Text>
        <View style={styles.metaRow}>
          {chore.dueDate && !done ? (
            <View style={styles.metaItem}>
              <Ionicons
                name={overdue ? 'alert-circle' : 'time-outline'}
                size={12}
                color={overdue ? colors.danger : colors.textMuted}
              />
              <Text style={[styles.metaText, overdue && { color: colors.danger }]}>
                {formatDueLabel(chore.dueDate)}
              </Text>
            </View>
          ) : null}
          {chore.recurrence !== 'none' ? (
            <View style={styles.metaItem}>
              <Ionicons name="repeat" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}>Tekrarlı</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.metaText}>{chore.points} puan</Text>
          </View>
        </View>
      </View>

      {!hideAssignee ? (
        chore.assignedTo && assigneeName ? (
          <View style={styles.assignee}>
            <Avatar name={assigneeName} seed={chore.assignedTo} size={30} />
            <Text style={styles.assigneeName} numberOfLines={1}>
              {getFirstName(assigneeName)}
            </Text>
          </View>
        ) : (
          <View style={styles.unassigned}>
            <Ionicons name="person-add-outline" size={16} color={colors.textMuted} />
          </View>
        )
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  content: { flex: 1, gap: spacing.xs },
  doneText: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  assignee: { alignItems: 'center', gap: 2, width: 52 },
  assigneeName: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  unassigned: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
