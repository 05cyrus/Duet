import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/core/theme';
import { Text } from '@/core/ui';
import type { MoodCount } from '../application/useMoodHistory';

/**
 * Horizontal proportional bars — one row per mood, widths relative to the
 * busiest mood. Uses plain Views (no chart lib) to stay light and themeable,
 * mirroring the meter in the Missing-You screen.
 */
export function MoodDistribution({ data }: { data: MoodCount[] }) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {data.map((d) => {
        const pct = d.count / max;
        return (
          <View key={d.key} style={styles.row}>
            <Text style={styles.emoji}>{d.emoji}</Text>
            <View style={styles.barArea}>
              <View style={[styles.track, { backgroundColor: theme.colors.surfaceAlt }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: d.count > 0 ? theme.colors.primary : 'transparent',
                      width: `${Math.max(pct * 100, d.count > 0 ? 8 : 0)}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.labelRow}>
                <Text variant="caption" color="textMuted">
                  {d.label}
                </Text>
                <Text variant="caption" color={d.count > 0 ? 'primary' : 'textMuted'}>
                  {d.count}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 22, width: 28, textAlign: 'center' },
  barArea: { flex: 1, gap: 3 },
  track: { height: 14, borderRadius: 7, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
