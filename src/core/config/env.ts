import Constants from 'expo-constants';

/**
 * Typed access to runtime config injected via app.config.ts `extra`.
 * Client Firebase config is intentionally public (protected by security rules
 * + App Check). AI keys are NOT here — they live only on the server proxy.
 */
type Extra = {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    databaseURL: string;
  };
  googleAuth: {
    webClientId?: string;
    iosClientId?: string;
    androidClientId?: string;
  };
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

function required<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === null || value === '') {
    // Fail loudly in dev; in prod the build should always inject these.
    if (__DEV__) console.warn(`[env] Missing config: ${name}`);
  }
  return value as T;
}

export const env = {
  firebase: {
    apiKey: required(extra.firebase?.apiKey, 'firebase.apiKey'),
    authDomain: required(extra.firebase?.authDomain, 'firebase.authDomain'),
    projectId: required(extra.firebase?.projectId, 'firebase.projectId'),
    storageBucket: required(extra.firebase?.storageBucket, 'firebase.storageBucket'),
    messagingSenderId: required(extra.firebase?.messagingSenderId, 'firebase.messagingSenderId'),
    appId: required(extra.firebase?.appId, 'firebase.appId'),
    databaseURL: required(extra.firebase?.databaseURL, 'firebase.databaseURL'),
  },
  googleAuth: extra.googleAuth ?? {},
  /** Server proxy that holds AI keys (Cloudflare Worker / Vercel fn). */
  aiProxyUrl: process.env.EXPO_PUBLIC_AI_PROXY_URL ?? '',
} as const;
