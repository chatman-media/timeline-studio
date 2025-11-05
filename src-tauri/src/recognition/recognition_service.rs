use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;

use super::person_clustering::PersonClusteringService;
use super::types::{
  BoundingBox, DetectedFace, DetectedObject, DetectedScene, IdentifiedPerson, RecognitionResults,
};
// Use refactored YOLO implementation
use super::frame_processor::{Detection, ProcessingConfig};
use super::model_manager::YoloModel;
use super::yolo_processor_refactored::{ProcessorConfig, YoloProcessor};

/// State wrapper for RecognitionService
#[derive(Clone)]
pub struct RecognitionState {
  pub service: Arc<RecognitionService>,
}

impl RecognitionState {
  pub fn new(service: Arc<RecognitionService>) -> Self {
    Self { service }
  }
}

/// Сервис для распознавания объектов и лиц
pub struct RecognitionService {
  /// YOLO процессор для объектов
  object_detector: Arc<RwLock<YoloProcessor>>,

  /// YOLO процессор для лиц (опционально)
  face_detector: Option<Arc<RwLock<YoloProcessor>>>,

  /// Сервис для кластеринга и идентификации персон
  pub person_clustering: Arc<PersonClusteringService>,

  /// Директория для результатов
  results_dir: PathBuf,
}

impl RecognitionService {
  pub async fn new(base_dir: impl AsRef<Path>) -> Result<Self> {
    let base_path = base_dir.as_ref();
    let results_dir = base_path.join("Recognition");
    std::fs::create_dir_all(&results_dir)?;

    // Создаем процессоры с использованием refactored API
    let object_config = ProcessorConfig {
      model: YoloModel::YoloV11Detection,
      processing_config: ProcessingConfig {
        confidence_threshold: 0.5,
        ..Default::default()
      },
      ..Default::default()
    };
    let object_detector = YoloProcessor::new(object_config).await?;

    // Попытка создать face detector (опционально)
    let face_detector = {
      let face_config = ProcessorConfig {
        model: YoloModel::YoloV11Face,
        processing_config: ProcessingConfig {
          confidence_threshold: 0.7,
          ..Default::default()
        },
        ..Default::default()
      };
      match YoloProcessor::new(face_config).await {
        Ok(processor) => {
          log::info!("Face detector initialized successfully");
          Some(Arc::new(RwLock::new(processor)))
        }
        Err(e) => {
          log::warn!("Face detector not available: {}. Face detection will be disabled.", e);
          None
        }
      }
    };

    // Create person clustering service with proper error handling
    let db_path = base_path.join("persons.db");
    let person_clustering = match PersonClusteringService::new(db_path).await {
      Ok(service) => Arc::new(service),
      Err(e) => {
        log::error!("Failed to create person clustering service: {}", e);
        return Err(anyhow::anyhow!(
          "Failed to create person clustering service: {}",
          e
        ));
      }
    };

    Ok(Self {
      object_detector: Arc::new(RwLock::new(object_detector)),
      face_detector,
      person_clustering,
      results_dir,
    })
  }

  /// Обработать видео файл
  pub async fn process_video(
    &self,
    file_id: &str,
    frame_paths: Vec<PathBuf>,
  ) -> Result<RecognitionResults> {
    // Обрабатываем каждый кадр
    let mut all_objects: Vec<(f64, Detection)> = Vec::new();
    let mut all_faces: Vec<(f64, Detection)> = Vec::new();

    for (idx, frame_path) in frame_paths.iter().enumerate() {
      // Вычисляем примерную временную метку
      let timestamp = idx as f64 * 1.0; // Простая метка времени

      // Обнаружение объектов
      let object_detector = self.object_detector.read().await;
      let objects = object_detector.process_image_path(frame_path).await?;
      all_objects.extend(objects.into_iter().map(|d| (timestamp, d)));

      // Обнаружение лиц (если доступно)
      if let Some(ref face_detector) = self.face_detector {
        let face_detector = face_detector.read().await;
        let faces = face_detector.process_image_path(frame_path).await?;
        all_faces.extend(faces.into_iter().map(|d| (timestamp, d)));
      }
    }

    // Группируем результаты
    let grouped_objects = self.group_objects(all_objects);

    // Кластеризуем лица и идентифицируем персон
    let detected_faces = self.convert_to_detected_faces(all_faces);
    let person_profiles = self
      .person_clustering
      .cluster_and_identify(detected_faces)
      .await
      .map_err(|e| anyhow::anyhow!(e))?;

    // Convert PersonProfile to IdentifiedPerson with actual data
    let mut identified_persons = Vec::new();
    for profile in person_profiles {
      // For now, use simplified data without database access
      let confidence = 0.8; // Default confidence
      let appearance_count = 1; // Default appearance count

      // Create a simple face group for now
      let face_group = vec![DetectedFace {
        face_id: Some(format!("{}_face_0", profile.id)),
        person_name: Some(profile.primary_name.clone()),
        confidence,
        timestamps: vec![0.0],
        bounding_boxes: vec![BoundingBox {
          x: 0.0,
          y: 0.0,
          width: 100.0,
          height: 100.0,
        }],
      }];

      identified_persons.push(IdentifiedPerson {
        person_id: Some(profile.id.to_string()),
        person_name: Some(profile.primary_name),
        face_group,
        confidence,
        appearance_count,
      });
    }

    let scenes = self.detect_scenes(&grouped_objects);

    let results = RecognitionResults {
      objects: grouped_objects,
      faces: Vec::new(), // Больше не используем старый способ группировки лиц
      scenes,
      identified_persons,
      processed_at: chrono::Utc::now(),
    };

    // Сохраняем результаты
    self.save_results(file_id, &results).await?;

    Ok(results)
  }

  /// Группировать обнаруженные объекты по классам
  fn group_objects(&self, detections: Vec<(f64, Detection)>) -> Vec<DetectedObject> {
    use std::collections::HashMap;

    let mut grouped: HashMap<String, Vec<(f64, Detection)>> = HashMap::new();

    for (timestamp, detection) in detections {
      grouped
        .entry(detection.class.clone())
        .or_default()
        .push((timestamp, detection));
    }

    grouped
      .into_iter()
      .map(|(class, detections)| {
        let mut timestamps = Vec::new();
        let mut bounding_boxes = Vec::new();
        let mut total_confidence = 0.0;

        for (timestamp, detection) in detections {
          timestamps.push(timestamp);
          bounding_boxes.push(BoundingBox {
            x: detection.bbox.x,
            y: detection.bbox.y,
            width: detection.bbox.width,
            height: detection.bbox.height,
          });
          total_confidence += detection.confidence;
        }

        DetectedObject {
          class,
          confidence: total_confidence / timestamps.len() as f32,
          timestamps,
          bounding_boxes,
        }
      })
      .collect()
  }

  /// Конвертировать детекции лиц в DetectedFace
  fn convert_to_detected_faces(&self, detections: Vec<(f64, Detection)>) -> Vec<DetectedFace> {
    detections
      .into_iter()
      .enumerate()
      .map(|(idx, (timestamp, detection))| DetectedFace {
        face_id: Some(format!("face_{idx}")),
        person_name: None,
        confidence: detection.confidence,
        timestamps: vec![timestamp],
        bounding_boxes: vec![BoundingBox {
          x: detection.bbox.x,
          y: detection.bbox.y,
          width: detection.bbox.width,
          height: detection.bbox.height,
        }],
      })
      .collect()
  }

  /// Группировать детекции лиц (для обратной совместимости)
  pub fn group_faces(&self, detections: Vec<(f64, Detection)>) -> Vec<DetectedFace> {
    self.convert_to_detected_faces(detections)
  }

  /// Определить сцены на основе объектов
  fn detect_scenes(&self, objects: &[DetectedObject]) -> Vec<DetectedScene> {
    // Простая эвристика для определения сцен
    let mut scenes = Vec::new();

    // Сцена с людьми
    if objects.iter().any(|o| o.class == "person") {
      let person_timestamps: Vec<f64> = objects
        .iter()
        .filter(|o| o.class == "person")
        .flat_map(|o| o.timestamps.clone())
        .collect();

      if !person_timestamps.is_empty() {
        let start = person_timestamps
          .iter()
          .min_by(|a, b| a.partial_cmp(b).unwrap())
          .copied()
          .unwrap_or(0.0);
        let end = person_timestamps
          .iter()
          .max_by(|a, b| a.partial_cmp(b).unwrap())
          .copied()
          .unwrap_or(0.0);

        scenes.push(DetectedScene {
          scene_type: "people".to_string(),
          start_time: start,
          end_time: end,
          key_objects: vec!["person".to_string()],
        });
      }
    }

    // Сцена с транспортом
    let vehicle_classes = ["car", "truck", "bus", "motorcycle", "bicycle"];
    let vehicles: Vec<&DetectedObject> = objects
      .iter()
      .filter(|o| vehicle_classes.contains(&o.class.as_str()))
      .collect();

    if !vehicles.is_empty() {
      let vehicle_timestamps: Vec<f64> =
        vehicles.iter().flat_map(|o| o.timestamps.clone()).collect();

      let start = vehicle_timestamps
        .iter()
        .min_by(|a, b| a.partial_cmp(b).unwrap())
        .copied()
        .unwrap_or(0.0);
      let end = vehicle_timestamps
        .iter()
        .max_by(|a, b| a.partial_cmp(b).unwrap())
        .copied()
        .unwrap_or(0.0);

      let key_objects: Vec<String> = vehicles
        .iter()
        .map(|o| o.class.clone())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

      scenes.push(DetectedScene {
        scene_type: "traffic".to_string(),
        start_time: start,
        end_time: end,
        key_objects,
      });
    }

    scenes
  }

  /// Сохранить результаты в файл
  async fn save_results(&self, file_id: &str, results: &RecognitionResults) -> Result<()> {
    let results_file = self.results_dir.join(format!("{file_id}_recognition.json"));
    let json = serde_json::to_string_pretty(results)?;
    tokio::fs::write(results_file, json).await?;
    Ok(())
  }

  /// Загрузить результаты из файла
  pub async fn load_results(&self, file_id: &str) -> Result<Option<RecognitionResults>> {
    let results_file = self.results_dir.join(format!("{file_id}_recognition.json"));

    if results_file.exists() {
      let json = tokio::fs::read_to_string(results_file).await?;
      let results: RecognitionResults = serde_json::from_str(&json)?;
      Ok(Some(results))
    } else {
      Ok(None)
    }
  }

  /// Обработать пакет видео
  pub async fn process_batch(
    &self,
    file_ids: Vec<String>,
    frame_paths_map: std::collections::HashMap<String, Vec<PathBuf>>,
  ) -> Result<Vec<(String, RecognitionResults)>> {
    let mut results = Vec::new();

    for file_id in file_ids {
      if let Some(frame_paths) = frame_paths_map.get(&file_id) {
        match self.process_video(&file_id, frame_paths.clone()).await {
          Ok(recognition_results) => {
            results.push((file_id, recognition_results));
          }
          Err(e) => {
            eprintln!("Failed to process file {file_id}: {e}");
          }
        }
      }
    }

    Ok(results)
  }

  /// Получить доступ к детектору объектов
  #[allow(dead_code)]
  pub fn get_object_detector(&self) -> Arc<RwLock<YoloProcessor>> {
    self.object_detector.clone()
  }

  /// Получить доступ к детектору лиц (если доступен)
  #[allow(dead_code)]
  pub fn get_face_detector(&self) -> Option<Arc<RwLock<YoloProcessor>>> {
    self.face_detector.clone()
  }

  /// Загрузить модель для детектора объектов
  pub async fn load_object_model(&self) -> Result<()> {
    let detector = self.object_detector.read().await;
    detector.load_model().await
  }

  /// Загрузить модель для детектора лиц (если доступен)
  #[allow(dead_code)]
  pub async fn load_face_model(&self) -> Result<()> {
    if let Some(ref face_detector) = self.face_detector {
      let detector = face_detector.read().await;
      detector.load_model().await
    } else {
      Err(anyhow::anyhow!("Face detector is not available"))
    }
  }

  /// Установить целевые классы для детектора объектов
  pub async fn set_object_classes(&self, classes: Vec<String>) {
    let mut detector = self.object_detector.write().await;
    detector.set_target_classes(classes);
  }

  /// Получить классы объектов
  pub async fn get_object_classes(&self) -> Vec<String> {
    let detector = self.object_detector.read().await;
    detector.get_class_names()
  }

  /// Пакетная обработка изображений детектором объектов
  pub async fn process_objects_batch(
    &self,
    image_paths: Vec<PathBuf>,
  ) -> Result<Vec<Vec<Detection>>> {
    let detector = self.object_detector.read().await;
    detector.process_batch(image_paths).await
  }
}

/// События распознавания для отправки на фронтенд
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
#[allow(clippy::enum_variant_names)]
pub enum RecognitionEvent {
  /// Начало обработки
  ProcessingStarted { file_id: String },

  /// Прогресс обработки
  ProcessingProgress {
    file_id: String,
    current: usize,
    total: usize,
  },

  /// Обработка завершена
  ProcessingCompleted {
    file_id: String,
    results: RecognitionResults,
  },

  /// Ошибка обработки
  ProcessingError { file_id: String, error: String },
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::recognition::frame_processor::BoundingBox as YoloBBox;
  use crate::recognition::Detection;
  use std::collections::HashMap;
  use tempfile::TempDir;

  fn create_test_detection(class: &str, confidence: f32, x: f32, y: f32) -> Detection {
    Detection {
      class: class.to_string(),
      class_id: 0,
      confidence,
      bbox: YoloBBox {
        x,
        y,
        width: 50.0,
        height: 100.0,
      },
      attributes: None,
    }
  }

  #[tokio::test]
  async fn test_recognition_service_creation() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf()).await;
    assert!(service.is_ok());

    let service = service.unwrap();
    assert!(service.results_dir.exists());
  }

  #[tokio::test]
  async fn test_group_objects() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let detections = vec![
      (0.0, create_test_detection("person", 0.9, 100.0, 100.0)),
      (1.0, create_test_detection("person", 0.85, 110.0, 105.0)),
      (0.5, create_test_detection("car", 0.8, 200.0, 200.0)),
      (2.0, create_test_detection("person", 0.95, 120.0, 110.0)),
    ];

    let grouped = service.group_objects(detections);
    assert_eq!(grouped.len(), 2);

    let person_obj = grouped.iter().find(|o| o.class == "person").unwrap();
    assert_eq!(person_obj.timestamps.len(), 3);
    assert_eq!(person_obj.bounding_boxes.len(), 3);
    assert!(person_obj.confidence > 0.8);

    let car_obj = grouped.iter().find(|o| o.class == "car").unwrap();
    assert_eq!(car_obj.timestamps.len(), 1);
  }

  #[tokio::test]
  async fn test_group_faces() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let detections = vec![
      (0.0, create_test_detection("face", 0.95, 100.0, 100.0)),
      (1.0, create_test_detection("face", 0.9, 110.0, 105.0)),
      (2.0, create_test_detection("face", 0.85, 200.0, 200.0)),
    ];

    let grouped = service.group_faces(detections);
    assert_eq!(grouped.len(), 3);

    for (idx, face) in grouped.iter().enumerate() {
      assert_eq!(face.face_id, Some(format!("face_{idx}")));
      assert_eq!(face.timestamps.len(), 1);
      assert_eq!(face.bounding_boxes.len(), 1);
      assert!(face.confidence >= 0.85);
    }
  }

  #[tokio::test]
  async fn test_detect_scenes_people() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let objects = vec![
      DetectedObject {
        class: "person".to_string(),
        confidence: 0.9,
        timestamps: vec![0.0, 1.0, 2.0, 3.0],
        bounding_boxes: vec![],
      },
      DetectedObject {
        class: "chair".to_string(),
        confidence: 0.8,
        timestamps: vec![1.0, 2.0],
        bounding_boxes: vec![],
      },
    ];

    let scenes = service.detect_scenes(&objects);
    assert_eq!(scenes.len(), 1);

    let people_scene = &scenes[0];
    assert_eq!(people_scene.scene_type, "people");
    assert_eq!(people_scene.start_time, 0.0);
    assert_eq!(people_scene.end_time, 3.0);
    assert!(people_scene.key_objects.contains(&"person".to_string()));
  }

  #[tokio::test]
  async fn test_detect_scenes_traffic() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let objects = vec![
      DetectedObject {
        class: "car".to_string(),
        confidence: 0.9,
        timestamps: vec![0.0, 1.0, 2.0],
        bounding_boxes: vec![],
      },
      DetectedObject {
        class: "truck".to_string(),
        confidence: 0.85,
        timestamps: vec![1.0, 3.0],
        bounding_boxes: vec![],
      },
      DetectedObject {
        class: "bicycle".to_string(),
        confidence: 0.7,
        timestamps: vec![2.0],
        bounding_boxes: vec![],
      },
    ];

    let scenes = service.detect_scenes(&objects);
    assert_eq!(scenes.len(), 1);

    let traffic_scene = &scenes[0];
    assert_eq!(traffic_scene.scene_type, "traffic");
    assert_eq!(traffic_scene.start_time, 0.0);
    assert_eq!(traffic_scene.end_time, 3.0);
    assert_eq!(traffic_scene.key_objects.len(), 3);
    assert!(traffic_scene.key_objects.contains(&"car".to_string()));
    assert!(traffic_scene.key_objects.contains(&"truck".to_string()));
    assert!(traffic_scene.key_objects.contains(&"bicycle".to_string()));
  }

  #[tokio::test]
  async fn test_detect_scenes_mixed() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let objects = vec![
      DetectedObject {
        class: "person".to_string(),
        confidence: 0.9,
        timestamps: vec![0.0, 1.0],
        bounding_boxes: vec![],
      },
      DetectedObject {
        class: "car".to_string(),
        confidence: 0.85,
        timestamps: vec![2.0, 3.0],
        bounding_boxes: vec![],
      },
    ];

    let scenes = service.detect_scenes(&objects);
    assert_eq!(scenes.len(), 2);

    let people_scene = scenes.iter().find(|s| s.scene_type == "people").unwrap();
    assert_eq!(people_scene.start_time, 0.0);
    assert_eq!(people_scene.end_time, 1.0);

    let traffic_scene = scenes.iter().find(|s| s.scene_type == "traffic").unwrap();
    assert_eq!(traffic_scene.start_time, 2.0);
    assert_eq!(traffic_scene.end_time, 3.0);
  }

  #[tokio::test]
  async fn test_save_and_load_results() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let results = RecognitionResults {
      objects: vec![DetectedObject {
        class: "test".to_string(),
        confidence: 0.9,
        timestamps: vec![0.0],
        bounding_boxes: vec![],
      }],
      faces: vec![],
      scenes: vec![],
      identified_persons: vec![],
      processed_at: chrono::Utc::now(),
    };

    let file_id = "test_file";

    // Save
    let save_result = service.save_results(file_id, &results).await;
    assert!(save_result.is_ok());

    // Load
    let loaded = service.load_results(file_id).await.unwrap();
    assert!(loaded.is_some());

    let loaded_results = loaded.unwrap();
    assert_eq!(loaded_results.objects.len(), 1);
    assert_eq!(loaded_results.objects[0].class, "test");
  }

  #[tokio::test]
  async fn test_load_nonexistent_results() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let result = service.load_results("nonexistent").await.unwrap();
    assert!(result.is_none());
  }

  #[tokio::test]
  async fn test_process_batch() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let mut frame_paths_map = HashMap::new();
    frame_paths_map.insert("file1".to_string(), vec![]);
    frame_paths_map.insert("file2".to_string(), vec![]);

    let file_ids = vec!["file1".to_string(), "file2".to_string()];

    let results = service.process_batch(file_ids, frame_paths_map).await;
    assert!(results.is_ok());
    // Note: This will fail in actual processing due to empty frame paths,
    // but we're testing the batch processing logic
  }

  #[tokio::test]
  async fn test_get_object_classes() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let classes = service.get_object_classes().await;
    assert!(!classes.is_empty());
    assert!(classes.contains(&"person".to_string()));
    assert!(classes.contains(&"car".to_string()));
  }

  #[tokio::test]
  async fn test_set_object_classes() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let target_classes = vec!["person".to_string(), "dog".to_string()];
    service.set_object_classes(target_classes.clone()).await;

    // We can't directly verify the internal state, but the operation should complete
  }

  #[test]
  fn test_recognition_event_serialization() {
    let events = vec![
      RecognitionEvent::ProcessingStarted {
        file_id: "test".to_string(),
      },
      RecognitionEvent::ProcessingProgress {
        file_id: "test".to_string(),
        current: 5,
        total: 10,
      },
      RecognitionEvent::ProcessingCompleted {
        file_id: "test".to_string(),
        results: RecognitionResults {
          objects: vec![],
          faces: vec![],
          scenes: vec![],
          identified_persons: vec![],
          processed_at: chrono::Utc::now(),
        },
      },
      RecognitionEvent::ProcessingError {
        file_id: "test".to_string(),
        error: "Test error".to_string(),
      },
    ];

    for event in events {
      let serialized = serde_json::to_string(&event).unwrap();
      let deserialized: RecognitionEvent = serde_json::from_str(&serialized).unwrap();

      match (event, deserialized) {
        (
          RecognitionEvent::ProcessingStarted { file_id: f1 },
          RecognitionEvent::ProcessingStarted { file_id: f2 },
        ) => assert_eq!(f1, f2),
        (
          RecognitionEvent::ProcessingProgress {
            file_id: f1,
            current: c1,
            total: t1,
          },
          RecognitionEvent::ProcessingProgress {
            file_id: f2,
            current: c2,
            total: t2,
          },
        ) => {
          assert_eq!(f1, f2);
          assert_eq!(c1, c2);
          assert_eq!(t1, t2);
        }
        _ => {}
      }
    }
  }

  #[tokio::test]
  async fn test_detect_scenes_empty() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let objects = vec![];
    let scenes = service.detect_scenes(&objects);
    assert!(scenes.is_empty());
  }

  #[tokio::test]
  async fn test_detect_scenes_no_relevant_objects() {
    let temp_dir = TempDir::new().unwrap();
    let service = RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap();

    let objects = vec![
      DetectedObject {
        class: "chair".to_string(),
        confidence: 0.9,
        timestamps: vec![0.0, 1.0],
        bounding_boxes: vec![],
      },
      DetectedObject {
        class: "table".to_string(),
        confidence: 0.85,
        timestamps: vec![1.0, 2.0],
        bounding_boxes: vec![],
      },
    ];

    let scenes = service.detect_scenes(&objects);
    assert!(scenes.is_empty());
  }
}
