//! Сервис рендеринга видео

use crate::services::{CacheService, FfmpegService, Service};
use ts_render::video_compiler::core::{
  error::{Result, VideoCompilerError},
  progress::RenderProgress,
  renderer::VideoRenderer,
  schema::ProjectSchema,
};
use async_trait::async_trait;
use std::{collections::HashMap, path::PathBuf, sync::Arc};
use tokio::sync::RwLock;
use uuid::Uuid;

/// Трейт для сервиса рендеринга
#[async_trait]
#[allow(dead_code)]
pub trait RenderService: Service + Send + Sync {
  /// Запуск рендеринга проекта
  async fn start_render(&self, project: ProjectSchema, output_path: PathBuf) -> Result<String>;

  /// Получение прогресса рендеринга
  async fn get_progress(&self, job_id: &str) -> Result<Option<RenderProgress>>;

  /// Отмена рендеринга
  async fn cancel_render(&self, job_id: &str) -> Result<bool>;

  /// Пауза рендеринга
  async fn pause_render(&self, job_id: &str) -> Result<bool>;

  /// Возобновление рендеринга
  async fn resume_render(&self, job_id: &str) -> Result<bool>;

  /// Получение списка активных задач
  async fn get_active_jobs(&self) -> Result<Vec<String>>;

  /// Проверка доступности слотов для рендеринга
  async fn has_available_slots(&self) -> Result<bool>;
}

/// Статус задачи рендеринга
#[derive(Debug, Clone, PartialEq)]
pub enum RenderJobStatus {
  Initializing,
  Rendering,
  Paused,
  Completed,
  Failed,
  Cancelled,
}

/// Информация о задаче рендеринга
#[derive(Debug)]
pub struct RenderJob {
  pub id: String,
  pub project_schema: Option<ProjectSchema>,
  pub status: RenderJobStatus,
  pub progress: Option<RenderProgress>,
  pub created_at: chrono::DateTime<chrono::Utc>,
  pub error: Option<String>,
  pub renderer: Option<VideoRenderer>,
}

// Ручная реализация Clone для RenderJob, так как VideoRenderer не поддерживает Clone
impl Clone for RenderJob {
  fn clone(&self) -> Self {
    Self {
      id: self.id.clone(),
      project_schema: self.project_schema.clone(),
      status: self.status.clone(),
      progress: self.progress.clone(),
      created_at: self.created_at,
      error: self.error.clone(),
      renderer: None, // Не клонируем renderer
    }
  }
}

/// Реализация сервиса рендеринга
pub struct RenderServiceImpl {
  active_jobs: Arc<RwLock<HashMap<String, RenderJob>>>,
  max_concurrent_jobs: usize,
  #[allow(dead_code)]
  cache_service: Arc<dyn CacheService>,
}

impl RenderServiceImpl {
  pub fn new(
    _ffmpeg_service: Arc<dyn FfmpegService>,
    max_concurrent_jobs: usize,
    cache_service: Arc<dyn CacheService>,
  ) -> Self {
    Self {
      active_jobs: Arc::new(RwLock::new(HashMap::new())),
      max_concurrent_jobs,
      cache_service,
    }
  }
}

#[async_trait]
impl Service for RenderServiceImpl {
  async fn initialize(&self) -> Result<()> {
    log::info!("Инициализация сервиса рендеринга");
    Ok(())
  }

  async fn health_check(&self) -> Result<()> {
    let jobs = self.active_jobs.read().await;
    log::debug!("Активных задач рендеринга: {}", jobs.len());
    Ok(())
  }

  async fn shutdown(&self) -> Result<()> {
    log::info!("Остановка всех активных задач рендеринга");

    let job_ids: Vec<String> = {
      let jobs = self.active_jobs.read().await;
      jobs.keys().cloned().collect()
    };

    for job_id in job_ids {
      if let Err(e) = self.cancel_render(&job_id).await {
        log::error!("Ошибка при отмене задачи {job_id}: {e:?}");
      }
    }

    Ok(())
  }
}

impl RenderServiceImpl {
  /// Получить статус задачи
  pub async fn get_job_status(&self, job_id: &str) -> Result<Option<RenderJob>> {
    let jobs = self.active_jobs.read().await;
    Ok(jobs.get(job_id).cloned())
  }

  /// Обновить статус задачи
  pub async fn update_job_status(&self, job_id: &str, status: RenderJobStatus) -> Result<()> {
    let mut jobs = self.active_jobs.write().await;
    if let Some(job) = jobs.get_mut(job_id) {
      job.status = status;
      Ok(())
    } else {
      Err(VideoCompilerError::validation(format!(
        "Job {job_id} not found"
      )))
    }
  }

  /// Обновить прогресс задачи
  pub async fn update_job_progress(&self, job_id: &str, progress: RenderProgress) -> Result<()> {
    let mut jobs = self.active_jobs.write().await;
    if let Some(job) = jobs.get_mut(job_id) {
      job.progress = Some(progress);
      Ok(())
    } else {
      Err(VideoCompilerError::validation(format!(
        "Job {job_id} not found"
      )))
    }
  }

  /// Пометить задачу как проваленную
  pub async fn fail_job(&self, job_id: &str, error: String) -> Result<()> {
    let mut jobs = self.active_jobs.write().await;
    if let Some(job) = jobs.get_mut(job_id) {
      job.status = RenderJobStatus::Failed;
      job.error = Some(error);
      Ok(())
    } else {
      Err(VideoCompilerError::validation(format!(
        "Job {job_id} not found"
      )))
    }
  }

  /// Очистить завершенную задачу
  pub async fn cleanup_job(&self, job_id: &str) -> Result<()> {
    let mut jobs = self.active_jobs.write().await;
    jobs.remove(job_id);
    Ok(())
  }

  /// Получить список активных задач с полной информацией
  pub async fn get_active_jobs(&self) -> Result<Vec<RenderJob>> {
    let jobs = self.active_jobs.read().await;
    Ok(jobs.values().cloned().collect())
  }
}

#[async_trait]
impl RenderService for RenderServiceImpl {
  async fn start_render(&self, project: ProjectSchema, output_path: PathBuf) -> Result<String> {
    // Проверяем доступность слотов
    if !self.has_available_slots().await? {
      return Err(VideoCompilerError::TooManyActiveJobs(format!(
        "Максимальное количество одновременных задач: {}",
        self.max_concurrent_jobs
      )));
    }

    // Валидируем проект
    project.validate()?;

    // Создаем ID задачи
    let job_id = Uuid::new_v4().to_string();

    // Создаем прогресс канал
    let (progress_sender, _progress_receiver) = tokio::sync::mpsc::unbounded_channel();

    // Создаем временные настройки для рендерера
    let settings = Arc::new(RwLock::new(
      ts_render::video_compiler::CompilerSettings::default(),
    ));

    // Создаем кэш для рендера (интегрирован с CacheService)
    // Note: VideoRenderer использует локальный RenderCache, но CacheService
    // используется для операций кэширования на более высоком уровне
    let cache = Arc::new(RwLock::new(ts_render::video_compiler::core::cache::RenderCache::new()));

    // Создаем рендерер
    let renderer = VideoRenderer::new(project.clone(), settings, cache, progress_sender).await?;

    // Создаем задачу
    let job = RenderJob {
      id: job_id.clone(),
      project_schema: Some(project.clone()),
      status: RenderJobStatus::Initializing,
      progress: Some(RenderProgress::default()),
      created_at: chrono::Utc::now(),
      error: None,
      renderer: Some(renderer),
    };

    // Добавляем в активные задачи
    {
      let mut jobs = self.active_jobs.write().await;
      jobs.insert(job_id.clone(), job);
    }

    // Запускаем рендеринг в фоне
    let jobs = self.active_jobs.clone();
    let job_id_clone = job_id.clone();
    let output_path_clone = output_path.clone();

    tokio::spawn(async move {
      // Получаем рендерер из задачи
      let renderer = {
        let mut jobs_lock = jobs.write().await;
        if let Some(job) = jobs_lock.get_mut(&job_id_clone) {
          job.renderer.take()
        } else {
          None
        }
      };

      if let Some(mut renderer) = renderer {
        match renderer.render(&output_path_clone).await {
          Ok(_) => {
            log::info!("Рендеринг {job_id_clone} успешно завершен");
            // Обновляем статус
            let mut jobs_lock = jobs.write().await;
            if let Some(job) = jobs_lock.get_mut(&job_id_clone) {
              job.status = RenderJobStatus::Completed;
            }
          }
          Err(e) => {
            log::error!("Ошибка рендеринга {job_id_clone}: {e:?}");
            // Обновляем статус
            let mut jobs_lock = jobs.write().await;
            if let Some(job) = jobs_lock.get_mut(&job_id_clone) {
              job.status = RenderJobStatus::Failed;
              job.error = Some(e.to_string());
            }
          }
        }
      }
    });

    Ok(job_id)
  }

  async fn get_progress(&self, job_id: &str) -> Result<Option<RenderProgress>> {
    let jobs = self.active_jobs.read().await;
    Ok(jobs.get(job_id).and_then(|job| job.progress.clone()))
  }

  async fn cancel_render(&self, job_id: &str) -> Result<bool> {
    let mut jobs = self.active_jobs.write().await;
    if let Some(mut job) = jobs.remove(job_id) {
      if let Some(renderer) = job.renderer.as_mut() {
        renderer.cancel().await?;
      }
      Ok(true)
    } else {
      Ok(false)
    }
  }

  async fn pause_render(&self, job_id: &str) -> Result<bool> {
    let mut jobs = self.active_jobs.write().await;
    if let Some(job) = jobs.get_mut(job_id) {
      if let Some(renderer) = job.renderer.as_mut() {
        renderer.pause().await?;
        job.status = RenderJobStatus::Paused;
        Ok(true)
      } else {
        Ok(false)
      }
    } else {
      Ok(false)
    }
  }

  async fn resume_render(&self, job_id: &str) -> Result<bool> {
    let mut jobs = self.active_jobs.write().await;
    if let Some(job) = jobs.get_mut(job_id) {
      if let Some(renderer) = job.renderer.as_mut() {
        renderer.resume().await?;
        job.status = RenderJobStatus::Rendering;
        Ok(true)
      } else {
        Ok(false)
      }
    } else {
      Ok(false)
    }
  }

  async fn get_active_jobs(&self) -> Result<Vec<String>> {
    let jobs = self.active_jobs.read().await;
    Ok(jobs.keys().cloned().collect())
  }

  async fn has_available_slots(&self) -> Result<bool> {
    let jobs = self.active_jobs.read().await;
    Ok(jobs.len() < self.max_concurrent_jobs)
  }
}

#[cfg(test)]
mod render_service_tests;

#[cfg(test)]
mod tests {
  use super::*;
  use crate::services::{CacheServiceImpl, FfmpegServiceImpl};

  #[tokio::test]
  async fn test_render_service_creation() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(std::env::temp_dir()));
    let service = RenderServiceImpl::new(ffmpeg_service, 4, cache_service);

    assert!(service.initialize().await.is_ok());
    assert!(service.has_available_slots().await.unwrap());
  }

  #[tokio::test]
  async fn test_concurrent_job_limit() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(std::env::temp_dir()));
    let service = RenderServiceImpl::new(ffmpeg_service, 2, cache_service);

    // Проверяем начальное состояние
    assert!(service.has_available_slots().await.unwrap());

    // Можем добавить в тест запуск задач, когда рендерер будет готов
  }

  #[tokio::test]
  async fn test_service_lifecycle() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(std::env::temp_dir()));
    let service = RenderServiceImpl::new(ffmpeg_service, 4, cache_service);

    // Инициализация
    assert!(service.initialize().await.is_ok());

    // Проверка здоровья
    assert!(service.health_check().await.is_ok());

    // Завершение работы
    assert!(service.shutdown().await.is_ok());
  }

  #[tokio::test]
  async fn test_active_jobs_tracking() {
    use uuid::Uuid;

    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(std::env::temp_dir()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 3, cache_service));

    assert!(service.initialize().await.is_ok());

    // Изначально нет активных задач
    let jobs = service.get_active_jobs().await.unwrap();
    assert_eq!(jobs.len(), 0);

    // Добавляем задачу вручную (симулируем)
    {
      let mut active_jobs = service.active_jobs.write().await;
      let job_id = Uuid::new_v4().to_string();
      active_jobs.insert(
        job_id.clone(),
        RenderJob {
          id: job_id,
          project_schema: None,
          status: RenderJobStatus::Initializing,
          progress: None,
          created_at: chrono::Utc::now(),
          error: None,
          renderer: None,
        },
      );
    }

    // Теперь должна быть одна задача
    let jobs = service.get_active_jobs().await.unwrap();
    assert_eq!(jobs.len(), 1);

    // Проверяем статус задачи
    let job = &jobs[0];
    assert_eq!(job.status, RenderJobStatus::Initializing);
  }

  #[tokio::test]
  async fn test_job_cleanup() {
    use uuid::Uuid;

    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(std::env::temp_dir()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 2, cache_service));

    let job_id = Uuid::new_v4().to_string();

    // Добавляем задачу
    {
      let mut active_jobs = service.active_jobs.write().await;
      active_jobs.insert(
        job_id.clone(),
        RenderJob {
          id: job_id.clone(),
          project_schema: None,
          status: RenderJobStatus::Completed,
          progress: None,
          created_at: chrono::Utc::now(),
          error: None,
          renderer: None,
        },
      );
    }

    // Проверяем, что задача существует
    assert!(service.get_job_status(&job_id).await.unwrap().is_some());

    // Очищаем задачу
    assert!(service.cleanup_job(&job_id).await.is_ok());

    // Проверяем, что задачи больше нет
    assert!(service.get_job_status(&job_id).await.unwrap().is_none());
  }

  #[tokio::test]
  async fn test_available_slots() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(std::env::temp_dir()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 2, cache_service));

    // Изначально есть свободные слоты
    assert!(service.has_available_slots().await.unwrap());

    // Заполняем все слоты
    {
      let mut active_jobs = service.active_jobs.write().await;
      for i in 0..2 {
        active_jobs.insert(
          format!("job_{i}"),
          RenderJob {
            id: format!("job_{i}"),
            project_schema: None,
            status: RenderJobStatus::Rendering,
            progress: None,
            created_at: chrono::Utc::now(),
            error: None,
            renderer: None,
          },
        );
      }
    }

    // Теперь слотов нет
    assert!(!service.has_available_slots().await.unwrap());

    // Освобождаем один слот
    {
      let mut active_jobs = service.active_jobs.write().await;
      active_jobs.remove("job_0");
    }

    // Теперь есть свободный слот
    assert!(service.has_available_slots().await.unwrap());
  }

  #[tokio::test]
  async fn test_job_status_transitions() {
    use ts_render::video_compiler::core::schema::ProjectSchema;

    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(std::env::temp_dir()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 2, cache_service));

    let job_id = "test_job".to_string();
    let project = ProjectSchema::new("test_project".to_string());

    // Создаем задачу
    {
      let mut active_jobs = service.active_jobs.write().await;
      active_jobs.insert(
        job_id.clone(),
        RenderJob {
          id: job_id.clone(),
          project_schema: Some(project.clone()),
          status: RenderJobStatus::Initializing,
          progress: None,
          created_at: chrono::Utc::now(),
          error: None,
          renderer: None,
        },
      );
    }

    // Проверяем начальный статус
    let status = service.get_job_status(&job_id).await.unwrap();
    assert!(status.is_some());
    assert_eq!(status.unwrap().status, RenderJobStatus::Initializing);

    // Обновляем статус на Rendering
    service
      .update_job_status(&job_id, RenderJobStatus::Rendering)
      .await
      .unwrap();

    let status = service.get_job_status(&job_id).await.unwrap();
    assert_eq!(status.unwrap().status, RenderJobStatus::Rendering);

    // Обновляем статус на Failed с ошибкой
    service
      .fail_job(&job_id, "Test error".to_string())
      .await
      .unwrap();

    let status = service.get_job_status(&job_id).await.unwrap().unwrap();
    assert_eq!(status.status, RenderJobStatus::Failed);
    assert_eq!(status.error, Some("Test error".to_string()));
  }

  #[tokio::test]
  async fn test_job_progress_update() {
    use ts_render::video_compiler::core::progress::{RenderProgress, RenderStatus};
    use std::time::Duration;

    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(std::env::temp_dir()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 2, cache_service));

    let job_id = "progress_test".to_string();

    // Создаем задачу
    {
      let mut active_jobs = service.active_jobs.write().await;
      active_jobs.insert(
        job_id.clone(),
        RenderJob {
          id: job_id.clone(),
          project_schema: None,
          status: RenderJobStatus::Rendering,
          progress: None,
          created_at: chrono::Utc::now(),
          error: None,
          renderer: None,
        },
      );
    }

    // Обновляем прогресс
    let progress = RenderProgress {
      job_id: job_id.clone(),
      stage: "Encoding".to_string(),
      percentage: 10.0,
      current_frame: 100,
      total_frames: 1000,
      elapsed_time: Duration::from_secs(5),
      estimated_remaining: Some(Duration::from_secs(45)),
      status: RenderStatus::Processing,
      message: Some("Processing frame 100".to_string()),
    };

    service
      .update_job_progress(&job_id, progress.clone())
      .await
      .unwrap();

    // Проверяем, что прогресс обновился
    let job_status = service.get_job_status(&job_id).await.unwrap().unwrap();
    assert!(job_status.progress.is_some());
    let job_progress = job_status.progress.unwrap();
    assert_eq!(job_progress.percentage, 10.0);
    assert_eq!(job_progress.current_frame, 100);
  }
}
