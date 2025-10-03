use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Уникальный идентификатор для всех сущностей
pub type EntityId = Uuid;

/// Тип эмбеддинга (512-dimensional float vector)
pub type FaceEmbeddingVector = Vec<f32>;

/// Уровень качества изображения (0.0 - 1.0)
pub type QualityScore = f32;

/// Уровень уверенности в процентах (0.0 - 100.0)
pub type ConfidenceLevel = f32;

/// Временная метка в секундах от начала видео
pub type Timestamp = f64;

/// Координаты в пикселях
pub type PixelCoordinate = f32;

/// Professional Face Recognition Data Structures
/// Главная структура для результатов распознавания
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfessionalRecognitionResults {
  /// Метаданные видео
  pub video_metadata: VideoMetadata,

  /// Обнаруженные лица с детальной информацией
  pub faces: Vec<ProfessionalDetectedFace>,

  /// Идентифицированные персоны с группами лиц
  pub identified_persons: Vec<ProfessionalPerson>,

  /// Статистика распознавания
  pub statistics: RecognitionStatistics,

  /// Время обработки
  pub processing_time_ms: u64,

  /// Версия используемых моделей
  pub model_version: String,
}

/// Метаданные видео для контекста распознавания
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoMetadata {
  pub clip_id: EntityId,
  pub file_path: String,
  pub duration_seconds: f64,
  pub fps: f32,
  pub resolution: Resolution,
  pub codec: String,
  pub file_size_bytes: u64,
}

/// Разрешение видео
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Resolution {
  pub width: u32,
  pub height: u32,
}

/// Профессиональное обнаруженное лицо
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfessionalDetectedFace {
  /// Уникальный ID лица в рамках клипа
  pub face_id: EntityId,

  /// Временные метки появления
  pub appearances: Vec<FaceAppearance>,

  /// Эмбеддинг лица
  pub embedding: Option<FaceEmbeddingVector>,

  /// Качество изображения лица
  pub quality_score: QualityScore,

  /// Углы поворота головы
  pub head_pose: HeadPose,

  /// Эмоциональное состояние
  pub emotion: Option<EmotionData>,

  /// Признаки пола и возраста
  pub demographics: Option<Demographics>,

  /// Признаки освещения
  pub lighting_conditions: LightingConditions,
}

/// Внешность лица в конкретный момент времени
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FaceAppearance {
  /// Временная метка
  pub timestamp: Timestamp,

  /// Номер кадра
  pub frame_number: u64,

  /// Bounding box лица
  pub bounding_box: BoundingBox,

  /// Уверенность обнаружения
  pub detection_confidence: ConfidenceLevel,

  /// Качество изображения в этот момент
  pub frame_quality: QualityScore,
}

/// Bounding box с нормализованными координатами
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoundingBox {
  /// Нормализованные координаты (0.0 - 1.0)
  pub x: f32,
  pub y: f32,
  pub width: f32,
  pub height: f32,

  /// Абсолютные координаты в пикселях
  pub absolute: Option<AbsoluteBoundingBox>,
}

/// Абсолютный bounding box в пикселях
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AbsoluteBoundingBox {
  pub x: PixelCoordinate,
  pub y: PixelCoordinate,
  pub width: PixelCoordinate,
  pub height: PixelCoordinate,
}

/// Поза головы (углы Эйлера)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeadPose {
  pub yaw: f32,   // поворот влево/вправо
  pub pitch: f32, // наклон вперед/назад
  pub roll: f32,  // наклон в стороны
}

/// Эмоциональные данные
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmotionData {
  pub primary_emotion: Emotion,
  pub confidence: ConfidenceLevel,
  pub emotions: HashMap<Emotion, ConfidenceLevel>,
}

/// Возможные эмоции
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Emotion {
  Neutral,
  Happy,
  Sad,
  Angry,
  Surprised,
  Disgusted,
  Fearful,
  Contemptuous,
}

/// Демографические данные
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Demographics {
  pub predicted_age: u8,
  pub age_confidence: ConfidenceLevel,
  pub predicted_gender: Gender,
  pub gender_confidence: ConfidenceLevel,
}

/// Пол
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Gender {
  Male,
  Female,
  Unknown,
}

/// Условия освещения
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LightingConditions {
  pub brightness: f32,  // 0.0 (темно) - 1.0 (ярко)
  pub contrast: f32,    // контрастность
  pub is_backlit: bool, // засветка сзади
  pub shadows: f32,     // уровень теней
}

/// Профессиональная персона (человек)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfessionalPerson {
  /// Уникальный ID персоны
  pub person_id: EntityId,

  /// Основное имя
  pub primary_name: String,

  /// Альтернативные имена/псевдонимы
  pub alternative_names: Vec<String>,

  /// Группы лиц, относящихся к этой персоне
  pub face_groups: Vec<FaceGroup>,

  /// Профильная информация
  pub profile: PersonProfileData,

  /// Статистика появлений
  pub appearance_stats: AppearanceStatistics,

  /// Метаданные
  pub metadata: HashMap<String, serde_json::Value>,
}

/// Группа лиц одной персоны
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FaceGroup {
  /// ID группы
  pub group_id: EntityId,

  /// Лица в этой группе
  pub faces: Vec<ProfessionalDetectedFace>,

  /// Качество группы (насколько уверены, что это один человек)
  pub group_confidence: ConfidenceLevel,

  /// Представительная миниатюра
  pub representative_thumbnail: Option<PersonThumbnail>,
}

/// Профильные данные персоны
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonProfileData {
  /// Описание
  pub description: Option<String>,

  /// Категории/теги
  pub categories: Vec<String>,

  /// Роль в проекте (актер, интервьюер, и т.д.)
  pub role: Option<String>,

  /// Контактная информация (если доступна)
  pub contact_info: Option<ContactInfo>,

  /// Социальные ссылки
  pub social_links: HashMap<String, String>,

  /// Примечания для редактора
  pub editor_notes: Option<String>,
}

/// Контактная информация
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContactInfo {
  pub email: Option<String>,
  pub phone: Option<String>,
  pub website: Option<String>,
}

/// Статистика появлений персоны
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceStatistics {
  /// Общее количество появлений
  pub total_appearances: u64,

  /// Общая длительность появлений в секундах
  pub total_duration_seconds: f64,

  /// Средняя длительность появления
  pub average_duration_seconds: f64,

  /// Процент экранного времени
  pub screen_time_percentage: f32,

  /// Распределение по времени суток
  pub time_distribution: HashMap<String, u64>,

  /// Распределение по сценам
  pub scene_distribution: HashMap<String, u64>,
}

/// Профессиональная миниатюра персоны
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonThumbnail {
  pub thumbnail_id: EntityId,
  pub person_id: EntityId,
  pub image_data: Vec<u8>, // JPEG/PNG
  pub dimensions: Resolution,
  pub is_primary: bool,
  pub quality_score: QualityScore,
  pub source_frame: FrameReference,
  pub created_at: DateTime<Utc>,
}

/// Ссылка на исходный кадр
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FrameReference {
  pub clip_id: EntityId,
  pub frame_number: u64,
  pub timestamp: Timestamp,
  pub bounding_box: BoundingBox,
}

/// Статистика распознавания
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecognitionStatistics {
  /// Количество обработанных кадров
  pub total_frames: u64,

  /// Количество обнаруженных лиц
  pub total_faces: u64,

  /// Количество уникальных персон
  pub unique_persons: u64,

  /// Среднее качество обнаружения
  pub average_detection_quality: QualityScore,

  /// Распределение по качеству
  pub quality_distribution: HashMap<String, u64>,

  /// Статистика ошибок
  pub error_statistics: ErrorStatistics,
}

/// Статистика ошибок
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorStatistics {
  pub failed_detections: u64,
  pub low_quality_detections: u64,
  pub tracking_errors: u64,
}

/// Настройки распознавания для профессионального использования
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfessionalRecognitionConfig {
  /// Порог качества для сохранения лица
  pub quality_threshold: QualityScore,

  /// Порог уверенности для идентификации
  pub identification_threshold: ConfidenceLevel,

  /// Минимальное количество кадров для группировки
  pub min_frames_for_grouping: u32,

  /// Использовать эмоциональный анализ
  pub enable_emotion_analysis: bool,

  /// Использовать демографический анализ
  pub enable_demographics: bool,

  /// Сохранять миниатюры
  pub generate_thumbnails: bool,

  /// Качество миниатюр
  pub thumbnail_quality: u8, // 1-100

  /// Размер миниатюр
  pub thumbnail_size: Resolution,
}

impl Default for ProfessionalRecognitionConfig {
  fn default() -> Self {
    Self {
      quality_threshold: 0.7,
      identification_threshold: 85.0,
      min_frames_for_grouping: 5,
      enable_emotion_analysis: true,
      enable_demographics: false,
      generate_thumbnails: true,
      thumbnail_quality: 85,
      thumbnail_size: Resolution {
        width: 256,
        height: 256,
      },
    }
  }
}

/// Результат экспорта для профессиональных редакторов
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfessionalExportResult {
  /// Формат экспорта (FCXML, AAF, EDL, JSON)
  pub format: ExportFormat,

  /// Путь к экспортированному файлу
  pub file_path: String,

  /// Список персон с временными метками
  pub person_timeline: Vec<PersonTimelineEntry>,

  /// Метаданные для редактора
  pub editor_metadata: HashMap<String, serde_json::Value>,
}

/// Форматы экспорта для профессиональных редакторов
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ExportFormat {
  Fcpxml, // Final Cut Pro XML
  Aaf,    // Advanced Authoring Format
  Edl,    // Edit Decision List
  Json,   // JSON для DaVinci Resolve
  Csv,    // CSV для Excel/Google Sheets
  Xml,    // Generic XML
}

/// Временная метка появления персоны
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonTimelineEntry {
  pub person_id: EntityId,
  pub person_name: String,
  pub start_time: Timestamp,
  pub end_time: Timestamp,
  pub confidence: ConfidenceLevel,
  pub scene_description: Option<String>,
}