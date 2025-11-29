# Обзор доменов

[← Назад](README.md)

## Структура доменов

```
src/domains/
├── ai-director/          # AI режиссёр
├── ai-services/          # AI сервисы и анализ
├── ai-tools/             # AI инструменты
├── browser/              # Файловый браузер
├── media-management/     # Управление медиа
├── project-management/   # Управление проектами
├── shared/               # Общие компоненты
├── subtitles/            # Субтитры
├── system-integration/   # Системная интеграция
└── video-editing/        # Редактирование видео
```

## Домены

### AI Director

AI режиссёр для комплексного анализа и рекомендаций по монтажу.

```
ai-director/
├── hooks/           # useAIDirector
├── services/        # AIDirectorService
├── types/           # AIDirectorConfig, AnalysisResult
└── index.ts
```

**Ключевой функционал:**
- Комплексный анализ видео контента
- Генерация рекомендаций по монтажу
- Определение ключевых моментов
- Анализ темпа и ритма

```typescript
import { useAIDirector } from '@/domains/ai-director'

const { analyzeVideo, getRecommendations } = useAIDirector()
const analysis = await analyzeVideo(videoPath)
```

---

### AI Services

Централизованные AI сервисы для анализа медиа.

```
ai-services/
├── hooks/           # useAIServices, useContentAnalysis
├── machines/        # AIIntelligenceMachine (XState)
├── services/
│   ├── orchestrator/      # UnifiedOrchestrator
│   ├── analysis-storage/  # Хранение результатов
│   └── engines/           # Движки анализа
├── types/
└── index.ts
```

**Ключевой функционал:**
- UnifiedOrchestrator - координация всех AI сервисов
- Анализ видео/аудио контента
- Распознавание объектов (YOLO)
- Классификация контента

```typescript
import { getUnifiedOrchestrator } from '@/domains/ai-services'

const orchestrator = getUnifiedOrchestrator()
const analysis = await orchestrator.analyzeMedia(mediaFile)
```

---

### AI Tools

Набор AI инструментов для автоматизации.

```
ai-tools/
├── hooks/           # useMontagePlanner, useSubtitleAutomation
├── services/
│   ├── montage-planning/    # Автоматическая нарезка
│   ├── subtitle-automation/ # Автоматизация субтитров
│   └── browser-tools/       # AI поиск файлов
├── types/
└── index.ts
```

**Ключевой функционал:**
- Montage Planning - автоматическая нарезка видео
- Subtitle Automation - генерация субтитров
- Browser Tools - интеллектуальный поиск
- MCP Integration (Model Context Protocol)

```typescript
import { useMontagePlanner } from '@/domains/ai-tools'

const { generatePlan, applyPlan } = useMontagePlanner()
const plan = await generatePlan(videoFiles, style)
```

---

### Browser

Файловый браузер и медиа навигация.

```
browser/
├── hooks/           # useBrowser, useFileSelection
├── machines/        # BrowserStateMachine (XState)
├── services/        # BrowserService
├── types/           # FileEntry, BrowserState
└── index.ts
```

**Ключевой функционал:**
- Навигация по директориям
- Множественный выбор файлов
- Фильтрация и сортировка
- Табы для разных папок
- Drag & Drop интеграция

```typescript
import { useBrowser } from '@/domains/browser'

const { navigate, selectFiles, getSelectedFiles } = useBrowser()
await navigate('/path/to/media')
```

---

### Media Management

Импорт, организация и управление медиафайлами.

```
media-management/
├── hooks/           # useMediaManagement, useMediaImport
├── services/
│   ├── orchestrator/        # MediaManagementOrchestrator
│   ├── file-operations/     # Операции с файлами
│   ├── metadata/            # Извлечение метаданных
│   └── import/              # Импорт из источников
├── types/
└── index.ts
```

**Ключевой функционал:**
- Импорт медиафайлов
- Извлечение и управление метаданными
- Операции с файлами (копирование, перемещение)
- Генерация превью и waveforms
- Прокси файлы для производительности

```typescript
import { getMediaManagementOrchestrator } from '@/domains/media-management'

const orchestrator = getMediaManagementOrchestrator()
await orchestrator.importMedia(files, { generateProxies: true })
const metadata = await orchestrator.getMetadata(filePath)
```

---

### Project Management

Управление проектами и настройками.

```
project-management/
├── hooks/           # useProjectManagement, useUserSettings
├── machines/        # UserSettingsMachine (XState)
├── services/
│   ├── orchestrator/     # ProjectManagementOrchestrator
│   ├── autosave/         # Автосохранение
│   └── update/           # Управление обновлениями
├── types/
└── index.ts
```

**Ключевой функционал:**
- Создание, сохранение, загрузка проектов
- Пользовательские настройки
- Автосохранение
- Управление обновлениями приложения
- Экспорт/импорт проектов (AAF, FCPXML, EDL)

```typescript
import { getProjectManagementOrchestrator } from '@/domains/project-management'

const orchestrator = getProjectManagementOrchestrator()
await orchestrator.saveProject(projectData)
await orchestrator.exportProject(projectId, 'fcpxml')
```

---

### Shared

Общие компоненты, типы и утилиты.

```
shared/
├── event-bus/       # Domain Event Bus
├── types/           # Общие типы
├── utils/           # Утилиты
└── index.ts
```

**Включает:**
- Domain Event Bus для межкомпонентной коммуникации
- Общие типы и интерфейсы
- Утилиты для работы с файлами, временем, ID
- Контракты между доменами

```typescript
import { domainEventBus } from '@/domains/shared'

// Публикация события
domainEventBus.emit('clip:added', { clipId, trackId })

// Подписка на событие
domainEventBus.on('clip:added', async (event) => {
  await analyzeClip(event.payload.clipId)
})
```

---

### Subtitles

Работа с субтитрами.

```
subtitles/
├── hooks/           # useSubtitles
├── services/        # SubtitleService
├── types/           # Subtitle, SubtitleTrack
└── index.ts
```

**Ключевой функционал:**
- Импорт/экспорт субтитров (SRT, VTT, ASS)
- Синхронизация с видео
- Редактирование текста
- Стилизация

---

### System Integration

Системная интеграция и UI управление.

```
system-integration/
├── hooks/           # useNotifications, useModals, useShortcuts
├── services/
│   ├── orchestrator/        # SystemIntegrationOrchestrator
│   ├── backend-sync/        # BackendSync
│   ├── notification/        # NotificationService
│   ├── modal/               # ModalService
│   └── shortcut/            # ShortcutService
├── types/
└── index.ts
```

**Ключевой функционал:**
- Централизованные уведомления
- Управление модальными окнами
- Горячие клавиши
- BackendSync - синхронизация с Tauri backend
- Интеграция с ОС (трей, меню)

```typescript
import { useNotifications } from '@/domains/system-integration'

const { showSuccess, showError } = useNotifications()
showSuccess({ title: 'Готово', message: 'Файл сохранён' })
```

---

### Video Editing

Основная функциональность редактирования видео.

```
video-editing/
├── hooks/           # useTimeline, usePlayer, useEffects
├── machines/        # TimelineMachine, PlayerMachine
├── services/
│   ├── compiler/          # Компиляция видео
│   ├── timeline-ops/      # Операции с таймлайном
│   └── effects/           # Эффекты и переходы
├── types/
└── index.ts
```

**Ключевой функционал:**
- Timeline с треками и клипами
- Воспроизведение видео
- Эффекты и переходы
- Компиляция и экспорт
- Отмена/повтор операций

```typescript
import { useTimeline } from '@/domains/video-editing'

const { addClip, removeClip, splitClip, moveClip } = useTimeline()
await addClip(trackId, mediaFile, position)
```

---

## Структура домена

Каждый домен следует стандартной структуре:

```
domain-name/
├── __tests__/       # Тесты
├── hooks/           # React хуки
├── machines/        # XState машины
├── providers/       # React провайдеры
├── services/        # Бизнес-логика
│   └── orchestrator/  # Orchestrator (если есть)
├── types/           # TypeScript типы
├── utils/           # Утилиты домена
└── index.ts         # Публичный API
```

## Взаимодействие между доменами

### 1. Event-Driven

```typescript
// Video Editing публикует
domainEventBus.emit('clip:added', { clipId, trackId })

// AI Services реагирует
domainEventBus.on('clip:added', async ({ clipId }) => {
  await analyzeClip(clipId)
})
```

### 2. Через Core Layer

```typescript
// Оба домена используют один и тот же сервис из Core
import { getMedia } from '@/core/container'

// В Media Management
const metadata = await getMedia().getMetadata(path)

// В Video Editing
const thumbnail = await getMedia().generateThumbnail(path)
```

### 3. Прямой импорт типов

```typescript
// Импорт типов из другого домена допустим
import type { MediaFile } from '@/domains/media-management'
import type { TimelineClip } from '@/domains/video-editing'
```

---

*Создано: 2025-07-31*
*Обновлено: 2025-11-29*
