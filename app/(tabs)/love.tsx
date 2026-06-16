import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, Text, FeatureTile } from '@/core/ui';
import { useTheme } from '@/core/theme';

/** Love hub — relationship-building features (F2, F3, F9, F16, F19, F20, F21). */
export default function Love() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Screen scroll>
      <Text variant="display" style={{ marginBottom: theme.spacing.lg }}>
        Love 💞
      </Text>
      <FeatureTile emoji="💌" title="Love Note Capsules" subtitle="Messages that unlock later" badge="Free" />
      <FeatureTile emoji="🔖" title="Shared Dream Board" subtitle="Pin your future together" badge="Free" />
      <FeatureTile emoji="🧭" title="Fantasy Bucket List" subtitle="Reveals only on a match" badge="Free" />
      <FeatureTile emoji="🕰️" title="Relationship Timeline" subtitle="Your story, in photos" badge="Free" />
      <FeatureTile emoji="😊" title="Mood History" subtitle="See your moods over time" badge="Free" />
      <FeatureTile emoji="💭" title="Missing You Meter" subtitle="Tap when you miss them" badge="Free" onPress={() => router.push('/missing-you')} />
      <FeatureTile emoji="✉️" title="AI Love Letter" subtitle="Generated from your memories" badge="AI · Free tier" />
    </Screen>
  );
}
