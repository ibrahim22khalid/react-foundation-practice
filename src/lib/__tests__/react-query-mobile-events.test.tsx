import { act, render, waitFor } from '@testing-library/react-native';
import { focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import type { NetworkStateEvent } from 'expo-network';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { ReactQueryMobileEvents } from '../react-query-mobile-events';

jest.mock('expo-network', () => ({
  addNetworkStateListener: jest.fn(),
  getNetworkStateAsync: jest.fn(),
}));

describe('ReactQueryMobileEvents', () => {
  const originalOnlineState = onlineManager.isOnline();
  let appStateListener: ((status: AppStateStatus) => void) | undefined;
  let networkStateListener:
    | ((state: NetworkStateEvent) => void)
    | undefined;
  let removeAppStateListener: jest.Mock;
  let removeNetworkListener: jest.Mock;

  beforeEach(() => {
    removeAppStateListener = jest.fn();
    removeNetworkListener = jest.fn();
    jest.mocked(Network.getNetworkStateAsync).mockResolvedValue({
      isConnected: true,
    });
    jest
      .mocked(Network.addNetworkStateListener)
      .mockImplementation((listener) => {
        networkStateListener = listener;
        return { remove: removeNetworkListener };
      });
    jest.spyOn(AppState, 'addEventListener').mockImplementation(
      (_eventType, listener) => {
        appStateListener = listener;
        return { remove: removeAppStateListener };
      },
    );
  });

  afterEach(() => {
    focusManager.setFocused(undefined);
    onlineManager.setOnline(originalOnlineState);
    appStateListener = undefined;
    networkStateListener = undefined;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('reports background as unfocused and active as focused', async () => {
    const view = await render(<ReactQueryMobileEvents />);

    expect(appStateListener).toBeDefined();

    await act(async () => {
      appStateListener?.('background');
    });

    expect(focusManager.isFocused()).toBe(false);

    await act(async () => {
      appStateListener?.('active');
    });

    expect(focusManager.isFocused()).toBe(true);

    await view.unmount();
  });

  test('removes every native listener when the integration unmounts', async () => {
    const view = await render(<ReactQueryMobileEvents />);

    await view.unmount();

    expect(removeNetworkListener).toHaveBeenCalledTimes(1);
    expect(removeAppStateListener).toHaveBeenCalledTimes(1);
  });

  test('reports the initial network state and later connectivity changes', async () => {
    jest.mocked(Network.getNetworkStateAsync).mockResolvedValue({
      isConnected: false,
    });

    const view = await render(<ReactQueryMobileEvents />);

    await waitFor(() => {
      expect(onlineManager.isOnline()).toBe(false);
    });

    await act(async () => {
      networkStateListener?.({ isConnected: true });
    });

    expect(onlineManager.isOnline()).toBe(true);

    await view.unmount();
  });

  test('does not register native listeners on Web', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');

    const view = await render(<ReactQueryMobileEvents />);

    expect(Network.getNetworkStateAsync).not.toHaveBeenCalled();
    expect(Network.addNetworkStateListener).not.toHaveBeenCalled();
    expect(AppState.addEventListener).not.toHaveBeenCalled();

    await view.unmount();
  });

  test('preserves the known online state when the initial read fails', async () => {
    onlineManager.setOnline(false);
    jest
      .mocked(Network.getNetworkStateAsync)
      .mockRejectedValue(new Error('Native network state unavailable.'));

    const view = await render(<ReactQueryMobileEvents />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(onlineManager.isOnline()).toBe(false);
    expect(Network.addNetworkStateListener).toHaveBeenCalledTimes(1);

    await view.unmount();
  });
});
