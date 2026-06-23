//! Типы для команд генерации превью

use serde::{Deserialize, Serialize};

/// Параметры для генерации анимированного превью
#[derive(Debug, Clone, Deserialize)]
pub struct AnimatedPreviewParams {
  pub video_path: String,
  pub start_time: f64,
  pub output_path: String,
  pub width: u32,
  pub height: u32,
  pub fps: u32,
  pub duration: f64,
}

/// Настройки для генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewSettings {
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub quality: Option<u8>,
  pub cache_enabled: Option<bool>,
}

/// Информация о кэшированном превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedPreviewInfo {
  pub id: String,
  pub data_size: usize,
  pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Запрос на генерацию превью (команды)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandPreviewRequest {
  pub preview_type: String,
  pub source_path: String,
  pub timestamp: Option<f64>,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub quality: Option<u8>,
}

/// Результат генерации превью (команды)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandPreviewResult {
  pub path: String,
  pub size: usize,
  pub resolution: (u32, u32),
  pub format: String,
}

/// Параметры для генерации миниатюр
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailParams {
  pub video_path: String,
  pub output_dir: String,
  pub count: u32,
  pub width: u32,
  pub height: u32,
  pub interval: f64,
}

/// Параметры для генерации раскадровки
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoryboardParams {
  pub output_path: String,
  pub frames_per_row: u32,
  pub frame_width: u32,
  pub frame_height: u32,
  pub columns: u32,
  pub rows: u32,
}

/// Параметры для генерации waveform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WaveformParams {
  pub audio_path: String,
  pub output_path: String,
  pub width: u32,
  pub height: u32,
  pub color: String,
}
