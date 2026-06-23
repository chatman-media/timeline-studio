//! Типы для работы с метриками

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Метрики операции
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationMetrics {
  pub count: u64,
  pub errors: u64,
  pub total_duration_ms: u64,
  pub min_duration_ms: u64,
  pub max_duration_ms: u64,
  pub avg_duration_ms: u64,
  pub last_error: Option<String>,
}

/// Сводка метрик сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceMetrics {
  pub service_name: String,
  pub total_operations: u64,
  pub active_operations: usize,
  pub total_errors: u64,
  pub error_rate: f64,
  pub operation_metrics: HashMap<String, OperationMetrics>,
}

/// Глобальные метрики системы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalMetrics {
  pub total_active_operations: u64,
  pub active_by_service: serde_json::Map<String, serde_json::Value>,
  pub error_statistics: serde_json::Value,
  pub performance_metrics: serde_json::Value,
  pub resource_usage: serde_json::Value,
}

/// Метрики производительности
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
  pub service_name: String,
  pub operation_name: String,
  pub avg_duration_ms: u64,
  pub p95_duration_ms: u64,
  pub p99_duration_ms: u64,
  pub throughput_ops_per_sec: f64,
}

/// Использование ресурсов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceUsage {
  pub memory_mb: f64,
  pub cpu_percent: f64,
  pub disk_io_mb_per_sec: f64,
  pub network_io_mb_per_sec: f64,
  pub gpu_percent: Option<f64>,
  pub gpu_memory_mb: Option<f64>,
}

/// Тип метрики для экспорта
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MetricType {
  Counter,
  Gauge,
  Histogram,
  Summary,
}

/// Формат экспорта метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExportFormat {
  Json,
  Prometheus,
  Csv,
}

/// Результат создания кастомного алерта
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomAlertResult {
  pub alert_id: String,
  pub alert_name: String,
  pub metric_name: String,
  pub threshold: f64,
  pub operator: String,
  pub severity: String,
  pub created_at: String,
}

/// Параметры истории метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsHistoryParams {
  pub service_name: String,
  pub metric_name: String,
  pub hours_back: u32,
}

/// Результат истории метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsHistoryResult {
  pub service: String,
  pub metric: String,
  pub period_hours: u32,
  pub data_points: Vec<serde_json::Value>,
  pub summary: MetricsHistorySummary,
}

/// Сводка истории метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsHistorySummary {
  pub min: f64,
  pub max: f64,
  pub avg: f64,
}
