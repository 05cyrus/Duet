import { useEffect, useState, useCallback } from 'react';
import { useSession, usePartnerId } from '@/core/state/session';
import { moodRepository, CurrentMood } from '../data/moodRepository';
import type { MoodKey } from '@/types/models';

export const MOODS: { key: MoodKey; emoji: string; label: string }[] = [
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'sleepy', emoji: '😴', label: 'Sleepy' },
  { key: 'angry', emoji: '😠', label: 'Angry' },
  { key: 'need_attention', emoji: '🥺', label: 'Need Attention' },
  { key: 'missing_you', emoji: '💭', label: 'Missing You' },
];

/** Live mood for both me and my partner + a one-tap setter. */
export function useMood() {
  const { couple, uid } = useSession();
  const partnerId = usePartnerId();
  const coupleId = couple?.id ?? null;

  const [mine, setMine] = useState<CurrentMood | null>(null);
  const [partner, setPartner] = useState<CurrentMood | null>(null);

  useEffect(() => {
    if (!coupleId || !uid) return;
    const u1 = moodRepository.subscribeCurrent(coupleId, uid, setMine);
    const u2 = partnerId
      ? moodRepository.subscribeCurrent(coupleId, partnerId, setPartner)
      : () => {};
    return () => {
      u1();
      u2();
    };
  }, [coupleId, uid, partnerId]);

  const setMood = useCallback(
    (mood: MoodKey, note: string | null = null) => {
      if (!coupleId || !uid) return Promise.resolve();
      return moodRepository.setMood(coupleId, uid, mood, note);
    },
    [coupleId, uid],
  );

  return { mine, partner, setMood };
}
