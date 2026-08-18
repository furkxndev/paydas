import React, { useMemo } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { AppHeader, EmptyState, NotificationItem, Screen } from '../../components';
import { useHouseholdData } from '../../hooks';
import { colors, layout, spacing, typography } from '../../theme';
import { isSameDay } from '../../utils';
import type { AppNotification } from '../../types';
import type { AppScreenProps } from '../../navigation/types';

/** Bildirimleri gün bazında gruplar */
const groupByDay = (notifications: AppNotification[]) => {
  const sections: { title: string; data: AppNotification[] }[] = [];
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    const title = isSameDay(date, today)
      ? 'Bugün'
      : isSameDay(date, yesterday)
        ? 'Dün'
        : 'Daha önce';

    const existing = sections.find((section) => section.title === title);
    if (existing) existing.data.push(notification);
    else sections.push({ title, data: [notification] });
  });

  return sections;
};

export const NotificationsScreen = ({ navigation }: AppScreenProps<'Notifications'>) => {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    refreshing,
    refresh,
  } = useHouseholdData();

  const sections = useMemo(() => groupByDay(notifications), [notifications]);

  const handlePress = (notification: AppNotification) => {
    if (!notification.read) markNotificationRead(notification.id);

    const { billId, expenseId, choreId } = notification.data ?? {};
    if (billId) navigation.navigate('BillDetail', { billId });
    else if (expenseId) navigation.navigate('ExpenseDetail', { expenseId });
    else if (choreId) navigation.navigate('AddChore', { choreId });
  };

  return (
    <Screen edgeToEdge>
      <View style={styles.header}>
        <AppHeader
          title="Bildirimler"
          subtitle={unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tümü okundu'}
          onBack={() => navigation.goBack()}
          right={
            unreadCount > 0 ? (
              <Pressable onPress={markAllNotificationsRead} hitSlop={8}>
                <Text style={styles.markAll}>Tümünü okundu yap</Text>
              </Pressable>
            ) : undefined
          }
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refresh({ silent: true })}
            tintColor={colors.primary}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <NotificationItem notification={item} onPress={() => handlePress(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="Bildirim yok"
            description="Yeni gider, fatura hatırlatması ve ev işi bildirimleri burada görünecek."
          />
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenPadding },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    ...typography.label,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  markAll: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
