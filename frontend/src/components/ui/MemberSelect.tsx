import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HouseholdMember } from '../../types';
import { colors, radius, spacing, typography } from '../../theme';
import { getFirstName } from '../../utils';
import { Avatar } from './Avatar';
import { Checkbox } from './Checkbox';

interface MemberSelectProps {
  members: HouseholdMember[];
  value: string | null;
  onChange: (userId: string) => void;
  /** "Kimse" seçeneği eklensin mi (atanmamış görevler için) */
  allowNone?: boolean;
  noneLabel?: string;
  label?: string;
}

/** Tek üye seçimi (ödeyen kişi, görev sorumlusu) */
export const MemberSelect = ({
  members,
  value,
  onChange,
  allowNone = false,
  noneLabel = 'Atanmadı',
  label,
}: MemberSelectProps) => (
  <View style={styles.container}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {allowNone ? (
        <Pressable
          onPress={() => onChange('')}
          style={[styles.option, !value && styles.optionSelected]}
        >
          <View style={styles.noneAvatar}>
            <Text style={styles.noneText}>?</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {noneLabel}
          </Text>
        </Pressable>
      ) : null}
      {members.map((member) => {
        const selected = member.userId === value;
        return (
          <Pressable
            key={member.userId}
            onPress={() => onChange(member.userId)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Avatar name={member.user.fullName} seed={member.userId} size={44} />
            <Text style={styles.name} numberOfLines={1}>
              {getFirstName(member.user.fullName)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  </View>
);

interface MemberMultiSelectProps {
  members: HouseholdMember[];
  value: string[];
  onChange: (userIds: string[]) => void;
  label?: string;
  /** Her üyenin yanında gösterilecek ek bilgi (pay tutarı vb.) */
  renderTrailing?: (member: HouseholdMember) => React.ReactNode;
}

/** Gideri paylaşan üyelerin seçimi */
export const MemberMultiSelect = ({
  members,
  value,
  onChange,
  label,
  renderTrailing,
}: MemberMultiSelectProps) => {
  const toggle = (userId: string) => {
    onChange(value.includes(userId) ? value.filter((id) => id !== userId) : [...value, userId]);
  };

  const allSelected = value.length === members.length;

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.multiHeader}>
          <Text style={styles.label}>{label}</Text>
          <Pressable
            onPress={() => onChange(allSelected ? [] : members.map((m) => m.userId))}
            hitSlop={8}
          >
            <Text style={styles.selectAll}>
              {allSelected ? 'Hiçbirini seçme' : 'Tümünü seç'}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.list}>
        {members.map((member) => {
          const selected = value.includes(member.userId);
          return (
            <Pressable
              key={member.userId}
              onPress={() => toggle(member.userId)}
              style={[styles.listRow, selected && styles.listRowSelected]}
            >
              <Checkbox checked={selected} onPress={() => toggle(member.userId)} size={22} />
              <Avatar name={member.user.fullName} seed={member.userId} size={34} />
              <Text style={[typography.bodyStrong, styles.listName]} numberOfLines={1}>
                {member.user.fullName}
              </Text>
              {renderTrailing?.(member)}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  option: {
    width: 78,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  noneAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noneText: {
    ...typography.bodyStrong,
    color: colors.textMuted,
  },
  name: {
    ...typography.caption,
    color: colors.text,
    fontSize: 12,
  },
  multiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectAll: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  list: { gap: spacing.xs },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  listRowSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  listName: { flex: 1 },
});
