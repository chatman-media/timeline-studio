/**
 * Tauri Commands for MediaPipe Processing
 */
use base64::prelude::*;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

use crate::mediapipe_processor::{
  BlazeFaceDetection, FaceMeshLandmarks, FacialExpressions, MediaPipeModel, MediaPipeProcessor,
};

/// Состояние MediaPipe процессора
pub struct MediaPipeProcessorState(pub Mutex<Option<Arc<MediaPipeProcessor>>>);

impl Default for MediaPipeProcessorState {
  fn default() -> Self {
    Self(Mutex::new(None))
  }
}

/// Инициализировать MediaPipe процессор
#[tauri::command]
pub async fn init_mediapipe_processor(
  model_type: String,
  mediapipe_state: State<'_, MediaPipeProcessorState>,
) -> Result<String, String> {
  let model_enum = match model_type.as_str() {
    "blazeface-short" | "blazeface_short" => MediaPipeModel::BlazeFaceShort,
    "blazeface-full" | "blazeface_full" => MediaPipeModel::BlazeFaceFull,
    "face-mesh" | "face_mesh" => MediaPipeModel::FaceMesh,
    "face-mesh-attention" | "face_mesh_attention" => MediaPipeModel::FaceMeshAttention,
    "selfie-segmentation" | "selfie_segmentation" => MediaPipeModel::SelfieSegmentation,
    "selfie-segmentation-landscape" | "selfie_segmentation_landscape" => {
      MediaPipeModel::SelfieSegmentationLandscape
    }
    _ => return Err(format!("Unsupported MediaPipe model type: {}", model_type)),
  };

  match MediaPipeProcessor::new(model_enum) {
    Ok(mut processor) => {
      // Пытаемся загрузить модель
      match processor.load_model().await {
        Ok(_) => {
          let mut state = mediapipe_state.0.lock().await;
          *state = Some(Arc::new(processor));
          Ok(format!(
            "MediaPipe processor initialized with {}",
            model_type
          ))
        }
        Err(e) => {
          // В случае ошибки все равно сохраняем процессор (для тестов)
          let mut state = mediapipe_state.0.lock().await;
          *state = Some(Arc::new(processor));
          log::warn!("MediaPipe model loading failed: {}", e);
          Ok(format!(
            "MediaPipe processor initialized (model loading failed: {})",
            e
          ))
        }
      }
    }
    Err(e) => Err(format!("Failed to create MediaPipe processor: {}", e)),
  }
}

/// Детекция лиц с BlazeFace
#[tauri::command]
pub async fn detect_faces_blazeface(
  image_path: String,
  mediapipe_state: State<'_, MediaPipeProcessorState>,
) -> Result<Vec<BlazeFaceDetectionResponse>, String> {
  // Загружаем изображение перед блокировкой
  let image_path = PathBuf::from(image_path);
  if !image_path.exists() {
    return Err(format!("Image file not found: {}", image_path.display()));
  }

  let image = image::open(&image_path).map_err(|e| format!("Failed to load image: {}", e))?;

  // Получаем Arc к процессору
  let processor_arc = {
    let state = mediapipe_state.0.lock().await;
    state
      .as_ref()
      .ok_or_else(|| "MediaPipe processor not initialized".to_string())?
      .clone()
  };

  // Выполняем blocking операцию в отдельной задаче
  let detection_result =
    tokio::task::spawn_blocking(move || processor_arc.detect_faces_blazeface_sync(&image))
      .await
      .map_err(|e| format!("Task join error: {}", e))?;

  // Обрабатываем результат
  match detection_result {
    Ok(detections) => Ok(
      detections
        .into_iter()
        .map(BlazeFaceDetectionResponse::from)
        .collect(),
    ),
    Err(e) => Err(format!("Failed to detect faces: {}", e)),
  }
}

/// Извлечение Face Mesh landmarks (468 точек)
#[tauri::command]
pub async fn extract_face_mesh_landmarks(
  image_data: String,
  mediapipe_state: State<'_, MediaPipeProcessorState>,
) -> Result<FaceMeshLandmarksResponse, String> {
  // Декодируем Base64 перед блокировкой
  let image_bytes = if image_data.starts_with("data:") {
    // Извлекаем данные из data URL
    let data_url_parts: Vec<&str> = image_data.split(',').collect();
    if data_url_parts.len() != 2 {
      return Err("Invalid data URL format".to_string());
    }
    BASE64_STANDARD
      .decode(data_url_parts[1])
      .map_err(|e| format!("Failed to decode base64: {}", e))?
  } else {
    BASE64_STANDARD
      .decode(&image_data)
      .map_err(|e| format!("Failed to decode base64: {}", e))?
  };

  // Загружаем изображение из байтов
  let image = image::load_from_memory(&image_bytes)
    .map_err(|e| format!("Failed to load image from memory: {}", e))?;

  // Получаем Arc к процессору
  let processor_arc = {
    let state = mediapipe_state.0.lock().await;
    state
      .as_ref()
      .ok_or_else(|| "MediaPipe processor not initialized".to_string())?
      .clone()
  };

  // Выполняем blocking операцию в отдельной задаче
  let landmarks_result =
    tokio::task::spawn_blocking(move || processor_arc.extract_face_mesh_sync(&image))
      .await
      .map_err(|e| format!("Task join error: {}", e))?;

  // Обрабатываем результат
  match landmarks_result {
    Ok(landmarks) => Ok(FaceMeshLandmarksResponse::from(landmarks)),
    Err(e) => Err(format!("Failed to extract face mesh: {}", e)),
  }
}

/// Анализ facial expressions
#[tauri::command]
pub async fn analyze_facial_expressions(
  image_data: String,
  mediapipe_state: State<'_, MediaPipeProcessorState>,
) -> Result<FaceExpressionsResponse, String> {
  // Декодируем изображение
  let image_bytes = if image_data.starts_with("data:") {
    let data_url_parts: Vec<&str> = image_data.split(',').collect();
    if data_url_parts.len() != 2 {
      return Err("Invalid data URL format".to_string());
    }
    BASE64_STANDARD
      .decode(data_url_parts[1])
      .map_err(|e| format!("Failed to decode base64: {}", e))?
  } else {
    BASE64_STANDARD
      .decode(&image_data)
      .map_err(|e| format!("Failed to decode base64: {}", e))?
  };

  let image = image::load_from_memory(&image_bytes)
    .map_err(|e| format!("Failed to load image from memory: {}", e))?;

  // Получаем процессор
  let processor_arc = {
    let state = mediapipe_state.0.lock().await;
    state
      .as_ref()
      .ok_or_else(|| "MediaPipe processor not initialized".to_string())?
      .clone()
  };

  // Выполняем анализ
  let expressions_result =
    tokio::task::spawn_blocking(move || processor_arc.analyze_expressions_sync(&image))
      .await
      .map_err(|e| format!("Task join error: {}", e))?;

  match expressions_result {
    Ok(expressions) => Ok(FaceExpressionsResponse::from(expressions)),
    Err(e) => Err(format!("Failed to analyze expressions: {}", e)),
  }
}

/// Настроить параметры MediaPipe
#[tauri::command]
pub async fn configure_mediapipe_settings(
  confidence_threshold: f32,
  max_faces: usize,
  mediapipe_state: State<'_, MediaPipeProcessorState>,
) -> Result<String, String> {
  // Извлекаем текущий процессор
  let model_type = {
    let state = mediapipe_state.0.lock().await;
    match state.as_ref() {
      Some(processor_arc) => processor_arc.get_model_type().clone(),
      None => return Err("MediaPipe processor not initialized".to_string()),
    }
  };

  // Создаем новый процессор с обновленными настройками
  match MediaPipeProcessor::new(model_type) {
    Ok(mut new_processor) => {
      new_processor.set_confidence_threshold(confidence_threshold);
      new_processor.set_max_faces(max_faces);

      // Проверяем была ли загружена модель в старом процессоре
      let was_loaded = {
        let state = mediapipe_state.0.lock().await;
        state.as_ref().map(|p| p.is_model_loaded()).unwrap_or(false)
      };

      // Загружаем модель если была загружена
      if was_loaded {
        if let Err(e) = new_processor.load_model().await {
          return Err(format!("Failed to reload model: {}", e));
        }
      }

      // Обновляем состояние
      {
        let mut state = mediapipe_state.0.lock().await;
        *state = Some(Arc::new(new_processor));
      }

      Ok(format!(
        "MediaPipe settings updated: confidence={}, max_faces={}",
        confidence_threshold, max_faces
      ))
    }
    Err(e) => Err(format!("Failed to create new processor: {}", e)),
  }
}

/// Получить информацию о процессоре
#[tauri::command]
pub async fn get_mediapipe_processor_info(
  mediapipe_state: State<'_, MediaPipeProcessorState>,
) -> Result<MediaPipeProcessorInfo, String> {
  let state = mediapipe_state.0.lock().await;
  match state.as_ref() {
    Some(processor) => Ok(MediaPipeProcessorInfo {
      is_initialized: true,
      is_model_loaded: processor.is_model_loaded(),
      model_path: processor.get_model_path().to_string_lossy().to_string(),
      model_type: format!("{:?}", processor.get_model_type()),
      input_size: processor.get_input_size(),
      confidence_threshold: processor.get_confidence_threshold(),
      max_faces: processor.get_max_faces(),
    }),
    None => Ok(MediaPipeProcessorInfo {
      is_initialized: false,
      is_model_loaded: false,
      model_path: String::new(),
      model_type: String::new(),
      input_size: (0, 0),
      confidence_threshold: 0.0,
      max_faces: 0,
    }),
  }
}

/// Ответ с детекцией BlazeFace
#[derive(serde::Serialize)]
pub struct BlazeFaceDetectionResponse {
  pub bbox: BoundingBoxResponse,
  pub confidence: f32,
  pub key_points: Vec<Point2DResponse>,
}

#[derive(serde::Serialize)]
pub struct BoundingBoxResponse {
  pub x1: f32,
  pub y1: f32,
  pub x2: f32,
  pub y2: f32,
}

#[derive(serde::Serialize)]
pub struct Point2DResponse {
  pub x: f32,
  pub y: f32,
}

#[derive(serde::Serialize)]
pub struct Point3DResponse {
  pub x: f32,
  pub y: f32,
  pub z: f32,
}

/// Ответ с Face Mesh landmarks
#[derive(serde::Serialize)]
pub struct FaceMeshLandmarksResponse {
  pub points: Vec<Point3DResponse>,
  pub regions: FaceRegionsResponse,
}

#[derive(serde::Serialize)]
pub struct FaceRegionsResponse {
  pub lips: Vec<usize>,
  pub left_eye: Vec<usize>,
  pub right_eye: Vec<usize>,
  pub face_oval: Vec<usize>,
  pub left_eyebrow: Vec<usize>,
  pub right_eyebrow: Vec<usize>,
  pub nose_bridge: Vec<usize>,
  pub nose_tip: Vec<usize>,
}

/// Ответ с facial expressions
#[derive(serde::Serialize)]
pub struct FaceExpressionsResponse {
  pub smile_score: f32,
  pub left_eye_openness: f32,
  pub right_eye_openness: f32,
  pub mouth_openness: f32,
  pub eyebrow_raise: f32,
  pub gaze_direction: Point2DResponse,
  pub attention_score: f32,
}

/// Информация о процессоре MediaPipe
#[derive(serde::Serialize)]
pub struct MediaPipeProcessorInfo {
  pub is_initialized: bool,
  pub is_model_loaded: bool,
  pub model_path: String,
  pub model_type: String,
  pub input_size: (u32, u32),
  pub confidence_threshold: f32,
  pub max_faces: usize,
}

// Конверсии между типами
impl From<BlazeFaceDetection> for BlazeFaceDetectionResponse {
  fn from(detection: BlazeFaceDetection) -> Self {
    Self {
      bbox: BoundingBoxResponse {
        x1: detection.bbox.x1,
        y1: detection.bbox.y1,
        x2: detection.bbox.x2,
        y2: detection.bbox.y2,
      },
      confidence: detection.confidence,
      key_points: detection
        .keypoints
        .into_iter()
        .map(|p| Point2DResponse { x: p.x, y: p.y })
        .collect(),
    }
  }
}

impl From<FaceMeshLandmarks> for FaceMeshLandmarksResponse {
  fn from(landmarks: FaceMeshLandmarks) -> Self {
    Self {
      points: landmarks
        .points
        .into_iter()
        .map(|p| Point3DResponse {
          x: p.x,
          y: p.y,
          z: p.z,
        })
        .collect(),
      regions: FaceRegionsResponse {
        lips: landmarks.regions.lips,
        left_eye: landmarks.regions.left_eye,
        right_eye: landmarks.regions.right_eye,
        face_oval: landmarks.regions.face_oval,
        left_eyebrow: landmarks.regions.left_eyebrow,
        right_eyebrow: landmarks.regions.right_eyebrow,
        nose_bridge: landmarks.regions.nose_bridge,
        nose_tip: landmarks.regions.nose_tip,
      },
    }
  }
}

impl From<FacialExpressions> for FaceExpressionsResponse {
  fn from(expressions: FacialExpressions) -> Self {
    Self {
      smile_score: expressions.smile,
      left_eye_openness: expressions.eye_openness[0],
      right_eye_openness: expressions.eye_openness[1],
      mouth_openness: expressions.mouth_openness,
      eyebrow_raise: expressions.eyebrow_raise,
      gaze_direction: Point2DResponse {
        x: expressions.gaze_direction.x,
        y: expressions.gaze_direction.y,
      },
      attention_score: expressions.attention_score,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::mediapipe_processor::Point2D;

  #[tokio::test]
  async fn test_blazeface_detection_response_conversion() {
    let detection = BlazeFaceDetection {
      bbox: crate::mediapipe_processor::BoundingBox {
        x1: 10.0,
        y1: 20.0,
        x2: 100.0,
        y2: 120.0,
      },
      confidence: 0.95,
      keypoints: vec![
        Point2D { x: 30.0, y: 40.0 },
        Point2D { x: 70.0, y: 40.0 },
        Point2D { x: 50.0, y: 60.0 },
      ],
      quality_score: 0.9,
    };

    let response = BlazeFaceDetectionResponse::from(detection);

    assert_eq!(response.bbox.x1, 10.0);
    assert_eq!(response.confidence, 0.95);
    assert_eq!(response.key_points.len(), 3);
    assert_eq!(response.key_points[0].x, 30.0);
  }

  #[test]
  fn test_face_expressions_conversion() {
    let expressions = FacialExpressions {
      smile: 0.8,
      eye_openness: [0.9, 0.85],
      mouth_openness: 0.3,
      eyebrow_raise: 0.1,
      gaze_direction: Point2D { x: 0.5, y: 0.5 },
      attention_score: 0.7,
    };

    let response = FaceExpressionsResponse::from(expressions);

    assert_eq!(response.smile_score, 0.8);
    assert_eq!(response.left_eye_openness, 0.9);
    assert_eq!(response.gaze_direction.x, 0.5);
  }
}
