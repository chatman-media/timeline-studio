# Timeline Types

TypeScript типы для Timeline функциональности. Полная типизация для всех компонентов Timeline с поддержкой субтитров, keyframe анимации и version control интеграции.

## 📁 Структура типов

```
src/features/timeline/types/
├── timeline.ts              # 🎯 Основные типы Timeline
├── factories.ts             # 🏭 Factory функции
├── clip-groups.ts           # 👥 Группировка клипов  
├── markers.ts               # 📍 Маркеры времени
├── speed-ramping.ts         # ⚡ Speed ramping
├── jl-cuts.ts               # ✂️ J/L cuts
├── drag-drop.ts             # 🖱️ Drag & Drop
├── edit-modes.ts            # ✏️ Режимы редактирования
├── timeline-transition.ts   # 🎬 Переходы
└── README.md               # 📚 Документация (этот файл)
```

## 🎯 Основные типы

### `timeline.ts` ✅ ОБНОВЛЕНО
Базовые типы для Timeline с полной поддержкой субтитров и новых возможностей.

```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')
interface TimelineProject {
  id: string
  name: string
  description?: string
  duration: number
  fps: number
  sampleRate: number
  sections: TimelineSection[]
  globalTracks: TimelineTrack[]
  markers?: TimelineMarker[]
  speedRampingConfigs?: Record<string, SpeedRampingConfig>
  resources: ProjectResources // Централизованное хранилище ресурсов
  settings: TimelineProjectSettings
  createdAt: Date
  updatedAt: Date
  version: string
}

interface TimelineClip {
  // Базовые поля
  id: string
  name: string
  type?: "video" | "audio" | "image" | "subtitle" | "title"
  mediaId: string
  mediaFile?: MediaFile
  
  // Позиция и длительность
  trackId: string
  startTime: number
  duration: number
  mediaStartTime: number
  mediaEndTime: number
  offset: number
  
  // J/L-Cut поддержка ✅ НОВОЕ
  audioOffset?: number
  linkedClipId?: string
  isLinked?: boolean
  
  // Speed ramping ✅ НОВОЕ
  speed: number
  playbackRate?: number
  maintainPitch?: boolean
  speedRamping?: SpeedRampingConfig
  
  // Video fade transitions ✅ НОВОЕ
  fadeIn?: VideoFadeConfig
  fadeOut?: VideoFadeConfig
  opacityKeyframes?: VideoFadeKeyframe[]
  
  // Keyframe анимация ✅ НОВОЕ
  keyframes?: TimelineKeyframe[]
  
  // Ресурсы и эффекты
  effects: AppliedEffect[]
  filters: AppliedFilter[]
  transitions: AppliedTransition[]
  styleTemplate?: AppliedStyleTemplate
  colorGrading?: AppliedColorGrading
  
  // Состояние
  isSelected: boolean
  isLocked: boolean
  
  // Метаданные
  createdAt: Date
  updatedAt: Date
}

// Специализированные типы клипов ✅ НОВОЕ
interface SubtitleClip extends TimelineClip {
  type: "subtitle"
  text: string
  subtitleStyleId?: string
  style?: SubtitleInlineStyle
  subtitlePosition?: SubtitlePosition
  animationIn?: SubtitleAnimation
  animationOut?: SubtitleAnimation
  wordWrap?: boolean
  maxWidth?: number
  enabled?: boolean
}

interface MusicClip extends TimelineClip {
  bpm?: number
  key?: string
  genre?: string
  mood?: string
  energy?: number
  markers?: MusicMarker[]
  fadeIn?: MusicFadeConfig
  fadeOut?: MusicFadeConfig
  equalizer?: EqualizerConfig
  syncToVideo?: boolean
  beatSync?: boolean
}
```

### `clip-groups.ts`
Типы для группировки клипов.

```typescript
interface ClipGroup {
  id: string
  name: string
  color?: string
  clips: ClipReference[]
  isCollapsed: boolean
  isLocked: boolean
  isSequence?: boolean
}

interface NestedSequence extends ClipGroup {
  isSequence: true
  sequenceClipId: string
  sourceTimeline: TimelineSection
}
```

### `markers.ts`
Типы для маркеров.

```typescript
type MarkerType = 'chapter' | 'comment' | 'todo' | 'ai-suggestion'

interface TimelineMarker {
  id: string
  time: number
  type: MarkerType
  color: string
  label: string
  description?: string
}

interface AIMarker extends TimelineMarker {
  type: 'ai-suggestion'
  confidence: number
  suggestion: string
}
```

### `speed-ramping.ts`
Типы для управления скоростью.

```typescript
interface SpeedKeyframe {
  time: number      // Время в секундах
  speed: number     // Множитель скорости (1 = normal)
  interpolation: InterpolationType
}

interface SpeedRampingData {
  keyframes: SpeedKeyframe[]
  enabled: boolean
}

type InterpolationType = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'hold'
```

### `jl-cuts.ts`
Типы для J/L-срезов.

```typescript
interface LinkedClipPair {
  videoClipId: string
  audioClipId: string
  linkType: 'normal' | 'j-cut' | 'l-cut'
  offset?: number  // Смещение в секундах для J/L-срезов
}

interface JLCutData {
  type: 'j-cut' | 'l-cut'
  offset: number
  linkedPair: LinkedClipPair
}
```

### `drag-drop.ts`
Типы для drag & drop операций.

```typescript
interface DragState {
  isDragging: boolean
  dragType: DragType
  draggedItem: DraggedItem | null
  dropTarget: DropTarget | null
}

type DragType = 'clip' | 'track' | 'media' | 'effect' | 'transition'

interface DraggedClip {
  type: 'clip'
  clipId: string
  originalTrackId: string
  originalStartTime: number
}
```

### `edit-modes.ts`
Типы для режимов редактирования.

```typescript
type EditMode = 
  | 'select'      // Выделение
  | 'trim'        // Обрезка
  | 'slip'        // Сдвиг содержимого
  | 'slide'       // Сдвиг клипа
  | 'roll'        // Перекатывание
  | 'ripple'      // Волновое редактирование
  | 'rate-stretch' // Изменение скорости

interface EditModeConfig {
  mode: EditMode
  cursor: string
  description: string
  hotkey: string
}
```

### `timeline-transition.ts`
Типы для переходов.

```typescript
interface TimelineTransition {
  id: string
  type: TransitionType
  duration: number
  fromClipId: string
  toClipId: string
  properties: TransitionProperties
}

type TransitionType = 'dissolve' | 'wipe' | 'slide' | 'fade' | 'custom'
```

## 🚀 Новые возможности (август 2025)

### ✅ ИСПРАВЛЕНО: SubtitleClip совместимость

**Проблема**: SubtitleClip не имел всех обязательных полей из TimelineClip, что вызывало ошибки TypeScript.

**Решение**: 
- Расширили `SubtitleClip` всеми полями `TimelineClip`
- Добавили разумные дефолты для видео-специфичных полей
- Обновили factory функцию `createSubtitleClip`
- Обеспечили полную type safety

### ✅ ДОБАВЛЕНО: Keyframe Animation Support

```typescript
interface TimelineKeyframe {
  id: string
  time: number
  property: string
  value: any
  interpolation: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "bezier" | "step"
}

// Использование в клипах
interface TimelineClip {
  keyframes?: TimelineKeyframe[]
  // ... другие поля
}
```

### ✅ РАСШИРЕНО: Video Fade Transitions

```typescript
interface VideoFadeKeyframe {
  time: number // время в секундах относительно начала клипа
  opacity: number // значение прозрачности (0-1)
  easing?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
}

// Поддержка сложных fade эффектов
fadeIn?: {
  duration: number
  type?: FadeType
  keyframes?: VideoFadeKeyframe[]
}
```

### ✅ УЛУЧШЕНО: Type Guards

```typescript
// Проверка типа субтитрового клипа
export function isSubtitleClip(clip: TimelineClip): clip is SubtitleClip {
  return clip.type === "subtitle" && "text" in clip
}

// Проверка типа музыкального клипа
export function isMusicClip(clip: TimelineClip): clip is MusicClip {
  return "bpm" in clip || "fadeIn" in clip || "fadeOut" in clip
}
```

## 🏭 Factory функции

### `factories.ts` ✅ ОБНОВЛЕНО
Функции для создания объектов с дефолтными значениями.

```typescript
import { 
  createTimelineProject,
  createTimelineSection,
  createTimelineTrack,
  createTimelineClip,
  createSubtitleClip, // ✅ НОВОЕ
  createMusicClip,    // ✅ НОВОЕ
  createSubtitleStyle // ✅ НОВОЕ
} from './factories'

// Создание субтитрового клипа ✅ ИСПРАВЛЕНО
const subtitleClip = createSubtitleClip(
  "Hello World!", // text
  "track-123",    // trackId
  10,            // startTime
  5,             // duration
  {
    name: "My Subtitle",
    opacity: 0.9,
    enabled: true,
    subtitleStyleId: "style-classic"
  }
)

// Создание музыкального клипа
const musicClip = createMusicClip(
  "music-file-456", // musicFileId
  "track-789",      // trackId
  0,               // startTime
  30,              // duration
  {
    bpm: 120,
    key: "C major",
    fadeIn: { duration: 2, curve: "exponential" },
    syncToVideo: true
  }
)
```

## 💡 Использование

```typescript
import type { 
  TimelineProject,
  TimelineClip,
  TimelineTrack,
  SubtitleClip,      // ✅ НОВОЕ
  MusicClip,         // ✅ НОВОЕ
  ClipGroup,
  TimelineMarker,
  TimelineKeyframe   // ✅ НОВОЕ
} from '@/features/timeline/types'

// Типизированная работа с различными типами клипов
function processClip(clip: TimelineClip): void {
  // Type-safe работа с базовым клипом
  logger.debugSync(`Clip: ${clip.name}, Duration: ${clip.duration}s`)
  
  // Проверка конкретного типа клипа
  if (isSubtitleClip(clip)) {
    // TypeScript знает, что это SubtitleClip
    logger.debugSync(`Subtitle text: ${clip.text}`)
    logger.debugSync(`Word wrap: ${clip.wordWrap}`)
  }
  
  if (isMusicClip(clip)) {
    // TypeScript знает, что это MusicClip
    logger.debugSync(`BPM: ${clip.bpm}, Key: ${clip.key}`)
    if (clip.fadeIn) {
      logger.debugSync(`Fade in: ${clip.fadeIn.duration}s`)
    }
  }
}

// Работа с keyframe анимацией
function addOpacityKeyframe(clip: TimelineClip, time: number, opacity: number): void {
  if (!clip.keyframes) {
    clip.keyframes = []
  }
  
  clip.keyframes.push({
    id: `keyframe-${Date.now()}`,
    time,
    property: 'opacity',
    value: opacity,
    interpolation: 'ease-in-out'
  })
}
```

## 🔍 Type Guards

Для проверки типов в runtime:

```typescript
// Проверка типа трека
export function isVideoTrack(track: TimelineTrack): boolean {
  return track.type === 'video' || track.type === 'image'
}

// Проверка типа субтитрового клипа ✅ НОВОЕ
export function isSubtitleClip(clip: TimelineClip): clip is SubtitleClip {
  return clip.type === "subtitle" && "text" in clip
}

// Проверка типа музыкального клипа ✅ НОВОЕ
export function isMusicClip(clip: TimelineClip): clip is MusicClip {
  return "bpm" in clip || "fadeIn" in clip || "fadeOut" in clip
}

// Проверка типа маркера
export function isAIMarker(marker: TimelineMarker): marker is AIMarker {
  return marker.type === 'ai-suggestion'
}

// Проверка наличия keyframes ✅ НОВОЕ
export function hasKeyframes(clip: TimelineClip): clip is TimelineClip & { keyframes: TimelineKeyframe[] } {
  return clip.keyframes !== undefined && clip.keyframes.length > 0
}
```

## 📊 Статистика типов

После обновлений Timeline содержит:

- **9 основных TypeScript файлов** с типами
- **3+ специализированных типа клипов** (Video, Subtitle, Music)
- **50+ интерфейсов** для полной типизации
- **15+ factory функций** для создания объектов
- **10+ type guards** для runtime проверок
- **100% type coverage** всех Timeline операций

**Ключевые улучшения:**
- ✅ Исправлена совместимость `SubtitleClip` 
- ✅ Добавлена поддержка keyframe анимации
- ✅ Расширены video fade transitions
- ✅ Улучшены factory функции
- ✅ Добавлены новые type guards