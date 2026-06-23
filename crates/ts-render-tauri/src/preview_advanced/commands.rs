//! Tauri команды для расширенных функций превью

use super::types::*;
use tauri::State;
use ts_render::video_compiler::core::error::Result;
use ts_render_services::VideoCompilerState;
use ts_render_services::preview_advanced::commands_impl as impl_;

/// Создать генератор превью с кастомным путем к FFmpeg
#[tauri::command]
pub async fn create_preview_generator_with_ffmpeg(
  ffmpeg_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::create_preview_generator_with_ffmpeg(&state, ffmpeg_path).await
}

/// Установить путь к FFmpeg для существующего генератора (расширенная версия)
#[tauri::command]
pub async fn set_preview_generator_ffmpeg_path_advanced(
  new_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::set_preview_generator_ffmpeg_path_advanced(&state, new_path).await
}

/// Генерировать превью для пакета видео
#[tauri::command]
pub async fn generate_preview_batch_advanced(
  params: BatchPreviewParams,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<PreviewResult>> {
  impl_::generate_preview_batch_advanced(&state, params).await
}

/// Генерировать отдельный кадр из видео
#[tauri::command]
pub async fn generate_single_frame_preview(
  video_path: String,
  timestamp: f64,
  _output_path: Option<String>,
  width: Option<u32>,
  height: Option<u32>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<u8>> {
  impl_::generate_single_frame_preview(&state, video_path, timestamp, width, height).await
}

/// Получить информацию о генераторе превью
#[tauri::command]
pub async fn get_preview_generator_info(
  state: State<'_, VideoCompilerState>,
) -> Result<PreviewGeneratorInfo> {
  impl_::get_preview_generator_info(&state).await
}

/// Генерировать превью с расширенными опциями
#[tauri::command]
pub async fn generate_preview_with_options(
  video_path: String,
  timestamp: f64,
  options: AdvancedPreviewOptions,
  state: State<'_, VideoCompilerState>,
) -> Result<PreviewResult> {
  impl_::generate_preview_with_options(&state, video_path, timestamp, options).await
}
