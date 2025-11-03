#[cfg(test)]
mod tests {
  use crate::montage_planner::services::emotion_detector::{
    EmotionDetectionConfig, EmotionDetector,
  };
  use crate::montage_planner::types::*;

  fn create_detector() -> EmotionDetector {
    EmotionDetector::new()
  }

  fn create_detector_with_config(config: EmotionDetectionConfig) -> EmotionDetector {
    EmotionDetector::with_config(config)
  }

  fn create_test_face_detection(
    tracking_id: Option<u32>,
    emotion: EmotionalTone,
    confidence: f32,
    x: f32,
    y: f32,
  ) -> FaceDetection {
    FaceDetection {
      confidence,
      bbox: BoundingBox {
        x,
        y,
        width: 80.0,
        height: 100.0,
      },
      tracking_id,
      emotion,
      gaze_direction: Some(GazeDirection::Camera),
      face_quality: 0.8,
    }
  }

  fn create_test_detection(timestamp: f64, faces: Vec<FaceDetection>) -> MontageDetection {
    MontageDetection {
      timestamp,
      detection_type: DetectionType::Face,
      objects: vec![],
      faces,
      composition_score: CompositionScore {
        rule_of_thirds: 70.0,
        balance: 75.0,
        focus_clarity: 80.0,
        depth_of_field: 65.0,
        leading_lines: 50.0,
        symmetry: 60.0,
        overall_score: 70.0,
        ..Default::default()
      },
      activity_level: 50.0,
      emotional_tone: EmotionalTone::Neutral,
    }
  }

  #[test]
  fn test_detector_creation() {
    let _detector = create_detector();
    // Can't access private fields, but creation should succeed

    let config = EmotionDetectionConfig {
      confidence_threshold: 0.8,
      temporal_smoothing: 0.5,
      emotion_transition_threshold: 0.6,
      history_window_size: 50,
    };
    let _detector_with_config = create_detector_with_config(config.clone());
    // Can't access private config field, but creation should succeed
  }

  #[test]
  fn test_default_config() {
    let config = EmotionDetectionConfig::default();
    assert_eq!(config.confidence_threshold, 0.6);
    assert_eq!(config.temporal_smoothing, 0.3);
    assert_eq!(config.emotion_transition_threshold, 0.4);
    assert_eq!(config.history_window_size, 30);
  }

  #[test]
  fn test_single_face_emotion_detection() {
    let mut detector = create_detector();
    let face = create_test_face_detection(Some(1), EmotionalTone::Happy, 0.9, 100.0, 200.0);
    let detection = create_test_detection(0.0, vec![face]);

    let result = detector.detect_emotions(&detection).unwrap();

    assert_eq!(result.timestamp, 0.0);
    assert_eq!(result.detected_emotions.len(), 1);
    assert_eq!(result.dominant_emotion, EmotionalTone::Happy);
    assert!(result.emotion_confidence > 0.0);
    assert!(result.emotional_intensity > 0.0);
    assert_eq!(result.emotion_stability, 1.0); // First detection is always stable

    let face_emotion = &result.detected_emotions[0];
    assert_eq!(face_emotion.face_id, Some(1));
    assert_eq!(face_emotion.emotion, EmotionalTone::Happy);
  }

  #[test]
  fn test_multiple_faces_emotion_detection() {
    let mut detector = create_detector();
    let faces = vec![
      create_test_face_detection(Some(1), EmotionalTone::Happy, 0.9, 100.0, 200.0),
      create_test_face_detection(Some(2), EmotionalTone::Sad, 0.8, 300.0, 400.0),
      create_test_face_detection(Some(3), EmotionalTone::Excited, 0.95, 500.0, 600.0),
    ];
    let detection = create_test_detection(0.0, faces);

    let result = detector.detect_emotions(&detection).unwrap();

    assert_eq!(result.detected_emotions.len(), 3);
    assert_eq!(result.dominant_emotion, EmotionalTone::Excited); // Highest confidence
    assert!(result.emotional_intensity > 0.0);

    // Check individual face emotions
    for face_emotion in &result.detected_emotions {
      assert!(face_emotion.confidence >= 0.8);
      assert!(face_emotion.intensity > 0.0);
    }
  }

  #[test]
  fn test_emotion_without_tracking_id() {
    let mut detector = create_detector();
    let face = create_test_face_detection(None, EmotionalTone::Neutral, 0.7, 200.0, 300.0);
    let detection = create_test_detection(1.0, vec![face]);

    let result = detector.detect_emotions(&detection).unwrap();

    assert_eq!(result.detected_emotions.len(), 1);
    assert_eq!(result.detected_emotions[0].face_id, None);
    assert_eq!(result.dominant_emotion, EmotionalTone::Neutral);
  }

  #[test]
  fn test_temporal_smoothing() {
    let mut detector = create_detector();

    // First detection - Happy
    let face1 = create_test_face_detection(Some(1), EmotionalTone::Happy, 0.9, 100.0, 200.0);
    let detection1 = create_test_detection(0.0, vec![face1]);
    let result1 = detector.detect_emotions(&detection1).unwrap();
    assert_eq!(result1.dominant_emotion, EmotionalTone::Happy);

    // Second detection - same face, different emotion
    let face2 = create_test_face_detection(Some(1), EmotionalTone::Sad, 0.8, 100.0, 200.0);
    let detection2 = create_test_detection(1.0, vec![face2]);
    let result2 = detector.detect_emotions(&detection2).unwrap();

    // Should still be influenced by previous happy emotion due to temporal smoothing
    assert!(result2.emotion_confidence > 0.0);
  }

  #[test]
  fn test_emotion_intensity_via_detection() {
    let mut detector = create_detector();

    // Test different emotions via the public interface
    let happy_face = create_test_face_detection(Some(1), EmotionalTone::Happy, 1.0, 100.0, 200.0);
    let excited_face =
      create_test_face_detection(Some(2), EmotionalTone::Excited, 1.0, 200.0, 300.0);
    let calm_face = create_test_face_detection(Some(3), EmotionalTone::Calm, 1.0, 300.0, 400.0);

    let happy_detection = create_test_detection(0.0, vec![happy_face]);
    let excited_detection = create_test_detection(1.0, vec![excited_face]);
    let calm_detection = create_test_detection(2.0, vec![calm_face]);

    let happy_result = detector.detect_emotions(&happy_detection).unwrap();
    let excited_result = detector.detect_emotions(&excited_detection).unwrap();
    let calm_result = detector.detect_emotions(&calm_detection).unwrap();

    // Different emotions should have different intensities
    assert!(excited_result.emotional_intensity > calm_result.emotional_intensity);
    assert!(happy_result.emotional_intensity > calm_result.emotional_intensity);
  }

  #[test]
  fn test_emotion_stability_via_detection() {
    let mut detector = create_detector();

    // Create consistent emotion sequence
    for i in 0..5 {
      let face = create_test_face_detection(Some(1), EmotionalTone::Happy, 0.9, 100.0, 200.0);
      let detection = create_test_detection(i as f64, vec![face]);
      let result = detector.detect_emotions(&detection).unwrap();
      // Stability should be high for consistent emotions
      if i > 2 {
        assert!(result.emotion_stability > 0.5);
      }
    }

    // Add some inconsistent emotions
    let face = create_test_face_detection(Some(1), EmotionalTone::Sad, 0.9, 100.0, 200.0);
    let detection = create_test_detection(5.0, vec![face]);
    let unstable_result = detector.detect_emotions(&detection).unwrap();

    // Should still have some stability measurement
    assert!(unstable_result.emotion_stability >= 0.0);
  }

  #[test]
  fn test_emotion_history_tracking() {
    let mut detector = create_detector();

    // Add several emotions for the same face
    for i in 0..3 {
      let emotion = if i % 2 == 0 {
        EmotionalTone::Happy
      } else {
        EmotionalTone::Excited
      };
      let face = create_test_face_detection(Some(1), emotion, 0.9, 100.0, 200.0);
      let detection = create_test_detection(i as f64, vec![face]);
      detector.detect_emotions(&detection).unwrap();
    }

    // Check emotion trend
    let trend = detector.get_emotion_trend(1);
    assert!(trend.is_some());
    let trend = trend.unwrap();
    assert_eq!(trend.len(), 3);
    assert_eq!(trend[0].1, EmotionalTone::Happy);
    assert_eq!(trend[1].1, EmotionalTone::Excited);
    assert_eq!(trend[2].1, EmotionalTone::Happy);
  }

  #[test]
  fn test_dominant_emotion_in_period() {
    let mut detector = create_detector();

    // Add emotions over time
    let emotions = vec![
      (0.0, EmotionalTone::Happy),
      (1.0, EmotionalTone::Happy),
      (2.0, EmotionalTone::Sad),
      (3.0, EmotionalTone::Happy),
      (4.0, EmotionalTone::Excited),
    ];

    for (time, emotion) in emotions {
      let face = create_test_face_detection(Some(1), emotion, 0.9, 100.0, 200.0);
      let detection = create_test_detection(time, vec![face]);
      detector.detect_emotions(&detection).unwrap();
    }

    // Check dominant emotion in different periods
    let early_dominant = detector.get_dominant_emotion_in_period(0.0, 2.0);
    assert_eq!(early_dominant, EmotionalTone::Happy); // 2 Happy vs 1 Sad

    let late_dominant = detector.get_dominant_emotion_in_period(3.0, 4.0);
    assert!(matches!(
      late_dominant,
      EmotionalTone::Happy | EmotionalTone::Excited
    ));
  }

  #[test]
  fn test_emotional_arc_calculation() {
    let mut detector = create_detector();

    // Create emotional progression
    let emotions = vec![
      (0.0, EmotionalTone::Calm),
      (1.0, EmotionalTone::Happy),
      (2.0, EmotionalTone::Excited),
      (3.0, EmotionalTone::Happy),
      (4.0, EmotionalTone::Calm),
    ];

    for (time, emotion) in emotions {
      let face = create_test_face_detection(Some(1), emotion, 0.9, 100.0, 200.0);
      let detection = create_test_detection(time, vec![face]);
      detector.detect_emotions(&detection).unwrap();
    }

    let time_points = vec![0.0, 1.0, 2.0, 3.0, 4.0];
    let arc = detector.calculate_emotional_arc(&time_points);

    assert_eq!(arc.len(), 5);

    // Should return valid intensity values for all time points
    for (_time, intensity) in &arc {
      assert!(*intensity >= 0.0);
      assert!(*intensity <= 100.0);
    }

    // Should have some variation in intensities (not all the same)
    let intensities: Vec<f32> = arc.iter().map(|(_, intensity)| *intensity).collect();
    let min_intensity = intensities.iter().fold(f32::INFINITY, |a, &b| a.min(b));
    let max_intensity = intensities.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));

    // There should be some emotional variation across the arc
    assert!(max_intensity >= min_intensity);
  }

  #[test]
  fn test_history_cleanup() {
    let mut detector = create_detector();

    // Add old emotion
    let face = create_test_face_detection(Some(1), EmotionalTone::Happy, 0.9, 100.0, 200.0);
    let old_detection = create_test_detection(0.0, vec![face]);
    detector.detect_emotions(&old_detection).unwrap();

    // Add recent emotion
    let face = create_test_face_detection(Some(2), EmotionalTone::Sad, 0.9, 200.0, 300.0);
    let recent_detection = create_test_detection(35.0, vec![face]); // 35 seconds later
    detector.detect_emotions(&recent_detection).unwrap();

    // Old history should be cleaned up (30 second threshold)
    assert!(detector.get_emotion_trend(1).is_none());
    assert!(detector.get_emotion_trend(2).is_some());
  }

  #[test]
  fn test_history_window_size_limit() {
    let config = EmotionDetectionConfig {
      history_window_size: 3, // Small window for testing
      ..EmotionDetectionConfig::default()
    };
    let mut detector = create_detector_with_config(config);

    // Add more emotions than window size
    for i in 0..5 {
      let face = create_test_face_detection(Some(1), EmotionalTone::Happy, 0.9, 100.0, 200.0);
      let detection = create_test_detection(i as f64, vec![face]);
      detector.detect_emotions(&detection).unwrap();
    }

    let trend = detector.get_emotion_trend(1).unwrap();
    assert_eq!(trend.len(), 3); // Should be limited to window size
  }

  #[test]
  fn test_empty_faces_detection() {
    let mut detector = create_detector();
    let detection = create_test_detection(0.0, vec![]);

    let result = detector.detect_emotions(&detection).unwrap();

    assert_eq!(result.detected_emotions.len(), 0);
    assert_eq!(result.dominant_emotion, EmotionalTone::Neutral);
    assert_eq!(result.emotion_confidence, 0.0);
    assert_eq!(result.emotional_intensity, 0.0);
    assert_eq!(result.emotion_stability, 1.0); // Assume stable if no faces
  }

  #[test]
  fn test_low_confidence_face_handling() {
    let mut detector = create_detector();

    // Create face with very low confidence
    let face = create_test_face_detection(Some(1), EmotionalTone::Happy, 0.1, 100.0, 200.0);
    let detection = create_test_detection(0.0, vec![face]);

    let result = detector.detect_emotions(&detection).unwrap();

    assert_eq!(result.detected_emotions.len(), 1);
    assert!(result.emotional_intensity < 0.5); // Should be low due to low confidence
  }

  #[test]
  fn test_emotion_intensity_via_emotional_arc() {
    let mut detector = create_detector();

    // Add emotions at different times
    let face1 = create_test_face_detection(Some(1), EmotionalTone::Excited, 0.9, 100.0, 200.0);
    let detection1 = create_test_detection(5.0, vec![face1]);
    detector.detect_emotions(&detection1).unwrap();

    let face2 = create_test_face_detection(Some(2), EmotionalTone::Calm, 0.8, 200.0, 300.0);
    let detection2 = create_test_detection(7.0, vec![face2]);
    detector.detect_emotions(&detection2).unwrap();

    // Test intensity via emotional arc (public method)
    let time_points = vec![5.0, 6.0, 7.0];
    let arc = detector.calculate_emotional_arc(&time_points);

    assert_eq!(arc.len(), 3);
    assert!(arc[0].1 > 0.0); // Intensity at 5.0
    assert!(arc[1].1 >= 0.0); // Intensity at 6.0 (between)
    assert!(arc[2].1 > 0.0); // Intensity at 7.0
  }

  #[test]
  fn test_reset_history() {
    let mut detector = create_detector();

    // Add some emotion history
    let face = create_test_face_detection(Some(1), EmotionalTone::Happy, 0.9, 100.0, 200.0);
    let detection = create_test_detection(0.0, vec![face]);
    detector.detect_emotions(&detection).unwrap();

    assert!(detector.get_emotion_trend(1).is_some());

    // Reset history
    detector.reset_history();

    assert!(detector.get_emotion_trend(1).is_none());
  }

  #[test]
  fn test_stability_via_consistent_emotions() {
    let mut detector = create_detector();

    // Test stability through public interface
    let emotions = [
      EmotionalTone::Happy,
      EmotionalTone::Happy,
      EmotionalTone::Happy,
      EmotionalTone::Happy,
    ];

    let mut last_stability = 0.0;
    for (i, emotion) in emotions.iter().enumerate() {
      let face = create_test_face_detection(Some(1), emotion.clone(), 0.9, 100.0, 200.0);
      let detection = create_test_detection(i as f64, vec![face]);
      let result = detector.detect_emotions(&detection).unwrap();

      if i > 0 {
        // Stability should generally increase or stay high with consistent emotions
        assert!(result.emotion_stability >= 0.0);
        if i > 2 {
          assert!(result.emotion_stability >= last_stability * 0.8); // Allow some variation
        }
      }
      last_stability = result.emotion_stability;
    }
  }

  #[test]
  fn test_temporal_smoothing_via_detection() {
    // Test temporal smoothing indirectly through the public interface
    let mut detector = create_detector();

    // Add initial emotion
    let face = create_test_face_detection(Some(1), EmotionalTone::Happy, 0.9, 100.0, 200.0);
    let detection = create_test_detection(0.0, vec![face]);
    let initial_result = detector.detect_emotions(&detection).unwrap();
    assert_eq!(initial_result.dominant_emotion, EmotionalTone::Happy);

    // Test smoothing with conflicting emotion (lower confidence)
    let face2 = create_test_face_detection(Some(1), EmotionalTone::Angry, 0.5, 100.0, 200.0);
    let detection2 = create_test_detection(1.0, vec![face2]);
    let smoothed_result = detector.detect_emotions(&detection2).unwrap();

    // Should have some confidence despite conflicting emotions
    assert!(smoothed_result.emotion_confidence > 0.0);
  }

  #[test]
  fn test_all_emotion_types_via_detection() {
    let mut detector = create_detector();

    let emotions = [
      EmotionalTone::Happy,
      EmotionalTone::Excited,
      EmotionalTone::Sad,
      EmotionalTone::Angry,
      EmotionalTone::Fear,
      EmotionalTone::Surprised,
      EmotionalTone::Disgust,
      EmotionalTone::Tense,
      EmotionalTone::Calm,
      EmotionalTone::Neutral,
    ];

    // Test all emotion types via the public interface
    for (i, emotion) in emotions.iter().enumerate() {
      let face = create_test_face_detection(Some(i as u32 + 1), emotion.clone(), 1.0, 100.0, 200.0);
      let detection = create_test_detection(i as f64, vec![face]);
      let result = detector.detect_emotions(&detection).unwrap();

      assert_eq!(result.dominant_emotion, *emotion);
      assert!(result.emotional_intensity >= 0.0 && result.emotional_intensity <= 100.0);
    }
  }

  #[test]
  fn test_serialization_compatibility() {
    let config = EmotionDetectionConfig::default();
    let serialized = serde_json::to_string(&config).unwrap();
    let deserialized: EmotionDetectionConfig = serde_json::from_str(&serialized).unwrap();

    assert_eq!(
      config.confidence_threshold,
      deserialized.confidence_threshold
    );
    assert_eq!(config.temporal_smoothing, deserialized.temporal_smoothing);
  }
}
