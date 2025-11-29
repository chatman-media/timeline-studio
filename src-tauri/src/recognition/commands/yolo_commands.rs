//! YOLO commands - команды для работы с YOLO процессором

use crate::recognition::frame_processor::ProcessingConfig;
use crate::recognition::model_manager::YoloModel;
use crate::recognition::result_aggregator::AggregatedResults;
use crate::recognition::yolo_processor_refactored::{
  OutputFormat, ProcessorBuilder, ProcessorConfig, YoloProcessor,
};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

/// Состояние для хранения активных процессоров
pub struct YoloProcessorState {
  pub processors: Arc<RwLock<HashMap<String, Arc<RwLock<YoloProcessor>>>>>,
}

impl Default for YoloProcessorState {
  fn default() -> Self {
    Self {
      processors: Arc::new(RwLock::new(HashMap::new())),
    }
  }
}

/// Сериализуемая версия ProcessorConfig
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessorConfigDto {
  pub model: String,
  pub confidence_threshold: f32,
  pub nms_threshold: f32,
  pub frame_interval: usize,
  pub max_concurrent_tasks: usize,
}

impl From<ProcessorConfigDto> for ProcessorConfig {
  fn from(dto: ProcessorConfigDto) -> Self {
    let model = match dto.model.as_str() {
      "yolov11-detection" => YoloModel::YoloV11Detection,
      "yolov8-detection" => YoloModel::YoloV8Detection,
      "yolov11-face" => YoloModel::YoloV11Face,
      "yolov8-face" => YoloModel::YoloV8Face,
      "yolov11-segmentation" => YoloModel::YoloV11Segmentation,
      "yolov8-segmentation" => YoloModel::YoloV8Segmentation,
      custom => YoloModel::Custom(custom.into()),
    };

    Self {
      model,
      processing_config: ProcessingConfig {
        confidence_threshold: dto.confidence_threshold,
        nms_threshold: dto.nms_threshold,
        ..Default::default()
      },
      frame_interval: dto.frame_interval,
      max_concurrent_tasks: dto.max_concurrent_tasks,
    }
  }
}

impl From<&ProcessorConfig> for ProcessorConfigDto {
  fn from(config: &ProcessorConfig) -> Self {
    let model = match &config.model {
      YoloModel::YoloV11Detection => "yolov11-detection".to_string(),
      YoloModel::YoloV8Detection => "yolov8-detection".to_string(),
      YoloModel::YoloV11Face => "yolov11-face".to_string(),
      YoloModel::YoloV8Face => "yolov8-face".to_string(),
      YoloModel::YoloV11Segmentation => "yolov11-segmentation".to_string(),
      YoloModel::YoloV8Segmentation => "yolov8-segmentation".to_string(),
      YoloModel::YoloV8Nano => "yolov8n".to_string(),
      YoloModel::YoloV8Small => "yolov8s".to_string(),
      YoloModel::YoloV8Medium => "yolov8m".to_string(),
      YoloModel::YoloV8Large => "yolov8l".to_string(),
      YoloModel::YoloV8Extra => "yolov8x".to_string(),
      YoloModel::Custom(name) => name.to_string_lossy().to_string(),
    };

    Self {
      model,
      confidence_threshold: config.processing_config.confidence_threshold,
      nms_threshold: config.processing_config.nms_threshold,
      frame_interval: config.frame_interval,
      max_concurrent_tasks: config.max_concurrent_tasks,
    }
  }
}

/// Создать новый YOLO процессор
#[tauri::command]
pub async fn create_yolo_processor(
  processor_id: String,
  config: ProcessorConfigDto,
  state: State<'_, YoloProcessorState>,
) -> Result<String, String> {
  let processor_config: ProcessorConfig = config.into();

  match YoloProcessor::new(processor_config).await {
    Ok(processor) => {
      let mut processors = state.processors.write().await;
      processors.insert(processor_id.clone(), Arc::new(RwLock::new(processor)));
      Ok(processor_id)
    }
    Err(e) => Err(format!("Failed to create processor: {e}")),
  }
}

/// Обработать изображение с помощью YOLO
#[tauri::command]
pub async fn process_image_with_yolo(
  processor_id: String,
  image_path: String,
  state: State<'_, YoloProcessorState>,
) -> Result<serde_json::Value, String> {
  let processors = state.processors.read().await;

  if let Some(processor_arc) = processors.get(&processor_id) {
    let processor = processor_arc.read().await;

    // Загружаем изображение
    match image::open(&image_path) {
      Ok(image) => match processor.process_image(&image).await {
        Ok(detections) => Ok(serde_json::to_value(detections).unwrap()),
        Err(e) => Err(format!("Failed to process image: {e}")),
      },
      Err(e) => Err(format!("Failed to load image: {e}")),
    }
  } else {
    Err(format!("Processor not found: {processor_id}"))
  }
}

/// Обработать видео файл с помощью YOLO
#[tauri::command]
pub async fn process_video_file_with_yolo(
  processor_id: String,
  video_path: String,
  state: State<'_, YoloProcessorState>,
) -> Result<serde_json::Value, String> {
  let processors = state.processors.read().await;

  if let Some(processor_arc) = processors.get(&processor_id) {
    let processor = processor_arc.read().await;
    let path = PathBuf::from(&video_path);

    match processor.process_video_file(&path).await {
      Ok(results) => Ok(serde_json::to_value(results).unwrap()),
      Err(e) => Err(format!("Failed to process video: {e}")),
    }
  } else {
    Err(format!("Processor not found: {processor_id}"))
  }
}

/// Обработать последовательность изображений
#[tauri::command]
pub async fn process_image_sequence_with_yolo(
  processor_id: String,
  image_paths: Vec<String>,
  timestamps: Vec<f64>,
  state: State<'_, YoloProcessorState>,
) -> Result<serde_json::Value, String> {
  if image_paths.len() != timestamps.len() {
    return Err("Image paths and timestamps must have same length".to_string());
  }

  let processors = state.processors.read().await;

  if let Some(processor_arc) = processors.get(&processor_id) {
    let processor = processor_arc.read().await;

    // Загружаем изображения
    let mut images = Vec::new();
    for (idx, (path, timestamp)) in image_paths.iter().zip(timestamps.iter()).enumerate() {
      match image::open(path) {
        Ok(image) => {
          images.push((idx, *timestamp, image));
        }
        Err(e) => {
          log::warn!("Failed to load image {path}: {e}");
        }
      }
    }

    if images.is_empty() {
      return Err("No images loaded successfully".to_string());
    }

    match processor.process_image_sequence(images).await {
      Ok(results) => Ok(serde_json::to_value(results).unwrap()),
      Err(e) => Err(format!("Failed to process image sequence: {e}")),
    }
  } else {
    Err(format!("Processor not found: {processor_id}"))
  }
}

/// Сохранить результаты распознавания
#[tauri::command]
pub async fn save_yolo_results(
  processor_id: String,
  results: AggregatedResults,
  output_path: String,
  format: String,
  state: State<'_, YoloProcessorState>,
) -> Result<(), String> {
  let processors = state.processors.read().await;

  if let Some(processor_arc) = processors.get(&processor_id) {
    let processor = processor_arc.read().await;
    let path = PathBuf::from(&output_path);

    let output_format = match format.as_str() {
      "json" => OutputFormat::Json,
      "csv" => OutputFormat::Csv,
      "text" => OutputFormat::Text,
      _ => return Err("Invalid format. Use 'json', 'csv', or 'text'".to_string()),
    };

    match processor.save_results(&results, &path, output_format).await {
      Ok(_) => Ok(()),
      Err(e) => Err(format!("Failed to save results: {e}")),
    }
  } else {
    Err(format!("Processor not found: {processor_id}"))
  }
}

/// Обновить конфигурацию процессора
#[tauri::command]
pub async fn update_yolo_config(
  processor_id: String,
  config: ProcessorConfigDto,
  state: State<'_, YoloProcessorState>,
) -> Result<(), String> {
  let processors = state.processors.read().await;

  if let Some(processor_arc) = processors.get(&processor_id) {
    let mut processor = processor_arc.write().await;
    let processor_config: ProcessorConfig = config.into();
    processor.update_config(processor_config);
    Ok(())
  } else {
    Err(format!("Processor not found: {processor_id}"))
  }
}

/// Получить конфигурацию процессора
#[tauri::command]
pub async fn get_yolo_config(
  processor_id: String,
  state: State<'_, YoloProcessorState>,
) -> Result<ProcessorConfigDto, String> {
  let processors = state.processors.read().await;

  if let Some(processor_arc) = processors.get(&processor_id) {
    let processor = processor_arc.read().await;
    let config = processor.get_config();
    Ok(config.into())
  } else {
    Err(format!("Processor not found: {processor_id}"))
  }
}

/// Извлечь кадры из видео для обработки
#[tauri::command]
pub async fn extract_frames_for_yolo(
  video_path: String,
  frame_interval: usize,
  max_frames: Option<usize>,
) -> Result<Vec<serde_json::Value>, String> {
  // Это команда-заглушка, так как реальная реализация требует FFmpeg интеграции
  // В реальной реализации здесь должен быть код для извлечения кадров

  log::info!(
    "Extracting frames from {video_path} with interval {frame_interval} (max: {max_frames:?})"
  );

  // Возвращаем пустой массив как заглушку
  Ok(vec![])
}

/// Получить список доступных моделей YOLO
#[tauri::command]
pub async fn get_available_yolo_models() -> Result<Vec<String>, String> {
  Ok(vec![
    "yolov11-detection".to_string(),
    "yolov8-detection".to_string(),
    "yolov11-face".to_string(),
    "yolov8-face".to_string(),
    "yolov11-segmentation".to_string(),
    "yolov8-segmentation".to_string(),
  ])
}

/// Удалить процессор из памяти
#[tauri::command]
pub async fn remove_yolo_processor(
  processor_id: String,
  state: State<'_, YoloProcessorState>,
) -> Result<bool, String> {
  let mut processors = state.processors.write().await;
  Ok(processors.remove(&processor_id).is_some())
}

/// Получить список активных процессоров
#[tauri::command]
pub async fn list_active_yolo_processors(
  state: State<'_, YoloProcessorState>,
) -> Result<Vec<String>, String> {
  let processors = state.processors.read().await;
  Ok(processors.keys().cloned().collect())
}

/// Очистить все неактивные процессоры
#[tauri::command]
pub async fn cleanup_yolo_processors(
  state: State<'_, YoloProcessorState>,
) -> Result<usize, String> {
  let mut processors = state.processors.write().await;
  let initial_count = processors.len();

  // В реальной реализации здесь можно проверять, какие процессоры не используются
  // Пока просто очищаем все
  processors.clear();

  Ok(initial_count)
}

/// Параметры для ProcessorBuilder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessorBuilderParams {
  pub model: Option<String>,
  pub confidence_threshold: Option<f32>,
  pub nms_threshold: Option<f32>,
  pub target_classes: Option<Vec<String>>,
  pub frame_interval: Option<usize>,
}

/// Создать процессор с помощью builder паттерна
#[tauri::command]
pub async fn create_yolo_processor_with_builder(
  processor_id: String,
  params: ProcessorBuilderParams,
  state: State<'_, YoloProcessorState>,
) -> Result<String, String> {
  let mut builder = ProcessorBuilder::new();

  // Применяем параметры если они предоставлены
  if let Some(model_str) = params.model {
    let model = match model_str.as_str() {
      "yolov11-detection" => YoloModel::YoloV11Detection,
      "yolov8-detection" => YoloModel::YoloV8Detection,
      "yolov11-face" => YoloModel::YoloV11Face,
      "yolov8-face" => YoloModel::YoloV8Face,
      "yolov11-segmentation" => YoloModel::YoloV11Segmentation,
      "yolov8-segmentation" => YoloModel::YoloV8Segmentation,
      custom => YoloModel::Custom(custom.into()),
    };
    builder = builder.with_model(model);
  }

  if let Some(threshold) = params.confidence_threshold {
    builder = builder.with_confidence_threshold(threshold);
  }

  if let Some(threshold) = params.nms_threshold {
    builder = builder.with_nms_threshold(threshold);
  }

  if let Some(classes) = params.target_classes {
    builder = builder.with_target_classes(classes);
  }

  if let Some(interval) = params.frame_interval {
    builder = builder.with_frame_interval(interval);
  }

  // Строим процессор
  match builder.build().await {
    Ok(processor) => {
      let mut processors = state.processors.write().await;
      processors.insert(processor_id.clone(), Arc::new(RwLock::new(processor)));
      Ok(processor_id)
    }
    Err(e) => Err(format!("Failed to build processor: {e}")),
  }
}

// Phase 4: Additional YOLO commands (aliases and convenience functions)

/// Detect objects in a single image (alias for process_image_with_yolo)
#[tauri::command]
pub async fn detect_objects_in_image(
  image_path: String,
  confidence_threshold: Option<f32>,
  state: State<'_, YoloProcessorState>,
) -> Result<serde_json::Value, String> {
  log::info!("detect_objects_in_image called for: {}", image_path);

  // Use default processor or create temporary one
  let processor_id = "default".to_string();

  // Update confidence threshold if provided
  if let Some(threshold) = confidence_threshold {
    let config = ProcessorConfigDto {
      model: "yolov11-detection".to_string(),
      confidence_threshold: threshold,
      nms_threshold: 0.4,
      frame_interval: 1,
      max_concurrent_tasks: 1,
    };

    update_yolo_config(processor_id.clone(), config, state.clone()).await?;
  }

  // Process image and return results
  process_image_with_yolo(processor_id, image_path, state).await
}

/// Get advanced YOLO class names with metadata
#[tauri::command]
pub async fn get_yolo_class_names_advanced() -> Result<Vec<serde_json::Value>, String> {
  log::info!("get_yolo_class_names_advanced called");

  // TODO: Implement advanced class names with metadata
  // For now, return basic class names with additional info
  let class_names = [
    "person",
    "bicycle",
    "car",
    "motorcycle",
    "airplane",
    "bus",
    "train",
    "truck",
    "boat",
    "traffic light",
  ];

  Ok(
    class_names
      .iter()
      .enumerate()
      .map(|(id, name)| {
        serde_json::json!({
          "id": id,
          "name": name,
          "category": "object",
          "supercategory": "thing",
          "color": format!("#{:06x}", id * 12345 % 0xFFFFFF),
        })
      })
      .collect(),
  )
}

/// Update YOLO confidence threshold for a specific processor
#[tauri::command]
pub async fn update_yolo_confidence_threshold(
  processor_id: String,
  threshold: f32,
  state: State<'_, YoloProcessorState>,
) -> Result<(), String> {
  log::info!(
    "update_yolo_confidence_threshold called for processor {} with threshold {}",
    processor_id,
    threshold
  );

  if !(0.0..=1.0).contains(&threshold) {
    return Err("Confidence threshold must be between 0.0 and 1.0".to_string());
  }

  // Get current config and update only confidence threshold
  let mut current_config = get_yolo_config(processor_id.clone(), state.clone()).await?;
  current_config.confidence_threshold = threshold;

  update_yolo_config(processor_id, current_config, state).await
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_processor_config_conversion() {
    let dto = ProcessorConfigDto {
      model: "yolov11-detection".to_string(),
      confidence_threshold: 0.5,
      nms_threshold: 0.4,
      frame_interval: 2,
      max_concurrent_tasks: 4,
    };

    let config: ProcessorConfig = dto.clone().into();
    let converted_dto: ProcessorConfigDto = (&config).into();

    assert_eq!(dto.model, converted_dto.model);
    assert_eq!(dto.confidence_threshold, converted_dto.confidence_threshold);
    assert_eq!(dto.nms_threshold, converted_dto.nms_threshold);
    assert_eq!(dto.frame_interval, converted_dto.frame_interval);
    assert_eq!(dto.max_concurrent_tasks, converted_dto.max_concurrent_tasks);
  }
}
