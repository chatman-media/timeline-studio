use super::types::CommandResult;
use crate::state::project_state::*;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use chrono::Utc;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Color Grading commands implementation
pub struct ColorGradingCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl ColorGradingCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  /// Apply color grading to a clip
  pub async fn apply_color_grading(
    &self,
    clip_id: String,
    preset_id: Option<String>,
    parameters: serde_json::Value,
  ) -> CommandResult {
    log::info!(
      "Applying color grading to clip {} with preset {:?}",
      clip_id,
      preset_id
    );

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip
    let mut clip_found = false;
    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;
          // Color grading is stored in clip effects
          // We store it as a special effect ID "color-grading-{clip_id}"
          let color_grading_effect_id = format!("color-grading-{}", clip_id);

          // Remove existing color grading if present
          clip.effects.retain(|e| !e.starts_with("color-grading-"));

          // Add new color grading
          clip.effects.push(color_grading_effect_id);
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
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ColorGradingApplied {
          clip_id: clip_id.clone(),
          preset_id: preset_id.clone(),
          parameters: parameters.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "preset_id": preset_id,
      "applied": true
    })))
  }

  /// Save a color grading preset
  pub async fn save_color_grading_preset(
    &self,
    name: String,
    parameters: serde_json::Value,
  ) -> CommandResult {
    log::info!("Saving color grading preset: {}", name);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Generate unique preset ID
    let preset_id = uuid::Uuid::new_v4().to_string();
    let resource_id = format!("preset-{}", preset_id);

    // Create preset resource
    let preset_resource = ColorGradingPresetResource {
      id: resource_id.clone(),
      name: name.clone(),
      preset_id: preset_id.clone(),
      parameters: parameters.clone(),
      added_at: Utc::now().timestamp() as f64,
    };

    // Add to presets pool
    project
      .color_grading_presets_pool
      .insert(resource_id.clone(), preset_resource);
    state.mark_dirty();

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ColorGradingPresetSaved {
          preset_id: preset_id.clone(),
          name: name.clone(),
          parameters: parameters.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "preset_id": preset_id,
      "resource_id": resource_id,
      "name": name
    })))
  }

  /// Delete a color grading preset
  pub async fn delete_color_grading_preset(&self, preset_id: String) -> CommandResult {
    log::info!("Deleting color grading preset: {}", preset_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find and remove preset by preset_id
    let resource_id = format!("preset-{}", preset_id);
    let removed = project.color_grading_presets_pool.remove(&resource_id);

    if removed.is_none() {
      return CommandResult::error(format!("Preset not found: {}", preset_id));
    }

    state.mark_dirty();
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ColorGradingPresetDeleted {
          preset_id: preset_id.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "preset_id": preset_id,
      "deleted": true
    })))
  }

  /// Reset color grading for a clip
  pub async fn reset_color_grading(&self, clip_id: String) -> CommandResult {
    log::info!("Resetting color grading for clip: {}", clip_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and remove color grading
    let mut clip_found = false;
    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;
          // Remove all color-grading effects
          clip.effects.retain(|e| !e.starts_with("color-grading-"));
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
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ColorGradingReset {
          clip_id: clip_id.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "reset": true
    })))
  }

  /// Get all color grading presets
  pub async fn get_color_grading_presets(&self) -> CommandResult {
    log::info!("Getting all color grading presets");

    let state = self.state.read().await;
    let project = match &state.project {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    let presets: Vec<serde_json::Value> = project
      .color_grading_presets_pool
      .values()
      .map(|preset| {
        serde_json::json!({
          "id": preset.preset_id,
          "name": preset.name,
          "parameters": preset.parameters,
          "added_at": preset.added_at
        })
      })
      .collect();

    CommandResult::success(Some(serde_json::json!({
      "presets": presets
    })))
  }
}
