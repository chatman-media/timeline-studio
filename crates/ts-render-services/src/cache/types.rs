//! Типы для работы с кэшем

use serde::{Deserialize, Serialize};

/// Детальная статистика кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailedCacheStats {
  pub preview_hit_ratio: f64,
  pub memory_usage_mb: f64,
  pub preview_hits: u64,
  pub preview_misses: u64,
  pub render_hits: u64,
  pub render_misses: u64,
  pub total_bytes: u64,
  pub preview_bytes: u64,
  pub render_bytes: u64,
  pub metadata_bytes: u64,
}

/// Экспортированная статистика кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportedCacheStats {
  pub total_size_mb: f64,
  pub preview_cache_size_mb: f64,
  pub render_cache_size_mb: f64,
  pub temp_files_size_mb: f64,
  pub total_files: usize,
}

// Re-export типов из других модулей для удобства
pub use ts_render::video_compiler::core::cache::MediaMetadata;
pub use crate::services::cache_service::CacheStats;
