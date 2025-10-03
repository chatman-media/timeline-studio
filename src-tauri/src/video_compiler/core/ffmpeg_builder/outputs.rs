//! FFmpeg Builder - Модуль конфигурации выходных параметров

use std::path::Path;
use tokio::process::Command;

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{OutputFormat, ProjectSchema};

use super::builder::{quality_to_crf, FFmpegBuilderSettings};

/// Построитель выходных параметров
pub struct OutputBuilder<'a> {
  project: &'a ProjectSchema,
  settings: &'a FFmpegBuilderSettings,
}

impl<'a> OutputBuilder<'a> {
  /// Создать новый построитель выходных параметров
  pub fn new(project: &'a ProjectSchema, settings: &'a FFmpegBuilderSettings) -> Self {
    Self { project, settings }
  }

  /// Добавить настройки вывода
  pub async fn add_output_settings(&self, cmd: &mut Command, output_path: &Path) -> Result<()> {
    // Добавляем аппаратное ускорение если включено
    if self.settings.use_hardware_acceleration {
      self.add_hardware_acceleration(cmd).await?;
    } else {
      self.add_cpu_encoding(cmd)?;
    }

    // Добавляем настройки формата
    self.add_format_settings(cmd)?;

    // Добавляем настройки битрейта
    self.add_bitrate_settings(cmd)?;

    // Добавляем настройки аудио
    self.add_audio_settings(cmd)?;

    // Добавляем расширенные настройки кодирования
    self.add_advanced_encoding_settings(cmd)?;

    // Длительность вывода
    if self.project.settings.output.duration > 0.0 {
      cmd.args(["-t", &self.project.settings.output.duration.to_string()]);
    }

    // Метаданные
    self.add_metadata(cmd)?;

    // Выходной файл
    cmd.arg(output_path);

    Ok(())
  }

  /// Добавить настройки для пререндера
  pub async fn add_prerender_settings(&self, cmd: &mut Command, output_path: &Path) -> Result<()> {
    // Для пререндера используем промежуточный кодек с высоким качеством
    cmd.args(["-c:v", "prores_ks"]);
    cmd.args(["-profile:v", "3"]); // ProRes 422 HQ
    cmd.args(["-c:a", "pcm_s16le"]); // Несжатое аудио

    // Сохраняем разрешение и частоту кадров
    cmd.args([
      "-s",
      &format!(
        "{}x{}",
        self.project.settings.resolution.width, self.project.settings.resolution.height
      ),
    ]);
    cmd.args(["-r", &self.project.settings.frame_rate.to_string()]);

    // Выходной файл
    cmd.arg(output_path);

    Ok(())
  }

  /// Добавить аппаратное ускорение
  async fn add_hardware_acceleration(&self, cmd: &mut Command) -> Result<()> {
    use crate::video_compiler::core::gpu::{GpuDetector, GpuEncoder, GpuHelper};

    // Если указан конкретный тип, пытаемся использовать его
    let hw_type = self
      .settings
      .hardware_acceleration_type
      .as_deref()
      .unwrap_or("auto");

    let encoder = if hw_type == "auto" {
      // Автоматически определяем лучший доступный кодировщик
      let detector = GpuDetector::new(self.settings.ffmpeg_path.clone());

      // Проверяем доступность GPU с учетом загрузки
      if let Ok(available) = detector.check_gpu_availability().await {
        if !available {
          log::warn!("GPU is overloaded or unavailable, falling back to software encoding");
          GpuEncoder::Software
        } else {
          match detector.get_recommended_encoder().await? {
            Some(recommended) => {
              log::info!("Using recommended encoder: {recommended:?}");
              recommended
            }
            None => {
              log::warn!("No hardware encoders available, falling back to software");
              GpuEncoder::Software
            }
          }
        }
      } else {
        // Если не можем проверить доступность, пробуем использовать GPU
        match detector.get_recommended_encoder().await? {
          Some(recommended) => recommended,
          None => GpuEncoder::Software,
        }
      }
    } else {
      // Используем указанный тип
      match hw_type {
        "nvidia" | "nvenc" => GpuEncoder::Nvenc,
        "amd" | "amf" => GpuEncoder::Amf,
        "intel" | "qsv" => GpuEncoder::QuickSync,
        "apple" | "videotoolbox" => GpuEncoder::VideoToolbox,
        "vaapi" => GpuEncoder::Vaapi,
        _ => GpuEncoder::Software,
      }
    };

    // Добавляем кодек в зависимости от формата и кодировщика
    match self.project.settings.output.format {
      OutputFormat::Mp4 | OutputFormat::Mov => {
        cmd.args(["-c:v", encoder.h264_codec_name()]);
      }
      OutputFormat::WebM => {
        // WebM не поддерживает hardware encoders, используем VP9
        cmd.args(["-c:v", "libvpx-vp9"]);
      }
      OutputFormat::Mkv => {
        // Для MKV можем использовать HEVC если поддерживается
        cmd.args(["-c:v", encoder.hevc_codec_name()]);
      }
      _ => {
        cmd.args(["-c:v", encoder.h264_codec_name()]);
      }
    }

    // Добавляем параметры качества для выбранного кодировщика
    let quality = self.project.settings.export.quality;
    let params = GpuHelper::get_ffmpeg_params(&encoder, quality);

    for param in params {
      cmd.arg(param);
    }

    // Если это software encoder, дополнительные настройки не нужны
    if encoder == GpuEncoder::Software || encoder == GpuEncoder::None {
      // Параметры уже добавлены через GpuHelper
      log::info!("Using software encoding with optimized settings");
    }

    Ok(())
  }

  /// Добавить CPU кодирование
  fn add_cpu_encoding(&self, cmd: &mut Command) -> Result<()> {
    match self.project.settings.output.format {
      OutputFormat::Mp4 => {
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-preset", &self.get_preset()]);
        cmd.args(["-tune", "film"]);
      }
      OutputFormat::WebM => {
        cmd.args(["-c:v", "libvpx-vp9"]);
        cmd.args(["-cpu-used", "2"]);
        cmd.args(["-row-mt", "1"]);
      }
      OutputFormat::Mov => {
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-preset", &self.get_preset()]);
      }
      OutputFormat::Avi => {
        cmd.args(["-c:v", "libx264"]);
      }
      OutputFormat::Mkv => {
        cmd.args(["-c:v", "libx265"]);
        cmd.args(["-preset", &self.get_preset()]);
      }
      OutputFormat::Gif => {
        cmd.args(["-c:v", "gif"]);
        cmd.args(["-filter:v", "fps=10,scale=320:-1:flags=lanczos"]);
      }
      OutputFormat::Custom(ref format) => {
        // Для пользовательского формата используем libx264 по умолчанию
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-f", format]);
      }
    }

    Ok(())
  }

  /// Добавить настройки формата
  fn add_format_settings(&self, cmd: &mut Command) -> Result<()> {
    match self.project.settings.output.format {
      OutputFormat::Mp4 => {
        cmd.args(["-f", "mp4"]);
        cmd.args(["-movflags", "+faststart"]); // Оптимизация для веб
      }
      OutputFormat::WebM => {
        cmd.args(["-f", "webm"]);
      }
      OutputFormat::Mov => {
        cmd.args(["-f", "mov"]);
      }
      OutputFormat::Avi => {
        cmd.args(["-f", "avi"]);
      }
      OutputFormat::Mkv => {
        cmd.args(["-f", "matroska"]);
      }
      OutputFormat::Gif => {
        cmd.args(["-f", "gif"]);
      }
      OutputFormat::Custom(ref format) => {
        cmd.args(["-f", format]);
      }
    }

    // Разрешение
    cmd.args([
      "-s",
      &format!(
        "{}x{}",
        self.project.settings.resolution.width, self.project.settings.resolution.height
      ),
    ]);

    // Частота кадров
    cmd.args(["-r", &self.project.settings.frame_rate.to_string()]);

    // Соотношение сторон
    let aspect_ratio = self.project.settings.aspect_ratio.to_ffmpeg_string();
    cmd.args(["-aspect", &aspect_ratio]);

    Ok(())
  }

  /// Добавить настройки битрейта
  fn add_bitrate_settings(&self, cmd: &mut Command) -> Result<()> {
    let quality = self.project.settings.output.quality;

    // Видео битрейт
    if let Some(video_bitrate) = self.project.settings.output.video_bitrate {
      // Использовать заданный битрейт
      cmd.args(["-b:v", &format!("{video_bitrate}k")]);

      // Добавляем буфер для VBR
      let bufsize = video_bitrate * 2;
      cmd.args(["-bufsize", &format!("{bufsize}k")]);

      // Максимальный битрейт
      let maxrate = (video_bitrate as f64 * 1.5) as u32;
      cmd.args(["-maxrate", &format!("{maxrate}k")]);
    } else {
      // Использовать CRF для качества
      let crf = quality_to_crf(quality);

      match self.project.settings.output.format {
        OutputFormat::Mp4 | OutputFormat::Mov => {
          cmd.args(["-crf", &crf.to_string()]);
        }
        OutputFormat::WebM => {
          cmd.args(["-b:v", "0"]); // VBR mode
          cmd.args(["-crf", &crf.to_string()]);
        }
        OutputFormat::Mkv => {
          // Для MKV используем CRF независимо от кодека
          cmd.args(["-crf", &crf.to_string()]);
        }
        OutputFormat::Gif => {
          // Для GIF используем битрейт
          let default_bitrate = self.calculate_default_bitrate();
          cmd.args(["-b:v", &format!("{default_bitrate}k")]);
        }
        OutputFormat::Avi | OutputFormat::Custom(_) => {
          // Для других форматов используем битрейт по умолчанию
          let default_bitrate = self.calculate_default_bitrate();
          cmd.args(["-b:v", &format!("{default_bitrate}k")]);
        }
      }
    }

    Ok(())
  }

  /// Добавить настройки аудио
  fn add_audio_settings(&self, cmd: &mut Command) -> Result<()> {
    // Аудио кодек
    match self.project.settings.output.format {
      OutputFormat::Mp4 | OutputFormat::Mov => {
        cmd.args(["-c:a", "aac"]);
        cmd.args(["-profile:a", "aac_low"]);
      }
      OutputFormat::WebM => {
        cmd.args(["-c:a", "libopus"]);
      }
      OutputFormat::Avi => {
        cmd.args(["-c:a", "mp3"]);
      }
      OutputFormat::Mkv => {
        cmd.args(["-c:a", "aac"]);
      }
      OutputFormat::Gif => {
        // GIF не поддерживает аудио
        cmd.args(["-an"]);
        return Ok(());
      }
      OutputFormat::Custom(_) => {
        // Для пользовательского формата используем AAC по умолчанию
        cmd.args(["-c:a", "aac"]);
      }
    }

    // Аудио битрейт
    let audio_bitrate = self.project.settings.output.audio_bitrate.unwrap_or(192);
    cmd.args(["-b:a", &format!("{audio_bitrate}k")]);

    // Частота дискретизации
    cmd.args(["-ar", "48000"]);

    // Количество каналов
    cmd.args(["-ac", "2"]);

    Ok(())
  }

  /// Добавить расширенные настройки кодирования
  fn add_advanced_encoding_settings(&self, cmd: &mut Command) -> Result<()> {
    // Пиксельный формат
    cmd.args(["-pix_fmt", "yuv420p"]);

    // Настройки для H.264
    // Проверяем используемый кодек по формату (упрощенная логика)
    let using_h264 = matches!(
      self.project.settings.output.format,
      OutputFormat::Mp4 | OutputFormat::Mov | OutputFormat::Avi
    );

    if using_h264 {
      // Профиль
      cmd.args(["-profile:v", "high"]);

      // Уровень
      cmd.args(["-level", "4.2"]);

      // Настройки GOP
      let gop_size = (self.project.settings.frame_rate * 2.0) as i32;
      cmd.args(["-g", &gop_size.to_string()]);

      // B-кадры
      cmd.args(["-bf", "2"]);

      // Адаптивные B-кадры
      cmd.args(["-b_strategy", "1"]);

      // Деблокинг
      cmd.args(["-flags", "+loop"]);
      cmd.args(["-deblock", "0:0"]);
    }

    // Настройки для H.265
    // Проверяем используемый кодек по формату (упрощенная логика)
    let using_h265 = matches!(self.project.settings.output.format, OutputFormat::Mkv);

    if using_h265 {
      cmd.args(["-profile:v", "main"]);
      cmd.args(["-level", "4.1"]);
      cmd.args([
        "-x265-params",
        "keyint=48:min-keyint=24:bframes=3:b-adapt=2",
      ]);
    }

    // Многопоточность
    cmd.args(["-threads", "0"]); // Автоматический выбор

    Ok(())
  }

  /// Добавить метаданные
  fn add_metadata(&self, cmd: &mut Command) -> Result<()> {
    // Название проекта
    if !self.project.metadata.name.is_empty() {
      cmd.args([
        "-metadata",
        &format!("title={}", self.project.metadata.name),
      ]);
    }

    // Автор
    if let Some(ref author) = self.project.metadata.author {
      if !author.is_empty() {
        cmd.args(["-metadata", &format!("artist={author}")]);
      }
    }

    // Дата создания
    cmd.args([
      "-metadata",
      &format!("creation_time={}", self.project.metadata.created_at),
    ]);

    // Кодировщик
    cmd.args(["-metadata", "encoder=Timeline Studio"]);

    Ok(())
  }

  /// Получить пресет для кодирования
  fn get_preset(&self) -> String {
    match self.project.settings.output.quality {
      q if q >= 80 => "slow",
      q if q >= 60 => "medium",
      q if q >= 40 => "fast",
      _ => "faster",
    }
    .to_string()
  }

  /// Рассчитать битрейт по умолчанию
  fn calculate_default_bitrate(&self) -> u32 {
    let pixels = self.project.settings.resolution.width * self.project.settings.resolution.height;
    let fps = self.project.settings.frame_rate;
    let quality = self.project.settings.output.quality as f64 / 100.0;

    // Базовая формула: битрейт = пиксели * FPS * множитель качества / 1000
    let base_bitrate = (pixels as f64 * fps * 0.07 * quality) as u32;

    // Ограничиваем диапазон
    base_bitrate.clamp(1000, 50000)
  }
}

#[cfg(test)]
mod outputs_tests;

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::export::OutputFormat;
  use crate::video_compiler::tests::fixtures::*;
  use std::path::PathBuf;
  use tokio::process::Command;

  #[test]
  fn test_output_builder_new() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);

    assert_eq!(builder.project.metadata.name, "Test Project");
    assert_eq!(builder.settings.ffmpeg_path, "ffmpeg");
  }

  #[tokio::test]
  async fn test_add_output_settings_basic() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");
    let output_path = PathBuf::from("/tmp/output.mp4");

    let result = builder.add_output_settings(&mut cmd, &output_path).await;
    assert!(
      result.is_ok(),
      "Basic output settings should be added successfully"
    );

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем основные элементы
    assert!(args.contains(&"-f".to_string()));
    assert!(args.contains(&"mp4".to_string()));
    assert!(args.contains(&"-c:v".to_string()));
    assert!(args.contains(&"/tmp/output.mp4".to_string()));
  }

  #[tokio::test]
  async fn test_add_output_settings_with_hardware_acceleration() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings {
      use_hardware_acceleration: true,
      hardware_acceleration_type: Some("nvenc".to_string()),
      ..Default::default()
    };
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");
    let output_path = PathBuf::from("/tmp/output.mp4");

    let result = builder.add_output_settings(&mut cmd, &output_path).await;
    assert!(
      result.is_ok(),
      "Hardware acceleration settings should be added"
    );
  }

  #[tokio::test]
  async fn test_add_prerender_settings() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");
    let output_path = PathBuf::from("/tmp/prerender.mov");

    let result = builder.add_prerender_settings(&mut cmd, &output_path).await;
    assert!(
      result.is_ok(),
      "Prerender settings should be added successfully"
    );

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем ProRes кодек
    assert!(args.contains(&"-c:v".to_string()));
    assert!(args.contains(&"prores_ks".to_string()));
    assert!(args.contains(&"-profile:v".to_string()));
    assert!(args.contains(&"3".to_string()));

    // Проверяем аудио кодек
    assert!(args.contains(&"-c:a".to_string()));
    assert!(args.contains(&"pcm_s16le".to_string()));
  }

  #[test]
  fn test_add_cpu_encoding_mp4() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
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
    assert!(args.contains(&"-preset".to_string()));
    assert!(args.contains(&"-tune".to_string()));
    assert!(args.contains(&"film".to_string()));
  }

  #[test]
  fn test_add_cpu_encoding_webm() {
    let mut project = create_minimal_project();
    project.settings.output.format = OutputFormat::WebM;

    let settings = FFmpegBuilderSettings::default();
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
    assert!(args.contains(&"libvpx-vp9".to_string()));
    assert!(args.contains(&"-cpu-used".to_string()));
    assert!(args.contains(&"2".to_string()));
  }

  #[test]
  fn test_add_format_settings_mp4() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
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
    assert!(args.contains(&"mp4".to_string()));
    assert!(args.contains(&"-movflags".to_string()));
    assert!(args.contains(&"+faststart".to_string()));

    // Проверяем разрешение
    assert!(args.contains(&"-s".to_string()));
    assert!(args.contains(&"1920x1080".to_string()));

    // Проверяем частоту кадров
    assert!(args.contains(&"-r".to_string()));
    assert!(args.contains(&"30".to_string()));
  }

  #[test]
  fn test_add_bitrate_settings_with_crf() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_bitrate_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Должен использовать CRF для качества
    assert!(args.contains(&"-crf".to_string()));
  }

  #[test]
  fn test_add_bitrate_settings_with_custom_bitrate() {
    let mut project = create_minimal_project();
    project.settings.output.video_bitrate = Some(5000);

    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_bitrate_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Должен использовать заданный битрейт
    assert!(args.contains(&"-b:v".to_string()));
    assert!(args.contains(&"5000k".to_string()));
    assert!(args.contains(&"-bufsize".to_string()));
    assert!(args.contains(&"-maxrate".to_string()));
  }

  #[test]
  fn test_add_audio_settings_mp4() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_audio_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    assert!(args.contains(&"-c:a".to_string()));
    assert!(args.contains(&"aac".to_string()));
    assert!(args.contains(&"-profile:a".to_string()));
    assert!(args.contains(&"aac_low".to_string()));
    assert!(args.contains(&"-b:a".to_string()));
    assert!(args.contains(&"192k".to_string()));
    assert!(args.contains(&"-ar".to_string()));
    assert!(args.contains(&"48000".to_string()));
  }

  #[test]
  fn test_add_audio_settings_gif() {
    let mut project = create_minimal_project();
    project.settings.output.format = OutputFormat::Gif;

    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_audio_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // GIF не должен иметь аудио
    assert!(args.contains(&"-an".to_string()));
  }

  #[test]
  fn test_add_advanced_encoding_settings() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_advanced_encoding_settings(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Базовые настройки
    assert!(args.contains(&"-pix_fmt".to_string()));
    assert!(args.contains(&"yuv420p".to_string()));
    assert!(args.contains(&"-threads".to_string()));
    assert!(args.contains(&"0".to_string()));

    // H.264 настройки для MP4
    assert!(args.contains(&"-profile:v".to_string()));
    assert!(args.contains(&"high".to_string()));
    assert!(args.contains(&"-level".to_string()));
    assert!(args.contains(&"4.2".to_string()));
  }

  #[test]
  fn test_add_metadata() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_metadata(&mut cmd);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    assert!(args.contains(&"-metadata".to_string()));

    // Проверяем что метаданные содержат название проекта
    let title_meta = args.iter().any(|arg| arg.starts_with("title="));
    assert!(title_meta);

    // Проверяем кодировщик
    let encoder_meta = args.iter().any(|arg| arg.contains("Timeline Studio"));
    assert!(encoder_meta);
  }

  #[test]
  fn test_get_preset() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);

    // Тестируем качество по умолчанию (85)
    assert_eq!(builder.get_preset(), "slow"); // quality = 85 -> slow

    // Создаем проект с высоким качеством
    let mut high_quality_project = create_minimal_project();
    high_quality_project.settings.output.quality = 90;
    let builder = OutputBuilder::new(&high_quality_project, &settings);
    assert_eq!(builder.get_preset(), "slow");
  }

  #[test]
  fn test_calculate_default_bitrate() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);

    let bitrate = builder.calculate_default_bitrate();

    // Проверяем что битрейт в разумных пределах
    assert!(bitrate >= 1000);
    assert!(bitrate <= 50000);

    // Для 1920x1080 30fps качества 85% проверяем что битрейт в разумных пределах
    // Фактический расчет: 1920*1080*30*0.07*0.85 ≈ 36,864 kbps
    // Но clamp ограничивает максимум до 50,000 kbps
    assert!(bitrate >= 3000);
    assert!(bitrate <= 50000); // Максимальное значение по clamp
  }

  #[test]
  fn test_output_formats_encoding() {
    let formats = vec![
      OutputFormat::Mp4,
      OutputFormat::WebM,
      OutputFormat::Mov,
      OutputFormat::Avi,
      OutputFormat::Mkv,
      OutputFormat::Gif,
    ];

    for format in formats {
      let mut project = create_minimal_project();
      project.settings.output.format = format.clone();

      let settings = FFmpegBuilderSettings::default();
      let builder = OutputBuilder::new(&project, &settings);
      let mut cmd = Command::new("ffmpeg");

      // Проверяем что все форматы успешно добавляют настройки
      let cpu_result = builder.add_cpu_encoding(&mut cmd);
      assert!(
        cpu_result.is_ok(),
        "CPU encoding failed for format: {format:?}"
      );

      let format_result = builder.add_format_settings(&mut cmd);
      assert!(
        format_result.is_ok(),
        "Format settings failed for format: {format:?}"
      );

      let audio_result = builder.add_audio_settings(&mut cmd);
      assert!(
        audio_result.is_ok(),
        "Audio settings failed for format: {format:?}"
      );
    }
  }

  #[test]
  fn test_custom_format() {
    let mut project = create_minimal_project();
    project.settings.output.format = OutputFormat::Custom("flv".to_string());

    let settings = FFmpegBuilderSettings::default();
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
    assert!(args.contains(&"flv".to_string()));
  }

  #[tokio::test]
  async fn test_output_with_duration() {
    let mut project = create_minimal_project();
    project.settings.output.duration = 30.0; // 30 секунд

    let settings = FFmpegBuilderSettings::default();
    let builder = OutputBuilder::new(&project, &settings);
    let mut cmd = Command::new("ffmpeg");
    let output_path = PathBuf::from("/tmp/output.mp4");

    let result = builder.add_output_settings(&mut cmd, &output_path).await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем длительность
    assert!(args.contains(&"-t".to_string()));
    assert!(args.contains(&"30".to_string()));
  }

  #[test]
  fn test_quality_to_preset_mapping() {
    let settings = FFmpegBuilderSettings::default();

    // Тестируем разные уровни качества
    let test_cases = vec![(90, "slow"), (70, "medium"), (50, "fast"), (30, "faster")];

    for (quality, expected_preset) in test_cases {
      let mut project = create_minimal_project();
      project.settings.output.quality = quality;

      let builder = OutputBuilder::new(&project, &settings);
      assert_eq!(builder.get_preset(), expected_preset);
    }
  }
}
