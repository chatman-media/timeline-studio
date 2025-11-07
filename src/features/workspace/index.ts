/**
 * Workspace Feature Exports
 *
 * Widget-based workspace layout system
 */

// Types
export type { Widget, WidgetType, WidgetBounds, LayoutPreset, WorkspaceLayout } from "./types/widget"

// Layout Presets
export { LAYOUT_PRESETS, DEFAULT_LAYOUT_PRESET_ID, getLayoutPreset, getDefaultLayoutPreset } from "./config/layout-presets"

// State Machine
export {
  workspaceLayoutMachine,
  type WorkspaceLayoutMachine,
  type WorkspaceLayoutEvent,
  type WorkspaceLayoutContext,
} from "./services/workspace-layout-machine"

// Provider & Hook
export { WorkspaceLayoutProvider, useWorkspaceLayout } from "./services/workspace-layout-provider"

// Components
export { WidgetContainer } from "./components/widget-container"
export { WidgetWorkspace } from "./components/widget-workspace"
export { LayoutPresetSelector } from "./components/layout-preset-selector"
