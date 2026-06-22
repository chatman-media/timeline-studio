//! Tauri команды для получения информации о системе и компиляторе

#![allow(clippy::explicit_auto_deref)]

use super::business_logic;
use std::{path::Path, process::Command};
use tauri::State;
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};
use ts_render_services::services::FileInfo;
use ts_render_services::VideoCompilerState;

/// Получить версию FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_version(state: State<'_, VideoCompilerState>) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .arg("-version")
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

  if output.status.success() {
    let version_output = String::from_utf8_lossy(&output.stdout);
    Ok(business_logic::parse_ffmpeg_version(&version_output))
  } else {
    Err(VideoCompilerError::DependencyMissing(
      "Failed to get FFmpeg version".to_string(),
    ))
  }
}

/// Проверить доступность FFmpeg
#[tauri::command]
pub async fn check_ffmpeg_available(state: State<'_, VideoCompilerState>) -> Result<bool> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  Ok(business_logic::check_ffmpeg_availability(&*ffmpeg_path))
}

/// Получить список поддерживаемых форматов
#[tauri::command]
pub async fn get_supported_formats(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .args(["-formats", "-hide_banner"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

  if output.status.success() {
    let formats_output = String::from_utf8_lossy(&output.stdout);
    Ok(business_logic::parse_supported_formats(&formats_output))
  } else {
    Err(VideoCompilerError::FFmpegError {
      exit_code: output.status.code(),
      stderr: String::from_utf8_lossy(&output.stderr).to_string(),
      command: "ffmpeg -formats".to_string(),
    })
  }
}

/// Получить список поддерживаемых видео кодеков
#[tauri::command]
pub async fn get_supported_video_codecs(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .args(["-codecs", "-hide_banner"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

  if output.status.success() {
    let codecs_output = String::from_utf8_lossy(&output.stdout);
    Ok(business_logic::parse_video_codecs(&codecs_output))
  } else {
    Err(VideoCompilerError::FFmpegError {
      exit_code: output.status.code(),
      stderr: String::from_utf8_lossy(&output.stderr).to_string(),
      command: "ffmpeg -codecs".to_string(),
    })
  }
}

/// Получить список поддерживаемых аудио кодеков
#[tauri::command]
pub async fn get_supported_audio_codecs(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .args(["-codecs", "-hide_banner"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

  if output.status.success() {
    let codecs_output = String::from_utf8_lossy(&output.stdout);
    Ok(business_logic::parse_audio_codecs(&codecs_output))
  } else {
    Err(VideoCompilerError::FFmpegError {
      exit_code: output.status.code(),
      stderr: String::from_utf8_lossy(&output.stderr).to_string(),
      command: "ffmpeg -codecs".to_string(),
    })
  }
}

/// Получить информацию о системе
#[tauri::command]
pub async fn get_system_info() -> Result<serde_json::Value> {
  let system_info = business_logic::create_system_info();
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
  let settings = state.settings.read().await;
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();

  let config = business_logic::create_compiler_config(
    ffmpeg_path,
    settings.hardware_acceleration,
    settings.max_concurrent_jobs,
    settings.temp_directory.to_string_lossy().to_string(),
  );

  Ok(serde_json::to_value(config)?)
}

/// Получить статистику производительности
#[tauri::command]
pub async fn get_performance_stats(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let active_jobs = state.active_jobs.read().await;
  let cache_stats = state.cache_manager.read().await.get_memory_usage();

  let stats = business_logic::create_performance_stats(
    active_jobs.len(),
    cache_stats.total_bytes,
    cache_stats.preview_bytes,
  );

  Ok(serde_json::to_value(stats)?)
}

/// Получить список доступных фильтров FFmpeg
#[tauri::command]
pub async fn get_available_filters(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .args(["-filters", "-hide_banner"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

  if output.status.success() {
    let filters_output = String::from_utf8_lossy(&output.stdout);
    Ok(business_logic::parse_available_filters(&filters_output))
  } else {
    Err(VideoCompilerError::FFmpegError {
      exit_code: output.status.code(),
      stderr: String::from_utf8_lossy(&output.stderr).to_string(),
      command: "ffmpeg -filters".to_string(),
    })
  }
}

/// Получить информацию о медиафайле
#[tauri::command]
pub async fn get_media_file_info(
  state: State<'_, VideoCompilerState>,
  file_path: String,
) -> Result<FileInfo> {
  if let Some(ffmpeg_service) = state.services.get_ffmpeg_service() {
    ffmpeg_service.get_file_info(Path::new(&file_path)).await
  } else {
    Err(VideoCompilerError::InternalError(
      "FFmpeg service not available".to_string(),
    ))
  }
}
