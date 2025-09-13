//! Frame Processor - Обработка кадров для распознавания

use anyhow::{Result, anyhow};
use image::{DynamicImage, GenericImageView, imageops::FilterType};
use ort::value::Tensor;
use serde::{Deserialize, Serialize};

/// Результат обнаружения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
  /// Класс объекта
  pub class: String,
  /// ID класса
  pub class_id: usize,
  /// Уверенность (0.0 - 1.0)
  pub confidence: f32,
  /// Координаты (x, y, width, height) в пикселях
  pub bbox: BoundingBox,
  /// Дополнительные атрибуты (для лиц)
  pub attributes: Option<FaceAttributes>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  pub x: f32,
  pub y: f32,
  pub width: f32,
  pub height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceAttributes {
  /// Ключевые точки лица
  pub landmarks: Vec<(f32, f32)>,
  /// Предполагаемый возраст
  pub age: Option<f32>,
  /// Предполагаемый пол
  pub gender: Option<String>,
  /// Эмоция
  pub emotion: Option<String>,
}

/// Конфигурация обработки
#[derive(Debug, Clone)]
pub struct ProcessingConfig {
  pub input_size: (u32, u32),
  pub confidence_threshold: f32,
  pub nms_threshold: f32,
  pub target_classes: Option<Vec<String>>,
}

impl Default for ProcessingConfig {
  fn default() -> Self {
    Self {
      input_size: (640, 640),
      confidence_threshold: 0.25,
      nms_threshold: 0.45,
      target_classes: None,
    }
  }
}

/// Процессор кадров
pub struct FrameProcessor {
  config: ProcessingConfig,
  class_names: Vec<String>,
}

impl FrameProcessor {
  /// Создать новый процессор
  pub fn new(config: ProcessingConfig, class_names: Vec<String>) -> Self {
    Self {
      config,
      class_names,
    }
  }

  /// Предобработка изображения для YOLO
  pub fn preprocess_image(&self, img: &DynamicImage) -> Result<Tensor<f32>> {
    let (input_width, input_height) = self.config.input_size;

    // Изменяем размер изображения
    let resized = img.resize_exact(input_width, input_height, FilterType::Triangle);
    let img_array = ndarray::Array4::from_shape_fn(
      (1, 3, input_height as usize, input_width as usize),
      |(_, c, y, x)| {
        let pixel = resized.get_pixel(x as u32, y as u32);
        let channel_value = match c {
          0 => pixel[0],
          1 => pixel[1],
          2 => pixel[2],
          _ => unreachable!(),
        };
        channel_value as f32 / 255.0
      },
    );

    Tensor::from_array((img_array.shape().to_vec(), img_array.into_raw_vec()))
      .map_err(|e| anyhow!("Failed to create tensor: {}", e))
  }

  /// Постобработка выходных данных YOLO
  pub fn postprocess_output(
    &self,
    output: &ort::value::Value,
    original_img: &DynamicImage,
  ) -> Result<Vec<Detection>> {
    let output_shape = output.shape();

    if output_shape.len() != 3 {
      return Err(anyhow!(
        "Unexpected output shape: {:?}. Expected 3 dimensions.",
        output_shape
      ));
    }

    let num_classes = output_shape[1].saturating_sub(4);
    let num_boxes = output_shape[2];

    let output_data = output.try_extract_tensor::<f32>()?.1;
    let output_array = ndarray::ArrayView2::from_shape(
      (output_shape[1] as usize, output_shape[2] as usize),
      output_data,
    )
    .map_err(|e| anyhow!("Failed to reshape output: {}", e))?;

    let mut detections = Vec::new();
    let (img_width, img_height) = original_img.dimensions();
    let scale_x = img_width as f32 / self.config.input_size.0 as f32;
    let scale_y = img_height as f32 / self.config.input_size.1 as f32;

    for i in 0..num_boxes {
      // Извлекаем координаты bbox
      let cx = output_array[[0, i as usize]];
      let cy = output_array[[1, i as usize]];
      let w = output_array[[2, i as usize]];
      let h = output_array[[3, i as usize]];

      // Находим максимальную уверенность и соответствующий класс
      let mut max_conf = 0.0;
      let mut class_id = 0usize;

      for j in 0..num_classes {
        let conf = output_array[[4 + j as usize, i as usize]];
        if conf > max_conf {
          max_conf = conf;
          class_id = j as usize;
        }
      }

      // Фильтруем по порогу уверенности
      if max_conf < self.config.confidence_threshold {
        continue;
      }

      // Фильтруем по целевым классам, если заданы
      if let Some(target_classes) = &self.config.target_classes {
        let class_name = self
          .class_names
          .get(class_id)
          .unwrap_or(&"unknown".to_string())
          .clone();
        if !target_classes.contains(&class_name) {
          continue;
        }
      }

      // Преобразуем координаты в исходный масштаб
      let x = (cx - w / 2.0) * scale_x;
      let y = (cy - h / 2.0) * scale_y;
      let width = w * scale_x;
      let height = h * scale_y;

      let bbox = BoundingBox {
        x: x.max(0.0),
        y: y.max(0.0),
        width: width.min(img_width as f32 - x),
        height: height.min(img_height as f32 - y),
      };

      let class_name = self
        .class_names
        .get(class_id)
        .unwrap_or(&"unknown".to_string())
        .clone();

      detections.push(Detection {
        class: class_name,
        class_id,
        confidence: max_conf,
        bbox,
        attributes: None,
      });
    }

    // Применяем Non-Maximum Suppression
    let filtered_detections = self.apply_nms(detections);
    Ok(filtered_detections)
  }

  /// Применение Non-Maximum Suppression
  fn apply_nms(&self, mut detections: Vec<Detection>) -> Vec<Detection> {
    if detections.is_empty() {
      return detections;
    }

    // Сортируем по уверенности в убывающем порядке
    detections.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

    let mut keep = vec![true; detections.len()];

    for i in 0..detections.len() {
      if !keep[i] {
        continue;
      }

      for j in (i + 1)..detections.len() {
        if !keep[j] || detections[i].class_id != detections[j].class_id {
          continue;
        }

        let iou = calculate_iou(&detections[i].bbox, &detections[j].bbox);
        if iou > self.config.nms_threshold {
          keep[j] = false;
        }
      }
    }

    detections
      .into_iter()
      .zip(keep)
      .filter_map(|(det, keep)| if keep { Some(det) } else { None })
      .collect()
  }

  /// Обновить конфигурацию
  pub fn update_config(&mut self, config: ProcessingConfig) {
    self.config = config;
  }

  /// Получить имена классов
  #[allow(dead_code)]
  pub fn get_class_names(&self) -> &[String] {
    &self.class_names
  }
}

/// Вычислить Intersection over Union (IoU)
fn calculate_iou(bbox1: &BoundingBox, bbox2: &BoundingBox) -> f32 {
  let x1 = bbox1.x.max(bbox2.x);
  let y1 = bbox1.y.max(bbox2.y);
  let x2 = (bbox1.x + bbox1.width).min(bbox2.x + bbox2.width);
  let y2 = (bbox1.y + bbox1.height).min(bbox2.y + bbox2.height);

  if x2 < x1 || y2 < y1 {
    return 0.0;
  }

  let intersection = (x2 - x1) * (y2 - y1);
  let area1 = bbox1.width * bbox1.height;
  let area2 = bbox2.width * bbox2.height;
  let union = area1 + area2 - intersection;

  if union > 0.0 {
    intersection / union
  } else {
    0.0
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_calculate_iou() {
    let bbox1 = BoundingBox {
      x: 0.0,
      y: 0.0,
      width: 100.0,
      height: 100.0,
    };

    let bbox2 = BoundingBox {
      x: 50.0,
      y: 50.0,
      width: 100.0,
      height: 100.0,
    };

    let iou = calculate_iou(&bbox1, &bbox2);
    assert!((iou - 0.142857).abs() < 0.001); // ~1/7
  }

  #[test]
  fn test_processing_config_default() {
    let config = ProcessingConfig::default();
    assert_eq!(config.input_size, (640, 640));
    assert_eq!(config.confidence_threshold, 0.25);
    assert_eq!(config.nms_threshold, 0.45);
  }
}
