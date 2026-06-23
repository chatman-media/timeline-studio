//! Tauri команды для предрендеринга (thin wrappers)

use super::types::*;
use tauri::State;
use ts_render::video_compiler::core::error::Result;
use ts_render_services::VideoCompilerState;
use ts_render_services::prerender::commands_impl as impl_;

/// Предварительно отрендерить сегмент
#[tauri::command]
pub async fn prerender_segment(
  project_schema: ts_render::video_compiler::core::schema::ProjectSchema,
  start_time: f64,
  end_time: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::prerender_segment(project_schema, start_time, end_time, output_path, &state).await
}

/// Получить информацию о кэше предрендеринга
#[tauri::command]
pub async fn get_prerender_cache_info(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_prerender_cache_info(&state).await
}

/// Очистить кэш предрендеринга
#[tauri::command]
pub async fn clear_prerender_cache(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::clear_prerender_cache(_project_id, &state).await
}

/// Построить команду предрендеринга сегмента
#[tauri::command]
pub async fn build_prerender_segment_command(
  segment_id: String,
  input_files: Vec<String>,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::build_prerender_segment_command(segment_id, input_files, output_path, settings, &state).await
}

/// Проверить статус предрендеринга
#[tauri::command]
pub async fn check_prerender_status(
  segment_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<PrerenderStatus> {
  impl_::check_prerender_status(segment_id, &state).await
}

/// Получить список предрендеренных сегментов
#[tauri::command]
pub async fn get_prerendered_segments(
  project_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<PrerenderCacheFile>> {
  impl_::get_prerendered_segments(project_id, &_state).await
}

/// Удалить предрендеренный сегмент
#[tauri::command]
pub async fn delete_prerendered_segment(
  segment_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::delete_prerendered_segment(segment_id, &state).await
}

/// Оптимизировать кэш предрендеринга
#[tauri::command]
pub async fn optimize_prerender_cache(
  max_size_mb: u64,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  impl_::optimize_prerender_cache(max_size_mb, &state).await
}

/// Построить команду предрендеринга сегмента (расширенная версия)
#[tauri::command]
pub async fn build_prerender_segment_command_advanced(
  _segment_id: String,
  params: PrerenderCommandParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::build_prerender_segment_command_advanced(_segment_id, params, &state).await
}

/// Валидировать параметры предрендеринга сегмента
#[tauri::command]
pub async fn validate_prerender_segment_params(
  params: PrerenderSegmentParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::validate_prerender_segment_params(params, &_state).await
}

/// Получить оптимальные настройки предрендеринга
#[tauri::command]
pub async fn get_optimal_prerender_settings(
  project_schema: ts_render::video_compiler::core::schema::ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_optimal_prerender_settings(project_schema, &_state).await
}

/// Построить предрендеренный сегмент напрямую
#[tauri::command]
pub async fn build_prerender_segment_direct(
  project_schema: ts_render::video_compiler::core::schema::ProjectSchema,
  start_time: f64,
  end_time: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::build_prerender_segment_direct(project_schema, start_time, end_time, output_path, &state).await
}
