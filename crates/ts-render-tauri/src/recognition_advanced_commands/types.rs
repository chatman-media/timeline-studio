//! Типы данных для продвинутых команд распознавания

use serde::{Deserialize, Serialize};

/// Информация о классах модели
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelClassInfo {
  pub class_names: Vec<String>,
  pub total_classes: usize,
  pub model_type: String,
  pub confidence_threshold: f32,
}

/// Информация о модели YOLO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YoloModelInfo {
  pub model_path: String,
  pub model_type: String,
  pub is_face_model: bool,
  pub is_segmentation_model: bool,
  pub input_size: (u32, u32),
  pub classes_count: usize,
}

/// Статус модели
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelStatus {
  pub is_loaded: bool,
  pub model_type: String,
  pub load_time_ms: u64,
  pub memory_usage_mb: f64,
  pub last_inference_ms: Option<u64>,
}

/// Параметры для поиска результатов по времени
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRangeParams {
  pub start_time: f64,
  pub end_time: f64,
  pub confidence_threshold: Option<f32>,
}

/// Результат распознавания кадра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameRecognitionResult {
  pub timestamp: f64,
  pub detections: Vec<Detection>,
  pub confidence_avg: f32,
  pub processing_time_ms: u64,
}

/// Обнаружение объекта
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
  pub class_name: String,
  pub confidence: f32,
  pub bbox: BoundingBox,
}

/// Ограничивающий прямоугольник
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  pub x: f32,
  pub y: f32,
  pub width: f32,
  pub height: f32,
}

/// Сегмент timeline с результатами распознавания
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineSegment {
  pub start_time: f64,
  pub end_time: f64,
  pub class_name: String,
  pub confidence: f32,
  pub frame_count: usize,
}
