//! Tauri команды для работы с ServiceContainer и MetricsRegistry

use super::{business_logic, types::*};
use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use tauri::State;

/// Получить информацию о проектном сервисе
#[tauri::command]
pub async fn get_project_service_info_command(
  _state: State<'_, VideoCompilerState>,
) -> Result<ProjectServiceInfo> {
  business_logic::get_project_service_info_logic().await
}

/// Получить метрики конкретного сервиса
#[tauri::command]
pub async fn get_service_metrics_detailed(
  params: GetServiceMetricsParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ServiceMetricsInfo> {
  business_logic::get_service_metrics_detailed_logic(&params).await
}

/// Получить все сводки метрик
#[tauri::command]
pub async fn get_all_metrics_summaries_command(
  _state: State<'_, VideoCompilerState>,
) -> Result<AllMetricsSummary> {
  business_logic::get_all_metrics_summaries_logic().await
}

/// Экспортировать метрики в формате Prometheus
#[tauri::command]
pub async fn export_prometheus_detailed(
  _state: State<'_, VideoCompilerState>,
) -> Result<PrometheusExport> {
  business_logic::export_prometheus_detailed_logic().await
}
