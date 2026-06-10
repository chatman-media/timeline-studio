import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react"
import type { BrowserState, BrowserTab, TabSettings, ViewMode } from "@timeline-studio/core/types"

export type BrowserContext = BrowserState

export interface BrowserContextType {
  browserState: BrowserState | null
  isLoading: boolean
  error: string | null
  activeTab: BrowserTab
  currentTabSettings: TabSettings
  selectedFiles: Set<string>
  previewSize: number
  switchTab: (tab: BrowserTab) => Promise<void>
  setSearchQuery: (query: string, tab?: BrowserTab) => Promise<void>
  toggleFavorites: (tab?: BrowserTab) => Promise<void>
  setSort: (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab) => Promise<void>
  setGroupBy: (groupBy: string, tab?: BrowserTab) => Promise<void>
  setFilter: (filterType: string, tab?: BrowserTab) => Promise<void>
  setViewMode: (viewMode: ViewMode, tab?: BrowserTab) => Promise<void>
  setPreviewSize: (sizeIndex: number, tab?: BrowserTab) => Promise<void>
  resetTabSettings: (tab: BrowserTab) => Promise<void>
  selectFile: (fileId: string, tab?: BrowserTab) => Promise<void>
  deselectFile: (fileId: string, tab?: BrowserTab) => Promise<void>
  toggleFileSelection: (fileId: string, tab?: BrowserTab) => Promise<void>
  selectAllFiles: (fileIds: string[], tab?: BrowserTab) => Promise<void>
  deselectAllFiles: (tab?: BrowserTab) => Promise<void>
  isFileSelected: (fileId: string, tab?: BrowserTab) => boolean
  clearBrowserState: () => void
}

export interface UseOptimisticSelectionReturn {
  selectedFiles: Set<string>
  isSelected: (fileId: string) => boolean
  selectFile: (fileId: string) => Promise<void>
  deselectFile: (fileId: string) => Promise<void>
  toggleSelection: (fileId: string) => Promise<void>
  selectAll: (fileIds: string[]) => Promise<void>
  deselectAll: () => Promise<void>
  isPending: boolean
}

export const DEFAULT_TAB: BrowserTab = "media"
export const BROWSER_TABS: readonly BrowserTab[] = [
  "media",
  "effects",
  "filters",
  "transitions",
  "templates",
  "style_templates",
]

const PREVIEW_SIZES = [125, 150, 200, 250, 300, 400, 500] as const
const DEFAULT_PREVIEW_SIZE_INDEX = 3

const DEFAULT_TAB_SETTINGS: TabSettings = {
  filter_type: "all",
  group_by: "none",
  preview_size_index: DEFAULT_PREVIEW_SIZE_INDEX,
  search_query: "",
  show_favorites_only: false,
  sort_by: "name",
  sort_order: "asc",
  view_mode: "thumbnails",
}

function createInitialTabSettings(): BrowserState["tab_settings"] {
  return { [DEFAULT_TAB]: DEFAULT_TAB_SETTINGS }
}

function updateTabSettings(
  settings: BrowserState["tab_settings"],
  tab: BrowserTab,
  updater: (settings: TabSettings) => TabSettings,
): BrowserState["tab_settings"] {
  return {
    ...settings,
    [tab]: updater(settings[tab] ?? DEFAULT_TAB_SETTINGS),
  }
}

function updateFilesByTab(
  filesByTab: BrowserState["selected_files"],
  tab: BrowserTab,
  updater: (files: Set<string>) => Set<string>,
): BrowserState["selected_files"] {
  return {
    ...filesByTab,
    [tab]: Array.from(updater(new Set(filesByTab[tab] ?? []))),
  }
}

function useLocalBrowserContext(): BrowserContextType {
  const [activeTab, setActiveTab] = useState<BrowserTab>(DEFAULT_TAB)
  const [tabSettings, setTabSettings] = useState<BrowserState["tab_settings"]>(() => createInitialTabSettings())
  const [selectedFilesByTab, setSelectedFilesByTab] = useState<BrowserState["selected_files"]>({})
  const [favoritesByTab, setFavoritesByTab] = useState<BrowserState["favorites"]>({})

  const resolveTab = useCallback((tab?: BrowserTab) => tab ?? activeTab, [activeTab])

  const currentTabSettings = useMemo(() => tabSettings[activeTab] ?? DEFAULT_TAB_SETTINGS, [activeTab, tabSettings])

  const selectedFiles = useMemo(() => new Set(selectedFilesByTab[activeTab] ?? []), [activeTab, selectedFilesByTab])

  const previewSize = useMemo(() => {
    const sizeIndex = currentTabSettings.preview_size_index
    return PREVIEW_SIZES[sizeIndex] ?? PREVIEW_SIZES[DEFAULT_PREVIEW_SIZE_INDEX]
  }, [currentTabSettings.preview_size_index])

  const browserState = useMemo<BrowserState>(
    () => ({
      active_tab: activeTab,
      favorites: favoritesByTab,
      selected_files: selectedFilesByTab,
      tab_settings: tabSettings,
    }),
    [activeTab, favoritesByTab, selectedFilesByTab, tabSettings],
  )

  const switchTab = useCallback(async (tab: BrowserTab) => {
    setActiveTab(tab)
    setTabSettings((settings) => (settings[tab] ? settings : { ...settings, [tab]: DEFAULT_TAB_SETTINGS }))
  }, [])

  const setSearchQuery = useCallback(
    async (query: string, tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setTabSettings((settings) =>
        updateTabSettings(settings, targetTab, (current) => ({ ...current, search_query: query })),
      )
    },
    [resolveTab],
  )

  const toggleFavorites = useCallback(
    async (tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setTabSettings((settings) =>
        updateTabSettings(settings, targetTab, (current) => ({
          ...current,
          show_favorites_only: !current.show_favorites_only,
        })),
      )
    },
    [resolveTab],
  )

  const setSort = useCallback(
    async (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setTabSettings((settings) =>
        updateTabSettings(settings, targetTab, (current) => ({
          ...current,
          sort_by: sortBy,
          sort_order: sortOrder,
        })),
      )
    },
    [resolveTab],
  )

  const setGroupBy = useCallback(
    async (groupBy: string, tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setTabSettings((settings) =>
        updateTabSettings(settings, targetTab, (current) => ({ ...current, group_by: groupBy })),
      )
    },
    [resolveTab],
  )

  const setFilter = useCallback(
    async (filterType: string, tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setTabSettings((settings) =>
        updateTabSettings(settings, targetTab, (current) => ({ ...current, filter_type: filterType })),
      )
    },
    [resolveTab],
  )

  const setViewMode = useCallback(
    async (viewMode: ViewMode, tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setTabSettings((settings) =>
        updateTabSettings(settings, targetTab, (current) => ({ ...current, view_mode: viewMode })),
      )
    },
    [resolveTab],
  )

  const setPreviewSize = useCallback(
    async (sizeIndex: number, tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setTabSettings((settings) =>
        updateTabSettings(settings, targetTab, (current) => ({ ...current, preview_size_index: sizeIndex })),
      )
    },
    [resolveTab],
  )

  const resetTabSettings = useCallback(async (tab: BrowserTab) => {
    setTabSettings((settings) => ({ ...settings, [tab]: DEFAULT_TAB_SETTINGS }))
  }, [])

  const selectFile = useCallback(
    async (fileId: string, tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setSelectedFilesByTab((filesByTab) =>
        updateFilesByTab(filesByTab, targetTab, (files) => new Set(files).add(fileId)),
      )
    },
    [resolveTab],
  )

  const deselectFile = useCallback(
    async (fileId: string, tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setSelectedFilesByTab((filesByTab) =>
        updateFilesByTab(filesByTab, targetTab, (files) => {
          files.delete(fileId)
          return files
        }),
      )
    },
    [resolveTab],
  )

  const toggleFileSelection = useCallback(
    async (fileId: string, tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setSelectedFilesByTab((filesByTab) =>
        updateFilesByTab(filesByTab, targetTab, (files) => {
          if (files.has(fileId)) {
            files.delete(fileId)
          } else {
            files.add(fileId)
          }
          return files
        }),
      )
    },
    [resolveTab],
  )

  const selectAllFiles = useCallback(
    async (fileIds: string[], tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setSelectedFilesByTab((filesByTab) => ({
        ...filesByTab,
        [targetTab]: fileIds,
      }))
    },
    [resolveTab],
  )

  const deselectAllFiles = useCallback(
    async (tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      setSelectedFilesByTab((filesByTab) => ({
        ...filesByTab,
        [targetTab]: [],
      }))
    },
    [resolveTab],
  )

  const isFileSelected = useCallback(
    (fileId: string, tab?: BrowserTab) => {
      const targetTab = resolveTab(tab)
      return (selectedFilesByTab[targetTab] ?? []).includes(fileId)
    },
    [resolveTab, selectedFilesByTab],
  )

  const clearBrowserState = useCallback(() => {
    setActiveTab(DEFAULT_TAB)
    setTabSettings(createInitialTabSettings())
    setSelectedFilesByTab({})
    setFavoritesByTab({})
  }, [])

  return useMemo(
    () => ({
      activeTab,
      browserState,
      clearBrowserState,
      currentTabSettings,
      deselectAllFiles,
      deselectFile,
      error: null,
      isFileSelected,
      isLoading: false,
      previewSize,
      resetTabSettings,
      selectAllFiles,
      selectedFiles,
      selectFile,
      setFilter,
      setGroupBy,
      setPreviewSize,
      setSearchQuery,
      setSort,
      setViewMode,
      switchTab,
      toggleFavorites,
      toggleFileSelection,
    }),
    [
      activeTab,
      browserState,
      clearBrowserState,
      currentTabSettings,
      deselectAllFiles,
      deselectFile,
      isFileSelected,
      previewSize,
      resetTabSettings,
      selectAllFiles,
      selectedFiles,
      selectFile,
      setFilter,
      setGroupBy,
      setPreviewSize,
      setSearchQuery,
      setSort,
      setViewMode,
      switchTab,
      toggleFavorites,
      toggleFileSelection,
    ],
  )
}

const BrowserContextInternal = createContext<BrowserContextType | null>(null)

export function BrowserProvider({ children, value }: { children: ReactNode; value?: BrowserContextType }) {
  const fallbackValue = useLocalBrowserContext()
  return <BrowserContextInternal.Provider value={value ?? fallbackValue}>{children}</BrowserContextInternal.Provider>
}

export function useBrowser(): BrowserContextType {
  const context = useContext(BrowserContextInternal)
  if (!context) {
    throw new Error("useBrowser must be used within BrowserProvider")
  }
  return context
}

export const useBrowserState = useBrowser

export function useBrowserActiveTab(): BrowserTab {
  return useBrowser().activeTab
}

export function useBrowserTabSettings(): TabSettings {
  return useBrowser().currentTabSettings
}

export function useBrowserViewMode(): ViewMode {
  return useBrowser().currentTabSettings.view_mode
}

export function useBrowserPreviewSize(): number {
  return useBrowser().previewSize
}

export function useBrowserSearchQuery(): string {
  return useBrowser().currentTabSettings.search_query
}

export function useBrowserSelectedFiles(): Set<string> {
  return useBrowser().selectedFiles
}

export function useOptimisticSelection(): UseOptimisticSelectionReturn {
  const browser = useBrowser()
  const [optimisticAdded, setOptimisticAdded] = useState<Set<string>>(new Set())
  const [optimisticRemoved, setOptimisticRemoved] = useState<Set<string>>(new Set())
  const [pendingCount, setPendingCount] = useState(0)

  const selectedFiles = useMemo(() => {
    const result = new Set(browser.selectedFiles)
    for (const id of optimisticAdded) result.add(id)
    for (const id of optimisticRemoved) result.delete(id)
    return result
  }, [browser.selectedFiles, optimisticAdded, optimisticRemoved])

  const isSelected = useCallback((fileId: string) => selectedFiles.has(fileId), [selectedFiles])

  const selectFile = useCallback(
    async (fileId: string) => {
      setOptimisticAdded((prev) => new Set(prev).add(fileId))
      setOptimisticRemoved((prev) => {
        const next = new Set(prev)
        next.delete(fileId)
        return next
      })
      setPendingCount((count) => count + 1)

      try {
        await browser.selectFile(fileId)
      } finally {
        setOptimisticAdded((prev) => {
          const next = new Set(prev)
          next.delete(fileId)
          return next
        })
        setPendingCount((count) => count - 1)
      }
    },
    [browser],
  )

  const deselectFile = useCallback(
    async (fileId: string) => {
      setOptimisticRemoved((prev) => new Set(prev).add(fileId))
      setOptimisticAdded((prev) => {
        const next = new Set(prev)
        next.delete(fileId)
        return next
      })
      setPendingCount((count) => count + 1)

      try {
        await browser.deselectFile(fileId)
      } finally {
        setOptimisticRemoved((prev) => {
          const next = new Set(prev)
          next.delete(fileId)
          return next
        })
        setPendingCount((count) => count - 1)
      }
    },
    [browser],
  )

  const toggleSelection = useCallback(
    async (fileId: string) => {
      if (isSelected(fileId)) {
        await deselectFile(fileId)
      } else {
        await selectFile(fileId)
      }
    },
    [deselectFile, isSelected, selectFile],
  )

  const selectAll = useCallback(
    async (fileIds: string[]) => {
      setPendingCount((count) => count + 1)
      try {
        await browser.selectAllFiles(fileIds)
      } finally {
        setPendingCount((count) => count - 1)
      }
    },
    [browser],
  )

  const deselectAll = useCallback(async () => {
    setPendingCount((count) => count + 1)
    try {
      await browser.deselectAllFiles()
    } finally {
      setPendingCount((count) => count - 1)
    }
  }, [browser])

  return {
    deselectAll,
    deselectFile,
    isPending: pendingCount > 0,
    isSelected,
    selectAll,
    selectedFiles,
    selectFile,
    toggleSelection,
  }
}
