import React from 'react';
import { Pressable, View } from 'react-native';
import { format } from 'date-fns';
import { Text } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { ReplyQuote } from './ReplyQuote';
import type { ChatMessage } from '@/types/models';

export interface SnapBubbleProps {
  message: ChatMessage;
  mine: boolean;
  /** Current user's uid, to label a quoted reply's author. */
  uid: string | null;
  /** Invoked when the recipient taps an unopened snap. */
  onOpen: () => void;
}

/**
 * A snap inside the chat thread. The photo itself never renders here — only its
 * status — so it can only be seen through the one-time viewer.
 */
export function SnapBubble({ message, mine, uid, onOpen }: SnapBubbleProps) {
  const theme = useTheme();
  const snap = message.snap;
  if (!snap) return null;

  const opened = snap.viewedAt != null;
  const canOpen = !mine && !opened;

  const statusLabel = mine
    ? opened
      ? 'Opened'
      : 'Delivered'
    : opened
      ? 'Opened'
      : 'Tap to view';

  return (
    <Pressable
      onPress={canOpen ? onOpen : undefined}
      disabled={!canOpen}
      style={({ pressed }) => ({
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        backgroundColor: canOpen ? theme.colors.primaryMuted : theme.colors.surfaceAlt,
        borderRadius: theme.radius.lg,
        borderBottomRightRadius: mine ? theme.radius.sm : theme.radius.lg,
        borderBottomLeftRadius: mine ? theme.radius.lg : theme.radius.sm,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.xs,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {message.replyTo ? (
        <ReplyQuote preview={message.replyTo} fromMe={message.replyTo.senderId === uid} />
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 22 }}>{opened ? '🔓' : '📷'}</Text>
        <View>
          <Text variant="label" color={canOpen ? 'primary' : 'text'}>
            Snap
          </Text>
          <Text variant="caption" color="textMuted">
            {statusLabel}
          </Text>
        </View>
      </View>

      {message.text ? (
        <Text color={canOpen ? 'text' : 'textMuted'} style={{ marginTop: 6 }}>
          {message.text}
        </Text>
      ) : null}

      {snap.reaction ? (
        <Text style={{ marginTop: 4 }}>
          {mine ? 'They reacted ' : 'You reacted '}
          {snap.reaction}
        </Text>
      ) : null}

      {message.createdAt ? (
        <Text
          variant="caption"
          color="textMuted"
          style={{ marginTop: 2, opacity: 0.7, alignSelf: 'flex-end' }}
        >
          {format(message.createdAt, 'HH:mm')}
        </Text>
      ) : null}
    </Pressable>
  );
}
