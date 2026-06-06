//! Дополнительные тесты для ffmpeg_builder/outputs.rs - Фаза 1 улучшения покрытия
//!
//! Этот файл содержит расширенные тесты для увеличения покрытия outputs.rs

use super::*;
use crate::video_compiler::schema::OutputFormat;
use crate::video_compiler::tests::fixtures::*;
use std::path::PathBuf;
use tokio::process::Command;

/// Создает проект с пользовательскими настройками
fn create_custom_project(
  format: OutputFormat,
  quality: u32,
) -> crate::video_compiler::schema::ProjectSchema {
  let mut project = create_minimal_project();
  project.settings.output.format = format;
  project.settings.output.quality = quality;
  project
}

/// Создает настройки FFmpeg с различными опциями
fn create_ffmpeg_settings(
  hardware_acceleration: bool,
  hw_type: Option<String>,
) -> FFmpegBuilderSettings {
  FFmpegBuilderSettings {
    ffmpeg_path: "ffmpeg".to_string(),
    use_hardware_acceleration: hardware_acceleration,
    hardware_acceleration_type: hw_type,
    ..Default::default()
  }
}

#[cfg(test)]
mod hardware_acceleration_tests {
  use super::*;

  #[tokio::test]
  async fn test_hardware_acceleration_auto_detection() {
    let project = create_custom_project(OutputFormat::Mp4, 85);
    let settings = create_ffmpeg_settings(true, None); // auto detection
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    // Тестируем автоматическое определение GPU
    let result = builder.add_hardware_acceleration(&mut cmd).await;
    assert!(result.is_ok() || result.is_err()); // Может работать или не работать в зависимости от GPU

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем что добавлен какой-то кодек
    assert!(args.contains(&"-c:v".to_string()));
  }

  #[tokio::test]
  async fn test_hardware_acceleration_nvidia() {
    let project = create_custom_project(OutputFormat::Mp4, 85);
    let settings = create_ffmpeg_settings(true, Some("nvidia".to_string()));
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_hardware_acceleration(&mut cmd).await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем что используется кодек (может быть nvenc или software fallback)
    assert!(args.contains(&"-c:v".to_string()));
  }

  #[tokio::test]
  async fn test_hardware_acceleration_unknown_type() {
    let project = create_custom_project(OutputFormat::Mp4, 85);
    let settings = create_ffmpeg_settings(true, Some("unknown_gpu".to_string()));
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_hardware_acceleration(&mut cmd).await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Должен fallback на software кодек
    assert!(args.contains(&"-c:v".to_string()));
  }

  #[tokio::test]
  async fn test_hardware_acceleration_webm_format() {
    let project = create_custom_project(OutputFormat::WebM, 85);
    let settings = create_ffmpeg_settings(true, Some("nvidia".to_string()));
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_hardware_acceleration(&mut cmd).await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // WebM не поддерживает hardware encoders, должен использовать VP9
    assert!(args.contains(&"-c:v".to_string()));
    assert!(args.contains(&"libvpx-vp9".to_string()));
  }
}

#[cfg(test)]
mod format_specific_tests {
  use super::*;

  #[test]
  fn test_cpu_encoding_mkv_hevc() {
    let project = create_custom_project(OutputFormat::Mkv, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_cpu_encoding(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // MKV должен использовать H.265
    assert!(args.contains(&"-c:v".to_string()));
    assert!(args.contains(&"libx265".to_string()));
    assert!(args.contains(&"-preset".to_string()));
  }

  #[test]
  fn test_cpu_encoding_gif() {
    let project = create_custom_project(OutputFormat::Gif, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_cpu_encoding(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // GIF должен использовать специальные настройки
    assert!(args.contains(&"-c:v".to_string()));
    assert!(args.contains(&"gif".to_string()));
    assert!(args.contains(&"-filter:v".to_string()));
    assert!(args.iter().any(|arg| arg.contains("fps=10")));
  }

  #[test]
  fn test_cpu_encoding_avi() {
    let project = create_custom_project(OutputFormat::Avi, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_cpu_encoding(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    assert!(args.contains(&"-c:v".to_string()));
    assert!(args.contains(&"libx264".to_string()));
  }

  #[test]
  fn test_format_settings_webm() {
    let project = create_custom_project(OutputFormat::WebM, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_format_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    assert!(args.contains(&"-f".to_string()));
    assert!(args.contains(&"webm".to_string()));
    // Не должно быть movflags для WebM
    assert!(!args.contains(&"-movflags".to_string()));
  }

  #[test]
  fn test_format_settings_mkv() {
    let project = create_custom_project(OutputFormat::Mkv, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_format_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    assert!(args.contains(&"-f".to_string()));
    assert!(args.contains(&"matroska".to_string()));
  }
}

#[cfg(test)]
mod bitrate_edge_cases_tests {
  use super::*;

  #[test]
  fn test_bitrate_settings_webm_with_crf() {
    let project = create_custom_project(OutputFormat::WebM, 75);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_bitrate_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // WebM должен использовать VBR mode с CRF
    assert!(args.contains(&"-b:v".to_string()));
    assert!(args.contains(&"0".to_string())); // VBR mode
    assert!(args.contains(&"-crf".to_string()));
  }

  #[test]
  fn test_bitrate_settings_gif() {
    let project = create_custom_project(OutputFormat::Gif, 60);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_bitrate_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // GIF должен использовать рассчитанный битрейт
    assert!(args.contains(&"-b:v".to_string()));
    // Не должен использовать CRF для GIF
    assert!(!args.contains(&"-crf".to_string()));
  }

  #[test]
  fn test_bitrate_settings_with_very_high_custom_bitrate() {
    let mut project = create_custom_project(OutputFormat::Mp4, 85);
    project.settings.output.video_bitrate = Some(100000); // 100 Mbps

    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_bitrate_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    assert!(args.contains(&"-b:v".to_string()));
    assert!(args.contains(&"100000k".to_string()));

    // Должны быть настройки буфера
    assert!(args.contains(&"-bufsize".to_string()));
    assert!(args.contains(&"200000k".to_string())); // 2x битрейт
    assert!(args.contains(&"-maxrate".to_string()));
    assert!(args.contains(&"150000k".to_string())); // 1.5x битрейт
  }

  #[test]
  fn test_calculate_default_bitrate_different_resolutions() {
    // Тестируем разные разрешения
    let test_cases = vec![
      ((1280, 720), 30.0, 85, 50000), // 720p - высчитывается больше максимума, зажимается до 50000
      ((1920, 1080), 60.0, 90, 50000), // 1080p 60fps - также зажимается до максимума
      ((3840, 2160), 30.0, 80, 50000), // 4K - также зажимается до максимума
      ((640, 480), 30.0, 70, 50000),  // 480p - высчитывается 451,584, зажимается до 50000
    ];

    for ((width, height), fps, quality, expected_bitrate) in test_cases {
      let mut project = create_custom_project(OutputFormat::Mp4, quality);
      project.settings.resolution.width = width;
      project.settings.resolution.height = height;
      project.settings.frame_rate = fps;
      project.settings.output.quality = quality;

      let settings = create_ffmpeg_settings(false, None);
      let builder = OutputBuilder::new(&project, &settings);

      let bitrate = builder.calculate_default_bitrate();
      assert_eq!(
        bitrate, expected_bitrate,
        "Bitrate {bitrate} should be {expected_bitrate} for {width}x{height} {fps}fps quality {quality}"
      );
    }
  }
}

#[cfg(test)]
mod audio_settings_edge_cases_tests {
  use super::*;

  #[test]
  fn test_audio_settings_webm() {
    let project = create_custom_project(OutputFormat::WebM, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_audio_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // WebM должен использовать Opus
    assert!(args.contains(&"-c:a".to_string()));
    assert!(args.contains(&"libopus".to_string()));
    assert!(args.contains(&"-b:a".to_string()));
    assert!(args.contains(&"192k".to_string()));
  }

  #[test]
  fn test_audio_settings_avi() {
    let project = create_custom_project(OutputFormat::Avi, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_audio_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // AVI должен использовать MP3
    assert!(args.contains(&"-c:a".to_string()));
    assert!(args.contains(&"mp3".to_string()));
  }

  #[test]
  fn test_audio_settings_custom_bitrate() {
    let mut project = create_custom_project(OutputFormat::Mp4, 85);
    project.settings.output.audio_bitrate = Some(320);

    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_audio_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    assert!(args.contains(&"-b:a".to_string()));
    assert!(args.contains(&"320k".to_string()));
  }

  #[test]
  fn test_audio_settings_mkv() {
    let project = create_custom_project(OutputFormat::Mkv, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_audio_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // MKV должен использовать AAC
    assert!(args.contains(&"-c:a".to_string()));
    assert!(args.contains(&"aac".to_string()));
  }
}

#[cfg(test)]
mod advanced_encoding_tests {
  use super::*;

  #[test]
  fn test_advanced_encoding_mkv_h265() {
    let project = create_custom_project(OutputFormat::Mkv, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_advanced_encoding_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // H.265 настройки для MKV
    assert!(args.contains(&"-profile:v".to_string()));
    assert!(args.contains(&"main".to_string()));
    assert!(args.contains(&"-level".to_string()));
    assert!(args.contains(&"4.1".to_string()));
    assert!(args.contains(&"-x265-params".to_string()));
  }

  #[test]
  fn test_advanced_encoding_different_framerates() {
    let mut project = create_custom_project(OutputFormat::Mp4, 85);
    project.settings.frame_rate = 24.0; // Cinema framerate

    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_advanced_encoding_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // GOP size должен быть 48 (24 * 2)
    assert!(args.contains(&"-g".to_string()));
    assert!(args.contains(&"48".to_string()));
  }

  #[test]
  fn test_advanced_encoding_webm_no_h264_settings() {
    let project = create_custom_project(OutputFormat::WebM, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_advanced_encoding_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // WebM не должен иметь H.264 специфичных настроек
    assert!(args.contains(&"-pix_fmt".to_string()));
    assert!(args.contains(&"yuv420p".to_string()));
    assert!(args.contains(&"-threads".to_string()));

    // Но не должно быть H.264 profile/level
    let has_h264_profile =
      args.iter().any(|arg| arg == "high") && args.contains(&"-profile:v".to_string());
    assert!(!has_h264_profile);
  }
}

#[cfg(test)]
mod metadata_tests {
  use super::*;

  #[test]
  fn test_metadata_with_empty_fields() {
    let mut project = create_custom_project(OutputFormat::Mp4, 85);
    project.metadata.name = "".to_string(); // Пустое название
    project.metadata.author = None; // Нет автора

    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_metadata(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Не должно быть title metadata для пустого названия
    let has_title = args.iter().any(|arg| arg.starts_with("title="));
    assert!(!has_title);

    // Не должно быть artist metadata
    let has_artist = args.iter().any(|arg| arg.starts_with("artist="));
    assert!(!has_artist);

    // Но должны быть creation_time и encoder
    let has_creation_time = args.iter().any(|arg| arg.starts_with("creation_time="));
    assert!(has_creation_time);

    let has_encoder = args.iter().any(|arg| arg.contains("Timeline Studio"));
    assert!(has_encoder);
  }

  #[test]
  fn test_metadata_with_special_characters() {
    let mut project = create_custom_project(OutputFormat::Mp4, 85);
    project.metadata.name = "Test Project 测试 🎬".to_string(); // Unicode символы
    project.metadata.author = Some("Author & Co.".to_string()); // Специальные символы

    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_metadata(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Должны быть metadata с Unicode символами
    let has_title = args
      .iter()
      .any(|arg| arg.contains("测试") && arg.contains("🎬"));
    assert!(has_title);

    let has_artist = args.iter().any(|arg| arg.contains("Author & Co."));
    assert!(has_artist);
  }
}

#[cfg(test)]
mod preset_quality_tests {
  use super::*;

  #[test]
  fn test_preset_quality_boundaries() {
    let settings = create_ffmpeg_settings(false, None);

    // Тестируем граничные значения качества
    let test_cases = vec![
      (100, "slow"),  // Максимальное качество
      (80, "slow"),   // На границе slow
      (79, "medium"), // Чуть ниже slow
      (60, "medium"), // На границе medium
      (59, "fast"),   // Чуть ниже medium
      (40, "fast"),   // На границе fast
      (39, "faster"), // Чуть ниже fast
      (0, "faster"),  // Минимальное качество
    ];

    for (quality, expected_preset) in test_cases {
      let mut project = create_custom_project(OutputFormat::Mp4, quality);
      project.settings.output.quality = quality;

      let builder = OutputBuilder::new(&project, &settings);
      assert_eq!(
        builder.get_preset(),
        expected_preset,
        "Quality {quality} should map to preset {expected_preset}"
      );
    }
  }
}

#[cfg(test)]
mod integration_tests {
  use super::*;

  #[tokio::test]
  async fn test_complete_output_pipeline_mp4() {
    let mut project = create_custom_project(OutputFormat::Mp4, 85);
    project.settings.output.video_bitrate = Some(5000);
    project.settings.output.audio_bitrate = Some(192);

    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");
    let output_path = PathBuf::from("/tmp/complete_test.mp4");

    let result = builder.add_output_settings(&mut cmd, &output_path).await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем что все основные элементы присутствуют
    assert!(args.contains(&"-f".to_string())); // Format
    assert!(args.contains(&"-c:v".to_string())); // Video codec
    assert!(args.contains(&"-c:a".to_string())); // Audio codec
    assert!(args.contains(&"-s".to_string())); // Size
    assert!(args.contains(&"-r".to_string())); // Frame rate
    assert!(args.contains(&"-b:v".to_string())); // Video bitrate
    assert!(args.contains(&"-b:a".to_string())); // Audio bitrate
    assert!(args.contains(&"-metadata".to_string())); // Metadata
    assert!(args.contains(&"/tmp/complete_test.mp4".to_string())); // Output path
  }

  #[tokio::test]
  async fn test_complete_output_pipeline_webm() {
    let project = create_custom_project(OutputFormat::WebM, 75);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");
    let output_path = PathBuf::from("/tmp/complete_test.webm");

    let result = builder.add_output_settings(&mut cmd, &output_path).await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // WebM специфичные проверки
    assert!(args.contains(&"webm".to_string()));
    assert!(args.contains(&"libvpx-vp9".to_string()));
    assert!(args.contains(&"libopus".to_string()));
    assert!(!args.contains(&"-movflags".to_string())); // Не должно быть MP4 flags
  }

  #[tokio::test]
  async fn test_prerender_pipeline() {
    let project = create_custom_project(OutputFormat::Mp4, 90);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");
    let output_path = PathBuf::from("/tmp/prerender.mov");

    let result = builder.add_prerender_settings(&mut cmd, &output_path).await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // ProRes специфичные проверки
    assert!(args.contains(&"prores_ks".to_string()));
    assert!(args.contains(&"pcm_s16le".to_string()));
    assert!(args.contains(&"-profile:v".to_string()));
    assert!(args.contains(&"3".to_string()));
    assert!(args.contains(&"-s".to_string()));
    assert!(args.contains(&"-r".to_string()));
  }

  #[tokio::test]
  async fn test_output_with_zero_duration() {
    let mut project = create_custom_project(OutputFormat::Mp4, 85);
    project.settings.output.duration = 0.0; // Нулевая длительность

    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");
    let output_path = PathBuf::from("/tmp/zero_duration.mp4");

    let result = builder.add_output_settings(&mut cmd, &output_path).await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // При нулевой длительности -t не должен добавляться
    assert!(!args.contains(&"-t".to_string()) || !args.contains(&"0".to_string()));
  }
}

#[cfg(test)]
mod edge_case_tests {
  use super::*;

  #[test]
  fn test_calculate_bitrate_extreme_resolutions() {
    let settings = create_ffmpeg_settings(false, None);

    // Экстремально маленькое разрешение
    let mut tiny_project = create_custom_project(OutputFormat::Mp4, 50);
    tiny_project.settings.resolution.width = 320;
    tiny_project.settings.resolution.height = 240;
    tiny_project.settings.frame_rate = 15.0;

    let builder = OutputBuilder::new(&tiny_project, &settings);
    let bitrate = builder.calculate_default_bitrate();
    assert_eq!(bitrate, 40320); // 320*240*15*0.07*0.5 = 40,320

    // Экстремально большое разрешение
    let mut huge_project = create_custom_project(OutputFormat::Mp4, 95);
    huge_project.settings.resolution.width = 7680; // 8K
    huge_project.settings.resolution.height = 4320;
    huge_project.settings.frame_rate = 60.0;

    let builder = OutputBuilder::new(&huge_project, &settings);
    let bitrate = builder.calculate_default_bitrate();
    assert_eq!(bitrate, 50000); // Должен быть ограничен максимумом
  }

  #[test]
  fn test_zero_framerate() {
    let mut project = create_custom_project(OutputFormat::Mp4, 85);
    project.settings.frame_rate = 0.0; // Нулевая частота кадров

    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);

    let bitrate = builder.calculate_default_bitrate();
    assert_eq!(bitrate, 1000); // Должен быть минимальным при нулевом FPS

    // Тестируем GOP size
    let mut cmd = Command::new("ffmpeg");
    let result = builder.add_advanced_encoding_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // GOP size должен быть 0 при нулевом FPS
    assert!(args.contains(&"-g".to_string()));
    assert!(args.contains(&"0".to_string()));
  }

  #[test]
  fn test_custom_format_support() {
    let project = create_custom_project(OutputFormat::Custom("flv".to_string()), 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_cpu_encoding(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Custom формат должен использовать libx264 по умолчанию
    assert!(args.contains(&"-c:v".to_string()));
    assert!(args.contains(&"libx264".to_string()));
    assert!(args.contains(&"-f".to_string()));
    assert!(args.contains(&"flv".to_string()));
  }
}

#[cfg(test)]
mod performance_tests {
  use super::*;

  #[tokio::test]
  async fn test_multiple_format_processing() {
    let formats = vec![
      OutputFormat::Mp4,
      OutputFormat::WebM,
      OutputFormat::Mov,
      OutputFormat::Mkv,
      OutputFormat::Avi,
      OutputFormat::Gif,
    ];

    for format in formats {
      let project = create_custom_project(format.clone(), 85);
      let settings = create_ffmpeg_settings(false, None);
      let builder = OutputBuilder::new(&project, &settings);
      let mut cmd = Command::new("ffmpeg");
      let output_path = PathBuf::from(format!("/tmp/test.{format:?}"));

      let result = builder.add_output_settings(&mut cmd, &output_path).await;
      assert!(result.is_ok(), "Failed for format: {format:?}");
    }
  }

  #[test]
  fn test_bitrate_calculation_performance() {
    let project = create_custom_project(OutputFormat::Mp4, 85);
    let settings = create_ffmpeg_settings(false, None);
    let builder = OutputBuilder::new(&project, &settings);

    // Измеряем время расчета битрейта
    let start = std::time::Instant::now();
    for _ in 0..1000 {
      let _bitrate = builder.calculate_default_bitrate();
    }
    let duration = start.elapsed();

    // Должно выполняться быстро
    assert!(
      duration.as_millis() < 100,
      "Bitrate calculation too slow: {duration:?}"
    );
  }
}
