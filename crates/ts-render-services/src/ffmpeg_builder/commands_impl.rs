//! Реализация команд для работы с FFmpeg builder (без Tauri)

use super::types::*;
use crate::VideoCompilerState;
use ts_render::video_compiler::error::Result;

// Re-export types from business_logic for command signatures
use super::business_logic::{
  ExecuteFFmpegParams, ExecutionResult, ExecutorCapabilities, FFmpegBuilderProjectInfo,
  FFmpegBuilderSettings, SegmentFiltersInfo, ValidateTimestampsParams, ValidationResult,
};

use super::business_logic;

/// Добавить сегментные входы в FFmpeg builder
pub async fn add_segment_inputs_to_builder(
  params: SegmentInputParams,
  _state: &VideoCompilerState,
) -> Result<SegmentInputResult> {
  // Валидируем параметры
  business_logic::validate_segment_input_params(&params)?;

  // Выполняем операцию
  business_logic::add_segment_inputs_to_builder_logic(&params).await
}

/// Создать команду FFmpeg с настройками пререндеринга
pub async fn create_ffmpeg_with_prerender_settings(
  params: PrerenderSettingsParams,
  _state: &VideoCompilerState,
) -> Result<String> {
  // Валидируем параметры
  business_logic::validate_prerender_params(&params)?;

  // Выполняем операцию
  business_logic::create_ffmpeg_with_prerender_settings_logic(&params).await
}

/// Получить индекс входа для клипа
pub async fn get_clip_input_index_from_builder(
  clip_id: String,
  project: ts_render::video_compiler::schema::ProjectSchema,
  _state: &VideoCompilerState,
) -> Result<Option<usize>> {
  let result = business_logic::get_clip_input_index_logic(&project, &clip_id);
  Ok(result.index)
}

/// Получить подробную информацию об индексе клипа
pub async fn get_clip_index_details(
  clip_id: String,
  project: ts_render::video_compiler::schema::ProjectSchema,
  _state: &VideoCompilerState,
) -> Result<ClipIndexResult> {
  Ok(business_logic::get_clip_input_index_logic(
    &project, &clip_id,
  ))
}

/// Получить информацию о возможностях FFmpeg builder
pub async fn get_ffmpeg_builder_info(_state: &VideoCompilerState) -> Result<BuilderInfo> {
  Ok(business_logic::get_ffmpeg_builder_info_logic())
}

/// Получить информацию о возможностях FFmpeg executor
pub async fn get_ffmpeg_executor_capabilities(
  state: &VideoCompilerState,
) -> Result<ExecutorCapabilities> {
  business_logic::get_ffmpeg_executor_capabilities(state).await
}

/// Проверить доступность FFmpeg executor
pub async fn check_ffmpeg_executor_availability(
  state: &VideoCompilerState,
) -> Result<bool> {
  business_logic::check_ffmpeg_executor_availability(state).await
}

/// Выполнить FFmpeg команду с отслеживанием прогресса
pub async fn execute_ffmpeg_with_progress_tracking(
  params: ExecuteFFmpegParams,
  state: &VideoCompilerState,
) -> Result<ExecutionResult> {
  business_logic::execute_ffmpeg_with_progress_tracking(params, state).await
}

/// Выполнить простую FFmpeg команду без отслеживания прогресса
pub async fn execute_ffmpeg_simple_no_progress(
  params: ExecuteFFmpegParams,
  state: &VideoCompilerState,
) -> Result<ExecutionResult> {
  business_logic::execute_ffmpeg_simple_no_progress(params, state).await
}

/// Получить индекс входа клипа (расширенная версия)
pub async fn get_clip_input_index_advanced(
  clip_id: String,
  state: &VideoCompilerState,
) -> Result<serde_json::Value> {
  business_logic::get_clip_input_index_advanced(clip_id, state).await
}

/// Получить настройки FFmpeg Builder (расширенная версия)
pub async fn get_ffmpeg_builder_settings_advanced(
  state: &VideoCompilerState,
) -> Result<FFmpegBuilderSettings> {
  business_logic::get_ffmpeg_builder_settings_advanced(state).await
}

/// Получить информацию о проекте FFmpeg Builder (расширенная версия)
pub async fn get_ffmpeg_builder_project_info_advanced(
  state: &VideoCompilerState,
) -> Result<FFmpegBuilderProjectInfo> {
  business_logic::get_ffmpeg_builder_project_info_advanced(state).await
}

/// Получить информацию о фильтрах сегмента (расширенная версия)
pub async fn get_segment_filters_info_advanced(
  segment_id: String,
  state: &VideoCompilerState,
) -> Result<SegmentFiltersInfo> {
  business_logic::get_segment_filters_info_advanced(segment_id, state).await
}

/// Валидировать временные метки сегмента (расширенная версия)
pub async fn validate_segment_timestamps_advanced(
  params: ValidateTimestampsParams,
  state: &VideoCompilerState,
) -> Result<ValidationResult> {
  business_logic::validate_segment_timestamps_advanced(params, state).await
}

/// Получить кэш извлечения кадров (расширенная версия)
pub async fn get_frame_extraction_cache_advanced(
  state: &VideoCompilerState,
) -> Result<serde_json::Value> {
  business_logic::get_frame_extraction_cache_advanced(state).await
}
