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

## Project Overview

Timeline Studio is a modern video editor built on Tauri architecture (Rust + React).

**Our goal**: create an editor combining:
- **Professional power of DaVinci Resolve** - complete control over editing, color grading, audio mixing, visual effects, motion graphics, and advanced compositing
- **Extensive creative library** - effects, filters, transitions, multi-camera templates, animated titles, style templates, and subtitle presets comparable to popular editors like Filmora
- **AI scripting and automation** - automatic content generation in different languages and for different platforms

**Key innovation**: It's enough for users to upload videos, music and other resources, and AI will automatically create a set of videos in different languages and optimized for different platforms (YouTube, TikTok, Vimeo, Telegram).

![Timeline Interface #1](/public/screen2.png)

![Timeline Interface #2](/public/screen4.png)

### Project Status (June 2025)

**Overall Completion: 53.8%** ⬆️ (recalculated with real module status and 14 new planned modules)
- **Completed**: 11 modules (100% readiness) 
- **In development**: 8 modules (45-85% readiness)
- **Planned**: 5 modules (30-85% readiness)
- **New planned**: 14 modules (0% readiness) - [details in planned/](docs-ru/08-roadmap/planned/)

### Key Achievements:
- ✅ **Video Compiler** - fully implemented with GPU acceleration (100%)
- ✅ **Timeline** - main editor fully functional (100%)
- ✅ **Media Management** - file management ready (100%)
- ✅ **Core Architecture** - app-state, browser, modals, user/project settings (100%)
- ✅ **Recognition** - YOLO v11 object and face recognition (100%)
- 🔄 **Effects/Filters/Transitions** - rich effects library in Filmora style (75-80%)
- 🔄 **Export** - almost ready, details of parameters remain (85%)
- 🔄 **Resources Panel** - main UI ready, drag & drop missing (80%)
- ❗ **AI Chat** - requires real API integration (30%)
- 📋 **14 new planned modules** - [see planned/](docs-ru/08-roadmap/planned/) to achieve DaVinci + Filmora level
- 🎯 **Goal** - combine DaVinci power and Filmora library with AI automation

## Key Features

- 🎬 Professional video editing with multi-track timeline
- 🖥️ Cross-platform (Windows, macOS, Linux)
- 🚀 GPU-accelerated video processing (NVENC, QuickSync, VideoToolbox)
- 🤖 AI-powered object/face recognition (YOLO v11 - ORT fixed)
- 🎨 30+ transitions, visual effects, and filters
- 📝 Advanced subtitle system with 12 styles and animations
- 🎵 Multi-track audio editing with effects
- 📤 Export to MP4/MOV/WebM with social media OAuth integration
- 🔐 YouTube/TikTok/Vimeo/Telegram OAuth support with secure token storage
- 📱 Device presets (iPhone, iPad, Android) for optimized exports
- 🧠 State management using XState v5
- 🌐 Internationalization support (11 languages)
- 💾 Smart caching and unified preview system
- 🎨 Modern UI using Tailwind CSS v4, shadcn-ui
- 📚 Complete documentation with 2400+ tests (98.8% success rate)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable version)
- [bun](https://bun.sh/) (latest stable version)
- [ffmpeg](https://ffmpeg.org/download.html) (latest stable version)

**Windows users**: Please see [WINDOWS_BUILD.md](WINDOWS_BUILD.md) for detailed setup instructions including FFmpeg configuration.

### Installation

1. Clone the repository:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Install dependencies:

```bash
bun install
```

### Development Mode Launch

```bash
bun run tauri dev
```

### Release Build

```bash
bun run tauri build
```

## Documentation

### 📚 Main Documentation

- 📚 [Documentation Overview](docs-ru/README.md) - Complete documentation map
- 🚀 [Getting Started](docs-ru/01-getting-started/README.md) - Installation and first steps
- 🏗️ [Architecture Guide](docs-ru/02-architecture/README.md) - System architecture
- 🎯 [Features Guide](docs-ru/03-features/README.md) - Feature overview and status
- 📡 [API Reference](docs-ru/04-api-reference/README.md) - Tauri commands reference
- 🧪 [Development Guide](docs-ru/05-development/README.md) - Testing and development
- 🚀 [Deployment Guide](docs-ru/06-deployment/README.md) - Build and deployment
- 📋 [User Guides](docs-ru/07-guides/README.md) - Performance and best practices
- 🛣️ [Roadmap](docs-ru/08-roadmap/README.md) - Development roadmap
- 🔐 [OAuth Setup](docs-ru/09-oauth-setup/oauth-setup-guide.md) - Social media integration

### 📋 Project Documentation

- **`src/features/README.md`** - overview of all features with priorities and status
- **Language versions**: Available in 11 languages via the switcher above

## Development

### Available Scripts

- `bun run dev` - Launch Next.js in development mode
- `bun run tauri dev` - Launch Tauri in development mode
- `bun run build` - Build Next.js
- `bun run tauri build` - Build Tauri application

#### Linting and Formatting

- `bun run lint` - Check JavaScript/TypeScript code with ESLint
- `bun run lint:fix` - Fix ESLint errors
- `bun run lint:css` - Check CSS code with Stylelint
- `bun run lint:css:fix` - Fix Stylelint errors
- `bun run format:imports` - Format imports
- `bun run lint:rust` - Check Rust code with Clippy
- `bun run format:rust` - Format Rust code with rustfmt
- `bun run check:all` - Run all checks and tests
- `bun run fix:all` - Fix all linting errors

#### Testing

- `bun run test` - Run tests
- `bun run test:app` - Run tests for application components only
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Run tests with coverage report
- `bun run test:coverage:report` - Generate and submit test coverage report
- `bun run test:rust` - Run Rust backend tests
- `bun run test:rust:watch` - Run Rust tests in watch mode
- `bun run test:coverage:rust` - Run Rust tests with coverage
- `bun run test:coverage:rust:report` - Generate and submit Rust coverage report
- `bun run test:ui` - Run tests with UI interface
- `bun run test:e2e` - Run end-to-end tests with Playwright
- `bun run test:e2e:ui` - Run e2e tests with Playwright UI
- `bun run test:e2e:basic` - Run basic media import e2e test
- `bun run test:e2e:real` - Run e2e tests with real media files
- `bun run test:e2e:integration` - Run integration e2e tests (requires INTEGRATION_TEST=true)
- `bun run playwright:install` - Install Playwright browsers

### Testing

The project uses Vitest for unit testing. Tests are located in the feature's __tests__ directory, along with mocks in __mocks__.

#### 🧪 Test Coverage Status:
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
# Run client tests
bun run test

# Run rust tests
bun run test:rust

# Run tests with coverage report
bun run test:coverage

# Run tests for specific function
bun run test src/features/effects
```

## Continuous Integration and Deployment

The project is configured to use GitHub Actions for continuous integration and deployment. Workflows:

### Verification and Build

- `check-all.yml` - Run all checks and tests
- `lint-css.yml` - Check CSS code only (runs when CSS files change)
- `lint-rs.yml` - Check Rust code only (runs when Rust files change)
- `lint-js.yml` - Check JavaScript/TypeScript code only (runs when JavaScript/TypeScript files change)

### Deployment

- `build.yml` - Build project
- `build-release.yml` - Build project for release
- `deploy-promo.yml` - Build and publish promo page on GitHub Pages
- `docs.yml` - Generate and publish API documentation on GitHub Pages

### Linter Configuration

#### Stylelint (CSS)

The project uses Stylelint to check CSS code. Configuration is located in the `.stylelintrc.json` file. Main features:

- Support for Tailwind CSS directives
- Ignoring duplicate selectors for Tailwind compatibility
- Automatic error fixing when saving files (in VS Code)

To run the CSS linter, use the command:

```bash
bun lint:css
```

For automatic error fixing:

```bash
bun lint:css:fix
```

## API Documentation

API documentation is available at: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

To generate documentation locally, use the command:

```bash
bun run docs
```

Documentation will be available in the `docs/` folder.

For real-time documentation development, use:

```bash
bun run docs:watch
```

Documentation is automatically updated when source code changes in the `main` branch using the GitHub Actions workflow `docs.yml`.

## Promo Page

Project promo page is available at: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

The promo page source code is located in the `promo/` folder.

For local development of the promo page, use the commands:

```bash
cd promo
bun install
bun run dev
```

To build the promo page:

```bash
cd promo
bun run build
```

The promo page is automatically updated when files change in the `promo/` folder on the `main` branch using the GitHub Actions workflow `deploy-promo.yml`.

## Additional Resources

- [Tauri Documentation](https://v2.tauri.app/start/)
- [XState Documentation](https://xstate.js.org/docs/)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Stylelint Documentation](https://stylelint.io/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [TypeDoc Documentation](https://typedoc.org/)
- [ffmpeg Documentation](https://ffmpeg.org/documentation.html)

## License

This project is distributed under the MIT License with Commons Clause condition.

**Main terms:**

- **Open Source**: You can freely use, modify, and distribute the code according to the MIT License terms.
- **Commercial Use Restriction**: Commons Clause prohibits "selling" the software without a separate agreement with the author.
- **"Selling"** means using the software functionality to provide third parties with a product or service for a fee.

This license allows:

- Using the code for personal and non-commercial projects
- Studying and modifying the code
- Distributing modifications under the same license

But prohibits:

- Creating commercial products or services based on the code without a license

To obtain a commercial license, please contact the author: ak.chatman.media@gmail.com

Full license text is available in the [LICENSE](./LICENSE) file

## GitHub Pages

Project uses GitHub Pages for hosting API documentation and promo page:

- **Promo Page**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **API Documentation**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Both pages are automatically updated when corresponding files are changed in the `main` branch using GitHub Actions workflows.
