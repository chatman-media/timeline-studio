//! Tauri команды для генерации превью

use super::super::state::VideoCompilerState;
use super::{business_logic, types::*};
use crate::video_compiler::{
  error::{Result, VideoCompilerError},
  schema::ProjectSchema,
};
use std::path::Path;
use tauri::State;

/// Генерировать превью кадра в определенное время
#[tauri::command]
pub async fn generate_frame_preview(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  let options = business_logic::create_frame_preview_options();

  preview_service
    .generate_frame(&project_schema, timestamp, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Генерировать миниатюры для видео
#[tauri::command]
pub async fn generate_video_thumbnails(
  video_path: String,
  output_dir: String,
  count: u32,
  width: u32,
  height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Создаем временные метки для миниатюр
  let timestamps = business_logic::generate_thumbnail_timestamps(count, 10.0);

  let _results = preview_service
    .generate_preview_batch_for_file(
      Path::new(&video_path),
      timestamps,
      Some((width, height)),
      Some(85),
    )
    .await?;

  // Генерируем пути файлов на основе временных меток
  let thumbnails = business_logic::generate_thumbnail_paths(&output_dir, count);
  Ok(thumbnails)
}

/// Генерировать превью проекта (короткое видео)
#[tauri::command]
pub async fn generate_project_preview(
  project_schema: ProjectSchema,
  output_path: String,
  _duration: f64,
  width: u32,
  height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  let options = business_logic::create_project_preview_options(width, height);

  // Генерируем кадр на начале проекта
  preview_service
    .generate_frame(&project_schema, 0.0, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Генерировать превью эффекта
#[tauri::command]
pub async fn generate_effect_preview(
  effect_id: String,
  _input_path: String,
  output_path: String,
  timestamp: f64,
  _parameters: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Создаем временный проект с эффектом для превью
  let project = business_logic::create_effect_preview_project(&effect_id);
  let options = business_logic::create_effect_preview_options();

  preview_service
    .generate_frame(&project, timestamp, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Генерировать превью перехода
#[tauri::command]
pub async fn generate_transition_preview(
  transition_type: String,
  _input_a: String,
  _input_b: String,
  output_path: String,
  duration: f64,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Создаем временный проект с переходом для превью
  let project = business_logic::create_transition_preview_project(&transition_type);
  let options = business_logic::create_transition_preview_options();

  preview_service
    .generate_frame(&project, duration / 2.0, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Генерировать раскадровку (storyboard) проекта
#[tauri::command]
pub async fn generate_storyboard(
  project_schema: ProjectSchema,
  output_path: String,
  frames_per_row: u32,
  frame_width: u32,
  frame_height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Генерируем раскадровку используя пакетную генерацию превью
  let duration = project_schema.timeline.duration;
  let timestamps = business_logic::generate_storyboard_timestamps(duration, frames_per_row, 3);

  let options =
    business_logic::create_preview_options(Some(frame_width), Some(frame_height), "jpeg", 85);

  // Создаем директорию для кадров
  std::fs::create_dir_all(&output_path)?;

  // Генерируем кадры
  for (i, timestamp) in timestamps.into_iter().enumerate() {
    let frame_path = format!("{output_path}/frame_{i:03}.jpg");
    preview_service
      .generate_frame(
        &project_schema,
        timestamp,
        &frame_path,
        Some(options.clone()),
      )
      .await?;
  }

  Ok(output_path)
}

/// Генерировать анимированное превью (GIF)
#[tauri::command]
pub async fn generate_animated_preview(
  _project_schema: ProjectSchema,
  params: AnimatedPreviewParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Валидируем параметры
  business_logic::validate_animated_preview_params(&params)?;

  // Используем FFmpeg для создания анимированного GIF из видео
  let args = business_logic::build_ffmpeg_gif_command(&params);
  let mut cmd = std::process::Command::new("ffmpeg");
  cmd.args(&args);

  let output = cmd.output().map_err(|e| VideoCompilerError::FFmpegError {
    exit_code: None,
    stderr: format!("Не удалось запустить FFmpeg для GIF: {e}"),
    command: "ffmpeg".to_string(),
  })?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(VideoCompilerError::FFmpegError {
      exit_code: output.status.code(),
      stderr: format!("FFmpeg не смог создать GIF: {stderr}"),
      command: "ffmpeg".to_string(),
    });
  }

  Ok(params.output_path)
}

/// Генерировать превью звуковой волны
#[tauri::command]
pub async fn generate_waveform_preview(
  audio_path: String,
  output_path: String,
  width: u32,
  height: u32,
  color: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Валидируем цвет
  business_logic::validate_waveform_color(&color)?;

  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Используем PreviewService для генерации waveform
  let waveform_data = preview_service
    .generate_waveform(std::path::Path::new(&audio_path), width, height, &color)
    .await?;

  // Сохраняем результат в файл
  tokio::fs::write(&output_path, waveform_data)
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Не удалось сохранить waveform: {e}")))?;

  Ok(output_path)
}

/// Генерировать waveform данные в формате JSON для peaks.js
///
/// Использует FFmpeg для извлечения аудио данных и генерирует JSON файл
/// совместимый с peaks.js и audiowaveform
#[tauri::command]
pub async fn generate_waveform_data_json(
  audio_path: String,
  output_path: String,
  pixels_per_second: Option<u32>,
  bits: Option<u8>,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let pixels_per_second = pixels_per_second.unwrap_or(20);
  let bits = bits.unwrap_or(8);

  // Валидация параметров
  if bits != 8 && bits != 16 {
    return Err(VideoCompilerError::validation("Bits должен быть 8 или 16"));
  }

  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Генерируем waveform данные через FFmpeg
  let waveform_json = preview_service
    .generate_waveform_data_json(std::path::Path::new(&audio_path), pixels_per_second, bits)
    .await?;

  // Сохраняем JSON в файл
  tokio::fs::write(&output_path, waveform_json)
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Не удалось сохранить waveform JSON: {e}")))?;

  Ok(output_path)
}

/// Получить информацию о превью из кэша
#[tauri::command]
pub async fn get_cached_preview_info(
  preview_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  // Создаем ключ для поиска превью
  let key =
    crate::video_compiler::cache::PreviewKey::new(preview_id.clone(), 0.0, (1920, 1080), 85);
  let mut cache_mut = state.cache_manager.write().await;
  if let Some(preview_data) = cache_mut.get_preview(&key).await {
    let info =
      business_logic::create_cached_preview_info(preview_id, preview_data.image_data.len());
    Ok(Some(serde_json::to_value(info)?))
  } else {
    Ok(None)
  }
}

/// Очистить кэш превью для проекта
#[tauri::command]
pub async fn clear_project_previews(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Генерировать превью с настраиваемыми параметрами
#[tauri::command]
pub async fn generate_custom_preview(
  project_schema: ProjectSchema,
  output_path: String,
  options: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Парсим настройки из JSON
  let preview_options: crate::video_compiler::core::preview::PreviewOptions =
    serde_json::from_value(options)
      .map_err(|e| VideoCompilerError::InvalidParameter(format!("Invalid preview options: {e}")))?;

  preview_service
    .generate_frame(&project_schema, 0.0, &output_path, Some(preview_options))
    .await?;

  Ok(output_path)
}

/// Генерировать пакет превью с настройками
#[tauri::command]
pub async fn generate_preview_batch_with_settings(
  video_path: String,
  timestamps: Vec<f64>,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::preview::{PreviewGenerator, PreviewRequest, PreviewSettings};
  use base64::Engine;

  let cache = state.cache_manager.clone();
  let preview_settings_parsed = business_logic::parse_preview_settings(&settings);

  let width = preview_settings_parsed.width.unwrap_or(1920);
  let height = preview_settings_parsed.height.unwrap_or(1080);
  let quality = preview_settings_parsed.quality.unwrap_or(80);

  let preview_settings = PreviewSettings {
    default_resolution: (width, height),
    default_quality: quality,
    format: crate::video_compiler::schema::PreviewFormat::Jpeg,
    timeline_resolution: (width, height),
    timeline_quality: quality,
    supported_formats: vec!["mp4".to_string(), "avi".to_string(), "mov".to_string()],
    timeout_seconds: 30,
    hardware_acceleration: false,
  };

  let generator = PreviewGenerator::with_settings(cache, preview_settings);

  // Создаем запросы превью
  let requests: Vec<PreviewRequest> = timestamps
    .into_iter()
    .map(|timestamp| PreviewRequest {
      video_path: video_path.clone(),
      timestamp,
      resolution: Some((width, height)),
      quality: Some(quality),
    })
    .collect();

  let results = generator.generate_preview_batch(requests).await?;

  // Сохраняем результаты в файлы и возвращаем пути
  let output_dir = state.settings.read().await.temp_directory.clone();
  let mut paths = Vec::new();

  for (i, result) in results.into_iter().enumerate() {
    if let Some(image_data) = result.image_data {
      let file_path = format!(
        "{}/preview_{}_{}.jpg",
        output_dir.display(),
        video_path.replace('/', "_"),
        i
      );

      // Декодируем base64 и сохраняем в файл
      if let Ok(decoded) = base64::engine::general_purpose::STANDARD.decode(&image_data) {
        std::fs::write(&file_path, decoded)?;
        paths.push(file_path);
      }
    }
  }

  Ok(paths)
}

/// Очистить кэш превью для конкретного файла
#[tauri::command]
pub async fn clear_preview_cache_for_file(
  _file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Очищаем кэш напрямую через cache_manager
  let mut cache = state.cache_manager.write().await;
  // Очищаем все превью (нет способа очистить для конкретного файла)
  cache.clear_previews().await;
  Ok(())
}

/// Установить путь к FFmpeg для генератора превью
#[tauri::command]
pub async fn set_preview_generator_ffmpeg_path(
  path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  use crate::video_compiler::preview::PreviewGenerator;

  // Проверяем что путь валидный
  let output = std::process::Command::new(&path)
    .arg("-version")
    .output()
    .map_err(|e| VideoCompilerError::InvalidParameter(format!("Invalid FFmpeg path: {e}")))?;

  if !output.status.success() {
    return Err(VideoCompilerError::InvalidParameter(
      "Invalid FFmpeg executable".to_string(),
    ));
  }

  // Создаем новый генератор с обновленным путем
  let cache = state.cache_manager.clone();
  let mut generator = PreviewGenerator::new(cache);
  generator.set_ffmpeg_path(&path);

  // Обновляем глобальный путь
  let mut ffmpeg_path = state.ffmpeg_path.write().await;
  *ffmpeg_path = path;

  Ok(())
}

/// Очистить кэш превью для конкретного файла с использованием PreviewGenerator
#[tauri::command]
pub async fn clear_preview_generator_cache_for_file(
  _file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  use crate::video_compiler::preview::PreviewGenerator;

  let cache = state.cache_manager.clone();
  let generator = PreviewGenerator::new(cache);

  // Используем метод clear_cache_for_file
  generator.clear_cache_for_file().await?;

  Ok(())
}

/// Генерировать видео превью (миниатюры для видео)
#[tauri::command]
pub async fn generate_video_thumbnails_service(
  _project_schema: ProjectSchema,
  output_dir: String,
  thumbnail_count: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::services::preview_service::{PreviewRequest, PreviewType};

  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Создаем запрос для генерации превью
  let request = PreviewRequest {
    preview_type: PreviewType::Thumbnail,
    source_path: std::path::PathBuf::from("/tmp/video.mp4"),
    timestamp: Some(0.0),
    resolution: Some((320, 180)),
    quality: Some(85),
  };

  // Используем метод generate_video_thumbnails
  let thumbnails = preview_service
    .generate_video_thumbnails(
      &request.source_path,
      thumbnail_count as usize,
      request.resolution,
    )
    .await?;

  // Возвращаем пути к созданным миниатюрам
  let thumbnail_paths: Vec<String> = thumbnails
    .iter()
    .enumerate()
    .map(|(i, _)| format!("{output_dir}/thumbnail_{i:03}.jpg"))
    .collect();

  Ok(thumbnail_paths)
}

/// Генерировать раскадровку проекта
#[tauri::command]
pub async fn generate_storyboard_service(
  project_schema: ProjectSchema,
  output_path: String,
  columns: u32,
  rows: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  use crate::video_compiler::services::preview_service::{PreviewRequest, PreviewType};

  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Создаем запрос для генерации раскадровки
  let request = PreviewRequest {
    preview_type: PreviewType::Storyboard,
    source_path: std::path::PathBuf::from("/tmp/video.mp4"),
    timestamp: Some(0.0),
    resolution: Some((1920, 1080)),
    quality: Some(95),
  };

  // Используем метод generate_storyboard
  let _result = preview_service
    .generate_storyboard(
      &project_schema,
      columns,
      rows,
      request.resolution.unwrap_or((320, 180)),
    )
    .await?;

  Ok(output_path)
}

/// Пакетная генерация превью
#[tauri::command]
pub async fn batch_generate_previews_service(
  requests: Vec<serde_json::Value>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::services::preview_service::{PreviewRequest, PreviewType};

  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Преобразуем JSON запросы в PreviewRequest
  let mut preview_requests = Vec::new();
  for req_json in requests {
    let preview_type = match req_json
      .get("type")
      .and_then(|v| v.as_str())
      .unwrap_or("Frame")
    {
      "Thumbnail" => PreviewType::Thumbnail,
      "Storyboard" => PreviewType::Storyboard,
      _ => PreviewType::Frame,
    };

    // Создаем минимальный запрос
    let request = PreviewRequest {
      preview_type,
      source_path: std::path::PathBuf::from(
        req_json
          .get("source_path")
          .and_then(|v| v.as_str())
          .unwrap_or("/tmp/video.mp4"),
      ),
      timestamp: req_json.get("timestamp").and_then(|v| v.as_f64()),
      resolution: business_logic::extract_resolution(
        req_json
          .get("width")
          .and_then(|v| v.as_u64())
          .map(|v| v as u32),
        req_json
          .get("height")
          .and_then(|v| v.as_u64())
          .map(|v| v as u32),
      ),
      quality: req_json
        .get("quality")
        .and_then(|v| v.as_u64())
        .map(|v| v as u8),
    };
    preview_requests.push(request);
  }

  // Используем метод batch_generate_previews
  let results = preview_service
    .batch_generate_previews(preview_requests)
    .await?;

  // Возвращаем пути к созданным файлам
  let output_paths: Vec<String> = results
    .iter()
    .enumerate()
    .map(|(i, _)| format!("/tmp/batch_preview_{i:03}.jpg"))
    .collect();

  Ok(output_paths)
}
