import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/tokens';

type Variant = keyof typeof typography;

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: 'text' | 'textMuted' | 'primary' | 'onPrimary' | 'danger' | 'success';
  center?: boolean;
}

/** Theme-aware text primitive. All copy in the app uses this. */
export function Text({
  variant = 'body',
  color = 'text',
  center,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        typography[variant],
        { color: theme.colors[color], textAlign: center ? 'center' : undefined },
        style,
      ]}
      {...rest}
    />
  );
}
