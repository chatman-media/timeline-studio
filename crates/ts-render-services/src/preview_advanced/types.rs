//! Типы для расширенных команд превью

use serde::{Deserialize, Serialize};

/// Параметры для пакетной генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchPreviewParams {
  pub video_paths: Vec<String>,
  pub timestamps: Vec<f64>,
  pub width: u32,
  pub height: u32,
  pub quality: u8,
  pub output_dir: Option<String>,
}

/// Результат генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewResult {
  pub success: bool,
  pub width: u32,
  pub height: u32,
  pub timestamp: f64,
  pub preview_data: Vec<u8>,
  pub path: Option<String>,
  pub error: Option<String>,
}

/// Информация о возможностях генератора превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewGeneratorInfo {
  pub ffmpeg_path: String,
  pub supported_formats: Vec<String>,
  pub max_concurrent_jobs: usize,
  pub cache_enabled: bool,
}

/// Параметры для генерации превью с расширенными опциями
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvancedPreviewOptions {
  pub width: u32,
  pub height: u32,
  pub quality: u8,
  pub format: String,
  pub apply_filters: bool,
  pub watermark: Option<String>,
  pub output_dir: Option<String>,
}
