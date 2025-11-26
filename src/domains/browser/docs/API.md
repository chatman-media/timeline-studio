# Browser Domain - API Reference

## Table of Contents

- [Types](#types)
- [Provider](#provider)
- [Hooks](#hooks)
- [State Machine](#state-machine)
- [Constants](#constants)

---

## Types

Re-exported from generated Tauri bindings.

```typescript
import type {
  BrowserState,
  BrowserTab,
  TabSettings,
  ViewMode
} from "@/domains/browser"

// BrowserContext - legacy alias for BrowserState
import type { BrowserContext } from "@/domains/browser"
```

### BrowserState

```typescript
interface BrowserState {
  active_tab: BrowserTab
  tab_settings: Record<BrowserTab, TabSettings>
  selected_files: Record<BrowserTab, string[]>
  favorites: Record<BrowserTab, string[]>
}
```

### BrowserTab

```typescript
type BrowserTab =
  | "media"
  | "effects"
  | "filters"
  | "transitions"
  | "templates"
  | "style_templates"
  | "music"
  | "subtitles"
  | "projects"
  | "scenarios"
```

### TabSettings

```typescript
interface TabSettings {
  search_query: string
  show_favorites_only: boolean
  sort_by: string           // "name" | "date" | "size" | "type"
  sort_order: "asc" | "desc"
  group_by: string          // "none" | "type" | "date"
  filter_type: string       // "all" | "video" | "audio" | "image"
  view_mode: ViewMode
  preview_size_index: number
}
```

### ViewMode

```typescript
type ViewMode = "thumbnails" | "list" | "details"
```

---

## Provider

### BrowserProvider

React провайдер с event-driven архитектурой и BackendSync.

```tsx
import { BrowserProvider } from "@/domains/browser"

function App() {
  return (
    <BrowserProvider>
      <YourApp />
    </BrowserProvider>
  )
}
```

---

## Hooks

### useBrowser() / useBrowserState()

Основной хук для работы с браузером (useBrowserState - алиас).

```typescript
import { useBrowser } from "@/domains/browser"

const {
  // State
  browserState,
  isLoading,
  error,

  // Convenient getters
  activeTab,
  currentTabSettings,
  selectedFiles,    // Set<string>
  previewSize,      // number

  // Tab actions
  switchTab,
  resetTabSettings,

  // Settings actions
  setSearchQuery,
  toggleFavorites,
  setSort,
  setGroupBy,
  setFilter,
  setViewMode,
  setPreviewSize,

  // File selection actions
  selectFile,
  deselectFile,
  toggleFileSelection,
  selectAllFiles,
  deselectAllFiles,
  isFileSelected,

  // Backwards compatibility
  clearBrowserState
} = useBrowser()
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `browserState` | `BrowserState \| null` | Полное состояние браузера |
| `isLoading` | `boolean` | Флаг загрузки |
| `error` | `string \| null` | Текущая ошибка |
| `activeTab` | `BrowserTab` | Активная вкладка |
| `currentTabSettings` | `TabSettings` | Настройки текущей вкладки |
| `selectedFiles` | `Set<string>` | Выбранные файлы |
| `previewSize` | `number` | Размер превью в пикселях |

**Actions:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `switchTab` | `(tab: BrowserTab) => Promise<void>` | Переключить вкладку |
| `setSearchQuery` | `(query: string, tab?) => Promise<void>` | Установить поисковый запрос |
| `toggleFavorites` | `(tab?) => Promise<void>` | Переключить фильтр избранного |
| `setSort` | `(sortBy, sortOrder, tab?) => Promise<void>` | Установить сортировку |
| `setGroupBy` | `(groupBy, tab?) => Promise<void>` | Установить группировку |
| `setFilter` | `(filterType, tab?) => Promise<void>` | Установить фильтр типа |
| `setViewMode` | `(viewMode, tab?) => Promise<void>` | Установить режим отображения |
| `setPreviewSize` | `(sizeIndex, tab?) => Promise<void>` | Установить размер превью |
| `resetTabSettings` | `(tab: BrowserTab) => Promise<void>` | Сбросить настройки вкладки |
| `selectFile` | `(fileId, tab?) => Promise<void>` | Выбрать файл |
| `deselectFile` | `(fileId, tab?) => Promise<void>` | Снять выбор с файла |
| `toggleFileSelection` | `(fileId, tab?) => Promise<void>` | Переключить выбор файла |
| `selectAllFiles` | `(fileIds[], tab?) => Promise<void>` | Выбрать все файлы |
| `deselectAllFiles` | `(tab?) => Promise<void>` | Снять выбор со всех |
| `isFileSelected` | `(fileId, tab?) => boolean` | Проверить выбран ли файл |

---

## State Machine

### browserMachine

XState машина для управления состоянием браузера.

```typescript
import { browserMachine, createBrowserActor } from "@/domains/browser"
import type { BrowserMachineContext } from "@/domains/browser"

// Создание актора
const actor = createBrowserActor()
actor.start()

// Отправка событий
actor.send({ type: "SWITCH_TAB", tab: "effects" })
actor.send({ type: "BACKEND_EVENT", event: browserEvent })
actor.send({ type: "SET_LOADING", isLoading: true })
actor.send({ type: "SET_ERROR", error: "Something went wrong" })
actor.send({ type: "CLEAR_ERROR" })

// Получение состояния
const context = actor.getSnapshot().context
```

**Context:**

```typescript
interface BrowserMachineContext {
  activeTab: BrowserTab
  tabSettings: Record<BrowserTab, TabSettings>
  selectedFiles: Record<BrowserTab, string[]>
  favorites: Record<BrowserTab, string[]>
  isLoading: boolean
  error: string | null
}
```

**Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `BACKEND_EVENT` | `{ event: BrowserEvent }` | Backend событие |
| `SWITCH_TAB` | `{ tab: BrowserTab }` | Переключение вкладки |
| `SET_LOADING` | `{ isLoading: boolean }` | Установка загрузки |
| `SET_ERROR` | `{ error: string \| null }` | Установка ошибки |
| `CLEAR_ERROR` | - | Очистка ошибки |

### handleBrowserBackendEvent

Обработчик backend событий.

```typescript
import { handleBrowserBackendEvent } from "@/domains/browser"

const updates = handleBrowserBackendEvent(context, browserEvent)
```

**Supported Event Types:**
- `TabSwitched`
- `SearchQueryChanged`
- `FavoritesToggled`
- `SortChanged`
- `GroupByChanged`
- `FilterChanged`
- `ViewModeChanged`
- `PreviewSizeChanged`
- `FileSelected`
- `FileDeselected`
- `AllFilesSelected`
- `AllFilesDeselected`

---

## Constants

```typescript
import { DEFAULT_TAB, BROWSER_TABS } from "@/domains/browser"

// Default active tab
DEFAULT_TAB // "media"

// All available tabs
BROWSER_TABS // readonly ["media", "effects", "filters", "transitions", "templates", "style_templates"]
```

---

## Backend Commands

All commands are called via generated Tauri bindings:

| Command | Parameters | Description |
|---------|------------|-------------|
| `browserSwitchTab` | `tab: BrowserTab` | Переключить вкладку |
| `browserSetSearchQuery` | `query: string, tab?: BrowserTab` | Установить поиск |
| `browserToggleFavorites` | `tab?: BrowserTab` | Переключить избранное |
| `browserSetSort` | `sortBy, sortOrder, tab?` | Установить сортировку |
| `browserSetGroupBy` | `groupBy, tab?` | Установить группировку |
| `browserSetFilter` | `filterType, tab?` | Установить фильтр |
| `browserSetViewMode` | `viewMode, tab?` | Установить режим |
| `browserSetPreviewSize` | `sizeIndex, tab?` | Установить превью |
| `browserResetTabSettings` | `tab: BrowserTab` | Сбросить настройки |
| `browserSelectFile` | `fileId, tab?` | Выбрать файл |
| `browserDeselectFile` | `fileId, tab?` | Снять выбор |
| `browserToggleFileSelection` | `fileId, tab?` | Переключить выбор |
| `browserSelectAllFiles` | `fileIds[], tab?` | Выбрать все |
| `browserDeselectAllFiles` | `tab?` | Снять выбор со всех |
