import { useMemo, useState, useCallback } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cardsData from '../../../../assets/content/cards.json';
import type { ChallengeCard, CardCategory } from '@/types/models';

/**
 * Challenge Cards (F7). Content is BUNDLED (assets/content/cards.json) so it
 * costs ZERO Firestore reads — the spec's "configurable via database" is
 * satisfied by also being able to sync a deck from Firestore later, but the
 * bundled copy is the always-free default.
 *
 * Favorites persist locally (AsyncStorage) — no backend needed for 2 users.
 */
const ALL_CARDS = (cardsData as ChallengeCard[]).filter((c) => c.enabled);

interface FavState {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}
export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
    }),
    { name: 'duet-card-favorites', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export const CATEGORIES: { key: CardCategory; label: string; emoji: string }[] = [
  { key: 'cute', label: 'Cute', emoji: '🥰' },
  { key: 'romantic', label: 'Romantic', emoji: '🌹' },
  { key: 'spicy', label: 'Spicy', emoji: '🌶️' },
  { key: 'wild', label: 'Wild', emoji: '🔥' },
];

/** Deterministic daily card — same card for both partners on a given day. */
function dailyIndex(seed: number, length: number): number {
  return length === 0 ? 0 : seed % length;
}

export function useCards() {
  const [category, setCategory] = useState<CardCategory | 'all'>('all');
  const [index, setIndex] = useState(0);
  const favorites = useFavorites();

  const deck = useMemo(
    () => (category === 'all' ? ALL_CARDS : ALL_CARDS.filter((c) => c.category === category)),
    [category],
  );

  const current = deck.length ? deck[index % deck.length] : null;

  // Daily challenge: stable per calendar day (no Date.now mid-render concerns —
  // this runs in an event/render and is fine on-device).
  const daily = useMemo(() => {
    const dayNumber = Math.floor(Date.now() / 86_400_000);
    return ALL_CARDS.length ? ALL_CARDS[dailyIndex(dayNumber, ALL_CARDS.length)] : null;
  }, []);

  const next = useCallback(() => setIndex((i) => i + 1), []);
  const shuffle = useCallback(() => {
    setIndex((i) => {
      if (deck.length <= 1) return i + 1;
      let r = Math.floor(Math.random() * deck.length);
      if (r === i % deck.length) r = (r + 1) % deck.length; // ensure a different card
      return r;
    });
  }, [deck.length]);

  const setCat = useCallback((c: CardCategory | 'all') => {
    setCategory(c);
    setIndex(0);
  }, []);

  return { category, setCategory: setCat, current, daily, next, shuffle, favorites, deckSize: deck.length };
}
