import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { queryClient } from '@/core/query/client';
import { ThemeProvider } from '@/core/theme';
import { useSession } from '@/core/state/session';
import { useAuthBootstrap } from '@/features/auth/application/useAuthBootstrap';

/**
 * AuthGate: redirects based on session.status.
 *   signedOut    → (auth)/sign-in
 *   needsPartner → (auth)/link-partner
 *   ready        → (tabs)
 */
function AuthGate() {
  useAuthBootstrap();
  const status = useSession((s) => s.status);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const inAuth = segments[0] === '(auth)';
    if (status === 'signedOut' && !inAuth) router.replace('/(auth)/sign-in');
    else if (status === 'needsPartner') router.replace('/(auth)/link-partner');
    else if (status === 'ready' && inAuth) router.replace('/(tabs)');
  }, [status, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthGate />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
