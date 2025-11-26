use super::types::CommandResult;
use crate::state::project_state::*;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use crate::video_compiler::core::ffmpeg::analysis::get_video_metadata;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Imported Media commands implementation
/// Manages temporary imported media storage before adding to media_pool
pub struct ImportedMediaCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
}

impl ImportedMediaCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self { state, event_bus }
  }

  /// Add media to temporary imported storage
  pub async fn add_imported_media(&self, path: String, media_type: MediaType) -> CommandResult {
    // Generate unique ID for the media item
    let media_id = uuid::Uuid::new_v4().to_string();

    // Extract file name from path
    let file_name = Path::new(&path)
      .file_name()
      .and_then(|n| n.to_str())
      .unwrap_or("Unknown")
      .to_string();

    // Extract video codec if this is a video file
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

    // Create media item
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
    };

    // Add to imported media (temporary storage)
    state.imported_media.insert(media_id.clone(), media_item);

    let version = state.version;

    // Publish event with codec info for immediate H.265 detection on frontend
    self
      .event_bus
      .publish(
        ProjectEvent::ImportedMediaAdded {
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
            codec, // Now includes codec for H.265/HEVC detection
          },
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "media_id": media_id })))
  }

  /// Update imported media metadata
  pub async fn update_imported_media(
    &self,
    media_id: String,
    updates: serde_json::Value,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    // Get media item and apply updates
    let media_item = match state.imported_media.get_mut(&media_id) {
      Some(item) => item,
      None => return CommandResult::error(format!("Imported media item not found: {}", media_id)),
    };

    // Apply updates from JSON
    if let Some(duration) = updates.get("duration").and_then(|v| v.as_f64()) {
      media_item.duration = Some(duration);
    }

    if let Some(thumbnail) = updates.get("thumbnail").and_then(|v| v.as_str()) {
      media_item.thumbnail = Some(thumbnail.to_string());
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

    // Get codec after extraction to include in event
    let codec = media_item.metadata.codec.clone();
    let version = state.version;

    // Publish event with codec info for H.265 detection on frontend
    self
      .event_bus
      .publish(
        ProjectEvent::ImportedMediaUpdated {
          media_id: media_id.clone(),
          codec,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  /// Remove media from imported storage
  pub async fn remove_imported_media(&self, media_id: String) -> CommandResult {
    let mut state = self.state.write().await;

    if !state.imported_media.contains_key(&media_id) {
      return CommandResult::error(format!("Imported media item not found: {}", media_id));
    }

    state.imported_media.remove(&media_id);

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ImportedMediaRemoved {
          media_id: media_id.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  /// Move imported media to media_pool (when user clicks green checkmark)
  pub async fn move_to_media_pool(&self, media_id: String) -> CommandResult {
    let mut state = self.state.write().await;

    // Get media item from imported storage first (before borrowing project)
    let media_item = match state.imported_media.remove(&media_id) {
      Some(item) => item,
      None => return CommandResult::error(format!("Imported media item not found: {}", media_id)),
    };

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    let media_data = crate::state::events::MediaData {
      id: media_item.id.clone(),
      path: media_item.path.clone(),
      name: media_item.name.clone(),
      media_type: match media_item.media_type {
        MediaType::Video => "Video".to_string(),
        MediaType::Audio => "Audio".to_string(),
        MediaType::Image => "Image".to_string(),
      },
      duration: media_item.duration,
      codec: media_item.metadata.codec.clone(),
    };

    // Add to media pool
    project
      .media_pool
      .items
      .insert(media_item.id.clone(), media_item);
    state.mark_dirty();

    let version = state.version;

    // Publish events
    self
      .event_bus
      .publish(
        ProjectEvent::ImportedMediaRemoved {
          media_id: media_id.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    self
      .event_bus
      .publish(
        ProjectEvent::MediaAdded { media: media_data },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  /// Clear all imported media
  pub async fn clear_imported_media(&self) -> CommandResult {
    let mut state = self.state.write().await;
    state.imported_media.clear();

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ImportedMediaCleared,
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }
}
