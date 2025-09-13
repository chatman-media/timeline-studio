import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"

import { DEFAULT_PREVIEW_SIZE_INDEX, PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import type { BrowserTab } from "@/shared/types/browser"
import type { BrowserContext, ViewMode } from "@/shared/types/browser-context"

/**
 * Начальные настройки для каждой вкладки
 */
const getInitialTabSettings = (tab: BrowserTab) => ({
  searchQuery: "",
  showFavoritesOnly: false,
  sortBy: "name",
  sortOrder: "asc" as const,
  groupBy: "none",
  filterType: "all",
  viewMode: (tab === "music" ? "list" : "thumbnails") as ViewMode,
  previewSizeIndex: DEFAULT_PREVIEW_SIZE_INDEX,
})

/**
 * Начальный контекст
 */
const getInitialContext = (): BrowserContext => ({
  activeTab: "media",
  selectedFiles: {
    media: new Set<string>(),
    music: new Set<string>(),
    effects: new Set<string>(),
    filters: new Set<string>(),
    transitions: new Set<string>(),
    subtitles: new Set<string>(),
    templates: new Set<string>(),
    "style-templates": new Set<string>(),
  },
  tabSettings: {
    media: getInitialTabSettings("media"),
    music: getInitialTabSettings("music"),
    effects: getInitialTabSettings("effects"),
    filters: getInitialTabSettings("filters"),
    transitions: getInitialTabSettings("transitions"),
    subtitles: getInitialTabSettings("subtitles"),
    templates: getInitialTabSettings("templates"),
    "style-templates": getInitialTabSettings("style-templates"),
  },
})

/**
 * Интерфейс контекста провайдера браузера
 */
interface BrowserStateContextValue {
  // Состояние
  state: BrowserContext

  // Геттеры для текущей вкладки
  activeTab: BrowserTab
  currentTabSettings: BrowserContext["tabSettings"][BrowserTab]
  selectedFiles: Set<string>
  previewSize: number

  // Действия
  switchTab: (tab: BrowserTab) => void
  setSearchQuery: (query: string, tab?: BrowserTab) => void
  toggleFavorites: (tab?: BrowserTab) => void
  setSort: (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab) => void
  setGroupBy: (groupBy: string, tab?: BrowserTab) => void
  setFilter: (filterType: string, tab?: BrowserTab) => void
  setViewMode: (viewMode: ViewMode, tab?: BrowserTab) => void
  setPreviewSize: (sizeIndex: number, tab?: BrowserTab) => void
  resetTabSettings: (tab: BrowserTab) => void

  // Действия для выбора файлов
  selectFile: (fileId: string, tab?: BrowserTab) => void
  deselectFile: (fileId: string, tab?: BrowserTab) => void
  toggleFileSelection: (fileId: string, tab?: BrowserTab) => void
  selectAllFiles: (fileIds: string[], tab?: BrowserTab) => void
  deselectAllFiles: (tab?: BrowserTab) => void
  isFileSelected: (fileId: string, tab?: BrowserTab) => boolean
}

/**
 * Контекст провайдера браузера
 */
const BrowserStateContext = createContext<BrowserStateContextValue | null>(null)

/**
 * Интерфейс свойств провайдера браузера
 */
interface BrowserStateProviderProps {
  children: React.ReactNode
}

/**
 * Провайдер состояния браузера
 */
export const BrowserStateProvider: React.FC<BrowserStateProviderProps> = ({ children }) => {
  const [state, setState] = useState<BrowserContext>(() => {
    // Не обращаемся к localStorage на этапе SSR / синхронной инициализации.
    // Загружать сохранённые настройки будем в useEffect на клиенте.
    return getInitialContext()
  })

  // Загрузка сохранённых настроек только на клиенте (не в SSR)
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedSettings = localStorage.getItem("browserSettings")
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)

        // Преобразуем массивы обратно в Set для selectedFiles
        if (parsed.selectedFiles) {
          const selectedFiles: Record<BrowserTab, Set<string>> = {} as any
          for (const [tab, files] of Object.entries(parsed.selectedFiles)) {
            selectedFiles[tab as BrowserTab] = new Set(files as string[])
          }
          parsed.selectedFiles = selectedFiles
        } else {
          // Если нет selectedFiles, инициализируем пустыми Set
          parsed.selectedFiles = getInitialContext().selectedFiles
        }

        // Объединяем сохранённые настройки с начальными, чтобы не потерять структуру
        setState((prev) => ({
          ...prev,
          ...parsed,
        }))
      }
    } catch (error) {
      console.error("Failed to load browser settings from localStorage:", error)
    }
  }, [])

  // Используем ref для отслеживания первого рендера и предыдущего состояния
  const isFirstRender = useRef(true)
  const prevStateRef = useRef(state)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Сохраняем настройки в пользовательские настройки при изменении (с дебаунсом)
  useEffect(() => {
    // Пропускаем первый рендер, чтобы не сохранять сразу после загрузки
    if (isFirstRender.current) {
      isFirstRender.current = false
      prevStateRef.current = state
      return
    }

    // Проверяем, действительно ли состояние изменилось
    if (JSON.stringify(prevStateRef.current) === JSON.stringify(state)) {
      return
    }

    prevStateRef.current = state

    // Очищаем предыдущий таймаут, если он существует
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Преобразуем Set в массив для сериализации
        const stateToSave = {
          ...state,
          selectedFiles: Object.entries(state.selectedFiles).reduce(
            (acc, [tab, files]) => {
              acc[tab as BrowserTab] = Array.from(files)
              return acc
            },
            {} as Record<BrowserTab, string[]>,
          ),
        }
        localStorage.setItem("browserSettings", JSON.stringify(stateToSave))
        // Settings saved to localStorage
      } catch (error) {
        console.error("Failed to save browser settings to localStorage:", error)
      }
      saveTimeoutRef.current = null
    }, 500) // Дебаунс 500мс

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [state])

  // Очистка таймера при размонтировании компонента
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [])

  // Геттеры
  const activeTab = state.activeTab
  const currentTabSettings = state.tabSettings[activeTab] || getInitialTabSettings(activeTab)
  const selectedFiles = state.selectedFiles[activeTab] || new Set<string>()
  const previewSize = PREVIEW_SIZES[currentTabSettings.previewSizeIndex] || PREVIEW_SIZES[DEFAULT_PREVIEW_SIZE_INDEX]

  // Действия
  const switchTab = (tab: BrowserTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }))
  }

  const setSearchQuery = (query: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...(prev.tabSettings[targetTab] || getInitialTabSettings(targetTab)),
          searchQuery: query,
        },
      },
    }))
  }

  const toggleFavorites = (tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          showFavoritesOnly: !prev.tabSettings[targetTab].showFavoritesOnly,
        },
      },
    }))
  }

  const setSort = (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          sortBy,
          sortOrder,
        },
      },
    }))
  }

  const setGroupBy = (groupBy: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          groupBy,
        },
      },
    }))
  }

  const setFilter = (filterType: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          filterType,
        },
      },
    }))
  }

  const setViewMode = (viewMode: ViewMode, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          viewMode,
        },
      },
    }))
  }

  const setPreviewSize = (sizeIndex: number, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          previewSizeIndex: sizeIndex,
        },
      },
    }))
  }

  const resetTabSettings = (tab: BrowserTab) => {
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [tab]: getInitialTabSettings(tab),
      },
    }))
  }

  // Методы для работы с выбором файлов
  const selectFile = (fileId: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      selectedFiles: {
        ...prev.selectedFiles,
        [targetTab]: new Set([...prev.selectedFiles[targetTab], fileId]),
      },
    }))
  }

  const deselectFile = (fileId: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => {
      const newSelectedFiles = new Set(prev.selectedFiles[targetTab])
      newSelectedFiles.delete(fileId)
      return {
        ...prev,
        selectedFiles: {
          ...prev.selectedFiles,
          [targetTab]: newSelectedFiles,
        },
      }
    })
  }

  const toggleFileSelection = (fileId: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => {
      const isSelected = prev.selectedFiles[targetTab].has(fileId)
      const newSelectedFiles = new Set(prev.selectedFiles[targetTab])
      if (isSelected) {
        newSelectedFiles.delete(fileId)
      } else {
        newSelectedFiles.add(fileId)
      }
      return {
        ...prev,
        selectedFiles: {
          ...prev.selectedFiles,
          [targetTab]: newSelectedFiles,
        },
      }
    })
  }

  const selectAllFiles = (fileIds: string[], tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      selectedFiles: {
        ...prev.selectedFiles,
        [targetTab]: new Set(fileIds),
      },
    }))
  }

  const deselectAllFiles = (tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      selectedFiles: {
        ...prev.selectedFiles,
        [targetTab]: new Set(),
      },
    }))
  }

  const isFileSelected = (fileId: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    return state.selectedFiles[targetTab]?.has(fileId) || false
  }

  const value: BrowserStateContextValue = {
    state,
    activeTab,
    currentTabSettings,
    selectedFiles,
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
  }

  return <BrowserStateContext.Provider value={value}>{children}</BrowserStateContext.Provider>
}

/**
 * Хук для использования состояния браузера
 */
export const useBrowserState = (): BrowserStateContextValue => {
  const context = useContext(BrowserStateContext)
  if (!context) {
    throw new Error("useBrowserState must be used within a BrowserStateProvider")
  }
  return context
}

/**
 * Хук для получения настроек конкретной вкладки
 */
export const useTabSettings = (tab?: BrowserTab) => {
  const { state, activeTab } = useBrowserState()
  const targetTab = tab || activeTab
  return state.tabSettings[targetTab]
}
