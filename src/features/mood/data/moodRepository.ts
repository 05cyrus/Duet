import { ref, set, onValue, serverTimestamp as rtdbNow } from 'firebase/database';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { rtdb, db } from '@/core/firebase/client';
import type { MoodKey } from '@/types/models';

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
};
