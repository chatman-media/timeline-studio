//! Тесты для модуля ffmpeg_builder

#[cfg(test)]
mod ffmpeg_builder_tests {
  use super::super::*;
  use crate::video_compiler::schema::{
    timeline::{Clip, ClipProperties, ClipSource, Track, TrackType},
    ProjectMetadata, ProjectSchema, ProjectSettings, Timeline,
  };
  use chrono::Utc;
  use std::collections::HashMap;

  fn create_test_project() -> ProjectSchema {
    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name: "Test".to_string(),
        description: None,
        created_at: Utc::now(),
        modified_at: Utc::now(),
        author: None,
      },
      timeline: Timeline {
        duration: 10.0,
        ..Timeline::default()
      },
      tracks: vec![Track {
        id: "track1".to_string(),
        track_type: TrackType::Video,
        name: "Video Track".to_string(),
        enabled: true,
        volume: 1.0,
        locked: false,
        clips: vec![
          Clip {
            id: "clip1".to_string(),
            source: ClipSource::File("/test/video1.mp4".to_string()),
            start_time: 0.0,
            end_time: 5.0,
            source_start: 0.0,
            source_end: 5.0,
            speed: 1.0,
            opacity: 1.0,
            effects: vec![],
            filters: vec![],
            template_id: None,
            template_position: None,
            color_correction: None,
            crop: None,
            transform: None,
            audio_track_index: None,
            properties: ClipProperties::default(),
          },
          Clip {
            id: "clip2".to_string(),
            source: ClipSource::File("/test/video2.mp4".to_string()),
            start_time: 5.0,
            end_time: 10.0,
            source_start: 0.0,
            source_end: 5.0,
            speed: 1.0,
            opacity: 1.0,
            effects: vec![],
            filters: vec![],
            template_id: None,
            template_position: None,
            color_correction: None,
            crop: None,
            transform: None,
            audio_track_index: None,
            properties: ClipProperties::default(),
          },
        ],
        effects: vec![],
        filters: vec![],
      }],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![],
      settings: ProjectSettings::default(),
    }
  }

  #[test]
  fn test_segment_input_params_serialization() {
    let params = types::SegmentInputParams {
      project: create_test_project(),
      temp_dir: "/tmp".to_string(),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("project"));
    assert!(json.contains("temp_dir"));
  }

  #[test]
  fn test_prerender_settings_params_serialization() {
    let params = types::PrerenderSettingsParams {
      project: create_test_project(),
      output_path: "/tmp/output.mp4".to_string(),
      width: 1920,
      height: 1080,
      fps: 30.0,
      video_codec: "h264".to_string(),
      audio_codec: "aac".to_string(),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("1920"));
    assert!(json.contains("h264"));
  }

  #[test]
  fn test_segment_input_result_creation() {
    let mut clip_indices = HashMap::new();
    clip_indices.insert("clip1".to_string(), 0);
    clip_indices.insert("clip2".to_string(), 1);

    let result = types::SegmentInputResult {
      success: true,
      input_count: 2,
      clip_indices,
      error: None,
    };

    assert!(result.success);
    assert_eq!(result.input_count, 2);
    assert_eq!(result.clip_indices.len(), 2);
    assert!(result.error.is_none());
  }

  #[test]
  fn test_segment_input_result_with_error() {
    let result = types::SegmentInputResult {
      success: false,
      input_count: 0,
      clip_indices: HashMap::new(),
      error: Some("Test error".to_string()),
    };

    assert!(!result.success);
    assert_eq!(result.input_count, 0);
    assert!(result.clip_indices.is_empty());
    assert_eq!(result.error.as_ref().unwrap(), "Test error");
  }

  #[test]
  fn test_builder_info_defaults() {
    let info = business_logic::get_ffmpeg_builder_info_logic();

    assert!(info.supports_segment_inputs);
    assert!(info.supports_prerender_settings);
    assert_eq!(info.max_concurrent_inputs, 100);
    assert_eq!(info.supported_codecs.len(), 5);
    assert!(info.supported_codecs.contains(&"h264".to_string()));
    assert!(info.supported_codecs.contains(&"prores".to_string()));
  }

  #[test]
  fn test_create_clip_indices() {
    let project = create_test_project();
    let indices = business_logic::create_clip_indices(&project);

    assert_eq!(indices.len(), 2);
    assert_eq!(indices.get("clip1"), Some(&0));
    assert_eq!(indices.get("clip2"), Some(&1));
  }

  #[test]
  fn test_get_clip_input_index_logic() {
    let project = create_test_project();

    // Тест существующего клипа
    let result = business_logic::get_clip_input_index_logic(&project, "clip1");
    assert!(result.found);
    assert_eq!(result.index, Some(0));
    assert_eq!(result.clip_id, "clip1");

    // Тест второго клипа
    let result2 = business_logic::get_clip_input_index_logic(&project, "clip2");
    assert!(result2.found);
    assert_eq!(result2.index, Some(1));
    assert_eq!(result2.clip_id, "clip2");

    // Тест несуществующего клипа
    let result3 = business_logic::get_clip_input_index_logic(&project, "nonexistent");
    assert!(!result3.found);
    assert_eq!(result3.index, None);
    assert_eq!(result3.clip_id, "nonexistent");
  }

  #[test]
  fn test_validate_prerender_params_valid() {
    let params = types::PrerenderSettingsParams {
      project: create_test_project(),
      output_path: "/tmp/output.mp4".to_string(),
      width: 1920,
      height: 1080,
      fps: 30.0,
      video_codec: "h264".to_string(),
      audio_codec: "aac".to_string(),
    };

    let result = business_logic::validate_prerender_params(&params);
    assert!(result.is_ok());
  }

  #[test]
  fn test_validate_prerender_params_invalid_width() {
    let params = types::PrerenderSettingsParams {
      project: create_test_project(),
      output_path: "/tmp/output.mp4".to_string(),
      width: 0,
      height: 1080,
      fps: 30.0,
      video_codec: "h264".to_string(),
      audio_codec: "aac".to_string(),
    };

    let result = business_logic::validate_prerender_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_prerender_params_invalid_height() {
    let params = types::PrerenderSettingsParams {
      project: create_test_project(),
      output_path: "/tmp/output.mp4".to_string(),
      width: 1920,
      height: 0,
      fps: 30.0,
      video_codec: "h264".to_string(),
      audio_codec: "aac".to_string(),
    };

    let result = business_logic::validate_prerender_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_prerender_params_invalid_fps() {
    let params = types::PrerenderSettingsParams {
      project: create_test_project(),
      output_path: "/tmp/output.mp4".to_string(),
      width: 1920,
      height: 1080,
      fps: 0.0,
      video_codec: "h264".to_string(),
      audio_codec: "aac".to_string(),
    };

    let result = business_logic::validate_prerender_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_prerender_params_empty_codec() {
    let params = types::PrerenderSettingsParams {
      project: create_test_project(),
      output_path: "/tmp/output.mp4".to_string(),
      width: 1920,
      height: 1080,
      fps: 30.0,
      video_codec: "".to_string(),
      audio_codec: "aac".to_string(),
    };

    let result = business_logic::validate_prerender_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_segment_input_params_valid() {
    let params = types::SegmentInputParams {
      project: create_test_project(),
      temp_dir: "/tmp".to_string(),
    };

    let result = business_logic::validate_segment_input_params(&params);
    assert!(result.is_ok());
  }

  #[test]
  fn test_validate_segment_input_params_empty_temp_dir() {
    let params = types::SegmentInputParams {
      project: create_test_project(),
      temp_dir: "".to_string(),
    };

    let result = business_logic::validate_segment_input_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_segment_input_params_zero_duration() {
    let mut project = create_test_project();
    project.timeline.duration = 0.0;

    let params = types::SegmentInputParams {
      project,
      temp_dir: "/tmp".to_string(),
    };

    let result = business_logic::validate_segment_input_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_empty_project_handling() {
    let mut empty_project = create_test_project();
    empty_project.tracks.clear();

    let clips = business_logic::create_clip_indices(&empty_project);
    assert!(clips.is_empty());

    let result = types::SegmentInputResult {
      success: true,
      input_count: clips.len(),
      clip_indices: clips,
      error: None,
    };

    assert_eq!(result.input_count, 0);
    assert!(result.clip_indices.is_empty());
  }

  #[test]
  fn test_clip_index_result_creation() {
    let result = types::ClipIndexResult {
      clip_id: "test_clip".to_string(),
      index: Some(5),
      found: true,
    };

    assert_eq!(result.clip_id, "test_clip");
    assert_eq!(result.index, Some(5));
    assert!(result.found);
  }

  #[test]
  fn test_ffmpeg_command_result() {
    let result = types::FFmpegCommandResult {
      command: "ffmpeg -i input.mp4 output.mp4".to_string(),
      success: true,
      error: None,
    };

    assert!(result.success);
    assert!(result.error.is_none());
    assert!(result.command.contains("ffmpeg"));
  }

  #[test]
  fn test_clip_index_params() {
    let params = types::ClipIndexParams {
      clip_id: "test_clip".to_string(),
      project: create_test_project(),
    };

    assert_eq!(params.clip_id, "test_clip");
    assert_eq!(params.project.tracks.len(), 1);
    assert_eq!(params.project.tracks[0].clips.len(), 2);
  }
}
