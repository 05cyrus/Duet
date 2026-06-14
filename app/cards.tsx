import React from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Screen, Text, Card, Button } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useCards, CATEGORIES } from '@/features/cards/application/useCards';
import type { CardCategory } from '@/types/models';

const TYPE_LABEL: Record<string, string> = {
  kiss: '💋 Kiss',
  truth: '💬 Truth',
  dare: '🎯 Dare',
  fantasy: '✨ Fantasy',
  romantic_challenge: '💞 Challenge',
};

export default function CardsScreen() {
  const theme = useTheme();
  const { category, setCategory, current, daily, next, shuffle, favorites, deckSize } = useCards();

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Challenge Cards' }} />

      {/* Daily challenge */}
      {daily ? (
        <Animated.View entering={FadeInDown}>
          <Card style={{ marginBottom: theme.spacing.lg, backgroundColor: theme.colors.primaryMuted }}>
            <Text variant="caption" color="primary">
              ⭐ TODAY'S CHALLENGE
            </Text>
            <Text variant="heading" style={{ marginTop: 4 }}>
              {daily.text}
            </Text>
          </Card>
        </Animated.View>
      ) : null}

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.lg }}>
        <View style={styles.row}>
          {(['all', ...CATEGORIES.map((c) => c.key)] as (CardCategory | 'all')[]).map((key) => {
            const active = category === key;
            const meta = CATEGORIES.find((c) => c.key === key);
            return (
              <Pressable
                key={key}
                onPress={() => setCategory(key)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt },
                ]}
              >
                <Text variant="label" color={active ? 'onPrimary' : 'text'}>
                  {meta ? `${meta.emoji} ${meta.label}` : '🎲 All'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Current card */}
      {current ? (
        <Animated.View key={current.id} entering={ZoomIn.duration(250)}>
          <Card style={{ minHeight: 220, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="label" color="primary">
                {TYPE_LABEL[current.type] ?? current.type}
              </Text>
              <Pressable onPress={() => favorites.toggle(current.id)}>
                <Text style={{ fontSize: 22 }}>{favorites.has(current.id) ? '❤️' : '🤍'}</Text>
              </Pressable>
            </View>
            <Text variant="title" center style={{ paddingVertical: theme.spacing.xl }}>
              {current.text}
            </Text>
            <Text variant="caption" color="textMuted" center>
              {deckSize} cards in this deck
            </Text>
          </Card>
        </Animated.View>
      ) : null}

      <View style={{ height: theme.spacing.lg }} />
      <Button title="🔀 Shuffle" onPress={shuffle} variant="gradient" />
      <View style={{ height: theme.spacing.sm }} />
      <Button title="Next card →" onPress={next} variant="secondary" />

      {favorites.ids.length ? (
        <Animated.View entering={FadeIn} style={{ marginTop: theme.spacing.xl }}>
          <Text variant="heading">❤️ Favorites ({favorites.ids.length})</Text>
          <Text variant="caption" color="textMuted">
            Tap the heart on any card to save it here.
          </Text>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
});
