//! State - Управление состоянием Video Compiler
//!
//! Модуль содержит основные типы и структуры для управления
//! состоянием компилятора, включая активные задачи рендеринга.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::video_compiler::cache::RenderCache;
use crate::video_compiler::progress::RenderProgress;
use crate::video_compiler::progress::RenderStatus;
use crate::video_compiler::renderer::VideoRenderer;
use crate::video_compiler::services::ServiceContainer;
use crate::video_compiler::CompilerSettings;

/// Метаданные активной задачи рендеринга
#[derive(Debug, Clone)]
pub struct RenderJobMetadata {
  pub project_name: String,
  pub output_path: String,
  pub created_at: String,
}

/// Активная задача рендеринга с метаданными
#[derive(Debug)]
pub struct ActiveRenderJob {
  pub renderer: VideoRenderer,
  pub metadata: RenderJobMetadata,
}

/// Состояние Video Compiler для Tauri
pub struct VideoCompilerState {
  /// Контейнер сервисов
  pub services: Arc<ServiceContainer>,

  /// Активные задачи рендеринга (для обратной совместимости)
  pub active_jobs: Arc<RwLock<HashMap<String, ActiveRenderJob>>>,

  /// Активные конвейеры рендеринга (новая архитектура)
  pub active_pipelines: Arc<
    RwLock<
      HashMap<
        String,
        Arc<RwLock<crate::video_compiler::core::pipeline_refactored::RenderPipeline>>,
      >,
    >,
  >,

  /// Менеджер кэша (для обратной совместимости)
  pub cache_manager: Arc<RwLock<RenderCache>>,

  /// Путь к FFmpeg (для обратной совместимости)
  pub ffmpeg_path: Arc<RwLock<String>>,

  /// Настройки компилятора (для обратной совместимости)
  pub settings: Arc<RwLock<CompilerSettings>>,
}

impl VideoCompilerState {
  pub async fn new() -> Self {
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let cache_manager = Arc::new(RwLock::new(RenderCache::new()));

    // Определяем путь к ffmpeg
    let ffmpeg_path = "ffmpeg".to_string(); // Будет обновлен позже через initialize()

    // Создаем контейнер сервисов
    let services = match ServiceContainer::new(
      ffmpeg_path.clone(),
      std::env::temp_dir().join("timeline-studio"),
      2,
    )
    .await
    {
      Ok(container) => container,
      Err(e) => {
        log::error!("Ошибка создания контейнера сервисов: {e:?}");
        // Создаем минимальный контейнер для fallback
        let cache = Arc::new(crate::video_compiler::services::CacheServiceImpl::new(
          std::env::temp_dir().join("timeline-studio"),
        ));

        return Self {
          services: Arc::new(ServiceContainer {
            render: Arc::new(crate::video_compiler::services::RenderServiceImpl::new(
              Arc::new(crate::video_compiler::services::FfmpegServiceImpl::new(
                ffmpeg_path.clone(),
              )),
              2,
              cache.clone(),
            )),
            cache: cache.clone(),
            gpu: Arc::new(crate::video_compiler::services::GpuServiceImpl::new(
              ffmpeg_path.clone(),
            )),
            preview: Arc::new(crate::video_compiler::services::PreviewServiceImpl::new(
              Arc::new(crate::video_compiler::services::FfmpegServiceImpl::new(
                ffmpeg_path.clone(),
              )),
            )),
            project: Arc::new(crate::video_compiler::services::ProjectServiceImpl::new()),
            ffmpeg: Arc::new(crate::video_compiler::services::FfmpegServiceImpl::new(
              ffmpeg_path.clone(),
            )),
            transition_ffmpeg: Arc::new(
              crate::video_compiler::services::TransitionFFmpegServiceImpl::new(Arc::new(
                crate::video_compiler::services::FfmpegServiceImpl::new(ffmpeg_path.clone()),
              )),
            ),
            metrics: crate::video_compiler::services::ServiceMetricsContainer {
              render: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "render-service".to_string(),
              )),
              cache: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "cache-service".to_string(),
              )),
              gpu: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "gpu-service".to_string(),
              )),
              preview: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "preview-service".to_string(),
              )),
              project: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "project-service".to_string(),
              )),
              ffmpeg: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "ffmpeg-service".to_string(),
              )),
              transition_ffmpeg: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "transition-ffmpeg-service".to_string(),
              )),
            },
          }),
          active_jobs: Arc::new(RwLock::new(HashMap::new())),
          active_pipelines: Arc::new(RwLock::new(HashMap::new())),
          cache_manager,
          ffmpeg_path: Arc::new(RwLock::new(ffmpeg_path)),
          settings,
        };
      }
    };

    // Инициализируем сервисы
    if let Err(e) = services.initialize_all().await {
      log::error!("Ошибка инициализации сервисов: {e:?}");
    }

    let services = Arc::new(services);

    Self {
      services,
      active_jobs: Arc::new(RwLock::new(HashMap::new())),
      active_pipelines: Arc::new(RwLock::new(HashMap::new())),
      cache_manager,
      ffmpeg_path: Arc::new(RwLock::new(ffmpeg_path)),
      settings,
    }
  }

  /// Обновить путь к FFmpeg во всех сервисах
  pub async fn update_ffmpeg_path(&self, new_path: String) {
    // Обновляем общий путь
    {
      let mut path = self.ffmpeg_path.write().await;
      *path = new_path.clone();
    }

    // Обновляем путь в сервисах
    self.services.update_ffmpeg_path(new_path);
  }
}

impl Default for VideoCompilerState {
  fn default() -> Self {
    // Создаем минимальное состояние для синхронного Default
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let cache_manager = Arc::new(RwLock::new(RenderCache::new()));

    // Создаем сервисы напрямую для синхронного Default
    let ffmpeg = Arc::new(crate::video_compiler::services::FfmpegServiceImpl::new(
      "ffmpeg".to_string(),
    ));
    let cache_service = Arc::new(crate::video_compiler::services::CacheServiceImpl::new(
      std::env::temp_dir().join("timeline-studio"),
    ));
    let gpu = Arc::new(crate::video_compiler::services::GpuServiceImpl::new(
      "ffmpeg".to_string(),
    ));
    let preview = Arc::new(crate::video_compiler::services::PreviewServiceImpl::new(
      ffmpeg.clone(),
    ));
    let project = Arc::new(crate::video_compiler::services::ProjectServiceImpl::new());
    let render = Arc::new(crate::video_compiler::services::RenderServiceImpl::new(
      ffmpeg.clone(),
      2,
      cache_service.clone(),
    ));
    let transition_ffmpeg =
      Arc::new(crate::video_compiler::services::TransitionFFmpegServiceImpl::new(ffmpeg.clone()));

    // Создаем метрики
    let metrics = crate::video_compiler::services::ServiceMetricsContainer {
      render: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "render-service".to_string(),
      )),
      cache: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "cache-service".to_string(),
      )),
      gpu: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "gpu-service".to_string(),
      )),
      preview: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "preview-service".to_string(),
      )),
      project: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "project-service".to_string(),
      )),
      ffmpeg: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "ffmpeg-service".to_string(),
      )),
      transition_ffmpeg: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "transition-ffmpeg-service".to_string(),
      )),
    };

    let services = ServiceContainer {
      render,
      cache: cache_service,
      gpu,
      preview,
      project,
      ffmpeg,
      transition_ffmpeg,
      metrics,
    };

    Self {
      services: Arc::new(services),
      active_jobs: Arc::new(RwLock::new(HashMap::new())),
      active_pipelines: Arc::new(RwLock::new(HashMap::new())),
      cache_manager,
      ffmpeg_path: Arc::new(RwLock::new("ffmpeg".to_string())),
      settings,
    }
  }
}

/// Информация о задаче рендеринга для фронтенда
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RenderJob {
  pub id: String,
  pub project_name: String,
  pub output_path: String,
  pub status: RenderStatus,
  pub created_at: String,
  pub progress: Option<RenderProgress>,
  pub error_message: Option<String>,
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::time::Duration;
  use tokio::time::timeout;

  #[test]
  fn test_render_job_metadata_creation() {
    let metadata = RenderJobMetadata {
      project_name: "Test Project".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      created_at: "2024-01-01T00:00:00Z".to_string(),
    };

    assert_eq!(metadata.project_name, "Test Project");
    assert_eq!(metadata.output_path, "/tmp/output.mp4");
    assert_eq!(metadata.created_at, "2024-01-01T00:00:00Z");
  }

  #[test]
  fn test_render_job_serialization() {
    let job = RenderJob {
      id: "job-123".to_string(),
      project_name: "Test Project".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      status: RenderStatus::Processing,
      created_at: "2024-01-01T00:00:00Z".to_string(),
      progress: None,
      error_message: None,
    };

    // Test serialization
    let serialized = serde_json::to_string(&job).unwrap();
    assert!(serialized.contains("job-123"));
    assert!(serialized.contains("Test Project"));
    assert!(serialized.contains("Processing"));

    // Test deserialization
    let deserialized: RenderJob = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.id, job.id);
    assert_eq!(deserialized.project_name, job.project_name);
    assert_eq!(deserialized.output_path, job.output_path);
  }

  #[test]
  fn test_render_job_with_progress() {
    let progress = RenderProgress {
      job_id: "job-with-progress".to_string(),
      stage: "encoding".to_string(),
      percentage: 10.0,
      current_frame: 100,
      total_frames: 1000,
      elapsed_time: std::time::Duration::from_secs(30),
      estimated_remaining: Some(std::time::Duration::from_secs(270)),
      status: RenderStatus::Processing,
      message: Some("Video encoding".to_string()),
    };

    let job = RenderJob {
      id: "job-with-progress".to_string(),
      project_name: "Progress Test".to_string(),
      output_path: "/tmp/progress.mp4".to_string(),
      status: RenderStatus::Processing,
      created_at: "2024-01-01T00:00:00Z".to_string(),
      progress: Some(progress),
      error_message: None,
    };

    assert!(job.progress.is_some());
    let prog = job.progress.unwrap();
    assert_eq!(prog.current_frame, 100);
    assert_eq!(prog.total_frames, 1000);
    assert_eq!(prog.stage, "encoding");
    assert_eq!(prog.message, Some("Video encoding".to_string()));
  }

  #[test]
  fn test_render_job_with_error() {
    let job = RenderJob {
      id: "failed-job".to_string(),
      project_name: "Failed Project".to_string(),
      output_path: "/tmp/failed.mp4".to_string(),
      status: RenderStatus::Failed("FFmpeg execution failed".to_string()),
      created_at: "2024-01-01T00:00:00Z".to_string(),
      progress: None,
      error_message: Some("FFmpeg execution failed".to_string()),
    };

    match job.status {
      RenderStatus::Failed(ref error) => {
        assert_eq!(error, "FFmpeg execution failed");
      }
      _ => panic!("Expected Failed status"),
    }
    assert!(job.error_message.is_some());
    assert_eq!(job.error_message.unwrap(), "FFmpeg execution failed");
  }

  #[tokio::test]
  async fn test_video_compiler_state_default() {
    let state = VideoCompilerState::default();

    // Test that all components are initialized
    assert!(state.services.get_render_service().is_some());
    assert!(state.services.get_cache_service().is_some());
    assert!(state.services.get_gpu_service().is_some());
    assert!(state.services.get_preview_service().is_some());
    assert!(state.services.get_project_service().is_some());
    assert!(state.services.get_ffmpeg_service().is_some());

    // Test initial state
    let active_jobs = state.active_jobs.read().await;
    assert!(active_jobs.is_empty());

    let active_pipelines = state.active_pipelines.read().await;
    assert!(active_pipelines.is_empty());

    let ffmpeg_path = state.ffmpeg_path.read().await;
    assert_eq!(ffmpeg_path.as_str(), "ffmpeg");
  }

  #[tokio::test]
  async fn test_video_compiler_state_new() {
    // Test with timeout to avoid hanging
    let result = timeout(Duration::from_secs(10), VideoCompilerState::new()).await;
    assert!(
      result.is_ok(),
      "VideoCompilerState::new() should complete within timeout"
    );

    let state = result.unwrap();

    // Test that all services are properly initialized
    assert!(state.services.get_render_service().is_some());
    assert!(state.services.get_cache_service().is_some());
    assert!(state.services.get_gpu_service().is_some());
    assert!(state.services.get_preview_service().is_some());
    assert!(state.services.get_project_service().is_some());
    assert!(state.services.get_ffmpeg_service().is_some());

    // Test that collections are empty initially
    let active_jobs = state.active_jobs.read().await;
    assert!(active_jobs.is_empty());

    let active_pipelines = state.active_pipelines.read().await;
    assert!(active_pipelines.is_empty());
  }

  #[tokio::test]
  async fn test_update_ffmpeg_path() {
    let state = VideoCompilerState::default();
    let new_path = "/usr/local/bin/ffmpeg".to_string();

    // Update FFmpeg path
    state.update_ffmpeg_path(new_path.clone()).await;

    // Verify the path was updated
    let ffmpeg_path = state.ffmpeg_path.read().await;
    assert_eq!(ffmpeg_path.as_str(), new_path);
  }

  #[tokio::test]
  async fn test_active_jobs_management() {
    let state = VideoCompilerState::default();

    // Initially empty
    {
      let jobs = state.active_jobs.read().await;
      assert!(jobs.is_empty());
    }

    // Test basic job management without VideoRenderer creation
    // (since VideoRenderer requires complex setup)
    let metadata = RenderJobMetadata {
      project_name: "Test Job".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      created_at: chrono::Utc::now().to_rfc3339(),
    };

    // Test metadata creation and cloning
    let cloned_metadata = metadata.clone();
    assert_eq!(metadata.project_name, cloned_metadata.project_name);
    assert_eq!(metadata.output_path, cloned_metadata.output_path);
  }

  #[tokio::test]
  async fn test_multiple_concurrent_metadata() {
    let state = VideoCompilerState::default();

    // Test concurrent access to state components
    let mut handles = vec![];

    for i in 0..5 {
      let state_clone = state.active_jobs.clone();
      let handle = tokio::spawn(async move {
        // Test concurrent access without creating VideoRenderer
        let jobs = state_clone.read().await;
        assert!(jobs.is_empty()); // All should start empty
        drop(jobs);

        // Return the index for verification
        i
      });
      handles.push(handle);
    }

    // Wait for all tasks to complete
    let mut results = Vec::new();
    for handle in handles {
      results.push(handle.await.unwrap());
    }

    // Verify all tasks completed
    assert_eq!(results.len(), 5);
    for i in 0..5 {
      assert!(results.contains(&i));
    }
  }

  #[tokio::test]
  async fn test_state_components_independence() {
    let state = VideoCompilerState::default();

    // Test that different components can be accessed independently
    let _cache = state.cache_manager.read().await;
    let _settings = state.settings.read().await;
    let _ffmpeg_path = state.ffmpeg_path.read().await;
    let _active_jobs = state.active_jobs.read().await;
    let _active_pipelines = state.active_pipelines.read().await;
  }

  #[tokio::test]
  async fn test_compiler_settings_integration() {
    let state = VideoCompilerState::default();

    // Test reading default settings
    {
      let settings = state.settings.read().await;
      assert!(
        settings.temp_directory.exists()
          || settings.temp_directory.to_string_lossy().contains("tmp")
      );
    }

    // Test updating settings
    {
      let mut settings = state.settings.write().await;
      settings.hardware_acceleration = true;
      settings.max_concurrent_jobs = 4;
    }

    // Verify settings were updated
    {
      let settings = state.settings.read().await;
      assert!(settings.hardware_acceleration);
      assert_eq!(settings.max_concurrent_jobs, 4);
    }
  }

  #[tokio::test]
  async fn test_render_cache_integration() {
    let state = VideoCompilerState::default();

    // Test cache access
    {
      let cache = state.cache_manager.read().await;
      // Cache should be empty initially
      assert_eq!(cache.get_stats().preview_hits, 0);
      assert_eq!(cache.get_stats().render_hits, 0);
    }

    // Test cache operations through state
    {
      let mut cache = state.cache_manager.write().await;
      cache.clear_all().await;
      // After clearing, cache should still be accessible
      assert_eq!(cache.get_stats().preview_hits, 0);
    }
  }

  #[test]
  fn test_render_job_metadata_clone() {
    let metadata1 = RenderJobMetadata {
      project_name: "Original".to_string(),
      output_path: "/original/path".to_string(),
      created_at: "2024-01-01".to_string(),
    };

    let metadata2 = metadata1.clone();

    assert_eq!(metadata1.project_name, metadata2.project_name);
    assert_eq!(metadata1.output_path, metadata2.output_path);
    assert_eq!(metadata1.created_at, metadata2.created_at);
  }

  #[test]
  fn test_render_job_debug() {
    let job = RenderJob {
      id: "debug-test".to_string(),
      project_name: "Debug Project".to_string(),
      output_path: "/tmp/debug.mp4".to_string(),
      status: RenderStatus::Processing,
      created_at: "2024-01-01".to_string(),
      progress: None,
      error_message: None,
    };

    let debug_str = format!("{job:?}");
    assert!(debug_str.contains("debug-test"));
    assert!(debug_str.contains("Debug Project"));
    assert!(debug_str.contains("Processing"));
  }
}
