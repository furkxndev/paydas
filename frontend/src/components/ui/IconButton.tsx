import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { colors, layout, radius } from '../../theme';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  background?: string;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const IconButton = ({
  icon,
  onPress,
  size = 20,
  color = colors.text,
  background = 'transparent',
  disabled = false,
  style,
  accessibilityLabel,
}: IconButtonProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    hitSlop={layout.hitSlop}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [
      styles.base,
      { backgroundColor: background, width: size + 20, height: size + 20 },
      disabled && styles.disabled,
      pressed && styles.pressed,
      style,
    ]}
  >
    <Ionicons name={icon} size={size} color={color} />
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
});
