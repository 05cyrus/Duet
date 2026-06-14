import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/core/theme';
import { Text } from '@/core/ui';
import { MOODS } from '../application/useMood';
import type { MoodKey } from '@/types/models';

/** One-tap horizontal mood selector. */
export function MoodPicker({ selected, onSelect }: { selected?: MoodKey; onSelect: (m: MoodKey) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {MOODS.map((m) => {
        const active = selected === m.key;
        return (
          <Pressable
            key={m.key}
            onPress={() => onSelect(m.key)}
            style={[
              styles.item,
              {
                backgroundColor: active ? theme.colors.primaryMuted : theme.colors.surfaceAlt,
                borderColor: active ? theme.colors.primary : 'transparent',
              },
            ]}
          >
            <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
            <Text variant="caption" color={active ? 'primary' : 'textMuted'}>
              {m.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1.5, gap: 4, minWidth: 88 },
});
