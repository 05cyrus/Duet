import { palette, gradients, spacing, radius, typography, shadow } from './tokens';

export interface ThemeColors {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryMuted: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  onPrimary: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  gradients: typeof gradients;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadow: typeof shadow;
}

const shared = { gradients, spacing, radius, typography, shadow };

export const lightTheme: Theme = {
  mode: 'light',
  ...shared,
  colors: {
    bg: palette.gray50,
    bgElevated: palette.cloud,
    surface: palette.cloud,
    surfaceAlt: palette.gray100,
    border: palette.gray200,
    text: palette.ink,
    textMuted: palette.gray600,
    textInverse: palette.cloud,
    primary: palette.blush,
    primaryMuted: '#FFD9E1',
    accent: palette.lavender,
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    onPrimary: palette.cloud,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  ...shared,
  colors: {
    bg: palette.ink,
    bgElevated: palette.gray900,
    surface: palette.gray900,
    surfaceAlt: palette.gray800,
    border: palette.gray800,
    text: palette.cloud,
    textMuted: palette.gray400,
    textInverse: palette.ink,
    primary: palette.rose,
    primaryMuted: '#3A2230',
    accent: palette.lavender,
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    onPrimary: palette.ink,
  },
};
