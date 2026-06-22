import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from '@/core/state/session';
import { ChatRepository } from '../data/chatRepository';
import type { ChatMessage, ReplyPreview } from '@/types/models';

/**
 * Live couple chat: subscribes once to the most recent messages and exposes
 * `send` (text) plus the instant-snap actions. Messages are newest-first so an
 * inverted FlatList renders them with the latest at the bottom and no manual
 * scroll bookkeeping.
 */
export function useChat() {
  const { couple, uid } = useSession();
  const coupleId = couple?.id ?? null;

  const repo = useMemo(() => (coupleId ? new ChatRepository(coupleId) : null), [coupleId]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = repo.subscribeRecent(
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [repo]);

  const send = useCallback(
    (text: string, replyTo: ReplyPreview | null = null) => {
      const trimmed = text.trim();
      if (!repo || !uid || !trimmed) return Promise.resolve();
      return repo.send(uid, trimmed, replyTo);
    },
    [repo, uid],
  );

  const sendSnap = useCallback(
    (base64: string, caption?: string, replyTo: ReplyPreview | null = null) => {
      if (!repo || !uid) return Promise.resolve();
      return repo.sendSnap(uid, base64, { caption, replyTo });
    },
    [repo, uid],
  );

  const viewSnap = useCallback(
    (messageId: string) => repo?.markViewed(messageId) ?? Promise.resolve(),
    [repo],
  );

  const reactSnap = useCallback(
    (messageId: string, emoji: string) => repo?.reactToSnap(messageId, emoji) ?? Promise.resolve(),
    [repo],
  );

  const loadSnap = useCallback(
    (snapId: string) => repo?.loadSnapImage(snapId) ?? Promise.resolve(null),
    [repo],
  );

  const expireSnap = useCallback(
    (snapId: string) => repo?.deleteSnapImage(snapId) ?? Promise.resolve(),
    [repo],
  );

  return { messages, send, sendSnap, viewSnap, reactSnap, loadSnap, expireSnap, uid, loading };
}
