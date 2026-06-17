import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen, Text, Card } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useSession, usePartnerId } from '@/core/state/session';
import { useTaps } from '@/features/heartbeat/application/useHeartbeat';
import type { TapState } from '@/features/heartbeat/data/heartbeatRepository';

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

/** One side's meter — used for both "me" and "partner". */
function MeterCard({ title, state }: { title: string; state: TapState | null }) {
  const theme = useTheme();
  const total = state?.total ?? 0;
  const milestone = currentMilestone(total);
  const next = nextMilestone(total);
  const progress = next ? Math.min(1, total / next.at) : 1;

  return (
    <Card style={{ marginBottom: theme.spacing.lg }}>
      <Text variant="label" color="textMuted">
        {title}
      </Text>

      <Text variant="display" color="primary" style={{ marginTop: theme.spacing.sm }}>
        {total}
      </Text>

      {/* Badge + milestone meter */}
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: theme.colors.primaryMuted,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          marginTop: theme.spacing.md,
        }}
      >
        <Text variant="label" color="primary">
          {milestone ? milestone.label : 'Just getting started 💞'}
        </Text>
      </View>

      {next ? (
        <>
          <View style={[styles.track, { backgroundColor: theme.colors.surfaceAlt }]}>
            <View
              style={[styles.fill, { backgroundColor: theme.colors.primary, width: `${progress * 100}%` }]}
            />
          </View>
          <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
            {next.at - total} more to reach “{next.label}”
          </Text>
        </>
      ) : (
        <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
          Maxed out the meter. Hopeless, in the best way. 🥰
        </Text>
      )}
    </Card>
  );
}

export default function MissingYouScreen() {
  const theme = useTheme();
  const { couple } = useSession();
  const partnerId = usePartnerId() ?? '';
  const partnerName = couple?.members?.[partnerId]?.displayName ?? 'Your partner';

  const { state, partnerState, tap } = useTaps('missingYou');

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
            { backgroundColor: theme.colors.primaryMuted, transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Text style={{ fontSize: 64 }}>💭</Text>
          <Text variant="label" color="primary">
            I miss you
          </Text>
        </Pressable>
      </View>

      {/* My side */}
      <MeterCard title={`You miss ${partnerName}`} state={state} />

      {/* Partner side — how much they miss you */}
      <MeterCard title={`${partnerName} misses you`} state={partnerState} />

      {/* Friendly comparison */}
      {state && partnerState ? (
        <Animated.View entering={FadeIn}>
          <Text variant="caption" color="textMuted" center>
            {state.total > partnerState.total
              ? `You miss ${partnerName} more 🥹`
              : partnerState.total > state.total
                ? `${partnerName} misses you more 🫶`
                : 'You miss each other equally 💞'}
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
