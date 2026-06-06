//! Encoding Stage - Этап финального кодирования видео

use async_trait::async_trait;
use std::path::PathBuf;
use std::time::Duration;

use super::{PipelineContext, PipelineStage};
use crate::video_compiler::error::{Result, VideoCompilerError};

/// Этап кодирования
pub struct EncodingStage;

impl EncodingStage {
  pub fn new() -> Self {
    Self
  }

  /// Финальное кодирование видео
  async fn encode_final_video(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("🎥 Финальное кодирование видео...");

    // Получаем файл композиции
    let composition_path = context
      .get_intermediate_file("composition")
      .ok_or_else(|| VideoCompilerError::InternalError("Файл композиции не найден".to_string()))?
      .clone();

    let export_settings = context.project.settings.clone();
    let output_path = context.output_path.clone();

    // Определяем настройки кодирования
    let encoding_config = self.determine_encoding_config(&export_settings.export);

    // Выполняем кодирование
    self
      .run_encoding(&composition_path, &output_path, &encoding_config, context)
      .await?;

    log::info!("✅ Кодирование завершено: {:?}", context.output_path);
    Ok(())
  }

  /// Определение конфигурации кодирования
  fn determine_encoding_config(
    &self,
    export_settings: &crate::video_compiler::schema::export::ExportSettings,
  ) -> EncodingConfig {
    EncodingConfig {
      codec: "libx264".to_string(),
      bitrate: export_settings.video_bitrate as u64,
      preset: export_settings
        .preset
        .as_ref()
        .unwrap_or(&"medium".to_string())
        .clone(),
      quality: export_settings.quality.to_string(),
      width: 1920,  // Default width, should be passed from context
      height: 1080, // Default height, should be passed from context
      fps: 30.0,    // Default fps, should be passed from context
      use_hardware_acceleration: export_settings.hardware_acceleration,
      two_pass: self.should_use_two_pass(&export_settings.quality.to_string()),
    }
  }

  /// Определение необходимости аппаратного ускорения
  pub fn should_use_hardware_acceleration(&self, codec: &str) -> bool {
    matches!(codec, "h264" | "h265" | "hevc")
  }

  /// Определение необходимости двухпроходного кодирования
  fn should_use_two_pass(&self, quality: &str) -> bool {
    matches!(quality, "high" | "best")
  }

  /// Выполнение кодирования
  async fn run_encoding(
    &self,
    input_path: &PathBuf,
    output_path: &PathBuf,
    config: &EncodingConfig,
    context: &mut PipelineContext,
  ) -> Result<()> {
    if config.two_pass {
      self
        .run_two_pass_encoding(input_path, output_path, config, context)
        .await
    } else {
      self
        .run_single_pass_encoding(input_path, output_path, config, context)
        .await
    }
  }

  /// Однопроходное кодирование
  async fn run_single_pass_encoding(
    &self,
    input_path: &PathBuf,
    output_path: &PathBuf,
    config: &EncodingConfig,
    context: &mut PipelineContext,
  ) -> Result<()> {
    log::info!("🎥 Однопроходное кодирование...");

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-i")
      .arg(input_path)
      .arg("-progress")
      .arg("pipe:1");

    // Настройки видео
    self.add_video_encoding_args(&mut command, config);

    // Аппаратное ускорение
    if config.use_hardware_acceleration {
      self.add_hardware_acceleration_args(&mut command, &config.codec);
    }

    command.arg("-y").arg(output_path);

    // Запускаем кодирование с отслеживанием прогресса
    self
      .run_encoding_with_progress(command, context, 0, 100)
      .await?;

    log::info!("✅ Однопроходное кодирование завершено");
    Ok(())
  }

  /// Двухпроходное кодирование
  async fn run_two_pass_encoding(
    &self,
    input_path: &PathBuf,
    output_path: &PathBuf,
    config: &EncodingConfig,
    context: &mut PipelineContext,
  ) -> Result<()> {
    log::info!("🎥 Двухпроходное кодирование...");

    let log_file = context.get_temp_file_path("ffmpeg_2pass.log");

    // Первый проход
    log::info!("🎥 Первый проход...");
    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-i")
      .arg(input_path)
      .arg("-progress")
      .arg("pipe:1")
      .arg("-pass")
      .arg("1")
      .arg("-passlogfile")
      .arg(&log_file);

    self.add_video_encoding_args(&mut command, config);

    if config.use_hardware_acceleration {
      self.add_hardware_acceleration_args(&mut command, &config.codec);
    }

    command.arg("-f").arg("null").arg("-");

    self
      .run_encoding_with_progress(command, context, 0, 50)
      .await?;

    // Второй проход
    log::info!("🎥 Второй проход...");
    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-i")
      .arg(input_path)
      .arg("-progress")
      .arg("pipe:1")
      .arg("-pass")
      .arg("2")
      .arg("-passlogfile")
      .arg(&log_file);

    self.add_video_encoding_args(&mut command, config);

    if config.use_hardware_acceleration {
      self.add_hardware_acceleration_args(&mut command, &config.codec);
    }

    command.arg("-y").arg(output_path);

    self
      .run_encoding_with_progress(command, context, 50, 100)
      .await?;

    // Удаляем лог файлы
    let _ = tokio::fs::remove_file(&log_file).await;
    let _ = tokio::fs::remove_file(format!("{}-0.log", log_file.display())).await;

    log::info!("✅ Двухпроходное кодирование завершено");
    Ok(())
  }

  /// Добавление аргументов видеокодирования
  fn add_video_encoding_args(
    &self,
    command: &mut tokio::process::Command,
    config: &EncodingConfig,
  ) {
    command
      .arg("-c:v")
      .arg(&config.codec)
      .arg("-b:v")
      .arg(format!("{}k", config.bitrate / 1000))
      .arg("-s")
      .arg(format!("{}x{}", config.width, config.height))
      .arg("-r")
      .arg(config.fps.to_string())
      .arg("-preset")
      .arg(&config.preset);

    // Дополнительные настройки в зависимости от качества
    match config.quality.as_str() {
      "low" => {
        command.arg("-crf").arg("28");
      }
      "medium" => {
        command.arg("-crf").arg("23");
      }
      "high" => {
        command.arg("-crf").arg("18");
      }
      "best" => {
        command.arg("-crf").arg("15");
      }
      _ => {
        command.arg("-crf").arg("23");
      }
    }

    // Настройки для H.264/H.265
    if config.codec == "h264" || config.codec == "libx264" {
      command
        .arg("-profile:v")
        .arg("high")
        .arg("-level")
        .arg("4.0");
    } else if config.codec == "h265" || config.codec == "libx265" {
      command.arg("-profile:v").arg("main");
    }
  }

  /// Добавление аргументов аппаратного ускорения
  fn add_hardware_acceleration_args(&self, command: &mut tokio::process::Command, codec: &str) {
    #[cfg(target_os = "macos")]
    {
      // VideoToolbox для macOS
      if codec == "h264" {
        command.arg("-c:v").arg("h264_videotoolbox");
      } else if codec == "h265" || codec == "hevc" {
        command.arg("-c:v").arg("hevc_videotoolbox");
      }
    }

    #[cfg(target_os = "windows")]
    {
      // NVENC для Windows (если доступен)
      if codec == "h264" {
        command.arg("-c:v").arg("h264_nvenc");
      } else if codec == "h265" || codec == "hevc" {
        command.arg("-c:v").arg("hevc_nvenc");
      }
    }

    #[cfg(target_os = "linux")]
    {
      // VAAPI для Linux (если доступен)
      command.arg("-vaapi_device").arg("/dev/dri/renderD128");
      if codec == "h264" {
        command.arg("-c:v").arg("h264_vaapi");
      } else if codec == "h265" || codec == "hevc" {
        command.arg("-c:v").arg("hevc_vaapi");
      }
    }
  }

  /// Запуск кодирования с отслеживанием прогресса
  async fn run_encoding_with_progress(
    &self,
    mut command: tokio::process::Command,
    context: &mut PipelineContext,
    start_progress: u64,
    end_progress: u64,
  ) -> Result<()> {
    use std::process::Stdio;
    use tokio::io::{AsyncBufReadExt, BufReader};

    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    let mut child = command
      .spawn()
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    let stdout = child
      .stdout
      .take()
      .ok_or_else(|| VideoCompilerError::Io("Не удалось получить stdout".to_string()))?;

    let mut reader = BufReader::new(stdout).lines();
    let mut last_progress = start_progress;

    // Отслеживаем прогресс
    while let Some(line) = reader
      .next_line()
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?
    {
      if context.is_cancelled() {
        let _ = child.kill().await;
        return Err(VideoCompilerError::CancelledError(
          "Кодирование отменено".to_string(),
        ));
      }

      if let Some(progress) = self.parse_ffmpeg_progress(&line) {
        let current_progress = start_progress + ((end_progress - start_progress) * progress / 100);
        if current_progress > last_progress {
          context
            .update_progress(current_progress, "Encoding")
            .await?;
          last_progress = current_progress;
        }
      }
    }

    let status = child
      .wait()
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    if !status.success() {
      return Err(VideoCompilerError::InternalError(
        "FFmpeg завершился с ошибкой".to_string(),
      ));
    }

    Ok(())
  }

  /// Парсинг прогресса из вывода FFmpeg
  fn parse_ffmpeg_progress(&self, line: &str) -> Option<u64> {
    if line.starts_with("out_time_ms=") {
      if let Some(time_str) = line.strip_prefix("out_time_ms=") {
        if let Ok(time_ms) = time_str.parse::<u64>() {
          // Примерный расчет прогресса (нужно знать общую длительность)
          // Здесь упрощенная версия
          return Some((time_ms / 1000) % 100);
        }
      }
    }
    None
  }

  /// Оптимизация выходного файла
  async fn optimize_output(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("🔧 Оптимизация выходного файла...");

    // Проверяем размер файла
    let metadata = tokio::fs::metadata(&context.output_path)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    let file_size_mb = metadata.len() / 1_000_000;
    log::info!("📦 Размер выходного файла: {file_size_mb} MB");

    // Проверяем интегрость файла
    self.verify_output_integrity(&context.output_path).await?;

    context.update_progress(100, "Encoding").await?;

    log::info!("✅ Оптимизация завершена");
    Ok(())
  }

  /// Проверка целостности выходного файла
  async fn verify_output_integrity(&self, file_path: &PathBuf) -> Result<()> {
    let mut command = tokio::process::Command::new("ffprobe");
    command
      .arg("-v")
      .arg("error")
      .arg("-show_entries")
      .arg("format=duration")
      .arg("-of")
      .arg("csv=p=0")
      .arg(file_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::ValidationError(format!(
        "Выходной файл поврежден: {error_msg}"
      )));
    }

    let duration_str = String::from_utf8_lossy(&output.stdout);
    if let Ok(duration) = duration_str.trim().parse::<f64>() {
      if duration <= 0.0 {
        return Err(VideoCompilerError::ValidationError(
          "Выходной файл имеет нулевую длительность".to_string(),
        ));
      }
      log::info!("✅ Длительность выходного файла: {duration:.2}s");
    }

    Ok(())
  }
}

#[async_trait]
impl PipelineStage for EncodingStage {
  async fn process(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("🎥 === Этап кодирования ===");

    // Обновляем прогресс
    context.update_progress(0, "Encoding").await?;

    // Выполняем кодирование
    self.encode_final_video(context).await?;
    context.update_progress(90, "Encoding").await?;

    // Оптимизируем результат
    self.optimize_output(context).await?;

    log::info!("✅ Кодирование завершено успешно");
    Ok(())
  }

  fn name(&self) -> &str {
    "Encoding"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(180) // Кодирование может занимать много времени
  }
}

impl Default for EncodingStage {
  fn default() -> Self {
    Self::new()
  }
}

/// Конфигурация кодирования
#[derive(Debug, Clone)]
struct EncodingConfig {
  codec: String,
  bitrate: u64,
  preset: String,
  quality: String,
  width: u32,
  height: u32,
  fps: f64,
  use_hardware_acceleration: bool,
  two_pass: bool,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_hardware_acceleration_detection() {
    let stage = EncodingStage::new();
    assert!(stage.should_use_hardware_acceleration("h264"));
    assert!(stage.should_use_hardware_acceleration("h265"));
    assert!(!stage.should_use_hardware_acceleration("vp9"));
  }

  #[test]
  fn test_two_pass_detection() {
    let stage = EncodingStage::new();
    assert!(stage.should_use_two_pass("high"));
    assert!(stage.should_use_two_pass("best"));
    assert!(!stage.should_use_two_pass("medium"));
  }

  #[tokio::test]
  async fn test_encoding_stage_basic() {
    let stage = EncodingStage::new();
    assert_eq!(stage.name(), "Encoding");
    assert!(!stage.estimated_duration().is_zero());
  }
}
