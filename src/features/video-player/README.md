# Video Player Module

**English** | [Русский](./README.ru.md)

## 📋 Module Overview

The Video Player module provides comprehensive video playback functionality with support for various formats, effects preview, transitions, HDR content, and full integration with the Timeline Studio ecosystem. The module uses a state machine architecture for robust playback control and integrates with Tauri for desktop functionality.

## 📊 Current Status

- ✅ **Components**: Fully implemented (100% test coverage)
- ✅ **Hooks**: Fully implemented (100% test coverage)  
- ✅ **Services**: State machine and provider ready (100% test coverage)
- ✅ **Tests**: Complete coverage (257 tests, all passing)
- ✅ **Core Logic**: Playback, controls, UI, effects preview
- ✅ **Tauri Integration**: Full desktop support via convertVideoSrc
- ✅ **Backend Sync**: Real-time state synchronization with Rust backend

## 📁 File Structure

```
src/features/video-player/
├── components/
│   ├── video-player.tsx ✅ (main player component)
│   ├── player-controls.tsx ✅ (playback controls)
│   ├── volume-slider.tsx ✅ (volume control)
│   ├── player-ai-overlay.tsx ✅ (AI analysis overlay)
│   ├── player-ai-controls.tsx ✅ (AI controls)
│   ├── enhanced-video-player.tsx ✅ (with prerender)
│   ├── hdr-video-player.tsx ✅ (HDR support)
│   ├── effects-preview-player.tsx ✅ (effects preview)
│   ├── video-player-with-transitions.tsx ✅ (transitions)
│   ├── transition-preview-settings.tsx ✅
│   ├── transition-player-overlay.tsx ✅
│   └── prerender-controls.tsx ✅
├── hooks/
│   ├── use-fullscreen.ts ✅
│   ├── use-player-ai-analysis.ts ✅
│   ├── use-player-speed-ramping.ts ✅
│   ├── use-transition-preview.ts ✅
│   ├── use-video-element.ts ✅
│   └── use-video-selection.ts ✅
├── services/
│   ├── player-machine.ts ✅ (XState state machine)
│   ├── player-provider.tsx ✅ (React Context provider)
│   ├── frame-capture-service.ts ✅ (frame capture)
│   ├── codec-support.ts ✅ (codec detection)
│   ├── hdr-support.ts ✅ (HDR functionality)
│   ├── effects-preview.ts ✅ (effects preview)
│   ├── filters-preview.ts ✅ (filters preview)
│   └── transitions-preview.ts ✅ (transitions preview)
├── __tests__/
│   ├── components/ (100% coverage)
│   ├── hooks/ (100% coverage)
│   └── services/ (100% coverage)
└── index.ts ✅
```

## 🎯 Main Features

### ✅ Implemented Features

#### Video Playback
- [x] Load and display video files with various formats
- [x] Play/pause functionality
- [x] Automatic aspect ratio handling
- [x] Format support via Tauri desktop integration
- [x] Metadata preloading
- [x] HDR content support
- [x] Multiple player variants (basic, enhanced, HDR, effects)

#### Playback Controls
- [x] Play/pause buttons
- [x] Seek forward/backward
- [x] Jump to start/end
- [x] Frame-by-frame navigation
- [x] Volume control with slider
- [x] Fullscreen mode
- [x] Recording from camera
- [x] Grid overlay for composition
- [x] Adaptive UI

#### Time Navigation
- [x] Progress slider with seek
- [x] Current time display
- [x] Total duration display
- [x] Click to seek functionality
- [x] Frame-accurate navigation

#### Advanced Features
- [x] AI content analysis overlay
- [x] Effects preview in real-time
- [x] Transitions preview
- [x] Prerender support with caching
- [x] Multi-format codec support
- [x] Backend state synchronization
- [x] Keyboard shortcuts support

### ✅ Recently Added
- [x] **Playback speed control** - Simple UI for real-time speed adjustment (0.25x - 2x)
  - Integrated with existing `use-player-speed-ramping` hook
  - Advanced speed options available in Options panel
  - No duplication with `SpeedSettings` component
- [x] **GPU acceleration status** - Using existing `GpuStatusBadge` from video-compiler
  - Hardware acceleration detection via WebGL2
  - NVIDIA/AMD encoder support
  - Real-time GPU utilization monitoring

### ❌ Planned Improvements

#### Advanced Playback Features
- [ ] A-B loop repeat
- [ ] Bookmarks/markers
- [ ] Subtitles support

#### Video Analysis
- [ ] Histogram display
- [ ] Vectorscope
- [ ] Codec information display
- [ ] Bitrate statistics

## 🎨 UI/UX Features

### ✅ Implemented

#### Layout
- [x] Adaptive aspect ratio
- [x] Video centering
- [x] Fixed control panel
- [x] Dark theme
- [x] Responsive design

#### UI Elements
- [x] Modern icons (Lucide)
- [x] Custom styled sliders
- [x] Hover effects on buttons
- [x] Status indicators
- [x] Loading states

#### Interactivity
- [x] Smooth animations
- [x] Responsive controls
- [x] Keyboard navigation
- [x] Button tooltips
- [x] Touch-friendly controls

## 🔧 Technical Implementation

### Architecture
- **XState Machine**: Robust state management for playback
- **React Context**: Global player state access
- **Custom Hooks**: Reusable logic components
- **TypeScript**: Full type safety
- **Tauri Integration**: Desktop file access and URL conversion

### Tauri Integration
```typescript
// Path conversion for desktop app
import { convertVideoSrc } from "@/lib/tauri-utils"

// Backend synchronization
import { getBackendSync } from "@/features/app-state/services/backend-sync"
```

## API (Backend Commands)

| Command | Parameters | Description |
|---------|------------|-------------|
| `Play` | - | Start playback |
| `Pause` | - | Pause playback |
| `Seek` | `{ position: number }` | Seek to position in seconds |
| `SetPlaybackRate` | `{ rate: number }` | Change playback speed (0.25x - 2x) |
| `playerSetMedia` | `{ path: string }` | Load media file |
| `playerSetVolume` | `{ volume: number }` | Set volume level (0.0 - 1.0) |
| `playerSelectClip` | `{ clipId: string }` | Select clip for playback |

### Performance Optimizations
- [x] Efficient video loading
- [x] Prevent unnecessary re-renders
- [x] Optimized sliders
- [x] Lazy component loading
- [x] Memoized components
- [x] Optimized event handlers
- [x] Efficient state management

## 🔄 Integration with Other Modules

### Incoming Dependencies (who uses video-player)
- [`timeline`](../timeline/README.md) - Playback synchronization via `use-timeline-player-sync`
- [`media-studio`](../media-studio/README.md) - All layout components include VideoPlayer
- [`browser`](../browser/README.md) - Video/audio file preview
- [`templates`](../templates/README.md) - Template preview with video
- [`effects`](../effects/README.md)/[`filters`](../filters/README.md) - Effects and filters preview
- [`ai-chat`](../ai-chat/README.md) - AI analysis integration
- [`preview`](../preview/README.md) - Real-time preview
- [`multicam`](../multicam/README.md) - Multi-camera mode

### Outgoing Dependencies (what video-player uses)
- [`project-settings`](../project-settings/README.md) - Aspect ratio settings
- [`app-state`](../app-state/README.md) - Backend sync and commands
- [`timeline`](../timeline/README.md) - Project data access
- [`video-compiler`](../video-compiler/README.md) - Prerender functionality
- [`tauri-utils`](../../lib/tauri-utils.ts) - Video path conversion
- [`ui components`](../../components/ui/) - Base UI components

## 📈 Test Coverage

### Components (100% coverage)
- **VideoPlayer**: 18 tests
  - Basic rendering and empty states
  - Video loading and display
  - Attribute passing
  - Video switching
  - Tauri path conversion

- **PlayerControls**: 25 tests
  - Control element display
  - Playback management
  - Time navigation
  - Volume control
  - Fullscreen mode
  - Source switching

- **Other Components**: 39 tests total
  - VolumeSlider
  - PlayerAiOverlay
  - PrerenderControls

### Hooks (100% coverage)
- **useFullscreen**: 6 tests
- **useVideoElement**: 28 tests
- **usePlayerAiAnalysis**: 26 tests
- **useVideoSelection**: 11 tests

### Services (100% coverage)
- **PlayerMachine**: 40 tests
  - State transitions
  - Command handling
  - Error states

- **PlayerProvider**: 21 tests
  - Backend sync
  - Command execution
  - State management

- **FrameCaptureService**: 39 tests
  - Frame extraction
  - Thumbnail generation

### Overall Metrics
- **Total tests**: 257 (all passing) ✅
- **Test files**: 12
- **Coverage**: 100% for all video-player files

## 🚀 Production Readiness

The module is fully production-ready:
- ✅ Complete functionality for all player variants
- ✅ Full Tauri desktop integration
- ✅ Robust error handling
- ✅ Comprehensive test coverage
- ✅ Performance optimized
- ✅ Accessibility support

## 🔧 Development Commands

```bash
# Run module tests
bun run test src/features/video-player

# Test coverage
bun run test:coverage src/features/video-player

# Type checking
bun run type-check
```

## 🎯 Development Priorities

### High Priority
1. **Timeline Synchronization** - Complete integration
2. **Real-time Effects Display** - Performance optimization
3. **WebGL Video Processing** - Enhanced GPU acceleration

### Medium Priority
1. **A-B Loop Feature** - Repeat fragment functionality
2. **Enhanced Navigation** - Bookmarks and markers
3. **Subtitle Support** - Multiple format support

### Low Priority
1. **Video Analysis** - Histogram, vectorscope
2. **Advanced Playback Settings** - Fine-tuning options
3. **UI Customization** - User preferences

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/video-player/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Загрузка и отображение видео через `convertVideoSrc` | ⏳ Planned | - | 🔴 High |
| Воспроизведение/пауза через команды `Play` и `Pause` | ⏳ Planned | - | 🔴 High |
| Навигация по времени через команду `Seek` | ⏳ Planned | - | 🔴 High |
| Изменение скорости воспроизведения через `SetPlaybackRate` | ⏳ Planned | - | 🔴 High |
| Управление громкостью через `playerSetVolume` | ⏳ Planned | - | 🔴 High |
| Выбор клипа через `playerSelectClip` | ⏳ Planned | - | 🔴 High |
| Загрузка медиа через `playerSetMedia` | ⏳ Planned | - | 🔴 High |
| Отображение прогресса воспроизведения в UI | ⏳ Planned | - | 🔴 High |
| Полноэкранный режим | ⏳ Planned | - | 🟡 Medium |
| Покадровая навигация (вперед/назад) | ⏳ Planned | - | 🟡 Medium |
| Переключение между видео файлами | ⏳ Planned | - | 🟡 Medium |
| AI анализ оверлей | ⏳ Planned | - | 🟡 Medium |
| Превью эффектов в реальном времени | ⏳ Planned | - | 🟡 Medium |
| Превью переходов между клипами | ⏳ Planned | - | 🟡 Medium |
| Поддержка HDR контента | ⏳ Planned | - | 🟡 Medium |
| Горячие клавиши для управления плеером | ⏳ Planned | - | 🟡 Medium |
| Запись с камеры | ⏳ Planned | - | 🟢 Low |
| Сетка для композиции | ⏳ Planned | - | 🟢 Low |
| Обработка ошибок загрузки видео | ⏳ Planned | - | 🟢 Low |

### Приоритеты
- 🔴 High - критичный функционал воспроизведения
- 🟡 Medium - важный функционал для редактирования
- 🟢 Low - дополнительный функционал

### Примечания
- **Пустая папка**: Директория `e2e/tauri/features/video-player/` существует, но не содержит тестов
- **Высокий приоритет**: Модуль является центральным для всей системы, требует comprehensive E2E тестирования
- **Интеграции**: Требуется тестирование интеграций с timeline, effects, AI chat

## 📚 Related Documentation

- [Timeline Module](../timeline/README.md) - Timeline integration
- [Media Studio](../media-studio/README.md) - Layout integration
- [Effects System](../effects/README.md) - Effects preview
- [AI Chat](../ai-chat/README.md) - AI analysis
- [App State](../app-state/README.md) - Backend sync
- [Tauri Backend](../../../src-tauri/README.md) - Desktop integration