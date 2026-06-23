//! Tauri команды для работы с ServiceContainer и MetricsRegistry

use super::types::*;
use tauri::State;
use ts_render::video_compiler::core::error::Result;
use ts_render_services::VideoCompilerState;

/// Получить информацию о проектном сервисе
#[tauri::command]
pub async fn get_project_service_info_command(
  _state: State<'_, VideoCompilerState>,
) -> Result<ProjectServiceInfo> {
  ts_render_services::service_container::business_logic::get_project_service_info_logic().await
}

/// Получить метрики конкретного сервиса
#[tauri::command]
pub async fn get_service_metrics_detailed(
  params: GetServiceMetricsParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ServiceMetricsInfo> {
  ts_render_services::service_container::business_logic::get_service_metrics_detailed_logic(&params)
    .await
}

/// Получить все сводки метрик
#[tauri::command]
pub async fn get_all_metrics_summaries_command(
  _state: State<'_, VideoCompilerState>,
) -> Result<AllMetricsSummary> {
  ts_render_services::service_container::business_logic::get_all_metrics_summaries_logic().await
}

/// Экспортировать метрики в формате Prometheus
#[tauri::command]
pub async fn export_prometheus_detailed(
  _state: State<'_, VideoCompilerState>,
) -> Result<PrometheusExport> {
  ts_render_services::service_container::business_logic::export_prometheus_detailed_logic().await
}
