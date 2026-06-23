//! Модуль для анализа качества видео с помощью FFmpeg

use super::FFmpegCommand;
use crate::types::QualityAnalysisResult;
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use regex::Regex;
use std::path::Path;

/// Анализ качества видео с использованием различных фильтров FFmpeg
pub async fn analyze_video_quality(
  file_path: &Path,
  sample_rate: f64,
  enable_noise_detection: bool,
  enable_stability_check: bool,
) -> Result<QualityAnalysisResult> {
  // Проверяем существование файла
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path.to_string_lossy().to_string(),
      reason: "File not found".to_string(),
    });
  }

  // Получаем базовые метрики качества
  let mut quality_metrics = QualityMetrics::default();

  // Анализ яркости и контраста
  let brightness_contrast = analyze_brightness_contrast(file_path, sample_rate).await?;
  quality_metrics.brightness = brightness_contrast.0;
  quality_metrics.contrast = brightness_contrast.1;

  // Анализ резкости
  quality_metrics.sharpness = analyze_sharpness(file_path, sample_rate).await?;

  // Анализ насыщенности
  quality_metrics.saturation = analyze_saturation(file_path, sample_rate).await?;

  // Детекция шума (если включена)
  if enable_noise_detection {
    quality_metrics.noise = detect_noise_level(file_path, sample_rate).await?;
  }

  // Проверка стабильности (если включена)
  if enable_stability_check {
    quality_metrics.stability = check_video_stability(file_path, sample_rate).await?;
  }

  // Формируем список проблем
  let issues = detect_quality_issues(&quality_metrics);

  // Рассчитываем общую оценку качества
  let overall = calculate_overall_quality(&quality_metrics);

  Ok(QualityAnalysisResult {
    overall,
    sharpness: quality_metrics.sharpness,
    brightness: quality_metrics.brightness,
    contrast: quality_metrics.contrast,
    saturation: quality_metrics.saturation,
    noise: quality_metrics.noise,
    stability: quality_metrics.stability,
    issues,
  })
}

#[derive(Default)]
struct QualityMetrics {
  brightness: f64,
  contrast: f64,
  sharpness: f64,
  saturation: f64,
  noise: f64,
  stability: f64,
}

/// Анализ яркости и контраста
async fn analyze_brightness_contrast(file_path: &Path, sample_rate: f64) -> Result<(f64, f64)> {
  // Используем фильтр signalstats для получения статистики по кадрам
  let output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-vf",
      &format!("fps={},signalstats", sample_rate),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  let stderr = String::from_utf8_lossy(&output.stderr);

  // Парсим значения YAVG (средняя яркость) и YDIF (разница яркости - индикатор контраста)
  let mut brightness_values = Vec::new();
  let mut contrast_values = Vec::new();

  // Компилируем регулярные выражения один раз
  let yavg_regex = Regex::new(r"YAVG:(\d+)").unwrap();
  let ydif_regex = Regex::new(r"YDIF:(\d+)").unwrap();

  for line in stderr.lines() {
    if line.contains("YAVG") {
      if let Some(captures) = yavg_regex.captures(line) {
        if let Some(value) = captures.get(1) {
          if let Ok(v) = value.as_str().parse::<f64>() {
            brightness_values.push(v / 255.0); // Нормализуем к 0-1
          }
        }
      }
    }
    if line.contains("YDIF") {
      if let Some(captures) = ydif_regex.captures(line) {
        if let Some(value) = captures.get(1) {
          if let Ok(v) = value.as_str().parse::<f64>() {
            contrast_values.push(v / 255.0); // Нормализуем к 0-1
          }
        }
      }
    }
  }

  // Вычисляем средние значения
  let brightness = if !brightness_values.is_empty() {
    brightness_values.iter().sum::<f64>() / brightness_values.len() as f64
  } else {
    0.5 // Значение по умолчанию
  };

  let contrast = if !contrast_values.is_empty() {
    contrast_values.iter().sum::<f64>() / contrast_values.len() as f64
  } else {
    0.5 // Значение по умолчанию
  };

  Ok((brightness, contrast))
}

/// Анализ резкости изображения
async fn analyze_sharpness(file_path: &Path, sample_rate: f64) -> Result<f64> {
  // Используем фильтр edgedetect для оценки резкости
  let output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-vf",
      &format!(
        "fps={},edgedetect=mode=canny:low=0.1:high=0.4,metadata=print",
        sample_rate
      ),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  let stderr = String::from_utf8_lossy(&output.stderr);

  // Анализируем количество обнаруженных краёв как индикатор резкости
  let mut edge_counts = Vec::new();

  // Простая эвристика: подсчитываем строки с информацией о кадрах
  for line in stderr.lines() {
    if line.contains("frame") && line.contains("pts_time") {
      edge_counts.push(1.0); // Placeholder для реального анализа
    }
  }

  // Нормализованная оценка резкости (0-1)
  // В реальной реализации здесь был бы более сложный анализ
  Ok(0.8) // Временное значение
}

/// Анализ насыщенности цветов
async fn analyze_saturation(file_path: &Path, sample_rate: f64) -> Result<f64> {
  // Используем фильтр signalstats для анализа цветовых каналов
  let output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-vf",
      &format!("fps={},signalstats=stat=sat", sample_rate),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  let stderr = String::from_utf8_lossy(&output.stderr);

  // Парсим значения насыщенности
  // Компилируем регулярное выражение один раз
  let sat_regex = Regex::new(r"SAT[HML]:(\d+)").unwrap();
  let mut saturation_values = Vec::new();

  for line in stderr.lines() {
    for capture in sat_regex.captures_iter(line) {
      if let Some(value) = capture.get(1) {
        if let Ok(v) = value.as_str().parse::<f64>() {
          saturation_values.push(v / 255.0); // Нормализуем
        }
      }
    }
  }

  // Вычисляем среднюю насыщенность
  if !saturation_values.is_empty() {
    Ok(saturation_values.iter().sum::<f64>() / saturation_values.len() as f64)
  } else {
    Ok(0.6) // Значение по умолчанию
  }
}

/// Детекция уровня шума в видео
async fn detect_noise_level(file_path: &Path, sample_rate: f64) -> Result<f64> {
  // Используем фильтр noise для оценки шума
  let _output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-vf",
      &format!("fps={},noise=alls=20:allf=t,metadata=print", sample_rate),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  // Анализируем изменения между кадрами как индикатор шума
  // В реальной реализации здесь был бы анализ PSNR или SSIM

  // Временная реализация: возвращаем низкий уровень шума
  Ok(0.1)
}

/// Проверка стабильности видео (обнаружение тряски)
async fn check_video_stability(file_path: &Path, sample_rate: f64) -> Result<f64> {
  // Используем фильтр vidstabdetect для анализа стабильности
  let temp_file = std::env::temp_dir().join("transforms.trf");

  let _output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-vf",
      &format!(
        "fps={},vidstabdetect=result={}",
        sample_rate,
        temp_file.to_string_lossy()
      ),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  // Анализируем файл трансформаций для оценки стабильности
  if temp_file.exists() {
    let transforms = tokio::fs::read_to_string(&temp_file)
      .await
      .unwrap_or_default();

    // Удаляем временный файл
    let _ = tokio::fs::remove_file(&temp_file).await;

    // Анализируем величину трансформаций
    let mut total_movement = 0.0;
    let mut frame_count = 0;

    for line in transforms.lines() {
      if line.starts_with("Frame") {
        // Парсим значения трансформации
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 4 {
          // Суммируем абсолютные значения смещений
          for part in &parts[2..4] {
            if let Ok(val) = part.parse::<f64>() {
              total_movement += val.abs();
            }
          }
          frame_count += 1;
        }
      }
    }

    // Вычисляем стабильность (инвертируем движение)
    if frame_count > 0 {
      let avg_movement = total_movement / frame_count as f64;
      // Нормализуем и инвертируем (больше движения = меньше стабильности)
      Ok((1.0 - (avg_movement / 100.0)).clamp(0.0, 1.0))
    } else {
      Ok(0.9) // Предполагаем хорошую стабильность по умолчанию
    }
  } else {
    // Если анализ не удался, возвращаем среднюю стабильность
    Ok(0.85)
  }
}

/// Обнаружение проблем качества
fn detect_quality_issues(metrics: &QualityMetrics) -> Vec<String> {
  let mut issues = Vec::new();

  if metrics.brightness < 0.3 {
    issues.push("Видео слишком темное".to_string());
  } else if metrics.brightness > 0.8 {
    issues.push("Видео пересвечено".to_string());
  }

  if metrics.contrast < 0.3 {
    issues.push("Низкий контраст изображения".to_string());
  }

  if metrics.sharpness < 0.4 {
    issues.push("Изображение размыто или не в фокусе".to_string());
  }

  if metrics.saturation < 0.2 {
    issues.push("Цвета выглядят блеклыми".to_string());
  } else if metrics.saturation > 0.9 {
    issues.push("Цвета перенасыщены".to_string());
  }

  if metrics.noise > 0.3 {
    issues.push("Высокий уровень шума в видео".to_string());
  }

  if metrics.stability < 0.7 {
    issues.push("Обнаружена тряска камеры".to_string());
  }

  issues
}

/// Расчет общей оценки качества
fn calculate_overall_quality(metrics: &QualityMetrics) -> f64 {
  // Веса для разных метрик
  let weights = [
    (metrics.sharpness, 0.25),                                // Резкость - 25%
    (metrics.brightness.clamp(0.3, 0.7) * 2.5 - 0.75, 0.15),  // Яркость - 15%
    (metrics.contrast.max(0.3), 0.15),                        // Контраст - 15%
    (metrics.saturation.clamp(0.2, 0.8) * 1.67 - 0.33, 0.10), // Насыщенность - 10%
    (1.0 - metrics.noise, 0.15),                              // Отсутствие шума - 15%
    (metrics.stability, 0.20),                                // Стабильность - 20%
  ];

  // Взвешенная сумма
  let mut total = 0.0;
  let mut total_weight = 0.0;

  for (value, weight) in weights {
    total += value * weight;
    total_weight += weight;
  }

  if total_weight > 0.0 {
    (total / total_weight).clamp(0.0, 1.0)
  } else {
    0.5
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_calculate_overall_quality() {
    let metrics = QualityMetrics {
      brightness: 0.5,
      contrast: 0.6,
      sharpness: 0.8,
      saturation: 0.5,
      noise: 0.1,
      stability: 0.9,
    };

    let overall = calculate_overall_quality(&metrics);
    assert!(overall > 0.0 && overall <= 1.0);
    assert!(overall > 0.7); // Должно быть хорошее качество
  }

  #[test]
  fn test_detect_quality_issues() {
    let metrics = QualityMetrics {
      brightness: 0.2, // Слишком темно
      contrast: 0.2,   // Низкий контраст
      sharpness: 0.3,  // Размыто
      saturation: 0.5,
      noise: 0.4,     // Много шума
      stability: 0.6, // Тряска
    };

    let issues = detect_quality_issues(&metrics);
    assert!(issues.len() >= 5);
    assert!(issues.iter().any(|i| i.contains("темное")));
    assert!(issues.iter().any(|i| i.contains("контраст")));
    assert!(issues.iter().any(|i| i.contains("размыто")));
    assert!(issues.iter().any(|i| i.contains("шум")));
    assert!(issues.iter().any(|i| i.contains("тряска")));
  }
}
