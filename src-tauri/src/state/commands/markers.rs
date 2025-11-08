use super::super::{EventBus, ProjectEvent, ProjectState};
use super::types::CommandResult;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Marker operations implementation
pub struct MarkerCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl MarkerCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  pub async fn add_marker(
    &self,
    name: String,
    time: f64,
    color: String,
    marker_type: String,
    description: Option<String>,
  ) -> CommandResult {
    log::info!("Adding marker '{}' at time {}", name, time);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Validate time
    if time < 0.0 {
      return CommandResult::error(format!("Invalid marker time: {}", time));
    }

    // Parse marker type
    let parsed_marker_type = match marker_type.as_str() {
      "chapter" => super::super::project_state::MarkerType::Chapter,
      "section" => super::super::project_state::MarkerType::Section,
      "note" => super::super::project_state::MarkerType::Note,
      "export" => super::super::project_state::MarkerType::Export,
      _ => return CommandResult::error(format!("Invalid marker type: {}", marker_type)),
    };

    // Generate marker ID
    let marker_id = uuid::Uuid::new_v4().to_string();

    // Create marker
    let marker = super::super::project_state::Marker {
      id: marker_id.clone(),
      name: name.clone(),
      time,
      color: color.clone(),
      marker_type: parsed_marker_type,
      description: description.clone(),
    };

    // Add to timeline
    project.timeline.markers.push(marker);

    // Sort markers by time
    project
      .timeline
      .markers
      .sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: "timeline".to_string(),
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
      "marker_id": marker_id,
      "name": name,
      "time": time
    })))
  }

  pub async fn remove_marker(&self, marker_id: String) -> CommandResult {
    log::info!("Removing marker {}", marker_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find and remove marker
    let initial_len = project.timeline.markers.len();
    project.timeline.markers.retain(|m| m.id != marker_id);
    let marker_removed = project.timeline.markers.len() < initial_len;

    if !marker_removed {
      return CommandResult::error(format!("Marker not found: {}", marker_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: "timeline".to_string(),
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
      "marker_id": marker_id
    })))
  }

  pub async fn update_marker(
    &self,
    marker_id: String,
    name: Option<String>,
    time: Option<f64>,
    color: Option<String>,
    description: Option<String>,
  ) -> CommandResult {
    log::info!("Updating marker {}", marker_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Validate time if provided
    if let Some(t) = time {
      if t < 0.0 {
        return CommandResult::error(format!("Invalid marker time: {}", t));
      }
    }

    // Find and update marker
    let mut marker_found = false;
    let mut needs_resort = false;

    for marker in &mut project.timeline.markers {
      if marker.id == marker_id {
        marker_found = true;

        if let Some(n) = &name {
          marker.name = n.clone();
        }
        if let Some(t) = time {
          marker.time = t;
          needs_resort = true;
        }
        if let Some(c) = &color {
          marker.color = c.clone();
        }
        if let Some(d) = &description {
          marker.description = Some(d.clone());
        }

        break;
      }
    }

    if !marker_found {
      return CommandResult::error(format!("Marker not found: {}", marker_id));
    }

    // Re-sort if time changed
    if needs_resort {
      project
        .timeline
        .markers
        .sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: "timeline".to_string(),
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
      "marker_id": marker_id
    })))
  }
}
