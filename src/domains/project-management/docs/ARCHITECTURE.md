# Project Management Domain - Architecture

## Overview

Домен `project-management` отвечает за управление жизненным циклом проектов, пользовательскими настройками и координацию состояния приложения.

## Directory Structure

```
src/domains/project-management/
├── index.ts                    # Public API exports
├── README.md                   # Overview documentation
├── docs/
│   ├── API.md                  # Full API reference
│   └── ARCHITECTURE.md         # This file
├── hooks/
│   ├── index.ts
│   ├── use-app-state.ts        # Backend connection state
│   ├── use-project-management.ts # Project lifecycle
│   └── use-user-settings.ts    # User preferences
├── machines/
│   ├── app-machine.ts          # XState app state machine
│   ├── user-settings-machine.ts # XState settings machine
│   └── backend-event-handlers.ts # Event synchronization
├── providers/
│   └── project-management-provider.tsx # React context providers
├── services/
│   ├── project-management-orchestrator.ts # Main coordinator
│   ├── api-keys-service.ts     # API key management
│   ├── app-directories-service.ts # File system paths
│   ├── batch-commands-service.ts # Batch operations
│   └── performance-metrics.ts   # Performance tracking
├── tauri/
│   └── api-keys-commands.ts    # Tauri command wrappers
├── types/
│   └── index.ts                # Domain types
└── __tests__/                  # Unit tests
```

## Component Diagram

### До упрощения (с дублированием состояния)
```
React Providers → Local State (369 lines)
                     ↓
                Orchestrator → XState Actors
                     ↓
              Backend Commands
```
**Проблема:** Дублирование состояния между провайдерами и акторами

### После упрощения (Single Source of Truth)
```
┌─────────────────────────────────────────────────────────────────┐
│                        React Components                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React Context Providers                       │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐         │
│  │   Project    │  │ UserSettings  │  │  AppState    │         │
│  │   Provider   │  │   Provider    │  │   Provider   │         │
│  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘         │
│         │                   │                  │                 │
│         └──────useSelector──┴──────useSelector┘                 │
│                  (читают из XState акторов)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                ProjectManagementOrchestrator                     │
│                   ★ SINGLE SOURCE OF TRUTH ★                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Singleton Service                     │   │
│  │  • Координация акторов                                   │   │
│  │  • Auto-save логика                                      │   │
│  │  • Performance tracking                                  │   │
│  │  • Единственный источник состояния                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
┌───────────────────┐  ┌────────────────┐  ┌────────────────┐
│    appMachine     │  │userSettingsMachine│  │ Other Services │
│   (XState Actor)  │  │  (XState Actor)  │  │                │
│ ★ Source of Truth │  │ ★ Source of Truth │  │                │
└───────────────────┘  └────────────────┘  └────────────────┘
            │                   │
            └───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BackendSync                              │
│                    (Tauri IPC Bridge)                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Rust Backend (Tauri)                        │
└─────────────────────────────────────────────────────────────────┘
```

**Ключевые изменения:**
- ✅ Провайдеры используют `useSelector` для чтения из XState акторов
- ✅ Локальное состояние минимизировано (только dirty flags в ProjectProvider)
- ✅ Все команды выполняются через методы оркестратора
- ✅ Убрано дублирование состояния (-169 lines, ~46% reduction)

## State Machine: appMachine

```
                    ┌─────────────┐
                    │disconnected │◄────────────┐
                    └──────┬──────┘             │
                           │ CONNECT            │ DISCONNECT
                           ▼                    │
                    ┌─────────────┐             │
                    │ connecting  │             │
                    └──────┬──────┘             │
                           │ onDone             │
                           ▼                    │
    ┌─────────────────────────────────────────────┐
    │                  connected                   │
    │  ┌─────────────────────────────────────┐   │
    │  │              idle                    │   │
    │  │  • Ожидание команд                  │   │
    │  └──────────────┬──────────────────────┘   │
    │                 │ EXECUTE_COMMAND          │
    │                 ▼                          │
    │  ┌─────────────────────────────────────┐   │
    │  │           executing                  │   │
    │  │  • Выполнение команды               │   │
    │  │  • 30s timeout                      │   │
    │  └──────────────┬──────────────────────┘   │
    │                 │ onDone/onError           │
    │                 ▼                          │
    │         [возврат в idle]                   │
    └─────────────────────────────────────────────┘
                           │ onError (critical)
                           ▼
                    ┌─────────────┐
                    │    error    │
                    └─────────────┘
```

## State Machine: userSettingsMachine

```
              ┌───────────┐
              │   idle    │◄─────────────────┐
              └─────┬─────┘                  │
                    │                        │
    ┌───────────────┼───────────────┐       │
    │               │               │       │
    ▼               ▼               │       │
UPDATE_SETTINGS  LOAD_SETTINGS     │       │
    │               │               │       │
    ▼               ▼               │       │
┌───────┐     ┌──────────┐        │       │
│saving │     │ loading  │        │       │
└───┬───┘     └────┬─────┘        │       │
    │              │              │       │
    │   onDone     │   onDone    │       │
    └──────────────┴──────────────┘       │
                   │                       │
                   └───────────────────────┘
```

## Data Flow

### 1. Command Execution Flow

```
User Action
    │
    ▼
React Hook (useProjectManagement)
    │
    ▼
Orchestrator.executeCommand()
    │
    ├──► Performance Tracker (start)
    │
    ▼
appMachine.send({ type: "EXECUTE_COMMAND", command })
    │
    ▼
BackendSync.executeCommand(command)
    │
    ▼
Tauri IPC → Rust Handler
    │
    ▼
Result ◄──────────────────────────────────────┐
    │                                          │
    ▼                                          │
appMachine updates context                     │
    │                                          │
    ▼                                          │
Performance Tracker (end)                      │
    │                                          │
    ▼                                          │
React Hook returns result ─────────────────────┘
```

### 2. Settings Persistence Flow

```
User changes setting
    │
    ▼
useUserSettings.updateSettings()
    │
    ▼
userSettingsMachine.send({ type: "UPDATE_SETTINGS" })
    │
    ▼
Machine context updated
    │
    ├──► Tauri Store (persistence)
    │
    └──► Auto-save timer (if enabled)
```

### 3. Auto-Save Flow

```
Timer fires (autoSaveInterval)
    │
    ▼
Orchestrator.autoSave()
    │
    ▼
Check isDirty flag
    │
    ├── false → Skip
    │
    └── true → executeCommand({ type: "SaveProject" })
                    │
                    ▼
              markProjectClean()
```

## Key Design Decisions

### 1. Single Source of Truth Pattern (2025-11-27)

**Решение:** Использовать `ProjectManagementOrchestrator` как единственный источник состояния. Провайдеры читают состояние из XState акторов через `useSelector`.

**До упрощения:**
```tsx
// ProjectProvider дублировал состояние
const [projectState, setProjectState] = useState(null)
const [isLoading, setIsLoading] = useState(false)

// Подписка на события и обновление локального состояния
useEffect(() => {
  const unsubscribe = orchestrator.onProjectStateChange((state) => {
    setProjectState(state) // Дублирование!
  })
}, [])
```

**После упрощения:**
```tsx
// ProjectProvider читает напрямую из актора
const orchestrator = getProjectManagementOrchestrator()
const appActor = orchestrator.getAppActor()
const projectState = useSelector(appActor, (state) => state.context.projectState)
const isLoading = useSelector(appActor, (state) => state.matches({ connected: "executing" }))
```

**Результат:**
- ✅ Удалено 169 lines дублированного кода (~46% reduction)
- ✅ Устранены race conditions между локальным и глобальным состоянием
- ✅ Упрощена логика синхронизации
- ✅ Все 228 тестов проходят

**Минимальное локальное состояние:** Только dirty flags в `ProjectProvider` (UI-специфичные данные, не связанные с backend).

### 2. Singleton Orchestrator Pattern

**Решение:** Использовать singleton `ProjectManagementOrchestrator` вместо множества независимых акторов.

**Причина:**
- Единая точка координации для всех операций
- Предотвращение race conditions между проектами и настройками
- Централизованный auto-save и performance tracking

### 3. XState для State Management

**Решение:** Использовать XState машины вместо Redux/Zustand.

**Причина:**
- Визуализируемые state charts
- Гарантированные переходы состояний
- Встроенная поддержка side effects (services)
- Type safety из коробки

### 4. Dirty Flag Tracking

**Решение:** Отслеживать несохраненные изменения через `isDirty`, `lastModifiedTime`, `lastSavedTime`.

**Причина:**
- Умный auto-save (сохранять только при изменениях)
- Предупреждение пользователя о несохраненных данных
- Оптимизация производительности

**Важно:** Dirty flags хранятся локально в `ProjectProvider` (единственное локальное состояние), так как это UI-специфичные данные.

### 5. Command Timeout (30s)

**Решение:** Все команды имеют таймаут 30 секунд.

**Причина:**
- Предотвращение зависания UI
- User-friendly error messages при проблемах с backend
- Возможность retry

## Dependencies

### Internal Dependencies

```
project-management
    │
    ├── @/features/app-state/services/store-service
    │   └── Tauri Store для персистентности настроек
    │
    ├── @/types/generated/tauri-bindings
    │   └── Сгенерированные TypeScript типы из Rust
    │
    └── @/lib/tauri-logger
        └── Логирование
```

### External Dependencies

- `xstate` (v5) - State machines
- `@xstate/react` - React bindings
- `@tauri-apps/api` - Tauri IPC (через BackendSync)

## Testing Strategy

### Unit Tests

```bash
bun run test src/domains/project-management/__tests__/
```

**Coverage:**
- `app-machine.test.ts` - State transitions, command execution
- `user-settings-machine.test.ts` - Settings CRUD, persistence
- `project-management-orchestrator.test.ts` - Coordination, auto-save
- `hooks/*.test.tsx` - React hooks integration

### E2E Tests

```bash
bun run test:e2e:tauri
```

**Scenarios:**
- Project lifecycle (create → edit → save → close)
- Settings persistence across restarts
- Error recovery
- Auto-save functionality

## Performance Considerations

### Metrics Tracked

- Command execution time
- State update frequency
- Memory usage (heap)
- Slow command detection (>1s warning)

### Optimization Tips

1. **Batch Commands** - Группировать связанные команды через `BatchCommandBuilder`
2. **Debounce Settings** - Настройки сохраняются с debounce
3. **Lazy Initialization** - Оркестратор создается при первом обращении
