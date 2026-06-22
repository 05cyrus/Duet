import { useState, useCallback } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '@/core/state/session';
import { ChatRepository } from '@/features/chat/data/chatRepository';
import type { WheelReward } from '@/types/models';

/**
 * Couple Wheel (F8). Rewards are bundled (free); the spin is pure client
 * animation. History persists locally — no Firebase round-trip per spin keeps
 * us deep inside the free tier.
 */
export const REWARDS: WheelReward[] = [
  { id: 'hug', label: 'Hug for 30s', emoji: '🤗', weight: 1 },
  { id: 'selfie', label: 'Send a Selfie', emoji: '🤳', weight: 1 },
  { id: 'voice', label: 'Voice Note', emoji: '🎙️', weight: 1 },
  { id: 'compliment', label: 'Compliment', emoji: '💗', weight: 1 },
  { id: 'secret', label: 'Tell a Secret', emoji: '🤫', weight: 1 },
  { id: 'kiss', label: 'Surprise Kiss', emoji: '💋', weight: 1 },
];

export interface SpinRecord {
  rewardId: string;
  label: string;
  emoji: string;
  at: number;
}

interface HistoryState {
  spins: SpinRecord[];
  /** When the user last spun. Drives the one-spin-a-day gate and, unlike the
   *  visible log, is intentionally NOT reset by `clear()` so the limit can't be
   *  bypassed by clearing history. */
  lastSpinAt: number | null;
  add: (r: SpinRecord) => void;
  clear: () => void;
}
export const useWheelHistory = create<HistoryState>()(
  persist(
    (set) => ({
      spins: [],
      lastSpinAt: null,
      add: (r) => set((s) => ({ spins: [r, ...s.spins].slice(0, 50), lastSpinAt: r.at })),
      clear: () => set({ spins: [] }),
    }),
    { name: 'duet-wheel-history', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** Local midnight (ms) for an instant — used to compare calendar days. */
function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Weighted random pick → returns the landing index. */
function pickIndex(): number {
  const total = REWARDS.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < REWARDS.length; i++) {
    roll -= REWARDS[i]!.weight;
    if (roll <= 0) return i;
  }
  return REWARDS.length - 1;
}

export function useWheel() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelReward | null>(null);
  const history = useWheelHistory();
  const { couple, uid } = useSession();
  const coupleId = couple?.id ?? null;

  // One spin per calendar day. Available again once the day rolls over.
  const canSpinToday =
    history.lastSpinAt == null || startOfDay(history.lastSpinAt) < startOfDay(Date.now());

  /** Returns the chosen index so the UI can animate to it, or null if the
   *  daily spin is already used (the UI also disables the button). */
  const beginSpin = useCallback(() => {
    if (!canSpinToday || spinning) return null;
    setSpinning(true);
    setResult(null);
    return pickIndex();
  }, [canSpinToday, spinning]);

  const finishSpin = useCallback(
    (index: number) => {
      const reward = REWARDS[index]!;
      setResult(reward);
      setSpinning(false);
      history.add({ rewardId: reward.id, label: reward.label, emoji: reward.emoji, at: Date.now() });

      // Announce the result to the partner in chat (fire-and-forget; a failed
      // send must not block the UI). Direct repo call avoids opening a second
      // chat listener on this screen.
      if (coupleId && uid) {
        new ChatRepository(coupleId)
          .send(uid, `🎡 The wheel landed on: ${reward.emoji} ${reward.label}`)
          .catch(() => {});
      }
    },
    [history, coupleId, uid],
  );

  return { spinning, result, canSpinToday, beginSpin, finishSpin, history };
}
