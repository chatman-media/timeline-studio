//! Export - Настройки экспорта и форматы вывода

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::common::Resolution;

/// Настройки проекта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectSettings {
  /// Настройки экспорта
  pub export: ExportSettings,
  /// Настройки превью
  pub preview: PreviewSettings,
  /// Пользовательские настройки
  pub custom: HashMap<String, serde_json::Value>,
  /// Настройки вывода (для обратной совместимости)
  pub output: OutputSettings,
  /// Разрешение (для обратной совместимости)
  pub resolution: Resolution,
  /// Частота кадров (для обратной совместимости)
  pub frame_rate: f64,
  /// Соотношение сторон (для обратной совместимости)
  pub aspect_ratio: super::common::AspectRatio,
}

/// Настройки вывода (для обратной совместимости)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OutputSettings {
  /// Формат вывода
  pub format: OutputFormat,
  /// Качество (от 0 до 100)
  pub quality: u32,
  /// Видео битрейт в kbps
  pub video_bitrate: Option<u32>,
  /// Аудио битрейт в kbps
  pub audio_bitrate: Option<u32>,
  /// Длительность вывода
  pub duration: f64,
}

impl Default for OutputSettings {
  fn default() -> Self {
    Self {
      format: OutputFormat::Mp4,
      quality: 85,
      video_bitrate: None,
      audio_bitrate: Some(192),
      duration: 0.0,
    }
  }
}

impl Default for ProjectSettings {
  fn default() -> Self {
    Self {
      export: ExportSettings::default(),
      preview: PreviewSettings::default(),
      custom: HashMap::new(),
      output: OutputSettings::default(),
      resolution: Resolution::full_hd(),
      frame_rate: 30.0,
      aspect_ratio: crate::video_compiler::schema::AspectRatio::default(),
    }
  }
}

/// Настройки экспорта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExportSettings {
  /// Формат вывода
  pub format: OutputFormat,
  /// Качество (от 1 до 100)
  pub quality: u8,
  /// Битрейт видео (kbps)
  pub video_bitrate: u32,
  /// Битрейт аудио (kbps)
  pub audio_bitrate: u32,
  /// Использовать аппаратное ускорение
  pub hardware_acceleration: bool,
  /// Предпочитаемый GPU кодировщик (опционально)
  pub preferred_gpu_encoder: Option<String>,
  /// Дополнительные параметры FFmpeg
  pub ffmpeg_args: Vec<String>,

  // Новые поля для расширенных настроек
  /// Профиль кодирования
  pub encoding_profile: Option<String>,
  /// Режим контроля битрейта
  pub rate_control_mode: Option<String>,
  /// Интервал ключевых кадров (GOP size)
  pub keyframe_interval: Option<u32>,
  /// Количество B-кадров
  pub b_frames: Option<u32>,
  /// Количество проходов кодирования (1 или 2)
  pub multi_pass: Option<u8>,
  /// Пресет скорости кодирования
  pub preset: Option<String>,
  /// Максимальный битрейт
  pub max_bitrate: Option<u32>,
  /// Минимальный битрейт
  pub min_bitrate: Option<u32>,
  /// CRF значение (0-51)
  pub crf: Option<u8>,
  /// Оптимизация для скорости
  pub optimize_for_speed: Option<bool>,
  /// Оптимизация для сети
  pub optimize_for_network: Option<bool>,
  /// Нормализация аудио
  pub normalize_audio: Option<bool>,
  /// Целевой уровень аудио в LKFS
  pub audio_target: Option<f32>,
  /// Пиковый уровень аудио в dBTP
  pub audio_peak: Option<f32>,
}

impl Default for ExportSettings {
  fn default() -> Self {
    use crate::video_compiler::core::constants::export::*;

    Self {
      format: OutputFormat::Mp4,
      quality: DEFAULT_QUALITY,
      video_bitrate: DEFAULT_VIDEO_BITRATE,
      audio_bitrate: DEFAULT_AUDIO_BITRATE,
      hardware_acceleration: DEFAULT_HARDWARE_ACCELERATION,
      preferred_gpu_encoder: None,
      ffmpeg_args: Vec::new(),

      // Новые поля по умолчанию
      encoding_profile: Some("main".to_string()),
      rate_control_mode: Some("vbr".to_string()),
      keyframe_interval: Some(DEFAULT_KEYFRAME_INTERVAL),
      b_frames: Some(2),
      multi_pass: Some(1),
      preset: Some("medium".to_string()),
      max_bitrate: None,
      min_bitrate: None,
      crf: None,
      optimize_for_speed: Some(false),
      optimize_for_network: Some(false),
      normalize_audio: Some(false),
      audio_target: Some(-23.0),
      audio_peak: Some(-1.0),
    }
  }
}

/// Формат вывода видео
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum OutputFormat {
  Mp4,
  Avi,
  Mov,
  Mkv,
  WebM,
  Gif,
  Custom(String),
}

/// Настройки превью
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PreviewSettings {
  /// Разрешение превью
  pub resolution: (u32, u32),
  /// Качество превью (от 1 до 100)
  pub quality: u8,
  /// FPS превью
  pub fps: u32,
  /// Формат превью
  pub format: PreviewFormat,
}

impl Default for PreviewSettings {
  fn default() -> Self {
    Self {
      resolution: (640, 360),
      quality: 75,
      fps: 15,
      format: PreviewFormat::Jpeg,
    }
  }
}

/// Формат превью
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum PreviewFormat {
  Jpeg,
  Png,
  WebP,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_output_settings_default() {
    let settings = OutputSettings::default();

    assert!(matches!(settings.format, OutputFormat::Mp4));
    assert_eq!(settings.quality, 85);
    assert_eq!(settings.video_bitrate, None);
    assert_eq!(settings.audio_bitrate, Some(192));
    assert_eq!(settings.duration, 0.0);
  }

  #[test]
  fn test_project_settings_default() {
    let settings = ProjectSettings::default();

    // Check export settings
    assert!(matches!(settings.export.format, OutputFormat::Mp4));

    // Check preview settings
    assert_eq!(settings.preview.resolution, (640, 360));
    assert_eq!(settings.preview.quality, 75);
    assert_eq!(settings.preview.fps, 15);

    // Check custom settings
    assert!(settings.custom.is_empty());

    // Check output settings
    assert!(matches!(settings.output.format, OutputFormat::Mp4));

    // Check resolution
    assert_eq!(settings.resolution.width, 1920);
    assert_eq!(settings.resolution.height, 1080);

    // Check frame rate
    assert_eq!(settings.frame_rate, 30.0);
  }

  #[test]
  fn test_export_settings_default() {
    let settings = ExportSettings::default();

    assert!(matches!(settings.format, OutputFormat::Mp4));
    assert_eq!(settings.quality, 85); // DEFAULT_QUALITY is 85
    assert!(settings.video_bitrate > 0);
    assert!(settings.audio_bitrate > 0);
    assert!(settings.hardware_acceleration); // DEFAULT_HARDWARE_ACCELERATION is true
    assert_eq!(settings.preferred_gpu_encoder, None);
    assert!(settings.ffmpeg_args.is_empty());

    // Check extended settings
    assert_eq!(settings.encoding_profile, Some("main".to_string()));
    assert_eq!(settings.rate_control_mode, Some("vbr".to_string()));
    assert_eq!(settings.keyframe_interval, Some(60)); // DEFAULT_KEYFRAME_INTERVAL is 60
    assert_eq!(settings.b_frames, Some(2));
    assert_eq!(settings.multi_pass, Some(1));
    assert_eq!(settings.preset, Some("medium".to_string()));
    assert_eq!(settings.max_bitrate, None);
    assert_eq!(settings.min_bitrate, None);
    assert_eq!(settings.crf, None);
    assert_eq!(settings.optimize_for_speed, Some(false));
    assert_eq!(settings.optimize_for_network, Some(false));
    assert_eq!(settings.normalize_audio, Some(false));
    assert_eq!(settings.audio_target, Some(-23.0));
    assert_eq!(settings.audio_peak, Some(-1.0));
  }

  #[test]
  fn test_output_format_variants() {
    let formats = vec![
      OutputFormat::Mp4,
      OutputFormat::Avi,
      OutputFormat::Mov,
      OutputFormat::Mkv,
      OutputFormat::WebM,
      OutputFormat::Gif,
      OutputFormat::Custom("custom_format".to_string()),
    ];

    for format in formats {
      match format {
        OutputFormat::Mp4 => {}  // Valid format variant,
        OutputFormat::Avi => {}  // Valid format variant,
        OutputFormat::Mov => {}  // Valid format variant,
        OutputFormat::Mkv => {}  // Valid format variant,
        OutputFormat::WebM => {} // Valid format variant,
        OutputFormat::Gif => {}  // Valid format variant,
        OutputFormat::Custom(name) => assert_eq!(name, "custom_format"),
      }
    }
  }

  #[test]
  fn test_preview_settings_default() {
    let settings = PreviewSettings::default();

    assert_eq!(settings.resolution, (640, 360));
    assert_eq!(settings.quality, 75);
    assert_eq!(settings.fps, 15);
    assert!(matches!(settings.format, PreviewFormat::Jpeg));
  }

  #[test]
  fn test_preview_format_variants() {
    let formats = vec![PreviewFormat::Jpeg, PreviewFormat::Png, PreviewFormat::WebP];

    for format in formats {
      match format {
        PreviewFormat::Jpeg => {} // Valid format variant,
        PreviewFormat::Png => {}  // Valid format variant,
        PreviewFormat::WebP => {} // Valid format variant,
      }
    }
  }

  #[test]
  #[allow(clippy::field_reassign_with_default)]
  fn test_export_settings_custom_values() {
    let mut settings = ExportSettings::default();

    // Modify values
    settings.format = OutputFormat::WebM;
    settings.quality = 95;
    settings.video_bitrate = 8000;
    settings.audio_bitrate = 320;
    settings.hardware_acceleration = true;
    settings.preferred_gpu_encoder = Some("h264_nvenc".to_string());
    settings.ffmpeg_args = vec!["-tune".to_string(), "film".to_string()];

    // Modify extended settings
    settings.encoding_profile = Some("high".to_string());
    settings.rate_control_mode = Some("cbr".to_string());
    settings.keyframe_interval = Some(60);
    settings.b_frames = Some(4);
    settings.multi_pass = Some(2);
    settings.preset = Some("slow".to_string());
    settings.max_bitrate = Some(10000);
    settings.min_bitrate = Some(5000);
    settings.crf = Some(23);
    settings.optimize_for_speed = Some(true);
    settings.optimize_for_network = Some(true);
    settings.normalize_audio = Some(true);
    settings.audio_target = Some(-16.0);
    settings.audio_peak = Some(-2.0);

    // Verify all values
    assert!(matches!(settings.format, OutputFormat::WebM));
    assert_eq!(settings.quality, 95);
    assert_eq!(settings.video_bitrate, 8000);
    assert_eq!(settings.audio_bitrate, 320);
    assert!(settings.hardware_acceleration);
    assert_eq!(
      settings.preferred_gpu_encoder,
      Some("h264_nvenc".to_string())
    );
    assert_eq!(settings.ffmpeg_args.len(), 2);
    assert_eq!(settings.encoding_profile, Some("high".to_string()));
    assert_eq!(settings.rate_control_mode, Some("cbr".to_string()));
    assert_eq!(settings.keyframe_interval, Some(60));
    assert_eq!(settings.b_frames, Some(4));
    assert_eq!(settings.multi_pass, Some(2));
    assert_eq!(settings.preset, Some("slow".to_string()));
    assert_eq!(settings.max_bitrate, Some(10000));
    assert_eq!(settings.min_bitrate, Some(5000));
    assert_eq!(settings.crf, Some(23));
    assert_eq!(settings.optimize_for_speed, Some(true));
    assert_eq!(settings.optimize_for_network, Some(true));
    assert_eq!(settings.normalize_audio, Some(true));
    assert_eq!(settings.audio_target, Some(-16.0));
    assert_eq!(settings.audio_peak, Some(-2.0));
  }

  #[test]
  fn test_project_settings_custom_values() {
    let mut settings = ProjectSettings::default();

    // Add custom settings
    settings
      .custom
      .insert("theme".to_string(), serde_json::json!("dark"));
    settings
      .custom
      .insert("watermark".to_string(), serde_json::json!(true));
    settings.custom.insert(
      "metadata".to_string(),
      serde_json::json!({
        "author": "Test User",
        "copyright": "2024"
      }),
    );

    assert_eq!(settings.custom.len(), 3);
    assert_eq!(
      settings.custom.get("theme"),
      Some(&serde_json::json!("dark"))
    );
    assert_eq!(
      settings.custom.get("watermark"),
      Some(&serde_json::json!(true))
    );
    assert!(settings.custom.contains_key("metadata"));
  }

  #[test]
  fn test_serialization_deserialization() {
    let settings = ProjectSettings::default();

    // Serialize
    let serialized = serde_json::to_string(&settings).unwrap();
    assert!(serialized.contains("\"export\""));
    assert!(serialized.contains("\"preview\""));
    assert!(serialized.contains("\"output\""));
    assert!(serialized.contains("\"resolution\""));

    // Deserialize
    let deserialized: ProjectSettings = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.frame_rate, settings.frame_rate);
    assert_eq!(deserialized.preview.resolution, settings.preview.resolution);
  }

  #[test]
  #[allow(clippy::field_reassign_with_default)]
  fn test_export_settings_edge_cases() {
    let mut settings = ExportSettings::default();

    // Test extreme quality values
    settings.quality = 1;
    assert_eq!(settings.quality, 1);

    settings.quality = 100;
    assert_eq!(settings.quality, 100);

    // Test empty ffmpeg args
    settings.ffmpeg_args.clear();
    assert!(settings.ffmpeg_args.is_empty());

    // Test many ffmpeg args
    for i in 0..10 {
      settings.ffmpeg_args.push(format!("-arg{}", i));
    }
    assert_eq!(settings.ffmpeg_args.len(), 10);

    // Test CRF bounds
    settings.crf = Some(0);
    assert_eq!(settings.crf, Some(0));

    settings.crf = Some(51);
    assert_eq!(settings.crf, Some(51));

    // Test multi-pass values
    settings.multi_pass = Some(1);
    assert_eq!(settings.multi_pass, Some(1));

    settings.multi_pass = Some(2);
    assert_eq!(settings.multi_pass, Some(2));
  }

  #[test]
  fn test_preview_settings_custom_resolutions() {
    let mut settings = PreviewSettings::default();

    // Test various resolutions
    let resolutions = vec![
      (320, 240),   // QVGA
      (640, 480),   // VGA
      (1280, 720),  // HD
      (1920, 1080), // Full HD
      (3840, 2160), // 4K
    ];

    for (width, height) in resolutions {
      settings.resolution = (width, height);
      assert_eq!(settings.resolution.0, width);
      assert_eq!(settings.resolution.1, height);
    }

    // Test various FPS values
    let fps_values = vec![15, 24, 25, 30, 60, 120];

    for fps in fps_values {
      settings.fps = fps;
      assert_eq!(settings.fps, fps);
    }
  }

  #[test]
  #[allow(clippy::field_reassign_with_default)]
  fn test_output_settings_modifications() {
    let mut settings = OutputSettings::default();

    // Test format changes
    settings.format = OutputFormat::Mkv;
    assert!(matches!(settings.format, OutputFormat::Mkv));

    // Test quality boundaries
    settings.quality = 0;
    assert_eq!(settings.quality, 0);

    settings.quality = 100;
    assert_eq!(settings.quality, 100);

    // Test bitrate settings
    settings.video_bitrate = Some(10000);
    settings.audio_bitrate = Some(512);
    assert_eq!(settings.video_bitrate, Some(10000));
    assert_eq!(settings.audio_bitrate, Some(512));

    // Test duration
    settings.duration = 3600.5; // 1 hour and 0.5 seconds
    assert_eq!(settings.duration, 3600.5);
  }

  #[test]
  fn test_export_settings_presets() {
    let mut settings = ExportSettings::default();

    // Test different preset values
    let presets = vec![
      "ultrafast",
      "superfast",
      "veryfast",
      "faster",
      "fast",
      "medium",
      "slow",
      "slower",
      "veryslow",
    ];

    for preset in presets {
      settings.preset = Some(preset.to_string());
      assert_eq!(settings.preset, Some(preset.to_string()));
    }
  }

  #[test]
  fn test_export_settings_encoders() {
    let mut settings = ExportSettings::default();

    // Test different GPU encoder values
    let encoders = vec![
      "h264_nvenc",
      "hevc_nvenc",
      "h264_amf",
      "hevc_amf",
      "h264_qsv",
      "hevc_qsv",
      "h264_videotoolbox",
      "hevc_videotoolbox",
    ];

    for encoder in encoders {
      settings.preferred_gpu_encoder = Some(encoder.to_string());
      assert_eq!(settings.preferred_gpu_encoder, Some(encoder.to_string()));
    }
  }

  #[test]
  #[allow(clippy::field_reassign_with_default)]
  fn test_audio_normalization_settings() {
    let mut settings = ExportSettings::default();

    // Test audio normalization settings
    settings.normalize_audio = Some(true);
    assert_eq!(settings.normalize_audio, Some(true));

    // Test various LKFS values
    let lkfs_values = vec![-14.0, -16.0, -20.0, -23.0, -24.0];

    for lkfs in lkfs_values {
      settings.audio_target = Some(lkfs);
      assert_eq!(settings.audio_target, Some(lkfs));
    }

    // Test various peak values
    let peak_values = vec![-0.1, -0.5, -1.0, -2.0, -3.0];

    for peak in peak_values {
      settings.audio_peak = Some(peak);
      assert_eq!(settings.audio_peak, Some(peak));
    }
  }
}
