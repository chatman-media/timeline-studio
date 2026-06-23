//! Tauri команды для работы с FFmpeg builder

use super::types::*;
use tauri::State;
use ts_render::video_compiler::error::Result;
use ts_render_services::VideoCompilerState;
use ts_render_services::ffmpeg_builder::commands_impl as impl_;

// Re-export types from business_logic for Tauri command signatures
use ts_render_services::ffmpeg_builder::business_logic::{
  ExecuteFFmpegParams, ExecutionResult, ExecutorCapabilities, FFmpegBuilderProjectInfo,
  FFmpegBuilderSettings, SegmentFiltersInfo, ValidateTimestampsParams, ValidationResult,
};

/// Добавить сегментные входы в FFmpeg builder
#[tauri::command]
pub async fn add_segment_inputs_to_builder(
  params: SegmentInputParams,
  state: State<'_, VideoCompilerState>,
) -> Result<SegmentInputResult> {
  impl_::add_segment_inputs_to_builder(params, &state).await
}

/// Создать команду FFmpeg с настройками пререндеринга
#[tauri::command]
pub async fn create_ffmpeg_with_prerender_settings(
  params: PrerenderSettingsParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::create_ffmpeg_with_prerender_settings(params, &state).await
}

/// Получить индекс входа для клипа
#[tauri::command]
pub async fn get_clip_input_index_from_builder(
  clip_id: String,
  project: ts_render::video_compiler::schema::ProjectSchema,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<usize>> {
  impl_::get_clip_input_index_from_builder(clip_id, project, &state).await
}

/// Получить подробную информацию об индексе клипа
#[tauri::command]
pub async fn get_clip_index_details(
  clip_id: String,
  project: ts_render::video_compiler::schema::ProjectSchema,
  state: State<'_, VideoCompilerState>,
) -> Result<ClipIndexResult> {
  impl_::get_clip_index_details(clip_id, project, &state).await
}

/// Получить информацию о возможностях FFmpeg builder
#[tauri::command]
pub async fn get_ffmpeg_builder_info(state: State<'_, VideoCompilerState>) -> Result<BuilderInfo> {
  impl_::get_ffmpeg_builder_info(&state).await
}

/// Получить информацию о возможностях FFmpeg executor
#[tauri::command]
pub async fn get_ffmpeg_executor_capabilities(
  state: State<'_, VideoCompilerState>,
) -> Result<ExecutorCapabilities> {
  impl_::get_ffmpeg_executor_capabilities(&state).await
}

/// Проверить доступность FFmpeg executor
#[tauri::command]
pub async fn check_ffmpeg_executor_availability(
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  impl_::check_ffmpeg_executor_availability(&state).await
}

/// Выполнить FFmpeg команду с отслеживанием прогресса
#[tauri::command]
pub async fn execute_ffmpeg_with_progress_tracking(
  params: ExecuteFFmpegParams,
  state: State<'_, VideoCompilerState>,
) -> Result<ExecutionResult> {
  impl_::execute_ffmpeg_with_progress_tracking(params, &state).await
}

/// Выполнить простую FFmpeg команду без отслеживания прогресса
#[tauri::command]
pub async fn execute_ffmpeg_simple_no_progress(
  params: ExecuteFFmpegParams,
  state: State<'_, VideoCompilerState>,
) -> Result<ExecutionResult> {
  impl_::execute_ffmpeg_simple_no_progress(params, &state).await
}

/// Получить индекс входа клипа (расширенная версия)
#[tauri::command]
pub async fn get_clip_input_index_advanced(
  clip_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_clip_input_index_advanced(clip_id, &state).await
}

/// Получить настройки FFmpeg Builder (расширенная версия)
#[tauri::command]
pub async fn get_ffmpeg_builder_settings_advanced(
  state: State<'_, VideoCompilerState>,
) -> Result<FFmpegBuilderSettings> {
  impl_::get_ffmpeg_builder_settings_advanced(&state).await
}

/// Получить информацию о проекте FFmpeg Builder (расширенная версия)
#[tauri::command]
pub async fn get_ffmpeg_builder_project_info_advanced(
  state: State<'_, VideoCompilerState>,
) -> Result<FFmpegBuilderProjectInfo> {
  impl_::get_ffmpeg_builder_project_info_advanced(&state).await
}

/// Получить информацию о фильтрах сегмента (расширенная версия)
#[tauri::command]
pub async fn get_segment_filters_info_advanced(
  segment_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<SegmentFiltersInfo> {
  impl_::get_segment_filters_info_advanced(segment_id, &state).await
}

/// Валидировать временные метки сегмента (расширенная версия)
#[tauri::command]
pub async fn validate_segment_timestamps_advanced(
  params: ValidateTimestampsParams,
  state: State<'_, VideoCompilerState>,
) -> Result<ValidationResult> {
  impl_::validate_segment_timestamps_advanced(params, &state).await
}

/// Получить кэш извлечения кадров (расширенная версия)
#[tauri::command]
pub async fn get_frame_extraction_cache_advanced(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_frame_extraction_cache_advanced(&state).await
}
