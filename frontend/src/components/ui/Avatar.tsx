import React from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, typography } from '../../theme';
import { getAvatarColor, getInitials } from '../../utils';

interface AvatarProps {
  name: string;
  /** Renk üretimi için sabit tohum; genelde userId */
  seed?: string;
  imageUrl?: string;
  size?: number;
  style?: ViewStyle;
  /** Sağ alt köşede küçük durum noktası */
  badgeColor?: string;
  ring?: boolean;
}

export const Avatar = ({
  name,
  seed,
  imageUrl,
  size = 40,
  style,
  badgeColor,
  ring = false,
}: AvatarProps) => {
  const background = getAvatarColor(seed ?? name);
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[dimension, style]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={[dimension, styles.image]} />
      ) : (
        <View
          style={[
            dimension,
            styles.fallback,
            { backgroundColor: background },
            ring && styles.ring,
          ]}
        >
          <Text
            style={[
              styles.initials,
              // lineHeight fontSize ile birlikte ölçeklenmeli; sabit kalırsa
              // büyük avatarlarda baş harfler kırpılır
              { fontSize: size * 0.36, lineHeight: size * 0.44 },
            ]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}
      {badgeColor ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeColor,
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

interface AvatarGroupProps {
  people: { id: string; name: string; imageUrl?: string }[];
  size?: number;
  max?: number;
}

/** Üst üste binen avatar dizisi; kalanı "+N" olarak gösterir */
export const AvatarGroup = ({ people, size = 28, max = 4 }: AvatarGroupProps) => {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <View style={styles.group}>
      {visible.map((person, index) => (
        <View key={person.id} style={index > 0 ? { marginLeft: -size * 0.3 } : undefined}>
          <Avatar
            name={person.name}
            seed={person.id}
            imageUrl={person.imageUrl}
            size={size}
            ring
          />
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={[
            styles.overflow,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size * 0.3,
            },
          ]}
        >
          <Text
            style={[styles.overflowText, { fontSize: size * 0.34, lineHeight: size * 0.42 }]}
            allowFontScaling={false}
          >
            +{overflow}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: 2,
    borderColor: colors.surface,
  },
  image: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    textAlign: 'center',
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overflow: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
