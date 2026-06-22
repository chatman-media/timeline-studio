//! Бизнес-логика для пакетных операций

use super::types::*;
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use chrono::Utc;
use std::collections::HashMap;
use uuid::Uuid;

/// Создает новое пакетное задание
pub fn create_batch_job(operation: BatchOperationType, clip_ids: Vec<String>) -> BatchJobInfo {
  BatchJobInfo {
    job_id: Uuid::new_v4().to_string(),
    operation,
    clip_ids: clip_ids.clone(),
    status: BatchJobStatus::Pending,
    total_clips: clip_ids.len(),
    completed_clips: 0,
    failed_clips: 0,
    start_time: Utc::now().to_rfc3339(),
    end_time: None,
    errors: Vec::new(),
    results: HashMap::new(),
  }
}

/// Обновляет статус задания
pub fn update_job_status(job: &mut BatchJobInfo, status: BatchJobStatus) {
  job.status = status;

  if matches!(
    status,
    BatchJobStatus::Completed | BatchJobStatus::Failed | BatchJobStatus::Cancelled
  ) {
    job.end_time = Some(Utc::now().to_rfc3339());
  }
}

/// Добавляет результат для клипа
pub fn add_clip_result(job: &mut BatchJobInfo, clip_id: String, result: BatchClipResult) {
  if result.success {
    job.completed_clips += 1;
    // Используем data или result, в зависимости от того, что доступно
    if let Some(data) = result.data.or(result.result) {
      job.results.insert(clip_id, data);
    }
  } else {
    job.failed_clips += 1;
    if let Some(error) = result.error {
      job.errors.push(format!("Clip {}: {}", clip_id, error));
    }
  }
}

/// Вычисляет прогресс задания
pub fn calculate_progress(job: &BatchJobInfo) -> BatchProgress {
  let processed = job.completed_clips + job.failed_clips;
  let percentage = if job.total_clips > 0 {
    (processed as f32 / job.total_clips as f32) * 100.0
  } else {
    0.0
  };

  BatchProgress {
    job_id: job.job_id.clone(),
    current_clip_id: None,
    current_clip_index: processed,
    total_clips: job.total_clips,
    percentage,
    estimated_time_remaining_secs: None,
  }
}

/// Вычисляет статистику для списка заданий
pub fn calculate_batch_statistics(jobs: &[BatchJobInfo]) -> BatchStatistics {
  if jobs.is_empty() {
    return BatchStatistics {
      total_processing_time_ms: 0,
      average_clip_time_ms: 0,
      fastest_clip_time_ms: 0,
      slowest_clip_time_ms: 0,
      success_rate: 0.0,
      total_errors: 0,
    };
  }

  let total_clips = jobs.iter().map(|j| j.total_clips).sum::<usize>();
  let successful_clips = jobs.iter().map(|j| j.completed_clips).sum::<usize>();
  let total_errors = jobs.iter().map(|j| j.failed_clips).sum::<usize>();

  let success_rate = if total_clips > 0 {
    (successful_clips as f32 / total_clips as f32) * 100.0
  } else {
    0.0
  };

  // Собираем время выполнения из результатов клипов
  let mut clip_times: Vec<u64> = Vec::new();
  let mut total_processing_time_ms = 0u64;

  for job in jobs {
    for result in &job.results {
      if let Ok(batch_result) = serde_json::from_value::<
        crate::batch::BatchClipResult,
      >(result.1.clone())
      {
        clip_times.push(batch_result.processing_time_ms);
        total_processing_time_ms += batch_result.processing_time_ms;
      }
    }

    // Также можем рассчитать на основе времени старта/окончания задания
    if let (Ok(start), Some(end_str)) = (
      chrono::DateTime::parse_from_rfc3339(&job.start_time),
      &job.end_time,
    ) {
      if let Ok(end) = chrono::DateTime::parse_from_rfc3339(end_str) {
        let duration = end.signed_duration_since(start);
        total_processing_time_ms += duration.num_milliseconds() as u64;
      }
    }
  }

  let average_clip_time_ms = if !clip_times.is_empty() {
    clip_times.iter().sum::<u64>() / clip_times.len() as u64
  } else {
    0
  };

  let fastest_clip_time_ms = clip_times.iter().min().copied().unwrap_or(0);
  let slowest_clip_time_ms = clip_times.iter().max().copied().unwrap_or(0);

  BatchStatistics {
    total_processing_time_ms,
    average_clip_time_ms,
    fastest_clip_time_ms,
    slowest_clip_time_ms,
    success_rate,
    total_errors,
  }
}

/// Валидирует параметры пакетного анализа
pub fn validate_batch_params(params: &BatchAnalysisParams) -> Result<()> {
  if params.clip_ids.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Clip IDs list cannot be empty".to_string(),
    ));
  }

  // Проверяем уникальность clip_ids
  let mut unique_ids = std::collections::HashSet::new();
  for id in &params.clip_ids {
    if !unique_ids.insert(id) {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Duplicate clip ID: {}",
        id
      )));
    }
  }

  Ok(())
}

/// Определяет оптимальное количество параллельных операций
pub fn determine_optimal_concurrency(total_clips: usize, operation: &BatchOperationType) -> usize {
  let cpu_cores = num_cpus::get();

  // Разные операции требуют разного количества ресурсов
  let resource_factor = match operation {
    BatchOperationType::VideoAnalysis => 0.5, // Heavy CPU/GPU
    BatchOperationType::WhisperTranscription => 0.3, // Very heavy
    BatchOperationType::SubtitleGeneration => 0.8, // Light
    BatchOperationType::QualityAnalysis => 0.6, // Medium
    BatchOperationType::SceneDetection => 0.5, // Heavy
    BatchOperationType::MotionAnalysis => 0.4, // Very heavy
    BatchOperationType::AudioAnalysis => 0.7, // Medium
    BatchOperationType::LanguageDetection => 0.9, // Light
    BatchOperationType::ComprehensiveAnalysis => 0.2, // Extremely heavy
  };

  let optimal = (cpu_cores as f32 * resource_factor).ceil() as usize;
  optimal.min(total_clips).max(1)
}

/// Группирует клипы для оптимальной обработки
pub fn group_clips_for_processing(clip_ids: Vec<String>, batch_size: usize) -> Vec<Vec<String>> {
  if batch_size == 0 {
    return vec![clip_ids];
  }

  clip_ids
    .chunks(batch_size)
    .map(|chunk| chunk.to_vec())
    .collect()
}

/// Проверяет, можно ли отменить задание
pub fn can_cancel_job(job: &BatchJobInfo) -> bool {
  matches!(
    job.status,
    BatchJobStatus::Pending | BatchJobStatus::Running
  )
}

/// Форматирует время выполнения в читаемый формат
pub fn format_execution_time(ms: u64) -> String {
  if ms < 1000 {
    format!("{}ms", ms)
  } else if ms < 60000 {
    format!("{:.1}s", ms as f64 / 1000.0)
  } else {
    let minutes = ms / 60000;
    let seconds = (ms % 60000) / 1000;
    format!("{}m {}s", minutes, seconds)
  }
}

/// Вычисляет статистику для списка заданий (возвращает BatchProcessingStats)
pub fn calculate_batch_processing_stats(jobs: &[BatchJobInfo]) -> BatchProcessingStats {
  let total_jobs = jobs.len();
  let running_jobs = jobs
    .iter()
    .filter(|j| matches!(j.status, BatchJobStatus::Running))
    .count();
  let completed_jobs = jobs
    .iter()
    .filter(|j| matches!(j.status, BatchJobStatus::Completed))
    .count();
  let failed_jobs = jobs
    .iter()
    .filter(|j| matches!(j.status, BatchJobStatus::Failed))
    .count();

  let total_clips_processed: usize = jobs
    .iter()
    .filter(|j| matches!(j.status, BatchJobStatus::Completed))
    .map(|j| j.total_clips)
    .sum();

  // Упрощенный расчет среднего времени выполнения
  let average_execution_time_ms = if completed_jobs > 0 {
    5000 // Заглушка: 5 секунд
  } else {
    0
  };

  let success_rate = if total_jobs > 0 {
    (completed_jobs as f64 / total_jobs as f64) * 100.0
  } else {
    0.0
  };

  BatchProcessingStats {
    total_jobs,
    running_jobs,
    completed_jobs,
    failed_jobs,
    average_execution_time_ms,
    total_clips_processed,
    success_rate,
  }
}

/// Проверяет, является ли задание завершенным
pub fn is_job_completed(job: &BatchJobInfo) -> bool {
  matches!(
    job.status,
    BatchJobStatus::Completed | BatchJobStatus::Failed | BatchJobStatus::Cancelled
  )
}
