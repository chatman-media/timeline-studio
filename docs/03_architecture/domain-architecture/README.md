# Доменная архитектура Timeline Studio

[← Назад к архитектуре](../README.md) | [← К оглавлению](../../README.md)

## Обзор

Timeline Studio использует **Hexagonal Architecture** (Ports & Adapters) в сочетании с **Domain-Driven Design** для обеспечения независимости бизнес-логики от инфраструктуры.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Timeline Studio                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    UI Layer (src/features/)                        │  │
│  │         React 19, XState v5, shadcn/ui, Tailwind CSS v4           │  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│                                │                                         │
│  ┌─────────────────────────────▼─────────────────────────────────────┐  │
│  │                  Domain Layer (src/domains/)                       │  │
│  │    ai-director, media-management, project-management, browser      │  │
│  │    + Orchestrator Pattern для координации                          │  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│                                │                                         │
│  ┌─────────────────────────────▼─────────────────────────────────────┐  │
│  │                   Core Layer (src/core/)                           │  │
│  │    Ports (interfaces) + DI Container                               │  │
│  │    IMediaService, IVideoService, IAIService, IStorageService...    │  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│                                │                                         │
│  ┌─────────────────────────────▼─────────────────────────────────────┐  │
│  │                 Adapters Layer (src/adapters/)                     │  │
│  ├───────────────┬─────────────────┬─────────────────────────────────┤  │
│  │ Tauri (Rust)  │   Node.js       │           Mock                  │  │
│  │ Desktop App   │   CLI/Server    │          Testing                │  │
│  └───────────────┴─────────────────┴─────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Документация

| Документ | Описание |
|----------|----------|
| [core-layer.md](core-layer.md) | Core Layer: порты и DI контейнер |
| [domains-overview.md](domains-overview.md) | Обзор всех доменов |
| [orchestrator-pattern.md](orchestrator-pattern.md) | Паттерн Orchestrator |

## Ключевые принципы

### 1. Dependency Inversion
Бизнес-логика зависит от абстракций (портов), а не от конкретных реализаций.

```typescript
// Порт (интерфейс) в src/core/ports/
interface IMediaService {
  getMetadata(path: string): Promise<MediaMetadata>
}

// Адаптер реализует порт
class TauriMediaService implements IMediaService {
  async getMetadata(path: string) {
    return await invoke('get_media_metadata', { path })
  }
}

// Бизнес-логика использует порт
class MediaManagementOrchestrator {
  private media = getMedia() // Получает текущую реализацию из DI
}
```

### 2. Domain Isolation
Каждый домен инкапсулирует свою бизнес-логику и предоставляет публичный API.

```typescript
// Публичный API домена
export { getMediaManagementOrchestrator } from './orchestrator'
export { useMediaManagement } from './hooks'
export type { MediaFile, ImportOptions } from './types'
```

### 3. Orchestrator Pattern
Координация сложных операций через singleton orchestrator.

```typescript
const orchestrator = getMediaManagementOrchestrator()
await orchestrator.importMedia(files, options)
```

### 4. Platform Independence
Один и тот же код работает в Tauri, Node.js CLI, и тестах.

```typescript
// Tauri Desktop
await initTauriApp()  // Регистрирует Tauri адаптеры

// Node.js CLI
await initNodeApp()   // Регистрирует Node.js адаптеры

// Tests
initMockApp()         // Регистрирует Mock адаптеры
```

## Структура директорий

```
src/
├── core/                    # Ядро: порты и DI
│   ├── ports/              # Интерфейсы сервисов
│   │   ├── ai.port.ts
│   │   ├── media.port.ts
│   │   ├── video.port.ts
│   │   └── ...
│   └── container.ts        # DI контейнер
│
├── adapters/               # Реализации портов
│   ├── tauri/             # Для десктоп приложения
│   ├── node/              # Для CLI и серверов
│   └── mock/              # Для тестирования
│
├── domains/               # Бизнес-домены
│   ├── ai-services/       # AI сервисы
│   ├── ai-tools/          # AI инструменты
│   ├── browser/           # Файловый браузер
│   ├── media-management/  # Управление медиа
│   ├── project-management/# Управление проектами
│   ├── shared/            # Общие компоненты
│   ├── system-integration/# Системная интеграция
│   └── video-editing/     # Редактирование видео
│
└── features/              # UI компоненты и хуки
    └── ...
```

## Поток данных

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  UI Layer    │ ───▶ │   Domain     │ ───▶ │    Core      │
│  (Features)  │      │ (Orchestrator)│      │   (Ports)    │
└──────────────┘      └──────────────┘      └──────┬───────┘
                                                    │
                      ┌──────────────┐              │
                      │   Adapter    │ ◀────────────┘
                      │ (Tauri/Node) │
                      └──────┬───────┘
                             │
                      ┌──────▼───────┐
                      │   Backend    │
                      │ (Rust/FFmpeg)│
                      └──────────────┘
```

## Быстрый старт

### Использование в компонентах

```typescript
import { useMediaManagement } from '@/domains/media-management'

function MediaBrowser() {
  const { importMedia, getMediaFiles } = useMediaManagement()

  const handleImport = async (files: File[]) => {
    await importMedia(files)
  }
}
```

### Прямой доступ к orchestrator

```typescript
import { getMediaManagementOrchestrator } from '@/domains/media-management'

// В non-React коде
const orchestrator = getMediaManagementOrchestrator()
const metadata = await orchestrator.getMetadata(filePath)
```

### Доступ к низкоуровневым сервисам

```typescript
import { getMedia, getVideo, getAI } from '@/core/container'

// Прямой доступ к сервисам
const metadata = await getMedia().getMetadata(filePath)
const result = await getAI().whisperTranscribeLocal(audioPath)
```

---

*Создано: 2025-07-31*
*Обновлено: 2025-11-29*
