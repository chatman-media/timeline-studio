/// Workspace state management
///
/// Manages saving and loading workspace state including:
/// - Window positions and sizes
/// - Panel layouts
/// - Recent projects
/// - UI preferences specific to workspace
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Workspace state structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceState {
  /// Window position and size
  pub window: WindowState,
  /// Panel layout configuration
  pub panels: PanelLayout,
  /// Recent projects list
  pub recent_projects: Vec<String>,
  /// Last opened project path
  pub last_project: Option<String>,
  /// UI preferences
  pub ui_preferences: UiPreferences,
}

/// Window state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowState {
  pub x: i32,
  pub y: i32,
  pub width: u32,
  pub height: u32,
  pub maximized: bool,
}

/// Panel layout configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PanelLayout {
  pub timeline_height: u32,
  pub browser_width: u32,
  pub properties_width: u32,
  pub show_browser: bool,
  pub show_properties: bool,
  pub show_timeline: bool,
}

/// UI preferences
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiPreferences {
  pub theme: String,
  pub zoom_level: f32,
  pub snap_to_grid: bool,
  pub show_rulers: bool,
}

impl Default for WorkspaceState {
  fn default() -> Self {
    Self {
      window: WindowState {
        x: 100,
        y: 100,
        width: 1280,
        height: 720,
        maximized: false,
      },
      panels: PanelLayout {
        timeline_height: 300,
        browser_width: 300,
        properties_width: 300,
        show_browser: true,
        show_properties: true,
        show_timeline: true,
      },
      recent_projects: Vec::new(),
      last_project: None,
      ui_preferences: UiPreferences {
        theme: "dark".to_string(),
        zoom_level: 1.0,
        snap_to_grid: true,
        show_rulers: true,
      },
    }
  }
}

impl WorkspaceState {
  /// Get workspace state file path
  fn get_state_file_path() -> Result<PathBuf, String> {
    let config_dir =
      dirs::config_dir().ok_or_else(|| "Failed to get config directory".to_string())?;

    let app_config_dir = config_dir.join("Timeline Studio");
    std::fs::create_dir_all(&app_config_dir)
      .map_err(|e| format!("Failed to create config directory: {e}"))?;

    Ok(app_config_dir.join("workspace.json"))
  }

  /// Load workspace state from file
  pub fn load() -> Result<Self, String> {
    let path = Self::get_state_file_path()?;

    if !path.exists() {
      log::info!("Workspace state file not found, using defaults");
      return Ok(Self::default());
    }

    let content =
      std::fs::read_to_string(&path).map_err(|e| format!("Failed to read workspace state: {e}"))?;

    let state: WorkspaceState = serde_json::from_str(&content)
      .map_err(|e| format!("Failed to parse workspace state: {e}"))?;

    log::info!("Loaded workspace state from {:?}", path);
    Ok(state)
  }

  /// Save workspace state to file
  pub fn save(&self) -> Result<(), String> {
    let path = Self::get_state_file_path()?;

    let content = serde_json::to_string_pretty(self)
      .map_err(|e| format!("Failed to serialize workspace state: {e}"))?;

    std::fs::write(&path, content).map_err(|e| format!("Failed to write workspace state: {e}"))?;

    log::info!("Saved workspace state to {:?}", path);
    Ok(())
  }
}

/// Tauri command to save workspace state
#[tauri::command]
pub async fn save_workspace_state(state: WorkspaceState) -> Result<(), String> {
  state.save()
}

/// Tauri command to load workspace state
#[tauri::command]
pub async fn load_workspace_state() -> Result<WorkspaceState, String> {
  WorkspaceState::load()
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::TempDir;

  #[test]
  fn test_default_workspace_state() {
    let state = WorkspaceState::default();

    assert_eq!(state.window.width, 1280);
    assert_eq!(state.window.height, 720);
    assert_eq!(state.ui_preferences.theme, "dark");
    assert_eq!(state.ui_preferences.zoom_level, 1.0);
  }

  #[test]
  fn test_workspace_state_serialization() {
    let state = WorkspaceState::default();

    let json = serde_json::to_string(&state).unwrap();
    assert!(json.contains("1280"));
    assert!(json.contains("dark"));

    let deserialized: WorkspaceState = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.window.width, state.window.width);
    assert_eq!(
      deserialized.ui_preferences.theme,
      state.ui_preferences.theme
    );
  }

  #[tokio::test]
  async fn test_save_and_load_workspace_state() {
    // Skip in CI where config dir might not be available
    if std::env::var("CI").is_ok() || std::env::var("GITHUB_ACTIONS").is_ok() {
      return;
    }

    let mut state = WorkspaceState::default();
    state.window.width = 1920;
    state.window.height = 1080;
    state.ui_preferences.theme = "light".to_string();

    // Save state
    let save_result = save_workspace_state(state.clone()).await;
    assert!(save_result.is_ok());

    // Load state
    let load_result = load_workspace_state().await;
    assert!(load_result.is_ok());

    let loaded_state = load_result.unwrap();
    assert_eq!(loaded_state.window.width, 1920);
    assert_eq!(loaded_state.window.height, 1080);
    assert_eq!(loaded_state.ui_preferences.theme, "light");
  }
}
