import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '@/core/theme';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
}

/** Surface container with rounded corners + soft shadow. */
export function Card({ elevated = true, padded = true, style, children, ...rest }: CardProps) {
  const theme = useTheme();
  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: padded ? theme.spacing.lg : 0,
    borderWidth: theme.mode === 'dark' ? 1 : 0,
    borderColor: theme.colors.border,
    ...(elevated ? theme.shadow.card : {}),
  };
  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
}
