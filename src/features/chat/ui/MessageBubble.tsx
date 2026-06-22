import React from 'react';
import { View } from 'react-native';
import { format } from 'date-fns';
import { Text } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { ReplyQuote } from './ReplyQuote';
import type { ChatMessage } from '@/types/models';

export interface MessageBubbleProps {
  message: ChatMessage;
  mine: boolean;
  /** Current user's uid, to label a quoted reply's author. */
  uid: string | null;
}

/** A single chat bubble — right-aligned & branded when it's mine. */
export function MessageBubble({ message, mine, uid }: MessageBubbleProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        backgroundColor: mine ? theme.colors.primary : theme.colors.surfaceAlt,
        borderRadius: theme.radius.lg,
        borderBottomRightRadius: mine ? theme.radius.sm : theme.radius.lg,
        borderBottomLeftRadius: mine ? theme.radius.lg : theme.radius.sm,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.xs,
      }}
    >
      {message.replyTo ? (
        <ReplyQuote
          preview={message.replyTo}
          fromMe={message.replyTo.senderId === uid}
          onPrimary={mine}
        />
      ) : null}
      <Text color={mine ? 'onPrimary' : 'text'}>{message.text}</Text>
      {message.createdAt ? (
        <Text
          variant="caption"
          color={mine ? 'onPrimary' : 'textMuted'}
          style={{ marginTop: 2, opacity: 0.7, alignSelf: 'flex-end' }}
        >
          {format(message.createdAt, 'HH:mm')}
        </Text>
      ) : null}
    </View>
  );
}
