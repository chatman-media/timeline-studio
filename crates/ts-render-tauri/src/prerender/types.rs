//! Типы для модуля prerender

use serde::{Deserialize, Serialize};

/// Результат предрендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrerenderResult {
  pub segment_id: String,
  pub output_path: String,
  pub duration: f64,
  pub size_bytes: u64,
  pub compression_ratio: f64,
}

/// Информация о кэше предрендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrerenderCacheInfo {
  pub segments: usize,
  pub total_size: u64,
  pub total_duration: f64,
}

/// Файл кэша предрендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrerenderCacheFile {
  pub path: String,
  pub segment_id: String,
  pub duration: f64,
  pub size_bytes: u64,
  pub created_at: String,
}

/// Параметры для предрендеринга сегмента
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrerenderSegmentParams {
  pub project_schema: ts_render::video_compiler::core::schema::ProjectSchema,
  pub start_time: f64,
  pub end_time: f64,
  pub output_path: String,
}

/// Параметры для построения команды предрендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrerenderCommandParams {
  pub segment_id: String,
  pub input_files: Vec<String>,
  pub output_path: String,
  pub settings: serde_json::Value,
}

/// Статус предрендеринга сегмента
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrerenderStatus {
  pub segment_id: String,
  pub is_active: bool,
  pub completed: bool,
  pub progress: f64,
}

/// Параметры для оптимизации кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheOptimizationParams {
  pub max_size_mb: u64,
  pub preserve_recent: bool,
  pub max_age_hours: Option<u64>,
}

/// Результат оптимизации кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheOptimizationResult {
  pub freed_bytes: u64,
  pub removed_files: usize,
  pub remaining_files: usize,
  pub total_size_after: u64,
}

/// Оптимальные настройки предрендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimalPrerenderSettings {
  pub recommended_codec: String,
  pub recommended_profile: u32,
  pub recommended_bitrate: u32,
  pub recommended_preset: String,
  pub hardware_acceleration_recommended: bool,
  pub estimated_file_size_mb: f64,
  pub reasons: Vec<String>,
}
