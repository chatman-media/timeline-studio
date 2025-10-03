//! Tauri команды для работы с кэшем

use super::business_logic;
use super::types::*;
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::VideoCompilerState;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;

/// Очистить весь кэш рендеринга
#[tauri::command]
pub async fn clear_render_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
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
#[tauri::command]
pub async fn clear_project_cache(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Валидируем project_id
  business_logic::validate_project_id(&project_id)?;

  let cache_service = state.services.get_cache_service().ok_or_else(|| {
    VideoCompilerError::InternalError("CacheService не инициализирован".to_string())
  })?;

  cache_service
    .clear_project_cache(&project_id)
    .await
    .map_err(|e| {
      log::error!("Ошибка очистки кэша проекта {project_id}: {e}");
      VideoCompilerError::CacheError(business_logic::format_cache_error_message(
        "очистить",
        Some(&project_id),
        &e.to_string(),
      ))
    })?;

  log::info!(
    "{}",
    business_logic::format_cache_cleared_message("", Some(&project_id))
  );
  Ok(())
}

/// Получить размер кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_size(state: State<'_, VideoCompilerState>) -> Result<u64> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  let stats = cache_service.get_cache_stats().await?;
  Ok(business_logic::mb_to_bytes(stats.total_size_mb))
}

/// Получить статистику использования кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_stats(state: State<'_, VideoCompilerState>) -> Result<CacheStats> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.get_cache_stats().await
}

/// Получить расширенную статистику кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_stats_detailed(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let stats = business_logic::create_detailed_cache_stats(&cache);
  Ok(serde_json::to_value(stats)?)
}

/// Очистить устаревшие записи кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn clean_old_cache(
  max_age_days: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  // Валидируем параметр
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
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cached_projects(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_cached_projects())
}

/// Проверить наличие кэша для проекта
#[tauri::command]
#[allow(dead_code)]
pub async fn has_project_cache(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let cache = state.cache_manager.read().await;
  Ok(cache.has_project_cache(&project_id))
}

/// Получить метаданные закэшированных медиафайлов
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cached_media_metadata(
  state: State<'_, VideoCompilerState>,
) -> Result<HashMap<String, MediaMetadata>> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_all_cached_metadata())
}

/// Очистить кэш метаданных медиафайлов
#[tauri::command]
pub async fn clear_media_metadata_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut render_cache = state.cache_manager.write().await;
  // Очищаем все кэши (включая метаданные)
  render_cache.clear_all().await;
  Ok(())
}

/// Оптимизировать кэш (дефрагментация и удаление неиспользуемых данных)
#[tauri::command]
#[allow(dead_code)]
pub async fn optimize_cache(state: State<'_, VideoCompilerState>) -> Result<usize> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.optimize_cache(30).await // 30 дней по умолчанию
}

/// Экспортировать статистику кэша в JSON
#[tauri::command]
#[allow(dead_code)]
pub async fn export_cache_stats(state: State<'_, VideoCompilerState>) -> Result<serde_json::Value> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  let stats = cache_service.get_cache_stats().await?;
  let exported = business_logic::create_exported_cache_stats(&stats);
  Ok(serde_json::to_value(exported)?)
}

/// Установить максимальный размер кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn set_cache_size_limit(
  size_mb: u64,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  let (preview, metadata, render) = business_logic::calculate_cache_limits(size_mb);
  cache.set_cache_limits(preview, metadata, render);
  Ok(())
}

/// Получить текущий лимит размера кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_size_limit(state: State<'_, VideoCompilerState>) -> Result<u64> {
  let cache = state.cache_manager.read().await;
  let (preview, metadata, render) = cache.get_cache_limits();
  Ok(business_logic::cache_limits_to_mb(
    preview, metadata, render,
  ))
}

/// Предварительно загрузить медиафайлы в кэш
#[tauri::command]
#[allow(dead_code)]
pub async fn preload_media_to_cache(
  _file_paths: Vec<String>,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let _cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;

  // Упрощенная реализация - метод не реализован
  Ok(())
}

/// Очистить весь кэш
#[tauri::command]
pub async fn clear_all_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  // Очищаем через CacheService
  if let Some(cache_service) = state.services.get_cache_service() {
    cache_service.clear_all().await?;
  }

  // Также очищаем in-memory RenderCache
  let mut render_cache = state.cache_manager.write().await;
  render_cache.clear_all().await;

  log::info!("All caches cleared successfully");
  Ok(())
}

/// Очистить кэш превью
#[tauri::command]
pub async fn clear_preview_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.clear_preview_cache().await
}

/// Получить путь к каталогу кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_path(state: State<'_, VideoCompilerState>) -> Result<PathBuf> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.get_cache_path().await
}

/// Получить рекомендации по оптимизации кэша
#[tauri::command]
pub async fn get_cache_optimization_recommendations(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_optimization_recommendations())
}

/// Предзагрузить превью для видео
#[tauri::command]
pub async fn preload_video_previews(
  video_path: String,
  timestamps: Vec<f64>,
  resolution: Option<(u32, u32)>,
  quality: Option<u8>,
  state: State<'_, VideoCompilerState>,
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
#[tauri::command]
pub async fn optimize_cache_by_stats(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.optimize_cache().await?;

  log::info!("Кэш оптимизирован на основе статистики использования");
  Ok(())
}
