/**
 * Widget System Types
 *
 * Canonical source in domains/system-integration/types
 *
 * Defines the structure for the widget-based layout system
 */

/**
 * Available widget types in the workspace
 */
export type WidgetType = "timeline" | "player" | "browser" | "options" | "ai-chat" | "ai-suggestions"

/**
 * Widget position and size
 */
export interface WidgetBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Widget configuration
 */
export interface Widget {
  id: string
  type: WidgetType
  bounds: WidgetBounds
  isVisible: boolean
  isMinimized: boolean
  zIndex: number
  // Optional custom config per widget
  config?: Record<string, unknown>
}

/**
 * Layout preset containing multiple widgets
 */
export interface LayoutPreset {
  id: string
  name: string
  description?: string
  icon?: string
  widgets: Widget[]
}

/**
 * Workspace layout state
 */
export interface WorkspaceLayout {
  currentPresetId: string
  presets: LayoutPreset[]
  customLayouts: LayoutPreset[]
  // Current active widgets (can be modified from preset)
  activeWidgets: Widget[]
}

/**
 * Widget drag event data
 */
export interface WidgetDragData {
  widgetId: string
  startBounds: WidgetBounds
}

/**
 * Widget resize event data
 */
export interface WidgetResizeData {
  widgetId: string
  newBounds: WidgetBounds
}
