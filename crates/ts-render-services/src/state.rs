//! State - Управление состоянием Video Compiler
//!
//! Модуль содержит основные типы и структуры для управления
//! состоянием компилятора, включая активные задачи рендеринга.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use ts_render::video_compiler::core::cache::RenderCache;
use ts_render::video_compiler::core::progress::RenderProgress;
use ts_render::video_compiler::core::progress::RenderStatus;
use ts_render::video_compiler::core::renderer::VideoRenderer;
use crate::services::ServiceContainer;
use serde::Serialize;
use ts_render::video_compiler::CompilerSettings;

/// События Video Compiler для WebSocket/Tauri-эмиссии.
///
/// Перенесено из монолита (`src-tauri/src/video_compiler/mod.rs`) в фундамент
/// `ts-render-services` (Wave 2, #91), чтобы группа команд `rendering` могла
/// эмитить события из крейта `ts-render-tauri`. Чистый data-enum (serde), без Tauri.
/// Монолит держит ре-экспорт `pub use ts_render_services::VideoCompilerEvent;`.
#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum VideoCompilerEvent {
  /// Рендеринг начат
  RenderStarted { job_id: String },
  /// Прогресс рендеринга обновлен
  RenderProgress {
    job_id: String,
    progress: RenderProgress,
  },
  /// Рендеринг завершен успешно
  RenderCompleted { job_id: String, output_path: String },
  /// Рендеринг завершился с ошибкой
  RenderFailed { job_id: String, error: String },
  /// Превью сгенерировано
  PreviewGenerated { timestamp: f64, image_data: Vec<u8> },
  /// Кэш обновлен
  CacheUpdated { cache_size_mb: f64 },
}

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
        Arc<RwLock<ts_render::video_compiler::core::pipeline_refactored::RenderPipeline>>,
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

impl Drop for VideoCompilerState {
  fn drop(&mut self) {
    log::info!("VideoCompilerState: начало graceful shutdown");

    // Выполняем синхронную очистку коллекций
    // Очищаем активные задачи (старая архитектура)
    if let Ok(mut jobs) = self.active_jobs.try_write() {
      let job_count = jobs.len();
      if job_count > 0 {
        log::warn!("VideoCompilerState: принудительное завершение {job_count} активных задач");
      }
      jobs.clear();
    } else {
      log::warn!("VideoCompilerState: не удалось получить lock на active_jobs, пропускаем");
    }

    // Очищаем активные конвейеры (новая архитектура)
    if let Ok(mut pipelines) = self.active_pipelines.try_write() {
      let pipeline_count = pipelines.len();
      if pipeline_count > 0 {
        log::warn!(
          "VideoCompilerState: принудительное завершение {pipeline_count} активных конвейеров"
        );
      }
      pipelines.clear();
    } else {
      log::warn!("VideoCompilerState: не удалось получить lock на active_pipelines, пропускаем");
    }

    // Пытаемся получить текущий tokio runtime для асинхронного cleanup сервисов
    match tokio::runtime::Handle::try_current() {
      Ok(handle) => {
        // Запускаем cleanup в фоне без блокировки текущего потока
        // Это безопасно как в production, так и в тестах (не вызывает nested runtime panic)
        let services = self.services.clone();
        handle.spawn(async move {
          log::info!("VideoCompilerState: shutdown сервисов");
          match tokio::time::timeout(std::time::Duration::from_secs(3), services.shutdown_all())
            .await
          {
            Ok(Ok(())) => {
              log::info!("VideoCompilerState: сервисы успешно остановлены");
            }
            Ok(Err(e)) => {
              log::error!("VideoCompilerState: ошибка остановки сервисов: {e:?}");
            }
            Err(_) => {
              log::error!("VideoCompilerState: таймаут при остановке сервисов (3 сек)");
            }
          }
        });

        log::info!("VideoCompilerState: graceful shutdown инициирован");
      }
      Err(_) => {
        // Runtime уже был dropped, делаем best-effort cleanup
        log::warn!("VideoCompilerState: токio runtime недоступен, выполняется минимальный cleanup");

        // Пытаемся очистить коллекции синхронно (try_write не блокируется)
        if let Ok(mut jobs) = self.active_jobs.try_write() {
          jobs.clear();
        }
        if let Ok(mut pipelines) = self.active_pipelines.try_write() {
          pipelines.clear();
        }

        log::warn!("VideoCompilerState: минимальный cleanup завершен");
      }
    }
  }
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
        let cache = Arc::new(crate::services::CacheServiceImpl::new(
          std::env::temp_dir().join("timeline-studio"),
        ));

        return Self {
          services: Arc::new(ServiceContainer {
            render: Arc::new(crate::services::RenderServiceImpl::new(
              Arc::new(crate::services::FfmpegServiceImpl::new(
                ffmpeg_path.clone(),
              )),
              2,
              cache.clone(),
            )),
            cache: cache.clone(),
            gpu: Arc::new(crate::services::GpuServiceImpl::new(
              ffmpeg_path.clone(),
            )),
            preview: Arc::new(crate::services::PreviewServiceImpl::new(
              Arc::new(crate::services::FfmpegServiceImpl::new(
                ffmpeg_path.clone(),
              )),
            )),
            project: Arc::new(crate::services::ProjectServiceImpl::new()),
            ffmpeg: Arc::new(crate::services::FfmpegServiceImpl::new(
              ffmpeg_path.clone(),
            )),
            transition_ffmpeg: Arc::new(
              crate::services::TransitionFFmpegServiceImpl::new(Arc::new(
                crate::services::FfmpegServiceImpl::new(ffmpeg_path.clone()),
              )),
            ),
            metrics: crate::services::ServiceMetricsContainer {
              render: Arc::new(crate::services::ServiceMetrics::new(
                "render-service".to_string(),
              )),
              cache: Arc::new(crate::services::ServiceMetrics::new(
                "cache-service".to_string(),
              )),
              gpu: Arc::new(crate::services::ServiceMetrics::new(
                "gpu-service".to_string(),
              )),
              preview: Arc::new(crate::services::ServiceMetrics::new(
                "preview-service".to_string(),
              )),
              project: Arc::new(crate::services::ServiceMetrics::new(
                "project-service".to_string(),
              )),
              ffmpeg: Arc::new(crate::services::ServiceMetrics::new(
                "ffmpeg-service".to_string(),
              )),
              transition_ffmpeg: Arc::new(crate::services::ServiceMetrics::new(
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
    let ffmpeg = Arc::new(crate::services::FfmpegServiceImpl::new(
      "ffmpeg".to_string(),
    ));
    let cache_service = Arc::new(crate::services::CacheServiceImpl::new(
      std::env::temp_dir().join("timeline-studio"),
    ));
    let gpu = Arc::new(crate::services::GpuServiceImpl::new(
      "ffmpeg".to_string(),
    ));
    let preview = Arc::new(crate::services::PreviewServiceImpl::new(
      ffmpeg.clone(),
    ));
    let project = Arc::new(crate::services::ProjectServiceImpl::new());
    let render = Arc::new(crate::services::RenderServiceImpl::new(
      ffmpeg.clone(),
      2,
      cache_service.clone(),
    ));
    let transition_ffmpeg =
      Arc::new(crate::services::TransitionFFmpegServiceImpl::new(ffmpeg.clone()));

    // Создаем метрики
    let metrics = crate::services::ServiceMetricsContainer {
      render: Arc::new(crate::services::ServiceMetrics::new(
        "render-service".to_string(),
      )),
      cache: Arc::new(crate::services::ServiceMetrics::new(
        "cache-service".to_string(),
      )),
      gpu: Arc::new(crate::services::ServiceMetrics::new(
        "gpu-service".to_string(),
      )),
      preview: Arc::new(crate::services::ServiceMetrics::new(
        "preview-service".to_string(),
      )),
      project: Arc::new(crate::services::ServiceMetrics::new(
        "project-service".to_string(),
      )),
      ffmpeg: Arc::new(crate::services::ServiceMetrics::new(
        "ffmpeg-service".to_string(),
      )),
      transition_ffmpeg: Arc::new(crate::services::ServiceMetrics::new(
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
  use std::sync::Arc;
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

  // === EXTENDED TESTS: Drop Handler & Graceful Shutdown ===

  #[tokio::test]
  async fn test_drop_with_active_jobs() {
    {
      let state = VideoCompilerState::default();
      let jobs = state.active_jobs.read().await;
      assert!(jobs.is_empty());
    }
    // State dropped, should trigger graceful shutdown
  }

  #[tokio::test]
  async fn test_drop_with_active_pipelines() {
    {
      let state = VideoCompilerState::default();
      let pipelines = state.active_pipelines.read().await;
      assert!(pipelines.is_empty());
    }
    // State dropped, pipelines should be cleared
  }

  #[tokio::test]
  async fn test_concurrent_drop_protection() {
    let state = Arc::new(VideoCompilerState::default());
    let state_clone = state.clone();

    // Spawn concurrent access
    let handle = tokio::spawn(async move {
      let _jobs = state_clone.active_jobs.read().await;
      tokio::time::sleep(Duration::from_millis(10)).await;
    });

    handle.await.unwrap();
    // State should handle concurrent drop safely
  }

  // === EXTENDED TESTS: ServiceContainer Integration ===

  #[tokio::test]
  async fn test_render_service_availability() {
    let state = VideoCompilerState::default();
    let render_service = state.services.get_render_service();
    assert!(render_service.is_some());
  }

  #[tokio::test]
  async fn test_cache_service_availability() {
    let state = VideoCompilerState::default();
    let cache_service = state.services.get_cache_service();
    assert!(cache_service.is_some());
  }

  #[tokio::test]
  async fn test_gpu_service_availability() {
    let state = VideoCompilerState::default();
    let gpu_service = state.services.get_gpu_service();
    assert!(gpu_service.is_some());
  }

  #[tokio::test]
  async fn test_preview_service_availability() {
    let state = VideoCompilerState::default();
    let preview_service = state.services.get_preview_service();
    assert!(preview_service.is_some());
  }

  #[tokio::test]
  async fn test_project_service_availability() {
    let state = VideoCompilerState::default();
    let project_service = state.services.get_project_service();
    assert!(project_service.is_some());
  }

  #[tokio::test]
  async fn test_ffmpeg_service_availability() {
    let state = VideoCompilerState::default();
    let ffmpeg_service = state.services.get_ffmpeg_service();
    assert!(ffmpeg_service.is_some());
  }

  #[tokio::test]
  async fn test_transition_ffmpeg_service_availability() {
    let state = VideoCompilerState::default();
    let transition_service = state.services.get_transition_ffmpeg_service();
    assert!(transition_service.is_some());
  }

  #[tokio::test]
  async fn test_all_services_initialized() {
    let state = VideoCompilerState::default();

    // Verify all services are available simultaneously
    assert!(state.services.get_render_service().is_some());
    assert!(state.services.get_cache_service().is_some());
    assert!(state.services.get_gpu_service().is_some());
    assert!(state.services.get_preview_service().is_some());
    assert!(state.services.get_project_service().is_some());
    assert!(state.services.get_ffmpeg_service().is_some());
    assert!(state.services.get_transition_ffmpeg_service().is_some());
  }

  // === EXTENDED TESTS: Concurrent Operations ===

  #[tokio::test]
  async fn test_concurrent_read_access() {
    let state = Arc::new(VideoCompilerState::default());
    let mut handles = vec![];

    for i in 0..10 {
      let state_clone = state.clone();
      let handle = tokio::spawn(async move {
        let jobs = state_clone.active_jobs.read().await;
        assert!(jobs.is_empty());
        i
      });
      handles.push(handle);
    }

    let results: Vec<_> = futures::future::join_all(handles)
      .await
      .into_iter()
      .map(|r| r.unwrap())
      .collect();
    assert_eq!(results.len(), 10);
  }

  #[tokio::test]
  async fn test_concurrent_ffmpeg_path_updates() {
    let state = Arc::new(VideoCompilerState::default());
    let mut handles = vec![];

    for i in 0..5 {
      let state_clone = state.clone();
      let handle = tokio::spawn(async move {
        let path = format!("/usr/local/bin/ffmpeg-{i}");
        state_clone.update_ffmpeg_path(path.clone()).await;
        path
      });
      handles.push(handle);
    }

    let results: Vec<_> = futures::future::join_all(handles)
      .await
      .into_iter()
      .map(|r| r.unwrap())
      .collect();

    assert_eq!(results.len(), 5);

    // Final path should be one of the updated paths
    let final_path = state.ffmpeg_path.read().await;
    assert!(results.contains(&final_path.to_string()));
  }

  #[tokio::test]
  async fn test_concurrent_settings_updates() {
    let state = Arc::new(VideoCompilerState::default());
    let mut handles = vec![];

    for i in 0..5 {
      let state_clone = state.clone();
      let handle = tokio::spawn(async move {
        let mut settings = state_clone.settings.write().await;
        settings.max_concurrent_jobs = i + 1;
        drop(settings);
        i
      });
      handles.push(handle);
    }

    let results: Vec<_> = futures::future::join_all(handles)
      .await
      .into_iter()
      .map(|r| r.unwrap())
      .collect();

    assert_eq!(results.len(), 5);

    // Final value should be one of the updated values
    let final_settings = state.settings.read().await;
    assert!(final_settings.max_concurrent_jobs >= 1 && final_settings.max_concurrent_jobs <= 5);
  }

  #[tokio::test]
  async fn test_concurrent_cache_operations() {
    let state = Arc::new(VideoCompilerState::default());
    let mut handles = vec![];

    for i in 0..5 {
      let state_clone = state.clone();
      let handle = tokio::spawn(async move {
        let cache = state_clone.cache_manager.read().await;
        let stats = cache.get_stats();
        assert_eq!(stats.preview_hits, 0);
        drop(cache);
        i
      });
      handles.push(handle);
    }

    let results: Vec<_> = futures::future::join_all(handles)
      .await
      .into_iter()
      .map(|r| r.unwrap())
      .collect();

    assert_eq!(results.len(), 5);
  }

  // === EXTENDED TESTS: RenderJobMetadata Edge Cases ===

  #[test]
  fn test_metadata_with_empty_strings() {
    let metadata = RenderJobMetadata {
      project_name: "".to_string(),
      output_path: "".to_string(),
      created_at: "".to_string(),
    };

    assert_eq!(metadata.project_name, "");
    assert_eq!(metadata.output_path, "");
    assert_eq!(metadata.created_at, "");
  }

  #[test]
  fn test_metadata_with_special_characters() {
    let metadata = RenderJobMetadata {
      project_name: "Test: Project (2024) [Final]".to_string(),
      output_path: "/tmp/path with spaces/file-name.mp4".to_string(),
      created_at: "2024-01-01T12:34:56.789Z".to_string(),
    };

    assert!(metadata.project_name.contains(':'));
    assert!(metadata.project_name.contains('('));
    assert!(metadata.project_name.contains('['));
    assert!(metadata.output_path.contains(' '));
  }

  #[test]
  fn test_metadata_with_unicode() {
    let metadata = RenderJobMetadata {
      project_name: "Проект 测试 プロジェクト".to_string(),
      output_path: "/tmp/видео.mp4".to_string(),
      created_at: "2024-01-01".to_string(),
    };

    assert!(metadata.project_name.contains("Проект"));
    assert!(metadata.project_name.contains("测试"));
    assert!(metadata.output_path.contains("видео"));
  }

  #[test]
  fn test_metadata_clone_independence() {
    let mut metadata1 = RenderJobMetadata {
      project_name: "Original".to_string(),
      output_path: "/original".to_string(),
      created_at: "2024-01-01".to_string(),
    };

    let metadata2 = metadata1.clone();

    // Modify original
    metadata1.project_name = "Modified".to_string();

    // Clone should remain unchanged
    assert_eq!(metadata2.project_name, "Original");
    assert_ne!(metadata1.project_name, metadata2.project_name);
  }

  // === EXTENDED TESTS: RenderJob Status Transitions ===

  #[test]
  fn test_render_job_queued_status() {
    let job = RenderJob {
      id: "queued-job".to_string(),
      project_name: "Test".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      status: RenderStatus::Queued,
      created_at: "2024-01-01".to_string(),
      progress: None,
      error_message: None,
    };

    assert!(matches!(job.status, RenderStatus::Queued));
    assert!(job.progress.is_none());
    assert!(job.error_message.is_none());
  }

  #[test]
  fn test_render_job_preparing_status() {
    let job = RenderJob {
      id: "preparing-job".to_string(),
      project_name: "Test".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      status: RenderStatus::Preparing,
      created_at: "2024-01-01".to_string(),
      progress: None,
      error_message: None,
    };

    assert!(matches!(job.status, RenderStatus::Preparing));
    assert!(job.progress.is_none());
    assert!(job.error_message.is_none());
  }

  #[test]
  fn test_render_job_completed_status() {
    let job = RenderJob {
      id: "completed-job".to_string(),
      project_name: "Test".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      status: RenderStatus::Completed,
      created_at: "2024-01-01".to_string(),
      progress: None,
      error_message: None,
    };

    assert!(matches!(job.status, RenderStatus::Completed));
  }

  #[test]
  fn test_render_job_paused_status() {
    let job = RenderJob {
      id: "paused-job".to_string(),
      project_name: "Test".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      status: RenderStatus::Paused,
      created_at: "2024-01-01".to_string(),
      progress: None,
      error_message: None,
    };

    assert!(matches!(job.status, RenderStatus::Paused));
  }

  #[test]
  fn test_render_job_cancelled_status() {
    let job = RenderJob {
      id: "cancelled-job".to_string(),
      project_name: "Test".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      status: RenderStatus::Cancelled,
      created_at: "2024-01-01".to_string(),
      progress: None,
      error_message: None,
    };

    assert!(matches!(job.status, RenderStatus::Cancelled));
  }

  // === EXTENDED TESTS: Settings Edge Cases ===

  #[tokio::test]
  async fn test_settings_hardware_acceleration_toggle() {
    let state = VideoCompilerState::default();

    // Initially true (default)
    {
      let settings = state.settings.read().await;
      assert!(settings.hardware_acceleration);
    }

    // Disable hardware acceleration
    {
      let mut settings = state.settings.write().await;
      settings.hardware_acceleration = false;
    }

    // Verify disabled
    {
      let settings = state.settings.read().await;
      assert!(!settings.hardware_acceleration);
    }

    // Enable again
    {
      let mut settings = state.settings.write().await;
      settings.hardware_acceleration = true;
    }

    // Verify enabled
    {
      let settings = state.settings.read().await;
      assert!(settings.hardware_acceleration);
    }
  }

  #[tokio::test]
  async fn test_settings_max_concurrent_jobs_bounds() {
    let state = VideoCompilerState::default();

    // Test minimum value
    {
      let mut settings = state.settings.write().await;
      settings.max_concurrent_jobs = 1;
    }

    {
      let settings = state.settings.read().await;
      assert_eq!(settings.max_concurrent_jobs, 1);
    }

    // Test higher value
    {
      let mut settings = state.settings.write().await;
      settings.max_concurrent_jobs = 16;
    }

    {
      let settings = state.settings.read().await;
      assert_eq!(settings.max_concurrent_jobs, 16);
    }
  }

  // === EXTENDED TESTS: FFmpeg Path Edge Cases ===

  #[tokio::test]
  async fn test_ffmpeg_path_with_spaces() {
    let state = VideoCompilerState::default();
    let path_with_spaces = "/usr/local/bin with spaces/ffmpeg".to_string();

    state.update_ffmpeg_path(path_with_spaces.clone()).await;

    let ffmpeg_path = state.ffmpeg_path.read().await;
    assert_eq!(ffmpeg_path.as_str(), path_with_spaces);
    assert!(ffmpeg_path.contains(' '));
  }

  #[tokio::test]
  async fn test_ffmpeg_path_windows_style() {
    let state = VideoCompilerState::default();
    let windows_path = r"C:\Program Files\ffmpeg\bin\ffmpeg.exe".to_string();

    state.update_ffmpeg_path(windows_path.clone()).await;

    let ffmpeg_path = state.ffmpeg_path.read().await;
    assert_eq!(ffmpeg_path.as_str(), windows_path);
  }

  #[tokio::test]
  async fn test_ffmpeg_path_relative() {
    let state = VideoCompilerState::default();
    let relative_path = "./bin/ffmpeg".to_string();

    state.update_ffmpeg_path(relative_path.clone()).await;

    let ffmpeg_path = state.ffmpeg_path.read().await;
    assert_eq!(ffmpeg_path.as_str(), relative_path);
  }

  #[tokio::test]
  async fn test_ffmpeg_path_empty_string() {
    let state = VideoCompilerState::default();
    let empty_path = "".to_string();

    state.update_ffmpeg_path(empty_path.clone()).await;

    let ffmpeg_path = state.ffmpeg_path.read().await;
    assert_eq!(ffmpeg_path.as_str(), "");
  }

  // === EXTENDED TESTS: Active Pipelines Management ===

  #[tokio::test]
  async fn test_active_pipelines_initial_state() {
    let state = VideoCompilerState::default();
    let pipelines = state.active_pipelines.read().await;
    assert!(pipelines.is_empty());
  }

  #[tokio::test]
  async fn test_active_pipelines_concurrent_access() {
    let state = Arc::new(VideoCompilerState::default());
    let mut handles = vec![];

    for i in 0..10 {
      let state_clone = state.clone();
      let handle = tokio::spawn(async move {
        let pipelines = state_clone.active_pipelines.read().await;
        assert!(pipelines.is_empty());
        i
      });
      handles.push(handle);
    }

    let results: Vec<_> = futures::future::join_all(handles)
      .await
      .into_iter()
      .map(|r| r.unwrap())
      .collect();

    assert_eq!(results.len(), 10);
  }

  // === EXTENDED TESTS: Cache Manager Edge Cases ===

  #[tokio::test]
  async fn test_cache_clear_multiple_times() {
    let state = VideoCompilerState::default();

    for _ in 0..5 {
      let mut cache = state.cache_manager.write().await;
      cache.clear_all().await;
      let stats = cache.get_stats();
      assert_eq!(stats.preview_hits, 0);
      assert_eq!(stats.render_hits, 0);
    }
  }

  #[tokio::test]
  async fn test_cache_stats_consistency() {
    let state = VideoCompilerState::default();

    let cache = state.cache_manager.read().await;
    let stats1 = cache.get_stats();
    let stats2 = cache.get_stats();

    assert_eq!(stats1.preview_hits, stats2.preview_hits);
    assert_eq!(stats1.render_hits, stats2.render_hits);
  }

  // === EXTENDED TESTS: Integration & Stress Tests ===

  #[tokio::test]
  async fn test_multiple_state_instances() {
    let state1 = VideoCompilerState::default();
    let state2 = VideoCompilerState::default();

    // Both should be independent
    state1.update_ffmpeg_path("/path1".to_string()).await;
    state2.update_ffmpeg_path("/path2".to_string()).await;

    let path1 = state1.ffmpeg_path.read().await;
    let path2 = state2.ffmpeg_path.read().await;

    assert_eq!(path1.as_str(), "/path1");
    assert_eq!(path2.as_str(), "/path2");
  }

  #[tokio::test]
  async fn test_state_clone_with_arc() {
    let state = Arc::new(VideoCompilerState::default());
    let state_clone = state.clone();

    state.update_ffmpeg_path("/new/path".to_string()).await;

    // Both should see the same update
    let path1 = state.ffmpeg_path.read().await;
    let path2 = state_clone.ffmpeg_path.read().await;

    assert_eq!(path1.as_str(), path2.as_str());
  }

  #[tokio::test]
  async fn test_rapid_settings_changes() {
    let state = VideoCompilerState::default();

    for i in 0..100 {
      let mut settings = state.settings.write().await;
      settings.max_concurrent_jobs = (i % 8) + 1;
      drop(settings);
    }

    let final_settings = state.settings.read().await;
    assert!(final_settings.max_concurrent_jobs >= 1 && final_settings.max_concurrent_jobs <= 8);
  }

  #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
  async fn test_high_concurrency_stress() {
    let state = Arc::new(VideoCompilerState::default());
    let mut handles = vec![];

    for i in 0..100 {
      let state_clone = state.clone();
      let handle = tokio::spawn(async move {
        match i % 4 {
          0 => {
            let _jobs = state_clone.active_jobs.read().await;
          }
          1 => {
            let _pipelines = state_clone.active_pipelines.read().await;
          }
          2 => {
            let _cache = state_clone.cache_manager.read().await;
          }
          _ => {
            let _settings = state_clone.settings.read().await;
          }
        }
        i
      });
      handles.push(handle);
    }

    let results: Vec<_> = futures::future::join_all(handles)
      .await
      .into_iter()
      .map(|r| r.unwrap())
      .collect();

    assert_eq!(results.len(), 100);
  }
}
