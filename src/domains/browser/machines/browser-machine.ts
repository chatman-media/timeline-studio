/**
 * Browser State Machine
 *
 * XState машина для управления состоянием браузера медиафайлов
 * Использует event-driven архитектуру для синхронизации с backend
 */

import { assign, setup } from "xstate"
import { createLogger } from "@/lib/tauri-logger"
import type { BrowserEvent, BrowserTab, TabSettings } from "@/types/generated/tauri-bindings"
import { handleBrowserBackendEvent } from "./backend-event-handlers"

const logger = createLogger("BrowserMachine")

// ============================================================================
// Types
// ============================================================================

export interface BrowserMachineContext {
  // Browser state
  activeTab: BrowserTab
  tabSettings: Partial<Record<BrowserTab, TabSettings>>
  selectedFiles: Partial<Record<BrowserTab, string[]>>

  // UI state
  isLoading: boolean
  error: string | null
}

export type BrowserMachineEvent =
  | { type: "BACKEND_EVENT"; event: BrowserEvent }
  | { type: "SWITCH_TAB"; tab: BrowserTab }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "CLEAR_ERROR" }

// ============================================================================
// Initial Context
// ============================================================================

const DEFAULT_TAB_SETTINGS: TabSettings = {
  search_query: "",
  show_favorites_only: false,
  sort_by: "name",
  sort_order: "asc",
  group_by: "none",
  filter_type: "all",
  view_mode: "thumbnails",
  preview_size_index: 2,
}

const initialContext: BrowserMachineContext = {
  activeTab: "media",
  tabSettings: {
    media: { ...DEFAULT_TAB_SETTINGS },
    effects: { ...DEFAULT_TAB_SETTINGS },
    filters: { ...DEFAULT_TAB_SETTINGS },
    transitions: { ...DEFAULT_TAB_SETTINGS },
    templates: { ...DEFAULT_TAB_SETTINGS },
    style_templates: { ...DEFAULT_TAB_SETTINGS },
    music: { ...DEFAULT_TAB_SETTINGS },
    subtitles: { ...DEFAULT_TAB_SETTINGS },
  },
  selectedFiles: {
    media: [],
    effects: [],
    filters: [],
    transitions: [],
    templates: [],
    style_templates: [],
    music: [],
    subtitles: [],
  },
  isLoading: false,
  error: null,
}

// ============================================================================
// Machine Definition
// ============================================================================

export const browserMachine = setup({
  types: {
    context: {} as BrowserMachineContext,
    events: {} as BrowserMachineEvent,
  },
  actions: {
    /**
     * Обработка backend событий
     * Инкрементально обновляет состояние на основе событий
     */
    handleBackendEvent: assign(({ context, event }) => {
      if (event.type !== "BACKEND_EVENT") return context

      // ОПТИМИЗИРОВАНО: debug вместо info - много событий при начальной синхронизации
      logger.debug("[BrowserMachine] Processing backend event", {
        eventType: event.event.event_type,
      })

      // Делегируем обработку в event handlers
      const updates = handleBrowserBackendEvent(context, event.event)

      // ОПТИМИЗИРОВАНО: логируем только ключи, не весь объект
      logger.debug("[BrowserMachine] Context updates:", { updatedKeys: Object.keys(updates) })

      return {
        ...context,
        ...updates,
      }
    }),

    /**
     * Локальное переключение таба (для оптимистичных обновлений)
     */
    switchTab: assign(({ context, event }) => {
      if (event.type !== "SWITCH_TAB") return context

      logger.info("[BrowserMachine] Switching tab locally", { tab: event.tab })

      return {
        ...context,
        activeTab: event.tab,
      }
    }),

    /**
     * Установка состояния загрузки
     */
    setLoading: assign(({ context, event }) => {
      if (event.type !== "SET_LOADING") return context

      return {
        ...context,
        isLoading: event.isLoading,
      }
    }),

    /**
     * Установка ошибки
     */
    setError: assign(({ context, event }) => {
      if (event.type !== "SET_ERROR") return context

      return {
        ...context,
        error: event.error,
        isLoading: false,
      }
    }),

    /**
     * Очистка ошибки
     */
    clearError: assign(({ context }) => ({
      ...context,
      error: null,
    })),

    /**
     * Логирование событий для отладки
     */
    logEvent: ({ event }) => {
      logger.debug("[BrowserMachine] Event received:", { event: event.type })
    },
  },
}).createMachine({
  id: "browser",
  initial: "idle",
  context: initialContext,
  on: {
    // Backend события обрабатываются в любом состоянии
    BACKEND_EVENT: {
      actions: ["logEvent", "handleBackendEvent"],
    },
    SWITCH_TAB: {
      actions: ["logEvent", "switchTab"],
    },
    SET_LOADING: {
      actions: ["setLoading"],
    },
    SET_ERROR: {
      actions: ["setError"],
    },
    CLEAR_ERROR: {
      actions: ["clearError"],
    },
  },
  states: {
    idle: {
      on: {
        BACKEND_EVENT: {
          target: "idle",
          actions: ["handleBackendEvent"],
        },
      },
    },
  },
})

/**
 * Helper для создания актора browser машины
 */
export function createBrowserActor() {
  const { createActor } = require("xstate")
  return createActor(browserMachine)
}
