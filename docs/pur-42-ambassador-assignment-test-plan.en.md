# PUR-42: AmbassadorAssignmentScreen Test Plan

This document is a test plan only. No PurePath source or test file was created or modified.

## Inspected files

- `apps/mobile/lib/query-client.ts`
- `apps/mobile/app/_layout.tsx`
- `apps/mobile/app/ambassador-assignment/[id].tsx`
- `apps/api/server/routes.ts`
- `apps/mobile/package.json`

## Findings established from the code

### 1. Default query function

The application `QueryClient` configures:

```ts
queryFn: getQueryFn({ on401: 'throw' })
```

The assignment screen does not supply its own `queryFn`, so it uses this global default.

The query function joins this query key:

```text
['/api/community/ambassador-assignment', id]
```

into an endpoint shaped like:

```text
/api/community/ambassador-assignment/<id>
```

It then performs an authenticated GET through `fetchAuthenticated` and `expo/fetch`.

### 2. AbortSignal consumption

The cancellation path is:

```text
React Query signal
→ getQueryFn
→ fetchAuthenticated
→ fetchWithTimeout(externalSignal)
→ AbortController.abort()
→ expo/fetch receives controller.signal
```

The React Query `AbortSignal` therefore reaches and can cancel the underlying request.

### 3. Global defaults and screen override

| Option | Value |
|---|---:|
| Global `staleTime` | 5 minutes |
| Assignment screen `staleTime` | 30 seconds |
| Global `refetchInterval` | `false` |
| Global `refetchOnWindowFocus` | `false` |
| Global `gcTime` | 30 minutes |
| Mutation retry | `false` |
| Query retry | Conditional function |
| Retry delay | Exponential, capped at 10 seconds |

The query retry function retries transient conditions such as timeouts, connection failures, and selected server errors. It does not retry cancellation, permission, not-found, or sign-in errors.

### 4. Application focus integration

React Query is connected to application focus through custom `AppState` handling rather than `focusManager`.

When the application moves from `inactive/background` to `active`:

```text
AppState listener
→ invalidateAllStaleQueries()
→ queryClient.invalidateQueries()
→ active queries refetch in the background
```

Despite its name, `invalidateAllStaleQueries` performs an unfiltered invalidation. It therefore marks every cached query as stale, and active queries are refetched.

### 5. Network-status integration

React Query is connected to network status through custom `NetInfo` handling rather than `onlineManager`.

```text
NetInfo reports disconnected
→ wasOfflineRef = true

NetInfo later reports connected
→ invalidateAllStaleQueries()
→ retryLoad()
→ processOfflineQueue()
```

An offline-to-online transition can therefore request the active assignment again.

### 6. Successful assignment interface

#### Shared interface

- A modal screen with the standard header hidden.
- A chevron close control.
- An avatar showing the first letter of the other participant's name.
- The other participant's name, falling back to `A brother or sister`.
- A verified-role pill when `otherVerifiedRole` exists.
- `This connection is closed` when `status !== 'active'`.

#### Ambassador interface

- Header: `Someone to support`.
- Introductory support guidance beginning with `As-salamu alaykum`.
- `What they are facing` and the struggle summary when provided.
- `Risk level: <level>` when provided.
- `Briefing` and its content when provided.
- `A first approach` and its content when provided.
- `Note from the team` and its content when provided.
- Sticky action: `Open chat`.

#### Mentee interface

- Header: `You are not alone`.
- Mentee-specific supportive introduction.
- A fixed message beginning with `Whenever you feel ready, say salam`.
- No briefing, metrics, or risk information from the server contract.
- Sticky action: `Say salam`.

The backend confirms that briefing, approach, risk, administrative notes, and metrics are returned only to the ambassador. A mentee receives only the base assignment fields.

### 7. Mechanisms that can request the data again

The same assignment can be requested again through:

1. Foreground invalidation from the `AppState` listener.
2. Reconnection invalidation after an offline-to-online transition.
3. Remounting after the query has become stale because `refetchOnMount` is not disabled.
4. The conditional React Query retry policy for transient failures.
5. One internal retry after a `401` when session refresh succeeds.

Changing the route ID does not request the same data. It creates another query identity:

```text
['/api/community/ambassador-assignment', 'assignment-a']
['/api/community/ambassador-assignment', 'assignment-b']
```

## Test environment design

Every test should receive a fresh `QueryClient` configured with:

```text
retry: false
gcTime: Infinity
```

Tests must not import the application's singleton QueryClient.

Required providers and mocks:

- `QueryClientProvider` with a test QueryClient.
- A `useLocalSearchParams` mock controlling the route `id`.
- Mocks for `router.canGoBack`, `router.back`, and `router.replace` when testing the back action.
- A minimal `Stack.Screen` mock if Jest requires one.
- A `SafeAreaProvider` with deterministic insets, or a focused `useSafeAreaInsets` mock.
- Jest/Expo handling or a mock for vector icons.
- An `expo-haptics` mock only if a test presses `Open chat` or `Say salam`.

The test QueryClient should receive a controlled default query function instead of making a real request. The function can inspect `queryKey` and return a Promise that the test resolves or rejects intentionally.

## Test 1: Valid assignment success

### Initial condition

- Route ID is `assignment-1`.
- The test cache is fresh and empty.
- The controlled query function initially remains unresolved.
- The eventual response represents an active ambassador assignment containing every optional visible field.

### User-visible action or route input

Render route `/ambassador-assignment/assignment-1`. Mounting the screen starts the query; the test must not call an internal handler.

### Controlled server response

```ts
{
  assignment: {
    id: 'assignment-1',
    role: 'ambassador',
    status: 'active',
    createdAt: '2026-09-24T10:00:00.000Z',
    otherUserId: 'mentee-1',
    otherUsername: 'HopefulHeart',
    otherAvatarColor: '#336699',
    otherVerifiedRole: 'Verified Member',
    struggleSummary: 'Needs support staying consistent.',
    briefing: 'Listen first and avoid assumptions.',
    suggestedApproach: 'Begin with a gentle check-in.',
    riskLevel: 'moderate',
    adminNote: 'Escalate if immediate danger is disclosed.',
  },
}
```

### Expected visible result

- `Someone to support`.
- `HopefulHeart`.
- `Verified Member`.
- The ambassador introduction.
- `What they are facing` and the supplied summary.
- `Risk level: moderate`.
- `Briefing` and its content.
- `A first approach` and its content.
- `Note from the team` and its content.
- The `Open chat` action.
- No `This support connection could not be found.` message.

### Required provider or mock

- Fresh QueryClientProvider.
- Route parameter mock returning `assignment-1`.
- Safe-area wrapper or mock.
- Controlled query function.

### Recommended follow-up

A separate mentee success test should protect the `You are not alone` and `Say salam` interface and prove that ambassador-only information is absent.

## Test 2: Initial loading

### Initial condition

- The route ID is valid.
- The cache is empty.
- The controlled query Promise remains unresolved.

### User-visible action or route input

Render the screen with route ID `assignment-loading`.

### Controlled server response

Keep the Promise pending until the loading assertion completes. Resolve it with a valid response before ending the test so no update remains pending.

### Expected visible result

- The ActivityIndicator loading interface is visible.
- Neither the success identity nor the not-found interface is visible before resolution.
- The first preferred selector is role `progressbar` if RNTL exposes the ActivityIndicator with that role.

### Required provider or mock

- Fresh QueryClientProvider.
- Controlled Promise.
- Route parameter mock.
- Safe-area wrapper or mock.

## Test 3: Request failure

### Initial condition

- Route ID is `assignment-network-error`.
- Retries are disabled in the test QueryClient.

### User-visible action or route input

Render the screen.

### Controlled server response

Reject the query function with:

```ts
new Error('Unable to connect.')
```

### Expected visible result

- `This support connection could not be found.`.
- A `Go back` action.
- No successful assignment interface.
- The query function is called once, proving that the test environment did not retry.

### Required provider or mock

- Fresh QueryClientProvider with `retry: false`.
- Rejecting query function.
- Route and router mocks.
- Safe-area wrapper or mock.

## Test 4: Missing assignment

### Initial condition

- Route ID is `missing-assignment`.
- The request succeeds, but the public client response contains no assignment.

### User-visible action or route input

Render the screen.

### Controlled server response

```ts
{ assignment: null }
```

The current backend returns `404 { error: 'Assignment not found' }` when the row does not exist or the current user is not a participant. A separate 404 test may be added later, but it reaches the UI through `isError` instead of the successful-null defensive branch.

### Expected visible result

- `This support connection could not be found.`.
- A `Go back` action.
- No identity or chat action.

### Required provider or mock

- Fresh QueryClientProvider.
- Query function resolving to `{ assignment: null }`.
- Route and router mocks.
- Safe-area wrapper or mock.

## Test 5: Different route IDs produce different query identities

### Initial condition

- One fresh QueryClient is used for this complete test.
- The controlled query function returns a different response based on the second query-key element.
- The initial route ID is `assignment-a`, followed by `assignment-b`.

### User-visible action or route input

1. Render the screen with `assignment-a`.
2. Resolve the first request with an assignment named `Person A` and wait for it to appear.
3. Change the route mock to `assignment-b` and rerender under the same provider.
4. Resolve the second request with an assignment named `Person B`.

### Controlled server response

- `assignment-a` returns a valid assignment for `Person A`.
- `assignment-b` returns a valid assignment for `Person B`.

### Expected visible result

- `Person A` appears after the first request.
- Changing the ID enters the new query's loading state, then displays `Person B`.
- Assignment A's data is not treated as assignment B's data.
- The controlled query function receives a key ending in `assignment-a`, then a distinct key ending in `assignment-b`.

### Required provider or mock

- One isolated QueryClient for this complete scenario.
- A mutable route-parameter mock or rerender helper.
- A query function controlled by `queryKey`.
- Safe-area wrapper or mock.

## Tests must not

- Import the application QueryClient singleton.
- Perform a real request.
- Wait for a production timeout.
- Inspect component state.
- Call the screen's query function or handlers directly.
- Depend on JSX child order.
- Modify PurePath as part of PUR-42; this remains a plan only.

## Genuine remaining unknown

The screen does not give its ActivityIndicator an explicit accessible label. React Native Testing Library is expected to expose it with role `progressbar`, but the exact selector cannot be proven by static inspection alone. It requires a smoke render in PurePath's actual Jest environment. If that role is not exposed, an accessibility decision should be made before implementation rather than using a fragile internal selector.

## References

- TanStack Query testing: <https://tanstack.com/query/latest/docs/framework/react/guides/testing>
- TanStack Query invalidation: <https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation>
- TanStack Query important defaults: <https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults>
