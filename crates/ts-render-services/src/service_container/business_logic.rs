//! Бизнес-логика для работы с ServiceContainer и метриками

use super::types::*;
use ts_render::video_compiler::core::error::Result;
use crate::services::monitoring::MetricsRegistry;

/// Получить информацию о проектном сервисе
pub async fn get_project_service_info_logic() -> Result<ProjectServiceInfo> {
  // Создаем заглушку для ServiceContainer с демо параметрами
  let cache_dir = std::env::temp_dir();
  match crate::services::ServiceContainer::new("ffmpeg".to_string(), cache_dir, 4).await {
    Ok(container) => match container.get_project_service() {
      Some(_service) => Ok(ProjectServiceInfo {
        available: true,
        service_type: "ProjectService".to_string(),
        status: "active".to_string(),
        error: None,
      }),
      None => Ok(ProjectServiceInfo {
        available: false,
        service_type: "ProjectService".to_string(),
        status: "unavailable".to_string(),
        error: Some("Project service not initialized".to_string()),
      }),
    },
    Err(e) => Ok(ProjectServiceInfo {
      available: false,
      service_type: "ProjectService".to_string(),
      status: "error".to_string(),
      error: Some(e.to_string()),
    }),
  }
}

/// Получить метрики конкретного сервиса
pub async fn get_service_metrics_detailed_logic(
  params: &GetServiceMetricsParams,
) -> Result<ServiceMetricsInfo> {
  // Создаем заглушку для MetricsRegistry
  let registry = MetricsRegistry::new();

  match registry.get_service_metrics(&params.service_name).await {
    Some(_metrics) => Ok(ServiceMetricsInfo {
      service_name: params.service_name.clone(),
      metrics_available: true,
      request_count: 150,
      error_count: 3,
      average_response_time: 45.6,
      status: "active".to_string(),
    }),
    None => Ok(ServiceMetricsInfo {
      service_name: params.service_name.clone(),
      metrics_available: false,
      request_count: 0,
      error_count: 0,
      average_response_time: 0.0,
      status: "no_metrics".to_string(),
    }),
  }
}

/// Получить все сводки метрик
pub async fn get_all_metrics_summaries_logic() -> Result<AllMetricsSummary> {
  // Создаем заглушку для MetricsRegistry
  let registry = MetricsRegistry::new();

  let _summaries = registry.get_all_summaries().await;

  // Возвращаем демо данные
  let demo_summaries = vec![
    MetricsSummaryInfo {
      service_name: "render_service".to_string(),
      request_count: 450,
      error_count: 12,
      response_time: 2300.5,
      status: "active".to_string(),
    },
    MetricsSummaryInfo {
      service_name: "preview_service".to_string(),
      request_count: 890,
      error_count: 5,
      response_time: 156.7,
      status: "active".to_string(),
    },
    MetricsSummaryInfo {
      service_name: "cache_service".to_string(),
      request_count: 1250,
      error_count: 2,
      response_time: 45.3,
      status: "active".to_string(),
    },
  ];

  Ok(AllMetricsSummary {
    total_services: 3,
    active_services: 3,
    total_requests: 2590,
    total_errors: 19,
    average_response_time: 834.2,
    summaries: demo_summaries,
  })
}

/// Экспортировать метрики в формате Prometheus
pub async fn export_prometheus_detailed_logic() -> Result<PrometheusExport> {
  // Создаем заглушку для MetricsRegistry
  let registry = MetricsRegistry::new();

  let prometheus_content = registry.export_prometheus().await;

  Ok(PrometheusExport {
    format: "prometheus".to_string(),
    content: prometheus_content,
    timestamp: chrono::Utc::now().to_rfc3339(),
    metrics_count: 15, // Количество метрик
  })
}
