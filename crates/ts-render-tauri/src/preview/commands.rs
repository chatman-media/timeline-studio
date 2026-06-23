//! Tauri команды для генерации превью (thin wrappers)

use super::types::*;
use ts_render::video_compiler::{
  error::Result,
  schema::ProjectSchema,
};
use ts_render_services::VideoCompilerState;
use tauri::State;
use ts_render_services::preview::commands_impl as impl_;

/// Генерировать превью кадра в определенное время
#[tauri::command]
pub async fn generate_frame_preview(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_frame_preview(project_schema, timestamp, output_path, &state).await
}

/// Генерировать миниатюры для видео
#[tauri::command]
pub async fn generate_video_thumbnails(
  video_path: String,
  output_dir: String,
  count: u32,
  width: u32,
  height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::generate_video_thumbnails(video_path, output_dir, count, width, height, &state).await
}

/// Генерировать превью проекта (короткое видео)
#[tauri::command]
pub async fn generate_project_preview(
  project_schema: ProjectSchema,
  output_path: String,
  _duration: f64,
  width: u32,
  height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_project_preview(project_schema, output_path, _duration, width, height, &state).await
}

/// Генерировать превью эффекта
#[tauri::command]
pub async fn generate_effect_preview(
  effect_id: String,
  _input_path: String,
  output_path: String,
  timestamp: f64,
  _parameters: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_effect_preview(effect_id, _input_path, output_path, timestamp, _parameters, &state).await
}

/// Генерировать превью перехода
#[tauri::command]
pub async fn generate_transition_preview(
  transition_type: String,
  _input_a: String,
  _input_b: String,
  output_path: String,
  duration: f64,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_transition_preview(transition_type, _input_a, _input_b, output_path, duration, &state).await
}

/// Генерировать раскадровку (storyboard) проекта
#[tauri::command]
pub async fn generate_storyboard(
  project_schema: ProjectSchema,
  output_path: String,
  frames_per_row: u32,
  frame_width: u32,
  frame_height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_storyboard(project_schema, output_path, frames_per_row, frame_width, frame_height, &state).await
}

/// Генерировать анимированное превью (GIF)
#[tauri::command]
pub async fn generate_animated_preview(
  _project_schema: ProjectSchema,
  params: AnimatedPreviewParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_animated_preview(_project_schema, params, &state).await
}

/// Генерировать превью звуковой волны
#[tauri::command]
pub async fn generate_waveform_preview(
  audio_path: String,
  output_path: String,
  width: u32,
  height: u32,
  color: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_waveform_preview(audio_path, output_path, width, height, color, &state).await
}

/// Генерировать waveform данные в формате JSON для peaks.js
#[tauri::command]
pub async fn generate_waveform_data_json(
  audio_path: String,
  output_path: String,
  pixels_per_second: Option<u32>,
  bits: Option<u8>,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_waveform_data_json(audio_path, output_path, pixels_per_second, bits, &state).await
}

/// Получить информацию о превью из кэша
#[tauri::command]
pub async fn get_cached_preview_info(
  preview_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  impl_::get_cached_preview_info(preview_id, &state).await
}

/// Очистить кэш превью для проекта
#[tauri::command]
pub async fn clear_project_previews(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::clear_project_previews(_project_id, &state).await
}

/// Генерировать превью с настраиваемыми параметрами
#[tauri::command]
pub async fn generate_custom_preview(
  project_schema: ProjectSchema,
  output_path: String,
  options: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_custom_preview(project_schema, output_path, options, &state).await
}

/// Генерировать пакет превью с настройками
#[tauri::command]
pub async fn generate_preview_batch_with_settings(
  video_path: String,
  timestamps: Vec<f64>,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::generate_preview_batch_with_settings(video_path, timestamps, settings, &state).await
}

/// Очистить кэш превью для конкретного файла
#[tauri::command]
pub async fn clear_preview_cache_for_file(
  _file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::clear_preview_cache_for_file(_file_path, &state).await
}

/// Установить путь к FFmpeg для генератора превью
#[tauri::command]
pub async fn set_preview_generator_ffmpeg_path(
  path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::set_preview_generator_ffmpeg_path(path, &state).await
}

/// Очистить кэш превью для конкретного файла с использованием PreviewGenerator
#[tauri::command]
pub async fn clear_preview_generator_cache_for_file(
  _file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::clear_preview_generator_cache_for_file(_file_path, &state).await
}

/// Генерировать видео превью (миниатюры для видео)
#[tauri::command]
pub async fn generate_video_thumbnails_service(
  _project_schema: ProjectSchema,
  output_dir: String,
  thumbnail_count: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::generate_video_thumbnails_service(_project_schema, output_dir, thumbnail_count, &state).await
}

/// Генерировать раскадровку проекта
#[tauri::command]
pub async fn generate_storyboard_service(
  project_schema: ProjectSchema,
  output_path: String,
  columns: u32,
  rows: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_storyboard_service(project_schema, output_path, columns, rows, &state).await
}

/// Пакетная генерация превью
#[tauri::command]
pub async fn batch_generate_previews_service(
  requests: Vec<serde_json::Value>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::batch_generate_previews_service(requests, &state).await
}
