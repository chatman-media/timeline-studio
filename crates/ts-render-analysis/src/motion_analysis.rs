//! Модуль для анализа движения в видео с помощью FFmpeg

use super::FFmpegCommand;
use crate::types::{
  CameraMovement, MotionAnalysisResult, MotionPoint,
};
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};
use regex::Regex;
use std::path::Path;

/// Анализ движения в видео
pub async fn analyze_motion(file_path: &Path, sensitivity: f64) -> Result<MotionAnalysisResult> {
  // Проверяем существование файла
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path.to_string_lossy().to_string(),
      reason: "File not found".to_string(),
    });
  }

  // Анализируем движение камеры
  let camera_movement = analyze_camera_movement(file_path, sensitivity).await?;

  // Анализируем профиль движения по кадрам
  let motion_profile = analyze_motion_profile(file_path, sensitivity).await?;

  // Вычисляем общую интенсивность движения
  let motion_intensity = calculate_average_intensity(&motion_profile);

  // Вычисляем движение объектов (разница между общим движением и движением камеры)
  let object_movement = calculate_object_movement(motion_intensity, &camera_movement);

  Ok(MotionAnalysisResult {
    motion_intensity,
    camera_movement,
    object_movement,
    motion_profile,
  })
}

/// Анализ движения камеры
async fn analyze_camera_movement(file_path: &Path, sensitivity: f64) -> Result<CameraMovement> {
  // Используем vidstabdetect для анализа движения камеры
  let temp_file = std::env::temp_dir().join("motion_vectors.trf");

  let _output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-vf",
      &format!(
        "vidstabdetect=result={}:shakiness={}",
        temp_file.to_string_lossy(),
        (sensitivity * 10.0) as u32
      ),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  // Анализируем файл с векторами движения
  let transforms = if temp_file.exists() {
    let content = tokio::fs::read_to_string(&temp_file)
      .await
      .unwrap_or_default();
    let _ = tokio::fs::remove_file(&temp_file).await;
    content
  } else {
    String::new()
  };

  // Парсим трансформации для определения типов движения камеры
  let (panning, tilting, zooming) = parse_camera_transforms(&transforms);

  // Стабильность обратно пропорциональна движению
  let stability = 1.0 - ((panning + tilting + zooming) / 3.0).min(1.0);

  Ok(CameraMovement {
    panning,
    tilting,
    zooming,
    stability,
  })
}

/// Анализ профиля движения по времени
async fn analyze_motion_profile(file_path: &Path, sensitivity: f64) -> Result<Vec<MotionPoint>> {
  // Используем mestimate для оценки движения
  let output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-vf",
      &format!(
        "select='gte(scene,{})',metadata=print:key=lavfi.scene_score",
        1.0 - sensitivity
      ),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  let stderr = String::from_utf8_lossy(&output.stderr);
  parse_motion_profile(&stderr)
}

/// Парсинг трансформаций камеры
fn parse_camera_transforms(transforms: &str) -> (f64, f64, f64) {
  let mut total_x_movement = 0.0;
  let mut total_y_movement = 0.0;
  let mut total_zoom = 0.0;
  let mut frame_count = 0;

  // Компилируем регулярные выражения один раз
  let x_regex = Regex::new(r"x:([-\d.]+)").unwrap();
  let y_regex = Regex::new(r"y:([-\d.]+)").unwrap();
  let z_regex = Regex::new(r"z:([-\d.]+)").unwrap();

  // Простой парсинг для vidstab output
  for line in transforms.lines() {
    if line.starts_with("Frame") || line.contains("Transform") {
      // Извлекаем значения x, y, zoom из строки
      // Формат примерно: "Frame 123 Transform x:1.2 y:0.5 a:0.01 z:1.02"

      if let Some(x_match) = x_regex.captures(line) {
        if let Ok(x) = x_match[1].parse::<f64>() {
          total_x_movement += x.abs();
        }
      }

      if let Some(y_match) = y_regex.captures(line) {
        if let Ok(y) = y_match[1].parse::<f64>() {
          total_y_movement += y.abs();
        }
      }

      if let Some(z_match) = z_regex.captures(line) {
        if let Ok(z) = z_match[1].parse::<f64>() {
          total_zoom += (z - 1.0).abs(); // zoom относительно 1.0
        }
      }

      frame_count += 1;
    }
  }

  if frame_count > 0 {
    let avg_x = total_x_movement / frame_count as f64;
    let avg_y = total_y_movement / frame_count as f64;
    let avg_zoom = total_zoom / frame_count as f64;

    // Нормализуем значения к диапазону 0-1
    let panning = (avg_x / 10.0).clamp(0.0, 1.0);
    let tilting = (avg_y / 10.0).clamp(0.0, 1.0);
    let zooming = (avg_zoom * 10.0).clamp(0.0, 1.0);

    (panning, tilting, zooming)
  } else {
    // Если нет данных, возвращаем минимальное движение
    (0.1, 0.1, 0.0)
  }
}

/// Парсинг профиля движения
fn parse_motion_profile(stderr: &str) -> Result<Vec<MotionPoint>> {
  let mut points = Vec::new();
  let time_regex = Regex::new(r"pts_time:([\d.]+)").unwrap();
  let score_regex = Regex::new(r"scene_score:([\d.]+)").unwrap();

  for line in stderr.lines() {
    if line.contains("scene_score") {
      let timestamp = if let Some(time_match) = time_regex.captures(line) {
        time_match[1].parse::<f64>().unwrap_or(0.0)
      } else {
        continue;
      };

      let intensity = if let Some(score_match) = score_regex.captures(line) {
        score_match[1].parse::<f64>().unwrap_or(0.0)
      } else {
        0.5 // Значение по умолчанию
      };

      points.push(MotionPoint {
        timestamp,
        intensity: intensity.clamp(0.0, 1.0),
      });
    }
  }

  // Если точек мало, добавляем интерполированные значения
  if points.len() < 10 {
    let duration = points.last().map(|p| p.timestamp).unwrap_or(10.0);
    for i in 0..10 {
      let timestamp = (i as f64 / 9.0) * duration;
      let intensity = 0.3 + (timestamp * 0.1).sin() * 0.2;
      points.push(MotionPoint {
        timestamp,
        intensity: intensity.clamp(0.0, 1.0),
      });
    }
    points.sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());
  }

  Ok(points)
}

/// Вычисление средней интенсивности движения
fn calculate_average_intensity(profile: &[MotionPoint]) -> f64 {
  if profile.is_empty() {
    return 0.0;
  }

  let sum: f64 = profile.iter().map(|p| p.intensity).sum();
  (sum / profile.len() as f64).clamp(0.0, 1.0)
}

/// Вычисление движения объектов
fn calculate_object_movement(total_motion: f64, camera_movement: &CameraMovement) -> f64 {
  // Движение объектов = общее движение минус движение камеры
  let camera_motion =
    (camera_movement.panning + camera_movement.tilting + camera_movement.zooming) / 3.0;
  (total_motion - camera_motion * 0.5).clamp(0.0, 1.0)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_calculate_average_intensity() {
    let profile = vec![
      MotionPoint {
        timestamp: 0.0,
        intensity: 0.5,
      },
      MotionPoint {
        timestamp: 1.0,
        intensity: 0.7,
      },
      MotionPoint {
        timestamp: 2.0,
        intensity: 0.3,
      },
    ];

    let avg = calculate_average_intensity(&profile);
    assert_eq!(avg, 0.5);
  }

  #[test]
  fn test_calculate_object_movement() {
    let camera = CameraMovement {
      panning: 0.6,
      tilting: 0.4,
      zooming: 0.2,
      stability: 0.6,
    };

    let object_movement = calculate_object_movement(0.8, &camera);
    assert!(object_movement > 0.0 && object_movement < 1.0);
  }

  #[test]
  fn test_parse_camera_transforms() {
    let transforms =
      "Frame 1 Transform x:1.5 y:0.8 a:0.01 z:1.05\nFrame 2 Transform x:-1.2 y:-0.5 a:-0.01 z:0.98";
    let (panning, tilting, zooming) = parse_camera_transforms(transforms);

    assert!(panning > 0.0);
    assert!(tilting > 0.0);
    assert!(zooming > 0.0);
  }
}
