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

## API (Backend Commands)

Browser domain не использует прямые Tauri команды, так как всё состояние управляется через `ProjectState` на бэкенде. Вместо команд используются следующие методы:

| Method | Parameters | Description |
|--------|------------|-------------|
| `switchTab` | `(tab: BrowserTab)` | Переключение активной вкладки |
| `setSearchQuery` | `(query: string, tab?)` | Установка поискового запроса |
| `toggleFavorites` | `(tab?)` | Переключение режима избранного |
| `setSort` | `(sortBy, sortOrder, tab?)` | Установка сортировки |
| `setGroupBy` | `(groupBy, tab?)` | Установка группировки |
| `setFilter` | `(filterType, tab?)` | Установка фильтра |
| `setViewMode` | `(viewMode, tab?)` | Установка режима отображения |
| `setPreviewSize` | `(sizeIndex, tab?)` | Установка размера превью |
| `selectFile` | `(fileId, tab?)` | Выбор файла |
| `deselectFile` | `(fileId, tab?)` | Снятие выбора файла |
| `toggleFileSelection` | `(fileId, tab?)` | Переключение выбора файла |
| `selectAllFiles` | `(fileIds[], tab?)` | Выбор всех файлов |
| `deselectAllFiles` | `(tab?)` | Снятие всех выборов |

**Note**: Все методы автоматически синхронизируются с Rust бэкендом через Tauri IPC и events.

## Behavior (from tests) / Поведение (из тестов)

### browser-provider.test.tsx
- ✓ Инициализация с дефолтным browser state
- ✓ Загрузка browser state из бэкенда при монтировании
- ✓ Подписка на backend события
- ✓ Корректная обработка loading состояния
- ✓ Предоставление activeTab getter
- ✓ Предоставление currentTabSettings getter
- ✓ Предоставление selectedFiles как Set
- ✓ Вычисление previewSize из preview_size_index
- ✓ Переключение между всеми доступными вкладками
- ✓ Установка поискового запроса
- ✓ Установка поискового запроса для конкретной вкладки
- ✓ Переключение режима избранного
- ✓ Установка сортировки
- ✓ Установка группировки
- ✓ Установка фильтра
- ✓ Установка режима отображения
- ✓ Установка размера превью
- ✓ Сброс настроек вкладки
- ✓ Выбор файла
- ✓ Снятие выбора файла
- ✓ Переключение выбора файла
- ✓ Выбор всех файлов
- ✓ Снятие всех выборов
- ✓ Проверка выбран ли файл
- ✓ Раздельные выборы для каждой вкладки
- ✓ Очистка ошибок после успешной операции

### browser-provider-sync.test.tsx
- ✓ Отражение изменений backend state на фронтенде
- ✓ Обновление selectedFiles Set при изменении backend state

### browser-provider-edge-cases.test.tsx
- ✓ Обработка пустого выбора файлов
- ✓ Обработка повторного выбора того же файла
- ✓ Обработка снятия выбора невыбранного файла
- ✓ Обработка быстрых переключений вкладок
- ✓ Корректная обработка настроек для несуществующей вкладки

### browser-provider-compatibility.test.tsx
- ✓ Предоставление useBrowserState alias для обратной совместимости
- ✓ Предоставление clearBrowserState для совместимости

### integration.test.tsx
- ✓ Навигация по вкладкам с сохранением настроек
- ✓ Последовательная навигация по всем вкладкам
- ✓ Выбор нескольких файлов и снятие выбора одного
- ✓ Многократное переключение выбора файла
- ✓ Выбор всех файлов и полная очистка выбора
- ✓ Раздельные выборы для разных вкладок
- ✓ Очистка выбора на одной вкладке без влияния на другие
- ✓ Применение поиска, фильтра и сортировки вместе
- ✓ Переключение избранного и применение группировки
- ✓ Сброс настроек и применение новых
- ✓ Цикл по всем режимам отображения
- ✓ Многократная настройка размера превью
- ✓ Одновременное изменение view mode и preview size
- ✓ Восстановление после неудачных операций

### index.test.ts
- ✓ Экспорт константы DEFAULT_TAB
- ✓ Экспорт массива BROWSER_TABS
- ✓ Включение всех валидных вкладок браузера
- ✓ Первая вкладка - media
- ✓ Экспорт BrowserProvider
- ✓ Экспорт хука useBrowser
- ✓ Экспорт alias useBrowserState
- ✓ Уникальность вкладок
- ✓ Отсутствие пустых имён вкладок
- ✓ Использование kebab-case для многословных вкладок
- ✓ DEFAULT_TAB включён в BROWSER_TABS

### browser-provider-context-error.test.tsx
- ✓ Выброс ошибки при использовании вне провайдера

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Работа с файлами | ✅ Ready | `file-system.spec.ts` | 🔴 High |
| Переключение вкладок браузера | ⏳ Planned | - | 🔴 High |
| Настройки вкладок (search, filter, sort) | ⏳ Planned | - | 🔴 High |
| Выбор файлов (select/deselect) | ⏳ Planned | - | 🔴 High |
| Групповые операции с файлами | ⏳ Planned | - | 🟡 Medium |
| Режимы отображения (thumbnails, list, grid) | ⏳ Planned | - | 🟡 Medium |
| Размер превью (preview size) | ⏳ Planned | - | 🟢 Low |
| Избранное (favorites) | ⏳ Planned | - | 🟡 Medium |
| Раздельное состояние вкладок | ⏳ Planned | - | 🔴 High |

### Приоритеты
- 🔴 High - критичный функционал (вкладки, настройки, выбор файлов)
- 🟡 Medium - важный функционал (групповые операции, режимы отображения)
- 🟢 Low - дополнительный функционал (размер превью)

### Backend State Management

Browser domain использует BackendSync для управления состоянием. Все операции синхронизируются автоматически через события:

```typescript
// События для тестирования
BrowserTabSwitched
BrowserSearchQueryChanged
BrowserFileSelected
BrowserFileDeselected
BrowserViewModeChanged
```

## Dependencies / Зависимости

### Depends on:
- `@tauri-apps/api` - Tauri IPC и event listening
- `react` - React hooks и context
- Rust Backend (`src-tauri/src/browser/`) - Хранение и управление состоянием

### Used by:
- `@/features/browser` - UI компоненты браузера
- `@/features/media-studio` - Интеграция в студию
- `@/domains/ai-tools` - AI инструменты для работы с файлами
