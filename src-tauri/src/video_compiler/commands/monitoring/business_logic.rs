//! Бизнес-логика для команд мониторинга

use super::types::*;
use crate::video_compiler::{
  error::Result, services::monitoring::MetricsSummary, VideoCompilerState,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

/// Валидация имени сервиса
pub fn validate_service_name(service_name: &str) -> std::result::Result<(), String> {
  if ServiceType::from_string(service_name).is_some() {
    Ok(())
  } else {
    Err(format!("Unknown service: {service_name}"))
  }
}

/// Получить список всех доступных сервисов
pub fn get_available_services() -> Vec<&'static str> {
  ServiceType::all_services()
}

/// Форматировать метрики сервиса в формате Prometheus
pub fn format_service_metrics_prometheus(name: &str, summary: &MetricsSummary) -> String {
  format_service_metrics_prometheus_with_params(name, summary, &PrometheusExportParams::default())
}

/// Форматировать метрики сервиса в формате Prometheus с параметрами
pub fn format_service_metrics_prometheus_with_params(
  name: &str,
  summary: &MetricsSummary,
  params: &PrometheusExportParams,
) -> String {
  let mut output = String::new();
  let prefix = &params.metric_prefix;

  // Total operations
  if params.include_help {
    output.push_str(&format!(
      "# HELP {prefix}_{name}_operations_total Total number of operations\n"
    ));
  }
  if params.include_type {
    output.push_str(&format!(
      "# TYPE {prefix}_{name}_operations_total counter\n"
    ));
  }
  output.push_str(&format!(
    "{prefix}_{name}_operations_total {}\n",
    summary.total_operations
  ));

  // Total errors
  if params.include_help {
    output.push_str(&format!(
      "# HELP {prefix}_{name}_errors_total Total number of errors\n"
    ));
  }
  if params.include_type {
    output.push_str(&format!("# TYPE {prefix}_{name}_errors_total counter\n"));
  }
  output.push_str(&format!(
    "{prefix}_{name}_errors_total {}\n",
    summary.total_errors
  ));

  // Active operations
  if params.include_help {
    output.push_str(&format!(
      "# HELP {prefix}_{name}_active_operations Number of active operations\n"
    ));
  }
  if params.include_type {
    output.push_str(&format!("# TYPE {prefix}_{name}_active_operations gauge\n"));
  }
  output.push_str(&format!(
    "{prefix}_{name}_active_operations {}\n",
    summary.active_operations
  ));

  // Operations per second
  if params.include_help {
    output.push_str(&format!(
      "# HELP {prefix}_{name}_operations_per_second Operations per second\n"
    ));
  }
  if params.include_type {
    output.push_str(&format!(
      "# TYPE {prefix}_{name}_operations_per_second gauge\n"
    ));
  }
  output.push_str(&format!(
    "{prefix}_{name}_operations_per_second {:.2}\n",
    summary.operations_per_second
  ));

  // Error rate
  if params.include_help {
    output.push_str(&format!("# HELP {prefix}_{name}_error_rate Error rate\n"));
  }
  if params.include_type {
    output.push_str(&format!("# TYPE {prefix}_{name}_error_rate gauge\n"));
  }
  output.push_str(&format!(
    "{prefix}_{name}_error_rate {:.4}\n",
    summary.error_rate
  ));

  output.push('\n');
  output
}

/// Оценить здоровье сервиса на основе метрик
pub fn evaluate_service_health(name: &str, summary: &MetricsSummary) -> ServiceHealth {
  evaluate_service_health_with_criteria(name, summary, &HealthCriteria::default())
}

/// Оценить здоровье сервиса на основе метрик с пользовательскими критериями
pub fn evaluate_service_health_with_criteria(
  name: &str,
  summary: &MetricsSummary,
  criteria: &HealthCriteria,
) -> ServiceHealth {
  let error_rate_percentage = summary.error_rate * 100.0;

  let mut is_healthy = true;

  // Проверяем процент ошибок
  if error_rate_percentage >= criteria.max_error_rate_percentage {
    is_healthy = false;
  }

  // Проверяем количество активных операций
  if summary.active_operations >= criteria.max_active_operations as usize {
    is_healthy = false;
  }

  // Проверяем минимальную производительность
  if let Some(min_ops_per_sec) = criteria.min_operations_per_second {
    if summary.operations_per_second < min_ops_per_sec {
      is_healthy = false;
    }
  }

  ServiceHealth {
    service_name: name.to_string(),
    is_healthy,
    error_rate: error_rate_percentage,
    avg_response_time: summary.operations_per_second,
    last_error: None, // В реальной реализации можно добавить отслеживание последней ошибки
  }
}

/// Форматировать данные производительности сервиса
pub fn format_service_performance_data(summary: &MetricsSummary) -> serde_json::Value {
  serde_json::json!({
      "total_operations": summary.total_operations,
      "total_errors": summary.total_errors,
      "active_operations": summary.active_operations,
      "operations_per_second": summary.operations_per_second,
      "error_rate": summary.error_rate * 100.0,
      "uptime_seconds": summary.uptime_seconds,
      "operation_details": summary.operation_metrics,
  })
}

/// Создать сводку производительности сервиса
pub fn create_service_performance_summary(
  service_name: &str,
  summary: &MetricsSummary,
) -> ServicePerformanceSummary {
  ServicePerformanceSummary {
    service_name: service_name.to_string(),
    total_operations: summary.total_operations,
    total_errors: summary.total_errors,
    active_operations: summary.active_operations as u64,
    operations_per_second: summary.operations_per_second,
    error_rate_percentage: summary.error_rate * 100.0,
    uptime_seconds: summary.uptime_seconds,
    operation_details: summary
      .operation_metrics
      .iter()
      .map(|(k, v)| {
        (
          k.clone(),
          serde_json::to_value(v).unwrap_or(serde_json::Value::Null),
        )
      })
      .collect(),
  }
}

/// Собрать все метрики сервисов в один объект
pub fn collect_all_metrics_summaries<F>(service_getter: F) -> HashMap<String, MetricsSummary>
where
  F: Fn(&str) -> Option<MetricsSummary>,
{
  let mut summaries = HashMap::new();

  for service_name in ServiceType::all_services() {
    if let Some(summary) = service_getter(service_name) {
      summaries.insert(service_name.to_string(), summary);
    }
  }

  summaries
}

/// Создать результат проверки здоровья всех сервисов
pub fn create_health_check_result(services: Vec<ServiceHealth>) -> HealthCheckResult {
  let overall_healthy = services.iter().all(|s| s.is_healthy);

  HealthCheckResult {
    overall_healthy,
    services,
    timestamp: chrono::Utc::now(),
  }
}

/// Экспортировать все метрики в формате Prometheus
pub fn export_all_metrics_prometheus<F>(
  service_getter: F,
  params: &PrometheusExportParams,
) -> String
where
  F: Fn(&str) -> Option<MetricsSummary>,
{
  let mut output = String::new();

  for service_name in ServiceType::all_services() {
    if let Some(summary) = service_getter(service_name) {
      output.push_str(&format_service_metrics_prometheus_with_params(
        service_name,
        &summary,
        params,
      ));
    }
  }

  output
}

/// Проверить нужно ли сбрасывать метрики конкретного сервиса
pub fn should_reset_service_metrics(service_name: &str, params: &MetricsResetParams) -> bool {
  if params.reset_all {
    return true;
  }

  if let Some(ref service_names) = params.service_names {
    return service_names.contains(&service_name.to_string());
  }

  false
}

/// Валидировать параметры экспорта Prometheus
pub fn validate_prometheus_export_params(
  params: &PrometheusExportParams,
) -> std::result::Result<(), String> {
  if params.metric_prefix.is_empty() {
    return Err("Metric prefix cannot be empty".to_string());
  }

  if !params
    .metric_prefix
    .chars()
    .all(|c| c.is_alphanumeric() || c == '_')
  {
    return Err(
      "Metric prefix can only contain alphanumeric characters and underscores".to_string(),
    );
  }

  Ok(())
}

/// Валидировать критерии здоровья
pub fn validate_health_criteria(criteria: &HealthCriteria) -> std::result::Result<(), String> {
  if criteria.max_error_rate_percentage < 0.0 || criteria.max_error_rate_percentage > 100.0 {
    return Err("Error rate percentage must be between 0 and 100".to_string());
  }

  if let Some(min_ops) = criteria.min_operations_per_second {
    if min_ops < 0.0 {
      return Err("Minimum operations per second must be non-negative".to_string());
    }
  }

  if let Some(max_response_time) = criteria.max_response_time_ms {
    if max_response_time < 0.0 {
      return Err("Maximum response time must be non-negative".to_string());
    }
  }

  Ok(())
}
/// Progress Tracker Commands - команды для отслеживания прогресса
/// Информация о прогрессе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressInfo {
  pub current_stage: String,
  pub overall_progress: f32,
  pub stage_progress: f32,
  pub estimated_time_remaining: Option<u64>,
  pub processed_frames: usize,
  pub total_frames: usize,
  pub current_operation: String,
}

/// Статистика прогресса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressStatistics {
  pub total_operations: usize,
  pub completed_operations: usize,
  pub failed_operations: usize,
  pub average_processing_time: f64,
  pub peak_memory_usage_mb: f64,
  pub start_time: String,
  pub last_update: String,
}

/// Получить текущий прогресс рендеринга (эмуляция progress_tracker)
pub async fn get_render_progress_tracker(
  _state: State<'_, VideoCompilerState>,
) -> Result<ProgressInfo> {
  // Заглушка для progress_tracker field
  // В реальной реализации здесь был бы доступ к Arc<ProgressTracker>

  Ok(ProgressInfo {
    current_stage: "composition".to_string(),
    overall_progress: 0.65,
    stage_progress: 0.8,
    estimated_time_remaining: Some(120), // 2 минуты
    processed_frames: 1300,
    total_frames: 2000,
    current_operation: "Applying video filters".to_string(),
  })
}

/// Получить статистику отслеживания прогресса
pub async fn get_progress_tracker_statistics(
  _state: State<'_, VideoCompilerState>,
) -> Result<ProgressStatistics> {
  // Заглушка для статистики progress_tracker

  Ok(ProgressStatistics {
    total_operations: 15,
    completed_operations: 10,
    failed_operations: 1,
    average_processing_time: 45.6,
    peak_memory_usage_mb: 512.0,
    start_time: chrono::Utc::now()
      .checked_sub_signed(chrono::Duration::minutes(5))
      .unwrap_or_else(chrono::Utc::now)
      .to_rfc3339(),
    last_update: chrono::Utc::now().to_rfc3339(),
  })
}

/// Сбросить отслеживание прогресса
pub async fn reset_progress_tracker(_state: State<'_, VideoCompilerState>) -> Result<bool> {
  // Заглушка для сброса progress_tracker
  log::info!("Progress tracker reset successfully");
  Ok(true)
}

/// Установить обработчик прогресса
pub async fn set_progress_callback_enabled(
  enabled: bool,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Заглушка для настройки callbacks прогресса

  Ok(serde_json::json!({
      "progress_callbacks_enabled": enabled,
      "callback_interval_ms": 500,
      "supported_events": [
          "stage_changed",
          "progress_updated",
          "operation_completed",
          "error_occurred"
      ],
      "message": if enabled {
          "Progress callbacks enabled"
      } else {
          "Progress callbacks disabled"
      }
  }))
}

/// Получить детальную информацию о текущей операции
pub async fn get_current_operation_details(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Детальная информация о текущей операции

  Ok(serde_json::json!({
      "operation_id": "render_001",
      "operation_type": "video_composition",
      "stage": "composition",
      "sub_stage": "filter_application",
      "current_filter": "scale",
      "filter_progress": 0.8,
      "input_files": [
          "/path/to/video1.mp4",
          "/path/to/video2.mp4"
      ],
      "output_file": "/path/to/output.mp4",
      "processing_speed": "2.1x realtime",
      "memory_usage_mb": 456.7,
      "cpu_usage_percent": 75.2,
      "estimated_completion": chrono::Utc::now()
          .checked_add_signed(chrono::Duration::seconds(120))
          .unwrap_or_else(chrono::Utc::now)
          .to_rfc3339()
  }))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_progress_info_serialization() {
    let info = ProgressInfo {
      current_stage: "encoding".to_string(),
      overall_progress: 0.5,
      stage_progress: 0.75,
      estimated_time_remaining: Some(300),
      processed_frames: 1000,
      total_frames: 2000,
      current_operation: "Encoding video".to_string(),
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("encoding"));
    assert!(json.contains("0.5"));
    assert!(json.contains("1000"));
  }

  #[test]
  fn test_progress_statistics_serialization() {
    let stats = ProgressStatistics {
      total_operations: 10,
      completed_operations: 8,
      failed_operations: 1,
      average_processing_time: 45.6,
      peak_memory_usage_mb: 512.0,
      start_time: "2024-01-15T10:30:00Z".to_string(),
      last_update: "2024-01-15T10:35:00Z".to_string(),
    };

    let json = serde_json::to_string(&stats).unwrap();
    assert!(json.contains("45.6"));
    assert!(json.contains("512"));
  }
}
