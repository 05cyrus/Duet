import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { format, isToday, isYesterday } from 'date-fns';
import { useTheme } from '@/core/theme';
import { Text } from '@/core/ui';
import { MOODS } from '../application/useMood';
import type { MoodEntry, MoodKey } from '@/types/models';

function moodMeta(key: MoodKey) {
  return MOODS.find((m) => m.key === key);
}

function dayLabel(millis: number): string {
  if (isToday(millis)) return 'Today';
  if (isYesterday(millis)) return 'Yesterday';
  return format(millis, 'd MMMM yyyy');
}

interface DayGroup {
  day: number; // local-midnight ms, used as a stable key
  label: string;
  entries: MoodEntry[];
}

/** Group entries (already newest-first) by calendar day, preserving order. */
function groupByDay(entries: MoodEntry[]): DayGroup[] {
  const groups: DayGroup[] = [];
  let current: DayGroup | null = null;
  for (const e of entries) {
    if (e.createdAt <= 0) continue; // pending server timestamp — skip until it resolves
    const d = new Date(e.createdAt);
    d.setHours(0, 0, 0, 0);
    const day = d.getTime();
    if (!current || current.day !== day) {
      current = { day, label: dayLabel(e.createdAt), entries: [] };
      groups.push(current);
    }
    current.entries.push(e);
  }
  return groups;
}

/**
 * A scannable, chronological log of every mood either partner has set.
 * `nameFor` maps a userId → display name so each entry shows who felt what.
 */
export function MoodTimeline({
  entries,
  nameFor,
}: {
  entries: MoodEntry[];
  nameFor: (userId: string) => string;
}) {
  const theme = useTheme();
  const groups = useMemo(() => groupByDay(entries), [entries]);

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {groups.map((g) => (
        <View key={g.day} style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">
            {g.label}
          </Text>
          {g.entries.map((e) => {
            const meta = moodMeta(e.mood);
            return (
              <View
                key={e.id}
                style={[styles.row, { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md }]}
              >
                <Text style={styles.emoji}>{meta?.emoji ?? '🫥'}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.headerRow}>
                    <Text variant="label">{meta?.label ?? 'Mood'}</Text>
                    <Text variant="caption" color="textMuted">
                      {format(e.createdAt, 'h:mm a')}
                    </Text>
                  </View>
                  <Text variant="caption" color="primary">
                    {nameFor(e.userId)}
                  </Text>
                  {e.note ? (
                    <Text variant="body" color="textMuted" style={{ marginTop: 2 }}>
                      “{e.note}”
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12 },
  emoji: { fontSize: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
