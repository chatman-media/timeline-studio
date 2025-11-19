/**
 * Workspace Layout State Machine
 *
 * Manages widget-based layout system with XState v5
 */

import { assign, setup } from "xstate"

import { createLogger } from "@/lib/tauri-logger"

import { DEFAULT_LAYOUT_PRESET_ID, getLayoutPreset, LAYOUT_PRESETS } from "../config/layout-presets"
import type { LayoutPreset, Widget, WidgetBounds } from "../types/widget"
import { debouncedSave, type WorkspaceState } from "./workspace-persistence"

const logger = createLogger("WorkspaceLayoutMachine")

const WORKSPACE_VERSION = "1.0.0"

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
  // Resize state
  isResizing: boolean
  resizeWidgetId: string | null
  resizeHandle: ResizeHandle | null
  resizeStartBounds: WidgetBounds | null
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
  | { type: "RESTORE_STATE"; state: WorkspaceState }
  | { type: "START_RESIZE"; widgetId: string; handle: ResizeHandle }
  | { type: "UPDATE_RESIZE"; bounds: WidgetBounds }
  | { type: "END_RESIZE" }

/**
 * Resize handle positions
 */
export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

/**
 * Workspace Layout Machine
 */
export const workspaceLayoutMachine = setup({
  types: {
    context: {} as LayoutContext,
    events: {} as LayoutEvent,
  },
  actions: {
    switchPreset: assign(({ event }) => {
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

    restoreState: assign(({ event }) => {
      if (event.type !== "RESTORE_STATE") return {}

      logger.debugSync("Restoring workspace state", {
        presetId: event.state.currentPresetId,
        widgetCount: event.state.activeWidgets.length,
      })

      return {
        currentPresetId: event.state.currentPresetId,
        activeWidgets: event.state.activeWidgets,
        customLayouts: event.state.customLayouts,
        selectedWidgetId: null,
      }
    }),

    startResize: assign(({ event }) => {
      if (event.type !== "START_RESIZE") return {}

      logger.debugSync("Starting widget resize", {
        widgetId: event.widgetId,
        handle: event.handle,
      })

      return {
        isResizing: true,
        resizeWidgetId: event.widgetId,
        resizeHandle: event.handle,
      }
    }),

    updateResize: assign(({ context, event }) => {
      if (event.type !== "UPDATE_RESIZE" || !context.resizeWidgetId) return {}

      return {
        activeWidgets: context.activeWidgets.map((widget) =>
          widget.id === context.resizeWidgetId
            ? {
                ...widget,
                bounds: event.bounds,
              }
            : widget,
        ),
      }
    }),

    endResize: assign(() => {
      logger.debugSync("Ending widget resize")

      return {
        isResizing: false,
        resizeWidgetId: null,
        resizeHandle: null,
        resizeStartBounds: null,
      }
    }),

    // Persist state after any modification
    persistState: ({ context }) => {
      const state: WorkspaceState = {
        currentPresetId: context.currentPresetId,
        activeWidgets: context.activeWidgets,
        customLayouts: context.customLayouts,
        version: WORKSPACE_VERSION,
      }
      debouncedSave(state)
    },
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
    isResizing: false,
    resizeWidgetId: null,
    resizeHandle: null,
    resizeStartBounds: null,
  },
  states: {
    idle: {
      on: {
        SWITCH_PRESET: {
          actions: ["switchPreset", "persistState"],
        },
        ADD_WIDGET: {
          actions: ["addWidget", "persistState"],
        },
        REMOVE_WIDGET: {
          actions: ["removeWidget", "persistState"],
        },
        UPDATE_WIDGET_BOUNDS: {
          actions: ["updateWidgetBounds", "persistState"],
        },
        TOGGLE_WIDGET_VISIBILITY: {
          actions: ["toggleWidgetVisibility", "persistState"],
        },
        MINIMIZE_WIDGET: {
          actions: ["minimizeWidget", "persistState"],
        },
        MAXIMIZE_WIDGET: {
          actions: ["maximizeWidget", "persistState"],
        },
        SELECT_WIDGET: {
          actions: "selectWidget",
        },
        START_DRAG: {
          target: "dragging",
          actions: "startDrag",
        },
        START_RESIZE: {
          target: "resizing",
          actions: "startResize",
        },
        SAVE_CUSTOM_LAYOUT: {
          actions: ["saveCustomLayout", "persistState"],
        },
        DELETE_CUSTOM_LAYOUT: {
          actions: ["deleteCustomLayout", "persistState"],
        },
        RESET_TO_PRESET: {
          actions: ["resetToPreset", "persistState"],
        },
        RESTORE_STATE: {
          actions: "restoreState",
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
          actions: ["endDrag", "persistState"],
        },
      },
    },
    resizing: {
      on: {
        UPDATE_RESIZE: {
          actions: "updateResize",
        },
        END_RESIZE: {
          target: "idle",
          actions: ["endResize", "persistState"],
        },
      },
    },
  },
})

export type WorkspaceLayoutMachine = typeof workspaceLayoutMachine
export type WorkspaceLayoutEvent = LayoutEvent
export type WorkspaceLayoutContext = LayoutContext
