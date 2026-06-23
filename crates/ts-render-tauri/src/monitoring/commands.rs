//! Tauri команды для мониторинга

use super::types::*;
use std::collections::HashMap;
use tauri::State;
use ts_render::video_compiler::core::error::Result;
use ts_render_services::services::monitoring::MetricsSummary;
use ts_render_services::VideoCompilerState;
use ts_render_services::monitoring::commands_impl as impl_;

/// Получить сводку метрик для конкретного сервиса
#[tauri::command]
pub async fn get_service_metrics_summary(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<MetricsSummary> {
  impl_::get_service_metrics_summary(service_name, &state).await
}

/// Сбросить метрики для конкретного сервиса (детальная версия)
#[tauri::command]
pub async fn reset_service_metrics_detailed(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::reset_service_metrics_detailed(service_name, &state).await
}

/// Получить сводку метрик для всех сервисов
#[tauri::command]
pub async fn get_all_metrics_summaries(
  state: State<'_, VideoCompilerState>,
) -> Result<HashMap<String, MetricsSummary>> {
  impl_::get_all_metrics_summaries(&state).await
}

/// Экспортировать метрики в формате Prometheus (детальная версия)
#[tauri::command]
pub async fn export_metrics_prometheus_detailed(
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::export_metrics_prometheus_detailed(&state).await
}

/// Проверить здоровье всех сервисов
#[tauri::command]
pub async fn check_services_health(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<ServiceHealth>> {
  impl_::check_services_health(&state).await
}

/// Получить детальные метрики производительности
#[tauri::command]
pub async fn get_performance_metrics(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_performance_metrics(&state).await
}

/// Сбросить все метрики
#[tauri::command]
pub async fn reset_all_metrics(state: State<'_, VideoCompilerState>) -> Result<()> {
  impl_::reset_all_metrics(&state).await
}

/// Получить метрики конкретного сервиса из реестра
#[tauri::command]
pub async fn get_registry_service_metrics(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<MetricsSummary>> {
  impl_::get_registry_service_metrics(service_name, &state).await
}

/// Получить список доступных сервисов для мониторинга
#[tauri::command]
pub async fn get_available_monitoring_services() -> Result<Vec<String>> {
  impl_::get_available_monitoring_services().await
}

/// Проверить здоровье сервисов с пользовательскими критериями
#[tauri::command]
pub async fn check_services_health_with_criteria(
  criteria: HealthCriteria,
  state: State<'_, VideoCompilerState>,
) -> Result<HealthCheckResult> {
  impl_::check_services_health_with_criteria(criteria, &state).await
}

/// Экспортировать метрики в формате Prometheus с параметрами
#[tauri::command]
pub async fn export_metrics_prometheus_with_params(
  params: PrometheusExportParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::export_metrics_prometheus_with_params(params, &state).await
}

/// Сбросить метрики с параметрами
#[tauri::command]
pub async fn reset_metrics_with_params(
  params: MetricsResetParams,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::reset_metrics_with_params(params, &state).await
}

// Progress Tracker Commands

/// Получить текущий прогресс рендеринга
#[tauri::command]
pub async fn get_render_progress_tracker(
  state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::monitoring::business_logic::ProgressInfo> {
  impl_::get_render_progress_tracker(&state).await
}

/// Получить статистику отслеживания прогресса
#[tauri::command]
pub async fn get_progress_tracker_statistics(
  state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::monitoring::business_logic::ProgressStatistics> {
  impl_::get_progress_tracker_statistics(&state).await
}

/// Сбросить отслеживание прогресса
#[tauri::command]
pub async fn reset_progress_tracker(state: State<'_, VideoCompilerState>) -> Result<bool> {
  impl_::reset_progress_tracker(&state).await
}

/// Установить обработчик прогресса
#[tauri::command]
pub async fn set_progress_callback_enabled(
  enabled: bool,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::set_progress_callback_enabled(enabled, &state).await
}

/// Получить детальную информацию о текущей операции
#[tauri::command]
pub async fn get_current_operation_details(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_current_operation_details(&state).await
}
