import { useEffect, useState, useCallback } from 'react';
import { useSession, usePartnerId } from '@/core/state/session';
import { moodRepository, CurrentMood } from '../data/moodRepository';
import type { MoodKey } from '@/types/models';

export const MOODS: { key: MoodKey; emoji: string; label: string }[] = [
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'sad', emoji: '😔', label: 'Sad' },
  { key: 'sleepy', emoji: '😴', label: 'Sleepy' },
  { key: 'angry', emoji: '😠', label: 'Angry' },
  { key: 'need_attention', emoji: '🥺', label: 'Need Attention' },
  { key: 'missing_you', emoji: '💭', label: 'Missing You' },
];

/** Live mood for both me and my partner + a one-tap setter. */
export function useMood() {
  const { couple, uid } = useSession();
  const coupleId = couple?.id ?? null;
  const memberIds = couple?.memberIds ?? [];
  const membersKey = memberIds.join(','); // stable dep

  // Subscribe to EVERY member's mood node, keyed by uid. This removes any
  // dependence on correctly computing partnerId — whoever isn't me is "partner".
  const [moods, setMoods] = useState<Record<string, CurrentMood | null>>({});

  useEffect(() => {
    if (!coupleId || memberIds.length === 0) return;
    const unsubs = memberIds.map((mid) =>
      moodRepository.subscribeCurrent(coupleId, mid, (m) =>
        setMoods((prev) => ({ ...prev, [mid]: m })),
      ),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, membersKey]);

  const mine = uid ? (moods[uid] ?? null) : null;
  const partnerKey = memberIds.find((id) => id !== uid);
  const partner = partnerKey ? (moods[partnerKey] ?? null) : null;

  const setMood = useCallback(
    (mood: MoodKey, note: string | null = null) => {
      if (!coupleId || !uid) return Promise.resolve();
      return moodRepository.setMood(coupleId, uid, mood, note);
    },
    [coupleId, uid],
  );

  return { mine, partner, setMood };
}
