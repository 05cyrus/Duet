import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import type { GradientName } from '@/core/theme/tokens';

export interface GradientBackgroundProps {
  name?: GradientName;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/** Full-bleed soft gradient backdrop used on hero/auth screens. */
export function GradientBackground({ name = 'love', children, style }: GradientBackgroundProps) {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={theme.gradients[name]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
    >
      {children}
    </LinearGradient>
  );
}
