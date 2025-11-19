/**
 * Workspace Feature Exports
 *
 * Widget-based workspace layout system
 */

// Components
export { LayoutPresetSelector } from "./components/layout-preset-selector"
export { WidgetContainer } from "./components/widget-container"
export { WidgetDock } from "./components/widget-dock"
export { WidgetWorkspace } from "./components/widget-workspace"

// Layout Presets
export {
  DEFAULT_LAYOUT_PRESET_ID,
  getDefaultLayoutPreset,
  getLayoutPreset,
  LAYOUT_PRESETS,
} from "./config/layout-presets"

// State Machine
export {
  type ResizeHandle,
  type WorkspaceLayoutContext,
  type WorkspaceLayoutEvent,
  type WorkspaceLayoutMachine,
  workspaceLayoutMachine,
} from "./services/workspace-layout-machine"

// Provider & Hook
export { useWorkspaceLayout, WorkspaceLayoutProvider } from "./services/workspace-layout-provider"

// Persistence
export type { WorkspaceState } from "./services/workspace-persistence"
export {
  clearWorkspaceStateLocal,
  isValidWorkspaceState,
  loadWorkspaceState,
  loadWorkspaceStateBackend,
  loadWorkspaceStateLocal,
  saveWorkspaceStateBackend,
  saveWorkspaceStateLocal,
} from "./services/workspace-persistence"

// Types
export type { LayoutPreset, Widget, WidgetBounds, WidgetType, WorkspaceLayout } from "./types/widget"
