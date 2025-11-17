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
pub use crate::state::commands::undo::UndoAction;
#[allow(unused_imports)]
pub use crate::state::commands::{ClipBatchUpdate, ClipUpdates, MediaUpdates, TrackUpdates};
#[allow(unused_imports)]
pub use crate::state::events::{
  ClipChanges, ClipData, MediaChanges, MediaData, TrackChanges, TrackData,
};
#[allow(unused_imports)]
pub use crate::state::project_state::{
  Clip, EffectResource, FilterResource, Marker, MarkerType, MediaItem, MediaMetadata, MediaPool,
  MediaType, PlaybackState, Project, ProjectMetadata, ProjectSettings, Resolution,
  StyleTemplateResource, SubtitleResource, TemplateResource, Timeline, Track, TrackType,
  Transition, TransitionResource, UiState,
};
#[allow(unused_imports)]
pub use crate::state::{
  CommandResult, EventEnvelope, EventMetadata, ProjectCommand, ProjectEvent, ProjectState,
};

// Browser types
#[allow(unused_imports)]
pub use crate::state::browser::{
  BrowserEvent, BrowserState, BrowserTab, SortOrder, TabSettings, ViewMode,
};

// Proxy generator types
#[allow(unused_imports)]
pub use crate::proxy_generator::{
  ProxyGenerationParams, ProxyGenerationResult,
  Resolution as ProxyResolution,
};

// AI Provider types (unified multi-provider support)
#[allow(unused_imports)]
pub use crate::video_compiler::commands::ai_api_proxy::{
  AIMessage, AIProvider, AITool, AIToolCall, CacheStats, ProviderConfig, ProviderStatus,
  TokenUsage, ToolChoice, UnifiedAIRequest, UnifiedAIResponse, ValidateApiKeyRequest,
  ValidateApiKeyResponse,
};

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
      // Media import commands
      crate::media::commands::import_media_files,
      crate::media::commands::scan_media_directory,
      crate::media::commands::index_media_files,
      // Proxy generation command
      crate::proxy_generator::generate_proxy_command,
      crate::media::commands::search_media_library,
      // Content Classification commands (legacy)
      crate::analysis::commands::classify_video_content,
      crate::analysis::commands::quick_classify_content,
      crate::analysis::commands::get_default_classification_options,
      // 🆕 AI Director commands (comprehensive analysis orchestrator)
      crate::analysis::commands::ai_director_analyze_comprehensive,
      crate::analysis::commands::ai_director_analyze_quick,
      crate::analysis::commands::ai_director_analyze_batch,
      crate::analysis::commands::ai_director_get_capabilities,
      crate::analysis::commands::ai_director_get_default_config,
      crate::analysis::commands::ai_director_validate_config,
      crate::analysis::commands::ai_director_health_check,
      // 🆕 Smart Montage Planner commands
      crate::montage_planner::commands::analyze_montage_videos,
      crate::montage_planner::commands::optimize_montage_plan,
      crate::montage_planner::commands::validate_montage_plan,
      crate::montage_planner::commands::calculate_plan_statistics,
      // 🆕 Unified AI Provider commands (multi-provider support)
      crate::video_compiler::commands::ai_api_proxy::ai_send_unified_request,
      crate::video_compiler::commands::ai_api_proxy::ai_send_request_with_fallback,
      crate::video_compiler::commands::ai_api_proxy::ai_validate_provider,
      crate::video_compiler::commands::ai_api_proxy::ai_get_provider_models,
      crate::video_compiler::commands::ai_api_proxy::ai_get_supported_providers,
      crate::video_compiler::commands::ai_api_proxy::ai_check_providers_health,
      crate::video_compiler::commands::ai_api_proxy::ai_send_request_with_tools,
      // 🆕 AI Secure requests (using stored API keys)
      crate::video_compiler::commands::ai_api_proxy::ai_send_secure_request,
      crate::video_compiler::commands::ai_api_proxy::ai_send_secure_request_with_tools,
      // 🆕 AI Streaming commands (real-time events)
      crate::video_compiler::commands::ai_api_proxy::ai_send_streaming_request,
      crate::video_compiler::commands::ai_api_proxy::ai_send_secure_streaming_request,
      // 🆕 AI Cache commands
      crate::video_compiler::commands::ai_api_proxy::ai_get_cache_stats,
      crate::video_compiler::commands::ai_api_proxy::ai_clear_cache,
      crate::video_compiler::commands::ai_api_proxy::ai_cleanup_expired_cache,
      // 🆕 Script Generation commands (AI-powered)
      crate::analysis::commands::generate_video_script,
      crate::analysis::commands::generate_script_dialogue,
      crate::analysis::commands::generate_script_voiceover,
      crate::analysis::commands::get_default_script_config,
      // 🆕 AI Metadata Generation commands (platform optimization)
      crate::video_compiler::commands::platform_optimization::generate_platform_metadata,
      crate::video_compiler::commands::platform_optimization::generate_multi_platform_metadata,
      crate::video_compiler::commands::platform_optimization::validate_platform_metadata,
      crate::video_compiler::commands::platform_optimization::get_platform_constraints,
      crate::video_compiler::commands::platform_optimization::get_default_metadata_config,
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
