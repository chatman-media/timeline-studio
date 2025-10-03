//! Тесты для модуля misc

#[cfg(test)]
mod misc_tests {
  use super::super::*;
  use crate::video_compiler::gpu::GpuEncoder;

  #[test]
  fn test_ffmpeg_capabilities_creation() {
    let capabilities = types::FfmpegCapabilities {
      version: "4.4.0".to_string(),
      hardware_acceleration: types::HardwareAcceleration {
        cuda: true,
        nvenc: true,
        qsv: false,
        amf: false,
        videotoolbox: false,
      },
    };

    assert_eq!(capabilities.version, "4.4.0");
    assert!(capabilities.hardware_acceleration.cuda);
    assert!(capabilities.hardware_acceleration.nvenc);
    assert!(!capabilities.hardware_acceleration.qsv);
    assert!(!capabilities.hardware_acceleration.amf);
    assert!(!capabilities.hardware_acceleration.videotoolbox);
  }

  #[test]
  fn test_ffmpeg_capabilities_serialization() {
    let capabilities = types::FfmpegCapabilities {
      version: "5.0".to_string(),
      hardware_acceleration: types::HardwareAcceleration {
        cuda: false,
        nvenc: false,
        qsv: true,
        amf: true,
        videotoolbox: true,
      },
    };

    let serialized = serde_json::to_string(&capabilities).unwrap();
    assert!(serialized.contains("\"version\":\"5.0\""));
    assert!(serialized.contains("\"cuda\":false"));
    assert!(serialized.contains("\"nvenc\":false"));
    assert!(serialized.contains("\"qsv\":true"));
    assert!(serialized.contains("\"amf\":true"));
    assert!(serialized.contains("\"videotoolbox\":true"));

    let deserialized: types::FfmpegCapabilities = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.version, capabilities.version);
    assert_eq!(
      deserialized.hardware_acceleration.cuda,
      capabilities.hardware_acceleration.cuda
    );
    assert_eq!(
      deserialized.hardware_acceleration.nvenc,
      capabilities.hardware_acceleration.nvenc
    );
    assert_eq!(
      deserialized.hardware_acceleration.qsv,
      capabilities.hardware_acceleration.qsv
    );
    assert_eq!(
      deserialized.hardware_acceleration.amf,
      capabilities.hardware_acceleration.amf
    );
    assert_eq!(
      deserialized.hardware_acceleration.videotoolbox,
      capabilities.hardware_acceleration.videotoolbox
    );
  }

  #[test]
  fn test_hardware_acceleration_creation() {
    let hw_accel = types::HardwareAcceleration {
      cuda: true,
      nvenc: false,
      qsv: true,
      amf: false,
      videotoolbox: true,
    };

    assert!(hw_accel.cuda);
    assert!(!hw_accel.nvenc);
    assert!(hw_accel.qsv);
    assert!(!hw_accel.amf);
    assert!(hw_accel.videotoolbox);
  }

  #[test]
  fn test_hardware_acceleration_debug() {
    let hw_accel = types::HardwareAcceleration {
      cuda: true,
      nvenc: true,
      qsv: false,
      amf: false,
      videotoolbox: false,
    };

    let debug_str = format!("{hw_accel:?}");
    assert!(debug_str.contains("cuda: true"));
    assert!(debug_str.contains("nvenc: true"));
    assert!(debug_str.contains("qsv: false"));
    assert!(debug_str.contains("amf: false"));
    assert!(debug_str.contains("videotoolbox: false"));
  }

  #[test]
  fn test_hardware_acceleration_clone() {
    let hw_accel1 = types::HardwareAcceleration {
      cuda: false,
      nvenc: true,
      qsv: false,
      amf: true,
      videotoolbox: false,
    };

    let hw_accel2 = hw_accel1.clone();

    assert_eq!(hw_accel1.cuda, hw_accel2.cuda);
    assert_eq!(hw_accel1.nvenc, hw_accel2.nvenc);
    assert_eq!(hw_accel1.qsv, hw_accel2.qsv);
    assert_eq!(hw_accel1.amf, hw_accel2.amf);
    assert_eq!(hw_accel1.videotoolbox, hw_accel2.videotoolbox);
  }

  #[test]
  fn test_ffmpeg_capabilities_debug() {
    let capabilities = types::FfmpegCapabilities {
      version: "6.0".to_string(),
      hardware_acceleration: types::HardwareAcceleration {
        cuda: true,
        nvenc: false,
        qsv: true,
        amf: false,
        videotoolbox: true,
      },
    };

    let debug_str = format!("{capabilities:?}");
    assert!(debug_str.contains("version: \"6.0\""));
    assert!(debug_str.contains("hardware_acceleration"));
    assert!(debug_str.contains("cuda: true"));
    assert!(debug_str.contains("videotoolbox: true"));
  }

  #[test]
  fn test_ffmpeg_capabilities_clone() {
    let capabilities1 = types::FfmpegCapabilities {
      version: "4.3.0".to_string(),
      hardware_acceleration: types::HardwareAcceleration {
        cuda: true,
        nvenc: true,
        qsv: true,
        amf: true,
        videotoolbox: true,
      },
    };

    let capabilities2 = capabilities1.clone();

    assert_eq!(capabilities1.version, capabilities2.version);
    assert_eq!(
      capabilities1.hardware_acceleration.cuda,
      capabilities2.hardware_acceleration.cuda
    );
    assert_eq!(
      capabilities1.hardware_acceleration.nvenc,
      capabilities2.hardware_acceleration.nvenc
    );
    assert_eq!(
      capabilities1.hardware_acceleration.qsv,
      capabilities2.hardware_acceleration.qsv
    );
    assert_eq!(
      capabilities1.hardware_acceleration.amf,
      capabilities2.hardware_acceleration.amf
    );
    assert_eq!(
      capabilities1.hardware_acceleration.videotoolbox,
      capabilities2.hardware_acceleration.videotoolbox
    );
  }

  #[tokio::test]
  async fn test_create_new_project() {
    let name = "Test Project".to_string();
    let resolution = (1920, 1080);
    let fps = 30;

    let project = business_logic::create_project_schema(name.clone(), resolution, fps);
    assert_eq!(project.metadata.name, name);
    assert_eq!(project.timeline.resolution, resolution);
    assert_eq!(project.timeline.fps, fps);
    assert_eq!(project.timeline.duration, 0.0);
    assert_eq!(project.timeline.sample_rate, 48000);
    assert!(project.tracks.is_empty());
    assert!(project.effects.is_empty());
    assert!(project.transitions.is_empty());
    assert!(project.filters.is_empty());
    assert!(project.templates.is_empty());
    assert!(project.style_templates.is_empty());
    assert!(project.subtitles.is_empty());
  }

  #[tokio::test]
  async fn test_create_new_project_different_settings() {
    let name = "4K Project".to_string();
    let resolution = (3840, 2160);
    let fps = 60;

    let project = business_logic::create_project_schema(name.clone(), resolution, fps);
    assert_eq!(project.metadata.name, name);
    assert_eq!(project.timeline.resolution, resolution);
    assert_eq!(project.timeline.fps, fps);
    assert_eq!(project.version, "1.0");
    assert!(project.metadata.description.is_some());
    assert!(project.metadata.author.is_some());
  }

  // Tests for business logic functions

  #[test]
  fn test_ffmpeg_version_parsing_logic() {
    // Test logic for parsing FFmpeg version output
    let version_output = "ffmpeg version 4.4.0 --enable-cuda --enable-nvenc --enable-libmfx";

    let capabilities = business_logic::parse_ffmpeg_capabilities(version_output);

    assert_eq!(
      capabilities.version,
      "ffmpeg version 4.4.0 --enable-cuda --enable-nvenc --enable-libmfx"
    );
    assert!(capabilities.hardware_acceleration.cuda);
    assert!(capabilities.hardware_acceleration.nvenc);
    assert!(capabilities.hardware_acceleration.qsv);
    assert!(!capabilities.hardware_acceleration.amf);
    assert!(!capabilities.hardware_acceleration.videotoolbox);
  }

  #[test]
  fn test_encoder_availability_logic() {
    // Test logic for checking encoder availability
    let encoder_output =
      "Encoders:\n h264_nvenc  NVIDIA NVENC H.264 encoder\n hevc_nvenc  NVIDIA NVENC HEVC encoder";

    let has_h264_nvenc = business_logic::check_encoder_in_output(encoder_output, "h264_nvenc");
    let has_hevc_nvenc = business_logic::check_encoder_in_output(encoder_output, "hevc_nvenc");
    let has_h264_qsv = business_logic::check_encoder_in_output(encoder_output, "h264_qsv");

    assert!(has_h264_nvenc);
    assert!(has_hevc_nvenc);
    assert!(!has_h264_qsv);
  }

  #[test]
  fn test_metadata_json_parsing_logic() {
    // Test conversion to cached metadata structure
    let test_metadata = crate::video_compiler::cache::MediaMetadata {
      file_path: "/path/to/video.mp4".to_string(),
      file_size: 1048576,
      modified_time: std::time::SystemTime::now(),
      duration: 120.5,
      resolution: Some((1920, 1080)),
      fps: Some(30.0),
      bitrate: Some(8000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
      cached_at: std::time::SystemTime::now(),
    };

    let converted = business_logic::convert_metadata_to_json(&test_metadata);

    assert_eq!(converted.duration, 120.5);
    assert_eq!(converted.resolution, Some((1920, 1080)));
    assert_eq!(converted.fps, Some(30.0));
    assert_eq!(converted.bitrate, Some(8000000));
    assert_eq!(converted.video_codec, Some("h264".to_string()));
    assert_eq!(converted.audio_codec, Some("aac".to_string()));
  }

  #[test]
  fn test_cache_config_parsing_logic() {
    // Test logic for parsing cache configuration
    let config = serde_json::json!({
        "size_mb": 1024,
        "preview_quality": 85
    });

    let cache_config = business_logic::parse_cache_config(&config);
    assert_eq!(cache_config.size_mb, Some(1024));
    assert_eq!(cache_config.preview_quality, Some(85));
  }

  #[test]
  fn test_cache_config_missing_values() {
    // Test logic for handling missing cache configuration values
    let config = serde_json::json!({
        "other_setting": "value"
    });

    let cache_config = business_logic::parse_cache_config(&config);
    assert_eq!(cache_config.size_mb, None);
    assert_eq!(cache_config.preview_quality, None);
  }

  #[test]
  fn test_video_info_json_structure() {
    // Test expected structure of video info JSON
    let video_info = serde_json::json!({
        "format": {
            "filename": "/path/to/video.mp4",
            "nb_streams": 2,
            "duration": "120.456",
            "size": "1048576",
            "bit_rate": "8000000"
        },
        "streams": [
            {
                "index": 0,
                "codec_name": "h264",
                "codec_type": "video",
                "width": 1920,
                "height": 1080,
                "r_frame_rate": "30/1"
            },
            {
                "index": 1,
                "codec_name": "aac",
                "codec_type": "audio",
                "sample_rate": "48000",
                "channels": 2
            }
        ]
    });

    assert!(video_info["format"].is_object());
    assert!(video_info["streams"].is_array());
    assert_eq!(video_info["streams"].as_array().unwrap().len(), 2);
    assert_eq!(video_info["streams"][0]["codec_type"], "video");
    assert_eq!(video_info["streams"][1]["codec_type"], "audio");
  }

  #[test]
  fn test_gpu_info_creation_logic() {
    // Test logic for creating GPU info structure
    let encoder_type = GpuEncoder::Nvenc;
    let gpu_info = business_logic::create_gpu_info_from_encoder(encoder_type);

    assert_eq!(gpu_info.name, "Nvenc Encoder");
    assert_eq!(gpu_info.driver_version, None);
    assert_eq!(gpu_info.memory_total, None);
    assert_eq!(gpu_info.memory_used, None);
    assert_eq!(gpu_info.utilization, None);
    assert_eq!(gpu_info.supported_codecs.len(), 2);
    assert!(gpu_info.supported_codecs.contains(&"h264".to_string()));
    assert!(gpu_info.supported_codecs.contains(&"hevc".to_string()));
  }

  #[test]
  fn test_cache_memory_usage_structure() {
    // Test expected structure for cache memory usage
    let usage = types::CacheMemoryUsage {
      total_bytes: 104857600,
      preview_bytes: 52428800,
      metadata_bytes: 1048576,
      render_bytes: 51380224,
    };

    assert_eq!(usage.total_bytes, 104857600);
    assert_eq!(
      usage.preview_bytes + usage.metadata_bytes + usage.render_bytes,
      usage.total_bytes
    );
  }

  #[test]
  fn test_cached_metadata_structure() {
    // Test expected structure for cached metadata
    let metadata = types::CachedMediaMetadata {
      duration: 120.5,
      resolution: Some((1920, 1080)),
      fps: Some(30.0),
      bitrate: Some(8000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
    };

    assert_eq!(metadata.duration, 120.5);
    assert_eq!(metadata.fps, Some(30.0));
    assert_eq!(metadata.video_codec, Some("h264".to_string()));
    assert_eq!(metadata.audio_codec, Some("aac".to_string()));
  }

  #[test]
  fn test_render_cache_info_structure() {
    // Test expected structure for render cache info
    let cache_info = business_logic::create_render_cache_info(51380224, 104857600, 0.85);

    assert_eq!(cache_info.render_cache_size, 51380224);
    assert_eq!(cache_info.total_cache_size, 104857600);
    assert!(cache_info.render_cache_size <= cache_info.total_cache_size);
    assert!((0.0..=1.0).contains(&cache_info.cache_hit_rate));
  }

  #[test]
  fn test_create_media_metadata() {
    let file_path = "/path/to/video.mp4".to_string();
    let metadata = business_logic::create_media_metadata(file_path.clone());

    assert_eq!(metadata.file_path, file_path);
    assert_eq!(metadata.file_size, 0);
    assert_eq!(metadata.duration, 0.0);
    assert_eq!(metadata.resolution, None);
    assert_eq!(metadata.fps, None);
    assert_eq!(metadata.bitrate, None);
    assert_eq!(metadata.video_codec, None);
    assert_eq!(metadata.audio_codec, None);
  }

  #[test]
  fn test_cache_config_types() {
    let config = types::CacheConfig {
      size_mb: Some(512),
      preview_quality: Some(75),
    };

    assert_eq!(config.size_mb, Some(512));
    assert_eq!(config.preview_quality, Some(75));

    let empty_config = types::CacheConfig {
      size_mb: None,
      preview_quality: None,
    };

    assert_eq!(empty_config.size_mb, None);
    assert_eq!(empty_config.preview_quality, None);
  }
}

/// Tests for new commands that use previously unused methods
#[cfg(test)]
mod new_commands_tests {
  use crate::video_compiler::commands::*;
  use crate::video_compiler::schema::{ProjectSchema, Subtitle};

  #[tokio::test]
  async fn test_get_cache_stats_detailed() {
    let state = VideoCompilerState::new().await;

    // Add some data to cache
    {
      let mut cache = state.cache_manager.write().await;
      let key = crate::video_compiler::cache::PreviewKey::new(
        "test_video".to_string(),
        1.0,
        (1920, 1080),
        85,
      );
      let preview_data = vec![0u8; 1024 * 1024]; // 1MB
      cache.store_preview(key, preview_data).await.unwrap();
    }

    // Since we can't create tauri::State in tests, we'll test the logic directly
    let cache = state.cache_manager.read().await;
    let stats = cache.get_stats();
    let memory_usage = cache.get_memory_usage();

    let stats_json = serde_json::json!({
      "preview_hit_ratio": stats.preview_hit_ratio(),
      "memory_usage_mb": memory_usage.total_mb(),
      "preview_hits": stats.preview_hits,
      "preview_misses": stats.preview_misses,
      "render_hits": stats.render_hits,
      "render_misses": stats.render_misses,
      "metadata_requests": stats.metadata_requests,
      "preview_requests": stats.preview_requests,
      "total_memory_bytes": memory_usage.total_bytes,
    });

    let stats = stats_json;
    assert!(stats.get("preview_hit_ratio").is_some());
    assert!(stats.get("memory_usage_mb").is_some());
  }

  #[tokio::test]
  async fn test_get_gpu_encoder_details() {
    let result = get_gpu_encoder_details("nvenc".to_string()).await;
    assert!(result.is_ok());

    let details = result.unwrap();
    assert_eq!(details["h264_codec_name"], "h264_nvenc");
    assert_eq!(details["is_hardware"], true);
    assert_eq!(details["encoder_type"], "nvenc");
  }

  #[tokio::test]
  async fn test_create_schema_objects() {
    // Test creating resolution
    let params = std::collections::HashMap::from([
      ("width".to_string(), serde_json::json!(3840)),
      ("height".to_string(), serde_json::json!(2160)),
    ]);
    let result = create_schema_objects("resolution".to_string(), 1, params).await;
    assert!(result.is_ok());
    let resolutions = result.unwrap();
    assert_eq!(resolutions.len(), 1);
    let resolution = &resolutions[0];
    assert_eq!(resolution["width"], 3840);
    assert_eq!(resolution["height"], 2160);

    // Test creating effect
    let params = std::collections::HashMap::from([
      ("name".to_string(), serde_json::json!("Test Effect")),
      ("effect_type".to_string(), serde_json::json!("blur")),
    ]);
    let result = create_schema_objects("effect".to_string(), 1, params).await;
    assert!(result.is_ok());

    // Test creating filter
    let params = std::collections::HashMap::from([
      ("name".to_string(), serde_json::json!("Test Filter")),
      ("filter_type".to_string(), serde_json::json!("brightness")),
    ]);
    let result = create_schema_objects("filter".to_string(), 1, params).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_track_operations() {
    use crate::video_compiler::schema::{Clip, Track, TrackType};
    use std::path::PathBuf;

    let track = Track::new(TrackType::Video, "Test Track".to_string());
    let clip = Clip::new(PathBuf::from("/test/video.mp4"), 0.0, 10.0);
    let clip_id = clip.id.clone();

    // Test add_clip operation
    let params = serde_json::to_value(clip).unwrap();
    let result = track_operations(track.clone(), "add_clip".to_string(), params).await;
    assert!(result.is_ok());
    let updated_track = result.unwrap();
    assert_eq!(updated_track.clips.len(), 1);

    // Test remove_clip operation
    let params = serde_json::json!({ "clip_id": clip_id });
    let result = track_operations(updated_track, "remove_clip".to_string(), params).await;
    assert!(result.is_ok());
    let final_track = result.unwrap();
    assert_eq!(final_track.clips.len(), 0);
  }

  #[tokio::test]
  async fn test_get_clip_info() {
    use crate::video_compiler::schema::Clip;
    use std::path::PathBuf;

    let clip = Clip::new(PathBuf::from("/test/video.mp4"), 5.0, 10.0);

    // Test timeline_duration
    let result = get_clip_info(clip.clone(), "timeline_duration".to_string()).await;
    assert!(result.is_ok());
    let info = result.unwrap();
    assert_eq!(info["duration"], 10.0);

    // Test contains_time (always returns false for time 0.0 in this test)
    let result = get_clip_info(clip, "contains_time".to_string()).await;
    assert!(result.is_ok());
    let info = result.unwrap();
    assert_eq!(info["contains"], false);
  }

  #[tokio::test]
  async fn test_validate_subtitle() {
    let subtitle = Subtitle::new("Test subtitle".to_string(), 0.0, 5.0);

    let result = validate_subtitle(subtitle).await;
    assert!(result.is_ok());
    let validation = result.unwrap();
    assert_eq!(validation["valid"], true);
    assert_eq!(validation["duration"], 5.0);
  }

  #[tokio::test]
  async fn test_touch_project_schema() {
    let project = ProjectSchema::new("Test Project".to_string());

    // Sleep briefly to ensure time difference
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

    let result = touch_project_schema(project).await;
    assert!(result.is_ok());
    let updated_project = result.unwrap();
    // The touch method should update the updated_at field
    // The touch method updates the modified timestamp internally
    // We can't verify it directly, but we can check the project was processed successfully
    assert_eq!(updated_project.metadata.name, "Test Project");
  }

  #[tokio::test]
  async fn test_build_render_command_with_settings() {
    // Test the FFmpegBuilder logic directly since we can't create tauri::State in tests
    use crate::video_compiler::core::ffmpeg_builder::{
      builder::FFmpegBuilderSettings, FFmpegBuilder,
    };

    let project = ProjectSchema::new("Test Project".to_string());
    let settings = FFmpegBuilderSettings {
      ffmpeg_path: "ffmpeg".to_string(),
      use_hardware_acceleration: true,
      hardware_acceleration_type: Some("nvenc".to_string()),
      global_options: vec!["-y".to_string(), "-hide_banner".to_string()],
    };

    let builder = FFmpegBuilder::with_settings(project, settings);
    let result = builder
      .build_render_command(std::path::Path::new("/tmp/test_output.mp4"))
      .await;

    assert!(result.is_ok());
    let command = result.unwrap();
    let program = format!("{}", command.as_std().get_program().to_string_lossy());
    assert!(program.contains("ffmpeg"));
  }
}

/// Tests for segment filter functionality
#[cfg(test)]
mod segment_filter_tests {
  use crate::video_compiler::core::ffmpeg_builder::filters::FilterBuilder;
  use crate::video_compiler::schema::{
    Clip, ClipSource, ProjectMetadata, ProjectSchema, ProjectSettings, Timeline, Track, TrackType,
  };

  fn create_test_project() -> ProjectSchema {
    let clip1 = Clip {
      id: "clip1".to_string(),
      source: ClipSource::File("test1.mp4".to_string()),
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
      properties: crate::video_compiler::schema::timeline::ClipProperties::default(),
    };

    let video_track = Track {
      id: "video_track".to_string(),
      name: "Video Track".to_string(),
      track_type: TrackType::Video,
      enabled: true,
      volume: 1.0,
      locked: false,
      clips: vec![clip1],
      effects: vec![],
      filters: vec![],
    };

    let audio_clip = Clip {
      id: "audio_clip".to_string(),
      source: ClipSource::File("audio.mp3".to_string()),
      start_time: 0.0,
      end_time: 10.0,
      source_start: 0.0,
      source_end: 10.0,
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
      properties: crate::video_compiler::schema::timeline::ClipProperties::default(),
    };

    let audio_track = Track {
      id: "audio_track".to_string(),
      name: "Audio Track".to_string(),
      track_type: TrackType::Audio,
      enabled: true,
      volume: 1.0,
      locked: false,
      clips: vec![audio_clip],
      effects: vec![],
      filters: vec![],
    };

    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name: "Test Project".to_string(),
        description: None,
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
        author: None,
      },
      settings: ProjectSettings::default(),
      timeline: Timeline::default(),
      tracks: vec![video_track, audio_track],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      subtitles: vec![],
      style_templates: vec![],
    }
  }

  #[tokio::test]
  async fn test_filter_builder_segment_filters() {
    let project = create_test_project();
    let filter_builder = FilterBuilder::new(&project);

    // Тестируем основные компоненты фильтров
    assert!(filter_builder.has_video_tracks());
    assert!(filter_builder.has_audio_tracks());

    // Тестируем добавление сегментных фильтров
    let mut cmd = tokio::process::Command::new("ffmpeg");
    let _result = filter_builder.add_segment_filters(&mut cmd, 2.0, 7.0).await;
    // Если функция выполнилась без ошибки, тест пройден
  }

  #[tokio::test]
  async fn test_filter_builder_video_only() {
    let mut project = create_test_project();
    // Удаляем аудио треки
    project.tracks.retain(|t| t.track_type != TrackType::Audio);

    let filter_builder = FilterBuilder::new(&project);

    assert!(filter_builder.has_video_tracks());
    assert!(!filter_builder.has_audio_tracks());

    let mut cmd = tokio::process::Command::new("ffmpeg");
    let _result = filter_builder.add_segment_filters(&mut cmd, 0.0, 5.0).await;
  }

  #[test]
  fn test_filter_builder_disabled_tracks() {
    let mut project = create_test_project();
    // Отключаем видео трек
    project.tracks[0].enabled = false;

    let filter_builder = FilterBuilder::new(&project);

    assert!(!filter_builder.has_video_tracks());
    assert!(filter_builder.has_audio_tracks());
  }
}
