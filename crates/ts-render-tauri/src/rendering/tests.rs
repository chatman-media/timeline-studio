//! Тесты для модуля рендеринга

#[cfg(test)]
mod rendering_tests {
  use super::super::business_logic;
  use super::super::types::*;
  use ts_render::video_compiler::error::VideoCompilerError;
  use ts_render::video_compiler::schema::{Clip, OutputFormat, ProjectSchema, Track, TrackType};

  fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("Test Project".to_string());

    // Add timeline settings
    project.timeline.duration = 10.0;
    project.timeline.fps = 30;
    project.timeline.resolution = (1920, 1080);

    // Add a test track with a clip
    let mut track = Track::new(TrackType::Video, "Video Track 1".to_string());
    let clip = Clip::new(std::path::PathBuf::from("/path/to/video.mp4"), 0.0, 5.0);
    track.clips.push(clip);
    project.tracks.push(track);

    project
  }

  #[test]
  fn test_apply_export_preset_youtube() {
    let project = create_test_project();
    let result = business_logic::apply_export_preset(project.clone(), "youtube");

    assert!(result.is_ok());
    let modified = result.unwrap();
    // Check format is Mp4 by matching pattern
    match modified.settings.export.format {
      OutputFormat::Mp4 => {}
      _ => panic!("Expected Mp4 format"),
    }
    assert_eq!(modified.settings.export.video_bitrate, 8000);
    assert_eq!(modified.settings.export.audio_bitrate, 192);
    assert_eq!(modified.settings.export.quality, 90);
  }

  #[test]
  fn test_apply_export_preset_instagram() {
    let project = create_test_project();
    let result = business_logic::apply_export_preset(project.clone(), "instagram");

    assert!(result.is_ok());
    let modified = result.unwrap();
    // Check format is Mp4 by matching pattern
    match modified.settings.export.format {
      OutputFormat::Mp4 => {}
      _ => panic!("Expected Mp4 format"),
    }
    assert_eq!(modified.settings.export.video_bitrate, 5000);
    assert_eq!(modified.settings.export.audio_bitrate, 128);
    assert_eq!(modified.settings.export.quality, 85);
  }

  #[test]
  fn test_apply_export_preset_twitter() {
    let project = create_test_project();
    let result = business_logic::apply_export_preset(project.clone(), "twitter");

    assert!(result.is_ok());
    let modified = result.unwrap();
    // Check format is Mp4 by matching pattern
    match modified.settings.export.format {
      OutputFormat::Mp4 => {}
      _ => panic!("Expected Mp4 format"),
    }
    assert_eq!(modified.settings.export.video_bitrate, 6000);
    assert_eq!(modified.settings.export.audio_bitrate, 128);
    assert_eq!(modified.settings.export.quality, 85);
  }

  #[test]
  fn test_apply_export_preset_unknown() {
    let project = create_test_project();
    let result = business_logic::apply_export_preset(project, "unknown_preset");

    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("Unknown preset: unknown_preset"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }
  }

  #[test]
  fn test_get_export_preset() {
    // Test valid presets
    let youtube = business_logic::get_export_preset("youtube");
    assert!(youtube.is_some());
    let preset = youtube.unwrap();
    assert_eq!(preset.name, "YouTube");
    assert_eq!(preset.format, "mp4");
    assert_eq!(preset.video_bitrate, 8000);

    let instagram = business_logic::get_export_preset("instagram");
    assert!(instagram.is_some());
    let preset = instagram.unwrap();
    assert_eq!(preset.name, "Instagram");
    assert_eq!(preset.video_bitrate, 5000);

    let twitter = business_logic::get_export_preset("twitter");
    assert!(twitter.is_some());
    let preset = twitter.unwrap();
    assert_eq!(preset.name, "Twitter");
    assert_eq!(preset.video_bitrate, 6000);

    // Test invalid preset
    let unknown = business_logic::get_export_preset("unknown");
    assert!(unknown.is_none());
  }

  #[test]
  fn test_get_available_presets() {
    let presets = business_logic::get_available_presets();
    assert_eq!(presets.len(), 3);
    assert!(presets.contains(&"youtube".to_string()));
    assert!(presets.contains(&"instagram".to_string()));
    assert!(presets.contains(&"twitter".to_string()));
  }

  #[test]
  fn test_validate_segment_timestamps() {
    // Valid timestamps
    let validation = business_logic::validate_segment_timestamps(0.0, 5.0, 10.0);
    assert!(validation.is_valid);
    assert_eq!(validation.segment_duration, 5.0);
    assert!(validation.warnings.is_none());

    // Negative start time
    let validation = business_logic::validate_segment_timestamps(-1.0, 5.0, 10.0);
    assert!(!validation.is_valid);
    assert_eq!(
      validation.warnings,
      Some("Start time cannot be negative".to_string())
    );

    // End time before start time
    let validation = business_logic::validate_segment_timestamps(5.0, 3.0, 10.0);
    assert!(!validation.is_valid);
    assert_eq!(
      validation.warnings,
      Some("End time must be greater than start time".to_string())
    );

    // End time exceeds duration
    let validation = business_logic::validate_segment_timestamps(5.0, 15.0, 10.0);
    assert!(!validation.is_valid);
    assert_eq!(
      validation.warnings,
      Some("End time exceeds project duration".to_string())
    );
  }

  #[test]
  fn test_create_segment_filters_info() {
    // Test with both video and audio
    let info = business_logic::create_segment_filters_info(0.0, 5.0, true, true);
    assert_eq!(info.segment_start, 0.0);
    assert_eq!(info.segment_end, 5.0);
    assert_eq!(info.duration, 5.0);
    assert!(info.has_video_tracks);
    assert!(info.has_audio_tracks);
    assert_eq!(info.filter_complexity, "complex");

    // Test with video only
    let info = business_logic::create_segment_filters_info(2.0, 7.0, true, false);
    assert_eq!(info.duration, 5.0);
    assert!(info.has_video_tracks);
    assert!(!info.has_audio_tracks);
    assert_eq!(info.filter_complexity, "simple");

    // Test with audio only
    let info = business_logic::create_segment_filters_info(1.0, 3.0, false, true);
    assert_eq!(info.duration, 2.0);
    assert!(!info.has_video_tracks);
    assert!(info.has_audio_tracks);
    assert_eq!(info.filter_complexity, "simple");
  }

  #[test]
  fn test_create_render_statistics() {
    let stats = business_logic::create_render_statistics(RenderStatisticsParams {
      job_id: "job-123".to_string(),
      frames_processed: 1000,
      memory_used: 2048576,
      error_count: 2,
      warning_count: 5,
      validation_time_secs: 10,
      preprocessing_time_secs: 20,
      composition_time_secs: 30,
      encoding_time_secs: 40,
      finalization_time_secs: 5,
    });

    assert_eq!(stats.job_id, "job-123");
    assert_eq!(stats.frames_processed, 1000);
    assert_eq!(stats.memory_used, 2048576);
    assert_eq!(stats.error_count, 2);
    assert_eq!(stats.warning_count, 5);
    assert_eq!(stats.validation_time_secs, 10);
    assert_eq!(stats.preprocessing_time_secs, 20);
    assert_eq!(stats.composition_time_secs, 30);
    assert_eq!(stats.encoding_time_secs, 40);
    assert_eq!(stats.finalization_time_secs, 5);
  }

  #[test]
  fn test_parse_custom_render_settings() {
    // Test with all settings
    let settings = serde_json::json!({
      "use_hardware_acceleration": true,
      "hardware_acceleration_type": "nvenc",
      "global_options": ["-threads", "8", "-preset", "fast"]
    });

    let parsed = business_logic::parse_custom_render_settings(&settings);
    assert!(parsed.use_hardware_acceleration);
    assert_eq!(parsed.hardware_acceleration_type, Some("nvenc".to_string()));
    assert_eq!(
      parsed.global_options,
      vec!["-threads", "8", "-preset", "fast"]
    );

    // Test with minimal settings
    let settings = serde_json::json!({});
    let parsed = business_logic::parse_custom_render_settings(&settings);
    assert!(!parsed.use_hardware_acceleration);
    assert!(parsed.hardware_acceleration_type.is_none());
    assert!(parsed.global_options.is_empty());

    // Test with partial settings
    let settings = serde_json::json!({
      "use_hardware_acceleration": true
    });
    let parsed = business_logic::parse_custom_render_settings(&settings);
    assert!(parsed.use_hardware_acceleration);
    assert!(parsed.hardware_acceleration_type.is_none());
  }

  #[test]
  fn test_command_to_string_array() {
    use tokio::process::Command;

    let mut cmd = Command::new("ffmpeg");
    cmd.args(["-i", "input.mp4", "-c:v", "libx264", "output.mp4"]);

    let result = business_logic::command_to_string_array(&cmd);
    assert_eq!(result[0], "ffmpeg");
    assert_eq!(result[1], "-i");
    assert_eq!(result[2], "input.mp4");
    assert_eq!(result[3], "-c:v");
    assert_eq!(result[4], "libx264");
    assert_eq!(result[5], "output.mp4");
  }

  #[test]
  fn test_create_project_info() {
    let project = create_test_project();
    let info = business_logic::create_project_info(&project);

    assert_eq!(info.name, "Test Project");
    assert_eq!(info.duration, 10.0);
    assert_eq!(info.resolution, (1920, 1080));
    assert_eq!(info.frame_rate, 30);
    assert!(info.format.contains("Mp4"));
  }

  #[test]
  fn test_create_ffmpeg_builder_info() {
    let info = business_logic::create_ffmpeg_builder_info(
      "/usr/local/bin/ffmpeg".to_string(),
      true,
      Some("cuda".to_string()),
      vec!["-threads".to_string(), "8".to_string()],
    );

    assert_eq!(info.ffmpeg_path, "/usr/local/bin/ffmpeg");
    assert!(info.use_hardware_acceleration);
    assert_eq!(info.hardware_acceleration_type, Some("cuda".to_string()));
    assert_eq!(info.global_options, vec!["-threads", "8"]);
  }

  #[test]
  fn test_create_clip_input_index_info() {
    // Test with found index
    let info = business_logic::create_clip_input_index_info("clip-1".to_string(), Some(3));
    assert_eq!(info.clip_id, "clip-1");
    assert_eq!(info.input_index, Some(3));
    assert!(info.found);

    // Test without index
    let info = business_logic::create_clip_input_index_info("clip-2".to_string(), None);
    assert_eq!(info.clip_id, "clip-2");
    assert!(info.input_index.is_none());
    assert!(!info.found);
  }

  #[test]
  fn test_create_frame_extraction_cache_info() {
    // Test with cache available
    let info = business_logic::create_frame_extraction_cache_info(true);
    assert!(info.cache_available);
    assert_eq!(info.message, "Frame extraction cache accessed successfully");

    // Test with cache not available
    let info = business_logic::create_frame_extraction_cache_info(false);
    assert!(!info.cache_available);
    assert_eq!(info.message, "Frame extraction cache not available");
  }

  #[test]
  fn test_validate_output_path() {
    // Valid paths
    assert!(business_logic::validate_output_path("/tmp/output.mp4").is_ok());
    assert!(business_logic::validate_output_path("C:\\Videos\\output.avi").is_ok());
    assert!(business_logic::validate_output_path("./relative/path/output.mov").is_ok());

    // Invalid - empty path
    let result = business_logic::validate_output_path("");
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("Output path cannot be empty"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Invalid - no extension
    let result = business_logic::validate_output_path("/tmp/output");
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("must have a file extension"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }
  }

  #[test]
  fn test_get_first_input_path() {
    // Test with normal project
    let project = create_test_project();
    let path = business_logic::get_first_input_path(&project);
    assert_eq!(path, std::path::PathBuf::from("/path/to/video.mp4"));

    // Test with empty project
    let mut empty_project = create_test_project();
    empty_project.tracks.clear();
    let path = business_logic::get_first_input_path(&empty_project);
    assert_eq!(path, std::path::PathBuf::from("/tmp/empty.mp4"));

    // Test with track but no clips
    let mut project_no_clips = create_test_project();
    project_no_clips.tracks[0].clips.clear();
    let path = business_logic::get_first_input_path(&project_no_clips);
    assert_eq!(path, std::path::PathBuf::from("/tmp/empty.mp4"));
  }

  #[test]
  fn test_validate_job_id() {
    // Valid job ID
    assert!(business_logic::validate_job_id("job-123").is_ok());
    assert!(business_logic::validate_job_id("a").is_ok());

    // Invalid - empty job ID
    let result = business_logic::validate_job_id("");
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("Job ID cannot be empty"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }
  }

  #[test]
  fn test_format_memory_size() {
    assert_eq!(business_logic::format_memory_size(0), "0 B");
    assert_eq!(business_logic::format_memory_size(512), "512.00 B");
    assert_eq!(business_logic::format_memory_size(1024), "1.00 KB");
    assert_eq!(business_logic::format_memory_size(1536), "1.50 KB");
    assert_eq!(business_logic::format_memory_size(1048576), "1.00 MB");
    assert_eq!(business_logic::format_memory_size(5242880), "5.00 MB");
    assert_eq!(business_logic::format_memory_size(1073741824), "1.00 GB");
    assert_eq!(business_logic::format_memory_size(1099511627776), "1.00 TB");
  }

  #[test]
  fn test_calculate_total_processing_time() {
    let stats = RenderStatistics {
      job_id: "test".to_string(),
      frames_processed: 1000,
      memory_used: 1048576,
      error_count: 0,
      warning_count: 0,
      validation_time_secs: 10,
      preprocessing_time_secs: 20,
      composition_time_secs: 30,
      encoding_time_secs: 40,
      finalization_time_secs: 5,
    };

    let total = business_logic::calculate_total_processing_time(&stats);
    assert_eq!(total, 105); // 10 + 20 + 30 + 40 + 5
  }

  #[test]
  fn test_export_preset_serialization() {
    let preset = ExportPreset {
      name: "Test Preset".to_string(),
      format: "mp4".to_string(),
      video_bitrate: 5000,
      audio_bitrate: 128,
      quality: 85,
    };

    // Test serialization
    let serialized = serde_json::to_string(&preset).unwrap();
    assert!(serialized.contains("Test Preset"));
    assert!(serialized.contains("mp4"));
    assert!(serialized.contains("5000"));

    // Test deserialization
    let deserialized: ExportPreset = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.name, preset.name);
    assert_eq!(deserialized.format, preset.format);
    assert_eq!(deserialized.video_bitrate, preset.video_bitrate);
  }

  #[test]
  fn test_render_statistics_serialization() {
    let stats = RenderStatistics {
      job_id: "job-456".to_string(),
      frames_processed: 2000,
      memory_used: 4194304,
      error_count: 1,
      warning_count: 3,
      validation_time_secs: 5,
      preprocessing_time_secs: 15,
      composition_time_secs: 25,
      encoding_time_secs: 60,
      finalization_time_secs: 10,
    };

    // Test serialization
    let serialized = serde_json::to_string(&stats).unwrap();
    assert!(serialized.contains("job-456"));
    assert!(serialized.contains("2000"));
    assert!(serialized.contains("4194304"));

    // Test deserialization
    let deserialized: RenderStatistics = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.job_id, stats.job_id);
    assert_eq!(deserialized.frames_processed, stats.frames_processed);
    assert_eq!(deserialized.memory_used, stats.memory_used);
  }

  #[test]
  fn test_custom_render_settings_default_values() {
    let settings = CustomRenderSettings {
      use_hardware_acceleration: false,
      hardware_acceleration_type: None,
      global_options: vec![],
    };

    assert!(!settings.use_hardware_acceleration);
    assert!(settings.hardware_acceleration_type.is_none());
    assert!(settings.global_options.is_empty());
  }

  #[test]
  fn test_segment_validation_edge_cases() {
    // Test exact duration match
    let validation = business_logic::validate_segment_timestamps(0.0, 10.0, 10.0);
    assert!(validation.is_valid);
    assert_eq!(validation.segment_duration, 10.0);

    // Test zero duration segment
    let validation = business_logic::validate_segment_timestamps(5.0, 5.0, 10.0);
    assert!(!validation.is_valid);

    // Test very small segment
    let validation = business_logic::validate_segment_timestamps(0.0, 0.001, 10.0);
    assert!(validation.is_valid);
    assert_eq!(validation.segment_duration, 0.001);
  }

  #[test]
  fn test_ffmpeg_project_info_format() {
    let info = FFmpegProjectInfo {
      name: "My Project".to_string(),
      duration: 120.5,
      resolution: (3840, 2160),
      frame_rate: 60,
      format: "ProRes".to_string(),
    };

    assert_eq!(info.name, "My Project");
    assert_eq!(info.duration, 120.5);
    assert_eq!(info.resolution.0, 3840);
    assert_eq!(info.resolution.1, 2160);
    assert_eq!(info.frame_rate, 60);
    assert_eq!(info.format, "ProRes");
  }
}
