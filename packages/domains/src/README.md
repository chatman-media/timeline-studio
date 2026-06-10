# Timeline Studio Domains

Доменная архитектура Timeline Studio основана на принципах Domain-Driven Design (DDD).

## Обзор архитектуры

Timeline Studio использует доменно-ориентированную архитектуру для организации кода по бизнес-областям. Каждый домен инкапсулирует связанную функциональность и предоставляет четкий интерфейс для взаимодействия с другими частями приложения.

## Структура доменов

```
src/domains/
├── ai-director/          # AI Director - комплексный анализ видео
├── ai-services/          # AI сервисы и анализ медиа
├── ai-tools/             # AI инструменты для автоматизации
├── browser/              # Файловый браузер и навигация
├── media-management/     # Управление медиафайлами
├── project-management/   # Управление проектами и настройками
├── shared/               # Общие компоненты и утилиты
├── subtitles/            # Работа с субтитрами
├── system-integration/   # Системная интеграция и UI
└── video-editing/        # Редактирование видео
```

## Архитектурная эволюция

### Orchestrator Pattern + DI Container (2025)

Timeline Studio использует паттерн Orchestrator в сочетании с Dependency Injection контейнером:

- **DI Container** (`@/core/container`) - централизованное управление сервисами
- **Adapters** (`@/adapters/tauri`) - реализации сервисов для Tauri платформы
- **BackendSync** (`@/adapters/tauri/backend-sync`) - синхронизация с Tauri backend
- **Orchestrators** - координация бизнес-логики в каждом домене

## Описание доменов

### 🎬 AI Director
Комплексный анализ видео с использованием AI. Координация анализа сцен, аудио, качества.

**Ключевые компоненты:**
- Анализ видео контента
- Детекция сцен и объектов
- Оценка качества

### 🧠 AI Services
Централизованные AI сервисы для анализа и обработки медиа контента.

**Архитектура:**
- `UnifiedOrchestrator` - координация всех AI сервисов
- `AIDirectorService` - комплексный анализ медиа
- `AnalysisStorageService` - хранение результатов анализа
- `ChatProvider`, `MCPProvider` - провайдеры для AI чата

**Использование:**
```typescript
import { UnifiedOrchestrator, ChatProvider } from '@/domains/ai-services'
```

### 🛠️ AI Tools
Набор AI инструментов для автоматизации монтажа и анализа.

**Ключевые инструменты:**
- Montage Planning (автоматическая нарезка)
- Enhanced Subtitle Automation
- Browser Tools (поиск файлов)
- MCP Integration (Model Context Protocol)

### 📁 Browser
Управление файловой системой и медиа браузером.

**Архитектура:**
- `BrowserProvider` - провайдер с BackendSync интеграцией
- `browserMachine` - XState машина состояний
- Event-driven архитектура через backend events

**Использование:**
```typescript
import { BrowserProvider, useBrowser } from '@/domains/browser'
```

### 📦 Media Management
Импорт, организация и управление медиафайлами.

**Архитектура:**
- `MediaManagementOrchestrator` - координация импорта и операций
- `MediaManagementProvider` - React провайдер
- Сервисы: CameraImport, ProxyGenerator, SmartOrganization, WaveformGenerator

**Использование:**
```typescript
import {
  getMediaManagementOrchestrator,
  useMediaManagement
} from '@/domains/media-management'
```

### 📋 Project Management
Управление проектами, пользовательскими настройками и конфигурацией.

**Архитектура:**
- `ProjectManagementOrchestrator` - управление проектами
- `ApiKeysService` - безопасное хранение API ключей
- `BatchCommandsService` - пакетные команды к backend
- XState машины: `appMachine`, `userSettingsMachine`

**Использование:**
```typescript
import {
  getProjectManagementOrchestrator,
  useProjectManagement,
  useUserSettings
} from '@/domains/project-management'
```

### 🔗 Shared
Общие компоненты, типы и утилиты для всех доменов.

**Включает:**
- Domain Event Bus для межкомпонентной коммуникации
- Общие типы и интерфейсы
- Утилиты

**Использование:**
```typescript
import { useDomainEvents } from '@/domains/shared'
```

### 📝 Subtitles
Работа с субтитрами: импорт, экспорт, редактирование.

**Возможности:**
- Поддержка форматов SRT, VTT, ASS
- AI-генерация субтитров
- Синхронизация с видео

### 🖥️ System Integration
Интеграция с операционной системой, управление UI элементами.

**Архитектура:**
- `SystemIntegrationOrchestrator` - координация системных операций
- `useModals` - управление модальными окнами
- `useNotifications` - централизованные уведомления
- `useFeatures` - feature flags
- `useUpdates` - управление обновлениями

**Использование:**
```typescript
import {
  useNotifications,
  useModals,
  getSystemIntegrationOrchestrator
} from '@/domains/system-integration'
```

### 🎬 Video Editing
Основная функциональность редактирования видео.

**Архитектура:**
- `VideoEditingOrchestrator` - координация редактирования
- `TimelineProvider` и специализированные провайдеры
- `playerMachine`, `timelineMachine` - XState машины
- Сервисы: Compiler, Effects, Import/Export, UndoRedo

**Использование:**
```typescript
import {
  getVideoEditingOrchestrator,
  TimelineProvider,
  useTimelineClips
} from '@/domains/video-editing'
```

## Интеграция с Backend

### BackendSync

BackendSync обеспечивает двустороннюю синхронизацию с Tauri backend. **Важно:** теперь находится в `@/adapters/tauri`:

```typescript
import { getBackendSync } from '@/adapters/tauri'

// В хуке или сервисе
const backendSync = getBackendSync()

// Подписка на изменения состояния
backendSync.onStateChange('player', (state) => {
  console.log('Player state:', state)
})

// Подписка на события
backendSync.onEvent('MediaImported', (event) => {
  console.log('Media imported:', event)
})

// Выполнение команды
await backendSync.executeCommand({
  type: 'Play',
  params: {}
})
```

### DI Container

Сервисы регистрируются в контейнере при инициализации:

```typescript
import { container } from '@/core/container'
import { initTauriApp } from '@/adapters/tauri'

// Инициализация приложения
await initTauriApp()

// Получение сервисов
const backend = container.getBackend()
const media = container.getMedia()
```

## Принципы организации

### 1. Изоляция доменов
Каждый домен максимально независим и содержит всю необходимую логику.

### 2. Четкие границы
Взаимодействие между доменами через:
- Публичные интерфейсы (index.ts)
- Domain Event Bus
- DI Container

### 3. Единообразная структура
```
domain-name/
├── hooks/       # React хуки
├── machines/    # XState машины состояний
├── providers/   # React провайдеры
├── services/    # Бизнес-логика и оркестраторы
├── tauri/       # Tauri команды
├── types/       # TypeScript типы
├── utils/       # Утилиты
└── index.ts     # Публичный API
```

## Best Practices

### Использование хуков вместо прямого доступа к оркестраторам

```typescript
// ✅ Правильно - используйте хуки в компонентах
import { useMediaManagement } from '@/domains/media-management'

function MyComponent() {
  const { importMedia } = useMediaManagement()
  await importMedia(files)
}

// ⚠️ Допустимо - прямой доступ в non-React коде
import { getMediaManagementOrchestrator } from '@/domains/media-management'
const orchestrator = getMediaManagementOrchestrator()
```

### Централизованные уведомления

```typescript
// ✅ Правильно
import { useNotifications } from '@/domains/system-integration'

function MyComponent() {
  const { showSuccess, showError } = useNotifications()

  try {
    await someOperation()
    showSuccess({ title: 'Успех', message: 'Операция завершена' })
  } catch (error) {
    showError({ title: 'Ошибка', message: error.message })
  }
}

// ❌ Неправильно - не используйте toast напрямую
import { toast } from 'sonner'
toast.success('Success')
```

### BackendSync в сервисах

```typescript
import { getBackendSync } from '@/adapters/tauri'

class MyService {
  private backendSync = getBackendSync()

  async performOperation(params: Params) {
    return await this.backendSync.executeCommand({
      type: 'MyCommand',
      params
    })
  }
}
```

## Тестирование

Используйте моки для изоляции тестов:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/adapters/tauri', () => ({
  getBackendSync: vi.fn(() => ({
    executeCommand: vi.fn(),
    onStateChange: vi.fn(() => () => {}),
    onEvent: vi.fn(() => () => {}),
  })),
}))

describe('MyService', () => {
  it('should perform operation', async () => {
    // test implementation
  })
})
```

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.
