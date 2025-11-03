//! Simple tests for montage planner services

use super::super::*;
use crate::montage_planner::types::*;
use crate::recognition::commands::yolo_commands::YoloProcessorState;
use std::sync::Arc;
use tokio::sync::RwLock;

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_service_creation() {
    // Test that all services can be created
    let _activity_calculator = ActivityCalculator::new();
    let _audio_analyzer = AudioAnalyzer::new();
    let _composition_analyzer = CompositionAnalyzer::new();
    let _moment_detector = MomentDetector::new();
    let _plan_generator = PlanGenerator::new();
    let _quality_analyzer = VideoQualityAnalyzer::new();

    let yolo_state = Arc::new(RwLock::new(YoloProcessorState::default()));
    let _video_processor = VideoProcessor::new(yolo_state);
  }

  #[test]
  fn test_serialization() {
    // Test basic serialization of key types
    let analysis_options = AnalysisOptions {
      enable_object_detection: true,
      enable_face_detection: true,
      enable_emotion_analysis: true,
      enable_composition_analysis: true,
      enable_audio_analysis: true,
      frame_sample_rate: 1.0,
      quality_threshold: 50.0,
      max_moments: Some(10),
      frame_sampling_rate: 1.0,
    };

    let json = serde_json::to_string(&analysis_options).expect("Serialization failed");
    let _deserialized: AnalysisOptions =
      serde_json::from_str(&json).expect("Deserialization failed");

    let video_quality = VideoQualityResult {
      overall_score: 75.0,
      sharpness: 80.0,
      noise_level: 15.0,
      color_accuracy: 85.0,
      stability: 90.0,
      exposure: 70.0,
      contrast: 78.0,
      saturation: 82.0,
      resolution_score: 95.0,
      frame_rate_consistency: 98.0,
    };

    let json = serde_json::to_string(&video_quality).expect("Serialization failed");
    let _deserialized: VideoQualityResult =
      serde_json::from_str(&json).expect("Deserialization failed");
  }

  #[test]
  fn test_emotional_tone() {
    // Test that EmotionalTone variants work
    let emotions = vec![
      EmotionalTone::Neutral,
      EmotionalTone::Happy,
      EmotionalTone::Sad,
      EmotionalTone::Angry,
      EmotionalTone::Surprised,
      EmotionalTone::Fear,
      EmotionalTone::Disgust,
      EmotionalTone::Excited,
      EmotionalTone::Calm,
      EmotionalTone::Tense,
    ];

    for emotion in emotions {
      let json = serde_json::to_string(&emotion).expect("Serialization failed");
      let _deserialized: EmotionalTone =
        serde_json::from_str(&json).expect("Deserialization failed");
    }
  }

  #[test]
  fn test_moment_categories() {
    // Test that MomentCategory variants work
    let categories = vec![
      MomentCategory::Action,
      MomentCategory::Drama,
      MomentCategory::Comedy,
      MomentCategory::Transition,
      MomentCategory::Highlight,
    ];

    for category in categories {
      let json = serde_json::to_string(&category).expect("Serialization failed");
      let _deserialized: MomentCategory =
        serde_json::from_str(&json).expect("Deserialization failed");
    }
  }

  #[test]
  fn test_bounding_box() {
    let bbox = BoundingBox {
      x: 100.0,
      y: 200.0,
      width: 150.0,
      height: 250.0,
    };

    let json = serde_json::to_string(&bbox).expect("Serialization failed");
    let deserialized: BoundingBox = serde_json::from_str(&json).expect("Deserialization failed");

    assert_eq!(bbox.x, deserialized.x);
    assert_eq!(bbox.y, deserialized.y);
    assert_eq!(bbox.width, deserialized.width);
    assert_eq!(bbox.height, deserialized.height);
  }

  #[test]
  fn test_composition_score() {
    let score = CompositionScore {
      rule_of_thirds: 80.0,
      balance: 70.0,
      focus_clarity: 75.0,
      depth_of_field: 60.0,
      leading_lines: 50.0,
      symmetry: 65.0,
      overall_score: 72.0,
      ..Default::default()
    };

    let json = serde_json::to_string(&score).expect("Serialization failed");
    let deserialized: CompositionScore =
      serde_json::from_str(&json).expect("Deserialization failed");

    assert_eq!(score.overall_score, deserialized.overall_score);
    assert_eq!(score.rule_of_thirds, deserialized.rule_of_thirds);
  }

  #[test]
  fn test_video_metadata() {
    let metadata = VideoMetadata {
      duration: 120.5,
      width: 1920,
      height: 1080,
      fps: 30.0,
      total_frames: 3615,
    };

    let json = serde_json::to_string(&metadata).expect("Serialization failed");
    let deserialized: VideoMetadata = serde_json::from_str(&json).expect("Deserialization failed");

    assert_eq!(metadata.duration, deserialized.duration);
    assert_eq!(metadata.width, deserialized.width);
    assert_eq!(metadata.height, deserialized.height);
    assert_eq!(metadata.fps, deserialized.fps);
    assert_eq!(metadata.total_frames, deserialized.total_frames);
  }

  #[test]
  fn test_extracted_frame() {
    let frame = ExtractedFrame {
      timestamp: 5.5,
      frame_number: 165,
      image_path: "/tmp/frame_5.500.jpg".to_string(),
      width: 1920,
      height: 1080,
    };

    let json = serde_json::to_string(&frame).expect("Serialization failed");
    let deserialized: ExtractedFrame = serde_json::from_str(&json).expect("Deserialization failed");

    assert_eq!(frame.timestamp, deserialized.timestamp);
    assert_eq!(frame.frame_number, deserialized.frame_number);
    assert_eq!(frame.image_path, deserialized.image_path);
    assert_eq!(frame.width, deserialized.width);
    assert_eq!(frame.height, deserialized.height);
  }

  #[tokio::test]
  async fn test_error_handling() {
    let analyzer = VideoQualityAnalyzer::new();
    let result = analyzer.analyze_quality("nonexistent.mp4").await;

    assert!(result.is_err());
    match result.unwrap_err() {
      MontageError::FileNotFound(_) => (),
      _ => panic!("Expected FileNotFound error"),
    }
  }

  #[test]
  fn test_montage_error_display() {
    let errors = vec![
      MontageError::VideoAnalysisError("test video error".to_string()),
      MontageError::AudioAnalysisError("test audio error".to_string()),
      MontageError::YoloProcessingError("test yolo error".to_string()),
      MontageError::PlanGenerationError("test plan error".to_string()),
      MontageError::FileNotFound("test.mp4".to_string()),
      MontageError::InvalidConfiguration("test config error".to_string()),
      MontageError::InsufficientContent("test content error".to_string()),
    ];

    for error in errors {
      let error_string = format!("{}", error);
      assert!(!error_string.is_empty());
      assert!(error_string.len() > 10); // Should have meaningful message
    }
  }
}
