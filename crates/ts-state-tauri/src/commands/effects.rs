use super::types::CommandResult;
use crate::{EventBus, ProjectEvent, ProjectState};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Effects commands implementation
pub struct EffectsCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl EffectsCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  pub async fn remove_effect(&self, clip_id: String, effect_id: String) -> CommandResult {
    log::info!("Removing effect {} from clip {}", effect_id, clip_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and remove effect
    let mut clip_found = false;
    let mut effect_removed = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          let initial_len = clip.effects.len();
          clip.effects.retain(|e| e != &effect_id);
          effect_removed = clip.effects.len() < initial_len;

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

    if !effect_removed {
      return CommandResult::error(format!("Effect not found on clip: {}", effect_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::events::ClipChanges {
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
      "effect_id": effect_id
    })))
  }

  pub async fn remove_filter(&self, clip_id: String, filter_id: String) -> CommandResult {
    log::info!("Removing filter {} from clip {}", filter_id, clip_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and remove filter
    let mut clip_found = false;
    let mut filter_removed = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          let initial_len = clip.effects.len();
          clip.effects.retain(|e| e != &filter_id);
          filter_removed = clip.effects.len() < initial_len;

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

    if !filter_removed {
      return CommandResult::error(format!("Filter not found on clip: {}", filter_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::events::ClipChanges {
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
      "filter_id": filter_id
    })))
  }
}
