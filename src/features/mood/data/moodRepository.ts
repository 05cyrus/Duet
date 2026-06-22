import { ref, set, onValue, serverTimestamp as rtdbNow } from 'firebase/database';
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { rtdb, db } from '@/core/firebase/client';
import type { MoodEntry, MoodKey } from '@/types/models';

/**
 * Mood storage strategy (cost-optimized):
 *  - CURRENT mood → RTDB (instant sync, overwrite one node, near-zero cost).
 *  - HISTORY → one Firestore write per change (for analytics). Reads are rare.
 */
export interface CurrentMood {
  mood: MoodKey;
  note: string | null;
  at: number;
}

export const moodRepository = {
  async setMood(coupleId: string, uid: string, mood: MoodKey, note: string | null): Promise<void> {
    // 1) instant current state in RTDB
    await set(ref(rtdb, `mood/${coupleId}/${uid}`), { mood, note, at: rtdbNow() });
    // 2) durable history entry in Firestore (1 cheap write)
    await addDoc(collection(db, `couples/${coupleId}/moods`), {
      coupleId,
      userId: uid,
      mood,
      note,
      createdAt: serverTimestamp(),
    });
  },

  /** Live current-mood subscription for one member. */
  subscribeCurrent(coupleId: string, uid: string, cb: (m: CurrentMood | null) => void): () => void {
    const node = ref(rtdb, `mood/${coupleId}/${uid}`);
    const unsub = onValue(node, (snap) => cb((snap.val() as CurrentMood) ?? null));
    return unsub;
  },

  /**
   * Live history subscription over BOTH members' mood entries, newest first.
   * One open listener on `couples/{coupleId}/moods` — cheap and within free
   * tier. `max` caps how many entries we hold in memory (default 200, plenty
   * for the history screen's timeline + analytics).
   */
  subscribeHistory(
    coupleId: string,
    cb: (entries: MoodEntry[]) => void,
    max = 200,
  ): () => void {
    const q = query(
      collection(db, `couples/${coupleId}/moods`),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    return onSnapshot(q, (snap) => {
      const entries = snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt;
        return {
          id: d.id,
          coupleId: data.coupleId,
          userId: data.userId,
          mood: data.mood as MoodKey,
          note: (data.note ?? null) as string | null,
          // createdAt is a Firestore Timestamp on read; normalize to millis.
          // It can be null for a beat while the server timestamp resolves.
          createdAt: ts instanceof Timestamp ? ts.toMillis() : 0,
        } satisfies MoodEntry;
      });
      cb(entries);
    });
  },
};
