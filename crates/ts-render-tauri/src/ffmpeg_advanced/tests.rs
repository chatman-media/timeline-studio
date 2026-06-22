//! Тесты для продвинутых команд FFmpeg

#[cfg(test)]
mod ffmpeg_advanced_tests {
  // FS-тесты пишут/удаляют общие пути в /tmp; сериализуем их, т.к. крейтовый
  // cargo test многопоточный (в монолите спасал RUST_TEST_THREADS=1). #91 Wave 2.
  static FS_TEST_GUARD: std::sync::Mutex<()> = std::sync::Mutex::new(());
  use super::super::business_logic;
  use super::super::types::*;
  use ts_render::video_compiler::error::VideoCompilerError;

  #[test]
  fn test_validate_video_preview_params_valid() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    let params = VideoPreviewParams {
      input_path: "/tmp/test.mp4".to_string(),
      output_path: "/tmp/preview.mp4".to_string(),
      duration: 10.0,
      resolution: Some((1920, 1080)),
      bitrate: Some(5000),
    };

    // Создаем временный файл для теста
    std::fs::write("/tmp/test.mp4", b"test").ok();

    let result = business_logic::validate_video_preview_params(&params);
    assert!(result.is_ok());

    // Очищаем
    std::fs::remove_file("/tmp/test.mp4").ok();
  }

  #[test]
  fn test_validate_video_preview_params_invalid_duration() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    let params = VideoPreviewParams {
      input_path: "/tmp/test.mp4".to_string(),
      output_path: "/tmp/preview.mp4".to_string(),
      duration: -5.0,
      resolution: None,
      bitrate: None,
    };

    // Create temporary file to pass initial validation
    std::fs::write("/tmp/test.mp4", b"test").ok();

    let result = business_logic::validate_video_preview_params(&params);
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert_eq!(msg, "Duration must be positive");
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Clean up
    std::fs::remove_file("/tmp/test.mp4").ok();
  }

  #[test]
  fn test_validate_video_preview_params_invalid_resolution() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    let input_file = "/tmp/test_video_invalid_res.mp4";
    let params = VideoPreviewParams {
      input_path: input_file.to_string(),
      output_path: "/tmp/preview_invalid_res.mp4".to_string(),
      duration: 10.0,
      resolution: Some((0, 1080)),
      bitrate: None,
    };

    // Create temporary file to pass initial validation
    std::fs::write(input_file, b"test").ok();

    let result = business_logic::validate_video_preview_params(&params);
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert_eq!(msg, "Resolution dimensions must be positive");
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Clean up
    std::fs::remove_file(input_file).ok();
  }

  #[test]
  fn test_validate_gif_preview_params_valid() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    let params = GifPreviewParams {
      input_path: "/tmp/test.mp4".to_string(),
      output_path: "/tmp/output.gif".to_string(),
      start_time: 5.0,
      duration: 3.0,
      fps: 15,
      resolution: Some((640, 480)),
    };

    // Создаем временный файл для теста
    std::fs::write("/tmp/test.mp4", b"test").ok();

    let result = business_logic::validate_gif_preview_params(&params);
    assert!(result.is_ok());

    // Очищаем
    std::fs::remove_file("/tmp/test.mp4").ok();
  }

  #[test]
  fn test_validate_gif_preview_params_invalid_fps() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    let input_file = "/tmp/test_gif_invalid_fps.mp4";
    let params = GifPreviewParams {
      input_path: input_file.to_string(),
      output_path: "/tmp/output_invalid_fps.gif".to_string(),
      start_time: 0.0,
      duration: 3.0,
      fps: 100, // Too high
      resolution: None,
    };

    // Create temporary file to pass initial validation
    std::fs::write(input_file, b"test").ok();

    let result = business_logic::validate_gif_preview_params(&params);
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("FPS must be between 1 and 60"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Clean up
    std::fs::remove_file(input_file).ok();
  }

  #[test]
  fn test_validate_concat_params_valid() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    let params = ConcatVideosParams {
      input_paths: vec!["/tmp/video1.mp4".to_string(), "/tmp/video2.mp4".to_string()],
      output_path: "/tmp/concat.mp4".to_string(),
    };

    // Создаем временные файлы для теста
    std::fs::write("/tmp/video1.mp4", b"test").ok();
    std::fs::write("/tmp/video2.mp4", b"test").ok();

    let result = business_logic::validate_concat_params(&params);
    assert!(result.is_ok());

    // Очищаем
    std::fs::remove_file("/tmp/video1.mp4").ok();
    std::fs::remove_file("/tmp/video2.mp4").ok();
  }

  #[test]
  fn test_validate_concat_params_empty_input() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    let params = ConcatVideosParams {
      input_paths: vec![],
      output_path: "/tmp/concat.mp4".to_string(),
    };

    let result = business_logic::validate_concat_params(&params);
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("At least one input path is required"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }
  }

  #[test]
  fn test_validate_filter_params_valid() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    let params = VideoFilterParams {
      input_path: "/tmp/test.mp4".to_string(),
      output_path: "/tmp/filtered.mp4".to_string(),
      filter_name: "hflip".to_string(),
      duration: Some(5.0),
    };

    // Создаем временный файл для теста
    std::fs::write("/tmp/test.mp4", b"test").ok();

    let result = business_logic::validate_filter_params(&params);
    assert!(result.is_ok());

    // Очищаем
    std::fs::remove_file("/tmp/test.mp4").ok();
  }

  #[test]
  fn test_validate_filter_params_empty_filter() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    let params = VideoFilterParams {
      input_path: "/tmp/test.mp4".to_string(),
      output_path: "/tmp/filtered.mp4".to_string(),
      filter_name: "".to_string(),
      duration: None,
    };

    // Create temporary file to pass initial validation
    std::fs::write("/tmp/test.mp4", b"test").ok();

    let result = business_logic::validate_filter_params(&params);
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert_eq!(msg, "Filter name cannot be empty");
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Clean up
    std::fs::remove_file("/tmp/test.mp4").ok();
  }

  #[test]
  fn test_validate_input_path() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    // Test empty path
    let result = business_logic::validate_input_path("");
    assert!(result.is_err());

    // Test non-existent path
    let result = business_logic::validate_input_path("/non/existent/path.mp4");
    assert!(result.is_err());

    // Test valid path
    std::fs::write("/tmp/test_validate.mp4", b"test").ok();
    let result = business_logic::validate_input_path("/tmp/test_validate.mp4");
    assert!(result.is_ok());
    std::fs::remove_file("/tmp/test_validate.mp4").ok();
  }

  #[test]
  fn test_validate_output_path() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    // Test empty path
    let result = business_logic::validate_output_path("");
    assert!(result.is_err());

    // Test path without extension
    let result = business_logic::validate_output_path("/tmp/output");
    assert!(result.is_err());

    // Test valid path
    let result = business_logic::validate_output_path("/tmp/output.mp4");
    assert!(result.is_ok());

    // Test path with non-existent parent directory
    let result = business_logic::validate_output_path("/non/existent/dir/output.mp4");
    assert!(result.is_err());
  }

  #[test]
  fn test_parse_media_file_info() {
    let json_output = r#"{
      "format": {
        "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
        "duration": "60.5"
      },
      "streams": [
        {
          "codec_type": "video",
          "codec_name": "h264",
          "width": 1920,
          "height": 1080,
          "bit_rate": "5000000",
          "r_frame_rate": "30/1"
        },
        {
          "codec_type": "audio",
          "codec_name": "aac",
          "bit_rate": "128000"
        }
      ]
    }"#;

    let result = business_logic::parse_media_file_info(json_output);
    assert!(result.is_ok());

    let info = result.unwrap();
    assert!(info.format.contains("mp4"));
    assert_eq!(info.duration, 60.5);
    assert_eq!(info.video_codec, Some("h264".to_string()));
    assert_eq!(info.audio_codec, Some("aac".to_string()));
    assert_eq!(info.video_resolution, Some((1920, 1080)));
    assert_eq!(info.video_bitrate, Some(5000000));
    assert_eq!(info.audio_bitrate, Some(128000));
    assert_eq!(info.frame_rate, Some(30.0));
  }

  #[test]
  fn test_parse_frame_rate() {
    // Test with fraction format
    let json_output = r#"{
      "format": {"format_name": "mp4", "duration": "10"},
      "streams": [{
        "codec_type": "video",
        "r_frame_rate": "24000/1001"
      }]
    }"#;

    let result = business_logic::parse_media_file_info(json_output);
    assert!(result.is_ok());
    let info = result.unwrap();
    assert!((info.frame_rate.unwrap() - 23.976).abs() < 0.01);

    // Test with decimal format
    let json_output = r#"{
      "format": {"format_name": "mp4", "duration": "10"},
      "streams": [{
        "codec_type": "video",
        "r_frame_rate": "29.97"
      }]
    }"#;

    let result = business_logic::parse_media_file_info(json_output);
    assert!(result.is_ok());
    let info = result.unwrap();
    assert_eq!(info.frame_rate, Some(29.97));
  }

  #[test]
  fn test_parse_hardware_encoders() {
    let output = r#"
    V..... h264_nvenc           NVIDIA NVENC H.264 encoder (codec h264)
    V..... hevc_nvenc           NVIDIA NVENC HEVC encoder (codec hevc)
    V..... h264_videotoolbox    VideoToolbox H.264 Encoder (codec h264)
    V..... hevc_videotoolbox    VideoToolbox HEVC Encoder (codec hevc)
    V..... h264_vaapi           H.264/AVC (VAAPI) (codec h264)
    V..... libx264              libx264 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10 (codec h264)
    "#;

    let info = business_logic::parse_hardware_encoders(output);
    assert!(info.nvidia_available);
    assert!(info.videotoolbox_available);
    assert!(info.vaapi_available);
    assert_eq!(info.available_encoders.len(), 5);
  }

  #[test]
  fn test_parse_ffmpeg_version() {
    let output = r#"ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
built with gcc 12.2.0 (GCC)
configuration: --enable-gpl --enable-version3 --enable-nonfree --enable-libx264
libavutil      57. 28.100 / 57. 28.100
libavcodec     59. 37.100 / 59. 37.100
libavformat    59. 27.100 / 59. 27.100"#;

    let result = business_logic::parse_ffmpeg_version(output);
    assert!(result.is_ok());

    let info = result.unwrap();
    assert_eq!(info.version, "5.1.2");
    assert!(info.configuration.contains(&"--enable-gpl".to_string()));
    assert_eq!(info.libav_versions.len(), 3);
  }

  #[test]
  fn test_format_command_args() {
    let args = vec![
      "-i".to_string(),
      "input.mp4".to_string(),
      "-c:v".to_string(),
      "libx264".to_string(),
      "output.mp4".to_string(),
    ];

    let formatted = business_logic::format_command_args(&args);
    assert_eq!(formatted, "-i input.mp4 -c:v libx264 output.mp4");
  }

  #[test]
  fn test_create_execution_result() {
    use ts_render::video_compiler::progress::{RenderProgress, RenderStatus};
    use std::time::Duration;

    let progress = RenderProgress {
      job_id: "test".to_string(),
      stage: "encoding".to_string(),
      percentage: 50.0,
      current_frame: 500,
      total_frames: 1000,
      elapsed_time: Duration::from_secs(30),
      estimated_remaining: Some(Duration::from_secs(30)),
      status: RenderStatus::Processing,
      message: Some("Processing...".to_string()),
    };

    let result = business_logic::create_execution_result(
      0,
      "Success".to_string(),
      "".to_string(),
      5000,
      Some(progress),
    );

    assert_eq!(result.exit_code, 0);
    assert_eq!(result.stdout, "Success");
    assert_eq!(result.stderr, "");
    assert_eq!(result.duration_ms, 5000);
    assert!(result.final_progress.is_some());

    let ffmpeg_progress = result.final_progress.unwrap();
    assert_eq!(ffmpeg_progress.percentage, 50.0);
    assert_eq!(ffmpeg_progress.current_frame, 500);
    assert_eq!(ffmpeg_progress.total_frames, Some(1000));
  }

  #[test]
  fn test_check_execution_success() {
    // Test successful execution
    let success_result = FFmpegExecutionResult {
      exit_code: 0,
      stdout: "Success".to_string(),
      stderr: "".to_string(),
      duration_ms: 1000,
      final_progress: None,
    };

    assert!(business_logic::check_execution_success(&success_result).is_ok());

    // Test failed execution
    let failed_result = FFmpegExecutionResult {
      exit_code: 1,
      stdout: "".to_string(),
      stderr: "Error occurred".to_string(),
      duration_ms: 500,
      final_progress: None,
    };

    let result = business_logic::check_execution_success(&failed_result);
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::FFmpegError {
        exit_code,
        stderr,
        command,
      } => {
        assert_eq!(exit_code, Some(1));
        assert!(stderr.contains("Error occurred"));
        assert_eq!(command, "ffmpeg");
      }
      _ => panic!("Expected FFmpegError"),
    }
  }

  #[test]
  fn test_format_duration() {
    assert_eq!(business_logic::format_duration(30.5), "30.5s");
    assert_eq!(business_logic::format_duration(90.0), "1m 30s");
    assert_eq!(business_logic::format_duration(3661.0), "1h 1m");
    assert_eq!(business_logic::format_duration(7325.0), "2h 2m");
  }

  #[test]
  fn test_suggest_bitrate_for_resolution() {
    // SD
    assert_eq!(
      business_logic::suggest_bitrate_for_resolution((640, 480)),
      1000
    );

    // HD
    assert_eq!(
      business_logic::suggest_bitrate_for_resolution((1280, 720)),
      2500
    );

    // Full HD
    assert_eq!(
      business_logic::suggest_bitrate_for_resolution((1920, 1080)),
      5000
    );

    // 4K
    assert_eq!(
      business_logic::suggest_bitrate_for_resolution((3840, 2160)),
      15000
    );

    // 8K
    assert_eq!(
      business_logic::suggest_bitrate_for_resolution((7680, 4320)),
      25000
    );
  }

  #[test]
  fn test_validate_subtitle_preview_params() {
    let _fs_guard = FS_TEST_GUARD.lock().unwrap_or_else(|e| e.into_inner());
    let params = SubtitlePreviewParams {
      video_path: "/tmp/video.mp4".to_string(),
      subtitle_path: "/tmp/subs.srt".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      start_time: Some(5.0),
    };

    // Создаем временные файлы для теста
    std::fs::write("/tmp/video.mp4", b"test").ok();
    std::fs::write("/tmp/subs.srt", b"test").ok();

    let result = business_logic::validate_subtitle_preview_params(&params);
    assert!(result.is_ok());

    // Очищаем
    std::fs::remove_file("/tmp/video.mp4").ok();
    std::fs::remove_file("/tmp/subs.srt").ok();

    // Test negative start time
    let params_negative = SubtitlePreviewParams {
      video_path: "/tmp/video.mp4".to_string(),
      subtitle_path: "/tmp/subs.srt".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      start_time: Some(-5.0),
    };

    let result = business_logic::validate_subtitle_preview_params(&params_negative);
    assert!(result.is_err());
  }

  #[test]
  fn test_hardware_acceleration_info_serialization() {
    let info = HardwareAccelerationInfo {
      available_encoders: vec!["h264_nvenc".to_string(), "hevc_nvenc".to_string()],
      nvidia_available: true,
      videotoolbox_available: false,
      vaapi_available: false,
    };

    // Test serialization
    let serialized = serde_json::to_string(&info).unwrap();
    assert!(serialized.contains("h264_nvenc"));
    assert!(serialized.contains("nvidia_available"));

    // Test deserialization
    let deserialized: HardwareAccelerationInfo = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.available_encoders.len(), 2);
    assert!(deserialized.nvidia_available);
  }

  #[test]
  fn test_ffmpeg_execution_result_serialization() {
    let result = FFmpegExecutionResult {
      exit_code: 0,
      stdout: "Success".to_string(),
      stderr: "".to_string(),
      duration_ms: 5000,
      final_progress: Some(FFmpegProgress {
        percentage: 100.0,
        current_frame: 1000,
        total_frames: Some(1000),
        elapsed_time_secs: 5,
        message: Some("Completed".to_string()),
      }),
    };

    // Test serialization
    let serialized = serde_json::to_string(&result).unwrap();
    assert!(serialized.contains("\"exit_code\":0"));
    assert!(serialized.contains("\"percentage\":100.0"));

    // Test deserialization
    let deserialized: FFmpegExecutionResult = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.exit_code, 0);
    assert!(deserialized.final_progress.is_some());
  }
}
