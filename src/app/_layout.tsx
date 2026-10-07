import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useIsDark, useTheme } from '@/hooks/use-theme';
import { SmsPermissionProvider, useSmsPermission } from '@/state/sms-permission';
import { TijoriProvider } from '@/state/tijori-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Fonts ship inside the app bundle — nothing is downloaded at runtime.
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <SmsPermissionProvider>
      <AppShell />
    </SmsPermissionProvider>
  );
}

function AppShell() {
  const { status } = useSmsPermission();
  const dark = useIsDark();
  const theme = useTheme();

  useEffect(() => {
    if (status !== 'checking') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'checking') return null;

  const granted = status === 'granted';
  const base = dark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.bg,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <TijoriProvider enabled={granted}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
            <Stack.Protected guard={granted}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="transaction/[id]"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </Stack.Protected>
            <Stack.Protected guard={!granted}>
              <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            </Stack.Protected>
          </Stack>
        </TijoriProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
