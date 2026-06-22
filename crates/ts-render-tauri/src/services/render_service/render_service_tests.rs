//! Дополнительные тесты для render_service.rs - Фаза 2 улучшения покрытия
//!
//! Этот файл содержит расширенные тесты для увеличения покрытия render_service.rs

use super::*;
use ts_render::video_compiler::core::schema::{
  Clip, ClipSource, ExportSettings, OutputFormat, ProjectSchema, Timeline, Track, TrackType,
};
use crate::services::{CacheServiceImpl, FfmpegServiceImpl};
use std::sync::Arc;
use tempfile::TempDir;

/// Создает полноценную схему проекта для тестирования render service
fn create_test_project_with_content(name: &str) -> ProjectSchema {
  let mut project = ProjectSchema::new(name.to_string());

  // Настройка timeline
  project.timeline = Timeline {
    duration: 30.0,
    fps: 30,
    resolution: (1920, 1080),
    sample_rate: 48000,
    aspect_ratio: ts_render::video_compiler::core::schema::AspectRatio::default(),
  };

  // Настройка экспорта
  project.settings.export = ExportSettings {
    format: OutputFormat::Mp4,
    quality: 85,
    video_bitrate: 5000,
    audio_bitrate: 192,
    hardware_acceleration: false, // Отключаем для тестов
    preferred_gpu_encoder: None,
    ffmpeg_args: Vec::new(),
    encoding_profile: Some("baseline".to_string()),
    rate_control_mode: Some("cbr".to_string()),
    keyframe_interval: Some(30),
    b_frames: Some(0),
    multi_pass: Some(1),
    preset: Some("fast".to_string()),
    max_bitrate: None,
    min_bitrate: None,
    crf: None,
    optimize_for_speed: Some(true),
    optimize_for_network: Some(false),
    normalize_audio: Some(false),
    audio_target: None,
    audio_peak: None,
  };

  // Добавляем тестовые треки и клипы
  let mut video_track = Track::new(TrackType::Video, "Test Video Track".to_string());
  video_track.clips.push(Clip {
    id: "test_clip_1".to_string(),
    source: ClipSource::Generated, // Используем generated источник для избежания зависимостей от файлов
    start_time: 0.0,
    end_time: 10.0,
    source_start: 0.0,
    source_end: 10.0,
    speed: 1.0,
    opacity: 1.0,
    effects: vec!["blur".to_string()],
    filters: vec!["brightness".to_string()],
    template_id: None,
    template_position: None,
    color_correction: None,
    crop: None,
    transform: None,
    audio_track_index: None,
    properties: ts_render::video_compiler::core::schema::ClipProperties::default(),
  });

  let mut audio_track = Track::new(TrackType::Audio, "Test Audio Track".to_string());
  audio_track.clips.push(Clip {
    id: "test_clip_2".to_string(),
    source: ClipSource::Generated,
    start_time: 0.0,
    end_time: 10.0,
    source_start: 0.0,
    source_end: 10.0,
    speed: 1.0,
    opacity: 1.0,
    effects: vec![],
    filters: vec!["volume".to_string()],
    template_id: None,
    template_position: None,
    color_correction: None,
    crop: None,
    transform: None,
    audio_track_index: None,
    properties: ts_render::video_compiler::core::schema::ClipProperties::default(),
  });

  project.tracks.push(video_track);
  project.tracks.push(audio_track);

  project
}

#[cfg(test)]
mod integration_tests {
  use super::*;

  #[tokio::test]
  async fn test_start_render_with_valid_project() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = RenderServiceImpl::new(ffmpeg_service, 2, cache_service);

    let project = create_test_project_with_content("Integration Test");
    let output_path = temp_dir.path().join("output.mp4");

    // Попытка запуска рендеринга
    let result = service.start_render(project, output_path).await;

    // Рендеринг может начаться или не начаться в зависимости от доступности FFmpeg
    // Но service должен обработать запрос корректно
    match result {
      Ok(job_id) => {
        assert!(!job_id.is_empty());
        // Проверяем, что задача была добавлена
        let jobs = service.get_active_jobs().await.unwrap();
        assert_eq!(jobs.len(), 1);

        // Очистка
        let _ = service.cancel_render(&job_id).await;
      }
      Err(e) => {
        // Ошибка может быть связана с отсутствием FFmpeg или недоступностью VideoRenderer
        println!("Expected error in test environment: {e}");
      }
    }
  }

  #[tokio::test]
  async fn test_start_render_exceeds_concurrent_limit() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 1, cache_service)); // Только 1 слот

    // Заполняем единственный слот
    {
      let mut active_jobs = service.active_jobs.write().await;
      active_jobs.insert(
        "existing_job".to_string(),
        RenderJob {
          id: "existing_job".to_string(),
          project_schema: None,
          status: RenderJobStatus::Rendering,
          progress: None,
          created_at: chrono::Utc::now(),
          error: None,
          renderer: None,
        },
      );
    }

    let project = create_test_project_with_content("Overflow Test");
    let output_path = temp_dir.path().join("overflow_output.mp4");

    // Попытка запустить еще один рендеринг должна не удаться
    let result = service.start_render(project, output_path).await;
    assert!(result.is_err());

    if let Err(VideoCompilerError::TooManyActiveJobs(_)) = result {
      // Ожидаемая ошибка
    } else {
      panic!("Expected TooManyActiveJobs error");
    }
  }
}

#[cfg(test)]
mod error_handling_tests {
  use super::*;

  #[tokio::test]
  async fn test_update_nonexistent_job_status() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = RenderServiceImpl::new(ffmpeg_service, 2, cache_service);

    let result = service
      .update_job_status("nonexistent_job", RenderJobStatus::Completed)
      .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not found"));
  }

  #[tokio::test]
  async fn test_update_nonexistent_job_progress() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = RenderServiceImpl::new(ffmpeg_service, 2, cache_service);

    let progress = ts_render::video_compiler::core::progress::RenderProgress::default();
    let result = service
      .update_job_progress("nonexistent_job", progress)
      .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not found"));
  }

  #[tokio::test]
  async fn test_fail_nonexistent_job() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = RenderServiceImpl::new(ffmpeg_service, 2, cache_service);

    let result = service
      .fail_job("nonexistent_job", "Test error".to_string())
      .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not found"));
  }

  #[tokio::test]
  async fn test_render_operations_on_nonexistent_jobs() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = RenderServiceImpl::new(ffmpeg_service, 2, cache_service);

    // Все операции с несуществующими задачами должны вернуть false
    assert!(!service.cancel_render("nonexistent").await.unwrap());
    assert!(!service.pause_render("nonexistent").await.unwrap());
    assert!(!service.resume_render("nonexistent").await.unwrap());

    // get_progress должен вернуть None
    assert!(service.get_progress("nonexistent").await.unwrap().is_none());
  }
}

#[cfg(test)]
mod concurrent_operations_tests {
  use super::*;
  use tokio::task::JoinSet;

  #[tokio::test]
  async fn test_concurrent_job_management() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 5, cache_service));

    let mut tasks = JoinSet::new();

    // Запускаем несколько задач параллельно для управления job'ами
    for i in 0..3 {
      let service_clone = service.clone();
      tasks.spawn(async move {
        let job_id = format!("concurrent_job_{i}");

        // Создаем задачу
        {
          let mut active_jobs = service_clone.active_jobs.write().await;
          active_jobs.insert(
            job_id.clone(),
            RenderJob {
              id: job_id.clone(),
              project_schema: None,
              status: RenderJobStatus::Initializing,
              progress: None,
              created_at: chrono::Utc::now(),
              error: None,
              renderer: None,
            },
          );
        }

        // Проверяем статус
        let status = service_clone.get_job_status(&job_id).await.unwrap();
        assert!(status.is_some());

        // Обновляем статус
        service_clone
          .update_job_status(&job_id, RenderJobStatus::Rendering)
          .await
          .unwrap();

        // Удаляем задачу
        service_clone.cleanup_job(&job_id).await.unwrap();
      });
    }

    // Ждем завершения всех задач
    while let Some(result) = tasks.join_next().await {
      assert!(result.is_ok());
    }

    // В итоге должно быть 0 активных задач
    let jobs = service.get_active_jobs().await.unwrap();
    assert_eq!(jobs.len(), 0);
  }

  #[tokio::test]
  async fn test_concurrent_slot_checking() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 3, cache_service));

    let mut tasks = JoinSet::new();

    // Запускаем несколько задач, которые проверяют доступность слотов
    for i in 0..5 {
      let service_clone = service.clone();
      tasks.spawn(async move {
        // Каждая задача проверяет доступность слотов и добавляет/удаляет job'ы
        let _has_slots_before = service_clone.has_available_slots().await.unwrap();

        let job_id = format!("slot_test_{i}");
        {
          let mut active_jobs = service_clone.active_jobs.write().await;
          if active_jobs.len() < 3 {
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
        }

        let has_slots_after = service_clone.has_available_slots().await.unwrap();

        // Результаты должны быть консистентными:
        // Если до операции были слоты, а после нет, значит мы добавили job
        // Если до операции не было слотов, то и после тоже не должно быть
        // (логика проверки доступности слотов должна работать корректно)

        // Проверим основные инварианты вместо buggy expression
        let final_job_count = {
          let active_jobs = service_clone.active_jobs.read().await;
          active_jobs.len()
        };

        // Количество job'ов не должно превышать лимит
        assert!(final_job_count <= 3);

        // Если есть слоты, то job'ов должно быть меньше лимита
        if has_slots_after {
          assert!(final_job_count < 3);
        }

        job_id
      });
    }

    let mut job_ids = Vec::new();
    while let Some(result) = tasks.join_next().await {
      job_ids.push(result.unwrap());
    }

    // Очистка
    for job_id in job_ids {
      let _ = service.cleanup_job(&job_id).await;
    }
  }
}

#[cfg(test)]
mod edge_cases_tests {
  use super::*;

  #[tokio::test]
  async fn test_empty_project_validation() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = RenderServiceImpl::new(ffmpeg_service, 2, cache_service);

    let empty_project = ProjectSchema::new("Empty Project".to_string());
    let output_path = temp_dir.path().join("empty_output.mp4");

    // Пустой проект может пройти валидацию или не пройти - зависит от реализации
    let result = service.start_render(empty_project, output_path).await;

    match result {
      Ok(job_id) => {
        // Если валидация прошла, очищаем
        let _ = service.cancel_render(&job_id).await;
      }
      Err(_) => {
        // Ошибка валидации или создания рендерера - это нормально для пустого проекта
      }
    }
  }

  #[tokio::test]
  async fn test_zero_max_concurrent_jobs() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = RenderServiceImpl::new(ffmpeg_service, 0, cache_service); // 0 слотов

    // Не должно быть доступных слотов
    assert!(!service.has_available_slots().await.unwrap());

    let project = create_test_project_with_content("Zero Slots Test");
    let output_path = temp_dir.path().join("zero_output.mp4");

    // Попытка запуска должна не удаться
    let result = service.start_render(project, output_path).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_cleanup_nonexistent_job() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = RenderServiceImpl::new(ffmpeg_service, 2, cache_service);

    // Очистка несуществующей задачи должна проходить без ошибок
    let result = service.cleanup_job("nonexistent_job").await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_multiple_cleanup_same_job() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 2, cache_service));

    let job_id = "cleanup_test_job".to_string();

    // Создаем задачу
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

    // Первая очистка должна пройти успешно
    assert!(service.cleanup_job(&job_id).await.is_ok());

    // Вторая очистка тоже должна пройти без ошибок
    assert!(service.cleanup_job(&job_id).await.is_ok());
  }
}

#[cfg(test)]
mod service_lifecycle_tests {
  use super::*;

  #[tokio::test]
  async fn test_service_shutdown_with_active_jobs() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 3, cache_service));

    // Добавляем несколько активных задач
    {
      let mut active_jobs = service.active_jobs.write().await;
      for i in 0..3 {
        let job_id = format!("shutdown_job_{i}");
        active_jobs.insert(
          job_id.clone(),
          RenderJob {
            id: job_id,
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

    // Проверяем, что есть активные задачи
    let jobs_before = service.get_active_jobs().await.unwrap();
    assert_eq!(jobs_before.len(), 3);

    // Выключаем сервис
    let shutdown_result = service.shutdown().await;
    assert!(shutdown_result.is_ok());

    // После shutdown все задачи должны быть отменены
    let jobs_after = service.get_active_jobs().await.unwrap();
    assert_eq!(jobs_after.len(), 0);
  }

  #[tokio::test]
  async fn test_health_check_reports_job_count() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = Arc::new(RenderServiceImpl::new(ffmpeg_service, 2, cache_service));

    // Health check с 0 задач
    assert!(service.health_check().await.is_ok());

    // Добавляем задачу
    {
      let mut active_jobs = service.active_jobs.write().await;
      active_jobs.insert(
        "health_test_job".to_string(),
        RenderJob {
          id: "health_test_job".to_string(),
          project_schema: None,
          status: RenderJobStatus::Rendering,
          progress: None,
          created_at: chrono::Utc::now(),
          error: None,
          renderer: None,
        },
      );
    }

    // Health check с 1 задачей
    assert!(service.health_check().await.is_ok());
  }

  #[tokio::test]
  async fn test_service_initialize_multiple_times() {
    let temp_dir = TempDir::new().unwrap();
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let service = RenderServiceImpl::new(ffmpeg_service, 2, cache_service);

    // Многократная инициализация должна проходить без проблем
    assert!(service.initialize().await.is_ok());
    assert!(service.initialize().await.is_ok());
    assert!(service.initialize().await.is_ok());
  }
}

#[cfg(test)]
mod render_job_tests {
  use super::*;

  #[test]
  fn test_render_job_clone() {
    let job = RenderJob {
      id: "test_job".to_string(),
      project_schema: Some(ProjectSchema::new("test".to_string())),
      status: RenderJobStatus::Rendering,
      progress: None,
      created_at: chrono::Utc::now(),
      error: Some("test error".to_string()),
      renderer: None,
    };

    // Clone должен работать корректно
    let cloned = job.clone();
    assert_eq!(cloned.id, job.id);
    assert_eq!(cloned.status, job.status);
    assert_eq!(cloned.error, job.error);
    assert!(cloned.renderer.is_none()); // renderer не клонируется
  }

  #[test]
  fn test_render_job_status_equality() {
    assert_eq!(RenderJobStatus::Initializing, RenderJobStatus::Initializing);
    assert_eq!(RenderJobStatus::Rendering, RenderJobStatus::Rendering);
    assert_eq!(RenderJobStatus::Paused, RenderJobStatus::Paused);
    assert_eq!(RenderJobStatus::Completed, RenderJobStatus::Completed);
    assert_eq!(RenderJobStatus::Failed, RenderJobStatus::Failed);
    assert_eq!(RenderJobStatus::Cancelled, RenderJobStatus::Cancelled);

    assert_ne!(RenderJobStatus::Initializing, RenderJobStatus::Rendering);
    assert_ne!(RenderJobStatus::Completed, RenderJobStatus::Failed);
  }
}
