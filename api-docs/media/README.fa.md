# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=flat-square)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=flat-square&label=coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Last Commit](https://img.shields.io/github/last-commit/chatman-media/timeline-studio?style=flat-square&label=last%20commit)](https://github.com/chatman-media/timeline-studio/commits/main)
[![GitHub commits](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=flat-square&label=commits)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=flat-square&label=downloads)](https://www.npmjs.com/package/timeline-studio)

[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](./docs/en/README.md)
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/uvSBCw6e)

</div>

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

**تکمیل کلی: 53.8%** ⬆️ (بازمحاسبه شده با وضعیت واقعی ماژول‌ها و 14 ماژول جدید برنامه‌ریزی شده)
- **تکمیل شده**: 11 ماژول (100% آماده)
- **در حال توسعه**: 8 ماژول (45-85% آماده)
- **برنامه‌ریزی شده**: 5 ماژول (30-85% آماده)
- **جدید برنامه‌ریزی شده**: 14 ماژول (0% آماده) - [جزئیات در planned/](docs-ru/08-roadmap/planned/)

### دستاوردهای کلیدی:
- ✅ **کامپایلر ویدیو** - کاملاً با شتاب GPU پیاده‌سازی شده (100%)
- ✅ **تایم‌لاین** - ویرایشگر اصلی کاملاً عملکرد دارد (100%)
- ✅ **مدیریت رسانه** - مدیریت فایل آماده (100%)
- ✅ **معماری هسته** - app-state, browser, modals, user/project settings (100%)
- ✅ **تشخیص** - تشخیص اشیاء و چهره YOLO v11 (100%)
- 🔄 **افکت‌ها/فیلترها/انتقال‌ها** - کتابخانه غنی افکت‌های سبک Filmora (75-80%)
- 🔄 **خروجی** - تقریباً تکمیل، جزئیات پارامترها باقی‌مانده (85%)
- 🔄 **پنل منابع** - UI اصلی آماده، کشیدن و رها کردن موجود نیست (80%)
- ❗ **گپ AI** - نیاز به ادغام API واقعی (30%)
- 📋 **14 ماژول جدید برنامه‌ریزی شده** - [مراجعه به planned/](docs-ru/08-roadmap/planned/) برای رسیدن به سطح DaVinci + Filmora
- 🎯 **هدف** - ترکیب قدرت DaVinci و کتابخانه Filmora با خودکارسازی AI

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
- 🌐 پشتیبانی بین‌المللی‌سازی (13 زبان)
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

### شروع سریع

```bash
# حالت توسعه
bun run tauri dev

# اجرای تست‌ها
bun run test && bun run test:rust

# بررسی کیفیت کد
bun run check:all
```

### دستورات اساسی

| دستور | توضیح |
|-------|-------|
| `bun run tauri dev` | اجرای برنامه کامل در حالت توسعه |
| `bun run dev` | اجرای فقط frontend |
| `bun run build` | ساخت برای تولید |
| `bun run test` | اجرای تست‌های frontend |
| `bun run test:rust` | اجرای تست‌های backend |
| `bun run lint` | بررسی کیفیت کد |
| `bun run fix:all` | اصلاح خودکار مشکلات کد |

📚 **[راهنمای کامل توسعه ←](docs-ru/05-development/README.md)**

### وضعیت پوشش تست

✅ **تست‌های Frontend**: 3,604 موفق
✅ **تست‌های Backend**: 554 موفق (+18 جدید!)
📊 **مجموع**: 4,158 تست موفق

### تست‌ها

پروژه از Vitest برای تست‌های واحد استفاده می‌کند. تست‌ها در دایرکتوری __tests__ هر ویژگی قرار دارند، همراه با mock ها در __mocks__.

## CI/CD و کیفیت کد

### فرآیندهای خودکار
- ✅ **Linting**: ESLint، Stylelint، Clippy
- ✅ **تست‌ها**: Frontend (Vitest)، Backend (Rust)، E2E (Playwright)
- ✅ **پوشش**: ادغام Codecov
- ✅ **ساخت**: ساخت‌های چند پلتفرمه

📚 **[راهنمای تفصیلی CI/CD ←](docs-ru/06-deployment/README.md)**
🔧 **[Linting و فرمت‌دهی ←](docs-ru/05-development/linting-and-formatting.md)**

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

## مستندات و منابع

- 📚 [**مستندات API**](https://chatman-media.github.io/timeline-studio/api-docs/) - مستندات TypeScript تولید خودکار
- 🚀 [**صفحه تبلیغاتی**](https://chatman-media.github.io/timeline-studio/) - نمایش پروژه
- 📖 [**مستندات کامل**](docs-ru/README.md) - راهنمای کامل به زبان روسی
- 🎬 [**دمو زنده**](https://chatman-media.github.io/timeline-studio/) - ویرایشگر را آنلاین امتحان کنید

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
