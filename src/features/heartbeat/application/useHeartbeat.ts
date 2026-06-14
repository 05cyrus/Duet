import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useSession, usePartnerId } from '@/core/state/session';
import { tapRepository, TapKind, TapState } from '../data/heartbeatRepository';
import { getUserPushTokens, sendPush } from '@/core/notifications/push';

/** Notification copy per tap kind (F19 heartbeat / F20 missing-you). */
const MESSAGES: Record<TapKind, (name: string) => { title: string; body: string }> = {
  heartbeat: (name) => ({ title: '💓 Heartbeat', body: `${name} is thinking about you` }),
  missingYou: (name) => ({ title: '💭 Missing You', body: `${name} misses you` }),
};

/**
 * Heartbeat (F19) or Missing-You (F20) — same hook, different `kind`.
 * A tap: haptic → increment the RTDB counter → push-notify the partner.
 */
export function useTaps(kind: TapKind) {
  const { couple, uid, profile } = useSession();
  const partnerId = usePartnerId();
  const coupleId = couple?.id ?? null;
  const [state, setState] = useState<TapState | null>(null);

  // Partner's push tokens, loaded once and reused — avoids a Firestore read
  // on every tap (heartbeats can be spammed).
  const partnerTokens = useRef<string[]>([]);

  useEffect(() => {
    if (!coupleId || !uid) return;
    return tapRepository.subscribe(kind, coupleId, uid, setState);
  }, [kind, coupleId, uid]);

  useEffect(() => {
    if (!partnerId) {
      partnerTokens.current = [];
      return;
    }
    getUserPushTokens(partnerId)
      .then((t) => {
        partnerTokens.current = t;
      })
      .catch(() => {});
  }, [partnerId]);

  const tap = useCallback(() => {
    if (!coupleId || !uid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const name = profile?.displayName ?? 'Your partner';
    const msg = MESSAGES[kind](name);
    // Fire-and-forget ping; never blocks the counter increment.
    sendPush(partnerTokens.current, msg.title, msg.body, { kind });
    return tapRepository.tap(kind, coupleId, uid);
  }, [kind, coupleId, uid, profile?.displayName]);

  return { state, tap };
}
