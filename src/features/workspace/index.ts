/**
 * Workspace Feature Exports
 *
 * Widget-based workspace layout system
 */

// Components
export { LayoutPresetSelector } from "./components/layout-preset-selector"
export { WidgetContainer } from "./components/widget-container"
export { WidgetWorkspace } from "./components/widget-workspace"
export { WidgetDock } from "./components/widget-dock"

// Layout Presets
export {
  DEFAULT_LAYOUT_PRESET_ID,
  getDefaultLayoutPreset,
  getLayoutPreset,
  LAYOUT_PRESETS,
} from "./config/layout-presets"

// State Machine
export {
  type WorkspaceLayoutContext,
  type WorkspaceLayoutEvent,
  type WorkspaceLayoutMachine,
  type ResizeHandle,
  workspaceLayoutMachine,
} from "./services/workspace-layout-machine"

// Provider & Hook
export { useWorkspaceLayout, WorkspaceLayoutProvider } from "./services/workspace-layout-provider"

// Persistence
export type { WorkspaceState } from "./services/workspace-persistence"
export {
  saveWorkspaceStateLocal,
  loadWorkspaceStateLocal,
  clearWorkspaceStateLocal,
  saveWorkspaceStateBackend,
  loadWorkspaceStateBackend,
  loadWorkspaceState,
  isValidWorkspaceState,
} from "./services/workspace-persistence"

// Types
export type { LayoutPreset, Widget, WidgetBounds, WidgetType, WorkspaceLayout } from "./types/widget"
