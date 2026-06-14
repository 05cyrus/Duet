/**
 * Design tokens — the single source of truth for the "modern premium, soft
 * gradient, Apple-quality" aesthetic. Palettes below feed light & dark themes.
 */

export const palette = {
  // brand — warm romantic gradient anchors
  blush: '#FF6F91',
  rose: '#FF8FA3',
  coral: '#FF7E67',
  lavender: '#9B8CFF',
  plum: '#6C4AB6',
  ink: '#0E0B16',
  cloud: '#FFFFFF',
  // neutrals
  gray50: '#F7F7FB',
  gray100: '#EEEEF4',
  gray200: '#D9D9E3',
  gray400: '#9A9AA8',
  gray600: '#5A5A68',
  gray800: '#26262F',
  gray900: '#16161D',
  // semantic
  success: '#34C759',
  warning: '#FF9F0A',
  danger: '#FF3B30',
} as const;

export const gradients = {
  love: ['#FF6F91', '#FF8FA3', '#9B8CFF'] as const,
  sunset: ['#FF7E67', '#FF6F91', '#6C4AB6'] as const,
  night: ['#16161D', '#26262F', '#6C4AB6'] as const,
  calm: ['#9B8CFF', '#FF8FA3'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type GradientName = keyof typeof gradients;
