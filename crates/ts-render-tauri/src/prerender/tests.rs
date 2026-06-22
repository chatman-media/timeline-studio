//! Тесты для модуля prerender

#[cfg(test)]
mod prerender_tests {
  use super::super::*;
  use ts_render::video_compiler::core::schema::{ProjectSchema, Timeline};

  fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("Test Project".to_string());
    project.timeline = Timeline {
      duration: 30.0,
      fps: 30,
      resolution: (1920, 1080),
      sample_rate: 48000,
      aspect_ratio: ts_render::video_compiler::core::schema::common::AspectRatio::Ratio16x9,
    };
    project
  }

  #[test]
  fn test_prerender_result_creation() {
    let result = types::PrerenderResult {
      segment_id: "segment_123".to_string(),
      output_path: "/tmp/segment_123.mp4".to_string(),
      duration: 10.5,
      size_bytes: 1024000,
      compression_ratio: 0.85,
    };

    assert_eq!(result.segment_id, "segment_123");
    assert_eq!(result.output_path, "/tmp/segment_123.mp4");
    assert_eq!(result.duration, 10.5);
    assert_eq!(result.size_bytes, 1024000);
    assert_eq!(result.compression_ratio, 0.85);
  }

  #[test]
  fn test_prerender_result_serialization() {
    let result = types::PrerenderResult {
      segment_id: "test_segment".to_string(),
      output_path: "/output/test.mp4".to_string(),
      duration: 5.0,
      size_bytes: 512000,
      compression_ratio: 0.75,
    };

    // Test serialization
    let serialized = serde_json::to_string(&result).unwrap();
    assert!(serialized.contains("test_segment"));
    assert!(serialized.contains("/output/test.mp4"));
    assert!(serialized.contains("5.0"));
    assert!(serialized.contains("512000"));
    assert!(serialized.contains("0.75"));

    // Test deserialization
    let deserialized: types::PrerenderResult = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.segment_id, result.segment_id);
    assert_eq!(deserialized.output_path, result.output_path);
    assert_eq!(deserialized.duration, result.duration);
    assert_eq!(deserialized.size_bytes, result.size_bytes);
    assert_eq!(deserialized.compression_ratio, result.compression_ratio);
  }

  #[test]
  fn test_prerender_cache_info_creation() {
    let cache_info = types::PrerenderCacheInfo {
      segments: 5,
      total_size: 2048000,
      total_duration: 50.0,
    };

    assert_eq!(cache_info.segments, 5);
    assert_eq!(cache_info.total_size, 2048000);
    assert_eq!(cache_info.total_duration, 50.0);
  }

  #[test]
  fn test_prerender_cache_info_serialization() {
    let cache_info = types::PrerenderCacheInfo {
      segments: 3,
      total_size: 1536000,
      total_duration: 30.0,
    };

    let serialized = serde_json::to_string(&cache_info).unwrap();
    assert!(serialized.contains("\"segments\":3"));
    assert!(serialized.contains("\"total_size\":1536000"));
    assert!(serialized.contains("\"total_duration\":30.0"));

    let deserialized: types::PrerenderCacheInfo = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.segments, cache_info.segments);
    assert_eq!(deserialized.total_size, cache_info.total_size);
    assert_eq!(deserialized.total_duration, cache_info.total_duration);
  }

  #[test]
  fn test_prerender_cache_file_creation() {
    let cache_file = types::PrerenderCacheFile {
      path: "/cache/segment_001.mp4".to_string(),
      segment_id: "segment_001".to_string(),
      duration: 15.0,
      size_bytes: 768000,
      created_at: "2024-01-01T00:00:00Z".to_string(),
    };

    assert_eq!(cache_file.path, "/cache/segment_001.mp4");
    assert_eq!(cache_file.segment_id, "segment_001");
    assert_eq!(cache_file.duration, 15.0);
    assert_eq!(cache_file.size_bytes, 768000);
    assert_eq!(cache_file.created_at, "2024-01-01T00:00:00Z");
  }

  #[test]
  fn test_prepare_segment_project() {
    let project = create_test_project();
    let start_time = 5.0;
    let end_time = 15.0;

    let project_json = serde_json::to_value(&project).unwrap();
    let segment_project =
      business_logic::prepare_segment_project(&project_json, start_time, end_time);

    assert_eq!(segment_project["start_time"], start_time);
    assert_eq!(segment_project["end_time"], end_time);
  }

  #[test]
  fn test_validate_prerender_segment_params_valid() {
    let params = types::PrerenderSegmentParams {
      project_schema: create_test_project(),
      start_time: 0.0,
      end_time: 10.0,
      output_path: "/tmp/output.mp4".to_string(),
    };

    let result = business_logic::validate_prerender_segment_params(&params);
    assert!(result.is_ok());
  }

  #[test]
  fn test_validate_prerender_segment_params_invalid_times() {
    let params = types::PrerenderSegmentParams {
      project_schema: create_test_project(),
      start_time: 10.0,
      end_time: 5.0, // End before start
      output_path: "/tmp/output.mp4".to_string(),
    };

    let result = business_logic::validate_prerender_segment_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_prerender_segment_params_negative_start() {
    let params = types::PrerenderSegmentParams {
      project_schema: create_test_project(),
      start_time: -1.0, // Negative start time
      end_time: 10.0,
      output_path: "/tmp/output.mp4".to_string(),
    };

    let result = business_logic::validate_prerender_segment_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_prerender_segment_params_empty_output() {
    let params = types::PrerenderSegmentParams {
      project_schema: create_test_project(),
      start_time: 0.0,
      end_time: 10.0,
      output_path: "".to_string(), // Empty output path
    };

    let result = business_logic::validate_prerender_segment_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_prerender_command_params_valid() {
    let params = types::PrerenderCommandParams {
      segment_id: "test_segment".to_string(),
      input_files: vec!["/input/video.mp4".to_string()],
      output_path: "/output/segment.mp4".to_string(),
      settings: serde_json::json!({}),
    };

    let result = business_logic::validate_prerender_command_params(&params);
    assert!(result.is_ok());
  }

  #[test]
  fn test_validate_prerender_command_params_empty_segment_id() {
    let params = types::PrerenderCommandParams {
      segment_id: "".to_string(), // Empty segment ID
      input_files: vec!["/input/video.mp4".to_string()],
      output_path: "/output/segment.mp4".to_string(),
      settings: serde_json::json!({}),
    };

    let result = business_logic::validate_prerender_command_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_prerender_command_params_empty_input_files() {
    let params = types::PrerenderCommandParams {
      segment_id: "test_segment".to_string(),
      input_files: vec![], // Empty input files
      output_path: "/output/segment.mp4".to_string(),
      settings: serde_json::json!({}),
    };

    let result = business_logic::validate_prerender_command_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_prerender_command_params_empty_output_path() {
    let params = types::PrerenderCommandParams {
      segment_id: "test_segment".to_string(),
      input_files: vec!["/input/video.mp4".to_string()],
      output_path: "".to_string(), // Empty output path
      settings: serde_json::json!({}),
    };

    let result = business_logic::validate_prerender_command_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_prerender_status_creation() {
    let status = types::PrerenderStatus {
      segment_id: "test_segment".to_string(),
      is_active: true,
      completed: false,
      progress: 75.0,
    };

    assert_eq!(status.segment_id, "test_segment");
    assert!(status.is_active);
    assert!(!status.completed);
    assert_eq!(status.progress, 75.0);
  }

  #[test]
  fn test_cache_optimization_params() {
    let params = types::CacheOptimizationParams {
      max_size_mb: 1024,
      preserve_recent: true,
      max_age_hours: Some(48),
    };

    assert_eq!(params.max_size_mb, 1024);
    assert!(params.preserve_recent);
    assert_eq!(params.max_age_hours, Some(48));
  }

  #[test]
  fn test_cache_optimization_result() {
    let result = types::CacheOptimizationResult {
      freed_bytes: 1048576,
      removed_files: 5,
      remaining_files: 10,
      total_size_after: 2097152,
    };

    assert_eq!(result.freed_bytes, 1048576);
    assert_eq!(result.removed_files, 5);
    assert_eq!(result.remaining_files, 10);
    assert_eq!(result.total_size_after, 2097152);
  }

  #[test]
  fn test_prerender_segment_params_serialization() {
    let params = types::PrerenderSegmentParams {
      project_schema: create_test_project(),
      start_time: 5.0,
      end_time: 15.0,
      output_path: "/tmp/segment.mp4".to_string(),
    };

    let serialized = serde_json::to_string(&params).unwrap();
    assert!(serialized.contains("5.0"));
    assert!(serialized.contains("15.0"));
    assert!(serialized.contains("/tmp/segment.mp4"));
  }

  #[test]
  fn test_prerender_command_params_serialization() {
    let params = types::PrerenderCommandParams {
      segment_id: "test".to_string(),
      input_files: vec!["/input1.mp4".to_string(), "/input2.mp4".to_string()],
      output_path: "/output.mp4".to_string(),
      settings: serde_json::json!({"quality": "high"}),
    };

    let serialized = serde_json::to_string(&params).unwrap();
    assert!(serialized.contains("test"));
    assert!(serialized.contains("/input1.mp4"));
    assert!(serialized.contains("/input2.mp4"));
    assert!(serialized.contains("/output.mp4"));
    assert!(serialized.contains("quality"));
  }
}
