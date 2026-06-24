use super::types::CommandResult;
use crate::project_state::*;
use crate::{EventBus, ProjectEvent, ProjectState};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Legacy Imported Media commands implementation
/// NOTE: With unified architecture (2025-11), all media goes directly to media_pool
/// This struct is kept for backward compatibility but operates on media_pool
pub struct ImportedMediaCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl ImportedMediaCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  // NOTE: add_imported_media is no longer used
  // AddImportedMedia command is redirected to MediaCommands::add_media in handler.rs

  /// Update media metadata (now operates on media_pool)
  pub async fn update_imported_media(
    &self,
    media_id: String,
    updates: serde_json::Value,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Get media item from media_pool (unified storage)
    let media_item = match project.media_pool.items.get_mut(&media_id) {
      Some(item) => item,
      None => return CommandResult::error(format!("Media item not found: {}", media_id)),
    };

    // Apply updates from JSON
    if let Some(duration) = updates.get("duration").and_then(|v| v.as_f64()) {
      media_item.duration = Some(duration);
    }

    if let Some(thumbnail) = updates.get("thumbnail").and_then(|v| v.as_str()) {
      media_item.thumbnail = Some(thumbnail.to_string());
    }

    // 🆕 Update proxy_path if provided (from proxy generation)
    if let Some(proxy_path) = updates.get("proxy_path").and_then(|v| v.as_str()) {
      media_item.proxy_path = Some(proxy_path.to_string());
      log::info!("Updated proxy_path for media {}: {}", media_id, proxy_path);
    }

    if let Some(metadata) = updates.get("metadata") {
      if let Some(format) = metadata.get("format").and_then(|v| v.as_str()) {
        media_item.metadata.format = format.to_string();
      }
      if let Some(bitrate) = metadata.get("bitrate").and_then(|v| v.as_u64()) {
        media_item.metadata.bitrate = Some(bitrate as u32);
      }
      if let Some(resolution) = metadata.get("resolution") {
        if let (Some(width), Some(height)) = (
          resolution.get("width").and_then(|v| v.as_u64()),
          resolution.get("height").and_then(|v| v.as_u64()),
        ) {
          media_item.metadata.resolution = Some(Resolution {
            width: width as u32,
            height: height as u32,
          });
        }
      }

      // Extract video codec from probeData.streams
      // Frontend sends probeData with structure: { streams: [{ codec_type: "video", codec_name: "hevc" }], format: {...} }
      if let Some(streams) = metadata.get("streams").and_then(|v| v.as_array()) {
        for stream in streams {
          if let Some(codec_type) = stream.get("codec_type").and_then(|v| v.as_str()) {
            if codec_type == "video" {
              if let Some(codec_name) = stream.get("codec_name").and_then(|v| v.as_str()) {
                media_item.metadata.codec = Some(codec_name.to_string());
                break;
              }
            }
          }
        }
      }
    }

    // Get codec and proxy_path after extraction to include in event (before mark_dirty)
    let codec = media_item.metadata.codec.clone();
    let proxy_path = media_item.proxy_path.clone();

    // Mark project as dirty since we modified media_pool
    state.mark_dirty();
    let version = state.version;

    // Publish MediaUpdated event (unified event for media_pool)
    self
      .event_bus
      .publish(
        ProjectEvent::MediaUpdated {
          media_id: media_id.clone(),
          changes: crate::events::MediaChanges {
            name: None,
            thumbnail: None,
          },
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    // Also publish legacy event for backward compatibility
    self
      .event_bus
      .publish(
        ProjectEvent::ImportedMediaUpdated {
          media_id: media_id.clone(),
          codec,
          proxy_path,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  // NOTE: remove_imported_media is redirected to MediaCommands::remove_media in handler.rs
  // NOTE: move_to_media_pool is now a no-op (media already in media_pool)
  // NOTE: clear_imported_media is now a no-op (no separate imported_media storage)
}
