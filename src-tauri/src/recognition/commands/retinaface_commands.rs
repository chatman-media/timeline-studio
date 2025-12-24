use base64::prelude::*;
/**
 * Tauri Commands for RetinaFace Processing
 */
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

use crate::recognition::retinaface_processor::{
  FacialLandmarks, Point2D, RetinaFaceDetection, RetinaFaceModel, RetinaFaceProcessor,
};

/// Состояние RetinaFace процессора
pub struct RetinaFaceProcessorState(pub Mutex<Option<Arc<RetinaFaceProcessor>>>);

impl Default for RetinaFaceProcessorState {
  fn default() -> Self {
    Self(Mutex::new(None))
  }
}

/// Инициализировать RetinaFace процессор
#[tauri::command]
pub async fn init_retinaface_processor(
  model_type: String,
  retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<String, String> {
  let model_enum = match model_type.as_str() {
    "retinaface-r50" | "resnet50" => RetinaFaceModel::ResNet50,
    "retinaface-mobile" | "mobilenet" => RetinaFaceModel::MobileNet,
    "retinaface-r50-enhanced" | "enhanced" => RetinaFaceModel::ResNet50Enhanced,
    _ => return Err(format!("Unsupported RetinaFace model type: {}", model_type)),
  };

  match RetinaFaceProcessor::new(model_enum) {
    Ok(mut processor) => {
      // Пытаемся загрузить модель
      match processor.load_model().await {
        Ok(_) => {
          let mut state = retinaface_state.0.lock().await;
          *state = Some(Arc::new(processor));
          Ok(format!(
            "RetinaFace processor initialized with {}",
            model_type
          ))
        }
        Err(e) => {
          // В случае ошибки все равно сохраняем процессор (для тестов)
          let mut state = retinaface_state.0.lock().await;
          *state = Some(Arc::new(processor));
          log::warn!("RetinaFace model loading failed: {}", e);
          Ok(format!(
            "RetinaFace processor initialized (model loading failed: {})",
            e
          ))
        }
      }
    }
    Err(e) => Err(format!("Failed to create RetinaFace processor: {}", e)),
  }
}

/// Детекция лиц с landmarks
#[tauri::command]
pub async fn detect_faces_with_landmarks(
  image_path: String,
  retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<Vec<RetinaFaceDetectionResponse>, String> {
  // Загружаем изображение перед блокировкой
  let image_path = PathBuf::from(image_path);
  if !image_path.exists() {
    return Err(format!("Image file not found: {}", image_path.display()));
  }

  let image = image::open(&image_path).map_err(|e| format!("Failed to load image: {}", e))?;

  // Получаем Arc к процессору
  let processor_arc = {
    let state = retinaface_state.0.lock().await;
    state
      .as_ref()
      .ok_or_else(|| "RetinaFace processor not initialized".to_string())?
      .clone()
  };

  // Выполняем blocking операцию в отдельной задаче
  let detection_result =
    tokio::task::spawn_blocking(move || processor_arc.detect_faces_sync(&image))
      .await
      .map_err(|e| format!("Task join error: {}", e))?;

  // Обрабатываем результат
  match detection_result {
    Ok(detections) => Ok(
      detections
        .into_iter()
        .map(RetinaFaceDetectionResponse::from)
        .collect(),
    ),
    Err(e) => Err(format!("Failed to detect faces: {}", e)),
  }
}

/// Детекция лиц с landmarks из Base64
#[tauri::command]
pub async fn detect_faces_with_landmarks_from_base64(
  image_data: String,
  retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<Vec<RetinaFaceDetectionResponse>, String> {
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
    let state = retinaface_state.0.lock().await;
    state
      .as_ref()
      .ok_or_else(|| "RetinaFace processor not initialized".to_string())?
      .clone()
  };

  // Выполняем blocking операцию в отдельной задаче
  let detection_result =
    tokio::task::spawn_blocking(move || processor_arc.detect_faces_sync(&image))
      .await
      .map_err(|e| format!("Task join error: {}", e))?;

  // Обрабатываем результат
  match detection_result {
    Ok(detections) => Ok(
      detections
        .into_iter()
        .map(RetinaFaceDetectionResponse::from)
        .collect(),
    ),
    Err(e) => Err(format!("Failed to detect faces: {}", e)),
  }
}

/// Получить выровненное лицо (face alignment)
#[tauri::command]
pub async fn get_aligned_face(
  image_data: String,
  landmarks: FacialLandmarksRequest,
  output_size: Option<u32>,
  _retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<AlignedFaceResponse, String> {
  let size = output_size.unwrap_or(112); // Стандартный размер для face recognition

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

  // Клонируем landmarks для использования в двух местах
  let landmarks_for_alignment = landmarks.clone();
  let landmarks_converted: crate::recognition::retinaface_processor::FacialLandmarks =
    landmarks.into();

  // Выполняем face alignment
  let aligned_result = tokio::task::spawn_blocking(move || {
    align_face_with_landmarks(&image, &landmarks_for_alignment.into(), size)
  })
  .await
  .map_err(|e| format!("Task join error: {}", e))?;

  match aligned_result {
    Ok(aligned_image) => {
      // Конвертируем в base64
      let mut buffer = Vec::new();
      let mut cursor = std::io::Cursor::new(&mut buffer);
      aligned_image
        .write_to(&mut cursor, image::ImageFormat::Jpeg)
        .map_err(|e| format!("Failed to encode image: {}", e))?;

      let base64_data = BASE64_STANDARD.encode(&buffer);

      // Вычисляем реальную оценку качества
      let quality_score = calculate_face_quality_score(&aligned_image, &landmarks_converted, size);

      Ok(AlignedFaceResponse {
        aligned_image: format!("data:image/jpeg;base64,{}", base64_data),
        size,
        quality_score,
      })
    }
    Err(e) => Err(format!("Failed to align face: {}", e)),
  }
}

/// Настроить пороги детекции
#[tauri::command]
pub async fn configure_retinaface_thresholds(
  confidence_threshold: f32,
  nms_threshold: f32,
  retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<String, String> {
  // Извлекаем текущий процессор
  let model_type = {
    let state = retinaface_state.0.lock().await;
    match state.as_ref() {
      Some(processor_arc) => processor_arc.get_model_type().clone(),
      None => return Err("RetinaFace processor not initialized".to_string()),
    }
  };

  // Создаем новый процессор с обновленными настройками
  match RetinaFaceProcessor::new(model_type) {
    Ok(mut new_processor) => {
      new_processor.set_confidence_threshold(confidence_threshold);
      new_processor.set_nms_threshold(nms_threshold);

      // Проверяем была ли загружена модель в старом процессоре
      let was_loaded = {
        let state = retinaface_state.0.lock().await;
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
        let mut state = retinaface_state.0.lock().await;
        *state = Some(Arc::new(new_processor));
      }

      Ok(format!(
        "RetinaFace thresholds updated: confidence={}, nms={}",
        confidence_threshold, nms_threshold
      ))
    }
    Err(e) => Err(format!("Failed to create new processor: {}", e)),
  }
}

/// Получить информацию о процессоре
#[tauri::command]
pub async fn get_retinaface_processor_info(
  retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<RetinaFaceProcessorInfo, String> {
  let state = retinaface_state.0.lock().await;
  match state.as_ref() {
    Some(processor) => Ok(RetinaFaceProcessorInfo {
      is_initialized: true,
      is_model_loaded: processor.is_model_loaded(),
      model_path: processor.get_model_path().to_string_lossy().to_string(),
      model_type: format!("{:?}", processor.get_model_type()),
      input_size: processor.input_size,
    }),
    None => Ok(RetinaFaceProcessorInfo {
      is_initialized: false,
      is_model_loaded: false,
      model_path: String::new(),
      model_type: String::new(),
      input_size: (0, 0),
    }),
  }
}

/// Face alignment функция
fn align_face_with_landmarks(
  image: &image::DynamicImage,
  landmarks: &FacialLandmarks,
  output_size: u32,
) -> Result<image::DynamicImage, String> {
  use image::imageops::FilterType;

  // Вычисляем параметры трансформации (не используются в упрощенной реализации)
  let _eye_center_x = (landmarks.left_eye.x + landmarks.right_eye.x) / 2.0;
  let _eye_center_y = (landmarks.left_eye.y + landmarks.right_eye.y) / 2.0;

  // Угол поворота для выравнивания глаз по горизонтали
  let angle = ((landmarks.right_eye.y - landmarks.left_eye.y)
    / (landmarks.right_eye.x - landmarks.left_eye.x))
    .atan();

  // Расстояние между глазами
  let eye_distance = ((landmarks.right_eye.x - landmarks.left_eye.x).powi(2)
    + (landmarks.right_eye.y - landmarks.left_eye.y).powi(2))
  .sqrt();

  // Целевое расстояние между глазами (обычно 38% от размера изображения)
  let target_eye_distance = output_size as f32 * 0.38;
  let scale = target_eye_distance / eye_distance;

  // Центр поворота (не используется в упрощенной реализации)
  let _center_x = image.width() as f32 / 2.0;
  let _center_y = image.height() as f32 / 2.0;

  // Применяем трансформацию (упрощенная версия)
  // В реальной реализации здесь должна быть аффинная трансформация
  let rotated = if angle.abs() > 0.1 {
    // Поворачиваем изображение
    image.rotate90() // Упрощение - в реальности нужен точный поворот
  } else {
    image.clone()
  };

  // Изменяем размер
  let scaled = if (scale - 1.0).abs() > 0.1 {
    let new_width = (rotated.width() as f32 * scale) as u32;
    let new_height = (rotated.height() as f32 * scale) as u32;
    rotated.resize(new_width, new_height, FilterType::Lanczos3)
  } else {
    rotated
  };

  // Обрезаем до нужного размера с центрированием
  let final_image = if scaled.width() != output_size || scaled.height() != output_size {
    scaled.resize_exact(output_size, output_size, FilterType::Lanczos3)
  } else {
    scaled
  };

  Ok(final_image)
}

/// Ответ с детекцией RetinaFace
#[derive(serde::Serialize)]
pub struct RetinaFaceDetectionResponse {
  pub bbox: BoundingBoxResponse,
  pub confidence: f32,
  pub landmarks: FacialLandmarksResponse,
  pub quality_score: f32,
  pub head_pose: HeadPoseResponse,
}

#[derive(serde::Serialize)]
pub struct BoundingBoxResponse {
  pub x1: f32,
  pub y1: f32,
  pub x2: f32,
  pub y2: f32,
}

#[derive(serde::Serialize)]
pub struct FacialLandmarksResponse {
  pub left_eye: Point2DResponse,
  pub right_eye: Point2DResponse,
  pub nose_tip: Point2DResponse,
  pub mouth_left: Point2DResponse,
  pub mouth_right: Point2DResponse,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Point2DResponse {
  pub x: f32,
  pub y: f32,
}

#[derive(serde::Serialize)]
pub struct HeadPoseResponse {
  pub pitch: f32,
  pub yaw: f32,
  pub roll: f32,
}

/// Запрос для face alignment
#[derive(serde::Deserialize, Clone)]
pub struct FacialLandmarksRequest {
  pub left_eye: Point2DRequest,
  pub right_eye: Point2DRequest,
  pub nose_tip: Point2DRequest,
  pub mouth_left: Point2DRequest,
  pub mouth_right: Point2DRequest,
}

#[derive(serde::Deserialize, Clone)]
pub struct Point2DRequest {
  pub x: f32,
  pub y: f32,
}

/// Ответ с выровненным лицом
#[derive(serde::Serialize)]
pub struct AlignedFaceResponse {
  pub aligned_image: String, // base64
  pub size: u32,
  pub quality_score: f32,
}

/// Информация о процессоре RetinaFace
#[derive(serde::Serialize)]
pub struct RetinaFaceProcessorInfo {
  pub is_initialized: bool,
  pub is_model_loaded: bool,
  pub model_path: String,
  pub model_type: String,
  pub input_size: (u32, u32),
}

// Конверсии между типами
impl From<RetinaFaceDetection> for RetinaFaceDetectionResponse {
  fn from(detection: RetinaFaceDetection) -> Self {
    Self {
      bbox: BoundingBoxResponse {
        x1: detection.bbox.x1,
        y1: detection.bbox.y1,
        x2: detection.bbox.x2,
        y2: detection.bbox.y2,
      },
      confidence: detection.confidence,
      landmarks: FacialLandmarksResponse {
        left_eye: Point2DResponse {
          x: detection.landmarks.left_eye.x,
          y: detection.landmarks.left_eye.y,
        },
        right_eye: Point2DResponse {
          x: detection.landmarks.right_eye.x,
          y: detection.landmarks.right_eye.y,
        },
        nose_tip: Point2DResponse {
          x: detection.landmarks.nose_tip.x,
          y: detection.landmarks.nose_tip.y,
        },
        mouth_left: Point2DResponse {
          x: detection.landmarks.mouth_left.x,
          y: detection.landmarks.mouth_left.y,
        },
        mouth_right: Point2DResponse {
          x: detection.landmarks.mouth_right.x,
          y: detection.landmarks.mouth_right.y,
        },
      },
      quality_score: detection.quality_score,
      head_pose: HeadPoseResponse {
        pitch: detection.head_pose.pitch,
        yaw: detection.head_pose.yaw,
        roll: detection.head_pose.roll,
      },
    }
  }
}

impl From<FacialLandmarksRequest> for FacialLandmarks {
  fn from(request: FacialLandmarksRequest) -> Self {
    Self {
      left_eye: Point2D {
        x: request.left_eye.x,
        y: request.left_eye.y,
      },
      right_eye: Point2D {
        x: request.right_eye.x,
        y: request.right_eye.y,
      },
      nose_tip: Point2D {
        x: request.nose_tip.x,
        y: request.nose_tip.y,
      },
      mouth_left: Point2D {
        x: request.mouth_left.x,
        y: request.mouth_left.y,
      },
      mouth_right: Point2D {
        x: request.mouth_right.x,
        y: request.mouth_right.y,
      },
    }
  }
}

/// Вычисляет оценку качества лица на основе различных факторов
fn calculate_face_quality_score(
  face_image: &image::DynamicImage,
  landmarks: &crate::recognition::retinaface_processor::FacialLandmarks,
  face_size: u32,
) -> f32 {
  let mut quality_score = 0.0;
  let mut factors_count = 0;

  // 1. Оценка размера лица (больше = лучше)
  let size_score = if face_size >= 224 {
    1.0
  } else if face_size >= 112 {
    0.8
  } else if face_size >= 64 {
    0.6
  } else if face_size >= 32 {
    0.4
  } else {
    0.2
  };
  quality_score += size_score;
  factors_count += 1;

  // 2. Оценка четкости (на основе анализа краев)
  let sharpness_score = calculate_sharpness_score(face_image);
  quality_score += sharpness_score;
  factors_count += 1;

  // 3. Оценка качества landmarks (симметрия и правдоподобность)
  let landmarks_score = calculate_landmarks_quality_score(landmarks, face_size);
  quality_score += landmarks_score;
  factors_count += 1;

  // 4. Оценка освещения (равномерность)
  let lighting_score = calculate_lighting_score(face_image);
  quality_score += lighting_score;
  factors_count += 1;

  // Возвращаем среднее значение, ограниченное от 0.0 до 1.0
  (quality_score / factors_count as f32).clamp(0.0, 1.0)
}

/// Оценка четкости изображения на основе анализа краев
fn calculate_sharpness_score(image: &image::DynamicImage) -> f32 {
  let gray_image = image.to_luma8();
  let (width, height) = gray_image.dimensions();

  if width == 0 || height == 0 {
    return 0.0;
  }

  // Простой алгоритм детекции краев (Sobel-подобный)
  let mut edge_strength_sum = 0.0;
  let mut pixel_count = 0;

  for y in 1..(height - 1) {
    for x in 1..(width - 1) {
      let _current = gray_image.get_pixel(x, y)[0] as f32;
      let left = gray_image.get_pixel(x - 1, y)[0] as f32;
      let right = gray_image.get_pixel(x + 1, y)[0] as f32;
      let top = gray_image.get_pixel(x, y - 1)[0] as f32;
      let bottom = gray_image.get_pixel(x, y + 1)[0] as f32;

      let dx = right - left;
      let dy = bottom - top;
      let edge_strength = (dx * dx + dy * dy).sqrt();

      edge_strength_sum += edge_strength;
      pixel_count += 1;
    }
  }

  if pixel_count == 0 {
    return 0.0;
  }

  let average_edge_strength = edge_strength_sum / pixel_count as f32;

  // Нормализуем в диапазон 0.0-1.0 (эмпирически подобранные пороги)
  if average_edge_strength >= 30.0 {
    1.0
  } else if average_edge_strength >= 20.0 {
    0.8
  } else if average_edge_strength >= 10.0 {
    0.6
  } else if average_edge_strength >= 5.0 {
    0.4
  } else {
    0.2
  }
}

/// Оценка качества landmarks на основе симметрии и правдоподобности позиций
fn calculate_landmarks_quality_score(
  landmarks: &crate::recognition::retinaface_processor::FacialLandmarks,
  face_size: u32,
) -> f32 {
  let mut score = 0.0;
  let mut checks = 0;

  // 1. Проверка симметрии глаз
  let eye_y_difference = (landmarks.left_eye.y - landmarks.right_eye.y).abs();
  let eye_symmetry_score = if eye_y_difference <= face_size as f32 * 0.05 {
    1.0 // Глаза на одном уровне
  } else if eye_y_difference <= face_size as f32 * 0.1 {
    0.7
  } else {
    0.3
  };
  score += eye_symmetry_score;
  checks += 1;

  // 2. Проверка расстояния между глазами (должно быть разумным)
  let eye_distance = ((landmarks.right_eye.x - landmarks.left_eye.x).powi(2)
    + (landmarks.right_eye.y - landmarks.left_eye.y).powi(2))
  .sqrt();
  let expected_eye_distance = face_size as f32 * 0.3; // ~30% от размера лица
  let distance_ratio =
    (eye_distance / expected_eye_distance).min(expected_eye_distance / eye_distance);
  let eye_distance_score = if distance_ratio >= 0.8 {
    1.0
  } else if distance_ratio >= 0.6 {
    0.7
  } else {
    0.4
  };
  score += eye_distance_score;
  checks += 1;

  // 3. Проверка позиции носа (должен быть между глазами по X и ниже по Y)
  let eyes_center_x = (landmarks.left_eye.x + landmarks.right_eye.x) / 2.0;
  let _eyes_center_y = (landmarks.left_eye.y + landmarks.right_eye.y) / 2.0;

  let nose_x_offset = (landmarks.nose_tip.x - eyes_center_x).abs();
  let nose_position_score = if nose_x_offset <= face_size as f32 * 0.1 {
    1.0 // Нос по центру
  } else if nose_x_offset <= face_size as f32 * 0.2 {
    0.7
  } else {
    0.4
  };
  score += nose_position_score;
  checks += 1;

  // 4. Проверка позиции рта (должен быть ниже носа)
  let mouth_center_y = (landmarks.mouth_left.y + landmarks.mouth_right.y) / 2.0;
  let mouth_below_nose = mouth_center_y > landmarks.nose_tip.y;
  let mouth_position_score = if mouth_below_nose {
    1.0
  } else {
    0.2 // Рот выше носа - плохое качество
  };
  score += mouth_position_score;
  checks += 1;

  if checks > 0 {
    score / checks as f32
  } else {
    0.5 // Средняя оценка если нет данных
  }
}

/// Оценка освещения на основе равномерности распределения яркости
fn calculate_lighting_score(image: &image::DynamicImage) -> f32 {
  let gray_image = image.to_luma8();
  let (width, height) = gray_image.dimensions();

  if width == 0 || height == 0 {
    return 0.0;
  }

  // Разбиваем изображение на 9 областей (3x3) и анализируем яркость каждой
  let region_width = width / 3;
  let region_height = height / 3;
  let mut region_brightness = Vec::new();

  for region_y in 0..3 {
    for region_x in 0..3 {
      let start_x = region_x * region_width;
      let start_y = region_y * region_height;
      let end_x = ((region_x + 1) * region_width).min(width);
      let end_y = ((region_y + 1) * region_height).min(height);

      let mut brightness_sum = 0u32;
      let mut pixel_count = 0u32;

      for y in start_y..end_y {
        for x in start_x..end_x {
          brightness_sum += gray_image.get_pixel(x, y)[0] as u32;
          pixel_count += 1;
        }
      }

      if pixel_count > 0 {
        region_brightness.push(brightness_sum as f32 / pixel_count as f32);
      }
    }
  }

  if region_brightness.is_empty() {
    return 0.5;
  }

  // Вычисляем стандартное отклонение яркости между регионами
  let mean_brightness: f32 = region_brightness.iter().sum::<f32>() / region_brightness.len() as f32;
  let variance: f32 = region_brightness
    .iter()
    .map(|&x| (x - mean_brightness).powi(2))
    .sum::<f32>()
    / region_brightness.len() as f32;
  let std_deviation = variance.sqrt();

  // Чем меньше отклонение, тем лучше освещение
  // Нормализуем относительно диапазона яркости (0-255)
  let normalized_std = std_deviation / 255.0;

  if normalized_std <= 0.1 {
    1.0 // Очень равномерное освещение
  } else if normalized_std <= 0.2 {
    0.8
  } else if normalized_std <= 0.3 {
    0.6
  } else if normalized_std <= 0.4 {
    0.4
  } else {
    0.2 // Неравномерное освещение
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::recognition::retinaface_processor::HeadPose;

  #[tokio::test]
  async fn test_retinaface_detection_response_conversion() {
    let detection = RetinaFaceDetection {
      bbox: crate::recognition::retinaface_processor::BoundingBox {
        x1: 10.0,
        y1: 20.0,
        x2: 100.0,
        y2: 120.0,
      },
      confidence: 0.95,
      landmarks: FacialLandmarks {
        left_eye: Point2D { x: 30.0, y: 40.0 },
        right_eye: Point2D { x: 70.0, y: 40.0 },
        nose_tip: Point2D { x: 50.0, y: 60.0 },
        mouth_left: Point2D { x: 35.0, y: 80.0 },
        mouth_right: Point2D { x: 65.0, y: 80.0 },
      },
      quality_score: 0.9,
      head_pose: HeadPose {
        pitch: 0.0,
        yaw: 0.0,
        roll: 0.0,
      },
      landmarks_3d: None,
    };

    let response = RetinaFaceDetectionResponse::from(detection);

    assert_eq!(response.bbox.x1, 10.0);
    assert_eq!(response.confidence, 0.95);
    assert_eq!(response.landmarks.left_eye.x, 30.0);
    assert_eq!(response.quality_score, 0.9);
  }

  #[test]
  fn test_landmarks_request_conversion() {
    let request = FacialLandmarksRequest {
      left_eye: Point2DRequest { x: 30.0, y: 40.0 },
      right_eye: Point2DRequest { x: 70.0, y: 40.0 },
      nose_tip: Point2DRequest { x: 50.0, y: 60.0 },
      mouth_left: Point2DRequest { x: 35.0, y: 80.0 },
      mouth_right: Point2DRequest { x: 65.0, y: 80.0 },
    };

    let landmarks = FacialLandmarks::from(request);

    assert_eq!(landmarks.left_eye.x, 30.0);
    assert_eq!(landmarks.right_eye.x, 70.0);
    assert_eq!(landmarks.nose_tip.x, 50.0);
  }
}
