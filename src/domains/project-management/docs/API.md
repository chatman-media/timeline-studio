# Project Management Domain - API Reference

## Table of Contents

- [React Hooks](#react-hooks)
- [Providers](#providers)
- [Services](#services)
- [State Machines](#state-machines)
- [Backend Commands](#backend-commands)
- [Types](#types)

---

## React Hooks

### useAppState()

Состояние подключения к backend.

```typescript
import { useAppState } from "@/domains/project-management"

const { isConnected, isInitialized, error } = useAppState()
```

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `isConnected` | `boolean` | Статус подключения к backend |
| `isInitialized` | `boolean` | Инициализация завершена |
| `error` | `string \| null` | Текущая ошибка |

---

### useProjectManagement()

Управление проектом.

```typescript
import { useProjectManagement } from "@/domains/project-management"

const {
  projectState,
  createProject,
  openProject,
  saveProject,
  closeProject,
  isDirty,
  markDirty
} = useProjectManagement()
```

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `projectState` | `ProjectState \| null` | Текущее состояние проекта |
| `createProject` | `(settings: ProjectSettings) => Promise<void>` | Создать новый проект |
| `openProject` | `(path: string) => Promise<void>` | Открыть проект |
| `saveProject` | `() => Promise<void>` | Сохранить проект |
| `closeProject` | `() => Promise<void>` | Закрыть проект |
| `isDirty` | `boolean` | Есть несохраненные изменения |
| `markDirty` | `() => void` | Пометить проект как измененный |

---

### useUserSettings()

Пользовательские настройки.

```typescript
import { useUserSettings } from "@/domains/project-management"

const { settings, updateSettings, isLoading } = useUserSettings()
```

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `settings` | `UserSettings` | Текущие настройки |
| `updateSettings` | `(settings: Partial<UserSettings>) => void` | Обновить настройки |
| `isLoading` | `boolean` | Загрузка настроек |

---

## Providers

### ProjectManagementProvider

Главный провайдер домена. Оборачивает все остальные провайдеры.

**Архитектура: Single Source of Truth**
- Использует `ProjectManagementOrchestrator` как единственный источник состояния
- Провайдеры читают состояние из XState акторов оркестратора через `useSelector`
- Минимальное локальное состояние только для UI-специфичных данных (dirty flags)
- Все команды выполняются через методы оркестратора

```tsx
import { ProjectManagementProvider } from "@/domains/project-management"

function App() {
  return (
    <ProjectManagementProvider>
      <YourApp />
    </ProjectManagementProvider>
  )
}
```

**Внутренняя структура:**
```tsx
// Упрощенная версия без дублирования состояния
<ProjectProvider>          {/* Читает из appActor */}
  <UserSettingsProvider>   {/* Читает из userSettingsActor */}
    <AppStateProvider>     {/* Читает из appActor */}
      {children}
    </AppStateProvider>
  </UserSettingsProvider>
</ProjectProvider>
```

### Отдельные провайдеры

Для более гранулярного контроля:

- `AppStateProvider` - состояние приложения (использует `appActor` из оркестратора)
- `UserSettingsProvider` - настройки пользователя (использует `userSettingsActor` из оркестратора)
- `ProjectProvider` - состояние проекта (использует `appActor` из оркестратора)

**Важно:** Все провайдеры используют `useSelector` для подписки на состояние XState акторов. Локальное состояние минимизировано.

---

## Services

### ProjectManagementOrchestrator

Singleton оркестратор для координации операций.

```typescript
import {
  getProjectManagementOrchestrator,
  resetProjectManagementOrchestrator
} from "@/domains/project-management"

// Получить инстанс
const orchestrator = getProjectManagementOrchestrator()

// Выполнить команду
await orchestrator.executeCommand({ type: "SaveProject" })

// Сброс (для тестов)
resetProjectManagementOrchestrator()
```

---

### ApiKeysService

Управление API ключами для внешних сервисов.

```typescript
import { apiKeysService, ApiKeysService } from "@/domains/project-management"

// Сохранить ключ
await apiKeysService.saveApiKey("openai", "sk-...")

// Получить ключ
const key = await apiKeysService.getApiKey("openai")

// Валидировать ключ
const isValid = apiKeysService.validateApiKey("openai", "sk-...")

// Удалить ключ
await apiKeysService.deleteApiKey("openai")
```

**Поддерживаемые провайдеры:**
- `openai` - OpenAI API
- `anthropic` - Anthropic Claude API
- `assemblyai` - AssemblyAI Transcription

---

### AppDirectoriesService

Работа с директориями приложения.

```typescript
import { appDirectoriesService } from "@/domains/project-management"

// Получить пути директорий
const dirs = await appDirectoriesService.getDirectories()
// { cache: "...", config: "...", data: "...", temp: "..." }

// Получить размеры
const sizes = await appDirectoriesService.getDirectorySizes()

// Очистить кэш
await appDirectoriesService.clearCache()
```

---

### BatchCommandsService

Пакетное выполнение команд.

```typescript
import { createBatch, executeBatch, BatchCommandBuilder } from "@/domains/project-management"

// Простое использование
const results = await executeBatch([
  { type: "SaveProject" },
  { type: "UpdateUserSettings", settings: {...} }
])

// С билдером
const batch = new BatchCommandBuilder()
  .add({ type: "SaveProject" })
  .add({ type: "CloseProject" })
  .stopOnError(true)
  .build()

const result = await executeBatch(batch.commands)
```

---

### PerformanceMetricsTracker

Мониторинг производительности.

```typescript
import { getPerformanceMetricsTracker } from "@/domains/project-management"

const tracker = getPerformanceMetricsTracker()

// Получить отчет
const report = tracker.getReport()
console.log({
  totalCommands: report.totalCommands,
  averageCommandTime: report.averageCommandTime,
  stateUpdatesPerSecond: report.stateUpdatesPerSecond,
  currentMemoryUsage: report.currentMemoryUsage
})

// Логировать отчет
tracker.logReport()

// Сбросить метрики
tracker.reset()
```

---

## State Machines

### appMachine

XState машина управления состоянием приложения.

**States:**
- `disconnected` - Не подключено к backend
- `connecting` - Подключение
- `connected` - Подключено
- `error` - Ошибка

**Events:**
- `CONNECT` - Подключиться
- `DISCONNECT` - Отключиться
- `EXECUTE_COMMAND` - Выполнить команду

---

### userSettingsMachine

XState машина пользовательских настроек.

**States:**
- `idle` - Готово к использованию
- `loading` - Загрузка настроек
- `saving` - Сохранение настроек

**Events:**
- `UPDATE_SETTINGS` - Обновить настройки
- `RESET_SETTINGS` - Сбросить к умолчаниям

---

## Backend Commands

### Project Lifecycle

```typescript
// Создание проекта
executeCommand({ type: "CreateProject", settings: ProjectSettings })

// Открытие проекта
executeCommand({ type: "OpenProject", path: string })

// Сохранение проекта
executeCommand({ type: "SaveProject" })

// Закрытие проекта
executeCommand({ type: "CloseProject" })
```

### Settings Management

```typescript
// Обновить настройки
executeCommand({ type: "UpdateUserSettings", settings: UserSettings })

// Получить настройки
executeCommand({ type: "GetUserSettings" })
```

### State Management

```typescript
// Получить состояние проекта
BackendSync.getProjectState()

// Получить историю событий
BackendSync.getEventHistory(sinceVersion?: number)

// Batch выполнение
executeCommand({
  type: "ExecuteBatch",
  commands: ProjectCommand[],
  stopOnError: boolean
})
```

---

## Types

### ProjectState

```typescript
interface ProjectState {
  isProjectOpen: boolean
  projectPath: string | null
  projectSettings: ProjectSettings | null
  isDirty: boolean
  lastModifiedTime: number | null
  lastSavedTime: number | null
}
```

### ProjectSettings

```typescript
interface ProjectSettings {
  name: string
  resolution: { width: number; height: number }
  frameRate: number
  audioSampleRate: number
  // ...
}
```

### UserSettings

```typescript
interface UserSettings {
  language: string
  theme: "light" | "dark" | "system"
  autoSaveEnabled: boolean
  autoSaveInterval: number
  gpuAcceleration: boolean
  // ...
}
```

### CommandResult

```typescript
interface CommandResult {
  success: boolean
  error?: string
  data?: any
}
```

### BatchCommandResult

```typescript
interface BatchCommandResult {
  results: CommandResult[]
  success_count: number
  error_count: number
  execution_time_ms: number
  success: boolean
  error_message?: string
}
```

### PerformanceReport

```typescript
interface PerformanceReport {
  totalCommands: number
  averageCommandTime: number
  slowestCommand: CommandMetric | null
  fastestCommand: CommandMetric | null
  stateUpdatesPerSecond: number
  currentMemoryUsage: number
  peakMemoryUsage: number
}
```
