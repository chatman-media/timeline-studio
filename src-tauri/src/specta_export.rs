//! Module for exporting TypeScript types using Specta
//! This module generates TypeScript bindings for Tauri commands and types

// Re-export types that will be exported to TypeScript
// These are available for use in the TypeScript frontend
#[allow(unused_imports)]
pub use crate::core::events::AppEvent;
#[allow(unused_imports)]
pub use crate::core::plugins::plugin::{
  PluginCommand, PluginDependency, PluginMetadata, PluginResponse, PluginState, PluginType, Version,
};

// State management types
#[allow(unused_imports)]
pub use crate::state::commands::{ClipUpdates, MediaUpdates, TrackUpdates};
#[allow(unused_imports)]
pub use crate::state::events::{
  ClipChanges, ClipData, MediaChanges, MediaData, TrackChanges, TrackData,
};
#[allow(unused_imports)]
pub use crate::state::project_state::{
  Clip, Marker, MarkerType, MediaItem, MediaMetadata, MediaPool, MediaType, PlaybackState, Project,
  ProjectMetadata, ProjectSettings, Resolution, Timeline, Track, TrackType, Transition, UiState,
};
#[allow(unused_imports)]
pub use crate::state::{
  CommandResult, EventEnvelope, EventMetadata, ProjectCommand, ProjectEvent, ProjectState,
};

// Browser types
#[allow(unused_imports)]
pub use crate::state::browser::{BrowserTab, BrowserState, SortOrder, TabSettings, ViewMode, BrowserEvent};

// Simple command for demonstration
#[tauri::command]
#[specta::specta]
pub fn get_app_version() -> String {
  env!("CARGO_PKG_VERSION").to_string()
}

/// Export TypeScript bindings with core commands and comprehensive type definitions
pub fn export_typescript_bindings() {
  // Start with core commands that are guaranteed to exist
  let builder = tauri_specta::Builder::<tauri::Wry>::new()
    .commands(tauri_specta::collect_commands![
      // Core commands that definitely exist
      get_app_version,
      // State management commands (critical for app-state module)
      crate::state::commands_api::execute_command,
      crate::state::commands_api::execute_batch_commands,
      crate::state::commands_api::get_project_state,
      crate::state::commands_api::get_event_history,
      // Browser commands
      crate::state::commands_api::browser_switch_tab,
      crate::state::commands_api::browser_set_search_query,
      crate::state::commands_api::browser_toggle_favorites,
      crate::state::commands_api::browser_set_sort,
      crate::state::commands_api::browser_set_group_by,
      crate::state::commands_api::browser_set_filter,
      crate::state::commands_api::browser_set_view_mode,
      crate::state::commands_api::browser_set_preview_size,
      crate::state::commands_api::browser_reset_tab_settings,
      crate::state::commands_api::browser_select_file,
      crate::state::commands_api::browser_deselect_file,
      crate::state::commands_api::browser_toggle_file_selection,
      crate::state::commands_api::browser_select_all_files,
      crate::state::commands_api::browser_deselect_all_files,
    ])
    .events(tauri_specta::collect_events![]);

  // Create directory if it doesn't exist
  std::fs::create_dir_all("../src/types/generated").ok();

  // Export with comprehensive type configuration
  let ts_config = specta_typescript::Typescript::default()
    .header("// Generated TypeScript bindings for Timeline Studio")
    .header("// This file is auto-generated - do not edit manually")
    .header("")
    .header("import { invoke as TAURI_INVOKE } from '@tauri-apps/api/core'")
    .header("import type { InvokeArgs } from '@tauri-apps/api/core'")
    .header("");

  builder
    .export(ts_config, "../src/types/generated/tauri-bindings.ts")
    .expect("Failed to export TypeScript bindings");

  println!("✅ TypeScript bindings exported with enhanced type definitions!");
  println!("📁 Generated: src/types/generated/tauri-bindings.ts");
}
