# Timeline Studio Domains

Доменная архитектура Timeline Studio основана на принципах Domain-Driven Design (DDD).

## Обзор архитектуры

Timeline Studio использует доменно-ориентированную архитектуру для организации кода по бизнес-областям. Каждый домен инкапсулирует связанную функциональность и предоставляет четкий интерфейс для взаимодействия с другими частями приложения.

## Структура доменов

```
src/domains/
├── ai-services/          # AI сервисы и анализ
├── ai-tools/             # AI инструменты
├── browser/              # Файловый браузер и навигация
├── media-management/     # Управление медиафайлами
├── project-management/   # Управление проектами и настройками
├── shared/               # Общие компоненты и утилиты
├── system-integration/   # Системная интеграция и UI
└── video-editing/        # Редактирование видео
```

## Архитектурная эволюция

### Orchestrator Pattern (2025)
Timeline Studio завершил миграцию на паттерн Orchestrator для всех доменов. Этот паттерн обеспечивает:
- **Единую точку входа** для каждого домена через singleton orchestrator
- **Централизованное управление** уведомлениями, логированием и обработкой ошибок
- **Интеграцию с backend** через BackendSync для синхронизации с Tauri
- **Упрощенные React providers** без дублирования бизнес-логики
- **Согласованный API** между всеми доменами

**Статистика миграции:**
- ✅ 6236+ строк доменных сервисов
- ✅ 33 файла мигрированы с прямого `toast` на `useNotifications`
- ✅ 5 основных orchestrator'ов внедрены
- ✅ Все домены следуют единому паттерну

## Описание доменов

### 🧠 AI Services
Специализированные AI сервисы для анализа медиа контента. Включает анализ видео/аудио, распознавание объектов, классификацию контента.

**Архитектура:** UnifiedOrchestrator (образцовая реализация, рейтинг 9/10)
- `UnifiedOrchestrator` - Координация всех AI сервисов
- `AIDirectorService` - Комплексный анализ медиа
- `AnalysisStorageService` - Хранение результатов анализа
- `AIIntelligenceMachine` - XState машина для управления состоянием

**Singleton доступ:**
```typescript
import { getUnifiedOrchestrator } from '@/domains/ai-services'
const orchestrator = getUnifiedOrchestrator()
await orchestrator.analyzeMedia(mediaFile)
```

### 🛠️ AI Tools
Набор AI инструментов для автоматизации монтажа, субтитров и анализа контента.

**Ключевые инструменты:**
- Montage Planning (автоматическая нарезка)
- Enhanced Subtitle Automation
- Browser Tools (поиск файлов)
- MCP Integration (Model Context Protocol)

### 📁 Browser
Управление файловой системой и медиа браузером. Поддержка вкладок, фильтрации, поиска и предпросмотра файлов.

**Функциональность:**
- Навигация по директориям
- Множественный выбор файлов
- Фильтрация и сортировка
- Интеграция с drag & drop

### 📦 Media Management
Импорт, организация и управление медиафайлами. Работа с метаданными, прокси файлами и структурой проекта.

**Архитектура:** MediaManagementOrchestrator (613 строк)
- `MediaManagementOrchestrator` - Координация импорта и операций с медиа
- `MediaFileOperations` - Операции с файлами (копирование, перемещение)
- `MediaMetadataService` - Извлечение и управление метаданными
- `MediaImportService` - Импорт из различных источников

**Singleton доступ:**
```typescript
import { getMediaManagementOrchestrator } from '@/domains/media-management'
const orchestrator = getMediaManagementOrchestrator()
await orchestrator.importMedia(files)
```

### 📋 Project Management
Управление проектами, пользовательскими настройками и конфигурацией приложения.

**Архитектура:** ProjectManagementOrchestrator с упрощенным provider
- `ProjectManagementOrchestrator` - Управление проектами и настройками
- `UserSettingsMachine` - XState машина для пользовательских настроек
- `AutosaveService` - Автоматическое сохранение проектов
- `UpdateManagement` - Управление обновлениями приложения

**Singleton доступ:**
```typescript
import { getProjectManagementOrchestrator } from '@/domains/project-management'
const orchestrator = getProjectManagementOrchestrator()
await orchestrator.saveProject(projectData)
```

### 🔗 Shared
Общие компоненты, типы и утилиты, используемые всеми доменами.

**Включает:**
- Domain Event Bus для межкомпонентной коммуникации
- Общие типы и интерфейсы
- Утилиты для работы с файлами, временем, ID
- Контракты между доменами

### 🖥️ System Integration
Интеграция с операционной системой, управление UI элементами.

**Архитектура:** SystemIntegrationOrchestrator с BackendSync
- `SystemIntegrationOrchestrator` - Координация системных операций
- `BackendSync` - Двусторонняя синхронизация с Tauri backend
- `NotificationService` - Централизованное управление уведомлениями
- `ModalService` - Управление модальными окнами
- `ShortcutService` - Горячие клавиши

**Singleton доступ:**
```typescript
import { getSystemIntegrationOrchestrator } from '@/domains/system-integration'
const orchestrator = getSystemIntegrationOrchestrator()
orchestrator.showNotification({ title: 'Success', message: 'Done!' })
```

### 🎬 Video Editing
Основная функциональность редактирования видео.

**Архитектура:** Доменные сервисы для операций с видео
- Video Compiler сервисы для компиляции и экспорта
- Timeline операции через domain services
- Интеграция с FFmpeg через Tauri backend
- Эффекты и переходы через CSS-based processing

**Возможности:**
- Timeline с треками и клипами
- Эффекты и переходы
- Импорт/экспорт (AAF, FCPXML, EDL)
- Воспроизведение и навигация

## Принципы организации

### 1. Изоляция доменов
Каждый домен максимально независим и содержит всю необходимую логику для своей предметной области.

### 2. Четкие границы
Взаимодействие между доменами происходит через:
- Публичные интерфейсы (контракты)
- Domain Event Bus
- DI Container

### 3. Единообразная структура
Каждый домен следует стандартной структуре:
```
domain-name/
├── hooks/       # React хуки
├── machines/    # XState машины состояний
├── providers/   # React провайдеры
├── services/    # Бизнес-логика
├── types/       # TypeScript типы
├── utils/       # Утилиты
└── index.ts     # Публичный API
```

### 4. Тестируемость
Каждый домен содержит тесты в `__tests__` директориях, организованные по типу компонентов.

## Взаимодействие между доменами

### Event-Driven Communication
```typescript
// Video Editing публикует событие
domainEventBus.emit('clip:added', { clipId, trackId })

// AI Services реагирует на событие
domainEventBus.on('clip:added', async (event) => {
  await analyzeClip(event.payload.clipId)
})
```

### Service Contracts
```typescript
// Shared домен определяет контракт
interface IMediaAnalysisContract {
  analyzeFile(path: string): Promise<AnalysisResult>
}

// AI Services реализует контракт
class MediaAnalysisService implements IMediaAnalysisContract {
  async analyzeFile(path: string) { /* ... */ }
}
```

### Dependency Injection
```typescript
// Регистрация сервиса
container.registerSingleton('MediaAnalysis', MediaAnalysisService)

// Использование в другом домене
const analyzer = await container.resolve('MediaAnalysis')
```

## Миграция на доменную архитектуру

При переносе кода из старой структуры (`src/features`, `src/shared`):

1. Определите целевой домен по бизнес-логике
2. Создайте необходимую структуру папок
3. Перенесите код с сохранением функциональности
4. Обновите импорты
5. Создайте re-export для обратной совместимости
6. Добавьте тесты

## Best Practices

### Общие принципы доменов

1. **Минимизируйте зависимости** между доменами
2. **Используйте события** для слабой связанности
3. **Определяйте контракты** для критичных интерфейсов
4. **Документируйте** публичные API каждого домена
5. **Тестируйте** изолированно каждый домен
6. **Версионируйте** критичные изменения

### Orchestrator Pattern Best Practices

#### 1. Singleton Pattern
Всегда используйте singleton getter для доступа к orchestrator:

```typescript
// ✅ Правильно
import { getMediaManagementOrchestrator } from '@/domains/media-management'

function MyComponent() {
  const orchestrator = getMediaManagementOrchestrator()
  // использование orchestrator
}

// ❌ Неправильно - не создавайте новые экземпляры
const orchestrator = new MediaManagementOrchestrator()
```

#### 2. Использование через Provider
Предпочитайте использование orchestrator через React context:

```typescript
// ✅ Правильно - используйте hook
import { useMediaManagement } from '@/domains/media-management'

function MyComponent() {
  const { importMedia, getMediaMetadata } = useMediaManagement()
  await importMedia(files)
}

// ⚠️ Допустимо - прямой доступ в non-React коде
import { getMediaManagementOrchestrator } from '@/domains/media-management'
const orchestrator = getMediaManagementOrchestrator()
await orchestrator.importMedia(files)
```

#### 3. Обработка уведомлений
Используйте `useNotifications` hook для отображения уведомлений:

```typescript
// ✅ Правильно
import { useNotifications } from '@/domains/system-integration'

function MyComponent() {
  const { showSuccess, showError } = useNotifications()

  try {
    await someOperation()
    showSuccess({ title: 'Success', message: 'Operation completed' })
  } catch (error) {
    showError({ title: 'Error', message: error.message })
  }
}

// ❌ Неправильно - не используйте toast напрямую
import { toast } from 'sonner'
toast.success('Success')
```

#### 4. BackendSync Integration
Для операций с Tauri backend используйте BackendSync:

```typescript
// В orchestrator
import { getBackendSync } from '@/domains/system-integration'

class MyOrchestrator {
  private backendSync = getBackendSync()

  async someOperation() {
    // BackendSync автоматически обрабатывает ошибки и показывает уведомления
    const result = await this.backendSync.invoke('my_command', { params })
    return result
  }
}
```

#### 5. Структура Orchestrator
Следуйте стандартной структуре для новых orchestrator'ов:

```typescript
import { getBackendSync } from '@/domains/system-integration'
import type { Logger } from '@/shared/utils/logger'

export class MyDomainOrchestrator {
  private static instance: MyDomainOrchestrator | null = null
  private backendSync = getBackendSync()
  private logger: Logger

  private constructor() {
    this.logger = {
      info: (msg: string) => console.log(`[MyDomain] ${msg}`),
      error: (msg: string) => console.error(`[MyDomain] ${msg}`),
      warn: (msg: string) => console.warn(`[MyDomain] ${msg}`),
    }
  }

  static getInstance(): MyDomainOrchestrator {
    if (!this.instance) {
      this.instance = new MyDomainOrchestrator()
    }
    return this.instance
  }

  // Публичные методы домена
  async myOperation(params: MyParams): Promise<MyResult> {
    this.logger.info('Starting operation')

    try {
      const result = await this.backendSync.invoke('my_command', params)
      this.logger.info('Operation completed')
      return result
    } catch (error) {
      this.logger.error(`Operation failed: ${error}`)
      throw error
    }
  }
}

// Singleton getter
export const getMyDomainOrchestrator = () =>
  MyDomainOrchestrator.getInstance()
```

#### 6. Provider Pattern
Создавайте упрощенные providers без дублирования логики:

```typescript
import { createContext, useContext } from 'react'
import { getMyDomainOrchestrator } from './orchestrator'

const MyDomainContext = createContext<ReturnType<typeof getMyDomainOrchestrator> | null>(null)

export function MyDomainProvider({ children }: { children: React.ReactNode }) {
  const orchestrator = getMyDomainOrchestrator()

  return (
    <MyDomainContext.Provider value={orchestrator}>
      {children}
    </MyDomainContext.Provider>
  )
}

export function useMyDomain() {
  const context = useContext(MyDomainContext)
  if (!context) {
    throw new Error('useMyDomain must be used within MyDomainProvider')
  }
  return context
}
```

#### 7. Тестирование Orchestrator
Используйте моки для изоляции тестов:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MyDomainOrchestrator } from '../orchestrator'

vi.mock('@/domains/system-integration', () => ({
  getBackendSync: vi.fn(() => ({
    invoke: vi.fn(),
  })),
}))

describe('MyDomainOrchestrator', () => {
  let orchestrator: MyDomainOrchestrator

  beforeEach(() => {
    orchestrator = MyDomainOrchestrator.getInstance()
  })

  it('should perform operation', async () => {
    const result = await orchestrator.myOperation(params)
    expect(result).toBeDefined()
  })
})
```

## Миграция на Orchestrator Pattern - Завершена ✅

### Обзор миграции

В 2025 году Timeline Studio завершил полную миграцию на паттерн Orchestrator для всех основных доменов. Эта архитектурная эволюция обеспечивает:

- **Единообразие:** Все домены следуют одному паттерну
- **Надежность:** Централизованная обработка ошибок и логирование
- **Тестируемость:** Упрощенное мокирование и изоляция тестов
- **Расширяемость:** Простое добавление новых функций
- **Производительность:** Singleton pattern предотвращает дублирование экземпляров

### Статистика миграции

**Созданные Orchestrator'ы:**
1. **SystemIntegrationOrchestrator** - Системная интеграция и уведомления
2. **MediaManagementOrchestrator** (613 строк) - Управление медиафайлами
3. **ProjectManagementOrchestrator** - Управление проектами и настройками
4. **UnifiedOrchestrator** (AI Services) - Координация AI сервисов (рейтинг 9/10)
5. **Video Editing Domain Services** - Операции с видео и компиляция

**Рефакторинг уведомлений:**
- 33 файла мигрированы с прямого использования `toast` на `useNotifications`
- Все уведомления теперь централизованы через SystemIntegrationOrchestrator
- Единообразная обработка ошибок и успешных операций

**Объем кода:**
- 6236+ строк доменных сервисов
- Полная интеграция с BackendSync для Tauri
- Упрощенные React providers без дублирования логики

### BackendSync - Ключевой компонент

BackendSync обеспечивает двустороннюю синхронизацию между React frontend и Tauri backend:

```typescript
import { getBackendSync } from '@/domains/system-integration'

// В orchestrator
class MyOrchestrator {
  private backendSync = getBackendSync()

  async performOperation(params: Params) {
    // Автоматическая обработка ошибок и уведомлений
    return await this.backendSync.invoke('tauri_command', params)
  }
}
```

**Возможности BackendSync:**
- Автоматическая обработка ошибок Tauri
- Централизованное логирование
- Интеграция с системой уведомлений
- Типобезопасные вызовы команд
- Graceful error handling

### Преимущества новой архитектуры

**До миграции:**
```typescript
// Дублирование логики в provider и сервисе
// Прямые вызовы toast из компонентов
// Разрозненная обработка ошибок
import { toast } from 'sonner'
import { invoke } from '@tauri-apps/api/core'

try {
  const result = await invoke('command')
  toast.success('Success')
} catch (error) {
  toast.error(error.message)
}
```

**После миграции:**
```typescript
// Централизованная логика в orchestrator
// Единообразные уведомления
// Автоматическая обработка ошибок
import { useMediaManagement } from '@/domains/media-management'

const { importMedia } = useMediaManagement()
// Автоматические уведомления и обработка ошибок
await importMedia(files)
```

### Следующие шаги

Хотя основная миграция завершена, продолжается работа над:

1. **Оптимизация производительности** orchestrator'ов
2. **Расширение тестового покрытия** для всех orchestrator'ов
3. **Документация** лучших практик и паттернов
4. **Миграция legacy компонентов** на использование orchestrator'ов
5. **Создание инструментов** для автоматической генерации orchestrator'ов

## Дальнейшее развитие

Планируемые домены:
- `collaboration/` - Совместная работа
- `cloud-sync/` - Облачная синхронизация
- `plugins/` - Система плагинов
- `automation/` - Автоматизация процессов

Все новые домены будут следовать паттерну Orchestrator с первого дня.

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.