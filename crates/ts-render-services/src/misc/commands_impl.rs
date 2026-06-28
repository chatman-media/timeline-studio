//! Реализация команд misc — принимают &VideoCompilerState

#![allow(clippy::explicit_auto_deref)]

use super::business_logic;
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use crate::VideoCompilerState;

/// Кэшировать метаданные медиафайла
pub async fn cache_media_metadata(
  file_path: String,
  state: &VideoCompilerState,
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
pub async fn check_ffmpeg_capabilities(
  state: &VideoCompilerState,
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
pub async fn check_gpu_encoder_availability(
  encoder: String,
  state: &VideoCompilerState,
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
pub async fn check_hardware_acceleration(state: &VideoCompilerState) -> Result<bool> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  business_logic::check_hardware_acceleration_available(ffmpeg_path).await
}

/// Очистить кэш (общая функция)
pub async fn cleanup_cache(
  _max_age_days: u32,
  state: &VideoCompilerState,
) -> Result<u64> {
  let mut cache = state.cache_manager.write().await;
  cache.cleanup_old_entries().await?;
  let bytes_freed = 0u64;
  Ok(bytes_freed)
}

/// Очистить кэш (упрощенная версия)
pub async fn clear_cache(state: &VideoCompilerState) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  Ok(())
}

/// Очистить кэш превью файлов
pub async fn clear_file_preview_cache(
  _file_path: String,
  state: &VideoCompilerState,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Настроить кэш
pub async fn configure_cache(
  config: serde_json::Value,
  state: &VideoCompilerState,
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
pub async fn create_new_project(
  name: String,
  resolution: (u32, u32),
  fps: u32,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  Ok(business_logic::create_project_schema(name, resolution, fps))
}

/// Получить использование памяти кэшем
pub async fn get_cache_memory_usage(
  state: &VideoCompilerState,
) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let usage = cache.get_memory_usage();
  let cache_usage = business_logic::create_cache_memory_usage(&usage);

  Ok(serde_json::to_value(cache_usage)?)
}

/// Получить кэшированные метаданные
pub async fn get_cached_metadata(
  file_path: String,
  state: &VideoCompilerState,
) -> Result<Option<serde_json::Value>> {
  let mut cache = state.cache_manager.write().await;
  Ok(cache.get_metadata(&file_path).await.map(|m| {
    let metadata = business_logic::convert_metadata_to_json(&m);
    serde_json::to_value(metadata).unwrap()
  }))
}

/// Получить информацию о текущем GPU
pub async fn get_current_gpu_info(
  state: &VideoCompilerState,
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

/// Получить рекомендуемый GPU кодировщик
pub async fn get_recommended_gpu_encoder(
  state: &VideoCompilerState,
) -> Result<Option<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let detector = ts_render::video_compiler::gpu::GpuDetector::new(ffmpeg_path);
  let encoder = detector.get_recommended_encoder().await?;
  Ok(encoder.map(|e| format!("{e:?}")))
}

/// Получить информацию о кэше рендеринга
pub async fn get_render_cache_info(
  state: &VideoCompilerState,
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
pub async fn get_video_info(
  file_path: String,
  state: &VideoCompilerState,
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
pub async fn init_secure_storage_advanced(
  _state: &VideoCompilerState,
) -> Result<business_logic::SecureStorageInitResult> {
  Ok(business_logic::init_secure_storage_logic())
}

/// Создать новый экземпляр безопасного хранилища
pub async fn create_secure_storage_instance(
  params: business_logic::CreateSecureStorageParams,
  _state: &VideoCompilerState,
) -> Result<business_logic::CreateSecureStorageResult> {
  Ok(business_logic::create_secure_storage_logic(&params))
}

/// Получить информацию о текущем безопасном хранилище
pub async fn get_secure_storage_info_advanced(
  _state: &VideoCompilerState,
) -> Result<business_logic::SecureStorageInfo> {
  Ok(business_logic::get_secure_storage_info_logic())
}

/// Проверить состояние безопасного хранилища
pub async fn verify_secure_storage_integrity(
  _state: &VideoCompilerState,
) -> Result<serde_json::Value> {
  Ok(business_logic::verify_secure_storage_integrity_logic())
}

/// Экспортировать конфигурацию безопасного хранилища
pub async fn export_secure_storage_config(
  _state: &VideoCompilerState,
) -> Result<serde_json::Value> {
  Ok(business_logic::export_secure_storage_config_logic())
}

/// Очистить безопасное хранилище
pub async fn clear_secure_storage(
  confirm: bool,
  _state: &VideoCompilerState,
) -> Result<serde_json::Value> {
  Ok(business_logic::clear_secure_storage_logic(confirm))
}

/// Выполнить простую FFmpeg команду
pub async fn execute_ffmpeg_simple_command(
  params: business_logic::FFmpegExecuteParams,
  state: &VideoCompilerState,
) -> Result<business_logic::FFmpegExecuteResult> {
  business_logic::execute_ffmpeg_simple_command(params, state).await
}

/// Выполнить FFmpeg команду с отслеживанием прогресса
pub async fn execute_ffmpeg_with_progress_advanced(
  params: business_logic::FFmpegProgressParams,
  state: &VideoCompilerState,
) -> Result<business_logic::FFmpegProgressResult> {
  business_logic::execute_ffmpeg_with_progress_advanced(params, state).await
}

/// Получить список доступных кодеков FFmpeg
pub async fn get_ffmpeg_available_codecs(
  state: &VideoCompilerState,
) -> Result<Vec<String>> {
  business_logic::get_ffmpeg_available_codecs(state).await
}

/// Получить список доступных форматов FFmpeg
pub async fn get_ffmpeg_available_formats(
  state: &VideoCompilerState,
) -> Result<Vec<String>> {
  business_logic::get_ffmpeg_available_formats(state).await
}

/// Сгенерировать превью субтитров
pub async fn generate_subtitle_preview_advanced(
  params: business_logic::SubtitlePreviewParams,
  state: &VideoCompilerState,
) -> Result<business_logic::SubtitlePreviewResult> {
  business_logic::generate_subtitle_preview_advanced(params, state).await
}

/// Получить информацию об исполнении FFmpeg
pub async fn get_ffmpeg_execution_information(
  state: &VideoCompilerState,
) -> Result<business_logic::FFmpegExecutionInfo> {
  business_logic::get_ffmpeg_execution_information(state).await
}

/// Сгенерировать превью субтитров FFmpeg
pub async fn generate_subtitle_preview_ffmpeg(
  params: business_logic::SubtitlePreviewAdvancedParams,
  state: &VideoCompilerState,
) -> Result<String> {
  business_logic::generate_subtitle_preview_ffmpeg(params, state).await
}

/// Выполнить FFmpeg с обработчиком прогресса
pub async fn execute_ffmpeg_with_progress_handler(
  params: business_logic::FFmpegWithProgressParams,
  state: &VideoCompilerState,
) -> Result<String> {
  business_logic::execute_ffmpeg_with_progress_handler(params, state).await
}

/// Протестировать аппаратное ускорение
pub async fn test_hardware_acceleration_available(
  state: &VideoCompilerState,
) -> Result<business_logic::HardwareAccelerationTestResult> {
  business_logic::test_hardware_acceleration_available(state).await
}

/// Выполнить операции с треком
pub async fn perform_track_operations(
  params: business_logic::TrackOperationsParams,
  state: &VideoCompilerState,
) -> Result<business_logic::TrackOperationsResult> {
  business_logic::perform_track_operations(params, state).await
}

/// Получить информацию о клипе
pub async fn get_detailed_clip_info(
  params: business_logic::ClipInfoParams,
  state: &VideoCompilerState,
) -> Result<serde_json::Value> {
  business_logic::get_detailed_clip_info(params, state).await
}

/// Валидировать субтитр (версия из project.rs)
pub async fn validate_subtitle_project(
  subtitle: ts_render::video_compiler::schema::Subtitle,
  state: &VideoCompilerState,
) -> Result<serde_json::Value> {
  business_logic::validate_subtitle_project(subtitle, state).await
}

/// Обновить timestamp проекта
pub async fn touch_project_timestamp(
  project: ts_render::video_compiler::schema::ProjectSchema,
  state: &VideoCompilerState,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  business_logic::touch_project_timestamp(project, state).await
}

/// Получить метаданные из кэша
pub async fn get_cache_metadata(
  params: business_logic::CacheMetadataParams,
  state: &VideoCompilerState,
) -> Result<business_logic::CacheMetadataResult> {
  business_logic::get_cache_metadata(params, state).await
}

/// Получить статистику кэша
pub async fn get_cache_hit_ratio_stats(
  state: &VideoCompilerState,
) -> Result<business_logic::CacheStatsResult> {
  business_logic::get_cache_hit_ratio_stats(state).await
}

/// Очистить кэш (расширенная версия)
pub async fn clear_cache_advanced(
  params: business_logic::CacheClearParams,
  state: &VideoCompilerState,
) -> Result<business_logic::CacheClearResult> {
  business_logic::clear_cache_advanced(params, state).await
}
