import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { BrowserContext, BrowserTab, ViewMode } from "@/domains/browser"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { DEFAULT_PREVIEW_SIZE_INDEX, PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("BrowserStateProvider")

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
 * Интерфейс контекста провайдера браузера с BackendSync
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

  // Утилиты
  clearBrowserState: () => void
  isBackendConnected: boolean
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
 * Провайдер состояния браузера с интеграцией BackendSync
 *
 * Добавлено:
 * - Синхронизация состояния браузера с backend
 * - Восстановление состояния из backend при инициализации
 * - Логирование действий пользователя для аналитики
 */
export const BrowserStateProvider: React.FC<BrowserStateProviderProps> = ({ children }) => {
  const backendSync = getBackendSync()
  const [isBackendConnected, setIsBackendConnected] = useState(backendSync.connected)

  const [state, setState] = useState<BrowserContext>(() => {
    // Пытаемся загрузить UI настройки из localStorage только на клиенте
    if (typeof window === "undefined") {
      return getInitialContext()
    }

    try {
      const savedSettings = localStorage.getItem("browserSettings")
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)

        // Восстанавливаем только UI настройки (activeTab, tabSettings)
        // selectedFiles всегда инициализируются пустыми (временное состояние)
        return {
          ...getInitialContext(),
          activeTab: parsed.activeTab || getInitialContext().activeTab,
          tabSettings: parsed.tabSettings || getInitialContext().tabSettings,
        }
      }
    } catch (error) {
      logger.error("Failed to load browser settings from localStorage:", error)
    }

    // Возвращаем начальное состояние по умолчанию
    return getInitialContext()
  })

  // Используем ref для отслеживания первого рендера
  const isFirstRender = useRef(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Подписка на backend события (только для сброса при смене проекта)
  useEffect(() => {
    // Мониторинг соединения
    const unsubscribeConnection = backendSync.onStateChange(() => {
      setIsBackendConnected(true)
    })

    // Подписка на события проекта
    const unsubscribeEvents = backendSync.onEvent((event) => {
      if (event.type === "ProjectCreated" || event.type === "ProjectOpened" || event.type === "ProjectClosed") {
        // При создании/открытии/закрытии проекта сбрасываем selectedFiles
        logger.info(`[BrowserStateProvider] ${event.type}, clearing temporary selections`)
        setState((prev) => ({
          ...prev,
          selectedFiles: getInitialContext().selectedFiles,
        }))
      }
    })

    return () => {
      unsubscribeConnection()
      unsubscribeEvents()
    }
  }, [backendSync])

  // Сохраняем UI настройки в localStorage для UX (с дебаунсом)
  useEffect(() => {
    // Пропускаем первый рендер, чтобы не сохранять сразу после загрузки
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Очищаем предыдущий таймаут
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (typeof window === "undefined") {
        return
      }

      try {
        // Сохраняем только UI настройки (activeTab, tabSettings)
        // НЕ сохраняем selectedFiles - это временное состояние для drag
        const uiSettings = {
          activeTab: state.activeTab,
          tabSettings: state.tabSettings,
        }
        localStorage.setItem("browserSettings", JSON.stringify(uiSettings))
      } catch (error) {
        logger.error("Failed to save browser settings to localStorage:", error)
      }
      saveTimeoutRef.current = null
    }, 500) // Дебаунс 500мс для оптимизации

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [state.activeTab, state.tabSettings])

  // Очистка таймера при размонтировании
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

  // Расширенные действия с логированием для backend
  const switchTab = (tab: BrowserTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }))

    // Логируем переключение вкладки
    if (isBackendConnected) {
      backendSync
        .executeCommand({
          type: "LogBrowserAction",
          params: { action: "switch_tab", tab },
        })
        .catch((error) => logger.error("Failed to log browser action", { error }))
    }
  }

  const setSearchQuery = (query: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
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

    // Логируем изменение режима просмотра
    if (isBackendConnected) {
      backendSync
        .executeCommand({
          type: "LogBrowserAction",
          params: { action: "change_view_mode", viewMode, tab: targetTab },
        })
        .catch((error) => logger.error("Operation failed", { error }))
    }
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

  const selectFile = (fileId: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => {
      const newSelected = new Set(prev.selectedFiles[targetTab])
      newSelected.add(fileId)
      return {
        ...prev,
        selectedFiles: {
          ...prev.selectedFiles,
          [targetTab]: newSelected,
        },
      }
    })
  }

  const deselectFile = (fileId: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => {
      const newSelected = new Set(prev.selectedFiles[targetTab])
      newSelected.delete(fileId)
      return {
        ...prev,
        selectedFiles: {
          ...prev.selectedFiles,
          [targetTab]: newSelected,
        },
      }
    })
  }

  const toggleFileSelection = (fileId: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => {
      const newSelected = new Set(prev.selectedFiles[targetTab])
      if (newSelected.has(fileId)) {
        newSelected.delete(fileId)
      } else {
        newSelected.add(fileId)
      }
      return {
        ...prev,
        selectedFiles: {
          ...prev.selectedFiles,
          [targetTab]: newSelected,
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

    // Логируем массовый выбор файлов
    if (isBackendConnected && fileIds.length > 10) {
      backendSync
        .executeCommand({
          type: "LogBrowserAction",
          params: { action: "select_all_files", count: fileIds.length, tab: targetTab },
        })
        .catch((error) => logger.error("Operation failed", { error }))
    }
  }

  const deselectAllFiles = (tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      selectedFiles: {
        ...prev.selectedFiles,
        [targetTab]: new Set<string>(),
      },
    }))
  }

  const isFileSelected = (fileId: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    return state.selectedFiles[targetTab]?.has(fileId) || false
  }

  // Метод для принудительной очистки browser state
  const clearBrowserState = () => {
    logger.info("[BrowserStateProvider] Manually clearing browser state")
    localStorage.removeItem("browserSettings")
    setState(getInitialContext())
  }

  return (
    <BrowserStateContext.Provider
      value={{
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
        clearBrowserState,
        isBackendConnected,
      }}
    >
      {children}
    </BrowserStateContext.Provider>
  )
}

/**
 * Хук для использования контекста браузера
 */
export const useBrowserState = () => {
  const context = useContext(BrowserStateContext)
  if (!context) {
    throw new Error("useBrowserState must be used within BrowserStateProvider")
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
