//! Бизнес-логика для работы с кэшем

use super::types::*;
use ts_render::video_compiler::cache::RenderCache;
use ts_render::video_compiler::error::{Result, VideoCompilerError};

/// Валидировать ID проекта
pub fn validate_project_id(project_id: &str) -> Result<()> {
  if project_id.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "ID проекта не может быть пустым".to_string(),
    ));
  }
  Ok(())
}

/// Валидировать максимальный возраст для очистки
pub fn validate_max_age_days(max_age_days: u32) -> Result<()> {
  if max_age_days == 0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Максимальный возраст должен быть больше 0 дней".to_string(),
    ));
  }
  Ok(())
}

/// Рассчитать лимиты кэша на основе размера в MB
pub fn calculate_cache_limits(size_mb: u64) -> (usize, usize, usize) {
  // Конвертируем MB в количество элементов (примерно 1MB = 10 элементов)
  let items_per_mb = 10;
  let total_items = (size_mb * items_per_mb) as usize;

  // Распределяем между тремя типами кэша поровну
  let per_cache_type = total_items / 3;
  (per_cache_type, per_cache_type, per_cache_type)
}

/// Конвертировать лимиты кэша обратно в MB
pub fn cache_limits_to_mb(preview: usize, metadata: usize, render: usize) -> u64 {
  // Конвертируем обратно в MB (примерно 10 элементов = 1MB)
  let total_items = preview + metadata + render;
  (total_items / 10) as u64
}

/// Создать детальную статистику кэша
pub fn create_detailed_cache_stats(cache: &RenderCache) -> DetailedCacheStats {
  let stats = cache.get_stats();
  let memory_usage = cache.get_memory_usage();

  DetailedCacheStats {
    preview_hit_ratio: stats.preview_hit_ratio() as f64,
    memory_usage_mb: memory_usage.total_mb() as f64,
    preview_hits: stats.preview_hits,
    preview_misses: stats.preview_misses,
    render_hits: stats.render_hits,
    render_misses: stats.render_misses,
    total_bytes: memory_usage.total_bytes as u64,
    preview_bytes: memory_usage.preview_bytes as u64,
    render_bytes: memory_usage.render_bytes as u64,
    metadata_bytes: memory_usage.metadata_bytes as u64,
  }
}

/// Создать экспортированную статистику кэша
pub fn create_exported_cache_stats(stats: &CacheStats) -> ExportedCacheStats {
  ExportedCacheStats {
    total_size_mb: stats.total_size_mb,
    preview_cache_size_mb: stats.preview_cache_size_mb,
    render_cache_size_mb: stats.render_cache_size_mb,
    temp_files_size_mb: stats.temp_files_size_mb,
    total_files: stats.total_files,
  }
}

/// Конвертировать размер из MB в байты
pub fn mb_to_bytes(mb: f64) -> u64 {
  (mb * 1024.0 * 1024.0) as u64
}

/// Форматировать сообщение об успешной очистке кэша
pub fn format_cache_cleared_message(cache_type: &str, project_id: Option<&str>) -> String {
  match project_id {
    Some(id) => format!("Кэш {} проекта {} успешно очищен", cache_type, id),
    None => format!("Кэш {} успешно очищен", cache_type),
  }
}

/// Форматировать сообщение об ошибке очистки кэша
pub fn format_cache_error_message(
  operation: &str,
  project_id: Option<&str>,
  error: &str,
) -> String {
  match project_id {
    Some(id) => format!("Не удалось {} кэш проекта {}: {}", operation, id, error),
    None => format!("Не удалось {} кэш: {}", operation, error),
  }
}
