import '../src/global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useAuthInit } from '@/features/auth/hooks/useAuth';
import { ToastContainer } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  useAuthInit();
  const { session, profile, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;
    SplashScreen.hideAsync();

    const inAuth = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/welcome');
      return;
    }

    // Session exists but profile hasn't loaded yet — stay put and wait.
    // The effect will re-fire once loadProfile() finishes and setProfile() is called.
    if (!profile) return;

    if (!profile.is_onboarded) {
      const target =
        profile.account_type === 'startup'
          ? '/(auth)/onboarding/startup/basics'
          : '/(auth)/onboarding/investor/basics';
      if (!inAuth) router.replace(target as any);
      return;
    }

    if (!inTabs) router.replace('/(tabs)/feed');
  }, [isInitialized, session, profile]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <AuthGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="modals/startup-detail"
                  options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen
                  name="modals/investor-detail"
                  options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen
                  name="modals/conversation"
                  options={{ presentation: 'fullScreenModal', headerShown: false }}
                />
                <Stack.Screen
                  name="settings"
                  options={{ presentation: 'card', headerShown: false, animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="modals/edit-profile"
                  options={{ presentation: 'fullScreenModal', headerShown: false }}
                />
              </Stack>
            </AuthGuard>
            <ToastContainer />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
