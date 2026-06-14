import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/core/theme';
import { Text } from './Text';
import { Card } from './Card';

export interface FeatureTileProps {
  emoji: string;
  title: string;
  subtitle?: string;
  badge?: string; // e.g. "MVP", "Premium", "Free"
  onPress?: () => void;
}

/** Tappable feature entry used on the hub tabs (Love, Games, Insights). */
export function FeatureTile({ emoji, title, subtitle, badge, onPress }: FeatureTileProps) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={{ marginBottom: theme.spacing.md }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <Text style={{ fontSize: 30 }}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="heading">{title}</Text>
              {badge ? (
                <View style={{ backgroundColor: theme.colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                  <Text variant="caption" color="primary">
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>
            {subtitle ? (
              <Text variant="caption" color="textMuted">
                {subtitle}
              </Text>
            ) : null}
          </View>
          {onPress ? <Text color="textMuted">›</Text> : null}
        </View>
      </Card>
    </Pressable>
  );
}
