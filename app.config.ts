import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Google's iOS OAuth flow redirects to the app via the "reversed client ID"
 * URL scheme. We derive it from the iOS client ID so there's a single source of
 * truth — set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and this stays in sync.
 * e.g. 903...ikni.apps.googleusercontent.com → com.googleusercontent.apps.903...ikni
 */
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const iosReversedClientId = iosClientId
  ? `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`
  : undefined;

/**
 * Dynamic Expo config.
 * Secrets are read from environment variables at build time and exposed through
 * `extra` so they are reachable via `expo-constants`. Never hardcode keys here.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Duet',
  slug: 'duet',
  scheme: 'duet',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  // NOTE: drop real branding into ./assets and re-add `icon` + a splash config
  // (via expo-splash-screen) when ready. Omitted for now so the app boots with
  // Expo's default icon instead of failing on a missing asset.
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.duet.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Duet shares your live location with your partner.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'Duet shares your live location with your partner, including safe-arrival alerts.',
      NSCameraUsageDescription: 'Duet uses your camera to send instant photos.',
      NSMicrophoneUsageDescription: 'Duet uses your microphone for voice notes and audio rooms.',
      UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
      // Google Sign-In redirect scheme (reversed iOS client ID).
      CFBundleURLTypes: iosReversedClientId
        ? [{ CFBundleURLSchemes: [iosReversedClientId] }]
        : [],
    },
  },
  android: {
    package: 'com.duet.app',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'CAMERA',
      'RECORD_AUDIO',
    ],
  },
  plugins: [
    'expo-router',
    'expo-location',
    'expo-camera',
    'expo-notifications',
    'expo-secure-store',
    [
      'expo-av',
      { microphonePermission: 'Duet uses your microphone for voice notes.' },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    },
    googleAuth: {
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    },
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
});
