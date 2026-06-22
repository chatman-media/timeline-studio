//! Tauri команды для предрендеринга

use super::{business_logic, types::*};
use tauri::State;
use ts_render::video_compiler::core::error::Result;
use ts_render_services::VideoCompilerState;

/// Предварительно отрендерить сегмент
#[tauri::command]
pub async fn prerender_segment(
  project_schema: ts_render::video_compiler::core::schema::ProjectSchema,
  start_time: f64,
  end_time: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let params = PrerenderSegmentParams {
    project_schema,
    start_time,
    end_time,
    output_path,
  };

  // Валидируем параметры
  business_logic::validate_prerender_segment_params(&params)?;

  // Выполняем предрендеринг
  business_logic::prerender_segment_logic(&state, &params).await
}

/// Получить информацию о кэше предрендеринга
#[tauri::command]
pub async fn get_prerender_cache_info(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  business_logic::get_prerender_cache_info_logic(&state).await
}

/// Очистить кэш предрендеринга
#[tauri::command]
pub async fn clear_prerender_cache(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  business_logic::clear_prerender_cache_logic(&state).await
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
  let params = PrerenderCommandParams {
    segment_id,
    input_files,
    output_path,
    settings,
  };

  // Валидируем параметры
  business_logic::validate_prerender_command_params(&params)?;

  // Строим команду
  business_logic::build_prerender_command_logic(&state, &params).await
}

/// Проверить статус предрендеринга
#[tauri::command]
pub async fn check_prerender_status(
  segment_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<PrerenderStatus> {
  Ok(business_logic::check_prerender_status_logic(&state, &segment_id).await)
}

/// Получить список предрендеренных сегментов
#[tauri::command]
pub async fn get_prerendered_segments(
  project_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<PrerenderCacheFile>> {
  business_logic::get_prerendered_segments_logic(&project_id).await
}

/// Удалить предрендеренный сегмент
#[tauri::command]
pub async fn delete_prerendered_segment(
  segment_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  business_logic::delete_prerendered_segment_logic(&state, &segment_id).await
}

/// Оптимизировать кэш предрендеринга
#[tauri::command]
pub async fn optimize_prerender_cache(
  max_size_mb: u64,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  let params = CacheOptimizationParams {
    max_size_mb,
    preserve_recent: true,
    max_age_hours: Some(24),
  };

  let result = business_logic::optimize_prerender_cache_logic(&state, &params).await?;
  Ok(result.freed_bytes)
}

/// Построить команду предрендеринга сегмента (расширенная версия)
#[tauri::command]
pub async fn build_prerender_segment_command_advanced(
  _segment_id: String,
  params: PrerenderCommandParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Валидируем параметры
  business_logic::validate_prerender_command_params(&params)?;
  // Строим команду
  business_logic::build_prerender_command_logic(&state, &params).await
}

/// Валидировать параметры предрендеринга сегмента
#[tauri::command]
pub async fn validate_prerender_segment_params(
  params: PrerenderSegmentParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  business_logic::validate_prerender_segment_params(&params)
}

/// Получить оптимальные настройки предрендеринга
#[tauri::command]
pub async fn get_optimal_prerender_settings(
  project_schema: ts_render::video_compiler::core::schema::ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let resolution = (
    project_schema.settings.resolution.width,
    project_schema.settings.resolution.height,
  );
  let frame_rate = project_schema.settings.frame_rate;
  let has_effects = !project_schema.effects.is_empty();

  let settings =
    business_logic::get_optimal_prerender_settings(resolution, frame_rate as f32, has_effects);

  Ok(serde_json::to_value(settings)?)
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
  let params = PrerenderSegmentParams {
    project_schema,
    start_time,
    end_time,
    output_path,
  };
  business_logic::prerender_segment_logic(&state, &params).await
}
