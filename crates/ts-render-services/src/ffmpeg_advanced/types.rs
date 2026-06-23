//! Типы для продвинутых команд FFmpeg

use serde::{Deserialize, Serialize};

/// Параметры для генерации превью видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoPreviewParams {
  pub input_path: String,
  pub output_path: String,
  pub duration: f64,
  pub resolution: Option<(u32, u32)>,
  pub bitrate: Option<u32>,
}

/// Параметры для генерации GIF превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GifPreviewParams {
  pub input_path: String,
  pub output_path: String,
  pub start_time: f64,
  pub duration: f64,
  pub fps: u32,
  pub resolution: Option<(u32, u32)>,
}

/// Параметры для объединения видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConcatVideosParams {
  pub input_paths: Vec<String>,
  pub output_path: String,
}

/// Параметры для применения фильтра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFilterParams {
  pub input_path: String,
  pub output_path: String,
  pub filter_name: String,
  pub duration: Option<f64>,
}

/// Параметры для генерации превью с субтитрами
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitlePreviewParams {
  pub video_path: String,
  pub subtitle_path: String,
  pub output_path: String,
  pub start_time: Option<f64>,
}

/// Информация о медиа файле
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaFileInfo {
  pub format: String,
  pub duration: f64,
  pub video_codec: Option<String>,
  pub audio_codec: Option<String>,
  pub video_resolution: Option<(u32, u32)>,
  pub video_bitrate: Option<u32>,
  pub audio_bitrate: Option<u32>,
  pub frame_rate: Option<f64>,
}

/// Результат тестирования аппаратного ускорения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareAccelerationInfo {
  pub available_encoders: Vec<String>,
  pub nvidia_available: bool,
  pub videotoolbox_available: bool,
  pub vaapi_available: bool,
}

/// Информация об установке FFmpeg
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegInstallationInfo {
  pub version: String,
  pub configuration: Vec<String>,
  pub libav_versions: Vec<String>,
}

/// Параметры выполнения FFmpeg команды
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegExecutionParams {
  pub command_args: Vec<String>,
  pub track_progress: bool,
}

/// Результат выполнения FFmpeg
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegExecutionResult {
  pub exit_code: i32,
  pub stdout: String,
  pub stderr: String,
  pub duration_ms: u64,
  pub final_progress: Option<FFmpegProgress>,
}

/// Прогресс выполнения FFmpeg
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegProgress {
  pub percentage: f32,
  pub current_frame: u64,
  pub total_frames: Option<u64>,
  pub elapsed_time_secs: u64,
  pub message: Option<String>,
}
