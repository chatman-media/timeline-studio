/**
 * Workspace Layout Provider
 *
 * React context provider for workspace layout state
 */

"use client"

import { useActor } from "@xstate/react"
import { createContext, type ReactNode, useContext } from "react"

import { createLogger } from "@/lib/tauri-logger"

import type { Widget, WidgetBounds } from "../types/widget"
import { type WorkspaceLayoutEvent, workspaceLayoutMachine } from "./workspace-layout-machine"

const logger = createLogger("WorkspaceLayoutProvider")

interface WorkspaceLayoutContextValue {
  // State
  currentPresetId: string
  activeWidgets: Widget[]
  customLayouts: any[]
  selectedWidgetId: string | null
  isDragging: boolean

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

  // Raw send for advanced usage
  send: (event: WorkspaceLayoutEvent) => void
}

const WorkspaceLayoutContext = createContext<WorkspaceLayoutContextValue | null>(null)

interface WorkspaceLayoutProviderProps {
  children: ReactNode
}

export function WorkspaceLayoutProvider({ children }: WorkspaceLayoutProviderProps) {
  const [state, send] = useActor(workspaceLayoutMachine)

  const value: WorkspaceLayoutContextValue = {
    // State
    currentPresetId: state.context.currentPresetId,
    activeWidgets: state.context.activeWidgets,
    customLayouts: state.context.customLayouts,
    selectedWidgetId: state.context.selectedWidgetId,
    isDragging: state.context.isDragging,

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

    send,
  }

  return <WorkspaceLayoutContext.Provider value={value}>{children}</WorkspaceLayoutContext.Provider>
}

export function useWorkspaceLayout() {
  const context = useContext(WorkspaceLayoutContext)
  if (!context) {
    throw new Error("useWorkspaceLayout must be used within WorkspaceLayoutProvider")
  }
  return context
}
