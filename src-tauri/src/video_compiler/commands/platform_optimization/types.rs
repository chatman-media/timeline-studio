//! Типы для модуля platform_optimization

use serde::{Deserialize, Serialize};
use specta::Type;

/// Результат оптимизации для платформы
#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformOptimizationResult {
  pub success: bool,
  pub output_path: String,
  pub file_size: u64,
  pub duration: f64,
  pub width: u32,
  pub height: u32,
  pub bitrate: u32,
  pub compression_ratio: f64,
  pub processing_time: f64,
  pub message: String,
}

/// Результат генерации миниатюры
#[derive(Debug, Serialize, Deserialize)]
pub struct ThumbnailGenerationResult {
  pub success: bool,
  pub thumbnail_path: String,
  pub width: u32,
  pub height: u32,
  pub file_size: u64,
  pub message: String,
}

/// Параметры оптимизации для платформы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformOptimizationParams {
  pub input_path: String,
  pub output_path: String,
  pub target_width: u32,
  pub target_height: u32,
  pub target_bitrate: u32,
  pub target_framerate: u32,
  pub audio_codec: String,
  pub video_codec: String,
  pub crop_to_fit: bool,
}

/// Метаданные видеофайла для платформенной оптимизации
#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformVideoMetadata {
  pub width: u32,
  pub height: u32,
  pub duration: f64,
  pub bitrate: u32,
  pub framerate: f64,
  pub codec: String,
  pub file_size: u64,
}

/// Параметры для генерации миниатюры для платформы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformThumbnailParams {
  pub input_path: String,
  pub output_path: String,
  pub width: u32,
  pub height: u32,
  pub timestamp: f64,
  pub quality: Option<u8>,
}

/// Типы платформ для оптимизации
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "PascalCase")]
pub enum PlatformType {
  YouTube,
  Instagram,
  TikTok,
  Facebook,
  Twitter,
  Custom,
}

/// Профили оптимизации для разных платформ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformProfile {
  pub platform: PlatformType,
  pub max_width: u32,
  pub max_height: u32,
  pub max_bitrate: u32,
  pub max_framerate: u32,
  pub preferred_codec: String,
  pub max_duration: Option<f64>,
  pub audio_codec: String,
}

/// Результат анализа совместимости с платформой
#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformCompatibilityResult {
  pub platform: PlatformType,
  pub compatible: bool,
  pub issues: Vec<String>,
  pub recommendations: Vec<String>,
  pub estimated_processing_time: f64,
}

impl PlatformProfile {
  /// Получить профиль для YouTube
  pub fn youtube() -> Self {
    Self {
      platform: PlatformType::YouTube,
      max_width: 1920,
      max_height: 1080,
      max_bitrate: 8000,
      max_framerate: 60,
      preferred_codec: "h264".to_string(),
      max_duration: None,
      audio_codec: "aac".to_string(),
    }
  }

  /// Получить профиль для Instagram
  pub fn instagram() -> Self {
    Self {
      platform: PlatformType::Instagram,
      max_width: 1080,
      max_height: 1080,
      max_bitrate: 3500,
      max_framerate: 30,
      preferred_codec: "h264".to_string(),
      max_duration: Some(60.0),
      audio_codec: "aac".to_string(),
    }
  }

  /// Получить профиль для TikTok
  pub fn tiktok() -> Self {
    Self {
      platform: PlatformType::TikTok,
      max_width: 1080,
      max_height: 1920,
      max_bitrate: 2500,
      max_framerate: 30,
      preferred_codec: "h264".to_string(),
      max_duration: Some(180.0),
      audio_codec: "aac".to_string(),
    }
  }
}
