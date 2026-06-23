//! Реализация команд preview_advanced — принимают &VideoCompilerState

use super::business_logic;
use super::types::*;
use ts_render::video_compiler::core::error::Result;
use crate::VideoCompilerState;

/// Создать генератор превью с кастомным путем к FFmpeg
pub async fn create_preview_generator_with_ffmpeg(
  state: &VideoCompilerState,
  ffmpeg_path: String,
) -> Result<String> {
  let generator_id =
    business_logic::create_preview_generator_with_ffmpeg_logic(ffmpeg_path.clone())?;

  // Обновляем путь к FFmpeg в состоянии
  {
    let mut ffmpeg_path_state = state.ffmpeg_path.write().await;
    *ffmpeg_path_state = ffmpeg_path;
  }

  Ok(generator_id)
}

/// Установить путь к FFmpeg для существующего генератора (расширенная версия)
pub async fn set_preview_generator_ffmpeg_path_advanced(
  state: &VideoCompilerState,
  new_path: String,
) -> Result<()> {
  {
    let mut ffmpeg_path_state = state.ffmpeg_path.write().await;
    *ffmpeg_path_state = new_path.clone();
  }
  log::info!("FFmpeg path updated to: {new_path}");
  Ok(())
}

/// Генерировать превью для пакета видео
pub async fn generate_preview_batch_advanced(
  state: &VideoCompilerState,
  params: BatchPreviewParams,
) -> Result<Vec<PreviewResult>> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  business_logic::generate_preview_batch_advanced_logic(&params, &ffmpeg_path).await
}

/// Генерировать отдельный кадр из видео
pub async fn generate_single_frame_preview(
  state: &VideoCompilerState,
  video_path: String,
  timestamp: f64,
  width: Option<u32>,
  height: Option<u32>,
) -> Result<Vec<u8>> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  business_logic::generate_single_frame_preview_logic(
    video_path,
    timestamp,
    width,
    height,
    &ffmpeg_path,
  )
  .await
}

/// Получить информацию о генераторе превью
pub async fn get_preview_generator_info(
  state: &VideoCompilerState,
) -> Result<PreviewGeneratorInfo> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  Ok(business_logic::get_preview_generator_info_logic(&ffmpeg_path))
}

/// Генерировать превью с расширенными опциями
pub async fn generate_preview_with_options(
  state: &VideoCompilerState,
  video_path: String,
  timestamp: f64,
  options: AdvancedPreviewOptions,
) -> Result<PreviewResult> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  business_logic::generate_preview_with_options_logic(video_path, timestamp, &options, &ffmpeg_path)
    .await
}
