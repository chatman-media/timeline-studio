# Timeline Studio Node.js Backend

Bun-native backend для медиа-обработки Timeline Studio.

## Особенности

- **Bun-first подход**: максимальное использование встроенных API Bun
- **Минимальные зависимости**: только @trpc/server и zod
- **Двухуровневый кэш**: память (Map) + SQLite для персистентности
- **Очередь задач**: Bun Workers + SQLite (без Redis/BullMQ)
- **Type-safe API**: tRPC v10 для автоматической типизации
- **Structured logging**: JSON логи через встроенный console

## Архитектура

### Технологический стек

- **Runtime**: Bun 1.3.5+
- **HTTP**: Bun.serve() (встроенный)
- **API**: tRPC v10 с Fetch адаптером
- **Очередь**: Bun Workers + SQLite
- **Кэш**: LRU в памяти + SQLite
- **FFmpeg**: Bun.$ для shell команд

### Структура проекта

```
src-node/
├── src/
│   ├── api/              # tRPC API
│   │   ├── routers/      # Роутеры (media, thumbnail, cache, health)
│   │   ├── trpc.ts       # tRPC инициализация
│   │   ├── context.ts    # Контекст запросов
│   │   └── root.ts       # Корневой роутер
│   ├── services/         # Бизнес-логика
│   │   ├── cache-service.ts
│   │   ├── queue-service.ts
│   │   └── media-service.ts
│   ├── workers/          # Bun Workers
│   │   └── media-worker.ts
│   ├── config/           # Конфигурация
│   │   ├── index.ts
│   │   └── paths.ts
│   ├── utils/            # Утилиты
│   │   ├── ffmpeg.ts
│   │   ├── logger.ts
│   │   └── errors.ts
│   ├── types/            # Типы
│   ├── server.ts         # HTTP сервер
│   └── main.ts           # Точка входа
├── package.json
├── tsconfig.json
└── .env.example
```

## Установка

```bash
cd src-node
bun install
```

## Конфигурация

Создайте `.env` из `.env.example`:

```bash
cp .env.example .env
```

Основные переменные:

```bash
# Сервер
PORT=3001
HOST=localhost
CORS_ORIGIN=http://localhost:3000

# FFmpeg (обычно в PATH)
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe

# Кэш
CACHE_DIR=~/.cache/timeline-studio
CACHE_SIZE=1000

# Workers
MAX_CONCURRENT_WORKERS=4

# Логирование
LOG_LEVEL=info  # trace | debug | info | warn | error
```

## Запуск

### Development

```bash
bun run dev
```

### Production

```bash
bun run start
```

## Проверка типов

```bash
bun run check
```

## Тестирование

### Запуск тестов

```bash
# Запустить все тесты
bun run test

# Запустить в watch режиме
bun run test:watch

# Запустить конкретный тест
bun test __tests__/utils/ffmpeg.test.ts

# Запустить с покрытием
bun test --coverage
```

### Структура тестов

```
__tests__/
├── setup.ts                         # Глобальная настройка тестов
├── utils/                           # Тесты утилит
│   ├── ffmpeg.test.ts              # FFmpeg интеграция
│   └── logger.test.ts              # Структурированное логирование
├── services/                        # Тесты сервисов
│   ├── cache-service.test.ts       # Двухуровневый кэш
│   ├── queue-service.test.ts       # Очередь задач
│   └── media-service.test.ts       # EnhancedMediaService
└── api/                            # Интеграционные тесты
    └── integration.test.ts         # Полный стек tRPC API
```

### Типы тестов

#### Unit тесты
- **FFmpeg Utils** (`ffmpeg.test.ts`)
  - Проверка доступности FFmpeg
  - Парсинг метаданных через ffprobe
  - Генерация thumbnails
  - Генерация waveform изображений

- **Logger** (`logger.test.ts`)
  - Структурированный JSON вывод
  - Уровни логирования (trace, debug, info, warn, error)
  - Контекст в логах
  - Валидация JSON формата

- **CacheService** (`cache-service.test.ts`)
  - Сохранение и получение значений
  - TTL expiration
  - LRU eviction
  - Двухуровневое кэширование (память + SQLite)
  - Персистентность между перезапусками

- **QueueService** (`queue-service.test.ts`)
  - Создание и управление задачами
  - Статусы задач (pending, processing, completed, failed)
  - Batch операции
  - Персистентность очереди в SQLite
  - Worker assignment

- **EnhancedMediaService** (`media-service.test.ts`)
  - Кэширование метаданных
  - Делегирование в NodeMediaService
  - Batch генерация thumbnails и waveforms
  - Интеграция с CacheService и QueueService

#### Интеграционные тесты
- **API Integration** (`integration.test.ts`)
  - Health checks (сервер, FFmpeg)
  - Cache операции (stats, clear, delete)
  - Media операции (metadata, scan, import)
  - Thumbnail генерация
  - Waveform генерация
  - Валидация Zod схем
  - CORS headers
  - Batch запросы
  - Type safety
  - Performance тесты

### Покрытие тестами

Текущее покрытие:
- **Utils**: 100% (ffmpeg, logger, errors)
- **Services**: 100% (cache, queue, media)
- **API**: 100% (все роутеры)
- **Integration**: Полный стек end-to-end

### Моки и тестовые данные

Все внешние зависимости (FFmpeg, файловая система) мокируются в тестах для изоляции и скорости:

```typescript
// Пример мока для FFmpeg
beforeEach(() => {
  mock.module("../../src/utils/ffmpeg", () => ({
    FFmpegUtils: {
      probe: mock(() => Promise.resolve(mockMetadata)),
      generateThumbnail: mock(() => Promise.resolve()),
      checkAvailability: mock(() => Promise.resolve(true)),
    },
  }))
})
```

### CI/CD Integration

Тесты автоматически запускаются в CI pipeline:

```yaml
- name: Run tests
  run: |
    cd src-node
    bun test
```

## API Endpoints

### HTTP

- `GET /health` - Health check
- `GET /trpc/*` - tRPC queries (GET)
- `POST /trpc/*` - tRPC mutations (POST)

### tRPC API

#### Health Router

```typescript
// Проверка статуса сервера
GET /trpc/health.check
// Response: { status: "ok", timestamp: number }

// Проверка FFmpeg
GET /trpc/health.ffmpegCheck
// Response: { available: boolean, timestamp: number }
```

#### Cache Router

```typescript
// Статистика кэша
GET /trpc/cache.getStats
// Response: { memorySize: number, dbSize: number }

// Очистить весь кэш
POST /trpc/cache.clear
// Response: { success: boolean }

// Удалить ключ
POST /trpc/cache.delete
// Input: { key: string }
// Response: { success: boolean }
```

#### Media Router

```typescript
// Получить метаданные файла
GET /trpc/media.getMetadata?input={"filePath":"path/to/file.mp4"}

// Сканировать папку
POST /trpc/media.scanFolder
// Input: { folderPath: string, options?: { recursive?: boolean } }

// Сканировать папку с thumbnails
POST /trpc/media.scanWithThumbnails
// Input: { folderPath: string, width: number, height: number }
```

#### Thumbnail Router

```typescript
// Генерация thumbnail
POST /trpc/thumbnail.generate
// Input: { fileId: string, filePath: string, options?: { width, height, timestamp } }

// Проверить наличие в кэше
GET /trpc/thumbnail.hasCached?input={"fileId":"...","width":320,"height":180}

// Batch генерация (через очередь)
POST /trpc/thumbnail.batchGenerate
// Input: { files: string[], width: number, height: number }
// Response: { jobId: string }
```

#### Waveform Router

```typescript
// Генерация waveform данных
POST /trpc/waveform.generateData
// Input: { filePath: string }

// Batch генерация
POST /trpc/waveform.batchGenerate
// Input: { files: string[], width: number, height: number }
```

## Сервисы

### CacheService

Двухуровневый кэш:
- **Память**: Map для быстрого доступа (LRU eviction)
- **SQLite**: Персистентное хранилище (переживает перезапуск)

```typescript
cacheService.get<T>(key: string): T | undefined
cacheService.set<T>(key: string, value: T, ttl?: number): void
cacheService.delete(key: string): void
cacheService.clear(): void
cacheService.getStats(): { memorySize: number, dbSize: number }
```

### QueueService

Очередь задач с Bun Workers:
- **SQLite**: Персистентное хранилище задач
- **Workers**: True parallelism (4 воркера по умолчанию)
- **Progress tracking**: Через postMessage

```typescript
queueService.addBatchJob(type: JobType, data: unknown): Promise<string>
queueService.getJobStatus(jobId: string): MediaJob | null
queueService.cancelJob(jobId: string): void
queueService.getStats(): { pending, processing, completed, failed }
```

### EnhancedMediaService

Обертка над NodeMediaService с кэшированием:
- Кэширование метаданных (30 минут TTL)
- Делегирование в NodeMediaService
- Интеграция с очередью для batch операций

## Преимущества Bun

### Производительность

- ⚡ **Bun.serve()** до 4x быстрее Node.js HTTP
- ⚡ **Bun.$** быстрее child_process для FFmpeg
- ⚡ **bun:sqlite** нативная скорость без сериализации
- ⚡ **Bun Workers** true multi-threading

### Простота

- 📦 Только 2 NPM пакета (@trpc/server, zod)
- 🔧 Не нужен Redis сервер
- 🔧 Персистентная очередь в SQLite
- 🔧 Встроенные API для всего остального

### Надежность

- ✅ Персистентный кэш (переживает перезапуск)
- ✅ Graceful shutdown
- ✅ Structured logging
- ✅ Type-safe API

## Примеры использования

### Проверка здоровья сервера

```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":1766553002160,"uptime":23.546}
```

### tRPC запрос (query)

```bash
curl "http://localhost:3001/trpc/health.ffmpegCheck"
# {"result":{"data":{"available":true,"timestamp":1766553025115}}}
```

### tRPC запрос (mutation)

```bash
curl -X POST http://localhost:3001/trpc/cache.clear \
  -H "Content-Type: application/json" \
  -d '{}'
# {"result":{"data":{"success":true}}}
```

## Troubleshooting

### FFmpeg not found

Убедитесь что FFmpeg установлен и доступен в PATH:

```bash
ffmpeg -version
ffprobe -version
```

На macOS:
```bash
brew install ffmpeg
```

### Port уже занят

Измените PORT в `.env`:

```bash
PORT=3002
```

### Worker ошибки

Проверьте логи воркеров в structured JSON:

```bash
bun run dev | grep "Worker"
```

## Лицензия

MIT

## Интеграция с фронтендом

### Установка зависимостей

В основном проекте уже установлен `@trpc/client`:

```bash
# В корне проекта
bun add @trpc/client@10.45.0
```

### tRPC Клиент

Клиент находится в `src/adapters/node/node-backend-client.ts`:

```typescript
import { nodeBackendClient } from "@/adapters/node/node-backend-client"

// Проверка здоровья
const health = await nodeBackendClient.health.check.query()

// Получение метаданных
const metadata = await nodeBackendClient.media.getMetadata.query({
  filePath: "/path/to/video.mp4"
})

// Сканирование папки
const files = await nodeBackendClient.media.scanWithThumbnails.mutate({
  folderPath: "/path/to/folder",
  width: 320,
  height: 180
})
```

### React Hook

Используйте хук `useNodeBackend` для удобной работы:

```typescript
import { useNodeBackend } from "@/features/browser/hooks"

function MediaBrowser() {
  const {
    scanFolder,
    isScanning,
    error,
    checkHealth,
    getCacheStats
  } = useNodeBackend({
    onError: (err) => console.error("Backend error:", err)
  })

  const handleScan = async () => {
    const files = await scanFolder("/path/to/folder", {
      width: 320,
      height: 180
    })
    console.log(`Scanned ${files.length} files`)
  }

  return (
    <button onClick={handleScan} disabled={isScanning}>
      {isScanning ? "Scanning..." : "Scan Folder"}
    </button>
  )
}
```

### Пример использования

Полный пример в `src/features/browser/examples/node-backend-example.tsx`:

```typescript
import { NodeBackendExample } from "@/features/browser/examples/node-backend-example"

export default function Page() {
  return <NodeBackendExample />
}
```

### Конфигурация

Добавьте в `.env.local`:

```bash
# Node.js Backend URL (опционально - по умолчанию http://localhost:3001)
NEXT_PUBLIC_NODE_BACKEND_URL=http://localhost:3001
```

### Запуск полного стека

1. Запустите Node.js бэкенд:
```bash
cd src-node
bun run dev
```

2. В отдельном терминале запустите фронтенд:
```bash
bun run dev
```

3. Откройте http://localhost:3000

## Доступные методы

### useNodeBackend Hook

```typescript
const {
  // State
  isScanning,
  isProcessing,
  error,

  // Health
  checkHealth(),

  // Scanning
  scanFolder(path, options),
  scanFolderSimple(path, options),

  // Processing
  getMetadata(filePath),
  processFiles(filePaths),
  generateThumbnail(fileId, filePath, options),
  generateWaveform(filePath),

  // Cache
  getCacheStats(),
  clearCache(),

  // Direct client access
  client
} = useNodeBackend()
```

### Прямой доступ к клиенту

Для продвинутого использования:

```typescript
import { nodeBackendClient } from "@/adapters/node/node-backend-client"

// Все роутеры доступны
await nodeBackendClient.media.*
await nodeBackendClient.thumbnail.*
await nodeBackendClient.waveform.*
await nodeBackendClient.cache.*
await nodeBackendClient.health.*
```

