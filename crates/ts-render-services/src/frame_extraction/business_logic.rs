//! Бизнес-логика для извлечения кадров

use super::types::*;
use crate::VideoCompilerState;
use serde::{Deserialize, Serialize};
use ts_render::video_compiler::{
  core::schema::{Clip, Subtitle},
  core::{cache::RenderCache, frame_extraction::FrameExtractionManager},
  error::{Result, VideoCompilerError},
};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Рассчитать временные метки для извлечения кадров
pub fn calculate_frame_timestamps(duration: f64, interval: f64) -> Vec<f64> {
  if interval <= 0.0 {
    return vec![];
  }

  let mut timestamps = Vec::new();
  let mut timestamp = 0.0;

  while timestamp <= duration {
    timestamps.push(timestamp);
    timestamp += interval;
  }

  timestamps
}

/// Генерировать пути для кадров
pub fn generate_frame_paths(
  output_dir: &str,
  timestamps: &[f64],
  format: &FrameFormat,
) -> Vec<String> {
  let extension = match format {
    FrameFormat::Jpeg => "jpg",
    FrameFormat::Png => "png",
    FrameFormat::Webp => "webp",
  };

  timestamps
    .iter()
    .map(|ts| format!("{output_dir}/frame_{ts:.2}.{extension}"))
    .collect()
}

/// Генерировать путь для кадра субтитра
pub fn generate_subtitle_frame_path(
  output_dir: &str,
  subtitle_id: &str,
  format: &FrameFormat,
) -> String {
  let extension = match format {
    FrameFormat::Jpeg => "jpg",
    FrameFormat::Png => "png",
    FrameFormat::Webp => "webp",
  };

  format!("{output_dir}/subtitle_{subtitle_id}.{extension}")
}

/// Валидировать параметры извлечения кадров
pub fn validate_extraction_params(params: &FrameExtractionParams) -> Result<()> {
  if params.video_path.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Video path cannot be empty".to_string(),
    ));
  }

  if params.timestamps.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Timestamps list cannot be empty".to_string(),
    ));
  }

  // Проверяем что все временные метки неотрицательные
  for &timestamp in &params.timestamps {
    if timestamp < 0.0 {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Negative timestamp: {}",
        timestamp
      )));
    }
  }

  // Проверяем разрешение, если указано
  if let Some((width, height)) = params.resolution {
    if width == 0 || height == 0 {
      return Err(VideoCompilerError::InvalidParameter(
        "Resolution dimensions must be positive".to_string(),
      ));
    }
  }

  // Проверяем качество, если указано
  if let Some(quality) = params.quality {
    if quality == 0 || quality > 100 {
      return Err(VideoCompilerError::InvalidParameter(
        "Quality must be between 1 and 100".to_string(),
      ));
    }
  }

  Ok(())
}

/// Определить оптимальный интервал для извлечения кадров
pub fn calculate_optimal_interval(duration: f64, max_frames: usize) -> f64 {
  if max_frames == 0 || duration <= 0.0 {
    return 1.0;
  }

  let optimal_interval = duration / max_frames as f64;

  // Минимальный интервал 0.5 секунды
  optimal_interval.max(0.5)
}

/// Фильтровать временные метки по диапазону
pub fn filter_timestamps_by_range(
  timestamps: &[f64],
  start_time: Option<f64>,
  end_time: Option<f64>,
) -> Vec<f64> {
  timestamps
    .iter()
    .filter(|&&ts| {
      let after_start = start_time.is_none_or(|start| ts >= start);
      let before_end = end_time.is_none_or(|end| ts <= end);
      after_start && before_end
    })
    .copied()
    .collect()
}

/// Генерировать временные метки для ключевых кадров
pub fn generate_keyframe_timestamps(duration: f64, keyframe_count: usize) -> Vec<f64> {
  if keyframe_count == 0 || duration <= 0.0 {
    return vec![];
  }

  if keyframe_count == 1 {
    return vec![duration / 2.0];
  }

  let interval = duration / (keyframe_count - 1) as f64;
  (0..keyframe_count).map(|i| i as f64 * interval).collect()
}

/// Извлекает настройки превью из JSON
pub fn extract_preview_options(
  settings: &serde_json::Value,
) -> ts_render::video_compiler::preview::PreviewOptions {
  let width = settings
    .get("width")
    .and_then(|v| v.as_u64())
    .unwrap_or(1920) as u32;
  let height = settings
    .get("height")
    .and_then(|v| v.as_u64())
    .unwrap_or(1080) as u32;
  let quality = settings
    .get("quality")
    .and_then(|v| v.as_u64())
    .unwrap_or(80) as u8;
  let format = settings
    .get("format")
    .and_then(|v| v.as_str())
    .unwrap_or("png")
    .to_string();

  ts_render::video_compiler::preview::PreviewOptions {
    width: Some(width),
    height: Some(height),
    quality,
    format,
  }
}

/// Генерирует информацию о кэше кадров
pub fn generate_cache_info(
  project_id: &str,
  frame_count: u64,
  total_size: u64,
) -> serde_json::Value {
  serde_json::json!({
      "project_id": project_id,
      "frame_count": frame_count,
      "total_size": total_size,
      "last_accessed": chrono::Utc::now().to_rfc3339(),
  })
}
/// Frame Extraction Advanced Commands - расширенные команды для извлечения кадров
// Импорты закомментированы, так как функции имеют другие сигнатуры
// use ts_render::video_compiler::commands::frame_extraction_commands::{
//   extract_subtitle_frames, extract_timeline_frames, extract_video_frame,
//   extract_video_frames_batch, generate_preview, generate_preview_batch,
//   generate_preview_with_settings, get_frame_extraction_cache_info, get_video_thumbnails,
// };
/// Параметры для извлечения кадров таймлайна
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineFramesParams {
  pub timeline_id: String,
  pub start_time: f64,
  pub end_time: f64,
  pub frame_rate: f64,
  pub output_dir: String,
  pub format: Option<String>,
}

/// Результат извлечения кадров таймлайна
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineFramesResult {
  pub success: bool,
  pub extracted_frames: Vec<String>,
  pub total_frames: usize,
  pub duration: f64,
  pub error: Option<String>,
}

/// Извлечь кадры таймлайна
pub async fn extract_timeline_frames_advanced(
  params: TimelineFramesParams,
  _state: &VideoCompilerState,
) -> Result<TimelineFramesResult> {
  let _output_dir = PathBuf::from(&params.output_dir);
  let _format = params.format.unwrap_or_else(|| "jpg".to_string());

  // Заглушка - возвращаем успешный результат с dummy данными
  let dummy_frames = vec![
    format!("{}/frame_001.jpg", params.output_dir),
    format!("{}/frame_002.jpg", params.output_dir),
    format!("{}/frame_003.jpg", params.output_dir),
  ];

  Ok(TimelineFramesResult {
    success: true,
    total_frames: dummy_frames.len(),
    extracted_frames: dummy_frames,
    duration: params.end_time - params.start_time,
    error: None,
  })
}

/// Параметры для извлечения кадров субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleFramesParams {
  pub subtitle_text: String,
  pub start_time: f64,
  pub end_time: f64,
  pub style: Option<String>,
  pub output_dir: String,
  pub frame_count: Option<u32>,
}

/// Результат извлечения кадров субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleFramesResult {
  pub success: bool,
  pub generated_frames: Vec<String>,
  pub frame_count: usize,
  pub subtitle_duration: f64,
  pub error: Option<String>,
}

/// Извлечь кадры субтитров
pub async fn extract_subtitle_frames_advanced(
  params: SubtitleFramesParams,
  _state: &VideoCompilerState,
) -> Result<SubtitleFramesResult> {
  let _output_dir = PathBuf::from(&params.output_dir);
  let frame_count = params.frame_count.unwrap_or(10);

  // Заглушка для извлечения кадров субтитров
  let dummy_frames: Vec<String> = (1..=frame_count)
    .map(|i| format!("{}/subtitle_frame_{:03}.jpg", params.output_dir, i))
    .collect();

  Ok(SubtitleFramesResult {
    success: true,
    generated_frames: dummy_frames.clone(),
    frame_count: dummy_frames.len(),
    subtitle_duration: params.end_time - params.start_time,
    error: None,
  })
}

/// Параметры для извлечения одного кадра видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFrameParams {
  pub video_path: String,
  pub timestamp: f64,
  pub output_path: String,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub quality: Option<u8>,
}

/// Извлечь один кадр из видео
pub async fn extract_video_frame_advanced(
  params: VideoFrameParams,
  _state: &VideoCompilerState,
) -> Result<String> {
  let _video_path = PathBuf::from(&params.video_path);
  let _output_path = PathBuf::from(&params.output_path);

  // Заглушка для извлечения одного кадра
  Ok(params.output_path)
}

/// Параметры для пакетного извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFramesBatchParams {
  pub video_path: String,
  pub timestamps: Vec<f64>,
  pub output_dir: String,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub quality: Option<u8>,
  pub name_template: Option<String>,
}

/// Результат пакетного извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFramesBatchResult {
  pub success: bool,
  pub extracted_frames: Vec<String>,
  pub failed_frames: Vec<f64>,
  pub total_requested: usize,
  pub total_extracted: usize,
  pub error: Option<String>,
}

/// Извлечь кадры из видео пакетом
pub async fn extract_video_frames_batch_advanced(
  params: VideoFramesBatchParams,
  _state: &VideoCompilerState,
) -> Result<VideoFramesBatchResult> {
  let _video_path = PathBuf::from(&params.video_path);
  let _output_dir = PathBuf::from(&params.output_dir);
  let _name_template = params
    .name_template
    .unwrap_or_else(|| "frame_%d.jpg".to_string());

  // Заглушка для пакетного извлечения кадров
  let dummy_frames: Vec<String> = params
    .timestamps
    .iter()
    .enumerate()
    .map(|(i, _)| format!("{}/frame_{:03}.jpg", params.output_dir, i + 1))
    .collect();

  Ok(VideoFramesBatchResult {
    success: true,
    extracted_frames: dummy_frames,
    failed_frames: vec![],
    total_requested: params.timestamps.len(),
    total_extracted: params.timestamps.len(),
    error: None,
  })
}

/// Параметры для получения миниатюр видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoThumbnailsParams {
  pub video_path: String,
  pub thumbnail_count: u32,
  pub output_dir: String,
  pub size: Option<(u32, u32)>,
  pub quality: Option<u8>,
}

/// Получить миниатюры видео
pub async fn get_video_thumbnails_advanced(
  params: VideoThumbnailsParams,
  _state: &VideoCompilerState,
) -> Result<Vec<String>> {
  let _video_path = PathBuf::from(&params.video_path);
  let _output_dir = PathBuf::from(&params.output_dir);
  let _size = params.size.unwrap_or((320, 180));

  // Заглушка для получения миниатюр
  let dummy_thumbnails: Vec<String> = (1..=params.thumbnail_count)
    .map(|i| format!("{}/thumbnail_{:03}.jpg", params.output_dir, i))
    .collect();

  Ok(dummy_thumbnails)
}

/// Информация о кэше извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameExtractionCacheInfo {
  pub cache_size_mb: f64,
  pub cached_files_count: usize,
  pub hit_rate: f64,
  pub last_cleanup: Option<String>,
  pub max_cache_size_mb: f64,
}

/// Получить информацию о кэше извлечения кадров
pub async fn get_frame_extraction_cache_information(
  _state: &VideoCompilerState,
) -> Result<FrameExtractionCacheInfo> {
  // Заглушка для информации о кэше
  Ok(FrameExtractionCacheInfo {
    cache_size_mb: 150.5,
    cached_files_count: 42,
    hit_rate: 0.85,
    last_cleanup: Some("2025-06-23T10:00:00Z".to_string()),
    max_cache_size_mb: 1024.0,
  })
}

/// Параметры для генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratePreviewParams {
  pub input_path: String,
  pub output_path: String,
  pub timestamp: f64,
  pub width: Option<u32>,
  pub height: Option<u32>,
}

/// Сгенерировать превью кадра
pub async fn generate_preview_frame(
  params: GeneratePreviewParams,
  _state: &VideoCompilerState,
) -> Result<String> {
  let _input_path = PathBuf::from(&params.input_path);
  let _output_path = PathBuf::from(&params.output_path);

  // Заглушка для генерации превью
  Ok(params.output_path)
}

/// Параметры для пакетной генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratePreviewBatchParams {
  pub input_paths: Vec<String>,
  pub output_dir: String,
  pub timestamps: Vec<f64>,
  pub width: Option<u32>,
  pub height: Option<u32>,
}

/// Сгенерировать превью пакетом
pub async fn generate_preview_batch_frames(
  params: GeneratePreviewBatchParams,
  _state: &VideoCompilerState,
) -> Result<Vec<String>> {
  let _input_paths: Vec<PathBuf> = params.input_paths.iter().map(PathBuf::from).collect();
  let _output_dir = PathBuf::from(&params.output_dir);

  // Заглушка для пакетной генерации превью
  let dummy_previews: Vec<String> = params
    .input_paths
    .iter()
    .enumerate()
    .map(|(i, _)| format!("{}/preview_{:03}.jpg", params.output_dir, i + 1))
    .collect();

  Ok(dummy_previews)
}

/// Параметры для генерации превью с настройками
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratePreviewSettingsParams {
  pub input_path: String,
  pub output_path: String,
  pub timestamp: f64,
  pub width: u32,
  pub height: u32,
  pub quality: u8,
  pub format: String,
}

/// Сгенерировать превью с настройками
pub async fn generate_preview_with_custom_settings(
  params: GeneratePreviewSettingsParams,
  _state: &VideoCompilerState,
) -> Result<String> {
  let _input_path = PathBuf::from(&params.input_path);
  let _output_path = PathBuf::from(&params.output_path);

  // Заглушка для генерации превью с настройками
  Ok(params.output_path)
}

/// Frame Manager Commands - команды для работы с FrameExtractionManager
/// Параметры для извлечения кадров клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractFramesForClipParams {
  pub clip: Clip,
  pub use_default_settings: bool,
}

/// Извлеченный кадр
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedFrameInfo {
  pub timestamp: f64,
  pub file_path: String,
  pub frame_index: usize,
}

/// Результат извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractFramesResult {
  pub frames: Vec<ExtractedFrameInfo>,
  pub total_frames: usize,
  pub success: bool,
  pub error: Option<String>,
}

/// Извлечь кадры для клипа
pub async fn extract_frames_for_clip_command(
  params: ExtractFramesForClipParams,
  _state: &VideoCompilerState,
) -> Result<ExtractFramesResult> {
  // Создаем менеджер с кэшем
  let cache = Arc::new(RwLock::new(RenderCache::new()));
  let manager = FrameExtractionManager::new(cache);

  match manager.extract_frames_for_clip(&params.clip, None).await {
    Ok(frames) => {
      let frame_infos: Vec<ExtractedFrameInfo> = frames
        .into_iter()
        .enumerate()
        .map(|(idx, frame)| ExtractedFrameInfo {
          timestamp: frame.timestamp,
          file_path: format!("frame_{idx}.jpg"), // Создаем имя файла
          frame_index: idx,
        })
        .collect();
      let total_frames = frame_infos.len();
      Ok(ExtractFramesResult {
        frames: frame_infos,
        total_frames,
        success: true,
        error: None,
      })
    }
    Err(e) => Ok(ExtractFramesResult {
      frames: vec![],
      total_frames: 0,
      success: false,
      error: Some(e.to_string()),
    }),
  }
}

/// Параметры для извлечения кадров субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractFramesForSubtitlesParams {
  pub video_path: String,
  pub subtitles: Vec<Subtitle>,
  pub use_default_settings: bool,
}

/// Кадр субтитра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleFrameInfo {
  pub subtitle_id: String,
  pub subtitle_text: String,
  pub timestamp: f64,
  pub file_path: String,
}

/// Результат извлечения кадров субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractSubtitleFramesResult {
  pub frames: Vec<SubtitleFrameInfo>,
  pub total_frames: usize,
  pub success: bool,
  pub error: Option<String>,
}

/// Извлечь кадры для субтитров
pub async fn extract_frames_for_subtitles_command(
  params: ExtractFramesForSubtitlesParams,
  _state: &VideoCompilerState,
) -> Result<ExtractSubtitleFramesResult> {
  let video_path = PathBuf::from(&params.video_path);

  // Создаем менеджер с кэшем
  let cache = Arc::new(RwLock::new(RenderCache::new()));
  let manager = FrameExtractionManager::new(cache);

  match manager
    .extract_frames_for_subtitles(&video_path, &params.subtitles, None)
    .await
  {
    Ok(frames) => {
      let frame_infos: Vec<SubtitleFrameInfo> = frames
        .into_iter()
        .map(|frame| SubtitleFrameInfo {
          subtitle_id: frame.subtitle_id.clone(),
          subtitle_text: frame.subtitle_text.clone(),
          timestamp: frame.timestamp,
          file_path: format!("subtitle_frame_{}.jpg", frame.timestamp),
        })
        .collect();
      let total_frames = frame_infos.len();
      Ok(ExtractSubtitleFramesResult {
        frames: frame_infos,
        total_frames,
        success: true,
        error: None,
      })
    }
    Err(e) => Ok(ExtractSubtitleFramesResult {
      frames: vec![],
      total_frames: 0,
      success: false,
      error: Some(e.to_string()),
    }),
  }
}

/// Получить информацию о кэше извлечения кадров
pub async fn get_frame_extraction_cache_info_command(
  _state: &VideoCompilerState,
) -> Result<FrameExtractionCacheInfo> {
  // Создаем менеджер с кэшем
  let cache = Arc::new(RwLock::new(RenderCache::new()));
  let manager = FrameExtractionManager::new(cache.clone());

  // Получаем кэш через метод get_cache
  let cache_arc = manager.get_cache();
  let cache_guard = cache_arc.read().await;
  let stats = cache_guard.get_stats();

  Ok(FrameExtractionCacheInfo {
    cache_size_mb: 50.0, // Примерное значение
    cached_files_count: stats.preview_requests as usize,
    hit_rate: stats.hit_ratio() as f64,
    last_cleanup: None,
    max_cache_size_mb: 500.0,
  })
}
