use super::browser::BrowserState;
use super::chat::ChatSession;
use super::commands::PlayerSource;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use uuid::Uuid;

/// The complete project state - single source of truth
#[derive(Debug, Clone, Serialize, Deserialize, Type, Default)]
pub struct ProjectState {
  pub project: Option<Project>,
  pub ui_state: UiState,
  pub playback_state: PlaybackState,
  pub version: u32,
  /// NEW: Version control information
  pub version_info: VersionInfo,
  /// Chat sessions
  pub chat_sessions: Vec<ChatSession>,
  /// Browser state
  pub browser_state: BrowserState,
  /// Clipboard for copy/paste operations
  pub clipboard: Option<ClipboardData>,
  /// Imported media files (temporary storage before adding to media_pool)
  pub imported_media: HashMap<String, MediaItem>,
}

/// Main project structure
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Project {
  pub id: String,
  pub metadata: ProjectMetadata,
  pub timeline: Timeline,
  pub media_pool: MediaPool,
  pub settings: ProjectSettings,
  // Resource pools
  pub effects_pool: HashMap<String, EffectResource>,
  pub filters_pool: HashMap<String, FilterResource>,
  pub transitions_pool: HashMap<String, TransitionResource>,
  pub templates_pool: HashMap<String, TemplateResource>,
  pub style_templates_pool: HashMap<String, StyleTemplateResource>,
  pub subtitles_pool: HashMap<String, SubtitleResource>,
  pub color_grading_presets_pool: HashMap<String, ColorGradingPresetResource>,
}

/// Project metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectMetadata {
  pub name: String,
  pub description: Option<String>,
  pub created_at: DateTime<Utc>,
  pub modified_at: DateTime<Utc>,
  pub file_path: Option<String>,
  pub is_dirty: bool,
  pub version: String,
}

/// Timeline structure
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Timeline {
  pub duration: f64,
  pub fps: f64,
  pub sample_rate: u32,
  pub tracks: Vec<Track>,
  pub markers: Vec<Marker>,
}

/// Track in the timeline
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Track {
  pub id: String,
  pub name: String,
  pub track_type: TrackType,
  pub enabled: bool,
  pub locked: bool,
  pub height: u32,
  pub clips: Vec<Clip>,
  pub effects: Vec<String>, // IDs of applied effects
  pub volume: f32,
  pub pan: f32,
}

/// Track types
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum TrackType {
  Video,
  Audio,
  Title,
  Music,
  Voiceover,
  Sfx,
  Ambient,
}

/// Clip in a track
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Clip {
  pub id: String,
  pub media_id: String, // Reference to MediaPool
  pub name: String,
  pub timeline_in: f64,
  pub timeline_out: f64,
  pub source_in: f64,
  pub source_out: f64,
  pub playback_rate: f64,
  pub enabled: bool,
  pub effects: Vec<String>,
  pub transitions: Vec<Transition>,
  pub keyframes: Vec<Keyframe>,
}

/// Transition between clips
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Transition {
  pub id: String,
  pub transition_type: String,
  pub duration: f64,
  pub params: HashMap<String, serde_json::Value>,
}

/// Keyframe interpolation type
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum InterpolationType {
  Linear,
  EaseIn,
  EaseOut,
  EaseInOut,
  Step,
  Bezier { control_points: Vec<(f64, f64)> },
}

/// Keyframe for clip property animation
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Keyframe {
  pub id: String,
  pub clip_id: String,
  pub property: String, // "opacity", "scale", "position.x", "position.y", "rotation", etc.
  pub time: f64,        // Relative to clip start time
  pub value: serde_json::Value, // Dynamic value - can be number, object, array, etc.
  pub interpolation: InterpolationType,
  pub ease_in: Option<f64>,  // 0.0 - 1.0 for custom easing
  pub ease_out: Option<f64>, // 0.0 - 1.0 for custom easing
}

/// Timeline marker
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Marker {
  pub id: String,
  pub name: String,
  pub time: f64,
  pub color: String,
  pub marker_type: MarkerType,
  pub description: Option<String>,
  // Extended fields for advanced marker functionality
  pub duration: Option<f64>,
  pub tags: Option<Vec<String>>,
  pub linked_markers: Option<Vec<String>>,
  pub created_at: Option<String>,
  pub modified_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum MarkerType {
  Chapter,
  Section,
  Note,
  Export,
  Todo,
  Sync,
  Cue,
  Important,
  Warning,
}

/// Media pool - centralized media storage
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaPool {
  pub items: HashMap<String, MediaItem>,
}

/// Resource pools for effects, filters, transitions, etc.
/// Effect resource
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EffectResource {
  pub id: String,
  pub name: String,
  pub effect_id: String,
  pub parameters: serde_json::Value,
  pub added_at: f64,
}

/// Filter resource
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FilterResource {
  pub id: String,
  pub name: String,
  pub filter_id: String,
  pub parameters: serde_json::Value,
  pub added_at: f64,
}

/// Transition resource
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TransitionResource {
  pub id: String,
  pub name: String,
  pub transition_id: String,
  pub parameters: serde_json::Value,
  pub added_at: f64,
}

/// Template resource
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TemplateResource {
  pub id: String,
  pub name: String,
  pub template_id: String,
  pub data: serde_json::Value,
  pub added_at: f64,
}

/// Style template resource
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct StyleTemplateResource {
  pub id: String,
  pub name: String,
  pub template_id: String,
  pub data: serde_json::Value,
  pub added_at: f64,
}

/// Subtitle style resource
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SubtitleResource {
  pub id: String,
  pub name: String,
  pub style_id: String,
  pub data: serde_json::Value,
  pub added_at: f64,
}

/// Color grading preset resource
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ColorGradingPresetResource {
  pub id: String,
  pub name: String,
  pub preset_id: String,
  pub parameters: serde_json::Value,
  pub added_at: f64,
}

/// Media item in the pool
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaItem {
  pub id: String,
  pub path: String,
  pub name: String,
  pub media_type: MediaType,
  pub duration: Option<f64>,
  pub metadata: MediaMetadata,
  pub thumbnail: Option<String>,
  pub usage_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub enum MediaType {
  Video,
  Audio,
  Image,
}

/// Media metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaMetadata {
  pub format: String,
  pub codec: Option<String>,
  pub resolution: Option<Resolution>,
  pub frame_rate: Option<f64>,
  pub bitrate: Option<u32>,
  pub audio_channels: Option<u32>,
  pub sample_rate: Option<u32>,
  pub creation_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Resolution {
  pub width: u32,
  pub height: u32,
}

/// Project settings
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectSettings {
  pub resolution: Resolution,
  pub frame_rate: f64,
  pub audio_sample_rate: u32,
  pub audio_channels: u32,
}

/// UI state (not persisted, but synchronized)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UiState {
  pub selected_clips: Vec<String>,
  pub selected_tracks: Vec<String>,
  pub selected_sections: Vec<String>,
  pub timeline_zoom: f64,
  pub timeline_scroll: f64,
  pub active_tool: String,
  pub browser_state: Option<serde_json::Value>,
}

impl Default for UiState {
  fn default() -> Self {
    Self {
      selected_clips: Vec::new(),
      selected_tracks: Vec::new(),
      selected_sections: Vec::new(),
      timeline_zoom: 1.0,
      timeline_scroll: 0.0,
      active_tool: "select".to_string(),
      browser_state: None,
    }
  }
}

/// Playback state
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PlaybackState {
  // Basic playback
  pub is_playing: bool,
  pub current_time: f64,
  pub playback_rate: f64,
  pub loop_enabled: bool,
  pub loop_start: Option<f64>,
  pub loop_end: Option<f64>,

  // Player state
  pub volume: f32,
  pub current_media_id: Option<String>,
  pub selected_clip_id: Option<String>,
  pub video_source: PlayerSource,

  // Applied resources
  pub applied_effects: Vec<AppliedEffect>,
  pub applied_filters: Vec<AppliedFilter>,
  pub applied_template: Option<AppliedTemplate>,

  // Player flags
  pub is_loading: bool,
  pub is_seeking: bool,
  pub duration: f64,
}

/// Applied effect
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppliedEffect {
  pub id: String,
  pub effect_id: String,
  pub params: serde_json::Value,
  pub enabled: bool,
}

/// Applied filter
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppliedFilter {
  pub id: String,
  pub filter_id: String,
  pub params: serde_json::Value,
  pub enabled: bool,
}

/// Applied template
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppliedTemplate {
  pub id: String,
  pub template_id: String,
  pub media_ids: Vec<String>,
  pub params: serde_json::Value,
}

impl Default for PlaybackState {
  fn default() -> Self {
    Self {
      // Basic playback
      is_playing: false,
      current_time: 0.0,
      playback_rate: 1.0,
      loop_enabled: false,
      loop_start: None,
      loop_end: None,

      // Player state
      volume: 1.0,
      current_media_id: None,
      selected_clip_id: None,
      video_source: PlayerSource::Browser,

      // Applied resources
      applied_effects: Vec::new(),
      applied_filters: Vec::new(),
      applied_template: None,

      // Player flags
      is_loading: false,
      is_seeking: false,
      duration: 0.0,
    }
  }
}

/// Version control information
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VersionInfo {
  pub current_version_id: String,
  pub branch_name: String,
  pub has_uncommitted_changes: bool,
  pub last_snapshot_time: DateTime<Utc>,
  pub auto_save_enabled: bool,
  pub auto_save_interval_seconds: u32,
}

impl Default for VersionInfo {
  fn default() -> Self {
    Self {
      current_version_id: "initial".to_string(),
      branch_name: "main".to_string(),
      has_uncommitted_changes: false,
      last_snapshot_time: Utc::now(),
      auto_save_enabled: true,
      auto_save_interval_seconds: 30,
    }
  }
}

/// Project snapshot for version control
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectSnapshot {
  pub id: String,
  pub timestamp: DateTime<Utc>,
  pub author: String,
  pub message: Option<String>,
  pub branch_name: String,

  /// Complete project state at this version
  pub project_state: ProjectState,

  /// Delta from parent version (for storage optimization)
  pub parent_id: Option<String>,
  pub delta: Option<ProjectStateDelta>,
}

/// Delta representing changes between two ProjectState versions
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectStateDelta {
  pub timeline_changes: Vec<TimelineChange>,
  pub media_pool_changes: Vec<MediaPoolChange>,
  pub settings_changes: Vec<SettingsChange>,
  pub ui_state_changes: Vec<UiStateChange>,
  pub playback_changes: Vec<PlaybackChange>,
}

/// Clipboard data for copy/paste operations
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ClipboardData {
  pub clips: Vec<Clip>,
  pub copied_at: DateTime<Utc>,
  pub original_track_ids: Vec<String>,
}

/// Types of changes for delta compression
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum TimelineChange {
  TrackAdded {
    track: Track,
  },
  TrackRemoved {
    track_id: String,
  },
  TrackModified {
    track_id: String,
    changes: serde_json::Value,
  },
  ClipAdded {
    track_id: String,
    clip: Clip,
  },
  ClipRemoved {
    clip_id: String,
  },
  ClipMoved {
    clip_id: String,
    new_track_id: String,
    new_timeline_in: f64,
  },
  ClipModified {
    clip_id: String,
    changes: serde_json::Value,
  },
  MarkerAdded {
    marker: Marker,
  },
  MarkerRemoved {
    marker_id: String,
  },
  MarkerModified {
    marker_id: String,
    changes: serde_json::Value,
  },
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum MediaPoolChange {
  MediaAdded {
    media: MediaItem,
  },
  MediaRemoved {
    media_id: String,
  },
  MediaModified {
    media_id: String,
    changes: serde_json::Value,
  },
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum SettingsChange {
  Resolution { old: Resolution, new: Resolution },
  FrameRate { old: f64, new: f64 },
  AudioSampleRate { old: u32, new: u32 },
  AudioChannels { old: u32, new: u32 },
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum UiStateChange {
  Selection {
    clips: Vec<String>,
    tracks: Vec<String>,
  },
  TimelineZoom {
    zoom: f64,
  },
  TimelineScroll {
    scroll: f64,
  },
  ActiveTool {
    tool: String,
  },
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum PlaybackChange {
  PlayState { is_playing: bool },
  CurrentTime { time: f64 },
  PlaybackRate { rate: f64 },
  Volume { volume: f32 },
  MediaId { media_id: Option<String> },
  SelectedClipId { clip_id: Option<String> },
}

impl ProjectState {
  /// Create a new project
  pub fn create_project(&mut self, name: String, settings: ProjectSettings) -> String {
    let project_id = Uuid::new_v4().to_string();
    let now = Utc::now();

    let project = Project {
      id: project_id.clone(),
      metadata: ProjectMetadata {
        name,
        description: None,
        created_at: now,
        modified_at: now,
        file_path: None,
        is_dirty: false,
        version: "1.0.0".to_string(),
      },
      timeline: Timeline {
        duration: 0.0,
        fps: settings.frame_rate,
        sample_rate: settings.audio_sample_rate,
        tracks: Vec::new(),
        markers: Vec::new(),
      },
      media_pool: MediaPool {
        items: HashMap::new(),
      },
      settings,
      // Initialize empty resource pools
      effects_pool: HashMap::new(),
      filters_pool: HashMap::new(),
      transitions_pool: HashMap::new(),
      templates_pool: HashMap::new(),
      style_templates_pool: HashMap::new(),
      subtitles_pool: HashMap::new(),
      color_grading_presets_pool: HashMap::new(),
    };

    self.project = Some(project);

    // Очищаем browser_state при создании нового проекта
    // Очищаем выбранные файлы во всех табах
    for tab in BrowserState::all_tabs() {
      self.browser_state.selected_files.insert(tab, Vec::new());
    }

    // Очищаем imported_media (временное хранилище файлов браузера)
    self.imported_media.clear();

    // Очищаем chat_sessions (историю чата)
    self.chat_sessions.clear();

    // Очищаем clipboard
    self.clipboard = None;

    // Сбрасываем playback_state
    self.playback_state = PlaybackState::default();

    self.version += 1;
    self.version_info.has_uncommitted_changes = true;

    project_id
  }

  /// Mark project as dirty
  pub fn mark_dirty(&mut self) {
    if let Some(ref mut project) = self.project {
      project.metadata.is_dirty = true;
      project.metadata.modified_at = Utc::now();
    }
    self.version += 1;
    self.version_info.has_uncommitted_changes = true;
  }

  /// Update playback state
  pub fn update_playback(&mut self, is_playing: bool, current_time: f64) {
    self.playback_state.is_playing = is_playing;
    self.playback_state.current_time = current_time;
    self.version += 1;
    // Playback changes don't mark project as dirty for version control
  }

  /// NEW: Create a snapshot of the current state
  pub fn create_snapshot(
    &self,
    author: String,
    message: Option<String>,
    parent_id: Option<String>,
  ) -> ProjectSnapshot {
    ProjectSnapshot {
      id: Uuid::new_v4().to_string(),
      timestamp: Utc::now(),
      author,
      message,
      branch_name: self.version_info.branch_name.clone(),
      project_state: self.clone(),
      parent_id,
      delta: None, // TODO: Calculate delta in advanced implementation
    }
  }

  /// NEW: Mark that a snapshot was created
  pub fn mark_snapshot_created(&mut self, version_id: String) {
    self.version_info.current_version_id = version_id;
    self.version_info.has_uncommitted_changes = false;
    self.version_info.last_snapshot_time = Utc::now();
  }

  /// NEW: Switch to a different branch
  pub fn switch_branch(&mut self, branch_name: String) {
    self.version_info.branch_name = branch_name;
    self.version_info.has_uncommitted_changes = true;
    self.version += 1;
  }

  /// NEW: Configure auto-save settings
  pub fn configure_auto_save(&mut self, enabled: bool, interval_seconds: u32) {
    self.version_info.auto_save_enabled = enabled;
    self.version_info.auto_save_interval_seconds = interval_seconds;
  }
}
