/**
 * Version control types
 * Re-export types from generated Tauri bindings
 */

// The VersionInfo from tauri-bindings is the state, not history item
// So we define our own type for version history items
export interface VersionInfo {
  id: string
  timestamp: string
  author: string
  message?: string
  branch_name: string
}

// This type doesn't exist in generated bindings, so we keep it
export interface VersionControlState {
  current_version_id: string
  branch_name: string
  has_uncommitted_changes: boolean
  last_snapshot_time: string
  auto_save_enabled: boolean
  auto_save_interval_seconds: number
}
