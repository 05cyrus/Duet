import { ref, onValue, runTransaction, serverTimestamp as rtdbNow } from 'firebase/database';
import { rtdb } from '@/core/firebase/client';

/**
 * Heartbeat & Missing-You both use the same cheap mechanism:
 *  - each tap = one RTDB transaction incrementing a counter (tiny write).
 *  - a Cloudflare cron rolls daily totals into ONE Firestore doc/day for trends.
 *  - the partner gets an FCM push ("someone is thinking about you").
 *
 * Thousands of taps cost ~nothing on RTDB; we never touch Firestore per-tap.
 */
export type TapKind = 'heartbeat' | 'missingYou';

export interface TapState {
  total: number;
  today: number;
  lastAt: number | null;
}

export const tapRepository = {
  async tap(kind: TapKind, coupleId: string, uid: string): Promise<void> {
    const node = ref(rtdb, `${kind}/${coupleId}/${uid}`);
    await runTransaction(node, (curr: TapState | null) => {
      const base: TapState = curr ?? { total: 0, today: 0, lastAt: null };
      return { total: base.total + 1, today: base.today + 1, lastAt: Date.now() };
    });
    // FCM push is sent by the geofence/notify worker watching this node, or
    // we can POST to the fcm-send worker directly here (kept server-side).
  },

  subscribe(kind: TapKind, coupleId: string, uid: string, cb: (s: TapState | null) => void): () => void {
    return onValue(ref(rtdb, `${kind}/${coupleId}/${uid}`), (snap) =>
      cb((snap.val() as TapState) ?? null),
    );
  },
};
