import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/core/theme';
import { Text } from './Text';
import { Button } from './Button';

export interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly empty/zero-data placeholder. */
export function EmptyState({ emoji = '💞', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: theme.spacing['2xl'], gap: theme.spacing.sm }}>
      <Text style={{ fontSize: 48 }}>{emoji}</Text>
      <Text variant="heading" center>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" color="textMuted" center>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.md, width: '70%' }}>
          <Button title={actionLabel} onPress={onAction} variant="gradient" />
        </View>
      ) : null}
    </View>
  );
}
