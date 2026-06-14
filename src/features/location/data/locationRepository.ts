import { ref, set, onValue, serverTimestamp as rtdbNow } from 'firebase/database';
import { rtdb } from '@/core/firebase/client';
import type { LivePosition } from '@/types/models';

/**
 * Live location (F1). Stored in RTDB and OVERWRITTEN per update, so stored size
 * stays ~constant and we never touch Firestore for high-frequency pings.
 * Cost lever: caller throttles to significant-change (~50m) + foreground only.
 */
export const locationRepository = {
  async publish(coupleId: string, uid: string, pos: Omit<LivePosition, 'timestamp'>): Promise<void> {
    await set(ref(rtdb, `location/${coupleId}/${uid}`), { ...pos, timestamp: rtdbNow() });
  },

  subscribe(coupleId: string, uid: string, cb: (p: LivePosition | null) => void): () => void {
    return onValue(ref(rtdb, `location/${coupleId}/${uid}`), (snap) =>
      cb((snap.val() as LivePosition) ?? null),
    );
  },
};
