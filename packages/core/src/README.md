# Core

Ядро приложения с основными контрактами и инфраструктурой.

## Структура

```
src/core/
├── ports/           # Интерфейсы (контракты) для внешних сервисов
│   ├── ai.port.ts       # IAIService - AI/ML операции
│   ├── backend.port.ts  # IBackendService - жизненный цикл и команды
│   ├── event.port.ts    # IEventService - события
│   ├── media.port.ts    # IMediaService - работа с медиа
│   ├── platform.port.ts # IPlatformService - платформенные операции
│   ├── storage.port.ts  # IStorageService - хранилище
│   ├── video.port.ts    # IVideoService - компиляция видео
│   └── index.ts         # Реэкспорт всех портов
├── container.ts     # DI контейнер для управления зависимостями
└── __tests__/       # Тесты
```

## Порты (Interfaces)

### IBackendService
Управление жизненным циклом и командами проекта.
```typescript
connect(): Promise<void>
disconnect(): Promise<void>
executeCommand(command: ProjectCommand): Promise<CommandResult>
getProjectState(): Promise<ProjectState | null>
```

### IPlatformService
Платформенные операции: диалоги, файлы, shell.
```typescript
showOpenDialog(options): Promise<string[] | null>
showSaveDialog(options): Promise<string | null>
readFile(path): Promise<string>
writeFile(path, content): Promise<void>
```

### IStorageService
Персистентное хранилище настроек.
```typescript
get<T>(key: string): Promise<T | null>
set<T>(key: string, value: T): Promise<void>
delete(key: string): Promise<void>
```

### IEventService
Подписка на события от бэкенда.
```typescript
listen<T>(event: string, callback): Promise<UnlistenFn>
emit(event: string, payload): Promise<void>
```

### IMediaService
Работа с медиа файлами.
```typescript
getMetadata(path): Promise<MediaMetadata>
generateThumbnail(path, options): Promise<string>
generateWaveform(path, options): Promise<WaveformData>
processMediaFile(path, options): Promise<ProcessMediaResult>
```

### IVideoService
Компиляция и рендеринг видео.
```typescript
renderProject(schema, outputPath): Promise<string>
getActiveJobs(): Promise<RenderJob[]>
cancelRender(jobId): Promise<boolean>
getCacheStats(): Promise<CacheStats>
getGpuCapabilities(): Promise<GpuCapabilities>
```

### IAIService
AI/ML операции: распознавание, транскрипция, AI Director.
```typescript
// YOLO Detection
initYOLOProcessor(modelPath?, useGPU?): Promise<string>
detectObjectsInImage(processorId, imagePath): Promise<YOLODetectionResult>

// Whisper Transcription
whisperTranscribeOpenAI(audioPath, options?): Promise<TranscriptionResult>
whisperTranscribeLocal(audioPath, options?): Promise<TranscriptionResult>

// AI Director
aiDirectorAnalyzeComprehensive(videoPath, config?): Promise<ComprehensiveAnalysisResult>

// And 80+ more methods...
```

## DI Container

Централизованное управление зависимостями.

### Регистрация сервисов
```typescript
import { container } from "@/core/container"

container.registerBackend(new TauriBackendService())
container.registerMedia(new TauriMediaService())
container.registerVideo(new TauriVideoService())
container.registerAI(new TauriAIService())
```

### Использование сервисов
```typescript
import { getMedia, getVideo, getAI } from "@/core/container"

// В компонентах и хуках
const metadata = await getMedia().getMetadata(filePath)
const jobs = await getVideo().getActiveJobs()
const result = await getAI().whisperTranscribeLocal(audioPath)
```

### Инициализация приложения
```typescript
// Tauri приложение
import { initTauriApp } from "@/adapters/tauri"
await initTauriApp()

// Тесты / браузер
import { initMockApp } from "@/adapters/mock"
const { backend, media, video, ai } = initMockApp()
```

## Тестирование

Для тестов используйте Mock адаптеры:
```typescript
import { resetContainer } from "@/core/container"

beforeEach(() => {
  resetContainer()
})

// Мокирование отдельного сервиса
vi.mock("@/core/container", () => ({
  getMedia: vi.fn(() => mockMediaService),
  getVideo: vi.fn(() => mockVideoService),
}))
```
