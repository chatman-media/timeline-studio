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
  console.warn('Low quality video')
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

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.