use super::types::CommandResult;
use crate::state::persistence::PersistenceService;
use crate::state::project_state::*;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Project commands implementation
pub struct ProjectCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
  persistence: Arc<PersistenceService>,
}

impl ProjectCommands {
  pub fn new(
    state: Arc<RwLock<ProjectState>>,
    event_bus: Arc<EventBus>,
    persistence: Arc<PersistenceService>,
  ) -> Self {
    Self {
      state,
      event_bus,
      persistence,
    }
  }

  pub async fn create_project(&self, name: String, settings: ProjectSettings) -> CommandResult {
    let project_id = {
      let mut state = self.state.write().await;
      let id = state.create_project(name.clone(), settings);
      state.mark_dirty();
      id
    };

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ProjectCreated {
          project_id: project_id.clone(),
          name,
        },
        "command_handler".to_string(),
        self.state.read().await.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "project_id": project_id })))
  }

  pub async fn open_project(&self, path: String) -> CommandResult {
    log::info!("Opening project from path: {}", path);

    match self.persistence.load_project(&path).await {
      Ok(project_state) => {
        let mut state = self.state.write().await;
        *state = project_state;
        state.mark_dirty();

        self
          .event_bus
          .publish(
            ProjectEvent::ProjectOpened {
              project_id: state.project.as_ref().unwrap().id.clone(),
              path: path.clone(),
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({ "path": path })))
      }
      Err(e) => CommandResult::error(format!("Failed to open project: {}", e)),
    }
  }

  pub async fn save_project(&self, path: Option<String>) -> CommandResult {
    let state = self.state.read().await;

    let project = match &state.project {
      Some(p) => p,
      None => return CommandResult::error("No project to save".to_string()),
    };

    let save_path = path.or(project.metadata.file_path.clone());
    let save_path = match save_path {
      Some(p) => p,
      None => return CommandResult::error("No path specified for saving".to_string()),
    };

    // Save project ID before dropping state
    let project_id = project.id.clone();

    // Save through persistence service
    match self.persistence.save_project(&state, &save_path).await {
      Ok(_) => {
        // Mark as clean
        drop(state);
        let mut state = self.state.write().await;
        if let Some(ref mut project) = state.project {
          project.metadata.is_dirty = false;
          project.metadata.file_path = Some(save_path.clone());
        }

        self
          .event_bus
          .publish(
            ProjectEvent::ProjectSaved {
              project_id,
              path: save_path.clone(),
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({ "path": save_path })))
      }
      Err(e) => CommandResult::error(format!("Failed to save project: {}", e)),
    }
  }

  pub async fn close_project(&self) -> CommandResult {
    log::info!("Closing current project");

    let mut state = self.state.write().await;
    let project_id = state
      .project
      .as_ref()
      .map(|p| p.id.clone())
      .unwrap_or_default();

    state.project = None;
    state.ui_state = Default::default();
    state.mark_dirty();

    self
      .event_bus
      .publish(
        ProjectEvent::ProjectClosed { project_id },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }
}
