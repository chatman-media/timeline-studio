//! Tauri команды для извлечения кадров

use super::business_logic;
use super::types::*;
use ts_render_services::VideoCompilerState;
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use ts_render::video_compiler::preview::PreviewGenerator;
use ts_render::video_compiler::schema::ProjectSchema;
use std::path::Path;
use tauri::State;

/// Извлечь кадры таймлайна
#[tauri::command]
pub async fn extract_timeline_frames(
  project_schema: ProjectSchema,
  interval: f64,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let duration = project_schema.timeline.duration;
  let timestamps = business_logic::calculate_frame_timestamps(duration, interval);
  let frame_paths =
    business_logic::generate_frame_paths(&output_dir, &timestamps, &FrameFormat::Png);

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  for (timestamp, frame_path) in timestamps.iter().zip(frame_paths.iter()) {
    generator
      .generate_frame(&project_schema, *timestamp, frame_path, None)
      .await?;
  }

  Ok(frame_paths)
}

/// Извлечь кадры субтитров
#[tauri::command]
pub async fn extract_subtitle_frames(
  project_schema: ProjectSchema,
  output_dir: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<SubtitleFrameResult>> {
  let mut results = Vec::new();

  for subtitle in &project_schema.subtitles {
    let frame_path =
      business_logic::generate_subtitle_frame_path(&output_dir, &subtitle.id, &FrameFormat::Png);

    // Генерируем кадр с субтитром используя FFmpeg
    let ffmpeg_path = _state.ffmpeg_path.read().await.clone();
    let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

    // Находим видео клип для извлечения базового кадра
    let video_clip = project_schema
      .tracks
      .iter()
      .flat_map(|track| &track.clips)
      .find(|clip| subtitle.start_time >= clip.start_time && subtitle.start_time <= clip.end_time);

    if let Some(clip) = video_clip {
      match &clip.source {
        ts_render::video_compiler::schema::ClipSource::File(_video_path) => {
          // Извлекаем базовый кадр из видео
          let base_frame_path = format!("{}_base.png", frame_path.trim_end_matches(".png"));
          generator
            .generate_frame(&project_schema, subtitle.start_time, &base_frame_path, None)
            .await?;

          // Создаем кадр с субтитром поверх базового кадра
          generate_subtitle_overlay(
            &base_frame_path,
            &frame_path,
            &subtitle.text,
            subtitle.style.font_family.as_str(),
            &project_schema,
          )
          .await?;

          // Получаем размеры кадра
          let (width, height) = get_frame_dimensions(&frame_path).unwrap_or((1920, 1080));

          results.push(SubtitleFrameResult {
            subtitle_id: subtitle.id.clone(),
            timestamp: subtitle.start_time,
            frame_path,
            width,
            height,
          });
        }
        _ => {
          log::warn!("Субтитр {} не связан с видео файлом", subtitle.id);
        }
      }
    } else {
      log::warn!(
        "Не найден видео клип для субтитра {} в момент времени {}",
        subtitle.id,
        subtitle.start_time
      );
    }
  }

  Ok(results)
}

/// Генерировать превью
#[tauri::command]
pub async fn generate_preview(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  generator
    .generate_frame(&project_schema, timestamp, &output_path, None)
    .await?;

  Ok(output_path)
}

/// Генерировать пакет превью
#[tauri::command]
pub async fn generate_preview_batch(
  project_schema: ProjectSchema,
  timestamps: Vec<f64>,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  let mut paths = Vec::new();

  for timestamp in timestamps {
    let output_path = format!("{output_dir}/preview_{timestamp:.2}.png");
    generator
      .generate_frame(&project_schema, timestamp, &output_path, None)
      .await?;
    paths.push(output_path);
  }

  Ok(paths)
}

/// Извлечь кадры с параметрами
#[tauri::command]
pub async fn extract_frames_with_params(
  params: FrameExtractionParams,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<ExtractedFrame>> {
  // Валидируем параметры
  business_logic::validate_extraction_params(&params)?;

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // Извлекаем кадры с заданными параметрами
  let mut frames = Vec::new();
  let resolution = params.resolution;
  let quality = params.quality.unwrap_or(80);

  for timestamp in &params.timestamps {
    log::info!("Извлечение кадра на временной метке: {timestamp}s");

    match generator
      .generate_preview(
        Path::new(&params.video_path),
        *timestamp,
        resolution,
        Some(quality),
      )
      .await
    {
      Ok(image_data) => {
        frames.push(ExtractedFrame {
          timestamp: *timestamp,
          data: image_data,
          width: resolution.map(|(w, _)| w).unwrap_or(1920),
          height: resolution.map(|(_, h)| h).unwrap_or(1080),
          format: params.output_format.clone(),
        });
      }
      Err(e) => {
        log::error!("Ошибка извлечения кадра на {timestamp}s: {e}");
        // Продолжаем с другими кадрами
      }
    }
  }

  if frames.is_empty() && !params.timestamps.is_empty() {
    return Err(VideoCompilerError::PreviewError {
      timestamp: params.timestamps.first().copied().unwrap_or(0.0),
      reason: "Не удалось извлечь ни одного кадра".to_string(),
    });
  }

  Ok(frames)
}

/// Извлечь ключевые кадры
#[tauri::command]
pub async fn extract_keyframes(
  project_schema: ProjectSchema,
  keyframe_count: usize,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let duration = project_schema.timeline.duration;
  let timestamps = business_logic::generate_keyframe_timestamps(duration, keyframe_count);
  let frame_paths =
    business_logic::generate_frame_paths(&output_dir, &timestamps, &FrameFormat::Jpeg);

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  for (timestamp, frame_path) in timestamps.iter().zip(frame_paths.iter()) {
    generator
      .generate_frame(&project_schema, *timestamp, frame_path, None)
      .await?;
  }

  Ok(frame_paths)
}

/// Генерировать превью с настройками
#[tauri::command]
pub async fn generate_preview_with_settings(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  let options = business_logic::extract_preview_options(&settings);

  generator
    .generate_frame(&project_schema, timestamp, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Получить информацию о кэше извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache_info(
  project_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Заглушка для несуществующего метода
  Ok(business_logic::generate_cache_info(&project_id, 0, 0))
}

/// Очистить кэш кадров
#[tauri::command]
pub async fn clear_frame_cache(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Извлечь кадр из видео
#[tauri::command]
pub async fn extract_video_frame(
  video_path: String,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  log::info!(
    "Извлечение кадра из {} на {}s в {}",
    video_path,
    timestamp,
    output_path
  );

  // Проверяем существование файла
  let video_path_obj = Path::new(&video_path);
  if !video_path_obj.exists() {
    return Err(VideoCompilerError::ValidationError(format!(
      "Видео файл не найден: {}",
      video_path
    )));
  }

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // Извлекаем кадр с параметрами по умолчанию
  let image_data = generator
    .generate_preview(
      video_path_obj,
      timestamp,
      Some((1920, 1080)), // Стандартное разрешение
      Some(90),           // Высокое качество
    )
    .await?;

  // Сохраняем данные в файл
  tokio::fs::write(&output_path, image_data)
    .await
    .map_err(|e| VideoCompilerError::ProcessingError {
      operation: "frame_extraction".to_string(),
      details: format!("Не удалось сохранить кадр: {}", e),
    })?;

  log::info!("Кадр успешно извлечен и сохранен: {}", output_path);
  Ok(output_path)
}

/// Извлечь кадры из видео пакетом
#[tauri::command]
pub async fn extract_video_frames_batch(
  video_path: String,
  timestamps: Vec<f64>,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use std::path::Path;

  log::info!(
    "Пакетное извлечение {} кадров из {}",
    timestamps.len(),
    video_path
  );

  // Проверяем существование видео файла
  let video_path_obj = Path::new(&video_path);
  if !video_path_obj.exists() {
    return Err(VideoCompilerError::ValidationError(format!(
      "Видео файл не найден: {}",
      video_path
    )));
  }

  // Создаем директорию если не существует
  tokio::fs::create_dir_all(&output_dir).await.map_err(|e| {
    VideoCompilerError::ProcessingError {
      operation: "frame_extraction".to_string(),
      details: format!("Не удалось создать директорию: {}", e),
    }
  })?;

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // Извлекаем кадры пакетом для оптимизации
  let preview_results = generator
    .generate_preview_batch_for_file(
      video_path_obj,
      timestamps.clone(),
      Some((1280, 720)), // Среднее разрешение для пакетной обработки
      Some(80),          // Хорошее качество
    )
    .await?;

  let mut paths = Vec::new();
  let mut success_count = 0;

  for (i, (timestamp, result)) in timestamps.iter().zip(preview_results.iter()).enumerate() {
    let output_path = format!("{}/frame_{:04}_{:.2}.jpg", output_dir, i + 1, timestamp);

    match &result.result {
      Ok(image_data) => {
        // Сохраняем кадр
        if let Err(e) = tokio::fs::write(&output_path, image_data).await {
          log::error!("Ошибка сохранения кадра {}: {}", output_path, e);
          continue;
        }
        success_count += 1;
        paths.push(output_path);
      }
      Err(e) => {
        log::error!("Ошибка извлечения кадра на {}s: {}", timestamp, e);
      }
    }
  }

  log::info!(
    "Успешно извлечено {} из {} кадров",
    success_count,
    timestamps.len()
  );

  if paths.is_empty() {
    return Err(VideoCompilerError::PreviewError {
      timestamp: timestamps.first().copied().unwrap_or(0.0),
      reason: "Не удалось извлечь ни одного кадра".to_string(),
    });
  }

  Ok(paths)
}

/// Получить миниатюры видео
#[tauri::command]
pub async fn get_video_thumbnails(
  video_path: String,
  count: usize,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use std::path::Path;

  log::info!("Генерация {} миниатюр из {}", count, video_path);

  // Проверяем существование видео файла
  let video_path_obj = Path::new(&video_path);
  if !video_path_obj.exists() {
    return Err(VideoCompilerError::ValidationError(format!(
      "Видео файл не найден: {}",
      video_path
    )));
  }

  // Создаем директорию если не существует
  tokio::fs::create_dir_all(&output_dir).await.map_err(|e| {
    VideoCompilerError::ProcessingError {
      operation: "frame_extraction".to_string(),
      details: format!("Не удалось создать директорию: {}", e),
    }
  })?;

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // Получаем информацию о видео для определения длительности
  let video_info = generator.get_video_info(video_path_obj).await?;
  let duration = video_info.duration;

  if duration <= 0.0 {
    return Err(VideoCompilerError::PreviewError {
      timestamp: 0.0,
      reason: "Не удалось определить длительность видео".to_string(),
    });
  }

  // Вычисляем временные метки для равномерного распределения миниатюр
  let mut timestamps = Vec::new();
  if count == 1 {
    // Для одной миниатюры берем кадр из середины
    timestamps.push(duration / 2.0);
  } else {
    // Равномерно распределяем по длительности
    let interval = duration / (count as f64 + 1.0);
    for i in 1..=count {
      timestamps.push(interval * i as f64);
    }
  }

  // Извлекаем миниатюры с меньшим разрешением
  let preview_results = generator
    .generate_preview_batch_for_file(
      video_path_obj,
      timestamps.clone(),
      Some((320, 180)), // Маленькое разрешение для миниатюр
      Some(70),         // Среднее качество достаточно для миниатюр
    )
    .await?;

  let mut thumbnails = Vec::new();
  let mut success_count = 0;

  for (i, result) in preview_results.iter().enumerate() {
    let output_path = format!("{}/thumbnail_{:03}.jpg", output_dir, i + 1);

    match &result.result {
      Ok(image_data) => {
        // Сохраняем миниатюру
        if let Err(e) = tokio::fs::write(&output_path, image_data).await {
          log::error!("Ошибка сохранения миниатюры {}: {}", output_path, e);
          continue;
        }
        success_count += 1;
        thumbnails.push(output_path);
      }
      Err(e) => {
        log::error!("Ошибка генерации миниатюры {}: {}", i + 1, e);
      }
    }
  }

  log::info!(
    "Успешно сгенерировано {} из {} миниатюр",
    success_count,
    count
  );

  if thumbnails.is_empty() {
    return Err(VideoCompilerError::PreviewError {
      timestamp: 0.0,
      reason: "Не удалось сгенерировать ни одной миниатюры".to_string(),
    });
  }

  Ok(thumbnails)
}

/// Генерирует наложение субтитра поверх базового кадра
async fn generate_subtitle_overlay(
  base_frame_path: &str,
  output_path: &str,
  subtitle_text: &str,
  style_id: &str,
  project_schema: &ProjectSchema,
) -> Result<()> {
  use std::process::Command;

  // Ищем субтитр по style_id (который на самом деле должен быть subtitle_id)
  let subtitle = project_schema.subtitles.iter().find(|s| s.id == style_id);

  let (font_size, font_color, bg_color) = if let Some(sub) = subtitle {
    (
      sub.style.font_size as u32,
      sub.style.color.as_str(),
      sub.style.background_color.as_deref().unwrap_or("#00000080"),
    )
  } else {
    (24, "#FFFFFF", "#00000080")
  };

  // Экранируем текст для FFmpeg
  let escaped_text = subtitle_text.replace("'", "\\'").replace(":", "\\:");

  // Создаем FFmpeg фильтр для наложения текста
  let drawtext_filter = format!(
    "drawtext=text='{}':fontsize={}:fontcolor={}:box=1:boxcolor={}:boxborderw=5:x=(w-text_w)/2:y=h-th-50",
    escaped_text, font_size, font_color, bg_color
  );

  let mut cmd = Command::new("ffmpeg");
  cmd.args([
    "-i",
    base_frame_path,
    "-vf",
    &drawtext_filter,
    "-frames:v",
    "1",
    "-y", // Перезаписать выходной файл
    output_path,
  ]);

  log::debug!("Генерируем субтитр: {:?}", cmd);

  let output = cmd.output().map_err(|e| {
    ts_render::video_compiler::error::VideoCompilerError::ProcessingError {
      operation: "detect_scene_changes".to_string(),
      details: format!("Failed to generate subtitle overlay: {}", e),
    }
  })?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(
      ts_render::video_compiler::error::VideoCompilerError::ProcessingError {
        operation: "ffmpeg_scene_detection".to_string(),
        details: format!("FFmpeg subtitle overlay failed: {}", stderr),
      },
    );
  }

  log::info!("Сгенерирован кадр с субтитром: {}", output_path);
  Ok(())
}

/// Получает размеры кадра из файла изображения
fn get_frame_dimensions(image_path: &str) -> Option<(u32, u32)> {
  use std::process::Command;

  let output = Command::new("ffprobe")
    .args([
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_streams",
      image_path,
    ])
    .output()
    .ok()?;

  let output_str = String::from_utf8(output.stdout).ok()?;
  let json: serde_json::Value = serde_json::from_str(&output_str).ok()?;

  let streams = json.get("streams")?.as_array()?;
  let video_stream = streams
    .iter()
    .find(|stream| stream.get("codec_type").and_then(|v| v.as_str()) == Some("video"))?;

  let width = video_stream.get("width")?.as_u64()? as u32;
  let height = video_stream.get("height")?.as_u64()? as u32;

  Some((width, height))
}
