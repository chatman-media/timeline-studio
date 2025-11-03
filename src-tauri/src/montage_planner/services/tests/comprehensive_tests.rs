//! Comprehensive tests for montage planner services with real types

use super::super::*;
use crate::montage_planner::types::*;
use crate::recognition::commands::yolo_commands::YoloProcessorState;
use crate::recognition::frame_processor::{
  BoundingBox as YoloBoundingBox, Detection as YoloDetection,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[cfg(test)]
mod tests {
  use super::*;

  // Helper function to create realistic YOLO detection
  fn create_yolo_detection(
    class: &str,
    class_id: usize,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    confidence: f32,
  ) -> YoloDetection {
    YoloDetection {
      class: class.to_string(),
      class_id,
      confidence,
      bbox: YoloBoundingBox {
        x,
        y,
        width,
        height,
      },
      attributes: None,
    }
  }

  // Helper function to create test montage detection
  fn create_test_montage_detection(timestamp: f64, activity_level: f32) -> MontageDetection {
    MontageDetection {
      timestamp,
      detection_type: DetectionType::Combined,
      objects: vec![ObjectDetection {
        class: "person".to_string(),
        confidence: 0.9,
        bbox: BoundingBox {
          x: 100.0,
          y: 100.0,
          width: 80.0,
          height: 120.0,
        },
        tracking_id: Some(1),
        movement_vector: Some((5.0, 3.0)),
        visual_importance: 1.0,
      }],
      faces: vec![],
      composition_score: CompositionScore {
        rule_of_thirds: activity_level * 0.8,
        balance: activity_level * 0.9,
        focus_clarity: activity_level * 0.85,
        depth_of_field: activity_level * 0.7,
        leading_lines: activity_level * 0.6,
        symmetry: activity_level * 0.75,
        overall_score: activity_level,
        ..Default::default()
      },
      activity_level,
      emotional_tone: EmotionalTone::Happy,
    }
  }

  // Helper function to create realistic detected moment
  fn create_test_moment(timestamp: f64, duration: f64, category: MomentCategory) -> DetectedMoment {
    DetectedMoment {
      timestamp,
      duration,
      category: category.clone(),
      scores: MomentScores {
        visual: 75.0,
        technical: 80.0,
        emotional: 70.0,
        narrative: 65.0,
        action: 85.0,
        composition: 78.0,
      },
      total_score: 75.5,
      description: format!("{:?} moment at {:.1}s", category, timestamp),
      tags: vec![format!("{:?}", category).to_lowercase()],
    }
  }

  // Helper function to create realistic montage config
  fn create_test_montage_config() -> MontageConfig {
    MontageConfig {
      style: MontageStyle::DynamicAction,
      target_duration: 60.0,
      quality_threshold: 70.0,
      diversity_weight: 0.7,
      rhythm_sync: true,
      max_cuts_per_minute: Some(30),
    }
  }

  #[test]
  fn test_activity_calculator_comprehensive() {
    let mut calculator = ActivityCalculator::new();

    // Test with realistic detection sequence
    let detections = vec![
      create_test_montage_detection(1.0, 60.0),
      create_test_montage_detection(2.0, 75.0),
      create_test_montage_detection(3.0, 85.0),
      create_test_montage_detection(4.0, 70.0),
    ];

    let mut metrics_sequence = Vec::new();
    for detection in &detections {
      let metrics = calculator.calculate_activity(detection);
      metrics_sequence.push(metrics);
    }

    // Verify all metrics are valid
    for metrics in &metrics_sequence {
      assert!(metrics.overall_activity >= 0.0 && metrics.overall_activity <= 100.0);
      assert!(metrics.motion_intensity >= 0.0);
      assert!(metrics.scene_dynamics >= 0.0);
      assert!(metrics.object_count > 0);

      // Verify activity distribution is calculated
      let distribution = &metrics.activity_distribution;
      let total = distribution.left_quadrant
        + distribution.right_quadrant
        + distribution.top_quadrant
        + distribution.bottom_quadrant
        + distribution.center_region;
      assert!(total >= 0.0);
    }

    // Test tracking continuity - later frames should have motion data
    assert!(metrics_sequence[3].motion_intensity >= metrics_sequence[0].motion_intensity * 0.5);
  }

  #[test]
  fn test_composition_analyzer_comprehensive() {
    let analyzer = CompositionAnalyzer::new();

    // Test with different composition scenarios
    let test_scenarios = [
      // Rule of thirds positioning
      vec![create_yolo_detection(
        "person", 0, 640.0, 360.0, 80.0, 120.0, 0.9,
      )],
      // Balanced composition
      vec![
        create_yolo_detection("person", 0, 400.0, 400.0, 80.0, 120.0, 0.9),
        create_yolo_detection("car", 1, 1400.0, 400.0, 160.0, 80.0, 0.85),
      ],
      // Complex scene
      vec![
        create_yolo_detection("person", 0, 300.0, 300.0, 80.0, 120.0, 0.95),
        create_yolo_detection("car", 1, 800.0, 400.0, 200.0, 100.0, 0.9),
        create_yolo_detection("dog", 2, 1200.0, 500.0, 60.0, 40.0, 0.8),
      ],
    ];

    for (i, detections) in test_scenarios.iter().enumerate() {
      let result = analyzer.analyze_composition(detections, i as f64, 1920.0, 1080.0);
      assert!(result.is_ok(), "Failed scenario {}", i);

      let enhanced = result.unwrap();

      // Verify basic properties
      assert_eq!(enhanced.original_detections.len(), detections.len());
      assert!(enhanced.timestamp == i as f64);
      assert!(enhanced.visual_importance >= 0.0);
      assert!(enhanced.frame_dominance >= 0.0);

      // Verify composition score validity
      let score = &enhanced.composition_score;
      assert!(score.overall_score >= 0.0 && score.overall_score <= 100.0);
      assert!(score.rule_of_thirds >= 0.0 && score.rule_of_thirds <= 100.0);
      assert!(score.balance >= 0.0 && score.balance <= 100.0);
      assert!(score.focus_clarity >= 0.0 && score.focus_clarity <= 100.0);
      assert!(score.depth_of_field >= 0.0 && score.depth_of_field <= 100.0);
      assert!(score.leading_lines >= 0.0 && score.leading_lines <= 100.0);
      assert!(score.symmetry >= 0.0 && score.symmetry <= 100.0);
    }
  }

  #[test]
  fn test_moment_detector_comprehensive() {
    let detector = MomentDetector::new();

    // Create a realistic sequence of detections
    let detections = vec![
      create_test_montage_detection(1.0, 85.0), // High activity
      create_test_montage_detection(2.0, 75.0), // Medium-high activity
      create_test_montage_detection(3.0, 90.0), // Very high activity
      create_test_montage_detection(4.0, 65.0), // Medium activity
      create_test_montage_detection(5.0, 30.0), // Low activity (below threshold)
      create_test_montage_detection(6.0, 80.0), // High activity again
    ];

    let result = detector.detect_moments(&detections);
    assert!(result.is_ok());

    let moments = result.unwrap();

    // Should detect some moments from high activity detections
    assert!(!moments.is_empty());

    for moment in &moments {
      // Verify moment properties
      assert!(moment.timestamp >= 0.0);
      assert!(moment.duration > 0.0);
      assert!(moment.total_score >= 0.0);
      assert!(!moment.description.is_empty());
      assert!(!moment.tags.is_empty());

      // Verify category is valid
      assert!(matches!(
        moment.category,
        MomentCategory::Action
          | MomentCategory::Drama
          | MomentCategory::Comedy
          | MomentCategory::Transition
          | MomentCategory::Highlight
      ));

      // Verify scores structure
      let scores = &moment.scores;
      assert!(scores.visual >= 0.0 && scores.visual <= 100.0);
      assert!(scores.technical >= 0.0 && scores.technical <= 100.0);
      assert!(scores.emotional >= 0.0 && scores.emotional <= 100.0);
      assert!(scores.narrative >= 0.0 && scores.narrative <= 100.0);
      assert!(scores.action >= 0.0 && scores.action <= 100.0);
      assert!(scores.composition >= 0.0 && scores.composition <= 100.0);
    }
  }

  #[test]
  fn test_plan_generator_comprehensive() {
    let mut generator = PlanGenerator::new();

    // Create test moments
    let moments = vec![
      create_test_moment(5.0, 3.0, MomentCategory::Action),
      create_test_moment(15.0, 4.0, MomentCategory::Drama),
      create_test_moment(25.0, 2.5, MomentCategory::Highlight),
      create_test_moment(35.0, 3.5, MomentCategory::Action),
    ];

    let config = create_test_montage_config();
    let source_files = vec!["test_video.mp4".to_string()];

    let result = generator.generate_plan(&moments, &config, &source_files);
    assert!(result.is_ok());

    let plan = result.unwrap();

    // Verify plan structure
    assert!(!plan.id.is_empty());
    assert!(!plan.name.is_empty());
    assert_eq!(plan.style, MontageStyle::DynamicAction);
    assert!(plan.total_duration > 0.0);
    assert!(!plan.clips.is_empty());
    assert!(plan.quality_score >= 0.0);
    assert!(plan.engagement_score >= 0.0);
    assert!(!plan.created_at.is_empty());

    // Verify clips
    for clip in &plan.clips {
      assert!(!clip.id.is_empty());
      assert!(!clip.source_file.is_empty());
      assert!(clip.start_time >= 0.0);
      assert!(clip.end_time > clip.start_time);
      assert!(clip.duration > 0.0);
      assert_eq!(clip.duration, clip.end_time - clip.start_time);
    }

    // Clips should be ordered by start time
    for i in 1..plan.clips.len() {
      assert!(plan.clips[i].start_time >= plan.clips[i - 1].start_time);
    }
  }

  #[tokio::test]
  async fn test_video_quality_analyzer_comprehensive() {
    let analyzer = VideoQualityAnalyzer::new();

    // Test error handling with non-existent file
    let result = analyzer.analyze_quality("non_existent_video.mp4").await;
    assert!(result.is_err());

    match result.unwrap_err() {
      MontageError::FileNotFound(_) => (), // Expected
      _ => panic!("Expected FileNotFound error"),
    }
  }

  #[tokio::test]
  async fn test_audio_analyzer_comprehensive() {
    let analyzer = AudioAnalyzer::new();

    // Test segment analysis with mock data
    let result = analyzer
      .analyze_audio_segment("mock_audio.wav", 1.0, 2.0)
      .await;

    // This will fail due to missing file, but we test the interface
    match result {
      Ok(analysis) => {
        assert_eq!(analysis.start_time, 1.0);
        assert_eq!(analysis.duration, 2.0);
        assert!(analysis.rms_energy >= 0.0 && analysis.rms_energy <= 1.0);
        assert!(analysis.spectral_centroid > 0.0);
        assert_eq!(analysis.mfcc.len(), 13);
        assert!(analysis.speech_probability >= 0.0 && analysis.speech_probability <= 1.0);
        assert!(analysis.music_probability >= 0.0 && analysis.music_probability <= 1.0);
      }
      Err(MontageError::FileNotFound(_)) => (), // Expected for non-existent file
      Err(_) => panic!("Unexpected error type"),
    }
  }

  #[tokio::test]
  async fn test_video_processor_comprehensive() {
    let yolo_state = Arc::new(RwLock::new(YoloProcessorState::default()));
    let processor = VideoProcessor::new(yolo_state);

    // Test metadata extraction with non-existent file
    let result = processor.extract_metadata("non_existent.mp4").await;
    assert!(result.is_err());
    let error_msg = result.unwrap_err().to_string();
    assert!(error_msg.contains("Video file not found"));

    // Test frame extraction with non-existent file
    let result = processor
      .extract_frames("non_existent.mp4", 1.0, Some(1.0), Some(2.0))
      .await;
    assert!(result.is_err());

    // Test analysis with non-existent file
    let options = AnalysisOptions {
      enable_object_detection: true,
      enable_face_detection: true,
      enable_emotion_analysis: true,
      enable_composition_analysis: true,
      enable_audio_analysis: true,
      frame_sample_rate: 1.0,
      quality_threshold: 60.0,
      max_moments: Some(10),
      frame_sampling_rate: 1.0,
    };

    let result = processor.analyze_video("non_existent.mp4", &options).await;
    assert!(result.is_err());
  }

  #[test]
  fn test_edge_cases_and_robustness() {
    // Test empty inputs
    let detector = MomentDetector::new();
    let empty_result = detector.detect_moments(&[]);
    assert!(empty_result.is_ok());
    assert_eq!(empty_result.unwrap().len(), 0);

    // Test activity calculator with minimal data
    let mut calculator = ActivityCalculator::new();
    let minimal_detection = MontageDetection {
      timestamp: 1.0,
      detection_type: DetectionType::Scene,
      objects: vec![],
      faces: vec![],
      composition_score: CompositionScore {
        rule_of_thirds: 50.0,
        balance: 50.0,
        focus_clarity: 50.0,
        depth_of_field: 50.0,
        leading_lines: 50.0,
        symmetry: 50.0,
        overall_score: 50.0,
        ..Default::default()
      },
      activity_level: 50.0,
      emotional_tone: EmotionalTone::Neutral,
    };

    let metrics = calculator.calculate_activity(&minimal_detection);
    assert_eq!(metrics.object_count, 0);
    assert_eq!(metrics.moving_objects, 0);
    assert!(metrics.overall_activity >= 0.0);

    // Test composition analyzer with empty detections
    let analyzer = CompositionAnalyzer::new();
    let empty_result = analyzer.analyze_composition(&[], 1.0, 1920.0, 1080.0);
    assert!(empty_result.is_ok());

    let enhanced = empty_result.unwrap();
    assert_eq!(enhanced.original_detections.len(), 0);
    assert!(enhanced.composition_score.overall_score >= 0.0);
  }

  #[test]
  fn test_serialization_compatibility() {
    // Test that all major types can be serialized and deserialized

    // Test AnalysisOptions
    let options = AnalysisOptions {
      enable_object_detection: true,
      enable_face_detection: true,
      enable_emotion_analysis: true,
      enable_composition_analysis: true,
      enable_audio_analysis: true,
      frame_sample_rate: 1.0,
      quality_threshold: 60.0,
      max_moments: Some(10),
      frame_sampling_rate: 1.0,
    };

    let json = serde_json::to_string(&options).expect("Failed to serialize AnalysisOptions");
    let _deserialized: AnalysisOptions =
      serde_json::from_str(&json).expect("Failed to deserialize AnalysisOptions");

    // Test MontageConfig
    let config = create_test_montage_config();
    let json = serde_json::to_string(&config).expect("Failed to serialize MontageConfig");
    let _deserialized: MontageConfig =
      serde_json::from_str(&json).expect("Failed to deserialize MontageConfig");

    // Test DetectedMoment
    let moment = create_test_moment(1.0, 2.0, MomentCategory::Action);
    let json = serde_json::to_string(&moment).expect("Failed to serialize DetectedMoment");
    let _deserialized: DetectedMoment =
      serde_json::from_str(&json).expect("Failed to deserialize DetectedMoment");

    // Test VideoQualityResult
    let quality = VideoQualityResult {
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

    let json = serde_json::to_string(&quality).expect("Failed to serialize VideoQualityResult");
    let _deserialized: VideoQualityResult =
      serde_json::from_str(&json).expect("Failed to deserialize VideoQualityResult");
  }

  #[test]
  fn test_performance_characteristics() {
    use std::time::Instant;

    // Test activity calculator performance
    let mut calculator = ActivityCalculator::new();
    let detection = create_test_montage_detection(1.0, 75.0);

    let start = Instant::now();
    for _ in 0..100 {
      let _metrics = calculator.calculate_activity(&detection);
    }
    let duration = start.elapsed();

    // Should process 100 detections in reasonable time (< 100ms)
    assert!(
      duration.as_millis() < 100,
      "Performance too slow: {:?}",
      duration
    );

    // Test composition analyzer performance
    let analyzer = CompositionAnalyzer::new();
    let detections = vec![
      create_yolo_detection("person", 0, 400.0, 400.0, 80.0, 120.0, 0.9),
      create_yolo_detection("car", 1, 800.0, 400.0, 160.0, 80.0, 0.85),
    ];

    let start = Instant::now();
    for i in 0..50 {
      let _result = analyzer.analyze_composition(&detections, i as f64, 1920.0, 1080.0);
    }
    let duration = start.elapsed();

    // Should process 50 compositions in reasonable time (< 100ms)
    assert!(
      duration.as_millis() < 100,
      "Performance too slow: {:?}",
      duration
    );
  }
}
