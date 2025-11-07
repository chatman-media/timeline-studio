/**
 * Workspace Layout State Machine
 *
 * Manages widget-based layout system with XState v5
 */

import { assign, setup } from "xstate"

import { createLogger } from "@/lib/tauri-logger"

import { DEFAULT_LAYOUT_PRESET_ID, getLayoutPreset, LAYOUT_PRESETS } from "../config/layout-presets"
import type { LayoutPreset, Widget, WidgetBounds } from "../types/widget"

const logger = createLogger("WorkspaceLayoutMachine")

/**
 * Layout machine context
 */
interface LayoutContext {
  // Current active preset ID
  currentPresetId: string
  // Active widgets (can be modified from preset)
  activeWidgets: Widget[]
  // Custom user layouts
  customLayouts: LayoutPreset[]
  // Selected widget for operations
  selectedWidgetId: string | null
  // Drag state
  isDragging: boolean
  dragWidgetId: string | null
}

/**
 * Layout machine events
 */
type LayoutEvent =
  | { type: "SWITCH_PRESET"; presetId: string }
  | { type: "ADD_WIDGET"; widget: Widget }
  | { type: "REMOVE_WIDGET"; widgetId: string }
  | { type: "UPDATE_WIDGET_BOUNDS"; widgetId: string; bounds: WidgetBounds }
  | { type: "TOGGLE_WIDGET_VISIBILITY"; widgetId: string }
  | { type: "MINIMIZE_WIDGET"; widgetId: string }
  | { type: "MAXIMIZE_WIDGET"; widgetId: string }
  | { type: "SELECT_WIDGET"; widgetId: string | null }
  | { type: "START_DRAG"; widgetId: string }
  | { type: "END_DRAG" }
  | { type: "SAVE_CUSTOM_LAYOUT"; name: string; description?: string }
  | { type: "DELETE_CUSTOM_LAYOUT"; layoutId: string }
  | { type: "RESET_TO_PRESET" }

/**
 * Workspace Layout Machine
 */
export const workspaceLayoutMachine = setup({
  types: {
    context: {} as LayoutContext,
    events: {} as LayoutEvent,
  },
  actions: {
    switchPreset: assign(({ context, event }) => {
      if (event.type !== "SWITCH_PRESET") return {}

      const preset = getLayoutPreset(event.presetId)
      if (!preset) {
        logger.warnSync("Preset not found", { presetId: event.presetId })
        return {}
      }

      logger.debugSync("Switching to preset", { presetId: event.presetId })

      return {
        currentPresetId: event.presetId,
        activeWidgets: [...preset.widgets],
        selectedWidgetId: null,
      }
    }),

    addWidget: assign(({ context, event }) => {
      if (event.type !== "ADD_WIDGET") return {}

      logger.debugSync("Adding widget", { widgetId: event.widget.id, type: event.widget.type })

      return {
        activeWidgets: [...context.activeWidgets, event.widget],
      }
    }),

    removeWidget: assign(({ context, event }) => {
      if (event.type !== "REMOVE_WIDGET") return {}

      logger.debugSync("Removing widget", { widgetId: event.widgetId })

      return {
        activeWidgets: context.activeWidgets.filter((w) => w.id !== event.widgetId),
        selectedWidgetId: context.selectedWidgetId === event.widgetId ? null : context.selectedWidgetId,
      }
    }),

    updateWidgetBounds: assign(({ context, event }) => {
      if (event.type !== "UPDATE_WIDGET_BOUNDS") return {}

      return {
        activeWidgets: context.activeWidgets.map((widget) =>
          widget.id === event.widgetId
            ? {
                ...widget,
                bounds: event.bounds,
              }
            : widget,
        ),
      }
    }),

    toggleWidgetVisibility: assign(({ context, event }) => {
      if (event.type !== "TOGGLE_WIDGET_VISIBILITY") return {}

      return {
        activeWidgets: context.activeWidgets.map((widget) =>
          widget.id === event.widgetId
            ? {
                ...widget,
                isVisible: !widget.isVisible,
              }
            : widget,
        ),
      }
    }),

    minimizeWidget: assign(({ context, event }) => {
      if (event.type !== "MINIMIZE_WIDGET") return {}

      return {
        activeWidgets: context.activeWidgets.map((widget) =>
          widget.id === event.widgetId
            ? {
                ...widget,
                isMinimized: true,
              }
            : widget,
        ),
      }
    }),

    maximizeWidget: assign(({ context, event }) => {
      if (event.type !== "MAXIMIZE_WIDGET") return {}

      return {
        activeWidgets: context.activeWidgets.map((widget) =>
          widget.id === event.widgetId
            ? {
                ...widget,
                isMinimized: false,
              }
            : widget,
        ),
      }
    }),

    selectWidget: assign(({ event }) => {
      if (event.type !== "SELECT_WIDGET") return {}

      return {
        selectedWidgetId: event.widgetId,
      }
    }),

    startDrag: assign(({ event }) => {
      if (event.type !== "START_DRAG") return {}

      logger.debugSync("Starting widget drag", { widgetId: event.widgetId })

      return {
        isDragging: true,
        dragWidgetId: event.widgetId,
      }
    }),

    endDrag: assign(() => {
      logger.debugSync("Ending widget drag")

      return {
        isDragging: false,
        dragWidgetId: null,
      }
    }),

    saveCustomLayout: assign(({ context, event }) => {
      if (event.type !== "SAVE_CUSTOM_LAYOUT") return {}

      const newLayout: LayoutPreset = {
        id: `custom-${Date.now()}`,
        name: event.name,
        description: event.description,
        widgets: [...context.activeWidgets],
      }

      logger.debugSync("Saving custom layout", { layoutId: newLayout.id, name: event.name })

      return {
        customLayouts: [...context.customLayouts, newLayout],
      }
    }),

    deleteCustomLayout: assign(({ context, event }) => {
      if (event.type !== "DELETE_CUSTOM_LAYOUT") return {}

      logger.debugSync("Deleting custom layout", { layoutId: event.layoutId })

      return {
        customLayouts: context.customLayouts.filter((layout) => layout.id !== event.layoutId),
      }
    }),

    resetToPreset: assign(({ context }) => {
      const preset = getLayoutPreset(context.currentPresetId)
      if (!preset) return {}

      logger.debugSync("Resetting to preset", { presetId: context.currentPresetId })

      return {
        activeWidgets: [...preset.widgets],
        selectedWidgetId: null,
      }
    }),
  },
}).createMachine({
  id: "workspaceLayout",
  initial: "idle",
  context: {
    currentPresetId: DEFAULT_LAYOUT_PRESET_ID,
    activeWidgets: [...LAYOUT_PRESETS[0].widgets],
    customLayouts: [],
    selectedWidgetId: null,
    isDragging: false,
    dragWidgetId: null,
  },
  states: {
    idle: {
      on: {
        SWITCH_PRESET: {
          actions: "switchPreset",
        },
        ADD_WIDGET: {
          actions: "addWidget",
        },
        REMOVE_WIDGET: {
          actions: "removeWidget",
        },
        UPDATE_WIDGET_BOUNDS: {
          actions: "updateWidgetBounds",
        },
        TOGGLE_WIDGET_VISIBILITY: {
          actions: "toggleWidgetVisibility",
        },
        MINIMIZE_WIDGET: {
          actions: "minimizeWidget",
        },
        MAXIMIZE_WIDGET: {
          actions: "maximizeWidget",
        },
        SELECT_WIDGET: {
          actions: "selectWidget",
        },
        START_DRAG: {
          target: "dragging",
          actions: "startDrag",
        },
        SAVE_CUSTOM_LAYOUT: {
          actions: "saveCustomLayout",
        },
        DELETE_CUSTOM_LAYOUT: {
          actions: "deleteCustomLayout",
        },
        RESET_TO_PRESET: {
          actions: "resetToPreset",
        },
      },
    },
    dragging: {
      on: {
        UPDATE_WIDGET_BOUNDS: {
          actions: "updateWidgetBounds",
        },
        END_DRAG: {
          target: "idle",
          actions: "endDrag",
        },
      },
    },
  },
})

export type WorkspaceLayoutMachine = typeof workspaceLayoutMachine
export type WorkspaceLayoutEvent = LayoutEvent
export type WorkspaceLayoutContext = LayoutContext
