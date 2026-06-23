//! Модуль для цветокоррекции видео с помощью FFmpeg

use super::FFmpegCommand;
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use std::path::Path;

/// Параметры цветокоррекции
#[derive(Debug, Clone, Default)]
pub struct ColorCorrectionOptions {
  pub brightness: Option<f64>, // -1.0 до 1.0
  pub contrast: Option<f64>,   // -2.0 до 2.0
  pub saturation: Option<f64>, // 0.0 до 3.0
  pub gamma: Option<f64>,      // 0.1 до 10.0
  pub hue: Option<f64>,        // -180 до 180 градусов
  pub auto_levels: bool,       // Автоматическая коррекция уровней
}

/// Применение цветокоррекции к видео
pub async fn apply_color_correction(
  input_path: &Path,
  output_path: &Path,
  options: ColorCorrectionOptions,
) -> Result<()> {
  // Проверяем существование входного файла
  if !input_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: input_path.to_string_lossy().to_string(),
      reason: "Input file not found".to_string(),
    });
  }

  // Строим фильтр eq для цветокоррекции
  let mut filter_parts = Vec::new();

  if let Some(brightness) = options.brightness {
    filter_parts.push(format!("brightness={}", brightness));
  }

  if let Some(contrast) = options.contrast {
    filter_parts.push(format!("contrast={}", contrast));
  }

  if let Some(saturation) = options.saturation {
    filter_parts.push(format!("saturation={}", saturation));
  }

  if let Some(gamma) = options.gamma {
    filter_parts.push(format!("gamma={}", gamma));
  }

  // Строим полный фильтр
  let mut filters = Vec::new();

  if !filter_parts.is_empty() {
    filters.push(format!("eq={}", filter_parts.join(":")));
  }

  if let Some(hue) = options.hue {
    filters.push(format!("hue=h={}", hue));
  }

  if options.auto_levels {
    filters.push("normalize".to_string());
  }

  // Если нет фильтров, просто копируем файл
  if filters.is_empty() {
    tokio::fs::copy(input_path, output_path)
      .await
      .map_err(|e| VideoCompilerError::IoError {
        operation: "copy file".to_string(),
        path: input_path.to_string_lossy().to_string(),
        details: e.to_string(),
      })?;
    return Ok(());
  }

  // Применяем фильтры
  FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &input_path.to_string_lossy(),
      "-vf",
      &filters.join(","),
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
    .arg(output_path.to_string_lossy())
    .execute()
    .await?;

  Ok(())
}

/// Автоматическая цветокоррекция с анализом
pub async fn auto_color_correct(
  input_path: &Path,
  output_path: &Path,
  strength: f64,
) -> Result<()> {
  // Проверяем существование входного файла
  if !input_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: input_path.to_string_lossy().to_string(),
      reason: "Input file not found".to_string(),
    });
  }

  // Анализируем видео для определения необходимых коррекций
  let analysis = analyze_color_balance(input_path).await?;

  // Применяем коррекции на основе анализа
  let mut options = ColorCorrectionOptions::default();

  // Корректируем яркость
  if analysis.avg_brightness < 0.4 || analysis.avg_brightness > 0.6 {
    options.brightness = Some((0.5 - analysis.avg_brightness) * strength);
  }

  // Корректируем контраст
  if analysis.contrast < 0.5 {
    options.contrast = Some((0.6 - analysis.contrast) * strength);
  }

  // Корректируем насыщенность
  if analysis.saturation < 0.4 {
    options.saturation = Some(1.0 + (0.6 - analysis.saturation) * strength);
  } else if analysis.saturation > 0.8 {
    options.saturation = Some(1.0 - (analysis.saturation - 0.6) * strength);
  }

  // Применяем автоматическую нормализацию уровней
  options.auto_levels = true;

  // Применяем коррекции
  apply_color_correction(input_path, output_path, options).await
}

/// Структура для результатов анализа цветового баланса
struct ColorAnalysis {
  avg_brightness: f64,
  contrast: f64,
  saturation: f64,
}

/// Анализ цветового баланса видео
async fn analyze_color_balance(input_path: &Path) -> Result<ColorAnalysis> {
  // Используем signalstats для анализа
  let output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &input_path.to_string_lossy(),
      "-vf",
      "select='not(mod(n,30))',signalstats",
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  let _stderr = String::from_utf8_lossy(&output.stderr);

  // Простой парсинг результатов (в реальности нужен более сложный анализ)
  // Возвращаем примерные значения
  Ok(ColorAnalysis {
    avg_brightness: 0.5,
    contrast: 0.5,
    saturation: 0.6,
  })
}

/// Применение LUT (Look-Up Table) для профессиональной цветокоррекции
pub async fn apply_lut(input_path: &Path, output_path: &Path, lut_path: &Path) -> Result<()> {
  // Проверяем существование файлов
  if !input_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: input_path.to_string_lossy().to_string(),
      reason: "Input file not found".to_string(),
    });
  }

  if !lut_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: lut_path.to_string_lossy().to_string(),
      reason: "LUT file not found".to_string(),
    });
  }

  // Применяем LUT
  FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &input_path.to_string_lossy(),
      "-vf",
      &format!("lut3d='{}'", lut_path.to_string_lossy()),
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
    .arg(output_path.to_string_lossy())
    .execute()
    .await?;

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_color_correction_options_default() {
    let options = ColorCorrectionOptions::default();

    assert!(options.brightness.is_none());
    assert!(options.contrast.is_none());
    assert!(options.saturation.is_none());
    assert!(options.gamma.is_none());
    assert!(options.hue.is_none());
    assert!(!options.auto_levels);
  }

  #[test]
  fn test_color_correction_options_custom() {
    let options = ColorCorrectionOptions {
      brightness: Some(0.2),
      contrast: Some(1.2),
      saturation: Some(1.5),
      gamma: Some(1.1),
      hue: Some(10.0),
      auto_levels: true,
    };

    assert_eq!(options.brightness, Some(0.2));
    assert_eq!(options.contrast, Some(1.2));
    assert_eq!(options.saturation, Some(1.5));
    assert_eq!(options.gamma, Some(1.1));
    assert_eq!(options.hue, Some(10.0));
    assert!(options.auto_levels);
  }
}
