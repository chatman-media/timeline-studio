use super::browser::BrowserEvent;
use super::chat::ChatEvent;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;

/// Events that can occur in the project state
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "payload")]
pub enum ProjectEvent {
  // Project lifecycle events
  ProjectCreated {
    project_id: String,
    name: String,
  },
  ProjectOpened {
    project_id: String,
    path: String,
  },
  ProjectSaved {
    project_id: String,
    path: String,
  },
  ProjectClosed {
    project_id: String,
  },

  // Timeline events
  ClipAdded {
    track_id: String,
    clip: ClipData,
  },
  ClipMoved {
    clip_id: String,
    new_track_id: String,
    new_time: f64,
  },
  ClipTrimmed {
    clip_id: String,
    new_in: f64,
    new_out: f64,
  },
  ClipDeleted {
    clip_id: String,
    track_id: String,
  },
  ClipUpdated {
    clip_id: String,
    changes: ClipChanges,
  },
  ClipSplit {
    original_clip_id: String,
    left_clip: ClipData,
    right_clip: ClipData,
    track_id: String,
  },

  // Track events
  TrackAdded {
    track: TrackData,
  },
  TrackDeleted {
    track_id: String,
  },
  TrackUpdated {
    track_id: String,
    changes: TrackChanges,
  },

  // Media pool events
  MediaAdded {
    media: MediaData,
  },
  MediaRemoved {
    media_id: String,
  },
  MediaUpdated {
    media_id: String,
    changes: MediaChanges,
  },
  MediaImported {
    file_paths: Vec<String>,
  },

  // Playback events
  PlaybackStarted {
    time: f64,
  },
  PlaybackStopped {
    time: f64,
  },
  PlaybackSeeked {
    time: f64,
  },
  PlaybackRateChanged {
    rate: f64,
  },

  // Player events
  PlayerMediaSet {
    media_id: String,
    start_time: Option<f64>,
  },
  PlayerVolumeChanged {
    volume: f32,
  },
  PlayerClipSelected {
    clip_id: String,
  },
  PlayerSelectionCleared,
  PlayerSourceChanged {
    source: super::commands::PlayerSource,
  },
  PlayerEffectApplied {
    effect_id: String,
    effect_name: String,
  },
  PlayerFilterApplied {
    filter_id: String,
    filter_name: String,
  },
  PlayerTemplateApplied {
    template_id: String,
    media_ids: Vec<String>,
  },
  PlayerEffectsCleared,
  PlayerFiltersCleared,
  PlayerTemplateCleared,

  // UI events (for synchronization)
  SelectionChanged {
    selected_clips: Vec<String>,
    selected_tracks: Vec<String>,
  },
  TimelineZoomChanged {
    zoom: f64,
  },
  TimelineScrollChanged {
    scroll: f64,
  },

  // State events
  ProjectDirtyStateChanged {
    is_dirty: bool,
  },
  StateRestored {
    version: u32,
  },

  // NEW: Version control events
  SnapshotCreated {
    version_id: String,
    message: Option<String>,
    parent_version: Option<String>,
  },
  VersionRestored {
    version_id: String,
    previous_version: String,
  },
  BranchCreated {
    branch_name: String,
    base_version: String,
  },
  BranchSwitched {
    from_branch: String,
    to_branch: String,
  },
  AutoSaveTriggered {
    snapshot_id: String,
  },
  MergeCompleted {
    source_branch: String,
    target_branch: String,
    result_version: String,
  },
  AutoSaveConfigChanged {
    enabled: bool,
    interval_seconds: u32,
  },

  // Browser events
  Browser(BrowserEvent),

  // Chat events
  Chat(ChatEvent),

  // System Integration events
  ModalOpened {
    modal_type: String,
    modal_data: Option<serde_json::Value>,
  },
  ModalClosed,
  ModalSubmitted {
    data: Option<serde_json::Value>,
  },
  NotificationShown {
    notification: super::commands::SystemNotification,
  },
  NotificationDismissed {
    id: String,
  },
  NotificationsCleared,
  UpdateCheckStarted,
  UpdateCheckCompleted {
    has_update: bool,
  },
  UpdateAvailable {
    update_info: super::commands::UpdateInfo,
  },
  UpdateDownloadStarted,
  UpdateDownloadCompleted,
  UpdateInstallStarted,
  UpdateDismissed,
  AutoUpdateEnabled {
    interval_minutes: u32,
  },
  AutoUpdateDisabled,
  FeatureToggled {
    feature: String,
    enabled: bool,
  },

  // AI Streaming events
  StreamingChunk {
    data: serde_json::Value,
  },
  StreamingComplete {
    data: serde_json::Value,
  },
}

/// Event metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EventMetadata {
  pub id: String,
  pub timestamp: DateTime<Utc>,
  pub source: String,
  pub version: u32,
}

/// Complete event with metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EventEnvelope {
  pub metadata: EventMetadata,
  pub event: ProjectEvent,
}

/// Event bus for publishing state changes
pub struct EventBus {
  app_handle: AppHandle,
  event_store: Arc<RwLock<Vec<EventEnvelope>>>,
  max_events: usize,
}

impl EventBus {
  pub fn new(app_handle: AppHandle) -> Self {
    Self {
      app_handle,
      event_store: Arc::new(RwLock::new(Vec::new())),
      max_events: 1000, // Keep last 1000 events for history
    }
  }

  /// Publish an event to all subscribers
  pub async fn publish(
    &self,
    event: ProjectEvent,
    source: String,
    version: u32,
  ) -> Result<(), String> {
    let envelope = EventEnvelope {
      metadata: EventMetadata {
        id: uuid::Uuid::new_v4().to_string(),
        timestamp: Utc::now(),
        source,
        version,
      },
      event: event.clone(),
    };

    // Store event in history
    {
      let mut store = self.event_store.write().await;
      store.push(envelope.clone());

      // Trim old events if necessary
      let store_len = store.len();
      if store_len > self.max_events {
        store.drain(0..store_len - self.max_events);
      }
    }

    // Emit to frontend
    self
      .app_handle
      .emit("project:event", &envelope)
      .map_err(|e| format!("Failed to emit event: {}", e))?;

    // Log event
    log::debug!("Published event: {:?}", event);

    Ok(())
  }

  /// Get event history
  pub async fn get_history(&self, since_version: Option<u32>) -> Vec<EventEnvelope> {
    let store = self.event_store.read().await;

    match since_version {
      Some(version) => store
        .iter()
        .filter(|e| e.metadata.version > version)
        .cloned()
        .collect(),
      None => store.clone(),
    }
  }

  /// Clear event history
  pub async fn clear_history(&self) {
    let mut store = self.event_store.write().await;
    store.clear();
  }
}

// Event data structures
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ClipData {
  pub id: String,
  pub media_id: String,
  pub name: String,
  pub timeline_in: f64,
  pub timeline_out: f64,
  pub source_in: f64,
  pub source_out: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ClipChanges {
  pub name: Option<String>,
  pub playback_rate: Option<f64>,
  pub volume: Option<f32>,
  pub effects: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TrackData {
  pub id: String,
  pub name: String,
  pub track_type: String,
  pub index: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TrackChanges {
  pub name: Option<String>,
  pub enabled: Option<bool>,
  pub locked: Option<bool>,
  pub volume: Option<f32>,
  pub height: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaData {
  pub id: String,
  pub path: String,
  pub name: String,
  pub media_type: String,
  pub duration: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaChanges {
  pub name: Option<String>,
  pub thumbnail: Option<String>,
}

#[cfg(test)]
mod tests {
  #[tokio::test]
  async fn test_event_history() {
    // This would require a mock AppHandle
    // For now, we ensure the module compiles
  }
}
