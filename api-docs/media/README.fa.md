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

## نمای کلی پروژه

Timeline Studio یک ویرایشگر ویدیوی مدرن است که بر پایه معماری Tauri (Rust + React) ساخته شده است.

**هدف ما**: ایجاد ویرایشگری که ترکیبی از موارد زیر باشد:
- **قدرت حرفه‌ای DaVinci Resolve** - کنترل کامل بر ویرایش، درجه‌بندی رنگ، میکس صدا، جلوه‌های بصری، گرافیک متحرک و ترکیب پیشرفته
- **کتابخانه خلاقانه گسترده** - جلوه‌ها، فیلترها، انتقال‌ها، قالب‌های چند دوربینه، عناوین متحرک، قالب‌های سبک و پیش‌تنظیمات زیرنویس قابل مقایسه با ویرایشگرهای محبوب مانند Filmora
- **اسکریپت‌نویسی و خودکارسازی با هوش مصنوعی** - تولید خودکار محتوا به زبان‌های مختلف و برای پلتفرم‌های مختلف

**نوآوری کلیدی**: کافی است کاربران ویدیوها، موسیقی و سایر منابع را آپلود کنند و هوش مصنوعی به طور خودکار مجموعه‌ای از ویدیوها را به زبان‌های مختلف و بهینه‌سازی شده برای پلتفرم‌های مختلف (YouTube، TikTok، Vimeo، Telegram) ایجاد خواهد کرد.

![رابط تایم‌لاین #1](/public/screen2.png)

![رابط تایم‌لاین #2](/public/screen4.png)

### وضعیت پروژه (ژوئن 2025)

**تکمیل کلی: 86.2%** ⬆️ (به‌روزرسانی شده پس از ادغام OAuth و تکمیل Export)
- ✅ عملکرد ویرایش هسته تکمیل شد
- ✅ کامپایلر ویدیو با شتاب GPU
- ✅ ماژول تشخیص (YOLO v11) - ORT اصلاح شد
- ✅ افکت‌ها، فیلترها و ترانزیشن‌ها (75-80%)
- ✅ Export - ادغام کامل شبکه‌های اجتماعی! (98%) 🎉
- ✅ ادغام OAuth - پشتیبانی از YouTube/TikTok/Vimeo/Telegram
- ✅ سیستم پیش‌نمایش یکپارچه با Preview Manager
- ✅ پایداری رسانه و پروژه‌های موقت
- ✅ سیستم قالب - مبتنی بر پیکربندی (95% تکمیل شده)
- ✅ Timeline با 90% تکمیل
- ⚠️ پنل منابع در حال توسعه (85%)
- 🎯 انتشار MVP هدف: پایان ژوئن 2025

## ویژگی‌های کلیدی

- 🎬 ویرایش ویدیوی حرفه‌ای با تایم‌لاین چند مسیره
- 🖥️ چند پلتفرمی (Windows، macOS، Linux)
- 🚀 پردازش ویدیو با شتاب GPU (NVENC، QuickSync، VideoToolbox)
- 🤖 تشخیص اشیاء/چهره با هوش مصنوعی (YOLO v11 - ORT اصلاح شد)
- 🎨 بیش از 30 ترانزیشن، افکت بصری و فیلتر
- 📝 سیستم زیرنویس پیشرفته با 12 سبک و انیمیشن
- 🎵 ویرایش صدای چند مسیره با افکت‌ها
- 📤 خروجی به MP4/MOV/WebM با ادغام OAuth شبکه‌های اجتماعی
- 🔐 پشتیبانی OAuth برای YouTube/TikTok/Vimeo/Telegram با ذخیره‌سازی امن توکن
- 📱 پیش‌تنظیمات دستگاه (iPhone، iPad، Android) برای خروجی‌های بهینه‌شده
- 🧠 مدیریت حالت با استفاده از XState v5
- 🌐 پشتیبانی بین‌المللی‌سازی (11 زبان)
- 💾 کش هوشمند و سیستم پیش‌نمایش یکپارچه
- 🎨 رابط کاربری مدرن با Tailwind CSS v4، shadcn-ui
- 📚 مستندات کامل با 2400+ تست (نرخ موفقیت 98.8%)

## شروع به کار

### پیش‌نیازها

- [Node.js](https://nodejs.org/) (نسخه 18 یا بالاتر)
- [Rust](https://www.rust-lang.org/tools/install) (آخرین نسخه پایدار)
- [bun](https://bun.sh/) (آخرین نسخه پایدار)
- [ffmpeg](https://ffmpeg.org/download.html) (آخرین نسخه پایدار)

### نصب

1. کلون کردن مخزن:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. نصب وابستگی‌ها:

```bash
bun install
```

### اجرای حالت توسعه

```bash
bun run tauri dev
```

### ساخت تولید

```bash
bun run tauri build
```

## مستندات

### 📚 مستندات اصلی

- 📚 [نمای کلی مستندات](docs-ru/README.md) - نقشه کامل مستندات
- 🚀 [شروع به کار](docs-ru/01-getting-started/README.md) - نصب و گام‌های اول
- 🏗️ [راهنمای معماری](docs-ru/02-architecture/README.md) - معماری سیستم
- 🎯 [راهنمای ویژگی‌ها](docs-ru/03-features/README.md) - نمای کلی و وضعیت ویژگی‌ها
- 📡 [مرجع API](docs-ru/04-api-reference/README.md) - مرجع دستورات Tauri
- 🧪 [راهنمای توسعه](docs-ru/05-development/README.md) - تست و توسعه
- 🚀 [راهنمای استقرار](docs-ru/06-deployment/README.md) - ساخت و استقرار
- 📋 [راهنماهای کاربر](docs-ru/07-guides/README.md) - عملکرد و بهترین شیوه‌ها
- 🛣️ [نقشه راه](docs-ru/08-roadmap/README.md) - نقشه راه توسعه
- 🔐 [تنظیم OAuth](docs-ru/09-oauth-setup/oauth-setup-guide.md) - ادغام شبکه‌های اجتماعی

### 📋 مستندات پروژه

- **`src/features/README.md`** - نمای کلی همه ویژگی‌ها با اولویت‌ها و وضعیت
- **نسخه‌های زبانی**: از طریق سوئیچ بالا در 11 زبان در دسترس است

## توسعه

### اسکریپت‌های موجود

- `bun run dev` - اجرای Next.js در حالت توسعه
- `bun run tauri dev` - اجرای Tauri در حالت توسعه
- `bun run build` - ساخت Next.js
- `bun run tauri build` - ساخت برنامه Tauri

#### Linting و فرمت‌دهی

- `bun run lint` - بررسی کد JavaScript/TypeScript با ESLint
- `bun run lint:fix` - اصلاح خطاهای ESLint
- `bun run lint:css` - بررسی کد CSS با Stylelint
- `bun run lint:css:fix` - اصلاح خطاهای Stylelint
- `bun run format:imports` - فرمت کردن import ها
- `bun run lint:rust` - بررسی کد Rust با Clippy
- `bun run format:rust` - فرمت کردن کد Rust با rustfmt
- `bun run check:all` - اجرای همه بررسی‌ها و تست‌ها
- `bun run fix:all` - اصلاح همه خطاهای linting

#### تست‌ها

- `bun run test` - اجرای تست‌ها
- `bun run test:app` - اجرای تست‌ها فقط برای کامپوننت‌های برنامه
- `bun run test:watch` - اجرای تست‌ها در حالت نظارت
- `bun run test:coverage` - اجرای تست‌ها با گزارش پوشش
- `bun run test:coverage:report` - تولید و ارسال گزارش پوشش تست
- `bun run test:rust` - اجرای تست‌های backend Rust
- `bun run test:rust:watch` - اجرای تست‌های Rust در حالت نظارت
- `bun run test:coverage:rust` - اجرای تست‌های Rust با پوشش
- `bun run test:coverage:rust:report` - تولید و ارسال گزارش پوشش Rust
- `bun run test:ui` - اجرای تست‌ها با رابط UI
- `bun run test:e2e` - اجرای تست‌های End-to-End با Playwright
- `bun run test:e2e:ui` - اجرای تست‌های E2E با UI Playwright
- `bun run test:e2e:basic` - اجرای تست E2E اولیه برای import رسانه
- `bun run test:e2e:real` - اجرای تست‌های E2E با فایل‌های رسانه واقعی
- `bun run test:e2e:integration` - اجرای تست‌های E2E integration (نیاز به INTEGRATION_TEST=true)
- `bun run playwright:install` - نصب مرورگرهای Playwright

### تست‌ها

پروژه از Vitest برای تست‌های واحد استفاده می‌کند. تست‌ها در دایرکتوری __tests__ هر ویژگی قرار دارند، همراه با mock ها در __mocks__.

#### 🧪 وضعیت پوشش تست:
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
# اجرای تست‌های کلاینت
bun run test

# اجرای تست‌های rust
bun run test:rust

# اجرای تست‌ها با گزارش پوشش
bun run test:coverage

# اجرای تست برای عملکرد خاص
bun run test src/features/effects
```

## ادغام مداوم و استقرار

پروژه برای استفاده از GitHub Actions برای ادغام مداوم و استقرار پیکربندی شده است. Workflow ها:

### تایید و ساخت

- `check-all.yml` - اجرای همه بررسی‌ها و تست‌ها
- `lint-css.yml` - بررسی فقط کد CSS (اجرا می‌شود وقتی فایل‌های CSS تغییر کنند)
- `lint-rs.yml` - بررسی فقط کد Rust (اجرا می‌شود وقتی فایل‌های Rust تغییر کنند)
- `lint-js.yml` - بررسی فقط کد JavaScript/TypeScript (اجرا می‌شود وقتی فایل‌های JavaScript/TypeScript تغییر کنند)

### استقرار

- `build.yml` - ساخت پروژه
- `build-release.yml` - ساخت پروژه برای انتشار
- `deploy-promo.yml` - ساخت و انتشار صفحه تبلیغاتی در GitHub Pages
- `docs.yml` - تولید و انتشار مستندات API در GitHub Pages

### پیکربندی Linter

#### Stylelint (CSS)

پروژه از Stylelint برای بررسی کد CSS استفاده می‌کند. پیکربندی در فایل `.stylelintrc.json` قرار دارد. ویژگی‌های اصلی:

- پشتیبانی از دستورالعمل‌های Tailwind CSS
- نادیده گرفتن انتخابگرهای تکراری برای سازگاری با Tailwind
- اصلاح خودکار خطاها هنگام ذخیره فایل‌ها (در VS Code)

برای اجرای CSS linter، از دستور زیر استفاده کنید:

```bash
bun lint:css
```

برای اصلاح خودکار خطاها:

```bash
bun lint:css:fix
```

## مستندات API

مستندات API در اینجا در دسترس است: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

برای تولید مستندات به صورت محلی، از دستور زیر استفاده کنید:

```bash
bun run docs
```

مستندات در پوشه `docs/` در دسترس خواهد بود.

برای توسعه مستندات در زمان واقعی، استفاده کنید:

```bash
bun run docs:watch
```

مستندات به طور خودکار به‌روزرسانی می‌شود وقتی کد منبع در branch `main` تغییر کند، با استفاده از workflow GitHub Actions `docs.yml`.

## صفحه تبلیغاتی

صفحه تبلیغاتی پروژه در اینجا در دسترس است: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

کد منبع صفحه تبلیغاتی در پوشه `promo/` قرار دارد.

برای توسعه محلی صفحه تبلیغاتی، از دستورات زیر استفاده کنید:

```bash
cd promo
bun install
bun run dev
```

برای ساخت صفحه تبلیغاتی:

```bash
cd promo
bun run build
```

صفحه تبلیغاتی به طور خودکار به‌روزرسانی می‌شود وقتی فایل‌ها در پوشه `promo/` در branch `main` تغییر کنند، با استفاده از workflow GitHub Actions `deploy-promo.yml`.

## منابع اضافی

- [مستندات Tauri](https://v2.tauri.app/start/)
- [مستندات XState](https://xstate.js.org/docs/)
- [مستندات Vitest](https://vitest.dev/guide/)
- [مستندات Tailwind CSS](https://tailwindcss.com/docs)
- [مستندات Shadcn UI](https://ui.shadcn.com/)
- [مستندات Stylelint](https://stylelint.io/)
- [مستندات ESLint](https://eslint.org/docs/latest/)
- [مستندات Playwright](https://playwright.dev/docs/intro)
- [مستندات TypeDoc](https://typedoc.org/)
- [مستندات ffmpeg](https://ffmpeg.org/documentation.html)

## مجوز

این پروژه تحت مجوز MIT با شرط Commons Clause توزیع می‌شود.

**شرایط اصلی:**

- **متن باز**: می‌توانید کد را آزادانه مطابق شرایط مجوز MIT استفاده، تغییر و توزیع کنید.
- **محدودیت استفاده تجاری**: Commons Clause "فروش" نرم‌افزار بدون توافق جداگانه با نویسنده را ممنوع می‌کند.
- **"فروش"** به معنای استفاده از عملکرد نرم‌افزار برای ارائه محصول یا سرویس به اشخاص ثالث در ازای هزینه است.

این مجوز اجازه می‌دهد:

- استفاده از کد برای پروژه‌های شخصی و غیرتجاری
- مطالعه و تغییر کد
- توزیع تغییرات تحت همان مجوز

اما ممنوع می‌کند:

- ایجاد محصولات یا خدمات تجاری بر اساس کد بدون مجوز

برای دریافت مجوز تجاری، لطفاً با نویسنده تماس بگیرید: ak.chatman.media@gmail.com

متن کامل مجوز در فایل [LICENSE](./LICENSE) در دسترس است

## GitHub Pages

پروژه از GitHub Pages برای میزبانی مستندات API و صفحه تبلیغاتی استفاده می‌کند:

- **صفحه تبلیغاتی**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **مستندات API**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

هر دو صفحه به طور خودکار به‌روزرسانی می‌شوند وقتی فایل‌های مربوطه در branch `main` تغییر کنند، با استفاده از workflow های GitHub Actions.

</div>