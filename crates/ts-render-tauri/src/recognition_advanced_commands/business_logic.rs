//! Бизнес-логика для продвинутых команд распознавания (тестируемые функции)

use super::types::*;

/// Получить список стандартных классов COCO для YOLO моделей
pub fn get_coco_class_names() -> Vec<String> {
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

/// Создать информацию о классах модели
pub fn create_model_class_info(model_type: &str, confidence_threshold: f32) -> ModelClassInfo {
  let class_names = match model_type {
    "YOLOv5" | "YOLOv8" => get_coco_class_names(),
    "face_detection" => vec!["face".to_string()],
    "custom" => vec!["object".to_string()],
    _ => get_coco_class_names(),
  };

  ModelClassInfo {
    total_classes: class_names.len(),
    class_names,
    model_type: model_type.to_string(),
    confidence_threshold,
  }
}

/// Проверить, является ли модель face моделью по пути
pub fn is_face_model_by_path(model_path: &str) -> bool {
  let path_lower = model_path.to_lowercase();
  path_lower.contains("face")
    || path_lower.contains("facial")
    || path_lower.contains("yolo5face")
    || path_lower.contains("retinaface")
}

/// Определить размер входа модели по типу
pub fn get_model_input_size(model_type: &str) -> (u32, u32) {
  match model_type {
    "YOLOv5" => (640, 640),
    "YOLOv8" => (640, 640),
    "YOLOv8n" => (320, 320),
    "YOLOv8s" => (640, 640),
    "YOLOv8m" => (640, 640),
    "YOLOv8l" => (640, 640),
    "YOLOv8x" => (640, 640),
    "face_detection" => (320, 320),
    _ => (640, 640), // По умолчанию
  }
}

/// Создать информацию о YOLO модели
pub fn create_yolo_model_info(model_path: &str, model_type: &str) -> YoloModelInfo {
  let is_face_model = is_face_model_by_path(model_path);
  let is_segmentation_model = model_path.to_lowercase().contains("seg");
  let input_size = get_model_input_size(model_type);
  let classes_count = if is_face_model { 1 } else { 80 }; // COCO = 80 классов

  YoloModelInfo {
    model_path: model_path.to_string(),
    model_type: model_type.to_string(),
    is_face_model,
    is_segmentation_model,
    input_size,
    classes_count,
  }
}

/// Создать статус модели
pub fn create_model_status(
  is_loaded: bool,
  model_type: &str,
  load_time_ms: u64,
  memory_usage_mb: f64,
) -> ModelStatus {
  ModelStatus {
    is_loaded,
    model_type: model_type.to_string(),
    load_time_ms,
    memory_usage_mb,
    last_inference_ms: None,
  }
}

/// Обновить время последнего инференса в статусе модели
pub fn update_last_inference_time(status: &mut ModelStatus, inference_time_ms: u64) {
  status.last_inference_ms = Some(inference_time_ms);
}

/// Фильтровать результаты по времени
pub fn filter_results_by_time_range(
  results: &[FrameRecognitionResult],
  params: &TimeRangeParams,
) -> Vec<FrameRecognitionResult> {
  results
    .iter()
    .filter(|result| result.timestamp >= params.start_time && result.timestamp <= params.end_time)
    .filter(|result| {
      if let Some(threshold) = params.confidence_threshold {
        result.confidence_avg >= threshold
      } else {
        true
      }
    })
    .cloned()
    .collect()
}

/// Создать результат распознавания кадра
pub fn create_frame_recognition_result(
  timestamp: f64,
  detections: Vec<Detection>,
  processing_time_ms: u64,
) -> FrameRecognitionResult {
  let confidence_avg = if detections.is_empty() {
    0.0
  } else {
    detections.iter().map(|d| d.confidence).sum::<f32>() / detections.len() as f32
  };

  FrameRecognitionResult {
    timestamp,
    detections,
    confidence_avg,
    processing_time_ms,
  }
}

/// Создать обнаружение объекта
pub fn create_detection(
  class_name: &str,
  confidence: f32,
  x: f32,
  y: f32,
  width: f32,
  height: f32,
) -> Detection {
  Detection {
    class_name: class_name.to_string(),
    confidence,
    bbox: BoundingBox {
      x,
      y,
      width,
      height,
    },
  }
}

/// Валидировать параметры временного диапазона
pub fn validate_time_range_params(params: &TimeRangeParams) -> Result<(), String> {
  if params.start_time < 0.0 {
    return Err("Время начала не может быть отрицательным".to_string());
  }

  if params.end_time <= params.start_time {
    return Err("Время окончания должно быть больше времени начала".to_string());
  }

  if let Some(threshold) = params.confidence_threshold {
    if !(0.0..=1.0).contains(&threshold) {
      return Err("Порог уверенности должен быть между 0.0 и 1.0".to_string());
    }
  }

  Ok(())
}

/// Группировать результаты в сегменты timeline
pub fn group_results_into_segments(
  results: &[FrameRecognitionResult],
  time_gap_threshold: f64,
) -> Vec<TimelineSegment> {
  if results.is_empty() {
    return Vec::new();
  }

  let mut segments = Vec::new();
  let mut current_segment: Option<TimelineSegment> = None;

  for result in results {
    if let Some(detection) = result.detections.first() {
      match &mut current_segment {
        Some(segment)
          if result.timestamp - segment.end_time <= time_gap_threshold
            && segment.class_name == detection.class_name =>
        {
          // Продолжаем текущий сегмент
          segment.end_time = result.timestamp;
          segment.frame_count += 1;
          segment.confidence = (segment.confidence + detection.confidence) / 2.0;
        }
        _ => {
          // Завершаем предыдущий сегмент и начинаем новый
          if let Some(segment) = current_segment.take() {
            segments.push(segment);
          }
          current_segment = Some(TimelineSegment {
            start_time: result.timestamp,
            end_time: result.timestamp,
            class_name: detection.class_name.clone(),
            confidence: detection.confidence,
            frame_count: 1,
          });
        }
      }
    }
  }

  // Добавляем последний сегмент
  if let Some(segment) = current_segment {
    segments.push(segment);
  }

  segments
}

/// Вычислить метрики производительности модели
pub fn calculate_model_performance_metrics(statuses: &[ModelStatus]) -> (f64, f64, f64) {
  if statuses.is_empty() {
    return (0.0, 0.0, 0.0);
  }

  let avg_load_time =
    statuses.iter().map(|s| s.load_time_ms as f64).sum::<f64>() / statuses.len() as f64;

  let avg_memory_usage =
    statuses.iter().map(|s| s.memory_usage_mb).sum::<f64>() / statuses.len() as f64;

  let avg_inference_time = statuses
    .iter()
    .filter_map(|s| s.last_inference_ms.map(|t| t as f64))
    .collect::<Vec<_>>();

  let avg_inference = if avg_inference_time.is_empty() {
    0.0
  } else {
    avg_inference_time.iter().sum::<f64>() / avg_inference_time.len() as f64
  };

  (avg_load_time, avg_memory_usage, avg_inference)
}

/// Генерировать мок данные для тестирования
pub fn generate_mock_detections(count: usize, timestamp: f64) -> Vec<FrameRecognitionResult> {
  let classes = ["person", "car", "bicycle", "dog", "cat"];
  let mut results = Vec::new();

  for i in 0..count {
    let class_name = classes[i % classes.len()];
    let confidence = 0.7 + (i as f32 * 0.05) % 0.3;
    let x = (i as f32 * 50.0) % 500.0;
    let y = (i as f32 * 30.0) % 300.0;

    let detection = create_detection(class_name, confidence, x, y, 100.0, 80.0);
    let result =
      create_frame_recognition_result(timestamp + i as f64, vec![detection], 50 + i as u64 * 5);
    results.push(result);
  }

  results
}
