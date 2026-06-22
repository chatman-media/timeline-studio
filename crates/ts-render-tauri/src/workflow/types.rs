//! Типы для автоматизированных рабочих процессов видеомонтажа

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowExecutionResult {
  pub success: bool,
  pub workflow_id: String,
  pub message: String,
  pub outputs: Vec<WorkflowOutput>,
  pub execution_time: f64,
  pub steps_completed: u32,
  pub steps_failed: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowOutput {
  pub output_type: String,
  pub file_path: String,
  pub metadata: WorkflowOutputMetadata,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowOutputMetadata {
  pub duration: f64,
  pub file_size: u64,
  pub width: u32,
  pub height: u32,
  pub quality_score: u8,
}
