use super::browser::{BrowserEvent, BrowserTab, SortOrder, ViewMode};
use super::chat::{ChatCommand, ChatEvent, ChatSession};
use super::project_state::{Clip, MediaType, ProjectSettings, TrackType};
use super::{EventBus, PersistenceService, ProjectEvent, ProjectState};
use chrono;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid;

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

/// Update structures
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

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaUpdates {
  pub name: Option<String>,
}

/// Batch update for multiple clips
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ClipBatchUpdate {
  pub clip_id: String,
  pub updates: ClipUpdates,
}

/// Command handler that processes commands and updates state
pub struct CommandHandler {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
  persistence: Arc<PersistenceService>,
}

impl CommandHandler {
  pub fn new(
    state: Arc<RwLock<ProjectState>>,
    event_bus: Arc<EventBus>,
    persistence: Arc<PersistenceService>,
  ) -> Self {
    Self {
      state,
      event_bus,
      persistence,
    }
  }

  /// Execute a command
  pub async fn execute(&self, command: ProjectCommand) -> CommandResult {
    match command {
      ProjectCommand::CreateProject { name, settings } => self.create_project(name, settings).await,
      ProjectCommand::SaveProject { path } => self.save_project(path).await,
      ProjectCommand::AddClip {
        track_id,
        media_id,
        time,
      } => self.add_clip(track_id, media_id, time).await,
      ProjectCommand::MoveClip {
        clip_id,
        track_id,
        time,
      } => self.move_clip(clip_id, track_id, time).await,
      ProjectCommand::Play => self.play().await,
      ProjectCommand::Pause => self.pause().await,
      ProjectCommand::Seek { time } => self.seek(time).await,

      // Player commands
      ProjectCommand::PlayerSetMedia {
        media_id,
        start_time,
      } => self.player_set_media(media_id, start_time).await,
      ProjectCommand::PlayerSetVolume { volume } => self.player_set_volume(volume).await,
      ProjectCommand::PlayerSelectClip { clip_id } => self.player_select_clip(clip_id).await,
      ProjectCommand::PlayerClearSelection => self.player_clear_selection().await,
      ProjectCommand::PlayerSetSource { source } => self.player_set_source(source).await,
      ProjectCommand::PlayerApplyEffect { effect_id, params } => {
        self.player_apply_effect(effect_id, params).await
      }
      ProjectCommand::PlayerApplyFilter { filter_id, params } => {
        self.player_apply_filter(filter_id, params).await
      }
      ProjectCommand::PlayerApplyTemplate {
        template_id,
        media_ids,
      } => self.player_apply_template(template_id, media_ids).await,
      ProjectCommand::PlayerClearEffects => self.player_clear_effects().await,
      ProjectCommand::PlayerClearFilters => self.player_clear_filters().await,
      ProjectCommand::PlayerClearTemplate => self.player_clear_template().await,
      ProjectCommand::AddMedia { path, media_type } => self.add_media(path, media_type).await,
      ProjectCommand::RemoveMedia { media_id } => self.remove_media(media_id).await,
      ProjectCommand::UpdateMedia { media_id, updates } => {
        self.update_media(media_id, updates).await
      }

      // NEW: Version control commands
      ProjectCommand::CreateSnapshot { message } => self.create_snapshot(message).await,
      ProjectCommand::RestoreVersion { version_id } => self.restore_version(version_id).await,
      ProjectCommand::GetVersionHistory { limit } => self.get_version_history(limit).await,
      ProjectCommand::CompareVersions {
        version_a,
        version_b,
      } => self.compare_versions(version_a, version_b).await,
      ProjectCommand::CreateBranch {
        branch_name,
        from_version,
      } => self.create_branch(branch_name, from_version).await,
      ProjectCommand::MergeBranch {
        source_branch,
        target_branch,
      } => self.merge_branch(source_branch, target_branch).await,
      ProjectCommand::SwitchBranch { branch_name } => self.switch_branch(branch_name).await,
      ProjectCommand::SetAutoSaveInterval { seconds } => self.set_auto_save_interval(seconds).await,
      ProjectCommand::EnableAutoSave { enabled } => self.enable_auto_save(enabled).await,

      // Browser commands
      ProjectCommand::BrowserSwitchTab { tab } => self.browser_switch_tab(tab).await,
      ProjectCommand::BrowserSetSearchQuery { query, tab } => {
        self.browser_set_search_query(query, tab).await
      }
      ProjectCommand::BrowserToggleFavorites { tab } => self.browser_toggle_favorites(tab).await,
      ProjectCommand::BrowserSetSort {
        sort_by,
        sort_order,
        tab,
      } => self.browser_set_sort(sort_by, sort_order, tab).await,
      ProjectCommand::BrowserSetGroupBy { group_by, tab } => {
        self.browser_set_group_by(group_by, tab).await
      }
      ProjectCommand::BrowserSetFilter { filter_type, tab } => {
        self.browser_set_filter(filter_type, tab).await
      }
      ProjectCommand::BrowserSetViewMode { view_mode, tab } => {
        self.browser_set_view_mode(view_mode, tab).await
      }
      ProjectCommand::BrowserSetPreviewSize { size_index, tab } => {
        self.browser_set_preview_size(size_index, tab).await
      }
      ProjectCommand::BrowserResetTabSettings { tab } => self.browser_reset_tab_settings(tab).await,
      ProjectCommand::BrowserSelectFile { file_id, tab } => {
        self.browser_select_file(file_id, tab).await
      }
      ProjectCommand::BrowserDeselectFile { file_id, tab } => {
        self.browser_deselect_file(file_id, tab).await
      }
      ProjectCommand::BrowserToggleFileSelection { file_id, tab } => {
        self.browser_toggle_file_selection(file_id, tab).await
      }
      ProjectCommand::BrowserSelectAllFiles { file_ids, tab } => {
        self.browser_select_all_files(file_ids, tab).await
      }
      ProjectCommand::BrowserDeselectAllFiles { tab } => self.browser_deselect_all_files(tab).await,

      // Chat commands
      ProjectCommand::Chat(chat_cmd) => self.handle_chat_command(chat_cmd).await,

      // Analytics commands
      ProjectCommand::LogBrowserAction { action, metadata } => {
        self.log_browser_action(action, metadata).await
      }
      ProjectCommand::LogUserAction {
        action,
        timestamp,
        metadata,
      } => self.log_user_action(action, timestamp, metadata).await,
      ProjectCommand::LogPerformanceMetric {
        metric_name,
        value,
        timestamp,
        metadata,
      } => {
        self
          .log_performance_metric(metric_name, value, timestamp, metadata)
          .await
      }
      ProjectCommand::LogError {
        error_message,
        error_type,
        stack_trace,
        timestamp,
        metadata,
      } => {
        self
          .log_error(error_message, error_type, stack_trace, timestamp, metadata)
          .await
      }
      ProjectCommand::GetAnalytics {
        start_time,
        end_time,
        metric_types,
      } => self.get_analytics(start_time, end_time, metric_types).await,

      // UI State commands
      ProjectCommand::SyncBrowserState { state } => self.sync_browser_state(state).await,
      ProjectCommand::SyncUIState { component, state } => {
        self.sync_ui_state(component, state).await
      }
      ProjectCommand::SaveUIPreferences { preferences } => {
        self.save_ui_preferences(preferences).await
      }
      ProjectCommand::GetUIState { component } => self.get_ui_state(component).await,

      // Resources commands
      ProjectCommand::LoadResources {
        resource_type,
        source,
        category,
      } => self.load_resources(resource_type, source, category).await,
      ProjectCommand::SaveResource {
        resource_id,
        resource_type,
        data,
        metadata,
      } => {
        self
          .save_resource(resource_id, resource_type, data, metadata)
          .await
      }
      ProjectCommand::DeleteResource {
        resource_id,
        resource_type,
      } => self.delete_resource(resource_id, resource_type).await,
      ProjectCommand::PreloadCategory {
        resource_type,
        category,
      } => self.preload_category(resource_type, category).await,
      ProjectCommand::SyncResources { source } => self.sync_resources(source).await,
      ProjectCommand::GetResourceLibrary {
        resource_type,
        category,
      } => self.get_resource_library(resource_type, category).await,

      // Timeline Extended commands
      ProjectCommand::SplitClip { clip_id, time } => self.split_clip(clip_id, time).await,
      ProjectCommand::BatchUpdateClips { updates } => self.batch_update_clips(updates).await,
      ProjectCommand::CopyClips { clip_ids } => self.copy_clips(clip_ids).await,
      ProjectCommand::CutClips { clip_ids } => self.cut_clips(clip_ids).await,
      ProjectCommand::PasteClips { track_id, time } => self.paste_clips(track_id, time).await,
      ProjectCommand::DeleteSelected => self.delete_selected().await,
      ProjectCommand::ApplyEffect {
        clip_id,
        effect_id,
        params,
      } => self.apply_effect(clip_id, effect_id, params).await,
      ProjectCommand::RemoveEffect { clip_id, effect_id } => {
        self.remove_effect(clip_id, effect_id).await
      }
      ProjectCommand::ApplyFilter {
        clip_id,
        filter_id,
        params,
      } => self.apply_filter(clip_id, filter_id, params).await,
      ProjectCommand::RemoveFilter { clip_id, filter_id } => {
        self.remove_filter(clip_id, filter_id).await
      }
      ProjectCommand::ApplyTransition {
        clip_id,
        transition_id,
        params,
      } => self.apply_transition(clip_id, transition_id, params).await,
      ProjectCommand::RemoveTransition {
        clip_id,
        transition_id,
      } => self.remove_transition(clip_id, transition_id).await,
      ProjectCommand::ReorderTracks {
        section_id,
        track_ids,
      } => self.reorder_tracks(section_id, track_ids).await,

      // Project Extended commands
      ProjectCommand::SyncProjectState { project_id, state } => {
        self.sync_project_state(project_id, state).await
      }
      ProjectCommand::NotifyProjectCreated { settings } => {
        self.notify_project_created(settings).await
      }
      ProjectCommand::NotifyProjectOpened { path } => self.notify_project_opened(path).await,

      // Settings commands
      ProjectCommand::SyncUserSettings { settings } => self.sync_user_settings(settings).await,
      ProjectCommand::UpdateApiKey { service, key } => self.update_api_key(service, key).await,
      ProjectCommand::UpdateGpuAcceleration { enabled } => {
        self.update_gpu_acceleration(enabled).await
      }
      ProjectCommand::GetUserSettings => self.get_user_settings().await,

      // AI Chat commands
      ProjectCommand::SendChatMessage {
        session_id,
        message,
        model,
        provider,
        project_context,
      } => {
        self
          .send_chat_message(session_id, message, model, provider, project_context)
          .await
      }
      ProjectCommand::SendStreamingChatMessage {
        session_id,
        message,
        model,
        provider,
        project_context,
      } => {
        self
          .send_streaming_chat_message(session_id, message, model, provider, project_context)
          .await
      }
      ProjectCommand::SaveChatMessage {
        session_id,
        message_id,
        role,
        content,
        metadata,
      } => {
        self
          .save_chat_message(session_id, message_id, role, content, metadata)
          .await
      }
      ProjectCommand::LoadChatHistory { session_id, limit } => {
        self.load_chat_history(session_id, limit).await
      }
      ProjectCommand::CreateChatSession { name, agent_type } => {
        self.create_chat_session(name, agent_type).await
      }
      ProjectCommand::DeleteChatSession { session_id } => {
        self.delete_chat_session(session_id).await
      }
      ProjectCommand::GetProjectContext => self.get_project_context().await,
      ProjectCommand::ValidateAIApiKey { provider, api_key } => {
        self.validate_ai_api_key(provider, api_key).await
      }

      // System commands
      ProjectCommand::ReconnectNotify { timestamp } => self.reconnect_notify(timestamp).await,

      _ => CommandResult::error("Command not implemented yet".to_string()),
    }
  }

  // Command implementations

  async fn create_project(&self, name: String, settings: ProjectSettings) -> CommandResult {
    let project_id = {
      let mut state = self.state.write().await;
      let id = state.create_project(name.clone(), settings);
      state.mark_dirty();
      id
    };

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ProjectCreated {
          project_id: project_id.clone(),
          name,
        },
        "command_handler".to_string(),
        self.state.read().await.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "project_id": project_id })))
  }

  async fn save_project(&self, path: Option<String>) -> CommandResult {
    let state = self.state.read().await;

    let project = match &state.project {
      Some(p) => p,
      None => return CommandResult::error("No project to save".to_string()),
    };

    let save_path = path.or(project.metadata.file_path.clone());
    let save_path = match save_path {
      Some(p) => p,
      None => return CommandResult::error("No path specified for saving".to_string()),
    };

    // Save project ID before dropping state
    let project_id = project.id.clone();

    // Save through persistence service
    match self.persistence.save_project(&state, &save_path).await {
      Ok(_) => {
        // Mark as clean
        drop(state);
        let mut state = self.state.write().await;
        if let Some(ref mut project) = state.project {
          project.metadata.is_dirty = false;
          project.metadata.file_path = Some(save_path.clone());
        }

        self
          .event_bus
          .publish(
            ProjectEvent::ProjectSaved {
              project_id,
              path: save_path.clone(),
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({ "path": save_path })))
      }
      Err(e) => CommandResult::error(format!("Failed to save project: {}", e)),
    }
  }

  async fn add_clip(&self, track_id: String, media_id: String, time: f64) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the track
    let track = match project
      .timeline
      .tracks
      .iter_mut()
      .find(|t| t.id == track_id)
    {
      Some(t) => t,
      None => return CommandResult::error("Track not found".to_string()),
    };

    // Verify media exists
    if !project.media_pool.items.contains_key(&media_id) {
      return CommandResult::error("Media not found in pool".to_string());
    }

    // Create clip
    let clip_id = uuid::Uuid::new_v4().to_string();
    let media = &project.media_pool.items[&media_id];
    let duration = media.duration.unwrap_or(5.0); // Default 5 seconds for images

    let clip = Clip {
      id: clip_id.clone(),
      media_id: media_id.clone(),
      name: media.name.clone(),
      timeline_in: time,
      timeline_out: time + duration,
      source_in: 0.0,
      source_out: duration,
      playback_rate: 1.0,
      enabled: true,
      effects: Vec::new(),
      transitions: Vec::new(),
    };

    // Add clip to track
    track.clips.push(clip.clone());
    track
      .clips
      .sort_by(|a, b| a.timeline_in.partial_cmp(&b.timeline_in).unwrap());

    state.mark_dirty();
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipAdded {
          track_id,
          clip: super::events::ClipData {
            id: clip_id.clone(),
            media_id,
            name: clip.name,
            timeline_in: clip.timeline_in,
            timeline_out: clip.timeline_out,
            source_in: clip.source_in,
            source_out: clip.source_out,
          },
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "clip_id": clip_id })))
  }

  async fn move_clip(&self, clip_id: String, new_track_id: String, new_time: f64) -> CommandResult {
    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find and remove clip from current track
    let mut clip = None;

    for track in &mut project.timeline.tracks {
      if let Some(pos) = track.clips.iter().position(|c| c.id == clip_id) {
        clip = Some(track.clips.remove(pos));
        break;
      }
    }

    let mut clip = match clip {
      Some(c) => c,
      None => return CommandResult::error("Clip not found".to_string()),
    };

    // Find new track
    let new_track = match project
      .timeline
      .tracks
      .iter_mut()
      .find(|t| t.id == new_track_id)
    {
      Some(t) => t,
      None => return CommandResult::error("Target track not found".to_string()),
    };

    // Update clip position
    let duration = clip.timeline_out - clip.timeline_in;
    clip.timeline_in = new_time;
    clip.timeline_out = new_time + duration;

    // Add to new track
    new_track.clips.push(clip);
    new_track
      .clips
      .sort_by(|a, b| a.timeline_in.partial_cmp(&b.timeline_in).unwrap());

    state.mark_dirty();
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipMoved {
          clip_id,
          new_track_id,
          new_time,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn play(&self) -> CommandResult {
    let mut state = self.state.write().await;

    if state.project.is_none() {
      return CommandResult::error("No project open".to_string());
    }

    state.playback_state.is_playing = true;
    let time = state.playback_state.current_time;
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlaybackStarted { time },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn pause(&self) -> CommandResult {
    let mut state = self.state.write().await;

    if state.project.is_none() {
      return CommandResult::error("No project open".to_string());
    }

    state.playback_state.is_playing = false;
    let time = state.playback_state.current_time;
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlaybackStopped { time },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn seek(&self, time: f64) -> CommandResult {
    let mut state = self.state.write().await;

    if state.project.is_none() {
      return CommandResult::error("No project open".to_string());
    }

    state.playback_state.current_time = time;
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlaybackSeeked { time },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  // Player command implementations

  async fn player_set_media(&self, media_id: String, start_time: Option<f64>) -> CommandResult {
    let mut state = self.state.write().await;

    // Verify media exists in project if we have one
    if let Some(ref project) = state.project {
      if !project.media_pool.items.contains_key(&media_id) {
        return CommandResult::error("Media not found in pool".to_string());
      }
    }

    state.playback_state.current_media_id = Some(media_id.clone());
    if let Some(time) = start_time {
      state.playback_state.current_time = time;
    }
    state.playback_state.is_loading = true;

    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerMediaSet {
          media_id,
          start_time,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn player_set_volume(&self, volume: f32) -> CommandResult {
    let mut state = self.state.write().await;
    state.playback_state.volume = volume.clamp(0.0, 1.0);
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerVolumeChanged { volume },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn player_select_clip(&self, clip_id: String) -> CommandResult {
    let mut state = self.state.write().await;

    // Verify clip exists if we have a project
    if let Some(ref project) = state.project {
      let clip_exists = project
        .timeline
        .tracks
        .iter()
        .any(|track| track.clips.iter().any(|clip| clip.id == clip_id));

      if !clip_exists {
        return CommandResult::error("Clip not found".to_string());
      }
    }

    state.playback_state.selected_clip_id = Some(clip_id.clone());
    state.playback_state.video_source = PlayerSource::Timeline;

    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerClipSelected { clip_id },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn player_clear_selection(&self) -> CommandResult {
    let mut state = self.state.write().await;
    state.playback_state.selected_clip_id = None;
    state.playback_state.video_source = PlayerSource::Browser;

    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerSelectionCleared,
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn player_set_source(&self, source: PlayerSource) -> CommandResult {
    let mut state = self.state.write().await;
    state.playback_state.video_source = source.clone();

    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerSourceChanged { source },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn player_apply_effect(
    &self,
    effect_id: String,
    params: serde_json::Value,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    let applied_effect = super::project_state::AppliedEffect {
      id: uuid::Uuid::new_v4().to_string(),
      effect_id: effect_id.clone(),
      params,
      enabled: true,
    };

    state
      .playback_state
      .applied_effects
      .push(applied_effect.clone());
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerEffectApplied {
          effect_id: applied_effect.id,
          effect_name: effect_id,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn player_apply_filter(
    &self,
    filter_id: String,
    params: serde_json::Value,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    let applied_filter = super::project_state::AppliedFilter {
      id: uuid::Uuid::new_v4().to_string(),
      filter_id: filter_id.clone(),
      params,
      enabled: true,
    };

    state
      .playback_state
      .applied_filters
      .push(applied_filter.clone());
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerFilterApplied {
          filter_id: applied_filter.id,
          filter_name: filter_id,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn player_apply_template(
    &self,
    template_id: String,
    media_ids: Vec<String>,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    let applied_template = super::project_state::AppliedTemplate {
      id: uuid::Uuid::new_v4().to_string(),
      template_id: template_id.clone(),
      media_ids: media_ids.clone(),
      params: serde_json::json!({}),
    };

    state.playback_state.applied_template = Some(applied_template);
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerTemplateApplied {
          template_id,
          media_ids,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn player_clear_effects(&self) -> CommandResult {
    let mut state = self.state.write().await;
    state.playback_state.applied_effects.clear();
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerEffectsCleared,
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn player_clear_filters(&self) -> CommandResult {
    let mut state = self.state.write().await;
    state.playback_state.applied_filters.clear();
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerFiltersCleared,
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn player_clear_template(&self) -> CommandResult {
    let mut state = self.state.write().await;
    state.playback_state.applied_template = None;
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::PlayerTemplateCleared,
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  async fn add_media(&self, path: String, media_type: MediaType) -> CommandResult {
    use super::project_state::{MediaItem, MediaMetadata};
    use std::path::Path;

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Generate unique ID for the media item
    let media_id = uuid::Uuid::new_v4().to_string();

    // Extract file name from path
    let file_name = Path::new(&path)
      .file_name()
      .and_then(|n| n.to_str())
      .unwrap_or("Unknown")
      .to_string();

    // Create media item
    let media_item = MediaItem {
      id: media_id.clone(),
      path: path.clone(),
      name: file_name.clone(),
      media_type: media_type.clone(),
      duration: None, // Will be set by frontend after media loading
      metadata: MediaMetadata {
        format: String::new(),
        codec: None,
        resolution: None,
        frame_rate: None,
        bitrate: None,
        audio_channels: None,
        sample_rate: None,
      },
      thumbnail: None,
      usage_count: 0,
    };

    // Add to media pool
    project
      .media_pool
      .items
      .insert(media_id.clone(), media_item);
    state.mark_dirty();

    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::MediaAdded {
          media: super::events::MediaData {
            id: media_id.clone(),
            path: path.clone(),
            name: file_name.clone(),
            media_type: match media_type {
              MediaType::Video => "Video".to_string(),
              MediaType::Audio => "Audio".to_string(),
              MediaType::Image => "Image".to_string(),
            },
            duration: None,
          },
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "media_id": media_id })))
  }

  async fn remove_media(&self, media_id: String) -> CommandResult {
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

  async fn update_media(&self, media_id: String, updates: MediaUpdates) -> CommandResult {
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
          changes: super::events::MediaChanges {
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

  // NEW: Version control command implementations

  async fn create_snapshot(&self, message: Option<String>) -> CommandResult {
    let state = self.state.read().await;

    let project = match &state.project {
      Some(p) => p,
      None => return CommandResult::error("No project to create snapshot for".to_string()),
    };

    // Create snapshot
    let snapshot = state.create_snapshot(
      "system".to_string(), // TODO: Get actual user info
      message.clone(),
      Some(state.version_info.current_version_id.clone()),
    );

    let snapshot_id = snapshot.id.clone();
    let project_id = project.id.clone();

    // Save snapshot through persistence service
    match self.persistence.save_snapshot(&snapshot).await {
      Ok(_) => {
        // Update state with new version info
        drop(state);
        let mut state = self.state.write().await;
        state.mark_snapshot_created(snapshot_id.clone());

        let version = state.version;

        // Publish event
        self
          .event_bus
          .publish(
            ProjectEvent::SnapshotCreated {
              version_id: snapshot_id.clone(),
              message,
              parent_version: Some(state.version_info.current_version_id.clone()),
            },
            "command_handler".to_string(),
            version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({
          "version_id": snapshot_id,
          "project_id": project_id
        })))
      }
      Err(e) => CommandResult::error(format!("Failed to create snapshot: {}", e)),
    }
  }

  async fn restore_version(&self, version_id: String) -> CommandResult {
    // Load snapshot from persistence
    let snapshot = match self.persistence.load_snapshot(&version_id).await {
      Ok(s) => s,
      Err(e) => return CommandResult::error(format!("Failed to load version: {}", e)),
    };

    let previous_version_id = {
      let state = self.state.read().await;
      state.version_info.current_version_id.clone()
    };

    // Replace current state with snapshot state
    {
      let mut state = self.state.write().await;
      *state = snapshot.project_state;
      state.version += 1; // Increment version for the restore operation
    }

    let version = {
      let state = self.state.read().await;
      state.version
    };

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::VersionRestored {
          version_id: version_id.clone(),
          previous_version: previous_version_id,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "version_id": version_id,
      "restored_at": chrono::Utc::now().to_rfc3339()
    })))
  }

  async fn get_version_history(&self, limit: Option<u32>) -> CommandResult {
    match self.persistence.get_version_history(limit).await {
      Ok(versions) => CommandResult::success(Some(serde_json::json!({
        "versions": versions,
        "count": versions.len()
      }))),
      Err(e) => CommandResult::error(format!("Failed to get version history: {}", e)),
    }
  }

  async fn compare_versions(&self, version_a: String, version_b: String) -> CommandResult {
    // Load both snapshots
    let snapshot_a = match self.persistence.load_snapshot(&version_a).await {
      Ok(s) => s,
      Err(e) => return CommandResult::error(format!("Failed to load version A: {}", e)),
    };

    let snapshot_b = match self.persistence.load_snapshot(&version_b).await {
      Ok(s) => s,
      Err(e) => return CommandResult::error(format!("Failed to load version B: {}", e)),
    };

    // TODO: Implement actual diff computation
    // For now, return basic comparison info
    CommandResult::success(Some(serde_json::json!({
      "version_a": {
        "id": snapshot_a.id,
        "timestamp": snapshot_a.timestamp,
        "message": snapshot_a.message
      },
      "version_b": {
        "id": snapshot_b.id,
        "timestamp": snapshot_b.timestamp,
        "message": snapshot_b.message
      },
      "diff_summary": "Diff computation not yet implemented"
    })))
  }

  async fn create_branch(
    &self,
    branch_name: String,
    from_version: Option<String>,
  ) -> CommandResult {
    let mut state = self.state.write().await;

    // Switch to new branch
    state.switch_branch(branch_name.clone());

    let base_version =
      from_version.unwrap_or_else(|| state.version_info.current_version_id.clone());
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::BranchCreated {
          branch_name: branch_name.clone(),
          base_version: base_version.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "branch_name": branch_name,
      "base_version": base_version
    })))
  }

  async fn merge_branch(&self, _source_branch: String, _target_branch: String) -> CommandResult {
    // TODO: Implement branch merging
    // This is a complex operation that would require:
    // 1. Loading states from both branches
    // 2. Computing conflicts
    // 3. Allowing user to resolve conflicts
    // 4. Creating merged state

    CommandResult::error("Branch merging not yet implemented".to_string())
  }

  async fn switch_branch(&self, branch_name: String) -> CommandResult {
    let mut state = self.state.write().await;
    let old_branch = state.version_info.branch_name.clone();

    state.switch_branch(branch_name.clone());
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::BranchSwitched {
          from_branch: old_branch,
          to_branch: branch_name.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "branch_name": branch_name
    })))
  }

  async fn set_auto_save_interval(&self, seconds: u32) -> CommandResult {
    let mut state = self.state.write().await;
    let current_enabled = state.version_info.auto_save_enabled;
    state.configure_auto_save(current_enabled, seconds);

    CommandResult::success(Some(serde_json::json!({
      "auto_save_interval_seconds": seconds
    })))
  }

  async fn enable_auto_save(&self, enabled: bool) -> CommandResult {
    let mut state = self.state.write().await;
    let current_interval = state.version_info.auto_save_interval_seconds;
    state.configure_auto_save(enabled, current_interval);

    CommandResult::success(Some(serde_json::json!({
      "auto_save_enabled": enabled
    })))
  }

  // Chat command handlers
  async fn handle_chat_command(&self, command: ChatCommand) -> CommandResult {
    match command {
      ChatCommand::CreateChatSession { name } => {
        let session = ChatSession::new(name);
        let session_id = session.id.clone();

        let mut state = self.state.write().await;
        state.chat_sessions.push(session.clone());
        state.version += 1;

        // Publish event
        self
          .event_bus
          .publish(
            ProjectEvent::Chat(ChatEvent::ChatSessionCreated { session }),
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({
          "session_id": session_id
        })))
      }

      ChatCommand::DeleteChatSession { session_id } => {
        let mut state = self.state.write().await;

        let initial_len = state.chat_sessions.len();
        state.chat_sessions.retain(|s| s.id != session_id);

        if state.chat_sessions.len() < initial_len {
          state.version += 1;

          self
            .event_bus
            .publish(
              ProjectEvent::Chat(ChatEvent::ChatSessionDeleted {
                session_id: session_id.clone(),
              }),
              "command_handler".to_string(),
              state.version,
            )
            .await
            .ok();

          CommandResult::success(None)
        } else {
          CommandResult::error("Chat session not found".to_string())
        }
      }

      ChatCommand::SendChatMessage {
        session_id,
        content,
        role,
      } => {
        let mut state = self.state.write().await;

        if let Some(session) = state.chat_sessions.iter_mut().find(|s| s.id == session_id) {
          let message = session.add_message(content, role);
          state.version += 1;

          self
            .event_bus
            .publish(
              ProjectEvent::Chat(ChatEvent::ChatMessageAdded {
                session_id: session_id.clone(),
                message: message.clone(),
              }),
              "command_handler".to_string(),
              state.version,
            )
            .await
            .ok();

          CommandResult::success(Some(serde_json::json!({
            "message_id": message.id
          })))
        } else {
          CommandResult::error("Chat session not found".to_string())
        }
      }

      ChatCommand::ClearChatSession { session_id } => {
        let mut state = self.state.write().await;

        if let Some(session) = state.chat_sessions.iter_mut().find(|s| s.id == session_id) {
          session.clear_messages();
          state.version += 1;

          self
            .event_bus
            .publish(
              ProjectEvent::Chat(ChatEvent::ChatSessionCleared {
                session_id: session_id.clone(),
              }),
              "command_handler".to_string(),
              state.version,
            )
            .await
            .ok();

          CommandResult::success(None)
        } else {
          CommandResult::error("Chat session not found".to_string())
        }
      }

      ChatCommand::UpdateChatSession {
        session_id,
        name,
        metadata,
      } => {
        let mut state = self.state.write().await;

        if let Some(session) = state.chat_sessions.iter_mut().find(|s| s.id == session_id) {
          session.update(name.clone(), metadata.clone());
          state.version += 1;

          self
            .event_bus
            .publish(
              ProjectEvent::Chat(ChatEvent::ChatSessionUpdated {
                session_id: session_id.clone(),
                name,
                metadata,
              }),
              "command_handler".to_string(),
              state.version,
            )
            .await
            .ok();

          CommandResult::success(None)
        } else {
          CommandResult::error("Chat session not found".to_string())
        }
      }
    }
  }

  // Browser command handlers
  async fn browser_switch_tab(&self, tab: BrowserTab) -> CommandResult {
    let mut state = self.state.write().await;
    state.browser_state.switch_tab(tab.clone());
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::TabSwitched { tab: tab.clone() }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "tab": tab })))
  }

  async fn browser_set_search_query(
    &self,
    query: String,
    tab: Option<BrowserTab>,
  ) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .set_search_query(query.clone(), Some(target_tab.clone()));
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::SearchQueryChanged {
          tab: target_tab,
          query: query.clone(),
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "query": query })))
  }

  async fn browser_toggle_favorites(&self, tab: Option<BrowserTab>) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .toggle_favorites(Some(target_tab.clone()));
    let show_favorites = state
      .browser_state
      .get_tab_settings(&target_tab)
      .show_favorites_only;
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::FavoritesToggled {
          tab: target_tab,
          show_favorites,
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(
      serde_json::json!({ "show_favorites": show_favorites }),
    ))
  }

  async fn browser_set_sort(
    &self,
    sort_by: String,
    sort_order: SortOrder,
    tab: Option<BrowserTab>,
  ) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state.browser_state.set_sort(
      sort_by.clone(),
      sort_order.clone(),
      Some(target_tab.clone()),
    );
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::SortChanged {
          tab: target_tab,
          sort_by: sort_by.clone(),
          sort_order: sort_order.clone(),
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "sort_by": sort_by,
      "sort_order": sort_order
    })))
  }

  async fn browser_set_group_by(&self, group_by: String, tab: Option<BrowserTab>) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .set_group_by(group_by.clone(), Some(target_tab.clone()));
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::GroupByChanged {
          tab: target_tab,
          group_by: group_by.clone(),
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "group_by": group_by })))
  }

  async fn browser_set_filter(
    &self,
    filter_type: String,
    tab: Option<BrowserTab>,
  ) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .set_filter_type(filter_type.clone(), Some(target_tab.clone()));
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::FilterChanged {
          tab: target_tab,
          filter_type: filter_type.clone(),
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "filter_type": filter_type })))
  }

  async fn browser_set_view_mode(
    &self,
    view_mode: ViewMode,
    tab: Option<BrowserTab>,
  ) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .set_view_mode(view_mode.clone(), Some(target_tab.clone()));
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::ViewModeChanged {
          tab: target_tab,
          view_mode: view_mode.clone(),
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "view_mode": view_mode })))
  }

  async fn browser_set_preview_size(
    &self,
    size_index: u32,
    tab: Option<BrowserTab>,
  ) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .set_preview_size(size_index, Some(target_tab.clone()));
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::PreviewSizeChanged {
          tab: target_tab,
          size_index,
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "size_index": size_index })))
  }

  async fn browser_reset_tab_settings(&self, tab: BrowserTab) -> CommandResult {
    let mut state = self.state.write().await;
    state.browser_state.reset_tab_settings(tab.clone());
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::TabSettingsReset { tab: tab.clone() }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "tab": tab })))
  }

  async fn browser_select_file(&self, file_id: String, tab: Option<BrowserTab>) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .select_file(file_id.clone(), Some(target_tab.clone()));
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::FileSelected {
          tab: target_tab,
          file_id: file_id.clone(),
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "file_id": file_id })))
  }

  async fn browser_deselect_file(&self, file_id: String, tab: Option<BrowserTab>) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .deselect_file(file_id.clone(), Some(target_tab.clone()));
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::FileDeselected {
          tab: target_tab,
          file_id: file_id.clone(),
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "file_id": file_id })))
  }

  async fn browser_toggle_file_selection(
    &self,
    file_id: String,
    tab: Option<BrowserTab>,
  ) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .toggle_file_selection(file_id.clone(), Some(target_tab.clone()));
    let is_selected = state
      .browser_state
      .get_selected_files(&target_tab)
      .contains(&file_id);
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::FileSelectionToggled {
          tab: target_tab,
          file_id: file_id.clone(),
          is_selected,
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "file_id": file_id,
      "is_selected": is_selected
    })))
  }

  async fn browser_select_all_files(
    &self,
    file_ids: Vec<String>,
    tab: Option<BrowserTab>,
  ) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .select_all_files(file_ids.clone(), Some(target_tab.clone()));
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::AllFilesSelected {
          tab: target_tab,
          file_ids: file_ids.clone(),
        }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "file_ids": file_ids })))
  }

  async fn browser_deselect_all_files(&self, tab: Option<BrowserTab>) -> CommandResult {
    let mut state = self.state.write().await;
    let target_tab = tab.unwrap_or_else(|| state.browser_state.active_tab.clone());
    state
      .browser_state
      .deselect_all_files(Some(target_tab.clone()));
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::Browser(BrowserEvent::AllFilesDeselected { tab: target_tab }),
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  // ===========================
  // Analytics Commands
  // ===========================

  async fn log_browser_action(
    &self,
    action: String,
    metadata: HashMap<String, serde_json::Value>,
  ) -> CommandResult {
    // For now, just log to console. Later can be saved to analytics database
    log::info!("Browser action: {} with metadata: {:?}", action, metadata);

    // Could emit analytics event for tracking
    CommandResult::success(Some(serde_json::json!({
      "logged": true,
      "action": action,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn log_user_action(
    &self,
    action: String,
    timestamp: chrono::DateTime<chrono::Utc>,
    metadata: HashMap<String, serde_json::Value>,
  ) -> CommandResult {
    log::info!(
      "User action: {} at {} with metadata: {:?}",
      action,
      timestamp,
      metadata
    );
    CommandResult::success(Some(serde_json::json!({
      "logged": true,
      "action": action,
      "timestamp": timestamp
    })))
  }

  async fn log_performance_metric(
    &self,
    metric_name: String,
    value: f64,
    timestamp: chrono::DateTime<chrono::Utc>,
    metadata: HashMap<String, serde_json::Value>,
  ) -> CommandResult {
    log::info!(
      "Performance metric: {} = {} at {} with metadata: {:?}",
      metric_name,
      value,
      timestamp,
      metadata
    );
    CommandResult::success(Some(serde_json::json!({
      "logged": true,
      "metric": metric_name,
      "value": value,
      "timestamp": timestamp
    })))
  }

  async fn log_error(
    &self,
    error_message: String,
    error_type: String,
    stack_trace: Option<String>,
    timestamp: chrono::DateTime<chrono::Utc>,
    metadata: HashMap<String, serde_json::Value>,
  ) -> CommandResult {
    log::error!(
      "Error logged: {} [{}] at {} with stack: {:?} and metadata: {:?}",
      error_message,
      error_type,
      timestamp,
      stack_trace,
      metadata
    );
    CommandResult::success(Some(serde_json::json!({
      "logged": true,
      "error": error_message,
      "type": error_type,
      "timestamp": timestamp
    })))
  }

  async fn get_analytics(
    &self,
    _start_time: Option<chrono::DateTime<chrono::Utc>>,
    _end_time: Option<chrono::DateTime<chrono::Utc>>,
    _metric_types: Option<Vec<String>>,
  ) -> CommandResult {
    // Return mock analytics data for now
    CommandResult::success(Some(serde_json::json!({
      "metrics": [],
      "events": [],
      "summary": {
        "total_events": 0,
        "time_range": "No data available yet"
      }
    })))
  }

  // ===========================
  // UI State Commands
  // ===========================

  async fn sync_browser_state(&self, state: serde_json::Value) -> CommandResult {
    let mut project_state = self.state.write().await;

    // Store UI state in the project state
    if project_state.ui_state.browser_state.is_none() {
      project_state.ui_state.browser_state = Some(state.clone());
    } else {
      project_state.ui_state.browser_state = Some(state.clone());
    }

    log::info!("Browser state synced to backend");
    CommandResult::success(Some(serde_json::json!({
      "synced": true,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn sync_ui_state(&self, component: String, _state: serde_json::Value) -> CommandResult {
    log::info!("UI state synced for component: {}", component);

    // Could store component-specific UI state
    CommandResult::success(Some(serde_json::json!({
      "synced": true,
      "component": component,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn save_ui_preferences(
    &self,
    preferences: HashMap<String, serde_json::Value>,
  ) -> CommandResult {
    log::info!("UI preferences saved: {:?}", preferences);

    CommandResult::success(Some(serde_json::json!({
      "saved": true,
      "preferences_count": preferences.len(),
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn get_ui_state(&self, component: Option<String>) -> CommandResult {
    let state = self.state.read().await;

    match component {
      Some(comp) => {
        log::info!("Getting UI state for component: {}", comp);
        CommandResult::success(Some(serde_json::json!({
          "component": comp,
          "state": {},
          "timestamp": chrono::Utc::now()
        })))
      }
      None => CommandResult::success(Some(serde_json::json!({
        "browser_state": state.ui_state.browser_state,
        "timestamp": chrono::Utc::now()
      }))),
    }
  }

  // ===========================
  // Resources Commands
  // ===========================

  async fn load_resources(
    &self,
    resource_type: String,
    source: String,
    category: Option<String>,
  ) -> CommandResult {
    log::info!(
      "Loading resources: type={}, source={}, category={:?}",
      resource_type,
      source,
      category
    );

    // Mock resource data for now
    let resources = match resource_type.as_str() {
      "effect" => vec!["blur", "sharpen", "color_correction"],
      "filter" => vec!["vintage", "black_white", "sepia"],
      "transition" => vec!["fade", "slide", "zoom"],
      _ => vec!["unknown"],
    };

    CommandResult::success(Some(serde_json::json!({
      "success": true,
      "data": resources,
      "source": source,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn save_resource(
    &self,
    resource_id: String,
    resource_type: String,
    _data: serde_json::Value,
    _metadata: HashMap<String, serde_json::Value>,
  ) -> CommandResult {
    log::info!(
      "Saving resource: id={}, type={}",
      resource_id,
      resource_type
    );

    CommandResult::success(Some(serde_json::json!({
      "saved": true,
      "resource_id": resource_id,
      "type": resource_type,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn delete_resource(&self, resource_id: String, resource_type: String) -> CommandResult {
    log::info!(
      "Deleting resource: id={}, type={}",
      resource_id,
      resource_type
    );

    CommandResult::success(Some(serde_json::json!({
      "deleted": true,
      "resource_id": resource_id,
      "type": resource_type,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn preload_category(&self, resource_type: String, category: String) -> CommandResult {
    log::info!(
      "Preloading category: type={}, category={}",
      resource_type,
      category
    );

    CommandResult::success(Some(serde_json::json!({
      "preloaded": true,
      "type": resource_type,
      "category": category,
      "count": 10,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn sync_resources(&self, source: String) -> CommandResult {
    log::info!("Syncing resources from source: {}", source);

    CommandResult::success(Some(serde_json::json!({
      "synced": true,
      "source": source,
      "count": 42,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn get_resource_library(
    &self,
    resource_type: Option<String>,
    category: Option<String>,
  ) -> CommandResult {
    log::info!(
      "Getting resource library: type={:?}, category={:?}",
      resource_type,
      category
    );

    CommandResult::success(Some(serde_json::json!({
      "library": {
        "effects": ["blur", "sharpen", "color_correction"],
        "filters": ["vintage", "black_white", "sepia"],
        "transitions": ["fade", "slide", "zoom"]
      },
      "timestamp": chrono::Utc::now()
    })))
  }

  // ===========================
  // Timeline Extended Commands
  // ===========================

  async fn split_clip(&self, clip_id: String, time: f64) -> CommandResult {
    log::info!("Splitting clip: id={}, time={}", clip_id, time);

    // Mock implementation - in real app would modify project state
    CommandResult::success(Some(serde_json::json!({
      "split": true,
      "original_clip_id": clip_id,
      "new_clip_id": format!("{}_split", clip_id),
      "split_time": time,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn batch_update_clips(&self, updates: Vec<ClipBatchUpdate>) -> CommandResult {
    log::info!("Batch updating {} clips", updates.len());

    CommandResult::success(Some(serde_json::json!({
      "updated": true,
      "count": updates.len(),
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn copy_clips(&self, clip_ids: Vec<String>) -> CommandResult {
    log::info!("Copying {} clips", clip_ids.len());

    CommandResult::success(Some(serde_json::json!({
      "copied": true,
      "count": clip_ids.len(),
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn cut_clips(&self, clip_ids: Vec<String>) -> CommandResult {
    log::info!("Cutting {} clips", clip_ids.len());

    CommandResult::success(Some(serde_json::json!({
      "cut": true,
      "count": clip_ids.len(),
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn paste_clips(&self, track_id: String, time: f64) -> CommandResult {
    log::info!("Pasting clips to track {} at time {}", track_id, time);

    CommandResult::success(Some(serde_json::json!({
      "pasted": true,
      "track_id": track_id,
      "time": time,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn delete_selected(&self) -> CommandResult {
    log::info!("Deleting selected items");

    CommandResult::success(Some(serde_json::json!({
      "deleted": true,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn apply_effect(
    &self,
    clip_id: String,
    effect_id: String,
    _params: serde_json::Value,
  ) -> CommandResult {
    log::info!("Applying effect {} to clip {}", effect_id, clip_id);

    CommandResult::success(Some(serde_json::json!({
      "applied": true,
      "clip_id": clip_id,
      "effect_id": effect_id,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn remove_effect(&self, clip_id: String, effect_id: String) -> CommandResult {
    log::info!("Removing effect {} from clip {}", effect_id, clip_id);

    CommandResult::success(Some(serde_json::json!({
      "removed": true,
      "clip_id": clip_id,
      "effect_id": effect_id,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn apply_filter(
    &self,
    clip_id: String,
    filter_id: String,
    _params: serde_json::Value,
  ) -> CommandResult {
    log::info!("Applying filter {} to clip {}", filter_id, clip_id);

    CommandResult::success(Some(serde_json::json!({
      "applied": true,
      "clip_id": clip_id,
      "filter_id": filter_id,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn remove_filter(&self, clip_id: String, filter_id: String) -> CommandResult {
    log::info!("Removing filter {} from clip {}", filter_id, clip_id);

    CommandResult::success(Some(serde_json::json!({
      "removed": true,
      "clip_id": clip_id,
      "filter_id": filter_id,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn apply_transition(
    &self,
    clip_id: String,
    transition_id: String,
    _params: serde_json::Value,
  ) -> CommandResult {
    log::info!("Applying transition {} to clip {}", transition_id, clip_id);

    CommandResult::success(Some(serde_json::json!({
      "applied": true,
      "clip_id": clip_id,
      "transition_id": transition_id,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn remove_transition(&self, clip_id: String, transition_id: String) -> CommandResult {
    log::info!(
      "Removing transition {} from clip {}",
      transition_id,
      clip_id
    );

    CommandResult::success(Some(serde_json::json!({
      "removed": true,
      "clip_id": clip_id,
      "transition_id": transition_id,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn reorder_tracks(&self, section_id: String, track_ids: Vec<String>) -> CommandResult {
    log::info!(
      "Reordering tracks in section {}: {:?}",
      section_id,
      track_ids
    );

    CommandResult::success(Some(serde_json::json!({
      "reordered": true,
      "section_id": section_id,
      "track_count": track_ids.len(),
      "timestamp": chrono::Utc::now()
    })))
  }

  // ===========================
  // Project Extended Commands
  // ===========================

  async fn sync_project_state(
    &self,
    project_id: String,
    _state: serde_json::Value,
  ) -> CommandResult {
    log::info!("Syncing project state for project {}", project_id);

    CommandResult::success(Some(serde_json::json!({
      "synced": true,
      "project_id": project_id,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn notify_project_created(&self, settings: ProjectSettings) -> CommandResult {
    log::info!("Project created notification with settings");

    CommandResult::success(Some(serde_json::json!({
      "notified": true,
      "settings": settings,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn notify_project_opened(&self, path: String) -> CommandResult {
    log::info!("Project opened notification for path: {}", path);

    CommandResult::success(Some(serde_json::json!({
      "notified": true,
      "path": path,
      "timestamp": chrono::Utc::now()
    })))
  }

  // ===========================
  // Settings Commands
  // ===========================

  async fn sync_user_settings(&self, _settings: serde_json::Value) -> CommandResult {
    log::info!("Syncing user settings");

    CommandResult::success(Some(serde_json::json!({
      "synced": true,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn update_api_key(&self, service: String, _key: String) -> CommandResult {
    log::info!("Updating API key for service: {}", service);

    // In real implementation, would securely store the key
    CommandResult::success(Some(serde_json::json!({
      "updated": true,
      "service": service,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn update_gpu_acceleration(&self, enabled: bool) -> CommandResult {
    log::info!("Updating GPU acceleration: {}", enabled);

    CommandResult::success(Some(serde_json::json!({
      "updated": true,
      "gpu_acceleration": enabled,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn get_user_settings(&self) -> CommandResult {
    log::info!("Getting user settings");

    CommandResult::success(Some(serde_json::json!({
      "settings": {
        "theme": "dark",
        "language": "ru",
        "gpu_acceleration": true
      },
      "timestamp": chrono::Utc::now()
    })))
  }

  // ===========================
  // System Commands
  // ===========================

  async fn reconnect_notify(&self, timestamp: String) -> CommandResult {
    log::info!("Reconnect notification at {}", timestamp);

    CommandResult::success(Some(serde_json::json!({
      "reconnected": true,
      "timestamp": timestamp
    })))
  }

  // ===========================
  // AI Chat Commands
  // ===========================

  async fn send_chat_message(
    &self,
    session_id: String,
    message: String,
    model: String,
    provider: String,
    project_context: Option<serde_json::Value>,
  ) -> CommandResult {
    use crate::video_compiler::commands::ai_api_proxy::commands::claude_send_message;
    use crate::video_compiler::commands::ai_api_proxy::types::ClaudeMessage;

    log::info!(
      "Sending chat message to {} model {} in session {}",
      provider,
      model,
      session_id
    );

    // TODO: Get API key from user settings
    let api_key = "temp_key".to_string(); // This should come from secure storage

    // Build messages array with context if provided
    let mut messages = vec![];

    // Add project context as system message if provided
    if let Some(context) = project_context {
      messages.push(ClaudeMessage {
        role: "system".to_string(),
        content: format!("Project context: {}", context),
      });
    }

    // Add user message
    messages.push(ClaudeMessage {
      role: "user".to_string(),
      content: message,
    });

    // Send to AI provider
    match provider.as_str() {
      "claude" => {
        match claude_send_message(
          api_key,
          model,
          messages,
          Some(4096), // max_tokens
          Some(0.7),  // temperature
          None,       // system
        )
        .await
        {
          Ok(response) => {
            // Extract text from response
            let response_text = response
              .content
              .iter()
              .filter_map(|c| c.text.as_ref())
              .map(|s| s.as_str())
              .collect::<Vec<_>>()
              .join("");

            CommandResult::success(Some(serde_json::json!({
              "response": response_text,
              "session_id": session_id,
              "message_id": response.id,
              "model": response.model,
              "usage": response.usage
            })))
          }
          Err(e) => CommandResult::error(format!("AI request failed: {}", e)),
        }
      }
      _ => CommandResult::error(format!("Unsupported AI provider: {}", provider)),
    }
  }

  async fn send_streaming_chat_message(
    &self,
    session_id: String,
    message: String,
    model: String,
    provider: String,
    project_context: Option<serde_json::Value>,
  ) -> CommandResult {
    use crate::video_compiler::commands::ai_api_proxy::commands::claude_send_streaming_message;
    use crate::video_compiler::commands::ai_api_proxy::types::ClaudeMessage;

    log::info!(
      "Sending streaming chat message to {} model {} in session {}",
      provider,
      model,
      session_id
    );

    // TODO: Get API key from user settings
    let api_key = "temp_key".to_string();

    // Build messages array with context if provided
    let mut messages = vec![];

    if let Some(context) = project_context {
      messages.push(ClaudeMessage {
        role: "system".to_string(),
        content: format!("Project context: {}", context),
      });
    }

    messages.push(ClaudeMessage {
      role: "user".to_string(),
      content: message,
    });

    // Send streaming request to AI provider
    match provider.as_str() {
      "claude" => {
        match claude_send_streaming_message(api_key, model, messages, Some(4096), Some(0.7), None)
          .await
        {
          Ok(stream_id) => CommandResult::success(Some(serde_json::json!({
            "stream_id": stream_id,
            "session_id": session_id,
            "status": "streaming"
          }))),
          Err(e) => CommandResult::error(format!("Streaming request failed: {}", e)),
        }
      }
      _ => CommandResult::error(format!("Unsupported AI provider: {}", provider)),
    }
  }

  async fn save_chat_message(
    &self,
    session_id: String,
    message_id: String,
    _role: String,
    _content: String,
    _metadata: Option<serde_json::Value>,
  ) -> CommandResult {
    log::info!(
      "Saving chat message {} in session {}",
      message_id,
      session_id
    );

    // TODO: Implement persistent storage for chat messages
    // This should integrate with the existing persistence service

    CommandResult::success(Some(serde_json::json!({
      "saved": true,
      "session_id": session_id,
      "message_id": message_id,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn load_chat_history(&self, session_id: String, limit: Option<u32>) -> CommandResult {
    log::info!(
      "Loading chat history for session {} (limit: {:?})",
      session_id,
      limit
    );

    // TODO: Implement chat history loading from persistence
    // This should return actual stored messages

    CommandResult::success(Some(serde_json::json!({
      "messages": [],
      "session_id": session_id,
      "total_count": 0,
      "limit": limit
    })))
  }

  async fn create_chat_session(&self, name: String, agent_type: Option<String>) -> CommandResult {
    log::info!(
      "Creating new chat session: {} (type: {:?})",
      name,
      agent_type
    );

    let session_id = uuid::Uuid::new_v4().to_string();

    // TODO: Persist session metadata

    CommandResult::success(Some(serde_json::json!({
      "session_id": session_id,
      "name": name,
      "agent_type": agent_type,
      "created_at": chrono::Utc::now(),
      "message_count": 0
    })))
  }

  async fn delete_chat_session(&self, session_id: String) -> CommandResult {
    log::info!("Deleting chat session: {}", session_id);

    // TODO: Remove session and all its messages from persistence

    CommandResult::success(Some(serde_json::json!({
      "deleted": true,
      "session_id": session_id,
      "timestamp": chrono::Utc::now()
    })))
  }

  async fn get_project_context(&self) -> CommandResult {
    log::info!("Getting project context for AI");

    let state = self.state.read().await;

    let context = match &state.project {
      Some(project) => {
        serde_json::json!({
          "project_id": project.id,
          "project_name": project.metadata.name,
          "timeline": {
            "tracks": project.timeline.tracks.len(),
            "clips": project.timeline.tracks.iter()
              .map(|t| t.clips.len())
              .sum::<usize>(),
            "duration": project.timeline.duration
          },
          "media_pool": {
            "files": project.media_pool.items.len(),
            "total_duration": project.media_pool.items.values()
              .filter_map(|f| f.duration)
              .sum::<f64>()
          },
          "settings": {
            "resolution": format!("{}x{}", project.settings.resolution.width, project.settings.resolution.height),
            "frame_rate": project.settings.frame_rate,
            "audio_sample_rate": project.settings.audio_sample_rate
          }
        })
      }
      None => {
        serde_json::json!({
          "project": null,
          "message": "No project currently open"
        })
      }
    };

    CommandResult::success(Some(context))
  }

  async fn validate_ai_api_key(&self, provider: String, api_key: String) -> CommandResult {
    use crate::video_compiler::commands::ai_api_proxy::commands::claude_validate_api_key;

    log::info!("Validating API key for provider: {}", provider);

    match provider.as_str() {
      "claude" => match claude_validate_api_key(api_key).await {
        Ok(validation) => CommandResult::success(Some(serde_json::json!({
          "valid": validation.valid,
          "message": validation.message,
          "models": validation.models,
          "provider": provider
        }))),
        Err(e) => CommandResult::error(format!("Validation failed: {}", e)),
      },
      _ => CommandResult::error(format!("Unsupported AI provider: {}", provider)),
    }
  }
}
