/**
 * Browser Provider
 *
 * Провайдер Browser домена с использованием BackendSync
 * Все состояние хранится на бэкенде и синхронизируется
 */

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { DEFAULT_PREVIEW_SIZE_INDEX, PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import { createLogger } from "@/lib/tauri-logger"
import type {
  BrowserState,
  BrowserTab,
  ProjectCommand,
  ProjectEvent,
  TabSettings,
  ViewMode,
} from "@/types/generated/tauri-bindings"

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
  const backendSync = getBackendSync()
  const [browserState, setBrowserState] = useState<BrowserState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize and subscribe to backend
  useEffect(() => {
    const handleBrowserEvent = (event: ProjectEvent) => {
      logger.info("BrowserProvider: Received browser event", { eventType: event.type })

      // List of browser-related events that trigger state refresh
      const browserEventTypes = [
        "BrowserTabSwitched",
        "BrowserSearchQueryChanged",
        "BrowserFavoritesToggled",
        "BrowserSortChanged",
        "BrowserGroupByChanged",
        "BrowserFilterChanged",
        "BrowserViewModeChanged",
        "BrowserPreviewSizeChanged",
        "BrowserTabSettingsReset",
        "BrowserFileSelected",
        "BrowserFileDeselected",
        "BrowserFileSelectionToggled",
        "BrowserAllFilesSelected",
        "BrowserAllFilesDeselected",
      ]

      if (browserEventTypes.includes(event.type as any)) {
        logger.info("BrowserProvider: Refreshing browser state after event", { eventType: event.type })
        refreshBrowserState()
      }
    }

    // Subscribe to backend events
    const unsubscribeEvents = backendSync.onEvent(handleBrowserEvent)

    // Subscribe to state changes
    const unsubscribeState = backendSync.onStateChange((state) => {
      logger.info("BrowserProvider: Received state change", {
        hasBrowserState: !!state?.browser_state,
        activeTab: state?.browser_state?.active_tab,
      })
      if (state?.browser_state) {
        setBrowserState(state.browser_state)
      }
    })

    // Initial state load
    refreshBrowserState()

    return () => {
      unsubscribeEvents()
      unsubscribeState()
    }
  }, [backendSync])

  const refreshBrowserState = async () => {
    try {
      setIsLoading(true)
      const state = await backendSync.getProjectState()
      if (state?.browser_state) {
        setBrowserState(state.browser_state)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh browser state")
      logger.error("Failed to refresh browser state:", { error: err })
    } finally {
      setIsLoading(false)
    }
  }

  const executeBrowserCommand = async (command: ProjectCommand): Promise<void> => {
    try {
      const result = await backendSync.executeCommand(command)
      if (!result.success) {
        throw new Error(result.error || `Failed to execute ${command.type}`)
      }
      // Manually refresh state after command execution
      await refreshBrowserState()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to execute ${command.type}`
      setError(errorMsg)
      logger.error("Browser command failed:", { command, error: err })
      throw err
    }
  }

  // Convenient getters
  const activeTab: BrowserTab = browserState?.active_tab || "media"

  const currentTabSettings: TabSettings = useMemo(() => {
    if (!browserState?.tab_settings) return DEFAULT_TAB_SETTINGS
    return browserState.tab_settings[activeTab] || DEFAULT_TAB_SETTINGS
  }, [browserState, activeTab])

  const selectedFiles: Set<string> = useMemo(() => {
    if (!browserState?.selected_files) return new Set()
    const files = browserState.selected_files[activeTab] || []
    return new Set(files)
  }, [browserState, activeTab])

  const previewSize: number = useMemo(() => {
    const sizeIndex = currentTabSettings.preview_size_index
    return PREVIEW_SIZES[sizeIndex] || PREVIEW_SIZES[DEFAULT_PREVIEW_SIZE_INDEX]
  }, [currentTabSettings])

  // Browser actions implementation
  const switchTab = async (tab: BrowserTab): Promise<void> => {
    logger.info("BrowserProvider: Switching tab", { from: activeTab, to: tab })

    // Optimistic update - update local state immediately
    if (browserState) {
      setBrowserState({
        ...browserState,
        active_tab: tab,
      })
    }

    // Use direct Tauri command instead of executeCommand for better debugging
    const { commands } = await import("@/types/generated/tauri-bindings")
    const result = await commands.browserSwitchTab(tab)

    if (result.status === "error") {
      logger.error("BrowserProvider: Tab switch failed", { error: result.error })
      // Revert optimistic update on error
      await refreshBrowserState()
      throw new Error(result.error)
    }

    logger.info("BrowserProvider: Tab switch command sent successfully")
  }

  const setSearchQuery = async (query: string, tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetSearchQuery" as any,
      params: { query, tab: tab || null },
    })
  }

  const toggleFavorites = async (tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserToggleFavorites" as any,
      params: { tab: tab || null },
    })
  }

  const setSort = async (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetSort" as any,
      params: { sort_by: sortBy, sort_order: sortOrder, tab: tab || null },
    })
  }

  const setGroupBy = async (groupBy: string, tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetGroupBy" as any,
      params: { group_by: groupBy, tab: tab || null },
    })
  }

  const setFilter = async (filterType: string, tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetFilter" as any,
      params: { filter_type: filterType, tab: tab || null },
    })
  }

  const setViewMode = async (viewMode: ViewMode, tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetViewMode" as any,
      params: { view_mode: viewMode, tab: tab || null },
    })
  }

  const setPreviewSize = async (sizeIndex: number, tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetPreviewSize" as any,
      params: { size_index: sizeIndex, tab: tab || null },
    })
  }

  const resetTabSettings = async (tab: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserResetTabSettings" as any,
      params: { tab },
    })
  }

  const selectFile = async (fileId: string, tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSelectFile" as any,
      params: { file_id: fileId, tab: tab || null },
    })
  }

  const deselectFile = async (fileId: string, tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserDeselectFile" as any,
      params: { file_id: fileId, tab: tab || null },
    })
  }

  const toggleFileSelection = async (fileId: string, tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserToggleFileSelection" as any,
      params: { file_id: fileId, tab: tab || null },
    })
  }

  const selectAllFiles = async (fileIds: string[], tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSelectAllFiles" as any,
      params: { file_ids: fileIds, tab: tab || null },
    })
  }

  const deselectAllFiles = async (tab?: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserDeselectAllFiles" as any,
      params: { tab: tab || null },
    })
  }

  const isFileSelected = (fileId: string, tab?: BrowserTab): boolean => {
    const targetTab = tab || activeTab
    if (!browserState?.selected_files) return false
    const files = browserState.selected_files[targetTab] || []
    return files.includes(fileId)
  }

  const clearBrowserState = () => {
    logger.info("Clearing browser state (no-op for backend-synced state)")
    // Backend-synced state doesn't use localStorage, so nothing to clear
    // This is here for compatibility with old API
  }

  const contextValue: BrowserContextType = {
    // Raw state
    browserState,
    isLoading,
    error,

    // Convenient getters
    activeTab,
    currentTabSettings,
    selectedFiles,
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
  }

  return <BrowserContext.Provider value={contextValue}>{children}</BrowserContext.Provider>
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
