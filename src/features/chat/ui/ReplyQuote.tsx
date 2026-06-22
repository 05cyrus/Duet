import React from 'react';
import { View } from 'react-native';
import { Text } from '@/core/ui';
import { useTheme } from '@/core/theme';
import type { ReplyPreview } from '@/types/models';

export interface ReplyQuoteProps {
  preview: ReplyPreview;
  /** Whether the quoted message was authored by the current user. */
  fromMe: boolean;
  /** True when rendered inside the user's own (primary-colored) bubble. */
  onPrimary?: boolean;
}

/** Compact quoted snippet of the message being replied to. */
export function ReplyQuote({ preview, fromMe, onPrimary }: ReplyQuoteProps) {
  const theme = useTheme();
  const snippet = preview.kind === 'snap' ? '📷 Photo' : preview.text;
  const labelColor = onPrimary ? 'onPrimary' : 'primary';
  const textColor = onPrimary ? 'onPrimary' : 'textMuted';
  const accent = onPrimary ? theme.colors.onPrimary : theme.colors.primary;

  return (
    <View
      style={{
        borderLeftWidth: 3,
        borderLeftColor: accent,
        paddingLeft: 8,
        paddingVertical: 2,
        marginBottom: 6,
        opacity: 0.9,
      }}
    >
      <Text variant="caption" color={labelColor} style={{ fontWeight: '700' }}>
        {fromMe ? 'You' : 'Them'}
      </Text>
      <Text variant="caption" color={textColor} numberOfLines={1}>
        {snippet}
      </Text>
    </View>
  );
}
