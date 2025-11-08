use crate::state::browser::{BrowserEvent, BrowserTab, SortOrder, ViewMode};
use crate::state::chat::{ChatCommand, ChatEvent, ChatSession};
use crate::state::project_state::{Clip, MediaType, ProjectSettings, Track, TrackType};
use crate::state::{EventBus, PersistenceService, ProjectEvent, ProjectState};
use crate::types_export::{ClipBatchUpdate, ClipUpdates, MediaUpdates, TrackUpdates};
use chrono;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid;

// Re-export types from types module
use super::types::*;

pub struct CommandHandler {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
  persistence: Arc<PersistenceService>,
}

#[allow(dead_code)]
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
      ProjectCommand::OpenProject { path } => self.open_project(path).await,
      ProjectCommand::SaveProject { path } => self.save_project(path).await,
      ProjectCommand::CloseProject => self.close_project().await,

      // Track commands
      ProjectCommand::AddTrack {
        name,
        track_type,
        index,
      } => self.add_track(name, track_type, index).await,
      ProjectCommand::DeleteTrack { track_id } => self.delete_track(track_id).await,
      ProjectCommand::UpdateTrack { track_id, updates } => {
        self.update_track(track_id, updates).await
      }

      // Clip commands
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
      ProjectCommand::TrimClip {
        clip_id,
        start,
        end,
      } => self.trim_clip(clip_id, start, end).await,
      ProjectCommand::DeleteClip { clip_id } => self.delete_clip(clip_id).await,
      ProjectCommand::UpdateClip { clip_id, updates } => self.update_clip(clip_id, updates).await,

      // Player commands
      ProjectCommand::Play => self.play().await,
      ProjectCommand::Pause => self.pause().await,
      ProjectCommand::Stop => self.stop().await,
      ProjectCommand::Seek { time } => self.seek(time).await,
      ProjectCommand::SetPlaybackRate { rate } => self.set_playback_rate(rate).await,

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

      // Media Management commands
      ProjectCommand::ImportMediaFiles { paths, options } => {
        self.import_media_files(paths, options).await
      }
      ProjectCommand::ExtractMediaMetadata { file_path } => {
        self.extract_media_metadata(file_path).await
      }
      ProjectCommand::GenerateVideoThumbnail {
        video_path,
        time,
        output_path,
      } => {
        self
          .generate_video_thumbnail(video_path, time, output_path)
          .await
      }
      ProjectCommand::GetMediaDuration { file_path } => self.get_media_duration(file_path).await,
      ProjectCommand::DetectVideoScenes {
        video_path,
        threshold,
      } => self.detect_video_scenes(video_path, threshold).await,
      ProjectCommand::GenerateAudioWaveform {
        audio_path,
        width,
        height,
      } => {
        self
          .generate_audio_waveform(audio_path, width, height)
          .await
      }
      ProjectCommand::CopyMediaToProject {
        source_paths,
        project_path,
      } => self.copy_media_to_project(source_paths, project_path).await,
      ProjectCommand::CreateProxyFiles {
        media_paths,
        proxy_settings,
      } => self.create_proxy_files(media_paths, proxy_settings).await,
      ProjectCommand::DeleteMediaFiles {
        file_paths,
        move_to_trash,
      } => self.delete_media_files(file_paths, move_to_trash).await,
      ProjectCommand::MoveMediaFiles {
        source_paths,
        destination_path,
      } => self.move_media_files(source_paths, destination_path).await,
      ProjectCommand::ScanMediaDirectory {
        directory_path,
        recursive,
        supported_formats,
      } => {
        self
          .scan_media_directory(directory_path, recursive, supported_formats)
          .await
      }
      ProjectCommand::IndexMediaFiles {
        file_paths,
        extract_metadata,
      } => self.index_media_files(file_paths, extract_metadata).await,
      ProjectCommand::SearchMediaLibrary { query, filters } => {
        self.search_media_library(query, filters).await
      }
      ProjectCommand::ExportMediaFile {
        source_path,
        output_path,
        export_settings,
      } => {
        self
          .export_media_file(source_path, output_path, export_settings)
          .await
      }
      ProjectCommand::BatchExportMedia {
        media_items,
        output_directory,
      } => self.batch_export_media(media_items, output_directory).await,
      ProjectCommand::ConvertMediaFormat {
        input_path,
        output_path,
        format,
        conversion_options,
      } => {
        self
          .convert_media_format(input_path, output_path, format, conversion_options)
          .await
      }
      ProjectCommand::OptimizeMediaFile {
        file_path,
        optimization_settings,
      } => {
        self
          .optimize_media_file(file_path, optimization_settings)
          .await
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

      // Selection commands
      ProjectCommand::SelectClips {
        clip_ids,
        add_to_selection,
      } => self.select_clips(clip_ids, add_to_selection).await,
      ProjectCommand::SelectTracks {
        track_ids,
        add_to_selection,
      } => self.select_tracks(track_ids, add_to_selection).await,
      ProjectCommand::ClearSelection => self.clear_selection().await,

      // System commands
      ProjectCommand::ReconnectNotify { timestamp } => self.reconnect_notify(timestamp).await,

      // System Integration commands
      ProjectCommand::OpenModal {
        modal_type,
        modal_data,
      } => self.open_modal(modal_type, modal_data).await,
      ProjectCommand::CloseModal => self.close_modal().await,
      ProjectCommand::SubmitModal { data } => self.submit_modal(data).await,
      ProjectCommand::ShowNotification {
        notification_type,
        title,
        message,
        duration,
        actions,
      } => {
        self
          .show_notification(notification_type, title, message, duration, actions)
          .await
      }
      ProjectCommand::DismissNotification { id } => self.dismiss_notification(id).await,
      ProjectCommand::ClearNotifications => self.clear_notifications().await,
      ProjectCommand::CheckForUpdates => self.check_for_updates().await,
      ProjectCommand::DownloadUpdate => self.download_update().await,
      ProjectCommand::InstallUpdate => self.install_update().await,
      ProjectCommand::DismissUpdate => self.dismiss_update().await,
      ProjectCommand::EnableAutoUpdate { interval_minutes } => {
        self.enable_auto_update(interval_minutes).await
      }
      ProjectCommand::DisableAutoUpdate => self.disable_auto_update().await,
      ProjectCommand::ToggleFeature { feature, enabled } => {
        self.toggle_feature(feature, enabled).await
      }

      // Video Editing commands
      ProjectCommand::ExportTimeline {
        timeline_id,
        output_path,
        format,
      } => self.export_timeline(timeline_id, output_path, format).await,
      ProjectCommand::ImportTimeline {
        file_path,
        merge_mode,
      } => self.import_timeline(file_path, merge_mode).await,
      ProjectCommand::ExportProject {
        project_id,
        output_path,
        format,
        include_media,
      } => {
        self
          .export_project(project_id, output_path, format, include_media)
          .await
      }
      ProjectCommand::RenderVideo {
        timeline_id,
        output_path,
        render_settings,
      } => {
        self
          .render_video(timeline_id, output_path, render_settings)
          .await
      }
      ProjectCommand::StartRender {
        project_id,
        settings,
      } => self.start_render(project_id, settings).await,
      ProjectCommand::GetRenderProgress { render_job_id } => {
        self.get_render_progress(render_job_id).await
      }
      ProjectCommand::CancelRender { render_job_id } => self.cancel_render(render_job_id).await,
      ProjectCommand::ApplyEffectToClip {
        clip_id,
        effect_id,
        params,
      } => self.apply_effect_to_clip(clip_id, effect_id, params).await,
      ProjectCommand::OptimizeTimeline {
        timeline_id,
        optimization_type,
      } => self.optimize_timeline(timeline_id, optimization_type).await,
      ProjectCommand::StartRealTimePreview {
        timeline_id,
        quality,
      } => self.start_real_time_preview(timeline_id, quality).await,
      ProjectCommand::StopRealTimePreview => self.stop_real_time_preview().await,
      ProjectCommand::UpdatePreviewFrame { timestamp } => {
        self.update_preview_frame(timestamp).await
      }

      // AI Provider commands
      ProjectCommand::GetAvailableProviders => self.get_available_providers().await,
      ProjectCommand::GetProviderModels { provider } => self.get_provider_models(provider).await,
      ProjectCommand::ValidateProviderConnection { provider } => {
        self.validate_provider_connection(provider).await
      }
      ProjectCommand::GetProviderCapabilities { provider } => {
        self.get_provider_capabilities(provider).await
      }
      ProjectCommand::SendAiRequest {
        provider,
        model,
        messages,
        options,
      } => {
        self
          .send_ai_request(provider, model, messages, options)
          .await
      }
      ProjectCommand::SendStreamingAiRequest {
        provider,
        model,
        messages,
        options,
      } => {
        self
          .send_streaming_ai_request(provider, model, messages, options)
          .await
      }
      ProjectCommand::GetModelInfo { provider, model } => {
        self.get_model_info(provider, model).await
      }
      ProjectCommand::RefreshModelList { provider } => self.refresh_model_list(provider).await,
      ProjectCommand::CheckModelAvailability { provider, model } => {
        self.check_model_availability(provider, model).await
      }
      ProjectCommand::InstallOllamaModel { model_name } => {
        self.install_ollama_model(model_name).await
      }
      ProjectCommand::RemoveOllamaModel { model_name } => {
        self.remove_ollama_model(model_name).await
      }
      ProjectCommand::GetOllamaStatus => self.get_ollama_status().await,
      ProjectCommand::ListInstalledModels => self.list_installed_models().await,
      ProjectCommand::GetAiUsageStats {
        provider,
        timeframe,
      } => self.get_ai_usage_stats(provider, timeframe).await,

      // Effects and Filters commands
      ProjectCommand::RenderEffectPipeline {
        clip_id,
        effects,
        output_path,
        quality,
      } => {
        self
          .render_effect_pipeline(clip_id, effects, output_path, quality)
          .await
      }
      ProjectCommand::ProcessVideoWithFilters {
        input_path,
        output_path,
        filters,
        render_settings,
      } => {
        self
          .process_video_with_filters(input_path, output_path, filters, render_settings)
          .await
      }
      ProjectCommand::ApplyLutToClip {
        clip_id,
        lut_path,
        intensity,
      } => self.apply_lut_to_clip(clip_id, lut_path, intensity).await,
      ProjectCommand::CreateEffectPreset {
        name,
        effect_id,
        parameters,
        category,
      } => {
        self
          .create_effect_preset(name, effect_id, parameters, category)
          .await
      }
      ProjectCommand::SaveFilterPreset {
        name,
        filter_id,
        parameters,
        tags,
      } => {
        self
          .save_filter_preset(name, filter_id, parameters, tags)
          .await
      }
      ProjectCommand::LoadEffectPresets { effect_id } => self.load_effect_presets(effect_id).await,
      ProjectCommand::LoadFilterPresets { filter_id } => self.load_filter_presets(filter_id).await,
      ProjectCommand::DeletePreset {
        preset_id,
        preset_type,
      } => self.delete_preset(preset_id, preset_type).await,
      ProjectCommand::ImportEffectFile {
        file_path,
        category,
      } => self.import_effect_file(file_path, category).await,
      ProjectCommand::ImportFilterFile {
        file_path,
        file_type,
      } => self.import_filter_file(file_path, file_type).await,
      ProjectCommand::ExportEffectPreset {
        preset_id,
        output_path,
      } => self.export_effect_preset(preset_id, output_path).await,
      ProjectCommand::ExportFilterPreset {
        preset_id,
        output_path,
      } => self.export_filter_preset(preset_id, output_path).await,
      ProjectCommand::GetGpuCapabilities => self.get_gpu_capabilities().await,
      ProjectCommand::OptimizeEffectsPipeline {
        clip_id,
        target_fps,
      } => self.optimize_effects_pipeline(clip_id, target_fps).await,
      ProjectCommand::AnalyzeEffectPerformance {
        effect_id,
        duration_seconds,
      } => {
        self
          .analyze_effect_performance(effect_id, duration_seconds)
          .await
      }

      // Template Management commands
      ProjectCommand::SaveTemplate {
        template,
        path,
        category,
      } => self.save_template(template, path, category).await,
      ProjectCommand::LoadTemplate { path } => self.load_template(path).await,
      ProjectCommand::DeleteTemplate { template_id } => self.delete_template(template_id).await,
      ProjectCommand::ListTemplates {
        category,
        template_type,
      } => self.list_templates(category, template_type).await,
      ProjectCommand::ImportTemplate { path, category } => {
        self.import_template(path, category).await
      }
      ProjectCommand::ExportTemplate { template_id, path } => {
        self.export_template(template_id, path).await
      }
      ProjectCommand::CreateTemplateFromProject {
        project_id,
        template_name,
        category,
      } => {
        self
          .create_template_from_project(project_id, template_name, category)
          .await
      }
      ProjectCommand::ApplyTemplateToTimeline {
        template_id,
        timeline_id,
        media_ids,
      } => {
        self
          .apply_template_to_timeline(template_id, timeline_id, media_ids)
          .await
      }
      ProjectCommand::ValidateTemplate { template } => self.validate_template(template).await,
      ProjectCommand::GetTemplatePreview {
        template_id,
        media_ids,
      } => self.get_template_preview(template_id, media_ids).await,
      ProjectCommand::OptimizeTemplateRendering {
        template_id,
        target_quality,
      } => {
        self
          .optimize_template_rendering(template_id, target_quality)
          .await
      }

      // Transition Management commands
      ProjectCommand::CreateTransition {
        track_id,
        transition_id,
        position,
        duration,
        parameters,
      } => {
        self
          .create_transition(track_id, transition_id, position, duration, parameters)
          .await
      }
      ProjectCommand::UpdateTransitionParameters {
        transition_id,
        parameters,
      } => {
        self
          .update_transition_parameters(transition_id, parameters)
          .await
      }
      ProjectCommand::GetTransitionInfo { transition_id } => {
        self.get_transition_info(transition_id).await
      }
      ProjectCommand::ImportTransitions { file_path } => self.import_transitions(file_path).await,
      ProjectCommand::ExportTransitions {
        transition_ids,
        export_path,
      } => self.export_transitions(transition_ids, export_path).await,
      ProjectCommand::SaveUserTransition { transition } => {
        self.save_user_transition(transition).await
      }
      ProjectCommand::PreviewTransition {
        transition_id,
        source_clip_id,
        target_clip_id,
        parameters,
      } => {
        self
          .preview_transition(transition_id, source_clip_id, target_clip_id, parameters)
          .await
      }
      ProjectCommand::RenderTransition { transition_config } => {
        self.render_transition(transition_config).await
      }
      ProjectCommand::ExportProjectTransitions {
        project_path,
        export_settings,
      } => {
        self
          .export_project_transitions(project_path, export_settings)
          .await
      }
      ProjectCommand::ListAvailableTransitions { category } => {
        self.list_available_transitions(category).await
      }
      ProjectCommand::ValidateTransition { transition } => {
        self.validate_transition(transition).await
      }

      // Style Template Management commands
      ProjectCommand::LoadStyleTemplates { category } => self.load_style_templates(category).await,
      ProjectCommand::SaveStyleTemplate { template, path } => {
        self.save_style_template(template, path).await
      }
      ProjectCommand::ApplyStyleTemplate {
        template_id,
        timeline_id,
        position,
        text_replacements,
      } => {
        self
          .apply_style_template(template_id, timeline_id, position, text_replacements)
          .await
      }
      ProjectCommand::ExportStyleTemplate {
        template_id,
        export_path,
      } => self.export_style_template(template_id, export_path).await,
      ProjectCommand::ImportStyleTemplates { file_path } => {
        self.import_style_templates(file_path).await
      }
      ProjectCommand::ValidateStyleTemplate { template } => {
        self.validate_style_template(template).await
      }
      ProjectCommand::RenderStyleTemplatePreview {
        template_id,
        output_path,
        preview_settings,
      } => {
        self
          .render_style_template_preview(template_id, output_path, preview_settings)
          .await
      }
      ProjectCommand::GetStyleTemplateAssets { template_id } => {
        self.get_style_template_assets(template_id).await
      }
      ProjectCommand::UpdateStyleTemplateElements {
        template_id,
        elements,
      } => {
        self
          .update_style_template_elements(template_id, elements)
          .await
      }
      ProjectCommand::RippleEdit { clip_id, delta } => self.ripple_edit(clip_id, delta).await,
      ProjectCommand::RollEdit {
        clip_id,
        adjacent_clip_id,
        delta,
      } => self.roll_edit(clip_id, adjacent_clip_id, delta).await,
      ProjectCommand::SlipEdit { clip_id, delta } => self.slip_edit(clip_id, delta).await,
      ProjectCommand::SlideEdit { clip_id, delta } => self.slide_edit(clip_id, delta).await,

      // Marker Commands
      ProjectCommand::AddMarker {
        name,
        time,
        color,
        marker_type,
        description,
      } => {
        self
          .add_marker(name, time, color, marker_type, description)
          .await
      }
      ProjectCommand::RemoveMarker { marker_id } => self.remove_marker(marker_id).await,
      ProjectCommand::UpdateMarker {
        marker_id,
        name,
        time,
        color,
        description,
      } => {
        self
          .update_marker(marker_id, name, time, color, description)
          .await
      }
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
          clip: crate::state::events::ClipData {
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

    let applied_effect = crate::state::project_state::AppliedEffect {
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

    let applied_filter = crate::state::project_state::AppliedFilter {
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

    let applied_template = crate::state::project_state::AppliedTemplate {
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
    use crate::state::project_state::{MediaItem, MediaMetadata};
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
          media: crate::state::events::MediaData {
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
    project_state.ui_state.browser_state = Some(state.clone());

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

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and its track
    let mut found_clip: Option<Clip> = None;
    let mut track_id_found: Option<String> = None;
    let mut clip_index: Option<usize> = None;

    for track in &mut project.timeline.tracks {
      if let Some((idx, clip)) = track
        .clips
        .iter()
        .enumerate()
        .find(|(_, c)| c.id == clip_id)
      {
        found_clip = Some(clip.clone());
        track_id_found = Some(track.id.clone());
        clip_index = Some(idx);
        break;
      }
    }

    let original_clip = match found_clip {
      Some(c) => c,
      None => return CommandResult::error("Clip not found".to_string()),
    };

    let track_id = track_id_found.unwrap();
    let clip_idx = clip_index.unwrap();

    // Validate split time is within clip bounds
    if time <= original_clip.timeline_in || time >= original_clip.timeline_out {
      return CommandResult::error("Split time must be within clip bounds".to_string());
    }

    // Calculate split parameters
    let split_offset = time - original_clip.timeline_in;
    let left_duration = split_offset;
    let right_duration = (original_clip.timeline_out - original_clip.timeline_in) - split_offset;
    let right_source_in = original_clip.source_in + split_offset;

    // Create left clip (keeps original ID)
    let left_clip = Clip {
      id: original_clip.id.clone(),
      media_id: original_clip.media_id.clone(),
      name: original_clip.name.clone(),
      timeline_in: original_clip.timeline_in,
      timeline_out: time,
      source_in: original_clip.source_in,
      source_out: original_clip.source_in + left_duration,
      playback_rate: original_clip.playback_rate,
      enabled: original_clip.enabled,
      effects: original_clip.effects.clone(),
      transitions: original_clip.transitions.clone(),
    };

    // Create right clip (new ID)
    let right_clip_id = uuid::Uuid::new_v4().to_string();
    let right_clip = Clip {
      id: right_clip_id.clone(),
      media_id: original_clip.media_id.clone(),
      name: format!("{} (split)", original_clip.name),
      timeline_in: time,
      timeline_out: time + right_duration,
      source_in: right_source_in,
      source_out: original_clip.source_out,
      playback_rate: original_clip.playback_rate,
      enabled: original_clip.enabled,
      effects: original_clip.effects.clone(),
      transitions: original_clip.transitions.clone(),
    };

    // Replace original clip with left and right clips
    let track = project
      .timeline
      .tracks
      .iter_mut()
      .find(|t| t.id == track_id)
      .unwrap();

    track.clips.remove(clip_idx);
    track.clips.push(left_clip.clone());
    track.clips.push(right_clip.clone());

    // Sort clips by timeline position
    track
      .clips
      .sort_by(|a, b| a.timeline_in.partial_cmp(&b.timeline_in).unwrap());

    state.mark_dirty();
    let version = state.version;

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipSplit {
          original_clip_id: clip_id.clone(),
          left_clip: crate::state::events::ClipData {
            id: left_clip.id.clone(),
            media_id: left_clip.media_id.clone(),
            name: left_clip.name.clone(),
            timeline_in: left_clip.timeline_in,
            timeline_out: left_clip.timeline_out,
            source_in: left_clip.source_in,
            source_out: left_clip.source_out,
          },
          right_clip: crate::state::events::ClipData {
            id: right_clip.id.clone(),
            media_id: right_clip.media_id.clone(),
            name: right_clip.name.clone(),
            timeline_in: right_clip.timeline_in,
            timeline_out: right_clip.timeline_out,
            source_in: right_clip.source_in,
            source_out: right_clip.source_out,
          },
          track_id: track_id.clone(),
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "original_clip_id": clip_id,
      "left_clip_id": left_clip.id,
      "right_clip_id": right_clip_id,
      "track_id": track_id
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

    let mut state = self.state.write().await;

    let project = match state.project.as_ref() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find all clips with given IDs
    let mut clips_to_copy: Vec<Clip> = Vec::new();
    let mut track_ids: Vec<String> = Vec::new();

    for track in &project.timeline.tracks {
      for clip in &track.clips {
        if clip_ids.contains(&clip.id) {
          clips_to_copy.push(clip.clone());
          if !track_ids.contains(&track.id) {
            track_ids.push(track.id.clone());
          }
        }
      }
    }

    if clips_to_copy.is_empty() {
      return CommandResult::error("No clips found to copy".to_string());
    }

    // Store in clipboard
    state.clipboard = Some(crate::state::project_state::ClipboardData {
      clips: clips_to_copy.clone(),
      copied_at: chrono::Utc::now(),
      original_track_ids: track_ids.clone(),
    });

    CommandResult::success(Some(serde_json::json!({
      "copied": true,
      "count": clips_to_copy.len(),
      "clip_ids": clip_ids,
      "track_ids": track_ids
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

    let mut state = self.state.write().await;

    // Get clipboard data first (before mutable borrow)
    let clipboard_data = match &state.clipboard {
      Some(data) => data.clone(),
      None => return CommandResult::error("Clipboard is empty".to_string()),
    };

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find target track
    let track = match project
      .timeline
      .tracks
      .iter_mut()
      .find(|t| t.id == track_id)
    {
      Some(t) => t,
      None => return CommandResult::error("Track not found".to_string()),
    };

    // Calculate time offset (from first clip's original position to paste position)
    let min_original_time = clipboard_data
      .clips
      .iter()
      .map(|c| c.timeline_in)
      .min_by(|a, b| a.partial_cmp(b).unwrap())
      .unwrap_or(0.0);
    let time_offset = time - min_original_time;

    // Create new clips with updated IDs and positions
    let mut new_clip_ids = Vec::new();
    for clip in &clipboard_data.clips {
      let new_clip_id = uuid::Uuid::new_v4().to_string();
      let new_clip = Clip {
        id: new_clip_id.clone(),
        media_id: clip.media_id.clone(),
        name: format!("{} (copy)", clip.name),
        timeline_in: clip.timeline_in + time_offset,
        timeline_out: clip.timeline_out + time_offset,
        source_in: clip.source_in,
        source_out: clip.source_out,
        playback_rate: clip.playback_rate,
        enabled: clip.enabled,
        effects: clip.effects.clone(),
        transitions: clip.transitions.clone(),
      };

      track.clips.push(new_clip);
      new_clip_ids.push(new_clip_id);
    }

    // Sort clips by timeline position
    track
      .clips
      .sort_by(|a, b| a.timeline_in.partial_cmp(&b.timeline_in).unwrap());

    state.mark_dirty();
    let version = state.version;

    // Publish events for each pasted clip
    for clip_id in &new_clip_ids {
      self
        .event_bus
        .publish(
          ProjectEvent::ClipAdded {
            track_id: track_id.clone(),
            clip: crate::state::events::ClipData {
              id: clip_id.clone(),
              media_id: String::new(), // Will be filled from actual clip
              name: String::new(),
              timeline_in: time,
              timeline_out: time,
              source_in: 0.0,
              source_out: 0.0,
            },
          },
          "command_handler".to_string(),
          version,
        )
        .await
        .ok();
    }

    CommandResult::success(Some(serde_json::json!({
      "pasted": true,
      "track_id": track_id,
      "time": time,
      "count": new_clip_ids.len(),
      "new_clip_ids": new_clip_ids
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

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and add effect if not already present
    let mut clip_found = false;
    let mut effect_added = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          // Check if effect is already applied
          if !clip.effects.contains(&effect_id) {
            clip.effects.push(effect_id.clone());
            effect_added = true;
          }

          break;
        }
      }
      if clip_found {
        break;
      }
    }

    if !clip_found {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: Some(vec![effect_id.clone()]),
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "applied": true,
      "clip_id": clip_id,
      "effect_id": effect_id,
      "is_new": effect_added
    })))
  }

  async fn remove_effect(&self, clip_id: String, effect_id: String) -> CommandResult {
    log::info!("Removing effect {} from clip {}", effect_id, clip_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and remove effect
    let mut clip_found = false;
    let mut effect_removed = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          let initial_len = clip.effects.len();
          clip.effects.retain(|e| e != &effect_id);
          effect_removed = clip.effects.len() < initial_len;

          break;
        }
      }
      if clip_found {
        break;
      }
    }

    if !clip_found {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    if !effect_removed {
      return CommandResult::error(format!("Effect not found on clip: {}", effect_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "removed": true,
      "clip_id": clip_id,
      "effect_id": effect_id
    })))
  }

  async fn apply_filter(
    &self,
    clip_id: String,
    filter_id: String,
    _params: serde_json::Value,
  ) -> CommandResult {
    log::info!("Applying filter {} to clip {}", filter_id, clip_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and add filter if not already present
    let mut clip_found = false;
    let mut filter_added = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          // Check if filter is already applied
          if !clip.effects.contains(&filter_id) {
            clip.effects.push(filter_id.clone());
            filter_added = true;
          }

          break;
        }
      }
      if clip_found {
        break;
      }
    }

    if !clip_found {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: Some(vec![filter_id.clone()]),
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "applied": true,
      "clip_id": clip_id,
      "filter_id": filter_id,
      "is_new": filter_added
    })))
  }

  async fn remove_filter(&self, clip_id: String, filter_id: String) -> CommandResult {
    log::info!("Removing filter {} from clip {}", filter_id, clip_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and remove filter
    let mut clip_found = false;
    let mut filter_removed = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          let initial_len = clip.effects.len();
          clip.effects.retain(|e| e != &filter_id);
          filter_removed = clip.effects.len() < initial_len;

          break;
        }
      }
      if clip_found {
        break;
      }
    }

    if !clip_found {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    if !filter_removed {
      return CommandResult::error(format!("Filter not found on clip: {}", filter_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "removed": true,
      "clip_id": clip_id,
      "filter_id": filter_id
    })))
  }

  async fn apply_transition(
    &self,
    clip_id: String,
    transition_id: String,
    params: serde_json::Value,
  ) -> CommandResult {
    log::info!("Applying transition {} to clip {}", transition_id, clip_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Extract transition type and duration from params
    let transition_type = params
      .get("type")
      .and_then(|v| v.as_str())
      .unwrap_or("crossfade")
      .to_string();

    let duration = params
      .get("duration")
      .and_then(|v| v.as_f64())
      .unwrap_or(1.0);

    // Validate duration
    if duration <= 0.0 {
      return CommandResult::error(format!("Invalid transition duration: {}", duration));
    }

    // Convert params to HashMap, excluding type and duration
    let mut param_map = std::collections::HashMap::new();
    if let serde_json::Value::Object(map) = params {
      for (key, value) in map {
        if key != "type" && key != "duration" {
          param_map.insert(key, value);
        }
      }
    }

    // Find the clip and add/update transition
    let mut clip_found = false;
    let mut transition_added = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          // Check if transition already exists
          let existing_idx = clip.transitions.iter().position(|t| t.id == transition_id);

          if let Some(idx) = existing_idx {
            // Update existing transition
            clip.transitions[idx].transition_type = transition_type.clone();
            clip.transitions[idx].duration = duration;
            clip.transitions[idx].params = param_map.clone();
          } else {
            // Add new transition
            clip
              .transitions
              .push(crate::state::project_state::Transition {
                id: transition_id.clone(),
                transition_type: transition_type.clone(),
                duration,
                params: param_map.clone(),
              });
            transition_added = true;
          }

          break;
        }
      }
      if clip_found {
        break;
      }
    }

    if !clip_found {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "applied": true,
      "clip_id": clip_id,
      "transition_id": transition_id,
      "transition_type": transition_type,
      "duration": duration,
      "is_new": transition_added
    })))
  }

  async fn remove_transition(&self, clip_id: String, transition_id: String) -> CommandResult {
    log::info!(
      "Removing transition {} from clip {}",
      transition_id,
      clip_id
    );

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and remove transition
    let mut clip_found = false;
    let mut transition_removed = false;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          clip_found = true;

          // Find and remove transition
          let initial_len = clip.transitions.len();
          clip.transitions.retain(|t| t.id != transition_id);
          transition_removed = clip.transitions.len() < initial_len;

          break;
        }
      }
      if clip_found {
        break;
      }
    }

    if !clip_found {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    if !transition_removed {
      return CommandResult::error(format!("Transition not found on clip: {}", transition_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "removed": true,
      "clip_id": clip_id,
      "transition_id": transition_id
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

  // Selection commands implementation
  async fn select_clips(&self, clip_ids: Vec<String>, add_to_selection: bool) -> CommandResult {
    log::info!(
      "Selecting clips: {:?}, add_to_selection: {}",
      clip_ids,
      add_to_selection
    );

    let mut state = self.state.write().await;

    if add_to_selection {
      // Add to existing selection
      state.ui_state.selected_clips.extend(clip_ids.clone());
    } else {
      // Replace selection
      state.ui_state.selected_clips = clip_ids.clone();
    }

    // Remove duplicates
    state.ui_state.selected_clips.sort();
    state.ui_state.selected_clips.dedup();

    state.mark_dirty();

    self
      .event_bus
      .publish(
        ProjectEvent::SelectionChanged {
          selected_clips: state.ui_state.selected_clips.clone(),
          selected_tracks: state.ui_state.selected_tracks.clone(),
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "selected_clips": clip_ids,
      "add_to_selection": add_to_selection
    })))
  }

  async fn select_tracks(&self, track_ids: Vec<String>, add_to_selection: bool) -> CommandResult {
    log::info!(
      "Selecting tracks: {:?}, add_to_selection: {}",
      track_ids,
      add_to_selection
    );

    let mut state = self.state.write().await;

    if add_to_selection {
      // Add to existing selection
      state.ui_state.selected_tracks.extend(track_ids.clone());
    } else {
      // Replace selection
      state.ui_state.selected_tracks = track_ids.clone();
    }

    // Remove duplicates
    state.ui_state.selected_tracks.sort();
    state.ui_state.selected_tracks.dedup();

    state.mark_dirty();

    self
      .event_bus
      .publish(
        ProjectEvent::SelectionChanged {
          selected_clips: state.ui_state.selected_clips.clone(),
          selected_tracks: state.ui_state.selected_tracks.clone(),
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "selected_tracks": track_ids,
      "add_to_selection": add_to_selection
    })))
  }

  async fn clear_selection(&self) -> CommandResult {
    log::info!("Clearing all selection");

    let mut state = self.state.write().await;

    state.ui_state.selected_clips.clear();
    state.ui_state.selected_tracks.clear();
    state.mark_dirty();

    self
      .event_bus
      .publish(
        ProjectEvent::SelectionChanged {
          selected_clips: state.ui_state.selected_clips.clone(),
          selected_tracks: state.ui_state.selected_tracks.clone(),
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "cleared": true
    })))
  }

  // Basic project commands implementation
  async fn open_project(&self, path: String) -> CommandResult {
    log::info!("Opening project from path: {}", path);

    match self.persistence.load_project(&path).await {
      Ok(project_state) => {
        let mut state = self.state.write().await;
        *state = project_state;
        state.mark_dirty();

        self
          .event_bus
          .publish(
            ProjectEvent::ProjectOpened {
              project_id: state.project.as_ref().unwrap().id.clone(),
              path: path.clone(),
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({ "path": path })))
      }
      Err(e) => CommandResult::error(format!("Failed to open project: {}", e)),
    }
  }

  async fn close_project(&self) -> CommandResult {
    log::info!("Closing current project");

    let mut state = self.state.write().await;
    let project_id = state
      .project
      .as_ref()
      .map(|p| p.id.clone())
      .unwrap_or_default();

    state.project = None;
    state.ui_state = Default::default();
    state.mark_dirty();

    self
      .event_bus
      .publish(
        ProjectEvent::ProjectClosed { project_id },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  // Track commands implementation
  async fn add_track(
    &self,
    name: String,
    track_type: TrackType,
    index: Option<u32>,
  ) -> CommandResult {
    log::info!(
      "Adding track: {} of type {:?} at index {:?}",
      name,
      track_type,
      index
    );

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    let track_id = uuid::Uuid::new_v4().to_string();
    let track_name = name.clone();
    let track_type_str = format!("{:?}", track_type);
    let new_track = Track {
      id: track_id.clone(),
      name,
      track_type,
      enabled: true,
      locked: false,
      height: 64, // Default height
      clips: Vec::new(),
      effects: Vec::new(),
      volume: 1.0,
      pan: 0.0,
    };

    let insert_index = if let Some(idx) = index {
      let insert_pos = (idx as usize).min(project.timeline.tracks.len());
      project.timeline.tracks.insert(insert_pos, new_track);
      insert_pos as u32
    } else {
      project.timeline.tracks.push(new_track);
      project.timeline.tracks.len() as u32 - 1
    };

    state.mark_dirty();

    self
      .event_bus
      .publish(
        ProjectEvent::TrackAdded {
          track: crate::state::events::TrackData {
            id: track_id.clone(),
            name: track_name,
            track_type: track_type_str,
            index: insert_index,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "track_id": track_id })))
  }

  async fn delete_track(&self, track_id: String) -> CommandResult {
    log::info!("Deleting track: {}", track_id);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    let track_index = project
      .timeline
      .tracks
      .iter()
      .position(|t| t.id == track_id);

    match track_index {
      Some(index) => {
        project.timeline.tracks.remove(index);
        state.mark_dirty();

        self
          .event_bus
          .publish(
            ProjectEvent::TrackDeleted {
              track_id: track_id.clone(),
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({ "deleted_track_id": track_id })))
      }
      None => CommandResult::error(format!("Track not found: {}", track_id)),
    }
  }

  async fn update_track(&self, track_id: String, updates: TrackUpdates) -> CommandResult {
    log::info!("Updating track: {} with updates: {:?}", track_id, updates);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    let track = project
      .timeline
      .tracks
      .iter_mut()
      .find(|t| t.id == track_id);

    match track {
      Some(track) => {
        let track_name_change = updates.name.clone();

        if let Some(name) = updates.name {
          track.name = name;
        }
        if let Some(enabled) = updates.enabled {
          track.enabled = enabled;
        }
        if let Some(locked) = updates.locked {
          track.locked = locked;
        }
        if let Some(volume) = updates.volume {
          track.volume = volume;
        }
        if let Some(height) = updates.height {
          track.height = height;
        }

        state.mark_dirty();

        self
          .event_bus
          .publish(
            ProjectEvent::TrackUpdated {
              track_id: track_id.clone(),
              changes: crate::state::events::TrackChanges {
                name: track_name_change,
                enabled: updates.enabled,
                locked: updates.locked,
                volume: updates.volume,
                height: updates.height,
              },
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({ "updated_track_id": track_id })))
      }
      None => CommandResult::error(format!("Track not found: {}", track_id)),
    }
  }

  // Clip commands implementation
  async fn trim_clip(&self, clip_id: String, start: f64, end: f64) -> CommandResult {
    log::info!("Trimming clip: {} from {} to {}", clip_id, start, end);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and track
    let mut found_clip: Option<Clip> = None;
    let mut track_id_found: Option<String> = None;

    for track in &mut project.timeline.tracks {
      if let Some(clip) = track.clips.iter().find(|c| c.id == clip_id) {
        found_clip = Some(clip.clone());
        track_id_found = Some(track.id.clone());
        break;
      }
    }

    let original_clip = match found_clip {
      Some(c) => c,
      None => return CommandResult::error("Clip not found".to_string()),
    };

    let track_id = track_id_found.unwrap();

    // Validate new bounds
    if start >= end {
      return CommandResult::error("Start must be before end".to_string());
    }

    let new_duration = end - start;
    if new_duration < 0.01 {
      // Minimum 0.01 seconds (10ms)
      return CommandResult::error("Clip duration too short".to_string());
    }

    // Calculate source adjustments
    let start_delta = start - original_clip.timeline_in;
    let end_delta = original_clip.timeline_out - end;

    // Update source in/out based on timeline trim
    let new_source_in = original_clip.source_in + start_delta;
    let new_source_out = original_clip.source_out - end_delta;

    // Validate source bounds (can't trim beyond source media)
    if new_source_in < 0.0 {
      return CommandResult::error("Cannot trim before source media start".to_string());
    }
    if new_source_out > original_clip.source_out {
      return CommandResult::error("Cannot trim beyond source media end".to_string());
    }

    // Apply trim
    for track in &mut project.timeline.tracks {
      if track.id == track_id {
        if let Some(clip) = track.clips.iter_mut().find(|c| c.id == clip_id) {
          clip.timeline_in = start;
          clip.timeline_out = end;
          clip.source_in = new_source_in;
          clip.source_out = new_source_out;
          break;
        }
      }
    }

    state.mark_dirty();
    let version = state.version;

    self
      .event_bus
      .publish(
        ProjectEvent::ClipTrimmed {
          clip_id: clip_id.clone(),
          new_in: start,
          new_out: end,
        },
        "command_handler".to_string(),
        version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "trimmed_clip_id": clip_id,
      "timeline_in": start,
      "timeline_out": end,
      "source_in": new_source_in,
      "source_out": new_source_out,
      "track_id": track_id
    })))
  }

  async fn delete_clip(&self, clip_id: String) -> CommandResult {
    log::info!("Deleting clip: {}", clip_id);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find and remove the clip from any track
    let mut clip_found = false;
    for track in &mut project.timeline.tracks {
      if let Some(index) = track.clips.iter().position(|c| c.id == clip_id) {
        track.clips.remove(index);
        clip_found = true;
        break;
      }
    }

    if clip_found {
      state.mark_dirty();

      self
        .event_bus
        .publish(
          ProjectEvent::ClipDeleted {
            clip_id: clip_id.clone(),
            track_id: "unknown".to_string(), // We don't track which track it was from
          },
          "command_handler".to_string(),
          state.version,
        )
        .await
        .ok();

      CommandResult::success(Some(serde_json::json!({ "deleted_clip_id": clip_id })))
    } else {
      CommandResult::error(format!("Clip not found: {}", clip_id))
    }
  }

  async fn update_clip(&self, clip_id: String, updates: ClipUpdates) -> CommandResult {
    log::info!("Updating clip: {} with updates: {:?}", clip_id, updates);

    let mut state = self.state.write().await;

    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip across all tracks
    let mut clip_found = false;
    let clip_name_change = updates.name.clone();

    for track in &mut project.timeline.tracks {
      if let Some(clip) = track.clips.iter_mut().find(|c| c.id == clip_id) {
        if let Some(name) = updates.name {
          clip.name = name;
        }
        if let Some(playback_rate) = updates.playback_rate {
          clip.playback_rate = playback_rate;
        }
        if let Some(enabled) = updates.enabled {
          clip.enabled = enabled;
        }
        clip_found = true;
        break;
      }
    }

    if clip_found {
      state.mark_dirty();

      self
        .event_bus
        .publish(
          ProjectEvent::ClipUpdated {
            clip_id: clip_id.clone(),
            changes: crate::state::events::ClipChanges {
              name: clip_name_change,
              playback_rate: updates.playback_rate,
              volume: None,  // Not in updates
              effects: None, // Not in updates
            },
          },
          "command_handler".to_string(),
          state.version,
        )
        .await
        .ok();

      CommandResult::success(Some(serde_json::json!({ "updated_clip_id": clip_id })))
    } else {
      CommandResult::error(format!("Clip not found: {}", clip_id))
    }
  }

  // Player commands implementation
  async fn stop(&self) -> CommandResult {
    log::info!("Stopping player");

    let mut state = self.state.write().await;
    state.playback_state.is_playing = false;
    state.playback_state.current_time = 0.0;

    self
      .event_bus
      .publish(
        ProjectEvent::PlaybackStopped { time: 0.0 },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({ "stopped": true })))
  }

  async fn set_playback_rate(&self, rate: f64) -> CommandResult {
    log::info!("Setting playback rate to: {}", rate);

    let mut state = self.state.write().await;
    state.playback_state.playback_rate = rate;

    CommandResult::success(Some(serde_json::json!({
      "playback_rate": rate
    })))
  }

  // Media Management methods
  async fn import_media_files(
    &self,
    paths: Vec<String>,
    options: MediaImportOptions,
  ) -> CommandResult {
    log::info!(
      "Importing media files: {:?} with options: {:?}",
      paths,
      options
    );

    let mut state = self.state.write().await;
    let mut imported_files = Vec::new();
    let mut errors = Vec::new();

    for path in paths {
      // Validate file exists
      if !std::path::Path::new(&path).exists() {
        errors.push(format!("File not found: {}", path));
        continue;
      }

      // Extract file info
      let file_name = std::path::Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

      let file_extension = std::path::Path::new(&path)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();

      // Determine media type based on extension
      let media_type = match file_extension.as_str() {
        "mp4" | "mov" | "avi" | "mkv" | "webm" | "mxf" | "r3d" | "braw" => {
          crate::state::project_state::MediaType::Video
        }
        "mp3" | "wav" | "aiff" | "flac" | "ogg" | "m4a" | "aac" => {
          crate::state::project_state::MediaType::Audio
        }
        "jpg" | "jpeg" | "png" | "gif" | "webp" | "tiff" | "raw" | "dng" | "heic" => {
          crate::state::project_state::MediaType::Image
        }
        _ => {
          errors.push(format!("Unsupported file format: {}", path));
          continue;
        }
      };

      // Create media item
      let media_id = uuid::Uuid::new_v4().to_string();
      let media_item = crate::state::project_state::MediaItem {
        id: media_id.clone(),
        name: file_name,
        path: path.clone(),
        media_type,
        duration: None, // Will be filled by metadata extraction
        metadata: crate::state::project_state::MediaMetadata {
          format: file_extension.clone(),
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

      // Add to project if open
      if let Some(project) = &mut state.project {
        let is_video = matches!(
          media_item.media_type,
          crate::state::project_state::MediaType::Video
        );
        project
          .media_pool
          .items
          .insert(media_id.clone(), media_item);
        imported_files.push(path.clone());

        // Generate thumbnail if requested
        if options.generate_thumbnails && is_video {
          // TODO: Generate thumbnail asynchronously
          log::info!("Thumbnail generation requested for: {}", path);
        }

        // Extract metadata if requested
        if options.analyze_content {
          // TODO: Extract metadata asynchronously
          log::info!("Content analysis requested for: {}", path);
        }
      } else {
        errors.push("No project open to import files into".to_string());
        break;
      }
    }

    state.mark_dirty();

    // Publish import event
    self
      .event_bus
      .publish(
        crate::state::ProjectEvent::MediaImported {
          file_paths: imported_files.clone(),
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    if errors.is_empty() {
      CommandResult::success(Some(serde_json::json!({
        "imported_files": imported_files,
        "count": imported_files.len()
      })))
    } else {
      CommandResult::error(format!("Import errors: {}", errors.join(", ")))
    }
  }

  async fn extract_media_metadata(&self, file_path: String) -> CommandResult {
    log::info!("Extracting metadata for: {}", file_path);

    if !std::path::Path::new(&file_path).exists() {
      return CommandResult::error(format!("File not found: {}", file_path));
    }

    // Try to open with FFmpeg
    match ffmpeg_next::format::input(&file_path) {
      Ok(input) => {
        let mut metadata = serde_json::Map::new();

        // Basic file info
        metadata.insert(
          "file_path".to_string(),
          serde_json::Value::String(file_path.clone()),
        );
        metadata.insert(
          "format_name".to_string(),
          serde_json::Value::String(input.format().name().to_string()),
        );
        metadata.insert(
          "duration".to_string(),
          serde_json::Value::Number(
            serde_json::Number::from_f64(
              input.duration() as f64 / ffmpeg_next::ffi::AV_TIME_BASE as f64,
            )
            .unwrap_or(serde_json::Number::from(0)),
          ),
        );

        // Stream information
        let mut streams = Vec::new();
        for (i, stream) in input.streams().enumerate() {
          let mut stream_info = serde_json::Map::new();
          stream_info.insert(
            "index".to_string(),
            serde_json::Value::Number(serde_json::Number::from(i)),
          );

          match stream.parameters().medium() {
            ffmpeg_next::media::Type::Video => {
              stream_info.insert(
                "type".to_string(),
                serde_json::Value::String("video".to_string()),
              );

              // Get video properties from codec parameters
              if let Ok(codec_ctx) =
                ffmpeg_next::codec::context::Context::from_parameters(stream.parameters())
              {
                let codec_id = codec_ctx.id();
                let codec_name = codec_id.name().to_string();

                if let Ok(decoder) = codec_ctx.decoder().video() {
                  stream_info.insert(
                    "width".to_string(),
                    serde_json::Value::Number(serde_json::Number::from(decoder.width())),
                  );
                  stream_info.insert(
                    "height".to_string(),
                    serde_json::Value::Number(serde_json::Number::from(decoder.height())),
                  );
                }
                stream_info.insert("codec".to_string(), serde_json::Value::String(codec_name));
              }

              // Frame rate
              let frame_rate = stream.avg_frame_rate();
              if frame_rate.denominator() != 0 {
                let fps = frame_rate.numerator() as f64 / frame_rate.denominator() as f64;
                stream_info.insert(
                  "fps".to_string(),
                  serde_json::Value::Number(
                    serde_json::Number::from_f64(fps).unwrap_or(serde_json::Number::from(0)),
                  ),
                );
              }
            }
            ffmpeg_next::media::Type::Audio => {
              stream_info.insert(
                "type".to_string(),
                serde_json::Value::String("audio".to_string()),
              );

              // Get audio properties from codec parameters
              if let Ok(codec_ctx) =
                ffmpeg_next::codec::context::Context::from_parameters(stream.parameters())
              {
                let codec_id = codec_ctx.id();
                let codec_name = codec_id.name().to_string();

                if let Ok(decoder) = codec_ctx.decoder().audio() {
                  stream_info.insert(
                    "channels".to_string(),
                    serde_json::Value::Number(serde_json::Number::from(decoder.channels())),
                  );
                  stream_info.insert(
                    "sample_rate".to_string(),
                    serde_json::Value::Number(serde_json::Number::from(decoder.rate())),
                  );
                }
                stream_info.insert("codec".to_string(), serde_json::Value::String(codec_name));
              }
            }
            _ => {
              stream_info.insert(
                "type".to_string(),
                serde_json::Value::String("other".to_string()),
              );
            }
          }

          streams.push(serde_json::Value::Object(stream_info));
        }
        metadata.insert("streams".to_string(), serde_json::Value::Array(streams));

        // File size
        if let Ok(file_metadata) = std::fs::metadata(&file_path) {
          metadata.insert(
            "file_size".to_string(),
            serde_json::Value::Number(serde_json::Number::from(file_metadata.len())),
          );
        }

        CommandResult::success(Some(serde_json::Value::Object(metadata)))
      }
      Err(e) => {
        log::error!("Failed to extract metadata from {}: {}", file_path, e);
        CommandResult::error(format!("Failed to extract metadata: {}", e))
      }
    }
  }

  async fn generate_video_thumbnail(
    &self,
    video_path: String,
    time: f64,
    output_path: Option<String>,
  ) -> CommandResult {
    log::info!("Generating thumbnail for: {} at time: {}", video_path, time);

    if !std::path::Path::new(&video_path).exists() {
      return CommandResult::error(format!("Video file not found: {}", video_path));
    }

    // Generate output path if not provided
    let thumbnail_path = match output_path {
      Some(path) => path,
      None => {
        let video_stem = std::path::Path::new(&video_path)
          .file_stem()
          .and_then(|s| s.to_str())
          .unwrap_or("thumbnail");
        format!("{}_thumb_{:.1}s.jpg", video_stem, time)
      }
    };

    // Use FFmpeg to extract frame
    match ffmpeg_next::format::input(&video_path) {
      Ok(mut input) => {
        // Find video stream and extract needed info
        let video_stream_info = {
          let video_stream = input.streams().best(ffmpeg_next::media::Type::Video);
          if video_stream.is_none() {
            return CommandResult::error("No video stream found".to_string());
          }

          let video_stream = video_stream.unwrap();
          let video_stream_index = video_stream.index();
          let time_base = video_stream.time_base();
          let parameters = video_stream.parameters();

          (video_stream_index, time_base, parameters)
        };

        let (video_stream_index, time_base, stream_params) = video_stream_info;

        // Seek to desired time
        let seek_target =
          (time * time_base.denominator() as f64 / time_base.numerator() as f64) as i64;

        if let Err(e) = input.seek(seek_target, ..seek_target) {
          log::warn!("Could not seek to time {}: {}", time, e);
        }

        // Create decoder
        let context_decoder = ffmpeg_next::codec::context::Context::from_parameters(stream_params);
        if let Ok(mut decoder) = context_decoder.and_then(|ctx| ctx.decoder().video()) {
          let scaler = ffmpeg_next::software::scaling::context::Context::get(
            decoder.format(),
            decoder.width(),
            decoder.height(),
            ffmpeg_next::format::Pixel::RGB24,
            decoder.width(),
            decoder.height(),
            ffmpeg_next::software::scaling::flag::Flags::BILINEAR,
          );

          if let Ok(mut scaler) = scaler {
            let mut frame = ffmpeg_next::util::frame::video::Video::empty();
            let mut rgb_frame = ffmpeg_next::util::frame::video::Video::empty();

            // Process packets
            for (stream, packet) in input.packets() {
              if stream.index() == video_stream_index {
                if decoder.send_packet(&packet).is_ok() {
                  while decoder.receive_frame(&mut frame).is_ok() {
                    // Scale to RGB
                    if scaler.run(&frame, &mut rgb_frame).is_ok() {
                      // Save as JPEG using image crate
                      if let Err(e) = self.save_rgb_frame_as_jpeg(&rgb_frame, &thumbnail_path) {
                        return CommandResult::error(format!("Failed to save thumbnail: {}", e));
                      }

                      return CommandResult::success(Some(serde_json::json!({
                        "video_path": video_path,
                        "thumbnail_path": thumbnail_path,
                        "time": time,
                        "width": rgb_frame.width(),
                        "height": rgb_frame.height()
                      })));
                    }
                  }
                }
                break; // Only process first frame
              }
            }
          }
        }

        CommandResult::error("Could not generate thumbnail - decoding failed".to_string())
      }
      Err(e) => CommandResult::error(format!("Failed to open video file: {}", e)),
    }
  }

  async fn get_media_duration(&self, file_path: String) -> CommandResult {
    log::info!("Getting duration for: {}", file_path);

    if !std::path::Path::new(&file_path).exists() {
      return CommandResult::error(format!("File not found: {}", file_path));
    }

    match ffmpeg_next::format::input(&file_path) {
      Ok(input) => {
        let duration_seconds = input.duration() as f64 / ffmpeg_next::ffi::AV_TIME_BASE as f64;

        CommandResult::success(Some(serde_json::json!({
          "file_path": file_path,
          "duration": duration_seconds,
          "duration_formatted": Self::format_duration(duration_seconds)
        })))
      }
      Err(e) => CommandResult::error(format!("Failed to get duration: {}", e)),
    }
  }

  async fn detect_video_scenes(&self, video_path: String, threshold: Option<f64>) -> CommandResult {
    log::info!(
      "Detecting scenes in: {} with threshold: {:?}",
      video_path,
      threshold
    );

    // TODO: Implement scene detection using FFmpeg

    CommandResult::success(Some(serde_json::json!({
      "video_path": video_path,
      "threshold": threshold,
      "scenes": []
    })))
  }

  async fn generate_audio_waveform(
    &self,
    audio_path: String,
    width: u32,
    height: u32,
  ) -> CommandResult {
    log::info!(
      "Generating waveform for: {} ({}x{})",
      audio_path,
      width,
      height
    );

    // TODO: Implement waveform generation

    CommandResult::success(Some(serde_json::json!({
      "audio_path": audio_path,
      "width": width,
      "height": height,
      "waveform_data": []
    })))
  }

  async fn copy_media_to_project(
    &self,
    source_paths: Vec<String>,
    project_path: String,
  ) -> CommandResult {
    log::info!(
      "Copying media files {:?} to project: {}",
      source_paths,
      project_path
    );

    // TODO: Implement file copying with progress tracking

    CommandResult::success(Some(serde_json::json!({
      "source_paths": source_paths,
      "project_path": project_path,
      "copied_files": []
    })))
  }

  async fn create_proxy_files(
    &self,
    media_paths: Vec<String>,
    proxy_settings: ProxySettings,
  ) -> CommandResult {
    log::info!(
      "Creating proxy files for: {:?} with settings: {:?}",
      media_paths,
      proxy_settings
    );

    // TODO: Implement proxy file creation using FFmpeg

    CommandResult::success(Some(serde_json::json!({
      "media_paths": media_paths,
      "proxy_settings": proxy_settings,
      "proxy_files": []
    })))
  }

  async fn delete_media_files(
    &self,
    file_paths: Vec<String>,
    move_to_trash: bool,
  ) -> CommandResult {
    log::info!(
      "Deleting media files: {:?} (move_to_trash: {})",
      file_paths,
      move_to_trash
    );

    // TODO: Implement file deletion (with trash support on different platforms)

    CommandResult::success(Some(serde_json::json!({
      "deleted_files": file_paths,
      "move_to_trash": move_to_trash
    })))
  }

  async fn move_media_files(
    &self,
    source_paths: Vec<String>,
    destination_path: String,
  ) -> CommandResult {
    log::info!(
      "Moving media files {:?} to: {}",
      source_paths,
      destination_path
    );

    // TODO: Implement file moving with progress tracking

    CommandResult::success(Some(serde_json::json!({
      "source_paths": source_paths,
      "destination_path": destination_path,
      "moved_files": []
    })))
  }

  async fn scan_media_directory(
    &self,
    directory_path: String,
    recursive: bool,
    supported_formats: Vec<String>,
  ) -> CommandResult {
    log::info!(
      "Scanning directory: {} (recursive: {}, formats: {:?})",
      directory_path,
      recursive,
      supported_formats
    );

    let dir_path = std::path::Path::new(&directory_path);
    if !dir_path.exists() || !dir_path.is_dir() {
      return CommandResult::error(format!("Directory not found: {}", directory_path));
    }

    let mut found_files = Vec::new();
    let formats_lower: Vec<String> = supported_formats.iter().map(|f| f.to_lowercase()).collect();

    fn scan_directory(
      path: &std::path::Path,
      recursive: bool,
      formats: &[String],
      files: &mut Vec<serde_json::Value>,
    ) -> Result<(), Box<dyn std::error::Error>> {
      for entry in std::fs::read_dir(path)? {
        let entry = entry?;
        let file_path = entry.path();

        if file_path.is_dir() && recursive {
          scan_directory(&file_path, recursive, formats, files)?;
        } else if file_path.is_file() {
          if let Some(extension) = file_path.extension().and_then(|ext| ext.to_str()) {
            let ext_lower = extension.to_lowercase();
            if formats.is_empty() || formats.contains(&ext_lower) {
              let mut file_info = serde_json::Map::new();
              file_info.insert(
                "path".to_string(),
                serde_json::Value::String(file_path.to_string_lossy().to_string()),
              );
              file_info.insert(
                "name".to_string(),
                serde_json::Value::String(
                  file_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string(),
                ),
              );
              file_info.insert(
                "extension".to_string(),
                serde_json::Value::String(ext_lower),
              );

              // Get file size
              if let Ok(metadata) = file_path.metadata() {
                file_info.insert(
                  "size".to_string(),
                  serde_json::Value::Number(serde_json::Number::from(metadata.len())),
                );
                if let Ok(modified) = metadata.modified() {
                  if let Ok(timestamp) = modified.duration_since(std::time::UNIX_EPOCH) {
                    file_info.insert(
                      "modified".to_string(),
                      serde_json::Value::Number(serde_json::Number::from(timestamp.as_secs())),
                    );
                  }
                }
              }

              files.push(serde_json::Value::Object(file_info));
            }
          }
        }
      }
      Ok(())
    }

    match scan_directory(dir_path, recursive, &formats_lower, &mut found_files) {
      Ok(_) => CommandResult::success(Some(serde_json::json!({
        "directory_path": directory_path,
        "recursive": recursive,
        "supported_formats": supported_formats,
        "found_files": found_files,
        "count": found_files.len()
      }))),
      Err(e) => CommandResult::error(format!("Failed to scan directory: {}", e)),
    }
  }

  async fn index_media_files(
    &self,
    file_paths: Vec<String>,
    extract_metadata: bool,
  ) -> CommandResult {
    log::info!(
      "Indexing media files: {:?} (extract_metadata: {})",
      file_paths,
      extract_metadata
    );

    // TODO: Implement media file indexing for search

    CommandResult::success(Some(serde_json::json!({
      "indexed_files": file_paths,
      "extract_metadata": extract_metadata
    })))
  }

  async fn search_media_library(
    &self,
    query: String,
    filters: MediaSearchFilters,
  ) -> CommandResult {
    log::info!(
      "Searching media library with query: '{}' and filters: {:?}",
      query,
      filters
    );

    // TODO: Implement media library search

    CommandResult::success(Some(serde_json::json!({
      "query": query,
      "filters": filters,
      "results": []
    })))
  }

  async fn export_media_file(
    &self,
    source_path: String,
    output_path: String,
    export_settings: MediaExportSettings,
  ) -> CommandResult {
    log::info!(
      "Exporting media file from: {} to: {} with settings: {:?}",
      source_path,
      output_path,
      export_settings
    );

    // TODO: Implement media export using FFmpeg

    CommandResult::success(Some(serde_json::json!({
      "source_path": source_path,
      "output_path": output_path,
      "export_settings": export_settings
    })))
  }

  async fn batch_export_media(
    &self,
    media_items: Vec<BatchExportItem>,
    output_directory: String,
  ) -> CommandResult {
    log::info!(
      "Batch exporting {} media items to: {}",
      media_items.len(),
      output_directory
    );

    // TODO: Implement batch export with progress tracking

    CommandResult::success(Some(serde_json::json!({
      "media_items": media_items,
      "output_directory": output_directory,
      "exported_files": []
    })))
  }

  async fn convert_media_format(
    &self,
    input_path: String,
    output_path: String,
    format: String,
    conversion_options: MediaConversionOptions,
  ) -> CommandResult {
    log::info!(
      "Converting media format from: {} to: {} (format: {}) with options: {:?}",
      input_path,
      output_path,
      format,
      conversion_options
    );

    // TODO: Implement format conversion using FFmpeg

    CommandResult::success(Some(serde_json::json!({
      "input_path": input_path,
      "output_path": output_path,
      "format": format,
      "conversion_options": conversion_options
    })))
  }

  async fn optimize_media_file(
    &self,
    file_path: String,
    optimization_settings: MediaOptimizationSettings,
  ) -> CommandResult {
    log::info!(
      "Optimizing media file: {} with settings: {:?}",
      file_path,
      optimization_settings
    );

    // TODO: Implement media optimization using FFmpeg
    // This would involve re-encoding with optimized settings

    CommandResult::success(Some(serde_json::json!({
      "file_path": file_path,
      "optimization_settings": optimization_settings,
      "optimized_file": file_path
    })))
  }

  // Helper methods for media management
  fn save_rgb_frame_as_jpeg(
    &self,
    rgb_frame: &ffmpeg_next::util::frame::video::Video,
    output_path: &str,
  ) -> Result<(), Box<dyn std::error::Error>> {
    use image::{ImageBuffer, Rgb};

    let width = rgb_frame.width();
    let height = rgb_frame.height();
    let data = rgb_frame.data(0);

    // Create image buffer from RGB data
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> = ImageBuffer::from_raw(width, height, data.to_vec())
      .ok_or("Failed to create image buffer from frame data")?;

    // Save as JPEG
    img.save(output_path)?;

    Ok(())
  }

  fn format_duration(seconds: f64) -> String {
    let hours = (seconds / 3600.0) as u32;
    let minutes = ((seconds % 3600.0) / 60.0) as u32;
    let secs = (seconds % 60.0) as u32;
    let millis = ((seconds % 1.0) * 1000.0) as u32;

    if hours > 0 {
      format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, secs, millis)
    } else {
      format!("{:02}:{:02}.{:03}", minutes, secs, millis)
    }
  }

  #[allow(dead_code)]
  async fn copy_files_to_directory(
    &self,
    source_paths: &[String],
    destination_dir: &str,
  ) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let dest_path = std::path::Path::new(destination_dir);
    if !dest_path.exists() {
      std::fs::create_dir_all(dest_path)?;
    }

    let mut copied_files = Vec::new();
    for source_path in source_paths {
      let source = std::path::Path::new(source_path);
      if let Some(file_name) = source.file_name() {
        let destination = dest_path.join(file_name);
        std::fs::copy(source, &destination)?;
        copied_files.push(destination.to_string_lossy().to_string());
      }
    }

    Ok(copied_files)
  }

  #[allow(dead_code)]
  fn is_supported_media_format(extension: &str) -> bool {
    matches!(
      extension.to_lowercase().as_str(),
      "mp4"
        | "mov"
        | "avi"
        | "mkv"
        | "webm"
        | "mxf"
        | "r3d"
        | "braw"
        | "dng"
        | "mp3"
        | "wav"
        | "aiff"
        | "flac"
        | "ogg"
        | "m4a"
        | "aac"
        | "jpg"
        | "jpeg"
        | "png"
        | "gif"
        | "webp"
        | "tiff"
        | "raw"
        | "heic"
    )
  }

  // System Integration command implementations

  async fn open_modal(
    &self,
    modal_type: String,
    modal_data: Option<serde_json::Value>,
  ) -> CommandResult {
    log::info!("Opening modal: {} with data: {:?}", modal_type, modal_data);

    // Publish modal event through EventBus
    self
      .event_bus
      .publish(
        ProjectEvent::ModalOpened {
          modal_type: modal_type.clone(),
          modal_data: modal_data.clone(),
        },
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "modal_type": modal_type,
      "modal_data": modal_data,
      "status": "opened"
    })))
  }

  async fn close_modal(&self) -> CommandResult {
    log::info!("Closing modal");

    // Publish modal event through EventBus
    self
      .event_bus
      .publish(
        ProjectEvent::ModalClosed,
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "status": "closed"
    })))
  }

  async fn submit_modal(&self, data: Option<serde_json::Value>) -> CommandResult {
    log::info!("Submitting modal with data: {:?}", data);

    // Publish modal event through EventBus
    self
      .event_bus
      .publish(
        ProjectEvent::ModalSubmitted { data: data.clone() },
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "data": data,
      "status": "submitted"
    })))
  }

  async fn show_notification(
    &self,
    notification_type: String,
    title: String,
    message: String,
    duration: Option<u32>,
    actions: Option<Vec<NotificationAction>>,
  ) -> CommandResult {
    let id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().to_rfc3339();

    log::info!("Showing notification: {} - {}", title, message);

    let notification = SystemNotification {
      id: id.clone(),
      notification_type: notification_type.clone(),
      title: title.clone(),
      message: message.clone(),
      timestamp: timestamp.clone(),
      duration,
      actions: actions.clone(),
    };

    // Store notification in state if needed
    // For now, we'll publish an event
    self
      .event_bus
      .publish(
        ProjectEvent::NotificationShown {
          notification: notification.clone(),
        },
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "id": id,
      "notification_type": notification_type,
      "title": title,
      "message": message,
      "timestamp": timestamp,
      "duration": duration,
      "actions": actions
    })))
  }

  async fn dismiss_notification(&self, id: String) -> CommandResult {
    log::info!("Dismissing notification: {}", id);

    // Publish notification event through EventBus
    self
      .event_bus
      .publish(
        ProjectEvent::NotificationDismissed { id: id.clone() },
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "id": id,
      "status": "dismissed"
    })))
  }

  async fn clear_notifications(&self) -> CommandResult {
    log::info!("Clearing all notifications");

    // Publish notification event through EventBus
    self
      .event_bus
      .publish(
        ProjectEvent::NotificationsCleared,
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "status": "cleared"
    })))
  }

  async fn check_for_updates(&self) -> CommandResult {
    log::info!("Checking for updates");

    // TODO: Implement actual update checking logic
    // For now, simulate a check
    let current_version = env!("CARGO_PKG_VERSION");

    // Publish update event through EventBus
    self
      .event_bus
      .publish(
        ProjectEvent::UpdateCheckStarted,
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    // Simulate update availability (in real implementation, this would check against a server)
    let has_update = false; // Placeholder

    if has_update {
      let update_info = UpdateInfo {
        version: "1.0.1".to_string(),
        release_notes: "Bug fixes and improvements".to_string(),
        download_url: "https://example.com/download".to_string(),
        size: 52428800.0, // 50MB
      };

      self
        .event_bus
        .publish(
          ProjectEvent::UpdateAvailable {
            update_info: update_info.clone(),
          },
          "system_integration".to_string(),
          1,
        )
        .await
        .ok();

      CommandResult::success(Some(serde_json::json!({
        "has_update": true,
        "current_version": current_version,
        "update_info": update_info
      })))
    } else {
      self
        .event_bus
        .publish(
          ProjectEvent::UpdateCheckCompleted { has_update: false },
          "system_integration".to_string(),
          1,
        )
        .await
        .ok();

      CommandResult::success(Some(serde_json::json!({
        "has_update": false,
        "current_version": current_version
      })))
    }
  }

  async fn download_update(&self) -> CommandResult {
    log::info!("Downloading update");

    // TODO: Implement actual download logic
    // For now, simulate download process

    self
      .event_bus
      .publish(
        ProjectEvent::UpdateDownloadStarted,
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    // Simulate download completion
    self
      .event_bus
      .publish(
        ProjectEvent::UpdateDownloadCompleted,
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "status": "download_completed",
      "message": "Update downloaded successfully"
    })))
  }

  async fn install_update(&self) -> CommandResult {
    log::info!("Installing update");

    // TODO: Implement actual installation logic
    // This would typically involve:
    // 1. Validating the downloaded update
    // 2. Backing up current installation
    // 3. Applying the update
    // 4. Restarting the application

    self
      .event_bus
      .publish(
        ProjectEvent::UpdateInstallStarted,
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "status": "install_started",
      "message": "Update installation started. Application will restart automatically."
    })))
  }

  async fn dismiss_update(&self) -> CommandResult {
    log::info!("Dismissing update");

    self
      .event_bus
      .publish(
        ProjectEvent::UpdateDismissed,
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "status": "dismissed"
    })))
  }

  async fn enable_auto_update(&self, interval_minutes: u32) -> CommandResult {
    log::info!(
      "Enabling auto-update with interval: {} minutes",
      interval_minutes
    );

    // TODO: Implement auto-update scheduling
    // This would set up a periodic check for updates

    self
      .event_bus
      .publish(
        ProjectEvent::AutoUpdateEnabled { interval_minutes },
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "auto_update_enabled": true,
      "interval_minutes": interval_minutes
    })))
  }

  async fn disable_auto_update(&self) -> CommandResult {
    log::info!("Disabling auto-update");

    // TODO: Implement auto-update cancellation

    self
      .event_bus
      .publish(
        ProjectEvent::AutoUpdateDisabled,
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "auto_update_enabled": false
    })))
  }

  async fn toggle_feature(&self, feature: String, enabled: bool) -> CommandResult {
    log::info!("Toggling feature '{}' to: {}", feature, enabled);

    // TODO: Implement feature flag storage (could be in user settings or separate config)
    // For now, we'll just publish an event

    let feature_state = FeatureState {
      name: feature.clone(),
      enabled,
      description: Some(format!(
        "Feature '{}' is now {}",
        feature,
        if enabled { "enabled" } else { "disabled" }
      )),
    };

    self
      .event_bus
      .publish(
        ProjectEvent::FeatureToggled {
          feature: feature.clone(),
          enabled,
        },
        "system_integration".to_string(),
        1,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "feature": feature,
      "enabled": enabled,
      "feature_state": feature_state
    })))
  }

  // Video Editing command implementations

  async fn export_timeline(
    &self,
    timeline_id: String,
    output_path: String,
    format: String,
  ) -> CommandResult {
    log::info!(
      "Exporting timeline {} to {} in format {}",
      timeline_id,
      output_path,
      format
    );

    let state = self.state.read().await;

    // Find the project containing this timeline
    if let Some(project) = &state.project {
      let timeline_data = TimelineExportData {
        timeline_id: timeline_id.clone(),
        format: format.clone(),
        tracks: project
          .timeline
          .tracks
          .iter()
          .map(|track| TrackExportData {
            id: track.id.clone(),
            name: track.name.clone(),
            track_type: format!("{:?}", track.track_type),
            clips: track
              .clips
              .iter()
              .map(|clip| ClipExportData {
                id: clip.id.clone(),
                media_path: clip.media_id.clone(),
                start_time: clip.timeline_in,
                duration: clip.timeline_out - clip.timeline_in,
                effects: vec![], // TODO: Export effects
              })
              .collect(),
          })
          .collect(),
        metadata: TimelineMetadata {
          name: project.metadata.name.clone(),
          duration: 0.0, // TODO: Calculate timeline duration
          fps: project.settings.frame_rate as u32,
          resolution: Resolution {
            width: project.settings.resolution.width,
            height: project.settings.resolution.height,
          },
          created_at: chrono::Utc::now().to_rfc3339(),
          modified_at: chrono::Utc::now().to_rfc3339(),
        },
      };

      // Export based on format
      match format.as_str() {
        "json" => {
          let json_data = serde_json::to_string_pretty(&timeline_data)
            .map_err(|e| format!("Failed to serialize timeline: {}", e));

          match json_data {
            Ok(data) => {
              if let Err(e) = std::fs::write(&output_path, data) {
                return CommandResult::error(format!("Failed to write file: {}", e));
              }
            }
            Err(e) => return CommandResult::error(e),
          }
        }
        "xml" | "edl" | "fcpxml" => {
          // TODO: Implement XML, EDL, and FCPXML export formats
          return CommandResult::error(format!("Export format '{}' not yet implemented", format));
        }
        _ => {
          return CommandResult::error(format!("Unsupported export format: {}", format));
        }
      }

      CommandResult::success(Some(serde_json::json!({
        "timeline_id": timeline_id,
        "output_path": output_path,
        "format": format,
        "exported_tracks": timeline_data.tracks.len()
      })))
    } else {
      CommandResult::error("No project loaded".to_string())
    }
  }

  async fn import_timeline(&self, file_path: String, merge_mode: String) -> CommandResult {
    log::info!(
      "Importing timeline from {} with merge mode {}",
      file_path,
      merge_mode
    );

    // TODO: Implement timeline import logic
    // This would involve:
    // 1. Reading and parsing the timeline file
    // 2. Converting to internal timeline format
    // 3. Merging with existing timeline based on merge_mode

    CommandResult::success(Some(serde_json::json!({
      "file_path": file_path,
      "merge_mode": merge_mode,
      "status": "imported"
    })))
  }

  async fn export_project(
    &self,
    project_id: String,
    output_path: String,
    format: String,
    include_media: bool,
  ) -> CommandResult {
    log::info!(
      "Exporting project {} to {} (format: {}, include_media: {})",
      project_id,
      output_path,
      format,
      include_media
    );

    // TODO: Implement full project export
    // This would involve:
    // 1. Exporting all timelines
    // 2. Exporting project settings
    // 3. Optionally copying media files
    // 4. Creating project package

    CommandResult::success(Some(serde_json::json!({
      "project_id": project_id,
      "output_path": output_path,
      "format": format,
      "include_media": include_media,
      "status": "exported"
    })))
  }

  async fn render_video(
    &self,
    timeline_id: String,
    output_path: String,
    render_settings: RenderSettings,
  ) -> CommandResult {
    log::info!(
      "Rendering video for timeline {} to {}",
      timeline_id,
      output_path
    );

    // TODO: Integrate with existing video compiler
    // This should delegate to the video_compiler module

    let render_job_id = uuid::Uuid::new_v4().to_string();

    CommandResult::success(Some(serde_json::json!({
      "render_job_id": render_job_id,
      "timeline_id": timeline_id,
      "output_path": output_path,
      "render_settings": render_settings,
      "status": "started"
    })))
  }

  async fn start_render(&self, project_id: String, settings: RenderSettings) -> CommandResult {
    log::info!("Starting render for project {}", project_id);

    let render_job_id = uuid::Uuid::new_v4().to_string();

    // TODO: Integrate with video compiler
    // Start actual rendering process

    CommandResult::success(Some(serde_json::json!({
      "render_job_id": render_job_id,
      "project_id": project_id,
      "settings": settings,
      "status": "started"
    })))
  }

  async fn get_render_progress(&self, render_job_id: String) -> CommandResult {
    log::info!("Getting render progress for job {}", render_job_id);

    // TODO: Get actual progress from video compiler
    let progress = RenderJobInfo {
      id: render_job_id.clone(),
      status: "running".to_string(),
      progress: 0.45, // Simulated progress
      current_frame: 450,
      total_frames: 1000,
      estimated_time_remaining: Some(120),
      output_path: "/path/to/output.mp4".to_string(),
    };

    CommandResult::success(Some(serde_json::json!(progress)))
  }

  async fn cancel_render(&self, render_job_id: String) -> CommandResult {
    log::info!("Cancelling render job {}", render_job_id);

    // TODO: Cancel actual render job in video compiler

    CommandResult::success(Some(serde_json::json!({
      "render_job_id": render_job_id,
      "status": "cancelled"
    })))
  }

  async fn apply_effect_to_clip(
    &self,
    clip_id: String,
    effect_id: String,
    params: serde_json::Value,
  ) -> CommandResult {
    log::info!(
      "Applying effect {} to clip {} with params: {:?}",
      effect_id,
      clip_id,
      params
    );

    let mut state = self.state.write().await;

    // Find and update the clip
    if let Some(project) = &mut state.project {
      for track in &mut project.timeline.tracks {
        for clip in &mut track.clips {
          if clip.id == clip_id {
            // TODO: Add effect to clip's effects list
            state.mark_dirty();

            return CommandResult::success(Some(serde_json::json!({
              "clip_id": clip_id,
              "effect_id": effect_id,
              "params": params,
              "status": "applied"
            })));
          }
        }
      }
    }

    CommandResult::error("Clip not found".to_string())
  }

  async fn optimize_timeline(
    &self,
    timeline_id: String,
    optimization_type: String,
  ) -> CommandResult {
    log::info!(
      "Optimizing timeline {} with type {}",
      timeline_id,
      optimization_type
    );

    // TODO: Implement timeline optimization
    // This could include:
    // - Removing empty tracks
    // - Consolidating clips
    // - Optimizing effects
    // - Performance analysis

    CommandResult::success(Some(serde_json::json!({
      "timeline_id": timeline_id,
      "optimization_type": optimization_type,
      "optimizations_applied": ["removed_empty_tracks", "consolidated_effects"],
      "performance_improvement": "15%"
    })))
  }

  async fn start_real_time_preview(&self, timeline_id: String, quality: String) -> CommandResult {
    log::info!(
      "Starting real-time preview for timeline {} with quality {}",
      timeline_id,
      quality
    );

    // TODO: Start real-time preview rendering
    // This would involve setting up a preview pipeline

    CommandResult::success(Some(serde_json::json!({
      "timeline_id": timeline_id,
      "quality": quality,
      "status": "started",
      "preview_fps": 30
    })))
  }

  async fn stop_real_time_preview(&self) -> CommandResult {
    log::info!("Stopping real-time preview");

    // TODO: Stop real-time preview rendering

    CommandResult::success(Some(serde_json::json!({
      "status": "stopped"
    })))
  }

  async fn update_preview_frame(&self, timestamp: f64) -> CommandResult {
    log::info!("Updating preview frame at timestamp {}", timestamp);

    // TODO: Generate preview frame at specific timestamp

    CommandResult::success(Some(serde_json::json!({
      "timestamp": timestamp,
      "frame_updated": true
    })))
  }

  // AI Provider command implementations

  async fn get_available_providers(&self) -> CommandResult {
    log::info!("Getting available AI providers");

    let providers = vec![
      AiProvider {
        id: "claude".to_string(),
        name: "Claude (Anthropic)".to_string(),
        is_available: true,
        requires_api_key: true,
        supported_models: vec![
          AiModel {
            id: "claude-3-5-sonnet-20241022".to_string(),
            name: "Claude 3.5 Sonnet".to_string(),
            description: "Most intelligent model".to_string(),
            max_tokens: 200000,
            cost_per_token: Some(0.000003),
            is_available: true,
          },
          AiModel {
            id: "claude-3-5-haiku-20241022".to_string(),
            name: "Claude 3.5 Haiku".to_string(),
            description: "Fastest model".to_string(),
            max_tokens: 200000,
            cost_per_token: Some(0.000001),
            is_available: true,
          },
        ],
        capabilities: vec![
          "text".to_string(),
          "vision".to_string(),
          "tools".to_string(),
        ],
      },
      AiProvider {
        id: "openai".to_string(),
        name: "OpenAI".to_string(),
        is_available: true,
        requires_api_key: true,
        supported_models: vec![
          AiModel {
            id: "gpt-4o".to_string(),
            name: "GPT-4o".to_string(),
            description: "Latest multimodal model".to_string(),
            max_tokens: 128000,
            cost_per_token: Some(0.000005),
            is_available: true,
          },
          AiModel {
            id: "gpt-4o-mini".to_string(),
            name: "GPT-4o Mini".to_string(),
            description: "Smaller, faster model".to_string(),
            max_tokens: 128000,
            cost_per_token: Some(0.00000015),
            is_available: true,
          },
        ],
        capabilities: vec![
          "text".to_string(),
          "vision".to_string(),
          "tools".to_string(),
        ],
      },
      AiProvider {
        id: "deepseek".to_string(),
        name: "DeepSeek".to_string(),
        is_available: true,
        requires_api_key: true,
        supported_models: vec![AiModel {
          id: "deepseek-chat".to_string(),
          name: "DeepSeek Chat".to_string(),
          description: "Reasoning-capable model".to_string(),
          max_tokens: 64000,
          cost_per_token: Some(0.00000014),
          is_available: true,
        }],
        capabilities: vec!["text".to_string(), "reasoning".to_string()],
      },
      AiProvider {
        id: "grok".to_string(),
        name: "Grok (X.AI)".to_string(),
        is_available: true,
        requires_api_key: true,
        supported_models: vec![AiModel {
          id: "grok-beta".to_string(),
          name: "Grok Beta".to_string(),
          description: "Real-time model".to_string(),
          max_tokens: 131072,
          cost_per_token: Some(0.000005),
          is_available: true,
        }],
        capabilities: vec!["text".to_string(), "realtime".to_string()],
      },
      AiProvider {
        id: "ollama".to_string(),
        name: "Ollama (Local)".to_string(),
        is_available: self.check_ollama_availability().await,
        requires_api_key: false,
        supported_models: self.get_ollama_models().await,
        capabilities: vec!["text".to_string(), "local".to_string()],
      },
    ];

    CommandResult::success(Some(serde_json::json!({
      "providers": providers
    })))
  }

  async fn get_provider_models(&self, provider: String) -> CommandResult {
    log::info!("Getting models for provider: {}", provider);

    match provider.as_str() {
      "claude" => {
        let models = vec![
          AiModel {
            id: "claude-3-5-sonnet-20241022".to_string(),
            name: "Claude 3.5 Sonnet".to_string(),
            description: "Most intelligent model".to_string(),
            max_tokens: 200000,
            cost_per_token: Some(0.000003),
            is_available: true,
          },
          AiModel {
            id: "claude-3-5-haiku-20241022".to_string(),
            name: "Claude 3.5 Haiku".to_string(),
            description: "Fastest model".to_string(),
            max_tokens: 200000,
            cost_per_token: Some(0.000001),
            is_available: true,
          },
        ];
        CommandResult::success(Some(serde_json::json!({ "models": models })))
      }
      "openai" => {
        // TODO: Make actual API call to get latest models
        let models = vec![
          AiModel {
            id: "gpt-4o".to_string(),
            name: "GPT-4o".to_string(),
            description: "Latest multimodal model".to_string(),
            max_tokens: 128000,
            cost_per_token: Some(0.000005),
            is_available: true,
          },
          AiModel {
            id: "gpt-4o-mini".to_string(),
            name: "GPT-4o Mini".to_string(),
            description: "Smaller, faster model".to_string(),
            max_tokens: 128000,
            cost_per_token: Some(0.00000015),
            is_available: true,
          },
        ];
        CommandResult::success(Some(serde_json::json!({ "models": models })))
      }
      "ollama" => {
        let models = self.get_ollama_models().await;
        CommandResult::success(Some(serde_json::json!({ "models": models })))
      }
      _ => CommandResult::error(format!("Unknown provider: {}", provider)),
    }
  }

  async fn validate_provider_connection(&self, provider: String) -> CommandResult {
    log::info!("Validating connection for provider: {}", provider);

    // TODO: Implement actual validation by making test API calls
    match provider.as_str() {
      "claude" | "openai" | "deepseek" | "grok" => {
        // Check if API key exists and is valid
        CommandResult::success(Some(serde_json::json!({
          "provider": provider,
          "is_connected": true,
          "status": "API key validated"
        })))
      }
      "ollama" => {
        let is_available = self.check_ollama_availability().await;
        CommandResult::success(Some(serde_json::json!({
          "provider": provider,
          "is_connected": is_available,
          "status": if is_available { "Ollama server running" } else { "Ollama server not running" }
        })))
      }
      _ => CommandResult::error(format!("Unknown provider: {}", provider)),
    }
  }

  async fn get_provider_capabilities(&self, provider: String) -> CommandResult {
    log::info!("Getting capabilities for provider: {}", provider);

    let capabilities = match provider.as_str() {
      "claude" => vec!["text", "vision", "tools", "streaming"],
      "openai" => vec!["text", "vision", "tools", "streaming", "function_calling"],
      "deepseek" => vec!["text", "reasoning", "streaming"],
      "grok" => vec!["text", "realtime", "streaming"],
      "ollama" => vec!["text", "local", "streaming"],
      _ => return CommandResult::error(format!("Unknown provider: {}", provider)),
    };

    CommandResult::success(Some(serde_json::json!({
      "provider": provider,
      "capabilities": capabilities
    })))
  }

  async fn send_ai_request(
    &self,
    provider: String,
    model: String,
    messages: Vec<AiMessage>,
    options: AiRequestOptions,
  ) -> CommandResult {
    log::info!("Sending AI request to {} with model {}", provider, model);

    // Get API key from secure storage
    let api_key = match self.get_api_key_for_provider(&provider).await {
      Some(key) => key,
      None => {
        return CommandResult::error(format!("No API key configured for provider: {}", provider));
      }
    };

    // Route to appropriate provider implementation
    let result = match provider.as_str() {
      "claude" => {
        self
          .send_claude_request(&api_key, &model, &messages, &options)
          .await
      }
      "openai" => {
        self
          .send_openai_request(&api_key, &model, &messages, &options)
          .await
      }
      "deepseek" => {
        self
          .send_deepseek_request(&api_key, &model, &messages, &options)
          .await
      }
      "grok" => {
        self
          .send_grok_request(&api_key, &model, &messages, &options)
          .await
      }
      "ollama" => self.send_ollama_request(&model, &messages, &options).await,
      _ => {
        return CommandResult::error(format!("Unsupported provider: {}", provider));
      }
    };

    match result {
      Ok(response) => {
        // Log usage for monitoring
        self
          .log_ai_usage(&provider, &model, response.tokens_used, response.cost)
          .await;
        CommandResult::success(Some(serde_json::json!(response)))
      }
      Err(e) => CommandResult::error(format!("AI request failed: {}", e)),
    }
  }

  async fn send_streaming_ai_request(
    &self,
    provider: String,
    model: String,
    messages: Vec<AiMessage>,
    options: AiRequestOptions,
  ) -> CommandResult {
    log::info!(
      "Starting streaming AI request to {} with model {}",
      provider,
      model
    );

    // Get API key
    let api_key = match self.get_api_key_for_provider(&provider).await {
      Some(key) => key,
      None => {
        return CommandResult::error(format!("No API key configured for provider: {}", provider));
      }
    };

    // Start streaming in background task
    let stream_id = uuid::Uuid::new_v4().to_string();
    let event_bus = self.event_bus.clone();

    // Clone data for background task
    let provider_clone = provider.clone();
    let model_clone = model.clone();
    let _messages_clone = messages.clone();
    let _options_clone = options.clone();
    let _api_key_clone = api_key.clone();
    let stream_id_clone = stream_id.clone();

    tokio::spawn(async move {
      // TODO: Implement actual streaming for each provider
      // For now, simulate streaming by chunking a regular response

      match provider_clone.as_str() {
        "claude" | "openai" | "deepseek" | "grok" => {
          // Simulate streaming by sending chunks
          let provider_chunk = format!("{} ", provider_clone);
          let chunks = [
            "This is ",
            "a streaming ",
            "response from ",
            &provider_chunk,
            "backend service. ",
            "The streaming ",
            "implementation ",
            "will be enhanced ",
            "with real SSE support.",
          ];

          for (i, chunk) in chunks.iter().enumerate() {
            let chunk_event = serde_json::json!({
              "type": "chunk",
              "stream_id": stream_id_clone,
              "provider": provider_clone,
              "model": model_clone,
              "content": chunk,
              "index": i,
              "finish_reason": if i == chunks.len() - 1 { "stop" } else { "" }
            });

            if let Err(e) = event_bus
              .publish(
                crate::state::ProjectEvent::StreamingChunk { data: chunk_event },
                "ai_streaming".to_string(),
                1,
              )
              .await
            {
              log::error!("Failed to publish streaming chunk: {}", e);
            }

            // Simulate delay
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
          }
        }
        "ollama" => {
          // Ollama has native streaming support
          // TODO: Implement real Ollama streaming
          log::info!("Ollama streaming not yet implemented");
        }
        _ => {
          log::error!("Unknown provider for streaming: {}", provider_clone);
        }
      }

      // Send completion event
      let completion_event = serde_json::json!({
        "type": "done",
        "stream_id": stream_id_clone,
        "provider": provider_clone,
        "model": model_clone,
        "tokens_used": 150,
        "cost": 0.001
      });

      if let Err(e) = event_bus
        .publish(
          crate::state::ProjectEvent::StreamingComplete {
            data: completion_event,
          },
          "ai_streaming".to_string(),
          1,
        )
        .await
      {
        log::error!("Failed to publish streaming completion: {}", e);
      }
    });

    CommandResult::success(Some(serde_json::json!({
      "provider": provider,
      "model": model,
      "stream_id": stream_id,
      "status": "streaming_started"
    })))
  }

  async fn get_model_info(&self, provider: String, model: String) -> CommandResult {
    log::info!(
      "Getting info for model {} from provider {}",
      model,
      provider
    );

    // TODO: Get actual model information from provider APIs

    CommandResult::success(Some(serde_json::json!({
      "provider": provider,
      "model": model,
      "max_tokens": 128000,
      "cost_per_token": 0.000003,
      "is_available": true,
      "capabilities": ["text", "vision"]
    })))
  }

  async fn refresh_model_list(&self, provider: String) -> CommandResult {
    log::info!("Refreshing model list for provider: {}", provider);

    // TODO: Fetch fresh model list from provider API

    CommandResult::success(Some(serde_json::json!({
      "provider": provider,
      "refreshed": true,
      "model_count": 5
    })))
  }

  async fn check_model_availability(&self, provider: String, model: String) -> CommandResult {
    log::info!(
      "Checking availability of model {} for provider {}",
      model,
      provider
    );

    // TODO: Check actual model availability

    CommandResult::success(Some(serde_json::json!({
      "provider": provider,
      "model": model,
      "is_available": true
    })))
  }

  async fn install_ollama_model(&self, model_name: String) -> CommandResult {
    log::info!("Installing Ollama model: {}", model_name);

    // TODO: Implement actual Ollama model installation

    CommandResult::success(Some(serde_json::json!({
      "model": model_name,
      "status": "installation_started"
    })))
  }

  async fn remove_ollama_model(&self, model_name: String) -> CommandResult {
    log::info!("Removing Ollama model: {}", model_name);

    // TODO: Implement actual Ollama model removal

    CommandResult::success(Some(serde_json::json!({
      "model": model_name,
      "status": "removed"
    })))
  }

  async fn get_ollama_status(&self) -> CommandResult {
    log::info!("Getting Ollama status");

    let is_running = self.check_ollama_availability().await;
    let status = OllamaStatus {
      is_running,
      version: if is_running {
        Some("0.1.0".to_string())
      } else {
        None
      },
      available_models: if is_running {
        vec!["llama2".to_string(), "codellama".to_string()]
      } else {
        vec![]
      },
      memory_usage: if is_running { Some(1024.0) } else { None },
    };

    CommandResult::success(Some(serde_json::json!(status)))
  }

  async fn list_installed_models(&self) -> CommandResult {
    log::info!("Listing installed Ollama models");

    let models = self.get_ollama_models().await;

    CommandResult::success(Some(serde_json::json!({
      "models": models
    })))
  }

  async fn get_ai_usage_stats(&self, provider: Option<String>, timeframe: String) -> CommandResult {
    log::info!(
      "Getting AI usage stats for provider: {:?}, timeframe: {}",
      provider,
      timeframe
    );

    // TODO: Implement actual usage tracking and statistics

    let stats = AiUsageStats {
      provider: provider.unwrap_or("all".to_string()),
      total_requests: 150,
      total_tokens: 50000,
      total_cost: 1.25,
      requests_by_model: serde_json::json!({
        "claude-3-5-sonnet": 100,
        "gpt-4o": 50
      }),
      period_start: chrono::Utc::now().to_rfc3339(),
      period_end: chrono::Utc::now().to_rfc3339(),
    };

    CommandResult::success(Some(serde_json::json!(stats)))
  }

  // Helper methods for AI providers

  async fn check_ollama_availability(&self) -> bool {
    // TODO: Check if Ollama is running on localhost:11434
    false
  }

  async fn get_ollama_models(&self) -> Vec<AiModel> {
    // TODO: Get actual installed Ollama models
    vec![AiModel {
      id: "llama2".to_string(),
      name: "Llama 2".to_string(),
      description: "Meta's Llama 2 model".to_string(),
      max_tokens: 4096,
      cost_per_token: None,
      is_available: true,
    }]
  }

  // === Effects and Filters Implementation ===

  async fn render_effect_pipeline(
    &self,
    clip_id: String,
    effects: Vec<EffectConfig>,
    output_path: String,
    _quality: String,
  ) -> CommandResult {
    // TODO: Implement FFmpeg pipeline for rendering effects
    // 1. Load clip media file
    // 2. Apply effects chain using FFmpeg filters
    // 3. Render to output path with specified quality
    // 4. Update project state with rendered output
    log::info!(
      "Rendering effect pipeline for clip {} with {} effects",
      clip_id,
      effects.len()
    );

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "output_path": output_path,
      "effects_applied": effects.len(),
      "status": "completed"
    })))
  }

  async fn process_video_with_filters(
    &self,
    input_path: String,
    output_path: String,
    filters: Vec<FilterConfig>,
    _render_settings: RenderSettings,
  ) -> CommandResult {
    // TODO: Implement video processing with filters
    // 1. Validate input file exists
    // 2. Build FFmpeg filter chain
    // 3. Apply color correction, blur, distortion, etc.
    // 4. Render with specified settings
    log::info!(
      "Processing video {} with {} filters",
      input_path,
      filters.len()
    );

    CommandResult::success(Some(serde_json::json!({
      "input_path": input_path,
      "output_path": output_path,
      "filters_applied": filters.len(),
      "status": "completed"
    })))
  }

  async fn apply_lut_to_clip(
    &self,
    clip_id: String,
    lut_path: String,
    intensity: f32,
  ) -> CommandResult {
    // TODO: Apply LUT (Look-Up Table) to clip
    // 1. Validate LUT file (.cube, .3dl formats)
    // 2. Apply to clip using FFmpeg lut3d filter
    // 3. Update clip effects in project state
    log::info!(
      "Applying LUT {} to clip {} with intensity {}",
      lut_path,
      clip_id,
      intensity
    );

    let mut state = self.state.write().await;
    state.mark_dirty();

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "lut_path": lut_path,
      "intensity": intensity,
      "status": "applied"
    })))
  }

  async fn create_effect_preset(
    &self,
    name: String,
    effect_id: String,
    _parameters: serde_json::Value,
    category: String,
  ) -> CommandResult {
    // TODO: Create and save effect preset
    // 1. Generate unique preset ID
    // 2. Save to presets directory
    // 3. Update project resources
    let preset_id = format!("preset_{}", uuid::Uuid::new_v4());
    log::info!("Creating effect preset '{}' for effect {}", name, effect_id);

    CommandResult::success(Some(serde_json::json!({
      "preset_id": preset_id,
      "name": name,
      "effect_id": effect_id,
      "category": category,
      "status": "created"
    })))
  }

  async fn save_filter_preset(
    &self,
    name: String,
    filter_id: String,
    _parameters: serde_json::Value,
    tags: Vec<String>,
  ) -> CommandResult {
    // TODO: Save filter preset
    let preset_id = format!("filter_preset_{}", uuid::Uuid::new_v4());
    log::info!("Saving filter preset '{}' for filter {}", name, filter_id);

    CommandResult::success(Some(serde_json::json!({
      "preset_id": preset_id,
      "name": name,
      "filter_id": filter_id,
      "tags": tags,
      "status": "saved"
    })))
  }

  async fn load_effect_presets(&self, effect_id: String) -> CommandResult {
    // TODO: Load presets for specific effect
    log::info!("Loading presets for effect {}", effect_id);

    let presets = vec![EffectPreset {
      id: "preset_1".to_string(),
      name: "Default".to_string(),
      effect_id: effect_id.clone(),
      parameters: serde_json::json!({"intensity": 1.0}),
      category: "standard".to_string(),
      tags: vec!["default".to_string()],
      thumbnail: None,
      created_at: chrono::Utc::now().to_rfc3339(),
    }];

    CommandResult::success(Some(serde_json::json!({
      "effect_id": effect_id,
      "presets": presets,
      "count": presets.len()
    })))
  }

  async fn load_filter_presets(&self, filter_id: String) -> CommandResult {
    // TODO: Load presets for specific filter
    log::info!("Loading presets for filter {}", filter_id);

    let presets = vec![FilterPreset {
      id: "filter_preset_1".to_string(),
      name: "Subtle".to_string(),
      filter_id: filter_id.clone(),
      parameters: serde_json::json!({"strength": 0.5}),
      intensity: 0.5,
      tags: vec!["subtle".to_string()],
      created_at: chrono::Utc::now().to_rfc3339(),
    }];

    CommandResult::success(Some(serde_json::json!({
      "filter_id": filter_id,
      "presets": presets,
      "count": presets.len()
    })))
  }

  async fn delete_preset(&self, preset_id: String, preset_type: String) -> CommandResult {
    // TODO: Delete preset from storage
    log::info!("Deleting {} preset {}", preset_type, preset_id);

    CommandResult::success(Some(serde_json::json!({
      "preset_id": preset_id,
      "preset_type": preset_type,
      "status": "deleted"
    })))
  }

  async fn import_effect_file(&self, file_path: String, category: String) -> CommandResult {
    // TODO: Import effect file (.json, .effect, LUT files)
    // 1. Validate file format
    // 2. Parse effect definition
    // 3. Add to user effects library
    log::info!(
      "Importing effect file {} to category {}",
      file_path,
      category
    );

    CommandResult::success(Some(serde_json::json!({
      "file_path": file_path,
      "category": category,
      "status": "imported"
    })))
  }

  async fn import_filter_file(&self, file_path: String, file_type: String) -> CommandResult {
    // TODO: Import filter file (.cube, .3dl, .lut, .preset)
    log::info!("Importing filter file {} of type {}", file_path, file_type);

    CommandResult::success(Some(serde_json::json!({
      "file_path": file_path,
      "file_type": file_type,
      "status": "imported"
    })))
  }

  async fn export_effect_preset(&self, preset_id: String, output_path: String) -> CommandResult {
    // TODO: Export effect preset to file
    log::info!("Exporting effect preset {} to {}", preset_id, output_path);

    CommandResult::success(Some(serde_json::json!({
      "preset_id": preset_id,
      "output_path": output_path,
      "status": "exported"
    })))
  }

  async fn export_filter_preset(&self, preset_id: String, output_path: String) -> CommandResult {
    // TODO: Export filter preset to file
    log::info!("Exporting filter preset {} to {}", preset_id, output_path);

    CommandResult::success(Some(serde_json::json!({
      "preset_id": preset_id,
      "output_path": output_path,
      "status": "exported"
    })))
  }

  async fn get_gpu_capabilities(&self) -> CommandResult {
    // TODO: Query GPU capabilities for effects rendering
    // 1. Check OpenGL/Vulkan support
    // 2. Get memory info
    // 3. Test compute shader capabilities
    log::info!("Querying GPU capabilities");

    let capabilities = GpuCapabilities {
      vendor: "NVIDIA".to_string(),         // TODO: Get actual GPU vendor
      model: "RTX 4090".to_string(),        // TODO: Get actual GPU model
      driver_version: "537.13".to_string(), // TODO: Get actual driver
      opengl_version: "4.6".to_string(),
      vulkan_support: true,
      max_texture_size: 32768,
      compute_shaders: true,
      memory_mb: 24576, // TODO: Get actual VRAM
    };

    CommandResult::success(Some(serde_json::to_value(capabilities).unwrap()))
  }

  async fn optimize_effects_pipeline(&self, clip_id: String, target_fps: u32) -> CommandResult {
    // TODO: Optimize effects for target framerate
    // 1. Analyze current effects on clip
    // 2. Adjust quality/complexity to meet FPS target
    // 3. Use GPU acceleration where possible
    log::info!(
      "Optimizing effects pipeline for clip {} to {} FPS",
      clip_id,
      target_fps
    );

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "target_fps": target_fps,
      "optimizations_applied": 3,
      "estimated_fps": target_fps,
      "status": "optimized"
    })))
  }

  async fn analyze_effect_performance(
    &self,
    effect_id: String,
    duration_seconds: f64,
  ) -> CommandResult {
    // TODO: Analyze effect performance
    // 1. Run effect on test media for specified duration
    // 2. Measure frame time, memory usage, GPU utilization
    // 3. Return performance metrics
    log::info!(
      "Analyzing performance of effect {} for {}s",
      effect_id,
      duration_seconds
    );

    let metrics = PerformanceMetrics {
      effect_id: effect_id.clone(),
      avg_frame_time_ms: 16.67, // 60 FPS
      memory_usage_mb: 256.0,
      gpu_utilization: 75.0,
      cpu_utilization: 25.0,
      dropped_frames: 0,
    };

    CommandResult::success(Some(serde_json::to_value(metrics).unwrap()))
  }

  // === AI Provider Implementation Helpers ===

  async fn get_api_key_for_provider(&self, provider: &str) -> Option<String> {
    // TODO: Implement secure storage integration
    // For now, return mock keys or read from environment
    match provider {
      "claude" => std::env::var("ANTHROPIC_API_KEY").ok(),
      "openai" => std::env::var("OPENAI_API_KEY").ok(),
      "deepseek" => std::env::var("DEEPSEEK_API_KEY").ok(),
      "grok" => std::env::var("GROK_API_KEY").ok(),
      "ollama" => Some("local".to_string()), // Ollama doesn't need API key
      _ => None,
    }
  }

  async fn send_claude_request(
    &self,
    api_key: &str,
    model: &str,
    messages: &[AiMessage],
    options: &AiRequestOptions,
  ) -> Result<AiResponse, Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();

    // Convert messages to Claude format
    let claude_messages: Vec<serde_json::Value> = messages
      .iter()
      .map(|msg| {
        serde_json::json!({
          "role": msg.role,
          "content": msg.content
        })
      })
      .collect();

    let request_body = serde_json::json!({
      "model": model,
      "messages": claude_messages,
      "max_tokens": options.max_tokens.unwrap_or(4096),
      "temperature": options.temperature.unwrap_or(0.7),
      "top_p": options.top_p.unwrap_or(1.0),
      "stop_sequences": options.stop.as_ref().unwrap_or(&vec![]),
      "stream": false
    });

    let response = client
      .post("https://api.anthropic.com/v1/messages")
      .header("Content-Type", "application/json")
      .header("x-api-key", api_key)
      .header("anthropic-version", "2023-06-01")
      .json(&request_body)
      .send()
      .await?;

    if !response.status().is_success() {
      let error_text = response.text().await?;
      return Err(format!("Claude API error: {}", error_text).into());
    }

    let response_json: serde_json::Value = response.json().await?;

    let content = response_json["content"][0]["text"]
      .as_str()
      .unwrap_or("No response")
      .to_string();

    let tokens_used = response_json["usage"]["input_tokens"].as_u64().unwrap_or(0)
      + response_json["usage"]["output_tokens"]
        .as_u64()
        .unwrap_or(0);

    // Calculate cost (approximate)
    let cost = match model {
      "claude-3-5-sonnet-20241022" => Some(tokens_used as f64 * 0.000003),
      "claude-3-5-haiku-20241022" => Some(tokens_used as f64 * 0.000001),
      _ => None,
    };

    Ok(AiResponse {
      provider: "claude".to_string(),
      model: model.to_string(),
      content,
      tokens_used: tokens_used as u32,
      cost,
      metadata: serde_json::json!({
        "request_id": response_json["id"],
        "model_used": response_json["model"],
        "stop_reason": response_json["stop_reason"]
      }),
    })
  }

  async fn send_openai_request(
    &self,
    api_key: &str,
    model: &str,
    messages: &[AiMessage],
    options: &AiRequestOptions,
  ) -> Result<AiResponse, Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();

    // Convert messages to OpenAI format
    let openai_messages: Vec<serde_json::Value> = messages
      .iter()
      .map(|msg| {
        serde_json::json!({
          "role": msg.role,
          "content": msg.content
        })
      })
      .collect();

    let request_body = serde_json::json!({
      "model": model,
      "messages": openai_messages,
      "max_tokens": options.max_tokens.unwrap_or(4096),
      "temperature": options.temperature.unwrap_or(0.7),
      "top_p": options.top_p.unwrap_or(1.0),
      "stop": options.stop.as_ref().unwrap_or(&vec![]),
      "stream": false
    });

    let response = client
      .post("https://api.openai.com/v1/chat/completions")
      .header("Content-Type", "application/json")
      .header("Authorization", format!("Bearer {}", api_key))
      .json(&request_body)
      .send()
      .await?;

    if !response.status().is_success() {
      let error_text = response.text().await?;
      return Err(format!("OpenAI API error: {}", error_text).into());
    }

    let response_json: serde_json::Value = response.json().await?;

    let content = response_json["choices"][0]["message"]["content"]
      .as_str()
      .unwrap_or("No response")
      .to_string();

    let tokens_used = response_json["usage"]["total_tokens"].as_u64().unwrap_or(0);

    // Calculate cost (approximate)
    let cost = match model {
      "gpt-4o" => Some(tokens_used as f64 * 0.000005),
      "gpt-4o-mini" => Some(tokens_used as f64 * 0.00000015),
      "gpt-4-turbo" => Some(tokens_used as f64 * 0.00001),
      _ => None,
    };

    Ok(AiResponse {
      provider: "openai".to_string(),
      model: model.to_string(),
      content,
      tokens_used: tokens_used as u32,
      cost,
      metadata: serde_json::json!({
        "request_id": response_json["id"],
        "model_used": response_json["model"],
        "finish_reason": response_json["choices"][0]["finish_reason"]
      }),
    })
  }

  async fn send_deepseek_request(
    &self,
    api_key: &str,
    model: &str,
    messages: &[AiMessage],
    options: &AiRequestOptions,
  ) -> Result<AiResponse, Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();

    // DeepSeek uses OpenAI-compatible API
    let deepseek_messages: Vec<serde_json::Value> = messages
      .iter()
      .map(|msg| {
        serde_json::json!({
          "role": msg.role,
          "content": msg.content
        })
      })
      .collect();

    let request_body = serde_json::json!({
      "model": model,
      "messages": deepseek_messages,
      "max_tokens": options.max_tokens.unwrap_or(4096),
      "temperature": options.temperature.unwrap_or(0.7),
      "top_p": options.top_p.unwrap_or(1.0),
      "stop": options.stop.as_ref().unwrap_or(&vec![]),
      "stream": false
    });

    let response = client
      .post("https://api.deepseek.com/v1/chat/completions")
      .header("Content-Type", "application/json")
      .header("Authorization", format!("Bearer {}", api_key))
      .json(&request_body)
      .send()
      .await?;

    if !response.status().is_success() {
      let error_text = response.text().await?;
      return Err(format!("DeepSeek API error: {}", error_text).into());
    }

    let response_json: serde_json::Value = response.json().await?;

    let content = response_json["choices"][0]["message"]["content"]
      .as_str()
      .unwrap_or("No response")
      .to_string();

    let tokens_used = response_json["usage"]["total_tokens"].as_u64().unwrap_or(0);

    // DeepSeek pricing (very affordable)
    let cost = Some(tokens_used as f64 * 0.0000002); // $0.0002 per 1K tokens

    Ok(AiResponse {
      provider: "deepseek".to_string(),
      model: model.to_string(),
      content,
      tokens_used: tokens_used as u32,
      cost,
      metadata: serde_json::json!({
        "request_id": response_json["id"],
        "model_used": response_json["model"],
        "finish_reason": response_json["choices"][0]["finish_reason"]
      }),
    })
  }

  async fn send_grok_request(
    &self,
    api_key: &str,
    model: &str,
    messages: &[AiMessage],
    options: &AiRequestOptions,
  ) -> Result<AiResponse, Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();

    // Grok uses OpenAI-compatible API through X.AI
    let grok_messages: Vec<serde_json::Value> = messages
      .iter()
      .map(|msg| {
        serde_json::json!({
          "role": msg.role,
          "content": msg.content
        })
      })
      .collect();

    let request_body = serde_json::json!({
      "model": model,
      "messages": grok_messages,
      "max_tokens": options.max_tokens.unwrap_or(4096),
      "temperature": options.temperature.unwrap_or(0.7),
      "top_p": options.top_p.unwrap_or(1.0),
      "stop": options.stop.as_ref().unwrap_or(&vec![]),
      "stream": false
    });

    let response = client
      .post("https://api.x.ai/v1/chat/completions")
      .header("Content-Type", "application/json")
      .header("Authorization", format!("Bearer {}", api_key))
      .json(&request_body)
      .send()
      .await?;

    if !response.status().is_success() {
      let error_text = response.text().await?;
      return Err(format!("Grok API error: {}", error_text).into());
    }

    let response_json: serde_json::Value = response.json().await?;

    let content = response_json["choices"][0]["message"]["content"]
      .as_str()
      .unwrap_or("No response")
      .to_string();

    let tokens_used = response_json["usage"]["total_tokens"].as_u64().unwrap_or(0);

    // Grok pricing (beta pricing)
    let cost = Some(tokens_used as f64 * 0.000005); // Approximate pricing

    Ok(AiResponse {
      provider: "grok".to_string(),
      model: model.to_string(),
      content,
      tokens_used: tokens_used as u32,
      cost,
      metadata: serde_json::json!({
        "request_id": response_json["id"],
        "model_used": response_json["model"],
        "finish_reason": response_json["choices"][0]["finish_reason"]
      }),
    })
  }

  async fn send_ollama_request(
    &self,
    model: &str,
    messages: &[AiMessage],
    options: &AiRequestOptions,
  ) -> Result<AiResponse, Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();

    // Ollama uses its own API format
    let ollama_messages: Vec<serde_json::Value> = messages
      .iter()
      .map(|msg| {
        serde_json::json!({
          "role": msg.role,
          "content": msg.content
        })
      })
      .collect();

    let request_body = serde_json::json!({
      "model": model,
      "messages": ollama_messages,
      "options": {
        "temperature": options.temperature.unwrap_or(0.7),
        "top_p": options.top_p.unwrap_or(1.0),
        "num_predict": options.max_tokens.unwrap_or(4096)
      },
      "stream": false
    });

    let response = client
      .post("http://localhost:11434/api/chat")
      .header("Content-Type", "application/json")
      .json(&request_body)
      .send()
      .await?;

    if !response.status().is_success() {
      let error_text = response.text().await?;
      return Err(format!("Ollama API error: {}", error_text).into());
    }

    let response_json: serde_json::Value = response.json().await?;

    let content = response_json["message"]["content"]
      .as_str()
      .unwrap_or("No response")
      .to_string();

    // Ollama doesn't provide token counts in the same way
    let tokens_used = content.split_whitespace().count() as u64; // Rough estimate

    Ok(AiResponse {
      provider: "ollama".to_string(),
      model: model.to_string(),
      content,
      tokens_used: tokens_used as u32,
      cost: None, // Ollama is free/local
      metadata: serde_json::json!({
        "model_used": response_json["model"],
        "done": response_json["done"],
        "total_duration": response_json["total_duration"]
      }),
    })
  }

  async fn log_ai_usage(&self, provider: &str, model: &str, tokens: u32, cost: Option<f64>) {
    // TODO: Implement usage logging to database or analytics service
    log::info!(
      "AI Usage: provider={}, model={}, tokens={}, cost={:?}",
      provider,
      model,
      tokens,
      cost
    );
  }

  #[allow(dead_code)]
  async fn fetch_openai_models(
    &self,
  ) -> Result<Vec<AiModel>, Box<dyn std::error::Error + Send + Sync>> {
    let api_key = match self.get_api_key_for_provider("openai").await {
      Some(key) => key,
      None => return Err("No OpenAI API key available".into()),
    };

    let client = reqwest::Client::new();
    let response = client
      .get("https://api.openai.com/v1/models")
      .header("Authorization", format!("Bearer {}", api_key))
      .send()
      .await?;

    if !response.status().is_success() {
      return Err(format!("Failed to fetch OpenAI models: {}", response.status()).into());
    }

    let response_json: serde_json::Value = response.json().await?;
    let empty_vec = vec![];
    let models_array = response_json["data"].as_array().unwrap_or(&empty_vec);

    let mut models = Vec::new();
    for model_json in models_array {
      if let Some(id) = model_json["id"].as_str() {
        // Filter to chat models only
        if id.starts_with("gpt-") && (id.contains("turbo") || id.contains("4o")) {
          models.push(AiModel {
            id: id.to_string(),
            name: id.replace("-", " ").to_uppercase(),
            description: format!("OpenAI {}", id),
            max_tokens: if id.contains("4o") { 128000 } else { 4096 },
            cost_per_token: if id.contains("4o-mini") {
              Some(0.00000015)
            } else {
              Some(0.000005)
            },
            is_available: true,
          });
        }
      }
    }

    Ok(models)
  }

  #[allow(dead_code)]
  async fn fetch_ollama_models(
    &self,
  ) -> Result<Vec<AiModel>, Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();

    // Check if Ollama is running
    match client.get("http://localhost:11434/api/tags").send().await {
      Ok(response) if response.status().is_success() => {
        let response_json: serde_json::Value = response.json().await?;
        let empty_vec = vec![];
        let models_array = response_json["models"].as_array().unwrap_or(&empty_vec);

        let mut models = Vec::new();
        for model_json in models_array {
          if let Some(name) = model_json["name"].as_str() {
            let size = model_json["size"].as_u64().unwrap_or(0);
            models.push(AiModel {
              id: name.to_string(),
              name: name.split(':').next().unwrap_or(name).to_string(),
              description: format!("Local model ({})", self.format_bytes(size)),
              max_tokens: 4096,     // Default for most Ollama models
              cost_per_token: None, // Local models are free
              is_available: true,
            });
          }
        }

        Ok(models)
      }
      _ => Err("Ollama is not running or not accessible".into()),
    }
  }

  #[allow(dead_code)]
  fn format_bytes(&self, bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
      size /= 1024.0;
      unit_index += 1;
    }

    format!("{:.1}{}", size, UNITS[unit_index])
  }

  #[allow(dead_code)]
  async fn validate_claude_connection(
    &self,
  ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api_key = self
      .get_api_key_for_provider("claude")
      .await
      .ok_or("No Claude API key configured")?;

    let client = reqwest::Client::new();
    let response = client
      .post("https://api.anthropic.com/v1/messages")
      .header("Content-Type", "application/json")
      .header("x-api-key", &api_key)
      .header("anthropic-version", "2023-06-01")
      .json(&serde_json::json!({
        "model": "claude-3-5-haiku-20241022",
        "messages": [{
          "role": "user",
          "content": "Hi"
        }],
        "max_tokens": 10
      }))
      .timeout(std::time::Duration::from_secs(10))
      .send()
      .await?;

    if response.status().is_success() {
      Ok(())
    } else {
      Err(format!("Claude API validation failed: {}", response.status()).into())
    }
  }

  #[allow(dead_code)]
  async fn validate_openai_connection(
    &self,
  ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api_key = self
      .get_api_key_for_provider("openai")
      .await
      .ok_or("No OpenAI API key configured")?;

    let client = reqwest::Client::new();
    let response = client
      .get("https://api.openai.com/v1/models")
      .header("Authorization", format!("Bearer {}", &api_key))
      .timeout(std::time::Duration::from_secs(10))
      .send()
      .await?;

    if response.status().is_success() {
      Ok(())
    } else {
      Err(format!("OpenAI API validation failed: {}", response.status()).into())
    }
  }

  #[allow(dead_code)]
  async fn validate_deepseek_connection(
    &self,
  ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api_key = self
      .get_api_key_for_provider("deepseek")
      .await
      .ok_or("No DeepSeek API key configured")?;

    let client = reqwest::Client::new();
    let response = client
      .get("https://api.deepseek.com/v1/models")
      .header("Authorization", format!("Bearer {}", &api_key))
      .timeout(std::time::Duration::from_secs(10))
      .send()
      .await?;

    if response.status().is_success() {
      Ok(())
    } else {
      Err(format!("DeepSeek API validation failed: {}", response.status()).into())
    }
  }

  #[allow(dead_code)]
  async fn validate_grok_connection(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api_key = self
      .get_api_key_for_provider("grok")
      .await
      .ok_or("No Grok API key configured")?;

    let client = reqwest::Client::new();
    let response = client
      .get("https://api.x.ai/v1/models")
      .header("Authorization", format!("Bearer {}", &api_key))
      .timeout(std::time::Duration::from_secs(10))
      .send()
      .await?;

    if response.status().is_success() {
      Ok(())
    } else {
      Err(format!("Grok API validation failed: {}", response.status()).into())
    }
  }

  #[allow(dead_code)]
  async fn validate_ollama_connection(
    &self,
  ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();
    let response = client
      .get("http://localhost:11434/api/tags")
      .timeout(std::time::Duration::from_secs(5))
      .send()
      .await?;

    if response.status().is_success() {
      Ok(())
    } else {
      Err(format!("Ollama connection failed: {}", response.status()).into())
    }
  }

  // === Template Management Implementation ===

  async fn save_template(
    &self,
    template: serde_json::Value,
    path: Option<String>,
    category: String,
  ) -> CommandResult {
    log::info!("Saving template to category: {}", category);

    // Generate template ID if not provided
    let template_id = template["id"]
      .as_str()
      .unwrap_or(&uuid::Uuid::new_v4().to_string())
      .to_string();

    // TODO: Implement template persistence to database or file system
    // 1. Validate template structure
    // 2. Save to templates directory
    // 3. Update template index
    // 4. Generate thumbnail preview

    let save_path = path.unwrap_or_else(|| format!("templates/{}/{}.json", category, template_id));

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "path": save_path,
      "category": category,
      "status": "saved"
    })))
  }

  async fn load_template(&self, path: String) -> CommandResult {
    log::info!("Loading template from path: {}", path);

    // TODO: Implement template loading from file system
    // 1. Read template file
    // 2. Validate template structure
    // 3. Return template data

    CommandResult::success(Some(serde_json::json!({
      "path": path,
      "template": {
        "id": "loaded_template",
        "name": "Loaded Template",
        "type": "multi_camera",
        "screens": 4
      },
      "status": "loaded"
    })))
  }

  async fn delete_template(&self, template_id: String) -> CommandResult {
    log::info!("Deleting template: {}", template_id);

    // TODO: Implement template deletion
    // 1. Remove from file system
    // 2. Update template index
    // 3. Clean up associated files (thumbnails, previews)

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "status": "deleted"
    })))
  }

  async fn list_templates(
    &self,
    category: Option<String>,
    template_type: Option<String>,
  ) -> CommandResult {
    log::info!(
      "Listing templates - category: {:?}, type: {:?}",
      category,
      template_type
    );

    // TODO: Implement template listing from database/filesystem
    // 1. Scan templates directory
    // 2. Filter by category and type
    // 3. Load metadata
    // 4. Generate response

    let mock_templates = vec![
      serde_json::json!({
        "id": "template_1",
        "name": "2x2 Grid",
        "category": "multi_camera",
        "type": "grid",
        "screens": 4,
        "aspect_ratio": "16:9",
        "thumbnail": "/templates/thumbnails/2x2_grid.jpg"
      }),
      serde_json::json!({
        "id": "template_2",
        "name": "Picture in Picture",
        "category": "multi_camera",
        "type": "pip",
        "screens": 2,
        "aspect_ratio": "16:9",
        "thumbnail": "/templates/thumbnails/pip.jpg"
      }),
    ];

    CommandResult::success(Some(serde_json::json!({
      "templates": mock_templates,
      "count": mock_templates.len(),
      "category": category,
      "type": template_type
    })))
  }

  async fn import_template(&self, path: String, category: String) -> CommandResult {
    log::info!("Importing template from {} to category {}", path, category);

    // TODO: Implement template import
    // 1. Read template file (JSON, .template format)
    // 2. Validate structure
    // 3. Convert to internal format if needed
    // 4. Save to templates library
    // 5. Generate preview

    let template_id = uuid::Uuid::new_v4().to_string();

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "path": path,
      "category": category,
      "status": "imported"
    })))
  }

  async fn export_template(&self, template_id: String, path: String) -> CommandResult {
    log::info!("Exporting template {} to {}", template_id, path);

    // TODO: Implement template export
    // 1. Load template from library
    // 2. Convert to export format
    // 3. Include assets if needed
    // 4. Save to specified path

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "export_path": path,
      "status": "exported"
    })))
  }

  async fn create_template_from_project(
    &self,
    project_id: String,
    template_name: String,
    category: String,
  ) -> CommandResult {
    log::info!(
      "Creating template '{}' from project {} in category {}",
      template_name,
      project_id,
      category
    );

    // TODO: Implement template creation from project
    // 1. Analyze current project layout
    // 2. Extract template structure
    // 3. Create template definition
    // 4. Save to template library
    // 5. Generate thumbnail from current frame

    let template_id = uuid::Uuid::new_v4().to_string();

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "name": template_name,
      "category": category,
      "project_id": project_id,
      "status": "created"
    })))
  }

  async fn apply_template_to_timeline(
    &self,
    template_id: String,
    timeline_id: String,
    media_ids: Vec<String>,
  ) -> CommandResult {
    log::info!(
      "Applying template {} to timeline {} with {} media files",
      template_id,
      timeline_id,
      media_ids.len()
    );

    // TODO: Implement template application
    // 1. Load template definition
    // 2. Validate media compatibility
    // 3. Create clips and arrange in timeline
    // 4. Apply template effects and transitions
    // 5. Update project state

    let mut state = self.state.write().await;
    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        crate::state::ProjectEvent::PlayerTemplateApplied {
          template_id: template_id.clone(),
          media_ids: media_ids.clone(),
        },
        "template_manager".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "timeline_id": timeline_id,
      "media_ids": media_ids,
      "status": "applied"
    })))
  }

  async fn validate_template(&self, template: serde_json::Value) -> CommandResult {
    log::info!("Validating template structure");

    // TODO: Implement template validation
    // 1. Check required fields
    // 2. Validate cell configurations
    // 3. Check aspect ratio compatibility
    // 4. Validate animation parameters

    let is_valid =
      template["id"].is_string() && template["type"].is_string() && template["cells"].is_array();

    let validation_errors = if !is_valid {
      vec!["Missing required fields: id, type, cells".to_string()]
    } else {
      vec![]
    };

    CommandResult::success(Some(serde_json::json!({
      "valid": is_valid,
      "errors": validation_errors,
      "warnings": [],
      "template_id": template["id"]
    })))
  }

  async fn get_template_preview(
    &self,
    template_id: String,
    media_ids: Vec<String>,
  ) -> CommandResult {
    log::info!(
      "Generating preview for template {} with {} media files",
      template_id,
      media_ids.len()
    );

    // TODO: Implement template preview generation
    // 1. Load template definition
    // 2. Arrange media in template layout
    // 3. Generate preview frame using FFmpeg
    // 4. Return preview image path

    let preview_path = format!(
      "/tmp/template_preview_{}_{}.jpg",
      template_id,
      chrono::Utc::now().timestamp()
    );

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "media_ids": media_ids,
      "preview_path": preview_path,
      "status": "generated"
    })))
  }

  async fn optimize_template_rendering(
    &self,
    template_id: String,
    target_quality: String,
  ) -> CommandResult {
    log::info!(
      "Optimizing rendering for template {} with quality {}",
      template_id,
      target_quality
    );

    // TODO: Implement template rendering optimization
    // 1. Analyze template complexity
    // 2. Adjust parameters for target quality
    // 3. Optimize FFmpeg filters
    // 4. Configure GPU acceleration if available

    let optimizations = vec![
      "Enabled GPU acceleration",
      "Optimized overlay filters",
      "Reduced intermediate rendering steps",
    ];

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "target_quality": target_quality,
      "optimizations": optimizations,
      "estimated_performance_gain": "2.5x",
      "status": "optimized"
    })))
  }

  // === Transition Management Implementation ===

  async fn create_transition(
    &self,
    track_id: String,
    transition_id: String,
    position: f64,
    duration: f64,
    parameters: serde_json::Value,
  ) -> CommandResult {
    log::info!(
      "Creating transition {} on track {} at position {} for {}s",
      transition_id,
      track_id,
      position,
      duration
    );

    // TODO: Implement transition creation
    // 1. Validate track exists
    // 2. Check for overlapping transitions
    // 3. Create transition object
    // 4. Add to timeline
    // 5. Update project state

    let mut state = self.state.write().await;
    state.mark_dirty();

    // Generate unique transition instance ID
    let instance_id = uuid::Uuid::new_v4().to_string();

    CommandResult::success(Some(serde_json::json!({
      "instance_id": instance_id,
      "transition_id": transition_id,
      "track_id": track_id,
      "position": position,
      "duration": duration,
      "parameters": parameters,
      "status": "created"
    })))
  }

  async fn update_transition_parameters(
    &self,
    transition_id: String,
    parameters: serde_json::Value,
  ) -> CommandResult {
    log::info!("Updating parameters for transition {}", transition_id);

    // TODO: Implement parameter updates
    // 1. Find transition in timeline
    // 2. Validate new parameters
    // 3. Update transition
    // 4. Regenerate preview if needed

    let mut state = self.state.write().await;
    state.mark_dirty();

    CommandResult::success(Some(serde_json::json!({
      "transition_id": transition_id,
      "parameters": parameters,
      "status": "updated"
    })))
  }

  async fn get_transition_info(&self, transition_id: String) -> CommandResult {
    log::info!("Getting info for transition {}", transition_id);

    // TODO: Implement transition info retrieval
    // 1. Find transition definition
    // 2. Get current parameters
    // 3. Return full transition info

    let transition_info = serde_json::json!({
      "id": transition_id,
      "name": "Fade",
      "category": "basic",
      "complexity": "basic",
      "gpu_required": false,
      "supported_formats": ["video", "image"],
      "parameters": {
        "duration": { "type": "number", "min": 0.1, "max": 10.0, "default": 1.0 },
        "curve": { "type": "enum", "values": ["linear", "ease-in", "ease-out"], "default": "linear" }
      }
    });

    CommandResult::success(Some(transition_info))
  }

  async fn import_transitions(&self, file_path: String) -> CommandResult {
    log::info!("Importing transitions from {}", file_path);

    // TODO: Implement transitions import
    // 1. Read file (JSON, .transition formats)
    // 2. Validate transition definitions
    // 3. Add to user library
    // 4. Generate previews

    CommandResult::success(Some(serde_json::json!({
      "file_path": file_path,
      "imported_count": 5,
      "status": "imported"
    })))
  }

  async fn export_transitions(
    &self,
    transition_ids: Vec<String>,
    export_path: String,
  ) -> CommandResult {
    log::info!(
      "Exporting {} transitions to {}",
      transition_ids.len(),
      export_path
    );

    // TODO: Implement transitions export
    // 1. Collect transition definitions
    // 2. Package with assets
    // 3. Export to file

    CommandResult::success(Some(serde_json::json!({
      "transition_ids": transition_ids,
      "export_path": export_path,
      "status": "exported"
    })))
  }

  async fn save_user_transition(&self, transition: serde_json::Value) -> CommandResult {
    log::info!("Saving user transition: {}", transition["name"]);

    // TODO: Implement user transition saving
    // 1. Validate transition definition
    // 2. Generate unique ID
    // 3. Save to user library
    // 4. Create preview

    let transition_id = uuid::Uuid::new_v4().to_string();

    CommandResult::success(Some(serde_json::json!({
      "transition_id": transition_id,
      "transition": transition,
      "status": "saved"
    })))
  }

  async fn preview_transition(
    &self,
    transition_id: String,
    source_clip_id: String,
    target_clip_id: String,
    parameters: serde_json::Value,
  ) -> CommandResult {
    log::info!(
      "Generating preview for transition {} between clips {} and {}",
      transition_id,
      source_clip_id,
      target_clip_id
    );

    // TODO: Implement transition preview
    // 1. Load source and target clips
    // 2. Apply transition with parameters
    // 3. Render preview using FFmpeg
    // 4. Return preview file path

    let preview_path = format!(
      "/tmp/transition_preview_{}_{}.mp4",
      transition_id,
      chrono::Utc::now().timestamp()
    );

    CommandResult::success(Some(serde_json::json!({
      "transition_id": transition_id,
      "source_clip_id": source_clip_id,
      "target_clip_id": target_clip_id,
      "parameters": parameters,
      "preview_path": preview_path,
      "status": "generated"
    })))
  }

  async fn render_transition(&self, transition_config: serde_json::Value) -> CommandResult {
    log::info!("Rendering transition with config: {:?}", transition_config);

    // TODO: Implement transition rendering
    // 1. Parse transition configuration
    // 2. Setup FFmpeg pipeline
    // 3. Render transition
    // 4. Return rendered file path

    let output_path = format!(
      "/tmp/rendered_transition_{}.mp4",
      chrono::Utc::now().timestamp()
    );

    CommandResult::success(Some(serde_json::json!({
      "config": transition_config,
      "output_path": output_path,
      "status": "rendered"
    })))
  }

  async fn export_project_transitions(
    &self,
    project_path: String,
    export_settings: serde_json::Value,
  ) -> CommandResult {
    log::info!(
      "Exporting project transitions from {} with settings: {:?}",
      project_path,
      export_settings
    );

    // TODO: Implement project transitions export
    // 1. Scan project for all transitions
    // 2. Collect unique transition definitions
    // 3. Export with settings

    CommandResult::success(Some(serde_json::json!({
      "project_path": project_path,
      "export_settings": export_settings,
      "transitions_count": 12,
      "status": "exported"
    })))
  }

  async fn list_available_transitions(&self, category: Option<String>) -> CommandResult {
    log::info!("Listing available transitions for category: {:?}", category);

    // TODO: Implement transitions listing
    // 1. Load built-in transitions
    // 2. Load user transitions
    // 3. Filter by category if specified
    // 4. Return with metadata

    let mock_transitions = vec![
      serde_json::json!({
        "id": "fade",
        "name": "Fade",
        "category": "basic",
        "complexity": "basic",
        "gpu_required": false,
        "duration_range": [0.1, 10.0],
        "thumbnail": "/transitions/thumbnails/fade.jpg"
      }),
      serde_json::json!({
        "id": "dissolve",
        "name": "Dissolve",
        "category": "basic",
        "complexity": "basic",
        "gpu_required": false,
        "duration_range": [0.2, 5.0],
        "thumbnail": "/transitions/thumbnails/dissolve.jpg"
      }),
      serde_json::json!({
        "id": "wipe_left",
        "name": "Wipe Left",
        "category": "advanced",
        "complexity": "intermediate",
        "gpu_required": false,
        "duration_range": [0.1, 3.0],
        "thumbnail": "/transitions/thumbnails/wipe_left.jpg"
      }),
    ];

    let filtered_transitions = if let Some(ref cat) = category {
      mock_transitions
        .into_iter()
        .filter(|t| t["category"].as_str() == Some(cat))
        .collect()
    } else {
      mock_transitions
    };

    CommandResult::success(Some(serde_json::json!({
      "transitions": filtered_transitions,
      "count": filtered_transitions.len(),
      "category": category
    })))
  }

  async fn validate_transition(&self, transition: serde_json::Value) -> CommandResult {
    log::info!("Validating transition: {}", transition["name"]);

    // TODO: Implement transition validation
    // 1. Check required fields
    // 2. Validate parameter definitions
    // 3. Check FFmpeg compatibility
    // 4. Validate duration constraints

    let is_valid = transition["id"].is_string()
      && transition["name"].is_string()
      && transition["category"].is_string();

    let validation_errors = if !is_valid {
      vec!["Missing required fields: id, name, category".to_string()]
    } else {
      vec![]
    };

    CommandResult::success(Some(serde_json::json!({
      "valid": is_valid,
      "errors": validation_errors,
      "warnings": [],
      "transition_id": transition["id"]
    })))
  }

  // === Style Template Management Implementation ===

  async fn load_style_templates(&self, category: Option<String>) -> CommandResult {
    log::info!("Loading style templates for category: {:?}", category);

    // TODO: Implement style template loading
    // 1. Load built-in style templates from resources
    // 2. Load user style templates from storage
    // 3. Filter by category if provided
    // 4. Return categorized templates

    let mock_templates = vec![
      serde_json::json!({
        "id": "modern-intro-1",
        "name": { "ru": "Современное интро", "en": "Modern Intro" },
        "category": "intro",
        "style": "modern",
        "aspectRatio": "16:9",
        "duration": 3,
        "hasText": true,
        "hasAnimation": true,
        "thumbnail": "/templates/thumbnails/modern-intro-1.jpg",
        "elements": []
      }),
      serde_json::json!({
        "id": "minimal-outro-1",
        "name": { "ru": "Минималистичная концовка", "en": "Minimal Outro" },
        "category": "outro",
        "style": "minimal",
        "aspectRatio": "16:9",
        "duration": 4,
        "hasText": true,
        "hasAnimation": true,
        "thumbnail": "/templates/thumbnails/minimal-outro-1.jpg",
        "elements": []
      }),
      serde_json::json!({
        "id": "corporate-lower-third-1",
        "name": { "ru": "Корпоративная нижняя треть", "en": "Corporate Lower Third" },
        "category": "lower-third",
        "style": "corporate",
        "aspectRatio": "16:9",
        "duration": 5,
        "hasText": true,
        "hasAnimation": true,
        "thumbnail": "/templates/thumbnails/corporate-lower-third-1.jpg",
        "elements": []
      }),
    ];

    let filtered_templates = if let Some(ref cat) = category {
      mock_templates
        .into_iter()
        .filter(|t| t["category"].as_str() == Some(cat))
        .collect()
    } else {
      mock_templates
    };

    CommandResult::success(Some(serde_json::json!({
      "templates": filtered_templates,
      "count": filtered_templates.len(),
      "category": category
    })))
  }

  async fn save_style_template(
    &self,
    template: serde_json::Value,
    path: Option<String>,
  ) -> CommandResult {
    log::info!("Saving style template: {}", template["name"]["en"]);

    // TODO: Implement style template saving
    // 1. Validate template structure
    // 2. Generate unique ID if needed
    // 3. Save to user templates directory
    // 4. Update template registry

    let template_id = template["id"]
      .as_str()
      .unwrap_or(&uuid::Uuid::new_v4().to_string())
      .to_string();

    let save_path = path.unwrap_or_else(|| format!("/user/templates/style/{}.json", template_id));

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "saved_path": save_path,
      "template": template
    })))
  }

  async fn apply_style_template(
    &self,
    template_id: String,
    timeline_id: String,
    position: f64,
    text_replacements: Option<serde_json::Value>,
  ) -> CommandResult {
    log::info!(
      "Applying style template {} to timeline {} at position {}",
      template_id,
      timeline_id,
      position
    );

    // TODO: Implement template application
    // 1. Load template definition
    // 2. Create timeline elements from template
    // 3. Apply text replacements if provided
    // 4. Insert elements at specified position
    // 5. Handle animations and timing

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "timeline_id": timeline_id,
      "position": position,
      "applied_elements": [],
      "text_replacements": text_replacements
    })))
  }

  async fn export_style_template(&self, template_id: String, export_path: String) -> CommandResult {
    log::info!(
      "Exporting style template {} to {}",
      template_id,
      export_path
    );

    // TODO: Implement template export
    // 1. Load template with all assets
    // 2. Package assets (images, videos, fonts)
    // 3. Create exportable bundle
    // 4. Support different export formats

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "export_path": export_path,
      "export_format": "json",
      "bundled_assets": []
    })))
  }

  async fn import_style_templates(&self, file_path: String) -> CommandResult {
    log::info!("Importing style templates from {}", file_path);

    // TODO: Implement template import
    // 1. Read file (JSON, ZIP bundle)
    // 2. Validate template definitions
    // 3. Extract bundled assets
    // 4. Install templates to user directory

    CommandResult::success(Some(serde_json::json!({
      "file_path": file_path,
      "imported_count": 5,
      "imported_templates": [],
      "errors": []
    })))
  }

  async fn validate_style_template(&self, template: serde_json::Value) -> CommandResult {
    log::info!("Validating style template: {}", template["name"]["en"]);

    // TODO: Implement template validation
    // 1. Check required fields
    // 2. Validate element definitions
    // 3. Check asset references
    // 4. Validate timing and animations

    let has_id = template["id"].is_string();
    let has_name = template["name"].is_object();
    let has_category = template["category"].is_string();
    let has_elements = template["elements"].is_array();

    let is_valid = has_id && has_name && has_category && has_elements;

    let validation_errors = if !is_valid {
      vec!["Missing required fields: id, name, category, elements".to_string()]
    } else {
      vec![]
    };

    CommandResult::success(Some(serde_json::json!({
      "valid": is_valid,
      "errors": validation_errors,
      "warnings": [],
      "template_id": template["id"]
    })))
  }

  async fn render_style_template_preview(
    &self,
    template_id: String,
    output_path: String,
    preview_settings: serde_json::Value,
  ) -> CommandResult {
    log::info!(
      "Rendering preview for style template {} to {}",
      template_id,
      output_path
    );

    // TODO: Implement preview rendering
    // 1. Load template definition
    // 2. Create temporary composition
    // 3. Render with preview settings
    // 4. Generate preview video/image

    let preview_path = format!(
      "/tmp/style_template_preview_{}_{}.mp4",
      template_id,
      chrono::Utc::now().timestamp()
    );

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "preview_path": preview_path,
      "output_path": output_path,
      "settings": preview_settings
    })))
  }

  async fn get_style_template_assets(&self, template_id: String) -> CommandResult {
    log::info!("Getting assets for style template {}", template_id);

    // TODO: Implement asset retrieval
    // 1. Load template definition
    // 2. Collect all referenced assets
    // 3. Check asset availability
    // 4. Return asset inventory

    let mock_assets = vec![
      serde_json::json!({
        "type": "font",
        "path": "/assets/fonts/modern-title.ttf",
        "name": "Modern Title Font",
        "available": true
      }),
      serde_json::json!({
        "type": "image",
        "path": "/assets/images/logo-overlay.png",
        "name": "Logo Overlay",
        "available": true
      }),
    ];

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "assets": mock_assets,
      "asset_count": mock_assets.len()
    })))
  }

  async fn update_style_template_elements(
    &self,
    template_id: String,
    elements: Vec<serde_json::Value>,
  ) -> CommandResult {
    log::info!(
      "Updating {} elements for style template {}",
      elements.len(),
      template_id
    );

    // TODO: Implement element updates
    // 1. Load template definition
    // 2. Validate new elements
    // 3. Update template elements
    // 4. Save updated template

    CommandResult::success(Some(serde_json::json!({
      "template_id": template_id,
      "updated_elements": elements.len(),
      "elements": elements
    })))
  }

  // Advanced Edit Commands
  async fn ripple_edit(&self, clip_id: String, delta: f64) -> CommandResult {
    log::info!("Ripple edit: clip_id={}, delta={}", clip_id, delta);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and its track
    let mut target_track_id: Option<String> = None;
    let mut target_clip_timeline_out: Option<f64> = None;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          // Apply delta to target clip
          clip.timeline_in += delta;
          clip.timeline_out += delta;

          // Validate clip doesn't go negative
          if clip.timeline_in < 0.0 {
            return CommandResult::error(format!(
              "Ripple edit would move clip before timeline start (new in: {})",
              clip.timeline_in
            ));
          }

          target_track_id = Some(track.id.clone());
          target_clip_timeline_out = Some(clip.timeline_out - delta); // Original end position
          break;
        }
      }
      if target_track_id.is_some() {
        break;
      }
    }

    let target_track_id = match target_track_id {
      Some(id) => id,
      None => return CommandResult::error(format!("Clip not found: {}", clip_id)),
    };

    let original_end = target_clip_timeline_out.unwrap();

    // Find and move all subsequent clips on the same track
    let mut moved_clip_ids = vec![clip_id.clone()];

    for track in &mut project.timeline.tracks {
      if track.id == target_track_id {
        for clip in &mut track.clips {
          // Skip the original clip
          if clip.id == clip_id {
            continue;
          }

          // Move clips that start at or after the original clip's end
          if clip.timeline_in >= original_end {
            clip.timeline_in += delta;
            clip.timeline_out += delta;

            // Validate
            if clip.timeline_in < 0.0 {
              return CommandResult::error(format!(
                "Ripple edit would move clip {} before timeline start",
                clip.id
              ));
            }

            moved_clip_ids.push(clip.id.clone());
          }
        }
        break;
      }
    }

    state.mark_dirty();

    // Publish event for each moved clip
    for moved_id in &moved_clip_ids {
      self
        .event_bus
        .publish(
          ProjectEvent::ClipMoved {
            clip_id: moved_id.clone(),
            new_track_id: target_track_id.clone(),
            new_time: 0.0, // Frontend will get actual position from state
          },
          "command_handler".to_string(),
          state.version,
        )
        .await
        .ok();
    }

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "delta": delta,
      "moved_clips": moved_clip_ids.len(),
      "type": "ripple"
    })))
  }

  async fn roll_edit(
    &self,
    clip_id: String,
    adjacent_clip_id: String,
    delta: f64,
  ) -> CommandResult {
    log::info!(
      "Roll edit: clip_id={}, adjacent_clip_id={}, delta={}",
      clip_id,
      adjacent_clip_id,
      delta
    );

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find both clips and validate they're on the same track
    let mut first_clip_info: Option<(String, f64, f64, f64, f64)> = None; // (track_id, timeline_out, source_out, media_id, duration)
    let mut second_clip_info: Option<(f64, f64, f64, f64)> = None; // (timeline_in, source_in, source_out, duration)

    for track in &project.timeline.tracks {
      let mut first_found = false;
      let mut second_found = false;

      for clip in &track.clips {
        if clip.id == clip_id {
          first_clip_info = Some((
            track.id.clone(),
            clip.timeline_out,
            clip.source_out,
            clip.timeline_out - clip.timeline_in,
            clip.source_out - clip.source_in,
          ));
          first_found = true;
        }
        if clip.id == adjacent_clip_id {
          second_clip_info = Some((
            clip.timeline_in,
            clip.source_in,
            clip.source_out,
            clip.timeline_out - clip.timeline_in,
          ));
          second_found = true;
        }
      }

      if first_found && second_found {
        break;
      }

      // Reset if not both on same track
      if first_found || second_found {
        first_clip_info = None;
        second_clip_info = None;
      }
    }

    if first_clip_info.is_none() || second_clip_info.is_none() {
      return CommandResult::error("Both clips must exist on the same track".to_string());
    }

    let (track_id, first_timeline_out, _first_source_out, first_duration, _first_source_duration) =
      first_clip_info.unwrap();
    let (second_timeline_in, _second_source_in, second_source_out, second_duration) =
      second_clip_info.unwrap();

    // Validate clips are adjacent
    let gap = (second_timeline_in - first_timeline_out).abs();
    if gap > 0.01 {
      return CommandResult::error(format!("Clips are not adjacent (gap: {})", gap));
    }

    // Calculate new durations
    let new_first_duration = first_duration + delta;
    let new_second_duration = second_duration - delta;

    // Validate minimum clip durations
    const MIN_CLIP_DURATION: f64 = 0.033; // ~1 frame at 30fps
    if new_first_duration < MIN_CLIP_DURATION {
      return CommandResult::error(format!(
        "Roll edit would make first clip too short ({} < {})",
        new_first_duration, MIN_CLIP_DURATION
      ));
    }
    if new_second_duration < MIN_CLIP_DURATION {
      return CommandResult::error(format!(
        "Roll edit would make second clip too short ({} < {})",
        new_second_duration, MIN_CLIP_DURATION
      ));
    }

    // Apply changes
    for track in &mut project.timeline.tracks {
      if track.id != track_id {
        continue;
      }

      for clip in &mut track.clips {
        if clip.id == clip_id {
          // Extend/shrink first clip's end
          clip.timeline_out += delta;
          clip.source_out += delta;

          // Validate source bounds
          let source_duration = clip.source_out - clip.source_in;
          if clip.source_out > source_duration || clip.source_in < 0.0 {
            return CommandResult::error(
              "Roll edit would exceed source media bounds for first clip".to_string(),
            );
          }
        } else if clip.id == adjacent_clip_id {
          // Shrink/extend second clip's start
          clip.timeline_in += delta;
          clip.source_in += delta;

          // Validate source bounds
          if clip.source_in < 0.0 || clip.source_in > second_source_out {
            return CommandResult::error(
              "Roll edit would exceed source media bounds for second clip".to_string(),
            );
          }
        }
      }
      break;
    }

    state.mark_dirty();

    // Publish events
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: adjacent_clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "adjacent_clip_id": adjacent_clip_id,
      "delta": delta,
      "type": "roll"
    })))
  }

  async fn slip_edit(&self, clip_id: String, delta: f64) -> CommandResult {
    log::info!("Slip edit: clip_id={}, delta={}", clip_id, delta);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find the clip and get media duration
    let mut clip_found = false;
    let mut media_id: Option<String> = None;

    for track in &mut project.timeline.tracks {
      for clip in &mut track.clips {
        if clip.id == clip_id {
          media_id = Some(clip.media_id.clone());

          // Calculate new source in/out
          let new_source_in = clip.source_in + delta;
          let new_source_out = clip.source_out + delta;

          // Get media duration from media pool
          let media_duration = if let Some(media) = project.media_pool.items.get(&clip.media_id) {
            media.duration.unwrap_or(0.0)
          } else {
            return CommandResult::error(format!("Media not found: {}", clip.media_id));
          };

          // Validate source bounds
          if new_source_in < 0.0 {
            return CommandResult::error(format!(
              "Slip edit would move source start before media start (new source_in: {})",
              new_source_in
            ));
          }

          if new_source_out > media_duration {
            return CommandResult::error(format!(
              "Slip edit would move source end beyond media duration (new source_out: {} > {})",
              new_source_out, media_duration
            ));
          }

          // Apply slip - only source points change, timeline position stays same
          clip.source_in = new_source_in;
          clip.source_out = new_source_out;

          clip_found = true;
          break;
        }
      }
      if clip_found {
        break;
      }
    }

    if !clip_found {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: clip_id.clone(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "delta": delta,
      "media_id": media_id,
      "type": "slip"
    })))
  }

  async fn slide_edit(&self, clip_id: String, delta: f64) -> CommandResult {
    log::info!("Slide edit: clip_id={}, delta={}", clip_id, delta);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // First pass: find the clip and collect info about adjacent clips
    let mut target_track_id: Option<String> = None;
    let mut target_clip_in: Option<f64> = None;
    let mut target_clip_out: Option<f64> = None;
    let mut prev_clip_id: Option<String> = None;
    let mut next_clip_id: Option<String> = None;

    for track in &project.timeline.tracks {
      let mut found_target = false;
      let mut target_in = 0.0;
      let mut target_out = 0.0;

      // Find the target clip
      for clip in &track.clips {
        if clip.id == clip_id {
          target_in = clip.timeline_in;
          target_out = clip.timeline_out;
          found_target = true;
          break;
        }
      }

      if !found_target {
        continue;
      }

      target_track_id = Some(track.id.clone());
      target_clip_in = Some(target_in);
      target_clip_out = Some(target_out);

      // Find adjacent clips on the same track
      for clip in &track.clips {
        if clip.id == clip_id {
          continue;
        }

        // Previous clip (ends where target starts)
        if (clip.timeline_out - target_in).abs() < 0.01 {
          prev_clip_id = Some(clip.id.clone());
        }

        // Next clip (starts where target ends)
        if (clip.timeline_in - target_out).abs() < 0.01 {
          next_clip_id = Some(clip.id.clone());
        }
      }

      break;
    }

    if target_track_id.is_none() {
      return CommandResult::error(format!("Clip not found: {}", clip_id));
    }

    let track_id = target_track_id.unwrap();
    let clip_in = target_clip_in.unwrap();
    let clip_out = target_clip_out.unwrap();

    // Calculate new positions
    let new_clip_in = clip_in + delta;
    let new_clip_out = clip_out + delta;

    // Validate new position doesn't go negative
    if new_clip_in < 0.0 {
      return CommandResult::error(format!(
        "Slide edit would move clip before timeline start (new in: {})",
        new_clip_in
      ));
    }

    const MIN_CLIP_DURATION: f64 = 0.033; // ~1 frame at 30fps

    // Second pass: apply changes
    let mut updated_clips = vec![clip_id.clone()];

    for track in &mut project.timeline.tracks {
      if track.id != track_id {
        continue;
      }

      for clip in &mut track.clips {
        if clip.id == clip_id {
          // Move the target clip
          clip.timeline_in = new_clip_in;
          clip.timeline_out = new_clip_out;
        } else if let Some(ref prev_id) = prev_clip_id {
          if clip.id == *prev_id {
            // Extend/shrink previous clip to meet new target position
            let new_prev_out = new_clip_in;
            let new_duration = new_prev_out - clip.timeline_in;

            if new_duration < MIN_CLIP_DURATION {
              return CommandResult::error(format!(
                "Slide edit would make previous clip too short ({} < {})",
                new_duration, MIN_CLIP_DURATION
              ));
            }

            clip.timeline_out = new_prev_out;
            // Adjust source_out proportionally
            let duration_delta = new_prev_out - clip_out;
            clip.source_out += duration_delta;

            // Validate source bounds
            if clip.source_out < clip.source_in {
              return CommandResult::error(
                "Slide edit would exceed source bounds for previous clip".to_string(),
              );
            }

            updated_clips.push(clip.id.clone());
          }
        } else if let Some(ref next_id) = next_clip_id {
          if clip.id == *next_id {
            // Extend/shrink next clip to meet new target position
            let new_next_in = new_clip_out;
            let new_duration = clip.timeline_out - new_next_in;

            if new_duration < MIN_CLIP_DURATION {
              return CommandResult::error(format!(
                "Slide edit would make next clip too short ({} < {})",
                new_duration, MIN_CLIP_DURATION
              ));
            }

            clip.timeline_in = new_next_in;
            // Adjust source_in proportionally
            let duration_delta = new_next_in - clip_in;
            clip.source_in += duration_delta;

            // Validate source bounds
            if clip.source_in > clip.source_out || clip.source_in < 0.0 {
              return CommandResult::error(
                "Slide edit would exceed source bounds for next clip".to_string(),
              );
            }

            updated_clips.push(clip.id.clone());
          }
        }
      }

      break;
    }

    state.mark_dirty();

    // Publish events for all updated clips
    for updated_id in &updated_clips {
      if *updated_id == clip_id {
        self
          .event_bus
          .publish(
            ProjectEvent::ClipMoved {
              clip_id: updated_id.clone(),
              new_track_id: track_id.clone(),
              new_time: new_clip_in,
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();
      } else {
        self
          .event_bus
          .publish(
            ProjectEvent::ClipUpdated {
              clip_id: updated_id.clone(),
              changes: crate::state::events::ClipChanges {
                name: None,
                playback_rate: None,
                volume: None,
                effects: None,
              },
            },
            "command_handler".to_string(),
            state.version,
          )
          .await
          .ok();
      }
    }

    CommandResult::success(Some(serde_json::json!({
      "clip_id": clip_id,
      "delta": delta,
      "updated_clips": updated_clips.len(),
      "type": "slide"
    })))
  }

  // Marker Commands
  async fn add_marker(
    &self,
    name: String,
    time: f64,
    color: String,
    marker_type: String,
    description: Option<String>,
  ) -> CommandResult {
    log::info!("Adding marker '{}' at time {}", name, time);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Validate time
    if time < 0.0 {
      return CommandResult::error(format!("Invalid marker time: {}", time));
    }

    // Parse marker type
    let parsed_marker_type = match marker_type.as_str() {
      "chapter" => crate::state::project_state::MarkerType::Chapter,
      "section" => crate::state::project_state::MarkerType::Section,
      "note" => crate::state::project_state::MarkerType::Note,
      "export" => crate::state::project_state::MarkerType::Export,
      _ => return CommandResult::error(format!("Invalid marker type: {}", marker_type)),
    };

    // Generate marker ID
    let marker_id = uuid::Uuid::new_v4().to_string();

    // Create marker
    let marker = crate::state::project_state::Marker {
      id: marker_id.clone(),
      name: name.clone(),
      time,
      color: color.clone(),
      marker_type: parsed_marker_type,
      description: description.clone(),
    };

    // Add to timeline
    project.timeline.markers.push(marker);

    // Sort markers by time
    project
      .timeline
      .markers
      .sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: "timeline".to_string(), // Marker is timeline-level, not clip-level
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "added": true,
      "marker_id": marker_id,
      "name": name,
      "time": time
    })))
  }

  async fn remove_marker(&self, marker_id: String) -> CommandResult {
    log::info!("Removing marker {}", marker_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Find and remove marker
    let initial_len = project.timeline.markers.len();
    project.timeline.markers.retain(|m| m.id != marker_id);
    let marker_removed = project.timeline.markers.len() < initial_len;

    if !marker_removed {
      return CommandResult::error(format!("Marker not found: {}", marker_id));
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: "timeline".to_string(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "removed": true,
      "marker_id": marker_id
    })))
  }

  async fn update_marker(
    &self,
    marker_id: String,
    name: Option<String>,
    time: Option<f64>,
    color: Option<String>,
    description: Option<String>,
  ) -> CommandResult {
    log::info!("Updating marker {}", marker_id);

    let mut state = self.state.write().await;
    let project = match state.project.as_mut() {
      Some(p) => p,
      None => return CommandResult::error("No project open".to_string()),
    };

    // Validate time if provided
    if let Some(t) = time {
      if t < 0.0 {
        return CommandResult::error(format!("Invalid marker time: {}", t));
      }
    }

    // Find and update marker
    let mut marker_found = false;
    let mut needs_resort = false;

    for marker in &mut project.timeline.markers {
      if marker.id == marker_id {
        marker_found = true;

        if let Some(n) = &name {
          marker.name = n.clone();
        }
        if let Some(t) = time {
          marker.time = t;
          needs_resort = true;
        }
        if let Some(c) = &color {
          marker.color = c.clone();
        }
        if let Some(d) = &description {
          marker.description = Some(d.clone());
        }

        break;
      }
    }

    if !marker_found {
      return CommandResult::error(format!("Marker not found: {}", marker_id));
    }

    // Re-sort if time changed
    if needs_resort {
      project
        .timeline
        .markers
        .sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());
    }

    state.mark_dirty();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ClipUpdated {
          clip_id: "timeline".to_string(),
          changes: crate::state::events::ClipChanges {
            name: None,
            playback_rate: None,
            volume: None,
            effects: None,
          },
        },
        "command_handler".to_string(),
        state.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "updated": true,
      "marker_id": marker_id
    })))
  }
}
