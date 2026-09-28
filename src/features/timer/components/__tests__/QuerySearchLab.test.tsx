import { act, render, screen, userEvent } from '@testing-library/react-native';
import { focusManager, onlineManager } from '@tanstack/react-query';

import {
  createTestQueryClient,
  createTestQueryWrapper,
} from '../../../../test/create-test-query-client';
import { QuerySearchLab, type SearchFunction } from '../QuerySearchLab';

function createControlledPromise<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error('Promise resolver is not ready.');
  };

  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

function renderQuerySearchLab(search?: SearchFunction) {
  const queryClient = createTestQueryClient();
  const wrapper = createTestQueryWrapper(queryClient);

  return render(<QuerySearchLab search={search} />, { wrapper });
}

describe('QuerySearchLab', () => {
  test('shows the initial search interface', async () => {
    await renderQuerySearchLab();

    expect(screen.getByText('Enter a search term to begin.')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Refetch current search' }),
    ).toBeDisabled();
  });

  test('moves from loading to a successful healing result', async () => {
    const controlled = createControlledPromise<string>();
    const search: SearchFunction = jest.fn(() => controlled.promise);
    const user = userEvent.setup();

    await renderQuerySearchLab(search);

    await user.type(
      screen.getByLabelText('React Query search term'),
      'healing',
    );
    await user.press(
      screen.getByRole('button', { name: 'Search with React Query' }),
    );

    expect(screen.getByText('Searching for healing...')).toBeOnTheScreen();

    await act(async () => {
      controlled.resolve('Healing result from the controlled search.');
    });

    expect(
      await screen.findByText('Healing result from the controlled search.'),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/^Search failed/)).not.toBeOnTheScreen();
  });

  test('shows a search error without retrying automatically', async () => {
    const search: SearchFunction = jest
      .fn()
      .mockRejectedValue(new Error('The controlled search failed.'));
    const user = userEvent.setup();

    await renderQuerySearchLab(search);

    await user.type(
      screen.getByLabelText('React Query search term'),
      'error',
    );
    await user.press(
      screen.getByRole('button', { name: 'Search with React Query' }),
    );

    expect(
      await screen.findByText(
        'Search failed for error: The controlled search failed.',
      ),
    ).toBeOnTheScreen();
    expect(search).toHaveBeenCalledTimes(1);
  });

  test('reuses fresh cached data and explicitly refetches the same search', async () => {
    const firstHeartSearch = createControlledPromise<string>();
    const healingSearch = createControlledPromise<string>();
    const refreshedHeartSearch = createControlledPromise<string>();
    let heartRequestCount = 0;
    const search: SearchFunction = jest.fn((term) => {
      if (term === 'heart') {
        heartRequestCount += 1;
        return heartRequestCount === 1
          ? firstHeartSearch.promise
          : refreshedHeartSearch.promise;
      }

      if (term === 'healing') {
        return healingSearch.promise;
      }

      return Promise.reject(new Error('Unexpected search term.'));
    });
    const user = userEvent.setup();

    await renderQuerySearchLab(search);

    const searchInput = screen.getByLabelText('React Query search term');
    const searchButton = screen.getByRole('button', {
      name: 'Search with React Query',
    });

    await user.type(searchInput, 'heart');
    await user.press(searchButton);

    await act(async () => {
      firstHeartSearch.resolve('Heart result from the first request.');
    });

    expect(
      await screen.findByText('Heart result from the first request.'),
    ).toBeOnTheScreen();

    await user.clear(searchInput);
    await user.type(searchInput, 'healing');
    await user.press(searchButton);

    await act(async () => {
      healingSearch.resolve('Healing result from its first request.');
    });

    expect(
      await screen.findByText('Healing result from its first request.'),
    ).toBeOnTheScreen();

    await user.clear(searchInput);
    await user.type(searchInput, 'heart');
    await user.press(searchButton);

    expect(
      await screen.findByText('Heart result from the first request.'),
    ).toBeOnTheScreen();
    expect(search).toHaveBeenCalledTimes(2);

    expect(screen.getByText('Current term: heart')).toBeOnTheScreen();

    await user.press(
      screen.getByRole('button', { name: 'Refetch current search' }),
    );

    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenLastCalledWith('heart', expect.anything());
    expect(
      screen.getByText('Heart result from the first request.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('fetchStatus: fetching')).toBeOnTheScreen();

    await act(async () => {
      refreshedHeartSearch.resolve('Heart result from the explicit refetch.');
    });

    expect(
      await screen.findByText('Heart result from the explicit refetch.'),
    ).toBeOnTheScreen();
  });

  test('pauses an uncached search offline and starts it after reconnecting', async () => {
    const previousOnlineState = onlineManager.isOnline();
    const controlled = createControlledPromise<string>();
    const search: SearchFunction = jest.fn(() => controlled.promise);
    const user = userEvent.setup();

    onlineManager.setOnline(false);

    try {
      await renderQuerySearchLab(search);

      await user.type(
        screen.getByLabelText('React Query search term'),
        'heart',
      );
      await user.press(
        screen.getByRole('button', { name: 'Search with React Query' }),
      );

      expect(screen.getByText('status: pending')).toBeOnTheScreen();
      expect(screen.getByText('fetchStatus: paused')).toBeOnTheScreen();
      expect(search).not.toHaveBeenCalled();

      await act(async () => {
        onlineManager.setOnline(true);
      });

      expect(
        await screen.findByText('fetchStatus: fetching'),
      ).toBeOnTheScreen();
      expect(search).toHaveBeenCalledTimes(1);

      await act(async () => {
        controlled.resolve('Heart result after reconnecting.');
      });

      expect(
        await screen.findByText('Heart result after reconnecting.'),
      ).toBeOnTheScreen();
    } finally {
      onlineManager.setOnline(previousOnlineState);
    }
  });

  test('refetches a stale active query when the application regains focus', async () => {
    const previousOnlineState = onlineManager.isOnline();
    const initialTime = Date.now();
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(initialTime);
    let renderResult:
      | Awaited<ReturnType<typeof renderQuerySearchLab>>
      | undefined;
    const firstSearch = createControlledPromise<string>();
    const focusRefetch = createControlledPromise<string>();
    const search: SearchFunction = jest
      .fn()
      .mockReturnValueOnce(firstSearch.promise)
      .mockReturnValueOnce(focusRefetch.promise);

    const user = userEvent.setup();
    onlineManager.setOnline(true);
    focusManager.setFocused(true);

    try {
      renderResult = await renderQuerySearchLab(search);

      await user.type(
        screen.getByLabelText('React Query search term'),
        'heart',
      );
      await user.press(
        screen.getByRole('button', { name: 'Search with React Query' }),
      );

      await act(async () => {
        firstSearch.resolve('Heart result before backgrounding.');
      });

      expect(
        await screen.findByText('Heart result before backgrounding.'),
      ).toBeOnTheScreen();
      expect(search).toHaveBeenCalledTimes(1);

      await act(async () => {
        focusManager.setFocused(false);
      });
      dateNowSpy.mockReturnValue(initialTime + 60_001);

      await act(async () => {
        focusManager.setFocused(true);
      });

      expect(search).toHaveBeenCalledTimes(2);

      await act(async () => {
        focusRefetch.resolve('Heart result after returning active.');
      });

      expect(
        await screen.findByText('Heart result after returning active.'),
      ).toBeOnTheScreen();
    } finally {
      await renderResult?.unmount();
      await act(async () => {
        focusManager.setFocused(undefined);
        onlineManager.setOnline(previousOnlineState);
      });
      dateNowSpy.mockRestore();
    }
  });
});
