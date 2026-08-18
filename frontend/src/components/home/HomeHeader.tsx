import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';
import { getFirstName } from '../../utils';
import { Avatar } from '../ui/Avatar';

interface HomeHeaderProps {
  userName: string;
  userId: string;
  householdName: string;
  unreadCount: number;
  onPressProfile: () => void;
  onPressNotifications: () => void;
  onPressHousehold: () => void;
}

const greeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return 'İyi geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
};

export const HomeHeader = ({
  userName,
  userId,
  householdName,
  unreadCount,
  onPressProfile,
  onPressNotifications,
  onPressHousehold,
}: HomeHeaderProps) => (
  <View style={styles.container}>
    <Pressable onPress={onPressProfile} hitSlop={6}>
      <Avatar name={userName} seed={userId} size={46} />
    </Pressable>

    <Pressable style={styles.text} onPress={onPressHousehold}>
      <Text style={typography.caption}>
        {greeting()}, {getFirstName(userName)}
      </Text>
      <View style={styles.householdRow}>
        <Text style={typography.subheading} numberOfLines={1}>
          {householdName}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
      </View>
    </Pressable>

    <Pressable onPress={onPressNotifications} style={styles.bell} hitSlop={6}>
      <Ionicons name="notifications-outline" size={22} color={colors.text} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  text: { flex: 1, gap: 2 },
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    ...typography.captionStrong,
    color: colors.textInverse,
    fontSize: 10,
    lineHeight: 12,
  },
});
