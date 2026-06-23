//! Tauri команды для извлечения кадров (thin wrappers)

use super::types::*;
use tauri::State;
use ts_render::video_compiler::error::Result;
use ts_render::video_compiler::schema::ProjectSchema;
use ts_render_services::VideoCompilerState;
use ts_render_services::frame_extraction::commands_impl as impl_;

/// Извлечь кадры таймлайна
#[tauri::command]
pub async fn extract_timeline_frames(
  project_schema: ProjectSchema,
  interval: f64,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::extract_timeline_frames(project_schema, interval, output_dir, &state).await
}

/// Извлечь кадры субтитров
#[tauri::command]
pub async fn extract_subtitle_frames(
  project_schema: ProjectSchema,
  output_dir: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<SubtitleFrameResult>> {
  impl_::extract_subtitle_frames(project_schema, output_dir, &_state).await
}

/// Генерировать превью
#[tauri::command]
pub async fn generate_preview(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_preview(project_schema, timestamp, output_path, &state).await
}

/// Генерировать пакет превью
#[tauri::command]
pub async fn generate_preview_batch(
  project_schema: ProjectSchema,
  timestamps: Vec<f64>,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::generate_preview_batch(project_schema, timestamps, output_dir, &state).await
}

/// Извлечь кадры с параметрами
#[tauri::command]
pub async fn extract_frames_with_params(
  params: FrameExtractionParams,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<ExtractedFrame>> {
  impl_::extract_frames_with_params(params, &state).await
}

/// Извлечь ключевые кадры
#[tauri::command]
pub async fn extract_keyframes(
  project_schema: ProjectSchema,
  keyframe_count: usize,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::extract_keyframes(project_schema, keyframe_count, output_dir, &state).await
}

/// Генерировать превью с настройками
#[tauri::command]
pub async fn generate_preview_with_settings(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_preview_with_settings(project_schema, timestamp, output_path, settings, &state).await
}

/// Получить информацию о кэше извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache_info(
  project_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_frame_extraction_cache_info(project_id, &_state).await
}

/// Очистить кэш кадров
#[tauri::command]
pub async fn clear_frame_cache(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::clear_frame_cache(_project_id, &state).await
}

/// Извлечь кадр из видео
#[tauri::command]
pub async fn extract_video_frame(
  video_path: String,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::extract_video_frame(video_path, timestamp, output_path, &state).await
}

/// Извлечь кадры из видео пакетом
#[tauri::command]
pub async fn extract_video_frames_batch(
  video_path: String,
  timestamps: Vec<f64>,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::extract_video_frames_batch(video_path, timestamps, output_dir, &state).await
}

/// Получить миниатюры видео
#[tauri::command]
pub async fn get_video_thumbnails(
  video_path: String,
  count: usize,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::get_video_thumbnails(video_path, count, output_dir, &state).await
}
