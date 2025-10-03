//! Tauri команды для мониторинга

use super::{business_logic, types::*};
use crate::video_compiler::{
  error::Result, services::monitoring::MetricsSummary, VideoCompilerState,
};
use std::collections::HashMap;
use tauri::State;

/// Получить сводку метрик для конкретного сервиса
#[tauri::command]
pub async fn get_service_metrics_summary(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<MetricsSummary> {
  business_logic::validate_service_name(&service_name)
    .map_err(crate::video_compiler::error::VideoCompilerError::InvalidParameter)?;

  // Получаем метрики нужного сервиса
  let metrics = match service_name.as_str() {
    "render" => &state.services.metrics.render,
    "cache" => &state.services.metrics.cache,
    "gpu" => &state.services.metrics.gpu,
    "preview" => &state.services.metrics.preview,
    "project" => &state.services.metrics.project,
    "ffmpeg" => &state.services.metrics.ffmpeg,
    _ => unreachable!(), // validate_service_name уже проверил
  };

  Ok(metrics.get_summary().await)
}

/// Сбросить метрики для конкретного сервиса (детальная версия)
#[tauri::command]
pub async fn reset_service_metrics_detailed(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  business_logic::validate_service_name(&service_name)
    .map_err(crate::video_compiler::error::VideoCompilerError::InvalidParameter)?;

  // Получаем метрики нужного сервиса
  let metrics = match service_name.as_str() {
    "render" => &state.services.metrics.render,
    "cache" => &state.services.metrics.cache,
    "gpu" => &state.services.metrics.gpu,
    "preview" => &state.services.metrics.preview,
    "project" => &state.services.metrics.project,
    "ffmpeg" => &state.services.metrics.ffmpeg,
    _ => unreachable!(), // validate_service_name уже проверил
  };

  metrics.reset().await;
  Ok(())
}

/// Получить сводку метрик для всех сервисов
#[tauri::command]
pub async fn get_all_metrics_summaries(
  state: State<'_, VideoCompilerState>,
) -> Result<HashMap<String, MetricsSummary>> {
  let service_getter = |service_name: &str| -> Option<MetricsSummary> {
    match service_name {
      "render" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.render.get_summary())
      })),
      "cache" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.cache.get_summary())
      })),
      "gpu" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.gpu.get_summary())
      })),
      "preview" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.preview.get_summary())
      })),
      "project" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.project.get_summary())
      })),
      "ffmpeg" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.ffmpeg.get_summary())
      })),
      _ => None,
    }
  };

  let summaries = business_logic::collect_all_metrics_summaries(service_getter);
  Ok(summaries)
}

/// Экспортировать метрики в формате Prometheus (детальная версия)
#[tauri::command]
pub async fn export_metrics_prometheus_detailed(
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let params = PrometheusExportParams::default();
  business_logic::validate_prometheus_export_params(&params)
    .map_err(crate::video_compiler::error::VideoCompilerError::InvalidParameter)?;

  let service_getter = |service_name: &str| -> Option<MetricsSummary> {
    match service_name {
      "render" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.render.get_summary())
      })),
      "cache" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.cache.get_summary())
      })),
      "gpu" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.gpu.get_summary())
      })),
      "preview" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.preview.get_summary())
      })),
      "project" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.project.get_summary())
      })),
      "ffmpeg" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.ffmpeg.get_summary())
      })),
      _ => None,
    }
  };

  let output = business_logic::export_all_metrics_prometheus(service_getter, &params);
  Ok(output)
}

/// Проверить здоровье всех сервисов
#[tauri::command]
pub async fn check_services_health(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<ServiceHealth>> {
  let mut health_checks = Vec::new();

  let services = vec![
    ("render", &state.services.metrics.render),
    ("cache", &state.services.metrics.cache),
    ("gpu", &state.services.metrics.gpu),
    ("preview", &state.services.metrics.preview),
    ("project", &state.services.metrics.project),
    ("ffmpeg", &state.services.metrics.ffmpeg),
  ];

  for (name, metrics) in services {
    let summary = metrics.get_summary().await;
    health_checks.push(business_logic::evaluate_service_health(name, &summary));
  }

  Ok(health_checks)
}

/// Получить детальные метрики производительности
#[tauri::command]
pub async fn get_performance_metrics(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let mut perf_data = serde_json::Map::new();

  // Собираем метрики для каждого сервиса
  let services = vec![
    ("render", &state.services.metrics.render),
    ("cache", &state.services.metrics.cache),
    ("gpu", &state.services.metrics.gpu),
    ("preview", &state.services.metrics.preview),
    ("project", &state.services.metrics.project),
    ("ffmpeg", &state.services.metrics.ffmpeg),
  ];

  for (name, metrics) in services {
    let summary = metrics.get_summary().await;
    perf_data.insert(
      name.to_string(),
      business_logic::format_service_performance_data(&summary),
    );
  }

  Ok(serde_json::Value::Object(perf_data))
}

/// Сбросить все метрики
#[tauri::command]
pub async fn reset_all_metrics(state: State<'_, VideoCompilerState>) -> Result<()> {
  state.services.metrics.render.reset().await;
  state.services.metrics.cache.reset().await;
  state.services.metrics.gpu.reset().await;
  state.services.metrics.preview.reset().await;
  state.services.metrics.project.reset().await;
  state.services.metrics.ffmpeg.reset().await;

  Ok(())
}

/// Получить метрики конкретного сервиса из реестра
#[tauri::command]
pub async fn get_registry_service_metrics(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<MetricsSummary>> {
  // В реальной реализации здесь бы использовался глобальный MetricsRegistry
  // Пока используем прямой доступ к метрикам из состояния
  match service_name.as_str() {
    "render" => Ok(Some(state.services.metrics.render.get_summary().await)),
    "cache" => Ok(Some(state.services.metrics.cache.get_summary().await)),
    "gpu" => Ok(Some(state.services.metrics.gpu.get_summary().await)),
    "preview" => Ok(Some(state.services.metrics.preview.get_summary().await)),
    "project" => Ok(Some(state.services.metrics.project.get_summary().await)),
    "ffmpeg" => Ok(Some(state.services.metrics.ffmpeg.get_summary().await)),
    _ => Ok(None),
  }
}

/// Получить список доступных сервисов для мониторинга
#[tauri::command]
pub async fn get_available_monitoring_services() -> Result<Vec<String>> {
  let services = business_logic::get_available_services();
  Ok(services.into_iter().map(|s| s.to_string()).collect())
}

/// Проверить здоровье сервисов с пользовательскими критериями
#[tauri::command]
pub async fn check_services_health_with_criteria(
  criteria: HealthCriteria,
  state: State<'_, VideoCompilerState>,
) -> Result<HealthCheckResult> {
  business_logic::validate_health_criteria(&criteria)
    .map_err(crate::video_compiler::error::VideoCompilerError::InvalidParameter)?;

  let mut health_checks = Vec::new();

  let services = vec![
    ("render", &state.services.metrics.render),
    ("cache", &state.services.metrics.cache),
    ("gpu", &state.services.metrics.gpu),
    ("preview", &state.services.metrics.preview),
    ("project", &state.services.metrics.project),
    ("ffmpeg", &state.services.metrics.ffmpeg),
  ];

  for (name, metrics) in services {
    let summary = metrics.get_summary().await;
    health_checks.push(business_logic::evaluate_service_health_with_criteria(
      name, &summary, &criteria,
    ));
  }

  let result = business_logic::create_health_check_result(health_checks);
  Ok(result)
}

/// Экспортировать метрики в формате Prometheus с параметрами
#[tauri::command]
pub async fn export_metrics_prometheus_with_params(
  params: PrometheusExportParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  business_logic::validate_prometheus_export_params(&params)
    .map_err(crate::video_compiler::error::VideoCompilerError::InvalidParameter)?;

  let service_getter = |service_name: &str| -> Option<MetricsSummary> {
    match service_name {
      "render" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.render.get_summary())
      })),
      "cache" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.cache.get_summary())
      })),
      "gpu" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.gpu.get_summary())
      })),
      "preview" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.preview.get_summary())
      })),
      "project" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.project.get_summary())
      })),
      "ffmpeg" => Some(tokio::task::block_in_place(|| {
        tokio::runtime::Handle::current().block_on(state.services.metrics.ffmpeg.get_summary())
      })),
      _ => None,
    }
  };

  let output = business_logic::export_all_metrics_prometheus(service_getter, &params);
  Ok(output)
}

/// Сбросить метрики с параметрами
#[tauri::command]
pub async fn reset_metrics_with_params(
  params: MetricsResetParams,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let services = vec![
    ("render", &state.services.metrics.render),
    ("cache", &state.services.metrics.cache),
    ("gpu", &state.services.metrics.gpu),
    ("preview", &state.services.metrics.preview),
    ("project", &state.services.metrics.project),
    ("ffmpeg", &state.services.metrics.ffmpeg),
  ];

  for (name, metrics) in services {
    if business_logic::should_reset_service_metrics(name, &params) {
      metrics.reset().await;
    }
  }

  Ok(())
}

// Progress Tracker Commands

/// Получить текущий прогресс рендеринга
#[tauri::command]
pub async fn get_render_progress_tracker(
  state: State<'_, VideoCompilerState>,
) -> Result<business_logic::ProgressInfo> {
  business_logic::get_render_progress_tracker(state).await
}

/// Получить статистику отслеживания прогресса
#[tauri::command]
pub async fn get_progress_tracker_statistics(
  state: State<'_, VideoCompilerState>,
) -> Result<business_logic::ProgressStatistics> {
  business_logic::get_progress_tracker_statistics(state).await
}

/// Сбросить отслеживание прогресса
#[tauri::command]
pub async fn reset_progress_tracker(state: State<'_, VideoCompilerState>) -> Result<bool> {
  business_logic::reset_progress_tracker(state).await
}

/// Установить обработчик прогресса
#[tauri::command]
pub async fn set_progress_callback_enabled(
  enabled: bool,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  business_logic::set_progress_callback_enabled(enabled, state).await
}

/// Получить детальную информацию о текущей операции
#[tauri::command]
pub async fn get_current_operation_details(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  business_logic::get_current_operation_details(state).await
}
