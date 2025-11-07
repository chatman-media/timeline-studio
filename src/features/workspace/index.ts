/**
 * Workspace Feature Exports
 *
 * Widget-based workspace layout system
 */

export { LayoutPresetSelector } from "./components/layout-preset-selector"
// Components
export { WidgetContainer } from "./components/widget-container"
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
  type WorkspaceLayoutContext,
  type WorkspaceLayoutEvent,
  type WorkspaceLayoutMachine,
  workspaceLayoutMachine,
} from "./services/workspace-layout-machine"
// Provider & Hook
export { useWorkspaceLayout, WorkspaceLayoutProvider } from "./services/workspace-layout-provider"
// Types
export type { LayoutPreset, Widget, WidgetBounds, WidgetType, WorkspaceLayout } from "./types/widget"
