use serde::{Deserialize, Serialize};

/// Кадр для мультимодального анализа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedFrame {
  pub image_path: String,
  pub timestamp: f64,
  pub width: u32,
  pub height: u32,
  pub format: String,
}

/// Параметры извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameExtractionParams {
  pub clip_id: String,
  pub sampling_rate: f64, // кадров в секунду
  pub max_frames: u32,
  pub output_format: String,      // jpg, png
  pub quality: u32,               // 1-31 для JPEG
  pub resolution: Option<String>, // "1920x1080" или "auto"
}

/// Результат извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameExtractionResult {
  pub frames: Vec<ExtractedFrame>,
  pub total_extracted: u32,
  pub video_duration: f64,
  pub extraction_time_ms: u64,
}

/// Информация о видео
#[derive(Debug, Clone)]
pub struct VideoInfo {
  pub duration: f64,
  pub width: u32,
  pub height: u32,
  pub fps: f64,
}

/// Информация об изображении  
#[derive(Debug, Clone)]
pub struct ImageInfo {
  pub width: u32,
  pub height: u32,
  pub format: String,
}
