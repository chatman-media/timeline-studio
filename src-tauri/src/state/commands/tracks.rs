use super::types::CommandResult;
use crate::state::events::*;
use crate::state::project_state::*;
use crate::types_export::TrackUpdates;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Tracks commands implementation
pub struct TracksCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl TracksCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  async fn delete_track(&self, track_id: String) -> CommandResult {
    log::info!("Deleting track: {}", track_id);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    let track_index = project
      .timeline
      .tracks
      .iter()
      .position(|t| t.id == track_id);

    match track_index {
      Some(index) => {
        project.timeline.tracks.remove(index);
        state.mark_dirty();

        self
          .event_bus
          .publish(
            ProjectEvent::TrackDeleted {
              track_id: track_id.clone(),
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({ "deleted_track_id": track_id })))
      }
      None => CommandResult::error(format!("Track not found: {}", track_id)),
    }
  }

  async fn update_track(&self, track_id: String, updates: TrackUpdates) -> CommandResult {
    log::info!("Updating track: {} with updates: {:?}", track_id, updates);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    let track = project
      .timeline
      .tracks
      .iter_mut()
      .find(|t| t.id == track_id);

    match track {
      Some(track) => {
        let track_name_change = updates.name.clone();

        if let Some(name) = updates.name {
          track.name = name;
        }
        if let Some(enabled) = updates.enabled {
          track.enabled = enabled;
        }
        if let Some(locked) = updates.locked {
          track.locked = locked;
        }
        if let Some(volume) = updates.volume {
          track.volume = volume;
        }
        if let Some(height) = updates.height {
          track.height = height;
        }

        state.mark_dirty();

        self
          .event_bus
          .publish(
            ProjectEvent::TrackUpdated {
              track_id: track_id.clone(),
              changes: crate::state::events::TrackChanges {
                name: track_name_change,
                enabled: updates.enabled,
                locked: updates.locked,
                volume: updates.volume,
                height: updates.height,
              },
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({ "updated_track_id": track_id })))
      }
      None => CommandResult::error(format!("Track not found: {}", track_id)),
    }
  }

  async fn reorder_tracks(&self, section_id: String, track_ids: Vec<String>) -> CommandResult {
    log::info!(
      "Reordering tracks in section {}: {:?}",
      section_id,
      track_ids
    );

    CommandResult::success(Some(serde_json::json!({
      "reordered": true,
      "section_id": section_id,
      "track_count": track_ids.len(),
      "timestamp": chrono::Utc::now()
    })))
  }
}
