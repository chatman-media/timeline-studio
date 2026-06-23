//! Tauri команды для пакетных операций (thin wrappers)

use super::types::*;
use ts_render::video_compiler::error::Result;
use ts_render_services::VideoCompilerState;
use tauri::State;
use ts_render_services::batch::commands_impl as impl_;

/// Создает новое пакетное задание
#[tauri::command]
pub async fn create_batch_job(
  params: BatchAnalysisParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::create_batch_job(params, &state).await
}

/// Получает информацию о пакетном задании
#[tauri::command]
pub async fn get_batch_job_info(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<BatchJobInfo> {
  impl_::get_batch_job_info(job_id, &state).await
}

/// Отменяет пакетное задание
#[tauri::command]
pub async fn cancel_batch_job(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  impl_::cancel_batch_job(job_id, &state).await
}

/// Получает список всех пакетных заданий
#[tauri::command]
pub async fn list_batch_jobs(
  limit: Option<usize>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<BatchJobInfo>> {
  impl_::list_batch_jobs(limit, &state).await
}

/// Получает статистику пакетных операций
#[tauri::command]
pub async fn get_batch_statistics(
  state: State<'_, VideoCompilerState>,
) -> Result<BatchStatistics> {
  impl_::get_batch_statistics(&state).await
}

/// Получает прогресс пакетного задания
#[tauri::command]
pub async fn get_batch_progress(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<BatchProgress> {
  impl_::get_batch_progress(job_id, &state).await
}

/// Очищает завершенные задания
#[tauri::command]
pub async fn clear_completed_batch_jobs(state: State<'_, VideoCompilerState>) -> Result<usize> {
  impl_::clear_completed_batch_jobs(&state).await
}

/// Обновляет результат для конкретного клипа в пакетном задании
#[tauri::command]
pub async fn update_batch_clip_result(
  job_id: String,
  clip_id: String,
  result: BatchClipResult,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::update_batch_clip_result(job_id, clip_id, result, &state).await
}

/// Получает статистику пакетных операций (старый интерфейс)
#[tauri::command]
pub async fn get_batch_processing_stats(
  state: State<'_, VideoCompilerState>,
) -> Result<BatchProcessingStats> {
  impl_::get_batch_processing_stats(&state).await
}

/// Удаляет завершенные пакетные задания
#[tauri::command]
pub async fn cleanup_batch_jobs(
  older_than_hours: Option<u64>,
  state: State<'_, VideoCompilerState>,
) -> Result<usize> {
  impl_::cleanup_batch_jobs(older_than_hours, &state).await
}

/// Устанавливает статус пакетного задания
#[tauri::command]
pub async fn set_batch_job_status(
  job_id: String,
  status: BatchJobStatus,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::set_batch_job_status(job_id, status, &state).await
}
