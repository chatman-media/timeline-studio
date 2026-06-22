//! Типы для модуля service

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Информация о источнике входных данных
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputSourceInfo {
  pub track_id: String,
  pub clip_count: u64,
  pub total_duration: f64,
}

/// Результат получения информации об источниках
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputSourcesResult {
  pub sources: HashMap<String, InputSourceInfo>,
  pub total_sources: usize,
}

/// Статистика рендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderStatistics {
  pub job_id: String,
  pub progress: f64,
  pub status: String,
  pub start_time: String,
  pub frames_processed: u64,
  pub frames_total: u64,
  pub current_fps: f64,
  pub eta_seconds: u64,
}

/// Метрики сервиса рендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderServiceMetrics {
  pub active_jobs: u64,
  pub queued_jobs: u64,
  pub completed_today: u64,
  pub failed_today: u64,
  pub average_render_time_seconds: u64,
  pub cpu_usage_percent: f64,
  pub memory_usage_mb: f64,
}

/// Метрики сервиса кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheServiceMetrics {
  pub hit_rate: f64,
  pub miss_rate: f64,
  pub memory_usage_mb: f64,
  pub entries_count: u64,
  pub evictions_count: u64,
  pub average_entry_size_kb: f64,
}

/// Метрики сервиса превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewServiceMetrics {
  pub active_generations: u64,
  pub cached_previews: u64,
  pub cache_size_mb: f64,
  pub generation_queue_length: u64,
  pub average_generation_time_ms: f64,
}

/// Метрики GPU сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuServiceMetrics {
  pub available: bool,
  pub utilization_percent: f64,
  pub memory_usage_mb: f64,
  pub memory_total_mb: f64,
  pub temperature_celsius: f64,
  pub active_encoders: u64,
}

/// Все метрики сервисов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllServiceMetrics {
  pub render: RenderServiceMetrics,
  pub cache: CacheServiceMetrics,
  pub preview: PreviewServiceMetrics,
  pub gpu: GpuServiceMetrics,
  pub timestamp: String,
}

/// Состояние здоровья сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceHealth {
  pub status: String,
  pub uptime_seconds: u64,
  pub last_error: Option<String>,
}

/// Состояние здоровья всех сервисов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServicesHealthStatus {
  pub render: ServiceHealth,
  pub cache: ServiceHealth,
  pub preview: ServiceHealth,
  pub gpu: ServiceHealth,
  pub ffmpeg: ServiceHealth,
  pub overall_status: String,
  pub timestamp: String,
}

/// Тип сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ServiceType {
  Render,
  Cache,
  Preview,
  Gpu,
  Ffmpeg,
}

impl ServiceType {
  pub fn from_string(s: &str) -> Option<Self> {
    match s {
      "render" => Some(Self::Render),
      "cache" => Some(Self::Cache),
      "preview" => Some(Self::Preview),
      "gpu" => Some(Self::Gpu),
      "ffmpeg" => Some(Self::Ffmpeg),
      _ => None,
    }
  }

  pub fn to_string(&self) -> &'static str {
    match self {
      Self::Render => "render",
      Self::Cache => "cache",
      Self::Preview => "preview",
      Self::Gpu => "gpu",
      Self::Ffmpeg => "ffmpeg",
    }
  }
}

/// Результат очистки завершенных задач
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupResult {
  pub removed_count: u32,
  pub remaining_count: u32,
}

/// Параметры очистки задач
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupParams {
  pub older_than_hours: Option<u32>,
  pub force_all: bool,
}

/// Специфичные метрики сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpecificServiceMetrics {
  pub service: String,
  pub metrics: serde_json::Value,
  pub timestamp: String,
}
