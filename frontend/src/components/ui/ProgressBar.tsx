import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius } from '../../theme';

interface ProgressBarProps {
  /** 0 ile 1 arasında oran */
  progress: number;
  color?: string;
  background?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar = ({
  progress,
  color = colors.primary,
  background = colors.surfaceAlt,
  height = 8,
  style,
}: ProgressBarProps) => {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));

  return (
    <View style={[styles.track, { height, backgroundColor: background }, style]}>
      <View
        style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color, height }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radius.pill,
  },
});
