/**
 * Workspace Layout Provider
 *
 * React context provider for workspace layout state
 */

"use client"

import { useActor } from "@xstate/react"
import { createContext, type ReactNode, useContext, useEffect } from "react"

import { isValidWorkspaceState, loadWorkspaceState } from "@/domains/system-integration"
import { createLogger } from "@/lib/tauri-logger"

import type { Widget, WidgetBounds } from "../types/widget"
import { type ResizeHandle, type WorkspaceLayoutEvent, workspaceLayoutMachine } from "./workspace-layout-machine"

const logger = createLogger("WorkspaceLayoutProvider")

interface WorkspaceLayoutContextValue {
  // State
  currentPresetId: string
  activeWidgets: Widget[]
  customLayouts: any[]
  selectedWidgetId: string | null
  isDragging: boolean
  isResizing: boolean

  // Actions
  switchPreset: (presetId: string) => void
  addWidget: (widget: Widget) => void
  removeWidget: (widgetId: string) => void
  updateWidgetBounds: (widgetId: string, bounds: WidgetBounds) => void
  toggleWidgetVisibility: (widgetId: string) => void
  minimizeWidget: (widgetId: string) => void
  maximizeWidget: (widgetId: string) => void
  selectWidget: (widgetId: string | null) => void
  saveCustomLayout: (name: string, description?: string) => void
  deleteCustomLayout: (layoutId: string) => void
  resetToPreset: () => void
  startResize: (widgetId: string, handle: ResizeHandle) => void
  updateResize: (bounds: WidgetBounds) => void
  endResize: () => void

  // Raw send for advanced usage
  send: (event: WorkspaceLayoutEvent) => void
}

const WorkspaceLayoutContext = createContext<WorkspaceLayoutContextValue | null>(null)

interface WorkspaceLayoutProviderProps {
  children: ReactNode
}

export function WorkspaceLayoutProvider({ children }: WorkspaceLayoutProviderProps) {
  const [state, send] = useActor(workspaceLayoutMachine)

  // DEBUG: Log initial state
  console.log("[WorkspaceLayoutProvider] Initial state:", {
    currentPresetId: state.context.currentPresetId,
    activeWidgetsCount: state.context.activeWidgets.length,
    activeWidgets: state.context.activeWidgets,
  })

  // Load persisted state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await loadWorkspaceState()
        console.log("[WorkspaceLayoutProvider] Loaded state from storage:", savedState)
        if (savedState && isValidWorkspaceState(savedState)) {
          console.log("[WorkspaceLayoutProvider] Restoring workspace state")
          logger.debugSync("Restoring workspace state from storage")
          send({ type: "RESTORE_STATE", state: savedState })
        } else {
          console.log("[WorkspaceLayoutProvider] No valid saved state, using default")
          logger.debugSync("No valid saved state found, using default preset")
        }
      } catch (error) {
        console.error("[WorkspaceLayoutProvider] Failed to load:", error)
        logger.errorSync("Failed to load workspace state", { error })
      }
    }

    loadState()
  }, [send])

  const value: WorkspaceLayoutContextValue = {
    // State
    currentPresetId: state.context.currentPresetId,
    activeWidgets: state.context.activeWidgets,
    customLayouts: state.context.customLayouts,
    selectedWidgetId: state.context.selectedWidgetId,
    isDragging: state.context.isDragging,
    isResizing: state.context.isResizing,

    // Actions
    switchPreset: (presetId: string) => {
      logger.debugSync("Switching preset from provider", { presetId })
      send({ type: "SWITCH_PRESET", presetId })
    },

    addWidget: (widget: Widget) => {
      logger.debugSync("Adding widget from provider", { widgetId: widget.id })
      send({ type: "ADD_WIDGET", widget })
    },

    removeWidget: (widgetId: string) => {
      logger.debugSync("Removing widget from provider", { widgetId })
      send({ type: "REMOVE_WIDGET", widgetId })
    },

    updateWidgetBounds: (widgetId: string, bounds: WidgetBounds) => {
      send({ type: "UPDATE_WIDGET_BOUNDS", widgetId, bounds })
    },

    toggleWidgetVisibility: (widgetId: string) => {
      send({ type: "TOGGLE_WIDGET_VISIBILITY", widgetId })
    },

    minimizeWidget: (widgetId: string) => {
      send({ type: "MINIMIZE_WIDGET", widgetId })
    },

    maximizeWidget: (widgetId: string) => {
      send({ type: "MAXIMIZE_WIDGET", widgetId })
    },

    selectWidget: (widgetId: string | null) => {
      send({ type: "SELECT_WIDGET", widgetId })
    },

    saveCustomLayout: (name: string, description?: string) => {
      logger.debugSync("Saving custom layout from provider", { name })
      send({ type: "SAVE_CUSTOM_LAYOUT", name, description })
    },

    deleteCustomLayout: (layoutId: string) => {
      logger.debugSync("Deleting custom layout from provider", { layoutId })
      send({ type: "DELETE_CUSTOM_LAYOUT", layoutId })
    },

    resetToPreset: () => {
      logger.debugSync("Resetting to preset from provider")
      send({ type: "RESET_TO_PRESET" })
    },

    startResize: (widgetId: string, handle: ResizeHandle) => {
      logger.debugSync("Starting resize from provider", { widgetId, handle })
      send({ type: "START_RESIZE", widgetId, handle })
    },

    updateResize: (bounds: WidgetBounds) => {
      send({ type: "UPDATE_RESIZE", bounds })
    },

    endResize: () => {
      logger.debugSync("Ending resize from provider")
      send({ type: "END_RESIZE" })
    },

    send,
  }

  return (
    <WorkspaceLayoutContext.Provider value={value} data-oid="m0q:j6j">
      {children}
    </WorkspaceLayoutContext.Provider>
  )
}

export function useWorkspaceLayout() {
  const context = useContext(WorkspaceLayoutContext)
  if (!context) {
    throw new Error("useWorkspaceLayout must be used within WorkspaceLayoutProvider")
  }
  return context
}
