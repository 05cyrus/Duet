import React from 'react';
import { View } from 'react-native';
import { format, isToday, isYesterday } from 'date-fns';
import { Text } from '@/core/ui';
import { useTheme } from '@/core/theme';

/** "Today" / "Yesterday" / "22 June 2026" for a day's first message. */
function dayLabel(millis: number): string {
  if (isToday(millis)) return 'Today';
  if (isYesterday(millis)) return 'Yesterday';
  return format(millis, 'd MMMM yyyy');
}

/** Centered pill marking the calendar day a run of messages belongs to. */
export function DateSeparator({ millis }: { millis: number }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', marginVertical: theme.spacing.md }}>
      <View
        style={{
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: theme.radius.pill,
          paddingHorizontal: 12,
          paddingVertical: 4,
        }}
      >
        <Text variant="caption" color="textMuted">
          {dayLabel(millis)}
        </Text>
      </View>
    </View>
  );
}
