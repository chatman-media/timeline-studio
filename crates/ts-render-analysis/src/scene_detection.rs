//! Модуль для детекции сцен в видео с помощью FFmpeg

use super::FFmpegCommand;
use crate::types::{Scene, SceneDetectionResult};
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use regex::Regex;
use std::path::Path;

/// Детекция сцен в видео используя FFmpeg scene detection filter
pub async fn detect_scenes(
  file_path: &Path,
  threshold: f64,
  min_scene_length: f64,
) -> Result<SceneDetectionResult> {
  // Проверяем существование файла
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path.to_string_lossy().to_string(),
      reason: "File not found".to_string(),
    });
  }

  // Строим команду FFmpeg для детекции сцен
  // Используем фильтр select для обнаружения изменений сцен
  let output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-filter:v",
      &format!("select='gt(scene,{})',showinfo", threshold),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  // Парсим вывод FFmpeg для извлечения информации о сценах
  let stderr = String::from_utf8_lossy(&output.stderr);
  let scenes = parse_scene_detection_output(&stderr, min_scene_length)?;

  // Получаем длительность видео для расчета средней длины сцен
  let metadata = super::analysis::get_video_metadata(file_path).await?;
  let _video_duration = metadata.duration;

  // Вычисляем статистику
  let total_scenes = scenes.len() as u32;
  let average_scene_length = if total_scenes > 0 {
    scenes
      .iter()
      .map(|s| s.end_time - s.start_time)
      .sum::<f64>()
      / total_scenes as f64
  } else {
    0.0
  };

  Ok(SceneDetectionResult {
    scenes,
    total_scenes,
    average_scene_length,
  })
}

/// Альтернативный метод детекции сцен с использованием ffprobe
pub async fn detect_scenes_with_ffprobe(
  file_path: &Path,
  threshold: f64,
  min_scene_length: f64,
) -> Result<SceneDetectionResult> {
  // Используем ffprobe с фильтром для получения информации о сценах
  let output = FFmpegCommand::ffprobe()
    .args(vec![
      "-v",
      "error",
      "-show_entries",
      "packet=pts_time,flags",
      "-select_streams",
      "v:0",
      "-of",
      "csv=p=0",
    ])
    .arg(file_path.to_string_lossy())
    .execute_string()
    .await?;

  // Парсим CSV вывод для определения ключевых кадров
  let scenes = parse_keyframes_as_scenes(&output, threshold, min_scene_length)?;

  // Получаем длительность видео
  let metadata = super::analysis::get_video_metadata(file_path).await?;
  let video_duration = metadata.duration;

  // Добавляем последнюю сцену до конца видео
  let mut scenes = scenes;
  if let Some(last_scene) = scenes.last_mut() {
    if last_scene.end_time < video_duration {
      last_scene.end_time = video_duration;
    }
  }

  let total_scenes = scenes.len() as u32;
  let average_scene_length = if total_scenes > 0 {
    video_duration / total_scenes as f64
  } else {
    0.0
  };

  Ok(SceneDetectionResult {
    scenes,
    total_scenes,
    average_scene_length,
  })
}

/// Парсинг вывода FFmpeg для извлечения информации о сценах
fn parse_scene_detection_output(stderr: &str, min_scene_length: f64) -> Result<Vec<Scene>> {
  let mut scenes = Vec::new();
  let mut scene_changes = Vec::new();

  // Регулярное выражение для поиска временных меток в выводе showinfo
  let time_regex = Regex::new(r"pts_time:(\d+\.?\d*)").map_err(|e| {
    VideoCompilerError::SerializationError(format!("Failed to compile regex: {}", e))
  })?;

  // Извлекаем все временные метки изменений сцен
  for line in stderr.lines() {
    if line.contains("[Parsed_showinfo") {
      if let Some(captures) = time_regex.captures(line) {
        if let Some(time_match) = captures.get(1) {
          if let Ok(time) = time_match.as_str().parse::<f64>() {
            scene_changes.push(time);
          }
        }
      }
    }
  }

  // Сортируем временные метки
  scene_changes.sort_by(|a, b| a.partial_cmp(b).unwrap());

  // Создаем сцены из временных меток
  if !scene_changes.is_empty() {
    // Первая сцена начинается с 0
    if scene_changes[0] > min_scene_length {
      scenes.push(Scene {
        start_time: 0.0,
        end_time: scene_changes[0],
        confidence: 0.9, // Высокая уверенность для обнаруженных сцен
        thumbnail_path: None,
      });
    }

    // Промежуточные сцены
    for i in 0..scene_changes.len() - 1 {
      let duration = scene_changes[i + 1] - scene_changes[i];
      if duration >= min_scene_length {
        scenes.push(Scene {
          start_time: scene_changes[i],
          end_time: scene_changes[i + 1],
          confidence: 0.9,
          thumbnail_path: None,
        });
      }
    }
  }

  Ok(scenes)
}

/// Парсинг ключевых кадров как сцен
fn parse_keyframes_as_scenes(
  csv_output: &str,
  threshold: f64,
  min_scene_length: f64,
) -> Result<Vec<Scene>> {
  let mut scenes = Vec::new();
  let mut keyframe_times = Vec::new();

  // Парсим CSV для поиска ключевых кадров (I-frames)
  for line in csv_output.lines() {
    let parts: Vec<&str> = line.split(',').collect();
    if parts.len() >= 2 {
      if let Ok(pts_time) = parts[0].parse::<f64>() {
        // Проверяем флаги для определения ключевого кадра
        if parts[1].contains("K") || parts[1].contains("I") {
          keyframe_times.push(pts_time);
        }
      }
    }
  }

  // Фильтруем ключевые кадры на основе порога
  let mut filtered_times = Vec::new();
  for (i, &keyframe_time) in keyframe_times.iter().enumerate() {
    if i == 0 {
      filtered_times.push(keyframe_time);
    } else {
      let time_diff = keyframe_time - filtered_times.last().unwrap();
      // Используем threshold как минимальное расстояние между сценами
      if time_diff >= min_scene_length / threshold {
        filtered_times.push(keyframe_time);
      }
    }
  }

  // Создаем сцены из отфильтрованных ключевых кадров
  for i in 0..filtered_times.len() {
    let start_time = if i == 0 { 0.0 } else { filtered_times[i - 1] };
    let end_time = filtered_times[i];

    if end_time - start_time >= min_scene_length {
      scenes.push(Scene {
        start_time,
        end_time,
        confidence: 0.8, // Немного ниже уверенность для метода ключевых кадров
        thumbnail_path: None,
      });
    }
  }

  Ok(scenes)
}

/// Генерация миниатюр для сцен
pub async fn generate_scene_thumbnails(
  file_path: &Path,
  scenes: &mut [Scene],
  output_dir: &Path,
) -> Result<()> {
  // Создаем директорию для миниатюр если её нет
  tokio::fs::create_dir_all(output_dir)
    .await
    .map_err(|e| VideoCompilerError::IoError {
      operation: "create thumbnails directory".to_string(),
      path: output_dir.to_string_lossy().to_string(),
      details: e.to_string(),
    })?;

  for (index, scene) in scenes.iter_mut().enumerate() {
    // Берем кадр из середины сцены
    let timestamp = (scene.start_time + scene.end_time) / 2.0;
    let thumbnail_filename = format!("scene_{:03}_{:.2}s.jpg", index, timestamp);
    let thumbnail_path = output_dir.join(&thumbnail_filename);

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
        "-vf",
        "scale=320:-1", // Масштабируем до ширины 320px
        "-y",           // Перезаписывать существующие файлы
      ])
      .arg(thumbnail_path.to_string_lossy().to_string())
      .execute()
      .await?;

    scene.thumbnail_path = Some(thumbnail_path.to_string_lossy().to_string());
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_parse_scene_detection_output() {
    let sample_output = r#"
[Parsed_showinfo_1 @ 0x7f8b8c0] pts_time:0.000000
[Parsed_showinfo_1 @ 0x7f8b8c0] pts_time:5.338667
[Parsed_showinfo_1 @ 0x7f8b8c0] pts_time:10.677333
[Parsed_showinfo_1 @ 0x7f8b8c0] pts_time:15.348667
"#;

    let scenes = parse_scene_detection_output(sample_output, 2.0).unwrap();

    assert_eq!(scenes.len(), 3); // Все сцены длиннее 2 секунд
    assert_eq!(scenes[0].start_time, 0.0);
    assert_eq!(scenes[0].end_time, 5.338667);
    assert_eq!(scenes[1].start_time, 5.338667);
    assert_eq!(scenes[1].end_time, 10.677333);
    assert_eq!(scenes[2].start_time, 10.677333);
    assert_eq!(scenes[2].end_time, 15.348667);
  }

  #[test]
  fn test_parse_keyframes_as_scenes() {
    let sample_csv = r#"0.000000,K__
1.001000,___
2.002000,___
5.005000,K__
10.010000,K__
15.015000,K__"#;

    let scenes = parse_keyframes_as_scenes(sample_csv, 0.3, 2.0).unwrap();

    assert!(!scenes.is_empty());
    assert!(scenes[0].end_time - scenes[0].start_time >= 2.0);
  }
}
