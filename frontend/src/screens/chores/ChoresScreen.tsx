import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  Avatar,
  Card,
  ChoreListItem,
  EmptyState,
  FAB,
  Screen,
  SectionHeader,
  SegmentedControl,
  StatTile,
} from '../../components';
import { useAuth, useChores, useHousehold, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import { getFirstName } from '../../utils';
import type { ChoreFilter } from '../../hooks';

const FILTERS: { key: ChoreFilter; label: string }[] = [
  { key: 'all', label: 'Bekleyen' },
  { key: 'mine', label: 'Bende' },
  { key: 'unassigned', label: 'Boşta' },
  { key: 'done', label: 'Biten' },
];

export const ChoresScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { getMemberName } = useHousehold();
  const [filter, setFilter] = useState<ChoreFilter>('all');
  const { chores, myPending, overdue, leaderboard, toggleChore, refreshing, refresh } =
    useChores(filter);
  const { showSuccess } = useToast();

  const handleToggle = async (choreId: string, completed: boolean) => {
    await toggleChore(choreId, completed);
    if (completed) showSuccess('Görev tamamlandı, teşekkürler!');
  };

  const topContributor = leaderboard[0];

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => refresh({ silent: true })}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={styles.content}
      floatingAction={
        <FAB onPress={() => navigation.navigate('AddChore')} label="Görev ekle" />
      }
    >
      <View style={styles.header}>
        <Text style={typography.title}>Ev işleri</Text>
        <Text style={typography.caption}>Görevleri paylaştır, kimin ne yaptığı net olsun</Text>
      </View>

      <View style={styles.tiles}>
        <StatTile
          label="Sende bekleyen"
          value={String(myPending.length)}
          icon="person-circle"
          tone={colors.primary}
          toneSoft={colors.primarySoft}
          caption={
            overdue.length > 0 ? `${overdue.length} görev gecikmiş` : 'Güncel görünüyorsun'
          }
        />
        <StatTile
          label="Ayın yıldızı"
          value={topContributor ? getFirstName(getMemberName(topContributor.userId)) : '—'}
          icon="trophy"
          tone={colors.warning}
          toneSoft={colors.warningSoft}
          caption={topContributor ? `${topContributor.points} katkı puanı` : 'Henüz veri yok'}
        />
      </View>

      <View style={styles.filterRow}>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      <Card padded={false} style={styles.listCard}>
        {chores.length === 0 ? (
          <EmptyState
            icon="checkmark-done-circle-outline"
            title={
              filter === 'done'
                ? 'Tamamlanmış görev yok'
                : filter === 'mine'
                  ? 'Sana atanmış görev yok'
                  : filter === 'unassigned'
                    ? 'Boşta görev yok'
                    : 'Bekleyen ev işi yok'
            }
            description={
              filter === 'done'
                ? 'Görevler tamamlandıkça burada listelenir.'
                : 'Temizlik, çöp, market gibi işleri ekleyip ev arkadaşlarına atayabilirsin.'
            }
            actionLabel={filter === 'done' ? undefined : 'Görev oluştur'}
            onAction={filter === 'done' ? undefined : () => navigation.navigate('AddChore')}
            compact
          />
        ) : (
          chores.map((chore, index) => (
            <View key={chore.id}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <ChoreListItem
                chore={chore}
                assigneeName={chore.assignedTo ? getMemberName(chore.assignedTo) : undefined}
                onToggle={() => handleToggle(chore.id, chore.status !== 'done')}
                onPress={() => navigation.navigate('AddChore', { choreId: chore.id })}
              />
            </View>
          ))
        )}
      </Card>

      {leaderboard.some((row) => row.completedCount > 0) ? (
        <View style={styles.section}>
          <SectionHeader title="Katkı sıralaması" subtitle="Tamamlanan görev puanları" />
          <Card style={styles.leaderboardCard}>
            {leaderboard.map((row, index) => (
              <View key={row.userId} style={styles.leaderRow}>
                <View style={styles.rank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Avatar name={getMemberName(row.userId)} seed={row.userId} size={34} />
                <View style={styles.leaderText}>
                  <Text style={typography.bodyStrong} numberOfLines={1}>
                    {getMemberName(row.userId)}
                    {row.userId === user?.id ? ' (sen)' : ''}
                  </Text>
                  <Text style={typography.caption}>{row.completedCount} görev tamamlandı</Text>
                </View>
                <View style={styles.points}>
                  <Ionicons name="star" size={13} color={colors.warning} />
                  <Text style={styles.pointsText}>{row.points}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 100 },
  header: {
    gap: 2,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  filterRow: { marginTop: spacing.xl, marginBottom: spacing.md },
  listCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  section: { marginTop: spacing.xl },
  leaderboardCard: { gap: spacing.xs },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rank: {
    width: 22,
    alignItems: 'center',
  },
  rankText: {
    ...typography.captionStrong,
    color: colors.textMuted,
  },
  leaderText: { flex: 1, gap: 2 },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.warningSoft,
  },
  pointsText: {
    ...typography.captionStrong,
    color: colors.warningDark,
  },
});
