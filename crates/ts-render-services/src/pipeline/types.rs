//! Типы для работы с конвейером рендеринга

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Информация о конвейере
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineInfo {
  pub stages: Vec<String>,
  pub is_running: bool,
  pub progress: u64,
  pub statistics: serde_json::Value,
}

/// Статус выполнения конвейера
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PipelineStatus {
  Created,
  Running,
  Paused,
  Completed,
  Failed,
  Cancelled,
}

/// Стадия конвейера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineStage {
  pub name: String,
  pub status: StageStatus,
  pub progress: u64,
  pub duration_ms: u64,
  pub error: Option<String>,
}

/// Статус стадии
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum StageStatus {
  Pending,
  Running,
  Completed,
  Failed,
  Skipped,
}

/// Статистика конвейера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineStatistics {
  pub total_duration_ms: u64,
  pub stages_completed: usize,
  pub stages_failed: usize,
  pub stages_skipped: usize,
  pub memory_usage_mb: f64,
  pub cpu_usage_percent: f64,
  pub disk_usage_mb: f64,
}

/// Контекст конвейера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineContext {
  pub project_name: String,
  pub output_path: String,
  pub temp_dir: String,
  pub intermediate_files: Vec<String>,
  pub user_data: HashMap<String, serde_json::Value>,
  pub is_cancelled: bool,
}

/// Конфигурация конвейера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineConfig {
  pub max_concurrent_stages: usize,
  pub memory_limit_mb: Option<u64>,
  pub enable_gpu: bool,
  pub enable_cache: bool,
  pub log_level: String,
  pub timeout_seconds: Option<u64>,
}

/// Результат выполнения конвейера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineResult {
  pub job_id: String,
  pub status: PipelineStatus,
  pub output_file: Option<String>,
  pub duration_ms: u64,
  pub stages: Vec<PipelineStage>,
  pub errors: Vec<String>,
  pub warnings: Vec<String>,
}
