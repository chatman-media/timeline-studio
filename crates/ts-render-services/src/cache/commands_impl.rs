//! Реализация команд кэша — принимают &VideoCompilerState

use super::business_logic;
use super::types::*;
use std::collections::HashMap;
use std::path::PathBuf;
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use crate::VideoCompilerState;

/// Очистить весь кэш рендеринга
pub async fn clear_render_cache(state: &VideoCompilerState) -> Result<()> {
  let cache_service = state.services.get_cache_service().ok_or_else(|| {
    VideoCompilerError::InternalError("CacheService не инициализирован".to_string())
  })?;

  cache_service.clear_render_cache().await.map_err(|e| {
    log::error!("Ошибка очистки кэша рендеринга: {e}");
    VideoCompilerError::CacheError(business_logic::format_cache_error_message(
      "очистить",
      None,
      &e.to_string(),
    ))
  })?;

  log::info!(
    "{}",
    business_logic::format_cache_cleared_message("рендеринга", None)
  );
  Ok(())
}

/// Очистить кэш конкретного проекта
pub async fn clear_project_cache(state: &VideoCompilerState, project_id: &str) -> Result<()> {
  business_logic::validate_project_id(project_id)?;

  let cache_service = state.services.get_cache_service().ok_or_else(|| {
    VideoCompilerError::InternalError("CacheService не инициализирован".to_string())
  })?;

  cache_service
    .clear_project_cache(project_id)
    .await
    .map_err(|e| {
      log::error!("Ошибка очистки кэша проекта {project_id}: {e}");
      VideoCompilerError::CacheError(business_logic::format_cache_error_message(
        "очистить",
        Some(project_id),
        &e.to_string(),
      ))
    })?;

  log::info!(
    "{}",
    business_logic::format_cache_cleared_message("", Some(project_id))
  );
  Ok(())
}

/// Получить размер кэша
pub async fn get_cache_size(state: &VideoCompilerState) -> Result<u64> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  let stats = cache_service.get_cache_stats().await?;
  Ok(business_logic::mb_to_bytes(stats.total_size_mb))
}

/// Получить статистику использования кэша
pub async fn get_cache_stats(state: &VideoCompilerState) -> Result<CacheStats> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.get_cache_stats().await
}

/// Получить расширенную статистику кэша
pub async fn get_cache_stats_detailed(state: &VideoCompilerState) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let stats = business_logic::create_detailed_cache_stats(&cache);
  Ok(serde_json::to_value(stats)?)
}

/// Очистить устаревшие записи кэша
pub async fn clean_old_cache(state: &VideoCompilerState, max_age_days: u32) -> Result<u64> {
  business_logic::validate_max_age_days(max_age_days)?;

  let cache_service = state.services.get_cache_service().ok_or_else(|| {
    VideoCompilerError::InternalError("CacheService не инициализирован".to_string())
  })?;

  let cleaned_files = cache_service
    .optimize_cache(max_age_days)
    .await
    .map_err(|e| {
      log::error!("Ошибка очистки устаревшего кэша: {e}");
      VideoCompilerError::CacheError(format!("Не удалось очистить устаревший кэш: {e}"))
    })?;

  log::info!("Очищено {cleaned_files} файлов старше {max_age_days} дней");
  Ok(cleaned_files as u64)
}

/// Получить список закэшированных проектов
pub async fn get_cached_projects(state: &VideoCompilerState) -> Result<Vec<String>> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_cached_projects())
}

/// Проверить наличие кэша для проекта
pub async fn has_project_cache(state: &VideoCompilerState, project_id: &str) -> Result<bool> {
  let cache = state.cache_manager.read().await;
  Ok(cache.has_project_cache(project_id))
}

/// Получить метаданные закэшированных медиафайлов
pub async fn get_cached_media_metadata(
  state: &VideoCompilerState,
) -> Result<HashMap<String, MediaMetadata>> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_all_cached_metadata())
}

/// Очистить кэш метаданных медиафайлов
pub async fn clear_media_metadata_cache(state: &VideoCompilerState) -> Result<()> {
  let mut render_cache = state.cache_manager.write().await;
  render_cache.clear_all().await;
  Ok(())
}

/// Оптимизировать кэш
pub async fn optimize_cache(state: &VideoCompilerState) -> Result<usize> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.optimize_cache(30).await
}

/// Экспортировать статистику кэша в JSON
pub async fn export_cache_stats(state: &VideoCompilerState) -> Result<serde_json::Value> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  let stats = cache_service.get_cache_stats().await?;
  let exported = business_logic::create_exported_cache_stats(&stats);
  Ok(serde_json::to_value(exported)?)
}

/// Установить максимальный размер кэша
pub async fn set_cache_size_limit(state: &VideoCompilerState, size_mb: u64) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  let (preview, metadata, render) = business_logic::calculate_cache_limits(size_mb);
  cache.set_cache_limits(preview, metadata, render);
  Ok(())
}

/// Получить текущий лимит размера кэша
pub async fn get_cache_size_limit(state: &VideoCompilerState) -> Result<u64> {
  let cache = state.cache_manager.read().await;
  let (preview, metadata, render) = cache.get_cache_limits();
  Ok(business_logic::cache_limits_to_mb(
    preview, metadata, render,
  ))
}

/// Предварительно загрузить медиафайлы в кэш
pub async fn preload_media_to_cache(state: &VideoCompilerState) -> Result<()> {
  let _cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;

  // Упрощенная реализация - метод не реализован
  Ok(())
}

/// Очистить весь кэш
pub async fn clear_all_cache(state: &VideoCompilerState) -> Result<()> {
  if let Some(cache_service) = state.services.get_cache_service() {
    cache_service.clear_all().await?;
  }

  let mut render_cache = state.cache_manager.write().await;
  render_cache.clear_all().await;

  log::info!("All caches cleared successfully");
  Ok(())
}

/// Очистить кэш превью
pub async fn clear_preview_cache(state: &VideoCompilerState) -> Result<()> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.clear_preview_cache().await
}

/// Получить путь к каталогу кэша
pub async fn get_cache_path(state: &VideoCompilerState) -> Result<PathBuf> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.get_cache_path().await
}

/// Получить рекомендации по оптимизации кэша
pub async fn get_cache_optimization_recommendations(
  state: &VideoCompilerState,
) -> Result<Vec<String>> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_optimization_recommendations())
}

/// Предзагрузить превью для видео
pub async fn preload_video_previews(
  state: &VideoCompilerState,
  video_path: String,
  timestamps: Vec<f64>,
  resolution: Option<(u32, u32)>,
  quality: Option<u8>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  let cache_arc = state.cache_manager.clone();

  let resolution = resolution.unwrap_or((320, 180));
  let quality = quality.unwrap_or(75);

  cache
    .preload_video_previews(&video_path, &timestamps, resolution, quality, cache_arc)
    .await?;

  log::info!(
    "Предзагружено {} превью для {}",
    timestamps.len(),
    video_path
  );
  Ok(())
}

/// Оптимизировать кэш на основе статистики
pub async fn optimize_cache_by_stats(state: &VideoCompilerState) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.optimize_cache().await?;

  log::info!("Кэш оптимизирован на основе статистики использования");
  Ok(())
}
