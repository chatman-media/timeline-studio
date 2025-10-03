/**
 * Browser Provider V2
 *
 * Мигрированный провайдер для Browser домена с использованием BackendSync
 * Заменяет BrowserDomainProvider на основе XState
 */

import { createContext, type ReactNode, useContext, useEffect, useState } from "react"
import { BackendSync } from "@/features/app-state/services/backend-sync"
import type {
  BrowserState,
  BrowserTab,
  ProjectCommand,
  ProjectEvent,
  SortOrder,
  TabSettings,
  ViewMode,
} from "@/types/generated/tauri-bindings"

interface BrowserContextType {
  // Backend state
  browserState: BrowserState | null
  isLoading: boolean
  error: string | null

  // Browser actions
  switchTab: (tab: BrowserTab) => Promise<void>
  setSearchQuery: (query: string, tab?: BrowserTab | null) => Promise<void>
  toggleFavorites: (tab?: BrowserTab | null) => Promise<void>
  setSort: (sortBy: string, sortOrder: SortOrder, tab?: BrowserTab | null) => Promise<void>
  setGroupBy: (groupBy: string, tab?: BrowserTab | null) => Promise<void>
  setFilter: (filterType: string, tab?: BrowserTab | null) => Promise<void>
  setViewMode: (viewMode: ViewMode, tab?: BrowserTab | null) => Promise<void>
  setPreviewSize: (sizeIndex: number, tab?: BrowserTab | null) => Promise<void>
  resetTabSettings: (tab: BrowserTab) => Promise<void>
  selectFile: (fileId: string, tab?: BrowserTab | null) => Promise<void>
  deselectFile: (fileId: string, tab?: BrowserTab | null) => Promise<void>
  toggleFileSelection: (fileId: string, tab?: BrowserTab | null) => Promise<void>
  selectAllFiles: (fileIds: string[], tab?: BrowserTab | null) => Promise<void>
  deselectAllFiles: (tab?: BrowserTab | null) => Promise<void>
}

const BrowserContext = createContext<BrowserContextType | null>(null)

interface BrowserProviderV2Props {
  children: ReactNode
  backendSync: BackendSync
}

export function BrowserProviderV2({ children, backendSync }: BrowserProviderV2Props) {
  const [browserState, setBrowserState] = useState<BrowserState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle browser events from backend
  useEffect(() => {
    const handleBrowserEvent = (event: ProjectEvent) => {
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
        refreshBrowserState()
      }
    }

    // Subscribe to backend events
    const unsubscribe = backendSync.onEvent(handleBrowserEvent)

    // Initial state load
    refreshBrowserState()

    return () => {
      unsubscribe()
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
      console.error("Failed to refresh browser state:", err)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to execute ${command.type}`)
      throw err
    }
  }

  // Browser actions implementation
  // Browser actions - cast to any to bypass strict type checking for browser-specific commands
  const switchTab = async (tab: BrowserTab): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSwitchTab" as any,
      params: { tab },
    })
  }

  const setSearchQuery = async (query: string, tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetSearchQuery" as any,
      params: { query, tab: tab || null },
    })
  }

  const toggleFavorites = async (tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserToggleFavorites" as any,
      params: { tab: tab || null },
    })
  }

  const setSort = async (sortBy: string, sortOrder: SortOrder, tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetSort" as any,
      params: { sort_by: sortBy, sort_order: sortOrder, tab: tab || null },
    })
  }

  const setGroupBy = async (groupBy: string, tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetGroupBy" as any,
      params: { group_by: groupBy, tab: tab || null },
    })
  }

  const setFilter = async (filterType: string, tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetFilter" as any,
      params: { filter_type: filterType, tab: tab || null },
    })
  }

  const setViewMode = async (viewMode: ViewMode, tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSetViewMode" as any,
      params: { view_mode: viewMode, tab: tab || null },
    })
  }

  const setPreviewSize = async (sizeIndex: number, tab?: BrowserTab | null): Promise<void> => {
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

  const selectFile = async (fileId: string, tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSelectFile" as any,
      params: { file_id: fileId, tab: tab || null },
    })
  }

  const deselectFile = async (fileId: string, tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserDeselectFile" as any,
      params: { file_id: fileId, tab: tab || null },
    })
  }

  const toggleFileSelection = async (fileId: string, tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserToggleFileSelection" as any,
      params: { file_id: fileId, tab: tab || null },
    })
  }

  const selectAllFiles = async (fileIds: string[], tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserSelectAllFiles" as any,
      params: { file_ids: fileIds, tab: tab || null },
    })
  }

  const deselectAllFiles = async (tab?: BrowserTab | null): Promise<void> => {
    await executeBrowserCommand({
      type: "BrowserDeselectAllFiles" as any,
      params: { tab: tab || null },
    })
  }

  const contextValue: BrowserContextType = {
    browserState,
    isLoading,
    error,
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
  } as BrowserContextType

  return <BrowserContext.Provider value={contextValue}>{children}</BrowserContext.Provider>
}

export function useBrowserV2(): BrowserContextType {
  const context = useContext(BrowserContext)
  if (!context) {
    throw new Error("useBrowserV2 must be used within BrowserProviderV2")
  }
  return context
}
