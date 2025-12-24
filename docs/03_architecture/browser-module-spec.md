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
│           │   └─ TabButton[] (7 tabs)                             │
│           │       ├─ media                                         │
│           │       ├─ music                                         │
│           │       ├─ effects                                       │
│           │       ├─ filters                                       │
│           │       ├─ transitions                                   │
│           │       ├─ templates                                     │
│           │       └─ subtitles                                     │
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
│               │                                                    │
│               └─ TabContentContainer ◄────────────────────────────┘
│                   └─ LazyTabContent (per tab)
│                       └─ Suspense
│                           └─ AdapterContent
│                               └─ UniversalList ◄── ЕДИНЫЙ КОМПОНЕНТ
│                                   ├─ VirtualizedContentGroup[] (>50 items)
│                                   ├─ ContentGroup[] (<50 items)
│                                   │   └─ [Preview Components по типу таба]
│                                   └─ NoFiles (empty state)
```

### Preview Components Architecture (Детальная схема)

```
Preview Layer (зависит от activeTab)
│
├─ [media tab] MediaPreview ◄── Кастомная реализация
│   ├─ VideoThumbnail (с aspect ratio проекта)
│   ├─ FileMetadata (list view: имя, размер, длительность)
│   ├─ ContextMenu (доп. действия)
│   └─ DragHandle
│
├─ [music tab] AudioPreview ◄── Кастомная реализация
│   ├─ AudioWaveform (визуализация)
│   ├─ PlayButton (inline preview)
│   ├─ TrackInfo (название, исполнитель, длительность)
│   └─ FavoriteButton
│
├─ [effects tab] EffectPreview ◄── UniversalPreview
│   └─ UniversalPreview
│       ├─ PreviewMedia
│       │   └─ EffectRenderer (CSS-трансформация на демо-видео)
│       ├─ PreviewOverlay
│       │   ├─ ComplexityBadge (basic/intermediate/advanced)
│       │   └─ CategoryBadge
│       ├─ PreviewInfo
│       │   ├─ Title (название эффекта)
│       │   └─ Tags (категории, теги)
│       └─ PreviewActions
│           ├─ AddToTimelineButton
│           └─ FavoriteButton
│
├─ [filters tab] FilterPreview ◄── UniversalPreview
│   └─ UniversalPreview
│       ├─ PreviewMedia
│       │   └─ FilterRenderer (CSS-фильтры: brightness, contrast, hue)
│       ├─ PreviewOverlay
│       │   └─ FilterTypeBadge (color/blur/artistic/etc.)
│       ├─ PreviewInfo
│       │   ├─ Title (название фильтра)
│       │   └─ Description
│       └─ PreviewActions
│           ├─ ApplyButton
│           └─ FavoriteButton
│
├─ [transitions tab] TransitionPreview ◄── UniversalPreview
│   └─ UniversalPreview
│       ├─ PreviewMedia
│       │   └─ TransitionAnimation (2 фрейма с анимацией перехода)
│       ├─ PreviewOverlay
│       │   ├─ DurationBadge (длительность перехода)
│       │   └─ CategoryBadge (fade/slide/3d/etc.)
│       ├─ PreviewInfo
│       │   ├─ Title (название перехода)
│       │   └─ Tags
│       └─ PreviewActions
│           ├─ AddToTimelineButton
│           └─ FavoriteButton
│
├─ [subtitles tab] SubtitlePreview ◄── Кастомная реализация
│   ├─ SubtitleRenderer (демо текст с стилем)
│   ├─ StyleInfo (шрифт, размер, цвет, позиция)
│   ├─ PreviewOverlay
│   │   └─ CategoryBadge (basic/animated/modern)
│   └─ PreviewActions
│       ├─ ApplyButton
│       └─ FavoriteButton
│
└─ [templates tab] TemplatePreview ◄── Своя вёрстка
    ├─ MultiScreenGrid (сетка из N экранов)
    │   └─ ScreenCell[] (каждый экран показывает своё видео)
    ├─ LayoutInfo (название, количество экранов)
    ├─ ResolutionBadge (16:9, 9:16, 1:1, etc.)
    └─ PreviewActions
        ├─ ApplyButton
        └─ FavoriteButton
```

### UniversalPreview Component Structure

```
UniversalPreview
├─ PreviewContainer (wrapper с размером, состоянием)
│   │
│   ├─ PreviewMedia ◄── Центральный медиа-контент
│   │   ├─ ImageThumbnail (статичное изображение)
│   │   ├─ VideoPreview (видео при hover)
│   │   ├─ AudioWaveform (для аудио)
│   │   └─ EffectRenderer (для эффектов/фильтров)
│   │
│   ├─ PreviewOverlay ◄── Badges и индикаторы
│   │   ├─ DurationBadge (длительность медиа)
│   │   ├─ TypeBadge (тип файла: video/audio/image)
│   │   ├─ ResolutionBadge (разрешение: 1920x1080)
│   │   ├─ ComplexityBadge (сложность эффекта)
│   │   └─ CategoryBadge (категория)
│   │
│   ├─ PreviewInfo ◄── Текстовая информация
│   │   ├─ Title (название)
│   │   ├─ Subtitle (дополнительная инфо)
│   │   ├─ Description (описание)
│   │   └─ Tags[] (теги)
│   │
│   └─ PreviewActions ◄── Кнопки действий
│       ├─ FavoriteButton (добавить в избранное)
│       ├─ AddToTimelineButton (добавить на таймлайн)
│       ├─ ApplyButton (применить эффект/фильтр)
│       ├─ PlayButton (для аудио/видео)
│       └─ ContextMenuButton (доп. действия)
│
└─ [ViewMode-specific layout]
    ├─ List: horizontal (thumbnail + metadata)
    ├─ Grid: vertical (thumbnail + title)
    └─ Thumbnails: compact (только thumbnail + badge)
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
  | 'transitions' | 'templates' | 'subtitles'

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

export type ResourceType = 'effect' | 'filter' | 'transition' | 'template'
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

### 6.4 Toolbar Configurations (По табам)

```typescript
// Canonical source: @/features/browser/components/media-toolbar-configs.ts

// ==================== MEDIA TAB ====================
export const mediaSortOptions = [
  { value: 'name', label: 'browser.toolbar.sortBy.name' },
  { value: 'date', label: 'browser.toolbar.sortBy.date' },
  { value: 'size', label: 'browser.toolbar.sortBy.size' },
  { value: 'duration', label: 'browser.toolbar.sortBy.duration' },
]

export const mediaGroupOptions = [
  { value: 'none', label: 'browser.toolbar.groupBy.none' },
  { value: 'type', label: 'browser.toolbar.groupBy.type' },
  { value: 'date', label: 'browser.toolbar.groupBy.date' },
  { value: 'duration', label: 'browser.toolbar.groupBy.duration' },
]

export const mediaFilterOptions = [
  { value: 'video', label: 'browser.toolbar.filterBy.video' },
  { value: 'audio', label: 'browser.toolbar.filterBy.audio' },
  { value: 'image', label: 'browser.toolbar.filterBy.image' },
]

export const mediaViewModes = [] // No view mode switcher for media

// ==================== MUSIC TAB ====================
export const musicSortOptions = [
  { value: 'name', label: 'browser.toolbar.sortBy.name' },
  { value: 'artist', label: 'browser.toolbar.sortBy.artist' },
  { value: 'album', label: 'browser.toolbar.sortBy.album' },
  { value: 'duration', label: 'browser.toolbar.sortBy.duration' },
  { value: 'date', label: 'browser.toolbar.sortBy.date' },
  { value: 'genre', label: 'browser.toolbar.sortBy.genre' },
]

export const musicGroupOptions = [
  { value: 'none', label: 'browser.toolbar.groupBy.none' },
  { value: 'artist', label: 'browser.toolbar.groupBy.artist' },
  { value: 'album', label: 'browser.toolbar.groupBy.album' },
  { value: 'genre', label: 'browser.toolbar.groupBy.genre' },
]

export const musicViewModes = [
  { value: 'list', icon: List, label: 'List View', testId: 'view-list' },
  { value: 'thumbnails', icon: Grid, label: 'Thumbnails View', testId: 'view-thumbnails' },
]

// ==================== EFFECTS TAB ====================
export const effectsSortOptions = [
  { value: 'name', label: 'browser.toolbar.sortBy.name' },
  { value: 'complexity', label: 'browser.toolbar.sortBy.complexity' },
  { value: 'category', label: 'browser.toolbar.sortBy.category' },
]

export const effectsGroupOptions = [
  { value: 'none', label: 'browser.toolbar.groupBy.none' },
  { value: 'category', label: 'browser.toolbar.groupBy.category' },
  { value: 'complexity', label: 'browser.toolbar.groupBy.complexity' },
  { value: 'type', label: 'browser.toolbar.groupBy.type' },
  { value: 'tags', label: 'browser.toolbar.groupBy.tags' },
]

export const effectsFilterOptions = [
  { value: 'basic', label: 'browser.toolbar.filterBy.basic' },
  { value: 'intermediate', label: 'browser.toolbar.filterBy.intermediate' },
  { value: 'advanced', label: 'browser.toolbar.filterBy.advanced' },
  { value: 'category-color', label: 'browser.toolbar.filterBy.categoryColor' },
  { value: 'category-distortion', label: 'browser.toolbar.filterBy.categoryDistortion' },
  { value: 'category-blur', label: 'browser.toolbar.filterBy.categoryBlur' },
  { value: 'category-artistic', label: 'browser.toolbar.filterBy.categoryArtistic' },
]

export const effectsViewModes = [
  { value: 'thumbnails', icon: Grid, label: 'Thumbnails View', testId: 'view-thumbnails' },
]

// ==================== FILTERS TAB ====================
export const filtersFilterOptions = [
  { value: 'basic', label: 'browser.toolbar.filterBy.basic' },
  { value: 'color-correction', label: 'browser.toolbar.filterBy.colorCorrection' },
  { value: 'artistic', label: 'browser.toolbar.filterBy.artistic' },
  { value: 'blur', label: 'browser.toolbar.filterBy.blur' },
  { value: 'sharpen', label: 'browser.toolbar.filterBy.sharpen' },
]

// ==================== TRANSITIONS TAB ====================
export const transitionsFilterOptions = [
  { value: 'basic', label: 'browser.toolbar.filterBy.basic' },
  { value: 'category-3d', label: 'browser.toolbar.filterBy.category3d' },
  { value: 'category-wipe', label: 'browser.toolbar.filterBy.categoryWipe' },
  { value: 'category-zoom', label: 'browser.toolbar.filterBy.categoryZoom' },
  { value: 'category-slide', label: 'browser.toolbar.filterBy.categorySlide' },
]

// ==================== SUBTITLES TAB ====================
export const subtitlesFilterOptions = [
  { value: 'basic', label: 'browser.toolbar.filterBy.basic' },
  { value: 'category-animated', label: 'browser.toolbar.filterBy.categoryAnimated' },
  { value: 'category-modern', label: 'browser.toolbar.filterBy.categoryModern' },
  { value: 'category-classic', label: 'browser.toolbar.filterBy.categoryClassic' },
]

// ==================== TEMPLATES TAB ====================
export const templatesFilterOptions = [
  { value: '2', label: '2 экрана' },
  { value: '3', label: '3 экрана' },
  { value: '4', label: '4 экрана' },
  { value: '6', label: '6 экранов' },
  { value: '9', label: '9 экранов' },
  { value: '16', label: '16 экранов' },
]

// ==================== HELPER FUNCTIONS ====================
export function getToolbarConfigForContent(contentType: BrowserTab): ToolbarConfig {
  switch (contentType) {
    case 'media':
      return {
        viewModes: mediaViewModes,
        sortOptions: mediaSortOptions,
        groupOptions: mediaGroupOptions,
        filterOptions: mediaFilterOptions,
        showZoom: true,
        showGroupBy: true,
      }

    case 'music':
      return {
        viewModes: musicViewModes,
        sortOptions: musicSortOptions,
        groupOptions: musicGroupOptions,
        filterOptions: undefined,
        showZoom: false,
        showGroupBy: true,
      }

    case 'effects':
      return {
        viewModes: effectsViewModes,
        sortOptions: effectsSortOptions,
        groupOptions: effectsGroupOptions,
        filterOptions: effectsFilterOptions,
        showZoom: true,
        showGroupBy: true,
      }

    case 'filters':
      return {
        viewModes: effectsViewModes,
        sortOptions: effectsSortOptions,
        groupOptions: effectsGroupOptions,
        filterOptions: filtersFilterOptions,
        showZoom: true,
        showGroupBy: true,
      }

    case 'transitions':
      return {
        viewModes: effectsViewModes,
        sortOptions: effectsSortOptions,
        groupOptions: effectsGroupOptions,
        filterOptions: transitionsFilterOptions,
        showZoom: true,
        showGroupBy: true,
      }

    case 'subtitles':
      return {
        viewModes: effectsViewModes,
        sortOptions: effectsSortOptions,
        groupOptions: effectsGroupOptions,
        filterOptions: subtitlesFilterOptions,
        showZoom: true,
        showGroupBy: true,
      }

    case 'templates':
      return {
        viewModes: effectsViewModes,
        sortOptions: effectsSortOptions,
        groupOptions: effectsGroupOptions,
        filterOptions: templatesFilterOptions,
        showZoom: true,
        showGroupBy: true,
      }

    default:
      return getToolbarConfigForContent('media')
  }
}

interface ToolbarConfig {
  viewModes: ViewModeOption[]
  sortOptions: ToolbarOption[]
  groupOptions: ToolbarOption[]
  filterOptions?: ToolbarOption[]
  showZoom: boolean
  showGroupBy: boolean
}

interface ToolbarOption {
  value: string
  label: string
}

interface ViewModeOption {
  value: ViewMode
  icon: React.ComponentType
  label: string
  testId: string
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
const adapter = useSubtitlesAdapter()
```

### 7.3 Adapter Implementation Example

Полный пример реализации `useMediaAdapter()`:

```typescript
// src/features/browser/adapters/use-media-adapter.tsx

import { MediaFile } from '@/domains/media-management/types'
import { useMedia } from '@/domains/media-management/hooks'
import { useFavorites } from '@/domains/project-management/hooks'
import { MediaPreview } from '../components/media-preview'
import type { ListAdapter } from '../types/list'

export function useMediaAdapter(): ListAdapter<MediaFile> {
  const { files, loading, error } = useMedia()
  const { isItemFavorite } = useFavorites()

  return {
    // 1. DATA: Откуда брать данные
    useData: () => ({
      items: files,
      loading,
      error,
    }),

    // 2. PREVIEW: Компонент для отображения элемента
    PreviewComponent: MediaPreview,

    // 3. SORTING: Как сортировать элементы
    getSortValue: (item: MediaFile, sortBy: string): string | number => {
      switch (sortBy) {
        case 'name':
          return item.name.toLowerCase()
        case 'date':
          return new Date(item.creationTime).getTime()
        case 'size':
          return item.size || 0
        case 'duration':
          return item.duration || 0
        default:
          return item.name.toLowerCase()
      }
    },

    // 4. SEARCH: Какие поля индексировать для поиска
    getSearchableText: (item: MediaFile): string[] => {
      return [
        item.name,
        item.path,
        // Можно добавить метаданные, теги, описание
      ]
    },

    // 5. GROUPING: Как группировать элементы
    getGroupValue: (item: MediaFile, groupBy: string): string => {
      switch (groupBy) {
        case 'type':
          if (item.isVideo) return 'Видео'
          if (item.isAudio) return 'Аудио'
          if (item.isImage) return 'Изображения'
          return 'Другое'

        case 'date':
          const date = new Date(item.creationTime)
          const today = new Date()
          const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDays === 0) return 'Сегодня'
          if (diffDays === 1) return 'Вчера'
          if (diffDays < 7) return 'На этой неделе'
          if (diffDays < 30) return 'В этом месяце'
          return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })

        case 'duration':
          const duration = item.duration || 0
          if (duration < 30) return '< 30 сек'
          if (duration < 60) return '< 1 мин'
          if (duration < 300) return '< 5 мин'
          if (duration < 600) return '< 10 мин'
          return '> 10 мин'

        default:
          return 'Все файлы'
      }
    },

    // 6. FILTERING: Как фильтровать элементы
    matchesFilter: (item: MediaFile, filterType: string): boolean => {
      switch (filterType) {
        case 'video':
          return item.isVideo
        case 'audio':
          return item.isAudio
        case 'image':
          return item.isImage
        default:
          return true
      }
    },

    // 7. FAVORITES: Проверка избранного
    isFavorite: (item: MediaFile): boolean => {
      return isItemFavorite(item, 'media')
    },

    // 8. TYPE: Тип для favorites операций
    favoriteType: 'media',

    // 9. IMPORT: Обработчики импорта (опционально)
    importHandlers: {
      onImportClick: () => {
        // Открыть диалог выбора файлов через Tauri
        invoke('select_media_files')
      },
      acceptedTypes: ['.mp4', '.mov', '.avi', '.mkv', '.jpg', '.png'],
      onFilesSelected: async (files: File[]) => {
        // Импортировать файлы в проект
        await invoke('import_media_files', { paths: files.map(f => f.path) })
      },
    },

    // 10. EXTRA BUTTONS: Дополнительные кнопки toolbar (опционально)
    extraToolbarButtons: null,
  }
}
```

**Пример для Effects (с ресурсами):**

```typescript
// src/features/browser/adapters/use-effects-adapter.tsx

import { VideoEffect } from '@/domains/shared/types/resources'
import { useEffects } from '@/features/effects/hooks'
import { EffectPreview } from '../components/effect-preview'

export function useEffectsAdapter(): ListAdapter<VideoEffect> {
  const { effects, loading } = useEffects('built-in')
  const { isItemFavorite } = useFavorites()

  return {
    useData: () => ({
      items: effects,
      loading,
      error: null,
    }),

    PreviewComponent: EffectPreview,

    getSortValue: (item, sortBy) => {
      switch (sortBy) {
        case 'name':
          return item.name.toLowerCase()
        case 'complexity':
          return item.complexity || 'basic'
        case 'category':
          return item.category || 'uncategorized'
        default:
          return item.name.toLowerCase()
      }
    },

    getSearchableText: (item) => [
      item.name,
      item.category || '',
      ...(item.tags || []),
    ],

    getGroupValue: (item, groupBy) => {
      switch (groupBy) {
        case 'category':
          return item.category || 'Без категории'
        case 'complexity':
          const complexityLabels = {
            basic: 'Простые',
            intermediate: 'Средние',
            advanced: 'Сложные',
          }
          return complexityLabels[item.complexity as keyof typeof complexityLabels] || 'Другие'
        case 'type':
          return item.type || 'Другие'
        case 'tags':
          return item.tags?.[0] || 'Без тегов'
        default:
          return 'Все эффекты'
      }
    },

    matchesFilter: (item, filterType) => {
      // Complexity filters
      if (['basic', 'intermediate', 'advanced'].includes(filterType)) {
        return item.complexity === filterType
      }

      // Category filters
      if (filterType.startsWith('category-')) {
        const category = filterType.replace('category-', '')
        return item.category === category
      }

      return true
    },

    isFavorite: (item) => isItemFavorite(item, 'effect'),
    favoriteType: 'effect',
    importHandlers: undefined,
    extraToolbarButtons: null,
  }
}
```

### 7.4 Provider Setup & Context

**BrowserProvider с XState Machine:**

```typescript
// src/domains/browser/providers/browser-provider.tsx

import { createContext, useContext, type ReactNode } from 'react'
import { useActorRef } from '@xstate/react'
import { browserMachine } from '../machines/browser-machine'
import type { ActorRefFrom } from 'xstate'

type BrowserActorRef = ActorRefFrom<typeof browserMachine>

const BrowserContext = createContext<BrowserActorRef | null>(null)

export function BrowserProvider({ children }: { children: ReactNode }) {
  // Создаём actor от XState machine
  const actor = useActorRef(browserMachine, {
    input: {
      // Начальное состояние можно передать сюда
      activeTab: 'media',
      tabSettings: {},
      selectedFiles: {},
      favorites: {},
    },
  })

  return (
    <BrowserContext.Provider value={actor}>
      {children}
    </BrowserContext.Provider>
  )
}

// Hook для доступа к browser state
export function useBrowser() {
  const actor = useContext(BrowserContext)
  if (!actor) {
    throw new Error('useBrowser must be used within BrowserProvider')
  }
  return actor
}

// Hook для получения конкретной части state (гранулярная подписка)
export function useBrowserSelector<T>(selector: (state: BrowserState) => T): T {
  const actor = useBrowser()
  return useSelector(actor, (snapshot) => selector(snapshot.context))
}
```

**Использование в приложении:**

```typescript
// src/app.tsx

function App() {
  return (
    <BrowserProvider>
      <EffectsProvider>
        <MediaManagementProvider>
          <Browser />
        </MediaManagementProvider>
      </EffectsProvider>
    </BrowserProvider>
  )
}
```

**Backend Sync Setup:**

```typescript
// src/domains/browser/providers/browser-backend-sync.tsx

import { useEffect } from 'react'
import { useBrowser } from './browser-provider'
import { listen } from '@tauri-apps/api/event'
import { handleBrowserEvent } from '../machines/backend-event-handlers'

export function BrowserBackendSync({ children }: { children: ReactNode }) {
  const actor = useBrowser()

  useEffect(() => {
    // Слушаем события от backend
    const unlisten = listen<BrowserEvent>('browser-event', (event) => {
      // Отправляем событие в XState machine
      actor.send({
        type: 'BACKEND_EVENT',
        payload: event.payload,
      })
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [actor])

  return <>{children}</>
}

// Использование:
<BrowserProvider>
  <BrowserBackendSync>
    <Browser />
  </BrowserBackendSync>
</BrowserProvider>
```

---

## 8. Implementation Patterns

### 8.1 UniversalList Algorithm

**Полный алгоритм обработки данных в UniversalList:**

```typescript
// src/features/browser/components/list/universal-list.tsx

export function UniversalList<T extends ListItem>({
  adapter,
  settings,
  onItemClick,
  onItemDragStart,
}: UniversalListProps<T>) {
  // 1. Получаем сырые данные из адаптера
  const { items, loading, error } = adapter.useData()

  // 2. Фильтруем по поисковому запросу
  const searchFiltered = useMemo(() => {
    if (!settings.searchQuery) return items

    const query = settings.searchQuery.toLowerCase()
    return items.filter((item) => {
      const searchableTexts = adapter.getSearchableText(item)
      return searchableTexts.some((text) => text.toLowerCase().includes(query))
    })
  }, [items, settings.searchQuery, adapter])

  // 3. Фильтруем по типу (если есть matchesFilter)
  const typeFiltered = useMemo(() => {
    if (!settings.filterType || !adapter.matchesFilter) return searchFiltered

    return searchFiltered.filter((item) =>
      adapter.matchesFilter!(item, settings.filterType)
    )
  }, [searchFiltered, settings.filterType, adapter])

  // 4. Фильтруем по избранным (если включено)
  const favoritesFiltered = useMemo(() => {
    if (!settings.showFavoritesOnly || !adapter.isFavorite) return typeFiltered

    return typeFiltered.filter((item) => adapter.isFavorite!(item))
  }, [typeFiltered, settings.showFavoritesOnly, adapter])

  // 5. Сортируем
  const sorted = useMemo(() => {
    const items = [...favoritesFiltered]
    const { sortBy, sortOrder } = settings

    items.sort((a, b) => {
      const aValue = adapter.getSortValue(a, sortBy)
      const bValue = adapter.getSortValue(b, sortBy)

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortOrder === 'asc' ? comparison : -comparison
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return items
  }, [favoritesFiltered, settings.sortBy, settings.sortOrder, adapter])

  // 6. Группируем (если groupBy !== 'none')
  const grouped = useMemo(() => {
    if (settings.groupBy === 'none') {
      return [{ title: null, items: sorted }]
    }

    const groups = new Map<string, T[]>()

    sorted.forEach((item) => {
      const groupValue = adapter.getGroupValue(item, settings.groupBy)
      if (!groups.has(groupValue)) {
        groups.set(groupValue, [])
      }
      groups.get(groupValue)!.push(item)
    })

    return Array.from(groups.entries()).map(([title, items]) => ({
      title,
      items,
    }))
  }, [sorted, settings.groupBy, adapter])

  // 7. Рендерим группы
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (grouped[0].items.length === 0) return <NoFiles />

  return (
    <div className="universal-list">
      {grouped.map((group, index) => (
        <ContentGroup
          key={group.title || index}
          title={group.title}
          items={group.items}
          PreviewComponent={adapter.PreviewComponent}
          viewMode={settings.viewMode}
          previewSize={PREVIEW_SIZES[settings.previewSizeIndex]}
          onItemClick={onItemClick}
          onItemDragStart={onItemDragStart}
          isFavorite={adapter.isFavorite}
        />
      ))}
    </div>
  )
}
```

### 8.2 Event Handlers Implementation

**Backend Event Handlers в XState Machine:**

```typescript
// src/domains/browser/machines/backend-event-handlers.ts

import type { BrowserContext, BrowserEvent } from '../types'

export function handleBrowserEvent(
  context: BrowserContext,
  event: BrowserEvent
): Partial<BrowserContext> {
  switch (event.type) {
    case 'TabSwitched':
      return {
        activeTab: event.tab,
      }

    case 'SearchQueryChanged':
      return {
        tabSettings: {
          ...context.tabSettings,
          [event.tab]: {
            ...context.tabSettings[event.tab],
            searchQuery: event.query,
          },
        },
      }

    case 'FavoritesToggled':
      return {
        tabSettings: {
          ...context.tabSettings,
          [event.tab]: {
            ...context.tabSettings[event.tab],
            showFavoritesOnly: event.showFavoritesOnly,
          },
        },
      }

    case 'SortChanged':
      return {
        tabSettings: {
          ...context.tabSettings,
          [event.tab]: {
            ...context.tabSettings[event.tab],
            sortBy: event.sortBy,
            sortOrder: event.sortOrder,
          },
        },
      }

    case 'ViewModeChanged':
      return {
        tabSettings: {
          ...context.tabSettings,
          [event.tab]: {
            ...context.tabSettings[event.tab],
            viewMode: event.viewMode,
          },
        },
      }

    case 'FileSelected':
      const currentSelected = context.selectedFiles[event.tab] || []
      return {
        selectedFiles: {
          ...context.selectedFiles,
          [event.tab]: [...currentSelected, event.fileId],
        },
      }

    case 'FileDeselected':
      const selected = context.selectedFiles[event.tab] || []
      return {
        selectedFiles: {
          ...context.selectedFiles,
          [event.tab]: selected.filter((id) => id !== event.fileId),
        },
      }

    case 'FavoriteAdded':
      const favorites = context.favorites[event.tab] || []
      return {
        favorites: {
          ...context.favorites,
          [event.tab]: [...favorites, event.fileId],
        },
      }

    case 'FavoriteRemoved':
      const favs = context.favorites[event.tab] || []
      return {
        favorites: {
          ...context.favorites,
          [event.tab]: favs.filter((id) => id !== event.fileId),
        },
      }

    default:
      return {}
  }
}
```

**Интеграция в XState Machine:**

```typescript
// src/domains/browser/machines/browser-machine.ts

import { setup } from 'xstate'
import { handleBrowserEvent } from './backend-event-handlers'

export const browserMachine = setup({
  types: {
    context: {} as BrowserContext,
    events: {} as { type: 'BACKEND_EVENT'; payload: BrowserEvent },
  },
}).createMachine({
  id: 'browser',
  initial: 'idle',
  context: {
    activeTab: 'media',
    tabSettings: {},
    selectedFiles: {},
    favorites: {},
  },
  states: {
    idle: {
      on: {
        BACKEND_EVENT: {
          actions: assign(({ context, event }) => {
            return handleBrowserEvent(context, event.payload)
          }),
        },
      },
    },
  },
})
```

### 8.3 Data Loading Strategy

**Откуда берутся данные для каждого таба:**

| Tab | Data Source | Loading Method | Cache Strategy |
|-----|-------------|----------------|----------------|
| **Media** | Tauri Backend | `invoke('get_media_files')` | On project load, refresh on import |
| **Music** | Tauri Backend | `invoke('get_music_files')` | Same as Media |
| **Effects** | EffectsProvider Context | Loaded at app start from `/public/effects/` | In-memory cache, reload on source change |
| **Filters** | EffectsProvider Context | Loaded at app start from `/public/filters/` | Same as Effects |
| **Transitions** | EffectsProvider Context | Loaded at app start from `/public/transitions/` | Same as Effects |
| **Templates** | EffectsProvider Context | Loaded at app start from `/public/templates/` | Same as Effects |
| **Subtitles** | EffectsProvider Context | Loaded at app start from `/public/subtitles/` | Same as Effects |

**Примеры загрузки:**

```typescript
// 1. Media Files (через Tauri)
const { files, loading } = useMedia()

// Внутри useMedia():
export function useMedia() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFiles() {
      const result = await invoke<MediaFile[]>('get_media_files')
      setFiles(result)
      setLoading(false)
    }
    loadFiles()
  }, [])

  return { files, loading }
}

// 2. Effects (через Context Provider)
const { effects, loading } = useEffects('built-in')

// Внутри useEffects():
export function useEffects(source?: ResourceSource) {
  const { effects, loadingState } = useEffectsContext()

  const filtered = useMemo(() => {
    if (!source) return effects
    return effects.filter((effect) => effect.source === source)
  }, [effects, source])

  return {
    effects: filtered,
    loading: loadingState.isLoading,
  }
}

// EffectsProvider загружает данные при монтировании:
export function EffectsProvider({ children }: { children: ReactNode }) {
  const [effects, setEffects] = useState<VideoEffect[]>([])
  const [loadingState, setLoadingState] = useState({ isLoading: true })

  useEffect(() => {
    async function loadEffects() {
      // Загружаем из public/ или через Tauri
      const builtIn = await fetch('/effects/index.json').then((r) => r.json())
      const local = await invoke<VideoEffect[]>('get_local_effects')

      setEffects([...builtIn, ...local])
      setLoadingState({ isLoading: false })
    }
    loadEffects()
  }, [])

  return (
    <EffectsContext.Provider value={{ effects, loadingState }}>
      {children}
    </EffectsContext.Provider>
  )
}
```

---

## 9. Refactoring Recommendations

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
- [x] Templates - оставляем свою вёрстку (не унифицируем)

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
