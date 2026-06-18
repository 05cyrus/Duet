import React from 'react';
import { Screen, Text, FeatureTile, EmptyState } from '@/core/ui';
import { useTheme } from '@/core/theme';

/**
 * Camera hub — F5 Instant Camera & F6 Daily BeReal. The live camera mounts
 * here (expo-camera). Capture → compress → Storage → Firestore pointer → FCM.
 */
export default function Camera() {
  const theme = useTheme();
  return (
    <Screen scroll>
      <Text variant="display" style={{ marginBottom: theme.spacing.lg }}>
        Camera 📸
      </Text>
      <EmptyState
        emoji="📷"
        title="Instant Camera"
        subtitle="Open, capture, send — no edits, no preview. Photos can expire after viewing."
        actionLabel="Open camera"
      />
      <FeatureTile emoji="🤳" title="Daily BeReal for Two" subtitle="Random daily prompt · 2-min timer · streaks" badge="Free" />
    </Screen>
  );
}
