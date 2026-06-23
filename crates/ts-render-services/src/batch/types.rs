//! Типы для пакетных операций

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Статус пакетного задания
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum BatchJobStatus {
  Pending,
  Running,
  Completed,
  Failed,
  Cancelled,
}

/// Тип пакетной операции
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BatchOperationType {
  VideoAnalysis,
  WhisperTranscription,
  SubtitleGeneration,
  QualityAnalysis,
  SceneDetection,
  MotionAnalysis,
  AudioAnalysis,
  LanguageDetection,
  ComprehensiveAnalysis,
}

/// Информация о пакетном задании
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchJobInfo {
  pub job_id: String,
  pub operation: BatchOperationType,
  pub clip_ids: Vec<String>,
  pub status: BatchJobStatus,
  pub total_clips: usize,
  pub completed_clips: usize,
  pub failed_clips: usize,
  pub start_time: String,
  pub end_time: Option<String>,
  pub errors: Vec<String>,
  pub results: HashMap<String, serde_json::Value>,
}

/// Результат пакетной операции для одного клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchClipResult {
  pub clip_id: String,
  pub success: bool,
  pub data: Option<serde_json::Value>, // Alias for result
  pub error: Option<String>,
  pub result: Option<serde_json::Value>,
  pub execution_time_ms: u64,
  pub processing_time_ms: u64,
}

/// Параметры пакетного анализа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchAnalysisParams {
  pub clip_ids: Vec<String>,
  pub operation: BatchOperationType,
  pub options: HashMap<String, serde_json::Value>,
}

/// Прогресс пакетной операции
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchProgress {
  pub job_id: String,
  pub current_clip_id: Option<String>,
  pub current_clip_index: usize,
  pub total_clips: usize,
  pub percentage: f32,
  pub estimated_time_remaining_secs: Option<u64>,
}

/// Статистика пакетной операции
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchStatistics {
  pub total_processing_time_ms: u64,
  pub average_clip_time_ms: u64,
  pub fastest_clip_time_ms: u64,
  pub slowest_clip_time_ms: u64,
  pub success_rate: f32,
  pub total_errors: usize,
}

/// Статистика пакетных операций (для совместимости)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchProcessingStats {
  pub total_jobs: usize,
  pub running_jobs: usize,
  pub completed_jobs: usize,
  pub failed_jobs: usize,
  pub average_execution_time_ms: u64,
  pub total_clips_processed: usize,
  pub success_rate: f64,
}

/// Параметры для создания пакетного задания
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBatchJobParams {
  pub operation: BatchOperationType,
  pub clip_ids: Vec<String>,
  pub options: HashMap<String, serde_json::Value>,
  pub max_concurrent: Option<usize>,
  pub priority: Option<String>,
}
