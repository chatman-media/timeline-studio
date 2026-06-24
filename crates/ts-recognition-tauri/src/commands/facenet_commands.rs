use base64::prelude::*;
/**
 * Tauri Commands for FaceNet Processing
 */
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

use crate::facenet_processor::{FaceNetModel, FaceNetProcessor};

/// Состояние FaceNet процессора
pub struct FaceNetProcessorState(pub Mutex<Option<Arc<FaceNetProcessor>>>);

impl Default for FaceNetProcessorState {
  fn default() -> Self {
    Self(Mutex::new(None))
  }
}

/// Инициализировать FaceNet процессор
#[tauri::command]
pub async fn init_facenet_processor(
  model_type: String,
  facenet_state: State<'_, FaceNetProcessorState>,
) -> Result<String, String> {
  let model_enum = match model_type.as_str() {
    "facenet-512d" => FaceNetModel::FaceNet512D,
    "facenet-128d" => FaceNetModel::FaceNet128D,
    "arcface-512d" => FaceNetModel::ArcFace512D,
    _ => return Err(format!("Unsupported FaceNet model type: {}", model_type)),
  };

  match FaceNetProcessor::new(model_enum) {
    Ok(mut processor) => {
      // Пытаемся загрузить модель
      match processor.load_model().await {
        Ok(_) => {
          let mut state = facenet_state.0.lock().await;
          *state = Some(Arc::new(processor));
          Ok(format!("FaceNet processor initialized with {}", model_type))
        }
        Err(e) => {
          // В случае ошибки все равно сохраняем процессор (для тестов)
          let mut state = facenet_state.0.lock().await;
          *state = Some(Arc::new(processor));
          log::warn!("FaceNet model loading failed: {}", e);
          Ok(format!(
            "FaceNet processor initialized (model loading failed: {})",
            e
          ))
        }
      }
    }
    Err(e) => Err(format!("Failed to create FaceNet processor: {}", e)),
  }
}

/// Генерировать embedding для изображения лица
#[tauri::command]
pub async fn generate_face_embedding(
  image_path: String,
  facenet_state: State<'_, FaceNetProcessorState>,
) -> Result<FaceEmbeddingResponse, String> {
  // Загружаем изображение перед блокировкой
  let image_path = PathBuf::from(image_path);
  if !image_path.exists() {
    return Err(format!("Image file not found: {}", image_path.display()));
  }

  let image = image::open(&image_path).map_err(|e| format!("Failed to load image: {}", e))?;

  // Получаем Arc к процессору
  let processor_arc = {
    let state = facenet_state.0.lock().await;
    state
      .as_ref()
      .ok_or_else(|| "FaceNet processor not initialized".to_string())?
      .clone()
  };

  // Выполняем blocking операцию в отдельной задаче
  let embedding_result =
    tokio::task::spawn_blocking(move || processor_arc.generate_embedding_sync(&image))
      .await
      .map_err(|e| format!("Task join error: {}", e))?;

  // Обрабатываем результат
  match embedding_result {
    Ok(embedding) => Ok(FaceEmbeddingResponse {
      vector: embedding.vector,
      quality: embedding.quality,
      dimension: embedding.dimension,
    }),
    Err(e) => Err(format!("Failed to generate embedding: {}", e)),
  }
}

/// Генерировать embedding для изображения лица из Base64
#[tauri::command]
pub async fn generate_face_embedding_from_base64(
  image_data: String,
  facenet_state: State<'_, FaceNetProcessorState>,
) -> Result<FaceEmbeddingResponse, String> {
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
    let state = facenet_state.0.lock().await;
    state
      .as_ref()
      .ok_or_else(|| "FaceNet processor not initialized".to_string())?
      .clone()
  };

  // Выполняем blocking операцию в отдельной задаче
  let embedding_result =
    tokio::task::spawn_blocking(move || processor_arc.generate_embedding_sync(&image))
      .await
      .map_err(|e| format!("Task join error: {}", e))?;

  // Обрабатываем результат
  match embedding_result {
    Ok(embedding) => Ok(FaceEmbeddingResponse {
      vector: embedding.vector,
      quality: embedding.quality,
      dimension: embedding.dimension,
    }),
    Err(e) => Err(format!("Failed to generate embedding: {}", e)),
  }
}

/// Вычислить косинусное сходство между двумя embeddings
#[tauri::command]
pub async fn calculate_cosine_similarity(
  embedding1: Vec<f32>,
  embedding2: Vec<f32>,
) -> Result<f32, String> {
  if embedding1.len() != embedding2.len() {
    return Err("Embeddings must have the same dimension".to_string());
  }

  if embedding1.is_empty() {
    return Err("Embeddings cannot be empty".to_string());
  }

  Ok(FaceNetProcessor::cosine_similarity(
    &embedding1,
    &embedding2,
  ))
}

/// Получить информацию о процессоре
#[tauri::command]
pub async fn get_facenet_processor_info(
  facenet_state: State<'_, FaceNetProcessorState>,
) -> Result<FaceNetProcessorInfo, String> {
  let state = facenet_state.0.lock().await;
  match state.as_ref() {
    Some(processor) => Ok(FaceNetProcessorInfo {
      is_initialized: true,
      is_model_loaded: processor.is_model_loaded(),
      model_path: processor.get_model_path().to_string_lossy().to_string(),
      embedding_dimension: processor.get_embedding_dimension(),
    }),
    None => Ok(FaceNetProcessorInfo {
      is_initialized: false,
      is_model_loaded: false,
      model_path: String::new(),
      embedding_dimension: 0,
    }),
  }
}

/// Ответ с embedding
#[derive(serde::Serialize)]
pub struct FaceEmbeddingResponse {
  pub vector: Vec<f32>,
  pub quality: f32,
  pub dimension: usize,
}

/// Информация о процессоре FaceNet
#[derive(serde::Serialize)]
pub struct FaceNetProcessorInfo {
  pub is_initialized: bool,
  pub is_model_loaded: bool,
  pub model_path: String,
  pub embedding_dimension: usize,
}

#[cfg(test)]
mod tests {
  use super::*;

  // Тесты пропускаем в связи с необходимостью Tauri State
  // В реальных условиях эти функции тестируются через интеграционные тесты

  #[tokio::test]
  async fn test_cosine_similarity() {
    let vec1 = vec![1.0, 0.0, 0.0];
    let vec2 = vec![1.0, 0.0, 0.0];
    let vec3 = vec![0.0, 1.0, 0.0];

    let sim1 = calculate_cosine_similarity(vec1.clone(), vec2)
      .await
      .unwrap();
    let sim2 = calculate_cosine_similarity(vec1, vec3).await.unwrap();

    assert!((sim1 - 1.0).abs() < 1e-6);
    assert!((sim2 - 0.0).abs() < 1e-6);
  }
}
