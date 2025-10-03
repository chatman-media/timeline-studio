/**
 * Tauri Commands for Privacy Processing
 */
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::State;
use tokio::sync::RwLock;

use crate::recognition::privacy_processor::{
  BlurType, BoundingBox, PrivacyProcessor, PrivacySettings,
};
use crate::YoloProcessorState;

/// Состояние Privacy процессора
pub struct PrivacyProcessorState(pub Mutex<Option<Arc<PrivacyProcessor>>>);

impl Default for PrivacyProcessorState {
  fn default() -> Self {
    Self(Mutex::new(None))
  }
}

/// Инициализировать Privacy процессор
#[tauri::command]
pub async fn init_privacy_processor(
  blur_type: String,
  privacy_state: State<'_, PrivacyProcessorState>,
) -> Result<String, String> {
  let blur_type_enum = match blur_type.as_str() {
    "gaussian" => BlurType::Gaussian { radius: 20.0 },
    "box" => BlurType::Box { size: 7 },
    "pixelate" => BlurType::Pixelate { pixel_size: 10 },
    "eye_bar" => BlurType::EyeBar { height_ratio: 0.3 },
    "solid_black" => BlurType::SolidColor {
      color: [0, 0, 0, 255],
    },
    "mosaic" => BlurType::Mosaic { tile_size: 8 },
    _ => BlurType::Gaussian { radius: 20.0 }, // По умолчанию
  };

  let settings = PrivacySettings {
    blur_type: blur_type_enum,
    ..Default::default()
  };

  let processor = PrivacyProcessor::new(settings);

  let mut state = privacy_state.0.lock().unwrap();
  *state = Some(Arc::new(processor));

  Ok(format!(
    "Privacy processor initialized with {} blur",
    blur_type
  ))
}

/// Размыть лица на изображении
#[tauri::command]
pub async fn blur_faces_in_image(
  image_path: String,
  output_path: String,
  auto_detect: bool,
  face_boxes: Option<Vec<BoundingBoxRequest>>,
  privacy_state: State<'_, PrivacyProcessorState>,
  _yolo_state: State<'_, YoloProcessorState>,
) -> Result<String, String> {
  let input_path = PathBuf::from(image_path);
  let output_path = PathBuf::from(output_path);

  if !input_path.exists() {
    return Err(format!("Input image not found: {}", input_path.display()));
  }

  // Получаем процессор
  let processor_arc = {
    let state = privacy_state.0.lock().unwrap();
    state
      .as_ref()
      .ok_or_else(|| "Privacy processor not initialized".to_string())?
      .clone()
  };

  // Получаем или детектируем лица
  let face_boxes: Vec<BoundingBox> = if auto_detect {
    // Автоматическая детекция через YOLO
    // Получаем первый доступный процессор из HashMap
    let processors = _yolo_state.processors.read().await;
    if processors.is_empty() {
      return Err(
        "No YOLO processors available. Please initialize a YOLO processor first".to_string(),
      );
    }

    // Берем первый доступный процессор
    let (processor_id, processor_arc) = processors.iter().next().unwrap();
    let processor = processor_arc.read().await;

    log::info!("Using YOLO processor '{}' for auto-detection", processor_id);

    // Детектируем лица
    let image = image::open(&input_path).map_err(|e| format!("Failed to load image: {}", e))?;

    match processor.process_image(&image).await {
      Ok(detections) => {
        // Фильтруем только детекции лиц (класс "person" часто используется для людей)
        detections
          .into_iter()
          .filter(|det| det.class == "person" || det.class.contains("face"))
          .map(|det| BoundingBox {
            x1: det.bbox.x,
            y1: det.bbox.y,
            x2: det.bbox.x + det.bbox.width,
            y2: det.bbox.y + det.bbox.height,
          })
          .collect()
      }
      Err(e) => {
        return Err(format!("Face detection failed: {}", e));
      }
    }
  } else {
    // Используем переданные bbox
    face_boxes
      .ok_or_else(|| "Face boxes required when auto_detect is false".to_string())?
      .into_iter()
      .map(|b| BoundingBox {
        x1: b.x1,
        y1: b.y1,
        x2: b.x2,
        y2: b.y2,
      })
      .collect()
  };

  let faces_count = face_boxes.len();

  // Применяем размытие
  let result = tokio::task::spawn_blocking(move || {
    processor_arc.blur_faces_in_file(&input_path, &output_path, &face_boxes)
  })
  .await
  .map_err(|e| format!("Task join error: {}", e))?;

  match result {
    Ok(_) => Ok(format!(
      "Successfully blurred {} faces in image",
      faces_count
    )),
    Err(e) => Err(format!("Failed to blur faces: {}", e)),
  }
}

/// Обновить настройки Privacy процессора
#[tauri::command]
pub async fn update_privacy_settings(
  blur_type: Option<String>,
  expand_ratio: Option<f32>,
  adaptive_blur: Option<bool>,
  privacy_state: State<'_, PrivacyProcessorState>,
) -> Result<String, String> {
  // Получаем текущие настройки
  let current_settings = {
    let state = privacy_state.0.lock().unwrap();
    match state.as_ref() {
      Some(processor) => processor.get_settings().clone(),
      None => return Err("Privacy processor not initialized".to_string()),
    }
  };

  // Обновляем настройки
  let mut new_settings = current_settings;

  if let Some(blur_type_str) = blur_type {
    new_settings.blur_type = match blur_type_str.as_str() {
      "gaussian" => BlurType::Gaussian { radius: 20.0 },
      "gaussian_light" => BlurType::Gaussian { radius: 10.0 },
      "gaussian_heavy" => BlurType::Gaussian { radius: 30.0 },
      "box" => BlurType::Box { size: 7 },
      "box_small" => BlurType::Box { size: 3 },
      "box_large" => BlurType::Box { size: 15 },
      "pixelate" => BlurType::Pixelate { pixel_size: 10 },
      "pixelate_fine" => BlurType::Pixelate { pixel_size: 5 },
      "pixelate_coarse" => BlurType::Pixelate { pixel_size: 20 },
      "eye_bar" => BlurType::EyeBar { height_ratio: 0.3 },
      "solid_black" => BlurType::SolidColor {
        color: [0, 0, 0, 255],
      },
      "solid_white" => BlurType::SolidColor {
        color: [255, 255, 255, 255],
      },
      "solid_blur" => BlurType::SolidColor {
        color: [128, 128, 128, 200],
      },
      "mosaic" => BlurType::Mosaic { tile_size: 8 },
      _ => new_settings.blur_type,
    };
  }

  if let Some(ratio) = expand_ratio {
    new_settings.expand_ratio = ratio.clamp(1.0, 2.0);
  }

  if let Some(adaptive) = adaptive_blur {
    new_settings.adaptive_blur = adaptive;
  }

  // Создаем новый процессор с обновленными настройками
  let new_processor = PrivacyProcessor::new(new_settings);

  let mut state = privacy_state.0.lock().unwrap();
  *state = Some(Arc::new(new_processor));

  Ok("Privacy settings updated successfully".to_string())
}

/// Размыть лица в видео (batch processing)
#[tauri::command]
pub async fn blur_faces_in_video_frames(
  frame_paths: Vec<String>,
  output_dir: String,
  auto_detect: bool,
  privacy_state: State<'_, PrivacyProcessorState>,
  _yolo_state: State<'_, YoloProcessorState>,
) -> Result<VideoBlurResult, String> {
  let output_dir = PathBuf::from(output_dir);

  if !output_dir.exists() {
    std::fs::create_dir_all(&output_dir)
      .map_err(|e| format!("Failed to create output directory: {}", e))?;
  }

  // Получаем процессоры
  let privacy_arc = {
    let state = privacy_state.0.lock().unwrap();
    state
      .as_ref()
      .ok_or_else(|| "Privacy processor not initialized".to_string())?
      .clone()
  };

  let yolo_arc = if auto_detect {
    // Получаем первый доступный процессор из HashMap
    let processors = _yolo_state.processors.read().await;
    if processors.is_empty() {
      return Err(
        "No YOLO processors available. Please initialize a YOLO processor first".to_string(),
      );
    }

    // Берем первый доступный процессор
    let (processor_id, processor_arc) = processors.iter().next().unwrap();
    log::info!(
      "Using YOLO processor '{}' for batch auto-detection",
      processor_id
    );

    Some(processor_arc.clone())
  } else {
    None
  };

  let mut processed_frames = Vec::new();
  let mut failed_frames = Vec::new();
  let mut total_faces_blurred = 0;

  // Обрабатываем каждый кадр
  for frame_path in frame_paths {
    let input_path = PathBuf::from(&frame_path);
    let file_name = input_path
      .file_name()
      .ok_or_else(|| "Invalid file path".to_string())?;
    let output_path = output_dir.join(file_name);

    match process_single_frame(
      input_path.clone(),
      output_path.clone(),
      privacy_arc.clone(),
      yolo_arc.clone(),
    )
    .await
    {
      Ok(faces_count) => {
        processed_frames.push(FrameBlurResult {
          input_path: frame_path,
          output_path: output_path.to_string_lossy().to_string(),
          faces_blurred: faces_count,
          success: true,
          error: None,
        });
        total_faces_blurred += faces_count;
      }
      Err(e) => {
        failed_frames.push(FrameBlurResult {
          input_path: frame_path,
          output_path: output_path.to_string_lossy().to_string(),
          faces_blurred: 0,
          success: false,
          error: Some(e),
        });
      }
    }
  }

  Ok(VideoBlurResult {
    total_frames: processed_frames.len() + failed_frames.len(),
    processed_frames: processed_frames.len(),
    failed_frames: failed_frames.len(),
    total_faces_blurred,
    frame_results: [processed_frames, failed_frames].concat(),
  })
}

/// Получить информацию о процессоре
#[tauri::command]
pub async fn get_privacy_processor_info(
  privacy_state: State<'_, PrivacyProcessorState>,
) -> Result<PrivacyProcessorInfo, String> {
  let state = privacy_state.0.lock().unwrap();
  match state.as_ref() {
    Some(processor) => {
      let settings = processor.get_settings();
      Ok(PrivacyProcessorInfo {
        is_initialized: true,
        blur_type: format!("{:?}", settings.blur_type),
        expand_ratio: settings.expand_ratio,
        preserve_metadata: settings.preserve_metadata,
        adaptive_blur: settings.adaptive_blur,
      })
    }
    None => Ok(PrivacyProcessorInfo {
      is_initialized: false,
      blur_type: String::new(),
      expand_ratio: 0.0,
      preserve_metadata: false,
      adaptive_blur: false,
    }),
  }
}

// Вспомогательные функции
async fn process_single_frame(
  input_path: PathBuf,
  output_path: PathBuf,
  privacy_processor: Arc<PrivacyProcessor>,
  yolo_processor: Option<Arc<RwLock<crate::recognition::yolo_processor_refactored::YoloProcessor>>>,
) -> Result<usize, String> {
  if !input_path.exists() {
    return Err(format!("Frame not found: {}", input_path.display()));
  }

  // Детектируем лица если нужно
  let face_boxes = if let Some(yolo_arc) = yolo_processor {
    // Используем реальную детекцию через новый YoloProcessor
    let processor = yolo_arc.read().await;
    let image = image::open(&input_path).map_err(|e| format!("Failed to load image: {}", e))?;

    match processor.process_image(&image).await {
      Ok(detections) => {
        // Фильтруем только детекции лиц (класс "person" часто используется для людей)
        detections
          .into_iter()
          .filter(|det| det.class == "person" || det.class.contains("face"))
          .map(|det| BoundingBox {
            x1: det.bbox.x,
            y1: det.bbox.y,
            x2: det.bbox.x + det.bbox.width,
            y2: det.bbox.y + det.bbox.height,
          })
          .collect()
      }
      Err(e) => {
        log::warn!("Face detection failed for {}: {}", input_path.display(), e);
        vec![]
      }
    }
  } else {
    Vec::new()
  };

  let faces_count = face_boxes.len();

  // Применяем размытие
  tokio::task::spawn_blocking(move || {
    privacy_processor.blur_faces_in_file(&input_path, &output_path, &face_boxes)
  })
  .await
  .map_err(|e| format!("Task join error: {}", e))?
  .map_err(|e| format!("Blur failed: {}", e))?;

  Ok(faces_count)
}

// Структуры для ответов
#[derive(serde::Serialize)]
pub struct VideoBlurResult {
  pub total_frames: usize,
  pub processed_frames: usize,
  pub failed_frames: usize,
  pub total_faces_blurred: usize,
  pub frame_results: Vec<FrameBlurResult>,
}

#[derive(serde::Serialize, Clone)]
pub struct FrameBlurResult {
  pub input_path: String,
  pub output_path: String,
  pub faces_blurred: usize,
  pub success: bool,
  pub error: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct BoundingBoxRequest {
  pub x1: f32,
  pub y1: f32,
  pub x2: f32,
  pub y2: f32,
}

#[derive(serde::Serialize)]
pub struct PrivacyProcessorInfo {
  pub is_initialized: bool,
  pub blur_type: String,
  pub expand_ratio: f32,
  pub preserve_metadata: bool,
  pub adaptive_blur: bool,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_privacy_processor_state() {
    let state = PrivacyProcessorState::default();
    assert!(state.0.lock().unwrap().is_none());
  }

  #[test]
  fn test_bounding_box_conversion() {
    let request = BoundingBoxRequest {
      x1: 10.0,
      y1: 20.0,
      x2: 100.0,
      y2: 120.0,
    };

    let bbox = BoundingBox {
      x1: request.x1,
      y1: request.y1,
      x2: request.x2,
      y2: request.y2,
    };

    assert_eq!(bbox.x1, 10.0);
    assert_eq!(bbox.y2, 120.0);
  }
}
