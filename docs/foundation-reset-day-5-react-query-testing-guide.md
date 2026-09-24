# Foundation Reset Day 5: اختبار React Query باستخدام Cache معزولة

الدليل ده بيوثّق تطبيق تذكرة `PUR-42` من البداية للنهاية. الهدف هو اختبار سلوك `QuerySearchLab` الظاهر للمستخدم، مع منع تسرب React Query cache بين الاختبارات، ثم تحويل تتبع PurePath إلى test plan قابل للتنفيذ مستقبلًا.

## 1. نطاق العمل

تم تنفيذ التغييرات داخل مشروع التدريب فقط:

```text
src/test/create-test-query-client.tsx
src/test/__tests__/create-test-query-client.test.ts
src/features/timer/components/QuerySearchLab.tsx
src/features/timer/components/__tests__/QuerySearchLab.test.tsx
docs/pur-42-ambassador-assignment-test-plan.md
docs/pur-42-ambassador-assignment-test-plan.en.md
docs/foundation-reset-day-5-react-query-testing-guide.md
```

PurePath تم استخدامه read-only. لم يتم إنشاء أو تعديل أي source أو test file داخله.

## 2. لماذا تحتاج React Query إلى عزل خاص؟

`QueryClient` تمتلك cache تحتوي على:

- البيانات الناجحة.
- الأخطاء.
- query status.
- timestamps التي تحدد هل البيانات fresh أو stale.
- requests الموجودة حاليًا.

لو اختباران استخدما نفس QueryClient، الاختبار الثاني قد يجد نتيجة الاختبار الأول جاهزة. ده قد يجعله:

- يتخطى loading المتوقعة.
- لا يستدعي search function.
- يعرض بيانات من test سابقة.
- ينجح منفردًا ويفشل مع المجموعة الكاملة.
- يعتمد على ترتيب تشغيل tests.

الحل هو إنشاء QueryClient جديدة لكل test.

## 3. Test QueryClient

الـfactory:

```tsx
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}
```

### `retry: false`

Error test يجب أن تفشل مرة واحدة بشكل حتمي. وجود retries يجعل الاختبار أبطأ، وقد يسبب timeout، ويغيّر عدد مرات استدعاء dependency.

### `gcTime: Infinity`

يمنع garbage-collection timers من إبقاء Jest مفتوحًا بعد انتهاء الاختبار.

### Provider wrapper

```tsx
export function createTestQueryWrapper(queryClient: QueryClient) {
  return function TestQueryWrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}
```

كل test تنشئ client وwrapper جديدتين داخل عملية العرض.

## 4. إثبات cache isolation

اختبار البنية وضع نتيجة داخل client أولى:

```tsx
firstQueryClient.setQueryData(
  ['search', 'heart'],
  ['Heart result'],
);
```

ثم بحث عن نفس key في client ثانية:

```tsx
expect(secondQueryClient.getQueryData(searchQueryKey)).toBeUndefined();
```

النتيجة:

```text
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
```

استخدام QueryClient public API هنا مقصود لأننا نختبر test infrastructure نفسها. اختبارات component التالية تعتمد على الواجهة المرئية بدل قراءة cache.

## 5. Typed test seam

`QuerySearchLab` كانت مرتبطة مباشرة بـ`fakeSearch`. تم إضافة optional dependency:

```tsx
export type SearchFunction = typeof fakeSearch;

type QuerySearchLabProps = {
  search?: SearchFunction;
};

export function QuerySearchLab({ search = fakeSearch }: QuerySearchLabProps) {
  // ...
}
```

الـdefault ما زالت `fakeSearch`، ولذلك سلوك التطبيق لم يتغير. الاختبار فقط يستطيع تمرير function حتمية بدون production delays.

العقد يحافظ على term وAbortSignal:

```text
(term: SearchTerm, signal: AbortSignal) → Promise<string>
```

## 6. Controlled Promise

```tsx
function createControlledPromise<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error('Promise resolver is not ready.');
  };

  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}
```

الاختبار يتحكم في التوقيت:

```text
press Search
→ Promise تظل pending
→ loading تظهر
→ test يحل Promise داخل act
→ success result تظهر
```

لا يوجد `setTimeout` ولا انتظار delay حقيقية.

## 7. طريقة تصميم كل اختبار

قبل قبول test code تم تحديد أربعة أشياء:

| Test | Behavior | Controlled dependency | Visible assertion | Isolation |
|---|---|---|---|---|
| Initial | واجهة البداية | لا request | instruction + disabled Refetch | QueryClient جديدة |
| Success | loading ثم healing result | controlled search Promise | loading/result/no error | QueryClient جديدة |
| Error | error تظهر بدون retry | rejecting search function | user-facing error | QueryClient جديدة + retry false |
| Cache/refetch | reuse ثم explicit refresh | ثلاث controlled Promises | cached/old/refreshed results | QueryClient واحدة لهذا السيناريو فقط |

## 8. Initial interface

الاختبار يثبت:

```tsx
expect(screen.getByText('Enter a search term to begin.')).toBeOnTheScreen();
expect(
  screen.getByRole('button', { name: 'Refetch current search' }),
).toBeDisabled();
```

استخدام role والاسم المتاح يمثل طريقة المستخدم وتقنيات accessibility في إيجاد الزر.

## 9. Successful query

التدفق:

```text
type healing
→ press Search with React Query
→ Searching for healing...
→ resolve controlled Promise
→ Healing result from the controlled search.
→ no Search failed interface
```

الاختبار لا يستدعي handler أو search callback مباشرة؛ التفاعل يبدأ من input والزر المعروضين.

## 10. Failed query وعدم وجود retries

الـdependency ترفض بـError حقيقية:

```tsx
const search: SearchFunction = jest
  .fn()
  .mockRejectedValue(new Error('The controlled search failed.'));
```

النتيجة المرئية:

```text
Search failed for error: The controlled search failed.
```

ودليل عدم وجود automatic retry:

```tsx
expect(search).toHaveBeenCalledTimes(1);
```

## 11. Query key وcache identity

الـquery key الحالية:

```tsx
['learning-search', normalizedTerm]
```

لذلك:

```text
['learning-search', 'heart']
≠
['learning-search', 'healing']
```

كل term لها cache entry مستقلة.

الـ`staleTime` تساوي 60 ثانية، ولذلك heart تظل fresh أثناء الاختبار.

## 12. Cache reuse sequence

اختبار واحد استخدم QueryClient واحدة معزولة ونفذ:

```text
1. Search heart
2. Resolve first heart result
3. Search healing
4. Resolve healing result
5. Return to heart
```

بعد الرجوع إلى heart:

- ظهرت نتيجة heart الأولى مباشرة.
- search function بقيت مستدعاة مرتين فقط: heart ثم healing.
- لم تحدث request ثالثة للـfresh heart data.

## 13. Explicit refetch

بعد ظهور cached heart result:

```text
press Refetch current search
→ call count becomes 3
→ last term remains heart
→ old heart result remains visible
→ fetchStatus: fetching
→ resolve refreshed Promise
→ refreshed heart result appears
```

ده يثبت إن refetch تحدّث نفس query identity ولا تنشئ query جديدة.

## 14. لماذا attempt number لا تدخل query key؟

Query key تصف هوية البيانات، وليس عدد مرات طلبها.

الصحيح:

```text
['learning-search', 'heart']
```

غير الصحيح:

```text
['learning-search', 'heart', 1]
['learning-search', 'heart', 2]
```

إضافة attempt number تجعل كل refetch cache entry مختلفة. النتيجة القديمة لن تكون هي data الخاصة بنفس query، وسنفقد cache reuse وbackground-refetch behavior.

## 15. تجربة failure المقصودة

تم تغيير expectation مؤقتًا إلى:

```tsx
await screen.findByText('Healing result that does not exist.');
```

ثم تشغيل:

```powershell
npm.cmd test -- QuerySearchLab.test.tsx --runInBand
```

النتيجة:

```text
FAIL QuerySearchLab.test.tsx
Unable to find an element with text: Healing result that does not exist.
Tests: 1 failed, 3 passed, 4 total
```

رسالة Jest/RNTL قدمت الأدلة التالية:

- النص المتوقع الخاطئ.
- النص الحقيقي: `Healing result from the controlled search.`.
- input تحتوي `healing`.
- `Current term: healing`.
- `status: success`.
- `fetchStatus: idle`.
- اسم test الفاشلة والسطر 60.

تمت استعادة expectation الصحيحة وتشغيل نفس الأمر:

```text
PASS QuerySearchLab.test.tsx
Tests: 4 passed, 4 total
```

لا يوجد failure متروكة في المشروع.

## 16. خطأ PowerShell أثناء Finish

أول command مجمّعة للفحوص احتوت regex مع quotes متداخلة بشكل غير صحيح، فظهر:

```text
The string is missing the terminator: '.
```

الأوامر لم تبدأ، وبالتالي الخطأ لم يكن test أو lint failure. تم تبسيط regex وفصل البحث عن singleton، ثم تشغيل الفحوص بنجاح.

الدرس: عند كتابة regex معقدة داخل PowerShell ثم تمريرها خلال أداة أخرى، الأفضل تبسيطها أو تقسيمها بدل تكديس single وdouble quotes.

## 17. أوامر التشغيل على PowerShell وCMD

استخدام `.cmd` يعمل في PowerShell وCMD ويتجنب PowerShell Execution Policy.

### اختبار helper فقط

```powershell
npm.cmd test -- create-test-query-client.test.ts --runInBand
```

### اختبار QuerySearchLab فقط

```powershell
npm.cmd test -- QuerySearchLab.test.tsx --runInBand
```

### المجموعة الكاملة

```powershell
npm.cmd test -- --runInBand
```

أول `--` تمرر الخيارات من npm إلى Jest. `--runInBand` يشغل tests بالتتابع داخل process واحدة.

### Lint

```powershell
npm.cmd run lint
```

### TypeScript

```powershell
npx.cmd tsc --noEmit
```

### تاريخ commits

```powershell
git log --oneline -5
```

### التأكد من عدم وجود tests داخل routes

```powershell
rg --files src/app | rg '(__tests__|\.(test|spec)\.)'
```

عدم وجود output يعني عدم وجود test files داخل `src/app`.

### البحث عن الأنماط الممنوعة

```powershell
rg -n '\bany\b|testID|toMatchSnapshot|toMatchInlineSnapshot' src/test src/features/timer/components/__tests__/QuerySearchLab.test.tsx
```

عدم وجود output يثبت عدم استخدام `any` أو `testID` أو snapshots داخل اختبارات PUR-42.

### مراجعة QueryClient imports

```powershell
rg -n 'query-client' src/test src/features/timer/components/__tests__/QuerySearchLab.test.tsx
```

النتائج تشير فقط إلى `create-test-query-client`، وليس `src/lib/query-client.ts` singleton الخاصة بالتطبيق.

## 18. النتائج النهائية

```text
Jest:       PASS — 5 suites, 21 tests, 0 snapshots
Expo lint:  PASS
TypeScript: PASS — exit code 0, no emitted files
Route tests: none
Forbidden patterns: none
```

## 19. PurePath read-only trace

تم فحص:

```text
apps/mobile/lib/query-client.ts
apps/mobile/app/_layout.tsx
apps/mobile/app/ambassador-assignment/[id].tsx
apps/api/server/routes.ts
apps/mobile/package.json
```

النتائج الأساسية:

1. `getQueryFn({ on401: 'throw' })` هي default query function.
2. React Query AbortSignal تصل إلى request الفعلية.
3. global staleTime خمس دقائق؛ الشاشة تستخدم 30 ثانية.
4. `refetchInterval` و`refetchOnWindowFocus` معطلان.
5. `AppState` تعمل custom foreground invalidation.
6. `NetInfo` تعمل custom reconnect invalidation.
7. success interface تختلف بين ambassador وmentee.
8. backend يعيد 401/400/404 حسب الحالة، ويحمي بيانات السفير الحساسة من mentee.

خطط الاختبار التفصيلية:

- `docs/pur-42-ambassador-assignment-test-plan.md`
- `docs/pur-42-ambassador-assignment-test-plan.en.md`

PurePath لم يتم تعديلها.

## 20. Genuine remaining unknown

`ActivityIndicator` في PurePath لا تحمل accessible label صريحة. المتوقع أن تعرضها RNTL بدور `progressbar`، لكن selector الفعلية لا يمكن إثباتها بالقراءة الساكنة. تحتاج smoke render داخل test environment الخاصة بـPurePath.

## 21. Commit separation

قبل إنشاء commit K كان التاريخ:

```text
613342e test: cover form and asynchronous states
5bd3a29 test: add LearningCard behavior tests
8a05937 feat: replace manual search effect with useQuery
```

الترتيب المطلوب:

```text
Foundation Reset I → test: add LearningCard behavior tests
Foundation Reset J → test: cover form and asynchronous states
Foundation Reset K → test: cover React Query search behavior
```

## 22. Ticket comment المقترح

1. Every test receives a fresh QueryClient so cached data, errors, and query timestamps cannot leak into another test.
2. Retries are disabled so a rejected query fails once, quickly, and deterministically instead of retrying with backoff.
3. Returning from healing to heart displayed the cached heart result while the search function call count stayed at two.
4. Pressing `Refetch current search` increased the call count to three for the same heart term, kept the old result visible, and then displayed the refreshed result.
5. PUR-39 unknowns resolved: the default query function, AbortSignal flow, global stale/refetch defaults, custom AppState focus integration, custom NetInfo reconnect integration, the complete assignment interface, and the mechanisms that can request the data again.
6. Genuine remaining unknown: whether PurePath's Jest/RNTL environment exposes its unlabeled ActivityIndicator with the `progressbar` role.

## 23. المراجع الرسمية

- Expo SDK 57: <https://docs.expo.dev/versions/v57.0.0/>
- Expo unit testing: <https://docs.expo.dev/develop/unit-testing/>
- TanStack Query testing: <https://tanstack.com/query/latest/docs/framework/react/guides/testing>
- TanStack Query keys: <https://tanstack.com/query/latest/docs/framework/react/guides/query-keys>
- TanStack Query caching: <https://tanstack.com/query/latest/docs/framework/react/guides/caching>
- TanStack Query invalidation: <https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation>
- TanStack Query important defaults: <https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults>
