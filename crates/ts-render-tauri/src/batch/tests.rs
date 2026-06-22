//! Тесты для модуля пакетных операций

#[cfg(test)]
mod batch_tests {
  use super::super::*;
  use ts_render::video_compiler::error::VideoCompilerError;
  use std::collections::HashMap;

  #[test]
  fn test_create_batch_job() {
    let operation = BatchOperationType::VideoAnalysis;
    let clip_ids = vec!["clip1".to_string(), "clip2".to_string()];

    let job = business_logic::create_batch_job(operation, clip_ids.clone());

    assert!(!job.job_id.is_empty());
    assert_eq!(job.clip_ids, clip_ids);
    assert_eq!(job.total_clips, 2);
    assert_eq!(job.completed_clips, 0);
    assert_eq!(job.failed_clips, 0);
    assert!(matches!(job.status, BatchJobStatus::Pending));
    assert!(job.end_time.is_none());
  }

  #[test]
  fn test_update_job_status() {
    let mut job = business_logic::create_batch_job(
      BatchOperationType::SceneDetection,
      vec!["clip1".to_string()],
    );

    // Обновляем на Running
    business_logic::update_job_status(&mut job, BatchJobStatus::Running);
    assert!(matches!(job.status, BatchJobStatus::Running));
    assert!(job.end_time.is_none());

    // Обновляем на Completed
    business_logic::update_job_status(&mut job, BatchJobStatus::Completed);
    assert!(matches!(job.status, BatchJobStatus::Completed));
    assert!(job.end_time.is_some());
  }

  #[test]
  fn test_add_clip_result_success() {
    let mut job = business_logic::create_batch_job(
      BatchOperationType::AudioAnalysis,
      vec!["clip1".to_string(), "clip2".to_string()],
    );

    let result = BatchClipResult {
      clip_id: "clip1".to_string(),
      success: true,
      error: None,
      result: Some(serde_json::json!({"audio": "data"})),
      data: Some(serde_json::json!({"audio": "data"})),
      execution_time_ms: 1234,
      processing_time_ms: 1234,
    };

    business_logic::add_clip_result(&mut job, "clip1".to_string(), result);

    assert_eq!(job.completed_clips, 1);
    assert_eq!(job.failed_clips, 0);
    assert!(job.results.contains_key("clip1"));
  }

  #[test]
  fn test_add_clip_result_failure() {
    let mut job = business_logic::create_batch_job(
      BatchOperationType::WhisperTranscription,
      vec!["clip1".to_string()],
    );

    let result = BatchClipResult {
      clip_id: "clip1".to_string(),
      success: false,
      error: Some("Transcription failed".to_string()),
      result: None,
      data: None,
      execution_time_ms: 500,
      processing_time_ms: 500,
    };

    business_logic::add_clip_result(&mut job, "clip1".to_string(), result);

    assert_eq!(job.completed_clips, 0);
    assert_eq!(job.failed_clips, 1);
    assert_eq!(job.errors.len(), 1);
    assert!(job.errors[0].contains("Transcription failed"));
  }

  #[test]
  fn test_calculate_progress() {
    let mut job = business_logic::create_batch_job(
      BatchOperationType::VideoAnalysis,
      vec![
        "clip1".to_string(),
        "clip2".to_string(),
        "clip3".to_string(),
      ],
    );

    job.completed_clips = 2;
    job.failed_clips = 0;

    let progress = business_logic::calculate_progress(&job);

    assert_eq!(progress.job_id, job.job_id);
    assert_eq!(progress.current_clip_index, 2);
    assert_eq!(progress.total_clips, 3);
    assert!((progress.percentage - 66.67).abs() < 0.1);
  }

  #[test]
  fn test_calculate_batch_statistics_empty() {
    let stats = business_logic::calculate_batch_statistics(&[]);

    assert_eq!(stats.total_processing_time_ms, 0);
    assert_eq!(stats.average_clip_time_ms, 0);
    assert_eq!(stats.success_rate, 0.0);
    assert_eq!(stats.total_errors, 0);
  }

  #[test]
  fn test_calculate_batch_statistics_with_jobs() {
    let mut job1 = business_logic::create_batch_job(
      BatchOperationType::VideoAnalysis,
      vec!["clip1".to_string(), "clip2".to_string()],
    );
    job1.completed_clips = 2;
    job1.failed_clips = 0;

    let mut job2 = business_logic::create_batch_job(
      BatchOperationType::SceneDetection,
      vec!["clip3".to_string(), "clip4".to_string()],
    );
    job2.completed_clips = 1;
    job2.failed_clips = 1;

    let jobs = vec![job1, job2];
    let stats = business_logic::calculate_batch_statistics(&jobs);

    assert_eq!(stats.success_rate, 75.0); // 3 successful out of 4
    assert_eq!(stats.total_errors, 1);
  }

  #[test]
  fn test_validate_batch_params_empty_clips() {
    let params = BatchAnalysisParams {
      clip_ids: vec![],
      operation: BatchOperationType::VideoAnalysis,
      options: HashMap::new(),
    };

    let result = business_logic::validate_batch_params(&params);
    assert!(result.is_err());
    assert!(matches!(
      result.unwrap_err(),
      VideoCompilerError::InvalidParameter(_)
    ));
  }

  #[test]
  fn test_validate_batch_params_duplicate_clips() {
    let params = BatchAnalysisParams {
      clip_ids: vec![
        "clip1".to_string(),
        "clip2".to_string(),
        "clip1".to_string(),
      ],
      operation: BatchOperationType::VideoAnalysis,
      options: HashMap::new(),
    };

    let result = business_logic::validate_batch_params(&params);
    assert!(result.is_err());
    assert!(matches!(
      result.unwrap_err(),
      VideoCompilerError::InvalidParameter(_)
    ));
  }

  #[test]
  fn test_validate_batch_params_valid() {
    let params = BatchAnalysisParams {
      clip_ids: vec!["clip1".to_string(), "clip2".to_string()],
      operation: BatchOperationType::VideoAnalysis,
      options: HashMap::new(),
    };

    let result = business_logic::validate_batch_params(&params);
    assert!(result.is_ok());
  }

  #[test]
  fn test_determine_optimal_concurrency() {
    let cpu_cores = num_cpus::get();

    // Heavy operation
    let concurrency = business_logic::determine_optimal_concurrency(
      100,
      &BatchOperationType::ComprehensiveAnalysis,
    );
    assert!(concurrency <= cpu_cores);
    assert!(concurrency >= 1);

    // Light operation
    let concurrency =
      business_logic::determine_optimal_concurrency(100, &BatchOperationType::LanguageDetection);
    assert!(concurrency <= cpu_cores);

    // Few clips
    let concurrency =
      business_logic::determine_optimal_concurrency(2, &BatchOperationType::VideoAnalysis);
    assert_eq!(concurrency, 2);
  }

  #[test]
  fn test_group_clips_for_processing() {
    let clip_ids = vec![
      "clip1".to_string(),
      "clip2".to_string(),
      "clip3".to_string(),
      "clip4".to_string(),
      "clip5".to_string(),
    ];

    // Batch size 2
    let groups = business_logic::group_clips_for_processing(clip_ids.clone(), 2);
    assert_eq!(groups.len(), 3);
    assert_eq!(groups[0].len(), 2);
    assert_eq!(groups[1].len(), 2);
    assert_eq!(groups[2].len(), 1);

    // Batch size 0 (all in one group)
    let groups = business_logic::group_clips_for_processing(clip_ids, 0);
    assert_eq!(groups.len(), 1);
    assert_eq!(groups[0].len(), 5);
  }

  #[test]
  fn test_can_cancel_job() {
    let mut job = business_logic::create_batch_job(
      BatchOperationType::VideoAnalysis,
      vec!["clip1".to_string()],
    );

    // Pending - can cancel
    assert!(business_logic::can_cancel_job(&job));

    // Running - can cancel
    job.status = BatchJobStatus::Running;
    assert!(business_logic::can_cancel_job(&job));

    // Completed - cannot cancel
    job.status = BatchJobStatus::Completed;
    assert!(!business_logic::can_cancel_job(&job));

    // Failed - cannot cancel
    job.status = BatchJobStatus::Failed;
    assert!(!business_logic::can_cancel_job(&job));

    // Cancelled - cannot cancel
    job.status = BatchJobStatus::Cancelled;
    assert!(!business_logic::can_cancel_job(&job));
  }

  #[test]
  fn test_format_execution_time() {
    assert_eq!(business_logic::format_execution_time(500), "500ms");
    assert_eq!(business_logic::format_execution_time(1500), "1.5s");
    assert_eq!(business_logic::format_execution_time(65000), "1m 5s");
    assert_eq!(business_logic::format_execution_time(125000), "2m 5s");
  }

  #[test]
  fn test_batch_job_status_serialization() {
    let status = BatchJobStatus::Running;
    let json = serde_json::to_string(&status).unwrap();
    assert_eq!(json, "\"Running\"");

    let deserialized: BatchJobStatus = serde_json::from_str(&json).unwrap();
    assert_eq!(status, deserialized);
  }

  #[test]
  fn test_batch_operation_type_serialization() {
    let op = BatchOperationType::VideoAnalysis;
    let json = serde_json::to_string(&op).unwrap();
    assert_eq!(json, "\"video_analysis\"");

    let deserialized: BatchOperationType = serde_json::from_str(&json).unwrap();
    assert!(matches!(deserialized, BatchOperationType::VideoAnalysis));
  }
}
