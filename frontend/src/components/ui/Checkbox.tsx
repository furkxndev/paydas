import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '../../theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
  /** Yuvarlak (radio) görünüm */
  round?: boolean;
  disabled?: boolean;
}

export const Checkbox = ({
  checked,
  onPress,
  size = 24,
  color = colors.primary,
  round = false,
  disabled = false,
}: CheckboxProps) => (
  <Pressable onPress={onPress} disabled={disabled} hitSlop={10}>
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: round ? size / 2 : radius.sm,
          borderColor: checked ? color : colors.borderStrong,
          backgroundColor: checked ? color : 'transparent',
        },
        disabled && styles.disabled,
      ]}
    >
      {checked ? (
        <Ionicons name="checkmark" size={size * 0.62} color={colors.textInverse} />
      ) : null}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
});
