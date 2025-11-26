# Media Management Domain - API Reference

## Table of Contents

- [Orchestrator](#orchestrator)
- [Types](#types)
- [Provider](#provider)
- [Hooks](#hooks)
- [State Machines](#state-machines)
- [Services](#services)
- [Backend Commands](#backend-commands)

---

## Orchestrator

### MediaManagementOrchestrator

Центральный координатор для всех операций с медиафайлами. Управляет 2 state machines и интегрирует 12 сервисов.

```typescript
import { getMediaManagementOrchestrator } from "@/domains/media-management"

const orchestrator = getMediaManagementOrchestrator()
```

### Public API Methods

#### Media Import

```typescript
// Импорт медиафайлов
await orchestrator.importFiles(
  ['/path/to/video.mp4', '/path/to/audio.mp3'],
  {
    copyToProject: true,
    createProxies: true,
    analyzeContent: true,
    generateThumbnails: true,
    preserveMetadata: true
  }
)

// Выбор файлов через диалог
const files = await orchestrator.selectMediaFiles()

// Выбор аудиофайлов
const audioFiles = await orchestrator.selectAudioFiles()

// Выбор директории с автоимпортом
const directory = await orchestrator.selectMediaDirectory()

// Получение информации о файле
const info = await orchestrator.getMediaInfo('/path/to/file.mp4')

// Извлечение метаданных
const metadata = await orchestrator.extractMetadata('/path/to/file.mp4')
```

#### Camera Import

```typescript
// Обнаружение камер
const cameras = await orchestrator.detectCameras()
// Returns: CameraDevice[]

// Импорт с камеры
const result = await orchestrator.importFromCamera(deviceId, {
  files: selectedFiles,
  deleteAfterImport: false,
  organizeByCamera: true
})
```

#### Proxy Generation

```typescript
// Генерация одного прокси
const proxy = await orchestrator.generateProxy(
  '/path/to/source.mp4',
  '720p',
  {
    codec: 'h264',
    quality: 'medium',
    preserveAudio: true
  }
)

// Пакетная генерация прокси
const proxies = await orchestrator.generateProxies(
  ['/path/file1.mp4', '/path/file2.mov'],
  { resolution: '720p' }
)
```

#### Smart Organization

```typescript
// Организация по дате
const groups = await orchestrator.organizeByDate(files, {
  format: 'YYYY-MM-DD',
  useCreationDate: true
})

// Организация по камерам
const cameraGroups = await orchestrator.organizeByCamera(files, {
  includeModel: true
})
```

#### Waveform Generation

```typescript
// Генерация waveform
const waveform = await orchestrator.generateWaveform(
  '/path/to/audio.mp3',
  {
    samplesPerSecond: 100,
    channels: 2,
    normalize: true
  }
)

// Получение waveform данных
const data = await orchestrator.getWaveformData('/path/to/audio.mp3')
```

#### File Operations

```typescript
// Начать операцию
orchestrator.startFileOperation({
  id: 'op-123',
  type: 'import',
  status: 'pending',
  progress: 0
})

// Обновить прогресс
orchestrator.updateOperationProgress('op-123', 50)

// Завершить операцию
orchestrator.completeOperation('op-123', { result: 'success' })

// Операция не удалась
orchestrator.failOperation('op-123', 'Network error')

// Отменить операцию
orchestrator.cancelOperation('op-123')
```

#### Cache Management

```typescript
// Очистить кэш
await orchestrator.clearCache()

// Получить статистику кэша
const stats = await orchestrator.getCacheStatistics()
// Returns: { previewCount, framesCount, totalSize }
```

#### State Access

```typescript
// Получить MediaPool
const mediaPool = orchestrator.getMediaPool()
// Returns: Map<string, MediaInfo>

// Получить состояние файловых операций
const fileOpsState = orchestrator.getFileOperationsState()

// Получить состояние импорта
const importState = orchestrator.getMediaImportState()

// Проверить загрузку
const isLoading = orchestrator.isMediaLoading()

// Получить ошибку
const error = orchestrator.getError()
```

#### Subscriptions

```typescript
// Подписаться на изменения файловых операций
const unsubscribe1 = orchestrator.subscribeToFileOperations((state) => {
  console.log('File operations state:', state)
})

// Подписаться на изменения импорта
const unsubscribe2 = orchestrator.subscribeToMediaImport((state) => {
  console.log('Media import state:', state)
})

// Отписаться
unsubscribe1.unsubscribe()
unsubscribe2.unsubscribe()
```

#### Error Tracking

```typescript
// Получить статистику ошибок
const errorStats = orchestrator.getErrorStatistics()
// Returns: { total, byType, successRate, reliabilityScore }

// Очистить ошибки
orchestrator.clearErrors()
```

#### Cleanup

```typescript
// Освободить ресурсы (обычно не требуется)
orchestrator.dispose()
```

### Singleton Management

```typescript
import {
  getMediaManagementOrchestrator,
  resetMediaManagementOrchestrator
} from "@/domains/media-management"

// Получить экземпляр (создаётся при первом вызове)
const orchestrator = getMediaManagementOrchestrator()

// Сбросить экземпляр (для тестов)
resetMediaManagementOrchestrator()
```

---

## Types

### MediaType

```typescript
type MediaType = "Video" | "Audio" | "Image" | "Unknown"
```

### MediaInfo

```typescript
interface MediaInfo {
  id?: string
  path: string
  name: string
  type: MediaType
  metadata?: MediaMetadata
  size?: number
  duration?: number
  thumbnailPath?: string
}
```

### MediaMetadata

```typescript
interface MediaMetadata {
  type: "Video" | "Audio" | "Image"
  codec?: string
  album?: string
  artist?: string
  artwork?: string
  title?: string
}
```

### MediaImportOptions

```typescript
interface MediaImportOptions {
  copyToProject?: boolean
  createProxies?: boolean
  analyzeContent?: boolean
  generateThumbnails?: boolean
  preserveMetadata?: boolean
}
```

### MediaFileOperation

```typescript
interface MediaFileOperation {
  id: string
  type: "import" | "export" | "convert" | "extract" | "analyze"
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  error?: string
  result?: any
}
```

### FileOperationsContext

```typescript
interface FileOperationsContext {
  operations: Map<string, MediaFileOperation>
  activeOperations: string[]
  completedOperations: string[]
  failedOperations: string[]
}
```

### MediaImportContext

```typescript
interface MediaImportContext {
  files: string[]
  options: MediaImportOptions
  operations: MediaFileOperation[]
  currentOperation: string | null
  totalProgress: number
  errors: string[]
}
```

### QualityMetrics

```typescript
interface QualityMetrics {
  resolution: string
  bitrate: number
  fps: number
  codec: string
  qualityScore: number
}
```

### SceneDetectionResult

```typescript
interface SceneDetectionResult {
  startTime: number
  endTime: number
  confidence: number
  thumbnailPath?: string
}
```

### MediaAnalysisResult

```typescript
interface MediaAnalysisResult {
  metadata: MediaMetadata
  thumbnailPath?: string
  waveformData?: Float32Array
  scenes?: SceneDetectionResult[]
  quality?: QualityMetrics
}
```

---

## Provider

### MediaManagementProvider

Централизованный провайдер с event-driven архитектурой.

```tsx
import { MediaManagementProvider } from "@/domains/media-management"

function App() {
  return (
    <MediaManagementProvider>
      <YourApp />
    </MediaManagementProvider>
  )
}
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Child components |
| `enableNotifications` | `boolean` | Enable toast notifications |
| `importCallbacks` | `ImportCallbacks` | Custom import callbacks |

**ImportCallbacks:**

```typescript
interface ImportCallbacks {
  onImportStart?: (filesCount: number) => void
  onImportProgress?: (progress: number, filesCount: number) => void
  onImportComplete?: (filesCount: number, duration: number) => void
  onImportError?: (error: string) => void
  onImportCancelled?: () => void
}
```

---

## Hooks

### useMediaManagement()

Основной хук для работы с медиа.

```typescript
import { useMediaManagement } from "@/domains/media-management"

const {
  // State
  mediaPool,
  fileOperationsState,
  mediaImportState,
  isReady,
  isLoading,
  error,

  // Actions
  importFiles,
  selectMediaFiles,
  selectAudioFiles,
  selectMediaDirectory,
  getMediaInfo,
  extractMetadata
} = useMediaManagement()
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `mediaPool` | `Map<string, MediaInfo>` | Пул медиафайлов проекта |
| `fileOperationsState` | `object` | Состояние файловых операций |
| `mediaImportState` | `object` | Состояние импорта |
| `isReady` | `boolean` | Провайдер готов |
| `isLoading` | `boolean` | Загрузка в процессе |
| `error` | `string \| null` | Текущая ошибка |

**Actions:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `importFiles` | `(files: string[], options: MediaImportOptions) => Promise<any[]>` | Импорт файлов |
| `selectMediaFiles` | `() => Promise<string[] \| null>` | Выбор медиафайлов через диалог |
| `selectAudioFiles` | `() => Promise<string[] \| null>` | Выбор аудиофайлов |
| `selectMediaDirectory` | `() => Promise<string \| null>` | Выбор директории |
| `getMediaInfo` | `(path: string) => Promise<MediaInfo>` | Получить информацию о файле |
| `extractMetadata` | `(path: string) => Promise<MediaMetadata>` | Извлечь метаданные |

### useMediaImport()

Хук для импорта медиафайлов.

```typescript
import { useMediaImport } from "@/domains/media-management"

const mediaImport = useMediaImport()

await mediaImport.importFiles([
  '/path/to/video1.mp4',
  '/path/to/video2.mov'
], {
  copyToProject: true,
  generateProxies: true
})
```

### useFileOperations()

Хук для файловых операций.

```typescript
import { useFileOperations } from "@/domains/media-management"

const fileOps = useFileOperations()

await fileOps.copyFiles(files, destinationPath)
await fileOps.moveFiles(files, destinationPath)
await fileOps.renameFile(file, newName)
await fileOps.deleteFiles(files, { moveToTrash: true })
```

### useMediaMetadata()

Хук для работы с метаданными.

```typescript
import { useMediaMetadata } from "@/domains/media-management"

const metadata = useMediaMetadata()

const info = await metadata.getMetadata(filePath)
await metadata.updateMetadata(filePath, { tags: ['vacation'] })
```

---

## State Machines

### fileOperationsMachine

XState машина для управления файловыми операциями.

```typescript
import { fileOperationsMachine } from "@/domains/media-management"
import { createActor } from "xstate"

const actor = createActor(fileOperationsMachine)
actor.start()

// Events
actor.send({ type: "START_OPERATION", operation: {...} })
actor.send({ type: "UPDATE_PROGRESS", operationId: "...", progress: 50 })
actor.send({ type: "COMPLETE_OPERATION", operationId: "...", result: {...} })
actor.send({ type: "FAIL_OPERATION", operationId: "...", error: "..." })
actor.send({ type: "CANCEL_OPERATION", operationId: "..." })
actor.send({ type: "CLEAR_COMPLETED" })
actor.send({ type: "RETRY_FAILED", operationId: "..." })
```

**Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `START_OPERATION` | `{ operation: MediaFileOperation }` | Начать операцию |
| `UPDATE_PROGRESS` | `{ operationId, progress }` | Обновить прогресс |
| `COMPLETE_OPERATION` | `{ operationId, result }` | Завершить операцию |
| `FAIL_OPERATION` | `{ operationId, error }` | Ошибка операции |
| `CANCEL_OPERATION` | `{ operationId }` | Отменить операцию |
| `CLEAR_COMPLETED` | - | Очистить завершенные |
| `RETRY_FAILED` | `{ operationId }` | Повторить неудачную |

**Emitted Events:**

| Event | Description |
|-------|-------------|
| `file.operation.started` | Операция начата |
| `file.operation.completed` | Операция завершена |
| `file.operation.failed` | Операция не удалась |

### mediaImportMachine

XState машина для импорта медиа.

**States:** `idle` → `scanning` → `importing` → `analyzing` → `complete` | `error`

---

## Services

### CameraImportService

Импорт с камер и устройств.

```typescript
import { CameraImportService, getCameraImport } from "@/domains/media-management"

const service = getCameraImport()
const devices = await service.detectDevices()
await service.importFromDevice(deviceId, options)
```

**Types:**

```typescript
interface CameraDevice {
  id: string
  name: string
  type: string
  path: string
}

interface CameraFile {
  path: string
  name: string
  size: number
  date: Date
}

interface CameraImportOptions {
  files: CameraFile[]
  deleteAfterImport?: boolean
  organizeByCamera?: boolean
}
```

### ProxyGeneratorService

Генерация прокси-файлов.

```typescript
import { ProxyGeneratorService, getProxyGenerator } from "@/domains/media-management"

const proxyGen = getProxyGenerator()

const proxy = await proxyGen.generateProxy(sourceFile, {
  resolution: { width: 1280, height: 720 },
  codec: 'h264',
  quality: 'medium'
})
```

**Types:**

```typescript
type ProxyQuality = "low" | "medium" | "high"
type ProxyResolution = "480p" | "720p" | "1080p" | "custom"

interface ProxyGenerationOptions {
  resolution: ProxyResolution | { width: number; height: number }
  codec?: string
  quality?: ProxyQuality
  preserveAudio?: boolean
}

interface ProxyGenerationResult {
  path: string
  size: number
  duration: number
}
```

### SmartOrganizationService

Умная организация медиатеки.

```typescript
import { SmartOrganizationService, getSmartOrganization } from "@/domains/media-management"

const organizer = getSmartOrganization()

await organizer.organizeByDate(files, { format: 'YYYY-MM-DD' })
await organizer.organizeByCamera(files)
await organizer.organizeByEvents(files, { gapThreshold: 3600 })
```

**Types:**

```typescript
type DateFormat = "YYYY-MM-DD" | "YYYY/MM/DD" | "DD-MM-YYYY"

interface OrganizeByDateOptions {
  format: DateFormat
  useCreationDate?: boolean
}

interface OrganizeByCameraOptions {
  includeModel?: boolean
}

interface OrganizeByEventsOptions {
  gapThreshold: number // seconds
  detectByTimestamp?: boolean
}

interface MediaGroup {
  name: string
  files: string[]
  date?: Date
}

interface OrganizationResult {
  groups: MediaGroup[]
  movedFiles: number
  errors: string[]
}
```

### WaveformGeneratorService

Генерация аудио waveform.

```typescript
import { WaveformGeneratorService, getWaveformGenerator } from "@/domains/media-management"

const waveformGen = getWaveformGenerator()

const waveform = await waveformGen.generate(audioPath, {
  samplesPerSecond: 100,
  channels: 2
})
```

**Types:**

```typescript
interface WaveformOptions {
  samplesPerSecond?: number
  channels?: number
  normalize?: boolean
}

interface WaveformData {
  samples: Float32Array[]
  duration: number
  sampleRate: number
}

interface WaveformResult {
  data: WaveformData
  path?: string
}
```

### IndexedDBCacheService

Кэширование в IndexedDB.

```typescript
import { IndexedDBCacheService, indexedDBCacheService } from "@/domains/media-management"

// Cache preview
await indexedDBCacheService.cachePreview(mediaId, previewData)

// Get cached preview
const preview = await indexedDBCacheService.getPreview(mediaId)

// Statistics
const stats = await indexedDBCacheService.getStatistics()
```

**Types:**

```typescript
interface CachedPreview {
  mediaId: string
  data: Blob
  timestamp: number
}

interface CachedFrames {
  mediaId: string
  frames: Blob[]
  fps: number
}

interface CachedRecognition {
  mediaId: string
  results: any
}

interface CachedSubtitles {
  mediaId: string
  subtitles: any
}

interface CacheStatistics {
  previewCount: number
  framesCount: number
  totalSize: number
}
```

### ErrorTrackerService

Отслеживание и восстановление ошибок.

```typescript
import { ErrorTrackerService, getErrorTracker } from "@/domains/media-management"

const tracker = getErrorTracker()

tracker.trackError('import', 'file.mp4', new Error('Failed'))
const stats = tracker.getOperationStats('import')
const score = tracker.getReliabilityScore()
```

**Types:**

```typescript
type ErrorType = "import" | "export" | "convert" | "analyze"

interface ErrorRecord {
  type: ErrorType
  file: string
  error: Error
  timestamp: Date
  retries: number
}

interface ErrorStats {
  total: number
  byType: Record<ErrorType, number>
}

interface OperationStats {
  success: number
  failure: number
  successRate: number
}

interface RetryConfig {
  maxRetries: number
  initialDelay: number // ms
  backoffMultiplier: number
}

type RecoveryStrategy = "retry" | "skip" | "alternative" | "abort"
```

---

## Backend Commands

### Media Import

| Command | Parameters | Description |
|---------|------------|-------------|
| `import_media_files` | `{ paths, options }` | Импорт медиа файлов |
| `extract_media_metadata` | `{ filePath }` | Извлечение метаданных |
| `generate_video_thumbnail` | `{ videoPath, time }` | Генерация превью |
| `get_media_duration` | `{ filePath }` | Получение длительности |

### File Operations

| Command | Parameters | Description |
|---------|------------|-------------|
| `copy_media_to_project` | `{ sourcePath, projectPath }` | Копирование в проект |
| `move_media_files` | `{ files, destination }` | Перемещение файлов |
| `delete_media_files` | `{ files }` | Удаление файлов |
| `create_proxy_files` | `{ sourcePath, options }` | Создание прокси |

### Media Library

| Command | Parameters | Description |
|---------|------------|-------------|
| `scan_media_directory` | `{ directoryPath }` | Сканирование директории |
| `index_media_files` | `{ files }` | Индексация файлов |
| `search_media_library` | `{ query, filters }` | Поиск в медиатеке |

### Analysis & Export

| Command | Parameters | Description |
|---------|------------|-------------|
| `detect_video_scenes` | `{ videoPath, options }` | Детекция сцен |
| `generate_audio_waveform` | `{ audioPath, options }` | Генерация waveform |
| `export_media_file` | `{ sourcePath, outputPath, preset }` | Экспорт файла |
| `batch_export_media` | `{ files: ExportJob[] }` | Пакетный экспорт |
| `convert_media_format` | `{ inputPath, outputPath, format }` | Конвертация |

---

## Supported Formats

### Video

```typescript
const VIDEO_FORMATS = [
  '.mp4', '.mov', '.avi', '.mkv', '.webm',
  '.mxf', '.r3d', '.braw', '.dng'
]
```

### Audio

```typescript
const AUDIO_FORMATS = [
  '.mp3', '.wav', '.aiff', '.flac', '.ogg',
  '.m4a', '.aac'
]
```

### Image

```typescript
const IMAGE_FORMATS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.tiff', '.raw', '.dng', '.heic'
]
```
