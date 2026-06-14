import React from 'react';
import { View, Pressable } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Screen, Text, Card, Avatar } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useSession, usePartnerId } from '@/core/state/session';
import { useMood, MOODS } from '@/features/mood/application/useMood';
import { MoodPicker } from '@/features/mood/ui/MoodPicker';
import { useTaps } from '@/features/heartbeat/application/useHeartbeat';

function moodMeta(key?: string) {
  return MOODS.find((m) => m.key === key);
}

export default function Home() {
  const theme = useTheme();
  const { profile, couple } = useSession();
  const { mine, partner, setMood } = useMood();
  const heartbeat = useTaps('heartbeat');

  const partnerId = usePartnerId() ?? '';
  const partnerName = couple?.members?.[partnerId]?.displayName ?? 'Partner';

  return (
    <Screen scroll>
      <Text variant="display">Hi {profile?.displayName ?? 'love'} 💞</Text>
      <Text variant="body" color="textMuted" style={{ marginBottom: theme.spacing.lg }}>
        You & {partnerName}
      </Text>

      {/* Partner mood snapshot */}
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="label" color="textMuted">
          {partnerName} is feeling
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Text style={{ fontSize: 40 }}>{moodMeta(partner?.mood)?.emoji ?? '🫥'}</Text>
          <View>
            <Text variant="heading">{moodMeta(partner?.mood)?.label ?? 'No mood yet'}</Text>
            {partner?.at ? (
              <Text variant="caption" color="textMuted">
                {formatDistanceToNow(partner.at, { addSuffix: true })}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>

      {/* My mood — one tap */}
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
          How are you feeling?
        </Text>
        <MoodPicker selected={mine?.mood} onSelect={(m) => setMood(m)} />
      </Card>

      {/* Heartbeat button (F19) */}
      <Card style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <Text variant="label" color="textMuted">
          Send a heartbeat
        </Text>
        <Pressable
          onPress={heartbeat.tap}
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: theme.colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: theme.spacing.md,
          }}
        >
          <Text style={{ fontSize: 48 }}>❤️</Text>
        </Pressable>
        <Text variant="caption" color="textMuted">
          Today {heartbeat.state?.today ?? 0} · All time {heartbeat.state?.total ?? 0}
        </Text>
      </Card>

      <Text variant="caption" color="textMuted" center>
        Live via Realtime DB — instant, and effectively free for two people.
      </Text>
    </Screen>
  );
}
