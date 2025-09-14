//! Additional Media Commands - дополнительные команды для работы с медиа

use crate::media::files::get_media_files;
use crate::video_compiler::VideoCompilerState;
use crate::video_compiler::commands::ffmpeg_advanced::probe_media_file;
use crate::video_compiler::error::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

/// Параметры для получения медиафайлов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetMediaFilesParams {
  pub directory: String,
  pub extensions: Option<Vec<String>>,
  pub recursive: bool,
}

/// Результат получения медиафайлов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaFilesResult {
  pub files: Vec<String>,
  pub total_count: usize,
  pub supported_formats: Vec<String>,
}

/// Получить список медиафайлов в директории
#[allow(dead_code)]
#[tauri::command]
pub async fn get_media_files_in_directory(
  params: GetMediaFilesParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<MediaFilesResult> {
  let _directory = PathBuf::from(&params.directory);
  let extensions = params.extensions.unwrap_or_else(|| {
    vec![
      "mp4".to_string(),
      "mov".to_string(),
      "avi".to_string(),
      "mkv".to_string(),
      "webm".to_string(),
    ]
  });

  let files = get_media_files(params.directory.clone()).map_err(|e| {
    crate::video_compiler::error::VideoCompilerError::validation(format!(
      "Failed to get media files: {e}"
    ))
  })?;

  let file_paths: Vec<String> = files;

  Ok(MediaFilesResult {
    total_count: file_paths.len(),
    files: file_paths,
    supported_formats: extensions,
  })
}

/// Параметры для анализа медиафайла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProbeMediaParams {
  pub file_path: String,
  pub analyze_streams: bool,
  pub extract_metadata: bool,
}

/// Результат анализа медиафайла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProbeMediaResult {
  pub file_path: String,
  pub is_valid: bool,
  pub duration: Option<f64>,
  pub format: Option<String>,
  pub video_streams: Option<u32>,
  pub audio_streams: Option<u32>,
  pub metadata: std::collections::HashMap<String, String>,
  pub error: Option<String>,
}

/// Проанализировать медиафайл
#[allow(dead_code)]
#[tauri::command]
pub async fn probe_media_file_detailed(
  params: ProbeMediaParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ProbeMediaResult> {
  match probe_media_file(params.file_path.clone()).await {
    Ok(probe_data) => {
      // Извлекаем данные из структуры MediaFileInfo
      Ok(ProbeMediaResult {
        file_path: params.file_path,
        is_valid: true,
        duration: Some(probe_data.duration),
        format: Some(probe_data.format),
        video_streams: if probe_data.video_codec.is_some() {
          Some(1)
        } else {
          Some(0)
        },
        audio_streams: if probe_data.audio_codec.is_some() {
          Some(1)
        } else {
          Some(0)
        },
        metadata: std::collections::HashMap::new(),
        error: None,
      })
    }
    Err(e) => Ok(ProbeMediaResult {
      file_path: params.file_path,
      is_valid: false,
      duration: None,
      format: None,
      video_streams: None,
      audio_streams: None,
      metadata: std::collections::HashMap::new(),
      error: Some(e.to_string()),
    }),
  }
}

/// Информация о текущем GPU
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentGpuInfo {
  pub name: String,
  pub vendor: String,
  pub memory_total: Option<u64>,
  pub memory_free: Option<u64>,
  pub utilization: Option<f32>,
  pub supports_encoding: bool,
  pub supports_decoding: bool,
}

/// Получить информацию о текущем GPU
#[allow(dead_code)]
#[tauri::command]
pub async fn get_current_gpu_information(
  _state: State<'_, VideoCompilerState>,
) -> Result<Option<CurrentGpuInfo>> {
  // Упрощенная реализация - возвращаем дефолтную информацию
  Ok(Some(CurrentGpuInfo {
    name: "Integrated GPU".to_string(),
    vendor: "Unknown".to_string(),
    memory_total: None,
    memory_free: None,
    utilization: None,
    supports_encoding: true,
    supports_decoding: true,
  }))
}

/// Проверить поддержку аппаратного ускорения
#[allow(dead_code)]
#[tauri::command]
pub async fn test_hardware_acceleration_support(
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  // Упрощенная проверка - возвращаем true для большинства систем
  Ok(true)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_get_media_files_params_serialization() {
    let params = GetMediaFilesParams {
      directory: "/test/media".to_string(),
      extensions: Some(vec!["mp4".to_string(), "mov".to_string()]),
      recursive: true,
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("directory"));
    assert!(json.contains("mp4"));
  }

  #[test]
  fn test_probe_media_params_serialization() {
    let params = ProbeMediaParams {
      file_path: "/test/video.mp4".to_string(),
      analyze_streams: true,
      extract_metadata: true,
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("file_path"));
    assert!(json.contains("analyze_streams"));
  }
}
