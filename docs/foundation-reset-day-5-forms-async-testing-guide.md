# Foundation Reset Day 5: اختبار الفورم والواجهات غير المتزامنة

الدليل ده بيوثّق تطبيق تذكرة `PUR-41` لشخص بيستخدم Jest وReact Native Testing Library لأول مرة. التطبيق مبني على Expo SDK 57 وReact 19 وReact Native 0.86.

## 1. الهدف

اختبرنا سلوكين من منظور المستخدم:

1. كتابة بيانات داخل `LearningItemForm`، ظهور أخطاء validation، الإرسال، ومسح الحقول.
2. انتقال `NetworkLab` من loading إلى success أو empty أو error بطريقة حتمية.

الاختبارات لا تقرأ قيم `useState`، ولا تستدعي `handleSubmit` أو `loadItems` مباشرة، ولا تنفّذ network request حقيقيًا.

المراجع الرسمية:

- Expo SDK 57: <https://docs.expo.dev/versions/v57.0.0/>
- Expo unit testing: <https://docs.expo.dev/develop/unit-testing/>
- RNTL queries: <https://oss.callstack.com/react-native-testing-library/docs/api/queries>
- RNTL user events: <https://oss.callstack.com/react-native-testing-library/docs/api/events/user-event>

## 2. التوقعات قبل اختبار الفورم

### أي عنصر يجب أن يعلنه قارئ الشاشة؟

كل accessible label يجب أن يكون على `TextInput` نفسه:

| Accessible label | العنصر المقصود |
|---|---|
| `Learning item title` | حقل العنوان |
| `Learning item minutes` | حقل الدقائق |
| `Learning item description` | حقل الوصف |

النص المرئي بجانب الحقل لا يرتبط تلقائيًا بـ`TextInput` في React Native. إضافة `accessibilityLabel` تجعل الغرض من الحقل مفهومًا لقارئ الشاشة، وتتيح للاختبار استخدام `getByLabelText`.

### هل تظهر أخطاء validation قبل الإرسال؟

لا. تظهر بعد محاولة الإرسال غير الصحيحة. ده يمنع عرض أخطاء قبل أن يتفاعل المستخدم مع الفورم.

### ماذا يرسل الفورم بعد trimming؟

عند إدخال:

```text
Title:         "  React Query Practice  "
Minutes:       "45"
Description:   "  Understand query caching  "
```

يجب أن يستقبل `onSubmit`:

```ts
{
  title: 'React Query Practice',
  minutes: 45,
  description: 'Understand query caching',
}
```

العنوان والوصف أصبحا بدون مسافات خارجية، والدقائق أصبحت number. لو الوصف فارغ بعد trimming فلا تُرسل خاصية `description` أصلًا.

## 3. Queries المستخدمة مع الفورم

للوصول إلى input كما يصل إليه مستخدم assistive technology:

```tsx
screen.getByLabelText('Learning item title');
```

للوصول إلى زر حسب نوعه واسمه:

```tsx
screen.getByRole('button', { name: 'Add item' });
```

لم نستخدم `testID` لأن labels وroles تمثل طريقة المستخدم في معرفة الحقول والأزرار.

## 4. `userEvent.type` و`clear` و`press`

```tsx
const user = userEvent.setup();

await user.type(titleInput, 'Draft title');
await user.clear(titleInput);
await user.type(titleInput, '  React Query Practice  ');
await user.press(submitButton);
```

- `type`: يكتب من خلال واجهة الـinput بدل تغيير state مباشرة.
- `clear`: يمسح القيمة المرئية من خلال سلوك المستخدم.
- `press`: ينفّذ تفاعل الضغط على control معروض.
- العمليات asynchronous، لذلك نستخدم `await`.

## 5. سلوكيات الفورم المغطاة

### الإرسال غير الصحيح

- ضغط Add item والفورم فارغ يُظهر:
  - `Title is required.`
  - `Minutes must be a whole number.`
- `onSubmit` لا يُستدعى.
- كتابة حروف داخل minutes ثم الإرسال تُظهر خطأ العدد الصحيح.

```tsx
expect(onSubmit).not.toHaveBeenCalled();
```

### الإرسال الصحيح

- `onSubmit` يُستدعى مرة واحدة.
- القيم النصية تُرسل بعد trimming.
- minutes تُرسل كرقم.
- object يطابق public callback contract.
- الحقول تُمسح بعد نجاح الإرسال.

```tsx
expect(onSubmit).toHaveBeenCalledTimes(1);
expect(onSubmit).toHaveBeenCalledWith({
  title: 'React Query Practice',
  minutes: 45,
  description: 'Understand query caching',
});
expect(titleInput).toHaveDisplayValue('');
```

### الوصف الاختياري

لو الوصف فارغ، object المرسل لا يحتوي على `description`:

```tsx
expect(onSubmit).toHaveBeenCalledWith({
  title: 'React Query Practice',
  minutes: 45,
});
```

### Reset

الضغط على Reset يمسح القيم المرئية ولا يرسل شيئًا. الاختبار يفحص قيم inputs الظاهرة، وليس قيم `useState`.

## 6. لماذا نحتاج test seam في شاشة الشبكة؟

الشاشة الحقيقية تستخدم fake loader ينتظر 800ms. انتظار الوقت الحقيقي يجعل الاختبار أبطأ وأكثر قابلية للتذبذب.

تم فصل المسؤوليات بالشكل التالي:

```text
NetworkScreen
└── يمرر fakeLoadItems الحقيقي
    └── NetworkLab
        ├── يمتلك الحالة
        ├── يعرض الواجهة
        └── يستدعي loader prop مكتوب النوع
```

عقد الـloader:

```ts
type NetworkLoader = (
  mode: LoaderMode,
) => Promise<NetworkLearningItem[]>;
```

`NetworkScreen` ما زال route-level wrapper، ولذلك سلوك التطبيق الظاهر لم يتغير. الاختبار يعرض `NetworkLab` ويمرر loader مناسبًا لكل سيناريو.

## 7. الـcontrolled Promise

الـPromise العادية التي تُحل فورًا قد تجعل loading تختفي قبل أن نفحصها. الـcontrolled Promise تظل pending لحد ما الاختبار يحلّها بنفسه:

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

التدفق:

```text
Render NetworkLab
→ Press Success
→ loader يعيد Promise معلّقة
→ الواجهة تعرض Loading learning items...
→ الاختبار يحل Promise بقائمة معروفة
→ الواجهة تعرض العناصر
→ loading تختفي
```

حل الـPromise داخل `act` يسمح لـReact بمعالجة تحديث الواجهة:

```tsx
await act(async () => {
  controlled.resolve(items);
});
```

بعدها نستخدم `findByText` لأن النتيجة تظهر asynchronously:

```tsx
expect(await screen.findByText('Components and typed props')).toBeOnTheScreen();
```

ونستخدم `queryByText` لإثبات اختفاء loading:

```tsx
expect(
  screen.queryByText('Loading learning items...'),
).not.toBeOnTheScreen();
```

## 8. حالات الشبكة المغطاة

1. Success: تظهر loading، ثم العناصر، ثم تختفي loading.
2. Empty: loader يعيد `[]` فتظهر `No learning items were returned.`.
3. Error: loader يرفض بـ`Error` فتظهر رسالته للمستخدم.
4. Pending: أثناء بقاء Promise معلّقة تكون أزرار Success وEmpty وError كلها disabled.

في اختبار pending تم حل الـPromise قبل نهاية الاختبار حتى لا نترك update معلّقًا قد يؤثر على اختبار آخر.

## 9. لماذا لا نفحص الحالة الداخلية؟

المستخدم لا يرى object اسمه `AsyncState` ولا يعرف اسم متغير `requestState`. هو يرى loading ورسالة error وعناصر وأزرار disabled.

لذلك الاختبار يعمل من خلال العقد العام:

```text
Accessible user action
→ visible result أو public callback
```

تمت إعادة تسمية المتغير المحلي من `state` إلى `requestState` كـharmless refactor. الاختبارات الأربعة استمرت في النجاح لأنها لا تعتمد على الاسم الداخلي.

## 10. Failures ساعدتنا أثناء التنفيذ

### `render function has not been called`

ظهر أولًا:

```text
`render` function has not been called
```

في إعداد React 19 الحالي كان يجب انتظار عملية العرض:

```tsx
await render(<NetworkLab loader={loader} />);
```

بعد ذلك أصبح `screen` قادرًا على الوصول للواجهة.

### تجاوز timeout في اختبار loading

ظهر:

```text
Exceeded timeout of 5000 ms for a test.
```

السبب لم يكن أن الاختبار يحتاج timeout أكبر. الـevent handler كان يعيد Promise الخاصة بالتحميل:

```tsx
onPress={() => loadItems('success')}
```

فكان `user.press` ينتظر Promise المعلّقة ولا يصل لفحص loading. تم بدء العملية من غير إعادة Promise من handler:

```tsx
onPress={() => void loadItems('success')}
```

بعد الإصلاح أمكن فحص loading أثناء بقاء الطلب unresolved. لم يتم إخفاء المشكلة بزيادة timeout.

## 11. أوامر التشغيل على PowerShell وCMD

استخدام امتداد `.cmd` يعمل في PowerShell وCMD ويتجنب PowerShell Execution Policy.

### اختبار الفورم فقط

```powershell
npm.cmd test -- LearningItemForm.test.tsx --runInBand
```

النتيجة أثناء التنفيذ:

```text
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
```

### اختبار الشبكة فقط

```powershell
npm.cmd test -- NetworkScreen.test.tsx --runInBand
```

تم تشغيل الأمر بعد إضافة كل سيناريو، والنتيجة النهائية:

```text
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
```

### المجموعة الكاملة

```powershell
npm.cmd test -- --runInBand
```

معنى أول `--`: مرّر ما بعده من npm script إلى Jest. ومعنى `--runInBand`: شغّل suites بالتتابع داخل process واحدة.

النتيجة الفعلية النهائية:

```text
Test Suites: 3 passed, 3 total
Tests:       16 passed, 16 total
Snapshots:   0 total
```

### Lint

```powershell
npm.cmd run lint
```

يشغّل `expo lint`. النتيجة: PASS بدون lint errors.

### TypeScript

```powershell
npx.cmd tsc --noEmit
```

يفحص الأنواع من غير إنشاء JavaScript output. النتيجة: PASS.

### التأكد من عدم وجود tests داخل routes

PowerShell أو CMD:

```powershell
rg --files src/app | rg '(__tests__|\.(test|spec)\.)'
```

عدم وجود output يعني عدم وجود test files داخل `src/app`.

### البحث عن `any`

```powershell
rg -n '\bany\b' src/features/home/components/__tests__/LearningItemForm.test.tsx src/features/network/screens/__tests__/NetworkScreen.test.tsx
```

عدم وجود output يعني عدم استخدام `any` في الاختبارات الجديدة.

### البحث عن snapshots و`testID`

```powershell
rg -n 'toMatchSnapshot|toMatchInlineSnapshot|testID' src/features/home/components/__tests__/LearningItemForm.test.tsx src/features/network/screens/__tests__/NetworkScreen.test.tsx
```

عدم وجود output يؤكد أن الاختبارات الجديدة لا تستخدم snapshots أو `testID`.

### فحص whitespace في التغييرات

```powershell
git diff --check
```

عدم وجود output يعني عدم اكتشاف whitespace errors في الملفات المتتبعة.

## 12. الملفات الناتجة

```text
src/features/home/components/LearningItemForm.tsx
src/features/home/components/__tests__/LearningItemForm.test.tsx
src/features/network/screens/NetworkScreen.tsx
src/features/network/screens/__tests__/NetworkScreen.test.tsx
docs/foundation-reset-day-5-forms-async-testing-guide.md
```

## 13. Checklist

- [x] إضافة labels واضحة للـinputs الثلاثة.
- [x] العثور على inputs باستخدام `getByLabelText`.
- [x] تغطية invalid submission والحروف داخل minutes.
- [x] تغطية trimming وتحويل minutes إلى number.
- [x] تغطية مسح الحقول بعد النجاح.
- [x] حذف `description` من object لو كانت فارغة.
- [x] تغطية Reset من خلال الواجهة.
- [x] تصدير loader type واستخراج `NetworkLab`.
- [x] عدم تغيير سلوك `NetworkScreen` الظاهر.
- [x] تغطية success وempty وerror وpending.
- [x] عدم انتظار timer حقيقي أو استخدام network request.
- [x] عدم فحص state الداخلية.
- [x] تنفيذ harmless refactor ونجاح الاختبارات بعده.
- [x] نجاح 16 test وlint وTypeScript.
- [x] عدم وجود snapshots أو `testID` أو `any` في الاختبارات الجديدة.
- [x] عدم وجود test files داخل `src/app`.

## 14. Ticket comment المقترح

1. Accessible label: `Learning item title`.
2. Submitting an empty form shows validation messages and does not call `onSubmit`.
3. The test uses a controlled Promise that it resolves explicitly, so loading is deterministic.
4. The tests use accessible inputs and buttons and assert visible output or public callbacks instead of reading component state.
5. Remaining question: When should fake timers be preferred over a controlled Promise for asynchronous UI tests?

## 15. الـcommit

الأمر المقترح بعد مراجعة الملفات:

```powershell
git add src/features/home/components/LearningItemForm.tsx src/features/home/components/__tests__/LearningItemForm.test.tsx src/features/network/screens/NetworkScreen.tsx src/features/network/screens/__tests__/NetworkScreen.test.tsx docs/foundation-reset-day-5-forms-async-testing-guide.md
git commit -m "test: cover form and asynchronous states"
```
