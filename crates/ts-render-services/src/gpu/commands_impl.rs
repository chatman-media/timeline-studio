//! Реализация команд GPU — принимают &VideoCompilerState

use super::business_logic;
use super::types::*;
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};
use ts_render::video_compiler::core::gpu::GpuDetector;
use crate::VideoCompilerState;

/// Обнаружить доступные GPU
pub async fn detect_gpus(state: &VideoCompilerState) -> Result<Vec<GpuInfo>> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;

  gpu_service.detect_gpus().await
}

/// Получить возможности GPU
pub async fn get_gpu_capabilities(
  state: &VideoCompilerState,
) -> Result<crate::services::gpu_service::GpuCapabilities> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;

  gpu_service.get_capabilities().await
}

/// Проверить поддержку аппаратного ускорения
pub async fn check_hardware_acceleration_support(state: &VideoCompilerState) -> Result<bool> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;
  gpu_service.check_hardware_acceleration().await
}

/// Получить рекомендуемый GPU для рендеринга
pub async fn get_recommended_gpu(state: &VideoCompilerState) -> Result<Option<GpuInfo>> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;

  let recommended_encoder = gpu_service.get_recommended_encoder().await?;
  Ok(recommended_encoder.map(business_logic::create_recommended_gpu_info))
}

/// Установить предпочитаемый GPU для рендеринга
pub async fn set_preferred_gpu(state: &VideoCompilerState) -> Result<()> {
  let mut settings = state.settings.write().await;
  settings.hardware_acceleration = true;
  Ok(())
}

/// Включить/выключить аппаратное ускорение
pub async fn set_hardware_acceleration(state: &VideoCompilerState, enabled: bool) -> Result<()> {
  let mut settings = state.settings.write().await;
  settings.hardware_acceleration = enabled;
  Ok(())
}

/// Получить текущий статус использования GPU
pub async fn get_gpu_usage_status(state: &VideoCompilerState) -> Result<serde_json::Value> {
  let settings = state.settings.read().await;
  let status =
    business_logic::create_gpu_usage_status(settings.hardware_acceleration, None, None, 0);
  Ok(serde_json::to_value(status)?)
}

/// Автоматически выбрать лучший GPU
pub async fn auto_select_gpu(state: &VideoCompilerState) -> Result<Option<usize>> {
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

/// Получить полные возможности GPU
pub async fn get_gpu_capabilities_full(state: &VideoCompilerState) -> Result<serde_json::Value> {
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
