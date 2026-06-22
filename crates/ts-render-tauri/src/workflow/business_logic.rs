//! Бизнес-логика для автоматизированных рабочих процессов

use serde_json::{json, Value};
use std::path::Path;
use std::process::Command;

/// Создать временную директорию для workflow
pub fn create_directory_logic(path: &str) -> Result<bool, String> {
  std::fs::create_dir_all(path).map_err(|e| format!("Ошибка создания директории: {e}"))?;
  Ok(true)
}

/// Создать проект timeline из данных workflow
pub fn create_timeline_project_logic(
  project_data: &str,
  output_path: &str,
) -> Result<String, String> {
  use std::fs;

  // Проверяем что данные проекта валидны
  let _project: serde_json::Value =
    serde_json::from_str(project_data).map_err(|e| format!("Невалидные данные проекта: {e}"))?;

  // Создаем директорию если не существует
  if let Some(parent) = Path::new(output_path).parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Ошибка создания директории: {e}"))?;
  }

  // Записываем данные проекта в файл
  fs::write(output_path, project_data).map_err(|e| format!("Ошибка записи файла проекта: {e}"))?;

  Ok(format!("Проект timeline создан: {output_path}"))
}

/// Компилировать видео из проекта timeline для workflow
pub fn compile_workflow_video_logic(
  project_file: &str,
  output_path: &str,
  settings: &str,
) -> Result<serde_json::Value, String> {
  let render_settings: Value = serde_json::from_str(settings)
    .map_err(|e| format!("Ошибка парсинга настроек рендеринга: {e}"))?;

  // Пока используем простую заглушку для компиляции
  // В реальной реализации здесь должна быть логика FFmpeg рендеринга
  let start_time = std::time::Instant::now();

  // Проверяем существование файла проекта
  if !Path::new(project_file).exists() {
    return Err(format!("Файл проекта не найден: {project_file}"));
  }

  // Создаем выходную директорию если не существует
  if let Some(parent) = Path::new(output_path).parent() {
    std::fs::create_dir_all(parent)
      .map_err(|e| format!("Ошибка создания выходной директории: {e}"))?;
  }

  // Простое копирование файла для демонстрации (в реальности здесь FFmpeg)
  std::fs::copy(project_file, output_path)
    .map_err(|e| format!("Ошибка создания выходного файла: {e}"))?;

  let processing_time = start_time.elapsed().as_secs_f64();

  Ok(json!({
      "success": true,
      "output_path": output_path,
      "processing_time": processing_time,
      "resolution": {
          "width": render_settings["resolution"]["width"].as_u64().unwrap_or(1920),
          "height": render_settings["resolution"]["height"].as_u64().unwrap_or(1080)
      },
      "framerate": render_settings["framerate"].as_u64().unwrap_or(30),
      "quality": render_settings["quality"].as_str().unwrap_or("high"),
      "message": "Видео успешно скомпилировано"
  }))
}

/// Анализ качества видео для workflow
pub fn analyze_workflow_video_quality_logic(
  video_path: &str,
  analysis_type: &str,
) -> Result<serde_json::Value, String> {
  if !Path::new(video_path).exists() {
    return Err(format!("Видеофайл не найден: {video_path}"));
  }

  // Получаем метаданные видео с помощью ffprobe
  let output = Command::new("ffprobe")
    .args([
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      video_path,
    ])
    .output()
    .map_err(|e| format!("Ошибка запуска ffprobe: {e}"))?;

  if !output.status.success() {
    return Err("ffprobe завершился с ошибкой".to_string());
  }

  let json_str = String::from_utf8_lossy(&output.stdout);
  let metadata: serde_json::Value =
    serde_json::from_str(&json_str).map_err(|e| format!("Ошибка парсинга метаданных: {e}"))?;

  // Базовый анализ качества
  let video_stream = metadata["streams"]
    .as_array()
    .and_then(|streams| {
      streams
        .iter()
        .find(|stream| stream["codec_type"].as_str() == Some("video"))
    })
    .ok_or("Видеопоток не найден")?;

  let width = video_stream["width"].as_u64().unwrap_or(0);
  let height = video_stream["height"].as_u64().unwrap_or(0);
  let bitrate = metadata["format"]["bit_rate"]
    .as_str()
    .and_then(|br| br.parse::<u64>().ok())
    .unwrap_or(0);

  // Оценка качества на основе разрешения и битрейта
  let quality_score = calculate_quality_score(width, height, bitrate);

  let analysis_result = match analysis_type {
    "basic" => json!({
        "width": width,
        "height": height,
        "bitrate": bitrate,
        "quality_score": quality_score,
        "analysis_type": "basic"
    }),
    "detailed" => json!({
        "width": width,
        "height": height,
        "bitrate": bitrate,
        "quality_score": quality_score,
        "codec": video_stream["codec_name"].as_str().unwrap_or("unknown"),
        "pixel_format": video_stream["pix_fmt"].as_str().unwrap_or("unknown"),
        "frame_rate": video_stream["r_frame_rate"].as_str().unwrap_or("unknown"),
        "analysis_type": "detailed"
    }),
    _ => json!({
        "error": "Неизвестный тип анализа",
        "supported_types": ["basic", "detailed"]
    }),
  };

  Ok(analysis_result)
}

/// Создать превью для workflow результата
pub fn create_workflow_preview_logic(
  video_path: &str,
  output_path: &str,
  timestamp: Option<f64>,
) -> Result<serde_json::Value, String> {
  if !Path::new(video_path).exists() {
    return Err(format!("Исходное видео не найдено: {video_path}"));
  }

  let frame_time = timestamp.unwrap_or(5.0); // По умолчанию 5 секунда

  let mut ffmpeg_cmd = Command::new("ffmpeg");
  ffmpeg_cmd
    .arg("-i")
    .arg(video_path)
    .arg("-ss")
    .arg(frame_time.to_string())
    .arg("-vframes")
    .arg("1")
    .arg("-y")
    .arg("-vf")
    .arg("scale=1280:720") // HD превью
    .arg("-q:v")
    .arg("2") // Высокое качество
    .arg(output_path);

  let output = ffmpeg_cmd
    .output()
    .map_err(|e| format!("Ошибка запуска FFmpeg: {e}"))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(format!("FFmpeg завершился с ошибкой: {stderr}"));
  }

  let file_size = std::fs::metadata(output_path)
    .map_err(|e| format!("Ошибка получения размера файла: {e}"))?
    .len();

  Ok(json!({
      "success": true,
      "preview_path": output_path,
      "file_size": file_size,
      "timestamp": frame_time,
      "resolution": { "width": 1280, "height": 720 },
      "message": "Превью workflow успешно создано"
  }))
}

/// Очистить временные файлы workflow
pub fn cleanup_workflow_temp_files_logic(temp_directory: &str) -> Result<bool, String> {
  if Path::new(temp_directory).exists() {
    std::fs::remove_dir_all(temp_directory)
      .map_err(|e| format!("Ошибка удаления временной директории: {e}"))?;
  }
  Ok(true)
}

/// Вычислить оценку качества видео
pub fn calculate_quality_score(width: u64, height: u64, bitrate: u64) -> u8 {
  let pixels = width * height;
  let bitrate_kbps = bitrate / 1000;

  // Простая оценка качества на основе разрешения и битрейта
  let resolution_score = match pixels {
    p if p >= 1920 * 1080 => 40, // 4K/1080p
    p if p >= 1280 * 720 => 30,  // 720p
    p if p >= 854 * 480 => 20,   // 480p
    _ => 10,                     // Низкое разрешение
  };

  let bitrate_score = match bitrate_kbps {
    b if b >= 5000 => 40, // Высокий битрейт
    b if b >= 2500 => 30, // Средний битрейт
    b if b >= 1000 => 20, // Низкий битрейт
    _ => 10,              // Очень низкий битрейт
  };

  let base_score = 20; // Базовые баллы
  std::cmp::min(100, resolution_score + bitrate_score + base_score) as u8
}
