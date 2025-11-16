/**
 * Browser Provider
 *
 * Провайдер Browser домена с использованием BackendSync
 * Все состояние хранится на бэкенде и синхронизируется
 * Использует event-driven архитектуру для инкрементальных обновлений
 */

import { useSelector } from "@xstate/react"
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef } from "react"
import { createActor } from "xstate"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { DEFAULT_PREVIEW_SIZE_INDEX, PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import { createLogger } from "@/lib/tauri-logger"
import type {
  BrowserEvent,
  BrowserState,
  BrowserTab,
  ProjectCommand,
  ProjectEvent,
  TabSettings,
  ViewMode,
} from "@/types/generated/tauri-bindings"
import { browserMachine } from "../machines/browser-machine"

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

  // ✅ НОВАЯ АРХИТЕКТУРА: Используем XState машину для кэширования состояния
  const browserActorRef = useRef(createActor(browserMachine))
  const browserActor = browserActorRef.current

  // Запускаем актор при монтировании
  useEffect(() => {
    browserActor.start()
    return () => {
      browserActor.stop()
    }
  }, [browserActor])

  // Получаем состояние из машины через useSelector
  const activeTab = useSelector(browserActor, (state) => state.context.activeTab)
  const tabSettings = useSelector(browserActor, (state) => state.context.tabSettings)
  const selectedFiles = useSelector(browserActor, (state) => state.context.selectedFiles)
  const isLoading = useSelector(browserActor, (state) => state.context.isLoading)
  const error = useSelector(browserActor, (state) => state.context.error)

  // ✅ НОВАЯ АРХИТЕКТУРА: Подписываемся на backend СОБЫТИЯ (не на state changes)
  useEffect(() => {
    const handleBackendEvent = (event: ProjectEvent) => {
      logger.info("[BrowserProvider] Received backend event, forwarding to machine", {
        eventType: event.type,
      })

      // Проверяем, является ли это Browser событием
      if (event.type === "Browser") {
        const browserEvent = event.payload as BrowserEvent

        // Отправляем событие напрямую в машину для инкрементальных обновлений
        browserActor.send({
          type: "BACKEND_EVENT",
          event: browserEvent,
        })
      }
    }

    // Подписываемся на backend события
    const unsubscribeEvents = backendSync.onEvent(handleBackendEvent)

    // ✅ Подписываемся на state changes ТОЛЬКО для инициализации
    // (когда проект открывается в первый раз)
    const unsubscribeState = backendSync.onStateChange((state) => {
      // Обновляем только если состояние браузера изменилось
      if (state?.browser_state) {
        logger.info("[BrowserProvider] Initializing from backend state", {
          activeTab: state.browser_state.active_tab,
        })

        // Синхронизируем начальное состояние с машиной
        if (state.browser_state.active_tab) {
          browserActor.send({
            type: "SWITCH_TAB",
            tab: state.browser_state.active_tab,
          })
        }

        // TODO: синхронизировать tabSettings и selectedFiles при инициализации
      }
    })

    // Получаем начальное состояние (только при mount)
    // Устанавливаем loading в true перед загрузкой
    browserActor.send({ type: "SET_LOADING", isLoading: true })

    backendSync
      .getProjectState()
      .then((state) => {
        if (state?.browser_state) {
          logger.info("[BrowserProvider] Initial state loaded", {
            activeTab: state.browser_state.active_tab,
          })

          if (state.browser_state.active_tab) {
            browserActor.send({
              type: "SWITCH_TAB",
              tab: state.browser_state.active_tab,
            })
          }
        }
      })
      .catch((err) => {
        logger.error("[BrowserProvider] Failed to load initial state:", err)
        browserActor.send({ type: "SET_ERROR", error: err instanceof Error ? err.message : "Failed to load state" })
      })
      .finally(() => {
        // Устанавливаем loading в false после загрузки
        browserActor.send({ type: "SET_LOADING", isLoading: false })
      })

    return () => {
      unsubscribeEvents()
      unsubscribeState()
    }
  }, [backendSync, browserActor])

  // ❌ УДАЛЕНО: refreshBrowserState - больше не нужен
  // События обновляют состояние инкрементально через машину

  // ✅ Вспомогательная функция для выполнения команд
  const executeBrowserCommand = async (command: ProjectCommand): Promise<void> => {
    try {
      browserActor.send({ type: "SET_LOADING", isLoading: true })

      const result = await backendSync.executeCommand(command)

      if (!result.success) {
        throw new Error(result.error || `Failed to execute ${command.type}`)
      }

      // ❌ НЕ обновляем состояние вручную!
      // Backend пришлет событие, которое обновит машину автоматически

      // ✅ Очищаем ошибки при успешной операции
      browserActor.send({ type: "CLEAR_ERROR" })
      browserActor.send({ type: "SET_LOADING", isLoading: false })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to execute ${command.type}`
      browserActor.send({ type: "SET_ERROR", error: errorMsg })
      logger.error("Browser command failed:", { command, error: err })
      throw err
    }
  }

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
    }),
    [activeTab, tabSettings, selectedFiles],
  )

  // Browser actions implementation
  const switchTab = async (tab: BrowserTab): Promise<void> => {
    logger.info("[BrowserProvider] Switching tab", { from: activeTab, to: tab })

    // ✅ Оптимистичное обновление - обновляем машину сразу
    browserActor.send({ type: "SWITCH_TAB", tab })

    // Отправляем команду на backend
    const { commands } = await import("@/types/generated/tauri-bindings")
    const result = await commands.browserSwitchTab(tab)

    if (result.status === "error") {
      logger.error("[BrowserProvider] Tab switch failed", { error: result.error })
      // При ошибке backend пришлет корректное состояние через событие
      browserActor.send({ type: "SET_ERROR", error: result.error })
      throw new Error(result.error)
    }

    logger.info("[BrowserProvider] Tab switch command sent successfully")
    // Backend пришлет событие TabSwitched для подтверждения
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
