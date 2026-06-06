use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Единая структура для всех данных превью медиафайла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaPreviewData {
  /// ID медиафайла
  pub file_id: String,

  /// Путь к исходному файлу
  pub file_path: PathBuf,

  /// Превью для браузера (одиночное)
  pub browser_thumbnail: Option<ThumbnailData>,

  /// Превью для таймлайна (множественные)
  pub timeline_previews: Vec<TimelinePreview>,

  /// Кадры для распознавания
  pub recognition_frames: Vec<RecognitionFrame>,

  /// Результаты распознавания
  pub recognition_results: Option<RecognitionResults>,

  /// Время последнего обновления
  pub last_updated: chrono::DateTime<chrono::Utc>,

  /// Базовые метаданные видео (для корректного отображения превью)
  pub basic_metadata: Option<BasicVideoMetadata>,
}

/// Базовые метаданные видео для отображения превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BasicVideoMetadata {
  /// Длительность (секунды)
  pub duration: Option<f64>,

  /// Ширина видео
  pub width: Option<u32>,

  /// Высота видео
  pub height: Option<u32>,

  /// Соотношение сторон (например "16:9")
  pub aspect_ratio: Option<String>,

  /// FPS
  pub fps: Option<f64>,

  /// Видео кодек
  pub video_codec: Option<String>,

  /// Аудио кодек
  pub audio_codec: Option<String>,

  /// Битрейт
  pub bitrate: Option<u32>,

  /// Есть ли видео поток
  pub has_video: bool,

  /// Есть ли аудио поток
  pub has_audio: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailData {
  /// Путь к файлу превью
  pub path: PathBuf,

  /// Base64 данные (опционально)
  pub base64_data: Option<String>,

  /// Временная метка кадра
  pub timestamp: f64,

  /// Разрешение
  pub width: u32,
  pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelinePreview {
  /// Временная метка
  pub timestamp: f64,

  /// Путь к превью
  pub path: PathBuf,

  /// Base64 данные (для быстрой загрузки)
  pub base64_data: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecognitionFrame {
  /// Временная метка кадра
  pub timestamp: f64,

  /// Путь к кадру высокого разрешения
  pub path: PathBuf,

  /// Статус обработки
  pub processed: bool,
}

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

impl MediaPreviewData {
  pub fn new(file_id: String, file_path: PathBuf) -> Self {
    Self {
      file_id,
      file_path,
      browser_thumbnail: None,
      timeline_previews: Vec::new(),
      recognition_frames: Vec::new(),
      recognition_results: None,
      last_updated: chrono::Utc::now(),
      basic_metadata: None,
    }
  }

  /// Установить базовые метаданные
  #[allow(dead_code)]
  pub fn set_basic_metadata(&mut self, metadata: BasicVideoMetadata) {
    self.basic_metadata = Some(metadata);
    self.last_updated = chrono::Utc::now();
  }

  /// Добавить превью для браузера
  #[allow(dead_code)]
  pub fn set_browser_thumbnail(&mut self, thumbnail: ThumbnailData) {
    self.browser_thumbnail = Some(thumbnail);
    self.last_updated = chrono::Utc::now();
  }

  /// Добавить превью для таймлайна
  #[allow(dead_code)]
  pub fn add_timeline_preview(&mut self, preview: TimelinePreview) {
    self.timeline_previews.push(preview);
    self
      .timeline_previews
      .sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());
    self.last_updated = chrono::Utc::now();
  }

  /// Добавить кадр для распознавания
  #[allow(dead_code)]
  pub fn add_recognition_frame(&mut self, frame: RecognitionFrame) {
    self.recognition_frames.push(frame);
    self
      .recognition_frames
      .sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());
    self.last_updated = chrono::Utc::now();
  }

  /// Установить результаты распознавания
  #[allow(dead_code)]
  pub fn set_recognition_results(&mut self, results: RecognitionResults) {
    self.recognition_results = Some(results);
    self.last_updated = chrono::Utc::now();
  }

  /// Получить все временные метки где есть превью
  #[allow(dead_code)]
  pub fn get_all_preview_timestamps(&self) -> Vec<f64> {
    let mut timestamps = Vec::new();

    if let Some(ref thumb) = self.browser_thumbnail {
      timestamps.push(thumb.timestamp);
    }

    for preview in &self.timeline_previews {
      timestamps.push(preview.timestamp);
    }

    for frame in &self.recognition_frames {
      timestamps.push(frame.timestamp);
    }

    timestamps.sort_by(|a, b| a.partial_cmp(b).unwrap());
    timestamps.dedup();
    timestamps
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::path::PathBuf;

  fn create_test_thumbnail() -> ThumbnailData {
    ThumbnailData {
      path: PathBuf::from("/tmp/thumb.jpg"),
      base64_data: Some("data:image/jpeg;base64,test".to_string()),
      timestamp: 1.5,
      width: 320,
      height: 240,
    }
  }

  fn create_test_timeline_preview(timestamp: f64) -> TimelinePreview {
    TimelinePreview {
      timestamp,
      path: PathBuf::from(format!("/tmp/preview_{timestamp}.jpg")),
      base64_data: None,
    }
  }

  fn create_test_recognition_frame(timestamp: f64, processed: bool) -> RecognitionFrame {
    RecognitionFrame {
      timestamp,
      path: PathBuf::from(format!("/tmp/frame_{timestamp}.jpg")),
      processed,
    }
  }

  #[test]
  fn test_media_preview_data_creation() {
    let data = MediaPreviewData::new("test_id".to_string(), PathBuf::from("/tmp/video.mp4"));

    assert_eq!(data.file_id, "test_id");
    assert_eq!(data.file_path, PathBuf::from("/tmp/video.mp4"));
    assert!(data.browser_thumbnail.is_none());
    assert!(data.timeline_previews.is_empty());
    assert!(data.recognition_frames.is_empty());
    assert!(data.recognition_results.is_none());
  }

  #[test]
  fn test_set_browser_thumbnail() {
    let mut data = MediaPreviewData::new("test_id".to_string(), PathBuf::from("/tmp/video.mp4"));
    let original_time = data.last_updated;

    // Wait a bit to ensure time difference
    std::thread::sleep(std::time::Duration::from_millis(10));

    let thumbnail = create_test_thumbnail();
    data.set_browser_thumbnail(thumbnail.clone());

    assert!(data.browser_thumbnail.is_some());
    assert_eq!(data.browser_thumbnail.as_ref().unwrap().timestamp, 1.5);
    assert!(data.last_updated > original_time);
  }

  #[test]
  fn test_add_timeline_preview() {
    let mut data = MediaPreviewData::new("test_id".to_string(), PathBuf::from("/tmp/video.mp4"));

    // Add previews out of order
    data.add_timeline_preview(create_test_timeline_preview(3.0));
    data.add_timeline_preview(create_test_timeline_preview(1.0));
    data.add_timeline_preview(create_test_timeline_preview(2.0));

    assert_eq!(data.timeline_previews.len(), 3);
    // Should be sorted by timestamp
    assert_eq!(data.timeline_previews[0].timestamp, 1.0);
    assert_eq!(data.timeline_previews[1].timestamp, 2.0);
    assert_eq!(data.timeline_previews[2].timestamp, 3.0);
  }

  #[test]
  fn test_add_recognition_frame() {
    let mut data = MediaPreviewData::new("test_id".to_string(), PathBuf::from("/tmp/video.mp4"));

    // Add frames out of order
    data.add_recognition_frame(create_test_recognition_frame(2.0, false));
    data.add_recognition_frame(create_test_recognition_frame(1.0, true));
    data.add_recognition_frame(create_test_recognition_frame(3.0, false));

    assert_eq!(data.recognition_frames.len(), 3);
    // Should be sorted by timestamp
    assert_eq!(data.recognition_frames[0].timestamp, 1.0);
    assert_eq!(data.recognition_frames[1].timestamp, 2.0);
    assert_eq!(data.recognition_frames[2].timestamp, 3.0);
  }

  #[test]
  fn test_set_recognition_results() {
    let mut data = MediaPreviewData::new("test_id".to_string(), PathBuf::from("/tmp/video.mp4"));

    let results = RecognitionResults {
      objects: vec![DetectedObject {
        class: "person".to_string(),
        confidence: 0.95,
        timestamps: vec![1.0, 2.0],
        bounding_boxes: vec![],
      }],
      faces: vec![],
      scenes: vec![],
      processed_at: chrono::Utc::now(),
    };

    data.set_recognition_results(results.clone());

    assert!(data.recognition_results.is_some());
    let stored_results = data.recognition_results.as_ref().unwrap();
    assert_eq!(stored_results.objects.len(), 1);
    assert_eq!(stored_results.objects[0].class, "person");
  }

  #[test]
  fn test_get_all_preview_timestamps() {
    let mut data = MediaPreviewData::new("test_id".to_string(), PathBuf::from("/tmp/video.mp4"));

    // Add various preview data with some duplicate timestamps
    data.set_browser_thumbnail(create_test_thumbnail()); // 1.5
    data.add_timeline_preview(create_test_timeline_preview(1.0));
    data.add_timeline_preview(create_test_timeline_preview(2.0));
    data.add_timeline_preview(create_test_timeline_preview(1.5)); // Duplicate
    data.add_recognition_frame(create_test_recognition_frame(3.0, true));
    data.add_recognition_frame(create_test_recognition_frame(2.0, false)); // Duplicate

    let timestamps = data.get_all_preview_timestamps();

    assert_eq!(timestamps.len(), 4); // Should have deduplicated
    assert_eq!(timestamps, vec![1.0, 1.5, 2.0, 3.0]);
  }

  #[test]
  fn test_thumbnail_data_serialization() {
    let thumbnail = create_test_thumbnail();
    let serialized = serde_json::to_string(&thumbnail).unwrap();
    let deserialized: ThumbnailData = serde_json::from_str(&serialized).unwrap();

    assert_eq!(thumbnail.path, deserialized.path);
    assert_eq!(thumbnail.base64_data, deserialized.base64_data);
    assert_eq!(thumbnail.timestamp, deserialized.timestamp);
    assert_eq!(thumbnail.width, deserialized.width);
    assert_eq!(thumbnail.height, deserialized.height);
  }

  #[test]
  fn test_bounding_box_serialization() {
    let bbox = BoundingBox {
      x: 10.5,
      y: 20.5,
      width: 100.0,
      height: 200.0,
    };

    let serialized = serde_json::to_string(&bbox).unwrap();
    let deserialized: BoundingBox = serde_json::from_str(&serialized).unwrap();

    assert_eq!(bbox.x, deserialized.x);
    assert_eq!(bbox.y, deserialized.y);
    assert_eq!(bbox.width, deserialized.width);
    assert_eq!(bbox.height, deserialized.height);
  }

  #[test]
  fn test_detected_object_serialization() {
    let obj = DetectedObject {
      class: "car".to_string(),
      confidence: 0.85,
      timestamps: vec![1.0, 2.0, 3.0],
      bounding_boxes: vec![BoundingBox {
        x: 10.0,
        y: 20.0,
        width: 50.0,
        height: 30.0,
      }],
    };

    let serialized = serde_json::to_string(&obj).unwrap();
    let deserialized: DetectedObject = serde_json::from_str(&serialized).unwrap();

    assert_eq!(obj.class, deserialized.class);
    assert_eq!(obj.confidence, deserialized.confidence);
    assert_eq!(obj.timestamps, deserialized.timestamps);
    assert_eq!(obj.bounding_boxes.len(), deserialized.bounding_boxes.len());
  }

  #[test]
  fn test_detected_face_serialization() {
    let face = DetectedFace {
      face_id: Some("face_001".to_string()),
      person_name: Some("John Doe".to_string()),
      confidence: 0.92,
      timestamps: vec![1.5, 2.5],
      bounding_boxes: vec![],
    };

    let serialized = serde_json::to_string(&face).unwrap();
    let deserialized: DetectedFace = serde_json::from_str(&serialized).unwrap();

    assert_eq!(face.face_id, deserialized.face_id);
    assert_eq!(face.person_name, deserialized.person_name);
    assert_eq!(face.confidence, deserialized.confidence);
    assert_eq!(face.timestamps, deserialized.timestamps);
  }

  #[test]
  fn test_detected_scene_serialization() {
    let scene = DetectedScene {
      scene_type: "outdoor".to_string(),
      start_time: 0.0,
      end_time: 10.0,
      key_objects: vec!["tree".to_string(), "sky".to_string()],
    };

    let serialized = serde_json::to_string(&scene).unwrap();
    let deserialized: DetectedScene = serde_json::from_str(&serialized).unwrap();

    assert_eq!(scene.scene_type, deserialized.scene_type);
    assert_eq!(scene.start_time, deserialized.start_time);
    assert_eq!(scene.end_time, deserialized.end_time);
    assert_eq!(scene.key_objects, deserialized.key_objects);
  }

  #[test]
  fn test_media_preview_data_serialization() {
    let mut data = MediaPreviewData::new("test_id".to_string(), PathBuf::from("/tmp/video.mp4"));

    data.set_browser_thumbnail(create_test_thumbnail());
    data.add_timeline_preview(create_test_timeline_preview(1.0));
    data.add_recognition_frame(create_test_recognition_frame(2.0, true));

    let serialized = serde_json::to_string(&data).unwrap();
    let deserialized: MediaPreviewData = serde_json::from_str(&serialized).unwrap();

    assert_eq!(data.file_id, deserialized.file_id);
    assert_eq!(data.file_path, deserialized.file_path);
    assert_eq!(
      data.timeline_previews.len(),
      deserialized.timeline_previews.len()
    );
    assert_eq!(
      data.recognition_frames.len(),
      deserialized.recognition_frames.len()
    );
  }

  #[test]
  fn test_empty_preview_timestamps() {
    let data = MediaPreviewData::new("test_id".to_string(), PathBuf::from("/tmp/video.mp4"));

    let timestamps = data.get_all_preview_timestamps();
    assert!(timestamps.is_empty());
  }

  #[test]
  fn test_timeline_preview_with_base64() {
    let preview = TimelinePreview {
      timestamp: 5.0,
      path: PathBuf::from("/tmp/preview.jpg"),
      base64_data: Some("data:image/jpeg;base64,/9j/4AAQ...".to_string()),
    };

    assert!(preview.base64_data.is_some());
    assert!(preview.base64_data.unwrap().starts_with("data:image"));
  }

  #[test]
  fn test_recognition_frame_processed_status() {
    let unprocessed = create_test_recognition_frame(1.0, false);
    let processed = create_test_recognition_frame(2.0, true);

    assert!(!unprocessed.processed);
    assert!(processed.processed);
  }
}
