use crate::state::browser::{BrowserTab, SortOrder, ViewMode};
use crate::state::chat::ChatCommand;
use crate::state::project_state::{Keyframe, MediaType, ProjectSettings, Resolution, TrackType};
use crate::types_export::{ClipBatchUpdate, ClipUpdates, MediaUpdates, TrackUpdates};
use chrono;
use serde::{Deserialize, Serialize};
use specta::Type;

/// Player source types
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum PlayerSource {
  Browser,
  Timeline,
}

/// Commands that can modify the project state
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "params")]
pub enum ProjectCommand {
  // Project commands
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

  // Timeline commands
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

  // Clip commands
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

  // Media pool commands
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

  // Media Management commands
  ImportMediaFiles {
    paths: Vec<String>,
    options: MediaImportOptions,
  },
  ExtractMediaMetadata {
    file_path: String,
  },
  GenerateVideoThumbnail {
    video_path: String,
    time: f64,
    output_path: Option<String>,
  },
  GetMediaDuration {
    file_path: String,
  },
  DetectVideoScenes {
    video_path: String,
    threshold: Option<f64>,
  },
  GenerateAudioWaveform {
    audio_path: String,
    width: u32,
    height: u32,
  },
  CopyMediaToProject {
    source_paths: Vec<String>,
    project_path: String,
  },
  CreateProxyFiles {
    media_paths: Vec<String>,
    proxy_settings: ProxySettings,
  },
  DeleteMediaFiles {
    file_paths: Vec<String>,
    move_to_trash: bool,
  },
  MoveMediaFiles {
    source_paths: Vec<String>,
    destination_path: String,
  },
  ScanMediaDirectory {
    directory_path: String,
    recursive: bool,
    supported_formats: Vec<String>,
  },
  IndexMediaFiles {
    file_paths: Vec<String>,
    extract_metadata: bool,
  },
  SearchMediaLibrary {
    query: String,
    filters: MediaSearchFilters,
  },
  ExportMediaFile {
    source_path: String,
    output_path: String,
    export_settings: MediaExportSettings,
  },
  BatchExportMedia {
    media_items: Vec<BatchExportItem>,
    output_directory: String,
  },
  ConvertMediaFormat {
    input_path: String,
    output_path: String,
    format: String,
    conversion_options: MediaConversionOptions,
  },
  OptimizeMediaFile {
    file_path: String,
    optimization_settings: MediaOptimizationSettings,
  },

  // Playback commands
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

  // Selection commands
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

  // NEW: Version control commands
  CreateSnapshot {
    message: Option<String>,
  },
  RestoreVersion {
    version_id: String,
  },
  GetVersionHistory {
    limit: Option<u32>,
  },
  CompareVersions {
    version_a: String,
    version_b: String,
  },
  CreateBranch {
    branch_name: String,
    from_version: Option<String>,
  },
  MergeBranch {
    source_branch: String,
    target_branch: String,
  },
  SwitchBranch {
    branch_name: String,
  },
  SetAutoSaveInterval {
    seconds: u32,
  },
  EnableAutoSave {
    enabled: bool,
  },

  // Browser commands
  BrowserSwitchTab {
    tab: BrowserTab,
  },
  BrowserSetSearchQuery {
    query: String,
    tab: Option<BrowserTab>,
  },
  BrowserToggleFavorites {
    tab: Option<BrowserTab>,
  },
  BrowserSetSort {
    sort_by: String,
    sort_order: SortOrder,
    tab: Option<BrowserTab>,
  },
  BrowserSetGroupBy {
    group_by: String,
    tab: Option<BrowserTab>,
  },
  BrowserSetFilter {
    filter_type: String,
    tab: Option<BrowserTab>,
  },
  BrowserSetViewMode {
    view_mode: ViewMode,
    tab: Option<BrowserTab>,
  },
  BrowserSetPreviewSize {
    size_index: u32,
    tab: Option<BrowserTab>,
  },
  BrowserResetTabSettings {
    tab: BrowserTab,
  },
  BrowserSelectFile {
    file_id: String,
    tab: Option<BrowserTab>,
  },
  BrowserDeselectFile {
    file_id: String,
    tab: Option<BrowserTab>,
  },
  BrowserToggleFileSelection {
    file_id: String,
    tab: Option<BrowserTab>,
  },
  BrowserSelectAllFiles {
    file_ids: Vec<String>,
    tab: Option<BrowserTab>,
  },
  BrowserDeselectAllFiles {
    tab: Option<BrowserTab>,
  },

  // Chat commands
  Chat(ChatCommand),

  // Analytics commands
  LogBrowserAction {
    action: String,
    metadata: std::collections::HashMap<String, serde_json::Value>,
  },
  LogUserAction {
    action: String,
    timestamp: chrono::DateTime<chrono::Utc>,
    metadata: std::collections::HashMap<String, serde_json::Value>,
  },
  LogPerformanceMetric {
    metric_name: String,
    value: f64,
    timestamp: chrono::DateTime<chrono::Utc>,
    metadata: std::collections::HashMap<String, serde_json::Value>,
  },
  LogError {
    error_message: String,
    error_type: String,
    stack_trace: Option<String>,
    timestamp: chrono::DateTime<chrono::Utc>,
    metadata: std::collections::HashMap<String, serde_json::Value>,
  },
  GetAnalytics {
    start_time: Option<chrono::DateTime<chrono::Utc>>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
    metric_types: Option<Vec<String>>,
  },

  // UI State commands
  SyncBrowserState {
    state: serde_json::Value,
  },
  SyncUIState {
    component: String,
    state: serde_json::Value,
  },
  SaveUIPreferences {
    preferences: std::collections::HashMap<String, serde_json::Value>,
  },
  GetUIState {
    component: Option<String>,
  },

  // Resources commands
  LoadResources {
    resource_type: String,
    source: String,
    category: Option<String>,
  },
  SaveResource {
    resource_id: String,
    resource_type: String,
    data: serde_json::Value,
    metadata: std::collections::HashMap<String, serde_json::Value>,
  },
  DeleteResource {
    resource_id: String,
    resource_type: String,
  },
  PreloadCategory {
    resource_type: String,
    category: String,
  },
  SyncResources {
    source: String,
  },
  GetResourceLibrary {
    resource_type: Option<String>,
    category: Option<String>,
  },

  // Timeline Extended commands
  SplitClip {
    clip_id: String,
    time: f64,
  },
  BatchUpdateClips {
    updates: Vec<ClipBatchUpdate>,
  },
  CopyClips {
    clip_ids: Vec<String>,
  },
  CutClips {
    clip_ids: Vec<String>,
  },
  PasteClips {
    track_id: String,
    time: f64,
  },
  DeleteSelected,

  // Advanced Edit Commands
  RippleEdit {
    clip_id: String,
    delta: f64,
  },
  RollEdit {
    clip_id: String,
    adjacent_clip_id: String,
    delta: f64,
  },
  SlipEdit {
    clip_id: String,
    delta: f64,
  },
  SlideEdit {
    clip_id: String,
    delta: f64,
  },

  // Marker Commands
  AddMarker {
    name: String,
    time: f64,
    color: String,
    marker_type: String,
    description: Option<String>,
  },
  RemoveMarker {
    marker_id: String,
  },
  UpdateMarker {
    marker_id: String,
    name: Option<String>,
    time: Option<f64>,
    color: Option<String>,
    description: Option<String>,
  },

  // Keyframe Commands
  AddKeyframe {
    clip_id: String,
    property: String,
    time: f64,
    value: serde_json::Value,
    interpolation: String, // "linear", "ease-in", "ease-out", "ease-in-out", "step", "bezier"
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

  ApplyEffect {
    clip_id: String,
    effect_id: String,
    params: serde_json::Value,
  },
  RemoveEffect {
    clip_id: String,
    effect_id: String,
  },
  ApplyFilter {
    clip_id: String,
    filter_id: String,
    params: serde_json::Value,
  },
  RemoveFilter {
    clip_id: String,
    filter_id: String,
  },
  ApplyTransition {
    clip_id: String,
    transition_id: String,
    params: serde_json::Value,
  },
  RemoveTransition {
    clip_id: String,
    transition_id: String,
  },
  ReorderTracks {
    section_id: String,
    track_ids: Vec<String>,
  },

  // Project Extended commands
  SyncProjectState {
    project_id: String,
    state: serde_json::Value,
  },
  NotifyProjectCreated {
    settings: ProjectSettings,
  },
  NotifyProjectOpened {
    path: String,
  },

  // Settings commands
  SyncUserSettings {
    settings: serde_json::Value,
  },
  UpdateApiKey {
    service: String,
    key: String,
  },
  UpdateGpuAcceleration {
    enabled: bool,
  },
  GetUserSettings,

  // AI Chat commands
  SendChatMessage {
    session_id: String,
    message: String,
    model: String,
    provider: String,
    project_context: Option<serde_json::Value>,
  },
  SendStreamingChatMessage {
    session_id: String,
    message: String,
    model: String,
    provider: String,
    project_context: Option<serde_json::Value>,
  },
  SaveChatMessage {
    session_id: String,
    message_id: String,
    role: String,
    content: String,
    metadata: Option<serde_json::Value>,
  },
  LoadChatHistory {
    session_id: String,
    limit: Option<u32>,
  },
  CreateChatSession {
    name: String,
    agent_type: Option<String>,
  },
  DeleteChatSession {
    session_id: String,
  },
  GetProjectContext,
  ValidateAIApiKey {
    provider: String,
    api_key: String,
  },

  // System commands
  ReconnectNotify {
    timestamp: String,
  },

  // System Integration commands
  OpenModal {
    modal_type: String,
    modal_data: Option<serde_json::Value>,
  },
  CloseModal,
  SubmitModal {
    data: Option<serde_json::Value>,
  },
  ShowNotification {
    notification_type: String,
    title: String,
    message: String,
    duration: Option<u32>,
    actions: Option<Vec<NotificationAction>>,
  },
  DismissNotification {
    id: String,
  },
  ClearNotifications,
  CheckForUpdates,
  DownloadUpdate,
  InstallUpdate,
  DismissUpdate,
  EnableAutoUpdate {
    interval_minutes: u32,
  },
  DisableAutoUpdate,
  ToggleFeature {
    feature: String,
    enabled: bool,
  },

  // Video Editing commands
  ExportTimeline {
    timeline_id: String,
    output_path: String,
    format: String, // "json", "xml", "edl", "fcpxml"
  },
  ImportTimeline {
    file_path: String,
    merge_mode: String, // "replace", "merge", "append"
  },
  ExportProject {
    project_id: String,
    output_path: String,
    format: String,
    include_media: bool,
  },
  RenderVideo {
    timeline_id: String,
    output_path: String,
    render_settings: RenderSettings,
  },
  StartRender {
    project_id: String,
    settings: RenderSettings,
  },
  GetRenderProgress {
    render_job_id: String,
  },
  CancelRender {
    render_job_id: String,
  },
  ApplyEffectToClip {
    clip_id: String,
    effect_id: String,
    params: serde_json::Value,
  },
  OptimizeTimeline {
    timeline_id: String,
    optimization_type: String,
  },
  StartRealTimePreview {
    timeline_id: String,
    quality: String,
  },
  StopRealTimePreview,
  UpdatePreviewFrame {
    timestamp: f64,
  },

  // AI Provider commands
  GetAvailableProviders,
  GetProviderModels {
    provider: String,
  },
  ValidateProviderConnection {
    provider: String,
  },
  GetProviderCapabilities {
    provider: String,
  },
  SendAiRequest {
    provider: String,
    model: String,
    messages: Vec<AiMessage>,
    options: AiRequestOptions,
  },
  SendStreamingAiRequest {
    provider: String,
    model: String,
    messages: Vec<AiMessage>,
    options: AiRequestOptions,
  },
  GetModelInfo {
    provider: String,
    model: String,
  },
  RefreshModelList {
    provider: String,
  },
  CheckModelAvailability {
    provider: String,
    model: String,
  },
  InstallOllamaModel {
    model_name: String,
  },
  RemoveOllamaModel {
    model_name: String,
  },
  GetOllamaStatus,
  ListInstalledModels,
  GetAiUsageStats {
    provider: Option<String>,
    timeframe: String,
  },

  // Effects and Filters commands
  RenderEffectPipeline {
    clip_id: String,
    effects: Vec<EffectConfig>,
    output_path: String,
    quality: String,
  },
  ProcessVideoWithFilters {
    input_path: String,
    output_path: String,
    filters: Vec<FilterConfig>,
    render_settings: RenderSettings,
  },
  ApplyLutToClip {
    clip_id: String,
    lut_path: String,
    intensity: f32,
  },
  CreateEffectPreset {
    name: String,
    effect_id: String,
    parameters: serde_json::Value,
    category: String,
  },
  SaveFilterPreset {
    name: String,
    filter_id: String,
    parameters: serde_json::Value,
    tags: Vec<String>,
  },
  LoadEffectPresets {
    effect_id: String,
  },
  LoadFilterPresets {
    filter_id: String,
  },
  DeletePreset {
    preset_id: String,
    preset_type: String,
  },
  ImportEffectFile {
    file_path: String,
    category: String,
  },
  ImportFilterFile {
    file_path: String,
    file_type: String,
  },
  ExportEffectPreset {
    preset_id: String,
    output_path: String,
  },
  ExportFilterPreset {
    preset_id: String,
    output_path: String,
  },
  GetGpuCapabilities,
  OptimizeEffectsPipeline {
    clip_id: String,
    target_fps: u32,
  },
  AnalyzeEffectPerformance {
    effect_id: String,
    duration_seconds: f64,
  },

  // Template Management commands
  SaveTemplate {
    template: serde_json::Value,
    path: Option<String>,
    category: String,
  },
  LoadTemplate {
    path: String,
  },
  DeleteTemplate {
    template_id: String,
  },
  ListTemplates {
    category: Option<String>,
    template_type: Option<String>,
  },
  ImportTemplate {
    path: String,
    category: String,
  },
  ExportTemplate {
    template_id: String,
    path: String,
  },
  CreateTemplateFromProject {
    project_id: String,
    template_name: String,
    category: String,
  },
  ApplyTemplateToTimeline {
    template_id: String,
    timeline_id: String,
    media_ids: Vec<String>,
  },
  ValidateTemplate {
    template: serde_json::Value,
  },
  GetTemplatePreview {
    template_id: String,
    media_ids: Vec<String>,
  },
  OptimizeTemplateRendering {
    template_id: String,
    target_quality: String,
  },

  // Style Template Management commands
  LoadStyleTemplates {
    category: Option<String>,
  },
  SaveStyleTemplate {
    template: serde_json::Value,
    path: Option<String>,
  },
  ApplyStyleTemplate {
    template_id: String,
    timeline_id: String,
    position: f64,
    text_replacements: Option<serde_json::Value>,
  },
  ExportStyleTemplate {
    template_id: String,
    export_path: String,
  },
  ImportStyleTemplates {
    file_path: String,
  },
  ValidateStyleTemplate {
    template: serde_json::Value,
  },
  RenderStyleTemplatePreview {
    template_id: String,
    output_path: String,
    preview_settings: serde_json::Value,
  },
  GetStyleTemplateAssets {
    template_id: String,
  },
  UpdateStyleTemplateElements {
    template_id: String,
    elements: Vec<serde_json::Value>,
  },

  // Transition Management commands
  CreateTransition {
    track_id: String,
    transition_id: String,
    position: f64,
    duration: f64,
    parameters: serde_json::Value,
  },
  UpdateTransitionParameters {
    transition_id: String,
    parameters: serde_json::Value,
  },
  GetTransitionInfo {
    transition_id: String,
  },
  ImportTransitions {
    file_path: String,
  },
  ExportTransitions {
    transition_ids: Vec<String>,
    export_path: String,
  },
  SaveUserTransition {
    transition: serde_json::Value,
  },
  PreviewTransition {
    transition_id: String,
    source_clip_id: String,
    target_clip_id: String,
    parameters: serde_json::Value,
  },
  RenderTransition {
    transition_config: serde_json::Value,
  },
  ExportProjectTransitions {
    project_path: String,
    export_settings: serde_json::Value,
  },
  ListAvailableTransitions {
    category: Option<String>,
  },
  ValidateTransition {
    transition: serde_json::Value,
  },
}

/// Effects and Filters supporting structures
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EffectConfig {
  pub id: String,
  pub name: String,
  pub category: String,
  pub parameters: serde_json::Value,
  pub enabled: bool,
  pub blend_mode: Option<String>,
  pub opacity: Option<f32>,
  pub keyframes: Option<Vec<Keyframe>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FilterConfig {
  pub id: String,
  pub name: String,
  pub filter_type: String, // "color", "blur", "distortion", etc.
  pub parameters: serde_json::Value,
  pub intensity: f32,
  pub enabled: bool,
}

// Note: Using Keyframe from project_state.rs to avoid duplicate type exports
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyframeSimple {
  pub time: f64,
  pub value: serde_json::Value,
  pub easing: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RenderSettings {
  pub resolution: Resolution,
  pub frame_rate: f32,
  pub bitrate: Option<u32>,
  pub codec: String,
  pub quality: String, // "draft", "preview", "final"
  pub gpu_acceleration: bool,
}

// Note: Using Resolution from project_state.rs to avoid duplicate type exports
// Resolution is imported at the top of the file

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TimeRange {
  pub start: f64,
  pub end: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EffectPreset {
  pub id: String,
  pub name: String,
  pub effect_id: String,
  pub parameters: serde_json::Value,
  pub category: String,
  pub tags: Vec<String>,
  pub thumbnail: Option<String>,
  pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FilterPreset {
  pub id: String,
  pub name: String,
  pub filter_id: String,
  pub parameters: serde_json::Value,
  pub intensity: f32,
  pub tags: Vec<String>,
  pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GpuCapabilities {
  pub vendor: String,
  pub model: String,
  pub driver_version: String,
  pub opengl_version: String,
  pub vulkan_support: bool,
  pub max_texture_size: u32,
  pub compute_shaders: bool,
  pub memory_mb: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PerformanceMetrics {
  pub effect_id: String,
  pub avg_frame_time_ms: f64,
  pub memory_usage_mb: f64,
  pub gpu_utilization: f32,
  pub cpu_utilization: f32,
  pub dropped_frames: u32,
}

/// AI Provider supporting structures
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AiMessage {
  pub role: String, // "user", "assistant", "system"
  pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AiRequestOptions {
  pub temperature: Option<f64>,
  pub max_tokens: Option<u32>,
  pub top_p: Option<f64>,
  pub stop: Option<Vec<String>>,
  pub stream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AiProvider {
  pub id: String,
  pub name: String,
  pub is_available: bool,
  pub requires_api_key: bool,
  pub supported_models: Vec<AiModel>,
  pub capabilities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AiModel {
  pub id: String,
  pub name: String,
  pub description: String,
  pub max_tokens: u32,
  pub cost_per_token: Option<f64>,
  pub is_available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AiResponse {
  pub provider: String,
  pub model: String,
  pub content: String,
  pub tokens_used: u32,
  pub cost: Option<f64>,
  pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AiUsageStats {
  pub provider: String,
  pub total_requests: u32,
  pub total_tokens: u32,
  pub total_cost: f64,
  pub requests_by_model: serde_json::Value,
  pub period_start: String,
  pub period_end: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OllamaStatus {
  pub is_running: bool,
  pub version: Option<String>,
  pub available_models: Vec<String>,
  pub memory_usage: Option<f64>,
}

/// Video Editing supporting structures

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RenderJobInfo {
  pub id: String,
  pub status: String, // "pending", "running", "completed", "failed", "cancelled"
  pub progress: f64,  // 0.0 to 1.0
  pub current_frame: u32,
  pub total_frames: u32,
  pub estimated_time_remaining: Option<u32>, // seconds
  pub output_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TimelineExportData {
  pub timeline_id: String,
  pub format: String,
  pub tracks: Vec<TrackExportData>,
  pub metadata: TimelineMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TrackExportData {
  pub id: String,
  pub name: String,
  pub track_type: String,
  pub clips: Vec<ClipExportData>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ClipExportData {
  pub id: String,
  pub media_path: String,
  pub start_time: f64,
  pub duration: f64,
  pub effects: Vec<EffectExportData>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EffectExportData {
  pub id: String,
  pub effect_type: String,
  pub params: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TimelineMetadata {
  pub name: String,
  pub duration: f64,
  pub fps: u32,
  pub resolution: Resolution,
  pub created_at: String,
  pub modified_at: String,
}

/// System Integration supporting structures
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct NotificationAction {
  pub label: String,
  pub action: String,
  pub style: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SystemNotification {
  pub id: String,
  pub notification_type: String,
  pub title: String,
  pub message: String,
  pub timestamp: String,
  pub duration: Option<u32>,
  pub actions: Option<Vec<NotificationAction>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UpdateInfo {
  pub version: String,
  pub release_notes: String,
  pub download_url: String,
  pub size: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FeatureState {
  pub name: String,
  pub enabled: bool,
  pub description: Option<String>,
}

/// Media Management supporting structures
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaImportOptions {
  pub copy_to_project: bool,
  pub create_proxies: bool,
  pub analyze_content: bool,
  pub generate_thumbnails: bool,
  pub preserve_metadata: bool,
  pub organize_by_date: bool,
  pub organize_by_type: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProxySettings {
  pub resolution: String, // "720p", "1080p", "custom"
  pub codec: String,
  pub quality: String, // "low", "medium", "high"
  pub preserve_audio: bool,
  pub custom_width: Option<u32>,
  pub custom_height: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaSearchFilters {
  pub media_type: Option<String>,
  pub date_range: Option<DateRange>,
  pub duration_range: Option<DurationRange>,
  pub tags: Option<Vec<String>>,
  pub resolution: Option<String>,
  pub file_size_range: Option<FileSizeRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DateRange {
  pub start: String,
  pub end: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DurationRange {
  pub min_seconds: f64,
  pub max_seconds: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FileSizeRange {
  pub min_bytes: f64,
  pub max_bytes: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaExportSettings {
  pub format: String,
  pub codec: Option<String>,
  pub bitrate: Option<u32>,
  pub resolution: Option<String>,
  pub fps: Option<f64>,
  pub quality: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BatchExportItem {
  pub source_path: String,
  pub output_name: String,
  pub export_settings: MediaExportSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaConversionOptions {
  pub codec: Option<String>,
  pub bitrate: Option<u32>,
  pub resolution: Option<String>,
  pub fps: Option<f64>,
  pub start_time: Option<f64>,
  pub duration: Option<f64>,
  pub audio_codec: Option<String>,
  pub audio_bitrate: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaOptimizationSettings {
  pub target_size: Option<f64>, // in bytes
  pub quality_level: String,    // "low", "medium", "high", "auto"
  pub preserve_quality: bool,
  pub reduce_resolution: bool,
  pub max_resolution: Option<String>,
}

/// Result of a command execution
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommandResult {
  pub success: bool,
  pub error: Option<String>,
  pub data: Option<serde_json::Value>,
}

impl CommandResult {
  pub fn success(data: Option<serde_json::Value>) -> Self {
    Self {
      success: true,
      error: None,
      data,
    }
  }

  pub fn error(message: String) -> Self {
    Self {
      success: false,
      error: Some(message),
      data: None,
    }
  }
}
