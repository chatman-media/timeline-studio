# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Requirements

Before working with this codebase, ensure you have the following dependencies installed:

### Required Dependencies
- **Node.js 18+** and **Bun** - JavaScript runtime and package manager
- **Rust 1.81.0+** - Backend runtime for Tauri
- **FFmpeg** - Video processing library (required for compilation)
  ```bash
  # macOS
  brew install ffmpeg
  
  # Ubuntu/Debian
  sudo apt-get install ffmpeg libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libswscale-dev libswresample-dev pkg-config
  
  # Windows (требуется более сложная настройка)
  # Вариант 1: Использовать vcpkg
  git clone https://github.com/Microsoft/vcpkg.git
  cd vcpkg
  ./bootstrap-vcpkg.bat
  ./vcpkg integrate install
  ./vcpkg install ffmpeg:x64-windows
  
  # Вариант 2: Скачать предсобранные библиотеки
  # 1. Скачайте FFmpeg shared библиотеки с https://www.gyan.dev/ffmpeg/builds/
  # 2. Распакуйте в C:\ffmpeg
  # 3. Добавьте в системные переменные:
  set FFMPEG_DIR=C:\ffmpeg
  set PKG_CONFIG_PATH=C:\ffmpeg\lib\pkgconfig
  
  # Также установите pkg-config для Windows:
  choco install pkgconfiglite
  ```
- **ONNX Runtime** - Machine learning inference (for recognition features)
  ```bash
  # macOS
  brew install onnxruntime
  
  # Add to your shell profile:
  # For bash/zsh (~/.zshrc or ~/.bashrc):
  export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
  
  # For fish (~/.config/fish/config.fish):
  set -gx ORT_DYLIB_PATH /opt/homebrew/lib/libonnxruntime.dylib
  ```

### macOS Development Setup

For local development on macOS, environment variables are automatically loaded:

```bash
# Variables are automatically loaded from .env.local
bun run tauri dev

# Alternative: Use the bash export file if needed
source .env.macos
bun run tauri dev

# Alternative: Run the setup script
source scripts/setup-ffmpeg-macos.sh
bun run tauri dev
```

**Environment variables are now automatically configured:**
- `.env.local` contains all FFmpeg and ONNX Runtime paths for macOS
- No need to manually source files - variables load automatically
- `.env.macos` file remains available as bash export alternative

### Important FFmpeg Configuration Notes

**⚠️ CRITICAL**: FFmpeg paths must NOT be set globally in `.cargo/config.toml` as this breaks cross-platform builds.

**Platform-specific setup:**
- **Windows**: Use `scripts/setup-rust-env-windows.ps1` before building
- **macOS**: Use `.env.local` or export environment variables
- **Linux**: FFmpeg is detected automatically via pkg-config
- **CI/CD**: Each platform sets its own FFmpeg paths in GitHub Actions

**Common issues:**
- If you see Windows paths (`C:\ffmpeg`) in Linux builds, check `.cargo/config.toml`
- Environment variables should be set per-platform, not globally
- In CI, the build script clears incorrect FFmpeg variables automatically

### Platform-specific Tools
- **macOS**: Xcode Command Line Tools
- **Windows**: 
  - Visual Studio 2022 with C++ tools
  - Windows SDK
  - pkg-config (через `choco install pkgconfiglite`)
  - vcpkg или предсобранные FFmpeg библиотеки
  
## CI/CD Configuration

### GitHub Actions Workflows

Проект включает оптимизированные workflow для CI/CD:

1. **`.github/workflows/ci.yml`** - Основной CI pipeline
   - Тестирование фронтенда и бэкенда на всех платформах
   - Оптимизированная установка FFmpeg на Windows (предсобранные библиотеки)
   - Кэширование зависимостей для ускорения сборки

2. **`.github/workflows/quick-check.yml`** - Быстрая валидация
   - Lint и format проверки
   - Критически важные тесты
   - Запускается на каждый push/PR

3. **`.github/workflows/windows-build.yml`** - Специализированная сборка для Windows
   - Оптимизированная установка FFmpeg (избегает зависания vcpkg)
   - Таймауты для предотвращения зависания
   - Кэширование FFmpeg библиотек

### Windows-specific FFmpeg Setup

Для сборки на Windows требуется один из следующих вариантов:

#### Вариант 1: Использование vcpkg (рекомендуется для CI/CD)
```powershell
# Установка vcpkg
git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
cd C:\vcpkg
.\bootstrap-vcpkg.bat
.\vcpkg integrate install

# Установка FFmpeg
.\vcpkg install ffmpeg:x64-windows

# Установка переменных окружения
[System.Environment]::SetEnvironmentVariable('VCPKG_ROOT', 'C:\vcpkg', 'User')
[System.Environment]::SetEnvironmentVariable('PKG_CONFIG_PATH', 'C:\vcpkg\installed\x64-windows\lib\pkgconfig', 'User')
```

#### Вариант 2: Предсобранные библиотеки
```powershell
# Скачать FFmpeg shared libraries
# с https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-full-shared.7z

# Распаковать в C:\ffmpeg

# Установить переменные окружения
[System.Environment]::SetEnvironmentVariable('FFMPEG_DIR', 'C:\ffmpeg', 'User')
[System.Environment]::SetEnvironmentVariable('PKG_CONFIG_PATH', 'C:\ffmpeg\lib\pkgconfig', 'User')
[System.Environment]::SetEnvironmentVariable('PATH', $env:PATH + ';C:\ffmpeg\bin', 'User')
```

#### Вариант 3: Использование MSYS2
```bash
# Установить MSYS2 с https://www.msys2.org/
# В терминале MSYS2:
pacman -S mingw-w64-x86_64-ffmpeg mingw-w64-x86_64-pkg-config
```
- **Linux**: `build-essential`, `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`

## Common Development Commands

### Development
- `bun run dev` - Start Next.js development server with hot reload
- `bun run tauri dev` - Run the full Tauri desktop application in development mode

### Building
- `bun run build` - Build the Next.js frontend
- `bun run tauri build` - Build the production Tauri desktop application

### Testing
- `bun run test` - Run all tests
- `bun run test:watch` - Run tests in watch mode
- `bun run test src/features/timeline/__tests__/use-timeline.test.ts` - Run a single test file
- `bun run test:coverage` - Generate test coverage report
- `bun run test:rust` - Run Rust backend tests
- `bun run test:e2e` - Run Playwright end-to-end tests

### Code Quality
- `bun run lint` - Lint TypeScript/JavaScript files
- `bun run lint:fix` - Auto-fix linting issues
- `bun run check:all` - Run all linting and tests
- `bun run fix:all` - Fix all auto-fixable issues

## High-Level Architecture

Timeline Studio is a desktop video editing application with a feature-based architecture. Key architectural decisions:

### Technology Stack
- **Frontend**: Next.js 15 (React 19) with TypeScript, using static export for Tauri integration
- **Desktop Runtime**: Tauri v2 (Rust) for native desktop capabilities
- **State Management**: XState v5 for complex state machines
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming

### Feature-Based Organization
Each feature in `/src/features/` is self-contained with:
- `components/` - React components
- `hooks/` - Custom React hooks
- `services/` - Business logic and state machines
- `types/` - TypeScript type definitions
- `utils/` - Helper functions
- `__tests__/` - Test files for the feature
- `__mocks__/` - Mock implementations for testing

### State Management Architecture
The application uses XState state machines for complex state management:
- **app-settings-machine** - Application preferences and configuration
- **browser-state-machine** - Media browser state and file selection
- **timeline-machine** - Timeline editing state
- **player-machine** - Video playback control
- **chat-machine** - AI assistant integration
- **modal-machine** - Modal dialog state management
- **project-settings-machine** - Project-specific settings
- **resources-machine** - Resource management (effects, filters, etc.)
- **user-settings-machine** - User preferences and settings

State machines are created using XState's `setup` method for better type safety and should be provided through React context providers.

### Key Features Overview
- **timeline** - Core video editing timeline with tracks, clips, and sections
- **media-studio** - Main editing interface with multiple layout options
- **video-player** - Custom video playback with frame-accurate control
- **browser** - Media file browser with tabbed interface
- **effects/filters/transitions** - Video effect system with CSS-based processing
- **templates** - Multi-camera layout templates for split-screen editing
- **style-templates** - Animated intro/outro and title templates
- **ai-chat** - Integrated AI assistant (Claude/OpenAI)
- **recognition** - Scene/object recognition using YOLO models

### Media Processing
- Video processing is handled through FFmpeg integration
- Media files are referenced by path, not embedded
- Project files use a custom schema for timeline data persistence
- Missing file restoration is handled through the MediaRestorationService

### Internationalization (i18n)
Timeline Studio supports 10 languages with complete localization:
- **Supported Languages**: English, Russian, Spanish, French, German, Portuguese, Chinese, Japanese, Korean, Turkish
- **Frontend Configuration**: Located in `/src/i18n/` with language constants, translation files, and React provider
- **Backend Support**: Rust backend in `/src-tauri/src/language.rs` supports all 10 languages
- **Translation Files**: Each language has a complete JSON file in `/src/i18n/locales/[lang].json`
- **Language Selection**: Users can switch languages via User Settings modal
- **Native Names**: Languages are displayed using their native names (e.g., "中文" for Chinese, "Türkçe" for Turkish)

When adding new languages:
1. Add language code to `LanguageCode` type and `SUPPORTED_LANGUAGES` array in `/src/i18n/constants.ts`
2. Add locale mapping to `LANGUAGE_LOCALES` in same file
3. Create complete translation file `/src/i18n/locales/[lang].json`
4. Import and add to resources object in `/src/i18n/index.ts`
5. Update backend language support in `/src-tauri/src/language.rs`
6. Add native language name to all translation files under `language.native.[lang]`

### Testing Strategy
- Unit tests use Vitest with Testing Library
- Tests are organized in `__tests__/` directories within each feature
- Mocks are organized in `__mocks__/` directories within each feature
- Use custom render function from `@/test/test-utils.tsx` for component tests
- XState machines are tested using actor model and snapshot testing
- All external dependencies (Tauri API, localStorage) are mocked in tests

### Test Environment Setup
The project includes a comprehensive test environment setup:

#### Test Configuration (`src/test/`)
- **`setup.ts`** - Global test setup and essential mocks
  - Configures Jest DOM matchers
  - Sets up cleanup between tests
  - Mocks common providers (UserSettings, Modals, AppState)
  - Configures console methods for test environment
  - Provides TypeScript declarations for custom matchers

- **`mocks/index.ts`** - Centralized mock management
  - Exports commonly used mocks (Tauri, Browser, Libraries)
  - Provides `resetAllMocks()` function for cleanup
  - Offers `setupEssentialMocks()` for initial configuration

- **`utils/README.md`** - Specialized audio testing utilities
  - Complete documentation for Tauri audio component testing
  - Audio mocking utilities (AudioContext, MediaRecorder, HTMLAudioElement)
  - Test data generators for audio files and streams
  - Event simulation helpers for audio lifecycle
  - Integration patterns with Context7 MCP
  - Best practices and troubleshooting guide

#### Testing Utilities Available
- **Audio Testing**: Mock AudioContext, MediaRecorder, audio file operations
- **Tauri API Mocking**: File system, commands, dialogs, notifications
- **Browser API Mocking**: URL, Blob, fetch, localStorage
- **Library Mocking**: External dependencies and services
- **Test Data Creation**: Realistic mock data generators
- **Event Simulation**: User interactions and system events

## Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript strict mode, avoid `any` types
- Import order: builtin → external → internal → sibling/parent → CSS
- Semicolons as needed, double quotes for strings
- Prefer named exports over default exports

### Component Patterns
- Follow existing patterns in the codebase
- Use shadcn/ui components from `/src/components/ui/`
- Create feature-specific components in `/src/features/[feature]/components/`
- Use CSS variables for theming (defined in globals.css)
- Component names use PascalCase but files use kebab-case

### State Management
- Simple state: useState/useReducer
- Complex state: XState machines with proper typing
- Global state: Context providers with custom hooks
- Async operations: Use XState services or React Query patterns

### File Naming
- Components: kebab-case (e.g., `video-player.tsx`)
- Hooks: kebab-case with `use` prefix (e.g., `use-timeline.ts`)
- Utilities: kebab-case (e.g., `media-utils.ts`)
- Services: kebab-case (e.g., `timeline-machine.ts`)
- Types: kebab-case (e.g., `timeline.ts`)
- Test files: Located in `__tests__/` with `.test.ts` or `.test.tsx` suffix
- Mock files: Located in `__mocks__/` with same name as mocked module