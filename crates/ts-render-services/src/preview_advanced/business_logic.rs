//! Бизнес-логика для расширенных команд превью

use super::types::*;
use base64::Engine;
use std::path::PathBuf;
use ts_render::video_compiler::core::error::Result;
use ts_render::video_compiler::core::preview::{PreviewGenerator, PreviewRequest};

/// Создать генератор превью с кастомным путем к FFmpeg
pub fn create_preview_generator_with_ffmpeg_logic(ffmpeg_path: String) -> Result<String> {
  // Создаем новый генератор с указанным путем к FFmpeg
  let _generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // Генерируем уникальный ID для генератора
  let generator_id = format!("preview_gen_{}", uuid::Uuid::new_v4());

  Ok(generator_id)
}

/// Генерировать превью для пакета видео
pub async fn generate_preview_batch_advanced_logic(
  params: &BatchPreviewParams,
  ffmpeg_path: &str,
) -> Result<Vec<PreviewResult>> {
  if params.video_paths.len() != params.timestamps.len() {
    return Err(
      ts_render::video_compiler::core::error::VideoCompilerError::validation(
        "Video paths and timestamps must have the same length".to_string(),
      ),
    );
  }

  // Создаем генератор
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path.to_string());

  // Подготавливаем список запросов
  let requests: Vec<PreviewRequest> = params
    .video_paths
    .clone()
    .into_iter()
    .zip(params.timestamps.clone().into_iter())
    .map(|(video_path, timestamp)| PreviewRequest {
      video_path,
      timestamp,
      resolution: Some((params.width, params.height)),
      quality: Some(params.quality),
    })
    .collect();

  // Генерируем превью пакетом
  let results = generator.generate_preview_batch(requests).await?;

  // Конвертируем результаты в нужный формат
  Ok(
    results
      .into_iter()
      .map(|r| {
        // Декодируем base64 обратно в байты если есть данные
        let preview_data = if let Some(base64_data) = r.image_data {
          base64::engine::general_purpose::STANDARD
            .decode(&base64_data)
            .unwrap_or_default()
        } else {
          Vec::new()
        };

        PreviewResult {
          success: r.error.is_none(),
          width: params.width,
          height: params.height,
          timestamp: r.timestamp,
          preview_data,
          path: None,
          error: r.error,
        }
      })
      .collect(),
  )
}

/// Генерировать отдельный кадр из видео
pub async fn generate_single_frame_preview_logic(
  video_path: String,
  timestamp: f64,
  width: Option<u32>,
  height: Option<u32>,
  ffmpeg_path: &str,
) -> Result<Vec<u8>> {
  // Создаем генератор
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path.to_string());

  // Генерируем кадр используя generate_preview
  let video_path = PathBuf::from(video_path);
  let resolution = match (width, height) {
    (Some(w), Some(h)) => Some((w, h)),
    _ => Some((1920, 1080)),
  };

  let result = generator
    .generate_preview(&video_path, timestamp, resolution, Some(90))
    .await?;

  Ok(result)
}

/// Получить информацию о генераторе превью
pub fn get_preview_generator_info_logic(ffmpeg_path: &str) -> PreviewGeneratorInfo {
  PreviewGeneratorInfo {
    ffmpeg_path: ffmpeg_path.to_string(),
    supported_formats: vec![
      "mp4".to_string(),
      "mov".to_string(),
      "avi".to_string(),
      "mkv".to_string(),
      "webm".to_string(),
    ],
    max_concurrent_jobs: 4,
    cache_enabled: true,
  }
}

/// Генерировать превью с расширенными опциями
pub async fn generate_preview_with_options_logic(
  video_path: String,
  timestamp: f64,
  options: &AdvancedPreviewOptions,
  ffmpeg_path: &str,
) -> Result<PreviewResult> {
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path.to_string());

  // В реальной реализации здесь бы применялись дополнительные фильтры и watermark
  let video_path = PathBuf::from(video_path);

  // Генерируем превью
  let resolution = Some((options.width, options.height));
  let preview_data = generator
    .generate_preview(&video_path, timestamp, resolution, Some(options.quality))
    .await?;

  Ok(PreviewResult {
    success: true,
    width: options.width,
    height: options.height,
    timestamp,
    preview_data,
    path: options.output_dir.clone(),
    error: None,
  })
}
