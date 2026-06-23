//! Tauri команды для работы с GPU

use super::types::*;
use ts_render::video_compiler::core::error::Result;
use ts_render_services::VideoCompilerState;
use tauri::State;
use ts_render_services::gpu::commands_impl as impl_;

/// Обнаружить доступные GPU
#[tauri::command]
pub async fn detect_gpus(state: State<'_, VideoCompilerState>) -> Result<Vec<GpuInfo>> {
  impl_::detect_gpus(&state).await
}

/// Получить возможности GPU
#[tauri::command]
pub async fn get_gpu_capabilities(
  _gpu_index: usize,
  state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::services::gpu_service::GpuCapabilities> {
  impl_::get_gpu_capabilities(&state).await
}

/// Проверить поддержку аппаратного ускорения
#[tauri::command]
pub async fn check_hardware_acceleration_support(
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  impl_::check_hardware_acceleration_support(&state).await
}

/// Проверить доступность GPU (алиас для check_hardware_acceleration_support)
#[tauri::command]
pub async fn check_gpu_availability(state: State<'_, VideoCompilerState>) -> Result<bool> {
  impl_::check_hardware_acceleration_support(&state).await
}

/// Получить рекомендуемый GPU для рендеринга
#[tauri::command]
pub async fn get_recommended_gpu(state: State<'_, VideoCompilerState>) -> Result<Option<GpuInfo>> {
  impl_::get_recommended_gpu(&state).await
}

/// Установить предпочитаемый GPU для рендеринга
#[tauri::command]
pub async fn set_preferred_gpu(
  _gpu_index: usize,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::set_preferred_gpu(&state).await
}

/// Включить/выключить аппаратное ускорение
#[tauri::command]
pub async fn set_hardware_acceleration(
  enabled: bool,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::set_hardware_acceleration(&state, enabled).await
}

/// Получить текущий статус использования GPU
#[tauri::command]
pub async fn get_gpu_usage_status(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_gpu_usage_status(&state).await
}

/// Протестировать производительность GPU
#[tauri::command]
pub async fn benchmark_gpu(
  _gpu_index: usize,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  use ts_render_services::gpu::business_logic::create_benchmark_result_stub;
  let result = create_benchmark_result_stub();
  Ok(serde_json::to_value(result)?)
}

/// Получить список поддерживаемых кодеков для GPU
#[tauri::command]
pub async fn get_gpu_supported_codecs(
  _gpu_index: usize,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use ts_render_services::gpu::business_logic::get_standard_gpu_codecs;
  Ok(get_standard_gpu_codecs())
}

/// Автоматически выбрать лучший GPU
#[tauri::command]
pub async fn auto_select_gpu(state: State<'_, VideoCompilerState>) -> Result<Option<usize>> {
  impl_::auto_select_gpu(&state).await
}

/// Получить детальную информацию о GPU кодировщике
#[tauri::command]
pub async fn get_gpu_encoder_details(encoder_type: String) -> Result<serde_json::Value> {
  use ts_render_services::gpu::business_logic::{create_gpu_encoder_details, parse_encoder_type};
  let encoder = parse_encoder_type(&encoder_type);
  let details = create_gpu_encoder_details(&encoder, &encoder_type);
  Ok(serde_json::to_value(details)?)
}

/// Получить полные возможности GPU
#[tauri::command]
pub async fn get_gpu_capabilities_full(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_gpu_capabilities_full(&state).await
}
