/// Tauri commands for state management
use super::{CommandResult, EventEnvelope, ProjectCommand, ProjectState, StateManager};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// Batch command execution request
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BatchCommandRequest {
  /// List of commands to execute in sequence
  pub commands: Vec<ProjectCommand>,
  /// Whether to stop on first error or continue
  pub stop_on_error: bool,
  /// Optional transaction name for debugging
  pub transaction_name: Option<String>,
}

/// Result of batch command execution
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BatchCommandResult {
  /// Results of each command (may be shorter than input if stopped on error)
  pub results: Vec<CommandResult>,
  /// Number of successfully executed commands
  pub success_count: u32,
  /// Number of failed commands
  pub error_count: u32,
  /// Total execution time in milliseconds
  pub execution_time_ms: u32,
  /// Whether the entire batch was successful
  pub success: bool,
  /// Error message if batch failed
  pub error_message: Option<String>,
}

/// Execute a project command
#[tauri::command]
#[specta::specta]
pub async fn execute_command(
  state_manager: State<'_, StateManager>,
  command: ProjectCommand,
) -> Result<CommandResult, String> {
  Ok(state_manager.execute_command(command).await)
}

/// Execute multiple commands in a batch for better performance
#[tauri::command]
#[specta::specta]
pub async fn execute_batch_commands(
  state_manager: State<'_, StateManager>,
  request: BatchCommandRequest,
) -> Result<BatchCommandResult, String> {
  let start_time = std::time::Instant::now();

  let mut results = Vec::new();
  let mut success_count = 0u32;
  let mut error_count = 0u32;
  let mut batch_error = None;

  log::info!(
    "Executing batch of {} commands: {}",
    request.commands.len(),
    request.transaction_name.as_deref().unwrap_or("unnamed")
  );

  // Execute commands sequentially (could be parallelized for independent commands)
  for (index, command) in request.commands.iter().enumerate() {
    log::debug!(
      "Executing command {}/{}: {:?}",
      index + 1,
      request.commands.len(),
      command
    );

    let result = state_manager.execute_command(command.clone()).await;

    if result.success {
      success_count += 1;
    } else {
      error_count += 1;

      if request.stop_on_error {
        batch_error = Some(format!(
          "Batch stopped at command {} due to error: {}",
          index + 1,
          result.error.clone().unwrap_or_default()
        ));
        results.push(result);
        break;
      }
    }

    results.push(result);
  }

  let execution_time_ms = start_time.elapsed().as_millis() as u32;
  let overall_success = error_count == 0 && batch_error.is_none();

  log::info!(
    "Batch execution completed: {}/{} success, {} errors, {}ms",
    success_count,
    request.commands.len(),
    error_count,
    execution_time_ms
  );

  Ok(BatchCommandResult {
    results,
    success_count,
    error_count,
    execution_time_ms,
    success: overall_success,
    error_message: batch_error,
  })
}

/// Get current project state
#[tauri::command]
#[specta::specta]
pub async fn get_project_state(
  state_manager: State<'_, StateManager>,
) -> Result<ProjectState, String> {
  let state = state_manager.get_state().await;
  Ok(state.clone())
}

/// Get event history since a specific version
#[tauri::command]
#[specta::specta]
pub async fn get_event_history(
  state_manager: State<'_, StateManager>,
  since_version: Option<u32>,
) -> Result<Vec<EventEnvelope>, String> {
  let events = state_manager.event_bus().get_history(since_version).await;
  Ok(events)
}

// Subscribe to project events (handled automatically by Tauri event system)
// Frontend should listen to "project:event" events

// Browser commands wrappers
use super::browser::{BrowserTab, SortOrder, ViewMode};

/// Switch browser tab
#[tauri::command]
#[specta::specta]
pub async fn browser_switch_tab(
  state_manager: State<'_, StateManager>,
  tab: BrowserTab,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserSwitchTab { tab }).await;
  Ok(result)
}

/// Set browser search query
#[tauri::command]
#[specta::specta]
pub async fn browser_set_search_query(
  state_manager: State<'_, StateManager>,
  query: String,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserSetSearchQuery { query, tab }).await;
  Ok(result)
}

/// Toggle browser favorites filter
#[tauri::command]
#[specta::specta]
pub async fn browser_toggle_favorites(
  state_manager: State<'_, StateManager>,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserToggleFavorites { tab }).await;
  Ok(result)
}

/// Set browser sort order
#[tauri::command]
#[specta::specta]
pub async fn browser_set_sort(
  state_manager: State<'_, StateManager>,
  sort_by: String,
  sort_order: SortOrder,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserSetSort { sort_by, sort_order, tab }).await;
  Ok(result)
}

/// Set browser group by
#[tauri::command]
#[specta::specta]
pub async fn browser_set_group_by(
  state_manager: State<'_, StateManager>,
  group_by: String,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserSetGroupBy { group_by, tab }).await;
  Ok(result)
}

/// Set browser filter
#[tauri::command]
#[specta::specta]
pub async fn browser_set_filter(
  state_manager: State<'_, StateManager>,
  filter_type: String,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserSetFilter { filter_type, tab }).await;
  Ok(result)
}

/// Set browser view mode
#[tauri::command]
#[specta::specta]
pub async fn browser_set_view_mode(
  state_manager: State<'_, StateManager>,
  view_mode: ViewMode,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserSetViewMode { view_mode, tab }).await;
  Ok(result)
}

/// Set browser preview size
#[tauri::command]
#[specta::specta]
pub async fn browser_set_preview_size(
  state_manager: State<'_, StateManager>,
  size_index: u32,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserSetPreviewSize { size_index, tab }).await;
  Ok(result)
}

/// Reset browser tab settings to defaults
#[tauri::command]
#[specta::specta]
pub async fn browser_reset_tab_settings(
  state_manager: State<'_, StateManager>,
  tab: BrowserTab,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserResetTabSettings { tab }).await;
  Ok(result)
}

/// Select a file in the browser
#[tauri::command]
#[specta::specta]
pub async fn browser_select_file(
  state_manager: State<'_, StateManager>,
  file_id: String,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserSelectFile { file_id, tab }).await;
  Ok(result)
}

/// Deselect a file in the browser
#[tauri::command]
#[specta::specta]
pub async fn browser_deselect_file(
  state_manager: State<'_, StateManager>,
  file_id: String,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserDeselectFile { file_id, tab }).await;
  Ok(result)
}

/// Toggle file selection in the browser
#[tauri::command]
#[specta::specta]
pub async fn browser_toggle_file_selection(
  state_manager: State<'_, StateManager>,
  file_id: String,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserToggleFileSelection { file_id, tab }).await;
  Ok(result)
}

/// Select all files in the browser
#[tauri::command]
#[specta::specta]
pub async fn browser_select_all_files(
  state_manager: State<'_, StateManager>,
  file_ids: Vec<String>,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserSelectAllFiles { file_ids, tab }).await;
  Ok(result)
}

/// Deselect all files in the browser
#[tauri::command]
#[specta::specta]
pub async fn browser_deselect_all_files(
  state_manager: State<'_, StateManager>,
  tab: Option<BrowserTab>,
) -> Result<CommandResult, String> {
  let result = state_manager.execute_command(ProjectCommand::BrowserDeselectAllFiles { tab }).await;
  Ok(result)
}
