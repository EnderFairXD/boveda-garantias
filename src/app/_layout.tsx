import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthGate } from '@/components/auth-gate';
import { UpdateBanner } from '@/components/update-banner';
import { useGithubUpdate } from '@/hooks/use-github-update';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { status, latestVersion, applyUpdate } = useGithubUpdate();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthGate>
        <UpdateBanner status={status} latestVersion={latestVersion} onPress={applyUpdate} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scan" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </AuthGate>
    </ThemeProvider>
  );
}
