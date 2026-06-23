//! Tauri команды для управления сервисами

use super::types::*;
use tauri::State;
use ts_render::video_compiler::error::Result;
use ts_render_services::VideoCompilerState;
use ts_render_services::service::business_logic as bl;

/// Получить активные задачи
#[tauri::command]
pub async fn get_active_jobs(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  Ok(bl::get_active_job_ids(&state).await)
}

/// Получить прогресс рендеринга
#[tauri::command]
pub async fn get_render_progress(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<f64> {
  bl::get_job_render_progress(&state, &job_id).await
}

/// Получить статистику рендеринга
#[tauri::command]
pub async fn get_render_statistics(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<RenderStatistics> {
  bl::create_render_statistics(&state, &job_id).await
}

/// Получить информацию об источниках входных данных
#[tauri::command]
pub async fn get_input_sources_info(
  project_schema: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<InputSourcesResult> {
  Ok(bl::analyze_input_sources(&project_schema))
}

/// Обновить время доступа к проекту
#[tauri::command]
pub async fn touch_project(project_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  let _cache = state.cache_manager.write().await;
  // TODO: Реализовать обновление времени доступа
  let _project_id = &project_id;
  Ok(())
}

/// Установить путь к FFmpeg для превью
#[tauri::command]
pub async fn set_preview_ffmpeg_path(
  path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Проверяем путь
  bl::validate_ffmpeg_path(&path)?;

  // Обновляем путь
  let mut ffmpeg_path = state.ffmpeg_path.write().await;
  *ffmpeg_path = path;

  Ok(())
}

/// Получить все метрики сервисов
#[tauri::command]
pub async fn get_all_service_metrics(
  state: State<'_, VideoCompilerState>,
) -> Result<AllServiceMetrics> {
  log::debug!("Getting all service metrics");
  Ok(bl::create_all_service_metrics(&state).await)
}

/// Получить метрики конкретного сервиса
#[tauri::command]
pub async fn get_specific_service_metrics(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<SpecificServiceMetrics> {
  log::debug!("Getting metrics for service: {service_name}");
  bl::create_specific_service_metrics(&service_name)
}

/// Очистить завершенные задачи
#[tauri::command]
pub async fn cleanup_completed_jobs(
  older_than_hours: Option<u32>,
  state: State<'_, VideoCompilerState>,
) -> Result<u32> {
  log::debug!(
    "Cleaning up completed jobs older than {} hours",
    older_than_hours.unwrap_or(24)
  );

  let result = bl::cleanup_completed_jobs_logic(&state, older_than_hours).await;
  Ok(result.removed_count)
}

/// Получить состояние здоровья сервисов
#[tauri::command]
pub async fn get_services_health(
  state: State<'_, VideoCompilerState>,
) -> Result<ServicesHealthStatus> {
  log::debug!("Checking services health");
  Ok(bl::create_services_health_status(&state).await)
}

/// Перезапустить сервис
#[tauri::command]
pub async fn restart_service(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let service_type = bl::validate_service_for_restart(&service_name)?;
  bl::restart_service_logic(service_type)
}
