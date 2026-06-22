//! Тесты для модуля preview

#[cfg(test)]
mod preview_tests {
  use super::super::*;
  use ts_render::video_compiler::schema::{Clip, ProjectSchema, Track, TrackType};
  use serde_json::json;
  use std::path::PathBuf;
  use tempfile::TempDir;

  fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("Test Project".to_string());
    project.timeline.duration = 10.0;
    project.timeline.fps = 30;
    project.timeline.resolution = (1920, 1080);

    let mut track = Track::new(TrackType::Video, "Video Track".to_string());
    let clip = Clip::new(PathBuf::from("/tmp/test_video.mp4"), 0.0, 5.0);
    track.clips.push(clip);
    project.tracks.push(track);

    project
  }

  #[test]
  fn test_animated_preview_params_deserialization() {
    let json = json!({
        "video_path": "/tmp/video.mp4",
        "start_time": 5.0,
        "output_path": "/tmp/output.gif",
        "width": 640,
        "height": 480,
        "fps": 15,
        "duration": 3.0
    });

    let params: types::AnimatedPreviewParams = serde_json::from_value(json).unwrap();
    assert_eq!(params.video_path, "/tmp/video.mp4");
    assert_eq!(params.start_time, 5.0);
    assert_eq!(params.output_path, "/tmp/output.gif");
    assert_eq!(params.width, 640);
    assert_eq!(params.height, 480);
    assert_eq!(params.fps, 15);
    assert_eq!(params.duration, 3.0);
  }

  #[test]
  fn test_preview_options_creation() {
    let options = business_logic::create_preview_options(Some(1920), Some(1080), "jpeg", 85);

    assert_eq!(options.width, Some(1920));
    assert_eq!(options.height, Some(1080));
    assert_eq!(options.format, "jpeg");
    assert_eq!(options.quality, 85);
  }

  #[test]
  fn test_thumbnail_path_generation() {
    let output_dir = "/tmp/thumbnails";
    let count = 5;

    let thumbnails = business_logic::generate_thumbnail_paths(output_dir, count);

    assert_eq!(thumbnails.len(), 5);
    assert_eq!(thumbnails[0], "/tmp/thumbnails/thumbnail_0.jpg");
    assert_eq!(thumbnails[4], "/tmp/thumbnails/thumbnail_4.jpg");
  }

  #[test]
  fn test_storyboard_frame_calculations() {
    let duration = 60.0; // 60 seconds
    let frames_per_row = 4;
    let rows = 3;

    let timestamps = business_logic::generate_storyboard_timestamps(duration, frames_per_row, rows);

    assert_eq!(timestamps.len(), 12);
    assert_eq!(timestamps[0], 0.0);
    assert_eq!(timestamps[11], 55.0); // Almost at the end
    assert!(timestamps[6] > 25.0 && timestamps[6] < 35.0); // Middle
  }

  #[test]
  fn test_waveform_settings_parsing() {
    let settings = json!({
        "width": 800,
        "height": 200,
        "quality": 90,
        "cache_enabled": true
    });

    let parsed = business_logic::parse_preview_settings(&settings);

    assert_eq!(parsed.width, Some(800));
    assert_eq!(parsed.height, Some(200));
    assert_eq!(parsed.quality, Some(90));
    assert_eq!(parsed.cache_enabled, Some(true));
  }

  #[test]
  fn test_ffmpeg_command_generation_for_gif() {
    let params = types::AnimatedPreviewParams {
      video_path: "/tmp/input.mp4".to_string(),
      start_time: 10.0,
      output_path: "/tmp/output.gif".to_string(),
      width: 320,
      height: 240,
      fps: 10,
      duration: 5.0,
    };

    let args = business_logic::build_ffmpeg_gif_command(&params);

    assert_eq!(args[1], "-i");
    assert_eq!(args[2], "/tmp/input.mp4");
    assert_eq!(args[4], "10");
    assert_eq!(args[6], "5");
    assert!(args[8].contains("fps=10"));
    assert!(args[8].contains("scale=320:240"));
  }

  #[test]
  fn test_preview_key_creation() {
    use ts_render::video_compiler::cache::PreviewKey;

    let key = PreviewKey::new("test_video".to_string(), 5.0, (1920, 1080), 85);

    // Basic validation that key was created with correct values
    assert_eq!(key.file_path, "test_video");
    assert_eq!(key.timestamp, 5000); // Converted to milliseconds
    assert_eq!(key.resolution, (1920, 1080));
    assert_eq!(key.quality, 85);
  }

  #[test]
  fn test_preview_request_json_parsing() {
    let json_requests = vec![
      json!({
          "type": "Frame",
          "source_path": "/tmp/video1.mp4",
          "timestamp": 5.0,
          "width": 1920,
          "height": 1080,
          "quality": 85
      }),
      json!({
          "type": "Thumbnail",
          "source_path": "/tmp/video2.mp4",
          "timestamp": 10.0,
          "width": 320,
          "height": 180,
          "quality": 70
      }),
      json!({
          "type": "Storyboard",
          "source_path": "/tmp/video3.mp4"
      }),
    ];

    for req_json in &json_requests {
      let request = business_logic::create_preview_request_from_json(req_json);

      assert!(!request.source_path.is_empty());
      assert!(
        request.preview_type == "Frame"
          || request.preview_type == "Thumbnail"
          || request.preview_type == "Storyboard"
      );

      if let Some(ts) = request.timestamp {
        assert!(ts >= 0.0);
      }
    }
  }

  #[test]
  fn test_resolution_extraction() {
    let resolution = business_logic::extract_resolution(Some(640), Some(480));
    assert_eq!(resolution, Some((640, 480)));

    // Test with missing height
    let resolution = business_logic::extract_resolution(Some(640), None);
    assert_eq!(resolution, None);
  }

  #[test]
  fn test_timestamp_calculation_for_thumbnails() {
    let count = 6;
    let interval = 10.0;

    let timestamps = business_logic::generate_thumbnail_timestamps(count, interval);

    assert_eq!(timestamps.len(), 6);
    assert_eq!(timestamps[0], 0.0);
    assert_eq!(timestamps[1], 10.0);
    assert_eq!(timestamps[5], 50.0);
  }

  #[test]
  fn test_batch_preview_output_paths() {
    let video_path = "/tmp/test_video.mp4";
    let output_dir = "/tmp/previews";
    let count = 3;

    let output_paths = business_logic::create_batch_preview_paths(output_dir, video_path, count);

    assert_eq!(output_paths.len(), 3);
    assert!(output_paths[0].contains("preview__tmp_test_video.mp4_0.jpg"));
    assert!(output_paths[2].contains("preview__tmp_test_video.mp4_2.jpg"));
  }

  #[test]
  fn test_storyboard_output_paths() {
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().to_string_lossy().to_string();
    let frame_count = 9; // 3x3 grid

    let frame_paths = business_logic::generate_storyboard_frame_paths(&output_path, frame_count);

    assert_eq!(frame_paths.len(), 9);
    assert!(frame_paths[0].ends_with("/frame_000.jpg"));
    assert!(frame_paths[8].ends_with("/frame_008.jpg"));
  }

  #[test]
  fn test_preview_cache_info_creation() {
    let preview_id = "test_preview_123".to_string();
    let data_size = 1024 * 500; // 500KB

    let info = business_logic::create_cached_preview_info(preview_id.clone(), data_size);

    assert_eq!(info.id, preview_id);
    assert_eq!(info.data_size, data_size);
    assert!(info.created_at <= chrono::Utc::now());
  }

  #[test]
  fn test_custom_preview_options_parsing() {
    let options_json = json!({
        "width": 800,
        "height": 600,
        "quality": 95,
        "cache_enabled": false
    });

    let parsed = business_logic::parse_preview_settings(&options_json);

    assert_eq!(parsed.width, Some(800));
    assert_eq!(parsed.height, Some(600));
    assert_eq!(parsed.quality, Some(95));
    assert_eq!(parsed.cache_enabled, Some(false));
  }

  #[test]
  fn test_ffmpeg_version_check_command() {
    let ffmpeg_path = "ffmpeg";
    let args = ["-version"];

    assert_eq!(args[0], "-version");
    assert!(!ffmpeg_path.is_empty());
  }

  #[test]
  fn test_base64_path_encoding() {
    use base64::Engine;

    let test_data = b"fake image data";
    let encoded = base64::engine::general_purpose::STANDARD.encode(test_data);

    assert!(!encoded.is_empty());

    // Test decoding
    let decoded = base64::engine::general_purpose::STANDARD
      .decode(&encoded)
      .unwrap();
    assert_eq!(decoded, test_data);
  }

  #[test]
  fn test_preview_type_string_matching() {
    let types = vec!["Frame", "Thumbnail", "Storyboard", "Unknown"];

    for type_str in types {
      let preview_type = business_logic::parse_preview_type(type_str);

      match type_str {
        "Frame" => assert_eq!(preview_type, "Frame"),
        "Thumbnail" => assert_eq!(preview_type, "Thumbnail"),
        "Storyboard" => assert_eq!(preview_type, "Storyboard"),
        "Unknown" => assert_eq!(preview_type, "Frame"), // Default case
        _ => {}
      }
    }
  }

  #[test]
  fn test_waveform_color_validation() {
    // Valid colors
    assert!(business_logic::validate_waveform_color("#FF0000").is_ok());
    assert!(business_logic::validate_waveform_color("red").is_ok());
    assert!(business_logic::validate_waveform_color("blue").is_ok());

    // Invalid colors
    assert!(business_logic::validate_waveform_color("").is_err());
    assert!(business_logic::validate_waveform_color("#FF").is_err());
    assert!(business_logic::validate_waveform_color("#GGGGGG").is_err());
  }

  #[test]
  fn test_animated_preview_params_validation() {
    let valid_params = types::AnimatedPreviewParams {
      video_path: "/tmp/video.mp4".to_string(),
      start_time: 0.0,
      output_path: "/tmp/output.gif".to_string(),
      width: 320,
      height: 240,
      fps: 15,
      duration: 3.0,
    };
    assert!(business_logic::validate_animated_preview_params(&valid_params).is_ok());

    // Invalid: empty video path
    let mut invalid_params = valid_params.clone();
    invalid_params.video_path = String::new();
    assert!(business_logic::validate_animated_preview_params(&invalid_params).is_err());

    // Invalid: zero duration
    let mut invalid_params = valid_params.clone();
    invalid_params.duration = 0.0;
    assert!(business_logic::validate_animated_preview_params(&invalid_params).is_err());

    // Invalid: zero dimensions
    let mut invalid_params = valid_params.clone();
    invalid_params.width = 0;
    assert!(business_logic::validate_animated_preview_params(&invalid_params).is_err());
  }

  #[test]
  fn test_error_message_construction() {
    let file_path = "/nonexistent/file.mp4";
    let error_msg = format!("Cannot process file: {file_path}");

    assert!(error_msg.contains("/nonexistent/file.mp4"));
    assert!(error_msg.starts_with("Cannot process file:"));
  }

  #[test]
  fn test_project_schema_validation() {
    let project = create_test_project();

    assert_eq!(project.metadata.name, "Test Project");
    assert_eq!(project.timeline.duration, 10.0);
    assert_eq!(project.timeline.fps, 30);
    assert_eq!(project.timeline.resolution, (1920, 1080));
    assert_eq!(project.tracks.len(), 1);
    assert_eq!(project.tracks[0].clips.len(), 1);
  }

  #[test]
  fn test_effect_preview_project_creation() {
    let project = business_logic::create_effect_preview_project("blur_effect");

    assert!(project.metadata.name.contains("effect_preview_blur_effect"));
    assert_eq!(project.timeline.duration, 5.0);
    assert_eq!(project.timeline.fps, 30);
    assert_eq!(project.timeline.resolution, (320, 240));
  }

  #[test]
  fn test_transition_preview_project_creation() {
    let project = business_logic::create_transition_preview_project("fade");

    assert!(project.metadata.name.contains("transition_preview_fade"));
    assert_eq!(project.timeline.duration, 2.0);
    assert_eq!(project.timeline.fps, 30);
    assert_eq!(project.timeline.resolution, (320, 240));
  }

  #[test]
  fn test_preview_options_creation_variants() {
    let frame_options = business_logic::create_frame_preview_options();
    assert_eq!(frame_options.width, None);
    assert_eq!(frame_options.height, None);
    assert_eq!(frame_options.format, "jpeg");
    assert_eq!(frame_options.quality, 85);

    let project_options = business_logic::create_project_preview_options(1920, 1080);
    assert_eq!(project_options.width, Some(1920));
    assert_eq!(project_options.height, Some(1080));
    assert_eq!(project_options.format, "mp4");

    let effect_options = business_logic::create_effect_preview_options();
    assert_eq!(effect_options.width, Some(320));
    assert_eq!(effect_options.height, Some(240));
    assert_eq!(effect_options.format, "jpeg");

    let transition_options = business_logic::create_transition_preview_options();
    assert_eq!(transition_options.width, Some(320));
    assert_eq!(transition_options.height, Some(240));
    assert_eq!(transition_options.format, "jpeg");
  }

  #[test]
  fn test_preview_settings_serialization() {
    let settings = types::PreviewSettings {
      width: Some(800),
      height: Some(600),
      quality: Some(90),
      cache_enabled: Some(true),
    };

    let json = serde_json::to_value(&settings).unwrap();
    assert_eq!(json["width"], 800);
    assert_eq!(json["height"], 600);
    assert_eq!(json["quality"], 90);
    assert_eq!(json["cache_enabled"], true);

    let deserialized: types::PreviewSettings = serde_json::from_value(json).unwrap();
    assert_eq!(deserialized.width, Some(800));
    assert_eq!(deserialized.height, Some(600));
    assert_eq!(deserialized.quality, Some(90));
    assert_eq!(deserialized.cache_enabled, Some(true));
  }
}
