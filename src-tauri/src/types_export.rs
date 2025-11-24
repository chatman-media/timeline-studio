use serde::{Deserialize, Serialize};
/// Module for exporting types to TypeScript
/// This is a minimal module that only includes the types we need to export
use specta::Type;

// Player source types
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum PlayerSource {
  Browser,
  Timeline,
}

// Re-export our state types with simplified versions to avoid compilation issues
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectState {
  pub project: Option<Project>,
  pub ui_state: UiState,
  pub playback_state: PlaybackState,
  pub version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Project {
  pub id: String,
  pub metadata: ProjectMetadata,
  pub timeline: Timeline,
  pub media_pool: MediaPool,
  pub settings: ProjectSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectMetadata {
  pub name: String,
  pub description: Option<String>,
  pub created_at: String,  // Simplified to string
  pub modified_at: String, // Simplified to string
  pub file_path: Option<String>,
  pub is_dirty: bool,
  pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Timeline {
  pub duration: f64,
  pub fps: f64,
  pub sample_rate: u32,
  pub tracks: Vec<Track>,
  pub markers: Vec<Marker>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
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

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum TrackType {
  Video,
  Audio,
  Title,
  Music,
  Voiceover,
  Sfx,
  Ambient,
}

// Keyframe interpolation types
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]
pub enum InterpolationType {
  Linear,
  EaseIn,
  EaseOut,
  EaseInOut,
  Step,
  Bezier { control_points: Vec<(f64, f64)> },
}

// Keyframe for clip property animation
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
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

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
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
  pub transitions: Vec<Transition>,
  pub keyframes: Vec<Keyframe>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Transition {
  pub id: String,
  pub transition_type: String,
  pub duration: f64,
  pub params: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Marker {
  pub id: String,
  pub name: String,
  pub time: f64,
  pub color: String,
  pub marker_type: MarkerType,
  pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum MarkerType {
  Chapter,
  Section,
  Note,
  Export,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaPool {
  pub items: std::collections::HashMap<String, MediaItem>,
}

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

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaMetadata {
  pub format: String,
  pub codec: Option<String>,
  pub resolution: Option<Resolution>,
  pub frame_rate: Option<f64>,
  pub bitrate: Option<u64>,
  pub audio_channels: Option<u32>,
  pub sample_rate: Option<u32>,
  pub creation_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Resolution {
  pub width: u32,
  pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectSettings {
  pub resolution: Resolution,
  pub frame_rate: f64,
  pub audio_sample_rate: u32,
  pub audio_channels: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UiState {
  pub selected_clips: Vec<String>,
  pub selected_tracks: Vec<String>,
  pub timeline_zoom: f64,
  pub timeline_scroll: f64,
  pub active_tool: String,
}

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

// Commands
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "params")]
pub enum ProjectCommand {
  CreateProject {
    name: String,
    settings: ProjectSettings,
  },
  OpenProject {
    path: String,
  },
  SaveProject {
    path: Option<String>,
  },
  CloseProject,
  AddTrack {
    name: String,
    track_type: TrackType,
    index: Option<u32>,
  },
  DeleteTrack {
    track_id: String,
  },
  UpdateTrack {
    track_id: String,
    updates: TrackUpdates,
  },
  AddClip {
    track_id: String,
    media_id: String,
    time: f64,
  },
  MoveClip {
    clip_id: String,
    track_id: String,
    time: f64,
  },
  TrimClip {
    clip_id: String,
    start: f64,
    end: f64,
  },
  DeleteClip {
    clip_id: String,
  },
  UpdateClip {
    clip_id: String,
    updates: ClipUpdates,
  },
  AddMedia {
    path: String,
    media_type: MediaType,
  },
  RemoveMedia {
    media_id: String,
  },
  UpdateMedia {
    media_id: String,
    updates: MediaUpdates,
  },
  Play,
  Pause,
  Stop,
  Seek {
    time: f64,
  },
  SetPlaybackRate {
    rate: f64,
  },

  // Player commands
  PlayerSetMedia {
    media_id: String,
    start_time: Option<f64>,
  },
  PlayerSetVolume {
    volume: f32,
  },
  PlayerSelectClip {
    clip_id: String,
  },
  PlayerClearSelection,
  PlayerSetSource {
    source: PlayerSource,
  },
  PlayerApplyEffect {
    effect_id: String,
    params: serde_json::Value,
  },
  PlayerApplyFilter {
    filter_id: String,
    params: serde_json::Value,
  },
  PlayerApplyTemplate {
    template_id: String,
    media_ids: Vec<String>,
  },
  PlayerClearEffects,
  PlayerClearFilters,
  PlayerClearTemplate,

  SelectClips {
    clip_ids: Vec<String>,
    add_to_selection: bool,
  },
  SelectTracks {
    track_ids: Vec<String>,
    add_to_selection: bool,
  },
  SelectSections {
    section_ids: Vec<String>,
    add_to_selection: bool,
  },
  ClearSelection,

  // Keyframe commands
  AddKeyframe {
    clip_id: String,
    property: String,
    time: f64,
    value: serde_json::Value,
    interpolation: String,
    ease_in: Option<f64>,
    ease_out: Option<f64>,
  },
  RemoveKeyframe {
    clip_id: String,
    keyframe_id: String,
  },
  UpdateKeyframe {
    clip_id: String,
    keyframe_id: String,
    time: Option<f64>,
    value: Option<serde_json::Value>,
    interpolation: Option<String>,
    ease_in: Option<f64>,
    ease_out: Option<f64>,
  },
  ClearPropertyKeyframes {
    clip_id: String,
    property: String,
  },
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommandResult {
  pub success: bool,
  pub error: Option<String>,
  pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TrackUpdates {
  pub name: Option<String>,
  pub enabled: Option<bool>,
  pub locked: Option<bool>,
  pub volume: Option<f32>,
  pub height: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ClipUpdates {
  pub name: Option<String>,
  pub playback_rate: Option<f64>,
  pub volume: Option<f32>,
  pub enabled: Option<bool>,
}

/// Batch update for multiple clips
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ClipBatchUpdate {
  pub clip_id: String,
  pub updates: ClipUpdates,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaUpdates {
  pub name: Option<String>,
}

// Events
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "payload")]
pub enum ProjectEvent {
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
  ProjectDirtyStateChanged {
    is_dirty: bool,
  },
  StateRestored {
    version: u32,
  },
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EventMetadata {
  pub id: String,
  pub timestamp: String, // Simplified to string
  pub source: String,
  pub version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EventEnvelope {
  pub metadata: EventMetadata,
  pub event: ProjectEvent,
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
  pub index: usize,
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

/// Export all types to TypeScript
pub fn export_types() -> Result<String, Box<dyn std::error::Error>> {
  // For now, generate manual TypeScript definitions
  // This is a temporary solution until we can properly integrate with specta

  let output = r#"// Generated TypeScript types for Timeline Studio

// Player source types
export type PlayerSource = "browser" | "timeline";

// Project types
export interface ProjectState {
  project: Project | null;
  ui_state: UiState;
  playback_state: PlaybackState;
  version: number;
}

export interface Project {
  id: string;
  metadata: ProjectMetadata;
  timeline: Timeline;
  media_pool: MediaPool;
  settings: ProjectSettings;
}

export interface ProjectMetadata {
  name: string;
  description: string | null;
  created_at: string;
  modified_at: string;
  file_path: string | null;
  is_dirty: boolean;
  version: string;
}

export interface Timeline {
  duration: number;
  fps: number;
  sample_rate: number;
  tracks: Track[];
  markers: Marker[];
}

export interface Track {
  id: string;
  name: string;
  track_type: TrackType;
  enabled: boolean;
  locked: boolean;
  height: number;
  clips: Clip[];
  effects: string[];
  volume: number;
  pan: number;
}

export type TrackType = "Video" | "Audio" | "Title" | "Music" | "Voiceover" | "Sfx" | "Ambient";

export interface Clip {
  id: string;
  media_id: string;
  name: string;
  timeline_in: number;
  timeline_out: number;
  source_in: number;
  source_out: number;
  playback_rate: number;
  enabled: boolean;
  effects: string[];
  transitions: Transition[];
}

export interface Transition {
  id: string;
  transition_type: string;
  duration: number;
  params: Record<string, any>;
}

export interface Marker {
  id: string;
  name: string;
  time: number;
  color: string;
  marker_type: MarkerType;
  description: string | null;
}

export type MarkerType = "Chapter" | "Section" | "Note" | "Export";

export interface MediaPool {
  items: Record<string, MediaItem>;
}

export interface MediaItem {
  id: string;
  path: string;
  name: string;
  media_type: MediaType;
  duration: number | null;
  metadata: MediaMetadata;
  thumbnail: string | null;
  usage_count: number;
}

export type MediaType = "Video" | "Audio" | "Image";

export interface MediaMetadata {
  format: string;
  codec: string | null;
  resolution: Resolution | null;
  frame_rate: number | null;
  bitrate: number | null;
  audio_channels: number | null;
  sample_rate: number | null;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface ProjectSettings {
  resolution: Resolution;
  frame_rate: number;
  audio_sample_rate: number;
  audio_channels: number;
}

export interface UiState {
  selected_clips: string[];
  selected_tracks: string[];
  timeline_zoom: number;
  timeline_scroll: number;
  active_tool: string;
}

export interface PlaybackState {
  is_playing: boolean;
  current_time: number;
  playback_rate: number;
  loop_enabled: boolean;
  loop_start: number | null;
  loop_end: number | null;
  volume: number;
  current_media_id: string | null;
  selected_clip_id: string | null;
  video_source: PlayerSource;
  applied_effects: AppliedEffect[];
  applied_filters: AppliedFilter[];
  applied_template: AppliedTemplate | null;
  is_loading: boolean;
  is_seeking: boolean;
  duration: number;
}

export interface AppliedEffect {
  id: string;
  effect_id: string;
  params: any;
  enabled: boolean;
}

export interface AppliedFilter {
  id: string;
  filter_id: string;
  params: any;
  enabled: boolean;
}

export interface AppliedTemplate {
  id: string;
  template_id: string;
  media_ids: string[];
  params: any;
}

// Command types
export type ProjectCommand = 
  | { type: "CreateProject"; params: { name: string; settings: ProjectSettings } }
  | { type: "OpenProject"; params: { path: string } }
  | { type: "SaveProject"; params: { path: string | null } }
  | { type: "CloseProject" }
  | { type: "AddTrack"; params: { name: string; track_type: TrackType; index: number | null } }
  | { type: "DeleteTrack"; params: { track_id: string } }
  | { type: "UpdateTrack"; params: { track_id: string; updates: TrackUpdates } }
  | { type: "AddClip"; params: { track_id: string; media_id: string; time: number } }
  | { type: "MoveClip"; params: { clip_id: string; track_id: string; time: number } }
  | { type: "TrimClip"; params: { clip_id: string; start: number; end: number } }
  | { type: "DeleteClip"; params: { clip_id: string } }
  | { type: "UpdateClip"; params: { clip_id: string; updates: ClipUpdates } }
  | { type: "AddMedia"; params: { path: string; media_type: MediaType } }
  | { type: "RemoveMedia"; params: { media_id: string } }
  | { type: "UpdateMedia"; params: { media_id: string; updates: MediaUpdates } }
  | { type: "Play" }
  | { type: "Pause" }
  | { type: "Stop" }
  | { type: "Seek"; params: { time: number } }
  | { type: "SetPlaybackRate"; params: { rate: number } }
  | { type: "PlayerSetMedia"; params: { media_id: string; start_time: number | null } }
  | { type: "PlayerSetVolume"; params: { volume: number } }
  | { type: "PlayerSelectClip"; params: { clip_id: string } }
  | { type: "PlayerClearSelection" }
  | { type: "PlayerSetSource"; params: { source: PlayerSource } }
  | { type: "PlayerApplyEffect"; params: { effect_id: string; params: any } }
  | { type: "PlayerApplyFilter"; params: { filter_id: string; params: any } }
  | { type: "PlayerApplyTemplate"; params: { template_id: string; media_ids: string[] } }
  | { type: "PlayerClearEffects" }
  | { type: "PlayerClearFilters" }
  | { type: "PlayerClearTemplate" }
  | { type: "SelectClips"; params: { clip_ids: string[]; add_to_selection: boolean } }
  | { type: "SelectTracks"; params: { track_ids: string[]; add_to_selection: boolean } }
  | { type: "ClearSelection" }
  // Browser commands
  | { type: "BrowserSwitchTab"; params: { tab: BrowserTab } }
  | { type: "BrowserSetSearchQuery"; params: { query: string; tab: BrowserTab | null } }
  | { type: "BrowserToggleFavorites"; params: { tab: BrowserTab | null } }
  | { type: "BrowserSetSort"; params: { sort_by: string; sort_order: SortOrder; tab: BrowserTab | null } }
  | { type: "BrowserSetGroupBy"; params: { group_by: string; tab: BrowserTab | null } }
  | { type: "BrowserSetFilter"; params: { filter_type: string; tab: BrowserTab | null } }
  | { type: "BrowserSetViewMode"; params: { view_mode: ViewMode; tab: BrowserTab | null } }
  | { type: "BrowserSetPreviewSize"; params: { size_index: number; tab: BrowserTab | null } }
  | { type: "BrowserResetTabSettings"; params: { tab: BrowserTab } }
  | { type: "BrowserSelectFile"; params: { file_id: string; tab: BrowserTab | null } }
  | { type: "BrowserDeselectFile"; params: { file_id: string; tab: BrowserTab | null } }
  | { type: "BrowserToggleFileSelection"; params: { file_id: string; tab: BrowserTab | null } }
  | { type: "BrowserSelectAllFiles"; params: { file_ids: string[]; tab: BrowserTab | null } }
  | { type: "BrowserDeselectAllFiles"; params: { tab: BrowserTab | null } };

export interface CommandResult {
  success: boolean;
  error: string | null;
  data: any | null;
}

export interface TrackUpdates {
  name?: string;
  enabled?: boolean;
  locked?: boolean;
  volume?: number;
  height?: number;
}

export interface ClipUpdates {
  name?: string;
  playback_rate?: number;
  volume?: number;
  enabled?: boolean;
}

export interface MediaUpdates {
  name?: string;
}

// Event types
export type ProjectEvent =
  | { type: "ProjectCreated"; payload: { project_id: string; name: string } }
  | { type: "ProjectOpened"; payload: { project_id: string; path: string } }
  | { type: "ProjectSaved"; payload: { project_id: string; path: string } }
  | { type: "ProjectClosed"; payload: { project_id: string } }
  | { type: "ClipAdded"; payload: { track_id: string; clip: ClipData } }
  | { type: "ClipMoved"; payload: { clip_id: string; new_track_id: string; new_time: number } }
  | { type: "ClipTrimmed"; payload: { clip_id: string; new_in: number; new_out: number } }
  | { type: "ClipDeleted"; payload: { clip_id: string; track_id: string } }
  | { type: "ClipUpdated"; payload: { clip_id: string; changes: ClipChanges } }
  | { type: "TrackAdded"; payload: { track: TrackData } }
  | { type: "TrackDeleted"; payload: { track_id: string } }
  | { type: "TrackUpdated"; payload: { track_id: string; changes: TrackChanges } }
  | { type: "MediaAdded"; payload: { media: MediaData } }
  | { type: "MediaRemoved"; payload: { media_id: string } }
  | { type: "MediaUpdated"; payload: { media_id: string; changes: MediaChanges } }
  | { type: "PlaybackStarted"; payload: { time: number } }
  | { type: "PlaybackStopped"; payload: { time: number } }
  | { type: "PlaybackSeeked"; payload: { time: number } }
  | { type: "PlaybackRateChanged"; payload: { rate: number } }
  | { type: "SelectionChanged"; payload: { selected_clips: string[]; selected_tracks: string[] } }
  | { type: "TimelineZoomChanged"; payload: { zoom: number } }
  | { type: "TimelineScrollChanged"; payload: { scroll: number } }
  | { type: "ProjectDirtyStateChanged"; payload: { is_dirty: boolean } }
  | { type: "StateRestored"; payload: { version: number } }
  // Browser events
  | { type: "BrowserTabSwitched"; payload: { tab: BrowserTab } }
  | { type: "BrowserSearchQueryChanged"; payload: { tab: BrowserTab; query: string } }
  | { type: "BrowserFavoritesToggled"; payload: { tab: BrowserTab; show_favorites_only: boolean } }
  | { type: "BrowserSortChanged"; payload: { tab: BrowserTab; sort_by: string; sort_order: SortOrder } }
  | { type: "BrowserGroupByChanged"; payload: { tab: BrowserTab; group_by: string | null } }
  | { type: "BrowserFilterChanged"; payload: { tab: BrowserTab; filter_type: string | null } }
  | { type: "BrowserViewModeChanged"; payload: { tab: BrowserTab; view_mode: ViewMode } }
  | { type: "BrowserPreviewSizeChanged"; payload: { tab: BrowserTab; size_index: number } }
  | { type: "BrowserTabSettingsReset"; payload: { tab: BrowserTab } }
  | { type: "BrowserFileSelected"; payload: { tab: BrowserTab; file_id: string } }
  | { type: "BrowserFileDeselected"; payload: { tab: BrowserTab; file_id: string } }
  | { type: "BrowserFileSelectionToggled"; payload: { tab: BrowserTab; file_id: string } }
  | { type: "BrowserAllFilesSelected"; payload: { tab: BrowserTab; file_ids: string[] } }
  | { type: "BrowserAllFilesDeselected"; payload: { tab: BrowserTab } };

export interface EventMetadata {
  id: string;
  timestamp: string;
  source: string;
  version: number;
}

export interface EventEnvelope {
  metadata: EventMetadata;
  event: ProjectEvent;
}

export interface ClipData {
  id: string;
  media_id: string;
  name: string;
  timeline_in: number;
  timeline_out: number;
  source_in: number;
  source_out: number;
}

export interface ClipChanges {
  name?: string;
  playback_rate?: number;
  volume?: number;
  effects?: string[];
}

export interface TrackData {
  id: string;
  name: string;
  track_type: string;
  index: number;
}

export interface TrackChanges {
  name?: string;
  enabled?: boolean;
  locked?: boolean;
  volume?: number;
  height?: number;
}

export interface MediaData {
  id: string;
  path: string;
  name: string;
  media_type: string;
  duration: number | null;
}

export interface MediaChanges {
  name?: string;
  thumbnail?: string;
}

// Browser types
export type BrowserTab = "media" | "effects" | "transitions" | "audio" | "titles" | "graphics" | "color" | "export";

export type ViewMode = "grid" | "list" | "filmstrip";

export type SortOrder = "name" | "date" | "duration" | "type" | "size";

export interface TabSettings {
  view_mode: ViewMode;
  sort_by: string;
  sort_order: SortOrder;
  group_by: string | null;
  filter_type: string | null;
  search_query: string;
  show_favorites_only: boolean;
  preview_size: number;
  selected_file_ids: string[];
}

export interface BrowserState {
  active_tab: BrowserTab;
  tabs: Record<BrowserTab, TabSettings>;
}
"#;

  Ok(output.to_string())
}
