use ts_render::video_compiler::ffmpeg_executor::FFmpegExecutor;
use ts_render::video_compiler::schema::ProjectSchema;
use std::path::Path;
use tokio::fs;

use super::business_logic::*;
use super::types::*;

/// Извлекает кадры из видео для мультимодального анализа
#[tauri::command]
pub async fn extract_frames_for_multimodal_analysis(
  project_schema: ProjectSchema,
  clip_id: String,
  sampling_rate: f64,
  max_frames: u32,
) -> Result<Vec<ExtractedFrame>, String> {
  let video_path = get_video_path_by_clip_id(&project_schema, &clip_id)?;

  if !Path::new(&video_path).exists() {
    return Err(format!("Видео файл не найден: {video_path}"));
  }

  // Получаем информацию о видео
  let video_info = get_video_info_for_multimodal(&video_path).await?;
  let duration = video_info.duration;

  // Вычисляем интервал между кадрами
  let interval = calculate_frame_interval(sampling_rate, max_frames, duration);

  // Создаем временную директорию для кадров
  let temp_dir = create_temp_frames_dir(&clip_id).await?;

  let mut frames = Vec::new();
  let mut current_time = 0.0;
  let mut frame_count = 0;

  // Извлекаем кадры
  while current_time < duration && frame_count < max_frames {
    let frame_filename = format!("frame_{frame_count:06}.jpg");
    let frame_path = temp_dir.join(&frame_filename);

    // Извлекаем кадр в указанное время
    let success = extract_single_frame(&video_path, current_time, &frame_path).await?;

    if success {
      let frame_info = get_image_info(&frame_path).await?;

      frames.push(ExtractedFrame {
        image_path: frame_path.to_string_lossy().to_string(),
        timestamp: current_time,
        width: frame_info.width,
        height: frame_info.height,
        format: "jpg".to_string(),
      });

      frame_count += 1;
    }

    current_time += interval;
  }

  log::info!(
    "Извлечено {} кадров для мультимодального анализа клипа {}",
    frames.len(),
    clip_id
  );

  Ok(frames)
}

/// Конвертирует изображение в base64 для отправки в GPT-4V
#[tauri::command]
pub async fn convert_image_to_base64(image_path: String) -> Result<String, String> {
  let path = Path::new(&image_path);

  if !path.exists() {
    return Err(format!("Изображение не найдено: {image_path}"));
  }

  // Читаем файл
  let image_data = fs::read(&path)
    .await
    .map_err(|e| format!("Ошибка чтения изображения: {e}"))?;

  // Конвертируем в base64
  Ok(convert_bytes_to_base64(&image_data))
}

/// Извлекает кадры с оптимизацией для анализа превью
#[tauri::command]
pub async fn extract_thumbnail_candidates(
  project_schema: ProjectSchema,
  clip_id: String,
  count: u32,
  aspect_ratio: Option<String>,
) -> Result<Vec<ExtractedFrame>, String> {
  let video_path = get_video_path_by_clip_id(&project_schema, &clip_id)?;
  let video_info = get_video_info_for_multimodal(&video_path).await?;

  // Вычисляем временные метки для превью
  let timestamps = calculate_multimodal_thumbnail_timestamps(video_info.duration, count);

  let temp_dir = create_temp_frames_dir(&clip_id).await?;
  let mut frames = Vec::new();

  for (i, timestamp) in timestamps.iter().enumerate() {
    let frame_filename = format!("thumbnail_candidate_{i:03}.jpg");
    let frame_path = temp_dir.join(&frame_filename);

    // Извлекаем кадр с высоким качеством для превью
    let success = extract_high_quality_frame(
      &video_path,
      *timestamp,
      &frame_path,
      aspect_ratio.as_deref(),
    )
    .await?;

    if success {
      let frame_info = get_image_info(&frame_path).await?;

      frames.push(ExtractedFrame {
        image_path: frame_path.to_string_lossy().to_string(),
        timestamp: *timestamp,
        width: frame_info.width,
        height: frame_info.height,
        format: "jpg".to_string(),
      });
    }
  }

  Ok(frames)
}

/// Создает коллаж из нескольких кадров для анализа
#[tauri::command]
pub async fn create_frame_collage(
  frame_paths: Vec<String>,
  output_path: String,
  grid_size: Option<String>,
) -> Result<String, String> {
  if frame_paths.is_empty() {
    return Err("Список кадров не может быть пустым".to_string());
  }

  // Определяем размер сетки
  let (cols, rows) = parse_grid_size(grid_size.as_deref().unwrap_or("2x2"))?;

  // Проверяем, что все файлы существуют
  for path in &frame_paths {
    if !Path::new(path).exists() {
      return Err(format!("Кадр не найден: {path}"));
    }
  }

  // Создаем коллаж с помощью FFmpeg
  let success = create_ffmpeg_collage(&frame_paths, &output_path, cols, rows).await?;

  if success {
    Ok(output_path)
  } else {
    Err("Не удалось создать коллаж".to_string())
  }
}

/// Оптимизирует изображение для анализа GPT-4V
#[tauri::command]
pub async fn optimize_image_for_analysis(
  input_path: String,
  output_path: String,
  max_dimension: Option<u32>,
  quality: Option<u32>,
) -> Result<String, String> {
  let input = Path::new(&input_path);
  let _output = Path::new(&output_path);

  if !input.exists() {
    return Err(format!("Входное изображение не найдено: {input_path}"));
  }

  let max_dim = max_dimension.unwrap_or(2048); // GPT-4V оптимально работает с изображениями до 2K
  let jpeg_quality = quality.unwrap_or(85);

  // Используем FFmpeg для оптимизации
  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffmpeg");

  cmd.args([
    "-i",
    &input_path,
    "-vf",
    &format!("scale='min({max_dim},iw)':'min({max_dim},ih)':force_original_aspect_ratio=decrease"),
    "-q:v",
    &jpeg_quality.to_string(),
    "-y", // перезаписать файл
    &output_path,
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка оптимизации изображения: {e}"))?;

  if result.exit_code == 0 {
    Ok(output_path)
  } else {
    Err(format!("FFmpeg завершился с ошибкой: {}", result.stderr))
  }
}

/// Удаляет временные файлы кадров
#[tauri::command]
pub async fn cleanup_extracted_frames(clip_id: String) -> Result<u32, String> {
  let temp_dir = get_temp_frames_dir(&clip_id);

  if !temp_dir.exists() {
    return Ok(0);
  }

  let mut removed_count = 0;
  let mut entries = fs::read_dir(&temp_dir)
    .await
    .map_err(|e| format!("Ошибка чтения директории: {e}"))?;

  while let Some(entry) = entries
    .next_entry()
    .await
    .map_err(|e| format!("Ошибка перечисления файлов: {e}"))?
  {
    let path = entry.path();
    if path.is_file() && fs::remove_file(&path).await.is_ok() {
      removed_count += 1;
    }
  }

  // Удаляем саму директорию если она пустая
  let _ = fs::remove_dir(&temp_dir).await;

  log::info!("Удалено {removed_count} временных кадров для клипа {clip_id}");
  Ok(removed_count)
}
