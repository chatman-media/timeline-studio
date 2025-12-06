use super::types::CommandResult;
use crate::state::project_state::*;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use crate::types_export::MediaUpdates;
use crate::video_compiler::core::ffmpeg::analysis::get_video_metadata;
use std::path::Path;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;

/// Media commands implementation
pub struct MediaCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl MediaCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  /// Add media directly to project's media_pool with full metadata extraction
  pub async fn add_media(&self, path: String, media_type: MediaType) -> CommandResult {
    // Generate unique ID for the media item
    let media_id = uuid::Uuid::new_v4().to_string();

    // Extract file name from path
    let file_name = Path::new(&path)
      .file_name()
      .and_then(|n| n.to_str())
      .unwrap_or("Unknown")
      .to_string();

    // Get current timestamp
    let added_at = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .map(|d| d.as_secs() as f64)
      .unwrap_or(0.0);

    // Extract video metadata if this is a video file
    let (codec, duration, resolution, frame_rate, bitrate) = if media_type == MediaType::Video {
      match get_video_metadata(Path::new(&path)).await {
        Ok(metadata) => {
          log::info!(
            "Extracted video metadata for {}: codec={}",
            file_name,
            metadata.codec
          );
          (
            Some(metadata.codec),
            Some(metadata.duration),
            Some(Resolution {
              width: metadata.width,
              height: metadata.height,
            }),
            Some(metadata.fps),
            Some(metadata.bitrate as u32),
          )
        }
        Err(e) => {
          log::warn!("Failed to extract video metadata for {}: {}", path, e);
          (None, None, None, None, None)
        }
      }
    } else {
      (None, None, None, None, None)
    };

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Check if media with this path already exists in media_pool (prevent duplicates)
    let existing_media = project
      .media_pool
      .items
      .values()
      .find(|item| item.path == path);

    if let Some(existing) = existing_media {
      log::info!(
        "Media already exists in pool, skipping: {} (id: {})",
        path,
        existing.id
      );
      // Return success with existing media ID instead of creating duplicate
      return CommandResult::success(serde_json::json!({
        "id": existing.id,
        "path": existing.path,
        "name": existing.name,
        "already_exists": true
      }));
    }

    // Create media item with full metadata
    let media_item = MediaItem {
      id: media_id.clone(),
      path: path.clone(),
      name: file_name.clone(),
      media_type: media_type.clone(),
      duration,
      metadata: MediaMetadata {
        format: String::new(),
        codec: codec.clone(),
        resolution,
        frame_rate,
        bitrate,
        audio_channels: None,
        sample_rate: None,
        creation_time: None,
      },
      thumbnail: None,
      usage_count: 0,
      in_timeline: false,
      bin: None,
      added_at,
    };

    // Add directly to media pool (persisted with project)
    project
      .media_pool
      .items
      .insert(media_id.clone(), media_item);
    state.mark_dirty();

    let version = state.version;

    // Publish event with full metadata including codec for H.265 detection
    self
      .event_bus
      .publish(
        ProjectEvent::MediaAdded {
          media: crate::state::events::MediaData {
            id: media_id.clone(),
            path: path.clone(),
            name: file_name.clone(),
            media_type: match media_type {
              MediaType::Video => "Video".to_string(),
              MediaType::Audio => "Audio".to_string(),
              MediaType::Image => "Image".to_string(),
            },
            duration,
            codec,
          },
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "media_id": media_id })))
  }

  pub async fn remove_media(&self, media_id: String) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Check if media item exists
    if !project.media_pool.items.contains_key(&media_id) {
      return CommandResult::error(format!("Media item not found: {}", media_id));
    }

    // Remove from media pool
    project.media_pool.items.remove(&media_id);
    state.mark_dirty();

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::MediaRemoved {
          media_id: media_id.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  pub async fn update_media(&self, media_id: String, updates: MediaUpdates) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Get media item and apply updates
    let updated_name = if let Some(media_item) = project.media_pool.items.get_mut(&media_id) {
      if let Some(name) = updates.name {
        media_item.name = name.clone();
        Some(name)
      } else {
        Some(media_item.name.clone())
      }
    } else {
      return CommandResult::error(format!("Media item not found: {}", media_id));
    };

    state.mark_dirty();
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::MediaUpdated {
          media_id: media_id.clone(),
          changes: crate::state::events::MediaChanges {
            name: updated_name,
            thumbnail: None, // Not updating thumbnail in this command
          },
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }
}
