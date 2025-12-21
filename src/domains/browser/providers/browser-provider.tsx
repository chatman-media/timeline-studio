/**
 * Browser Provider
 *
 * Провайдер Browser домена с использованием BrowserOrchestrator
 * Использует event-driven архитектуру для инкрементальных обновлений
 */

import { useSelector } from "@xstate/react"
import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react"
import { DEFAULT_PREVIEW_SIZE_INDEX, PREVIEW_SIZES } from "@/domains/media-management"
import { createLogger } from "@/lib/tauri-logger"
import type { BrowserState, BrowserTab, TabSettings, ViewMode } from "@/types/generated/tauri-bindings"
import { getBrowserOrchestrator } from "../services/browser-orchestrator"

const logger = createLogger("BrowserProvider")

interface BrowserContextType {
  // Raw backend state
  browserState: BrowserState | null
  isLoading: boolean
  error: string | null

  // Convenient getters (similar to old BrowserStateProvider)
  activeTab: BrowserTab
  currentTabSettings: TabSettings
  selectedFiles: Set<string>
  previewSize: number

  // Browser actions (async due to backend communication)
  switchTab: (tab: BrowserTab) => Promise<void>
  setSearchQuery: (query: string, tab?: BrowserTab) => Promise<void>
  toggleFavorites: (tab?: BrowserTab) => Promise<void>
  setSort: (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab) => Promise<void>
  setGroupBy: (groupBy: string, tab?: BrowserTab) => Promise<void>
  setFilter: (filterType: string, tab?: BrowserTab) => Promise<void>
  setViewMode: (viewMode: ViewMode, tab?: BrowserTab) => Promise<void>
  setPreviewSize: (sizeIndex: number, tab?: BrowserTab) => Promise<void>
  resetTabSettings: (tab: BrowserTab) => Promise<void>

  // File selection actions
  selectFile: (fileId: string, tab?: BrowserTab) => Promise<void>
  deselectFile: (fileId: string, tab?: BrowserTab) => Promise<void>
  toggleFileSelection: (fileId: string, tab?: BrowserTab) => Promise<void>
  selectAllFiles: (fileIds: string[], tab?: BrowserTab) => Promise<void>
  deselectAllFiles: (tab?: BrowserTab) => Promise<void>
  isFileSelected: (fileId: string, tab?: BrowserTab) => boolean

  // Backwards compatibility for components that use these methods
  clearBrowserState: () => void
}

const BrowserContext = createContext<BrowserContextType | null>(null)

interface BrowserProviderProps {
  children: ReactNode
}

const DEFAULT_TAB_SETTINGS: TabSettings = {
  search_query: "",
  show_favorites_only: false,
  sort_by: "name",
  sort_order: "asc",
  group_by: "none",
  filter_type: "all",
  view_mode: "thumbnails",
  preview_size_index: DEFAULT_PREVIEW_SIZE_INDEX,
}

export function BrowserProvider({ children }: BrowserProviderProps) {
  // Используем orchestrator вместо создания собственного actor
  const orchestrator = useMemo(() => getBrowserOrchestrator(), [])
  const browserActor = orchestrator.getBrowserActor()

  // Получаем состояние из машины через useSelector
  const activeTab = useSelector(browserActor, (state) => state.context.activeTab)
  const tabSettings = useSelector(browserActor, (state) => state.context.tabSettings)
  const selectedFiles = useSelector(browserActor, (state) => state.context.selectedFiles)
  const favorites = useSelector(browserActor, (state) => state.context.favorites)
  const isLoading = useSelector(browserActor, (state) => state.context.isLoading)
  const error = useSelector(browserActor, (state) => state.context.error)

  // Convenient getters из машины
  const currentTabSettings: TabSettings = useMemo(() => {
    return tabSettings[activeTab] || DEFAULT_TAB_SETTINGS
  }, [tabSettings, activeTab])

  const selectedFilesSet: Set<string> = useMemo(() => {
    const files = selectedFiles[activeTab] || []
    return new Set(files)
  }, [selectedFiles, activeTab])

  const previewSize: number = useMemo(() => {
    const sizeIndex = currentTabSettings.preview_size_index
    return PREVIEW_SIZES[sizeIndex] || PREVIEW_SIZES[DEFAULT_PREVIEW_SIZE_INDEX]
  }, [currentTabSettings])

  // Для совместимости с API (некоторые компоненты ожидают browserState)
  const browserState: BrowserState | null = useMemo(
    () => ({
      active_tab: activeTab,
      tab_settings: tabSettings,
      selected_files: selectedFiles,
      favorites: favorites,
    }),
    [activeTab, tabSettings, selectedFiles, favorites],
  )

  // Browser actions - делегируем в orchestrator
  const switchTab = useCallback(
    async (tab: BrowserTab): Promise<void> => {
      logger.info("[BrowserProvider] Switching tab via orchestrator", { tab })
      return orchestrator.switchTab(tab)
    },
    [orchestrator],
  )

  const setSearchQuery = useCallback(
    async (query: string, tab?: BrowserTab): Promise<void> => {
      return orchestrator.setSearchQuery(query, tab)
    },
    [orchestrator],
  )

  const toggleFavorites = useCallback(
    async (tab?: BrowserTab): Promise<void> => {
      return orchestrator.toggleFavorites(tab)
    },
    [orchestrator],
  )

  const setSort = useCallback(
    async (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab): Promise<void> => {
      return orchestrator.setSort(sortBy, sortOrder, tab)
    },
    [orchestrator],
  )

  const setGroupBy = useCallback(
    async (groupBy: string, tab?: BrowserTab): Promise<void> => {
      return orchestrator.setGroupBy(groupBy, tab)
    },
    [orchestrator],
  )

  const setFilter = useCallback(
    async (filterType: string, tab?: BrowserTab): Promise<void> => {
      return orchestrator.setFilter(filterType, tab)
    },
    [orchestrator],
  )

  const setViewMode = useCallback(
    async (viewMode: ViewMode, tab?: BrowserTab): Promise<void> => {
      return orchestrator.setViewMode(viewMode, tab)
    },
    [orchestrator],
  )

  const setPreviewSize = useCallback(
    async (sizeIndex: number, tab?: BrowserTab): Promise<void> => {
      return orchestrator.setPreviewSize(sizeIndex, tab)
    },
    [orchestrator],
  )

  const resetTabSettings = useCallback(
    async (tab: BrowserTab): Promise<void> => {
      return orchestrator.resetTabSettings(tab)
    },
    [orchestrator],
  )

  const selectFile = useCallback(
    async (fileId: string, tab?: BrowserTab): Promise<void> => {
      return orchestrator.selectFile(fileId, tab)
    },
    [orchestrator],
  )

  const deselectFile = useCallback(
    async (fileId: string, tab?: BrowserTab): Promise<void> => {
      return orchestrator.deselectFile(fileId, tab)
    },
    [orchestrator],
  )

  const toggleFileSelection = useCallback(
    async (fileId: string, tab?: BrowserTab): Promise<void> => {
      return orchestrator.toggleFileSelection(fileId, tab)
    },
    [orchestrator],
  )

  const selectAllFiles = useCallback(
    async (fileIds: string[], tab?: BrowserTab): Promise<void> => {
      return orchestrator.selectAllFiles(fileIds, tab)
    },
    [orchestrator],
  )

  const deselectAllFiles = useCallback(
    async (tab?: BrowserTab): Promise<void> => {
      return orchestrator.deselectAllFiles(tab)
    },
    [orchestrator],
  )

  const isFileSelected = useCallback(
    (fileId: string, tab?: BrowserTab): boolean => {
      return orchestrator.isFileSelected(fileId, tab)
    },
    [orchestrator],
  )

  const clearBrowserState = useCallback(() => {
    logger.info("Clearing browser state (no-op for backend-synced state)")
    // Backend-synced state doesn't use localStorage, so nothing to clear
    // This is here for compatibility with old API
  }, [])

  const contextValue: BrowserContextType = useMemo(
    () => ({
      // Raw state
      browserState,
      isLoading,
      error,

      // Convenient getters
      activeTab,
      currentTabSettings,
      selectedFiles: selectedFilesSet,
      previewSize,

      // Actions
      switchTab,
      setSearchQuery,
      toggleFavorites,
      setSort,
      setGroupBy,
      setFilter,
      setViewMode,
      setPreviewSize,
      resetTabSettings,
      selectFile,
      deselectFile,
      toggleFileSelection,
      selectAllFiles,
      deselectAllFiles,
      isFileSelected,

      // Backwards compatibility
      clearBrowserState,
    }),
    [
      browserState,
      isLoading,
      error,
      activeTab,
      currentTabSettings,
      selectedFilesSet,
      previewSize,
      switchTab,
      setSearchQuery,
      toggleFavorites,
      setSort,
      setGroupBy,
      setFilter,
      setViewMode,
      setPreviewSize,
      resetTabSettings,
      selectFile,
      deselectFile,
      toggleFileSelection,
      selectAllFiles,
      deselectAllFiles,
      isFileSelected,
      clearBrowserState,
    ],
  )

  return (
    <BrowserContext.Provider value={contextValue} data-oid="y_r1z6-">
      {children}
    </BrowserContext.Provider>
  )
}

/**
 * Hook to access browser context
 * Compatible with both old API (useBrowserState) and new API
 */
export function useBrowser(): BrowserContextType {
  const context = useContext(BrowserContext)
  if (!context) {
    throw new Error("useBrowser must be used within BrowserProvider")
  }
  return context
}

// Export alias for easier migration
export const useBrowserState = useBrowser

// ===== Granular Selector Hooks for Performance Optimization =====

/**
 * Hook to get only the active tab
 * Use this instead of useBrowserState() when you only need activeTab
 */
export function useBrowserActiveTab(): BrowserTab {
  const orchestrator = getBrowserOrchestrator()
  const browserActor = orchestrator.getBrowserActor()
  return useSelector(browserActor, (state) => state.context.activeTab)
}

/**
 * Hook to get only the current tab settings
 * Use this instead of useBrowserState() when you only need settings
 */
export function useBrowserTabSettings(): TabSettings {
  const orchestrator = getBrowserOrchestrator()
  const browserActor = orchestrator.getBrowserActor()
  const activeTab = useSelector(browserActor, (state) => state.context.activeTab)
  const tabSettings = useSelector(browserActor, (state) => state.context.tabSettings)

  return useMemo(() => {
    return tabSettings[activeTab] || DEFAULT_TAB_SETTINGS
  }, [tabSettings, activeTab])
}

/**
 * Hook to get only the view mode
 * Use this instead of useBrowserState() when you only need viewMode
 */
export function useBrowserViewMode(): ViewMode {
  const orchestrator = getBrowserOrchestrator()
  const browserActor = orchestrator.getBrowserActor()
  const activeTab = useSelector(browserActor, (state) => state.context.activeTab)
  const tabSettings = useSelector(browserActor, (state) => state.context.tabSettings)

  return useMemo(() => {
    return tabSettings[activeTab]?.view_mode || "thumbnails"
  }, [tabSettings, activeTab])
}

/**
 * Hook to get only the preview size
 * Use this instead of useBrowserState() when you only need previewSize
 */
export function useBrowserPreviewSize(): number {
  const orchestrator = getBrowserOrchestrator()
  const browserActor = orchestrator.getBrowserActor()
  const activeTab = useSelector(browserActor, (state) => state.context.activeTab)
  const tabSettings = useSelector(browserActor, (state) => state.context.tabSettings)

  return useMemo(() => {
    const sizeIndex = tabSettings[activeTab]?.preview_size_index || DEFAULT_PREVIEW_SIZE_INDEX
    return PREVIEW_SIZES[sizeIndex] || PREVIEW_SIZES[DEFAULT_PREVIEW_SIZE_INDEX]
  }, [tabSettings, activeTab])
}

/**
 * Hook to get only the search query
 * Use this instead of useBrowserState() when you only need searchQuery
 */
export function useBrowserSearchQuery(): string {
  const orchestrator = getBrowserOrchestrator()
  const browserActor = orchestrator.getBrowserActor()
  const activeTab = useSelector(browserActor, (state) => state.context.activeTab)
  const tabSettings = useSelector(browserActor, (state) => state.context.tabSettings)

  return useMemo(() => {
    return tabSettings[activeTab]?.search_query || ""
  }, [tabSettings, activeTab])
}

/**
 * Hook to get only the selected files for current tab
 * Use this instead of useBrowserState() when you only need selectedFiles
 */
export function useBrowserSelectedFiles(): Set<string> {
  const orchestrator = getBrowserOrchestrator()
  const browserActor = orchestrator.getBrowserActor()
  const activeTab = useSelector(browserActor, (state) => state.context.activeTab)
  const selectedFiles = useSelector(browserActor, (state) => state.context.selectedFiles)

  return useMemo(() => {
    const files = selectedFiles[activeTab] || []
    return new Set(files)
  }, [selectedFiles, activeTab])
}
