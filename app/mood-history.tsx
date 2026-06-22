import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Screen, Text, Card, EmptyState } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useSession } from '@/core/state/session';
import { useMoodHistory } from '@/features/mood/application/useMoodHistory';
import { MoodDistribution } from '@/features/mood/ui/MoodDistribution';
import { MoodTimeline } from '@/features/mood/ui/MoodTimeline';

/** A small headline stat (streak / total / top mood). */
function Stat({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text variant="title" color="primary">
        {value}
      </Text>
      <Text variant="caption" color="textMuted" center>
        {label}
      </Text>
    </View>
  );
}

export default function MoodHistoryScreen() {
  const theme = useTheme();
  const { couple, uid } = useSession();
  const { loading, entries, distribution, weekly, total, topMood, streakDays } = useMoodHistory();

  const nameFor = (userId: string) => {
    if (userId === uid) return 'You';
    return couple?.members?.[userId]?.displayName ?? 'Partner';
  };

  const hasWeekly = weekly.some((w) => w.count > 0);

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Mood History' }} />

      {loading ? (
        <Text variant="body" color="textMuted" center style={{ marginTop: theme.spacing.xl }}>
          Loading your moods…
        </Text>
      ) : total === 0 ? (
        <EmptyState
          emoji="😊"
          title="No moods yet"
          subtitle="Set a mood from the Home screen and it’ll start showing up here."
        />
      ) : (
        <>
          {/* Headline stats */}
          <Card style={{ marginBottom: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row' }}>
              <Stat value={`${streakDays}`} label={streakDays === 1 ? 'day streak' : 'day streak 🔥'} />
              <Stat value={`${total}`} label="moods logged" />
              <Stat value={topMood?.emoji ?? '—'} label={topMood ? `most: ${topMood.label}` : 'most common'} />
            </View>
          </Card>

          {/* Last 7 days */}
          <Card style={{ marginBottom: theme.spacing.lg }}>
            <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
              This week
            </Text>
            {hasWeekly ? (
              <MoodDistribution data={weekly} />
            ) : (
              <Text variant="body" color="textMuted">
                No moods set in the last 7 days.
              </Text>
            )}
          </Card>

          {/* All-time distribution */}
          <Card style={{ marginBottom: theme.spacing.lg }}>
            <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
              All time
            </Text>
            <MoodDistribution data={distribution} />
          </Card>

          {/* Timeline */}
          <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
            Timeline
          </Text>
          <MoodTimeline entries={entries} nameFor={nameFor} />
        </>
      )}
    </Screen>
  );
}
