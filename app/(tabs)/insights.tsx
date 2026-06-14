import React from 'react';
import { Screen, Text, FeatureTile } from '@/core/ui';
import { useTheme } from '@/core/theme';

/** Insights hub — F10–F15 (AI + analytics). AI uses free providers + cache. */
export default function Insights() {
  const theme = useTheme();
  return (
    <Screen scroll>
      <Text variant="display" style={{ marginBottom: theme.spacing.lg }}>
        Insights 📊
      </Text>
      <FeatureTile emoji="🧠" title="AI Relationship Mediator" subtitle="Neutral, fair, both perspectives" badge="Flagship · AI" />
      <FeatureTile emoji="💗" title="Relationship Health" subtitle="Trends & strengths — no scores" badge="Free" />
      <FeatureTile emoji="🕸️" title="Personality Radar" subtitle="7 traits, interactive chart" badge="Free" />
      <FeatureTile emoji="🧩" title="Compatibility Dashboard" subtitle="Quiz · love languages · conflict styles" badge="Free" />
      <FeatureTile emoji="🗣️" title="Love Language Detector" subtitle="Updates from your behavior" badge="Free" />
    </Screen>
  );
}
