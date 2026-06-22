//! Сервисный слой Video Compiler
//!
//! Этот модуль содержит бизнес-логику, отделенную от Tauri команд.
//! Каждый сервис представляет собой независимый компонент с четко определенными обязанностями.

pub mod cache_service;
pub mod cache_service_with_metrics;
pub mod ffmpeg_service;
pub mod gpu_service;
pub mod monitoring;
pub mod preview_service;
pub mod project_service;
pub mod render_service;
pub mod transition_ffmpeg_service;

// Re-export основных типов и трейтов
pub use cache_service::{CacheService, CacheServiceImpl};
pub use ffmpeg_service::{FfmpegService, FfmpegServiceImpl, FileInfo};
pub use gpu_service::{GpuService, GpuServiceImpl};
pub use monitoring::{ServiceMetrics, METRICS};
pub use preview_service::{PreviewService, PreviewServiceImpl};
pub use project_service::{ProjectService, ProjectServiceImpl};
pub use render_service::{RenderService, RenderServiceImpl};
pub use transition_ffmpeg_service::{
  TransitionExportResult, TransitionFFmpegCommand, TransitionFFmpegConfig, TransitionFFmpegService,
  TransitionFFmpegServiceImpl, TransitionStatus,
};

use ts_render::video_compiler::Result;
use async_trait::async_trait;
use std::sync::Arc;

/// Основной трейт для всех сервисов
#[async_trait]
pub trait Service: Send + Sync {
  /// Инициализация сервиса
  async fn initialize(&self) -> Result<()>;

  /// Проверка готовности сервиса
  async fn health_check(&self) -> Result<()>;

  /// Остановка сервиса
  async fn shutdown(&self) -> Result<()>;
}

/// Контейнер для всех сервисов Video Compiler
pub struct ServiceContainer {
  pub render: Arc<dyn RenderService>,
  pub cache: Arc<dyn CacheService>,
  pub gpu: Arc<dyn GpuService>,
  pub preview: Arc<dyn PreviewService>,
  pub project: Arc<dyn ProjectService>,
  pub ffmpeg: Arc<dyn FfmpegService>,
  pub transition_ffmpeg: Arc<dyn TransitionFFmpegService>,
  /// Метрики для каждого сервиса
  pub metrics: ServiceMetricsContainer,
}

/// Контейнер метрик для всех сервисов
pub struct ServiceMetricsContainer {
  pub render: Arc<ServiceMetrics>,
  pub cache: Arc<ServiceMetrics>,
  pub gpu: Arc<ServiceMetrics>,
  pub preview: Arc<ServiceMetrics>,
  pub project: Arc<ServiceMetrics>,
  pub ffmpeg: Arc<ServiceMetrics>,
  pub transition_ffmpeg: Arc<ServiceMetrics>,
}

impl ServiceContainer {
  /// Создание нового контейнера сервисов
  pub async fn new(
    ffmpeg_path: String,
    cache_dir: std::path::PathBuf,
    max_concurrent_jobs: usize,
  ) -> Result<Self> {
    // Создаем сервисы
    let ffmpeg = Arc::new(FfmpegServiceImpl::new(ffmpeg_path.clone()));
    let cache = Arc::new(CacheServiceImpl::new(cache_dir));
    let gpu = Arc::new(GpuServiceImpl::new(ffmpeg_path));
    let preview = Arc::new(PreviewServiceImpl::new(ffmpeg.clone()));
    let project = Arc::new(ProjectServiceImpl::new());
    let transition_ffmpeg = Arc::new(TransitionFFmpegServiceImpl::new(ffmpeg.clone()));
    let render = Arc::new(RenderServiceImpl::new(
      ffmpeg.clone(),
      max_concurrent_jobs,
      cache.clone(),
    ));

    // Регистрируем метрики для каждого сервиса
    let metrics = ServiceMetricsContainer {
      render: METRICS.register_service("render-service".to_string()).await,
      cache: METRICS.register_service("cache-service".to_string()).await,
      gpu: METRICS.register_service("gpu-service".to_string()).await,
      preview: METRICS
        .register_service("preview-service".to_string())
        .await,
      project: METRICS
        .register_service("project-service".to_string())
        .await,
      ffmpeg: METRICS.register_service("ffmpeg-service".to_string()).await,
      transition_ffmpeg: METRICS
        .register_service("transition-ffmpeg-service".to_string())
        .await,
    };

    Ok(Self {
      render,
      cache,
      gpu,
      preview,
      project,
      ffmpeg,
      transition_ffmpeg,
      metrics,
    })
  }

  /// Инициализация всех сервисов
  pub async fn initialize_all(&self) -> Result<()> {
    // Инициализируем сервисы в правильном порядке
    self.ffmpeg.initialize().await?;
    self.cache.initialize().await?;
    self.gpu.initialize().await?;
    self.preview.initialize().await?;
    self.project.initialize().await?;
    self.transition_ffmpeg.initialize().await?;
    self.render.initialize().await?;

    log::info!("Все сервисы успешно инициализированы");
    Ok(())
  }

  /// Проверка здоровья всех сервисов
  pub async fn health_check_all(&self) -> Result<()> {
    self.ffmpeg.health_check().await?;
    self.cache.health_check().await?;
    self.gpu.health_check().await?;
    self.preview.health_check().await?;
    self.project.health_check().await?;
    self.transition_ffmpeg.health_check().await?;
    self.render.health_check().await?;

    Ok(())
  }

  /// Остановка всех сервисов
  pub async fn shutdown_all(&self) -> Result<()> {
    // Останавливаем сервисы в обратном порядке
    self.render.shutdown().await?;
    self.transition_ffmpeg.shutdown().await?;
    self.project.shutdown().await?;
    self.preview.shutdown().await?;
    self.gpu.shutdown().await?;
    self.cache.shutdown().await?;
    self.ffmpeg.shutdown().await?;

    log::info!("Все сервисы успешно остановлены");
    Ok(())
  }

  /// Получить RenderService
  pub fn get_render_service(&self) -> Option<Arc<dyn RenderService>> {
    Some(self.render.clone())
  }

  /// Получить CacheService
  pub fn get_cache_service(&self) -> Option<Arc<dyn CacheService>> {
    Some(self.cache.clone())
  }

  /// Получить GpuService
  pub fn get_gpu_service(&self) -> Option<Arc<dyn GpuService>> {
    Some(self.gpu.clone())
  }

  /// Получить PreviewService
  pub fn get_preview_service(&self) -> Option<Arc<dyn PreviewService>> {
    Some(self.preview.clone())
  }

  /// Получить ProjectService
  pub fn get_project_service(&self) -> Option<Arc<dyn ProjectService>> {
    Some(self.project.clone())
  }

  /// Получить FfmpegService
  pub fn get_ffmpeg_service(&self) -> Option<Arc<dyn FfmpegService>> {
    Some(self.ffmpeg.clone())
  }

  /// Получить TransitionFFmpegService
  pub fn get_transition_ffmpeg_service(&self) -> Option<Arc<dyn TransitionFFmpegService>> {
    Some(self.transition_ffmpeg.clone())
  }

  /// Обновить путь к FFmpeg во всех сервисах
  pub fn update_ffmpeg_path(&self, _new_path: String) {
    // В текущей архитектуре сервисы создаются один раз при инициализации
    // и не поддерживают динамическое обновление пути к FFmpeg.
    // Эта функция оставлена для совместимости.
    log::warn!(
      "update_ffmpeg_path вызван, но динамическое обновление пути к FFmpeg не поддерживается текущей архитектурой"
    );
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::TempDir;

  #[tokio::test]
  async fn test_service_container_creation() {
    let temp_dir = TempDir::new().unwrap();
    let container =
      ServiceContainer::new("ffmpeg".to_string(), temp_dir.path().to_path_buf(), 4).await;

    assert!(container.is_ok());
  }
}
