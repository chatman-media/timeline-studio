//! Типы для работы с ServiceContainer и метриками

use serde::{Deserialize, Serialize};

/// Информация о проектном сервисе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectServiceInfo {
  pub available: bool,
  pub service_type: String,
  pub status: String,
  pub error: Option<String>,
}

/// Параметры для получения метрик сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetServiceMetricsParams {
  pub service_name: String,
}

/// Метрики сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceMetricsInfo {
  pub service_name: String,
  pub metrics_available: bool,
  pub request_count: u64,
  pub error_count: u64,
  pub average_response_time: f64,
  pub status: String,
}

/// Сводка всех метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllMetricsSummary {
  pub total_services: usize,
  pub active_services: usize,
  pub total_requests: u64,
  pub total_errors: u64,
  pub average_response_time: f64,
  pub summaries: Vec<MetricsSummaryInfo>,
}

/// Информация о сводке метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsSummaryInfo {
  pub service_name: String,
  pub request_count: u64,
  pub error_count: u64,
  pub response_time: f64,
  pub status: String,
}

/// Экспорт метрик в формате Prometheus
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrometheusExport {
  pub format: String,
  pub content: String,
  pub timestamp: String,
  pub metrics_count: usize,
}
