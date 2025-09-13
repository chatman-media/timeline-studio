use serde_json::Value;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

use super::database::PersonDatabase;
use super::types::*;

/// Состояние базы данных для Tauri
pub struct PersonDatabaseState(pub Arc<Mutex<PersonDatabase>>);

/// Создание новой персоны
#[tauri::command]
pub async fn create_person(
  name: String,
  description: Option<String>,
  tags: Option<Vec<String>>,
  state: State<'_, PersonDatabaseState>,
) -> Result<PersonProfile, String> {
  let db = state.0.lock().await;

  // Создаем персону
  let mut person = db
    .create_person(name, description)
    .await
    .map_err(|e| format!("Failed to create person: {}", e))?;

  // Добавляем теги если есть
  if let Some(tags) = tags {
    person.tags = tags;
    // TODO: Обновить теги в базе данных
  }

  Ok(person)
}

/// Получение персоны по ID
#[tauri::command]
pub async fn get_person(
  person_id: String,
  state: State<'_, PersonDatabaseState>,
) -> Result<Option<PersonProfile>, String> {
  let db = state.0.lock().await;

  db.get_person(&person_id)
    .await
    .map_err(|e| format!("Failed to get person: {}", e))
}

/// Добавление эмбеддинга лица
#[tauri::command]
pub async fn add_face_embedding(
  person_id: String,
  embedding: Vec<f32>,
  quality: f32,
  source_clip_id: String,
  frame_number: i32,
  timestamp: f64,
  state: State<'_, PersonDatabaseState>,
) -> Result<FaceEmbedding, String> {
  let db = state.0.lock().await;

  db.add_face_embedding(
    &person_id,
    embedding,
    quality,
    &source_clip_id,
    frame_number,
    timestamp,
  )
  .await
  .map_err(|e| format!("Failed to add face embedding: {}", e))
}

/// Поиск похожих персон
#[tauri::command]
pub async fn search_similar_persons(
  embedding: Vec<f32>,
  top_k: Option<usize>,
  use_cosine: Option<bool>,
  state: State<'_, PersonDatabaseState>,
) -> Result<Vec<SimilaritySearchResult>, String> {
  let db = state.0.lock().await;

  let top_k = top_k.unwrap_or(10);
  let use_cosine = use_cosine.unwrap_or(true);

  db.search_similar_persons(&embedding, top_k, use_cosine)
    .await
    .map_err(|e| format!("Failed to search similar persons: {}", e))
}

/// Добавление появления персоны в клипе
#[tauri::command]
pub async fn add_person_appearance(
  person_id: String,
  clip_id: String,
  start_time: f64,
  end_time: f64,
  confidence: f32,
  frame_count: i32,
  state: State<'_, PersonDatabaseState>,
) -> Result<PersonAppearance, String> {
  let db = state.0.lock().await;

  db.add_appearance(
    &person_id,
    &clip_id,
    start_time,
    end_time,
    confidence,
    frame_count,
  )
  .await
  .map_err(|e| format!("Failed to add appearance: {}", e))
}

/// Добавление миниатюры персоны
#[tauri::command]
pub async fn add_person_thumbnail(
  person_id: String,
  image_data_base64: String,
  width: i32,
  height: i32,
  is_primary: bool,
  quality: f32,
  state: State<'_, PersonDatabaseState>,
) -> Result<Value, String> {
  let db = state.0.lock().await;

  // Декодируем base64 изображение
  use base64::{Engine as _, engine::general_purpose};
  let image_data = general_purpose::STANDARD
    .decode(&image_data_base64)
    .map_err(|e| format!("Failed to decode image data: {}", e))?;

  let thumbnail = db
    .add_thumbnail(&person_id, image_data, width, height, is_primary, quality)
    .await
    .map_err(|e| format!("Failed to add thumbnail: {}", e))?;

  // Возвращаем без image_data для экономии трафика
  Ok(serde_json::json!({
      "id": thumbnail.id,
      "personId": thumbnail.person_id,
      "width": thumbnail.width,
      "height": thumbnail.height,
      "isPrimary": thumbnail.is_primary,
      "quality": thumbnail.quality,
  }))
}

/// Получение статистики базы данных
#[tauri::command]
pub async fn get_person_database_stats(
  state: State<'_, PersonDatabaseState>,
) -> Result<DatabaseStats, String> {
  let db = state.0.lock().await;

  db.get_stats()
    .await
    .map_err(|e| format!("Failed to get database stats: {}", e))
}

/// Удаление персоны
#[tauri::command]
pub async fn delete_person(
  person_id: String,
  state: State<'_, PersonDatabaseState>,
) -> Result<(), String> {
  let db = state.0.lock().await;

  db.delete_person(&person_id)
    .await
    .map_err(|e| format!("Failed to delete person: {}", e))
}

/// Обновление порога сходства
#[tauri::command]
pub async fn set_similarity_threshold(
  threshold: f32,
  state: State<'_, PersonDatabaseState>,
) -> Result<(), String> {
  let mut db = state.0.lock().await;

  db.set_similarity_threshold(threshold);

  Ok(())
}
