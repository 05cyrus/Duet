import { useEffect } from 'react';
import { useSession } from '@/core/state/session';
import { registerForPushToken, addPushToken } from './push';

/**
 * Registers this device for push once the user is authenticated and stores the
 * token on their profile so the partner can target it. Mount once inside the
 * authed area (tabs layout). Safe to no-op in Expo Go / simulators.
 */
export function usePushRegistration() {
  const uid = useSession((s) => s.uid);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const token = await registerForPushToken();
      if (token && !cancelled) {
        await addPushToken(uid, token).catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);
}
