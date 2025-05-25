# Timeline Studio

**🌐 Language / Idioma / Langue / Sprache / Язык:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md)

Video editor built with Tauri, React, and XState.

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/website-Promo-brightgreen)](https://chatman-media.github.io/timeline-studio/)
[![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![DeepSource](https://app.deepsource.com/gh/chatman-media/timeline-studio.svg/?label=code+coverage&show_trend=true&token=zE1yrrYR6Jl7GK0R74LZx9MJ)](https://app.deepsource.com/gh/chatman-media/timeline-studio/)

## Project Overview

Timeline Studio is a desktop application for creating and editing videos. The application uses an architecture based on finite state machines (XState) to manage complex state logic.

![Timeline Interface](/public/screen3.png)

## 📊 Development Status

### 🎯 Overall Progress: 76% Complete (13/17 features)

```
Components:     16/17 ✅ (94%)
Hooks:          14/17 ✅ (82%)
Services:       15/17 ✅ (88%)
Tests:          13/17 ✅ (76%)
Documentation:  17/17 ✅ (100%)
```

### 🔥 Critical Tasks

- **Timeline** - requires state machine, hooks, core logic
- **Resources** - requires UI components for management
- **AI Chat** - requires functionality completeness check
- **Options** - requires functionality expansion

### ✅ Ready Components

- **VideoPlayer** - fully functional video player
- **Browser** - media file browser with tabs
- **Media, Music, Effects, Filters, Transitions, Templates** - all ready
- **AppState, Modals, TopBar, MediaStudio** - basic infrastructure

### Key Features

- 🎬 Video project creation and editing
- 🖥️ Cross-platform (Windows, macOS, Linux)
- 🧠 State management with XState v5
- 🌐 Internationalization (i18n) support
- 🎨 Modern UI with Tailwind CSS v4
- 🔍 Strict code quality control with ESLint, Stylelint, and Clippy
- 📚 Complete documentation for all components

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable version)
- [bun](https://bun.sh/) (latest stable version)

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

### Development Mode

```bash
bun tauri dev
```

### Production Build

```bash
bun tauri build
```

## Project Structure

```
timeline-studio/
├── src/                  # Frontend source code (React, Next.js)
│   ├── features/         # Application feature modules (17 features)
│   │   ├── browser/      ✅ # Media file browser with tabs
│   │   ├── media/        ✅ # Media file management
│   │   ├── video-player/ ✅ # Video player with controls
│   │   ├── timeline/     ⚠️ # Timeline (requires work)
│   │   ├── resources/    ⚠️ # Resources (requires UI components)
│   │   ├── ai-chat/      ❓ # AI chat (requires verification)
│   │   ├── options/      ⚠️ # Options panel (requires expansion)
│   │   ├── music/        ✅ # Music files
│   │   ├── effects/      ✅ # Video effects
│   │   ├── filters/      ✅ # Image filters
│   │   ├── transitions/  ✅ # Clip transitions
│   │   ├── subtitles/    ✅ # Subtitles
│   │   ├── templates/    ✅ # Project templates
│   │   ├── modals/       ✅ # Modal windows
│   │   ├── app-state/    ✅ # Global state
│   │   ├── top-bar/      ✅ # Top navigation bar
│   │   ├── media-studio/ ✅ # Root component
│   │   └── OVERVIEW.md   📚 # Overview of all features
│   ├── i18n/             # Internationalization
│   ├── types/            # TypeScript types
│   ├── lib/              # Utilities and libraries
│   └── components/       # Reusable UI components
├── src-tauri/            # Backend source code (Rust)
│   ├── src/              # Rust code
│   └── Cargo.toml        # Rust dependencies configuration
├── public/               # Static files
├── DEV.md                📚 # Developer documentation
├── README.md             📚 # English documentation (main)
├── README.es.md          📚 # Spanish documentation
├── README.fr.md          📚 # French documentation
├── README.de.md          📚 # German documentation
├── README.ru.md          📚 # Russian documentation
└── package.json          # Node.js dependencies configuration
```

## 📚 Documentation

### 🗂️ Documentation Structure

Each feature contains detailed documentation:

- **`README.md`** - functional requirements, readiness status
- **`DEV.md`** - technical architecture, API, data types

### 📋 Key Documents

- **`src/features/OVERVIEW.md`** - overview of all 17 features with priorities
- **`DEV.md`** - application architecture, state machines, development plan
- **`README.md`** - general project information (English)
- **`README.es.md`** - Spanish version of documentation
- **`README.fr.md`** - French version of documentation
- **`README.de.md`** - German version of documentation
- **`README.ru.md`** - Russian version of documentation

## Development

### Available Scripts

- `bun dev` - Run Next.js in development mode
- `bun tauri dev` - Run Tauri in development mode
- `bun build` - Build Next.js
- `bun tauri build` - Build Tauri application

#### Linting and Formatting

- `bun lint` - Check JavaScript/TypeScript code with ESLint
- `bun lint:fix` - Fix ESLint errors
- `bun lint:css` - Check CSS code with Stylelint
- `bun lint:css:fix` - Fix Stylelint errors
- `bun format:imports` - Format imports
- `bun lint:rust` - Check Rust code with Clippy
- `bun format:rust` - Format Rust code with rustfmt
- `bun check:all` - Run all checks and tests
- `bun fix:all` - Fix all linting errors

#### Testing

- `bun test` - Run tests
- `bun test:app` - Run tests only for application components
- `bun test:coverage` - Run tests with coverage report
- `bun test:ui` - Run tests with UI interface
- `bun test:e2e` - Run end-to-end tests with Playwright

### State Machines (XState v5)

The project uses XState v5 for managing complex state logic.

#### ✅ Implemented State Machines (10):

- `appSettingsMachine` - centralized settings management
- `chatMachine` - AI chat management
- `modalMachine` - modal window management
- `playerMachine` - video player management
- `resourcesMachine` - timeline resources management
- `musicMachine` - music file management
- `userSettingsMachine` - user settings
- `projectSettingsMachine` - project settings
- `mediaListMachine` - media file list management
- `templateListMachine` - template management

#### ❌ Require Implementation (2):

- `timelineMachine` - **CRITICAL!** Main timeline state machine
- `optionsMachine` - options panel management

See `DEV.md` for details.

### Testing

The project uses Vitest for unit testing. Tests are located next to the tested files with `.test.ts` or `.test.tsx` extensions.

```bash
# Run all tests
bun test

# Run tests with coverage report
bun test:coverage
```

## License

This project is distributed under the MIT License with Commons Clause.

**Main Terms:**

- **Open Source**: You can freely use, modify, and distribute the code in accordance with the MIT license terms.
- **Commercial Use Restriction**: Commons Clause prohibits "selling" the software without a separate agreement with the author.
- **"Selling"** means using the software functionality to provide third parties with a product or service for a fee.

This license allows:

- Using the code for personal and non-commercial projects
- Studying and modifying the code
- Distributing modifications under the same license

But prohibits:

- Creating commercial products or services based on the code without a license

For a commercial license, please contact the author: ak.chatman.media@gmail.com

Full license text is available in the [LICENSE](./LICENSE) file.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tauri Documentation](https://v2.tauri.app/start/)
- [XState Documentation](https://xstate.js.org/docs/)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Stylelint Documentation](https://stylelint.io/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [TypeDoc Documentation](https://typedoc.org/)

## GitHub Pages

The project uses GitHub Pages to host API documentation and promo page:

- **Promo Page**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **API Documentation**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Both pages are automatically updated when corresponding files change in the `main` branch via GitHub Actions workflows.
