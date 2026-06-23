//! Тонкие команды для продвинутых функций FFmpeg

use ts_render::video_compiler::error::Result;
use ts_render_services::ffmpeg_advanced::commands_impl as impl_;
use ts_render_services::ffmpeg_advanced::types::*;

/// Генерация превью видео
#[tauri::command]
pub async fn generate_video_preview(
  input_path: String,
  output_path: String,
  duration: f64,
  resolution: Option<(u32, u32)>,
  bitrate: Option<u32>,
) -> Result<()> {
  impl_::generate_video_preview(input_path, output_path, duration, resolution, bitrate).await
}

/// Генерация GIF превью
#[tauri::command]
pub async fn generate_gif_preview(
  input_path: String,
  output_path: String,
  start_time: f64,
  duration: f64,
  fps: u32,
  resolution: Option<(u32, u32)>,
) -> Result<()> {
  impl_::generate_gif_preview(input_path, output_path, start_time, duration, fps, resolution).await
}

/// Объединение видео файлов
#[tauri::command]
pub async fn concat_videos(input_paths: Vec<String>, output_path: String) -> Result<()> {
  impl_::concat_videos(input_paths, output_path).await
}

/// Применение видео фильтра
#[tauri::command]
pub async fn apply_video_filter(
  input_path: String,
  output_path: String,
  filter_name: String,
  duration: Option<f64>,
) -> Result<()> {
  impl_::apply_video_filter(input_path, output_path, filter_name, duration).await
}

/// Анализ медиа файла
#[tauri::command]
pub async fn probe_media_file(input_path: String) -> Result<MediaFileInfo> {
  impl_::probe_media_file(input_path).await
}

/// Тестирование аппаратного ускорения
#[tauri::command]
pub async fn test_hardware_acceleration() -> Result<HardwareAccelerationInfo> {
  impl_::test_hardware_acceleration().await
}

/// Генерация превью с субтитрами
#[tauri::command]
pub async fn generate_subtitle_preview(
  video_path: String,
  subtitle_path: String,
  output_path: String,
  start_time: Option<f64>,
) -> Result<()> {
  impl_::generate_subtitle_preview(video_path, subtitle_path, output_path, start_time).await
}

/// Проверка установки FFmpeg
#[tauri::command]
pub async fn check_ffmpeg_installation() -> Result<FFmpegInstallationInfo> {
  impl_::check_ffmpeg_installation().await
}

/// Получение списка поддерживаемых кодеков
#[tauri::command]
pub async fn get_ffmpeg_codecs() -> Result<Vec<String>> {
  impl_::get_ffmpeg_codecs().await
}

/// Получение списка поддерживаемых форматов
#[tauri::command]
pub async fn get_ffmpeg_formats() -> Result<Vec<String>> {
  impl_::get_ffmpeg_formats().await
}

/// Выполнение FFmpeg команды с отслеживанием прогресса
#[tauri::command]
pub async fn execute_ffmpeg_with_progress(
  command_args: Vec<String>,
) -> Result<FFmpegExecutionResult> {
  impl_::execute_ffmpeg_with_progress(command_args).await
}

/// Простое выполнение FFmpeg команды
#[tauri::command]
pub async fn execute_ffmpeg_simple(command_args: Vec<String>) -> Result<Vec<u8>> {
  impl_::execute_ffmpeg_simple(command_args).await
}

/// Получение информации о выполнении FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_execution_info(command_args: Vec<String>) -> Result<FFmpegExecutionResult> {
  impl_::get_ffmpeg_execution_info(command_args).await
}
