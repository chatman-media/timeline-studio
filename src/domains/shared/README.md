# Shared Domain

Общие компоненты, типы и утилиты, используемые всеми доменами Timeline Studio.

## Обзор

Shared домен содержит переиспользуемые элементы, которые не принадлежат конкретному домену, но необходимы для работы всего приложения. Это включает общие типы, события, контракты между доменами и утилиты.

## Структура

```
shared/
├── contracts/        # Контракты и интерфейсы между доменами
├── events/          # Система событий для межкомпонентной коммуникации
├── hooks/           # Общие React хуки
├── types/           # Общие TypeScript типы
├── utils/           # Утилиты и хелперы
└── index.ts         # Главный экспорт
```

## Domain Event Bus

Централизованная система событий для коммуникации между доменами:

### Базовая структура события

```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')
interface DomainEvent<T = unknown> {
  id: string
  type: string
  domain: string
  timestamp: number
  payload: T
  metadata?: Record<string, any>
}
```

### Использование Event Bus

```typescript
import { domainEventBus } from '@/domains/shared/events'

// Подписка на события
const unsubscribe = domainEventBus.on('media:imported', (event) => {
  logger.debugSync('Files imported:', event.payload.files)
})

// Отправка события
domainEventBus.emit('timeline:changed', {
  action: 'clip-added',
  clipId: 'clip-123',
  trackId: 'video-1'
})

// Отписка
unsubscribe()
```

### Типы событий по доменам

```typescript
// Media Management Events
type MediaManagementEvents = 
  | 'media:imported'
  | 'media:deleted'
  | 'media:renamed'
  | 'media:metadata-updated'
  | 'media:proxy-generated'

// Video Editing Events  
type VideoEditingEvents =
  | 'timeline:changed'
  | 'timeline:saved'
  | 'clip:added'
  | 'clip:removed'
  | 'effect:applied'
  | 'export:started'
  | 'export:completed'

// AI Services Events
type AIServicesEvents =
  | 'analysis:started'
  | 'analysis:completed'
  | 'ai:response-received'
  | 'ai:error'

// Project Management Events
type ProjectManagementEvents =
  | 'project:created'
  | 'project:opened'
  | 'project:saved'
  | 'settings:changed'
  | 'user:logged-in'

// System Integration Events
type SystemIntegrationEvents =
  | 'app:ready'
  | 'window:focus'
  | 'update:available'
  | 'notification:clicked'
```

## Общие типы

### Media Types

Базовые типы для работы с медиафайлами:

```typescript
// Базовый интерфейс медиафайла
interface BaseMediaFile {
  id: string
  path: string
  name: string
  size: number
  createdAt: Date
  modifiedAt: Date
}

// Результат анализа медиа
interface MediaAnalysisResult {
  fileId: string
  duration?: number
  resolution?: Resolution
  fps?: number
  codec?: string
  bitrate?: number
  hasAudio?: boolean
  hasVideo?: boolean
}

// Общие типы разрешения
interface Resolution {
  width: number
  height: number
}

// Временной диапазон
interface TimeRange {
  start: number
  end: number
}
```

## Контракты между доменами

### Service Contracts

Интерфейсы для взаимодействия между доменами:

```typescript
// Контракт для анализа медиа
interface IMediaAnalysisContract {
  analyzeFile(path: string): Promise<MediaAnalysisResult>
  batchAnalyze(paths: string[]): Promise<MediaAnalysisResult[]>
  cancelAnalysis(id: string): Promise<void>
}

// Контракт для экспорта
interface IExportContract {
  export(timeline: Timeline, settings: ExportSettings): Promise<string>
  getProgress(): number
  cancel(): Promise<void>
}

// Контракт для AI сервисов
interface IAIServiceContract {
  sendRequest(prompt: string, context?: any): Promise<string>
  analyzeContent(content: any): Promise<AnalysisResult>
  isAvailable(): boolean
}
```

## Общие хуки

### useDomainEvents

Хук для работы с событиями:

```typescript
import { useDomainEvents } from '@/domains/shared/hooks'

function MyComponent() {
  const events = useDomainEvents()
  
  // Подписка на событие
  useEffect(() => {
    return events.on('timeline:changed', (event) => {
      // Обработка события
    })
  }, [])
  
  // Отправка события
  const handleAction = () => {
    events.emit('action:performed', { 
      action: 'save',
      timestamp: Date.now()
    })
  }
}
```

## Утилиты

### ID Generation

```typescript
import { generateId, generateUUID } from '@/domains/shared/utils'

const id = generateId() // Короткий ID: "abc123"
const uuid = generateUUID() // UUID: "123e4567-e89b-12d3-a456-426614174000"
```

### Time Utilities

```typescript
import { formatTime, parseTime } from '@/domains/shared/utils'

formatTime(125.5) // "2:05.5"
formatTime(3661) // "1:01:01"

parseTime("2:05.5") // 125.5
parseTime("1:01:01") // 3661
```

### File Utilities

```typescript
import { getFileExtension, getFileName, formatFileSize } from '@/domains/shared/utils'

getFileExtension("/path/to/video.mp4") // ".mp4"
getFileName("/path/to/video.mp4") // "video"
formatFileSize(1536000) // "1.5 MB"
```

### Validation

```typescript
import { validators } from '@/domains/shared/utils'

validators.isValidPath("/path/to/file") // true
validators.isValidUrl("https://example.com") // true
validators.isValidEmail("user@example.com") // true
validators.isValidColor("#FF5733") // true
```

## Паттерны взаимодействия

### Pub/Sub между доменами

```typescript
// Publisher (Video Editing Domain)
class TimelineService {
  private eventBus = domainEventBus
  
  addClip(clip: Clip) {
    // Бизнес логика
    this.timeline.addClip(clip)
    
    // Публикация события
    this.eventBus.emit('clip:added', {
      clipId: clip.id,
      trackId: clip.trackId,
      timestamp: Date.now()
    })
  }
}

// Subscriber (AI Services Domain)
class ContentAnalyzer {
  constructor() {
    domainEventBus.on('clip:added', this.handleClipAdded)
  }
  
  private handleClipAdded = async (event) => {
    // Реакция на событие
    await this.analyzeClip(event.payload.clipId)
  }
}
```

### Request/Response через контракты

```typescript
// Запрос из одного домена в другой
async function exportVideo(timeline: Timeline) {
  // Получение сервиса через контракт
  const exportService = container.resolve<IExportContract>('ExportService')
  
  // Использование
  const outputPath = await exportService.export(timeline, {
    format: 'mp4',
    quality: 'high'
  })
  
  return outputPath
}
```

## Exports / Экспорты

### Events System
- `domainEventBus` - централизованная шина событий
- `DomainEvent<T>` - базовый тип события
- `createDomainEvent()` - фабрика событий

### React Hooks
- `useDomainEvents()` - хук для работы с событиями

### Utilities (Utils)
**File Operations:**
- `getFileExtension()`, `getFileName()`, `getDirectory()`
- `formatFileSize()`, `parseFileSize()`
- `isVideoFile()`, `isAudioFile()`, `isImageFile()`
- `normalizePath()`, `sanitizeFileName()`

**Validation:**
- `isValidPath()`, `isValidUrl()`, `isValidEmail()`
- `isValidColor()`, `isValidFileName()`
- `isPositiveNumber()`, `isInRange()`

**Time Utilities:**
- `formatTime()`, `parseTime()`
- `formatDuration()`, `parseDuration()`

**ID Generation:**
- `generateId()` - короткие ID
- `generateUUID()` - UUID v4

**Config:**
- `loadConfig()`, `validateConfig()`

### Types
**Media Types:**
- `BaseMediaFile`, `MediaAnalysisResult`
- `Resolution`, `TimeRange`

**Contracts:**
- `IMediaAnalysisContract`
- `IExportContract`
- `IAIServiceContract`

**AI Tools:**
- AI pipeline types, script generation, content analysis

## Best Practices

1. **Минимальные зависимости**: Shared домен не должен зависеть от других доменов
2. **Стабильность**: Изменения в shared должны быть обратно совместимыми
3. **Документация**: Все публичные интерфейсы должны быть документированы
4. **Версионирование**: При критических изменениях используйте версионирование

## Примеры использования

### Координация между доменами

```typescript
// Сценарий: Импорт файла с анализом и добавлением на таймлайн

// 1. Media Management Domain импортирует файл
const imported = await mediaManager.importFile(filePath)
domainEventBus.emit('media:imported', { file: imported })

// 2. AI Services Domain реагирует и анализирует
domainEventBus.on('media:imported', async (event) => {
  const analysis = await analyzer.analyze(event.payload.file)
  domainEventBus.emit('analysis:completed', { 
    fileId: event.payload.file.id,
    analysis 
  })
})

// 3. Video Editing Domain добавляет на таймлайн
domainEventBus.on('analysis:completed', (event) => {
  if (event.payload.analysis.quality > 0.7) {
    timeline.addMedia(event.payload.fileId)
  }
})
```

## API (Backend Commands)

**Shared домен не имеет прямых Tauri команд** - он предоставляет только общие типы, утилиты и систему событий для других доменов.

### Event Bus API

```typescript
// Публикация события
domainEventBus.emit(eventType: string, payload: any)

// Подписка на событие
domainEventBus.on(eventType: string, handler: Function): UnsubscribeFn

// Отписка
unsubscribe()
```

## Тестирование

### Статистика тестов

```bash
# Запуск тестов
bun run test src/domains/shared/utils/__tests__/

# Результаты
Test Files:  7 файлов (5 основных + 2 дополнительных)
Tests:       264 теста (it blocks)
Coverage:    Высокое покрытие всех утилит
```

### Тестовые наборы

#### file.test.ts
- ✓ File extension extraction (handles multiple dots, case sensitivity)
- ✓ File name parsing and sanitization
- ✓ Directory path extraction
- ✓ File size formatting and parsing
- ✓ Media file type detection (video, audio, image)
- ✓ Path normalization (Unix/Windows compatibility)
- ✓ File name suffix addition

#### validation.test.ts
- ✓ Path validation (Unix/Windows paths, invalid characters)
- ✓ URL validation (protocols, query params, anchors)
- ✓ Email validation (RFC-compliant patterns)
- ✓ Color validation (hex, rgb, rgba, named colors)
- ✓ File name validation (forbidden chars, length limits)
- ✓ File size validation (max size checks)
- ✓ JSON validation (parsing and structure)
- ✓ Numeric validations (positive, non-negative, ranges)
- ✓ String validations (non-empty checks)

#### time.test.ts
- ✓ Time formatting (seconds to HH:MM:SS.ms)
- ✓ Time parsing (HH:MM:SS to seconds)
- ✓ Duration calculations
- ✓ Timecode conversions

#### id.test.ts
- ✓ Unique ID generation
- ✓ UUID v4 generation
- ✓ Collision detection tests
- ✓ ID format validation

#### config.test.ts
- ✓ Configuration loading
- ✓ Default values handling
- ✓ Configuration validation
- ✓ Type safety tests

## Structure / Структура

```
shared/
├── events/              # Domain Event Bus система
│   ├── domain-event-bus.ts
│   └── types.ts
├── hooks/              # React хуки
│   └── use-domain-events.ts
├── types/              # Общие TypeScript типы
│   ├── media.ts        # Медиа файлы и анализ
│   ├── contracts.ts    # Контракты между доменами
│   └── ai-tools/       # AI конфигурации и типы
├── utils/              # Утилиты с тестами
│   ├── file.ts         # Работа с файлами
│   ├── validation.ts   # Валидация данных
│   ├── time.ts         # Временные утилиты
│   ├── id.ts           # Генерация ID
│   └── config.ts       # Конфигурация
└── __mocks__/          # Моки для тестирования
    ├── domain-events.ts
    └── ai-config.ts
```

## Dependencies / Зависимости

**Used by (Используется доменами):**
- `project-management` - типы проектов, события
- `video-editing` - медиа типы, временные утилиты
- `system-integration` - события системы, валидация
- `media-management` - файловые утилиты, медиа типы
- `ai-services` - AI типы и контракты
- `browser` - файловые утилиты, события

**Depends on (Зависит от):**
- Никаких внешних доменов (базовый домен)
- `@/lib/tauri-logger` - только для логирования

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.