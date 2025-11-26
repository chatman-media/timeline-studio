# Browser Domain - Architecture

## Overview

Домен `browser` управляет состоянием браузера медиафайлов и ресурсов. Использует event-driven архитектуру для синхронизации с Rust backend.

## Directory Structure

```
src/domains/browser/
├── index.ts                    # Public API exports
├── README.md                   # Overview documentation
├── docs/
│   ├── API.md                  # Full API reference
│   └── ARCHITECTURE.md         # This file
├── machines/
│   ├── browser-machine.ts      # XState state machine
│   └── backend-event-handlers.ts # Backend event processing
├── providers/
│   └── browser-provider.tsx    # React context provider
├── __tests__/
└── __mocks__/
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Components                          │
│              (MediaBrowser, FileGrid, TabBar, etc.)              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                           useBrowser()                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    BrowserContext                        │   │
│  │  • activeTab, currentTabSettings                         │   │
│  │  • selectedFiles, previewSize                            │   │
│  │  • switchTab(), setSearchQuery(), etc.                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BrowserProvider                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     browserActor                         │   │
│  │                   (XState Actor)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │   │                                 │
│              ┌─────────────┘   └─────────────┐                  │
│              ▼                               ▼                   │
│    ┌────────────────────┐        ┌────────────────────┐        │
│    │  Backend Events    │        │   User Actions     │        │
│    │  Subscription      │        │  (async commands)  │        │
│    └────────────────────┘        └────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BackendSync                              │
│                    (from app-state feature)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • onEvent() - subscribe to backend events              │   │
│  │  • onStateChange() - initial state sync                 │   │
│  │  • getProjectState() - fetch current state              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Tauri Commands (IPC Bridge)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  commands.browserSwitchTab()                            │   │
│  │  commands.browserSetSearchQuery()                       │   │
│  │  commands.browserSelectFile()                           │   │
│  │  ... etc                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Rust Backend (Tauri)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    BrowserState                          │   │
│  │  • active_tab                                           │   │
│  │  • tab_settings                                         │   │
│  │  • selected_files                                       │   │
│  │  • favorites                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## State Machine: browserMachine

```
              ┌───────────┐
              │   idle    │◄─────────────────────────────┐
              └─────┬─────┘                              │
                    │                                    │
                    │ (any event)                        │
                    ▼                                    │
       ┌────────────────────────┐                       │
       │   Global Event Handler │                       │
       │  • BACKEND_EVENT       │                       │
       │  • SWITCH_TAB          │                       │
       │  • SET_LOADING         │──────────────────────►│
       │  • SET_ERROR           │                       │
       │  • CLEAR_ERROR         │                       │
       └────────────────────────┘                       │
                                                         │
                    Machine stays in "idle" state       │
                    All events handled globally ────────┘
```

## Event-Driven Flow

### 1. User Action Flow (Optimistic Update)

```
User clicks "Switch Tab"
    │
    ▼
useBrowser().switchTab("effects")
    │
    ├──► Optimistic: browserActor.send({ type: "SWITCH_TAB", tab })
    │    (UI updates immediately)
    │
    ├──► Async: commands.browserSwitchTab(tab)
    │    (Send command to backend)
    │
    ▼
Backend processes command
    │
    ├──► Success: Backend emits "TabSwitched" event
    │    (Confirms the change or updates if different)
    │
    └──► Error: browserActor.send({ type: "SET_ERROR", error })
         (Rollback optimistic update)
```

### 2. Backend Event Flow

```
Rust Backend emits BrowserEvent
    │
    ▼
BackendSync.onEvent() receives ProjectEvent
    │
    ├──► Check: event.type === "Browser"
    │
    ▼
BrowserProvider forwards to machine
    │
    ├──► browserActor.send({ type: "BACKEND_EVENT", event })
    │
    ▼
browserMachine processes event
    │
    ├──► handleBrowserBackendEvent(context, event)
    │
    ▼
Context updated incrementally
    │
    ▼
React components re-render via useSelector
```

### 3. Initial State Sync

```
BrowserProvider mounts
    │
    ├──► browserActor.start()
    │
    ├──► backendSync.onStateChange() subscription
    │
    ├──► backendSync.getProjectState()
    │
    ▼
Initial state received
    │
    ├──► Sync activeTab
    ├──► Sync tabSettings (per tab)
    ├──► Sync selectedFiles (per tab)
    └──► Sync favorites (per tab)
```

## Key Design Decisions

### 1. Event-Driven Architecture

**Решение:** Использовать события от backend вместо polling.

**Причина:**
- Инкрементальные обновления (не перезагружаем всё состояние)
- Real-time синхронизация
- Меньше network overhead
- Backend - single source of truth

### 2. Optimistic Updates

**Решение:** UI обновляется сразу при действии пользователя.

**Причина:**
- Instant feedback для пользователя
- Better UX при медленной сети
- Rollback при ошибках

### 3. XState для Frontend State

**Решение:** Использовать XState машину для кэширования состояния.

**Причина:**
- Predictable state transitions
- Built-in event handling
- Easy debugging с devtools
- Type-safe context and events

### 4. Per-Tab Settings

**Решение:** Каждая вкладка имеет независимые настройки.

**Причина:**
- Разные вкладки требуют разных фильтров
- Пользователь не теряет контекст при переключении
- Сортировка media отличается от сортировки effects

## Dependencies

### Internal Dependencies

```
browser
    │
    ├── @/features/app-state/services/backend-sync
    │   └── BackendSync для коммуникации с backend
    │
    ├── @/features/media/utils/preview-sizes
    │   └── Константы размеров превью
    │
    ├── @/types/generated/tauri-bindings
    │   └── Сгенерированные типы и команды
    │
    └── @/lib/tauri-logger
        └── Логирование
```

### External Dependencies

- `xstate` (v5) - State machines
- `@xstate/react` - React bindings

## Testing Strategy

### Unit Tests

```bash
bun run test src/domains/browser/__tests__/
```

**Coverage:**
- `index.test.ts` - Public API exports

### Mock Data

Located in `__mocks__/`:
- `browser-test-data.ts` - Test fixtures for browser state
- `index.ts` - Mock implementations

## Performance Considerations

### Optimizations

1. **Incremental Updates** - Only changed data is updated
2. **useSelector** - Granular subscription to state slices
3. **useMemo** - Derived state computed only when deps change
4. **Optimistic Updates** - No waiting for backend confirmation

### Tab Settings

Default settings are applied per-tab to avoid unnecessary re-renders:
```typescript
const DEFAULT_TAB_SETTINGS: TabSettings = {
  search_query: "",
  show_favorites_only: false,
  sort_by: "name",
  sort_order: "asc",
  group_by: "none",
  filter_type: "all",
  view_mode: "thumbnails",
  preview_size_index: 2
}
```
