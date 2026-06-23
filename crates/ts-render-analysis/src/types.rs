//! Типы данных для анализа видео

use serde::{Deserialize, Serialize};

/// Метаданные видеофайла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoMetadata {
  pub duration: f64, // в секундах
  pub width: u32,
  pub height: u32,
  pub fps: f64,
  pub bitrate: u64,
  pub codec: String,
  pub format: String,
  pub has_audio: bool,
  pub audio_codec: Option<String>,
  pub audio_channels: Option<u32>,
  pub audio_sample_rate: Option<u32>,
  pub file_size: u64,
}

/// Результат детекции сцен
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneDetectionResult {
  pub scenes: Vec<Scene>,
  pub total_scenes: u32,
  pub average_scene_length: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
  pub start_time: f64,
  pub end_time: f64,
  pub confidence: f64,
  pub thumbnail_path: Option<String>,
}

/// Результат анализа качества видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityAnalysisResult {
  pub overall: f64,        // 0-1, общая оценка качества
  pub sharpness: f64,      // 0-1, резкость
  pub brightness: f64,     // 0-1, яркость
  pub contrast: f64,       // 0-1, контрастность
  pub saturation: f64,     // 0-1, насыщенность
  pub noise: f64,          // 0-1, уровень шума (меньше = лучше)
  pub stability: f64,      // 0-1, стабилизация (дрожание камеры)
  pub issues: Vec<String>, // список обнаруженных проблем
}

/// Результат детекции тишины
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SilenceDetectionResult {
  pub silences: Vec<SilenceSegment>,
  pub total_silence_duration: f64,
  pub speech_percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SilenceSegment {
  pub start_time: f64,
  pub end_time: f64,
  pub duration: f64,
  pub confidence: f64,
}

/// Результат анализа движения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MotionAnalysisResult {
  pub motion_intensity: f64, // 0-1, интенсивность движения
  pub camera_movement: CameraMovement,
  pub object_movement: f64, // 0-1, движение объектов в кадре
  pub motion_profile: Vec<MotionPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CameraMovement {
  pub panning: f64,   // 0-1, панорамирование
  pub tilting: f64,   // 0-1, наклон
  pub zooming: f64,   // 0-1, зум
  pub stability: f64, // 0-1, стабильность
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MotionPoint {
  pub timestamp: f64,
  pub intensity: f64,
}

/// Результат извлечения ключевых кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyFrameExtractionResult {
  pub key_frames: Vec<KeyFrame>,
  pub thumbnail_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyFrame {
  pub timestamp: f64,
  pub image_path: String,
  pub confidence: f64,
  pub description: Option<String>,
}

/// Результат анализа аудио
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioAnalysisResult {
  pub volume: VolumeData,
  pub frequency: FrequencyData,
  pub dynamics: DynamicsData,
  pub quality: AudioQuality,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeData {
  pub average: f64, // 0-1
  pub peak: f64,    // 0-1
  pub rms: f64,     // 0-1
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrequencyData {
  pub low_end: f64,   // 0-1, басы
  pub mid_range: f64, // 0-1, средние частоты
  pub high_end: f64,  // 0-1, высокие частоты
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DynamicsData {
  pub dynamic_range: f64, // 0-1
  pub compression_ratio: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioQuality {
  pub clipping: bool,
  pub noise_level: f64,     // 0-1
  pub overall_quality: f64, // 0-1
}
