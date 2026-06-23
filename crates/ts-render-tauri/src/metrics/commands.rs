//! Tauri команды для работы с метриками

use super::types::*;
use ts_render_services::VideoCompilerState;
use ts_render::video_compiler::error::Result;
use ts_render_services::services::monitoring::MetricsSummary;
use tauri::State;
use ts_render_services::metrics::commands_impl as impl_;

/// Получить сводку метрик для всех сервисов
#[tauri::command]
pub async fn get_all_metrics_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<MetricsSummary>> {
  impl_::get_all_metrics_original(&_state).await
}

/// Получить метрики конкретного сервиса
#[tauri::command]
pub async fn get_service_metrics_original(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Option<MetricsSummary>> {
  impl_::get_service_metrics_original(service_name, &_state).await
}

/// Экспортировать метрики в формате Prometheus
#[tauri::command]
pub async fn export_metrics_prometheus_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::export_metrics_prometheus_original(&_state).await
}

/// Сбросить метрики для сервиса
#[tauri::command]
pub async fn reset_service_metrics_original(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::reset_service_metrics_original(service_name, &_state).await
}

/// Получить текущее количество активных операций
#[tauri::command]
pub async fn get_active_operations_count_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_active_operations_count_original(&_state).await
}

/// Получить статистику ошибок
#[tauri::command]
pub async fn get_error_statistics_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_error_statistics_original(&_state).await
}

/// Получить топ медленных операций
#[tauri::command]
pub async fn get_slow_operations_original(
  limit: Option<usize>,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<serde_json::Value>> {
  impl_::get_slow_operations_original(limit, &_state).await
}

/// Экспортировать метрики в указанном формате
#[tauri::command]
pub async fn export_metrics(
  format: ExportFormat,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::export_metrics(format, &_state).await
}

/// Получить детальные метрики производительности
#[tauri::command]
pub async fn get_detailed_performance_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<PerformanceMetrics>> {
  impl_::get_detailed_performance_metrics(&_state).await
}

/// Получить агрегированные метрики по времени
#[tauri::command]
pub async fn get_aggregated_metrics(
  interval_minutes: u32,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_aggregated_metrics(interval_minutes, &_state).await
}

/// Получить глобальные метрики системы
#[tauri::command]
pub async fn get_global_metrics(_state: State<'_, VideoCompilerState>) -> Result<GlobalMetrics> {
  impl_::get_global_metrics(&_state).await
}

// ============ Расширенные команды метрик ============

/// Получить расширенные метрики производительности кэша
#[tauri::command]
pub async fn get_cache_performance_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::services::cache_service::CachePerformanceMetrics> {
  impl_::get_cache_performance_metrics(&_state).await
}

/// Установить пороги для алертов кэша
#[tauri::command]
pub async fn set_cache_alert_thresholds(
  thresholds: ts_render_services::services::cache_service::CacheAlertThresholds,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::set_cache_alert_thresholds(thresholds, &_state).await
}

/// Получить активные алерты кэша
#[tauri::command]
pub async fn get_cache_alerts(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<ts_render_services::services::cache_service::CacheAlert>> {
  impl_::get_cache_alerts(&_state).await
}

/// Получить метрики использования GPU
#[tauri::command]
pub async fn get_gpu_utilization_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_gpu_utilization_metrics(&_state).await
}

/// Получить метрики использования памяти для всех сервисов
#[tauri::command]
pub async fn get_memory_usage_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_memory_usage_metrics(&_state).await
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
  impl_::create_custom_alert(alert_name, metric_name, threshold, operator, severity, &_state).await
}

/// Получить историю метрик для анализа трендов
#[tauri::command]
pub async fn get_metrics_history(
  service_name: String,
  metric_name: String,
  hours_back: u32,
  _state: State<'_, VideoCompilerState>,
) -> Result<MetricsHistoryResult> {
  impl_::get_metrics_history(service_name, metric_name, hours_back, &_state).await
}
