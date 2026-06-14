import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/core/firebase/client';
import type { UserProfile } from '@/types/models';

/**
 * Push notifications via EXPO's free push service.
 *
 * Why Expo push (not raw FCM)? For 2 users it needs no server: the app fetches
 * the partner's Expo push token (stored on their user doc) and POSTs directly
 * to Expo's public push endpoint — ₹0, no Cloud Functions.
 *
 * IMPORTANT: remote push requires a DEVELOPMENT BUILD (Expo Go no longer
 * delivers remote push on Android). Android also needs an FCM credential on the
 * Expo project (free, via `eas credentials`); iOS needs an APNs key (Apple
 * Developer account). See docs/PUSH_SETUP.md.
 */

// How notifications appear while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Ask permission + return this device's Expo push token (null if unavailable). */
export async function registerForPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators can't get a real token

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Duet',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return null;

  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } })?.eas?.projectId;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return data;
  } catch {
    return null; // e.g. Expo Go on Android, or missing push credentials
  }
}

/** Persist this device's token on the user doc (deduped via arrayUnion). */
export async function addPushToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { pushTokens: arrayUnion(token) });
}

/** Read a user's stored push tokens (e.g. the partner's). */
export async function getUserPushTokens(uid: string): Promise<string[]> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return [];
  return ((snap.data() as UserProfile).pushTokens ?? []).filter(Boolean);
}

/** Send a push to one or more Expo tokens. No-op if there are none. */
export async function sendPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const messages = tokens
    .filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken'))
    .map((to) => ({ to, title, body, sound: 'default', data }));
  if (!messages.length) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch {
    // best-effort; a failed ping shouldn't break the tap that triggered it
  }
}
