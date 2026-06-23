//! Tauri команды для дополнительных операций

#![allow(clippy::explicit_auto_deref)]

use ts_render_services::VideoCompilerState;
use super::business_logic;
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use tauri::State;

/// Кэшировать метаданные медиафайла
#[tauri::command]
pub async fn cache_media_metadata(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Получаем информацию о файле через FFmpeg
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args([
      "-i",
      &file_path,
      "-f",
      "json",
      "-show_format",
      "-show_streams",
    ])
    .output()
    .map_err(|e| VideoCompilerError::MediaFileError {
      path: file_path.clone(),
      reason: e.to_string(),
    })?;

  let metadata = String::from_utf8_lossy(&output.stdout);
  let metadata_json: serde_json::Value =
    serde_json::from_str(&metadata).unwrap_or_else(|_| serde_json::json!({}));

  // Добавляем в кэш
  let mut cache = state.cache_manager.write().await;
  let metadata = business_logic::create_media_metadata(file_path.clone());
  cache.store_metadata(file_path, metadata).await?;

  Ok(metadata_json)
}

/// Проверить возможности FFmpeg
#[tauri::command]
pub async fn check_ffmpeg_capabilities(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args(["-version"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

  let version = String::from_utf8_lossy(&output.stdout);
  let capabilities = business_logic::parse_ffmpeg_capabilities(&version);

  Ok(serde_json::to_value(capabilities)?)
}

/// Проверить доступность GPU кодировщика
#[tauri::command]
pub async fn check_gpu_encoder_availability(
  encoder: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args(["-encoders"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

  let encoders = String::from_utf8_lossy(&output.stdout);
  Ok(business_logic::check_encoder_in_output(&encoders, &encoder))
}

/// Проверить поддержку аппаратного ускорения (альтернативная версия)
#[tauri::command]
pub async fn check_hardware_acceleration(state: State<'_, VideoCompilerState>) -> Result<bool> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  business_logic::check_hardware_acceleration_available(ffmpeg_path).await
}

/// Очистить кэш (общая функция)
#[tauri::command]
pub async fn cleanup_cache(
  _max_age_days: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  let mut cache = state.cache_manager.write().await;
  cache.cleanup_old_entries().await?;
  let bytes_freed = 0u64;
  Ok(bytes_freed)
}

/// Очистить кэш (упрощенная версия)
#[tauri::command]
pub async fn clear_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  Ok(())
}

/// Очистить кэш превью файлов
#[tauri::command]
pub async fn clear_file_preview_cache(
  _file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Настроить кэш
#[tauri::command]
pub async fn configure_cache(
  config: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut settings = state.settings.write().await;
  let cache_config = business_logic::parse_cache_config(&config);

  if let Some(size_mb) = cache_config.size_mb {
    settings.cache_size_mb = size_mb as usize;
  }

  if let Some(preview_quality) = cache_config.preview_quality {
    settings.preview_quality = preview_quality;
  }

  Ok(())
}

/// Создать новый проект
#[tauri::command]
pub async fn create_new_project(
  name: String,
  resolution: (u32, u32),
  fps: u32,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  Ok(business_logic::create_project_schema(name, resolution, fps))
}

/// Получить использование памяти кэшем
#[tauri::command]
pub async fn get_cache_memory_usage(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let usage = cache.get_memory_usage();
  let cache_usage = business_logic::create_cache_memory_usage(&usage);

  Ok(serde_json::to_value(cache_usage)?)
}

/// Получить кэшированные метаданные
#[tauri::command]
pub async fn get_cached_metadata(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  let mut cache = state.cache_manager.write().await;
  Ok(cache.get_metadata(&file_path).await.map(|m| {
    let metadata = business_logic::convert_metadata_to_json(&m);
    serde_json::to_value(metadata).unwrap()
  }))
}

/// Получить информацию о текущем GPU
#[tauri::command]
pub async fn get_current_gpu_info(
  state: State<'_, VideoCompilerState>,
) -> Result<Option<ts_render::video_compiler::gpu::GpuInfo>> {
  let settings = state.settings.read().await;
  if settings.hardware_acceleration {
    let ffmpeg_path = state.ffmpeg_path.read().await.clone();
    let detector = ts_render::video_compiler::gpu::GpuDetector::new(ffmpeg_path);
    let encoder = detector.get_recommended_encoder().await?;

    Ok(encoder.map(business_logic::create_gpu_info_from_encoder))
  } else {
    Ok(None)
  }
}

/// Получить информацию о GPU (альтернативная версия)
#[tauri::command]
pub async fn get_gpu_info(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<ts_render::video_compiler::gpu::GpuInfo>> {
  crate::gpu::detect_gpus(state).await
}

/// Получить рекомендуемый GPU кодировщик
#[tauri::command]
pub async fn get_recommended_gpu_encoder(
  state: State<'_, VideoCompilerState>,
) -> Result<Option<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let detector = ts_render::video_compiler::gpu::GpuDetector::new(ffmpeg_path);
  let encoder = detector.get_recommended_encoder().await?;
  Ok(encoder.map(|e| format!("{e:?}")))
}

/// Получить информацию о кэше рендеринга
#[tauri::command]
pub async fn get_render_cache_info(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let usage = cache.get_memory_usage();
  let stats = cache.get_stats();

  let cache_info = business_logic::create_render_cache_info(
    usage.render_bytes,
    usage.total_bytes,
    stats.hit_ratio(),
  );

  Ok(serde_json::to_value(cache_info)?)
}

/// Получить информацию о видео
#[tauri::command]
pub async fn get_video_info(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args([
      "-i",
      &file_path,
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
    ])
    .output()
    .map_err(|e| VideoCompilerError::MediaFileError {
      path: file_path.clone(),
      reason: e.to_string(),
    })?;

  let info = String::from_utf8_lossy(&output.stdout);
  let info_json: serde_json::Value = serde_json::from_str(&info)
    .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?;

  Ok(info_json)
}

/// Инициализировать безопасное хранилище
#[tauri::command]
pub async fn init_secure_storage_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<business_logic::SecureStorageInitResult> {
  Ok(business_logic::init_secure_storage_logic())
}

/// Создать новый экземпляр безопасного хранилища
#[tauri::command]
pub async fn create_secure_storage_instance(
  params: business_logic::CreateSecureStorageParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<business_logic::CreateSecureStorageResult> {
  Ok(business_logic::create_secure_storage_logic(&params))
}

/// Получить информацию о текущем безопасном хранилище
#[tauri::command]
pub async fn get_secure_storage_info_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<business_logic::SecureStorageInfo> {
  Ok(business_logic::get_secure_storage_info_logic())
}

/// Проверить состояние безопасного хранилища
#[tauri::command]
pub async fn verify_secure_storage_integrity(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  Ok(business_logic::verify_secure_storage_integrity_logic())
}

/// Экспортировать конфигурацию безопасного хранилища
#[tauri::command]
pub async fn export_secure_storage_config(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  Ok(business_logic::export_secure_storage_config_logic())
}

/// Очистить безопасное хранилище
#[tauri::command]
pub async fn clear_secure_storage(
  confirm: bool,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  Ok(business_logic::clear_secure_storage_logic(confirm))
}

/// Выполнить простую FFmpeg команду
#[tauri::command]
pub async fn execute_ffmpeg_simple_command(
  params: business_logic::FFmpegExecuteParams,
  state: State<'_, VideoCompilerState>,
) -> Result<business_logic::FFmpegExecuteResult> {
  business_logic::execute_ffmpeg_simple_command(params, state).await
}

/// Выполнить FFmpeg команду с отслеживанием прогресса
#[tauri::command]
pub async fn execute_ffmpeg_with_progress_advanced(
  params: business_logic::FFmpegProgressParams,
  state: State<'_, VideoCompilerState>,
) -> Result<business_logic::FFmpegProgressResult> {
  business_logic::execute_ffmpeg_with_progress_advanced(params, state).await
}

/// Получить список доступных кодеков FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_available_codecs(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  business_logic::get_ffmpeg_available_codecs(state).await
}

/// Получить список доступных форматов FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_available_formats(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  business_logic::get_ffmpeg_available_formats(state).await
}

/// Сгенерировать превью субтитров
#[tauri::command]
pub async fn generate_subtitle_preview_advanced(
  params: business_logic::SubtitlePreviewParams,
  state: State<'_, VideoCompilerState>,
) -> Result<business_logic::SubtitlePreviewResult> {
  business_logic::generate_subtitle_preview_advanced(params, state).await
}

/// Получить информацию об исполнении FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_execution_information(
  state: State<'_, VideoCompilerState>,
) -> Result<business_logic::FFmpegExecutionInfo> {
  business_logic::get_ffmpeg_execution_information(state).await
}

/// Сгенерировать превью субтитров FFmpeg
#[tauri::command]
pub async fn generate_subtitle_preview_ffmpeg(
  params: business_logic::SubtitlePreviewAdvancedParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  business_logic::generate_subtitle_preview_ffmpeg(params, state).await
}

/// Выполнить FFmpeg с обработчиком прогресса
#[tauri::command]
pub async fn execute_ffmpeg_with_progress_handler(
  params: business_logic::FFmpegWithProgressParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  business_logic::execute_ffmpeg_with_progress_handler(params, state).await
}
