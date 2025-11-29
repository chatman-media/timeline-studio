# Core Layer

[← Назад](README.md)

## Обзор

Core Layer - ядро приложения, содержащее:
- **Порты (Ports)** - интерфейсы для внешних сервисов
- **DI Container** - управление зависимостями

```
src/core/
├── ports/              # Интерфейсы сервисов
│   ├── ai.port.ts          # IAIService - AI/ML операции
│   ├── backend.port.ts     # IBackendService - жизненный цикл
│   ├── event.port.ts       # IEventService - события
│   ├── media.port.ts       # IMediaService - работа с медиа
│   ├── platform.port.ts    # IPlatformService - платформа
│   ├── storage.port.ts     # IStorageService - хранилище
│   ├── video.port.ts       # IVideoService - рендеринг
│   └── index.ts            # Реэкспорт
├── container.ts        # DI контейнер
└── __tests__/          # Тесты
```

## Порты (Interfaces)

### IBackendService

Управление жизненным циклом приложения.

```typescript
interface IBackendService {
  connect(): Promise<void>
  disconnect(): Promise<void>
  executeCommand(command: ProjectCommand): Promise<CommandResult>
  getProjectState(): Promise<ProjectState | null>
}
```

**Реализации:**
- `TauriBackendService` - через Tauri IPC
- `NodeBackendService` - через child processes
- `MockBackendService` - для тестов

### IPlatformService

Платформенные операции: диалоги, файлы, shell.

```typescript
interface IPlatformService {
  // Диалоги
  showOpenDialog(options: OpenDialogOptions): Promise<string[] | null>
  showSaveDialog(options: SaveDialogOptions): Promise<string | null>
  showConfirmDialog(options: ConfirmDialogOptions): Promise<boolean>

  // Файловая система
  readFile(path: string): Promise<string>
  readBinaryFile(path: string): Promise<Uint8Array>
  writeFile(path: string, content: string): Promise<void>
  writeBinaryFile(path: string, content: Uint8Array): Promise<void>
  exists(path: string): Promise<boolean>
  mkdir(path: string, options?: MkdirOptions): Promise<void>
  remove(path: string, options?: RemoveOptions): Promise<void>
  readDir(path: string): Promise<FileEntry[]>

  // Shell
  openUrl(url: string): Promise<void>
  openPath(path: string): Promise<void>
}
```

### IStorageService

Персистентное хранилище настроек.

```typescript
interface IStorageService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}
```

### IEventService

Подписка на события от бэкенда.

```typescript
interface IEventService {
  listen<T>(event: string, callback: (payload: T) => void): Promise<UnlistenFn>
  emit(event: string, payload?: unknown): Promise<void>
  once<T>(event: string, callback: (payload: T) => void): Promise<UnlistenFn>
}
```

### IMediaService

Работа с медиафайлами.

```typescript
interface IMediaService {
  // Метаданные
  getMetadata(path: string): Promise<MediaMetadata>

  // Thumbnails
  generateThumbnail(path: string, options?: ThumbnailOptions): Promise<string>
  generateThumbnails(path: string, count: number): Promise<string[]>

  // Waveform
  generateWaveform(path: string, options?: WaveformOptions): Promise<WaveformData>

  // Processing
  processMediaFile(path: string, options: ProcessOptions): Promise<ProcessResult>
  extractAudio(videoPath: string, outputPath: string): Promise<string>
  convertFormat(inputPath: string, outputPath: string, format: string): Promise<string>
}
```

**MediaMetadata (Discriminated Union):**
```typescript
type MediaMetadata =
  | { type: "Video"; duration: number; width: number; height: number; fps: number; codec: string }
  | { type: "Audio"; duration: number; channels: number; sampleRate: number; codec: string }
  | { type: "Image"; width: number; height: number; format: string }
  | { type: "Unknown" }
```

### IVideoService

Компиляция и рендеринг видео.

```typescript
interface IVideoService {
  // Рендеринг
  renderProject(schema: ProjectSchema, outputPath: string): Promise<string>
  startRender(options: RenderOptions): Promise<RenderJobId>
  cancelRender(jobId: RenderJobId): Promise<boolean>
  pauseRender(jobId: RenderJobId): Promise<boolean>
  resumeRender(jobId: RenderJobId): Promise<boolean>

  // Мониторинг
  getActiveJobs(): Promise<RenderJob[]>
  getJobProgress(jobId: RenderJobId): Promise<RenderProgress>
  onProgress(jobId: RenderJobId, callback: (progress: RenderProgress) => void): UnsubscribeFn

  // Система
  getCacheStats(): Promise<CacheStats>
  clearCache(): Promise<void>
  getGpuCapabilities(): Promise<GpuCapabilities>
}
```

### IAIService

AI/ML операции - самый большой порт (~80+ методов).

```typescript
interface IAIService {
  // YOLO Object Detection
  initYOLOProcessor(modelPath?: string, useGPU?: boolean): Promise<string>
  detectObjectsInImage(processorId: string, imagePath: string): Promise<YOLODetectionResult>
  detectObjectsInVideo(processorId: string, videoPath: string, options?: DetectionOptions): Promise<VideoDetectionResult>
  releaseYOLOProcessor(processorId: string): Promise<void>

  // Whisper Transcription
  whisperTranscribeOpenAI(audioPath: string, options?: OpenAITranscribeOptions): Promise<TranscriptionResult>
  whisperTranscribeLocal(audioPath: string, options?: LocalTranscribeOptions): Promise<TranscriptionResult>

  // AI Director
  aiDirectorAnalyzeComprehensive(videoPath: string, config?: AnalysisConfig): Promise<ComprehensiveAnalysisResult>
  aiDirectorGenerateRecommendations(analysisId: string): Promise<Recommendations>

  // Scene Detection
  detectScenes(videoPath: string, options?: SceneDetectionOptions): Promise<Scene[]>

  // Face Detection
  detectFaces(imagePath: string): Promise<FaceDetectionResult>
  recognizeFace(imagePath: string, faceDatabase: string): Promise<FaceRecognitionResult>

  // Audio Analysis
  analyzeAudio(audioPath: string): Promise<AudioAnalysisResult>
  detectSpeech(audioPath: string): Promise<SpeechSegment[]>

  // ... и ещё ~60 методов
}
```

## DI Container

Централизованное управление зависимостями.

### Структура

```typescript
// src/core/container.ts

class Container {
  private backend: IBackendService | null = null
  private platform: IPlatformService | null = null
  private storage: IStorageService | null = null
  private event: IEventService | null = null
  private media: IMediaService | null = null
  private video: IVideoService | null = null
  private ai: IAIService | null = null

  // Регистрация
  registerBackend(service: IBackendService): void
  registerPlatform(service: IPlatformService): void
  registerMedia(service: IMediaService): void
  registerVideo(service: IVideoService): void
  registerAI(service: IAIService): void
  // ...

  // Получение
  getBackend(): IBackendService
  getPlatform(): IPlatformService
  getMedia(): IMediaService
  getVideo(): IVideoService
  getAI(): IAIService
  // ...

  // Сброс (для тестов)
  reset(): void
}

export const container = new Container()

// Удобные геттеры
export const getBackend = () => container.getBackend()
export const getPlatform = () => container.getPlatform()
export const getMedia = () => container.getMedia()
export const getVideo = () => container.getVideo()
export const getAI = () => container.getAI()
```

### Инициализация

```typescript
// Tauri Desktop App
import { initTauriApp } from '@/adapters/tauri'
await initTauriApp()

// Node.js CLI
import { initNodeApp } from '@/adapters/node'
await initNodeApp()

// Tests
import { initMockApp } from '@/adapters/mock'
initMockApp()
```

### Использование

```typescript
import { getMedia, getVideo, getAI } from '@/core/container'

// В любом месте приложения
const metadata = await getMedia().getMetadata('/path/to/video.mp4')
const jobs = await getVideo().getActiveJobs()
const result = await getAI().whisperTranscribeLocal('/path/to/audio.wav')
```

## Адаптеры

### Tauri Adapters (`src/adapters/tauri/`)

Реализация через Tauri IPC для десктоп приложения.

```typescript
import { invoke } from '@tauri-apps/api/core'

class TauriMediaService implements IMediaService {
  async getMetadata(path: string): Promise<MediaMetadata> {
    return await invoke('get_media_metadata', { path })
  }

  async generateThumbnail(path: string, options?: ThumbnailOptions): Promise<string> {
    return await invoke('generate_thumbnail', { path, ...options })
  }
}
```

**Особенности:**
- Прямой вызов Rust команд через IPC
- GPU ускорение для видео операций
- Нативные диалоги ОС

### Node.js Adapters (`src/adapters/node/`)

Реализация через FFmpeg CLI для CLI и серверов.

```typescript
import { exec } from 'child_process'
import ffprobe from 'ffprobe'

class NodeMediaService implements IMediaService {
  async getMetadata(path: string): Promise<MediaMetadata> {
    const data = await ffprobe(path, { path: ffprobePath })
    return this.parseMetadata(data)
  }

  async generateThumbnail(path: string, options?: ThumbnailOptions): Promise<string> {
    const outputPath = this.getTempPath('.jpg')
    await this.runFFmpeg([
      '-i', path,
      '-ss', String(options?.timestamp ?? 0),
      '-vframes', '1',
      outputPath
    ])
    return outputPath
  }
}
```

**Особенности:**
- Работа через FFmpeg CLI
- Совместимость с любой ОС где есть FFmpeg
- Подходит для серверов и CLI

### Mock Adapters (`src/adapters/mock/`)

Для тестирования.

```typescript
class MockMediaService implements IMediaService {
  private mockMetadata: Map<string, MediaMetadata> = new Map()

  setMockMetadata(path: string, metadata: MediaMetadata): void {
    this.mockMetadata.set(path, metadata)
  }

  async getMetadata(path: string): Promise<MediaMetadata> {
    return this.mockMetadata.get(path) ?? { type: 'Unknown' }
  }
}
```

## Тестирование

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { container, resetContainer } from '@/core/container'
import { MockMediaService } from '@/adapters/mock'

describe('MediaService', () => {
  beforeEach(() => {
    resetContainer()
  })

  it('should get metadata', async () => {
    const mockMedia = new MockMediaService()
    mockMedia.setMockMetadata('/test.mp4', {
      type: 'Video',
      duration: 120,
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'h264'
    })

    container.registerMedia(mockMedia)

    const metadata = await getMedia().getMetadata('/test.mp4')
    expect(metadata.type).toBe('Video')
    expect(metadata.duration).toBe(120)
  })
})
```

---

*Создано: 2025-07-31*
*Обновлено: 2025-11-29*
