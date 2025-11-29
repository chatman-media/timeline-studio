# Node.js Adapters

Node.js реализации сервисов для использования Timeline Studio логики вне Tauri.

## Назначение

Эти адаптеры позволяют использовать бизнес-логику Timeline Studio в:
- CLI инструментах
- Серверном окружении (Node.js)
- Electron приложениях
- Headless автоматизации
- Batch processing

## Сервисы

| Сервис | Файл | Описание |
|--------|------|----------|
| `NodeStorageService` | `storage.ts` | Персистентное хранилище на основе JSON-файла |
| `NodeEventService` | `event.ts` | Событийная система на основе EventEmitter |
| `NodePlatformService` | `platform.ts` | Платформенные API (fs, path, clipboard, notifications) |
| `NodeMediaService` | `media.ts` | Обработка медиа через FFmpeg/FFprobe CLI |
| `NodeVideoService` | `video.ts` | Рендеринг видео через FFmpeg CLI |
| `NodeBackendService` | `backend.ts` | Управление состоянием проекта |
| `NodeAIService` | `ai.ts` | AI-функции (Whisper API + заглушки для ONNX) |

## Использование

### Инициализация всех сервисов

```typescript
import { initNodeApp } from "@/adapters/node"

const services = await initNodeApp({
  ai: { openaiApiKey: process.env.OPENAI_API_KEY },
  storage: { filePath: "./data/storage.json" },
  autoConnect: true,
})

// Использование сервисов
const metadata = await services.media.getMetadata("/path/to/video.mp4")
const result = await services.ai.whisperTranscribeOpenAI("/path/to/audio.wav")
```

### Создание изолированных сервисов (без DI контейнера)

```typescript
import { createNodeServices } from "@/adapters/node"

const services = createNodeServices({
  media: { ffmpegPath: "/usr/local/bin/ffmpeg" },
})

// Сервисы не регистрируются в глобальном контейнере
const metadata = await services.media.getMetadata("/path/to/video.mp4")
```

### Использование отдельных сервисов

```typescript
import { NodeMediaService, NodeAIService } from "@/adapters/node"

const media = new NodeMediaService({ cacheDir: "/tmp/cache" })
const ai = new NodeAIService({ openaiApiKey: "sk-..." })

const metadata = await media.getMetadata("/path/to/video.mp4")
```

## Зависимости

### Системные требования

- **FFmpeg** - для обработки медиа и рендеринга
- **FFprobe** - для получения метаданных
- **Whisper CLI** (опционально) - для локальной транскрибации

### Проверка зависимостей

```bash
ffmpeg -version
ffprobe -version
whisper --help  # опционально
```

## Опции конфигурации

### NodeMediaOptions

```typescript
interface NodeMediaOptions {
  ffmpegPath?: string   // Путь к ffmpeg (по умолчанию: "ffmpeg")
  ffprobePath?: string  // Путь к ffprobe (по умолчанию: "ffprobe")
  cacheDir?: string     // Директория кэша (по умолчанию: os.tmpdir())
}
```

### NodeAIOptions

```typescript
interface NodeAIOptions {
  openaiApiKey?: string  // API ключ OpenAI для Whisper API
  whisperPath?: string   // Путь к локальному Whisper CLI
}
```

### NodeStorageOptions

```typescript
interface NodeStorageOptions {
  filePath?: string  // Путь к файлу хранилища (по умолчанию: ~/.timeline-studio/storage.json)
}
```

## Ограничения

### NodeAIService

Некоторые AI-функции требуют `onnxruntime-node` и возвращают заглушки:
- YOLO детекция объектов
- Распознавание лиц
- MediaPipe обработка

Полностью работают:
- Whisper транскрибация (OpenAI API)
- Whisper транскрибация (локальный CLI)
- Анализ аудио

## Тестирование

```bash
# Запуск тестов
bun run test src/adapters/node

# Тесты находятся в
src/adapters/node/__tests__/
```

## См. также

- [CLI документация](../../cli/README.md)
- [Tauri адаптеры](../tauri/README.md)
- [Core Ports](../../core/ports/README.md)
