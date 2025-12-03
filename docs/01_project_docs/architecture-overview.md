# ОБЗОР АРХИТЕКТУРЫ TIMELINE STUDIO

## 🏗️ Общая архитектура

Timeline Studio построен на **Hexagonal Architecture** (Ports & Adapters), обеспечивающей независимость бизнес-логики от платформы и инфраструктуры.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Timeline Studio                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    UI Layer (src/features/)                       │  │
│  │         React 19, XState v5, shadcn/ui, Tailwind CSS v4           │  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│                                │                                        │
│  ┌─────────────────────────────▼─────────────────────────────────────┐  │
│  │                  Domain Layer (src/domains/)                      │  │
│  │    ai-director, media-management, project-management, browser     │  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│                                │                                        │
│  ┌─────────────────────────────▼─────────────────────────────────────┐  │
│  │                   Core Layer (src/core/)                          │  │
│  │    Ports (interfaces) + DI Container                              │  │
│  │    IMediaService, IVideoService, IAIService, IStorageService...   │  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│                                │                                        │
│  ┌─────────────────────────────▼─────────────────────────────────────┐  │
│  │                 Adapters Layer (src/adapters/)                    │  │
│  ├───────────────┬─────────────────┬─────────────────────────────────┤  │
│  │ Tauri (Rust)  │   Node.js       │           Mock                  │  │
│  │ Desktop App   │   CLI/Server    │          Testing                │  │
│  └───────────────┴─────────────────┴─────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Ports & Adapters (Hexagonal Architecture)

### Почему эта архитектура?

1. **Независимость от платформы** - бизнес-логика не знает о Tauri, Node.js или браузере
2. **Тестируемость** - легко подменить реальные сервисы моками
3. **Расширяемость** - добавление Electron или Web версии без изменения логики
4. **Переиспользование** - CLI и Desktop используют одну бизнес-логику

### Слои архитектуры

```
┌─────────────────┐
│   UI Layer      │  React компоненты, хуки, XState машины
│  (features/)    │  Зависит от: domains/, core/
├─────────────────┤
│  Domain Layer   │  Бизнес-логика, сервисы, типы
│  (domains/)     │  Зависит от: core/ (только интерфейсы)
├─────────────────┤
│   Core Layer    │  Интерфейсы (порты), DI контейнер
│   (core/)       │  Не зависит ни от чего
├─────────────────┤
│ Adapters Layer  │  Реализации для Tauri/Node/Mock
│  (adapters/)    │  Реализует: core/ интерфейсы
└─────────────────┘
```

## 📦 Core Layer (Ядро)

Центральная часть системы - интерфейсы сервисов и DI контейнер.

```
src/core/
├── ports/                # Интерфейсы сервисов
│   ├── ai.port.ts        # IAIService - Whisper, YOLO, анализ
│   ├── backend.port.ts   # IBackendService - команды проекта
│   ├── event.port.ts     # IEventService - события
│   ├── media.port.ts     # IMediaService - метаданные, превью
│   ├── platform.port.ts  # IPlatformService - файлы, диалоги
│   ├── storage.port.ts   # IStorageService - хранилище
│   ├── video.port.ts     # IVideoService - рендеринг
│   └── index.ts
├── container.ts          # DI контейнер
└── index.ts
```

### Ключевые интерфейсы

| Порт | Методы | Описание |
|------|--------|----------|
| `IMediaService` | getMetadata, generateThumbnail, processMedia | Обработка медиафайлов |
| `IVideoService` | renderProject, cancelRender, getGpuCapabilities | Рендеринг видео |
| `IAIService` | whisperTranscribe, detectObjects, analyzeContent | AI/ML функции |
| `IStorageService` | get, set, delete | Key-value хранилище |
| `IEventService` | listen, emit | Событийная система |
| `IPlatformService` | showOpenDialog, readFile, writeFile | Платформенные API |
| `IBackendService` | executeCommand, getProjectState | Управление проектом |

### Использование

```typescript
// Получение сервиса через контейнер - независимо от платформы
import { getMedia, getVideo, getAI } from "@/core/container"

const metadata = await getMedia().getMetadata("/path/to/video.mp4")
const jobId = await getVideo().renderProject(schema, "/output.mp4")
const result = await getAI().whisperTranscribeLocal("/path/to/audio.wav")
```

## 🔌 Adapters Layer (Адаптеры)

Реализации интерфейсов для разных платформ.

```
src/adapters/
├── tauri/                # Desktop (Tauri + Rust)
│   ├── ai.ts             # ONNX Runtime через Rust
│   ├── media.ts          # FFmpeg через Rust bindings
│   ├── video.ts          # GPU-ускоренный рендеринг
│   └── index.ts          # initTauriApp()
│
├── node/                 # CLI и Server (Node.js)
│   ├── ai.ts             # OpenAI API / Whisper CLI
│   ├── media.ts          # FFmpeg CLI subprocess
│   ├── video.ts          # FFmpeg CLI рендеринг
│   └── index.ts          # initNodeApp()
│
├── mock/                 # Тестирование
│   ├── ai.mock.ts        # Заглушки для тестов
│   └── index.ts          # initMockApp()
│
└── react/                # React-специфичные
```

### Сравнение адаптеров

| Аспект | Tauri | Node.js | Mock |
|--------|-------|---------|------|
| FFmpeg | Rust bindings | CLI subprocess | Заглушки |
| AI/ML | ONNX Runtime (Rust) | OpenAI API / CLI | Заглушки |
| GPU | NVENC, QuickSync, AMF | Нет | Нет |
| Хранилище | Tauri Store | JSON файл | In-memory |
| Диалоги | Нативные ОС | Headless | Программные |
| Производительность | Высокая | Средняя | - |

### Инициализация

```typescript
// Desktop приложение
import { initTauriApp } from "@/adapters/tauri"
await initTauriApp()

// CLI / Server
import { initNodeApp } from "@/adapters/node"
const services = await initNodeApp({
  ai: { openaiApiKey: process.env.OPENAI_API_KEY },
})

// Тестирование
import { initMockApp } from "@/adapters/mock"
initMockApp()
```

## 📦 Domain Layer (Домены)

Бизнес-логика, независимая от UI и инфраструктуры.

```
src/domains/
├── ai-director/          # AI режиссёр и планировщик монтажа
├── ai-services/          # Интеграция с AI моделями
├── ai-tools/             # AI инструменты для пользователя
├── browser/              # Навигация по файловой системе
├── media-management/     # Обработка медиафайлов
├── project-management/   # Управление проектами
├── video-editing/        # Операции с таймлайном
├── subtitles/            # Субтитры
├── system-integration/   # Системная интеграция
└── shared/               # Общие утилиты
```

### Ключевые домены

| Домен | Назначение |
|-------|------------|
| `ai-director` | AI-планировщик монтажа, анализ контента, рекомендации |
| `media-management` | Метаданные, превью, импорт медиафайлов |
| `project-management` | Сохранение/загрузка проектов, автосохранение |
| `video-editing` | Операции с таймлайном, клипами, треками |
| `browser` | Файловый браузер, навигация |

### Принцип работы доменов

```typescript
// Домен использует порты, не зная о реализации
import { getMedia } from "@/core/container"
import type { MediaMetadata } from "@/core/ports"

export class MediaManagementService {
  async analyzeFile(path: string): Promise<MediaMetadata> {
    // getMedia() вернёт TauriMediaService или NodeMediaService
    // в зависимости от платформы
    return getMedia().getMetadata(path)
  }
}
```

## 🎨 UI Layer (Features)

React компоненты, организованные по функциональности.

```
src/features/
├── timeline/             # Редактор таймлайна
├── video-player/         # Видео плеер
├── browser/              # UI браузера файлов
├── media-studio/         # Главный интерфейс
├── ai-chat/              # AI ассистент
├── montage-planner/      # Планировщик монтажа
├── fairlight-audio/      # Аудио микшер
├── color-grading/        # Цветокоррекция
├── effects/              # Визуальные эффекты
├── export/               # Экспорт видео
└── ...                   # Другие фичи
```

### State Management

- **XState v5** - сложные состояния (timeline, player, browser)
- **React Context** - глобальное UI состояние
- **DI Container** - сервисы из core/

## 💻 CLI (Командная строка)

CLI приложение использует Node.js адаптеры.

```
src/cli/
├── index.ts              # Точка входа
├── commands/
│   ├── info.ts           # timeline-studio info <file>
│   ├── transcribe.ts     # timeline-studio transcribe <file>
│   └── render.ts         # timeline-studio render <project> <output>
```

### Использование

```bash
# Информация о файле
npx ts-node src/cli/index.ts info video.mp4

# Транскрибация
npx ts-node src/cli/index.ts transcribe video.mp4 -l ru

# Рендеринг
npx ts-node src/cli/index.ts render project.json output.mp4
```

## 🦀 Backend (Rust/Tauri)

Rust бэкенд для десктопного приложения.

```
src-tauri/src/
├── main.rs               # Точка входа
├── commands.rs           # Tauri команды
├── media/                # FFmpeg интеграция
├── video_compiler/       # GPU рендеринг
├── recognition/          # YOLO/ONNX модели
├── audio/                # Fairlight engine
├── color/                # Цветокоррекция
├── analysis/             # Анализ аудио
└── project/              # Управление проектами
```

### Ключевые компоненты Rust

1. **Video Compiler** - FFmpeg + GPU кодирование (NVENC, QuickSync)
2. **Recognition** - YOLO модели через ONNX Runtime
3. **Audio Engine** - Fairlight-подобный аудио движок
4. **Color Engine** - GPU-ускоренная цветокоррекция

## 🔌 Коммуникация Frontend ↔ Backend

### Tauri Commands

```typescript
// Frontend вызывает Rust через invoke
import { invoke } from "@tauri-apps/api/core"

const metadata = await invoke("get_media_metadata", { path: "/video.mp4" })
const jobId = await invoke("render_project", { schema, output: "/output.mp4" })
```

### Event System

```typescript
// Подписка на события от Rust
import { listen } from "@tauri-apps/api/event"

const unlisten = await listen("render-progress", (event) => {
  console.log("Progress:", event.payload.percent)
})
```

## 🔐 Безопасность

- **API ключи** - хранятся в системном keychain (macOS), Credential Store (Windows)
- **OAuth токены** - PKCE flow, автоматическое обновление
- **Шифрование** - AES-256 для чувствительных данных

## 🚀 Производительность

### Frontend
- Code splitting по маршрутам
- Lazy loading компонентов
- Виртуализация списков

### Backend (Rust)
- GPU ускорение рендеринга
- LRU кеш для превью
- Параллельная обработка через tokio
- Zero-copy операции

## 🧪 Тестирование

```bash
# Frontend тесты (11500+)
bun run test

# Rust тесты
bun run test:rust

# E2E тесты
bun run test:e2e
```

### Стратегия тестирования

- **Unit тесты** - Vitest + Testing Library
- **Mock адаптеры** - изоляция от инфраструктуры
- **E2E тесты** - Playwright

## 📦 Сборка

```bash
# Разработка
bun run tauri dev

# Production
bun run tauri build
```

### Платформы
- **Windows**: MSI/NSIS
- **macOS**: DMG/App bundle
- **Linux**: AppImage/deb/rpm

---

*Для детальной информации смотрите README в соответствующих директориях:*
- [Core](../../src/core/README.md)
- [Adapters](../../src/adapters/README.md)
- [Domains](../../src/domains/README.md)
- [CLI](../../src/cli/README.md)

---

*Создано: 2025-07-31*
*Обновлено: 2025-11-29*
