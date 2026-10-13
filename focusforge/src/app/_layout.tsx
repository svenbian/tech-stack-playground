import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';

import { CelebrationModal } from '@/components/CelebrationModal';
import { useAppWatchers } from '@/hooks/useAppWatchers';
import { useFocusStore } from '@/store/focusStore';
import { useIsDark, useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const hydrated = useFocusStore((s) => s.hydrated);
  const onboarded = useFocusStore((s) => s.settings.onboarded);
  const isDark = useIsDark();
  const t = useTheme();

  // Session ticking + shield sync live here so they run on every screen.
  useAppWatchers();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: t.background, card: t.surface, text: t.text, primary: t.primary, border: t.border },
    };
  }, [isDark, t]);

  // Keep the splash screen up until persisted state is loaded, so the UI never flashes empty.
  if (!hydrated) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.background } }}>
        {/* Protected routes: Expo Router redirects automatically when the guard flips. */}
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="session/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="session/active" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="blocklist/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="schedule/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="limit/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="blocked" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="simulator" />
          <Stack.Screen name="allowlist" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
      <CelebrationModal />
    </ThemeProvider>
  );
}
