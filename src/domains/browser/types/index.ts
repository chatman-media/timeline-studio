/**
 * Browser Domain Types
 *
 * Центральное место для всех типов Browser домена
 */

// Browser tab types (moved from src/shared/types/browser.ts)
/**
 * Допустимые значения для активного таба в браузере
 * Определяют, какой тип контента отображается в браузере
 */
export const BROWSER_TABS = [
  "media", // Медиа-файлы (видео, изображения)
  "music", // Музыкальные файлы
  "subtitles", // Субтитры
  "transitions", // Переходы между сценами
  "effects", // Эффекты для видео
  "filters", // Фильтры для видео
  "templates", // Шаблоны проектов
  "style-templates", // Стилевые шаблоны
] as const

export const DEFAULT_TAB = "media" // Таб по умолчанию

/**
 * Тип таба браузера
 */
export type BrowserTab = (typeof BROWSER_TABS)[number]

// Browser context types (moved from src/shared/types/browser-context.ts)
export type ViewMode = "list" | "grid" | "thumbnails"

/**
 * Контекст браузера - используется в browser-state-machine и user-settings-machine
 */
export interface BrowserContext {
  // Общие настройки
  activeTab: BrowserTab

  // Выбранные файлы для каждой вкладки
  selectedFiles: Record<BrowserTab, Set<string>>

  // Настройки для каждой вкладки
  tabSettings: Record<
    BrowserTab,
    {
      searchQuery: string
      showFavoritesOnly: boolean
      sortBy: string
      sortOrder: "asc" | "desc"
      groupBy: string
      filterType: string
      viewMode: ViewMode
      previewSizeIndex: number
    }
  >
}

// Browser machine types
export interface BrowserMachineContext extends BrowserContext {
  // Additional domain-specific context if needed
}

export type BrowserMachineEvent =
  | { type: "SWITCH_TAB"; tab: BrowserTab }
  | { type: "SET_SEARCH_QUERY"; query: string; tab?: BrowserTab }
  | { type: "TOGGLE_FAVORITES"; tab?: BrowserTab }
  | {
      type: "SET_SORT"
      sortBy: string
      sortOrder: "asc" | "desc"
      tab?: BrowserTab
    }
  | { type: "SET_GROUP_BY"; groupBy: string; tab?: BrowserTab }
  | { type: "SET_FILTER"; filterType: string; tab?: BrowserTab }
  | { type: "SET_VIEW_MODE"; viewMode: ViewMode; tab?: BrowserTab }
  | { type: "SET_PREVIEW_SIZE"; sizeIndex: number; tab?: BrowserTab }
  | { type: "RESET_TAB_SETTINGS"; tab: BrowserTab }
  | { type: "LOAD_SETTINGS"; settings: Partial<BrowserContext> }
  | { type: "SAVE_SETTINGS" }
  | { type: "SELECT_FILE"; fileId: string; tab?: BrowserTab }
  | { type: "DESELECT_FILE"; fileId: string; tab?: BrowserTab }
  | { type: "TOGGLE_FILE_SELECTION"; fileId: string; tab?: BrowserTab }
  | { type: "SELECT_ALL_FILES"; fileIds: string[]; tab?: BrowserTab }
  | { type: "DESELECT_ALL_FILES"; tab?: BrowserTab }

// Tab settings
export interface TabSettings {
  searchQuery: string
  showFavoritesOnly: boolean
  sortBy: string
  sortOrder: "asc" | "desc"
  groupBy: string
  filterType: string
  viewMode: ViewMode
  previewSizeIndex: number
}

// Browser service types
export interface BrowserService {
  switchTab(tab: BrowserTab): void
  setSearchQuery(query: string, tab?: BrowserTab): void
  toggleFavorites(tab?: BrowserTab): void
  setSortOptions(sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab): void
  setGroupBy(groupBy: string, tab?: BrowserTab): void
  setFilter(filterType: string, tab?: BrowserTab): void
  setViewMode(viewMode: ViewMode, tab?: BrowserTab): void
  setPreviewSize(sizeIndex: number, tab?: BrowserTab): void
  resetTabSettings(tab: BrowserTab): void
  selectFile(fileId: string, tab?: BrowserTab): void
  deselectFile(fileId: string, tab?: BrowserTab): void
  toggleFileSelection(fileId: string, tab?: BrowserTab): void
  selectAllFiles(fileIds: string[], tab?: BrowserTab): void
  deselectAllFiles(tab?: BrowserTab): void
}

// Browser storage types
export interface BrowserStorageService {
  loadSettings(): BrowserContext | null
  saveSettings(context: BrowserContext): void
}
