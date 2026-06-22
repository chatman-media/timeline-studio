//! Тесты для модуля pipeline

#[cfg(test)]
mod pipeline_tests {
  use super::super::*;

  #[test]
  fn test_pipeline_info_serialization() {
    let info = PipelineInfo {
      stages: vec!["validation".to_string(), "preprocessing".to_string()],
      is_running: true,
      progress: 50,
      statistics: serde_json::json!({"frames_processed": 100}),
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("validation"));
    assert!(json.contains("frames_processed"));

    // Десериализация
    let deserialized: PipelineInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.stages.len(), 2);
    assert!(deserialized.is_running);
    assert_eq!(deserialized.progress, 50);
  }

  #[test]
  fn test_generate_job_id() {
    let id1 = business_logic::generate_job_id();
    let id2 = business_logic::generate_job_id();

    assert!(!id1.is_empty());
    assert!(!id2.is_empty());
    assert_ne!(id1, id2);
  }

  #[test]
  fn test_can_cancel_pipeline() {
    assert!(business_logic::can_cancel_pipeline(
      &PipelineStatus::Created
    ));
    assert!(business_logic::can_cancel_pipeline(
      &PipelineStatus::Running
    ));
    assert!(business_logic::can_cancel_pipeline(&PipelineStatus::Paused));
    assert!(!business_logic::can_cancel_pipeline(
      &PipelineStatus::Completed
    ));
    assert!(!business_logic::can_cancel_pipeline(
      &PipelineStatus::Failed
    ));
    assert!(!business_logic::can_cancel_pipeline(
      &PipelineStatus::Cancelled
    ));
  }

  #[test]
  fn test_is_pipeline_completed() {
    assert!(!business_logic::is_pipeline_completed(
      &PipelineStatus::Created
    ));
    assert!(!business_logic::is_pipeline_completed(
      &PipelineStatus::Running
    ));
    assert!(!business_logic::is_pipeline_completed(
      &PipelineStatus::Paused
    ));
    assert!(business_logic::is_pipeline_completed(
      &PipelineStatus::Completed
    ));
    assert!(business_logic::is_pipeline_completed(
      &PipelineStatus::Failed
    ));
    assert!(business_logic::is_pipeline_completed(
      &PipelineStatus::Cancelled
    ));
  }

  #[test]
  fn test_validate_pipeline_config() {
    // Valid config
    let valid_config = PipelineConfig {
      max_concurrent_stages: 4,
      memory_limit_mb: Some(1024),
      enable_gpu: true,
      enable_cache: true,
      log_level: "info".to_string(),
      timeout_seconds: Some(3600),
    };
    assert!(business_logic::validate_pipeline_config(&valid_config).is_ok());

    // Invalid: zero concurrent stages
    let invalid_config1 = PipelineConfig {
      max_concurrent_stages: 0,
      ..valid_config.clone()
    };
    assert!(business_logic::validate_pipeline_config(&invalid_config1).is_err());

    // Invalid: memory limit too low
    let invalid_config2 = PipelineConfig {
      memory_limit_mb: Some(50),
      ..valid_config.clone()
    };
    assert!(business_logic::validate_pipeline_config(&invalid_config2).is_err());

    // Invalid: zero timeout
    let invalid_config3 = PipelineConfig {
      timeout_seconds: Some(0),
      ..valid_config
    };
    assert!(business_logic::validate_pipeline_config(&invalid_config3).is_err());
  }

  #[test]
  fn test_calculate_total_progress() {
    let stages = vec![
      PipelineStage {
        name: "stage1".to_string(),
        status: StageStatus::Completed,
        progress: 100,
        duration_ms: 1000,
        error: None,
      },
      PipelineStage {
        name: "stage2".to_string(),
        status: StageStatus::Running,
        progress: 50,
        duration_ms: 500,
        error: None,
      },
      PipelineStage {
        name: "stage3".to_string(),
        status: StageStatus::Pending,
        progress: 0,
        duration_ms: 0,
        error: None,
      },
    ];

    let progress = business_logic::calculate_total_progress(&stages);
    assert_eq!(progress, 50); // (100 + 50 + 0) / 3

    // Empty stages
    let empty_stages: Vec<PipelineStage> = vec![];
    assert_eq!(business_logic::calculate_total_progress(&empty_stages), 0);
  }

  #[test]
  fn test_aggregate_stage_statistics() {
    let stages = vec![
      PipelineStage {
        name: "completed1".to_string(),
        status: StageStatus::Completed,
        progress: 100,
        duration_ms: 1000,
        error: None,
      },
      PipelineStage {
        name: "completed2".to_string(),
        status: StageStatus::Completed,
        progress: 100,
        duration_ms: 2000,
        error: None,
      },
      PipelineStage {
        name: "failed".to_string(),
        status: StageStatus::Failed,
        progress: 80,
        duration_ms: 500,
        error: Some("Error occurred".to_string()),
      },
      PipelineStage {
        name: "skipped".to_string(),
        status: StageStatus::Skipped,
        progress: 0,
        duration_ms: 0,
        error: None,
      },
    ];

    let stats = business_logic::aggregate_stage_statistics(&stages);
    assert_eq!(stats.stages_completed, 2);
    assert_eq!(stats.stages_failed, 1);
    assert_eq!(stats.stages_skipped, 1);
    assert_eq!(stats.total_duration_ms, 3500);
  }

  #[test]
  fn test_create_pipeline_context() {
    let context = business_logic::create_pipeline_context(
      "Test Project".to_string(),
      "/output/video.mp4".to_string(),
      "/tmp/pipeline".to_string(),
    );

    assert_eq!(context.project_name, "Test Project");
    assert_eq!(context.output_path, "/output/video.mp4");
    assert_eq!(context.temp_dir, "/tmp/pipeline");
    assert!(context.intermediate_files.is_empty());
    assert!(context.user_data.is_empty());
    assert!(!context.is_cancelled);
  }

  #[test]
  fn test_update_stage_status() {
    let mut stages = vec![
      PipelineStage {
        name: "stage1".to_string(),
        status: StageStatus::Running,
        progress: 50,
        duration_ms: 1000,
        error: None,
      },
      PipelineStage {
        name: "stage2".to_string(),
        status: StageStatus::Pending,
        progress: 0,
        duration_ms: 0,
        error: None,
      },
    ];

    // Update to completed
    business_logic::update_stage_status(&mut stages, "stage1", StageStatus::Completed, None);
    assert_eq!(stages[0].status, StageStatus::Completed);
    assert_eq!(stages[0].progress, 100);
    assert!(stages[0].error.is_none());

    // Update to failed
    business_logic::update_stage_status(
      &mut stages,
      "stage2",
      StageStatus::Failed,
      Some("Test error".to_string()),
    );
    assert_eq!(stages[1].status, StageStatus::Failed);
    assert_eq!(stages[1].error, Some("Test error".to_string()));
  }

  #[test]
  fn test_find_active_stage() {
    let stages = vec![
      PipelineStage {
        name: "completed".to_string(),
        status: StageStatus::Completed,
        progress: 100,
        duration_ms: 1000,
        error: None,
      },
      PipelineStage {
        name: "running".to_string(),
        status: StageStatus::Running,
        progress: 50,
        duration_ms: 500,
        error: None,
      },
      PipelineStage {
        name: "pending".to_string(),
        status: StageStatus::Pending,
        progress: 0,
        duration_ms: 0,
        error: None,
      },
    ];

    let active = business_logic::find_active_stage(&stages);
    assert!(active.is_some());
    assert_eq!(active.unwrap().name, "running");
  }

  #[test]
  fn test_get_next_pending_stage() {
    let stages = vec![
      PipelineStage {
        name: "completed".to_string(),
        status: StageStatus::Completed,
        progress: 100,
        duration_ms: 1000,
        error: None,
      },
      PipelineStage {
        name: "pending1".to_string(),
        status: StageStatus::Pending,
        progress: 0,
        duration_ms: 0,
        error: None,
      },
      PipelineStage {
        name: "pending2".to_string(),
        status: StageStatus::Pending,
        progress: 0,
        duration_ms: 0,
        error: None,
      },
    ];

    let next = business_logic::get_next_pending_stage(&stages);
    assert!(next.is_some());
    assert_eq!(next.unwrap().name, "pending1");
  }

  #[test]
  fn test_all_stages_completed() {
    let completed_stages = vec![
      PipelineStage {
        name: "stage1".to_string(),
        status: StageStatus::Completed,
        progress: 100,
        duration_ms: 1000,
        error: None,
      },
      PipelineStage {
        name: "stage2".to_string(),
        status: StageStatus::Failed,
        progress: 80,
        duration_ms: 800,
        error: Some("Error".to_string()),
      },
      PipelineStage {
        name: "stage3".to_string(),
        status: StageStatus::Skipped,
        progress: 0,
        duration_ms: 0,
        error: None,
      },
    ];
    assert!(business_logic::all_stages_completed(&completed_stages));

    let incomplete_stages = vec![
      PipelineStage {
        name: "stage1".to_string(),
        status: StageStatus::Completed,
        progress: 100,
        duration_ms: 1000,
        error: None,
      },
      PipelineStage {
        name: "stage2".to_string(),
        status: StageStatus::Running,
        progress: 50,
        duration_ms: 500,
        error: None,
      },
    ];
    assert!(!business_logic::all_stages_completed(&incomplete_stages));
  }

  #[test]
  fn test_collect_stage_errors() {
    let stages = vec![
      PipelineStage {
        name: "stage1".to_string(),
        status: StageStatus::Completed,
        progress: 100,
        duration_ms: 1000,
        error: None,
      },
      PipelineStage {
        name: "stage2".to_string(),
        status: StageStatus::Failed,
        progress: 80,
        duration_ms: 800,
        error: Some("Custom error message".to_string()),
      },
      PipelineStage {
        name: "stage3".to_string(),
        status: StageStatus::Failed,
        progress: 0,
        duration_ms: 0,
        error: None,
      },
    ];

    let errors = business_logic::collect_stage_errors(&stages);
    assert_eq!(errors.len(), 2);
    assert_eq!(errors[0], "Custom error message");
    assert_eq!(errors[1], "Stage 'stage3' failed");
  }

  #[test]
  fn test_create_pipeline_result() {
    let stages = vec![
      PipelineStage {
        name: "stage1".to_string(),
        status: StageStatus::Completed,
        progress: 100,
        duration_ms: 1000,
        error: None,
      },
      PipelineStage {
        name: "stage2".to_string(),
        status: StageStatus::Failed,
        progress: 80,
        duration_ms: 800,
        error: Some("Error occurred".to_string()),
      },
    ];

    let result = business_logic::create_pipeline_result(
      "test-job-123".to_string(),
      PipelineStatus::Failed,
      stages.clone(),
      None,
    );

    assert_eq!(result.job_id, "test-job-123");
    assert_eq!(result.status, PipelineStatus::Failed);
    assert!(result.output_file.is_none());
    assert_eq!(result.duration_ms, 1800);
    assert_eq!(result.stages.len(), 2);
    assert_eq!(result.errors.len(), 1);
    assert_eq!(result.errors[0], "Error occurred");
  }

  #[test]
  fn test_validate_output_path() {
    // Valid paths
    assert!(business_logic::validate_output_path("/output/video.mp4").is_ok());
    assert!(business_logic::validate_output_path("C:\\output\\video.mov").is_ok());
    assert!(business_logic::validate_output_path("./output/video.mkv").is_ok());
    assert!(business_logic::validate_output_path("/path/to/video.webm").is_ok());

    // Invalid: empty path
    assert!(business_logic::validate_output_path("").is_err());

    // Invalid: no extension
    assert!(business_logic::validate_output_path("/output/video").is_err());

    // Invalid: unsupported extension
    assert!(business_logic::validate_output_path("/output/video.txt").is_err());
    assert!(business_logic::validate_output_path("/output/video.jpg").is_err());
  }

  #[test]
  fn test_format_duration() {
    assert_eq!(business_logic::format_duration(500), "500ms");
    assert_eq!(business_logic::format_duration(1500), "1.5s");
    assert_eq!(business_logic::format_duration(65000), "1m 5s");
    assert_eq!(business_logic::format_duration(125000), "2m 5s");
    assert_eq!(business_logic::format_duration(0), "0ms");
  }

  #[test]
  fn test_pipeline_status_serialization() {
    let statuses = vec![
      PipelineStatus::Created,
      PipelineStatus::Running,
      PipelineStatus::Paused,
      PipelineStatus::Completed,
      PipelineStatus::Failed,
      PipelineStatus::Cancelled,
    ];

    for status in statuses {
      let json = serde_json::to_string(&status).unwrap();
      let deserialized: PipelineStatus = serde_json::from_str(&json).unwrap();
      assert_eq!(status, deserialized);
    }
  }

  #[test]
  fn test_stage_status_serialization() {
    let statuses = vec![
      StageStatus::Pending,
      StageStatus::Running,
      StageStatus::Completed,
      StageStatus::Failed,
      StageStatus::Skipped,
    ];

    for status in statuses {
      let json = serde_json::to_string(&status).unwrap();
      let deserialized: StageStatus = serde_json::from_str(&json).unwrap();
      assert_eq!(status, deserialized);
    }
  }
}
