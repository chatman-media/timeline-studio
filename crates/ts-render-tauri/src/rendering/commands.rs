//! Rendering - Тонкие команды для рендеринга видео
//!
//! Tauri команды, которые делегируют бизнес-логику соответствующим функциям.

use tauri::{Emitter, State};

use ts_render::video_compiler::error::Result;
use ts_render::video_compiler::schema::ProjectSchema;
use ts_render_services::state::{RenderJob, VideoCompilerState};
use ts_render_services::VideoCompilerEvent;

use ts_render_services::rendering::commands_impl as impl_;
use super::types::*;

/// Запуск компиляции видео
#[tauri::command]
pub async fn compile_video<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
  project_schema: ProjectSchema,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let job_id = impl_::compile_video(&state, project_schema, output_path).await?;

  // Отправляем событие о начале рендеринга
  let _ = app.emit(
    "video-compiler",
    &VideoCompilerEvent::RenderStarted {
      job_id: job_id.clone(),
    },
  );

  Ok(job_id)
}

/// Отмена задачи рендеринга
#[tauri::command]
pub async fn cancel_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<bool> {
  impl_::cancel_render(&state, job_id).await
}

/// Получить статус активных задач рендеринга
#[tauri::command]
pub async fn get_active_render_jobs(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  impl_::get_active_render_jobs(&state).await
}

/// Получить информацию о конкретной задаче рендеринга
#[tauri::command]
pub async fn get_render_job(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<RenderJob>> {
  impl_::get_render_job(&state, job_id).await
}

/// Приостановить рендеринг
#[tauri::command]
pub async fn pause_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  impl_::pause_render(&state, job_id).await
}

/// Возобновить рендеринг
#[tauri::command]
pub async fn resume_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  impl_::resume_render(&state, job_id).await
}

/// Экспортировать проект с предустановленными настройками
#[tauri::command]
pub async fn export_with_preset<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
  project_schema: ProjectSchema,
  output_path: String,
  preset: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let job_id = impl_::export_with_preset(&state, project_schema, output_path, preset).await?;

  // Отправляем событие о начале рендеринга
  let _ = app.emit(
    "video-compiler",
    &VideoCompilerEvent::RenderStarted {
      job_id: job_id.clone(),
    },
  );

  Ok(job_id)
}

/// Получить список доступных предустановок экспорта
#[tauri::command]
pub async fn get_available_export_presets() -> Result<Vec<String>> {
  impl_::get_available_export_presets().await
}

/// Получить информацию о предустановке экспорта
#[tauri::command]
pub async fn get_export_preset(preset_name: String) -> Result<Option<ExportPreset>> {
  impl_::get_export_preset(preset_name).await
}

/// Получить статистику рендеринга для активной задачи
#[tauri::command]
pub async fn get_render_pipeline_statistics(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<RenderStatistics> {
  impl_::get_render_pipeline_statistics(&state, job_id).await
}

/// Построить команду рендеринга с кастомными настройками FFmpeg
#[tauri::command]
pub async fn build_render_command_with_settings(
  project_schema: ProjectSchema,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::build_render_command_with_settings(&state, project_schema, output_path, settings).await
}

/// Извлечь кадры для клипа
#[tauri::command]
pub async fn extract_frames_for_clip(
  _clip_id: String,
  _timestamps: Vec<f64>,
  state: State<'_, VideoCompilerState>,
) -> Result<FrameExtractionCacheInfo> {
  impl_::extract_frames_for_clip(&state, _clip_id, _timestamps).await
}

/// Извлечь кадры для субтитров
#[tauri::command]
pub async fn extract_frames_for_subtitles(
  subtitle_timestamps: Vec<f64>,
  video_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<FrameExtractionCacheInfo> {
  impl_::extract_frames_for_subtitles(&state, subtitle_timestamps, video_path).await
}

/// Построить команду превью с использованием FFmpeg Builder
#[tauri::command]
pub async fn build_preview_command(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::build_preview_command(&_state, project_schema, timestamp, output_path).await
}

/// Получить настройки FFmpeg Builder
#[tauri::command]
pub async fn get_ffmpeg_builder_settings(
  project_schema: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegBuilderInfo> {
  impl_::get_ffmpeg_builder_settings(&_state, project_schema).await
}

/// Получить информацию о проекте из FFmpeg Builder
#[tauri::command]
pub async fn get_ffmpeg_builder_project_info(
  project_schema: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegProjectInfo> {
  impl_::get_ffmpeg_builder_project_info(&_state, project_schema).await
}

/// Построить команду рендеринга для сегмента видео
#[tauri::command]
pub async fn build_segment_render_command(
  project_schema: ProjectSchema,
  start_time: f64,
  end_time: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::build_segment_render_command(&state, project_schema, start_time, end_time, output_path).await
}

/// Получить информацию о фильтрах для сегмента
#[tauri::command]
pub async fn get_segment_filters_info(
  project_schema: ProjectSchema,
  start_time: f64,
  end_time: f64,
  _state: State<'_, VideoCompilerState>,
) -> Result<SegmentFiltersInfo> {
  impl_::get_segment_filters_info(&_state, project_schema, start_time, end_time).await
}

/// Проверить корректность временных меток сегмента
#[tauri::command]
pub async fn validate_segment_timestamps(
  project_schema: ProjectSchema,
  start_time: f64,
  end_time: f64,
  _state: State<'_, VideoCompilerState>,
) -> Result<SegmentValidation> {
  impl_::validate_segment_timestamps(&_state, project_schema, start_time, end_time).await
}

/// Получить кэш менеджера извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache(
  state: State<'_, VideoCompilerState>,
) -> Result<FrameExtractionCacheInfo> {
  impl_::get_frame_extraction_cache(&state).await
}

/// Получить индекс входа для клипа
#[tauri::command]
pub async fn get_clip_input_index(
  project_schema: ProjectSchema,
  clip_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<ClipInputIndexInfo> {
  impl_::get_clip_input_index(&_state, project_schema, clip_id).await
}

/// Получить статистику использования памяти при рендеринге
#[tauri::command]
pub async fn get_render_memory_usage(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::get_render_memory_usage(&state, job_id).await
}

/// Получить общее время обработки для задачи рендеринга
#[tauri::command]
pub async fn get_render_total_processing_time(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  impl_::get_render_total_processing_time(&state, job_id).await
}
