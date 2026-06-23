//! Модуль для стабилизации видео с помощью FFmpeg

use super::FFmpegCommand;
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use std::path::Path;

/// Параметры стабилизации видео
#[derive(Debug, Clone)]
pub struct StabilizationOptions {
  pub strength: f64,       // Сила стабилизации (0.0 - 1.0)
  pub smoothing: f64,      // Сглаживание движений (0.0 - 1.0)
  pub crop_factor: f64,    // Процент обрезки краёв (0.0 - 0.2)
  pub output_path: String, // Путь для сохранения результата
}

/// Стабилизация видео с использованием vidstab фильтров FFmpeg
pub async fn stabilize_video(input_path: &Path, options: StabilizationOptions) -> Result<()> {
  // Проверяем существование входного файла
  if !input_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: input_path.to_string_lossy().to_string(),
      reason: "Input file not found".to_string(),
    });
  }

  // Временный файл для данных стабилизации
  let transforms_file = std::env::temp_dir().join(format!("transforms_{}.trf", std::process::id()));

  // Шаг 1: Анализ видео и создание файла трансформаций
  FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &input_path.to_string_lossy(),
      "-vf",
      &format!(
        "vidstabdetect=stepsize=6:shakiness={}:accuracy=15:result={}",
        (options.strength * 10.0) as i32,
        transforms_file.to_string_lossy()
      ),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  // Проверяем, что файл трансформаций создан
  if !transforms_file.exists() {
    return Err(VideoCompilerError::ProcessingError {
      operation: "video stabilization analysis".to_string(),
      details: "Failed to create transforms file".to_string(),
    });
  }

  // Шаг 2: Применение стабилизации
  let smoothing_param = (options.smoothing * 30.0) as i32;
  let crop_mode = if options.crop_factor > 0.0 {
    "black"
  } else {
    "keep"
  };

  FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &input_path.to_string_lossy(),
      "-vf",
      &format!(
        "vidstabtransform=input={}:smoothing={}:crop={}:zoom={}",
        transforms_file.to_string_lossy(),
        smoothing_param,
        crop_mode,
        -options.crop_factor * 100.0
      ),
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-c:a",
      "copy",
      "-y",
    ])
    .arg(&options.output_path)
    .execute()
    .await?;

  // Удаляем временный файл
  let _ = tokio::fs::remove_file(&transforms_file).await;

  Ok(())
}

/// Быстрая стабилизация с использованием deshake фильтра
pub async fn quick_stabilize(input_path: &Path, output_path: &Path, strength: f64) -> Result<()> {
  // Проверяем существование входного файла
  if !input_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: input_path.to_string_lossy().to_string(),
      reason: "Input file not found".to_string(),
    });
  }

  // Используем deshake фильтр для быстрой стабилизации
  let shake_params = format!(
    "deshake=x=-1:y=-1:w=-1:h=-1:rx={}:ry={}:edge=original",
    (strength * 16.0) as i32,
    (strength * 16.0) as i32
  );

  FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &input_path.to_string_lossy(),
      "-vf",
      &shake_params,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-c:a",
      "copy",
      "-y",
    ])
    .arg(output_path.to_string_lossy())
    .execute()
    .await?;

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_stabilization_options() {
    let options = StabilizationOptions {
      strength: 0.7,
      smoothing: 0.5,
      crop_factor: 0.1,
      output_path: "/tmp/stabilized.mp4".to_string(),
    };

    assert_eq!(options.strength, 0.7);
    assert_eq!(options.smoothing, 0.5);
    assert_eq!(options.crop_factor, 0.1);
    assert_eq!(options.output_path, "/tmp/stabilized.mp4");
  }
}
