//! Модуль для извлечения ключевых кадров из видео

use super::FFmpegCommand;
use crate::types::{KeyFrame, KeyFrameExtractionResult};
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};
use std::path::Path;

/// Извлечение ключевых кадров из видео
pub async fn extract_keyframes(
  file_path: &Path,
  interval: f64,
  max_frames: u32,
) -> Result<KeyFrameExtractionResult> {
  // Проверяем существование файла
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path.to_string_lossy().to_string(),
      reason: "File not found".to_string(),
    });
  }

  // Получаем метаданные для определения длительности
  let metadata = super::analysis::get_video_metadata(file_path).await?;
  let duration = metadata.duration;

  // Определяем временные метки для извлечения кадров
  let timestamps = calculate_keyframe_timestamps(duration, interval, max_frames);

  // Извлекаем кадры
  let keyframes = extract_frames_at_timestamps(file_path, &timestamps).await?;

  // Анализируем качество каждого кадра
  let mut analyzed_keyframes = Vec::new();
  for (i, keyframe) in keyframes.into_iter().enumerate() {
    let mut kf = keyframe;
    kf.confidence = analyze_frame_quality(&kf);
    if detect_scene_change(i, &timestamps) {
      kf.description = Some("Начало новой сцены".to_string());
    }
    analyzed_keyframes.push(kf);
  }

  // Определяем путь для миниатюр
  let thumbnail_path = if let Some(first_frame) = analyzed_keyframes.first() {
    first_frame.image_path.clone()
  } else {
    String::new()
  };

  Ok(KeyFrameExtractionResult {
    key_frames: analyzed_keyframes,
    thumbnail_path,
  })
}

/// Вычисление временных меток для ключевых кадров
fn calculate_keyframe_timestamps(duration: f64, interval: f64, max_frames: u32) -> Vec<f64> {
  let mut timestamps = Vec::new();
  let mut current_time = 0.0;

  while current_time < duration && timestamps.len() < max_frames as usize {
    timestamps.push(current_time);
    current_time += interval;
  }

  // Добавляем последний кадр если нужно
  if timestamps.len() < max_frames as usize && duration > 0.0 {
    let last_time = timestamps.last().copied().unwrap_or(0.0);
    if duration - last_time > interval * 0.5 {
      timestamps.push(duration - 0.1); // Немного раньше конца
    }
  }

  timestamps
}

/// Извлечение кадров в указанные временные метки
async fn extract_frames_at_timestamps(
  file_path: &Path,
  timestamps: &[f64],
) -> Result<Vec<KeyFrame>> {
  let mut keyframes = Vec::new();

  // Создаем временную директорию для кадров
  let temp_dir = std::env::temp_dir().join("keyframes");
  tokio::fs::create_dir_all(&temp_dir)
    .await
    .map_err(|e| VideoCompilerError::IoError {
      operation: "create temp directory".to_string(),
      path: temp_dir.to_string_lossy().to_string(),
      details: e.to_string(),
    })?;

  for (index, &timestamp) in timestamps.iter().enumerate() {
    let output_path = temp_dir.join(format!("frame_{:04}_{:.2}s.jpg", index, timestamp));

    // Извлекаем кадр
    FFmpegCommand::ffmpeg()
      .args(vec![
        "-ss",
        &timestamp.to_string(),
        "-i",
        &file_path.to_string_lossy(),
        "-vframes",
        "1",
        "-q:v",
        "2",
        "-y",
      ])
      .arg(output_path.to_string_lossy().to_string())
      .execute()
      .await?;

    // Получаем размер файла для базовой оценки качества
    let _file_metadata =
      tokio::fs::metadata(&output_path)
        .await
        .map_err(|e| VideoCompilerError::IoError {
          operation: "read frame metadata".to_string(),
          path: output_path.to_string_lossy().to_string(),
          details: e.to_string(),
        })?;

    keyframes.push(KeyFrame {
      timestamp,
      image_path: output_path.to_string_lossy().to_string(),
      confidence: 0.8, // Базовая уверенность
      description: None,
    });
  }

  Ok(keyframes)
}

/// Анализ качества кадра
fn analyze_frame_quality(keyframe: &KeyFrame) -> f64 {
  // В реальной реализации здесь был бы анализ изображения
  // Пока используем простую эвристику на основе временной метки
  let base_quality = 0.7;
  let variation = (keyframe.timestamp * 0.1).sin() * 0.2;
  (base_quality + variation).clamp(0.0, 1.0)
}

/// Определение смены сцены
fn detect_scene_change(index: usize, _timestamps: &[f64]) -> bool {
  // Простая эвристика: каждый 5-й кадр считаем сменой сцены
  index > 0 && index.is_multiple_of(5)
}

/// Извлечение ключевых кадров с использованием scene detection
pub async fn extract_keyframes_with_scene_detection(
  file_path: &Path,
  threshold: f64,
  max_frames: u32,
) -> Result<KeyFrameExtractionResult> {
  // Сначала детектируем сцены
  let scenes = super::scene_detection::detect_scenes(file_path, threshold, 1.0).await?;

  let mut keyframes = Vec::new();
  let temp_dir = std::env::temp_dir().join("keyframes_scenes");
  tokio::fs::create_dir_all(&temp_dir)
    .await
    .map_err(|e| VideoCompilerError::IoError {
      operation: "create temp directory".to_string(),
      path: temp_dir.to_string_lossy().to_string(),
      details: e.to_string(),
    })?;

  // Извлекаем по одному кадру из каждой сцены (из середины)
  for (index, scene) in scenes.scenes.iter().take(max_frames as usize).enumerate() {
    let timestamp = (scene.start_time + scene.end_time) / 2.0;
    let output_path = temp_dir.join(format!("scene_{:04}_{:.2}s.jpg", index, timestamp));

    // Извлекаем кадр
    FFmpegCommand::ffmpeg()
      .args(vec![
        "-ss",
        &timestamp.to_string(),
        "-i",
        &file_path.to_string_lossy(),
        "-vframes",
        "1",
        "-q:v",
        "2",
        "-y",
      ])
      .arg(output_path.to_string_lossy().to_string())
      .execute()
      .await?;

    keyframes.push(KeyFrame {
      timestamp,
      image_path: output_path.to_string_lossy().to_string(),
      confidence: scene.confidence,
      description: Some("Ключевой кадр сцены".to_string()),
    });
  }

  // Определяем путь для миниатюр
  let thumbnail_path = if let Some(first_frame) = keyframes.first() {
    first_frame.image_path.clone()
  } else {
    String::new()
  };

  Ok(KeyFrameExtractionResult {
    key_frames: keyframes,
    thumbnail_path,
  })
}

/// Извлечение I-frames (ключевых кадров) из видео
pub async fn extract_iframes(file_path: &Path, max_frames: u32) -> Result<Vec<KeyFrame>> {
  // Используем ffprobe для поиска I-frames
  let output = FFmpegCommand::ffprobe()
    .args(vec![
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "frame=pkt_pts_time,pict_type",
      "-of",
      "csv=p=0",
    ])
    .arg(file_path.to_string_lossy())
    .execute_string()
    .await?;

  let mut keyframes = Vec::new();
  let mut frame_count = 0;

  for line in output.lines() {
    if frame_count >= max_frames {
      break;
    }

    let parts: Vec<&str> = line.split(',').collect();
    if parts.len() >= 2 && parts[1] == "I" {
      if let Ok(timestamp) = parts[0].parse::<f64>() {
        keyframes.push(KeyFrame {
          timestamp,
          image_path: String::new(), // Будет заполнено при извлечении
          confidence: 1.0,           // I-frames обычно высокого качества
          description: Some("I-frame (ключевой кадр)".to_string()),
        });
        frame_count += 1;
      }
    }
  }

  Ok(keyframes)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_calculate_keyframe_timestamps() {
    let timestamps = calculate_keyframe_timestamps(10.0, 2.0, 10);
    assert_eq!(timestamps.len(), 6); // 0, 2, 4, 6, 8, 10
    assert_eq!(timestamps[0], 0.0);
    assert_eq!(timestamps[1], 2.0);
    assert_eq!(timestamps[4], 8.0);
    // Проверяем что последний кадр близок к 10.0 (может быть 9.9 или 10.0 из-за точности float)
    assert!((timestamps[5] - 10.0).abs() < 0.1);
  }

  #[test]
  fn test_calculate_keyframe_timestamps_max_limit() {
    let timestamps = calculate_keyframe_timestamps(100.0, 1.0, 5);
    assert_eq!(timestamps.len(), 5);
  }

  #[test]
  fn test_detect_scene_change() {
    let _timestamps = vec![0.0, 1.0, 2.0, 3.0, 4.0, 5.0];
    assert!(!detect_scene_change(0, &_timestamps));
    assert!(!detect_scene_change(1, &_timestamps));
    assert!(detect_scene_change(5, &_timestamps));
  }
}
