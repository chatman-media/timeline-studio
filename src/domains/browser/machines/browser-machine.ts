/**
 * Browser State Machine - Browser Domain
 *
 * Управляет состоянием браузера медиа файлов и ресурсов
 * Перенесено из src/features/browser/services/browser-state-machine.ts
 */

import { assign, setup } from "xstate"

import { DEFAULT_PREVIEW_SIZE_INDEX } from "@/features/media/utils/preview-sizes"
import { createLogger } from "@/lib/tauri-logger"
import type { BrowserContext, BrowserMachineEvent, BrowserTab, TabSettings, ViewMode } from "../types"

const logger = createLogger("BrowserMachine")

/**
 * Начальные настройки для каждой вкладки
 */
const getInitialTabSettings = (tab: BrowserTab): TabSettings => {
  // Базовые настройки
  const baseSettings: TabSettings = {
    searchQuery: "",
    showFavoritesOnly: false,
    sortBy: "name",
    sortOrder: "asc" as const,
    groupBy: "none",
    filterType: "all",
    viewMode: "thumbnails" as ViewMode,
    previewSizeIndex: DEFAULT_PREVIEW_SIZE_INDEX,
  }

  // Специфичные настройки для разных вкладок
  switch (tab) {
    case "music":
      return {
        ...baseSettings,
        sortBy: "name",
        groupBy: "genre",
        filterType: "all",
      }
    case "effects":
      return {
        ...baseSettings,
        sortBy: "name",
        groupBy: "category",
        filterType: "all",
      }
    case "style-templates":
      return {
        ...baseSettings,
        sortBy: "popularity",
        groupBy: "type",
        filterType: "all",
      }
    default:
      return baseSettings
  }
}

/**
 * Загрузка сохраненных настроек из localStorage
 */
const loadSavedSettings = (): BrowserContext | null => {
  logger.debugSync("Loading saved settings...")
  try {
    // Guard: localStorage is only available in browser runtime (not SSR)
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
      logger.debugSync("localStorage not available (SSR), skipping load")
      return null
    }
    const savedSettings = localStorage.getItem("browserSettings")
    if (savedSettings) {
      logger.debugSync("Found saved settings")
      const parsed = JSON.parse(savedSettings)
      // Восстанавливаем Set из массива для selectedFiles
      if (parsed.selectedFiles) {
        const selectedFiles: BrowserContext["selectedFiles"] = {} as any
        for (const [tab, fileIds] of Object.entries(parsed.selectedFiles)) {
          selectedFiles[tab as BrowserTab] = new Set(fileIds as string[])
        }
        parsed.selectedFiles = selectedFiles
      }
      return parsed as BrowserContext
    }
  } catch (error) {
    logger.errorSync("Failed to load saved settings", { error })
  }

  return null
}

/**
 * Начальный контекст машины состояния
 */
const initialContext: BrowserContext = loadSavedSettings() || {
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
}

/**
 * Машина состояния браузера с типизацией через setup
 */
export const browserMachine = setup({
  types: {
    context: {} as BrowserContext,
    events: {} as BrowserMachineEvent,
  },
  actions: {
    switchTab: assign({
      activeTab: ({ event }) => {
        if (event.type !== "SWITCH_TAB") return "media"
        logger.debugSync("Switching to tab", { tab: event.tab })
        return event.tab
      },
    }),

    setSearchQuery: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_SEARCH_QUERY") return context.tabSettings
        const tab = event.tab || context.activeTab
        logger.debugSync("Setting search query", { tab, query: event.query })
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab as BrowserTab],
            searchQuery: event.query,
          },
        }
      },
    }),

    toggleFavorites: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "TOGGLE_FAVORITES") return context.tabSettings
        const tab = event.tab || context.activeTab
        const newValue = !context.tabSettings[tab as BrowserTab].showFavoritesOnly
        logger.debugSync("Toggle favorites", { tab, showFavoritesOnly: newValue })
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab as BrowserTab],
            showFavoritesOnly: newValue,
          },
        }
      },
    }),

    setSort: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_SORT") return context.tabSettings
        const tab = event.tab || context.activeTab
        logger.debugSync("Set sort", { tab, sortBy: event.sortBy, sortOrder: event.sortOrder })
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab as BrowserTab],
            sortBy: event.sortBy,
            sortOrder: event.sortOrder,
          },
        }
      },
    }),

    setGroupBy: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_GROUP_BY") return context.tabSettings
        const tab = event.tab || context.activeTab
        logger.debugSync("Set group by", { tab, groupBy: event.groupBy })
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab as BrowserTab],
            groupBy: event.groupBy,
          },
        }
      },
    }),

    setFilter: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_FILTER") return context.tabSettings
        const tab = event.tab || context.activeTab
        logger.debugSync("Set filter", { tab, filterType: event.filterType })
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab as BrowserTab],
            filterType: event.filterType,
          },
        }
      },
    }),

    setViewMode: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_VIEW_MODE") return context.tabSettings
        const tab = event.tab || context.activeTab
        logger.debugSync("Set view mode", { tab, viewMode: event.viewMode })
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab as BrowserTab],
            viewMode: event.viewMode,
          },
        }
      },
    }),

    setPreviewSize: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_PREVIEW_SIZE") return context.tabSettings
        const tab = event.tab || context.activeTab
        const validIndex = Math.max(0, Math.min(event.sizeIndex, 6)) // 0-6 valid indices for PREVIEW_SIZES
        logger.debugSync("Set preview size", { tab, previewSizeIndex: validIndex })
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab as BrowserTab],
            previewSizeIndex: validIndex,
          },
        }
      },
    }),

    resetTabSettings: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "RESET_TAB_SETTINGS") return context.tabSettings
        logger.debugSync("Resetting tab settings", { tab: event.tab })
        return {
          ...context.tabSettings,
          [event.tab]: getInitialTabSettings(event.tab),
        }
      },
    }),

    loadSettings: assign(({ event }) => {
      if (event.type !== "LOAD_SETTINGS") return {}
      logger.debugSync("Loading settings", { settings: event.settings })
      return event.settings
    }),

    saveSettings: ({ context }) => {
      logger.debugSync("Saving settings to localStorage")
      try {
        if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
          logger.debugSync("localStorage not available (SSR), skipping save")
          return
        }
        // Преобразуем Set в массив для сериализации
        const serializable = {
          ...context,
          selectedFiles: Object.entries(context.selectedFiles).reduce(
            (acc, [tab, files]) => {
              acc[tab as BrowserTab] = Array.from(files)
              return acc
            },
            {} as Record<BrowserTab, string[]>,
          ),
        }
        localStorage.setItem("browserSettings", JSON.stringify(serializable))
      } catch (error) {
        logger.errorSync("Failed to save settings", { error })
      }
    },

    // File selection actions
    selectFile: assign({
      selectedFiles: ({ context, event }) => {
        if (event.type !== "SELECT_FILE") return context.selectedFiles
        const tab = event.tab || context.activeTab
        const newSelected = new Set(context.selectedFiles[tab as BrowserTab])
        newSelected.add(event.fileId)
        logger.debugSync("Selected file", { fileId: event.fileId, tab })
        return {
          ...context.selectedFiles,
          [tab as BrowserTab]: newSelected,
        }
      },
    }),

    deselectFile: assign({
      selectedFiles: ({ context, event }) => {
        if (event.type !== "DESELECT_FILE") return context.selectedFiles
        const tab = event.tab || context.activeTab
        const newSelected = new Set(context.selectedFiles[tab as BrowserTab])
        newSelected.delete(event.fileId)
        logger.debugSync("Deselected file", { fileId: event.fileId, tab })
        return {
          ...context.selectedFiles,
          [tab as BrowserTab]: newSelected,
        }
      },
    }),

    toggleFileSelection: assign({
      selectedFiles: ({ context, event }) => {
        if (event.type !== "TOGGLE_FILE_SELECTION") return context.selectedFiles
        const tab = event.tab || context.activeTab
        const newSelected = new Set(context.selectedFiles[tab as BrowserTab])
        if (newSelected.has(event.fileId)) {
          newSelected.delete(event.fileId)
          logger.debugSync("Deselected file", { fileId: event.fileId, tab })
        } else {
          newSelected.add(event.fileId)
          logger.debugSync("Selected file", { fileId: event.fileId, tab })
        }
        return {
          ...context.selectedFiles,
          [tab as BrowserTab]: newSelected,
        }
      },
    }),

    selectAllFiles: assign({
      selectedFiles: ({ context, event }) => {
        if (event.type !== "SELECT_ALL_FILES") return context.selectedFiles
        const tab = event.tab || context.activeTab
        logger.debugSync("Selecting all files", { fileCount: event.fileIds.length, tab })
        return {
          ...context.selectedFiles,
          [tab as BrowserTab]: new Set(event.fileIds),
        }
      },
    }),

    deselectAllFiles: assign({
      selectedFiles: ({ context, event }) => {
        if (event.type !== "DESELECT_ALL_FILES") return context.selectedFiles
        const tab = event.tab || context.activeTab
        logger.debugSync("Deselecting all files", { tab })
        return {
          ...context.selectedFiles,
          [tab as BrowserTab]: new Set<string>(),
        }
      },
    }),
  },
}).createMachine({
  id: "browser-domain",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        SWITCH_TAB: {
          actions: ["switchTab", "saveSettings"],
        },
        SET_SEARCH_QUERY: {
          actions: ["setSearchQuery", "saveSettings"],
        },
        TOGGLE_FAVORITES: {
          actions: ["toggleFavorites", "saveSettings"],
        },
        SET_SORT: {
          actions: ["setSort", "saveSettings"],
        },
        SET_GROUP_BY: {
          actions: ["setGroupBy", "saveSettings"],
        },
        SET_FILTER: {
          actions: ["setFilter", "saveSettings"],
        },
        SET_VIEW_MODE: {
          actions: ["setViewMode", "saveSettings"],
        },
        SET_PREVIEW_SIZE: {
          actions: ["setPreviewSize", "saveSettings"],
        },
        RESET_TAB_SETTINGS: {
          actions: ["resetTabSettings", "saveSettings"],
        },
        LOAD_SETTINGS: {
          actions: ["loadSettings"],
        },
        SAVE_SETTINGS: {
          actions: ["saveSettings"],
        },
        SELECT_FILE: {
          actions: ["selectFile", "saveSettings"],
        },
        DESELECT_FILE: {
          actions: ["deselectFile", "saveSettings"],
        },
        TOGGLE_FILE_SELECTION: {
          actions: ["toggleFileSelection", "saveSettings"],
        },
        SELECT_ALL_FILES: {
          actions: ["selectAllFiles", "saveSettings"],
        },
        DESELECT_ALL_FILES: {
          actions: ["deselectAllFiles", "saveSettings"],
        },
      },
    },
  },
})

/**
 * Тип машины состояний браузера
 */
export type BrowserMachine = typeof browserMachine
