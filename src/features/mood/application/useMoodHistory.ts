import { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/core/state/session';
import { moodRepository } from '../data/moodRepository';
import { MOODS } from './useMood';
import type { MoodEntry, MoodKey } from '@/types/models';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export interface MoodCount {
  key: MoodKey;
  emoji: string;
  label: string;
  count: number;
}

export interface MoodHistory {
  loading: boolean;
  /** All history entries, newest first. */
  entries: MoodEntry[];
  /** Overall count per mood, sorted most → least frequent. */
  distribution: MoodCount[];
  /** Count per mood over the last 7 days, sorted most → least frequent. */
  weekly: MoodCount[];
  total: number;
  /** The single most-logged mood overall, or null when there's no history. */
  topMood: MoodCount | null;
  /** Consecutive days (ending today) with at least one mood logged. */
  streakDays: number;
}

/** Build a count-per-mood list (every mood present, sorted by frequency). */
function tally(entries: MoodEntry[]): MoodCount[] {
  const counts = new Map<MoodKey, number>();
  for (const e of entries) counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
  return MOODS.map((m) => ({
    key: m.key,
    emoji: m.emoji,
    label: m.label,
    count: counts.get(m.key) ?? 0,
  })).sort((a, b) => b.count - a.count);
}

/** Local midnight (ms) for a given epoch-ms instant. */
function dayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Count consecutive days ending today that have at least one entry. A gap of a
 * full day breaks the streak; logging today (or only yesterday so far) both
 * count as an active streak.
 */
function computeStreak(entries: MoodEntry[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(entries.filter((e) => e.createdAt > 0).map((e) => dayStart(e.createdAt)));
  const today = dayStart(Date.now());
  // Allow the streak to "start" yesterday if nothing logged yet today.
  let cursor = days.has(today) ? today : today - DAY_MS;
  if (!days.has(cursor)) return 0;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

/**
 * Live mood history + lightweight analytics for the couple, derived from the
 * Firestore history written on every mood change. One open listener; all math
 * runs client-side so reads stay flat (and free).
 */
export function useMoodHistory(): MoodHistory {
  const { couple } = useSession();
  const coupleId = couple?.id ?? null;

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = moodRepository.subscribeHistory(coupleId, (next) => {
      setEntries(next);
      setLoading(false);
    });
    return unsub;
  }, [coupleId]);

  return useMemo(() => {
    const now = Date.now();
    const lastWeek = entries.filter((e) => e.createdAt > 0 && now - e.createdAt <= WEEK_MS);
    const distribution = tally(entries);
    const topMood = distribution.find((d) => d.count > 0) ?? null;
    return {
      loading,
      entries,
      distribution,
      weekly: tally(lastWeek),
      total: entries.length,
      topMood,
      streakDays: computeStreak(entries),
    };
  }, [entries, loading]);
}
