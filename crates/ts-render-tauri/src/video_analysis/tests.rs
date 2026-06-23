//! Тесты для модуля video_analysis

use super::*;
use tempfile::TempDir;

// ============ Тесты бизнес-логики ============

#[test]
fn test_parse_ffprobe_metadata_success() {
  let json_input = r#"{
    "format": {
      "duration": "120.5",
      "bit_rate": "8000000",
      "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
      "size": "123456789"
    },
    "streams": [
      {
        "codec_type": "video",
        "codec_name": "h264",
        "width": 1920,
        "height": 1080,
        "r_frame_rate": "30/1"
      },
      {
        "codec_type": "audio",
        "codec_name": "aac",
        "channels": 2,
        "sample_rate": "48000"
      }
    ]
  }"#;

  let result = parse_ffprobe_metadata(json_input).unwrap();

  assert_eq!(result.duration, 120.5);
  assert_eq!(result.width, 1920);
  assert_eq!(result.height, 1080);
  assert_eq!(result.fps, 30.0);
  assert_eq!(result.bitrate, 8000000);
  assert_eq!(result.codec, "h264");
  assert_eq!(result.format, "mov,mp4,m4a,3gp,3g2,mj2");
  assert!(result.has_audio);
  assert_eq!(result.audio_codec, Some("aac".to_string()));
  assert_eq!(result.audio_channels, Some(2));
  assert_eq!(result.audio_sample_rate, Some(48000));
  assert_eq!(result.file_size, 123456789);
}

#[test]
fn test_parse_fps_from_string_fraction() {
  assert_eq!(parse_fps_from_string("30/1"), 30.0);
  assert_eq!(parse_fps_from_string("24000/1001"), 23.976023976023978);
  assert_eq!(parse_fps_from_string("60/2"), 30.0);
  assert_eq!(parse_fps_from_string("120/4"), 30.0);
}

#[test]
fn test_calculate_quality_metrics_base() {
  let result = calculate_quality_metrics(false, false, None);

  assert_eq!(result.overall, 0.75);
  assert_eq!(result.sharpness, 0.8);
  assert_eq!(result.brightness, 0.6);
  assert_eq!(result.contrast, 0.7);
  assert_eq!(result.saturation, 0.65);
  assert_eq!(result.noise, 0.1);
  assert_eq!(result.stability, 0.9);
  // С базовыми параметрами (false, false, None) не должно быть проблем
  // brightness = 0.6 (не < 0.4), noise = 0.1 (не > 0.15), stability = 0.9 (не < 0.8)
  assert_eq!(result.issues.len(), 0);
}

#[test]
fn test_calculate_quality_metrics_with_issues() {
  let result = calculate_quality_metrics(true, true, None);

  assert_eq!(result.overall, 0.75);
  assert_eq!(result.noise, 0.2);
  assert_eq!(result.stability, 0.85);

  // Должны быть обнаружены проблемы: noise = 0.2 > 0.15
  assert_eq!(result.issues.len(), 1);
  assert!(result.issues[0].contains("шум"));
}

#[test]
fn test_generate_scene_detection_result_low_threshold() {
  let result = generate_scene_detection_result(0.2, 5.0, 60.0);

  assert_eq!(result.total_scenes, 6);
  assert!(result.average_scene_length > 0.0);
  assert_eq!(result.scenes.len(), 6);

  // Проверяем первую сцену
  assert_eq!(result.scenes[0].start_time, 0.0);
  assert!(result.scenes[0].end_time > result.scenes[0].start_time);
  assert!(result.scenes[0].confidence > 0.7);
}

#[test]
fn test_generate_scene_detection_result_high_threshold() {
  let result = generate_scene_detection_result(0.8, 5.0, 60.0);

  assert_eq!(result.total_scenes, 2);
  assert_eq!(result.scenes.len(), 2);

  // Высокий порог должен давать высокую уверенность
  assert!(result.scenes[0].confidence > 0.9);
}

#[test]
fn test_analyze_silence_patterns_strict_threshold() {
  let result = analyze_silence_patterns(-50.0, 2.0, 120.0);

  assert!(!result.silences.is_empty());
  assert!(result.speech_percentage > 80.0);
  assert!(result.total_silence_duration < 30.0);
}

#[test]
fn test_analyze_silence_patterns_soft_threshold() {
  let result = analyze_silence_patterns(-20.0, 1.0, 60.0);

  assert!(!result.silences.is_empty());
  assert!(result.speech_percentage < 80.0);
  assert!(result.total_silence_duration > 10.0);
}

#[test]
fn test_generate_motion_analysis_result_low_sensitivity() {
  let result = generate_motion_analysis_result(0.3);

  assert!(result.motion_intensity <= 0.24);
  assert!(result.camera_movement.stability > 0.8);
  assert!(result.object_movement <= 0.18);
  assert_eq!(result.motion_profile.len(), 10);
}

#[test]
fn test_generate_motion_analysis_result_high_sensitivity() {
  let result = generate_motion_analysis_result(0.9);

  assert!(result.motion_intensity >= 0.7);
  assert!(result.camera_movement.stability < 0.7);
  assert!(result.object_movement >= 0.5);
  assert!(result.camera_movement.panning > 0.2);
}

#[test]
fn test_generate_keyframe_extraction_result() {
  let result = generate_keyframe_extraction_result(5.0, 8);

  assert_eq!(result.key_frames.len(), 8);
  assert_eq!(result.thumbnail_path, "thumbnail.jpg");

  // Проверяем первый кадр
  assert_eq!(result.key_frames[0].timestamp, 0.0);
  assert!(result.key_frames[0].image_path.contains("keyframe_000"));
  assert!(result.key_frames[0].confidence >= 0.8);
  assert!(result.key_frames[0].description.is_some());
}

#[test]
fn test_generate_keyframe_extraction_result_max_limit() {
  let result = generate_keyframe_extraction_result(1.0, 15);

  // Должно быть ограничено до 10
  assert_eq!(result.key_frames.len(), 10);
}

#[test]
fn test_generate_audio_analysis_result_low_sample_rate() {
  let result = generate_audio_analysis_result(2.0);

  assert!(result.volume.average <= 0.12);
  assert!(result.quality.overall_quality <= 0.2);
  assert!(!result.quality.clipping);
  assert!(result.dynamics.compression_ratio < 3.0);
}

#[test]
fn test_generate_audio_analysis_result_high_sample_rate() {
  let result = generate_audio_analysis_result(9.0);

  assert!(result.volume.average >= 0.5);
  assert!(result.quality.overall_quality >= 0.8);
  assert!(result.quality.clipping);
  assert!(result.dynamics.compression_ratio > 2.8);
}

#[test]
fn test_generate_quick_analysis_result() {
  let result = generate_quick_analysis_result();

  assert!(result.is_object());
  assert_eq!(result["duration"], 120.0);
  assert_eq!(result["fps"], 30.0);
  assert_eq!(result["resolution"], "1920x1080");
  assert_eq!(result["has_audio"], true);
  assert_eq!(result["estimated_quality"], 0.8);
  assert!(result["timestamp"].is_number());
}

// ============ Интеграционные тесты ============

#[tokio::test]
async fn test_ffmpeg_get_metadata_integration() {
  let temp_dir = TempDir::new().unwrap();
  let video_path = temp_dir.path().join("test.mp4");
  std::fs::write(&video_path, b"fake video").unwrap();

  let result = ffmpeg_get_metadata(video_path.to_str().unwrap().to_string()).await;

  // Ожидаем ошибку с реальным FFmpeg, но проверяем структуру
  match result {
    Ok(_metadata) => {
      // Успех с настоящим видеофайлом
    }
    Err(e) => {
      let error_message = format!("{:?}", e);
      assert!(error_message.contains("ffprobe") || error_message.contains("Ошибка"));
    }
  }
}

/// Дополнительные интеграционные тесты для команд Tauri

#[tokio::test]
async fn test_get_metadata_success() {
  let temp_dir = TempDir::new().unwrap();
  let video_path = temp_dir.path().join("test.mp4");
  std::fs::write(&video_path, b"fake video content").unwrap();

  let result = ffmpeg_get_metadata(video_path.to_str().unwrap().to_string()).await;

  // Ожидаем ошибку FFmpeg с фейковым файлом
  assert!(result.is_err());
}

#[tokio::test]
#[ignore = "Requires real video file or FFmpeg mock"]
async fn test_detect_scenes_success() {
  let temp_dir = TempDir::new().unwrap();
  let video_path = temp_dir.path().join("test.mp4");
  std::fs::write(&video_path, b"fake video").unwrap();

  let result = ffmpeg_detect_scenes(video_path.to_str().unwrap().to_string(), 0.5, 2.0).await;

  // Должен вернуть результат с тестовыми данными
  assert!(result.is_ok());
  let scenes = result.unwrap();
  assert!(scenes.total_scenes > 0);
}

#[tokio::test]
#[ignore = "Requires real video file or FFmpeg mock"]
async fn test_analyze_quality_success() {
  let temp_dir = TempDir::new().unwrap();
  let video_path = temp_dir.path().join("test.mp4");
  std::fs::write(&video_path, b"fake video").unwrap();

  let result =
    ffmpeg_analyze_quality(video_path.to_str().unwrap().to_string(), 1.0, false, false).await;

  assert!(result.is_ok());
  let quality = result.unwrap();
  assert!(quality.overall >= 0.0 && quality.overall <= 1.0);
}

#[tokio::test]
#[ignore = "Requires real video file or FFmpeg mock"]
async fn test_analyze_quality_enhanced_success() {
  let temp_dir = TempDir::new().unwrap();
  let video_path = temp_dir.path().join("test.mp4");
  std::fs::write(&video_path, b"fake video").unwrap();

  let result =
    ffmpeg_analyze_quality(video_path.to_str().unwrap().to_string(), 2.0, true, true).await;

  assert!(result.is_ok());
  let quality = result.unwrap();
  assert!(quality.overall >= 0.0 && quality.overall <= 1.0);
  assert!(quality.noise > 0.15); // При включенной детекции шума
}

#[tokio::test]
#[ignore = "Requires real video file or FFmpeg mock"]
async fn test_detect_silence_success() {
  let temp_dir = TempDir::new().unwrap();
  let video_path = temp_dir.path().join("test.mp4");
  std::fs::write(&video_path, b"fake video").unwrap();

  let result = ffmpeg_detect_silence(video_path.to_str().unwrap().to_string(), -30.0, 1.0).await;

  assert!(result.is_ok());
  let silence = result.unwrap();
  assert!(silence.speech_percentage >= 0.0 && silence.speech_percentage <= 100.0);
}

#[tokio::test]
#[ignore = "Requires real video file or FFmpeg mock"]
async fn test_analyze_motion_success() {
  let temp_dir = TempDir::new().unwrap();
  let video_path = temp_dir.path().join("test.mp4");
  std::fs::write(&video_path, b"fake video").unwrap();

  let result = ffmpeg_analyze_motion(video_path.to_str().unwrap().to_string(), 0.7).await;

  assert!(result.is_ok());
  let motion = result.unwrap();
  assert!(motion.motion_intensity >= 0.0 && motion.motion_intensity <= 1.0);
  assert_eq!(motion.motion_profile.len(), 10);
}

#[tokio::test]
#[ignore = "Requires real video file or FFmpeg mock"]
async fn test_extract_keyframes_success() {
  let temp_dir = TempDir::new().unwrap();
  let video_path = temp_dir.path().join("test.mp4");
  std::fs::write(&video_path, b"fake video").unwrap();

  let result = ffmpeg_extract_keyframes(video_path.to_str().unwrap().to_string(), 5.0, 6).await;

  assert!(result.is_ok());
  let keyframes = result.unwrap();
  assert_eq!(keyframes.key_frames.len(), 6);
  assert!(!keyframes.thumbnail_path.is_empty());
}

#[tokio::test]
#[ignore = "Requires real video file or FFmpeg mock"]
async fn test_analyze_audio_success() {
  let temp_dir = TempDir::new().unwrap();
  let video_path = temp_dir.path().join("test.mp4");
  std::fs::write(&video_path, b"fake video").unwrap();

  let result = ffmpeg_analyze_audio(video_path.to_str().unwrap().to_string(), 5.0).await;

  assert!(result.is_ok());
  let audio = result.unwrap();
  assert!(audio.quality.overall_quality >= 0.0 && audio.quality.overall_quality <= 1.0);
}

#[tokio::test]
#[ignore = "Requires real video file or FFmpeg mock"]
async fn test_quick_analysis_success() {
  let temp_dir = TempDir::new().unwrap();
  let video_path = temp_dir.path().join("test.mp4");
  std::fs::write(&video_path, b"fake video").unwrap();

  let result = ffmpeg_quick_analysis(video_path.to_str().unwrap().to_string()).await;

  assert!(result.is_ok());
  let analysis = result.unwrap();
  assert!(analysis.is_object());
  assert_eq!(analysis["duration"], 120.0);
}

// Тесты сериализации
#[test]
fn test_quality_analysis_serialization() {
  let quality = QualityAnalysisResult {
    overall: 0.8,
    sharpness: 0.9,
    brightness: 0.7,
    contrast: 0.8,
    saturation: 0.75,
    noise: 0.1,
    stability: 0.95,
    issues: vec!["Тестовая проблема".to_string()],
  };

  let serialized = serde_json::to_string(&quality).unwrap();
  let deserialized: QualityAnalysisResult = serde_json::from_str(&serialized).unwrap();

  assert_eq!(quality.overall, deserialized.overall);
  assert_eq!(quality.issues.len(), deserialized.issues.len());
}

#[test]
fn test_motion_analysis_serialization() {
  let motion = MotionAnalysisResult {
    motion_intensity: 0.6,
    camera_movement: CameraMovement {
      panning: 0.3,
      tilting: 0.2,
      zooming: 0.1,
      stability: 0.8,
    },
    object_movement: 0.5,
    motion_profile: vec![MotionPoint {
      timestamp: 0.0,
      intensity: 0.6,
    }],
  };

  let serialized = serde_json::to_string(&motion).unwrap();
  let deserialized: MotionAnalysisResult = serde_json::from_str(&serialized).unwrap();

  assert_eq!(motion.motion_intensity, deserialized.motion_intensity);
  assert_eq!(
    motion.motion_profile.len(),
    deserialized.motion_profile.len()
  );
}

#[test]
fn test_audio_analysis_serialization() {
  let audio = AudioAnalysisResult {
    volume: VolumeData {
      average: 0.6,
      peak: 0.9,
      rms: 0.7,
    },
    frequency: FrequencyData {
      low_end: 0.5,
      mid_range: 0.8,
      high_end: 0.6,
    },
    dynamics: DynamicsData {
      dynamic_range: 0.7,
      compression_ratio: 2.5,
    },
    quality: AudioQuality {
      clipping: false,
      noise_level: 0.1,
      overall_quality: 0.8,
    },
  };

  let serialized = serde_json::to_string(&audio).unwrap();
  let deserialized: AudioAnalysisResult = serde_json::from_str(&serialized).unwrap();

  assert_eq!(audio.volume.average, deserialized.volume.average);
  assert_eq!(audio.quality.clipping, deserialized.quality.clipping);
}
