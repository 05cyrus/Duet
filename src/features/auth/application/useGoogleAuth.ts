import { useEffect, useState, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { env } from '@/core/config/env';
import { authService } from './authService';

// Required so the auth popup/redirect can dismiss itself and return to the app.
WebBrowser.maybeCompleteAuthSession();

/**
 * Google Sign-In via expo-auth-session.
 *
 * We request an ID token (`useIdTokenAuthRequest`) because Firebase's
 * `signInWithCredential` needs exactly that. The three client IDs come from
 * env (Web / iOS / Android); the library picks the right one per platform, and
 * the iOS redirect uses the reversed-client-id URL scheme wired in app.config.ts.
 *
 * `onError` lets the screen surface failures (e.g. SHA-1 / client-ID mismatch →
 * DEVELOPER_ERROR on Android).
 */
export function useGoogleAuth(onError?: (message: string) => void) {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: env.googleAuth.webClientId,
    iosClientId: env.googleAuth.iosClientId,
    androidClientId: env.googleAuth.androidClientId,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (!idToken) {
        setLoading(false);
        onError?.('No ID token returned from Google.');
        return;
      }
      authService
        .signInWithGoogleIdToken(idToken)
        .catch((e) => onError?.((e as Error).message))
        .finally(() => setLoading(false));
    } else if (response.type === 'error') {
      setLoading(false);
      onError?.(response.error?.message ?? 'Google sign-in failed.');
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      setLoading(false);
    }
  }, [response, onError]);

  const signIn = useCallback(() => {
    setLoading(true);
    promptAsync().catch(() => setLoading(false));
  }, [promptAsync]);

  return { signIn, loading, ready: !!request };
}
