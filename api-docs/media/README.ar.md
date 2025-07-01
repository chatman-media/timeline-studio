# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [فارسی](README.fa.md) | [हिन्दी](README.hi.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=flat-square)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=flat-square&label=coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Last Commit](https://img.shields.io/github/last-commit/chatman-media/timeline-studio?style=flat-square&label=last%20commit)](https://github.com/chatman-media/timeline-studio/commits/main)
[![GitHub commits](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=flat-square&label=commits)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=flat-square&label=downloads)](https://www.npmjs.com/package/timeline-studio)

[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/visit-website-brightgreen?style=for-the-badge&logo=globe&logoColor=white)](https://chatman-media.github.io/timeline-studio/)

</div>

<div dir="rtl">

## 🎬 نظرة عامة على المشروع

**Timeline Studio** - محرر فيديو مدعوم بالذكاء الاصطناعي يحول مقاطع الفيديو والموسيقى والتأثيرات المفضلة لديك إلى عشرات من المقاطع الجاهزة للنشر على جميع المنصات!

**هدفنا**: إنشاء محرر يجمع بين:
- **القوة الاحترافية لـ DaVinci Resolve** - التحكم الكامل في التحرير وتدرج الألوان ومزج الصوت والتأثيرات المرئية والرسومات المتحركة والتركيب المتقدم
- **مكتبة إبداعية واسعة** - تأثيرات وفلاتر وانتقالات وقوالب كاميرات متعددة وعناوين متحركة وقوالب أنماط وإعدادات مسبقة للترجمات تضاهي المحررات الشائعة مثل Filmora
- **البرمجة النصية والأتمتة بالذكاء الاصطناعي** - إنشاء محتوى تلقائي بلغات مختلفة ولمنصات مختلفة

**الابتكار الرئيسي**: يكفي للمستخدمين تحميل مقاطع الفيديو والموسيقى والموارد الأخرى، وسيقوم الذكاء الاصطناعي تلقائيًا بإنشاء مجموعة من مقاطع الفيديو بلغات مختلفة ومحسنة لمنصات مختلفة (YouTube و TikTok و Vimeo و Telegram).

![واجهة الخط الزمني #1](/public/screen2.png)

![واجهة الخط الزمني #2](/public/screen4.png)

### حالة المشروع (يونيو 2025)

**الإنجاز الإجمالي: 53.8%** ⬆️ (أعيد حسابه مع الحالة الفعلية للوحدات و14 وحدة مخططة جديدة)
- **مكتمل**: 11 وحدة (100% جاهز)
- **قيد التطوير**: 8 وحدات (45-85% جاهز)
- **مخطط**: 5 وحدات (30-85% جاهز)
- **مخطط جديد**: 14 وحدة (0% جاهز) - [التفاصيل في planned/](docs-ru/08-roadmap/planned/)

### الإنجازات الرئيسية:
- ✅ **مترجم الفيديو** - منفذ بالكامل مع تسريع GPU (100%)
- ✅ **الخط الزمني** - المحرر الرئيسي مكتمل الوظائف (100%)
- ✅ **إدارة الوسائط** - إدارة الملفات جاهزة (100%)
- ✅ **البنية الأساسية** - app-state, browser, modals, user/project settings (100%)
- ✅ **التعرف** - التعرف على الأشياء والوجوه YOLO v11 (100%)
- 🔄 **التأثيرات/الفلاتر/الانتقالات** - مكتبة تأثيرات غنية بنمط Filmora (75-80%)
- 🔄 **التصدير** - مكتمل تقريباً، تفاصيل المعاملات متبقية (85%)
- 🔄 **لوحة الموارد** - الواجهة الرئيسية جاهزة، السحب والإفلات مفقود (80%)
- ❗ **دردشة AI** - تتطلب تكامل API حقيقي (30%)
- 📋 **14 وحدة مخططة جديدة** - [انظر planned/](docs-ru/08-roadmap/planned/) للوصول لمستوى DaVinci + Filmora
- 🎯 **الهدف** - دمج قوة DaVinci ومكتبة Filmora مع أتمتة AI

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
- 🌐 دعم التدويل (13 لغة)
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

### البداية السريعة

```bash
# وضع التطوير
bun run tauri dev

# تشغيل الاختبارات
bun run test && bun run test:rust

# فحص جودة الكود
bun run check:all
```

### الأوامر الأساسية

| الأمر | الوصف |
|-------|-------|
| `bun run tauri dev` | تشغيل التطبيق الكامل في وضع التطوير |
| `bun run dev` | تشغيل الواجهة الأمامية فقط |
| `bun run build` | بناء للإنتاج |
| `bun run test` | تشغيل اختبارات الواجهة الأمامية |
| `bun run test:rust` | تشغيل اختبارات الواجهة الخلفية |
| `bun run lint` | فحص جودة الكود |
| `bun run fix:all` | إصلاح مشاكل الكود تلقائياً |

📚 **[دليل التطوير الكامل ←](docs-ru/05-development/README.md)**

### حالة تغطية الاختبارات

✅ **اختبارات الواجهة الأمامية**: 3,604 نجحت
✅ **اختبارات الواجهة الخلفية**: 554 نجحت (+18 جديد!)
📊 **المجموع**: 4,158 اختبار نجح

### الاختبارات

يستخدم المشروع Vitest لاختبارات الوحدة. توجد الاختبارات في دليل __tests__ لكل ميزة، مع الـ mocks في __mocks__.

## CI/CD وجودة الكود

### العمليات التلقائية
- ✅ **التحقق**: ESLint، Stylelint، Clippy
- ✅ **الاختبارات**: الواجهة الأمامية (Vitest)، الواجهة الخلفية (Rust)، E2E (Playwright)
- ✅ **التغطية**: تكامل Codecov
- ✅ **البناء**: بناء متعدد المنصات

📚 **[دليل CI/CD المفصل ←](docs-ru/06-deployment/README.md)**
🔧 **[التحقق والتنسيق ←](docs-ru/05-development/linting-and-formatting.md)**

## التوثيق والموارد

- 📚 [**وثائق API**](https://chatman-media.github.io/timeline-studio/api-docs/) - وثائق TypeScript المولدة تلقائياً
- 🚀 [**الصفحة الترويجية**](https://chatman-media.github.io/timeline-studio/) - عرض المشروع
- 📖 [**التوثيق الكامل**](docs-ru/README.md) - الدليل الكامل باللغة الروسية
- 🎬 [**العرض التوضيحي المباشر**](https://chatman-media.github.io/timeline-studio/) - جرب المحرر عبر الإنترنت

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
