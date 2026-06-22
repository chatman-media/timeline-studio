//! Типы для команд мониторинга

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Информация о здоровье сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceHealth {
  pub service_name: String,
  pub is_healthy: bool,
  pub error_rate: f64,
  pub avg_response_time: f64,
  pub last_error: Option<String>,
}

/// Типы доступных сервисов для мониторинга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ServiceType {
  Render,
  Cache,
  Gpu,
  Preview,
  Project,
  Ffmpeg,
}

impl ServiceType {
  pub fn from_string(service_name: &str) -> Option<Self> {
    match service_name {
      "render" => Some(Self::Render),
      "cache" => Some(Self::Cache),
      "gpu" => Some(Self::Gpu),
      "preview" => Some(Self::Preview),
      "project" => Some(Self::Project),
      "ffmpeg" => Some(Self::Ffmpeg),
      _ => None,
    }
  }

  pub fn to_string(&self) -> &'static str {
    match self {
      Self::Render => "render",
      Self::Cache => "cache",
      Self::Gpu => "gpu",
      Self::Preview => "preview",
      Self::Project => "project",
      Self::Ffmpeg => "ffmpeg",
    }
  }

  pub fn all_services() -> Vec<&'static str> {
    vec!["render", "cache", "gpu", "preview", "project", "ffmpeg"]
  }
}

/// Параметры для экспорта метрик в формате Prometheus
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrometheusExportParams {
  pub include_help: bool,
  pub include_type: bool,
  pub metric_prefix: String,
}

impl Default for PrometheusExportParams {
  fn default() -> Self {
    Self {
      include_help: true,
      include_type: true,
      metric_prefix: "timeline_studio".to_string(),
    }
  }
}

/// Результат проверки здоровья всех сервисов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
  pub overall_healthy: bool,
  pub services: Vec<ServiceHealth>,
  pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Сводка производительности сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServicePerformanceSummary {
  pub service_name: String,
  pub total_operations: u64,
  pub total_errors: u64,
  pub active_operations: u64,
  pub operations_per_second: f64,
  pub error_rate_percentage: f64,
  pub uptime_seconds: u64,
  pub operation_details: HashMap<String, serde_json::Value>,
}

/// Параметры для сброса метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsResetParams {
  pub service_names: Option<Vec<String>>,
  pub reset_all: bool,
  pub preserve_history: bool,
}

impl Default for MetricsResetParams {
  fn default() -> Self {
    Self {
      service_names: None,
      reset_all: false,
      preserve_history: true,
    }
  }
}

/// Критерии оценки здоровья сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCriteria {
  pub max_error_rate_percentage: f64,
  pub max_active_operations: u64,
  pub min_operations_per_second: Option<f64>,
  pub max_response_time_ms: Option<f64>,
}

impl Default for HealthCriteria {
  fn default() -> Self {
    Self {
      max_error_rate_percentage: 5.0,
      max_active_operations: 100,
      min_operations_per_second: None,
      max_response_time_ms: None,
    }
  }
}
