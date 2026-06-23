//! Tauri команды для работы с конвейером рендеринга

use super::types::*;
use ts_render::video_compiler::error::Result;
use ts_render::video_compiler::schema::ProjectSchema;
use ts_render_services::VideoCompilerState;
use tauri::State;
use ts_render_services::pipeline::commands_impl as impl_;

/// Создать и выполнить конвейер рендеринга
#[tauri::command]
pub async fn create_and_execute_pipeline(
  project: ProjectSchema,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::create_and_execute_pipeline(project, output_path, &state).await
}

/// Получить информацию о конвейере
#[tauri::command]
pub async fn get_pipeline_info(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<PipelineInfo> {
  impl_::get_pipeline_info(job_id, &state).await
}

/// Отменить выполнение конвейера
#[tauri::command]
pub async fn cancel_pipeline(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  impl_::cancel_pipeline(job_id, &state).await
}

/// Получить статистику конвейера
#[tauri::command]
pub async fn get_pipeline_statistics(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_pipeline_statistics(job_id, &state).await
}

/// Получить контекст конвейера
#[tauri::command]
pub async fn get_pipeline_context(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_pipeline_context(job_id, &state).await
}

/// Обновить настройки конвейера
#[tauri::command]
pub async fn update_pipeline_settings(
  job_id: String,
  new_settings: ts_render::video_compiler::CompilerSettings,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::update_pipeline_settings(job_id, new_settings, &state).await
}

/// Валидировать конфигурацию конвейера
#[tauri::command]
pub async fn validate_pipeline_configuration(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  impl_::validate_pipeline_configuration(job_id, &state).await
}

/// Получить активные конвейеры
#[tauri::command]
pub async fn get_active_pipelines(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  impl_::get_active_pipelines(&state).await
}

// TODO: Реализовать методы pause/resume в RenderPipeline
// /// Приостановить выполнение конвейера
// #[tauri::command]
// pub async fn pause_pipeline(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
//   impl_::pause_pipeline(job_id, &state).await
// }

// /// Возобновить выполнение конвейера
// #[tauri::command]
// pub async fn resume_pipeline(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
//   impl_::resume_pipeline(job_id, &state).await
// }

/// Очистить завершенные конвейеры
#[tauri::command]
pub async fn cleanup_finished_pipelines(state: State<'_, VideoCompilerState>) -> Result<usize> {
  impl_::cleanup_finished_pipelines(&state).await
}

/// Добавить кастомный этап в конвейер
#[tauri::command]
pub async fn insert_pipeline_stage(
  job_id: String,
  stage_name: String,
  index: usize,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::insert_pipeline_stage(job_id, stage_name, index, &state).await
}

/// Удалить этап из конвейера
#[tauri::command]
pub async fn remove_pipeline_stage(
  job_id: String,
  stage_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  impl_::remove_pipeline_stage(job_id, stage_name, &state).await
}

/// Создать конвейер с помощью Builder
#[tauri::command]
pub async fn build_custom_pipeline(
  project: ProjectSchema,
  output_path: String,
  skip_defaults: bool,
  custom_stages: Vec<String>,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::build_custom_pipeline(project, output_path, skip_defaults, custom_stages, &state).await
}

/// Получить сводку выполнения конвейера
#[tauri::command]
pub async fn get_pipeline_execution_summary(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_pipeline_execution_summary(job_id, &state).await
}

/// Получить прогресс конвейера
#[tauri::command]
pub async fn get_pipeline_progress(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  impl_::get_pipeline_progress(job_id, &state).await
}

/// Очистить завершенные конвейеры (старое имя для совместимости)
#[tauri::command]
pub async fn cleanup_completed_pipelines(state: State<'_, VideoCompilerState>) -> Result<usize> {
  impl_::cleanup_completed_pipelines(&state).await
}

// Additional Pipeline Commands

/// Получить изменяемый контекст пайплайна
#[tauri::command]
pub async fn get_pipeline_context_mutable(
  state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::pipeline::business_logic::PipelineContextInfo> {
  impl_::get_pipeline_context_mutable(&state).await
}

/// Установить пользовательские данные в контекст пайплайна
#[tauri::command]
pub async fn set_pipeline_user_data(
  params: ts_render_services::pipeline::business_logic::SetUserDataParams,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  impl_::set_pipeline_user_data(params, &state).await
}

/// Получить пользовательские данные из контекста пайплайна
#[tauri::command]
pub async fn get_pipeline_user_data(
  key: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  impl_::get_pipeline_user_data(key, &state).await
}

/// Проверить, следует ли использовать аппаратное ускорение для кодека
#[tauri::command]
pub async fn should_use_hardware_acceleration_for_codec(
  codec: String,
  state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::pipeline::business_logic::HardwareAccelerationInfo> {
  impl_::should_use_hardware_acceleration_for_codec(codec, &state).await
}

/// Проверить, нужно ли использовать аппаратное ускорение для кодека (альтернативное имя)
#[tauri::command]
pub async fn check_should_use_hardware_acceleration_for_codec(
  codec: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  impl_::check_should_use_hardware_acceleration_for_codec(codec, &state).await
}

/// Установить пользовательские данные в контекст пайплайна (прямое использование)
#[tauri::command]
pub async fn set_pipeline_user_data_direct(
  key: String,
  value: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  impl_::set_pipeline_user_data_direct(key, value, &state).await
}

/// Получить пользовательские данные из контекста пайплайна (прямое использование)
#[tauri::command]
pub async fn get_pipeline_user_data_direct(
  key: String,
  default_value: Option<serde_json::Value>,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  impl_::get_pipeline_user_data_direct(key, default_value, &state).await
}

/// Сгенерировать шумовой клип (расширенная версия)
#[tauri::command]
pub async fn generate_noise_clip_advanced(
  duration: f64,
  width: u32,
  height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::generate_noise_clip_advanced(duration, width, height, &state).await
}

/// Сгенерировать градиентный клип (расширенная версия)
#[tauri::command]
pub async fn generate_gradient_clip_advanced(
  duration: f64,
  width: u32,
  height: u32,
  start_color: String,
  end_color: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::generate_gradient_clip_advanced(duration, width, height, start_color, end_color, &state)
    .await
}

/// Сгенерировать шумовой клип напрямую
#[tauri::command]
pub async fn generate_noise_clip_direct(
  duration: f64,
  output_filename: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::generate_noise_clip_direct(duration, output_filename, &state).await
}

/// Сгенерировать градиентный клип напрямую
#[tauri::command]
pub async fn generate_gradient_clip_direct(
  start_color: Option<String>,
  duration: f64,
  output_filename: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::generate_gradient_clip_direct(start_color, duration, output_filename, &state).await
}
