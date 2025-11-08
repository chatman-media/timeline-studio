//! Unified Types Module
//!
//! Централизованная система типов для всей analysis подсистемы.
//! Решает проблемы несогласованности между:
//! - Frontend TypeScript types (src/domains/ai-services/types/interfaces.ts)
//! - Backend Rust types (analysis, media, montage_planner)
//! - Audio types (f32 vs f64 precision)
//! - Media file representations
//!
//! Эти типы являются "источником правды" для миграции AI-сервисов.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

use super::content_classification::*;
use crate::analysis::models::MediaType;

// ============================================================================
// MEDIA FILE TYPES - Unified Media Representation
// ============================================================================

/// Unified Media File representation
/// Совместим с frontend MediaFile и различными backend представлениями
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UnifiedMediaFile {
  /// Unique identifier
  pub id: String,

  /// Полный путь к файлу
  pub path: String,

  /// Имя файла (с расширением)
  pub filename: String,

  /// Размер файла в байтах
  pub size: f64,

  /// Тип медиа
  #[serde(rename = "type")]
  pub media_type: UnifiedMediaType,

  /// Длительность (для видео/аудио)
  pub duration: Option<f64>,

  /// Формат/расширение файла
  pub format: Option<String>,

  /// Метаданные медиа
  pub metadata: Option<UnifiedMediaMetadata>,

  /// Время создания
  pub created_at: Option<DateTime<Utc>>,
}

/// Unified Media Type
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UnifiedMediaType {
  Video,
  Audio,
  Image,
}

/// Unified Media Metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UnifiedMediaMetadata {
  // Video metadata
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub fps: Option<f64>,
  pub video_codec: Option<String>,
  pub video_bitrate: Option<f64>,

  // Audio metadata
  pub audio_codec: Option<String>,
  pub audio_bitrate: Option<f64>,
  pub sample_rate: Option<u32>,
  pub channels: Option<u8>,
  pub has_audio: bool,

  // Common metadata
  pub format: Option<String>,
  pub creation_time: Option<String>,
}

// ============================================================================
// SCENE ANALYSIS TYPES
// ============================================================================

/// Scene Analysis Result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SceneAnalysis {
  pub id: String,

  /// Media file ID
  pub file_id: String,

  /// Временные границы
  pub start_time: f64,
  pub end_time: f64,
  pub duration: f64,

  /// Тип сцены
  pub scene_type: SceneType,

  /// Уверенность классификации (0-1)
  pub confidence: f64,

  /// Ключевые кадры (timestamps)
  pub key_frames: Vec<f64>,

  /// AI-generated описание
  pub description: Option<String>,

  /// Визуальные характеристики
  pub visual: Option<VisualCharacteristics>,

  /// Аудио характеристики
  pub audio: Option<AudioCharacteristics>,

  /// Объекты в сцене
  pub objects: Vec<String>,

  /// Persons present (IDs)
  pub persons: Vec<String>,

  /// Transition information
  pub transition: Option<TransitionInfo>,
}

/// Scene Type Classification
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SceneType {
  Dialog,
  Action,
  Landscape,
  Closeup,
  Transition,
  Static,
  Dynamic,
  Interview,
  Establishing,
  Reaction,
  Montage,
  Opening,
  Ending,
  Unknown,
}

/// Visual Characteristics of a Scene
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct VisualCharacteristics {
  /// Dominant colors (hex)
  pub dominant_colors: Vec<String>,

  /// Brightness (0-1)
  pub brightness: f64,

  /// Contrast (0-1)
  pub contrast: f64,

  /// Saturation (0-1)
  pub saturation: f64,

  /// Motion level (0-1)
  pub motion_level: f64,

  /// Composition score (0-1)
  pub composition_score: f64,

  /// Sharpness (0-1)
  pub sharpness: f64,

  /// Noise level (0-1)
  pub noise_level: f64,
}

/// Audio Characteristics of a Scene
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AudioCharacteristics {
  /// Has speech
  pub has_speech: bool,

  /// Has music
  pub has_music: bool,

  /// Volume level (0-1)
  pub volume_level: f64,

  /// Clarity (0-1)
  pub clarity: f64,

  /// Dominant frequencies (Hz)
  pub dominant_frequencies: Vec<f64>,
}

/// Transition Information
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TransitionInfo {
  /// Transition type
  pub transition_type: String,

  /// Transition quality (0-1)
  pub quality: f64,

  /// Duration (seconds)
  pub duration: f64,
}

// ============================================================================
// VISION ANALYSIS TYPES
// ============================================================================

/// Object Detection Result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ObjectDetection {
  pub id: String,

  /// Object label/class
  pub label: String,

  /// Detection confidence (0-1)
  pub confidence: f64,

  /// Bounding box
  pub bounding_box: BoundingBox,

  /// Frame number
  pub frame_number: u32,

  /// Timestamp in video
  pub timestamp: f64,

  /// Additional attributes
  pub attributes: Option<HashMap<String, serde_json::Value>>,
}

/// Bounding Box
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BoundingBox {
  pub x: f64,
  pub y: f64,
  pub width: f64,
  pub height: f64,
}

/// Face Detection Result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FaceDetection {
  pub id: String,

  /// Detection confidence (0-1)
  pub confidence: f64,

  /// Bounding box
  pub bounding_box: BoundingBox,

  /// Face embedding (for identification)
  pub embedding: Option<Vec<f32>>,

  /// Detected emotions
  pub emotions: Option<HashMap<String, f64>>,

  /// Age estimation
  pub age: Option<u32>,

  /// Gender estimation
  pub gender: Option<String>,

  /// Timestamp in video
  pub timestamp: f64,
}

/// Text Detection/OCR Result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TextDetection {
  /// Extracted text
  pub text: String,

  /// Detection confidence (0-1)
  pub confidence: f64,

  /// Bounding box
  pub bounding_box: BoundingBox,

  /// Detected language
  pub language: Option<String>,

  /// Timestamp in video
  pub timestamp: f64,
}

/// Color Analysis Result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ColorAnalysis {
  /// Dominant colors
  pub dominant_colors: Vec<Color>,

  /// Color palette
  pub palette: Vec<Color>,

  /// Color temperature
  pub temperature: ColorTemperature,

  /// Saturation level
  pub saturation: SaturationLevel,

  /// Brightness level
  pub brightness: BrightnessLevel,
}

/// Color representation
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Color {
  pub r: u8,
  pub g: u8,
  pub b: u8,
  pub hex: String,
  pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum ColorTemperature {
  Warm,
  Cool,
  Neutral,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum SaturationLevel {
  High,
  Medium,
  Low,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum BrightnessLevel {
  Bright,
  Medium,
  Dark,
}

// ============================================================================
// MOMENT DETECTION TYPES
// ============================================================================

/// Key Moment Detection Result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct KeyMoment {
  pub id: String,

  /// Media file ID
  pub file_id: String,

  /// Timestamp in video (seconds)
  pub timestamp: f64,

  /// Duration of the moment (seconds)
  pub duration: f64,

  /// Moment type
  pub moment_type: MomentType,

  /// Overall importance score (0-1)
  pub importance_score: f64,

  /// Detailed scoring factors
  pub scoring: MomentScoring,

  /// AI-generated description
  pub description: String,

  /// Thumbnail timestamp
  pub thumbnail_timestamp: f64,

  /// Involved persons (IDs)
  pub persons: Vec<String>,

  /// Tags
  pub tags: Vec<String>,
}

/// Moment Type Classification
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MomentType {
  EmotionalPeak,
  ActionClimax,
  DialogueHighlight,
  VisualStunning,
  MusicSync,
  FaceReveal,
  QualityPeak,
  MotionPeak,
  AudioPeak,
  Highlight,
  UserDefined,
}

/// Detailed Moment Scoring Factors
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MomentScoring {
  // Emotional factors
  pub emotion_intensity: f64,
  pub emotion_variety: f64,
  pub emotional_change: f64,

  // Visual factors
  pub visual_quality: f64,
  pub composition_quality: f64,
  pub motion_interest: f64,

  // Audio factors
  pub audio_clarity: f64,
  pub audio_dynamics: f64,
  pub music_sync: f64,

  // Content factors
  pub person_prominence: f64,
  pub scene_uniqueness: f64,

  // Overall confidence
  pub confidence: f64,
}

// ============================================================================
// CONTENT ANALYSIS TYPES
// ============================================================================

/// Content Quality Analysis
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ContentQuality {
  /// Overall quality score (0-100)
  pub overall: f64,

  /// Video quality metrics
  pub video: Option<VideoQualityMetrics>,

  /// Audio quality metrics
  pub audio: Option<AudioQualityMetrics>,

  /// Detected issues
  pub issues: Vec<String>,

  /// Improvement recommendations
  pub recommendations: Vec<String>,
}

/// Video Quality Metrics
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct VideoQualityMetrics {
  pub sharpness: f64,
  pub brightness: f64,
  pub contrast: f64,
  pub saturation: f64,
  pub noise: f64,
  pub stability: f64,
}

/// Audio Quality Metrics
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AudioQualityMetrics {
  pub clarity: f64,
  pub volume: f64,
  pub clipping: bool,
  pub noise_level: f64,
  pub dynamic_range: f64,
}

/// Motion Analysis Result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MotionAnalysis {
  /// Motion intensity (0-100)
  pub motion_intensity: f64,

  /// Camera movement type
  pub camera_movement: Option<CameraMovement>,

  /// Stability score (0-1)
  pub stability_score: f64,

  /// Motion vectors
  pub motion_vectors: Vec<MotionVector>,
}

/// Camera Movement Type
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CameraMovement {
  #[serde(rename = "type")]
  pub movement_type: CameraMovementType,
  pub intensity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum CameraMovementType {
  Static,
  Pan,
  Tilt,
  Zoom,
  Shake,
}

/// Motion Vector
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MotionVector {
  pub timestamp: f64,
  pub x: f64,
  pub y: f64,
  pub magnitude: f64,
  pub direction: f64,
}

// ============================================================================
// COMPREHENSIVE ANALYSIS RESULT
// ============================================================================

/// Unified Analysis Result - The "single source of truth"
/// Объединяет все типы анализа в один результат
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UnifiedAnalysisResult {
  /// Analysis ID
  pub id: String,

  /// Media file
  pub media_file: UnifiedMediaFile,

  /// Audio analysis (from Unified Audio Analyzer)
  pub audio: Option<serde_json::Value>, // Use unified audio types

  /// Video metadata
  pub video: Option<VideoAnalysisMetadata>,

  /// Detected scenes
  pub scenes: Vec<SceneAnalysis>,

  /// Detected key moments
  pub moments: Vec<KeyMoment>,

  /// Content classification
  pub classification: Option<ExtendedContentClassification>,

  /// Quality analysis
  pub quality: Option<ContentQuality>,

  /// Motion analysis
  pub motion: Option<MotionAnalysis>,

  /// Detected objects
  pub objects: Vec<ObjectDetection>,

  /// Detected faces
  pub faces: Vec<FaceDetection>,

  /// Detected text
  pub text: Vec<TextDetection>,

  /// Color analysis
  pub colors: Option<ColorAnalysis>,

  /// Processing metadata
  pub metadata: AnalysisMetadata,
}

/// Video Analysis Metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct VideoAnalysisMetadata {
  pub duration: f64,
  pub fps: f64,
  pub resolution: ResolutionData,
  pub codec: String,
  pub bitrate: f64,
}

/// Resolution Data
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ResolutionData {
  pub width: u32,
  pub height: u32,
}

/// Analysis Metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisMetadata {
  /// Processing time (seconds)
  pub processing_time: f64,

  /// Engine version
  pub engine_version: String,

  /// Analysis timestamp
  pub analyzed_at: DateTime<Utc>,

  /// Analysis configuration
  pub config: AnalysisConfiguration,
}

/// Analysis Configuration
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisConfiguration {
  pub depth: AnalysisDepth,
  pub enable_scene_detection: bool,
  pub enable_moment_detection: bool,
  pub enable_object_detection: bool,
  pub enable_face_detection: bool,
  pub enable_text_detection: bool,
  pub enable_audio_analysis: bool,
  pub enable_quality_analysis: bool,
  pub enable_motion_analysis: bool,
  pub enable_classification: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum AnalysisDepth {
  Quick,
  Normal,
  Deep,
}

impl Default for AnalysisConfiguration {
  fn default() -> Self {
    Self {
      depth: AnalysisDepth::Normal,
      enable_scene_detection: true,
      enable_moment_detection: true,
      enable_object_detection: true,
      enable_face_detection: true,
      enable_text_detection: true,
      enable_audio_analysis: true,
      enable_quality_analysis: true,
      enable_motion_analysis: true,
      enable_classification: true,
    }
  }
}

// ============================================================================
// CONVERSION TRAITS - From Old Types to Unified Types
// ============================================================================

impl From<crate::media::types::MediaFile> for UnifiedMediaFile {
  fn from(media: crate::media::types::MediaFile) -> Self {
    let media_type = if media.is_video {
      UnifiedMediaType::Video
    } else if media.is_audio {
      UnifiedMediaType::Audio
    } else if media.is_image {
      UnifiedMediaType::Image
    } else {
      UnifiedMediaType::Video // default
    };

    Self {
      id: media.id,
      path: media.path.clone(),
      filename: media.name,
      size: media.size as f64,
      media_type,
      duration: media.duration,
      format: media.probe_data.format.format_name.clone(),
      metadata: Some(UnifiedMediaMetadata::from_probe_data(&media.probe_data)),
      created_at: chrono::DateTime::parse_from_rfc3339(&media.creation_time)
        .ok()
        .map(|dt| dt.with_timezone(&Utc)),
    }
  }
}

impl UnifiedMediaMetadata {
  fn from_probe_data(probe: &crate::media::types::ProbeData) -> Self {
    let video_stream = probe.streams.iter().find(|s| s.codec_type == "video");
    let audio_stream = probe.streams.iter().find(|s| s.codec_type == "audio");

    Self {
      width: video_stream.and_then(|s| s.width),
      height: video_stream.and_then(|s| s.height),
      fps: video_stream.and_then(|s| {
        s.r_frame_rate.as_ref().and_then(|r| {
          let parts: Vec<&str> = r.split('/').collect();
          if parts.len() == 2 {
            let num: f64 = parts[0].parse().ok()?;
            let den: f64 = parts[1].parse().ok()?;
            Some(num / den)
          } else {
            None
          }
        })
      }),
      video_codec: video_stream.and_then(|s| s.codec_name.clone()),
      video_bitrate: probe.format.bit_rate.as_ref().and_then(|b| b.parse().ok()),
      audio_codec: audio_stream.and_then(|s| s.codec_name.clone()),
      audio_bitrate: None, // Would need stream-specific bitrate
      sample_rate: audio_stream.and_then(|s| s.sample_rate.as_ref().and_then(|sr| sr.parse().ok())),
      channels: audio_stream.and_then(|s| s.channels),
      has_audio: audio_stream.is_some(),
      format: probe.format.format_name.clone(),
      creation_time: None,
    }
  }
}

impl From<MediaType> for UnifiedMediaType {
  fn from(mt: MediaType) -> Self {
    match mt {
      MediaType::Video => UnifiedMediaType::Video,
      MediaType::Audio => UnifiedMediaType::Audio,
      MediaType::Image => UnifiedMediaType::Image,
    }
  }
}

impl From<UnifiedMediaType> for MediaType {
  fn from(umt: UnifiedMediaType) -> Self {
    match umt {
      UnifiedMediaType::Video => MediaType::Video,
      UnifiedMediaType::Audio => MediaType::Audio,
      UnifiedMediaType::Image => MediaType::Image,
    }
  }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_unified_media_file_creation() {
    let media = UnifiedMediaFile {
      id: "test-id".to_string(),
      path: "/path/to/video.mp4".to_string(),
      filename: "video.mp4".to_string(),
      size: 1024000,
      media_type: UnifiedMediaType::Video,
      duration: Some(120.5),
      format: Some("mp4".to_string()),
      metadata: None,
      created_at: Some(Utc::now()),
    };

    assert_eq!(media.id, "test-id");
    assert_eq!(media.media_type, UnifiedMediaType::Video);
    assert_eq!(media.duration, Some(120.5));
  }

  #[test]
  fn test_scene_analysis_creation() {
    let scene = SceneAnalysis {
      id: "scene-1".to_string(),
      file_id: "file-1".to_string(),
      start_time: 0.0,
      end_time: 5.5,
      duration: 5.5,
      scene_type: SceneType::Dialog,
      confidence: 0.95,
      key_frames: vec![1.0, 2.5, 4.0],
      description: Some("Two people talking".to_string()),
      visual: None,
      audio: None,
      objects: vec!["person".to_string(), "chair".to_string()],
      persons: vec!["person-1".to_string(), "person-2".to_string()],
      transition: None,
    };

    assert_eq!(scene.scene_type, SceneType::Dialog);
    assert_eq!(scene.duration, 5.5);
    assert_eq!(scene.key_frames.len(), 3);
  }

  #[test]
  fn test_key_moment_creation() {
    let moment = KeyMoment {
      id: "moment-1".to_string(),
      file_id: "file-1".to_string(),
      timestamp: 45.2,
      duration: 2.5,
      moment_type: MomentType::EmotionalPeak,
      importance_score: 0.89,
      scoring: MomentScoring {
        emotion_intensity: 0.9,
        emotion_variety: 0.7,
        emotional_change: 0.8,
        visual_quality: 0.85,
        composition_quality: 0.88,
        motion_interest: 0.75,
        audio_clarity: 0.82,
        audio_dynamics: 0.79,
        music_sync: 0.9,
        person_prominence: 0.95,
        scene_uniqueness: 0.73,
        confidence: 0.89,
      },
      description: "Emotional reunion scene".to_string(),
      thumbnail_timestamp: 45.2,
      persons: vec!["person-1".to_string()],
      tags: vec!["emotional".to_string(), "reunion".to_string()],
    };

    assert_eq!(moment.moment_type, MomentType::EmotionalPeak);
    assert_eq!(moment.importance_score, 0.89);
    assert!(moment.scoring.emotion_intensity > 0.8);
  }

  #[test]
  fn test_media_type_conversion() {
    let mt = MediaType::Video;
    let umt: UnifiedMediaType = mt.into();
    assert_eq!(umt, UnifiedMediaType::Video);

    let mt_back: MediaType = umt.into();
    assert_eq!(mt_back, MediaType::Video);
  }
}
