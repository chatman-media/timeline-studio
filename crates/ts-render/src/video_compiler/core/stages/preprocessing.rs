//! Preprocessing Stage - Этап предобработки медиафайлов

use async_trait::async_trait;
use std::path::PathBuf;
use std::time::Duration;

use super::{PipelineContext, PipelineStage};
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::ClipSource;

/// Этап предобработки
pub struct PreprocessingStage;

impl PreprocessingStage {
  pub fn new() -> Self {
    Self
  }

  /// Подготовка медиафайлов
  async fn prepare_media_files(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("🔄 Подготовка медиафайлов...");

    let mut processed_files = 0;
    let total_files = self.count_media_files(context);

    let tracks = context.project.tracks.clone();
    for (track_idx, track) in tracks.iter().enumerate() {
      for (clip_idx, clip) in track.clips.iter().enumerate() {
        if context.is_cancelled() {
          return Err(VideoCompilerError::CancelledError(
            "Preprocessing cancelled".to_string(),
          ));
        }

        match &clip.source {
          ClipSource::File(path) => {
            let processed_path = self
              .preprocess_media_file(
                path.as_str(),
                &format!("track_{track_idx}_clip_{clip_idx}"),
                context,
              )
              .await?;

            // Добавляем обработанный файл в промежуточные файлы
            context.add_intermediate_file(
              format!("preprocessed_track_{track_idx}_clip_{clip_idx}"),
              processed_path,
            );
          }
          ClipSource::Generated => {
            // Генерируем медиафайл
            let generated_path = self
              .generate_media_file(
                clip,
                &format!("generated_track_{track_idx}_clip_{clip_idx}"),
                context,
              )
              .await?;

            context.add_intermediate_file(
              format!("generated_track_{track_idx}_clip_{clip_idx}"),
              generated_path,
            );
          }
          ClipSource::Stream(_) => {
            log::warn!("Stream sources are not yet supported in preprocessing");
          }
          ClipSource::Device(_) => {
            log::warn!("Device sources are not yet supported in preprocessing");
          }
        }

        processed_files += 1;
        let progress = (processed_files * 100 / total_files) as u64;
        context.update_progress(progress, "Preprocessing").await?;
      }
    }

    log::info!("✅ Обработано {processed_files} медиафайлов");
    Ok(())
  }

  /// Подсчет количества медиафайлов
  fn count_media_files(&self, context: &PipelineContext) -> usize {
    context
      .project
      .tracks
      .iter()
      .map(|track| track.clips.len())
      .sum()
  }

  /// Предобработка медиафайла
  async fn preprocess_media_file(
    &self,
    source_path: &str,
    identifier: &str,
    context: &PipelineContext,
  ) -> Result<PathBuf> {
    log::debug!("🔄 Предобработка файла: {source_path}");

    let source = PathBuf::from(source_path);
    let output_path = context.get_temp_file_path(&format!("{identifier}_preprocessed.mp4"));

    // Проверяем, нужна ли предобработка
    if self.needs_preprocessing(&source, context).await? {
      // Выполняем предобработку через FFmpeg
      self
        .run_ffmpeg_preprocessing(&source, &output_path, context)
        .await?;
      log::debug!("✅ Предобработка завершена: {output_path:?}");
    } else {
      // Просто копируем файл
      tokio::fs::copy(&source, &output_path)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
      log::debug!("📋 Файл скопирован без изменений: {output_path:?}");
    }

    Ok(output_path)
  }

  /// Проверка необходимости предобработки
  async fn needs_preprocessing(
    &self,
    source_path: &PathBuf,
    context: &PipelineContext,
  ) -> Result<bool> {
    // Получаем информацию о файле через FFprobe
    let file_info = self.get_media_info(source_path).await?;
    let export_settings = &context.project.settings;

    // Проверяем разрешение
    if let (Some(width), Some(height)) = (file_info.width, file_info.height) {
      if width != export_settings.resolution.width || height != export_settings.resolution.height {
        log::debug!(
          "Требуется изменение разрешения: {}x{} -> {}x{}",
          width,
          height,
          export_settings.resolution.width,
          export_settings.resolution.height
        );
        return Ok(true);
      }
    }

    // Проверяем кодек
    if let Some(codec) = &file_info.codec {
      if codec != "libx264" {
        log::debug!("Требуется изменение кодека: {} -> {}", codec, "libx264");
        return Ok(true);
      }
    }

    // Проверяем FPS
    if let Some(fps) = file_info.fps {
      if (fps - export_settings.frame_rate).abs() > 0.1 {
        log::debug!(
          "Требуется изменение FPS: {} -> {}",
          fps,
          export_settings.frame_rate
        );
        return Ok(true);
      }
    }

    Ok(false)
  }

  /// Запуск предобработки через FFmpeg
  async fn run_ffmpeg_preprocessing(
    &self,
    input_path: &PathBuf,
    output_path: &PathBuf,
    context: &PipelineContext,
  ) -> Result<()> {
    let export_settings = &context.project.settings;

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-i")
      .arg(input_path)
      .arg("-vcodec")
      .arg("libx264")
      .arg("-s")
      .arg(format!(
        "{}x{}",
        export_settings.resolution.width, export_settings.resolution.height
      ))
      .arg("-r")
      .arg(export_settings.frame_rate.to_string())
      .arg("-b:v")
      .arg(format!("{}k", export_settings.export.video_bitrate / 1000))
      .arg("-preset")
      .arg(
        export_settings
          .export
          .preset
          .as_ref()
          .unwrap_or(&"medium".to_string()),
      )
      .arg("-y") // Перезаписывать файл
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::Io(error_msg.to_string()));
    }

    Ok(())
  }

  /// Генерация медиафайла
  async fn generate_media_file(
    &self,
    clip: &crate::video_compiler::schema::Clip,
    identifier: &str,
    context: &PipelineContext,
  ) -> Result<PathBuf> {
    log::debug!("🎨 Генерация файла для клипа: {identifier}");

    let output_path = context.get_temp_file_path(&format!("{identifier}_generated.mp4"));

    match &clip.source {
      ClipSource::Generated => {
        // Default to generating a color clip
        let default_color = Some("#000000".to_string());
        let default_duration = clip.get_timeline_duration();

        self
          .generate_color_clip(&default_color, default_duration, &output_path, context)
          .await?;
      }
      _ => {
        return Err(VideoCompilerError::ValidationError(
          "Неправильный тип источника для генерации".to_string(),
        ));
      }
    }

    log::debug!("✅ Генерация завершена: {output_path:?}");
    Ok(output_path)
  }

  /// Генерация цветного клипа
  async fn generate_color_clip(
    &self,
    color: &Option<String>,
    duration: f64,
    output_path: &PathBuf,
    context: &PipelineContext,
  ) -> Result<()> {
    let export_settings = &context.project.settings;
    let color_value = color.as_deref().unwrap_or("#000000");

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-f")
      .arg("lavfi")
      .arg("-i")
      .arg(format!(
        "color={}:size={}x{}:duration={}:rate={}",
        color_value,
        export_settings.resolution.width,
        export_settings.resolution.height,
        duration,
        export_settings.frame_rate
      ))
      .arg("-c:v")
      .arg("libx264")
      .arg("-y")
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::Io(error_msg.to_string()));
    }

    Ok(())
  }

  /// Генерация шумового клипа
  pub async fn generate_noise_clip(
    &self,
    duration: f64,
    output_path: &PathBuf,
    context: &PipelineContext,
  ) -> Result<()> {
    let export_settings = &context.project.settings;

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-f")
      .arg("lavfi")
      .arg("-i")
      .arg(format!(
        "noise=size={}x{}:duration={}:rate={}",
        export_settings.resolution.width,
        export_settings.resolution.height,
        duration,
        export_settings.frame_rate
      ))
      .arg("-c:v")
      .arg("libx264")
      .arg("-y")
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::Io(error_msg.to_string()));
    }

    Ok(())
  }

  /// Генерация градиентного клипа
  pub async fn generate_gradient_clip(
    &self,
    color: &Option<String>,
    duration: f64,
    output_path: &PathBuf,
    context: &PipelineContext,
  ) -> Result<()> {
    let export_settings = &context.project.settings;
    let start_color = color.as_deref().unwrap_or("#000000");

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-f")
      .arg("lavfi")
      .arg("-i")
      .arg(format!(
        "gradients=size={}x{}:duration={}:rate={}:c0={}:c1=#ffffff",
        export_settings.resolution.width,
        export_settings.resolution.height,
        duration,
        export_settings.frame_rate,
        start_color
      ))
      .arg("-c:v")
      .arg("libx264")
      .arg("-y")
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::Io(error_msg.to_string()));
    }

    Ok(())
  }

  /// Получение информации о медиафайле
  async fn get_media_info(&self, file_path: &PathBuf) -> Result<MediaInfo> {
    let mut command = tokio::process::Command::new("ffprobe");
    command
      .arg("-v")
      .arg("quiet")
      .arg("-print_format")
      .arg("json")
      .arg("-show_format")
      .arg("-show_streams")
      .arg(file_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::Io(error_msg.to_string()));
    }

    let json_output = String::from_utf8_lossy(&output.stdout);
    let info: serde_json::Value = serde_json::from_str(&json_output)
      .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?;

    // Парсим информацию о видеопотоке
    let mut media_info = MediaInfo::default();

    if let Some(streams) = info["streams"].as_array() {
      for stream in streams {
        if stream["codec_type"] == "video" {
          media_info.width = stream["width"].as_u64().map(|w| w as u32);
          media_info.height = stream["height"].as_u64().map(|h| h as u32);
          media_info.codec = stream["codec_name"].as_str().map(|s| s.to_string());

          // Парсим FPS
          if let Some(fps_str) = stream["r_frame_rate"].as_str() {
            if let Some(fps) = self.parse_fps(fps_str) {
              media_info.fps = Some(fps);
            }
          }
          break;
        }
      }
    }

    Ok(media_info)
  }

  /// Парсинг FPS из строки вида "30/1"
  fn parse_fps(&self, fps_str: &str) -> Option<f64> {
    if let Some((num_str, den_str)) = fps_str.split_once('/') {
      if let (Ok(num), Ok(den)) = (num_str.parse::<f64>(), den_str.parse::<f64>()) {
        if den > 0.0 {
          return Some(num / den);
        }
      }
    }
    fps_str.parse().ok()
  }
}

#[async_trait]
impl PipelineStage for PreprocessingStage {
  async fn process(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("🔄 === Этап предобработки ===");

    // Обновляем прогресс
    context.update_progress(0, "Preprocessing").await?;

    // Подготавливаем медиафайлы
    self.prepare_media_files(context).await?;

    log::info!("✅ Предобработка завершена успешно");
    Ok(())
  }

  fn name(&self) -> &str {
    "Preprocessing"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(60) // Предобработка может занять больше времени
  }
}

impl Default for PreprocessingStage {
  fn default() -> Self {
    Self::new()
  }
}

/// Информация о медиафайле
#[derive(Debug, Default)]
struct MediaInfo {
  width: Option<u32>,
  height: Option<u32>,
  fps: Option<f64>,
  codec: Option<String>,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_fps_parsing() {
    let stage = PreprocessingStage::new();
    assert_eq!(stage.parse_fps("30/1"), Some(30.0));
    assert_eq!(stage.parse_fps("24000/1001"), Some(23.976023976023978));
    assert_eq!(stage.parse_fps("25"), Some(25.0));
    assert_eq!(stage.parse_fps("invalid"), None);
  }

  #[tokio::test]
  async fn test_preprocessing_stage_basic() {
    let stage = PreprocessingStage::new();
    assert_eq!(stage.name(), "Preprocessing");
    assert!(!stage.estimated_duration().is_zero());
  }
}
