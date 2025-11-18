// Generated TypeScript types for Timeline Studio

// Player source types
export type PlayerSource = "browser" | "timeline";

// Project types
export interface ProjectState {
  project: Project | null;
  ui_state: UiState;
  playback_state: PlaybackState;
  version: number;
  version_info: VersionInfo;
  chat_sessions: ChatSession[];
  browser_state: BrowserState;
}

export interface VersionInfo {
  current_version: string;
  snapshots: VersionSnapshot[];
  branches: VersionBranch[];
  current_branch: string | null;
}

export interface VersionSnapshot {
  id: string;
  version: string;
  timestamp: string;
  description: string | null;
}

export interface VersionBranch {
  id: string;
  name: string;
  base_version: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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
  active_modal?: string | null;
  modal_data?: any | null;
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
  | { type: "SaveUIPreferences"; params: { preferences: any } }
  | { type: "LoadProjectSettings"; params: Record<string, never> }
  | { type: "UpdateProjectSettings"; params: any }
  | { type: "UpdateUserSettings"; params: any }
  | { type: "UpdateCacheSettings"; params: any }
  | { type: "Export"; params: any }
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
  | { type: "BrowserDeselectAllFiles"; params: { tab: BrowserTab | null } }
  // Undo/Redo commands
  | { type: "GetUndoHistory" }
  | { type: "RegisterUndoAction"; action: any }
  | { type: "SelectSections"; params: { section_ids: string[]; add_to_selection: boolean } }
  | { type: "CopyClips"; params: { clip_ids: string[] } }
  | { type: "CutClips"; params: { clip_ids: string[] } }
  | { type: "PasteClips"; params: { track_id: string; time: number } }
  | { type: "BatchUpdateClips"; params: { updates: Array<{ clip_id: string; updates: ClipUpdates }> } }
  | { type: "SplitClip"; params: { clip_id: string; time: number } };

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
  | { type: "ClipSplit"; payload: { original_clip_id: string; left_clip: ClipData; right_clip: ClipData; track_id: string } }
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
  | { type: "BrowserAllFilesDeselected"; payload: { tab: BrowserTab } }
  // Undo/Redo events
  | { type: "UndoPerformed"; payload: { action_id: string; description: string } }
  | { type: "RedoPerformed"; payload: { action_id: string; description: string } }
  | { type: "ActionRegistered"; payload: { action_id: string; action_type: string; description: string } }
  | { type: "UndoHistoryCleared"; payload: Record<string, never> }
  // Project Settings events
  | { type: "ProjectSettingsUpdated"; payload: { settings: any } }
  // Resource events
  | { type: "EffectAdded"; payload: { effect_id: string; name: string } }
  | { type: "EffectRemoved"; payload: { effect_id: string } }
  | { type: "FilterAdded"; payload: { filter_id: string; name: string } }
  | { type: "FilterRemoved"; payload: { filter_id: string } }
  | { type: "TransitionAdded"; payload: { transition_id: string; name: string } }
  | { type: "TransitionRemoved"; payload: { transition_id: string } }
  | { type: "TemplateAdded"; payload: { template_id: string; name: string } }
  | { type: "TemplateRemoved"; payload: { template_id: string } }
  | { type: "StyleTemplateAdded"; payload: { template_id: string; name: string } }
  | { type: "StyleTemplateRemoved"; payload: { template_id: string } }
  | { type: "SubtitleAdded"; payload: { subtitle_id: string; name: string } }
  | { type: "SubtitleRemoved"; payload: { subtitle_id: string } };

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
  playback_rate: number;
  enabled: boolean;
  effects: string[];
  transitions: Transition[];
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

// JSON value type for dynamic data
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

// System Integration types
export interface SystemNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
}
