use super::super::project_state::{InterpolationType, Keyframe};
use super::super::{EventBus, ProjectEvent, ProjectState};
use super::types::CommandResult;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Keyframe operations implementation
pub struct KeyframeCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl KeyframeCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  pub async fn add_keyframe(
    &self,
    clip_id: String,
    property: String,
    time: f64,
    value: serde_json::Value,
    interpolation: String,
    ease_in: Option<f64>,
    ease_out: Option<f64>,
  ) -> CommandResult {
    log::info!(
      "Adding keyframe to clip {} for property {} at time {}",
      clip_id,
      property,
      time
    );

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Validate time
    if time < 0.0 {
      return CommandResult::error(format!("Invalid keyframe time: {}", time));
    }

    // Parse interpolation type
    let parsed_interpolation = match interpolation.as_str() {
      "linear" => InterpolationType::Linear,
      "ease-in" => InterpolationType::EaseIn,
      "ease-out" => InterpolationType::EaseOut,
      "ease-in-out" => InterpolationType::EaseInOut,
      "step" => InterpolationType::Step,
      "bezier" => InterpolationType::Bezier {
        control_points: vec![], // Default empty, could be extended
      },
      _ => return CommandResult::error(format!("Invalid interpolation type: {}", interpolation)),
    };

    // Find clip
    let mut clip_found = false;
    let keyframe_id = uuid::Uuid::new_v4().to_string();

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          // Create keyframe
          let keyframe = Keyframe {
            id: keyframe_id.clone(),
            clip_id: clip_id.clone(),
            property: property.clone(),
            time,
            value: value.clone(),
            interpolation: parsed_interpolation.clone(),
            ease_in,
            ease_out,
          };

          // Add keyframe to clip
          clip.keyframes.push(keyframe);

          // Sort keyframes by time
          clip
            .keyframes
            .sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());

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

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: super::super::events::ClipChanges {
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
      "added": true,
      "keyframe_id": keyframe_id,
      "clip_id": clip_id,
      "property": property,
      "time": time
    })))
  }

  pub async fn remove_keyframe(&self, clip_id: String, keyframe_id: String) -> CommandResult {
    log::info!("Removing keyframe {} from clip {}", keyframe_id, clip_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find and remove keyframe
    let mut clip_found = false;
    let mut keyframe_removed = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;
          let initial_len = clip.keyframes.len();
          clip.keyframes.retain(|k| k.id != keyframe_id);
          keyframe_removed = clip.keyframes.len() < initial_len;
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

    if !keyframe_removed {
      return CommandResult::error(format!("Keyframe not found: {}", keyframe_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: super::super::events::ClipChanges {
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
      "keyframe_id": keyframe_id,
      "clip_id": clip_id
    })))
  }

  pub async fn update_keyframe(
    &self,
    clip_id: String,
    keyframe_id: String,
    time: Option<f64>,
    value: Option<serde_json::Value>,
    interpolation: Option<String>,
    ease_in: Option<f64>,
    ease_out: Option<f64>,
  ) -> CommandResult {
    log::info!("Updating keyframe {} in clip {}", keyframe_id, clip_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Validate time if provided
    if let Some(t) = time {
      if t < 0.0 {
        return CommandResult::error(format!("Invalid keyframe time: {}", t));
      }
    }

    // Find and update keyframe
    let mut clip_found = false;
    let mut keyframe_found = false;
    let mut needs_resort = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          for keyframe in &mut clip.keyframes {
            if keyframe.id == keyframe_id {
              keyframe_found = true;

              if let Some(t) = time {
                keyframe.time = t;
                needs_resort = true;
              }
              if let Some(ref v) = value {
                keyframe.value = v.clone();
              }
              if let Some(ref interp_str) = interpolation {
                keyframe.interpolation = match interp_str.as_str() {
                  "linear" => InterpolationType::Linear,
                  "ease-in" => InterpolationType::EaseIn,
                  "ease-out" => InterpolationType::EaseOut,
                  "ease-in-out" => InterpolationType::EaseInOut,
                  "step" => InterpolationType::Step,
                  "bezier" => InterpolationType::Bezier {
                    control_points: vec![],
                  },
                  _ => {
                    return CommandResult::error(format!(
                      "Invalid interpolation type: {}",
                      interp_str
                    ))
                  }
                };
              }
              if ease_in.is_some() {
                keyframe.ease_in = ease_in;
              }
              if ease_out.is_some() {
                keyframe.ease_out = ease_out;
              }

              break;
            }
          }

          // Re-sort if time changed
          if needs_resort {
            clip
              .keyframes
              .sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());
          }

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

    if !keyframe_found {
      return CommandResult::error(format!("Keyframe not found: {}", keyframe_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: super::super::events::ClipChanges {
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
      "updated": true,
      "keyframe_id": keyframe_id,
      "clip_id": clip_id
    })))
  }

  pub async fn clear_property_keyframes(&self, clip_id: String, property: String) -> CommandResult {
    log::info!(
      "Clearing keyframes for property {} in clip {}",
      property,
      clip_id
    );

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find clip and remove keyframes for property
    let mut clip_found = false;
    let mut removed_count = 0;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;
          let initial_len = clip.keyframes.len();
          clip.keyframes.retain(|k| k.property != property);
          removed_count = initial_len - clip.keyframes.len();
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

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: super::super::events::ClipChanges {
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
      "cleared": true,
      "clip_id": clip_id,
      "property": property,
      "removed_count": removed_count
    })))
  }
}
