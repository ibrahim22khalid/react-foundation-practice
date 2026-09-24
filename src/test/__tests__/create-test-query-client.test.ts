import { createTestQueryClient } from '../create-test-query-client';

describe('createTestQueryClient', () => {
  test('creates an isolated empty cache', () => {
    const firstQueryClient = createTestQueryClient();
    const secondQueryClient = createTestQueryClient();
    const searchQueryKey = ['search', 'heart'] as const;

    firstQueryClient.setQueryData(searchQueryKey, ['Heart result']);

    expect(firstQueryClient.getQueryData(searchQueryKey)).toEqual([
      'Heart result',
    ]);
    expect(secondQueryClient.getQueryData(searchQueryKey)).toBeUndefined();
  });
});
