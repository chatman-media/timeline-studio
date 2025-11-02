//! Type definitions for Smart Montage Planner module

use serde::{Deserialize, Serialize};

// Re-export composition analyzer types
pub use crate::montage_planner::services::composition_analyzer::{
  CompositionEnhancedDetection, CompositionWeights,
};

/// Enhanced detection result that includes montage-specific analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MontageDetection {
  pub timestamp: f64,
  pub detection_type: DetectionType,
  pub objects: Vec<ObjectDetection>,
  pub faces: Vec<FaceDetection>,
  pub composition_score: CompositionScore,
  pub activity_level: f32,
  pub emotional_tone: EmotionalTone,
}

/// Type of detection performed
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DetectionType {
  Object,
  Face,
  Scene,
  Combined,
}

/// Enhanced object detection with montage analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObjectDetection {
  pub class: String,
  pub confidence: f32,
  pub bbox: BoundingBox,
  pub tracking_id: Option<u32>,
  pub movement_vector: Option<(f32, f32)>,
  pub visual_importance: f32,
}

/// Enhanced face detection with emotion analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceDetection {
  pub confidence: f32,
  pub bbox: BoundingBox,
  pub tracking_id: Option<u32>,
  pub emotion: EmotionalTone,
  pub gaze_direction: Option<GazeDirection>,
  pub face_quality: f32,
}

/// Bounding box coordinates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  pub x: f32,
  pub y: f32,
  pub width: f32,
  pub height: f32,
}

/// Composition analysis score
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompositionScore {
  pub rule_of_thirds: f32,  // 0-100: adherence to rule of thirds
  pub balance: f32,         // 0-100: visual balance
  pub focus_clarity: f32,   // 0-100: main subject clarity
  pub depth_of_field: f32,  // 0-100: depth perception
  pub leading_lines: f32,   // 0-100: presence of leading lines
  pub symmetry: f32,        // 0-100: symmetrical composition
  pub overall_score: f32,   // 0-100: weighted average
  pub activity_score: f32,  // 0-100: activity level in scene
  pub face_count: u32,      // number of faces detected
  pub face_prominence: f32, // 0-100: prominence of faces
  pub scene_depth: f32,     // 0-100: perceived depth of scene
  pub confidence: f32,      // 0-100: overall confidence in analysis
  pub brightness: f32,      // 0-100: brightness level
  pub contrast: f32,        // 0-100: contrast level
  pub saturation: f32,      // 0-100: color saturation
  pub sharpness: f32,       // 0-100: image sharpness
  pub clarity: f32,         // 0-100: image clarity
  pub stability: f32,       // 0-100: image stability
}

/// Emotional tone detected from faces or scene
#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq, Default)]
pub enum EmotionalTone {
  #[default]
  Neutral,
  Happy,
  Sad,
  Angry,
  Surprised,
  Fear,
  Disgust,
  Excited,
  Calm,
  Tense,
}

/// Gaze direction for face analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GazeDirection {
  Camera,
  Left,
  Right,
  Up,
  Down,
  Away,
}

/// Video quality analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoQualityAnalysis {
  pub resolution: Resolution,
  pub frame_rate: f32,
  pub bitrate: u64,
  pub sharpness: f32,     // 0-100
  pub stability: f32,     // 0-100 (lower = more stable)
  pub exposure: f32,      // -100 to 100 (0 = perfect)
  pub color_grading: f32, // 0-100 (consistency)
  pub noise_level: f32,   // 0-100 (lower = less noise)
  pub dynamic_range: f32, // 0-100
}

/// Video resolution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resolution {
  pub width: u32,
  pub height: u32,
}

/// Audio analysis result for montage planning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioAnalysisResult {
  pub content_type: AudioContentType,
  pub speech_presence: f32, // 0-100: percentage of speech
  pub music_presence: f32,  // 0-100: percentage of music
  pub ambient_level: f32,   // 0-100: background noise level
  pub emotional_tone: EmotionalTone,
  pub tempo: Option<f32>,     // BPM if music detected
  pub beat_markers: Vec<f64>, // Timestamps of detected beats
  pub energy_level: f32,      // 0-100: overall energy
  pub dynamic_range: f32,     // 0-100: audio dynamic range
}

/// Type of audio content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioContentType {
  Speech,
  Music,
  Ambient,
  Mixed,
  Silence,
}

/// Moment detection result for montage planning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedMoment {
  pub timestamp: f64,
  pub duration: f64,
  pub category: MomentCategory,
  pub scores: MomentScores,
  pub total_score: f32,
  pub description: String,
  pub tags: Vec<String>,
}

/// Categories of detected moments
#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq)]
pub enum MomentCategory {
  Action,
  Drama,
  Comedy,
  Transition,
  Highlight,
  Opening,
  Closing,
  BRoll,
}

/// Detailed scoring for moments
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MomentScores {
  pub visual: f32,      // 0-100: visual appeal
  pub technical: f32,   // 0-100: technical quality
  pub emotional: f32,   // 0-100: emotional impact
  pub narrative: f32,   // 0-100: narrative value
  pub action: f32,      // 0-100: action level
  pub composition: f32, // 0-100: frame composition
}

/// Montage plan configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MontageConfig {
  pub style: MontageStyle,
  pub target_duration: f64,
  pub quality_threshold: f32,
  pub diversity_weight: f32,
  pub rhythm_sync: bool,
  pub max_cuts_per_minute: Option<u32>,
}

/// Montage style presets
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MontageStyle {
  DynamicAction,
  CinematicDrama,
  MusicVideo,
  Documentary,
  SocialMedia,
  Corporate,
  Travel,
  Wedding,
}

/// Generated montage plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MontagePlan {
  pub id: String,
  pub name: String,
  pub style: MontageStyle,
  pub total_duration: f64,
  pub clips: Vec<MontageClip>,
  pub transitions: Vec<TransitionPlan>,
  pub quality_score: f32,
  pub engagement_score: f32,
  pub created_at: String,
}

/// Individual clip in montage plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MontageClip {
  pub id: String,
  pub source_file: String,
  pub start_time: f64,
  pub end_time: f64,
  pub duration: f64,
  pub moment: DetectedMoment,
  pub adjustments: ClipAdjustments,
  pub order: u32,
}

/// Adjustments to apply to a clip
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipAdjustments {
  pub speed_multiplier: Option<f32>,
  pub color_correction: Option<ColorCorrection>,
  pub stabilization: bool,
  pub crop: Option<CropRegion>,
  pub fade_in: Option<f64>,
  pub fade_out: Option<f64>,
}

/// Color correction parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorCorrection {
  pub brightness: f32, // -100 to 100
  pub contrast: f32,   // -100 to 100
  pub saturation: f32, // -100 to 100
  pub hue: f32,        // -180 to 180
}

/// Crop region definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CropRegion {
  pub x: f32,      // 0-1 (percentage)
  pub y: f32,      // 0-1 (percentage)
  pub width: f32,  // 0-1 (percentage)
  pub height: f32, // 0-1 (percentage)
}

/// Transition between clips
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionPlan {
  pub from_clip: String,
  pub to_clip: String,
  pub transition_type: TransitionType,
  pub duration: f64,
  pub easing: EasingType,
}

/// Types of transitions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransitionType {
  Cut,
  Fade,
  Dissolve,
  Wipe,
  Slide,
  Zoom,
  Spin,
}

/// Easing functions for transitions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EasingType {
  Linear,
  EaseIn,
  EaseOut,
  EaseInOut,
  Bounce,
}

/// Analysis options for montage planning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisOptions {
  pub enable_object_detection: bool,
  pub enable_face_detection: bool,
  pub enable_emotion_analysis: bool,
  pub enable_composition_analysis: bool,
  pub enable_audio_analysis: bool,
  pub frame_sample_rate: f32,     // frames per second to analyze
  pub quality_threshold: f32,     // minimum quality for inclusion
  pub max_moments: Option<usize>, // limit number of detected moments
  pub frame_sampling_rate: f32,   // frames per second sampling rate
}

/// Video quality analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoQualityResult {
  pub overall_score: f32,
  pub sharpness: f32,
  pub noise_level: f32,
  pub color_accuracy: f32,
  pub stability: f32,
  pub exposure: f32,
  pub contrast: f32,
  pub saturation: f32,
  pub resolution_score: f32,
  pub frame_rate_consistency: f32,
}

/// Video metadata information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoMetadata {
  pub duration: f64,
  pub width: u32,
  pub height: u32,
  pub fps: f32,
  pub total_frames: u64,
}

/// Extracted frame information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedFrame {
  pub timestamp: f64,
  pub frame_number: u64,
  pub image_path: String,
  pub width: u32,
  pub height: u32,
}

/// Progress information for long-running operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisProgress {
  pub stage: String,
  pub progress: f32, // 0-100
  pub current_file: Option<String>,
  pub eta_seconds: Option<u64>,
  pub message: String,
}

/// Error types for montage planner
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MontageError {
  VideoAnalysisError(String),
  AudioAnalysisError(String),
  YoloProcessingError(String),
  PlanGenerationError(String),
  FileNotFound(String),
  InvalidConfiguration(String),
  InsufficientContent(String),
}

impl std::fmt::Display for MontageError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      MontageError::VideoAnalysisError(msg) => write!(f, "Video analysis error: {msg}"),
      MontageError::AudioAnalysisError(msg) => write!(f, "Audio analysis error: {msg}"),
      MontageError::YoloProcessingError(msg) => write!(f, "YOLO processing error: {msg}"),
      MontageError::PlanGenerationError(msg) => write!(f, "Plan generation error: {msg}"),
      MontageError::FileNotFound(msg) => write!(f, "File not found: {msg}"),
      MontageError::InvalidConfiguration(msg) => write!(f, "Invalid configuration: {msg}"),
      MontageError::InsufficientContent(msg) => write!(f, "Insufficient content: {msg}"),
    }
  }
}

impl std::error::Error for MontageError {}
