import { focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

export function ReactQueryMobileEvents() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    onlineManager.setEventListener((setOnline) => {
      let hasReceivedNetworkEvent = false;
      let isDisposed = false;

      const subscription = Network.addNetworkStateListener((state) => {
        hasReceivedNetworkEvent = true;
        setOnline(Boolean(state.isConnected));
      });

      void Network.getNetworkStateAsync()
        .then((state) => {
          if (!isDisposed && !hasReceivedNetworkEvent) {
            setOnline(Boolean(state.isConnected));
          }
        })
        .catch(() => {
          // Preserve React Query's existing online state if the initial read fails.
        });

      return () => {
        isDisposed = true;
        subscription.remove();
      };
    });

    return () => {
      onlineManager.setEventListener(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    focusManager.setFocused(AppState.currentState === 'active');

    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });

    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, []);

  return null;
}
