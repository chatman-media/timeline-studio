//! Моки для тестирования video_compiler
//!
//! Предоставляет мок-реализации для внешних зависимостей и сервисов.

use crate::video_compiler::{
  core::{
    cache::{MediaMetadata, PreviewData, RenderCache, RenderCacheData},
    gpu::{GpuCapabilities, GpuEncoder, GpuInfo},
    progress::{RenderProgress, RenderStatus},
  },
  error::Result,
  CompilerSettings,
};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

/// Мок для RenderCache
#[allow(dead_code)]
pub struct MockRenderCache {
  preview_cache: HashMap<String, PreviewData>,
  metadata_cache: HashMap<String, MediaMetadata>,
  render_cache: HashMap<String, RenderCacheData>,
}

impl Default for MockRenderCache {
  fn default() -> Self {
    Self::new()
  }
}

impl MockRenderCache {
  #[allow(dead_code)]
  pub fn new() -> Self {
    Self {
      preview_cache: HashMap::new(),
      metadata_cache: HashMap::new(),
      render_cache: HashMap::new(),
    }
  }

  #[allow(dead_code)]
  pub async fn get_preview(&self, key: &str) -> Option<&PreviewData> {
    self.preview_cache.get(key)
  }

  #[allow(dead_code)]
  pub async fn set_preview(&mut self, key: String, data: PreviewData) {
    self.preview_cache.insert(key, data);
  }

  #[allow(dead_code)]
  pub async fn get_metadata(&self, key: &str) -> Option<&MediaMetadata> {
    self.metadata_cache.get(key)
  }

  #[allow(dead_code)]
  pub async fn set_metadata(&mut self, key: String, data: MediaMetadata) {
    self.metadata_cache.insert(key, data);
  }
}

/// Мок GPU детектор
pub struct MockGpuDetector {
  pub mock_capabilities: GpuCapabilities,
}

impl Default for MockGpuDetector {
  fn default() -> Self {
    Self::new()
  }
}

impl MockGpuDetector {
  pub fn new() -> Self {
    Self {
      mock_capabilities: GpuCapabilities {
        available_encoders: vec![GpuEncoder::Software, GpuEncoder::Nvenc],
        recommended_encoder: Some(GpuEncoder::Nvenc),
        current_gpu: Some(GpuInfo {
          name: "Mock GPU".to_string(),
          driver_version: Some("1.0.0".to_string()),
          memory_total: Some(8192 * 1024 * 1024),
          memory_used: Some(2048 * 1024 * 1024),
          utilization: Some(50.0),
          encoder_type: GpuEncoder::Nvenc,
          supported_codecs: vec!["h264".to_string(), "h265".to_string()],
        }),
        hardware_acceleration_supported: true,
      },
    }
  }

  #[allow(dead_code)]
  pub async fn get_gpu_capabilities(&self) -> Result<GpuCapabilities> {
    Ok(self.mock_capabilities.clone())
  }
}

/// Создание мок состояния для тестов
#[allow(dead_code)]
pub async fn create_mock_state() -> crate::video_compiler::commands::state::VideoCompilerState {
  let settings = Arc::new(RwLock::new(CompilerSettings::default()));
  let cache_manager = Arc::new(RwLock::new(RenderCache::new()));
  let active_jobs = Arc::new(RwLock::new(HashMap::new()));
  let ffmpeg_path = Arc::new(RwLock::new("ffmpeg".to_string()));

  // Создаем контейнер сервисов для теста
  let services = crate::video_compiler::services::ServiceContainer::new(
    "ffmpeg".to_string(),
    std::env::temp_dir().join("test-timeline-studio"),
    2,
  )
  .await
  .unwrap();

  crate::video_compiler::commands::state::VideoCompilerState {
    services: Arc::new(services),
    active_jobs,
    active_pipelines: Arc::new(RwLock::new(HashMap::new())),
    cache_manager,
    ffmpeg_path,
    settings,
  }
}

/// Создание мок прогресса рендеринга
pub fn create_mock_render_progress() -> RenderProgress {
  RenderProgress {
    job_id: "test-job-123".to_string(),
    stage: "rendering".to_string(),
    percentage: 50.0,
    current_frame: 500,
    total_frames: 1000,
    elapsed_time: Duration::from_secs(30),
    estimated_remaining: Some(Duration::from_secs(30)),
    status: RenderStatus::Processing,
    message: Some("Rendering video...".to_string()),
  }
}

/// Создание мок результата превью
pub fn create_mock_preview_result() -> crate::video_compiler::core::preview::PreviewResult {
  crate::video_compiler::core::preview::PreviewResult {
    _timestamp: 5.0,
    result: Ok(vec![0u8; 1024]), // Мок данных изображения
  }
}
