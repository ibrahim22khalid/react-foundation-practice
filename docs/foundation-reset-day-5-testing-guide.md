# Foundation Reset Day 5: اختبار سلوك React Native الظاهر

الدليل ده بيوثّق تطبيق تذكرة PUR-40 من البداية للنهاية لشخص بيستخدم Jest وReact Native Testing Library لأول مرة.

## 1. الهدف

نختبر `LearningCard` من منظور المستخدم:

- إيه النصوص اللي يقدر يشوفها؟
- إيه الأزرار اللي يقدر يلاقيها ويضغط عليها؟
- هل الضغط يوصل للـcallback الصحيحة؟
- هل الزر المعطّل يمنع التفاعل؟

الاختبارات لا تقرأ state داخلية، ولا تستدعي callback props مباشرة، ولا تعتمد على ترتيب شجرة JSX.

## 2. إصدارات المشروع

- Expo SDK 57
- React 19.2.3
- React Native 0.86.3
- Jest 29.7
- `jest-expo` 57
- React Native Testing Library 14

مرجع توافق Expo SDK 57:

<https://docs.expo.dev/versions/v57.0.0/>

## 3. دور كل أداة

### Jest

Jest هو test runner. مسؤول عن:

- اكتشاف ملفات الاختبارات.
- تشغيل `describe` و`test`.
- توفير `expect` والـmatchers.
- إنشاء mock functions باستخدام `jest.fn()`.
- عرض `PASS` أو `FAIL` ورسائل الخطأ.

### `jest-expo`

Preset يجهّز Jest لمشروع Expo وReact Native، ويتعامل مع التحويلات والأجزاء الأصلية التي لا تعمل مباشرة داخل Node.js.

### React Native Testing Library

توفر:

- `render` لعرض component داخل بيئة الاختبار.
- `screen` للوصول إلى queries.
- Queries مثل `getByText` و`getByRole`.
- `userEvent` لمحاكاة تفاعل المستخدم.
- Matchers مثل `toBeOnTheScreen` و`toBeDisabled`.

### `@types/jest`

تعريفات TypeScript لأسماء مثل `describe` و`test` و`expect` و`jest`.

## 4. Smoke وUnit وComponent وBehavior tests

### Unit test

تختبر وحدة صغيرة ومعزولة نسبيًا من البرنامج.

### Component test

Unit test تكون الوحدة المختبرة فيها React component.

### Smoke test

اختبار أولي صغير يثبت إن إعداد الاختبارات يعمل وإن component يمكن عرضها والعثور على عنصر أساسي فيها.

### Behavior test

تثبت شيئًا يراه المستخدم أو يفعله، بدل فحص طريقة التنفيذ الداخلية.

```text
Smoke test: هل الكارت تُعرض ويظهر عنوانها؟
Behavior test: هل الضغط على Add يستدعي callback الصحيحة؟
```

## 5. التثبيت على Windows

الأوامر المطلوبة من توثيق Expo:

```powershell
npx.cmd expo install jest-expo jest @types/jest "--" --dev
npx.cmd expo install @testing-library/react-native "--" --dev
```

في CMD يمكن أيضًا استخدام `npx`، لكن `npx.cmd` يعمل في PowerShell وCMD ويتجنب مشكلة PowerShell Execution Policy.

الأمر العادي التالي فشل في PowerShell على الجهاز:

```powershell
npm test
```

والرسالة كانت:

```text
npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

الحل بدون تغيير إعداد أمان الجهاز:

```powershell
npm.cmd test
```

ملاحظة: Expo installer اختار الإصدارات المتوافقة، لكن npm تعامل مع `--dev` كخيار قديم ولم ينقل الحزم تلقائيًا إلى `devDependencies`. تم الاحتفاظ بنفس الإصدارات التي اختارها Expo وتسجيل أدوات الاختبار تحت `devDependencies`.

ظهرت أيضًا تحذيرات peer dependency تخص `test-renderer` التابع لـRNTL وReact 19.2.3، وتقرير `14 moderate vulnerabilities`. لم يتم إخفاؤها، ولم يتم تشغيل `npm audit fix` لأن ده خارج نطاق التذكرة وقد يسبب ترقيات غير مطلوبة.

لم يتم تثبيت `react-test-renderer` المحظورة في التذكرة.

عند محاولة إعادة حساب metadata للـlockfile باستخدام وضع offline:

```powershell
npm.cmd install --package-lock-only --ignore-scripts --offline --no-audit --no-fund
```

فشل الأمر برسالة `ENOTCACHED` لأن npm احتاج package metadata غير موجودة محليًا. أُعيد تشغيله مع network access ومن غير `--offline`:

```powershell
npm.cmd install --package-lock-only --ignore-scripts --no-audit --no-fund
```

نجح الأمر وحدث علامات `dev` داخل lockfile من غير تثبيت packages أو تشغيل scripts. ظل تحذير peer dependency ظاهرًا ولم يتم suppress له.

## 6. الإعداد

الإعداد الأساسي في `package.json`:

```json
{
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo",
    "modulePathIgnorePatterns": ["<rootDir>/.kilo/"]
  }
}
```

استثناء `.kilo` اتضاف لأن أول تشغيل وجد نسخة worktree إضافية من المشروع وأظهر:

```text
Haste module naming collision: react-foundation-practice
package.json
.kilo/worktrees/dawn-alley/package.json
```

الاستثناء يحدد نطاق المشروع الحقيقي ولا يخفي failure من اختبارات التطبيق.

إعداد TypeScript في `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["jest"]
  }
}
```

ملف الاختبار خارج `src/app` لأن ملفات `src/app` هي Expo Router routes:

```text
src/features/home/components/__tests__/LearningCard.test.tsx
```

## 7. تشغيل الاختبارات

### التشغيل العادي

PowerShell أو CMD:

```powershell
npm.cmd test
```

الأمر يشغّل script `test`، والـscript يشغّل Jest.

### التشغيل بالتتابع

PowerShell أو CMD:

```powershell
npm.cmd test -- --runInBand
```

- أول `--` يمرر ما بعده إلى Jest.
- `--runInBand` يشغّل الاختبارات بالتتابع داخل process واحدة.

النتيجة النهائية المتوقعة:

```text
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
```

## 8. تركيب test file

### `describe`

تجمع اختبارات مرتبطة تحت عنوان واحد:

```tsx
describe('LearningCard', () => {
  // related tests
});
```

هي للتنظيم، وليست assertion.

### `test`

تعرف سيناريو واحدًا باسم واضح:

```tsx
test('shows the visible details of an incomplete learning card', async () => {
  // arrange, act, assert
});
```

Jest تعتبرها ناجحة عندما تنتهي من غير error أو Promise مرفوضة أو matcher فاشلة.

### لماذا الاختبارات منفصلة؟

كل test تختبر سيناريو واضحًا. لو اختبار Remove فشل، تظهر المشكلة باسمه من غير منع Jest من تشغيل سيناريوهات Add وComplete.

ممكن وجود عدة assertions في test واحدة لو كلها تثبت نفس السيناريو، زي completed card.

## 9. Arrange, Act, Assert

```text
Arrange: تجهيز user وmocks وعرض component
Act:     العثور على control والضغط عليه
Assert:  التحقق من النتيجة الخارجية
```

مثال مفاهيمي:

```tsx
const user = userEvent.setup();
const onComplete = jest.fn();

await render(/* LearningCard */);

const button = screen.getByRole('button', {
  name: 'Mark as complete',
});

await user.press(button);

expect(onComplete).toHaveBeenCalledTimes(1);
```

## 10. Queries

اسم query يتكون من variant وpredicate:

```text
getByRole
│     └── Role: معيار البحث
└── get: العدد والتوقيت المتوقعان
```

### `getByText`

تستخدم عندما نتوقع عنصرًا واحدًا موجودًا فورًا.

| التطابقات | النتيجة |
|---:|---|
| 0 | Error |
| 1 | ترجع العنصر |
| أكثر من 1 | Error |

```tsx
expect(screen.getByText('30 minutes')).toBeOnTheScreen();
```

### `queryByText`

تستخدم لإثبات الغياب.

| التطابقات | النتيجة |
|---:|---|
| 0 | `null` |
| 1 | ترجع العنصر |
| أكثر من 1 | Error |

```tsx
expect(
  screen.queryByText('Practice visible behavior'),
).not.toBeOnTheScreen();
```

### `findByText`

تستخدم عندما سيظهر العنصر بعد عملية asynchronous. ترجع Promise وتحتاج `await`، وتفشل بعد timeout لو العنصر لم يظهر.

```tsx
const result = await screen.findByText('Lessons loaded');
```

`LearningCard` الحالية تعرض props فورًا، لذلك لا تحتاج `findByText`.

### `getByRole`

تحدد نوع الـcontrol واسمه المتاح:

```tsx
screen.getByRole('button', {
  name: 'Add 5 minutes',
});
```

البحث بالـrole والاسم أفضل للأزرار لأنه يجد الـcontrol القابل للضغط، ويطابق طريقة المستخدم وتقنيات accessibility في فهم العنصر.

## 11. تجربة failure المقصودة

تم عرض العنوان:

```tsx
title="React Native Testing"
```

ثم جرى البحث مؤقتًا عن عنوان خاطئ:

```tsx
screen.getByText('React Native');
```

ظهرت الرسالة:

```text
Unable to find an element with text: React Native
```

رسالة الفشل قدمت الأدلة التالية:

- النص المتوقع الخاطئ.
- النص الفعلي `React Native Testing`.
- الشجرة المعروضة وباقي النصوص والأزرار.
- السطر `LearningCard.test.tsx:18`.
- اسم query التي فشلت.
- ملخص suite وtest الفاشلتين.

`getByText` رمت error قبل تنفيذ `toBeOnTheScreen`، لأن JavaScript تقيّم argument الداخلي قبل استدعاء matcher الخارجية.

بعد قراءة الرسالة، تم استعادة النص الصحيح.

## 12. `userEvent`

إنشاء المستخدم:

```tsx
const user = userEvent.setup();
```

محاكاة الضغط:

```tsx
await user.press(button);
```

`press` تعيد Promise وتحاكي sequence أقرب لـReact Native، مثل `pressIn` و`pressOut` و`press`. لذلك نستخدم `await`.

مقدمة الكتابة في `TextInput`:

```tsx
await user.type(input, 'React Native');
```

`type` تكتب حرفًا حرفًا وتضيف النص للقيمة الموجودة. لم نستخدمها لأن `LearningCard` لا تحتوي `TextInput`.

## 13. Mock functions والـmatchers

إنشاء mock:

```tsx
const onAddMinutes = jest.fn();
```

التأكد من استدعاء واحد بالضبط:

```tsx
expect(onAddMinutes).toHaveBeenCalledTimes(1);
```

التأكد من صفر استدعاءات:

```tsx
expect(onComplete).not.toHaveBeenCalled();
```

| Matcher | المعنى |
|---|---|
| `toHaveBeenCalled()` | مرة أو أكثر |
| `toHaveBeenCalledTimes(1)` | مرة واحدة بالضبط |
| `not.toHaveBeenCalled()` | صفر مرات |

لا نستدعي callback مباشرة؛ الضغط لازم يحصل من خلال الـcontrol المعروض.

## 14. عقد `LearningCard` والـstate

العقد له اتجاهان:

```text
Props → visible interface
User interaction → callback to parent
```

`LearningCard` لا تحتوي `useState`. الـparent يملك حالة `completed`.

```text
Press Mark as complete
→ LearningCard calls onComplete
→ parent changes its data
→ parent passes completed=true
→ LearningCard shows Lesson completed
```

Unit tests الحالية تعزل مسؤولية الكارت:

- incomplete card والضغط يثبتان إرسال `onComplete`.
- completed card تثبت عرض الحالة المعطاة ومنع الضغط.

اختبار الرحلة الكاملة مع parent state سيكون integration test أوسع.

## 15. السلوكيات المغطاة

الاختبارات تثبت:

1. ظهور العنوان والدقائق والوصف وحالة عدم الاكتمال.
2. غياب الوصف عند عدم تمريره.
3. ضغط Add يستدعي `onAddMinutes` مرة.
4. ضغط Complete يستدعي `onComplete` مرة.
5. ضغط Remove يستدعي `onRemove` مرة.
6. completed card تعرض حالتها، وزرها disabled، ولا تستدعي `onComplete` عند محاولة الضغط.

## 16. تجربة تغيير الترتيب

تم نقل الدقائق مؤقتًا قبل العنوان داخل JSX، ثم تشغيل الاختبارات. نجحت الاختبارات الستة.

بعد ذلك تم استعادة الترتيب المفضل وتشغيلها مرة أخرى، ونجحت.

الدليل:

```text
الاختبارات تبحث عن النصوص والأدوار والسلوك
ولا تبحث عن child index أو ترتيب wrapper
```

التجربة لا تثبت إن كل تغيير ترتيب بصري harmless؛ ترتيب القراءة والتصميم قد يكون requirement مستقلًا.

## 17. لماذا لم نستخدم `testID`؟

النصوص والأدوار والأسماء المتاحة تمثل طريقة المستخدم في إيجاد العناصر. `testID` غير مرئية للمستخدم وتُستخدم كحل أخير فقط عندما لا توجد query متاحة مناسبة.

## 18. لماذا لم نستخدم snapshots؟

Snapshot ليست screenshot؛ هي نسخة نصية من rendered tree تُحفظ في `__snapshots__` وتُقارن في التشغيل التالي.

قد تفشل بعد إضافة wrapper غير مؤثرة، ورسالة الاختلاف قد تكون كبيرة. كما أن تحديث snapshot بدون مراجعة قد يعتمد bug باعتباره السلوك الجديد.

التذكرة تمنع snapshots، والنتيجة تؤكد:

```text
Snapshots: 0 total
```

## 19. أوامر التحقق النهائي

### الاختبارات

PowerShell أو CMD:

```powershell
npm.cmd test -- --runInBand
```

تثبت السلوك وقت التشغيل.

### Lint

PowerShell أو CMD:

```powershell
npm.cmd run lint
```

يكشف مخالفات قواعد ESLint وجودة وصياغة الكود.

### TypeScript

PowerShell أو CMD:

```powershell
npx.cmd tsc --noEmit
```

يفحص الأنواع لكل المشروع بدون إنشاء JavaScript output.

الاختبارات وlint وTypeScript checks تكمل بعضها؛ نجاح واحد لا يضمن نجاح الباقي.

النتيجة الفعلية النهائية:

```text
Jest:       PASS — 6 tests, 1 suite, 0 snapshots
ESLint:     PASS — exit code 0, no output warnings
TypeScript: PASS — exit code 0, no emitted files
```

### البحث عن test files داخل routes

PowerShell:

```powershell
$routeTests = rg --files src/app | rg '(__tests__|\.(test|spec)\.)'
```

عدم وجود output يعني عدم وجود tests داخل `src/app`.

### البحث عن `any` في الاختبار

PowerShell أو CMD:

```powershell
rg -n '\bany\b' src/features/home/components/__tests__/LearningCard.test.tsx
```

عدم وجود output يعني إن ملف الاختبار لا يستخدم `any`.

## 20. Checklist

- [x] Jest و`jest-expo` وRNTL مثبتة.
- [x] Jest preset مفعلة.
- [x] test script موجودة.
- [x] test file خارج `src/app`.
- [x] smoke test نجحت.
- [x] failure message اتقرأت واتحللت.
- [x] visible details متغطية.
- [x] callbacks متغطية من خلال user interactions.
- [x] completed/disabled behavior متغطية.
- [x] description provided/omitted متغطية.
- [x] تجربة تغيير الترتيب تمت وتمت استعادة layout.
- [x] لا توجد snapshots أو `testID` أو `any` في الاختبار.
- [x] تشغيل tests وlint وTypeScript النهائي وتسجيل النتائج.
- [x] إنشاء commit مركز باسم `test: add LearningCard behavior tests`.

## 21. المراجع الرسمية

- Expo SDK 57: <https://docs.expo.dev/versions/v57.0.0/>
- Expo unit testing: <https://docs.expo.dev/develop/unit-testing/>
- RNTL queries: <https://oss.callstack.com/react-native-testing-library/docs/api/queries>
- RNTL user events: <https://oss.callstack.com/react-native-testing-library/docs/api/events/user-event>
- Jest getting started: <https://jestjs.io/docs/getting-started>
