use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Результаты распознавания
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecognitionResults {
  /// Обнаруженные объекты
  pub objects: Vec<DetectedObject>,

  /// Обнаруженные лица
  pub faces: Vec<DetectedFace>,

  /// Обнаруженные сцены
  pub scenes: Vec<DetectedScene>,

  /// Время обработки
  pub processed_at: chrono::DateTime<chrono::Utc>,

  /// Идентифицированные персоны (после кластеризации)
  pub identified_persons: Vec<IdentifiedPerson>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedObject {
  /// Класс объекта (person, car, etc.)
  pub class: String,

  /// Уверенность (0.0 - 1.0)
  pub confidence: f32,

  /// Временные метки появления
  pub timestamps: Vec<f64>,

  /// Bounding boxes для каждого появления
  pub bounding_boxes: Vec<BoundingBox>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedFace {
  /// ID лица (для группировки)
  pub face_id: Option<String>,

  /// Имя человека (если известно)
  pub person_name: Option<String>,

  /// Уверенность
  pub confidence: f32,

  /// Временные метки появления
  pub timestamps: Vec<f64>,

  /// Bounding boxes
  pub bounding_boxes: Vec<BoundingBox>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedScene {
  /// Тип сцены (indoor, outdoor, etc.)
  pub scene_type: String,

  /// Начало и конец сцены
  pub start_time: f64,
  pub end_time: f64,

  /// Ключевые объекты в сцене
  pub key_objects: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  pub x: f32,
  pub y: f32,
  pub width: f32,
  pub height: f32,
}

/// Идентифицированная персона после кластеризации
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdentifiedPerson {
  /// ID персоны из базы данных
  pub person_id: Option<String>,
  
  /// Имя персоны (если известно)
  pub person_name: Option<String>,
  
  /// Группа лиц, относящихся к этой персоне
  pub face_group: Vec<DetectedFace>,
  
  /// Уверенность идентификации
  pub confidence: f32,
  
  /// Количество появлений
  pub appearance_count: usize,
}

/// Данные для создания новой персоны
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonData {
  pub name: String,
  pub alternative_names: Vec<String>,
  pub notes: Option<String>,
  pub tags: Vec<String>,
  pub metadata: HashMap<String, String>,
}

/// Профиль персоны
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonProfile {
  pub id: String,
  pub name: String,
  pub description: Option<String>,
  pub tags: Vec<String>,
  pub is_verified: bool,
  pub created_at: String,
  pub updated_at: String,
}

/// Эмбеддинг лица
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceEmbedding {
  pub id: String,
  pub person_id: String,
  pub embedding: Vec<f32>, // 512-dimensional vector
  pub quality: f32,
  pub source_clip_id: String,
  pub frame_number: i32,
  pub timestamp: f64,
  pub created_at: String,
}

/// Появление персоны в клипе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonAppearance {
  pub id: String,
  pub person_id: String,
  pub clip_id: String,
  pub start_time: f64,
  pub end_time: f64,
  pub confidence: f32,
  pub frame_count: i32,
}

/// Миниатюра персоны
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonThumbnail {
  pub id: String,
  pub person_id: String,
  pub image_data: Vec<u8>, // JPEG/PNG data
  pub width: i32,
  pub height: i32,
  pub is_primary: bool,
  pub quality: f32,
}

/// Результат поиска похожих лиц
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilaritySearchResult {
  pub person_id: String,
  pub similarity: f32,
  pub embedding_id: String,
  pub confidence: f32,
}

/// Статистика базы данных
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseStats {
  pub total_persons: i64,
  pub total_embeddings: i64,
  pub total_appearances: i64,
  pub average_embeddings_per_person: f64,
  pub storage_size_bytes: i64,
  pub last_updated: String,
}

impl Default for RecognitionResults {
  fn default() -> Self {
    Self {
      objects: Vec::new(),
      faces: Vec::new(),
      scenes: Vec::new(),
      identified_persons: Vec::new(),
      processed_at: chrono::Utc::now(),
    }
  }
}
