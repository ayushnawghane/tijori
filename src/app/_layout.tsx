import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_600SemiBold_Italic } from '@expo-google-fonts/playfair-display/600SemiBold_Italic';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { SourceSans3_400Regular } from '@expo-google-fonts/source-sans-3/400Regular';
import { SourceSans3_500Medium } from '@expo-google-fonts/source-sans-3/500Medium';
import { SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3/600SemiBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PaperGrain } from '@/components/ui/paper-grain';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { SmsPermissionProvider, useSmsPermission } from '@/state/sms-permission';
import { TijoriProvider } from '@/state/tijori-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Fonts ship inside the app bundle — nothing is downloaded at runtime.
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_600SemiBold_Italic,
    PlayfairDisplay_700Bold,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
  });
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
      primary: theme.sageInk,
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
        <PaperGrain />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
