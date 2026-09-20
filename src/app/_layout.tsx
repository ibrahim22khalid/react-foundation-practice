import { DefaultTheme, Tabs, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AnimatedSplashOverlay />
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="network" options={{ title: 'Network' }} />
      </Tabs>
    </ThemeProvider>
  );
}
