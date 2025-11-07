# Browser Domain

Домен для управления браузером медиа файлов и ресурсов с полной интеграцией backend state management.

## Архитектура

Browser domain использует паттерн **BackendSync** - все состояние хранится на Rust-бэкенде и автоматически синхронизируется с фронтендом.

```
┌─────────────────────────────────────────┐
│ Rust Backend (ProjectState)            │
│ ┌─────────────────────────────────────┐ │
│ │ browser_state: BrowserState         │ │
│ │  - active_tab: BrowserTab           │ │
│ │  - tab_settings: Map<Tab, Settings> │ │
│ │  - selected_files: Map<Tab, Vec>    │ │
│ └─────────────────────────────────────┘ │
└───────────────┬─────────────────────────┘
                │ BackendSync (Tauri IPC)
                │ Commands ↓  Events ↑
                ↓
┌─────────────────────────────────────────┐
│ Frontend (React)                        │
│ BrowserProvider                         │
│  - Syncs state automatically            │
│  - Provides convenient getters          │
│  - Exposes async actions                │
└─────────────────────────────────────────┘
```

### Преимущества

- ✅ **Единый источник истины** - состояние на бэкенде, синхронизация автоматическая
- ✅ **Персистентность** - состояние сохраняется в проекте
- ✅ **Типобезопасность** - типы генерируются автоматически из Rust через Specta
- ✅ **Реактивность** - изменения на бэкенде мгновенно отражаются на фронтенде
- ✅ **Тестируемость** - легко тестировать без моков localStorage

## Использование

### Подключение провайдера

BrowserProvider уже подключен в `src/features/media-studio/services/providers.tsx`:

```typescript
import { BrowserProvider } from "@/domains/browser"

export function Providers({ children }: ProvidersProps) {
  return (
    <AppProviderComposite>
      {/* ... другие провайдеры ... */}
      <BrowserProvider>
        {children}
      </BrowserProvider>
    </AppProviderComposite>
  )
}
```

### Использование хука

```typescript
import { useBrowser } from "@/domains/browser"

function MyComponent() {
  const {
    // Состояние
    activeTab,              // текущая активная вкладка
    currentTabSettings,     // настройки текущей вкладки
    selectedFiles,          // Set<string> выбранных файлов
    previewSize,           // размер превью в px
    isLoading,             // загрузка состояния
    error,                 // ошибка если есть

    // Действия с вкладками
    switchTab,             // (tab: BrowserTab) => Promise<void>
    setSearchQuery,        // (query: string, tab?) => Promise<void>
    toggleFavorites,       // (tab?) => Promise<void>
    setSort,               // (sortBy, sortOrder, tab?) => Promise<void>
    setGroupBy,            // (groupBy, tab?) => Promise<void>
    setFilter,             // (filterType, tab?) => Promise<void>
    setViewMode,           // (viewMode, tab?) => Promise<void>
    setPreviewSize,        // (sizeIndex, tab?) => Promise<void>
    resetTabSettings,      // (tab) => Promise<void>

    // Действия с выбором файлов
    selectFile,            // (fileId, tab?) => Promise<void>
    deselectFile,          // (fileId, tab?) => Promise<void>
    toggleFileSelection,   // (fileId, tab?) => Promise<void>
    selectAllFiles,        // (fileIds[], tab?) => Promise<void>
    deselectAllFiles,      // (tab?) => Promise<void>
    isFileSelected,        // (fileId, tab?) => boolean
  } = useBrowser()

  // Пример использования
  const handleSearch = async (query: string) => {
    await setSearchQuery(query)
  }

  return (
    <div>
      <input
        value={currentTabSettings.search_query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <div>Selected: {selectedFiles.size} files</div>
    </div>
  )
}
```

### Миграция со старого API

Для совместимости со старым кодом доступен alias `useBrowserState`:

```typescript
// Старый код
import { useBrowserState } from "@/domains/browser"

// Работает точно так же
const { activeTab, selectedFiles } = useBrowserState()
```

## API Reference

### Types

```typescript
type BrowserTab = "media" | "effects" | "filters" | "transitions" | "templates" | "style-templates"

type ViewMode = "thumbnails" | "list" | "grid"

interface TabSettings {
  search_query: string
  show_favorites_only: boolean
  sort_by: string
  sort_order: "asc" | "desc"
  group_by: string
  filter_type: string
  view_mode: ViewMode
  preview_size_index: number
}

interface BrowserState {
  active_tab: BrowserTab
  tab_settings: Record<BrowserTab, TabSettings>
  selected_files: Record<BrowserTab, string[]>
}
```

### Convenient Getters

Все getters - это computed values, они автоматически обновляются при изменении состояния:

- `activeTab: BrowserTab` - текущая активная вкладка
- `currentTabSettings: TabSettings` - настройки текущей вкладки
- `selectedFiles: Set<string>` - Set выбранных файлов на текущей вкладке
- `previewSize: number` - размер превью в пикселях (вычисляется из preview_size_index)

### Actions

Все действия **асинхронные** - они отправляют команду на бэкенд через Tauri IPC.

#### Управление вкладками

```typescript
// Переключить вкладку
await switchTab("effects")

// Поиск (опционально для конкретной вкладки)
await setSearchQuery("sky", "media")  // для вкладки media
await setSearchQuery("blur")          // для текущей вкладки

// Показать только избранное
await toggleFavorites()

// Сортировка
await setSort("name", "asc")          // по имени, возрастание
await setSort("date", "desc", "media") // для конкретной вкладки

// Группировка
await setGroupBy("type")              // группировать по типу
await setGroupBy("none")              // без группировки

// Фильтрация
await setFilter("video")              // только видео
await setFilter("all")                // все типы

// Режим отображения
await setViewMode("grid")             // сетка
await setViewMode("list")             // список
await setViewMode("thumbnails")       // превью

// Размер превью (индекс от 0 до 4)
await setPreviewSize(2)               // средний размер

// Сброс настроек вкладки
await resetTabSettings("media")
```

#### Управление выбором файлов

```typescript
// Выбрать файл
await selectFile("file-id-123")

// Снять выбор
await deselectFile("file-id-123")

// Переключить выбор
await toggleFileSelection("file-id-123")

// Выбрать все файлы (передать список ID)
const allFileIds = mediaFiles.map(f => f.id)
await selectAllFiles(allFileIds)

// Снять все выборы
await deselectAllFiles()

// Проверить выбран ли файл (синхронная функция)
const isSelected = isFileSelected("file-id-123")
```

### Legacy Compatibility

Для постепенной миграции доступен объект `state` в старом формате:

```typescript
const { state } = useBrowser()

// state.activeTab - то же что и activeTab
// state.tabSettings - Record всех настроек
// state.selectedFiles - Record<BrowserTab, Set<string>>
```

## Примеры

### Компонент списка файлов с выбором

```typescript
function FileList({ files }: { files: MediaFile[] }) {
  const { selectedFiles, toggleFileSelection } = useBrowser()

  return (
    <div>
      {files.map(file => (
        <FileCard
          key={file.id}
          file={file}
          isSelected={selectedFiles.has(file.id)}
          onToggle={() => toggleFileSelection(file.id)}
        />
      ))}
    </div>
  )
}
```

### Строка поиска с фильтрацией

```typescript
function SearchBar() {
  const {
    currentTabSettings,
    setSearchQuery,
    toggleFavorites,
    setFilter
  } = useBrowser()

  return (
    <div>
      <input
        placeholder="Поиск..."
        value={currentTabSettings.search_query}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <button onClick={toggleFavorites}>
        {currentTabSettings.show_favorites_only ? "Все" : "Избранное"}
      </button>

      <select
        value={currentTabSettings.filter_type}
        onChange={(e) => setFilter(e.target.value)}
      >
        <option value="all">Все</option>
        <option value="video">Видео</option>
        <option value="audio">Аудио</option>
        <option value="image">Изображения</option>
      </select>
    </div>
  )
}
```

### Переключатель вкладок

```typescript
function BrowserTabs() {
  const { activeTab, switchTab } = useBrowser()

  const tabs: BrowserTab[] = [
    "media",
    "effects",
    "filters",
    "transitions",
    "templates",
    "style-templates"
  ]

  return (
    <div>
      {tabs.map(tab => (
        <button
          key={tab}
          className={activeTab === tab ? "active" : ""}
          onClick={() => switchTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
```

## Тестирование

Для тестирования компонентов, использующих `useBrowser`, оберните их в `BrowserProvider`:

```typescript
import { render } from "@testing-library/react"
import { BrowserProvider } from "@/domains/browser"

describe("MyComponent", () => {
  it("should render", () => {
    render(
      <BrowserProvider>
        <MyComponent />
      </BrowserProvider>
    )
  })
})
```

**Важно**: Таури API должен быть замокан в тестовой среде (это делается автоматически в `src/test/setup.ts`).

## Backend Integration

Backend реализация находится в:
- `src-tauri/src/browser/mod.rs` - модуль browser
- `src-tauri/src/browser/state.rs` - BrowserState структура
- `src-tauri/src/browser/commands.rs` - Tauri команды

Типы автоматически генерируются в `src/types/generated/tauri-bindings.ts` через Specta.

## События

Browser domain генерирует следующие события (через BackendSync):

- `BrowserTabSwitched` - вкладка переключена
- `BrowserSearchQueryChanged` - поисковый запрос изменен
- `BrowserFavoritesToggled` - переключен режим избранного
- `BrowserSortChanged` - сортировка изменена
- `BrowserGroupByChanged` - группировка изменена
- `BrowserFilterChanged` - фильтр изменен
- `BrowserViewModeChanged` - режим отображения изменен
- `BrowserPreviewSizeChanged` - размер превью изменен
- `BrowserTabSettingsReset` - настройки вкладки сброшены
- `BrowserFileSelected` - файл выбран
- `BrowserFileDeselected` - файл снят с выбора
- `BrowserFileSelectionToggled` - выбор файла переключен
- `BrowserAllFilesSelected` - все файлы выбраны
- `BrowserAllFilesDeselected` - все файлы сняты с выбора

BrowserProvider автоматически подписывается на эти события и обновляет состояние.
