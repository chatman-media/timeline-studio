# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Lint CSS](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-css.yml?style=flat-square&label=lint%20css)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-js.yml?style=flat-square&label=lint%20ts)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-rs.yml?style=flat-square&label=lint%20rust)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=flat-square&label=frontend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=flat-square&label=backend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

<div dir="rtl">

## نظرة عامة على المشروع

Timeline Studio هو محرر فيديو حديث مبني على معمارية Tauri (Rust + React).

**هدفنا**: إنشاء محرر يجمع بين:
- **القوة الاحترافية لـ DaVinci Resolve** - التحكم الكامل في التحرير وتدرج الألوان ومزج الصوت والتأثيرات المرئية والرسومات المتحركة والتركيب المتقدم
- **مكتبة إبداعية واسعة** - تأثيرات وفلاتر وانتقالات وقوالب كاميرات متعددة وعناوين متحركة وقوالب أنماط وإعدادات مسبقة للترجمات تضاهي المحررات الشائعة مثل Filmora
- **البرمجة النصية والأتمتة بالذكاء الاصطناعي** - إنشاء محتوى تلقائي بلغات مختلفة ولمنصات مختلفة

**الابتكار الرئيسي**: يكفي للمستخدمين تحميل مقاطع الفيديو والموسيقى والموارد الأخرى، وسيقوم الذكاء الاصطناعي تلقائيًا بإنشاء مجموعة من مقاطع الفيديو بلغات مختلفة ومحسنة لمنصات مختلفة (YouTube و TikTok و Vimeo و Telegram).

![واجهة الخط الزمني #1](/public/screen2.png)

![واجهة الخط الزمني #2](/public/screen4.png)

### حالة المشروع (يونيو 2025)

**الإنجاز الإجمالي: 86.2%** ⬆️ (محدث بعد دمج OAuth وإكمال التصدير)
- ✅ اكتملت وظائف التحرير الأساسية
- ✅ مترجم الفيديو مع تسريع GPU
- ✅ وحدة التعرف (YOLO v11) - تم إصلاح ORT
- ✅ التأثيرات والفلاتر والانتقالات (75-80%)
- ✅ التصدير - تكامل كامل لوسائل التواصل الاجتماعي! (98%) 🎉
- ✅ دمج OAuth - دعم YouTube/TikTok/Vimeo/Telegram
- ✅ نظام معاينة موحد مع Preview Manager
- ✅ استمرارية الوسائط والمشاريع المؤقتة
- ✅ نظام القوالب - قائم على التكوين (95% مكتمل)
- ✅ الخط الزمني مكتمل بنسبة 90%
- ⚠️ لوحة الموارد قيد التطوير (85%)
- 🎯 الإصدار المستهدف MVP: نهاية يونيو 2025

## الميزات الرئيسية

- 🎬 تحرير فيديو احترافي مع خط زمني متعدد المسارات
- 🖥️ متعدد المنصات (Windows، macOS، Linux)
- 🚀 معالجة الفيديو المسرّعة بـ GPU (NVENC، QuickSync، VideoToolbox)
- 🤖 التعرف على الأشياء/الوجوه بالذكاء الاصطناعي (YOLO v11 - تم إصلاح ORT)
- 🎨 أكثر من 30 انتقالًا وتأثيرًا بصريًا وفلترًا
- 📝 نظام ترجمة متقدم مع 12 نمطًا ورسومًا متحركة
- 🎵 تحرير صوتي متعدد المسارات مع التأثيرات
- 📤 تصدير إلى MP4/MOV/WebM مع تكامل OAuth لوسائل التواصل الاجتماعي
- 🔐 دعم OAuth لـ YouTube/TikTok/Vimeo/Telegram مع تخزين آمن للرموز
- 📱 إعدادات مسبقة للأجهزة (iPhone، iPad، Android) للصادرات المحسنة
- 🧠 إدارة الحالة باستخدام XState v5
- 🌐 دعم التدويل (11 لغة)
- 💾 ذاكرة تخزين مؤقت ذكية ونظام معاينة موحد
- 🎨 واجهة مستخدم حديثة باستخدام Tailwind CSS v4، shadcn-ui
- 📚 توثيق كامل مع 2400+ اختبار (معدل نجاح 98.8%)

## البدء

### المتطلبات الأساسية

- [Node.js](https://nodejs.org/) (الإصدار 18 أو أعلى)
- [Rust](https://www.rust-lang.org/tools/install) (أحدث إصدار مستقر)
- [bun](https://bun.sh/) (أحدث إصدار مستقر)
- [ffmpeg](https://ffmpeg.org/download.html) (أحدث إصدار مستقر)

### التثبيت

1. استنساخ المستودع:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. تثبيت التبعيات:

```bash
bun install
```

### تشغيل وضع التطوير

```bash
bun run tauri dev
```

### بناء الإصدار

```bash
bun run tauri build
```

## التوثيق

### 📚 التوثيق الرئيسي

- 📚 [نظرة عامة على التوثيق](docs-ru/README.md) - خريطة التوثيق الكاملة
- 🚀 [البدء](docs-ru/01-getting-started/README.md) - التثبيت والخطوات الأولى
- 🏗️ [دليل البنية](docs-ru/02-architecture/README.md) - بنية النظام
- 🎯 [دليل الميزات](docs-ru/03-features/README.md) - نظرة عامة على الميزات وحالتها
- 📡 [مرجع API](docs-ru/04-api-reference/README.md) - مرجع أوامر Tauri
- 🧪 [دليل التطوير](docs-ru/05-development/README.md) - الاختبار والتطوير
- 🚀 [دليل النشر](docs-ru/06-deployment/README.md) - البناء والنشر
- 📋 [أدلة المستخدم](docs-ru/07-guides/README.md) - الأداء وأفضل الممارسات
- 🛣️ [خارطة الطريق](docs-ru/08-roadmap/README.md) - خارطة طريق التطوير
- 🔐 [إعداد OAuth](docs-ru/09-oauth-setup/oauth-setup-guide.md) - تكامل وسائل التواصل الاجتماعي

### 📋 وثائق المشروع

- **`src/features/README.md`** - نظرة عامة على جميع الميزات مع الأولويات والحالة
- **الإصدارات اللغوية**: متوفرة بـ 11 لغة عبر المحول أعلاه

## التطوير

### النصوص المتاحة

- `bun run dev` - تشغيل Next.js في وضع التطوير
- `bun run tauri dev` - تشغيل Tauri في وضع التطوير
- `bun run build` - بناء Next.js
- `bun run tauri build` - بناء تطبيق Tauri

#### التحقق من الكود والتنسيق

- `bun run lint` - فحص كود JavaScript/TypeScript باستخدام ESLint
- `bun run lint:fix` - إصلاح أخطاء ESLint
- `bun run lint:css` - فحص كود CSS باستخدام Stylelint
- `bun run lint:css:fix` - إصلاح أخطاء Stylelint
- `bun run format:imports` - تنسيق الاستيرادات
- `bun run lint:rust` - فحص كود Rust باستخدام Clippy
- `bun run format:rust` - تنسيق كود Rust باستخدام rustfmt
- `bun run check:all` - تشغيل جميع الفحوصات والاختبارات
- `bun run fix:all` - إصلاح جميع أخطاء التحقق

#### الاختبارات

- `bun run test` - تشغيل الاختبارات
- `bun run test:app` - تشغيل اختبارات مكونات التطبيق فقط
- `bun run test:watch` - تشغيل الاختبارات في وضع المراقبة
- `bun run test:coverage` - تشغيل الاختبارات مع تقرير التغطية
- `bun run test:coverage:report` - إنشاء وإرسال تقرير تغطية الاختبارات
- `bun run test:rust` - تشغيل اختبارات الواجهة الخلفية Rust
- `bun run test:rust:watch` - تشغيل اختبارات Rust في وضع المراقبة
- `bun run test:coverage:rust` - تشغيل اختبارات Rust مع التغطية
- `bun run test:coverage:rust:report` - إنشاء وإرسال تقرير تغطية Rust
- `bun run test:ui` - تشغيل الاختبارات مع واجهة المستخدم
- `bun run test:e2e` - تشغيل اختبارات End-to-End باستخدام Playwright
- `bun run test:e2e:ui` - تشغيل اختبارات E2E مع واجهة Playwright
- `bun run test:e2e:basic` - تشغيل اختبار E2E الأساسي لاستيراد الوسائط
- `bun run test:e2e:real` - تشغيل اختبارات E2E مع ملفات وسائط حقيقية
- `bun run test:e2e:integration` - تشغيل اختبارات E2E التكاملية (يتطلب INTEGRATION_TEST=true)
- `bun run playwright:install` - تثبيت متصفحات Playwright

### الاختبارات

يستخدم المشروع Vitest لاختبارات الوحدة. توجد الاختبارات في دليل __tests__ لكل ميزة، مع الـ mocks في __mocks__.

#### 🧪 حالة تغطية الاختبارات:
```bash
⨯ bun run test

 Test Files  258 passed | 1 skipped (259)
      Tests  3604 passed | 60 skipped (3664)
   Start at  20:08:23
   Duration  26.48s (transform 5.42s, setup 53.03s, collect 25.72s, tests 32.83s, environment 67.99s, prepare 16.45s)

⨯ bun run test:rust
   test result: ok. 366 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 12.38s

```

```bash
# تشغيل اختبارات العميل
bun run test

# تشغيل اختبارات rust
bun run test:rust

# تشغيل الاختبارات مع تقرير التغطية
bun run test:coverage

# تشغيل اختبار لوظيفة محددة
bun run test src/features/effects
```

## التكامل المستمر والنشر

تم تكوين المشروع لاستخدام GitHub Actions للتكامل المستمر والنشر. تدفقات العمل:

### التحقق والبناء

- `check-all.yml` - تشغيل جميع الفحوصات والاختبارات
- `lint-css.yml` - فحص كود CSS فقط (يعمل عند تغيير ملفات CSS)
- `lint-rs.yml` - فحص كود Rust فقط (يعمل عند تغيير ملفات Rust)
- `lint-js.yml` - فحص كود JavaScript/TypeScript فقط (يعمل عند تغيير ملفات JavaScript/TypeScript)

### النشر

- `build.yml` - بناء المشروع
- `build-release.yml` - بناء المشروع للإصدار
- `deploy-promo.yml` - بناء ونشر الصفحة الترويجية على GitHub Pages
- `docs.yml` - إنشاء ونشر وثائق API على GitHub Pages

### تكوين أداة التحقق

#### Stylelint (CSS)

يستخدم المشروع Stylelint لفحص كود CSS. يوجد التكوين في ملف `.stylelintrc.json`. الميزات الرئيسية:

- دعم توجيهات Tailwind CSS
- تجاهل المحددات المكررة للتوافق مع Tailwind
- الإصلاح التلقائي للأخطاء عند حفظ الملفات (في VS Code)

لتشغيل فاحص CSS، استخدم الأمر:

```bash
bun lint:css
```

للإصلاح التلقائي للأخطاء:

```bash
bun lint:css:fix
```

## وثائق API

وثائق API متوفرة في: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

لإنشاء الوثائق محلياً، استخدم الأمر:

```bash
bun run docs
```

ستكون الوثائق متوفرة في مجلد `docs/`.

لتطوير الوثائق في الوقت الفعلي، استخدم:

```bash
bun run docs:watch
```

يتم تحديث الوثائق تلقائياً عند تغيير الكود المصدري في فرع `main` باستخدام تدفق عمل GitHub Actions `docs.yml`.

## الصفحة الترويجية

الصفحة الترويجية للمشروع متوفرة في: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

يوجد الكود المصدري للصفحة الترويجية في مجلد `promo/`.

للتطوير المحلي للصفحة الترويجية، استخدم الأوامر:

```bash
cd promo
bun install
bun run dev
```

لبناء الصفحة الترويجية:

```bash
cd promo
bun run build
```

يتم تحديث الصفحة الترويجية تلقائياً عند تغيير الملفات في مجلد `promo/` على فرع `main` باستخدام تدفق عمل GitHub Actions `deploy-promo.yml`.

## موارد إضافية

- [وثائق Tauri](https://v2.tauri.app/start/)
- [وثائق XState](https://xstate.js.org/docs/)
- [وثائق Vitest](https://vitest.dev/guide/)
- [وثائق Tailwind CSS](https://tailwindcss.com/docs)
- [وثائق Shadcn UI](https://ui.shadcn.com/)
- [وثائق Stylelint](https://stylelint.io/)
- [وثائق ESLint](https://eslint.org/docs/latest/)
- [وثائق Playwright](https://playwright.dev/docs/intro)
- [وثائق TypeDoc](https://typedoc.org/)
- [وثائق ffmpeg](https://ffmpeg.org/documentation.html)

## الترخيص

هذا المشروع موزع بموجب رخصة MIT مع شرط Commons Clause.

**الشروط الرئيسية:**

- **مفتوح المصدر**: يمكنك استخدام وتعديل وتوزيع الكود بحرية وفقاً لشروط رخصة MIT.
- **قيود الاستخدام التجاري**: Commons Clause يمنع "بيع" البرمجيات بدون اتفاق منفصل مع المؤلف.
- **"البيع"** يعني استخدام وظائف البرمجيات لتوفير منتج أو خدمة لأطراف ثالثة مقابل رسوم.

هذه الرخصة تسمح بـ:

- استخدام الكود للمشاريع الشخصية وغير التجارية
- دراسة وتعديل الكود
- توزيع التعديلات تحت نفس الرخصة

لكنها تمنع:

- إنشاء منتجات أو خدمات تجارية مبنية على الكود بدون رخصة

للحصول على رخصة تجارية، يرجى الاتصال بالمؤلف: ak.chatman.media@gmail.com

نص الرخصة الكامل متوفر في ملف [LICENSE](./LICENSE)

## GitHub Pages

يستخدم المشروع GitHub Pages لاستضافة وثائق API والصفحة الترويجية:

- **الصفحة الترويجية**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **وثائق API**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

يتم تحديث كلا الصفحتين تلقائياً عند تغيير الملفات المقابلة في فرع `main` باستخدام تدفقات عمل GitHub Actions.

</div>