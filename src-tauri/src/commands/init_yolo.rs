//! Init YOLO Processor Command
//!
//! Standalone command for initializing YOLO processor from legacy yolo_commands module.

use crate::recognition::{YoloModel, YoloProcessor};
use crate::recognition::yolo_processor_refactored::ProcessorConfig;
use crate::recognition::frame_processor::ProcessingConfig;
use tauri::State;
use tokio::sync::Mutex;

/// Инициализация YOLO процессора с указанной моделью
#[tauri::command]
pub async fn init_yolo_processor(
  model_type: String,
  confidence_threshold: f32,
  yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<String, String> {
  let model = match model_type.as_str() {
    "yolo11-detection" => YoloModel::YoloV11Detection,
    "yolo11-face" => YoloModel::YoloV11Face,
    "yolo8-detection" => YoloModel::YoloV8Detection,
    "yolo8-face" => YoloModel::YoloV8Face,
    _ => return Err(format!("Unknown model type: {}", model_type)),
  };

  let mut processing_config = ProcessingConfig::default();
  processing_config.confidence_threshold = confidence_threshold;

  let config = ProcessorConfig {
    model,
    processing_config,
    frame_interval: 5,
    max_concurrent_tasks: 4,
  };

  match YoloProcessor::new(config).await {
    Ok(processor) => {
      let mut state = yolo_state.lock().await;
      *state = Some(processor);
      Ok(format!("YOLO processor initialized successfully"))
    }
    Err(e) => Err(format!("Failed to create YOLO processor: {}", e)),
  }
}
