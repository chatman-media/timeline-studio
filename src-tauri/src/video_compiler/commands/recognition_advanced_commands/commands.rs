//! Tauri команды для продвинутого распознавания - тонкий слой команд

use super::{business_logic::*, types::*};
use crate::video_compiler::commands::state::VideoCompilerState;
use crate::video_compiler::core::error::{Result, VideoCompilerError};
use tauri::State;

/// Получить имена классов из процессора кадров
#[tauri::command]
pub async fn get_frame_processor_class_names(
  _state: State<'_, VideoCompilerState>,
) -> Result<ModelClassInfo> {
  log::debug!("Получение имен классов процессора кадров");

  Ok(create_model_class_info("YOLOv5", 0.5))
}

/// Проверить, является ли модель face model
#[tauri::command]
pub async fn check_is_face_model(
  model_path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<YoloModelInfo> {
  if model_path.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Путь к модели не может быть пустым".to_string(),
    ));
  }

  log::debug!("Проверка является ли модель face model: {model_path}");

  let is_face = is_face_model_by_path(&model_path);
  let model_type = if is_face {
    "Face Detection"
  } else {
    "Object Detection"
  };

  Ok(create_yolo_model_info(&model_path, model_type))
}

/// Проверить, является ли модель segmentation model
#[tauri::command]
pub async fn check_is_segmentation_model(
  model_path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  if model_path.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Путь к модели не может быть пустым".to_string(),
    ));
  }

  log::debug!("Проверка является ли модель segmentation model: {model_path}");

  Ok(
    model_path.to_lowercase().contains("seg") || model_path.to_lowercase().contains("segmentation"),
  )
}

/// Получить статус модели
#[tauri::command]
pub async fn get_model_manager_status(
  _state: State<'_, VideoCompilerState>,
) -> Result<ModelStatus> {
  log::debug!("Получение статуса менеджера моделей");

  // Используем бизнес-логику для создания статуса
  Ok(create_model_status(true, "YOLOv5s", 1500, 256.0))
}

/// Получить результаты распознавания по временному диапазону
#[tauri::command]
pub async fn get_recognition_results_by_time_range(
  params: TimeRangeParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<FrameRecognitionResult>> {
  // Валидируем параметры
  validate_time_range_params(&params).map_err(VideoCompilerError::InvalidParameter)?;

  log::debug!(
    "Получение результатов распознавания для временного диапазона: {} - {}",
    params.start_time,
    params.end_time
  );

  // Генерируем мок данные для демонстрации
  let frame_count = ((params.end_time - params.start_time) * 30.0) as usize;
  let results = generate_mock_detections(frame_count.min(10), params.start_time);

  // Фильтруем по параметрам
  Ok(filter_results_by_time_range(&results, &params))
}

/// Получить результаты распознавания по классу
#[tauri::command]
pub async fn get_recognition_results_by_class(
  class_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<FrameRecognitionResult>> {
  if class_name.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Имя класса не может быть пустым".to_string(),
    ));
  }

  log::debug!("Получение результатов распознавания для класса: {class_name}");

  // Определяем уверенность для разных классов
  let confidence = match class_name.as_str() {
    "person" => 0.85,
    "car" => 0.72,
    "dog" => 0.91,
    _ => 0.60,
  };

  // Создаем результаты для класса
  let detection1 = create_detection(&class_name, confidence, 150.0, 100.0, 200.0, 300.0);
  let detection2 = create_detection(&class_name, confidence + 0.05, 200.0, 120.0, 180.0, 280.0);

  let result1 = create_frame_recognition_result(1.5, vec![detection1], 30);
  let result2 = create_frame_recognition_result(5.2, vec![detection2], 28);

  Ok(vec![result1, result2])
}

/// Форматировать результаты для timeline
#[tauri::command]
pub async fn format_recognition_results_for_timeline(
  min_confidence: Option<f32>,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<TimelineSegment>> {
  let confidence_threshold = min_confidence.unwrap_or(0.5);

  // Валидируем порог уверенности
  if !(0.0..=1.0).contains(&confidence_threshold) {
    return Err(VideoCompilerError::InvalidParameter(
      "Порог уверенности должен быть между 0.0 и 1.0".to_string(),
    ));
  }

  log::debug!(
    "Форматирование результатов для timeline с порогом уверенности: {confidence_threshold}"
  );

  // Генерируем мок результаты
  let mock_results = generate_mock_detections(5, 0.0);

  // Группируем в сегменты timeline
  let segments = group_results_into_segments(&mock_results, 1.0);

  // Фильтруем по порогу уверенности
  let filtered_segments: Vec<TimelineSegment> = segments
    .into_iter()
    .filter(|segment| segment.confidence >= confidence_threshold)
    .collect();

  Ok(filtered_segments)
}

/// Проверить тип YOLO модели по её названию (прямое использование is_face_model)
#[tauri::command]
pub async fn check_yolo_model_is_face_model(
  model_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  if model_name.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Имя модели не может быть пустым".to_string(),
    ));
  }

  log::debug!("Проверка типа YOLO модели (face): {model_name}");

  // Используем реальную логику распознавания типа модели
  use crate::recognition::model_manager::YoloModel;

  let is_face = if model_name.to_lowercase().contains("yolov11")
    && model_name.to_lowercase().contains("face")
  {
    let model = YoloModel::YoloV11Face;
    model.is_face_model()
  } else if model_name.to_lowercase().contains("yolov8")
    && model_name.to_lowercase().contains("face")
  {
    let model = YoloModel::YoloV8Face;
    model.is_face_model()
  } else {
    let model = YoloModel::YoloV8Detection; // Default model
    model.is_face_model()
  };

  Ok(is_face)
}

/// Проверить тип YOLO модели по её названию (прямое использование is_segmentation_model)
#[tauri::command]
pub async fn check_yolo_model_is_segmentation_model(
  model_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  if model_name.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Имя модели не может быть пустым".to_string(),
    ));
  }

  log::debug!("Проверка типа YOLO модели (segmentation): {model_name}");

  // Используем реальную логику распознавания типа модели
  use crate::recognition::model_manager::YoloModel;

  let is_segmentation =
    if model_name.to_lowercase().contains("yolov11") && model_name.to_lowercase().contains("seg") {
      let model = YoloModel::YoloV11Segmentation;
      model.is_segmentation_model()
    } else if model_name.to_lowercase().contains("yolov8")
      && model_name.to_lowercase().contains("seg")
    {
      let model = YoloModel::YoloV8Segmentation;
      model.is_segmentation_model()
    } else {
      let model = YoloModel::YoloV8Detection; // Default model
      model.is_segmentation_model()
    };

  Ok(is_segmentation)
}

/// Получить полную информацию о YOLO модели (используя существующую структуру)
#[tauri::command]
pub async fn get_yolo_model_info_extended(
  model_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<YoloModelInfo> {
  if model_name.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Имя модели не может быть пустым".to_string(),
    ));
  }

  log::debug!("Получение расширенной информации о YOLO модели: {model_name}");

  use crate::recognition::model_manager::YoloModel;

  // Определяем тип модели по названию
  let (model, model_type) = if model_name.to_lowercase().contains("yolov11") {
    if model_name.to_lowercase().contains("face") {
      (YoloModel::YoloV11Face, "YOLOv11 Face Detection")
    } else if model_name.to_lowercase().contains("seg") {
      (YoloModel::YoloV11Segmentation, "YOLOv11 Segmentation")
    } else {
      (YoloModel::YoloV11Detection, "YOLOv11 Detection")
    }
  } else if model_name.to_lowercase().contains("yolov8") {
    if model_name.to_lowercase().contains("face") {
      (YoloModel::YoloV8Face, "YOLOv8 Face Detection")
    } else if model_name.to_lowercase().contains("seg") {
      (YoloModel::YoloV8Segmentation, "YOLOv8 Segmentation")
    } else {
      (YoloModel::YoloV8Detection, "YOLOv8 Detection")
    }
  } else {
    (YoloModel::YoloV8Detection, "YOLOv8 Detection (Default)")
  };

  // Используем оригинальные методы YoloModel
  let is_face_model = model.is_face_model();
  let is_segmentation_model = model.is_segmentation_model();

  Ok(YoloModelInfo {
    model_path: model_name,
    model_type: model_type.to_string(),
    is_face_model,
    is_segmentation_model,
    input_size: (640, 640), // Стандартный размер для YOLO
    classes_count: if is_face_model { 1 } else { 80 }, // 1 для лиц, 80 для COCO
  })
}

/// Получить информацию о сессии модели (прямое использование get_session)
#[tauri::command]
pub async fn get_model_session_info(model_type: String) -> Result<serde_json::Value> {
  if model_type.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Тип модели не может быть пустым".to_string(),
    ));
  }

  log::debug!("Получение информации о сессии модели: {model_type}");

  // Создаем ModelManager для проверки
  use crate::recognition::model_manager::{ModelManager, YoloModel};

  let yolo_model = match model_type.as_str() {
    "yolo11_detection" => YoloModel::YoloV11Detection,
    "yolo11_segmentation" => YoloModel::YoloV11Segmentation,
    "yolo11_face" => YoloModel::YoloV11Face,
    "yolo8_detection" => YoloModel::YoloV8Detection,
    "yolo8_segmentation" => YoloModel::YoloV8Segmentation,
    "yolo8_face" => YoloModel::YoloV8Face,
    _ => YoloModel::YoloV11Detection,
  };

  let mut manager = ModelManager::new(yolo_model)
    .map_err(|e| VideoCompilerError::InternalError(format!("Ошибка создания ModelManager: {e}")))?;

  // Пытаемся загрузить модель
  match manager.load_model().await {
    Ok(_) => {
      // Получаем сессию
      match manager.get_session() {
        Ok(_session) => Ok(serde_json::json!({
          "success": true,
          "model_type": model_type,
          "session_available": true,
          "session_info": {
            "loaded": true,
            "runtime": "ONNX Runtime",
            "optimization_level": "Level3",
            "threads": 4
          }
        })),
        Err(e) => Ok(serde_json::json!({
          "success": false,
          "model_type": model_type,
          "error": e.to_string(),
          "session_available": false
        })),
      }
    }
    Err(e) => Ok(serde_json::json!({
      "success": false,
      "model_type": model_type,
      "error": format!("Failed to load model: {}", e),
      "session_available": false
    })),
  }
}

/// Получить тип загруженной модели (прямое использование get_model_type)
#[tauri::command]
pub async fn get_loaded_model_type(model_type: String) -> Result<serde_json::Value> {
  if model_type.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Тип модели не может быть пустым".to_string(),
    ));
  }

  log::debug!("Получение типа загруженной модели: {model_type}");

  // Создаем ModelManager для проверки
  use crate::recognition::model_manager::{ModelManager, YoloModel};

  let yolo_model = match model_type.as_str() {
    "yolo11_detection" => YoloModel::YoloV11Detection,
    "yolo11_segmentation" => YoloModel::YoloV11Segmentation,
    "yolo11_face" => YoloModel::YoloV11Face,
    "yolo8_detection" => YoloModel::YoloV8Detection,
    "yolo8_segmentation" => YoloModel::YoloV8Segmentation,
    "yolo8_face" => YoloModel::YoloV8Face,
    _ => YoloModel::YoloV11Detection,
  };

  let manager = ModelManager::new(yolo_model)
    .map_err(|e| VideoCompilerError::InternalError(format!("Ошибка создания ModelManager: {e}")))?;

  // Используем метод get_model_type
  let model_type_info = manager.get_model_type();

  Ok(serde_json::json!({
    "success": true,
    "model_type": match model_type_info {
      YoloModel::YoloV11Detection => "yolo11_detection",
      YoloModel::YoloV11Segmentation => "yolo11_segmentation",
      YoloModel::YoloV11Face => "yolo11_face",
      YoloModel::YoloV8Detection => "yolo8_detection",
      YoloModel::YoloV8Segmentation => "yolo8_segmentation",
      YoloModel::YoloV8Face => "yolo8_face",
      YoloModel::YoloV8Nano => "yolo8n",
      YoloModel::YoloV8Small => "yolo8s",
      YoloModel::YoloV8Medium => "yolo8m",
      YoloModel::YoloV8Large => "yolo8l",
      YoloModel::YoloV8Extra => "yolo8x",
      YoloModel::Custom(path) => return Ok(serde_json::json!({
        "success": true,
        "model_type": "custom",
        "custom_path": path.to_string_lossy()
      })),
    },
    "is_face_model": model_type_info.is_face_model(),
    "is_segmentation_model": model_type_info.is_segmentation_model(),
  }))
}

/// Проверить, загружена ли модель (прямое использование is_loaded)
#[tauri::command]
pub async fn check_model_is_loaded(model_type: String) -> Result<serde_json::Value> {
  if model_type.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Тип модели не может быть пустым".to_string(),
    ));
  }

  log::debug!("Проверка загружена ли модель: {model_type}");

  // Создаем ModelManager для проверки
  use crate::recognition::model_manager::{ModelManager, YoloModel};

  let yolo_model = match model_type.as_str() {
    "yolo11_detection" => YoloModel::YoloV11Detection,
    "yolo11_segmentation" => YoloModel::YoloV11Segmentation,
    "yolo11_face" => YoloModel::YoloV11Face,
    "yolo8_detection" => YoloModel::YoloV8Detection,
    "yolo8_segmentation" => YoloModel::YoloV8Segmentation,
    "yolo8_face" => YoloModel::YoloV8Face,
    _ => YoloModel::YoloV11Detection,
  };

  let mut manager = ModelManager::new(yolo_model)
    .map_err(|e| VideoCompilerError::InternalError(format!("Ошибка создания ModelManager: {e}")))?;

  // Проверяем состояние без загрузки
  let is_loaded_before = manager.is_loaded();

  // Пытаемся загрузить модель
  let load_result = manager.load_model().await;
  let is_loaded_after = manager.is_loaded();

  Ok(serde_json::json!({
    "success": true,
    "model_type": model_type,
    "is_loaded_before_load": is_loaded_before,
    "is_loaded_after_load": is_loaded_after,
    "load_attempted": load_result.is_ok(),
    "load_error": load_result.err().map(|e| e.to_string()),
    "model_path": manager.get_model_type().get_model_path()
      .ok()
      .map(|p| p.to_string_lossy().to_string()),
  }))
}
