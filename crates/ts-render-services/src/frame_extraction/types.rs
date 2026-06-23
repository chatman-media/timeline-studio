//! Типы для работы с извлечением кадров

use serde::{Deserialize, Serialize};

/// Кадр таймлайна
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineFrame {
  pub timestamp: f64,
  pub frame_data: Vec<u8>,
  pub width: u32,
  pub height: u32,
}

/// Результат кадра субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleFrameResult {
  pub subtitle_id: String,
  pub timestamp: f64,
  pub frame_path: String,
  pub width: u32,
  pub height: u32,
}

/// Запрос на превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewRequest {
  pub video_path: String,
  pub timestamp: f64,
  pub resolution: Option<(u32, u32)>,
  pub quality: Option<u8>,
}

/// Параметры для извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameExtractionParams {
  pub video_path: String,
  pub timestamps: Vec<f64>,
  pub output_format: FrameFormat,
  pub resolution: Option<(u32, u32)>,
  pub quality: Option<u8>,
}

/// Формат кадра
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FrameFormat {
  Jpeg,
  Png,
  Webp,
}

/// Результат извлечения кадра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedFrame {
  pub timestamp: f64,
  pub data: Vec<u8>,
  pub width: u32,
  pub height: u32,
  pub format: FrameFormat,
}
