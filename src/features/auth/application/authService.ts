import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { firebaseAuth, db } from '@/core/firebase/client';
import type { UserProfile } from '@/types/models';

const DEFAULT_PREFS: UserProfile['preferences'] = {
  themeMode: 'system',
  notifications: { location: true, mood: true, heartbeat: true, bereal: true, capsules: true },
  locationSharing: 'on',
  language: 'en',
};

export async function ensureProfile(uid: string, email: string, displayName: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    {
      uid,
      email,
      displayName,
      avatarUrl: null,
      birthday: null,
      partnerId: null,
      coupleId: null,
      pushTokens: [],
      preferences: DEFAULT_PREFS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export const authService = {
  async signUpEmail(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await updateProfile(cred.user, { displayName });
    await ensureProfile(cred.user.uid, email, displayName);
    return cred.user;
  },

  async signInEmail(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return cred.user;
  },

  /** Google sign-in via expo-auth-session id token (see useGoogleAuth hook). */
  async signInWithGoogleIdToken(idToken: string) {
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(firebaseAuth, credential);
    await ensureProfile(
      cred.user.uid,
      cred.user.email ?? '',
      cred.user.displayName ?? 'Me',
    );
    return cred.user;
  },

  signOut() {
    return fbSignOut(firebaseAuth);
  },
};
