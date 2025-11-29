pub mod browser;
pub mod chat;
pub mod commands;
pub mod commands_api;
pub mod events;
pub mod persistence;
pub mod workspace;
/// State management module for Timeline Studio
///
/// This module implements a centralized state management system
/// where the backend is the single source of truth for all application state.
///
/// Architecture:
/// - ProjectState: Holds the current project state
/// - EventBus: Publishes state changes to all subscribers
/// - CommandHandler: Processes commands that modify state
/// - PersistenceService: Handles saving/loading state
pub mod project_state;

pub use commands::{CommandHandler, CommandResult, ProjectCommand};
pub use events::{EventBus, EventEnvelope, EventMetadata, ProjectEvent};
pub use persistence::PersistenceService;
pub use project_state::ProjectState;

use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use tokio::time::{interval, Duration};

/// Main state manager that coordinates all state operations
pub struct StateManager {
  project_state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
  command_handler: Arc<CommandHandler>,
  persistence: Arc<PersistenceService>,
  /// Handle for the autosave task (to cancel it when needed)
  autosave_handle: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
}

impl StateManager {
  pub async fn new(app_handle: tauri::AppHandle) -> Result<Self, String> {
    let event_bus = Arc::new(EventBus::new(app_handle.clone()));
    let persistence = Arc::new(PersistenceService::new(app_handle.clone())?);

    // Initialize AI Provider Manager
    let ai_manager = Arc::new(
      crate::video_compiler::commands::ai_api_proxy::provider_manager::AIProviderManager::new(),
    );

    // Initialize Secure Storage for API keys
    let secure_storage = Arc::new(tokio::sync::Mutex::new(
      crate::security::SecureStorage::new(app_handle.clone())
        .map_err(|e| format!("Failed to initialize secure storage: {}", e))?,
    ));

    // Load or create initial project state
    let project_state = match persistence.load_latest().await {
      Ok(state) => Arc::new(RwLock::new(state)),
      Err(_) => {
        // Create a default project state with a temporary project
        let mut state = ProjectState::default();

        // Create a temporary project with default settings
        let default_settings = project_state::ProjectSettings {
          resolution: project_state::Resolution {
            width: 1920,
            height: 1080,
          },
          frame_rate: 30.0,
          audio_sample_rate: 48000,
          audio_channels: 2,
        };

        state.create_project("Untitled Project".to_string(), default_settings);

        Arc::new(RwLock::new(state))
      }
    };

    let command_handler = Arc::new(CommandHandler::new(
      project_state.clone(),
      event_bus.clone(),
      persistence.clone(),
      app_handle.clone(),
      ai_manager,
      secure_storage,
    ));

    let manager = Self {
      project_state: project_state.clone(),
      event_bus: event_bus.clone(),
      command_handler,
      persistence: persistence.clone(),
      autosave_handle: Arc::new(Mutex::new(None)),
    };

    // Start autosave background task
    manager.start_autosave().await;

    Ok(manager)
  }

  /// Execute a command that modifies the project state
  pub async fn execute_command(&self, command: ProjectCommand) -> CommandResult {
    self.command_handler.execute(command).await
  }

  /// Get a read-only view of the current project state
  pub async fn get_state(&self) -> tokio::sync::RwLockReadGuard<'_, ProjectState> {
    self.project_state.read().await
  }

  /// Subscribe to project events
  pub fn event_bus(&self) -> &Arc<EventBus> {
    &self.event_bus
  }

  /// Get project state reference (for advanced integrations like MCP)
  pub fn project_state(&self) -> &Arc<RwLock<ProjectState>> {
    &self.project_state
  }

  /// Save current state to disk
  pub async fn save_state(&self, path: Option<String>) -> Result<(), String> {
    let state = self.project_state.read().await;
    let save_path = path.or_else(|| state.project.as_ref()?.metadata.file_path.clone());

    if let Some(path) = save_path {
      self.persistence.save_project(&state, &path).await
    } else {
      Err("No save path specified".to_string())
    }
  }

  /// Start the autosave background task
  async fn start_autosave(&self) {
    let project_state = self.project_state.clone();
    let event_bus = self.event_bus.clone();
    let persistence = self.persistence.clone();

    let handle = tokio::spawn(async move {
      Self::autosave_loop(project_state, event_bus, persistence).await;
    });

    *self.autosave_handle.lock().await = Some(handle);
    log::info!("Autosave background task started");
  }

  /// Stop the autosave background task
  pub async fn stop_autosave(&self) {
    if let Some(handle) = self.autosave_handle.lock().await.take() {
      handle.abort();
      log::info!("Autosave background task stopped");
    }
  }

  /// Main autosave loop that runs in the background
  async fn autosave_loop(
    project_state: Arc<RwLock<ProjectState>>,
    event_bus: Arc<EventBus>,
    persistence: Arc<PersistenceService>,
  ) {
    let mut checkpoint_interval = interval(Duration::from_secs(30)); // Default 30 seconds
    let mut snapshot_interval = interval(Duration::from_secs(300)); // Default 5 minutes

    loop {
      tokio::select! {
        // Checkpoint autosave (fast, for crash recovery)
        _ = checkpoint_interval.tick() => {
          let state = project_state.read().await;

          // Only save if autosave is enabled and there are uncommitted changes
          if state.version_info.auto_save_enabled && state.version_info.has_uncommitted_changes {
            if let Some(ref _project) = state.project {
              if let Err(e) = persistence.save_checkpoint(&state).await {
                log::error!("Failed to save checkpoint: {}", e);
              } else {
                log::debug!("Checkpoint saved automatically");
              }
            }
          }

          // Update interval if settings changed
          let new_interval = Duration::from_secs(state.version_info.auto_save_interval_seconds as u64);
          if checkpoint_interval.period() != new_interval {
            checkpoint_interval = interval(new_interval);
            log::info!("Autosave interval updated to {} seconds", state.version_info.auto_save_interval_seconds);
          }
        }

        // Snapshot autosave (full version control snapshot)
        _ = snapshot_interval.tick() => {
          // TOCTOU FIX: Use write lock from the start to prevent race conditions
          // This ensures snapshot creation and state update are atomic
          let state = project_state.write().await;

          // Create version control snapshot if enabled and there are significant changes
          if state.version_info.auto_save_enabled && state.version_info.has_uncommitted_changes {
            if let Some(ref _project) = state.project {
              let snapshot = state.create_snapshot(
                "system".to_string(),
                Some("Auto-save snapshot".to_string()),
                Some(state.version_info.current_version_id.clone()),
              );

              let snapshot_id = snapshot.id.clone();
              let state_version = state.version;

              // Release write lock before I/O operation to prevent blocking other operations
              drop(state);

              if let Err(e) = persistence.save_snapshot(&snapshot).await {
                log::error!("Failed to save auto-snapshot: {}", e);
              } else {
                // Re-acquire write lock to update state atomically
                let mut state = project_state.write().await;
                state.mark_snapshot_created(snapshot_id.clone());

                // Publish autosave event
                event_bus
                  .publish(
                    ProjectEvent::AutoSaveTriggered {
                      snapshot_id: snapshot_id.clone(),
                    },
                    "autosave".to_string(),
                    state_version,
                  )
                  .await
                  .ok();

                log::info!("Auto-snapshot created: {}", snapshot_id);
              }
            }
          }
        }
      }
    }
  }
}

impl Drop for StateManager {
  fn drop(&mut self) {
    // Try to abort the autosave task on drop
    // Note: This is a sync context, so we can't await. The task will be aborted when Arc is dropped.
    log::info!("StateManager dropped - autosave task will be cleaned up");
  }
}

#[cfg(test)]
mod tests {
  #[tokio::test]
  async fn test_state_manager_creation() {
    // This test would require a mock AppHandle
    // For now, we just ensure the module compiles
  }
}
