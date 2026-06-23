//! Tauri команды для работы с кэшем

use super::types::*;
use ts_render::video_compiler::error::Result;
use ts_render_services::VideoCompilerState;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;
use ts_render_services::cache::commands_impl as impl_;

/// Очистить весь кэш рендеринга
#[tauri::command]
pub async fn clear_render_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  impl_::clear_render_cache(&state).await
}

/// Очистить кэш конкретного проекта
#[tauri::command]
pub async fn clear_project_cache(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::clear_project_cache(&state, &project_id).await
}

/// Получить размер кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_size(state: State<'_, VideoCompilerState>) -> Result<u64> {
  impl_::get_cache_size(&state).await
}

/// Получить статистику использования кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_stats(state: State<'_, VideoCompilerState>) -> Result<CacheStats> {
  impl_::get_cache_stats(&state).await
}

/// Получить расширенную статистику кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_stats_detailed(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_cache_stats_detailed(&state).await
}

/// Очистить устаревшие записи кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn clean_old_cache(
  max_age_days: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  impl_::clean_old_cache(&state, max_age_days).await
}

/// Получить список закэшированных проектов
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cached_projects(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  impl_::get_cached_projects(&state).await
}

/// Проверить наличие кэша для проекта
#[tauri::command]
#[allow(dead_code)]
pub async fn has_project_cache(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  impl_::has_project_cache(&state, &project_id).await
}

/// Получить метаданные закэшированных медиафайлов
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cached_media_metadata(
  state: State<'_, VideoCompilerState>,
) -> Result<HashMap<String, MediaMetadata>> {
  impl_::get_cached_media_metadata(&state).await
}

/// Очистить кэш метаданных медиафайлов
#[tauri::command]
pub async fn clear_media_metadata_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  impl_::clear_media_metadata_cache(&state).await
}

/// Оптимизировать кэш (дефрагментация и удаление неиспользуемых данных)
#[tauri::command]
#[allow(dead_code)]
pub async fn optimize_cache(state: State<'_, VideoCompilerState>) -> Result<usize> {
  impl_::optimize_cache(&state).await
}

/// Экспортировать статистику кэша в JSON
#[tauri::command]
#[allow(dead_code)]
pub async fn export_cache_stats(state: State<'_, VideoCompilerState>) -> Result<serde_json::Value> {
  impl_::export_cache_stats(&state).await
}

/// Установить максимальный размер кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn set_cache_size_limit(
  size_mb: u64,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::set_cache_size_limit(&state, size_mb).await
}

/// Получить текущий лимит размера кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_size_limit(state: State<'_, VideoCompilerState>) -> Result<u64> {
  impl_::get_cache_size_limit(&state).await
}

/// Предварительно загрузить медиафайлы в кэш
#[tauri::command]
#[allow(dead_code)]
pub async fn preload_media_to_cache(
  _file_paths: Vec<String>,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::preload_media_to_cache(&state).await
}

/// Очистить весь кэш
#[tauri::command]
pub async fn clear_all_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  impl_::clear_all_cache(&state).await
}

/// Очистить кэш превью
#[tauri::command]
pub async fn clear_preview_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  impl_::clear_preview_cache(&state).await
}

/// Получить путь к каталогу кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_path(state: State<'_, VideoCompilerState>) -> Result<PathBuf> {
  impl_::get_cache_path(&state).await
}

/// Получить рекомендации по оптимизации кэша
#[tauri::command]
pub async fn get_cache_optimization_recommendations(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::get_cache_optimization_recommendations(&state).await
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
  impl_::preload_video_previews(&state, video_path, timestamps, resolution, quality).await
}

/// Оптимизировать кэш на основе статистики
#[tauri::command]
pub async fn optimize_cache_by_stats(state: State<'_, VideoCompilerState>) -> Result<()> {
  impl_::optimize_cache_by_stats(&state).await
}
