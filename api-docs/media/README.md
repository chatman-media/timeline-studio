# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
<!-- [![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml) -->

## Project Overview

Timeline Studio is a professional video editing application built with modern web technologies and native performance. Our goal is to create a DaVinci Resolve-level editor that's accessible to everyone.

![Timeline Interface](/public/screen3.png)

### Project Status (June 2025)

**Overall Completion: 73.5%**
- ✅ Core editing functionality complete
- ✅ Video Compiler with GPU acceleration
- ✅ Recognition module (YOLO v11)
- ✅ Effects, filters, and transitions (75-80%)
- ✅ Export - local export fully working! (75%)
- ✅ Unified preview system with Preview Manager
- ✅ Media persistence and temp projects
- ⚠️ Timeline at 90% completion
- ⚠️ Resources panel in development (40%)
- 🎯 Target MVP release: End of June 2025

## Key Features

- 🎬 Professional video editing with multi-track timeline
- 🖥️ Cross-platform (Windows, macOS, Linux)
- 🚀 GPU-accelerated video processing (NVENC, QuickSync, VideoToolbox)
- 🤖 AI-powered object/face recognition (YOLO v11 - ORT fixed)
- 🎨 30+ transitions, visual effects, and filters
- 📝 Advanced subtitle system with 12 styles and animations
- 🎵 Multi-track audio editing with effects
- 📤 Export to MP4/MOV/WebM with presets for social media
- 🧠 State management using XState v5
- 🌐 Internationalization support (13 languages)
- 💾 Smart caching and unified preview system
- 🎨 Modern UI using Tailwind CSS v4, shadcn-ui
- 📚 Complete documentation with 80%+ test coverage

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable version)
- [bun](https://bun.sh/) (latest stable version)
- [ffmpeg](https://ffmpeg.org/download.html) (latest stable version)

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

## Project Structure

```
timeline-studio/
├── bin/                              # Shell scripts
├── docs/                             # Automatically generated documentation
├── ai-gen-docs/                      # AI-generated docs for developers and agents
├── examples/                         # API usage examples
├── promo/                            # GitHub Pages website
├── public/                           # Static files
├── scripts/                          # JavaScript scripts
├── src/                              # Frontend source code (React, XState, Next.js)
│   ├── app/                          # Main application entry point
│   ├── components/                   # Shared components
│   ├── features/                     # Features
│   │   ├── ai-chat/                  # AI chatbot (interactive assistant)
│   │   ├── app-state/                # Global application state
│   │   ├── browser/                  # Media file browser (file panel)
│   │   ├── camera-capture/           # Video/photo camera capture
│   │   ├── effects/                  # Video effects and their parameters
│   │   ├── export/                   # Video and project export
│   │   ├── filters/                  # Video filters (color correction, styles)
│   │   ├── keyboard-shortcuts/       # Keyboard shortcuts and presets
│   │   ├── media/                    # Media file handling (audio/video)
│   │   ├── media-studio/             # Media editing studio
│   │   ├── modals/                   # Modal windows (dialogs)
│   │   ├── music/                    # Music import and management
│   │   ├── options/                  # Export and project settings
│   │   ├── project-settings/         # Project settings (size, fps, etc.)
│   │   ├── recognition/              # Scene and object recognition
│   │   ├── resources/                # Project resource management
│   │   ├── style-templates/          # Styles and design templates
│   │   ├── subtitles/                # Subtitle import and editing
│   │   ├── templates/                # Video templates and presets
│   │   ├── timeline/                 # Main editing timeline
│   │   ├── top-bar/                  # Top control panel
│   │   ├── transitions/              # Video transitions between clips
│   │   ├── user-settings/            # User settings
│   │   ├── video-player/             # Video player
│   │   ├── voice-recording/          # Voice recording and voiceover
│   │   ├── script-generator/         # New: script generation
│   │   ├── montage-planner/          # New: montage planning
│   │   ├── person-identification/    # New: person identification
│   │   ├── scene-analyzer/           # New: scene analysis
│   │   └── README.md                 # Overview of all features
│   ├── i18n/                         # Internationalization
│   ├── lib/                          # Utilities and libraries
│   ├── styles/                       # Global styles
|   ├── test/                         # Test config and utilities
├── src-tauri/                        # Backend (Rust)
│   ├── src/
│   │   ├── main.rs                   # Tauri entry point
│   │   ├── media.rs                  # Media analysis (FFmpeg)
│   │   ├── recognition.rs            # YOLO for objects/faces
│   │   ├── script_generator.rs       # Script generation (Claude/OpenAI/Grok API)
│   │   ├── montage_planner.rs        # Montage planning
│   │   ├── person_identification.rs  # Person identification
│   │   ├── scene_analyzer.rs         # Scene analysis
│   │   └── ai_chat.rs                # Chat processing
└── package.json                      # Node.js dependencies configuration
```

## 📚 Documentation

### 🗂️ Documentation Structure

Each feature contains detailed documentation:

- **`README.md`** - functional requirements, readiness status

## Documentation

### 📚 Main Documentation

- 📚 [Documentation Map](ai-gen-docs/MAP.md) - Complete documentation overview
- 🏗️ [Architecture Guide](ai-gen-docs/ARCHITECTURE.md) - System architecture
- 🧪 [Testing Guide](ai-gen-docs/testing/TESTING.md) - Testing strategies
- 📡 [API Reference](ai-gen-docs/API.md) - Tauri commands reference
- 🚀 [Deployment Guide](ai-gen-docs/deployment/DEPLOYMENT.md) - Build and deployment
- 🛣️ [Roadmap](ai-gen-docs/ROADMAP.md) - Development roadmap

### 📋 Project Documentation

- **`src/features/README.md`** - overview of all features with priorities and status
- **Language versions**: Available in 13 languages via the switcher above

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
- `bun run test:ui` - Run tests with UI interface
- `bun run test:e2e` - Run end-to-end tests with Playwright

### State Machines (XState v5)

The project uses XState v5 for managing complex state logic.

#### ✅ Implemented State Machines (11):

- `appSettingsMachine` - centralized settings management
- `browserStateMachine` - browser state management
- `chatMachine` - AI chat management
- `modalMachine` - modal windows management
- `playerMachine` - video player management
- `resourcesMachine` - timeline resources management
- `userSettingsMachine` - user settings
- `projectSettingsMachine` - project settings
- `mediaMachine` - media files management
- `timelineMachine` - Main timeline state machine

### Testing

The project uses Vitest for unit testing. Tests are located in the feature's __tests__ directory, along with mocks in __mocks__.

#### 🧪 Test Coverage Status:
```bash
⨯ bun run test

 Test Files  179 passed (179)
      Tests  2064 passed | 25 skipped (2089)
   Start at  14:05:54
   Duration  24.49s (transform 5.12s, setup 52.28s, collect 21.39s, tests 21.32s, environment 68.17s, prepare 16.69s)

⨯ bun run test:rust
   test result: ok. 344 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 13.06s

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
