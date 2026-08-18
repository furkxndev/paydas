import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { IconButton } from './IconButton';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** Sağ üstte tek bir simge eylemi */
  action?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label?: string };
  large?: boolean;
}

export const AppHeader = ({
  title,
  subtitle,
  onBack,
  right,
  action,
  large = false,
}: AppHeaderProps) => (
  <View style={styles.container}>
    {onBack ? (
      <IconButton
        icon="chevron-back"
        onPress={onBack}
        background={colors.surface}
        accessibilityLabel="Geri"
      />
    ) : null}
    <View style={styles.textGroup}>
      <Text style={large ? typography.title : typography.heading} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={typography.caption} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {right}
    {action ? (
      <IconButton
        icon={action.icon}
        onPress={action.onPress}
        background={colors.surface}
        accessibilityLabel={action.label}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
});
