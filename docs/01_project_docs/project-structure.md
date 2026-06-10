# Структура проекта Timeline Studio

[← Назад к разделу](README.md) | [← К оглавлению](../README.md)

## 📋 Содержание

- [Обзор структуры](#обзор-структуры)
- [Архитектура Ports & Adapters](#архитектура-ports--adapters)
- [Core Layer](#core-layer-ядро)
- [Adapters Layer](#adapters-layer-адаптеры)
- [Domains Layer](#domains-layer-домены)
- [Features Layer](#features-layer-фичи)
- [CLI](#cli-командная-строка)
- [Backend (Rust/Tauri)](#backend-rusttauri)
- [Конфигурационные файлы](#конфигурационные-файлы)

## 🏗️ Обзор структуры

```
timeline-studio/
├── packages/
│   ├── core/src          # 🎯 Ядро: порты (интерфейсы) и DI контейнер
│   ├── adapters/src      # 🔌 Адаптеры: Tauri, Node, mock, HTTP, React
│   ├── domains/src       # 📦 Домены: бизнес-логика
│   └── ui/src            # Общие UI primitives и reusable feature surfaces
├── apps/
│   ├── cli/src           # 💻 CLI приложение и bot-worker commands
│   └── desktop           # Desktop workspace ownership metadata
├── src/
│   ├── features/         # 🎨 Фичи: UI компоненты и хуки
│   ├── app/              # Next.js App Router compatibility path
│   ├── config/           # Desktop composition providers
│   ├── i18n/             # Интернационализация
│   ├── lib/              # Утилиты
│   └── test/             # Тестовые утилиты
│
├── src-tauri/            # Backend код (Rust)
├── public/               # Статические файлы
├── docs/                 # Документация
└── e2e/                  # End-to-end тесты
```

## 🎯 Архитектура Ports & Adapters

Timeline Studio использует **Hexagonal Architecture** (Ports & Adapters) для обеспечения независимости бизнес-логики от инфраструктуры.

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer (Features)                      │
│                  React компоненты, хуки, XState                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      Domain Layer (Domains)                     │
│              Бизнес-логика, сервисы, машины состояний           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ использует
┌─────────────────────────────▼───────────────────────────────────┐
│                       Core Layer (Ports)                        │
│           Интерфейсы сервисов + DI Container                    │
│   IMediaService, IVideoService, IAIService, IStorageService...  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ реализуют
┌─────────────────────────────▼───────────────────────────────────┐
│                    Adapters Layer (Adapters)                    │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Tauri Adapters │  Node Adapters  │       Mock Adapters         │
│  (Desktop App)  │  (CLI, Server)  │       (Testing)             │
│                 │                 │                             │
│  TauriMedia     │  NodeMedia      │       MockMedia             │
│  TauriVideo     │  NodeVideo      │       MockVideo             │
│  TauriAI        │  NodeAI         │       MockAI                │
│  TauriStorage   │  NodeStorage    │       MockStorage           │
│  ...            │  ...            │       ...                   │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### Преимущества архитектуры

1. **Независимость от платформы** - бизнес-логика не знает о Tauri, Node.js или браузере
2. **Тестируемость** - легко подменить реальные сервисы моками
3. **Расширяемость** - добавление новых платформ без изменения логики
4. **Переиспользование** - CLI и Desktop используют одну бизнес-логику

## 🎯 Core Layer (Ядро)

Ядро содержит интерфейсы (порты) и DI контейнер.

```
packages/core/src/
├── ports/                # Интерфейсы сервисов
│   ├── ai.port.ts        # IAIService - AI/ML функции
│   ├── backend.port.ts   # IBackendService - взаимодействие с бэкендом
│   ├── event.port.ts     # IEventService - события
│   ├── media.port.ts     # IMediaService - обработка медиа
│   ├── platform.port.ts  # IPlatformService - платформенные API
│   ├── storage.port.ts   # IStorageService - хранилище
│   ├── video.port.ts     # IVideoService - рендеринг видео
│   └── index.ts          # Реэкспорты
│
├── container.ts          # DI контейнер
├── index.ts              # Публичный API
├── types/                # Общие типы
└── README.md
```

### Использование портов

```typescript
// Получение сервиса через контейнер
import { getMedia, getVideo, getAI } from "@timeline-studio/core/container"

// Сервис реализует интерфейс, независимо от платформы
const metadata = await getMedia().getMetadata("/path/to/video.mp4")
const jobId = await getVideo().renderProject(schema, "/output.mp4")
```

### Ключевые интерфейсы

| Порт | Описание |
|------|----------|
| `IMediaService` | Метаданные, превью, обработка медиафайлов |
| `IVideoService` | Рендеринг, GPU, управление задачами |
| `IAIService` | Whisper, YOLO, распознавание, анализ |
| `IStorageService` | Персистентное key-value хранилище |
| `IEventService` | Подписка и эмит событий |
| `IPlatformService` | Файловая система, диалоги, clipboard |
| `IBackendService` | Команды проекта, состояние |

## 🔌 Adapters Layer (Адаптеры)

Реализации портов для разных платформ.

```
packages/adapters/src/
├── tauri/                # Tauri Desktop адаптеры
│   ├── ai.ts             # TauriAIService
│   ├── backend.ts        # TauriBackendService
│   ├── event.ts          # TauriEventService
│   ├── media.ts          # TauriMediaService
│   ├── platform.ts       # TauriPlatformService
│   ├── storage.ts        # TauriStorageService
│   ├── video.ts          # TauriVideoService
│   ├── index.ts          # initTauriApp()
│   └── README.md
│
├── node/                 # Node.js адаптеры (CLI, сервер)
│   ├── ai.ts             # NodeAIService (Whisper API + заглушки)
│   ├── backend.ts        # NodeBackendService
│   ├── event.ts          # NodeEventService (EventEmitter)
│   ├── media.ts          # NodeMediaService (FFmpeg CLI)
│   ├── platform.ts       # NodePlatformService (fs, path, os)
│   ├── storage.ts        # NodeStorageService (JSON файл)
│   ├── video.ts          # NodeVideoService (FFmpeg CLI)
│   ├── index.ts          # initNodeApp()
│   └── README.md
│
├── mock/                 # Моки для тестирования
│   ├── ai.mock.ts
│   ├── media.mock.ts
│   ├── video.mock.ts
│   └── index.ts
│
├── react/                # React-специфичные адаптеры
│   └── ...
│
├── index.ts              # Реэкспорты
└── README.md
```

### Инициализация адаптеров

```typescript
// Tauri Desktop App
import { initTauriApp } from "@timeline-studio/adapters/tauri"
await initTauriApp()

// Node.js CLI/Server
import { initNodeApp } from "@timeline-studio/adapters/node"
const services = await initNodeApp({
  ai: { openaiApiKey: process.env.OPENAI_API_KEY },
})

// Тестирование
import { initMockApp } from "@timeline-studio/adapters/mock"
initMockApp()
```

### Сравнение адаптеров

| Аспект | Tauri | Node.js | Mock |
|--------|-------|---------|------|
| FFmpeg | Rust bindings | CLI subprocess | Заглушки |
| AI/ML | ONNX Runtime | OpenAI API / CLI | Заглушки |
| GPU | Полная поддержка | Нет | Нет |
| Хранилище | Tauri Store | JSON файл | In-memory |
| Диалоги | Нативные ОС | Headless | Программные |

## 📦 Domains Layer (Домены)

Бизнес-логика, независимая от UI и инфраструктуры.

```
packages/domains/src/
├── ai-director/          # AI режиссёр и планировщик
│   ├── services/         # Сервисы анализа
│   ├── hooks/            # React хуки для UI
│   ├── types/            # Типы домена
│   └── __tests__/
│
├── ai-services/          # AI сервисы (Whisper, YOLO, etc.)
│   ├── services/
│   ├── hooks/
│   └── types/
│
├── ai-tools/             # AI инструменты для пользователя
│   ├── tools/            # Определения инструментов
│   └── services/
│
├── browser/              # Браузер медиафайлов
│   ├── services/         # Сервисы навигации
│   ├── hooks/            # useFileBrowser, etc.
│   └── providers/        # React провайдеры
│
├── media-management/     # Управление медиа
│   ├── services/         # MediaAPI, MetadataService
│   ├── hooks/            # useMediaPreview, useMediaProcessor
│   └── types/
│
├── project-management/   # Управление проектами
│   ├── services/         # ProjectService, AutosaveService
│   ├── hooks/            # useProject, useAutosave
│   └── types/
│
├── video-editing/        # Видео редактирование
│   ├── services/         # TimelineService, ClipService
│   ├── hooks/
│   └── types/
│
├── subtitles/            # Субтитры
│   ├── services/
│   └── types/
│
├── system-integration/   # Системная интеграция
│   ├── services/
│   └── hooks/
│
├── shared/               # Общие утилиты доменов
│   ├── types/
│   └── utils/
│
└── README.md
```

### Принципы организации доменов

1. **Домен = бизнес-область** - каждый домен отвечает за конкретную область
2. **Независимость** - домены не импортируют друг друга напрямую
3. **Использование портов** - взаимодействие через интерфейсы из `@timeline-studio/core/ports`
4. **Тестируемость** - каждый домен тестируется отдельно с моками

### Ключевые домены

| Домен | Назначение |
|-------|------------|
| `ai-director` | AI-планировщик монтажа, анализ контента |
| `ai-services` | Интеграция с AI моделями (Whisper, YOLO) |
| `browser` | Навигация по файловой системе |
| `media-management` | Обработка медиафайлов, метаданные |
| `project-management` | Сохранение/загрузка проектов |
| `video-editing` | Операции с таймлайном и клипами |
| `subtitles` | Генерация и редактирование субтитров |

## 🎨 Features Layer (Фичи)

UI компоненты и React хуки, организованные по функциональности.

```
src/features/
├── timeline/             # Редактор таймлайна
│   ├── components/       # React компоненты
│   ├── hooks/            # Custom hooks
│   ├── services/         # XState машины
│   ├── types/
│   ├── utils/
│   └── __tests__/
│
├── video-player/         # Видео плеер
├── browser/              # UI браузера файлов
├── media-studio/         # Главный интерфейс
├── effects/              # Визуальные эффекты
├── filters/              # Фильтры
├── transitions/          # Переходы
├── export/               # Экспорт видео
├── ai-chat/              # AI ассистент
├── montage-planner/      # Планировщик монтажа
├── fairlight-audio/      # Аудио микшер
├── color-grading/        # Цветокоррекция
├── motion-graphics/      # Анимация
├── multicam/             # Многокамерная съемка
├── camera-capture/       # Захват с камеры
├── voice-recording/      # Запись голоса
├── subtitles/            # UI субтитров
├── recognition/          # Распознавание сцен
├── templates/            # Шаблоны
├── style-templates/      # Стили
├── modals/               # Модальные окна
├── project-settings/     # Настройки проекта
├── user-settings/        # Настройки пользователя
├── keyboard-shortcuts/   # Горячие клавиши
└── app-state/            # Глобальное состояние
```

### Структура фичи

```
features/timeline/
├── components/           # React компоненты
│   ├── timeline.tsx
│   ├── track.tsx
│   ├── clip.tsx
│   └── ...
├── hooks/                # Custom React hooks
│   ├── use-timeline.ts
│   ├── use-playhead.ts
│   └── ...
├── services/             # XState машины и сервисы
│   ├── timeline-machine.ts
│   └── ...
├── types/                # TypeScript типы
│   └── index.ts
├── utils/                # Утилиты
├── __tests__/            # Тесты
├── __mocks__/            # Моки
└── README.md
```

## 💻 CLI (Командная строка)

CLI приложение для работы с медиа без GUI.

```
apps/cli/src/
├── index.ts              # Точка входа
├── commands/
│   ├── info.ts           # timeline-studio info <file>
│   ├── transcribe.ts     # timeline-studio transcribe <file>
│   ├── render.ts         # timeline-studio render <project> <output>
│   └── index.ts
└── README.md
```

### Использование CLI

```bash
# Информация о медиафайле
npx ts-node apps/cli/src/index.ts info video.mp4

# Транскрибация
npx ts-node apps/cli/src/index.ts transcribe video.mp4 -l ru

# Рендеринг проекта
npx ts-node apps/cli/src/index.ts render project.json output.mp4
```

CLI использует Node.js адаптеры из `@timeline-studio/adapters/node`.

## 🦀 Backend (Rust/Tauri)

Backend логика на Rust для десктопного приложения.

```
src-tauri/src/
├── main.rs               # Точка входа Tauri
├── lib.rs                # Корневой модуль
├── commands.rs           # Tauri команды
│
├── media/                # Работа с медиа
│   ├── scanner.rs        # Сканирование файлов
│   ├── metadata.rs       # Метаданные
│   └── cache.rs          # Кэширование
│
├── video_compiler/       # Компиляция видео
│   ├── ffmpeg.rs         # FFmpeg интеграция
│   ├── encoder.rs        # GPU кодирование
│   └── progress.rs       # Прогресс
│
├── recognition/          # ML распознавание
│   ├── yolo.rs           # YOLO модели
│   ├── tracker.rs        # Трекинг
│   └── face_detection.rs # Лица
│
├── audio/                # Аудио обработка
│   ├── fairlight_engine.rs
│   └── effects_chain.rs
│
├── color/                # Цветокоррекция
│   ├── grading_engine.rs
│   └── lut_processor.rs
│
├── analysis/             # Анализ аудио
│   └── mod.rs
│
├── project/              # Проекты
└── export/               # Экспорт
```

## ⚙️ Конфигурационные файлы

```
timeline-studio/
├── package.json          # NPM зависимости
├── tsconfig.json         # TypeScript
├── next.config.ts        # Next.js
├── tailwind.config.ts    # Tailwind CSS
├── vitest.config.ts      # Тесты
├── biome.json            # Линтер/форматтер
├── .env.local            # Переменные окружения
│
└── src-tauri/
    ├── tauri.conf.json   # Tauri конфигурация
    ├── Cargo.toml        # Rust зависимости
    └── build.rs          # Скрипт сборки
```

## 🔧 Скрипты разработки

```bash
# Разработка
bun run dev              # Frontend (Next.js)
bun run tauri dev        # Desktop (Tauri)

# Тестирование
bun run test             # Unit тесты (11500+)
bun run test:e2e         # E2E тесты
bun run test:rust        # Rust тесты

# Сборка
bun run build            # Production сборка
bun run tauri build      # Desktop приложение

# Качество кода
bun run lint             # Проверка
bun run lint:fix         # Автоисправление

# CLI
npx ts-node apps/cli/src/index.ts --help
```

## 📊 Архитектурные принципы

1. **Ports & Adapters** - бизнес-логика изолирована от инфраструктуры
2. **Feature-based** - код организован по функциональности
3. **Domain-Driven** - домены отражают бизнес-области
4. **Type Safety** - строгая типизация (TypeScript + Rust)
5. **Testability** - код легко тестировать с моками
6. **Platform Independence** - одна логика, разные платформы

## 🎯 Что дальше?

1. [Изучите Core и Ports](../../packages/core/src/README.md) - интерфейсы сервисов
2. [Изучите Adapters](../../packages/adapters/src/README.md) - реализации
3. [Изучите Domains](../../packages/domains/src/README.md) - бизнес-логика
4. [Настройте среду разработки](../05_development/setup.md)

---

[← Первый проект](first-project.md) | [Далее: Архитектура →](../03_architecture/README.md)

---

*Создано: 2025-07-31*
*Обновлено: 2025-11-29*
