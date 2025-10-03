use crate::video_compiler::ffmpeg_executor::FFmpegExecutor;
use crate::video_compiler::schema::ProjectSchema;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::path::{Path, PathBuf};
use tokio::fs;

use super::types::*;

/// Парсит размер сетки для коллажа
pub fn parse_grid_size(grid_str: &str) -> Result<(u32, u32), String> {
  let parts: Vec<&str> = grid_str.split('x').collect();
  if parts.len() != 2 {
    return Err(format!(
      "Неверный формат сетки: {grid_str}. Ожидается 'WxH'"
    ));
  }

  let cols: u32 = parts[0]
    .parse()
    .map_err(|_| format!("Неверное количество колонок: {}", parts[0]))?;
  let rows: u32 = parts[1]
    .parse()
    .map_err(|_| format!("Неверное количество строк: {}", parts[1]))?;

  if cols == 0 || rows == 0 || cols > 10 || rows > 10 {
    return Err("Размер сетки должен быть от 1x1 до 10x10".to_string());
  }

  Ok((cols, rows))
}

/// Вычисляет интервал извлечения кадров
pub fn calculate_frame_interval(sampling_rate: f64, max_frames: u32, duration: f64) -> f64 {
  if sampling_rate > 0.0 {
    1.0 / sampling_rate
  } else {
    duration / max_frames as f64
  }
}

/// Вычисляет временные метки для извлечения превью (избегая начала и конца)
pub fn calculate_multimodal_thumbnail_timestamps(duration: f64, count: u32) -> Vec<f64> {
  let start_offset = duration * 0.1;
  let end_offset = duration * 0.9;
  let useful_duration = end_offset - start_offset;
  let interval = useful_duration / count as f64;

  (0..count)
    .map(|i| start_offset + (i as f64 * interval))
    .collect()
}

/// Валидирует параметры извлечения кадров
pub fn validate_frame_extraction_params(params: &FrameExtractionParams) -> Result<(), String> {
  if params.clip_id.is_empty() {
    return Err("ID клипа не может быть пустым".to_string());
  }

  if params.max_frames == 0 {
    return Err("Максимальное количество кадров должно быть больше 0".to_string());
  }

  if params.max_frames > 1000 {
    return Err("Максимальное количество кадров не может превышать 1000".to_string());
  }

  if params.sampling_rate < 0.0 {
    return Err("Частота кадров не может быть отрицательной".to_string());
  }

  if params.quality > 31 {
    return Err("Качество JPEG должно быть от 1 до 31".to_string());
  }

  let valid_formats = ["jpg", "jpeg", "png", "webp"];
  if !valid_formats.contains(&params.output_format.to_lowercase().as_str()) {
    return Err(format!(
      "Неподдерживаемый формат: {}. Доступные: {:?}",
      params.output_format, valid_formats
    ));
  }

  Ok(())
}

/// Получает путь к видео по ID клипа из схемы проекта
pub fn get_video_path_by_clip_id(project: &ProjectSchema, clip_id: &str) -> Result<String, String> {
  // Поиск в треках
  for track in &project.tracks {
    for clip in &track.clips {
      if clip.id == clip_id {
        return match &clip.source {
          crate::video_compiler::schema::timeline::ClipSource::File(path) => Ok(path.clone()),
          _ => Err(format!("Клип '{clip_id}' не является файлом")),
        };
      }
    }
  }

  Err(format!("Клип с ID '{clip_id}' не найден в проекте"))
}

/// Создает путь к временной директории для кадров
pub fn get_temp_frames_dir(clip_id: &str) -> PathBuf {
  let mut temp_path = std::env::temp_dir();
  temp_path.push("timeline_studio_multimodal");
  temp_path.push(clip_id);
  temp_path
}

/// Создает временную директорию для кадров
pub async fn create_temp_frames_dir(clip_id: &str) -> Result<PathBuf, String> {
  let temp_dir = get_temp_frames_dir(clip_id);

  fs::create_dir_all(&temp_dir)
    .await
    .map_err(|e| format!("Ошибка создания временной директории: {e}"))?;

  Ok(temp_dir)
}

/// Конвертирует данные изображения в base64
pub fn convert_bytes_to_base64(image_data: &[u8]) -> String {
  STANDARD.encode(image_data)
}

/// Извлекает один кадр из видео в указанное время
pub async fn extract_single_frame(
  video_path: &str,
  timestamp: f64,
  output_path: &Path,
) -> Result<bool, String> {
  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffmpeg");

  cmd.args([
    "-ss",
    &timestamp.to_string(),
    "-i",
    video_path,
    "-vframes",
    "1",
    "-q:v",
    "2", // высокое качество
    "-y",
    &output_path.to_string_lossy(),
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка извлечения кадра: {e}"))?;

  Ok(result.exit_code == 0 && output_path.exists())
}

/// Извлекает кадр высокого качества с возможностью изменения соотношения сторон
pub async fn extract_high_quality_frame(
  video_path: &str,
  timestamp: f64,
  output_path: &Path,
  aspect_ratio: Option<&str>,
) -> Result<bool, String> {
  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffmpeg");

  let mut args = vec![
    "-ss".to_string(),
    timestamp.to_string(),
    "-i".to_string(),
    video_path.to_string(),
    "-vframes".to_string(),
    "1".to_string(),
  ];

  // Добавляем фильтр изменения размера если указано соотношение сторон
  if let Some(ratio) = aspect_ratio {
    match ratio {
      "16:9" => {
        args.extend_from_slice(&["-vf".to_string(), "crop=ih*16/9:ih".to_string()]);
      }
      "4:3" => {
        args.extend_from_slice(&["-vf".to_string(), "crop=ih*4/3:ih".to_string()]);
      }
      "1:1" => {
        args.extend_from_slice(&[
          "-vf".to_string(),
          "crop=min(ih\\,iw):min(ih\\,iw)".to_string(),
        ]);
      }
      _ => {} // Оставляем исходное соотношение
    }
  }

  args.extend_from_slice(&[
    "-q:v".to_string(),
    "1".to_string(), // максимальное качество
    "-y".to_string(),
    output_path.to_string_lossy().to_string(),
  ]);

  cmd.args(args);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка извлечения высококачественного кадра: {e}"))?;

  Ok(result.exit_code == 0 && output_path.exists())
}

/// Создает коллаж из кадров с помощью FFmpeg
pub async fn create_ffmpeg_collage(
  frame_paths: &[String],
  output_path: &str,
  cols: u32,
  rows: u32,
) -> Result<bool, String> {
  if frame_paths.is_empty() {
    return Err("Список кадров пуст".to_string());
  }

  let total_frames = cols * rows;
  if frame_paths.len() < total_frames as usize {
    return Err(format!(
      "Недостаточно кадров для сетки {}x{}: предоставлено {}, требуется {}",
      cols,
      rows,
      frame_paths.len(),
      total_frames
    ));
  }

  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffmpeg");

  // Добавляем входные файлы
  for path in frame_paths.iter().take(total_frames as usize) {
    cmd.args(["-i", path]);
  }

  // Создаем фильтр для коллажа
  let filter = create_collage_filter(cols, rows);

  cmd.args(["-filter_complex", &filter, "-y", output_path]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка создания коллажа: {e}"))?;

  Ok(result.exit_code == 0)
}

/// Создает строку фильтра FFmpeg для коллажа
pub fn create_collage_filter(cols: u32, rows: u32) -> String {
  let mut filter_parts = Vec::new();
  let mut input_names = Vec::new();

  // Масштабируем входные изображения
  for i in 0..(cols * rows) {
    let scaled_name = format!("scaled{i}");
    filter_parts.push(format!("[{i}:v]scale=320:240[{scaled_name}]"));
    input_names.push(scaled_name);
  }

  // Создаем сетку
  let current_inputs = input_names;

  // Сначала объединяем по строкам
  let mut row_outputs = Vec::new();
  for row in 0..rows {
    let row_inputs: Vec<String> = (0..cols)
      .map(|col| current_inputs[(row * cols + col) as usize].clone())
      .collect();

    if cols == 1 {
      row_outputs.push(row_inputs[0].clone());
    } else {
      let row_output = format!("row{row}");
      let hstack = format!(
        "{}hstack=inputs={}[{row_output}]",
        row_inputs
          .iter()
          .map(|s| format!("[{s}]"))
          .collect::<String>(),
        cols
      );
      filter_parts.push(hstack);
      row_outputs.push(row_output);
    }
  }

  // Затем объединяем строки в столбец
  if rows == 1 {
    filter_parts.join(";")
  } else {
    let vstack = format!(
      "{}vstack=inputs={}[out]",
      row_outputs
        .iter()
        .map(|s| format!("[{s}]"))
        .collect::<String>(),
      rows
    );
    filter_parts.push(vstack);
    filter_parts.join(";")
  }
}

/// Получает информацию о видео через FFprobe для мультимодального анализа
pub async fn get_video_info_for_multimodal(video_path: &str) -> Result<VideoInfo, String> {
  let mut cmd = tokio::process::Command::new("ffprobe");

  cmd.args([
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    video_path,
  ]);

  let output = cmd
    .output()
    .await
    .map_err(|e| format!("Ошибка запуска ffprobe: {e}"))?;

  if !output.status.success() {
    return Err(format!(
      "FFprobe завершился с ошибкой: {}",
      String::from_utf8_lossy(&output.stderr)
    ));
  }

  let json_str = String::from_utf8_lossy(&output.stdout);
  parse_video_info(&json_str)
}

/// Парсит JSON ответ от FFprobe
pub fn parse_video_info(json_str: &str) -> Result<VideoInfo, String> {
  let data: serde_json::Value =
    serde_json::from_str(json_str).map_err(|e| format!("Ошибка парсинга JSON: {e}"))?;

  let format = data["format"]
    .as_object()
    .ok_or("Не найдена секция format")?;

  let duration: f64 = format["duration"]
    .as_str()
    .ok_or("Не найдено поле duration")?
    .parse()
    .map_err(|e| format!("Ошибка парсинга duration: {e}"))?;

  let streams = data["streams"]
    .as_array()
    .ok_or("Не найдена секция streams")?;

  let video_stream = streams
    .iter()
    .find(|s| s["codec_type"].as_str() == Some("video"))
    .ok_or("Не найден видео поток")?;

  let width = video_stream["width"]
    .as_u64()
    .ok_or("Не найдено поле width")? as u32;

  let height = video_stream["height"]
    .as_u64()
    .ok_or("Не найдено поле height")? as u32;

  let fps = if let Some(r_frame_rate) = video_stream["r_frame_rate"].as_str() {
    parse_fraction_to_float(r_frame_rate)?
  } else {
    25.0 // значение по умолчанию
  };

  Ok(VideoInfo {
    duration,
    width,
    height,
    fps,
  })
}

/// Парсит дробь вида "30/1" в float
pub fn parse_fraction_to_float(fraction: &str) -> Result<f64, String> {
  let parts: Vec<&str> = fraction.split('/').collect();
  if parts.len() != 2 {
    return Err(format!("Неверный формат дроби: {fraction}"));
  }

  let numerator: f64 = parts[0]
    .parse()
    .map_err(|e| format!("Ошибка парсинга числителя: {e}"))?;
  let denominator: f64 = parts[1]
    .parse()
    .map_err(|e| format!("Ошибка парсинга знаменателя: {e}"))?;

  if denominator == 0.0 {
    return Err("Знаменатель не может быть нулем".to_string());
  }

  Ok(numerator / denominator)
}

/// Получает информацию об изображении
pub async fn get_image_info(image_path: &Path) -> Result<ImageInfo, String> {
  let mut cmd = tokio::process::Command::new("ffprobe");

  cmd.args([
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_streams",
    &image_path.to_string_lossy(),
  ]);

  let output = cmd
    .output()
    .await
    .map_err(|e| format!("Ошибка запуска ffprobe для изображения: {e}"))?;

  if !output.status.success() {
    // Возвращаем значения по умолчанию если ffprobe не может прочитать изображение
    return Ok(ImageInfo {
      width: 1920,
      height: 1080,
      format: "jpg".to_string(),
    });
  }

  let json_str = String::from_utf8_lossy(&output.stdout);
  parse_image_info(&json_str)
}

/// Парсит информацию об изображении из JSON
pub fn parse_image_info(json_str: &str) -> Result<ImageInfo, String> {
  let data: serde_json::Value =
    serde_json::from_str(json_str).map_err(|e| format!("Ошибка парсинга JSON изображения: {e}"))?;

  let streams = data["streams"]
    .as_array()
    .ok_or("Не найдена секция streams")?;

  if streams.is_empty() {
    return Ok(ImageInfo {
      width: 1920,
      height: 1080,
      format: "jpg".to_string(),
    });
  }

  let stream = &streams[0];

  let width = stream["width"].as_u64().unwrap_or(1920) as u32;
  let height = stream["height"].as_u64().unwrap_or(1080) as u32;
  let format = stream["codec_name"].as_str().unwrap_or("jpg").to_string();

  Ok(ImageInfo {
    width,
    height,
    format,
  })
}
