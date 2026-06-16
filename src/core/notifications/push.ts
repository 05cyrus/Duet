import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/core/firebase/client';
import type { UserProfile } from '@/types/models';

/**
 * Push notifications via EXPO's free push service.
 *
 * Why Expo push (not raw FCM)? For 2 users it needs no server: the app stores
 * each device's Expo token on the user doc and POSTs directly to Expo's public
 * push endpoint — ₹0, no Cloud Functions.
 *
 * Expo Go (SDK 53+) removed remote push, and even *importing* expo-notifications
 * there throws. So we LAZILY require it (never in Expo Go) — the module is only
 * loaded on a real/dev build. Delivery additionally needs an FCM credential
 * (Android, free) / APNs key (iOS, Apple account). See docs/PUSH_SETUP.md.
 */
const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
export const pushSupported = !isExpoGo;

// Lazy handle to expo-notifications — never required inside Expo Go.
type NotificationsModule = typeof import('expo-notifications');
let _notif: NotificationsModule | null = null;
function getNotifications(): NotificationsModule | null {
  if (isExpoGo) return null;
  if (!_notif) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _notif = require('expo-notifications') as NotificationsModule;
  }
  return _notif;
}

let handlerReady = false;
function ensureHandler(N: NotificationsModule) {
  if (handlerReady) return;
  handlerReady = true;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Ask permission + return this device's Expo push token (null if unavailable).
 * Fully best-effort: ANY failure (Expo Go, missing credentials, denied
 * permission, simulator) resolves to null without throwing or logging.
 */
export async function registerForPushToken(): Promise<string | null> {
  const N = getNotifications();
  if (!N || !Device.isDevice) return null;
  try {
    ensureHandler(N);

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', {
        name: 'Duet',
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const existing = await N.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted) granted = (await N.requestPermissionsAsync()).granted;
    if (!granted) return null;

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } })?.eas?.projectId;
    const { data } = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return data;
  } catch {
    return null; // no push credentials yet — silently skip
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
