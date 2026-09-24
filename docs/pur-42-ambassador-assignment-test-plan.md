# PUR-42: AmbassadorAssignmentScreen test plan

هذا المستند هو test plan فقط. لم يتم إنشاء أو تعديل أي test file داخل PurePath.

## الملفات التي تمت قراءتها

- `apps/mobile/lib/query-client.ts`
- `apps/mobile/app/_layout.tsx`
- `apps/mobile/app/ambassador-assignment/[id].tsx`
- `apps/api/server/routes.ts`
- `apps/mobile/package.json`

## النتائج المؤكدة من الكود

### 1. الـdefault query function

`queryClient` يضبط:

```ts
queryFn: getQueryFn({ on401: 'throw' })
```

شاشة assignment لا تمرر `queryFn` خاصة بها، لذلك تستخدم هذا الـdefault.

`getQueryFn` تجمع query key:

```text
['/api/community/ambassador-assignment', id]
```

إلى endpoint بالشكل:

```text
/api/community/ambassador-assignment/<id>
```

ثم تنفذ GET authenticated باستخدام `fetchAuthenticated` و`expo/fetch`.

### 2. الـAbortSignal

السلسلة المثبتة هي:

```text
React Query signal
→ getQueryFn
→ fetchAuthenticated
→ fetchWithTimeout(externalSignal)
→ AbortController.abort()
→ expo/fetch receives controller.signal
```

إذًا إلغاء query يستهلك `AbortSignal` وينتهي إلى إلغاء request الفعلية.

### 3. Global defaults وscreen override

| Option | القيمة |
|---|---:|
| Global `staleTime` | 5 دقائق |
| Assignment `staleTime` | 30 ثانية |
| Global `refetchInterval` | `false` |
| Global `refetchOnWindowFocus` | `false` |
| Global `gcTime` | 30 دقيقة |
| Mutation retry | `false` |
| Query retry | دالة شرطية |
| Retry delay | exponential، بحد أقصى 10 ثوانٍ |

الـretry تحدث فقط للأخطاء التي تعتبرها `shouldRetry` مؤقتة، مثل timeout أو عدم الاتصال أو بعض أخطاء الخادم. لا تعيد المحاولة مع cancellation أو permission/not-found/sign-in errors.

### 4. Application focus

React Query متصلة بحالة التطبيق عن طريق integration مخصص، وليس `focusManager`.

عند الانتقال من `inactive/background` إلى `active`:

```text
AppState listener
→ invalidateAllStaleQueries()
→ queryClient.invalidateQueries()
→ active queries refetch in the background
```

اسم helper يقول “stale queries”، لكن التنفيذ يستخدم unfiltered invalidation، ولذلك يجعل كل queries stale. TanStack Query تعيد جلب query النشطة بعد invalidation.

### 5. Network status

React Query متصلة بالشبكة عن طريق integration مخصص باستخدام `NetInfo`، وليس `onlineManager`.

```text
NetInfo reports disconnected
→ wasOfflineRef = true

NetInfo later reports connected
→ invalidateAllStaleQueries()
→ retryLoad()
→ processOfflineQueue()
```

إذًا offline→online transition يمكن أن يطلب assignment النشطة مرة أخرى.

### 6. Successful assignment interface

#### العناصر المشتركة

- Modal screen بدون standard header.
- زر إغلاق بأيقونة chevron.
- avatar يعرض أول حرف من اسم الطرف الآخر.
- اسم الطرف الآخر، أو fallback: `A brother or sister`.
- verified-role pill عندما تكون `otherVerifiedRole` موجودة.
- `This connection is closed` عندما تكون `status !== 'active'`.

#### عندما يكون الدور `ambassador`

- Header: `Someone to support`.
- مقدمة تبدأ بـ`As-salamu alaykum` وتشرح مسؤولية الدعم.
- `What they are facing` مع `struggleSummary` عندما تكون موجودة.
- `Risk level: <level>` عندما تكون `riskLevel` موجودة.
- `Briefing` مع محتواها عندما تكون موجودة.
- `A first approach` مع محتواها عندما تكون موجودة.
- `Note from the team` مع محتواها عندما تكون موجودة.
- Sticky action: `Open chat`.

#### عندما يكون الدور `mentee`

- Header: `You are not alone`.
- مقدمة دعم مختلفة.
- رسالة ثابتة تبدأ بـ`Whenever you feel ready, say salam`.
- لا تظهر briefing أو metrics أو risk label من server contract.
- Sticky action: `Say salam`.

الـbackend يثبت أن بيانات briefing وapproach وrisk وadmin note وmetrics ترجع للسفير فقط، بينما mentee تستقبل base assignment فقط.

### 7. آليات طلب نفس البيانات مرة أخرى

1. foreground invalidation من `AppState`.
2. reconnect invalidation بعد offline→online من `NetInfo`.
3. remount بعد مرور `staleTime`، لأن `refetchOnMount` لم يتم تعطيلها.
4. conditional React Query retry للأخطاء المؤقتة.
5. `fetchAuthenticated` قد تعيد request مرة واحدة بعد `401` إذا نجح session refresh.

تغيير route ID لا يطلب “نفس” البيانات، بل ينشئ query identity مختلفة:

```text
['/api/community/ambassador-assignment', 'assignment-a']
['/api/community/ambassador-assignment', 'assignment-b']
```

## تصميم test environment

كل test تحصل على `QueryClient` جديدة:

```text
retry: false
gcTime: Infinity
```

ولا تستورد singleton الخاصة بالتطبيق.

الـwrapper والـmocks المطلوبة:

- `QueryClientProvider` مع test QueryClient.
- Mock لـ`useLocalSearchParams` للتحكم في `id`.
- Mock لـ`router.canGoBack`, `router.back`, و`router.replace` عند اختبار Go back.
- Mock بسيط لـ`Stack.Screen` إذا احتاج Jest ذلك.
- `SafeAreaProvider` بقيم insets ثابتة، أو mock محدد لـ`useSafeAreaInsets`.
- Jest/Expo handling أو mock للأيقونات.
- لا نحتاج mock لـHaptics إلا إذا ضغط الاختبار `Open chat` أو `Say salam`.

يفضل تمرير controlled default query function إلى test QueryClient بدل mock الشبكة الحقيقية. هذه الدالة تستقبل `queryKey` و`signal` وتعيد Promise يقرر الاختبار متى يحلها أو يرفضها.

## الاختبار 1: Valid assignment success

### Initial condition

- route ID تساوي `assignment-1`.
- cache جديدة وفارغة.
- default test query function معلّقة في البداية.
- response تمثل active ambassador assignment وبها كل الحقول الاختيارية المرئية.

### User-visible action or route input

- عرض route `/ambassador-assignment/assignment-1`.
- لا يلزم الضغط على دالة داخلية؛ mount الشاشة يبدأ query تلقائيًا.

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
- ambassador intro text.
- `What they are facing` والـsummary.
- `Risk level: moderate`.
- `Briefing` ومحتواها.
- `A first approach` ومحتواها.
- `Note from the team` ومحتواها.
- زر `Open chat`.
- لا تظهر رسالة `This support connection could not be found.`.

### Required provider or mock

- Fresh QueryClientProvider.
- route param mock بـ`assignment-1`.
- Safe-area wrapper/mock.
- controlled query function.

### Follow-up coverage

اختبار منفصل مستقبلًا لدور `mentee` يثبت `You are not alone` و`Say salam` وغياب معلومات السفير الحساسة.

## الاختبار 2: Initial loading

### Initial condition

- route ID صحيحة.
- cache فارغة.
- controlled query Promise لا تزال unresolved.

### User-visible action or route input

- عرض الشاشة باستخدام route ID `assignment-loading`.

### Controlled server response

- Promise تبقى pending حتى يتم إثبات loading.
- بعد assertion تُحل response صالحة حتى لا يظل update معلّقًا بعد الاختبار.

### Expected visible result

- ActivityIndicator تظهر كواجهة loading.
- لا تظهر success identity أو not-found interface قبل حل Promise.
- أول selector مقترح هو role `progressbar` إذا كانت RNTL تعرض ActivityIndicator بهذا الدور.

### Required provider or mock

- Fresh QueryClientProvider.
- controlled Promise.
- route param mock.
- Safe-area wrapper/mock.

## الاختبار 3: Request failure

### Initial condition

- route ID تساوي `assignment-network-error`.
- retries معطلة في test QueryClient.

### User-visible action or route input

- عرض الشاشة.

### Controlled server response

- query function ترفض بـ`new Error('Unable to connect.')`.

### Expected visible result

- `This support connection could not be found.`.
- زر `Go back`.
- success interface غير موجودة.
- query function استُدعيت مرة واحدة، لإثبات عدم وجود test retry.

### Required provider or mock

- Fresh QueryClientProvider مع `retry: false`.
- rejecting query function.
- route/router mocks.
- Safe-area wrapper/mock.

## الاختبار 4: Missing assignment

### Initial condition

- route ID تساوي `missing-assignment`.
- request نفسها تنجح في هذا الاختبار، لكن public response تحتوي `assignment: null` لاختبار defensive client contract.

### User-visible action or route input

- عرض الشاشة.

### Controlled server response

```ts
{ assignment: null }
```

الـbackend الحالي يستخدم `404 { error: 'Assignment not found' }` عند عدم وجود row أو عدم امتلاك المستخدم حق الوصول. يمكن إضافة test منفصل للـ404، لكنه سيمر من `isError` بدل success-with-null.

### Expected visible result

- نفس not-found interface:
  - `This support connection could not be found.`
  - `Go back`.
- لا تظهر identity أو chat action.

### Required provider or mock

- Fresh QueryClientProvider.
- resolved query function بقيمة `{ assignment: null }`.
- route/router mocks.
- Safe-area wrapper/mock.

## الاختبار 5: Different route IDs have different query identities

### Initial condition

- QueryClient واحدة جديدة لهذا الاختبار الكامل.
- controlled query function ترجع response مختلفة حسب الجزء الثاني من `queryKey`.
- ID الأولى `assignment-a`، ثم تتغير route إلى `assignment-b`.

### User-visible action or route input

1. عرض الشاشة بـ`assignment-a`.
2. حل request الأولى باسم `Person A` وانتظار ظهوره.
3. تغيير قيمة route mock إلى `assignment-b` وإعادة render لنفس الشاشة/provider.
4. حل request الثانية باسم `Person B`.

### Controlled server response

- `assignment-a` → assignment صالحة باسم `Person A`.
- `assignment-b` → assignment صالحة باسم `Person B`.

### Expected visible result

- تظهر `Person A` بعد request الأولى.
- بعد تغيير ID تظهر loading الخاصة بالـquery الجديدة، ثم `Person B`.
- لا تُستخدم نتيجة A باعتبارها نتيجة B.
- controlled query function تستقبل key تنتهي بـ`assignment-a` ثم key مختلفة تنتهي بـ`assignment-b`.

### Required provider or mock

- QueryClient واحدة معزولة لهذا السيناريو الكامل.
- mutable route-param mock أو rerender helper.
- query function مبنية على `queryKey`.
- Safe-area wrapper/mock.

## ما لا يجب أن تفعله الاختبارات

- لا تستورد application singleton QueryClient.
- لا تنفذ request حقيقية.
- لا تنتظر production timeout.
- لا تقرأ component state.
- لا تستدعي query function أو handlers الخاصة بالشاشة مباشرة.
- لا تعتمد على ترتيب JSX الداخلي.
- لا تعدّل PurePath ضمن PUR-42؛ هذه خطة فقط.

## Unknown حقيقي متبقٍ

المصدر لا يضيف accessible label صريحًا إلى `ActivityIndicator`. المتوقع أن تعرضها React Native Testing Library بدور `progressbar`، لكن selector الفعلي في إعداد PurePath لا يمكن إثباته من القراءة الساكنة وحدها؛ يحتاج smoke render في test environment. إذا لم يظهر role مناسب، يلزم قرار accessibility منفصل قبل كتابة implementation test، بدل استخدام selector داخلي هش.

## المراجع

- TanStack Query testing: <https://tanstack.com/query/latest/docs/framework/react/guides/testing>
- TanStack Query invalidation: <https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation>
- TanStack Query important defaults: <https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults>
