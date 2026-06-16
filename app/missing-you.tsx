import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen, Text, Card } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useTaps } from '@/features/heartbeat/application/useHeartbeat';

// Playful milestones based on all-time misses.
const MILESTONES = [
  { at: 1, label: 'First miss 🥺' },
  { at: 10, label: 'Clingy (cute) 💕' },
  { at: 50, label: 'Certified lovebird 🐦' },
  { at: 100, label: 'Hopeless romantic 🌹' },
  { at: 250, label: 'Can’t-live-without-you 💞' },
];

function currentMilestone(total: number) {
  return [...MILESTONES].reverse().find((m) => total >= m.at) ?? null;
}
function nextMilestone(total: number) {
  return MILESTONES.find((m) => total < m.at) ?? null;
}

export default function MissingYouScreen() {
  const theme = useTheme();
  const { state, tap } = useTaps('missingYou');
  const today = state?.today ?? 0;
  const total = state?.total ?? 0;

  const milestone = currentMilestone(total);
  const next = nextMilestone(total);
  const progress = next ? Math.min(1, total / next.at) : 1;

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Missing You' }} />
      <Text variant="body" color="textMuted" center style={{ marginBottom: theme.spacing.lg }}>
        Tap whenever you miss them — they’ll feel it 💭
      </Text>

      <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
        <Pressable
          onPress={tap}
          style={({ pressed }) => [
            styles.bigButton,
            {
              backgroundColor: theme.colors.primaryMuted,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
        >
          <Text style={{ fontSize: 64 }}>💭</Text>
          <Text variant="label" color="primary">
            I miss you
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="display" color="primary">
            {today}
          </Text>
          <Text variant="caption" color="textMuted">
            Today
          </Text>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="display" color="primary">
            {total}
          </Text>
          <Text variant="caption" color="textMuted">
            All time
          </Text>
        </Card>
      </View>

      {/* Milestone meter */}
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text variant="heading">
          {milestone ? milestone.label : 'Just getting started 💞'}
        </Text>
        {next ? (
          <>
            <View style={[styles.track, { backgroundColor: theme.colors.surfaceAlt }]}>
              <View
                style={[
                  styles.fill,
                  { backgroundColor: theme.colors.primary, width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
              {next.at - total} more to reach “{next.label}”
            </Text>
          </>
        ) : (
          <Text variant="caption" color="textMuted">
            You’ve maxed out the meter. Hopeless, in the best way. 🥰
          </Text>
        )}
      </Card>

      {today > 0 ? (
        <Animated.View entering={FadeIn} style={{ marginTop: theme.spacing.lg }}>
          <Text variant="caption" color="textMuted" center>
            That’s {today} {today === 1 ? 'time' : 'times'} you’ve missed them just today 🫶
          </Text>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bigButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  track: { height: 12, borderRadius: 6, marginTop: 12, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
});
