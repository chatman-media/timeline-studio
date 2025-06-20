# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Lint CSS](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-css.yml?style=flat-square&label=lint%20css)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-js.yml?style=flat-square&label=lint%20ts)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-rs.yml?style=flat-square&label=lint%20rust)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)

[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=for-the-badge&label=frontend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=for-the-badge&label=backend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)

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

**Windows users**: Please see [docs-ru/06-deployment/platforms/windows-build.md](docs-ru/06-deployment/platforms/windows-build.md) for detailed setup instructions including FFmpeg configuration.

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

### Quick Start

```bash
# Development mode
bun run tauri dev

# Run tests
bun run test && bun run test:rust

# Check code quality
bun run check:all
```

### Essential Commands

| Command | Description |
|---------|-------------|
| `bun run tauri dev` | Launch full application in development |
| `bun run dev` | Launch frontend only |
| `bun run build` | Build for production |
| `bun run test` | Run frontend tests |
| `bun run test:rust` | Run backend tests |
| `bun run lint` | Check code quality |
| `bun run fix:all` | Auto-fix code issues |

📚 **[Complete Development Guide →](docs-ru/05-development/README.md)**

### Test Coverage Status

✅ **Frontend Tests**: 3,604 passed  
✅ **Backend Tests**: 504 passed (+18 новых!)  
📊 **Total**: 4,108 tests passing

## CI/CD & Code Quality

### Automated Workflows
- ✅ **Linting**: ESLint, Stylelint, Clippy
- ✅ **Testing**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Coverage**: Codecov integration
- ✅ **Build**: Cross-platform builds

📚 **[Detailed CI/CD Guide →](docs-ru/06-deployment/README.md)**  
🔧 **[Linting & Formatting →](docs-ru/05-development/linting-and-formatting.md)**

## Documentation & Resources

- 📚 [**API Documentation**](https://chatman-media.github.io/timeline-studio/api-docs/) - Auto-generated TypeScript docs
- 🚀 [**Promo Page**](https://chatman-media.github.io/timeline-studio/) - Project showcase
- 📖 [**Complete Documentation**](docs-ru/README.md) - Full guide in Russian
- 🎬 [**Live Demo**](https://chatman-media.github.io/timeline-studio/) - Try the editor online

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
