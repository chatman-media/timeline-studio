//! Core project data types — Timeline, Tracks, Clips, Media, etc.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_schema::MediaType;
use uuid::Uuid;

#[cfg(feature = "specta")]
use specta::Type;

// ─── Resolution / Settings ───────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct ProjectSettings {
    pub resolution: Resolution,
    pub frame_rate: f64,
    pub audio_sample_rate: u32,
    pub audio_channels: u32,
}

impl Default for ProjectSettings {
    fn default() -> Self {
        Self {
            resolution: Resolution { width: 1920, height: 1080 },
            frame_rate: 30.0,
            audio_sample_rate: 48000,
            audio_channels: 2,
        }
    }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct ProjectMetadata {
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub file_path: Option<String>,
    pub is_dirty: bool,
    pub version: String,
}

// ─── Timeline ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct Timeline {
    pub duration: f64,
    pub fps: f64,
    pub sample_rate: u32,
    pub tracks: Vec<Track>,
    pub markers: Vec<Marker>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct Track {
    pub id: String,
    pub name: String,
    pub track_type: TrackType,
    pub enabled: bool,
    pub locked: bool,
    pub height: u32,
    pub clips: Vec<Clip>,
    pub effects: Vec<String>,
    pub volume: f32,
    pub pan: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[cfg_attr(feature = "specta", derive(Type))]
pub enum TrackType {
    Video,
    Audio,
    Title,
    Music,
    Voiceover,
    Sfx,
    Ambient,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct Clip {
    pub id: String,
    pub media_id: String,
    pub name: String,
    pub timeline_in: f64,
    pub timeline_out: f64,
    pub source_in: f64,
    pub source_out: f64,
    pub playback_rate: f64,
    pub enabled: bool,
    pub effects: Vec<String>,
    pub transitions: Vec<ClipTransition>,
    pub keyframes: Vec<Keyframe>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct ClipTransition {
    pub id: String,
    pub transition_type: String,
    pub duration: f64,
    pub params: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub enum InterpolationType {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
    Step,
    Bezier { control_points: Vec<(f64, f64)> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct Keyframe {
    pub id: String,
    pub clip_id: String,
    pub property: String,
    pub time: f64,
    pub value: serde_json::Value,
    pub interpolation: InterpolationType,
    pub ease_in: Option<f64>,
    pub ease_out: Option<f64>,
}

// ─── Markers ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct Marker {
    pub id: String,
    pub name: String,
    pub time: f64,
    pub color: String,
    pub marker_type: MarkerType,
    pub description: Option<String>,
    pub duration: Option<f64>,
    pub tags: Option<Vec<String>>,
    pub linked_markers: Option<Vec<String>>,
    pub created_at: Option<String>,
    pub modified_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
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

// ─── Media Pool ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct MediaPool {
    pub items: HashMap<String, MediaItem>,
    #[serde(default)]
    pub bins: HashMap<String, MediaBin>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct MediaBin {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct MediaItem {
    pub id: String,
    pub path: String,
    pub name: String,
    pub media_type: MediaType,
    pub duration: Option<f64>,
    pub metadata: MediaMetadata,
    pub thumbnail: Option<String>,
    pub usage_count: u32,
    #[serde(default)]
    pub in_timeline: bool,
    #[serde(default)]
    pub is_resource: bool,
    #[serde(default)]
    pub bin: Option<String>,
    #[serde(default)]
    pub added_at: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub proxy_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
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

// ─── Resource Pools ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct EffectResource {
    pub id: String,
    pub name: String,
    pub effect_id: String,
    pub parameters: serde_json::Value,
    pub added_at: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct FilterResource {
    pub id: String,
    pub name: String,
    pub filter_id: String,
    pub parameters: serde_json::Value,
    pub added_at: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct TransitionResource {
    pub id: String,
    pub name: String,
    pub transition_id: String,
    pub parameters: serde_json::Value,
    pub added_at: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct TemplateResource {
    pub id: String,
    pub name: String,
    pub template_id: String,
    pub data: serde_json::Value,
    pub added_at: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct StyleTemplateResource {
    pub id: String,
    pub name: String,
    pub template_id: String,
    pub data: serde_json::Value,
    pub added_at: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct SubtitleResource {
    pub id: String,
    pub name: String,
    pub style_id: String,
    pub data: serde_json::Value,
    pub added_at: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct ColorGradingPresetResource {
    pub id: String,
    pub name: String,
    pub preset_id: String,
    pub parameters: serde_json::Value,
    pub added_at: f64,
}

// ─── Playback ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[cfg_attr(feature = "specta", derive(Type))]
pub enum PlayerSource {
    #[default]
    Browser,
    Wasm,
    Native,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct PlaybackState {
    pub is_playing: bool,
    pub current_time: f64,
    pub playback_rate: f64,
    pub loop_enabled: bool,
    pub loop_start: Option<f64>,
    pub loop_end: Option<f64>,
    pub volume: f32,
    pub current_media_id: Option<String>,
    pub selected_clip_id: Option<String>,
    pub video_source: PlayerSource,
    pub applied_effects: Vec<AppliedEffect>,
    pub applied_filters: Vec<AppliedFilter>,
    pub applied_template: Option<AppliedTemplate>,
    pub is_loading: bool,
    pub is_seeking: bool,
    pub duration: f64,
}

impl Default for PlaybackState {
    fn default() -> Self {
        Self {
            is_playing: false,
            current_time: 0.0,
            playback_rate: 1.0,
            loop_enabled: false,
            loop_start: None,
            loop_end: None,
            volume: 1.0,
            current_media_id: None,
            selected_clip_id: None,
            video_source: PlayerSource::Browser,
            applied_effects: Vec::new(),
            applied_filters: Vec::new(),
            applied_template: None,
            is_loading: false,
            is_seeking: false,
            duration: 0.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct AppliedEffect {
    pub id: String,
    pub effect_id: String,
    pub params: serde_json::Value,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct AppliedFilter {
    pub id: String,
    pub filter_id: String,
    pub params: serde_json::Value,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct AppliedTemplate {
    pub id: String,
    pub template_id: String,
    pub media_ids: Vec<String>,
    pub params: serde_json::Value,
}

// ─── UI State ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
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

// ─── Version Control ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
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
            auto_save_interval_seconds: 5,
        }
    }
}

// ─── Clipboard ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct ClipboardData {
    pub clips: Vec<Clip>,
    pub copied_at: DateTime<Utc>,
    pub original_track_ids: Vec<String>,
}

// ─── Project ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(Type))]
pub struct Project {
    pub id: String,
    pub metadata: ProjectMetadata,
    pub timeline: Timeline,
    pub media_pool: MediaPool,
    pub settings: ProjectSettings,
    pub effects_pool: HashMap<String, EffectResource>,
    pub filters_pool: HashMap<String, FilterResource>,
    pub transitions_pool: HashMap<String, TransitionResource>,
    pub templates_pool: HashMap<String, TemplateResource>,
    pub style_templates_pool: HashMap<String, StyleTemplateResource>,
    pub subtitles_pool: HashMap<String, SubtitleResource>,
    pub color_grading_presets_pool: HashMap<String, ColorGradingPresetResource>,
}

impl Project {
    pub fn new(name: impl Into<String>, settings: ProjectSettings) -> Self {
        let now = Utc::now();
        let fps = settings.frame_rate;
        let sample_rate = settings.audio_sample_rate;
        Self {
            id: Uuid::new_v4().to_string(),
            metadata: ProjectMetadata {
                name: name.into(),
                description: None,
                created_at: now,
                modified_at: now,
                file_path: None,
                is_dirty: false,
                version: "1.0.0".to_string(),
            },
            timeline: Timeline {
                duration: 0.0,
                fps,
                sample_rate,
                tracks: Vec::new(),
                markers: Vec::new(),
            },
            media_pool: MediaPool::default(),
            settings,
            effects_pool: HashMap::new(),
            filters_pool: HashMap::new(),
            transitions_pool: HashMap::new(),
            templates_pool: HashMap::new(),
            style_templates_pool: HashMap::new(),
            subtitles_pool: HashMap::new(),
            color_grading_presets_pool: HashMap::new(),
        }
    }
}
