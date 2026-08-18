import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '../../theme';

export const Divider = ({ style, inset = 0 }: { style?: ViewStyle; inset?: number }) => (
  <View style={[styles.divider, { marginLeft: inset }, style]} />
);

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
