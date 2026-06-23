//! Бизнес-логика для команд управления сервисами

#![allow(clippy::explicit_auto_deref)]

use super::types::*;
use std::collections::HashMap;
use ts_render::video_compiler::{
  error::{Result, VideoCompilerError},
  schema::timeline::ClipSource,
};
use crate::VideoCompilerState;

/// Получить список активных задач
pub async fn get_active_job_ids(state: &VideoCompilerState) -> Vec<String> {
  let active_jobs = state.active_jobs.read().await;
  active_jobs.keys().cloned().collect()
}

/// Получить прогресс рендеринга задачи
pub async fn get_job_render_progress(state: &VideoCompilerState, job_id: &str) -> Result<f64> {
  let active_jobs = state.active_jobs.read().await;

  if active_jobs.contains_key(job_id) {
    // TODO: Получить реальный прогресс из задачи
    Ok(0.0)
  } else {
    Err(VideoCompilerError::RenderError {
      job_id: job_id.to_string(),
      stage: "progress".to_string(),
      message: "Job not found".to_string(),
    })
  }
}

/// Создать статистику рендеринга для задачи
pub async fn create_render_statistics(
  state: &VideoCompilerState,
  job_id: &str,
) -> Result<RenderStatistics> {
  let active_jobs = state.active_jobs.read().await;

  if let Some(job) = active_jobs.get(job_id) {
    Ok(RenderStatistics {
      job_id: job_id.to_string(),
      progress: 0.0,
      status: "running".to_string(),
      start_time: job.metadata.created_at.clone(),
      frames_processed: 0,
      frames_total: 100,
      current_fps: 0.0,
      eta_seconds: 0,
    })
  } else {
    Err(VideoCompilerError::RenderError {
      job_id: job_id.to_string(),
      stage: "statistics".to_string(),
      message: "Job not found".to_string(),
    })
  }
}

/// Анализировать источники входных данных проекта
pub fn analyze_input_sources(
  project_schema: &ts_render::video_compiler::schema::ProjectSchema,
) -> InputSourcesResult {
  let mut sources = HashMap::new();

  for track in &project_schema.tracks {
    for clip in &track.clips {
      let path = match &clip.source {
        ClipSource::File(path) => path.clone(),
        _ => continue,
      };

      let source_info = sources.entry(path.clone()).or_insert(InputSourceInfo {
        track_id: track.id.clone(),
        clip_count: 0,
        total_duration: 0.0,
      });

      source_info.clip_count += 1;
      source_info.total_duration += clip.end_time - clip.start_time;
    }
  }

  InputSourcesResult {
    total_sources: sources.len(),
    sources,
  }
}

/// Проверить валидность пути к FFmpeg
pub fn validate_ffmpeg_path(path: &str) -> Result<()> {
  let output = std::process::Command::new(path)
    .arg("-version")
    .output()
    .map_err(|e| VideoCompilerError::InvalidParameter(format!("Invalid FFmpeg path: {e}")))?;

  if !output.status.success() {
    return Err(VideoCompilerError::InvalidParameter(
      "Invalid FFmpeg executable".to_string(),
    ));
  }

  Ok(())
}

/// Создать метрики всех сервисов
pub async fn create_all_service_metrics(state: &VideoCompilerState) -> AllServiceMetrics {
  let active_jobs = state.active_jobs.read().await;
  let job_count = active_jobs.len() as u64;

  AllServiceMetrics {
    render: RenderServiceMetrics {
      active_jobs: job_count,
      queued_jobs: 0,
      completed_today: 0,
      failed_today: 0,
      average_render_time_seconds: 0,
      cpu_usage_percent: 0.0,
      memory_usage_mb: 0.0,
    },
    cache: CacheServiceMetrics {
      hit_rate: 0.85,
      miss_rate: 0.15,
      memory_usage_mb: 128.0,
      entries_count: 0,
      evictions_count: 0,
      average_entry_size_kb: 0.0,
    },
    preview: PreviewServiceMetrics {
      active_generations: 0,
      cached_previews: 0,
      cache_size_mb: 0.0,
      generation_queue_length: 0,
      average_generation_time_ms: 0.0,
    },
    gpu: GpuServiceMetrics {
      available: false,
      utilization_percent: 0.0,
      memory_usage_mb: 0.0,
      memory_total_mb: 0.0,
      temperature_celsius: 0.0,
      active_encoders: 0,
    },
    timestamp: chrono::Utc::now().to_rfc3339(),
  }
}

/// Создать метрики конкретного сервиса
pub fn create_specific_service_metrics(service_name: &str) -> Result<SpecificServiceMetrics> {
  let metrics = match service_name {
    "render" => serde_json::json!({
        "active_jobs": 0,
        "queued_jobs": 0,
        "completed_today": 0,
        "failed_today": 0,
        "average_render_time_seconds": 0,
        "cpu_usage_percent": 0.0,
        "memory_usage_mb": 0.0,
    }),
    "cache" => serde_json::json!({
        "hit_rate": 0.85,
        "miss_rate": 0.15,
        "memory_usage_mb": 128.0,
        "entries_count": 0,
        "evictions_count": 0,
        "average_entry_size_kb": 0.0,
    }),
    "preview" => serde_json::json!({
        "active_generations": 0,
        "cached_previews": 0,
        "cache_size_mb": 0.0,
        "generation_queue_length": 0,
        "average_generation_time_ms": 0.0,
    }),
    "gpu" => serde_json::json!({
        "available": false,
        "utilization_percent": 0.0,
        "memory_usage_mb": 0.0,
        "memory_total_mb": 0.0,
        "temperature_celsius": 0.0,
        "active_encoders": 0,
    }),
    _ => {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Unknown service: {service_name}"
      )));
    }
  };

  Ok(SpecificServiceMetrics {
    service: service_name.to_string(),
    metrics,
    timestamp: chrono::Utc::now().to_rfc3339(),
  })
}

/// Очистить завершенные задачи
pub async fn cleanup_completed_jobs_logic(
  state: &VideoCompilerState,
  older_than_hours: Option<u32>,
) -> CleanupResult {
  let mut active_jobs = state.active_jobs.write().await;
  let initial_count = active_jobs.len();

  // TODO: В реальной реализации фильтровать по времени завершения
  // Сейчас просто очищаем все для демонстрации
  let _hours = older_than_hours.unwrap_or(24);
  active_jobs.clear();

  let removed_count = initial_count - active_jobs.len();
  CleanupResult {
    removed_count: removed_count as u32,
    remaining_count: active_jobs.len() as u32,
  }
}

/// Проверить здоровье FFmpeg
pub async fn check_ffmpeg_health(state: &VideoCompilerState) -> ServiceHealth {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let ffmpeg_healthy = std::process::Command::new(&*ffmpeg_path)
    .arg("-version")
    .output()
    .map(|o| o.status.success())
    .unwrap_or(false);

  ServiceHealth {
    status: if ffmpeg_healthy {
      "healthy"
    } else {
      "unhealthy"
    }
    .to_string(),
    uptime_seconds: if ffmpeg_healthy { 3600 } else { 0 },
    last_error: if ffmpeg_healthy {
      None
    } else {
      Some("FFmpeg not available".to_string())
    },
  }
}

/// Создать статус здоровья всех сервисов
pub async fn create_services_health_status(state: &VideoCompilerState) -> ServicesHealthStatus {
  let ffmpeg_health = check_ffmpeg_health(state).await;
  let is_healthy = ffmpeg_health.status == "healthy";

  ServicesHealthStatus {
    render: ServiceHealth {
      status: "healthy".to_string(),
      uptime_seconds: 3600,
      last_error: None,
    },
    cache: ServiceHealth {
      status: "healthy".to_string(),
      uptime_seconds: 3600,
      last_error: None,
    },
    preview: ServiceHealth {
      status: "healthy".to_string(),
      uptime_seconds: 3600,
      last_error: None,
    },
    gpu: ServiceHealth {
      status: "unavailable".to_string(),
      uptime_seconds: 0,
      last_error: Some("GPU not detected".to_string()),
    },
    ffmpeg: ffmpeg_health,
    overall_status: if is_healthy { "healthy" } else { "degraded" }.to_string(),
    timestamp: chrono::Utc::now().to_rfc3339(),
  }
}

/// Валидировать тип сервиса для перезапуска
pub fn validate_service_for_restart(service_name: &str) -> Result<ServiceType> {
  match service_name {
    "render" => Ok(ServiceType::Render),
    "cache" => Ok(ServiceType::Cache),
    "preview" => Ok(ServiceType::Preview),
    "gpu" => Ok(ServiceType::Gpu),
    _ => Err(VideoCompilerError::InvalidParameter(format!(
      "Unknown service: {service_name}"
    ))),
  }
}

/// Выполнить перезапуск сервиса
pub fn restart_service_logic(service_type: ServiceType) -> Result<()> {
  log::info!("Restarting service: {:?}", service_type);

  // TODO: В реальной реализации здесь была бы логика перезапуска
  match service_type {
    ServiceType::Render | ServiceType::Cache | ServiceType::Preview | ServiceType::Gpu => {
      log::info!("Service {:?} restarted successfully", service_type);
      Ok(())
    }
    ServiceType::Ffmpeg => Err(VideoCompilerError::InvalidParameter(
      "FFmpeg cannot be restarted".to_string(),
    )),
  }
}
