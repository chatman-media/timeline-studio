# Browser Module Specification

## Overview

Browser - модуль для навигации и выбора ресурсов (медиа, эффекты, фильтры, переходы, шаблоны).

---

## 1. Component Map (Карта компонентов)

```
Browser (root)
│
├─ BrowserProvider (state context)
│   └─ EffectsProvider (resources context)
│       └─ BrowserWithState
│           │
│           ├─ BrowserTabs ─────────────────────────────────────────┐
│           │   └─ TabButton[] (8 tabs)                             │
│           │                                                        │
│           └─ BrowserContent                                        │
│               │                                                    │
│               ├─ BrowserToolbarWrapper ◄──────────────────────────┤
│               │   └─ MediaToolbar                                  │
│               │       ├─ SearchInput                               │
│               │       ├─ SortDropdown                              │
│               │       ├─ GroupDropdown                             │
│               │       ├─ FilterDropdown                            │
│               │       ├─ ViewModeButtons                           │
│               │       ├─ ZoomButtons                               │
│               │       ├─ FavoritesToggle                           │
│               │       ├─ ImportButton                              │
│               │       └─ DeleteButton                              │
│               │                                                    │
│               └─ TabContentContainer ◄────────────────────────────┘
│                   └─ LazyTabContent (per tab)
│                       └─ Suspense
│                           └─ AdapterContent
│                               └─ UniversalList ◄── ЕДИНЫЙ КОМПОНЕНТ
│                                   ├─ ContentGroup[]
│                                   │   └─ PreviewWrapper ◄── УНИФИЦИРОВАТЬ
│                                   │       └─ PreviewComponent
│                                   └─ NoFiles (empty state)
```

### Preview Components

Все превью компоненты унифицированы и работают корректно:

| Tab | PreviewWrapper | PreviewComponent | Статус |
|-----|----------------|------------------|--------|
| Media | MediaPreviewWrapper | MediaPreview | ✅ Исправлено (Phase 5) |
| Music | AudioPreviewWrapper | AudioPreview | ✅ Унифицировано |
| Effects | EffectPreviewWrapper | EffectPreview | ✅ Работает |
| Filters | FilterPreviewWrapper | FilterPreview | ✅ OK |
| Transitions | TransitionPreviewWrapper | TransitionPreview | ✅ OK |
| Templates | TemplatePreviewWrapper | TemplatePreview | ✅ Своя вёрстка |
| StyleTemplates | StyleTemplatePreviewWrapper | StyleTemplatePreview | ✅ Своя вёрстка |
| Subtitles | SubtitlePreviewWrapper | SubtitlePreview | ✅ OK |

### Media Preview - Режимы отображения (ИСПРАВЛЕНО в Phase 5)

1. **grid** - учитывает пропорции видео (aspect ratio), вертикальное видео отображается вертикально
2. **list** - строки с миниатюрой и метаданными (FileMetadata), масштабируется кнопками +/-
3. **thumbnails** - фиксированное соотношение 16:9

### List View - Масштабирование

Высота строки в list view управляется кнопками Zoom (+/-):
- `previewSize 125-500px` → `listRowHeight 32-80px` (коэффициент 0.32)
- Миниатюра масштабируется пропорционально (соотношение 16:10)
- При компактных размерах (<50px) FileMetadata переключается на однострочный режим

**Целевая архитектура:**

```
UniversalPreview (единый компонент)
├─ PreviewMedia (thumbnail/video)
│   ├─ ImageThumbnail
│   ├─ VideoPlayer (hover)
│   └─ AudioWaveform
├─ PreviewOverlay
│   ├─ DurationBadge
│   ├─ TypeBadge
│   └─ ActionButtons
├─ PreviewInfo
│   ├─ Title
│   ├─ Subtitle
│   └─ Tags
└─ PreviewActions
    ├─ FavoriteButton
    ├─ AddToTimelineButton
    └─ ContextMenu
```

---

## 2. State (Состояние)

### 2.1 BrowserState (XState Machine)

```typescript
interface BrowserState {
  // Active tab
  activeTab: BrowserTab

  // Per-tab settings
  tabSettings: Record<BrowserTab, TabSettings>

  // Per-tab selections
  selectedFiles: Record<BrowserTab, Set<string>>

  // Per-tab favorites
  favorites: Record<BrowserTab, Set<string>>

  // UI state
  isLoading: boolean
  error: string | null
}

interface TabSettings {
  searchQuery: string
  showFavoritesOnly: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  groupBy: string
  filterType: string
  viewMode: ViewMode
  previewSizeIndex: number
}

type BrowserTab =
  | 'media'
  | 'music'
  | 'effects'
  | 'filters'
  | 'transitions'
  | 'templates'
  | 'style_templates'
  | 'subtitles'

type ViewMode = 'list' | 'grid' | 'thumbnails'
```

### 2.2 ResourcesState (EffectsProvider)

```typescript
interface ResourcesState {
  // Loaded resources by type
  effects: VideoEffect[]
  filters: VideoFilter[]
  transitions: Transition[]
  templates: MultiCameraTemplate[]
  styleTemplates: StyleTemplate[]

  // Loading state
  loadingState: LoadingState

  // Cache
  cache: Map<string, Resource>
}

interface LoadingState {
  isLoading: boolean
  loadedSources: Set<ResourceSource>
  loadingQueue: ResourceSource[]
  error: string | null
  progress: number  // 0-100
}

type ResourceSource = 'built-in' | 'local' | 'remote' | 'imported'
```

---

## 3. Operations (Операции)

### 3.1 Tab Operations

| Operation | Method | Backend Command | Event Response |
|-----------|--------|-----------------|----------------|
| Switch tab | `switchTab(tab)` | `SwitchTab` | `TabSwitched` |
| Reset settings | `resetTabSettings(tab)` | `ResetTabSettings` | `TabSettingsReset` |

### 3.2 Search & Filter Operations

| Operation | Method | Backend Command | Event Response |
|-----------|--------|-----------------|----------------|
| Search | `setSearchQuery(query, tab?)` | `SetSearchQuery` | `SearchQueryChanged` |
| Filter | `setFilter(filterType, tab?)` | `SetFilter` | `FilterChanged` |
| Toggle favorites | `toggleFavorites(tab?)` | `ToggleFavorites` | `FavoritesToggled` |

### 3.3 Sort & Group Operations

| Operation | Method | Backend Command | Event Response |
|-----------|--------|-----------------|----------------|
| Sort | `setSort(sortBy, order, tab?)` | `SetSort` | `SortChanged` |
| Group | `setGroupBy(groupBy, tab?)` | `SetGroupBy` | `GroupByChanged` |

### 3.4 View Operations

| Operation | Method | Backend Command | Event Response |
|-----------|--------|-----------------|----------------|
| View mode | `setViewMode(mode, tab?)` | `SetViewMode` | `ViewModeChanged` |
| Preview size | `setPreviewSize(index, tab?)` | `SetPreviewSize` | `PreviewSizeChanged` |

### 3.5 Selection Operations

| Operation | Method | Backend Command | Event Response |
|-----------|--------|-----------------|----------------|
| Select file | `selectFile(id, tab?)` | `SelectFile` | `FileSelected` |
| Deselect file | `deselectFile(id, tab?)` | `DeselectFile` | `FileDeselected` |
| Toggle selection | `toggleFileSelection(id, tab?)` | `ToggleFileSelection` | `FileSelectionToggled` |
| Select all | `selectAllFiles(ids, tab?)` | `SelectAllFiles` | `AllFilesSelected` |
| Deselect all | `deselectAllFiles(tab?)` | `DeselectAllFiles` | `AllFilesDeselected` |

### 3.6 Favorites Operations

| Operation | Method | Backend Command | Event Response |
|-----------|--------|-----------------|----------------|
| Add favorite | `addFavorite(id, tab?)` | `AddFavorite` | `FavoriteAdded` |
| Remove favorite | `removeFavorite(id, tab?)` | `RemoveFavorite` | `FavoriteRemoved` |

---

## 4. Backend Commands

```typescript
// Все команды отправляются через BrowserOrchestrator
type BrowserCommand =
  | { type: 'SwitchTab'; tab: BrowserTab }
  | { type: 'SetSearchQuery'; query: string; tab?: BrowserTab }
  | { type: 'ToggleFavorites'; tab?: BrowserTab }
  | { type: 'SetSort'; sortBy: string; sortOrder: 'asc' | 'desc'; tab?: BrowserTab }
  | { type: 'SetGroupBy'; groupBy: string; tab?: BrowserTab }
  | { type: 'SetFilter'; filterType: string; tab?: BrowserTab }
  | { type: 'SetViewMode'; viewMode: ViewMode; tab?: BrowserTab }
  | { type: 'SetPreviewSize'; sizeIndex: number; tab?: BrowserTab }
  | { type: 'ResetTabSettings'; tab: BrowserTab }
  | { type: 'SelectFile'; fileId: string; tab?: BrowserTab }
  | { type: 'DeselectFile'; fileId: string; tab?: BrowserTab }
  | { type: 'ToggleFileSelection'; fileId: string; tab?: BrowserTab }
  | { type: 'SelectAllFiles'; fileIds: string[]; tab?: BrowserTab }
  | { type: 'DeselectAllFiles'; tab?: BrowserTab }
  | { type: 'AddFavorite'; fileId: string; tab?: BrowserTab }
  | { type: 'RemoveFavorite'; fileId: string; tab?: BrowserTab }
```

---

## 5. Backend Events

```typescript
// События от backend обрабатываются в backend-event-handlers.ts
type BrowserEvent =
  | { type: 'TabSwitched'; tab: BrowserTab }
  | { type: 'SearchQueryChanged'; query: string; tab: BrowserTab }
  | { type: 'FavoritesToggled'; showFavoritesOnly: boolean; tab: BrowserTab }
  | { type: 'SortChanged'; sortBy: string; sortOrder: 'asc' | 'desc'; tab: BrowserTab }
  | { type: 'GroupByChanged'; groupBy: string; tab: BrowserTab }
  | { type: 'FilterChanged'; filterType: string; tab: BrowserTab }
  | { type: 'ViewModeChanged'; viewMode: ViewMode; tab: BrowserTab }
  | { type: 'PreviewSizeChanged'; sizeIndex: number; tab: BrowserTab }
  | { type: 'TabSettingsReset'; tab: BrowserTab; settings: TabSettings }
  | { type: 'FileSelected'; fileId: string; tab: BrowserTab }
  | { type: 'FileDeselected'; fileId: string; tab: BrowserTab }
  | { type: 'FileSelectionToggled'; fileId: string; selected: boolean; tab: BrowserTab }
  | { type: 'AllFilesSelected'; fileIds: string[]; tab: BrowserTab }
  | { type: 'AllFilesDeselected'; tab: BrowserTab }
  | { type: 'FavoriteAdded'; fileId: string; tab: BrowserTab }
  | { type: 'FavoriteRemoved'; fileId: string; tab: BrowserTab }
```

### Event Flow

```
User Action
    │
    ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Component     │────▶│  Orchestrator   │────▶│    Backend      │
│  (onClick)      │     │ (executeCommand)│     │  (Rust/Tauri)   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌────────────────────────────────┘
                        │ emit ProjectEvent { type: "Browser" }
                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Component     │◀────│  XState Machine │◀────│  BackendSync    │
│  (re-render)    │     │ (handleBackend  │     │  (onEvent)      │
└─────────────────┘     │  Event)         │     └─────────────────┘
                        └─────────────────┘
```

---

## 6. Types (Типы)

### 6.1 Core Types (НЕ ДУБЛИРОВАТЬ)

```typescript
// Canonical source: @/domains/browser/types

export type BrowserTab =
  | 'media' | 'music' | 'effects' | 'filters'
  | 'transitions' | 'templates' | 'style_templates' | 'subtitles'

export type ViewMode = 'list' | 'grid' | 'thumbnails'

export interface TabSettings {
  searchQuery: string
  showFavoritesOnly: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  groupBy: string
  filterType: string
  viewMode: ViewMode
  previewSizeIndex: number
}

export interface BrowserState {
  activeTab: BrowserTab
  tabSettings: Partial<Record<BrowserTab, TabSettings>>
  selectedFiles: Partial<Record<BrowserTab, string[]>>
  favorites: Partial<Record<BrowserTab, string[]>>
}
```

### 6.2 Adapter Types

```typescript
// Canonical source: @/features/browser/types/list

export interface ListItem {
  id: string
  name: string
}

export interface PreviewSize {
  width: number
  height: number
}

export interface PreviewComponentProps<T extends ListItem> {
  item: T
  size: PreviewSize
  viewMode: ViewMode
  onClick?: (item: T) => void
  onDragStart?: (item: T, event: React.DragEvent) => void
  onAddToTimeline?: (item: T) => void
  isSelected?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (item: T) => void
}

export interface DataResult<T> {
  items: T[]
  loading: boolean
  error?: Error | null
}

export interface ListAdapter<T extends ListItem> {
  useData: () => DataResult<T>
  PreviewComponent: React.ComponentType<PreviewComponentProps<T>>
  getSortValue: (item: T, sortBy: string) => string | number
  getSearchableText: (item: T) => string[]
  getGroupValue: (item: T, groupBy: string) => string
  matchesFilter?: (item: T, filterType: string) => boolean
  isFavorite?: (item: T) => boolean
  favoriteType: string
  importHandlers?: ImportHandlers
  extraToolbarButtons?: ReactNode
}
```

### 6.3 Resource Types

```typescript
// Canonical source: @/domains/shared/types/resources

export type ResourceType = 'effect' | 'filter' | 'transition' | 'template' | 'style_template'
export type ResourceSource = 'built-in' | 'local' | 'remote' | 'imported'

export interface Resource {
  id: string
  name: string
  type: ResourceType
  source: ResourceSource
  category?: string
  tags?: string[]
  thumbnail?: string
}
```

---

## 7. Hooks API

### 7.1 State Hooks

```typescript
// Browser state
const {
  activeTab,
  currentTabSettings,
  selectedFiles,
  previewSize,
  switchTab,
  setSearchQuery,
  setSort,
  setFilter,
  setViewMode,
  selectFile,
  deselectFile,
  // ...
} = useBrowserState()

// Favorites (синхронизируется с browser state)
const {
  favorites,           // Record<string, string[]> - по типу (media, transition, etc.)
  addToFavorites,      // (item, type) => Promise - отправляет BrowserAddToFavorites
  removeFromFavorites, // (item, type) => Promise - отправляет BrowserRemoveFromFavorites
  isItemFavorite,      // (item, type) => boolean
} = useFavorites()
// Примечание: favorites читаются из browserState.favorites (по tab)
// и конвертируются в формат по type через TAB_TO_TYPE_MAP

// Resources
const { effects, loading } = useEffects(source?)
const { filters, loading } = useFilters(source?)
const { transitions, loading } = useTransitions(source?)
const { results, loading } = useResourcesSearch(type, options)
const resource = useResourceById(type, id)
```

### 7.2 Adapter Hooks

```typescript
// Каждый адаптер возвращает ListAdapter<T>
const adapter = useMediaAdapter()
const adapter = useMusicAdapter()
const adapter = useEffectsAdapter()
const adapter = useFiltersAdapter()
const adapter = useTransitionsAdapter()
const adapter = useTemplatesAdapter()
const adapter = useStyleTemplatesAdapter()
const adapter = useSubtitlesAdapter()
```

---

## 8. Refactoring Recommendations

### 8.1 HIGH PRIORITY: Унификация Preview компонентов

**Проблема:** Каждая вкладка имеет свой PreviewWrapper и PreviewComponent с разной структурой.

**Решение:** Создать `UniversalPreview` компонент:

```typescript
// src/features/browser/components/preview/universal-preview.tsx

interface UniversalPreviewProps<T extends ListItem> {
  item: T
  size: PreviewSize
  viewMode: ViewMode

  // Конфигурация отображения
  config: PreviewConfig

  // Callbacks
  onClick?: () => void
  onDragStart?: (e: React.DragEvent) => void
  onAddToTimeline?: () => void
  onToggleFavorite?: () => void

  // State
  isSelected?: boolean
  isFavorite?: boolean
}

interface PreviewConfig {
  // Media preview
  thumbnailUrl?: string | ((item: any) => string)
  videoPreviewUrl?: string | ((item: any) => string)
  showVideoOnHover?: boolean

  // Badges
  showDuration?: boolean
  getDuration?: (item: any) => number
  showType?: boolean
  getType?: (item: any) => string

  // Info
  getTitle: (item: any) => string
  getSubtitle?: (item: any) => string
  getTags?: (item: any) => string[]

  // Actions
  actions?: PreviewAction[]
}

// Использование:
<UniversalPreview
  item={mediaFile}
  size={previewSize}
  viewMode={viewMode}
  config={{
    thumbnailUrl: (item) => item.thumbnail,
    showVideoOnHover: true,
    showDuration: true,
    getDuration: (item) => item.duration,
    getTitle: (item) => item.name,
    getSubtitle: (item) => formatFileSize(item.size),
  }}
  onClick={handleClick}
  onDragStart={handleDrag}
/>
```

### 8.2 MEDIUM PRIORITY: Оптимизация перерендеров

**Проблема:** При изменении любого состояния перерисовывается весь список.

**Решение:**

```typescript
// 1. Мемоизация items в адаптерах
const memoizedItems = useMemo(() =>
  filterAndSortItems(items, settings),
  [items, settings.searchQuery, settings.sortBy, settings.filterType]
)

// 2. Virtualization для больших списков
import { useVirtualizer } from '@tanstack/react-virtual'

// 3. Отдельные селекторы для каждого свойства
const searchQuery = useSelector(actor, (s) => s.context.tabSettings[tab]?.searchQuery)
const sortBy = useSelector(actor, (s) => s.context.tabSettings[tab]?.sortBy)
```

### 8.3 MEDIUM PRIORITY: Убрать дублирование типов

**Текущее состояние:**
- `BrowserTab` определён в 3 местах
- `ViewMode` определён в 2 местах
- `TabSettings` определён в 2 местах

**Решение:**

```typescript
// Единственный источник: @/domains/browser/types/index.ts
export type { BrowserTab, ViewMode, TabSettings, BrowserState } from './browser'

// Все остальные файлы импортируют отсюда
import type { BrowserTab, ViewMode } from '@/domains/browser/types'
```

### 8.4 LOW PRIORITY: Унификация Toolbar

**Проблема:** Toolbar имеет условную логику для разных вкладок.

**Решение:** Конфигурация toolbar через adapter:

```typescript
interface ListAdapter<T> {
  // ... existing

  toolbarConfig: ToolbarConfig
}

interface ToolbarConfig {
  showSearch: boolean
  sortOptions: SortOption[]
  groupOptions: GroupOption[]
  filterOptions: FilterOption[]
  showFavorites: boolean
  showImport: boolean
  showDelete: boolean
  extraButtons?: ReactNode
}
```

### 8.5 Architecture: Event-Driven UI Updates

**Принцип:** UI обновляется ТОЛЬКО через события от backend.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User Click  │────▶│   Command    │────▶│   Backend    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
       ┌──────────────────────────────────────────┘
       │ Event (optimistic: <50ms)
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  UI Update   │◀────│    State     │◀────│    Event     │
│  (reactive)  │     │   Machine    │     │   Handler    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Optimistic Updates:** Для быстрого отклика можно добавить оптимистичные обновления:

```typescript
async function handleClick(item: T) {
  // 1. Optimistic update (immediate)
  setLocalSelected(prev => [...prev, item.id])

  // 2. Send command to backend
  await selectFile(item.id)

  // 3. Backend event will confirm/revert
  // (handled automatically by event handler)
}
```

---

## 9. File Structure (Целевая)

```
src/
├── domains/browser/
│   ├── types/
│   │   └── index.ts              # BrowserTab, ViewMode, TabSettings, BrowserState
│   ├── machines/
│   │   ├── browser-machine.ts    # XState machine
│   │   └── backend-event-handlers.ts
│   ├── services/
│   │   └── browser-orchestrator.ts
│   └── providers/
│       └── browser-provider.tsx
│
└── features/browser/
    ├── types/
    │   └── list.ts               # ListItem, ListAdapter, PreviewComponentProps
    │
    ├── components/
    │   ├── browser.tsx           # Root component
    │   ├── browser-tabs.tsx
    │   ├── browser-content.tsx
    │   ├── browser-toolbar.tsx
    │   │
    │   ├── list/
    │   │   ├── universal-list.tsx
    │   │   ├── content-group.tsx
    │   │   └── no-files.tsx
    │   │
    │   └── preview/
    │       ├── universal-preview.tsx    # НОВЫЙ: единый компонент
    │       ├── preview-media.tsx        # Thumbnail/Video/Audio
    │       ├── preview-overlay.tsx      # Badges, actions
    │       └── preview-info.tsx         # Title, subtitle, tags
    │
    ├── adapters/
    │   ├── media-adapter.ts
    │   ├── music-adapter.ts
    │   ├── effects-adapter.ts
    │   ├── filters-adapter.ts
    │   ├── transitions-adapter.ts
    │   ├── templates-adapter.ts
    │   ├── style-templates-adapter.ts
    │   └── subtitles-adapter.ts
    │
    ├── hooks/
    │   ├── use-resources.ts
    │   └── use-music-import.ts
    │
    └── utils/
        ├── sorting.ts
        ├── filtering.ts
        └── grouping.ts
```

---

## 10. Migration Checklist

### Phase 1: Types Consolidation ✅ DONE
- [x] Типы генерируются из Rust → `tauri-bindings.ts` (single source of truth)
- [x] Реэкспорт через `@/domains/browser/index.ts`
- [x] `list.ts` использует `ViewMode` тип вместо хардкода
- [x] Внешние файлы импортируют из `@/domains/browser`

### Phase 2: UniversalPreview Component ✅ DONE
- [x] Создать `universal-preview.tsx` - унифицированный компонент превью
- [x] Создать `preview-media.tsx` - thumbnail с video on hover
- [x] Создать `preview-overlay.tsx` - badges (duration, type, resolution) + buttons
- [x] Создать `preview-info.tsx` - title/subtitle/tags/metadata
- [x] Создать `types.ts` - PreviewConfig, PreviewAction, UniversalPreviewProps
- [x] Добавить `previewConfig` в ListAdapter interface

### Phase 3: Migrate Adapters ✅ DONE
- [x] `useMediaAdapter` - оставлен с кастомным PreviewComponent (сложная логика: context menu, aspect ratio)
- [x] `useEffectsAdapter` → добавлен previewConfig (EffectPreview для CSS-эффектов)
- [x] `useFiltersAdapter` → добавлен previewConfig (FilterPreview для CSS-фильтров)
- [x] `useTransitionsAdapter` → добавлен previewConfig (TransitionPreview для анимаций)
- [x] `useMusicAdapter` → добавлен previewConfig (кастомный PreviewComponent для аудио)
- [x] `useSubtitlesAdapter` → добавлен previewConfig (кастомный PreviewComponent для стилей)
- [x] Templates и StyleTemplates - оставляем свою вёрстку (не унифицируем)

### Phase 4: Performance Optimization ✅ DONE
- [x] Добавить виртуализацию для больших списков
  - Создан `VirtualizedContentGroup` с @tanstack/react-virtual
  - Автоматическое включение виртуализации при >50 элементах
  - Поддержка list/grid/thumbnails режимов
- [x] Оптимизировать селекторы состояния
  - Созданы гранулярные хуки: `useBrowserActiveTab`, `useBrowserTabSettings`, `useBrowserViewMode`, `useBrowserPreviewSize`, `useBrowserSearchQuery`, `useBrowserSelectedFiles`
  - Компоненты могут подписываться только на нужные части состояния
- [x] Добавить optimistic updates
  - Создан `useOptimisticSelection` хук для мгновенного отклика UI при выборе файлов

### Phase 5: Cleanup ✅ DONE
- [x] Исправлена структура превью медиафайлов (flex-col, имя файла под превью)
- [x] Удалены лишние бордеры с превью (`border border-border hover:border-accent`)
- [x] Интегрирован `FileMetadata` компонент для list view (данные из backend через probeData)
- [x] Исправлен `useFavorites` хук - теперь синхронизируется с browser state через события
- [x] List view масштабируется кнопками +/- (`previewSize 125-500` → `listRowHeight 32-80px`)
- [x] `FileMetadata` адаптирован для компактных размеров (<50px показывает однострочный вариант)
- [x] Обновлены тесты (650 тестов проходят)
