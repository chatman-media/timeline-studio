use super::types::CommandResult;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Transitions commands implementation
pub struct TransitionsCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl TransitionsCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  pub async fn remove_transition(&self, clip_id: String, transition_id: String) -> CommandResult {
    log::info!(
      "Removing transition {} from clip {}",
      transition_id,
      clip_id
    );

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and remove transition
    let mut clip_found = false;
    let mut transition_removed = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          // Find and remove transition
          let initial_len = clip.transitions.len();
          clip.transitions.retain(|t| t.id != transition_id);
          transition_removed = clip.transitions.len() < initial_len;

          break;
        }
      }
      if clip_found {
        break;
      }
    }

    if !clip_found {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    if !transition_removed {
      return CommandResult::error(format!("Transition not found on clip: {}", transition_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "removed": true,
      "clip_id": clip_id,
      "transition_id": transition_id
    })))
  }
}
