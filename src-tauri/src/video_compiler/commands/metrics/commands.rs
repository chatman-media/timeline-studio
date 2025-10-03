//! Tauri команды для работы с метриками

use super::business_logic;
use super::types::*;
use crate::video_compiler::commands::VideoCompilerState;
use crate::video_compiler::error::Result;
use crate::video_compiler::services::{monitoring::MetricsSummary, METRICS};
use tauri::State;

/// Получить сводку метрик для всех сервисов
#[tauri::command]
pub async fn get_all_metrics_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<MetricsSummary>> {
  log::debug!("Получение метрик всех сервисов");
  let summaries = METRICS.get_all_summaries().await;
  Ok(summaries)
}

/// Получить метрики конкретного сервиса
#[tauri::command]
pub async fn get_service_metrics_original(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Option<MetricsSummary>> {
  log::debug!("Получение метрик сервиса: {}", service_name);

  if let Some(metrics) = METRICS.get_service_metrics(&service_name).await {
    Ok(Some(metrics.get_summary().await))
  } else {
    Ok(None)
  }
}

/// Экспортировать метрики в формате Prometheus
#[tauri::command]
pub async fn export_metrics_prometheus_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  log::debug!("Экспорт метрик в формате Prometheus");
  let prometheus_data = METRICS.export_prometheus().await;
  Ok(prometheus_data)
}

/// Сбросить метрики для сервиса
#[tauri::command]
pub async fn reset_service_metrics_original(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  log::info!("Сброс метрик для сервиса: {}", service_name);

  if let Some(metrics) = METRICS.get_service_metrics(&service_name).await {
    metrics.reset().await;
    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Сервис '{}' не найден",
        service_name
      )),
    )
  }
}

/// Получить текущее количество активных операций
#[tauri::command]
pub async fn get_active_operations_count_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let summaries = METRICS.get_all_summaries().await;
  let (total_active, active_operations) = business_logic::count_active_operations(&summaries);

  Ok(serde_json::json!({
      "total": total_active,
      "by_service": active_operations,
  }))
}

/// Получить статистику ошибок
#[tauri::command]
pub async fn get_error_statistics_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let summaries = METRICS.get_all_summaries().await;
  Ok(business_logic::calculate_error_statistics(&summaries))
}

/// Получить топ медленных операций
#[tauri::command]
pub async fn get_slow_operations_original(
  limit: Option<usize>,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<serde_json::Value>> {
  let limit = limit.unwrap_or(10);
  let summaries = METRICS.get_all_summaries().await;
  Ok(business_logic::find_slow_operations(&summaries, limit))
}

/// Экспортировать метрики в указанном формате
#[tauri::command]
pub async fn export_metrics(
  format: ExportFormat,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  log::debug!("Экспорт метрик в формате {:?}", format);
  let summaries = METRICS.get_all_summaries().await;

  business_logic::prepare_metrics_for_export(&summaries, &format)
    .map_err(crate::video_compiler::error::VideoCompilerError::InvalidParameter)
}

/// Получить детальные метрики производительности
#[tauri::command]
pub async fn get_detailed_performance_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<PerformanceMetrics>> {
  let summaries = METRICS.get_all_summaries().await;
  Ok(business_logic::calculate_performance_metrics(&summaries))
}

/// Получить агрегированные метрики по времени
#[tauri::command]
pub async fn get_aggregated_metrics(
  interval_minutes: u32,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let summaries = METRICS.get_all_summaries().await;
  Ok(business_logic::aggregate_metrics_by_time(
    &summaries,
    interval_minutes,
  ))
}

/// Получить глобальные метрики системы
#[tauri::command]
pub async fn get_global_metrics(_state: State<'_, VideoCompilerState>) -> Result<GlobalMetrics> {
  let summaries = METRICS.get_all_summaries().await;
  let (total_active, active_by_service) = business_logic::count_active_operations(&summaries);
  let error_statistics = business_logic::calculate_error_statistics(&summaries);

  // Метрики производительности
  let perf_metrics = business_logic::calculate_performance_metrics(&summaries);
  let performance_metrics = serde_json::json!({
      "top_operations": perf_metrics.iter().take(5).collect::<Vec<_>>(),
      "total_operations": perf_metrics.len(),
  });

  // Упрощенные метрики использования ресурсов
  let resource_usage = serde_json::json!({
      "memory_mb": 0.0,
      "cpu_percent": 0.0,
      "disk_io_mb_per_sec": 0.0,
      "network_io_mb_per_sec": 0.0,
  });

  Ok(GlobalMetrics {
    total_active_operations: total_active,
    active_by_service,
    error_statistics,
    performance_metrics,
    resource_usage,
  })
}

// ============ Расширенные команды метрик ============

/// Получить расширенные метрики производительности кэша
#[tauri::command]
pub async fn get_cache_performance_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<crate::video_compiler::services::cache_service::CachePerformanceMetrics> {
  log::debug!("Получение расширенных метрик кэша");
  Ok(business_logic::generate_cache_performance_metrics())
}

/// Установить пороги для алертов кэша
#[tauri::command]
pub async fn set_cache_alert_thresholds(
  thresholds: crate::video_compiler::services::cache_service::CacheAlertThresholds,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  log::info!(
    "Установка порогов алертов кэша: hit_rate >= {}, memory <= {} MB",
    thresholds.min_hit_rate,
    thresholds.max_memory_usage_mb
  );

  if !business_logic::validate_alert_thresholds(&thresholds) {
    return Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(
        "Invalid alert thresholds".to_string(),
      ),
    );
  }

  // В реальной реализации сохранили бы в настройках сервиса
  Ok(())
}

/// Получить активные алерты кэша
#[tauri::command]
pub async fn get_cache_alerts(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<crate::video_compiler::services::cache_service::CacheAlert>> {
  log::debug!("Получение активных алертов кэша");
  Ok(business_logic::generate_cache_alerts())
}

/// Получить метрики использования GPU
#[tauri::command]
pub async fn get_gpu_utilization_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  log::debug!("Получение метрик использования GPU");
  Ok(business_logic::generate_gpu_metrics())
}

/// Получить метрики использования памяти для всех сервисов
#[tauri::command]
pub async fn get_memory_usage_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  log::debug!("Получение метрик использования памяти");
  Ok(business_logic::generate_memory_usage_metrics())
}

/// Создать кастомный алерт для метрик
#[tauri::command]
pub async fn create_custom_alert(
  alert_name: String,
  metric_name: String,
  threshold: f64,
  operator: String, // "greater_than", "less_than", "equals"
  severity: String, // "info", "warning", "critical"
  _state: State<'_, VideoCompilerState>,
) -> Result<CustomAlertResult> {
  business_logic::create_custom_alert_logic(
    &alert_name,
    &metric_name,
    threshold,
    &operator,
    &severity,
  )
  .map_err(crate::video_compiler::error::VideoCompilerError::InvalidParameter)
}

/// Получить историю метрик для анализа трендов
#[tauri::command]
pub async fn get_metrics_history(
  service_name: String,
  metric_name: String,
  hours_back: u32,
  _state: State<'_, VideoCompilerState>,
) -> Result<MetricsHistoryResult> {
  log::debug!("Получение истории метрик для {service_name} - {metric_name} за {hours_back} часов");
  Ok(business_logic::generate_metrics_history(
    &service_name,
    &metric_name,
    hours_back,
  ))
}
