//! Tauri команды для получения информации о системе и компиляторе

#![allow(clippy::explicit_auto_deref)]

use tauri::State;
use ts_render::video_compiler::core::error::Result;
use ts_render_services::services::FileInfo;
use ts_render_services::VideoCompilerState;
use ts_render_services::info::commands_impl as impl_;
use ts_render_services::info::business_logic;

/// Получить версию FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_version(state: State<'_, VideoCompilerState>) -> Result<String> {
  impl_::get_ffmpeg_version(&state).await
}

/// Проверить доступность FFmpeg
#[tauri::command]
pub async fn check_ffmpeg_available(state: State<'_, VideoCompilerState>) -> Result<bool> {
  impl_::check_ffmpeg_available(&state).await
}

/// Получить список поддерживаемых форматов
#[tauri::command]
pub async fn get_supported_formats(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  impl_::get_supported_formats(&state).await
}

/// Получить список поддерживаемых видео кодеков
#[tauri::command]
pub async fn get_supported_video_codecs(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::get_supported_video_codecs(&state).await
}

/// Получить список поддерживаемых аудио кодеков
#[tauri::command]
pub async fn get_supported_audio_codecs(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::get_supported_audio_codecs(&state).await
}

/// Получить информацию о системе
#[tauri::command]
pub async fn get_system_info() -> Result<serde_json::Value> {
  // tauri::VERSION lives in this Tauri-layer crate; pass it as a parameter.
  let system_info = business_logic::create_system_info(tauri::VERSION);
  Ok(serde_json::to_value(system_info)?)
}

/// Получить информацию о доступном дисковом пространстве
#[tauri::command]
pub async fn get_disk_space(path: String) -> Result<serde_json::Value> {
  let disk_info = business_logic::get_disk_space_info(&path)?;
  Ok(serde_json::to_value(disk_info)?)
}

/// Получить конфигурацию компилятора
#[tauri::command]
pub async fn get_compiler_config(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_compiler_config(&state).await
}

/// Получить статистику производительности
#[tauri::command]
pub async fn get_performance_stats(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_performance_stats(&state).await
}

/// Получить список доступных фильтров FFmpeg
#[tauri::command]
pub async fn get_available_filters(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  impl_::get_available_filters(&state).await
}

/// Получить информацию о медиафайле
#[tauri::command]
pub async fn get_media_file_info(
  state: State<'_, VideoCompilerState>,
  file_path: String,
) -> Result<FileInfo> {
  impl_::get_media_file_info(&state, &file_path).await
}
