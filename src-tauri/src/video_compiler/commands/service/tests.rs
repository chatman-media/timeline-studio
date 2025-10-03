//! Тесты для модуля service

#[cfg(test)]
mod service_tests {
  use super::super::*;
  use crate::video_compiler::{
    commands::state::{ActiveRenderJob, RenderJobMetadata},
    schema::{
      timeline::{Clip, ClipProperties, ClipSource, Track, TrackType},
      ProjectSchema,
    },
  };

  /// Helper function to create test VideoCompilerState
  fn create_test_state() -> crate::video_compiler::commands::VideoCompilerState {
    crate::video_compiler::commands::VideoCompilerState::default()
  }

  /// Helper function to create a test project with clips
  fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("Test Project".to_string());

    let mut track = Track {
      id: "track1".to_string(),
      track_type: TrackType::Video,
      name: "Video Track".to_string(),
      enabled: true,
      volume: 1.0,
      locked: false,
      clips: Vec::new(),
      effects: Vec::new(),
      filters: Vec::new(),
    };

    // Add clips with different sources
    track.clips.push(Clip {
      id: "clip1".to_string(),
      source: ClipSource::File("/path/to/video1.mp4".to_string()),
      start_time: 0.0,
      end_time: 5.0,
      source_start: 0.0,
      source_end: 5.0,
      speed: 1.0,
      opacity: 1.0,
      effects: Vec::new(),
      filters: Vec::new(),
      template_id: None,
      template_position: None,
      color_correction: None,
      crop: None,
      transform: None,
      audio_track_index: None,
      properties: ClipProperties::default(),
    });

    track.clips.push(Clip {
      id: "clip2".to_string(),
      source: ClipSource::File("/path/to/video2.mp4".to_string()),
      start_time: 5.0,
      end_time: 10.0,
      source_start: 0.0,
      source_end: 5.0,
      speed: 1.0,
      opacity: 1.0,
      effects: Vec::new(),
      filters: Vec::new(),
      template_id: None,
      template_position: None,
      color_correction: None,
      crop: None,
      transform: None,
      audio_track_index: None,
      properties: ClipProperties::default(),
    });

    // Add clip with same source as first clip
    track.clips.push(Clip {
      id: "clip3".to_string(),
      source: ClipSource::File("/path/to/video1.mp4".to_string()),
      start_time: 10.0,
      end_time: 15.0,
      source_start: 0.0,
      source_end: 5.0,
      speed: 1.0,
      opacity: 1.0,
      effects: Vec::new(),
      filters: Vec::new(),
      template_id: None,
      template_position: None,
      color_correction: None,
      crop: None,
      transform: None,
      audio_track_index: None,
      properties: ClipProperties::default(),
    });

    project.tracks.push(track);
    project
  }

  /// Helper function to create a test active job
  async fn create_test_active_job() -> ActiveRenderJob {
    use crate::video_compiler::{renderer::VideoRenderer, schema::ProjectSchema};
    use std::sync::Arc;
    use tokio::sync::{mpsc, RwLock};

    let project = ProjectSchema::new("Test Project".to_string());
    let settings = Arc::new(RwLock::new(
      crate::video_compiler::CompilerSettings::default(),
    ));
    let cache = Arc::new(RwLock::new(crate::video_compiler::cache::RenderCache::new()));
    let (tx, _rx) = mpsc::unbounded_channel();

    let renderer = VideoRenderer::new(project, settings, cache, tx)
      .await
      .expect("Failed to create renderer");

    ActiveRenderJob {
      renderer,
      metadata: RenderJobMetadata {
        project_name: "Test Project".to_string(),
        output_path: "/tmp/test.mp4".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
      },
    }
  }

  #[tokio::test]
  async fn test_get_active_job_ids_empty() {
    let state = create_test_state();
    let job_ids = business_logic::get_active_job_ids(&state).await;
    assert!(job_ids.is_empty());
  }

  #[tokio::test]
  async fn test_get_active_job_ids_with_jobs() {
    let state = create_test_state();

    // Add some jobs
    {
      let mut active_jobs = state.active_jobs.write().await;
      active_jobs.insert("job1".to_string(), create_test_active_job().await);
      active_jobs.insert("job2".to_string(), create_test_active_job().await);
    }

    let job_ids = business_logic::get_active_job_ids(&state).await;
    assert_eq!(job_ids.len(), 2);
    assert!(job_ids.contains(&"job1".to_string()));
    assert!(job_ids.contains(&"job2".to_string()));
  }

  #[tokio::test]
  async fn test_get_job_render_progress_existing_job() {
    let state = create_test_state();

    // Add a job
    {
      let mut active_jobs = state.active_jobs.write().await;
      active_jobs.insert("test_job".to_string(), create_test_active_job().await);
    }

    let result = business_logic::get_job_render_progress(&state, "test_job").await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 0.0); // Current implementation returns 0.0
  }

  #[tokio::test]
  async fn test_get_job_render_progress_nonexistent_job() {
    let state = create_test_state();
    let result = business_logic::get_job_render_progress(&state, "nonexistent").await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_create_render_statistics() {
    let state = create_test_state();

    // Add a job
    {
      let mut active_jobs = state.active_jobs.write().await;
      active_jobs.insert("test_job".to_string(), create_test_active_job().await);
    }

    let result = business_logic::create_render_statistics(&state, "test_job").await;
    assert!(result.is_ok());

    let stats = result.unwrap();
    assert_eq!(stats.job_id, "test_job");
    assert_eq!(stats.status, "running");
    assert_eq!(stats.progress, 0.0);
    assert_eq!(stats.frames_total, 100);
  }

  #[tokio::test]
  async fn test_analyze_input_sources() {
    let project = create_test_project();
    let result = business_logic::analyze_input_sources(&project);

    assert_eq!(result.total_sources, 2); // Two unique sources
    assert_eq!(result.sources.len(), 2);

    // Check that video1.mp4 appears twice
    let video1_info = result.sources.get("/path/to/video1.mp4").unwrap();
    assert_eq!(video1_info.clip_count, 2);
    assert_eq!(video1_info.total_duration, 10.0); // 5.0 + 5.0

    // Check that video2.mp4 appears once
    let video2_info = result.sources.get("/path/to/video2.mp4").unwrap();
    assert_eq!(video2_info.clip_count, 1);
    assert_eq!(video2_info.total_duration, 5.0);
  }

  #[tokio::test]
  async fn test_analyze_input_sources_empty_project() {
    let project = ProjectSchema::new("Empty Project".to_string());
    let result = business_logic::analyze_input_sources(&project);

    assert_eq!(result.total_sources, 0);
    assert!(result.sources.is_empty());
  }

  #[test]
  fn test_validate_ffmpeg_path_invalid() {
    let result = business_logic::validate_ffmpeg_path("/invalid/path/to/ffmpeg");
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_create_all_service_metrics() {
    let state = create_test_state();

    // Add some jobs
    {
      let mut active_jobs = state.active_jobs.write().await;
      active_jobs.insert("job1".to_string(), create_test_active_job().await);
      active_jobs.insert("job2".to_string(), create_test_active_job().await);
    }

    let metrics = business_logic::create_all_service_metrics(&state).await;

    assert_eq!(metrics.render.active_jobs, 2);
    assert_eq!(metrics.cache.hit_rate, 0.85);
    assert!(!metrics.gpu.available);
    assert!(!metrics.timestamp.is_empty());
  }

  #[test]
  fn test_create_specific_service_metrics() {
    let result = business_logic::create_specific_service_metrics("render");
    assert!(result.is_ok());

    let metrics = result.unwrap();
    assert_eq!(metrics.service, "render");
    assert!(metrics.metrics.is_object());
    assert!(!metrics.timestamp.is_empty());
  }

  #[test]
  fn test_create_specific_service_metrics_invalid_service() {
    let result = business_logic::create_specific_service_metrics("invalid_service");
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_cleanup_completed_jobs_logic() {
    let state = create_test_state();

    // Add some jobs
    {
      let mut active_jobs = state.active_jobs.write().await;
      active_jobs.insert("job1".to_string(), create_test_active_job().await);
      active_jobs.insert("job2".to_string(), create_test_active_job().await);
      active_jobs.insert("job3".to_string(), create_test_active_job().await);
    }

    let result = business_logic::cleanup_completed_jobs_logic(&state, Some(24)).await;

    assert_eq!(result.removed_count, 3); // All jobs removed in current implementation
    assert_eq!(result.remaining_count, 0);

    // Verify jobs were actually removed
    let active_jobs = state.active_jobs.read().await;
    assert!(active_jobs.is_empty());
  }

  #[tokio::test]
  async fn test_check_ffmpeg_health() {
    let state = create_test_state();
    let health = business_logic::check_ffmpeg_health(&state).await;

    // Health depends on whether ffmpeg is available on the system
    assert!(health.status == "healthy" || health.status == "unhealthy");

    if health.status == "healthy" {
      assert_eq!(health.uptime_seconds, 3600);
      assert!(health.last_error.is_none());
    } else {
      assert_eq!(health.uptime_seconds, 0);
      assert!(health.last_error.is_some());
    }
  }

  #[tokio::test]
  async fn test_create_services_health_status() {
    let state = create_test_state();
    let health_status = business_logic::create_services_health_status(&state).await;

    assert_eq!(health_status.render.status, "healthy");
    assert_eq!(health_status.cache.status, "healthy");
    assert_eq!(health_status.preview.status, "healthy");
    assert_eq!(health_status.gpu.status, "unavailable");
    assert!(!health_status.timestamp.is_empty());

    // Overall status depends on FFmpeg health
    assert!(
      health_status.overall_status == "healthy" || health_status.overall_status == "degraded"
    );
  }

  #[test]
  fn test_validate_service_for_restart() {
    // Valid services
    assert!(business_logic::validate_service_for_restart("render").is_ok());
    assert!(business_logic::validate_service_for_restart("cache").is_ok());
    assert!(business_logic::validate_service_for_restart("preview").is_ok());
    assert!(business_logic::validate_service_for_restart("gpu").is_ok());

    // Invalid service
    assert!(business_logic::validate_service_for_restart("invalid").is_err());
  }

  #[test]
  fn test_restart_service_logic() {
    // Valid services should restart successfully
    assert!(business_logic::restart_service_logic(types::ServiceType::Render).is_ok());
    assert!(business_logic::restart_service_logic(types::ServiceType::Cache).is_ok());
    assert!(business_logic::restart_service_logic(types::ServiceType::Preview).is_ok());
    assert!(business_logic::restart_service_logic(types::ServiceType::Gpu).is_ok());

    // FFmpeg should not be restartable
    assert!(business_logic::restart_service_logic(types::ServiceType::Ffmpeg).is_err());
  }

  #[test]
  fn test_service_type_conversion() {
    // Test from_string
    assert!(matches!(
      types::ServiceType::from_string("render"),
      Some(types::ServiceType::Render)
    ));
    assert!(matches!(
      types::ServiceType::from_string("cache"),
      Some(types::ServiceType::Cache)
    ));
    assert!(types::ServiceType::from_string("invalid").is_none());

    // Test to_string
    assert_eq!(types::ServiceType::Render.to_string(), "render");
    assert_eq!(types::ServiceType::Cache.to_string(), "cache");
    assert_eq!(types::ServiceType::Preview.to_string(), "preview");
    assert_eq!(types::ServiceType::Gpu.to_string(), "gpu");
    assert_eq!(types::ServiceType::Ffmpeg.to_string(), "ffmpeg");
  }

  #[test]
  fn test_input_source_info_creation() {
    let info = types::InputSourceInfo {
      track_id: "track1".to_string(),
      clip_count: 5,
      total_duration: 25.0,
    };

    assert_eq!(info.track_id, "track1");
    assert_eq!(info.clip_count, 5);
    assert_eq!(info.total_duration, 25.0);
  }

  #[test]
  fn test_render_statistics_creation() {
    let stats = types::RenderStatistics {
      job_id: "test_job".to_string(),
      progress: 0.75,
      status: "rendering".to_string(),
      start_time: "2023-01-01T00:00:00Z".to_string(),
      frames_processed: 75,
      frames_total: 100,
      current_fps: 30.0,
      eta_seconds: 10,
    };

    assert_eq!(stats.job_id, "test_job");
    assert_eq!(stats.progress, 0.75);
    assert_eq!(stats.frames_processed, 75);
    assert_eq!(stats.frames_total, 100);
  }

  #[test]
  fn test_cleanup_result() {
    let result = types::CleanupResult {
      removed_count: 5,
      remaining_count: 3,
    };

    assert_eq!(result.removed_count, 5);
    assert_eq!(result.remaining_count, 3);
  }
}
