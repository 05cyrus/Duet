import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  // @ts-expect-error — RN persistence helper is not in web types
  getReactNativePersistence,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '@/core/config/env';

/**
 * Single Firebase app instance. We initialize Auth with AsyncStorage
 * persistence so sessions survive app restarts on native.
 */
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(env.firebase);
} else {
  app = getApp();
}

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // The ONLY expected failure here is "auth already initialized" on Fast
  // Refresh. If it's anything else (e.g. the wrong Firebase build resolved →
  // "Component auth has not been registered yet"), surface it — that points to
  // a Metro resolver/cache problem, not normal flow.
  const msg = (e as Error)?.message ?? '';
  if (__DEV__ && !/already.*initialized/i.test(msg)) {
    console.warn('[firebase] initializeAuth failed unexpectedly:', msg);
  }
  auth = getAuth(app);
}

export const firebaseApp = app;
export const firebaseAuth = auth;
export const db: Firestore = getFirestore(app);
export const rtdb: Database = getDatabase(app);
export const storage: FirebaseStorage = getStorage(app);
