import { QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Tabs, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { queryClient } from '@/lib/query-client';
import { ReactQueryMobileEvents } from '@/lib/react-query-mobile-events';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryMobileEvents />
      <ThemeProvider value={DefaultTheme}>
        <AnimatedSplashOverlay />
        <Tabs screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="network" options={{ title: 'Network' }} />
          <Tabs.Screen name="effect" options={{ title: 'Effect' }} />
          <Tabs.Screen name="timer" options={{ title: 'Timer' }} />
          <Tabs.Screen name="mutation" options={{ title: 'Mutation' }} />
          <Tabs.Screen
            name="navigation-lab"
            options={{ title: 'Navigation' }}
          />
        </Tabs>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
