# Project Management Domain - Changelog

## [2025-11-27] Provider Simplification

### ✅ Упрощена архитектура провайдера

**Изменения:**
- Упрощен `ProjectManagementProvider` для использования оркестратора как единственного источника состояния (single source of truth)
- Удалено 169 lines дублированного кода управления состоянием (~46% reduction)
- Удалено локальное состояние `localContext` из всех провайдеров
- Удалена event-driven логика из провайдера
- Теперь использует `ProjectManagementOrchestrator` напрямую через `useSelector`

**Архитектурные улучшения:**
```tsx
// ДО: Дублирование состояния (369 lines)
const [projectState, setProjectState] = useState(null)
useEffect(() => {
  const unsubscribe = orchestrator.onProjectStateChange(setProjectState)
}, [])

// ПОСЛЕ: Single source of truth (200 lines)
const appActor = orchestrator.getAppActor()
const projectState = useSelector(appActor, (state) => state.context.projectState)
```

**Результаты:**
- ✅ Все 228 тестов проходят
- ✅ Устранены race conditions между локальным и глобальным состоянием
- ✅ Упрощена логика синхронизации
- ✅ Минимальное локальное состояние (только dirty flags)

**Файлы:**
- `providers/project-management-provider.tsx` - упрощен с 369 до 200 lines
- Все тесты обновлены и проходят

---

## Обзор

Модуль `project-management` - ключевой домен для управления проектами и пользовательскими настройками в Timeline Studio.

## Результаты аудита (2025-11-08)

### ✅ Исправлено

#### 1. TypeScript ошибки (25 → 0)
- ✅ Исправлены типы ProjectState (удалено несуществующее hasUnsavedChanges)
- ✅ Исправлены типы BackendSync (использование геттера connected вместо приватного isConnected)
- ✅ Исправлены типы commands в BackendSync интеграции
- ✅ Исправлены типы в тестах (ProjectSettings, BrowserTab)

#### 2. BackendSync интеграция
- ✅ Убраны некорректные вызовы executeCommand с кастомными типами
- ✅ Используется правильный API BackendSync.getProjectState()
- ✅ Корректная подписка на события через onEvent
- ✅ Проверка подключения через геттер connected

#### 3. Legacy код
- ✅ Нет прямых обращений к @tauri-apps/api
- ✅ Нет использования localStorage/sessionStorage
- ✅ Все операции через BackendSync

#### 4. Тесты
- ✅ Создано 3 test suite (59 тестов total)
- ✅ app-machine.test.ts (11 тестов)
- ✅ user-settings-machine.test.ts (28 тестов)
- ✅ project-management-orchestrator.test.ts (20 тестов)
- ✅ 100% тестов проходят

### 📊 Статистика

**До аудита:**
- TypeScript ошибки: 25
- Тесты: 0
- Legacy код: Присутствовал

**После аудита:**
- TypeScript ошибки: 0
- Тесты: 59 (100% pass)
- Legacy код: Отсутствует

## Архитектура

### Основные компоненты

#### 1. App Machine
- Управляет подключением к backend
- Очередь команд
- Состояние проекта
- Обработка ошибок

#### 2. User Settings Machine
- Пользовательские настройки
- API ключи
- GPU настройки
- Автосохранение

#### 3. Project Management Orchestrator
- Координирует operations
- Управляет акторами
- Автосохранение проектов

#### 4. React Providers
- ProjectProvider - состояние проекта
- UserSettingsProvider - настройки пользователя
- ProjectManagementProvider - состояние приложения

## Использование

```tsx
import { useProject, useUserSettings, useAppState } from "@/domains/project-management"

function MyComponent() {
  const { projectState, saveProject } = useProject()
  const { settings, updateSettings } = useUserSettings()
  const { isConnected } = useAppState()
}
```

## Exports / Экспорты

### React Hooks
- `useAppState()` - состояние подключения к backend
- `useProjectManagement()` - управление проектом
- `useUserSettings()` - пользовательские настройки

### Providers
- `ProjectManagementProvider` - главный провайдер
- `ProjectManagementProvider` - состояние приложения
- `UserSettingsProvider` - настройки пользователя
- `ProjectProvider` - состояние проекта

### State Machines
- `appMachine` - XState машина приложения
- `userSettingsMachine` - XState машина настроек

### Services
- `getProjectManagementOrchestrator()` - singleton оркестратор
- `resetProjectManagementOrchestrator()` - сброс оркестратора
- `getPerformanceMetricsTracker()` - трекер метрик

### Types
- `ProjectState`, `ProjectSettings`, `UserSettings`
- `ProjectCommand`, `ProjectEvent`
- `PerformanceReport`, `CommandMetric`, `MemorySnapshot`

## API (Backend Commands)

Модуль использует централизованную систему команд через `executeCommand` и специализированные Tauri команды для работы с проектами.

### Core Commands / Основные команды

**Расположение:** `src-tauri/src/state/commands/types.rs`

```rust
// Project Lifecycle Commands
ProjectCommand::CreateProject { settings }
ProjectCommand::OpenProject { path }
ProjectCommand::SaveProject
ProjectCommand::CloseProject

// Settings Management
ProjectCommand::UpdateUserSettings { settings }
ProjectCommand::GetUserSettings

// Browser Integration (см. Browser domain)
ProjectCommand::BrowserSwitchTab { tab }
ProjectCommand::BrowserSelectFile { file_id, tab }
// ... остальные browser команды
```

### Project Schema Commands / Команды схемы проекта

**Расположение:** `src-tauri/src/video_compiler/commands/project/commands.rs`

#### Schema Validation & Optimization / Валидация и оптимизация схемы

```rust
// Валидировать схему проекта
validate_project_schema(project_schema: ProjectSchema) -> Result<ValidationResult>

// Оптимизировать схему проекта (треки, настройки экспорта)
optimize_project_schema(project_schema: ProjectSchema) -> Result<ProjectSchema>

// Анализировать проект и получить статистику
analyze_project(project_schema: ProjectSchema) -> Result<ProjectStatistics>

// Обновить время доступа к проекту
touch_project_schema(project: ProjectSchema) -> Result<ProjectSchema>
```

#### Media Management / Управление медиа

```rust
// Получить список медиафайлов в проекте
get_project_media_files(project_schema: ProjectSchema) -> Result<Vec<String>>

// Проверить доступность медиафайлов проекта
check_project_media_availability(
  project_schema: ProjectSchema
) -> Result<HashMap<String, bool>>

// Обновить пути медиафайлов в проекте (remapping)
update_project_media_paths(
  project_schema: ProjectSchema,
  path_mapping: HashMap<String, String>
) -> Result<ProjectSchema>
```

#### Subtitles Management / Управление субтитрами

```rust
// Добавить субтитры в проект
add_subtitles_to_project(
  project_schema: ProjectSchema,
  subtitles: Vec<Subtitle>
) -> Result<ProjectSchema>

// Извлечь субтитры из проекта в указанном формате
extract_project_subtitles(
  project_schema: ProjectSchema,
  format: String  // "srt" | "vtt" | "ass"
) -> Result<String>

// Валидация субтитров
validate_subtitle(subtitle: Subtitle) -> Result<ValidationResult>
```

#### Project Operations / Операции с проектами

```rust
// Создать резервную копию проекта
backup_project(
  project_schema: ProjectSchema,
  backup_path: String
) -> Result<String>

// Объединить два проекта (merge)
merge_projects(
  base_project: ProjectSchema,
  append_project: ProjectSchema,
  time_offset: f64
) -> Result<ProjectSchema>

// Разделить проект на части (split at points)
split_project(
  project_schema: ProjectSchema,
  split_points: Vec<f64>
) -> Result<Vec<ProjectSchema>>
```

#### Track & Clip Operations / Операции с треками и клипами

```rust
// Операции с треками
track_operations(
  track: Track,
  operation: String,      // "add_clip" | "remove_clip"
  params: serde_json::Value
) -> Result<Track>

// Информация о клипе
get_clip_info(
  clip: Clip,
  info_type: String      // "timeline_duration" | "contains_time"
) -> Result<serde_json::Value>
```

### State Management / Управление состоянием

**Расположение:** `src-tauri/src/state/commands_api.rs`

```rust
// Получить текущее состояние проекта
get_project_state() -> Result<ProjectState>

// Получить историю событий начиная с указанной версии
get_event_history(since_version: Option<u32>) -> Result<Vec<EventEnvelope>>

// Выполнить одну команду
execute_command(command: ProjectCommand) -> Result<CommandResult>

// Выполнить batch команд (транзакция)
execute_batch_commands(request: BatchCommandRequest) -> Result<BatchCommandResult>
```

### Frontend API / Frontend API

Frontend обёртки для команд (через хуки):

| Hook | Method | Description |
|------|--------|-------------|
| `useProject()` | `createProject(settings)` | Создание нового проекта |
| `useProject()` | `openProject(path)` | Открытие существующего проекта |
| `useProject()` | `saveProject()` | Сохранение текущего проекта |
| `useProject()` | `closeProject()` | Закрытие проекта |
| `useUserSettings()` | `updateSettings(settings)` | Обновление настроек пользователя |
| `useUserSettings()` | `getSettings()` | Получение настроек пользователя |
| `useAppState()` | `getState()` | Получение состояния приложения |
| `useAppState()` | `isConnected` | Проверка подключения к backend |

### Types / Типы

```typescript
interface ProjectSchema {
  version: string
  settings: ProjectSettings
  tracks: Track[]
  subtitles: Subtitle[]
  // ... другие поля
}

interface ValidationResult {
  valid: boolean
  errors?: string[]
}

interface ProjectStatistics {
  totalDuration: number
  trackCount: number
  clipCount: number
  mediaFileCount: number
  // ... другие метрики
}

interface CommandResult {
  success: boolean
  error?: string
  data?: any
}

interface BatchCommandRequest {
  commands: ProjectCommand[]
  stop_on_error: boolean
  transaction_name?: string
}

interface BatchCommandResult {
  results: CommandResult[]
  success_count: number
  error_count: number
  execution_time_ms: number
  success: boolean
  error_message?: string
}
```

**Примечание:** Все команды выполняются через `BackendSync.executeCommand()` - прямые вызовы Tauri API отсутствуют.

## Тестирование

### Статистика тестов

```bash
# Запуск тестов
bun run test src/domains/project-management/__tests__/

# Результаты
Test Files:  7 файлов
Tests:       179 тестов (it blocks)
Lines:       2,197 строк тестового кода
Coverage:    100% критического функционала
```

### Тестовые наборы

#### app-machine.test.ts (11 тестов)
- ✓ Initial state validation
- ✓ Backend connection lifecycle
- ✓ Command queue management
- ✓ Error handling and recovery
- ✓ State synchronization

#### user-settings-machine.test.ts (28 тестов)
- ✓ Settings initialization
- ✓ API key management
- ✓ GPU settings configuration
- ✓ Auto-save preferences
- ✓ Settings persistence

#### project-management-orchestrator.test.ts (20 тестов)
- ✓ Orchestrator lifecycle management
- ✓ Actor coordination
- ✓ Auto-save functionality
- ✓ Command execution coordination
- ✓ Performance metrics tracking

#### Провайдеры и хуки (59 total)
- ✓ ProjectProvider integration tests
- ✓ useProjectManagement hook tests
- ✓ useAppState hook tests
- ✓ useUserSettings hook tests

## Результаты финализации (2025-11-17)

### ✅ Реализовано

#### 1. Dirty Flag Tracking
- ✅ Добавлены поля `isDirty`, `lastModifiedTime`, `lastSavedTime` в `ProjectManagementContext`
- ✅ Реализованы хелперы `markProjectDirty()` и `markProjectClean()`
- ✅ Автоматическое отслеживание изменений в backend event handlers
- ✅ Интеграция с auto-save для определения несохраненных изменений
- ✅ Метод `markDirty()` в `ProjectProvider` для ручной пометки изменений

#### 2. Улучшенная обработка ошибок
- ✅ User-friendly error messages для всех команд
- ✅ Таймауты команд (30 секунд) с понятными сообщениями
- ✅ Comprehensive try-catch во всех критических местах
- ✅ Error recovery strategies в orchestrator
- ✅ Детальное логирование ошибок с контекстом

#### 3. Метрики производительности
- ✅ `PerformanceMetricsTracker` для мониторинга производительности
- ✅ Command execution time tracking с предупреждениями о медленных командах
- ✅ State update frequency tracking
- ✅ Memory usage tracking (heap usage, peak memory)
- ✅ Performance reports с детальной статистикой
- ✅ Автоматическое логирование при dispose orchestrator

### 📊 Финальная статистика

**Состояние:**
- TypeScript ошибки: 0
- Тесты: 228 (100% pass)
- TODO комментарии: 0 (все решены)
- Готовность: **100%**
- Code reduction: -169 lines (~46%)

**Новые возможности:**
- Dirty flag tracking для умного auto-save
- Enhanced error handling с user-friendly messages
- Performance monitoring для оптимизации
- Command timeout protection (30s)

## Производительность

### Performance Metrics API

```tsx
import { getPerformanceMetricsTracker } from "@/domains/project-management"

// Получить отчет о производительности
const tracker = getPerformanceMetricsTracker()
const report = tracker.getReport()

console.log({
  totalCommands: report.totalCommands,
  averageCommandTime: report.averageCommandTime,
  stateUpdatesPerSecond: report.stateUpdatesPerSecond,
  currentMemoryUsage: report.currentMemoryUsage,
})

// Логировать полный отчет
tracker.logReport()
```

### Доступные метрики

- **Command Metrics**: execution time, success/failure rate, slowest/fastest commands
- **State Update Metrics**: update frequency, average processing time
- **Memory Metrics**: current usage, peak usage, average usage

## Error Handling

### User-Friendly Error Messages

Все команды возвращают понятные пользователю сообщения об ошибках:

```tsx
try {
  await createProject(settings)
} catch (error) {
  // Error message: "Failed to create project. Please check your project settings and try again.
  // Technical details: [backend error]"
  console.error(error.message)
}
```

### Command Timeouts

Команды автоматически прерываются через 30 секунд с понятным сообщением:

```
Command CreateProject timed out after 30000ms. This might indicate a backend issue.
```

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Работа с файлами | ✅ Ready | `file-system.spec.ts` | 🔴 High |
| Управление проектами | ✅ Ready | `project-management.spec.ts` | 🔴 High |
| Создание проекта | ⏳ Planned | - | 🔴 High |
| Открытие проекта | ⏳ Planned | - | 🔴 High |
| Сохранение проекта | ⏳ Planned | - | 🔴 High |
| Закрытие проекта | ⏳ Planned | - | 🔴 High |
| Обновление настроек пользователя | ⏳ Planned | - | 🔴 High |
| Получение настроек пользователя | ⏳ Planned | - | 🔴 High |
| Auto-save функциональность | ⏳ Planned | - | 🔴 High |
| Dirty flag tracking | ⏳ Planned | - | 🔴 High |
| API ключи (save/get/validate/delete) | ⏳ Planned | - | 🟡 Medium |
| Command queue management | ⏳ Planned | - | 🟡 Medium |
| Error handling and recovery | ⏳ Planned | - | 🔴 High |
| Performance metrics tracking | ⏳ Planned | - | 🟢 Low |

### Приоритеты
- 🔴 High - критичный функционал (lifecycle проектов, настройки, error handling)
- 🟡 Medium - важный функционал (API ключи, command queue)
- 🟢 Low - дополнительный функционал (performance metrics)

### Backend Commands для тестирования

```typescript
// Project Lifecycle
executeCommand('CreateProject', { settings })
executeCommand('OpenProject', { path })
executeCommand('SaveProject', {})
executeCommand('CloseProject', {})

// Settings Management
executeCommand('UpdateUserSettings', { settings })
executeCommand('GetUserSettings', {})

// State Management
BackendSync.getProjectState()
BackendSync.getEventHistory()

// Error Handling
// Проверка таймаутов команд (30s)
// Проверка retry логики
// Проверка user-friendly error messages
```
