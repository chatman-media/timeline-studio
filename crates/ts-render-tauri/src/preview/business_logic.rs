//! Бизнес-логика для команд генерации превью

use super::types::*;
use ts_render::video_compiler::{
  core::preview::PreviewOptions,
  error::{Result, VideoCompilerError},
  schema::ProjectSchema,
};

/// Создать временные метки для миниатюр
pub fn generate_thumbnail_timestamps(count: u32, interval: f64) -> Vec<f64> {
  (0..count).map(|i| (i as f64) * interval).collect()
}

/// Создать пути файлов для миниатюр
pub fn generate_thumbnail_paths(output_dir: &str, count: u32) -> Vec<String> {
  (0..count)
    .map(|i| format!("{output_dir}/thumbnail_{i}.jpg"))
    .collect()
}

/// Создать временные метки для раскадровки
pub fn generate_storyboard_timestamps(duration: f64, frames_per_row: u32, rows: u32) -> Vec<f64> {
  let frame_count = frames_per_row * rows;
  (0..frame_count)
    .map(|i| (i as f64 / frame_count as f64) * duration)
    .collect()
}

/// Создать пути файлов для раскадровки
pub fn generate_storyboard_frame_paths(output_path: &str, frame_count: u32) -> Vec<String> {
  (0..frame_count)
    .map(|i| format!("{output_path}/frame_{i:03}.jpg"))
    .collect()
}

/// Создать базовые опции превью
pub fn create_preview_options(
  width: Option<u32>,
  height: Option<u32>,
  format: &str,
  quality: u8,
) -> PreviewOptions {
  PreviewOptions {
    width,
    height,
    format: format.to_string(),
    quality,
  }
}

/// Создать стандартные опции превью для кадра
pub fn create_frame_preview_options() -> PreviewOptions {
  PreviewOptions {
    width: None,
    height: None,
    format: "jpeg".to_string(),
    quality: 85,
  }
}

/// Создать опции превью для проекта
pub fn create_project_preview_options(width: u32, height: u32) -> PreviewOptions {
  PreviewOptions {
    width: Some(width),
    height: Some(height),
    format: "mp4".to_string(),
    quality: 85,
  }
}

/// Создать опции превью для эффекта
pub fn create_effect_preview_options() -> PreviewOptions {
  PreviewOptions {
    width: Some(320),
    height: Some(240),
    format: "jpeg".to_string(),
    quality: 85,
  }
}

/// Создать опции превью для перехода
pub fn create_transition_preview_options() -> PreviewOptions {
  PreviewOptions {
    width: Some(320),
    height: Some(240),
    format: "jpeg".to_string(),
    quality: 85,
  }
}

/// Валидировать параметры анимированного превью
pub fn validate_animated_preview_params(params: &AnimatedPreviewParams) -> Result<()> {
  if params.video_path.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Путь к видео не может быть пустым".to_string(),
    ));
  }

  if params.output_path.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Путь вывода не может быть пустым".to_string(),
    ));
  }

  if params.duration <= 0.0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Длительность должна быть больше 0".to_string(),
    ));
  }

  if params.width == 0 || params.height == 0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Размеры должны быть больше 0".to_string(),
    ));
  }

  if params.fps == 0 {
    return Err(VideoCompilerError::InvalidParameter(
      "FPS должен быть больше 0".to_string(),
    ));
  }

  Ok(())
}

/// Построить команду FFmpeg для анимированного GIF
pub fn build_ffmpeg_gif_command(params: &AnimatedPreviewParams) -> Vec<String> {
  vec![
    "-y".to_string(),
    "-i".to_string(),
    params.video_path.clone(),
    "-ss".to_string(),
    params.start_time.to_string(),
    "-t".to_string(),
    params.duration.to_string(),
    "-vf".to_string(),
    format!(
      "fps={},scale={}:{}",
      params.fps, params.width, params.height
    ),
    "-loop".to_string(),
    "0".to_string(),
    params.output_path.clone(),
  ]
}

/// Парсить настройки превью из JSON
pub fn parse_preview_settings(settings: &serde_json::Value) -> PreviewSettings {
  PreviewSettings {
    width: settings
      .get("width")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32),
    height: settings
      .get("height")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32),
    quality: settings
      .get("quality")
      .and_then(|v| v.as_u64())
      .map(|v| v as u8),
    cache_enabled: settings.get("cache_enabled").and_then(|v| v.as_bool()),
  }
}

/// Парсить тип превью из строки
pub fn parse_preview_type(type_str: &str) -> String {
  match type_str {
    "Thumbnail" => "Thumbnail".to_string(),
    "Storyboard" => "Storyboard".to_string(),
    _ => "Frame".to_string(),
  }
}

/// Создать запрос превью из JSON
pub fn create_preview_request_from_json(json: &serde_json::Value) -> CommandPreviewRequest {
  let preview_type = json.get("type").and_then(|v| v.as_str()).unwrap_or("Frame");

  CommandPreviewRequest {
    preview_type: parse_preview_type(preview_type),
    source_path: json
      .get("source_path")
      .and_then(|v| v.as_str())
      .unwrap_or("/tmp/video.mp4")
      .to_string(),
    timestamp: json.get("timestamp").and_then(|v| v.as_f64()),
    width: json.get("width").and_then(|v| v.as_u64()).map(|v| v as u32),
    height: json
      .get("height")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32),
    quality: json
      .get("quality")
      .and_then(|v| v.as_u64())
      .map(|v| v as u8),
  }
}

/// Получить разрешение из опций
pub fn extract_resolution(width: Option<u32>, height: Option<u32>) -> Option<(u32, u32)> {
  if let (Some(w), Some(h)) = (width, height) {
    Some((w, h))
  } else {
    None
  }
}

/// Создать пути для пакетной генерации превью
pub fn create_batch_preview_paths(output_dir: &str, video_path: &str, count: usize) -> Vec<String> {
  let safe_video_name = video_path.replace('/', "_");
  (0..count)
    .map(|i| format!("{output_dir}/preview_{safe_video_name}_{i}.jpg"))
    .collect()
}

/// Валидировать цвет для waveform
pub fn validate_waveform_color(color: &str) -> Result<()> {
  if color.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Цвет не может быть пустым".to_string(),
    ));
  }

  // Проверяем базовые форматы цветов
  if color.starts_with('#') {
    if color.len() != 7 {
      return Err(VideoCompilerError::InvalidParameter(
        "Hex цвет должен быть в формате #RRGGBB".to_string(),
      ));
    }

    // Проверяем, что все символы после # являются валидными hex символами
    for c in color.chars().skip(1) {
      if !c.is_ascii_hexdigit() {
        return Err(VideoCompilerError::InvalidParameter(
          "Невалидный hex цвет".to_string(),
        ));
      }
    }
  }

  Ok(())
}

/// Создать временный проект для превью эффектов
pub fn create_effect_preview_project(effect_id: &str) -> ProjectSchema {
  let mut project = ProjectSchema::new(format!("effect_preview_{effect_id}"));
  project.timeline.duration = 5.0;
  project.timeline.fps = 30;
  project.timeline.resolution = (320, 240);
  project
}

/// Создать временный проект для превью переходов
pub fn create_transition_preview_project(transition_type: &str) -> ProjectSchema {
  let mut project = ProjectSchema::new(format!("transition_preview_{transition_type}"));
  project.timeline.duration = 2.0;
  project.timeline.fps = 30;
  project.timeline.resolution = (320, 240);
  project
}

/// Создать информацию о кэшированном превью
pub fn create_cached_preview_info(preview_id: String, data_size: usize) -> CachedPreviewInfo {
  CachedPreviewInfo {
    id: preview_id,
    data_size,
    created_at: chrono::Utc::now(),
  }
}
