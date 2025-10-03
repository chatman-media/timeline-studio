//! Tauri команды для расширенных функций превью

use super::{business_logic, types::*};
use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use tauri::State;

/// Создать генератор превью с кастомным путем к FFmpeg
#[tauri::command]
pub async fn create_preview_generator_with_ffmpeg(
  ffmpeg_path: String,
  state: State<'_, VideoCompilerState>,
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
#[tauri::command]
pub async fn set_preview_generator_ffmpeg_path_advanced(
  new_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Обновляем путь к FFmpeg в состоянии
  {
    let mut ffmpeg_path_state = state.ffmpeg_path.write().await;
    *ffmpeg_path_state = new_path.clone();
  }

  // В реальной реализации здесь бы обновлялся путь в конкретном генераторе
  log::info!("FFmpeg path updated to: {new_path}");

  Ok(())
}

/// Генерировать превью для пакета видео
#[tauri::command]
pub async fn generate_preview_batch_advanced(
  params: BatchPreviewParams,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<PreviewResult>> {
  // Получаем путь к FFmpeg
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();

  business_logic::generate_preview_batch_advanced_logic(&params, &ffmpeg_path).await
}

/// Генерировать отдельный кадр из видео
#[tauri::command]
pub async fn generate_single_frame_preview(
  video_path: String,
  timestamp: f64,
  _output_path: Option<String>,
  width: Option<u32>,
  height: Option<u32>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<u8>> {
  // Получаем путь к FFmpeg
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
#[tauri::command]
pub async fn get_preview_generator_info(
  state: State<'_, VideoCompilerState>,
) -> Result<PreviewGeneratorInfo> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();

  Ok(business_logic::get_preview_generator_info_logic(
    &ffmpeg_path,
  ))
}

/// Генерировать превью с расширенными опциями
#[tauri::command]
pub async fn generate_preview_with_options(
  video_path: String,
  timestamp: f64,
  options: AdvancedPreviewOptions,
  state: State<'_, VideoCompilerState>,
) -> Result<PreviewResult> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();

  business_logic::generate_preview_with_options_logic(video_path, timestamp, &options, &ffmpeg_path)
    .await
}
