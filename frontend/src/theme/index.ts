import { colors } from './colors';
import { shadows } from './shadows';
import { spacing, radius, layout } from './spacing';
import { typography } from './typography';

export { colors, palette, avatarColors } from './colors';
export type { ColorToken } from './colors';
export { spacing, radius, layout } from './spacing';
export { typography } from './typography';
export { shadows } from './shadows';

export const theme = { colors, spacing, radius, layout, typography, shadows } as const;
export type Theme = typeof theme;
