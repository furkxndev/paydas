import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppNotification, NotificationType } from '../../types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatRelativeDate, formatTime } from '../../utils';

const TYPE_META: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }
> = {
  bill_due: { icon: 'time', color: colors.warning, background: colors.warningSoft },
  bill_overdue: { icon: 'alert-circle', color: colors.danger, background: colors.dangerSoft },
  bill_paid: {
    icon: 'checkmark-circle',
    color: colors.success,
    background: colors.successSoft,
  },
  expense_added: { icon: 'receipt', color: colors.primary, background: colors.primarySoft },
  chore_assigned: { icon: 'clipboard', color: colors.accent, background: colors.accentSoft },
  chore_due: { icon: 'alarm', color: colors.warning, background: colors.warningSoft },
  chore_completed: {
    icon: 'checkmark-done',
    color: colors.success,
    background: colors.successSoft,
  },
  settlement: { icon: 'swap-horizontal', color: colors.info, background: colors.infoSoft },
  member_joined: { icon: 'person-add', color: colors.primary, background: colors.primarySoft },
};

interface NotificationItemProps {
  notification: AppNotification;
  onPress: () => void;
}

export const NotificationItem = ({ notification, onPress }: NotificationItemProps) => {
  const meta = TYPE_META[notification.type] ?? TYPE_META.expense_added;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        !notification.read && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: meta.background }]}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={styles.content}>
        <Text style={typography.bodyStrong} numberOfLines={2}>
          {notification.title}
        </Text>
        <Text style={typography.caption} numberOfLines={3}>
          {notification.body}
        </Text>
        <Text style={styles.time}>
          {formatRelativeDate(notification.createdAt)} · {formatTime(notification.createdAt)}
        </Text>
      </View>
      {!notification.read ? <View style={styles.dot} /> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  unread: {
    backgroundColor: colors.primarySoft,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 2 },
  time: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  pressed: { opacity: 0.7 },
});
