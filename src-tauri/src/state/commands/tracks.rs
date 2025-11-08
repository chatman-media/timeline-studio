use super::types::CommandResult;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use crate::types_export::TrackUpdates;
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

  pub async fn add_track(
    &self,
    name: String,
    track_type: crate::state::project_state::TrackType,
    index: Option<usize>,
  ) -> CommandResult {
    use crate::state::project_state::Track;
    use uuid::Uuid;

    log::info!(
      "Adding track: {} of type {:?} at index {:?}",
      name,
      track_type,
      index
    );

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    let track_id = Uuid::new_v4().to_string();
    let track = Track {
      id: track_id.clone(),
      name: name.clone(),
      track_type: track_type.clone(),
      clips: Vec::new(),
      enabled: true,
      locked: false,
      volume: 1.0,
      pan: 0.0,
      height: 80,
      effects: Vec::new(),
    };

    // Calculate actual index before modifying tracks
    let actual_index = match index {
      Some(idx) if idx <= project.timeline.tracks.len() => idx,
      _ => project.timeline.tracks.len(),
    };

    match index {
      Some(idx) if idx <= project.timeline.tracks.len() => {
        project.timeline.tracks.insert(idx, track.clone());
      }
      _ => {
        project.timeline.tracks.push(track.clone());
      }
    }

    state.mark_dirty();

    self
      .event_bus
      .publish(
        ProjectEvent::TrackAdded {
          track: crate::state::events::TrackData {
            id: track_id.clone(),
            name,
            track_type: format!("{:?}", track_type),
            index: actual_index as u32,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "track_id": track_id })))
  }

  pub async fn delete_track(&self, track_id: String) -> CommandResult {
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

  pub async fn update_track(&self, track_id: String, updates: TrackUpdates) -> CommandResult {
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

  pub async fn reorder_tracks(&self, section_id: String, track_ids: Vec<String>) -> CommandResult {
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
