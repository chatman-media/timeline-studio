#[cfg(test)]
mod tests {
  use crate::montage_planner::services::quality_analyzer::{
    FrameQualityAnalysis, QualityAnalysisConfig, QualityIssue, QualityIssueSeverity,
    QualityIssueType, VideoQualityAnalyzer,
  };
  use crate::montage_planner::types::*;
  use std::fs;
  use std::path::PathBuf;
  use tempfile::TempDir;

  fn create_analyzer() -> VideoQualityAnalyzer {
    VideoQualityAnalyzer::new()
  }

  fn create_analyzer_with_config(config: QualityAnalysisConfig) -> VideoQualityAnalyzer {
    VideoQualityAnalyzer::with_config(config)
  }

  fn create_test_video_file() -> (TempDir, PathBuf) {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test_video.mp4");

    // Create a minimal mock video file
    fs::write(&file_path, b"mock video content").unwrap();

    (temp_dir, file_path)
  }

  fn create_test_frame_quality(timestamp: f64) -> FrameQualityAnalysis {
    FrameQualityAnalysis {
      timestamp,
      sharpness: 80.0,
      brightness: 50.0,
      contrast: 70.0,
      saturation: 75.0,
      noise_level: 15.0,
      motion_blur: 10.0,
      overall_quality: 85.0,
    }
  }

  fn create_test_video_quality() -> VideoQualityAnalysis {
    VideoQualityAnalysis {
      resolution: Resolution {
        width: 1920,
        height: 1080,
      },
      frame_rate: 30.0,
      bitrate: 5_000_000,
      sharpness: 85.0,
      stability: 90.0,
      exposure: 50.0,
      color_grading: 80.0,
      noise_level: 12.0,
      dynamic_range: 75.0,
    }
  }

  fn create_test_moment(timestamp: f64) -> DetectedMoment {
    DetectedMoment {
      timestamp,
      duration: 2.0,
      category: MomentCategory::Action,
      scores: MomentScores {
        visual: 80.0,
        technical: 75.0,
        emotional: 70.0,
        narrative: 65.0,
        action: 85.0,
        composition: 78.0,
      },
      total_score: 80.0,
      description: "Test moment".to_string(),
      tags: vec!["test".to_string()],
    }
  }

  #[test]
  fn test_analyzer_creation() {
    let _analyzer = create_analyzer();
    // Can't access private config field, but creation should succeed

    let config = QualityAnalysisConfig {
      sample_rate: 2.0,
      enable_sharpness: false,
      enable_stability: true,
      enable_exposure: true,
      enable_noise: false,
      enable_color: true,
    };
    let _analyzer_with_config = create_analyzer_with_config(config.clone());
    // Can't access private config field, but creation should succeed
  }

  #[test]
  fn test_default_config() {
    let config = QualityAnalysisConfig::default();
    assert_eq!(config.sample_rate, 1.0);
    assert!(config.enable_sharpness);
    assert!(config.enable_stability);
    assert!(config.enable_exposure);
    assert!(config.enable_noise);
    assert!(config.enable_color);
  }

  #[tokio::test]
  async fn test_analyze_quality_nonexistent_file() {
    let analyzer = create_analyzer();
    let result = analyzer.analyze_quality("nonexistent_file.mp4").await;

    assert!(result.is_err());
    match result.unwrap_err() {
      MontageError::FileNotFound(path) => {
        assert_eq!(path, "nonexistent_file.mp4");
      }
      _ => panic!("Expected FileNotFound error"),
    }
  }

  #[tokio::test]
  async fn test_analyze_frame_quality_nonexistent_file() {
    let analyzer = create_analyzer();
    let result = analyzer
      .analyze_frame_quality("nonexistent_file.mp4", 1.0)
      .await;

    assert!(result.is_err());
    match result.unwrap_err() {
      MontageError::FileNotFound(path) => {
        assert_eq!(path, "nonexistent_file.mp4");
      }
      _ => panic!("Expected FileNotFound error"),
    }
  }

  #[tokio::test]
  async fn test_analyze_frame_quality_with_mock_file() {
    let analyzer = create_analyzer();
    let (_temp_dir, video_path) = create_test_video_file();

    // This should return fallback data since ffmpeg will fail on mock file
    let result = analyzer.analyze_frame_quality(&video_path, 2.0).await;

    assert!(result.is_ok());
    let quality = result.unwrap();
    assert_eq!(quality.timestamp, 2.0);
    assert!(quality.sharpness > 0.0);
    assert!(quality.brightness > 0.0);
    assert!(quality.overall_quality > 0.0);
  }

  #[tokio::test]
  async fn test_batch_analyze_quality() {
    let analyzer = create_analyzer();
    let (_temp_dir, video_path) = create_test_video_file();

    let timestamps = vec![1.0, 2.0, 3.0, 4.0];
    let result = analyzer
      .batch_analyze_quality(&video_path, &timestamps)
      .await;

    assert!(result.is_ok());
    let qualities = result.unwrap();
    assert_eq!(qualities.len(), 4);

    for (i, quality) in qualities.iter().enumerate() {
      assert_eq!(quality.timestamp, timestamps[i]);
      assert!(quality.overall_quality > 0.0);
    }
  }

  #[test]
  fn test_calculate_quality_score() {
    let analyzer = create_analyzer();
    let frame_quality = create_test_frame_quality(1.0);
    let video_quality = create_test_video_quality();

    let score = analyzer.calculate_quality_score(&frame_quality, &video_quality);

    assert!((0.0..=100.0).contains(&score));
    assert!(score > 50.0); // Should be high for good quality inputs
  }

  #[test]
  fn test_calculate_quality_score_with_poor_quality() {
    let analyzer = create_analyzer();
    let mut frame_quality = create_test_frame_quality(1.0);
    frame_quality.sharpness = 20.0; // Low sharpness
    frame_quality.noise_level = 80.0; // High noise
    frame_quality.motion_blur = 60.0; // High blur

    let video_quality = create_test_video_quality();
    let score = analyzer.calculate_quality_score(&frame_quality, &video_quality);

    assert!((0.0..=100.0).contains(&score));

    // Compare with good quality score
    let good_frame = create_test_frame_quality(1.0);
    let good_score = analyzer.calculate_quality_score(&good_frame, &video_quality);
    assert!(score < good_score); // Poor quality should score lower than good quality
  }

  #[test]
  fn test_brightness_normalization_via_quality_calculation() {
    let analyzer = create_analyzer();
    let video_quality = create_test_video_quality();

    // Test brightness normalization through quality score calculation
    let mut frame_50 = create_test_frame_quality(1.0);
    frame_50.brightness = 50.0; // Optimal
    let score_50 = analyzer.calculate_quality_score(&frame_50, &video_quality);

    let mut frame_10 = create_test_frame_quality(1.0);
    frame_10.brightness = 10.0; // Poor
    let score_10 = analyzer.calculate_quality_score(&frame_10, &video_quality);

    let mut frame_90 = create_test_frame_quality(1.0);
    frame_90.brightness = 90.0; // Poor
    let score_90 = analyzer.calculate_quality_score(&frame_90, &video_quality);

    // Optimal brightness should give better score than extreme values
    assert!(score_50 > score_10);
    assert!(score_50 > score_90);
  }

  #[test]
  fn test_identify_quality_issues_no_issues() {
    let analyzer = create_analyzer();
    let good_quality = create_test_frame_quality(1.0);

    let issues = analyzer.identify_quality_issues(&good_quality);
    assert!(issues.is_empty());
  }

  #[test]
  fn test_identify_quality_issues_low_sharpness() {
    let analyzer = create_analyzer();
    let mut poor_quality = create_test_frame_quality(1.0);
    poor_quality.sharpness = 40.0; // Below 50.0 threshold

    let issues = analyzer.identify_quality_issues(&poor_quality);
    assert_eq!(issues.len(), 1);

    let issue = &issues[0];
    assert!(matches!(issue.issue_type, QualityIssueType::LowSharpness));
    assert!(matches!(issue.severity, QualityIssueSeverity::Medium));
    assert_eq!(issue.timestamp, 1.0);
  }

  #[test]
  fn test_identify_quality_issues_high_sharpness_severity() {
    let analyzer = create_analyzer();
    let mut very_poor_quality = create_test_frame_quality(1.0);
    very_poor_quality.sharpness = 25.0; // Below 30.0 threshold

    let issues = analyzer.identify_quality_issues(&very_poor_quality);
    assert_eq!(issues.len(), 1);

    let issue = &issues[0];
    assert!(matches!(issue.issue_type, QualityIssueType::LowSharpness));
    assert!(matches!(issue.severity, QualityIssueSeverity::High));
  }

  #[test]
  fn test_identify_quality_issues_high_noise() {
    let analyzer = create_analyzer();
    let mut noisy_quality = create_test_frame_quality(1.0);
    noisy_quality.noise_level = 60.0; // Above 50.0 threshold

    let issues = analyzer.identify_quality_issues(&noisy_quality);
    assert_eq!(issues.len(), 1);

    let issue = &issues[0];
    assert!(matches!(issue.issue_type, QualityIssueType::HighNoise));
    assert!(matches!(issue.severity, QualityIssueSeverity::Medium));
  }

  #[test]
  fn test_identify_quality_issues_very_high_noise() {
    let analyzer = create_analyzer();
    let mut very_noisy_quality = create_test_frame_quality(1.0);
    very_noisy_quality.noise_level = 80.0; // Above 75.0 threshold

    let issues = analyzer.identify_quality_issues(&very_noisy_quality);
    assert_eq!(issues.len(), 1);

    let issue = &issues[0];
    assert!(matches!(issue.issue_type, QualityIssueType::HighNoise));
    assert!(matches!(issue.severity, QualityIssueSeverity::High));
  }

  #[test]
  fn test_identify_quality_issues_motion_blur() {
    let analyzer = create_analyzer();
    let mut blurry_quality = create_test_frame_quality(1.0);
    blurry_quality.motion_blur = 40.0; // Above 30.0 threshold

    let issues = analyzer.identify_quality_issues(&blurry_quality);
    assert_eq!(issues.len(), 1);

    let issue = &issues[0];
    assert!(matches!(issue.issue_type, QualityIssueType::MotionBlur));
    assert!(matches!(issue.severity, QualityIssueSeverity::Medium));
  }

  #[test]
  fn test_identify_quality_issues_severe_motion_blur() {
    let analyzer = create_analyzer();
    let mut very_blurry_quality = create_test_frame_quality(1.0);
    very_blurry_quality.motion_blur = 70.0; // Above 60.0 threshold

    let issues = analyzer.identify_quality_issues(&very_blurry_quality);
    assert_eq!(issues.len(), 1);

    let issue = &issues[0];
    assert!(matches!(issue.issue_type, QualityIssueType::MotionBlur));
    assert!(matches!(issue.severity, QualityIssueSeverity::High));
  }

  #[test]
  fn test_identify_quality_issues_underexposed() {
    let analyzer = create_analyzer();
    let mut dark_quality = create_test_frame_quality(1.0);
    dark_quality.brightness = 15.0; // Below 20.0 threshold

    let issues = analyzer.identify_quality_issues(&dark_quality);
    assert_eq!(issues.len(), 1);

    let issue = &issues[0];
    assert!(matches!(issue.issue_type, QualityIssueType::Underexposed));
    assert!(matches!(issue.severity, QualityIssueSeverity::Medium));
  }

  #[test]
  fn test_identify_quality_issues_overexposed() {
    let analyzer = create_analyzer();
    let mut bright_quality = create_test_frame_quality(1.0);
    bright_quality.brightness = 85.0; // Above 80.0 threshold

    let issues = analyzer.identify_quality_issues(&bright_quality);
    assert_eq!(issues.len(), 1);

    let issue = &issues[0];
    assert!(matches!(issue.issue_type, QualityIssueType::Overexposed));
    assert!(matches!(issue.severity, QualityIssueSeverity::Medium));
  }

  #[test]
  fn test_identify_quality_issues_low_contrast() {
    let analyzer = create_analyzer();
    let mut low_contrast_quality = create_test_frame_quality(1.0);
    low_contrast_quality.contrast = 25.0; // Below 30.0 threshold

    let issues = analyzer.identify_quality_issues(&low_contrast_quality);
    assert_eq!(issues.len(), 1);

    let issue = &issues[0];
    assert!(matches!(issue.issue_type, QualityIssueType::LowContrast));
    assert!(matches!(issue.severity, QualityIssueSeverity::Low));
  }

  #[test]
  fn test_identify_quality_issues_multiple() {
    let analyzer = create_analyzer();
    let mut problematic_quality = create_test_frame_quality(1.0);
    problematic_quality.sharpness = 40.0; // Low sharpness
    problematic_quality.noise_level = 60.0; // High noise
    problematic_quality.brightness = 15.0; // Underexposed
    problematic_quality.contrast = 25.0; // Low contrast

    let issues = analyzer.identify_quality_issues(&problematic_quality);
    assert_eq!(issues.len(), 4);

    // Check that all expected issue types are present
    let issue_types: Vec<_> = issues.iter().map(|i| &i.issue_type).collect();
    assert!(issue_types
      .iter()
      .any(|t| matches!(t, QualityIssueType::LowSharpness)));
    assert!(issue_types
      .iter()
      .any(|t| matches!(t, QualityIssueType::HighNoise)));
    assert!(issue_types
      .iter()
      .any(|t| matches!(t, QualityIssueType::Underexposed)));
    assert!(issue_types
      .iter()
      .any(|t| matches!(t, QualityIssueType::LowContrast)));
  }

  #[test]
  fn test_filter_by_quality_all_pass() {
    let analyzer = create_analyzer();
    let moments = vec![
      create_test_moment(1.0),
      create_test_moment(2.0),
      create_test_moment(3.0),
    ];

    let quality_analyses = vec![
      create_test_frame_quality(1.0), // 85.0 quality
      create_test_frame_quality(2.0), // 85.0 quality
      create_test_frame_quality(3.0), // 85.0 quality
    ];

    let filtered = analyzer.filter_by_quality(moments.clone(), &quality_analyses, 80.0);
    assert_eq!(filtered.len(), 3); // All should pass
  }

  #[test]
  fn test_filter_by_quality_some_fail() {
    let analyzer = create_analyzer();
    let moments = vec![
      create_test_moment(1.0),
      create_test_moment(2.0),
      create_test_moment(3.0),
    ];

    let mut quality_analyses = vec![
      create_test_frame_quality(1.0), // Will pass
      create_test_frame_quality(2.0), // Will fail
      create_test_frame_quality(3.0), // Will pass
    ];
    quality_analyses[1].overall_quality = 70.0; // Below threshold

    let filtered = analyzer.filter_by_quality(moments.clone(), &quality_analyses, 80.0);
    assert_eq!(filtered.len(), 2); // Two should pass
    assert_eq!(filtered[0].timestamp, 1.0);
    assert_eq!(filtered[1].timestamp, 3.0);
  }

  #[test]
  fn test_filter_by_quality_no_quality_data() {
    let analyzer = create_analyzer();
    let moments = vec![create_test_moment(1.0), create_test_moment(5.0)]; // 5.0 has no quality data

    let quality_analyses = vec![create_test_frame_quality(1.0)]; // Only one analysis

    let filtered = analyzer.filter_by_quality(moments.clone(), &quality_analyses, 80.0);
    assert_eq!(filtered.len(), 2); // Both should pass (no quality data = keep)
  }

  #[test]
  fn test_filter_by_quality_timestamp_tolerance() {
    let analyzer = create_analyzer();
    let moments = vec![create_test_moment(1.5)]; // Between quality timestamps

    let quality_analyses = vec![
      create_test_frame_quality(1.0), // Close enough (within 1.0s)
      create_test_frame_quality(3.0), // Too far
    ];

    let filtered = analyzer.filter_by_quality(moments.clone(), &quality_analyses, 80.0);
    assert_eq!(filtered.len(), 1); // Should use closest quality data
  }

  #[tokio::test]
  async fn test_frame_analysis_integration() {
    let analyzer = create_analyzer();
    let (_temp_dir, video_path) = create_test_video_file();

    // Test frame analysis which internally uses private methods
    let result = analyzer.analyze_frame_quality(&video_path, 1.0).await;
    assert!(result.is_ok());

    let quality = result.unwrap();
    assert!(quality.sharpness >= 0.0 && quality.sharpness <= 100.0);
    assert!(quality.brightness >= 0.0 && quality.brightness <= 100.0);
    assert!(quality.noise_level >= 0.0 && quality.noise_level <= 100.0);
  }

  #[test]
  fn test_frame_quality_analysis_serialization() {
    let quality = create_test_frame_quality(1.0);
    let serialized = serde_json::to_string(&quality).unwrap();
    let deserialized: FrameQualityAnalysis = serde_json::from_str(&serialized).unwrap();

    assert_eq!(quality.timestamp, deserialized.timestamp);
    assert_eq!(quality.sharpness, deserialized.sharpness);
    assert_eq!(quality.brightness, deserialized.brightness);
  }

  #[test]
  fn test_quality_issue_serialization() {
    let issue = QualityIssue {
      issue_type: QualityIssueType::LowSharpness,
      severity: QualityIssueSeverity::High,
      description: "Test issue".to_string(),
      timestamp: 1.0,
    };

    let serialized = serde_json::to_string(&issue).unwrap();
    let deserialized: QualityIssue = serde_json::from_str(&serialized).unwrap();

    assert!(matches!(
      deserialized.issue_type,
      QualityIssueType::LowSharpness
    ));
    assert!(matches!(deserialized.severity, QualityIssueSeverity::High));
    assert_eq!(deserialized.description, "Test issue");
    assert_eq!(deserialized.timestamp, 1.0);
  }

  #[test]
  fn test_quality_analysis_config_serialization() {
    let config = QualityAnalysisConfig {
      sample_rate: 2.0,
      enable_sharpness: false,
      enable_stability: true,
      enable_exposure: false,
      enable_noise: true,
      enable_color: false,
    };

    let serialized = serde_json::to_string(&config).unwrap();
    let deserialized: QualityAnalysisConfig = serde_json::from_str(&serialized).unwrap();

    assert_eq!(config.sample_rate, deserialized.sample_rate);
    assert_eq!(config.enable_sharpness, deserialized.enable_sharpness);
    assert_eq!(config.enable_stability, deserialized.enable_stability);
  }

  #[test]
  fn test_all_quality_issue_types() {
    use QualityIssueType::*;
    let issue_types = vec![
      LowSharpness,
      HighNoise,
      MotionBlur,
      Underexposed,
      Overexposed,
      LowContrast,
      ColorCast,
      Instability,
    ];

    for issue_type in issue_types {
      let issue = QualityIssue {
        issue_type: issue_type.clone(),
        severity: QualityIssueSeverity::Medium,
        description: "Test".to_string(),
        timestamp: 0.0,
      };

      // Should serialize/deserialize without error
      let serialized = serde_json::to_string(&issue).unwrap();
      let _deserialized: QualityIssue = serde_json::from_str(&serialized).unwrap();
    }
  }

  #[test]
  fn test_all_quality_issue_severities() {
    use QualityIssueSeverity::*;
    let severities = vec![Low, Medium, High, Critical];

    for severity in severities {
      let issue = QualityIssue {
        issue_type: QualityIssueType::LowSharpness,
        severity: severity.clone(),
        description: "Test".to_string(),
        timestamp: 0.0,
      };

      // Should serialize/deserialize without error
      let serialized = serde_json::to_string(&issue).unwrap();
      let _deserialized: QualityIssue = serde_json::from_str(&serialized).unwrap();
    }
  }

  #[test]
  fn test_quality_score_bounds() {
    let analyzer = create_analyzer();

    // Test with extreme values
    let extreme_frame = FrameQualityAnalysis {
      timestamp: 0.0,
      sharpness: 0.0,
      brightness: 0.0,
      contrast: 0.0,
      saturation: 0.0,
      noise_level: 100.0,
      motion_blur: 100.0,
      overall_quality: 0.0,
    };

    let extreme_video = VideoQualityAnalysis {
      resolution: Resolution {
        width: 640,
        height: 480,
      },
      frame_rate: 15.0,
      bitrate: 1_000_000,
      sharpness: 0.0,
      stability: 0.0,
      exposure: 0.0,
      color_grading: 0.0,
      noise_level: 100.0,
      dynamic_range: 0.0,
    };

    let score = analyzer.calculate_quality_score(&extreme_frame, &extreme_video);
    assert!((0.0..=100.0).contains(&score));
    assert!(score < 20.0); // Should be very low
  }

  #[test]
  fn test_brightness_scoring_via_quality_score() {
    let analyzer = create_analyzer();
    let video_quality = create_test_video_quality();

    // Test brightness scoring through public interface
    let mut optimal_frame = create_test_frame_quality(1.0);
    optimal_frame.brightness = 50.0; // Optimal
    let optimal_score = analyzer.calculate_quality_score(&optimal_frame, &video_quality);

    let mut dark_frame = create_test_frame_quality(1.0);
    dark_frame.brightness = 10.0; // Too dark
    let dark_score = analyzer.calculate_quality_score(&dark_frame, &video_quality);

    let mut bright_frame = create_test_frame_quality(1.0);
    bright_frame.brightness = 90.0; // Too bright
    let bright_score = analyzer.calculate_quality_score(&bright_frame, &video_quality);

    // Optimal brightness should give better score
    assert!(optimal_score > dark_score);
    assert!(optimal_score > bright_score);
  }

  #[test]
  fn test_default_implementation() {
    let _analyzer1 = VideoQualityAnalyzer::default();
    let _analyzer2 = VideoQualityAnalyzer::new();

    // Both should create successfully
    // Can't access private config field, but creation should succeed
  }
}
