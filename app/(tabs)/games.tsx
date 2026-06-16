import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, Text, FeatureTile } from '@/core/ui';
import { useTheme } from '@/core/theme';

/** Games hub — F7 cards, F8 wheel, F17 couple games. Content-driven, mostly $0. */
export default function Games() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Screen scroll>
      <Text variant="display" style={{ marginBottom: theme.spacing.lg }}>
        Games 🎮
      </Text>
      <FeatureTile emoji="🃏" title="Challenge Cards" subtitle="Cute · Romantic · Spicy · Wild" badge="Free" onPress={() => router.push('/cards')} />
      <FeatureTile emoji="🎡" title="Couple Wheel" subtitle="Spin for a reward" badge="Free" onPress={() => router.push('/wheel')} />
      <FeatureTile emoji="⚖️" title="This or That" subtitle="Quick-fire preferences" badge="Free" />
      <FeatureTile emoji="🧠" title="Who Knows Me Better" subtitle="Auto-generated quiz" badge="Free" />
      <FeatureTile emoji="❓" title="Couple Trivia" subtitle="Built from your memories" badge="Free" />
      <FeatureTile emoji="🙊" title="Never Have I Ever" subtitle="Card deck" badge="Free" />
      <FeatureTile emoji="🏙️" title="Future Planning" subtitle="Cities · pets · home · trips · overlap %" badge="Free" />
    </Screen>
  );
}
