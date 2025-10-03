//! Тесты для модуля platform_optimization

#[cfg(test)]
mod platform_optimization_tests {
  use super::super::*;

  #[test]
  fn test_platform_optimization_result_creation() {
    let result = types::PlatformOptimizationResult {
      success: true,
      output_path: "/tmp/optimized.mp4".to_string(),
      file_size: 1024000,
      duration: 30.0,
      width: 1920,
      height: 1080,
      bitrate: 5000,
      compression_ratio: 0.8,
      processing_time: 15.5,
      message: "Optimization completed".to_string(),
    };

    assert!(result.success);
    assert_eq!(result.output_path, "/tmp/optimized.mp4");
    assert_eq!(result.file_size, 1024000);
    assert_eq!(result.duration, 30.0);
    assert_eq!(result.width, 1920);
    assert_eq!(result.height, 1080);
    assert_eq!(result.compression_ratio, 0.8);
  }

  #[test]
  fn test_thumbnail_generation_result() {
    let result = types::ThumbnailGenerationResult {
      success: true,
      thumbnail_path: "/tmp/thumb.jpg".to_string(),
      width: 320,
      height: 240,
      file_size: 50000,
      message: "Thumbnail generated".to_string(),
    };

    assert!(result.success);
    assert_eq!(result.thumbnail_path, "/tmp/thumb.jpg");
    assert_eq!(result.width, 320);
    assert_eq!(result.height, 240);
    assert_eq!(result.file_size, 50000);
  }

  #[test]
  fn test_platform_optimization_params() {
    let params = types::PlatformOptimizationParams {
      input_path: "/input/video.mp4".to_string(),
      output_path: "/output/video.mp4".to_string(),
      target_width: 1920,
      target_height: 1080,
      target_bitrate: 5000,
      target_framerate: 30,
      audio_codec: "aac".to_string(),
      video_codec: "h264".to_string(),
      crop_to_fit: false,
    };

    assert_eq!(params.input_path, "/input/video.mp4");
    assert_eq!(params.target_width, 1920);
    assert_eq!(params.target_height, 1080);
    assert_eq!(params.target_bitrate, 5000);
    assert!(!params.crop_to_fit);
  }

  #[test]
  fn test_video_metadata() {
    let metadata = types::PlatformVideoMetadata {
      width: 1920,
      height: 1080,
      duration: 120.0,
      bitrate: 8000,
      framerate: 30.0,
      codec: "h264".to_string(),
      file_size: 100_000_000,
    };

    assert_eq!(metadata.width, 1920);
    assert_eq!(metadata.height, 1080);
    assert_eq!(metadata.duration, 120.0);
    assert_eq!(metadata.bitrate, 8000);
    assert_eq!(metadata.framerate, 30.0);
  }

  #[test]
  fn test_thumbnail_params() {
    let params = types::PlatformThumbnailParams {
      input_path: "/input/video.mp4".to_string(),
      output_path: "/output/thumb.jpg".to_string(),
      width: 640,
      height: 480,
      timestamp: 10.5,
      quality: Some(85),
    };

    assert_eq!(params.input_path, "/input/video.mp4");
    assert_eq!(params.width, 640);
    assert_eq!(params.height, 480);
    assert_eq!(params.timestamp, 10.5);
    assert_eq!(params.quality, Some(85));
  }

  #[test]
  fn test_platform_profile_youtube() {
    let profile = types::PlatformProfile::youtube();

    assert!(matches!(profile.platform, types::PlatformType::YouTube));
    assert_eq!(profile.max_width, 1920);
    assert_eq!(profile.max_height, 1080);
    assert_eq!(profile.max_bitrate, 8000);
    assert_eq!(profile.max_framerate, 60);
    assert_eq!(profile.preferred_codec, "h264");
    assert!(profile.max_duration.is_none());
  }

  #[test]
  fn test_platform_profile_instagram() {
    let profile = types::PlatformProfile::instagram();

    assert!(matches!(profile.platform, types::PlatformType::Instagram));
    assert_eq!(profile.max_width, 1080);
    assert_eq!(profile.max_height, 1080);
    assert_eq!(profile.max_bitrate, 3500);
    assert_eq!(profile.max_framerate, 30);
    assert_eq!(profile.max_duration, Some(60.0));
  }

  #[test]
  fn test_platform_profile_tiktok() {
    let profile = types::PlatformProfile::tiktok();

    assert!(matches!(profile.platform, types::PlatformType::TikTok));
    assert_eq!(profile.max_width, 1080);
    assert_eq!(profile.max_height, 1920);
    assert_eq!(profile.max_bitrate, 2500);
    assert_eq!(profile.max_framerate, 30);
    assert_eq!(profile.max_duration, Some(180.0));
  }

  #[test]
  fn test_validate_optimization_params_valid() {
    let params = types::PlatformOptimizationParams {
      input_path: "/input/video.mp4".to_string(),
      output_path: "/output/video.mp4".to_string(),
      target_width: 1920,
      target_height: 1080,
      target_bitrate: 5000,
      target_framerate: 30,
      audio_codec: "aac".to_string(),
      video_codec: "h264".to_string(),
      crop_to_fit: false,
    };

    let result = business_logic::validate_optimization_params(&params);
    assert!(result.is_ok());
  }

  #[test]
  fn test_validate_optimization_params_empty_input() {
    let params = types::PlatformOptimizationParams {
      input_path: "".to_string(),
      output_path: "/output/video.mp4".to_string(),
      target_width: 1920,
      target_height: 1080,
      target_bitrate: 5000,
      target_framerate: 30,
      audio_codec: "aac".to_string(),
      video_codec: "h264".to_string(),
      crop_to_fit: false,
    };

    let result = business_logic::validate_optimization_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_optimization_params_zero_dimensions() {
    let params = types::PlatformOptimizationParams {
      input_path: "/input/video.mp4".to_string(),
      output_path: "/output/video.mp4".to_string(),
      target_width: 0,
      target_height: 1080,
      target_bitrate: 5000,
      target_framerate: 30,
      audio_codec: "aac".to_string(),
      video_codec: "h264".to_string(),
      crop_to_fit: false,
    };

    let result = business_logic::validate_optimization_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_thumbnail_params_valid() {
    let params = types::PlatformThumbnailParams {
      input_path: "/input/video.mp4".to_string(),
      output_path: "/output/thumb.jpg".to_string(),
      width: 320,
      height: 240,
      timestamp: 10.0,
      quality: Some(85),
    };

    let result = business_logic::validate_thumbnail_params(&params);
    assert!(result.is_ok());
  }

  #[test]
  fn test_validate_thumbnail_params_negative_timestamp() {
    let params = types::PlatformThumbnailParams {
      input_path: "/input/video.mp4".to_string(),
      output_path: "/output/thumb.jpg".to_string(),
      width: 320,
      height: 240,
      timestamp: -5.0,
      quality: Some(85),
    };

    let result = business_logic::validate_thumbnail_params(&params);
    assert!(result.is_err());
  }

  #[test]
  fn test_build_ffmpeg_command() {
    let params = types::PlatformOptimizationParams {
      input_path: "/input/video.mp4".to_string(),
      output_path: "/output/video.mp4".to_string(),
      target_width: 1920,
      target_height: 1080,
      target_bitrate: 5000,
      target_framerate: 30,
      audio_codec: "aac".to_string(),
      video_codec: "h264".to_string(),
      crop_to_fit: false,
    };

    let cmd = business_logic::build_ffmpeg_command(&params);

    assert!(cmd.contains(&"ffmpeg".to_string()));
    assert!(cmd.contains(&"-i".to_string()));
    assert!(cmd.contains(&"/input/video.mp4".to_string()));
    assert!(cmd.contains(&"-c:v".to_string()));
    assert!(cmd.contains(&"h264".to_string()));
    assert!(cmd.contains(&"-c:a".to_string()));
    assert!(cmd.contains(&"aac".to_string()));
    assert!(cmd.contains(&"/output/video.mp4".to_string()));
  }

  #[test]
  fn test_build_ffmpeg_command_with_crop() {
    let params = types::PlatformOptimizationParams {
      input_path: "/input/video.mp4".to_string(),
      output_path: "/output/video.mp4".to_string(),
      target_width: 1080,
      target_height: 1080,
      target_bitrate: 3500,
      target_framerate: 30,
      audio_codec: "aac".to_string(),
      video_codec: "h264".to_string(),
      crop_to_fit: true,
    };

    let cmd = business_logic::build_ffmpeg_command(&params);

    assert!(cmd.contains(&"-vf".to_string()));
    let vf_index = cmd.iter().position(|x| x == "-vf").unwrap();
    let filter = &cmd[vf_index + 1];
    assert!(filter.contains("crop"));
    assert!(filter.contains("1080:1080"));
  }

  #[test]
  fn test_check_platform_compatibility_compatible() {
    let metadata = types::PlatformVideoMetadata {
      width: 1920,
      height: 1080,
      duration: 30.0,
      bitrate: 5000,
      framerate: 30.0,
      codec: "h264".to_string(),
      file_size: 50_000_000,
    };

    let profile = types::PlatformProfile::youtube();
    let result = business_logic::check_platform_compatibility(&metadata, &profile);

    assert!(result.compatible);
    assert!(result.issues.is_empty());
    assert!(result.recommendations.is_empty());
  }

  #[test]
  fn test_check_platform_compatibility_incompatible() {
    let metadata = types::PlatformVideoMetadata {
      width: 3840, // 4K - слишком большое для Instagram
      height: 2160,
      duration: 120.0, // Слишком долгое для Instagram
      bitrate: 10000,  // Слишком высокий битрейт
      framerate: 60.0, // Слишком высокая частота кадров
      codec: "h264".to_string(),
      file_size: 200_000_000,
    };

    let profile = types::PlatformProfile::instagram();
    let result = business_logic::check_platform_compatibility(&metadata, &profile);

    assert!(!result.compatible);
    assert!(!result.issues.is_empty());
    assert!(!result.recommendations.is_empty());
    assert!(result
      .issues
      .iter()
      .any(|issue| issue.contains("Разрешение")));
    assert!(result
      .issues
      .iter()
      .any(|issue| issue.contains("Длительность")));
    assert!(result.issues.iter().any(|issue| issue.contains("Битрейт")));
  }

  #[test]
  fn test_platform_compatibility_result() {
    let result = types::PlatformCompatibilityResult {
      platform: types::PlatformType::YouTube,
      compatible: true,
      issues: vec![],
      recommendations: vec![],
      estimated_processing_time: 12.0,
    };

    assert!(matches!(result.platform, types::PlatformType::YouTube));
    assert!(result.compatible);
    assert!(result.issues.is_empty());
    assert!(result.recommendations.is_empty());
    assert_eq!(result.estimated_processing_time, 12.0);
  }
}
