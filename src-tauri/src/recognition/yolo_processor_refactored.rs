//! YOLO Processor - Координатор распознавания с использованием YOLO

use crate::recognition::{
  frame_processor::{Detection, FrameProcessor, ProcessingConfig},
  model_manager::{ModelManager, YoloModel},
  result_aggregator::{AggregatedResults, ResultAggregator, ResultFormatter},
};
use anyhow::Result;
use image::DynamicImage;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Конфигурация процессора
#[derive(Debug, Clone)]
pub struct ProcessorConfig {
  /// Модель для использования
  pub model: YoloModel,
  /// Конфигурация обработки кадров
  pub processing_config: ProcessingConfig,
  /// Интервал обработки кадров (обрабатывать каждый N-й кадр)
  pub frame_interval: usize,
  /// Максимальное количество параллельных задач
  pub max_concurrent_tasks: usize,
}

impl Default for ProcessorConfig {
  fn default() -> Self {
    Self {
      model: YoloModel::YoloV11Detection,
      processing_config: ProcessingConfig::default(),
      frame_interval: 1,
      max_concurrent_tasks: 4,
    }
  }
}

/// YOLO процессор
pub struct YoloProcessor {
  model_manager: Arc<Mutex<ModelManager>>,
  frame_processor: Arc<FrameProcessor>,
  config: ProcessorConfig,
  #[allow(dead_code)]
  class_names: Vec<String>,
}

impl YoloProcessor {
  /// Создать новый процессор
  pub async fn new(config: ProcessorConfig) -> Result<Self> {
    let mut model_manager = ModelManager::new(config.model.clone())?;
    model_manager.load_model().await?;

    let class_names = Self::get_class_names_for_model(&config.model);
    let frame_processor = Arc::new(FrameProcessor::new(
      config.processing_config.clone(),
      class_names.clone(),
    ));

    Ok(Self {
      model_manager: Arc::new(Mutex::new(model_manager)),
      frame_processor,
      config,
      class_names,
    })
  }

  /// Обработать одно изображение
  pub async fn process_image(&self, image: &DynamicImage) -> Result<Vec<Detection>> {
    // Предобработка изображения
    let input_tensor = self.frame_processor.preprocess_image(image)?;

    // Инференс и постобработка
    let detections = {
      let mut model_manager = self.model_manager.lock().await;
      let session = model_manager.get_session_mut()?;
      let outputs = session.run(ort::inputs![input_tensor])?;
      self
        .frame_processor
        .postprocess_output(&outputs[0], image)?
    };
    Ok(detections)
  }

  /// Обработать изображение из файла (для обратной совместимости)
  pub async fn process_image_path(&self, image_path: &Path) -> Result<Vec<Detection>> {
    let image = image::open(image_path)?;
    self.process_image(&image).await
  }

  /// Обработать пакет изображений (для обратной совместимости)
  pub async fn process_batch(&self, image_paths: Vec<std::path::PathBuf>) -> Result<Vec<Vec<Detection>>> {
    let mut results = Vec::new();
    for path in image_paths {
      let detections = self.process_image_path(&path).await?;
      results.push(detections);
    }
    Ok(results)
  }

  /// Обработать видео из файла
  pub async fn process_video_file(&self, video_path: &Path) -> Result<AggregatedResults> {
    let mut aggregator = ResultAggregator::new();
    let frames = self.extract_frames(video_path)?;

    let total_frames = frames.len();
    log::info!("Processing {total_frames} frames from video");

    for (frame_idx, (frame_number, timestamp, image)) in frames.into_iter().enumerate() {
      if frame_idx % self.config.frame_interval != 0 {
        continue;
      }

      match self.process_image(&image).await {
        Ok(detections) => {
          aggregator.add_frame_result(frame_number, timestamp, detections);
        }
        Err(e) => {
          log::warn!("Failed to process frame {frame_number}: {e}");
        }
      }

      // Прогресс
      if frame_idx % 30 == 0 {
        let progress = (frame_idx as f32 / total_frames as f32) * 100.0;
        log::info!("Processing progress: {progress:.1}%");
      }
    }

    Ok(aggregator.aggregate())
  }

  /// Обработать последовательность изображений
  pub async fn process_image_sequence(
    &self,
    images: Vec<(usize, f64, DynamicImage)>,
  ) -> Result<AggregatedResults> {
    let mut aggregator = ResultAggregator::new();
    let total = images.len();

    for (idx, (frame_number, timestamp, image)) in images.into_iter().enumerate() {
      match self.process_image(&image).await {
        Ok(detections) => {
          aggregator.add_frame_result(frame_number, timestamp, detections);
        }
        Err(e) => {
          log::warn!("Failed to process frame {frame_number}: {e}");
        }
      }

      if idx % 10 == 0 {
        log::info!("Processed {}/{} images", idx + 1, total);
      }
    }

    Ok(aggregator.aggregate())
  }

  /// Сохранить результаты в файл
  pub async fn save_results(
    &self,
    results: &AggregatedResults,
    output_path: &Path,
    format: OutputFormat,
  ) -> Result<()> {
    let content = match format {
      OutputFormat::Json => serde_json::to_string_pretty(results)?,
      OutputFormat::Csv => ResultFormatter::format_as_csv(results),
      OutputFormat::Text => ResultFormatter::format_as_text(results),
    };

    tokio::fs::write(output_path, content).await?;
    log::info!("Results saved to {output_path:?}");
    Ok(())
  }

  /// Обновить конфигурацию
  pub fn update_config(&mut self, config: ProcessorConfig) {
    self.config = config;
    // Обновляем конфигурацию в frame_processor
    if let Some(fp) = Arc::get_mut(&mut self.frame_processor) {
      fp.update_config(self.config.processing_config.clone())
    }
  }

  /// Получить текущую конфигурацию
  pub fn get_config(&self) -> &ProcessorConfig {
    &self.config
  }

  /// Загрузить модель (для обратной совместимости - модель уже загружена в new())
  pub async fn load_model(&self) -> Result<()> {
    // Модель уже загружена в конструкторе, это no-op для совместимости
    Ok(())
  }

  /// Установить целевые классы для фильтрации (для обратной совместимости)
  pub fn set_target_classes(&mut self, classes: Vec<String>) {
    self.config.processing_config.target_classes = if classes.is_empty() {
      None
    } else {
      Some(classes)
    };
    // Обновляем конфигурацию в frame_processor
    if let Some(fp) = Arc::get_mut(&mut self.frame_processor) {
      fp.update_config(self.config.processing_config.clone())
    }
  }

  /// Получить имена классов как метод (для обратной совместимости)
  pub fn get_class_names(&self) -> Vec<String> {
    self.class_names.clone()
  }

  /// Получить имена классов для модели (статическая функция)
  fn get_class_names_for_model(model: &YoloModel) -> Vec<String> {
    match model {
      YoloModel::YoloV11Detection
      | YoloModel::YoloV8Detection
      | YoloModel::YoloV8Nano
      | YoloModel::YoloV8Small
      | YoloModel::YoloV8Medium
      | YoloModel::YoloV8Large
      | YoloModel::YoloV8Extra => {
        // COCO classes
        vec![
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
          "fire hydrant",
          "stop sign",
          "parking meter",
          "bench",
          "bird",
          "cat",
          "dog",
          "horse",
          "sheep",
          "cow",
          "elephant",
          "bear",
          "zebra",
          "giraffe",
          "backpack",
          "umbrella",
          "handbag",
          "tie",
          "suitcase",
          "frisbee",
          "skis",
          "snowboard",
          "sports ball",
          "kite",
          "baseball bat",
          "baseball glove",
          "skateboard",
          "surfboard",
          "tennis racket",
          "bottle",
          "wine glass",
          "cup",
          "fork",
          "knife",
          "spoon",
          "bowl",
          "banana",
          "apple",
          "sandwich",
          "orange",
          "broccoli",
          "carrot",
          "hot dog",
          "pizza",
          "donut",
          "cake",
          "chair",
          "couch",
          "potted plant",
          "bed",
          "dining table",
          "toilet",
          "tv",
          "laptop",
          "mouse",
          "remote",
          "keyboard",
          "cell phone",
          "microwave",
          "oven",
          "toaster",
          "sink",
          "refrigerator",
          "book",
          "clock",
          "vase",
          "scissors",
          "teddy bear",
          "hair drier",
          "toothbrush",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect()
      }
      YoloModel::YoloV11Face | YoloModel::YoloV8Face => {
        vec!["face".to_string()]
      }
      YoloModel::YoloV11Segmentation | YoloModel::YoloV8Segmentation => {
        // Same as detection but with segmentation masks
        Self::get_class_names_for_model(&YoloModel::YoloV11Detection)
      }
      YoloModel::Custom(_) => {
        // For custom models, return empty vector
        // User should provide class names separately
        vec![]
      }
    }
  }

  /// Извлечь кадры из видео
  fn extract_frames(&self, _video_path: &Path) -> Result<Vec<(usize, f64, DynamicImage)>> {
    // Это упрощенная версия. В реальности нужно использовать FFmpeg
    // или другую библиотеку для извлечения кадров
    log::warn!("Frame extraction not implemented. Using placeholder.");
    Ok(vec![])
  }
}

/// Формат вывода результатов
#[derive(Debug, Clone, Copy)]
pub enum OutputFormat {
  Json,
  Csv,
  Text,
}

/// Построитель процессора для удобной конфигурации
pub struct ProcessorBuilder {
  config: ProcessorConfig,
}

impl ProcessorBuilder {
  /// Создать новый построитель
  pub fn new() -> Self {
    Self {
      config: ProcessorConfig::default(),
    }
  }

  /// Установить модель
  pub fn with_model(mut self, model: YoloModel) -> Self {
    self.config.model = model;
    self
  }

  /// Установить порог уверенности
  pub fn with_confidence_threshold(mut self, threshold: f32) -> Self {
    self.config.processing_config.confidence_threshold = threshold;
    self
  }

  /// Установить порог NMS
  pub fn with_nms_threshold(mut self, threshold: f32) -> Self {
    self.config.processing_config.nms_threshold = threshold;
    self
  }

  /// Установить целевые классы
  pub fn with_target_classes(mut self, classes: Vec<String>) -> Self {
    self.config.processing_config.target_classes = Some(classes);
    self
  }

  /// Установить интервал кадров
  pub fn with_frame_interval(mut self, interval: usize) -> Self {
    self.config.frame_interval = interval;
    self
  }

  /// Построить процессор
  pub async fn build(self) -> Result<YoloProcessor> {
    YoloProcessor::new(self.config).await
  }
}

impl Default for ProcessorBuilder {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_processor_config_default() {
    let config = ProcessorConfig::default();
    assert_eq!(config.frame_interval, 1);
    assert_eq!(config.max_concurrent_tasks, 4);
  }

  #[test]
  fn test_class_names() {
    let coco_classes = YoloProcessor::get_class_names(&YoloModel::YoloV11Detection);
    assert_eq!(coco_classes.len(), 80);
    assert_eq!(coco_classes[0], "person");

    let face_classes = YoloProcessor::get_class_names(&YoloModel::YoloV11Face);
    assert_eq!(face_classes.len(), 1);
    assert_eq!(face_classes[0], "face");
  }

  #[test]
  fn test_processor_builder() {
    let builder = ProcessorBuilder::new()
      .with_model(YoloModel::YoloV11Face)
      .with_confidence_threshold(0.5)
      .with_nms_threshold(0.3)
      .with_frame_interval(5);

    assert_eq!(builder.config.processing_config.confidence_threshold, 0.5);
    assert_eq!(builder.config.frame_interval, 5);
  }
}
