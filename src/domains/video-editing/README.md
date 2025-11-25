# Video Editing Domain

Основная бизнес-логика для редактирования видео в Timeline Studio.

## Обзор

Video Editing домен содержит всю логику, связанную с редактированием видео: работа с таймлайном, эффекты, переходы, управление медиафайлами и экспорт проектов.

## Структура

```
video-editing/
├── providers/         # React провайдеры для таймлайна
├── services/          # Сервисы импорта/экспорта
│   └── import-export/ # AAF, FCPXML импортеры/экспортеры
├── types/            # Основные типы домена
│   ├── timeline.ts   # Типы таймлайна
│   ├── media.ts      # Типы медиафайлов
│   ├── effects.ts    # Эффекты и переходы
│   ├── player.ts     # Типы плеера
│   └── context.ts    # Контексты
├── utils/            # Утилиты и адаптеры
└── index.ts          # Главный экспорт
```

## Основные типы

### Timeline Types

```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')
interface TimelineState {
  tracks: Track[]
  duration: number
  currentTime: number
  playbackRate: number
  isPlaying: boolean
  selectedItems: string[]
  zoom: number
  scrollLeft: number
}

interface Track {
  id: string
  name: string
  type: 'video' | 'audio' | 'text' | 'effects'
  clips: Clip[]
  isLocked: boolean
  isMuted: boolean
  height: number
}

interface Clip {
  id: string
  trackId: string
  mediaId: string
  startTime: number // позиция на таймлайне
  duration: number
  inPoint: number // точка входа в исходном файле
  outPoint: number // точка выхода
  effects: Effect[]
  transitions: Transition[]
}
```

### Media Types

```typescript
enum MediaType {
  Video = "video",
  VideoWithAudio = "video_with_audio", 
  StillImage = "still_image",
  SequenceClip = "sequence_clip",
  TitleClip = "title_clip",
  GeneratorClip = "generator_clip"
}

interface MediaFile {
  id: string
  name: string
  path: string
  type: MediaType
  duration?: number
  
  // Видео свойства
  resolution?: { width: number; height: number }
  fps?: number
  codec?: MediaCodec
  colorSpace?: MediaColorSpace
  
  // Аудио свойства
  audioChannels?: number
  audioSampleRate?: number
  
  // Профессиональные метаданные
  timecode?: { start: string; drop_frame: boolean }
  cameraMetadata?: CameraMetadata
  lut?: string
}
```

### Effects & Transitions

```typescript
interface VideoEffect {
  id: string
  type: string
  name: string
  enabled: boolean
  parameters: Record<string, any>
  keyframes?: Keyframe[]
  category: EffectCategory
}

interface TransitionParameters {
  id: string
  type: TransitionType
  duration: number
  easing?: EasingFunction
  direction?: TransitionDirection
  customParameters?: Record<string, any>
}

enum TransitionType {
  Cut = "cut",
  Dissolve = "dissolve",
  Wipe = "wipe",
  Slide = "slide",
  Push = "push",
  Zoom = "zoom",
  Glitch = "glitch"
}
```

## Сервисы

### Import/Export Services

Поддержка профессиональных форматов обмена:

```typescript
// AAF Export (Avid)
import { AAFExporter } from '@/domains/video-editing/services/import-export'

const exporter = new AAFExporter()
const aafData = await exporter.export(timeline, {
  includeMediaFiles: true,
  embedAudio: false
})

// FCPXML Import (Final Cut Pro)
import { FCPXMLImporter } from '@/domains/video-editing/services/import-export'

const importer = new FCPXMLImporter()
const timeline = await importer.import(fcpxmlContent, {
  preserveEffects: true,
  convertColorSpace: true
})
```

### Timeline Context Provider

React контекст для управления состоянием таймлайна:

```typescript
import { TimelineProvider, useTimeline } from '@/domains/video-editing'

function App() {
  return (
    <TimelineProvider>
      <TimelineEditor />
    </TimelineProvider>
  )
}

function TimelineEditor() {
  const { 
    timeline,
    currentTime,
    setCurrentTime,
    addClip,
    removeClip,
    updateClip
  } = useTimeline()
  
  // Работа с таймлайном
}
```

## Утилиты

### Media File Adapter

Адаптер для конвертации между разными форматами MediaFile:

```typescript
import { MediaFileAdapter } from '@/domains/video-editing/utils'

// Конвертация из feature MediaFile в domain MediaFile
const domainFile = MediaFileAdapter.fromFeature(featureFile)

// Конвертация обратно
const featureFile = MediaFileAdapter.toFeature(domainFile)
```

## Интеграция с другими доменами

### С AI Services

```typescript
import { createMediaAnalysisFactory } from '@/domains/ai-services'

// Анализ медиафайла перед добавлением на таймлайн
const factory = createMediaAnalysisFactory()
const analysis = await factory.createFFmpegService()
  .analyzeVideo(mediaFile.path)

// Использование результатов анализа
if (analysis.quality.overall < 50) {
  logger.warnSync('Low quality video')
}
```

### С Project Management

```typescript
import { ProjectSettings } from '@/domains/project-management'

// Применение настроек проекта к таймлайну
const projectSettings = getProjectSettings()
timeline.aspectRatio = projectSettings.aspectRatio
timeline.framerate = projectSettings.framerate
```

## Exports / Экспорты

### React Hooks & Providers
**Timeline Providers:**
- `TimelineProvider` - главный провайдер timeline
- `TimelineClipsProvider` - управление клипами
- `TimelineTracksProvider` - управление дорожками
- `TimelinePlaybackProvider` - воспроизведение
- `TimelineSelectionProvider` - выделение объектов
- `TimelineEffectsProvider` - эффекты
- `TimelineKeyframesProvider` - ключевые кадры
- `TimelineMarkersProvider` - маркеры
- `TimelineProjectProvider` - проект

**Timeline Hooks:**
- `useTimelineClips()`, `useTimelineTracks()`, `useTimelinePlayback()`
- `useTimelineSelection()`, `useTimelineEffects()`, `useTimelineKeyframes()`
- `useTimelineMarkers()`, `useTimelineProject()`

**Undo/Redo:**
- `UndoRedoProvider` - провайдер undo/redo
- `useUndoRedo()` - общий undo/redo хук
- `useClipUndoRedo()`, `useTrackUndoRedo()`, `useKeyframeUndoRedo()`

### State Machines
- `timelineMachine` - UI состояние timeline
- `timelineExtendedMachine` - расширенная логика
- `playerMachine` - управление плеером

### Services
**Orchestrator:**
- `getVideoEditingOrchestrator()` - singleton оркестратор
- `getTimelineActor()`, `getPlayerActor()`, `getTimelineUIActor()`

**Import/Export:**
- `AAFExporter`, `AAFImporter` - Avid AAF формат
- `FCPXMLExporter`, `FCPXMLImporter` - Final Cut Pro XML

**Undo/Redo:**
- `UndoRedoService` - сервис undo/redo
- `UndoRedoHelpers` - вспомогательные функции

### Types
- `TimelineState`, `Track`, `Clip`, `TimelineClip`
- `MediaFile`, `MediaType`, `MediaCodec`, `MediaColorSpace`
- `VideoEffect`, `TransitionParameters`, `TransitionType`
- `PlayerContext`, `PlayerEvent`
- `CameraMetadata`, `Timecode`

### Utilities
- `MediaFileAdapter` - конвертация MediaFile между форматами
- `convertClipToTimelineClip()` - преобразование клипов
- `validateClip()`, `validateProjectEvent()` - валидация
- `projectToTimeline()`, `timelineToProject()` - трансформация

## Best Practices

1. **Иммутабельность**: Всегда создавайте новые объекты при изменении состояния
2. **Нормализация**: Храните медиафайлы отдельно от клипов (по ID)
3. **Валидация**: Проверяйте совместимость форматов при импорте
4. **Производительность**: Используйте виртуализацию для больших таймлайнов

## Примеры

### Добавление клипа на таймлайн

```typescript
const newClip: Clip = {
  id: generateId(),
  trackId: 'video-track-1',
  mediaId: mediaFile.id,
  startTime: 10.0, // 10 секунд от начала
  duration: mediaFile.duration || 5.0,
  inPoint: 0,
  outPoint: mediaFile.duration || 5.0,
  effects: [],
  transitions: []
}

timeline.tracks[0].clips.push(newClip)
```

### Применение эффекта

```typescript
const blurEffect: VideoEffect = {
  id: generateId(),
  type: 'blur',
  name: 'Gaussian Blur',
  enabled: true,
  parameters: {
    radius: 10,
    quality: 'high'
  },
  category: EffectCategory.Blur
}

clip.effects.push(blurEffect)
```

## API (Backend Commands)

Video Editing домен работает через события от backend. Основные категории:

| Event Category | Events | Description |
|----------------|--------|-------------|
| **Project Lifecycle** |||
| `ProjectCreated` | `{ project_id, name }` | Проект создан |
| `ProjectOpened` | `{ project_id, path }` | Проект открыт |
| `ProjectSaved` | `{ project_id }` | Проект сохранен |
| `ProjectClosed` | `{}` | Проект закрыт |
| **Clip Operations** |||
| `ClipAdded` | `{ clip, track_id }` | Клип добавлен на дорожку |
| `ClipMoved` | `{ clip_id, new_start, new_track }` | Клип перемещен |
| `ClipTrimmed` | `{ clip_id, new_in, new_out }` | Клип обрезан |
| `ClipDeleted` | `{ clip_id, track_id }` | Клип удален |
| `ClipUpdated` | `{ clip }` | Клип обновлен |
| `ClipSplit` | `{ original_id, clips[] }` | Клип разделен |
| **Track Management** |||
| `TrackAdded` | `{ track }` | Дорожка добавлена |
| `TrackDeleted` | `{ track_id }` | Дорожка удалена |
| `TrackUpdated` | `{ track }` | Дорожка обновлена |
| **Media Operations** |||
| `MediaAdded` | `{ media_file }` | Медиафайл добавлен |
| `MediaRemoved` | `{ media_id }` | Медиафайл удален |
| `MediaUpdated` | `{ media_file }` | Медиафайл обновлен |
| **Playback Control** |||
| `PlaybackStarted` | `{}` | Воспроизведение запущено |
| `PlaybackStopped` | `{}` | Воспроизведение остановлено |
| `PlaybackSeeked` | `{ time }` | Перемотка на позицию |
| `PlaybackRateChanged` | `{ rate }` | Скорость изменена |

**Примечание:** Все события обрабатываются через `handleBackendEvent()` в `backend-event-handlers.ts` и обновляют XState машины (timeline-machine, player-machine).

## Тестирование

### Статистика тестов

```bash
# Запуск тестов
bun run test src/domains/video-editing/__tests__/

# Результаты
Test Files:  6 файлов
Tests:       204 теста (it blocks)
Lines:       3,254 строк тестового кода
Coverage:    Высокое покрытие машин, утилит и сервисов
```

### Тестовые наборы

#### machines/timeline-machine.test.ts
- ✓ Initial state (idle, empty timeline)
- ✓ Playback state synchronization
- ✓ Time updates and seeking
- ✓ Playback rate changes
- ✓ Edit mode switching (select, trim, split)
- ✓ Snap mode configuration
- ✓ Selection management (clips, tracks, sections)
- ✓ Drag and drop operations
- ✓ Clipboard operations (copy/paste)
- ✓ Zoom and scroll state

#### machines/player-machine.test.ts
- ✓ Player initialization
- ✓ Play/pause toggle
- ✓ Seek operations
- ✓ Playback speed control
- ✓ Volume management
- ✓ Mute/unmute
- ✓ Loop playback
- ✓ Frame-accurate seeking
- ✓ Error handling

#### utils/media-file-adapter.test.ts
- ✓ Feature to domain MediaFile conversion
- ✓ Domain to feature MediaFile conversion
- ✓ Metadata preservation
- ✓ Type compatibility checks
- ✓ Edge cases handling

#### utils/project-transform.test.ts
- ✓ Project serialization
- ✓ Project deserialization
- ✓ Timeline to project conversion
- ✓ Project to timeline conversion
- ✓ Data integrity validation

#### utils/clip-transform.test.ts
- ✓ Backend clip to TimelineClip conversion
- ✓ Clip validation
- ✓ Type safety checks

#### utils/type-validation.test.ts
- ✓ ProjectEvent validation
- ✓ Clip validation
- ✓ Track validation
- ✓ Media file validation

#### services/undo-redo-service.test.ts
- ✓ Undo/redo stack management
- ✓ Action execution
- ✓ State snapshots
- ✓ Clip actions (add, remove, move, trim)
- ✓ Track actions (add, remove, update)
- ✓ Keyframe actions

## Structure / Структура

```
video-editing/
├── hooks/                   # React хуки
│   └── use-undo-redo.ts    # Undo/redo functionality
├── machines/                # XState машины
│   ├── timeline-machine.ts          # UI state
│   ├── timeline-extended-machine.ts # Расширенная логика
│   ├── player-machine.ts            # Плеер
│   └── backend-event-handlers.ts    # Обработчики событий
├── providers/
│   ├── timeline-providers.tsx   # Все timeline провайдеры
│   ├── video-editing-provider.tsx
│   └── undo-redo-provider.tsx
├── services/
│   ├── import-export/       # AAF, FCPXML импорт/экспорт
│   ├── undo-redo-service.ts
│   └── video-editing-orchestrator.ts
├── types/
│   ├── timeline.ts          # Timeline, Track, Clip
│   ├── media.ts            # MediaFile, MediaType
│   ├── effects.ts          # VideoEffect, Transition
│   ├── player.ts           # Player types
│   └── context.ts          # Context types
├── utils/                   # Утилиты и адаптеры
│   ├── media-file-adapter.ts
│   ├── clip-transform.ts
│   ├── project-transform.ts
│   ├── type-validation.ts
│   └── command-queue.ts
└── __tests__/              # Полный набор тестов
```

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Работа с файлами | ✅ Ready | `file-system.spec.ts` | 🔴 High |
| Управление проектами | ✅ Ready | `project-management.spec.ts` | 🔴 High |
| Создание/открытие/закрытие проекта | ⏳ Planned | - | 🔴 High |
| Добавление клипа на таймлайн | ⏳ Planned | - | 🔴 High |
| Перемещение клипа | ⏳ Planned | - | 🔴 High |
| Обрезка клипа (trim) | ⏳ Planned | - | 🔴 High |
| Удаление клипа | ⏳ Planned | - | 🔴 High |
| Разделение клипа (split) | ⏳ Planned | - | 🔴 High |
| Управление дорожками (add/delete/update) | ⏳ Planned | - | 🔴 High |
| Добавление медиа в MediaPool | ⏳ Planned | - | 🔴 High |
| Воспроизведение (play/pause/seek) | ⏳ Planned | - | 🔴 High |
| Скорость воспроизведения | ⏳ Planned | - | 🟡 Medium |
| Undo/Redo операции | ⏳ Planned | - | 🔴 High |
| Применение эффектов | ⏳ Planned | - | 🟡 Medium |
| Применение переходов | ⏳ Planned | - | 🟡 Medium |
| Import/Export AAF | ⏳ Planned | - | 🟡 Medium |
| Import/Export FCPXML | ⏳ Planned | - | 🟡 Medium |

### Приоритеты
- 🔴 High - критичный функционал (проекты, клипы, дорожки, воспроизведение)
- 🟡 Medium - важный функционал (эффекты, переходы, import/export)
- 🟢 Low - дополнительный функционал

### Backend Events для тестирования

```typescript
// Project Lifecycle
ProjectCreated, ProjectOpened, ProjectSaved, ProjectClosed

// Clip Operations
ClipAdded, ClipMoved, ClipTrimmed, ClipDeleted, ClipUpdated, ClipSplit

// Track Management
TrackAdded, TrackDeleted, TrackUpdated

// Media Operations
MediaAdded, MediaRemoved, MediaUpdated

// Playback Control
PlaybackStarted, PlaybackStopped, PlaybackSeeked, PlaybackRateChanged
```

## Dependencies / Зависимости

**Depends on (Зависит от):**
- `@/domains/shared` - events, types, file utilities
- `@/domains/project-management` - project settings
- `@/types/generated/tauri-bindings` - backend types

**Used by (Используется в):**
- `@/features/timeline` - Timeline UI компоненты
- `@/features/video-player` - Плеер компоненты
- `@/features/effects` - Эффекты и фильтры
- `@/features/media-studio` - Главный редактор

## Import/Export Support

### Supported Formats

**Import:**
- AAF (Avid Advanced Authoring Format)
- FCPXML (Final Cut Pro XML)
- Native `.tlproj` format

**Export:**
- AAF (для Avid Media Composer)
- FCPXML (для Final Cut Pro)
- Native `.tlproj` format

### Professional Metadata Support

- **Timecode**: Start timecode, drop frame/non-drop frame
- **Camera Metadata**: Shoot date, camera make/model, lens info
- **Color**: LUT, color space (sRGB, Rec709, etc.)
- **Audio**: Multi-channel audio, sample rate

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.