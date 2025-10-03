//! Tauri команды для работы с GPU

use super::business_logic;
use super::types::*;
use crate::video_compiler::core::gpu::GpuDetector;
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::VideoCompilerState;
use tauri::State;

/// Обнаружить доступные GPU
#[tauri::command]
pub async fn detect_gpus(state: State<'_, VideoCompilerState>) -> Result<Vec<GpuInfo>> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;

  gpu_service.detect_gpus().await
}

/// Получить возможности GPU
#[tauri::command]
pub async fn get_gpu_capabilities(
  _gpu_index: usize,
  state: State<'_, VideoCompilerState>,
) -> Result<crate::video_compiler::services::gpu_service::GpuCapabilities> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;

  gpu_service.get_capabilities().await
}

/// Проверить поддержку аппаратного ускорения
#[tauri::command]
pub async fn check_hardware_acceleration_support(
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;
  gpu_service.check_hardware_acceleration().await
}

/// Получить рекомендуемый GPU для рендеринга
#[tauri::command]
pub async fn get_recommended_gpu(state: State<'_, VideoCompilerState>) -> Result<Option<GpuInfo>> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;

  // Получаем рекомендуемый кодировщик и конвертируем в GpuInfo
  let recommended_encoder = gpu_service.get_recommended_encoder().await?;

  Ok(recommended_encoder.map(business_logic::create_recommended_gpu_info))
}

/// Установить предпочитаемый GPU для рендеринга
#[tauri::command]
pub async fn set_preferred_gpu(
  _gpu_index: usize,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Просто включаем аппаратное ускорение
  let mut settings = state.settings.write().await;
  settings.hardware_acceleration = true;

  Ok(())
}

/// Включить/выключить аппаратное ускорение
#[tauri::command]
pub async fn set_hardware_acceleration(
  enabled: bool,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut settings = state.settings.write().await;
  settings.hardware_acceleration = enabled;
  Ok(())
}

/// Получить текущий статус использования GPU
#[tauri::command]
pub async fn get_gpu_usage_status(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let settings = state.settings.read().await;

  let status =
    business_logic::create_gpu_usage_status(settings.hardware_acceleration, None, None, 0);

  Ok(serde_json::to_value(status)?)
}

/// Протестировать производительность GPU
#[tauri::command]
pub async fn benchmark_gpu(
  _gpu_index: usize,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Бенчмарк GPU не реализован, возвращаем заглушку
  let result = business_logic::create_benchmark_result_stub();
  Ok(serde_json::to_value(result)?)
}

/// Получить список поддерживаемых кодеков для GPU
#[tauri::command]
pub async fn get_gpu_supported_codecs(
  _gpu_index: usize,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  // Возвращаем стандартные кодеки для GPU
  Ok(business_logic::get_standard_gpu_codecs())
}

/// Автоматически выбрать лучший GPU
#[tauri::command]
pub async fn auto_select_gpu(state: State<'_, VideoCompilerState>) -> Result<Option<usize>> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;
  let recommended = gpu_service.get_recommended_encoder().await?;

  if recommended.is_some() {
    let mut settings = state.settings.write().await;
    settings.hardware_acceleration = true;
    Ok(business_logic::determine_gpu_index(true))
  } else {
    Ok(None)
  }
}

/// Получить детальную информацию о GPU кодировщике
#[tauri::command]
pub async fn get_gpu_encoder_details(encoder_type: String) -> Result<serde_json::Value> {
  let encoder = business_logic::parse_encoder_type(&encoder_type);
  let details = business_logic::create_gpu_encoder_details(&encoder, &encoder_type);
  Ok(serde_json::to_value(details)?)
}

/// Получить полные возможности GPU
#[tauri::command]
pub async fn get_gpu_capabilities_full(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let detector = GpuDetector::new(state.ffmpeg_path.read().await.clone());
  let capabilities = detector.get_gpu_capabilities().await?;

  let info = business_logic::create_gpu_capabilities_info(
    capabilities
      .available_encoders
      .iter()
      .map(|e| format!("{:?}", e))
      .collect(),
    capabilities.hardware_acceleration_supported,
    capabilities.recommended_encoder.map(|e| format!("{:?}", e)),
    capabilities.current_gpu.map(|g| g.name),
  );

  Ok(serde_json::to_value(info)?)
}
