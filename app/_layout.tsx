import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
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
  const router = useRouter();

  // Navigate purely by auth status. We intentionally do NOT depend on
  // useSegments() — it can transiently return [] (seg0 undefined), which made
  // the old `inAuth` check fail and stranded signed-in users on the sign-in
  // screen. Keying the effect on `status` alone fires exactly once per status
  // change, so it won't yank the user around while they browse within a group.
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'signedOut') router.replace('/(auth)/sign-in');
    else if (status === 'needsPartner') router.replace('/(auth)/link-partner');
    else if (status === 'ready') router.replace('/(tabs)');
  }, [status, router]);

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
