//! Tauri команды для пакетных операций

use super::business_logic;
use super::types::*;
use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

// Type aliases to simplify complex Result types
type JobsGuard = std::sync::MutexGuard<'static, HashMap<String, BatchJobInfo>>;
type JobsPoisonError = std::sync::PoisonError<JobsGuard>;

// Note: This global static mutex can cause issues during test execution
// TODO: Replace with Tauri state management for better test isolation
static BATCH_JOBS: Lazy<Mutex<HashMap<String, BatchJobInfo>>> =
  Lazy::new(|| Mutex::new(HashMap::new()));

/// Создает новое пакетное задание
#[tauri::command]
pub async fn create_batch_job(
  params: BatchAnalysisParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Валидируем параметры
  business_logic::validate_batch_params(&params)?;

  // Создаем задание
  let job = business_logic::create_batch_job(params.operation, params.clip_ids);
  let job_id = job.job_id.clone();

  // Сохраняем задание
  {
    let mut jobs = BATCH_JOBS
      .lock()
      .or_else(
        |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
          log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
          Ok(poisoned.into_inner())
        },
      )
      .map_err(|e| {
        crate::video_compiler::error::VideoCompilerError::InternalError(format!(
          "Failed to access batch jobs: {}",
          e
        ))
      })?;
    jobs.insert(job_id.clone(), job);
  }

  // В реальной реализации здесь запускался бы асинхронный процессор заданий
  log::info!("Created batch job {}", job_id);

  Ok(job_id)
}

/// Получает информацию о пакетном задании
#[tauri::command]
pub async fn get_batch_job_info(
  job_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<BatchJobInfo> {
  let jobs = BATCH_JOBS
    .lock()
    .or_else(
      |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      },
    )
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Failed to access batch jobs: {}",
        e
      ))
    })?;

  jobs.get(&job_id).cloned().ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
      "Batch job {} not found",
      job_id
    ))
  })
}

/// Отменяет пакетное задание
#[tauri::command]
pub async fn cancel_batch_job(
  job_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let mut jobs = BATCH_JOBS
    .lock()
    .or_else(
      |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      },
    )
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Failed to access batch jobs: {}",
        e
      ))
    })?;

  if let Some(job_info) = jobs.get_mut(&job_id) {
    if business_logic::can_cancel_job(job_info) {
      business_logic::update_job_status(job_info, BatchJobStatus::Cancelled);
      log::info!("Cancelled batch job {}", job_id);
      Ok(true)
    } else {
      Ok(false)
    }
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Batch job {} not found",
        job_id
      )),
    )
  }
}

/// Получает список всех пакетных заданий
#[tauri::command]
pub async fn list_batch_jobs(
  limit: Option<usize>,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<BatchJobInfo>> {
  let jobs = BATCH_JOBS
    .lock()
    .or_else(
      |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      },
    )
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Failed to access batch jobs: {}",
        e
      ))
    })?;

  let mut job_list: Vec<BatchJobInfo> = jobs.values().cloned().collect();
  job_list.sort_by(|a, b| b.start_time.cmp(&a.start_time)); // Сортировка по времени создания

  if let Some(limit) = limit {
    job_list.truncate(limit);
  }

  Ok(job_list)
}

/// Получает статистику пакетных операций
#[tauri::command]
pub async fn get_batch_statistics(
  _state: State<'_, VideoCompilerState>,
) -> Result<BatchStatistics> {
  let jobs = BATCH_JOBS
    .lock()
    .or_else(
      |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      },
    )
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Failed to access batch jobs: {}",
        e
      ))
    })?;

  let job_list: Vec<BatchJobInfo> = jobs.values().cloned().collect();
  Ok(business_logic::calculate_batch_statistics(&job_list))
}

/// Получает прогресс пакетного задания
#[tauri::command]
pub async fn get_batch_progress(
  job_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<BatchProgress> {
  let jobs = BATCH_JOBS
    .lock()
    .or_else(
      |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      },
    )
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Failed to access batch jobs: {}",
        e
      ))
    })?;

  let job = jobs.get(&job_id).ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
      "Batch job {} not found",
      job_id
    ))
  })?;

  Ok(business_logic::calculate_progress(job))
}

/// Очищает завершенные задания
#[tauri::command]
pub async fn clear_completed_batch_jobs(_state: State<'_, VideoCompilerState>) -> Result<usize> {
  let mut jobs = BATCH_JOBS
    .lock()
    .or_else(
      |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      },
    )
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Failed to access batch jobs: {}",
        e
      ))
    })?;

  let completed_job_ids: Vec<String> = jobs
    .iter()
    .filter(|(_, job)| {
      matches!(
        job.status,
        BatchJobStatus::Completed | BatchJobStatus::Failed | BatchJobStatus::Cancelled
      )
    })
    .map(|(id, _)| id.clone())
    .collect();

  let count = completed_job_ids.len();

  for job_id in completed_job_ids {
    jobs.remove(&job_id);
  }

  log::info!("Cleared {} completed batch jobs", count);
  Ok(count)
}

/// Обновляет результат для конкретного клипа в пакетном задании
#[tauri::command]
pub async fn update_batch_clip_result(
  job_id: String,
  clip_id: String,
  result: BatchClipResult,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut jobs = BATCH_JOBS
    .lock()
    .or_else(
      |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      },
    )
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Failed to access batch jobs: {}",
        e
      ))
    })?;

  if let Some(job_info) = jobs.get_mut(&job_id) {
    business_logic::add_clip_result(job_info, clip_id, result);

    // Проверяем, завершена ли обработка всех клипов
    if job_info.completed_clips + job_info.failed_clips >= job_info.total_clips {
      let new_status = if job_info.failed_clips == 0 {
        BatchJobStatus::Completed
      } else {
        BatchJobStatus::Failed
      };
      business_logic::update_job_status(job_info, new_status);
    }

    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Batch job {} not found",
        job_id
      )),
    )
  }
}

/// Получает статистику пакетных операций (старый интерфейс)
#[tauri::command]
pub async fn get_batch_processing_stats(
  _state: State<'_, VideoCompilerState>,
) -> Result<BatchProcessingStats> {
  let jobs = BATCH_JOBS
    .lock()
    .or_else(
      |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      },
    )
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Failed to access batch jobs: {}",
        e
      ))
    })?;

  let job_list: Vec<BatchJobInfo> = jobs.values().cloned().collect();
  Ok(business_logic::calculate_batch_processing_stats(&job_list))
}

/// Удаляет завершенные пакетные задания
#[tauri::command]
pub async fn cleanup_batch_jobs(
  older_than_hours: Option<u64>,
  _state: State<'_, VideoCompilerState>,
) -> Result<usize> {
  let mut jobs = BATCH_JOBS
    .lock()
    .or_else(
      |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      },
    )
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Failed to access batch jobs: {}",
        e
      ))
    })?;

  let threshold_hours = older_than_hours.unwrap_or(24);
  let threshold_time = chrono::Utc::now() - chrono::Duration::hours(threshold_hours as i64);

  let initial_count = jobs.len();

  // Удаляем завершенные задания старше порогового времени
  jobs.retain(|_, job_info| {
    if business_logic::is_job_completed(job_info) {
      if let Ok(start_time) = chrono::DateTime::parse_from_rfc3339(&job_info.start_time) {
        start_time.with_timezone(&chrono::Utc) > threshold_time
      } else {
        true // Сохраняем задания с неопределенным временем
      }
    } else {
      true // Сохраняем активные задания
    }
  });

  let removed_count = initial_count - jobs.len();
  log::info!("Removed {} completed batch jobs", removed_count);

  Ok(removed_count)
}

/// Устанавливает статус пакетного задания
#[tauri::command]
pub async fn set_batch_job_status(
  job_id: String,
  status: BatchJobStatus,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut jobs = BATCH_JOBS
    .lock()
    .or_else(
      |poisoned: JobsPoisonError| -> std::result::Result<JobsGuard, JobsPoisonError> {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      },
    )
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Failed to access batch jobs: {}",
        e
      ))
    })?;

  if let Some(job_info) = jobs.get_mut(&job_id) {
    business_logic::update_job_status(job_info, status);
    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Batch job {} not found",
        job_id
      )),
    )
  }
}
