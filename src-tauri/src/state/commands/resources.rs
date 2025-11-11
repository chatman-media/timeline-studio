use super::types::CommandResult;
use crate::state::project_state::*;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use chrono::Utc;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Resource commands implementation
pub struct ResourceCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl ResourceCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  /// Add an effect resource to the project
  pub async fn add_effect(
    &self,
    resource_id: String,
    _resource_type: String,
    data: serde_json::Value,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Check for duplicates
    if project.effects_pool.contains_key(&resource_id) {
      return CommandResult::error(format!("Effect resource already exists: {}", resource_id));
    }

    // Extract name from data
    let name = data
      .get("name")
      .and_then(|v| v.as_str())
      .unwrap_or("Unnamed Effect")
      .to_string();

    // Extract effect_id from data
    let effect_id = data
      .get("id")
      .and_then(|v| v.as_str())
      .unwrap_or(&resource_id)
      .to_string();

    // Extract parameters
    let parameters = data
      .get("parameters")
      .cloned()
      .unwrap_or(serde_json::json!({}));

    // Create effect resource
    let effect_resource = EffectResource {
      id: resource_id.clone(),
      name: name.clone(),
      effect_id,
      parameters,
      added_at: Utc::now().timestamp(),
    };

    // Add to effects pool
    project
      .effects_pool
      .insert(resource_id.clone(), effect_resource);
    state.mark_dirty();

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::EffectAdded {
          effect_id: resource_id.clone(),
          name: name.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "resource_id": resource_id })))
  }

  /// Add a filter resource to the project
  pub async fn add_filter(
    &self,
    resource_id: String,
    _resource_type: String,
    data: serde_json::Value,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Check for duplicates
    if project.filters_pool.contains_key(&resource_id) {
      return CommandResult::error(format!("Filter resource already exists: {}", resource_id));
    }

    // Extract name from data
    let name = data
      .get("name")
      .and_then(|v| v.as_str())
      .unwrap_or("Unnamed Filter")
      .to_string();

    // Extract filter_id from data
    let filter_id = data
      .get("id")
      .and_then(|v| v.as_str())
      .unwrap_or(&resource_id)
      .to_string();

    // Extract parameters
    let parameters = data.get("params").cloned().unwrap_or(serde_json::json!({}));

    // Create filter resource
    let filter_resource = FilterResource {
      id: resource_id.clone(),
      name: name.clone(),
      filter_id,
      parameters,
      added_at: Utc::now().timestamp(),
    };

    // Add to filters pool
    project
      .filters_pool
      .insert(resource_id.clone(), filter_resource);
    state.mark_dirty();

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::FilterAdded {
          filter_id: resource_id.clone(),
          name: name.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "resource_id": resource_id })))
  }

  /// Add a transition resource to the project
  pub async fn add_transition(
    &self,
    resource_id: String,
    _resource_type: String,
    data: serde_json::Value,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Check for duplicates
    if project.transitions_pool.contains_key(&resource_id) {
      return CommandResult::error(format!(
        "Transition resource already exists: {}",
        resource_id
      ));
    }

    // Extract name from data - transitions might have labels object
    let name = data
      .get("labels")
      .and_then(|v| v.get("ru"))
      .or_else(|| data.get("labels").and_then(|v| v.get("en")))
      .and_then(|v| v.as_str())
      .or_else(|| data.get("id").and_then(|v| v.as_str()))
      .unwrap_or("Unnamed Transition")
      .to_string();

    // Extract transition_id from data
    let transition_id = data
      .get("id")
      .and_then(|v| v.as_str())
      .unwrap_or(&resource_id)
      .to_string();

    // Extract parameters
    let parameters = data
      .get("parameters")
      .cloned()
      .unwrap_or(serde_json::json!({}));

    // Create transition resource
    let transition_resource = TransitionResource {
      id: resource_id.clone(),
      name: name.clone(),
      transition_id,
      parameters,
      added_at: Utc::now().timestamp(),
    };

    // Add to transitions pool
    project
      .transitions_pool
      .insert(resource_id.clone(), transition_resource);
    state.mark_dirty();

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::TransitionAdded {
          transition_id: resource_id.clone(),
          name: name.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "resource_id": resource_id })))
  }

  /// Add a template resource to the project
  pub async fn add_template(
    &self,
    resource_id: String,
    _resource_type: String,
    data: serde_json::Value,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Check for duplicates
    if project.templates_pool.contains_key(&resource_id) {
      return CommandResult::error(format!("Template resource already exists: {}", resource_id));
    }

    // Extract name from data
    let name = data
      .get("id")
      .and_then(|v| v.as_str())
      .unwrap_or("Unnamed Template")
      .to_string();

    // Extract template_id from data
    let template_id = data
      .get("id")
      .and_then(|v| v.as_str())
      .unwrap_or(&resource_id)
      .to_string();

    // Create template resource (store full data)
    let template_resource = TemplateResource {
      id: resource_id.clone(),
      name: name.clone(),
      template_id,
      data: data.clone(),
      added_at: Utc::now().timestamp(),
    };

    // Add to templates pool
    project
      .templates_pool
      .insert(resource_id.clone(), template_resource);
    state.mark_dirty();

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::TemplateAdded {
          template_id: resource_id.clone(),
          name: name.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "resource_id": resource_id })))
  }

  /// Add a style template resource to the project
  pub async fn add_style_template(
    &self,
    resource_id: String,
    _resource_type: String,
    data: serde_json::Value,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Check for duplicates
    if project.style_templates_pool.contains_key(&resource_id) {
      return CommandResult::error(format!(
        "Style template resource already exists: {}",
        resource_id
      ));
    }

    // Extract name from data - style templates might have name object with ru/en
    let name = data
      .get("name")
      .and_then(|v| {
        if v.is_string() {
          v.as_str()
        } else {
          v.get("ru").or_else(|| v.get("en")).and_then(|v| v.as_str())
        }
      })
      .unwrap_or("Unnamed Style Template")
      .to_string();

    // Extract template_id from data
    let template_id = data
      .get("id")
      .and_then(|v| v.as_str())
      .unwrap_or(&resource_id)
      .to_string();

    // Create style template resource (store full data)
    let style_template_resource = StyleTemplateResource {
      id: resource_id.clone(),
      name: name.clone(),
      template_id,
      data: data.clone(),
      added_at: Utc::now().timestamp(),
    };

    // Add to style templates pool
    project
      .style_templates_pool
      .insert(resource_id.clone(), style_template_resource);
    state.mark_dirty();

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::StyleTemplateAdded {
          template_id: resource_id.clone(),
          name: name.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "resource_id": resource_id })))
  }

  /// Add a subtitle style resource to the project
  pub async fn add_subtitle(
    &self,
    resource_id: String,
    _resource_type: String,
    data: serde_json::Value,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Check for duplicates
    if project.subtitles_pool.contains_key(&resource_id) {
      return CommandResult::error(format!("Subtitle resource already exists: {}", resource_id));
    }

    // Extract name from data
    let name = data
      .get("name")
      .and_then(|v| v.as_str())
      .unwrap_or("Unnamed Subtitle Style")
      .to_string();

    // Extract style_id from data
    let style_id = data
      .get("id")
      .and_then(|v| v.as_str())
      .unwrap_or(&resource_id)
      .to_string();

    // Create subtitle resource (store full data)
    let subtitle_resource = SubtitleResource {
      id: resource_id.clone(),
      name: name.clone(),
      style_id,
      data: data.clone(),
      added_at: Utc::now().timestamp(),
    };

    // Add to subtitles pool
    project
      .subtitles_pool
      .insert(resource_id.clone(), subtitle_resource);
    state.mark_dirty();

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::SubtitleAdded {
          subtitle_id: resource_id.clone(),
          name: name.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "resource_id": resource_id })))
  }

  /// Remove a resource from the project
  pub async fn remove_resource(&self, resource_id: String, resource_type: String) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Remove from appropriate pool based on resource_type
    let removed = match resource_type.as_str() {
      "effect" => project.effects_pool.remove(&resource_id).is_some(),
      "filter" => project.filters_pool.remove(&resource_id).is_some(),
      "transition" => project.transitions_pool.remove(&resource_id).is_some(),
      "template" => project.templates_pool.remove(&resource_id).is_some(),
      "styleTemplate" => project.style_templates_pool.remove(&resource_id).is_some(),
      "subtitle" => project.subtitles_pool.remove(&resource_id).is_some(),
      _ => return CommandResult::error(format!("Unknown resource type: {}", resource_type)),
    };

    if !removed {
      return CommandResult::error(format!(
        "Resource not found: {} (type: {})",
        resource_id, resource_type
      ));
    }

    state.mark_dirty();
    let version = state.version;

    // Publish appropriate event based on resource_type
    let event = match resource_type.as_str() {
      "effect" => ProjectEvent::EffectRemoved {
        effect_id: resource_id.clone(),
      },
      "filter" => ProjectEvent::FilterRemoved {
        filter_id: resource_id.clone(),
      },
      "transition" => ProjectEvent::TransitionRemoved {
        transition_id: resource_id.clone(),
      },
      "template" => ProjectEvent::TemplateRemoved {
        template_id: resource_id.clone(),
      },
      "styleTemplate" => ProjectEvent::StyleTemplateRemoved {
        template_id: resource_id.clone(),
      },
      "subtitle" => ProjectEvent::SubtitleRemoved {
        subtitle_id: resource_id.clone(),
      },
      _ => return CommandResult::error(format!("Unknown resource type: {}", resource_type)),
    };

    self
      .event_bus
      .publish(event, "command_handler".to_string(), version)
      .await
      .ok();

    CommandResult::success(None)
  }
}
