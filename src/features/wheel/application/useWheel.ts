import { useState, useCallback } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  add: (r: SpinRecord) => void;
  clear: () => void;
}
export const useWheelHistory = create<HistoryState>()(
  persist(
    (set) => ({
      spins: [],
      add: (r) => set((s) => ({ spins: [r, ...s.spins].slice(0, 50) })),
      clear: () => set({ spins: [] }),
    }),
    { name: 'duet-wheel-history', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

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

  /** Returns the chosen index so the UI can animate to it. */
  const beginSpin = useCallback(() => {
    setSpinning(true);
    setResult(null);
    return pickIndex();
  }, []);

  const finishSpin = useCallback(
    (index: number) => {
      const reward = REWARDS[index]!;
      setResult(reward);
      setSpinning(false);
      history.add({ rewardId: reward.id, label: reward.label, emoji: reward.emoji, at: Date.now() });
    },
    [history],
  );

  return { spinning, result, beginSpin, finishSpin, history };
}
