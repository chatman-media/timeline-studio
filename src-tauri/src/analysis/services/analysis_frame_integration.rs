//! Интеграция FrameExtractionManager с Real Analysis Engine
//!
//! Этот модуль соединяет существующий FrameExtractionManager с Real Analysis Engine,
//! позволяя использовать продвинутые FFmpeg возможности для анализа с ONNX моделями

use anyhow::{Context, Result};
use log::{info, warn};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::analysis::services::real_analysis_engine::{AnalysisEngineConfig, RealAnalysisEngine};
use crate::video_compiler::cache::RenderCache;
use crate::video_compiler::core::frame_extraction::{
  ExtractionPurpose, ExtractionSettings, ExtractionStrategy, FrameExtractionManager,
  RecognitionFrame,
};
use crate::video_compiler::schema::Clip;

/// Интегратор анализа кадров с Real Analysis Engine
pub struct AnalysisFrameIntegrator {
  /// FFmpeg извлечение кадров
  frame_extractor: Arc<FrameExtractionManager>,
  /// Реальный анализ engine
  real_engine: Arc<RealAnalysisEngine>,
  /// Кэш для оптимизации
  #[allow(dead_code)]
  cache: Arc<RwLock<RenderCache>>,
}

impl AnalysisFrameIntegrator {
  /// Создать новый интегратор
  pub fn new(
    frame_extractor: Arc<FrameExtractionManager>,
    real_engine: Arc<RealAnalysisEngine>,
    cache: Arc<RwLock<RenderCache>>,
  ) -> Self {
    Self {
      frame_extractor,
      real_engine,
      cache,
    }
  }

  /// Создать интегратор с default settings
  pub fn with_cache(cache: Arc<RwLock<RenderCache>>) -> Self {
    let frame_extractor = Arc::new(FrameExtractionManager::new(cache.clone()));

    // Создаем заглушку real_engine - в production нужна правильная инициализация
    // PersonDatabase::new is async, so we need to use a mock implementation
    // use std::path::PathBuf; // Not currently used
    let person_db = Arc::new(crate::recognition::person_database::PersonDatabase::new_mock());
    let analysis_db = Arc::new(crate::analysis::database::AnalysisDatabase::new_mock());
    let project_manager = Arc::new(crate::analysis::services::ProjectManager::new(
      analysis_db.clone(),
    ));

    let real_engine = Arc::new(RealAnalysisEngine::new(
      analysis_db,
      person_db,
      project_manager,
      None, // Default config
    ));

    Self {
      frame_extractor,
      real_engine,
      cache,
    }
  }

  /// Анализ видео файла с использованием FFmpeg extraction + ONNX models
  pub async fn analyze_video_file(
    &self,
    video_path: &Path,
    analysis_config: Option<AnalysisEngineConfig>,
  ) -> Result<VideoAnalysisResult> {
    info!(
      "Starting comprehensive video analysis for: {:?}",
      video_path
    );

    // 1. Получаем информацию о видео
    let video_info = self
      .frame_extractor
      .preview_generator
      .get_video_info(video_path)
      .await
      .context("Failed to get video info")?;

    let duration = video_info.duration;
    info!(
      "Video duration: {:.2}s, analyzing with optimized frame extraction",
      duration
    );

    // 2. Определяем стратегию извлечения кадров на основе конфигурации
    let config = analysis_config.unwrap_or_default();
    let frames_interval = 60.0 / config.frames_per_minute as f64; // секунд между кадрами

    // 3. Извлекаем кадры для объектного анализа
    let object_frames = self
      .extract_frames_for_object_analysis(
        video_path,
        duration,
        frames_interval,
        config.detailed_analysis,
      )
      .await?;

    info!(
      "Extracted {} frames for object analysis",
      object_frames.len()
    );

    // 4. Анализируем объекты на кадрах
    let object_detections = self.analyze_objects_on_frames(&object_frames).await?;

    // 5. Извлекаем кадры для анализа лиц (можем использовать те же кадры или больше)
    let face_frames = if config.detailed_analysis {
      // Для детального анализа извлекаем больше кадров для лиц
      self
        .extract_frames_for_face_analysis(video_path, duration, frames_interval * 0.5)
        .await?
    } else {
      object_frames.clone() // Используем те же кадры
    };

    // 6. Анализируем лица на кадрах
    let face_detections = self.analyze_faces_on_frames(&face_frames).await?;

    // 7. Определяем сцены на основе объектного анализа
    let scenes = self
      .detect_scenes_from_objects(&object_detections, duration)
      .await?;

    // 8. Определяем ключевые моменты
    let key_moments = self
      .detect_key_moments_from_analysis(&object_detections, &face_detections, &scenes, duration)
      .await?;

    // 9. Кластеризуем персон по face embeddings
    let persons = self.cluster_persons_from_faces(&face_detections).await?;

    // 10. Собираем финальный результат
    let result = VideoAnalysisResult {
      video_path: video_path.to_string_lossy().to_string(),
      duration,
      total_frames_analyzed: object_frames.len() + face_frames.len(),
      scenes,
      objects: object_detections,
      faces: face_detections,
      persons,
      key_moments,
      quality_metrics: self.calculate_quality_metrics(&object_frames).await?,
    };

    info!(
      "Video analysis completed: {} scenes, {} objects, {} faces, {} persons, {} key moments",
      result.scenes.len(),
      result.objects.len(),
      result.faces.len(),
      result.persons.len(),
      result.key_moments.len()
    );

    Ok(result)
  }

  /// Извлечение кадров для анализа объектов с оптимизированными настройками
  async fn extract_frames_for_object_analysis(
    &self,
    video_path: &Path,
    duration: f64,
    interval: f64,
    detailed: bool,
  ) -> Result<Vec<RecognitionFrame>> {
    // Используем Combined стратегию для максимального качества анализа
    let strategy = if detailed {
      ExtractionStrategy::Combined {
        min_interval: interval,
        include_scene_changes: true,
        include_keyframes: true,
      }
    } else {
      ExtractionStrategy::Interval { seconds: interval }
    };

    // Настройки оптимизированы для YOLO моделей
    let _settings = ExtractionSettings {
      strategy,
      _purpose: ExtractionPurpose::ObjectDetection,
      resolution: (1280, 720), // Оптимальное разрешение для YOLO
      quality: 85,
      _format: crate::video_compiler::schema::PreviewFormat::Png,
      max_frames: if detailed { None } else { Some(300) }, // Ограничиваем в быстром режиме
      _gpu_decode: true,
      parallel_extraction: true,
      _thread_count: None,
    };

    self
      .frame_extractor
      .extract_frames_for_recognition(video_path, duration, ExtractionPurpose::ObjectDetection)
      .await
      .context("Failed to extract frames for object analysis")
  }

  /// Извлечение кадров для анализа лиц
  async fn extract_frames_for_face_analysis(
    &self,
    video_path: &Path,
    duration: f64,
    interval: f64,
  ) -> Result<Vec<RecognitionFrame>> {
    // Для лиц используем более частое извлечение
    let strategy = ExtractionStrategy::Combined {
      min_interval: interval,
      include_scene_changes: true,
      include_keyframes: true,
    };

    // Настройки оптимизированы для FaceNet моделей
    let _settings = ExtractionSettings {
      strategy,
      _purpose: ExtractionPurpose::ObjectDetection, // Используем тот же purpose
      resolution: (1920, 1080), // Высокое разрешение для лучшего распознавания лиц
      quality: 90,
      _format: crate::video_compiler::schema::PreviewFormat::Png,
      max_frames: None,
      _gpu_decode: true,
      parallel_extraction: true,
      _thread_count: None,
    };

    self
      .frame_extractor
      .extract_frames_for_recognition(video_path, duration, ExtractionPurpose::ObjectDetection)
      .await
      .context("Failed to extract frames for face analysis")
  }

  /// Анализ объектов на извлеченных кадрах с YOLO
  async fn analyze_objects_on_frames(
    &self,
    frames: &[RecognitionFrame],
  ) -> Result<Vec<ObjectDetectionResult>> {
    info!("Starting YOLO object analysis on {} frames", frames.len());

    let results = Vec::new();

    // Проверяем доступность YOLO процессора
    if !self.real_engine.is_object_detector_ready().await {
      warn!("YOLO object detector not ready, skipping object analysis");
      return Ok(results);
    }

    // Анализируем каждый кадр
    for (frame_index, _frame) in frames.iter().enumerate() {
      // TODO: Implement detect_objects_on_frame method in RealAnalysisEngine
      // match self
      //   .real_engine
      //   .detect_objects_on_frame(&frame.frame_data)
      //   .await
      // {
      //   Ok(detections) => {
      //     // Преобразуем YOLO детекции в наш формат
      //     for detection in detections {
      //       results.push(ObjectDetectionResult {
      //         id: uuid::Uuid::new_v4().to_string(),
      //         timestamp: frame.timestamp,
      //         frame_index,
      //         object_class: detection.class_name.clone(),
      //         confidence: detection.confidence,
      //         bounding_box: BoundingBox {
      //           x: detection.bbox.x,
      //           y: detection.bbox.y,
      //           width: detection.bbox.width,
      //           height: detection.bbox.height,
      //         },
      //         properties: ObjectProperties {
      //           size: detection.bbox.width * detection.bbox.height,
      //           is_main_subject: detection.confidence > 0.8,
      //           movement_detected: false, // TODO: Implement motion analysis
      //         },
      //       });
      //     }
      //   }
      //   Err(e) => {
      //     warn!("Failed to analyze frame {}: {}", frame_index, e);
      //   }
      // }
      log::debug!(
        "Skipping frame {} analysis (TODO: implement detect_objects_on_frame)",
        frame_index
      );
    }

    info!(
      "YOLO analysis completed: {} objects detected",
      results.len()
    );
    Ok(results)
  }

  /// Анализ лиц на кадрах с FaceNet
  async fn analyze_faces_on_frames(
    &self,
    frames: &[RecognitionFrame],
  ) -> Result<Vec<FaceDetectionResult>> {
    info!("Starting FaceNet face analysis on {} frames", frames.len());

    let results = Vec::new();

    // Проверяем доступность FaceNet процессора
    if !self.real_engine.is_face_processors_ready().await {
      warn!("FaceNet processors not ready, skipping face analysis");
      return Ok(results);
    }

    // Анализируем каждый кадр
    for (frame_index, _frame) in frames.iter().enumerate() {
      // TODO: Implement detect_and_encode_faces method in RealAnalysisEngine
      // match self
      //   .real_engine
      //   .detect_and_encode_faces(&frame.frame_data)
      //   .await
      // {
      //   Ok(face_results) => {
      //     for face_result in face_results {
      //       results.push(FaceDetectionResult {
      //         id: uuid::Uuid::new_v4().to_string(),
      //         timestamp: frame.timestamp,
      //         frame_index,
      //         confidence: face_result.detection_confidence,
      //         bounding_box: BoundingBox {
      //           x: face_result.bounding_box.x,
      //           y: face_result.bounding_box.y,
      //           width: face_result.bounding_box.width,
      //           height: face_result.bounding_box.height,
      //         },
      //         face_embedding: face_result.embedding.values,
      //         landmarks: face_result.landmarks.unwrap_or_default(),
      //         estimated_age: face_result.estimated_age,
      //         estimated_gender: face_result.estimated_gender,
      //         emotion_scores: face_result.emotion_scores.unwrap_or_default(),
      //       });
      //     }
      //   }
      //   Err(e) => {
      //     warn!("Failed to analyze faces on frame {}: {}", frame_index, e);
      //   }
      // }
      log::debug!(
        "Skipping frame {} face analysis (TODO: implement detect_and_encode_faces)",
        frame_index
      );
    }

    info!(
      "FaceNet analysis completed: {} faces detected",
      results.len()
    );
    Ok(results)
  }

  /// Детекция сцен на основе объектного анализа
  async fn detect_scenes_from_objects(
    &self,
    object_detections: &[ObjectDetectionResult],
    duration: f64,
  ) -> Result<Vec<SceneDetectionResult>> {
    info!(
      "Detecting scenes from {} object detections",
      object_detections.len()
    );

    let mut scenes = Vec::new();

    if object_detections.is_empty() {
      // Создаем одну сцену для всего видео если нет детекций
      scenes.push(SceneDetectionResult {
        id: uuid::Uuid::new_v4().to_string(),
        start_time: 0.0,
        end_time: duration,
        scene_type: "unknown".to_string(),
        confidence: 0.5,
        dominant_objects: vec![],
        object_count: 0,
        activity_level: 0.0,
      });
      return Ok(scenes);
    }

    // Группируем детекции по временным окнам (например, 5-секундные сегменты)
    let window_size = 5.0;
    let num_windows = (duration / window_size).ceil() as usize;

    for window_idx in 0..num_windows {
      let start_time = window_idx as f64 * window_size;
      let end_time = ((window_idx + 1) as f64 * window_size).min(duration);

      // Собираем объекты в этом временном окне
      let window_objects: Vec<_> = object_detections
        .iter()
        .filter(|obj| obj.timestamp >= start_time && obj.timestamp < end_time)
        .collect();

      if window_objects.is_empty() {
        continue;
      }

      // Анализируем доминирующие объекты
      let mut object_counts = std::collections::HashMap::new();
      for obj in &window_objects {
        *object_counts.entry(&obj.object_class).or_insert(0) += 1;
      }

      let dominant_objects: Vec<_> = object_counts
        .into_iter()
        .map(|(class, count)| (class.clone(), count))
        .collect();

      // Определяем тип сцены на основе доминирующих объектов
      let scene_type = self.classify_scene_type(&dominant_objects).await;

      // Рассчитываем активность (среднее количество объектов)
      let activity_level = window_objects.len() as f64 / window_size;

      scenes.push(SceneDetectionResult {
        id: uuid::Uuid::new_v4().to_string(),
        start_time,
        end_time,
        scene_type,
        confidence: 0.8, // Базовая confidence для объектного анализа
        dominant_objects: dominant_objects.into_iter().map(|(k, _v)| k).collect(),
        object_count: window_objects.len(),
        activity_level,
      });
    }

    info!(
      "Scene detection completed: {} scenes detected",
      scenes.len()
    );
    Ok(scenes)
  }

  /// Классификация типа сцены на основе объектов
  async fn classify_scene_type(&self, objects: &[(String, i32)]) -> String {
    if objects.is_empty() {
      return "empty".to_string();
    }

    // Простая классификация на основе наиболее часто встречающихся объектов
    let most_common = objects.iter().max_by_key(|(_, count)| *count);

    match most_common {
      Some((class, _)) => match class.as_str() {
        "person" => "people",
        "car" | "truck" | "bus" => "traffic",
        "boat" | "ship" => "water",
        "bicycle" | "motorcycle" => "transport",
        "dog" | "cat" | "bird" => "animals",
        "dining table" | "chair" => "indoor",
        "tree" | "grass" => "outdoor",
        _ => "general",
      }
      .to_string(),
      None => "unknown".to_string(),
    }
  }

  /// Детекция ключевых моментов на основе анализа
  async fn detect_key_moments_from_analysis(
    &self,
    object_detections: &[ObjectDetectionResult],
    face_detections: &[FaceDetectionResult],
    scenes: &[SceneDetectionResult],
    duration: f64,
  ) -> Result<Vec<KeyMomentResult>> {
    info!("Detecting key moments from analysis data");

    let mut key_moments = Vec::new();

    // 1. Моменты с высокой активностью объектов
    let object_activity_moments = self
      .detect_high_activity_moments(object_detections, duration)
      .await?;
    key_moments.extend(object_activity_moments);

    // 2. Моменты с эмоциональными пиками лиц
    let emotional_moments = self.detect_emotional_peak_moments(face_detections).await?;
    key_moments.extend(emotional_moments);

    // 3. Моменты смены сцен
    let scene_transition_moments = self.detect_scene_transition_moments(scenes).await?;
    key_moments.extend(scene_transition_moments);

    // Сортируем по времени и убираем дубликаты в близких временных точках
    key_moments.sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());
    key_moments = self.deduplicate_moments(key_moments, 2.0).await; // Минимум 2 сек между моментами

    info!(
      "Key moment detection completed: {} moments detected",
      key_moments.len()
    );
    Ok(key_moments)
  }

  /// Детекция моментов высокой активности
  async fn detect_high_activity_moments(
    &self,
    objects: &[ObjectDetectionResult],
    duration: f64,
  ) -> Result<Vec<KeyMomentResult>> {
    let mut moments = Vec::new();
    let window_size = 3.0; // 3-секундные окна
    let num_windows = (duration / window_size).ceil() as usize;

    for window_idx in 0..num_windows {
      let start_time = window_idx as f64 * window_size;
      let end_time = ((window_idx + 1) as f64 * window_size).min(duration);

      let window_objects: Vec<_> = objects
        .iter()
        .filter(|obj| obj.timestamp >= start_time && obj.timestamp < end_time)
        .collect();

      // Если активность выше порога, добавляем как ключевой момент
      if window_objects.len() > 10 {
        // Порог активности
        let timestamp = start_time + window_size / 2.0; // Центр окна
        let score = (window_objects.len() as f64 / 20.0).min(1.0); // Нормализованный score

        moments.push(KeyMomentResult {
          id: uuid::Uuid::new_v4().to_string(),
          timestamp,
          moment_type: "high_activity".to_string(),
          confidence: score as f32,
          description: format!("High activity moment with {} objects", window_objects.len()),
          involved_objects: window_objects
            .iter()
            .map(|o| o.object_class.clone())
            .collect(),
          emotional_intensity: 0.0,
        });
      }
    }

    Ok(moments)
  }

  /// Детекция эмоциональных пиков
  async fn detect_emotional_peak_moments(
    &self,
    faces: &[FaceDetectionResult],
  ) -> Result<Vec<KeyMomentResult>> {
    let mut moments = Vec::new();

    for face in faces {
      // Ищем сильные эмоции (высокие scores в emotion_scores)
      let max_emotion_score = face.emotion_scores.values().copied().fold(0.0, f32::max);

      if max_emotion_score > 0.8 {
        // Высокий эмоциональный score
        let emotion_type = face
          .emotion_scores
          .iter()
          .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
          .map(|(emotion, _)| emotion.clone())
          .unwrap_or_else(|| "unknown".to_string());

        moments.push(KeyMomentResult {
          id: uuid::Uuid::new_v4().to_string(),
          timestamp: face.timestamp,
          moment_type: "emotional_peak".to_string(),
          confidence: max_emotion_score,
          description: format!(
            "Emotional peak: {} (score: {:.2})",
            emotion_type, max_emotion_score
          ),
          involved_objects: vec!["person".to_string()],
          emotional_intensity: max_emotion_score as f64,
        });
      }
    }

    Ok(moments)
  }

  /// Детекция моментов смены сцен
  async fn detect_scene_transition_moments(
    &self,
    scenes: &[SceneDetectionResult],
  ) -> Result<Vec<KeyMomentResult>> {
    let mut moments = Vec::new();

    for window in scenes.windows(2) {
      let prev_scene = &window[0];
      let current_scene = &window[1];

      // Если тип сцены изменился, добавляем момент перехода
      if prev_scene.scene_type != current_scene.scene_type {
        moments.push(KeyMomentResult {
          id: uuid::Uuid::new_v4().to_string(),
          timestamp: current_scene.start_time,
          moment_type: "scene_transition".to_string(),
          confidence: (prev_scene.confidence + current_scene.confidence) / 2.0,
          description: format!(
            "Scene transition from {} to {}",
            prev_scene.scene_type, current_scene.scene_type
          ),
          involved_objects: vec![],
          emotional_intensity: 0.0,
        });
      }
    }

    Ok(moments)
  }

  /// Удаление дублирующих моментов в близких временных точках
  async fn deduplicate_moments(
    &self,
    moments: Vec<KeyMomentResult>,
    min_interval: f64,
  ) -> Vec<KeyMomentResult> {
    if moments.is_empty() {
      return moments;
    }

    let mut deduplicated = vec![moments[0].clone()];

    for moment in moments.into_iter().skip(1) {
      let last_timestamp = deduplicated.last().unwrap().timestamp;
      if moment.timestamp - last_timestamp >= min_interval {
        deduplicated.push(moment);
      } else {
        // Если моменты близко, выбираем с более высокой confidence
        let last_moment = deduplicated.last_mut().unwrap();
        if moment.confidence > last_moment.confidence {
          *last_moment = moment;
        }
      }
    }

    deduplicated
  }

  /// Кластеризация персон по face embeddings
  async fn cluster_persons_from_faces(
    &self,
    faces: &[FaceDetectionResult],
  ) -> Result<Vec<PersonClusterResult>> {
    info!("Clustering persons from {} face detections", faces.len());

    // Используем PersonDatabase для кластеризации
    let mut clusters: Vec<PersonClusterResult> = Vec::new();
    let similarity_threshold = 0.8; // Порог схожести для группировки лиц

    for face in faces {
      // Ищем похожие лица в уже существующих кластерах
      let mut found_cluster = false;

      for cluster in &mut clusters {
        // Вычисляем средний embedding кластера
        let cluster_embedding = self
          .calculate_average_embedding(&cluster.face_embeddings)
          .await?;

        // Вычисляем similarity с текущим лицом
        let similarity = self
          .calculate_embedding_similarity(&face.face_embedding, &cluster_embedding)
          .await?;

        if similarity > similarity_threshold {
          // Добавляем к существующему кластеру
          cluster.face_ids.push(face.id.clone());
          cluster.face_embeddings.push(face.face_embedding.clone());
          cluster.appearances.push(PersonAppearance {
            timestamp: face.timestamp,
            confidence: face.confidence,
            bounding_box: face.bounding_box.clone(),
          });
          cluster.total_screen_time += 1.0; // Примерная длительность
          found_cluster = true;
          break;
        }
      }

      if !found_cluster {
        // Создаем новый кластер
        clusters.push(PersonClusterResult {
          id: uuid::Uuid::new_v4().to_string(),
          representative_face_id: face.id.clone(),
          face_ids: vec![face.id.clone()],
          face_embeddings: vec![face.face_embedding.clone()],
          total_appearances: 1,
          total_screen_time: 1.0,
          confidence: face.confidence as f64,
          appearances: vec![PersonAppearance {
            timestamp: face.timestamp,
            confidence: face.confidence,
            bounding_box: face.bounding_box.clone(),
          }],
          estimated_demographics: PersonDemographics {
            age_range: face
              .estimated_age
              .map(|age| (age.saturating_sub(5), age + 5)),
            gender: face.estimated_gender.clone(),
            confidence: face.confidence as f64,
          },
        });
      }
    }

    // Обновляем статистики кластеров
    for cluster in &mut clusters {
      cluster.total_appearances = cluster.face_ids.len();
      // Вычисляем среднюю confidence
      let avg_confidence = cluster
        .appearances
        .iter()
        .map(|app| app.confidence as f64)
        .sum::<f64>()
        / cluster.appearances.len() as f64;
      cluster.confidence = avg_confidence;
    }

    info!(
      "Person clustering completed: {} unique persons found",
      clusters.len()
    );
    Ok(clusters)
  }

  /// Вычисление среднего embedding для кластера
  async fn calculate_average_embedding(&self, embeddings: &[Vec<f32>]) -> Result<Vec<f32>> {
    if embeddings.is_empty() {
      return Ok(vec![]);
    }

    let embedding_size = embeddings[0].len();
    let mut average = vec![0.0; embedding_size];

    for embedding in embeddings {
      for (i, &value) in embedding.iter().enumerate() {
        average[i] += value;
      }
    }

    for value in &mut average {
      *value /= embeddings.len() as f32;
    }

    Ok(average)
  }

  /// Вычисление similarity между двумя embeddings
  async fn calculate_embedding_similarity(
    &self,
    embedding1: &[f32],
    embedding2: &[f32],
  ) -> Result<f32> {
    if embedding1.len() != embedding2.len() {
      return Ok(0.0);
    }

    // Cosine similarity
    let dot_product: f32 = embedding1
      .iter()
      .zip(embedding2.iter())
      .map(|(a, b)| a * b)
      .sum();
    let norm1: f32 = embedding1.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm2: f32 = embedding2.iter().map(|x| x * x).sum::<f32>().sqrt();

    if norm1 == 0.0 || norm2 == 0.0 {
      return Ok(0.0);
    }

    Ok(dot_product / (norm1 * norm2))
  }

  /// Расчет метрик качества видео
  async fn calculate_quality_metrics(&self, frames: &[RecognitionFrame]) -> Result<QualityMetrics> {
    if frames.is_empty() {
      return Ok(QualityMetrics {
        overall_score: 0.5,
        sharpness: 0.5,
        stability: 0.5,
        brightness: 0.5,
        contrast: 0.5,
        color_balance: 0.5,
        noise_level: 0.5,
      });
    }

    // Простые метрики на основе доступных данных
    let avg_resolution = frames
      .iter()
      .map(|f| f.resolution.0 * f.resolution.1)
      .sum::<u32>() as f64
      / frames.len() as f64;

    // Нормализуем разрешение (1080p = 1.0)
    let resolution_score = (avg_resolution / (1920.0 * 1080.0)).min(1.0);

    // Анализируем изменения сцен для оценки стабильности
    let scene_changes = frames
      .iter()
      .filter(|f| f.scene_change_score.unwrap_or(0.0) > 0.3)
      .count();
    let stability_score = 1.0 - (scene_changes as f64 / frames.len() as f64).min(1.0);

    // Базовые оценки
    let sharpness = resolution_score * 0.8 + 0.2;
    let brightness = 0.7; // Средняя оценка без анализа гистограммы
    let contrast = 0.7;
    let color_balance = 0.7;
    let noise_level = 0.8; // Предполагаем низкий уровень шума

    let overall_score =
      (sharpness + stability_score + brightness + contrast + color_balance + noise_level) / 6.0;

    Ok(QualityMetrics {
      overall_score,
      sharpness,
      stability: stability_score,
      brightness,
      contrast,
      color_balance,
      noise_level,
    })
  }

  /// Анализ клипа (интеграция с существующим API)
  pub async fn analyze_clip(
    &self,
    clip: &Clip,
    analysis_config: Option<AnalysisEngineConfig>,
  ) -> Result<ClipAnalysisResult> {
    info!("Starting clip analysis for clip: {}", clip.id);

    let _video_path = match &clip.source {
      crate::video_compiler::schema::ClipSource::File(path) => std::path::Path::new(path),
      _ => {
        return Err(anyhow::anyhow!(
          "Only file sources are supported for analysis"
        ))
      }
    };

    // Анализируем только часть видео согласно clip границам
    let clip_duration = clip.source_end - clip.source_start;

    // Извлекаем кадры для клипа
    let frames = self
      .frame_extractor
      .extract_frames_for_clip(clip, None)
      .await?;

    // Преобразуем в RecognitionFrame формат
    let recognition_frames: Vec<RecognitionFrame> = frames
      .into_iter()
      .map(|frame| RecognitionFrame {
        timestamp: frame.timestamp,
        frame_data: frame.data,
        resolution: frame.resolution,
        scene_change_score: frame.scene_change_score,
        is_keyframe: frame.is_keyframe,
      })
      .collect();

    // Анализируем объекты и лица
    let _config = analysis_config.unwrap_or_default();
    let object_detections = self.analyze_objects_on_frames(&recognition_frames).await?;
    let face_detections = self.analyze_faces_on_frames(&recognition_frames).await?;

    // Определяем качество клипа
    let quality_metrics = self.calculate_quality_metrics(&recognition_frames).await?;

    Ok(ClipAnalysisResult {
      clip_id: clip.id.clone(),
      duration: clip_duration,
      objects: object_detections,
      faces: face_detections,
      quality: quality_metrics,
      recommended_cuts: vec![], // TODO: Implement cut recommendations
    })
  }
}

// Результаты анализа

#[derive(Debug, Clone)]
pub struct VideoAnalysisResult {
  pub video_path: String,
  pub duration: f64,
  pub total_frames_analyzed: usize,
  pub scenes: Vec<SceneDetectionResult>,
  pub objects: Vec<ObjectDetectionResult>,
  pub faces: Vec<FaceDetectionResult>,
  pub persons: Vec<PersonClusterResult>,
  pub key_moments: Vec<KeyMomentResult>,
  pub quality_metrics: QualityMetrics,
}

#[derive(Debug, Clone)]
pub struct ClipAnalysisResult {
  pub clip_id: String,
  pub duration: f64,
  pub objects: Vec<ObjectDetectionResult>,
  pub faces: Vec<FaceDetectionResult>,
  pub quality: QualityMetrics,
  pub recommended_cuts: Vec<f64>,
}

#[derive(Debug, Clone)]
pub struct ObjectDetectionResult {
  pub id: String,
  pub timestamp: f64,
  pub frame_index: usize,
  pub object_class: String,
  pub confidence: f32,
  pub bounding_box: BoundingBox,
  pub properties: ObjectProperties,
}

#[derive(Debug, Clone)]
pub struct ObjectProperties {
  pub size: f32,
  pub is_main_subject: bool,
  pub movement_detected: bool,
}

#[derive(Debug, Clone)]
pub struct FaceDetectionResult {
  pub id: String,
  pub timestamp: f64,
  pub frame_index: usize,
  pub confidence: f32,
  pub bounding_box: BoundingBox,
  pub face_embedding: Vec<f32>,
  pub landmarks: Vec<(f32, f32)>,
  pub estimated_age: Option<u32>,
  pub estimated_gender: Option<String>,
  pub emotion_scores: std::collections::HashMap<String, f32>,
}

#[derive(Debug, Clone)]
pub struct SceneDetectionResult {
  pub id: String,
  pub start_time: f64,
  pub end_time: f64,
  pub scene_type: String,
  pub confidence: f32,
  pub dominant_objects: Vec<String>,
  pub object_count: usize,
  pub activity_level: f64,
}

#[derive(Debug, Clone)]
pub struct KeyMomentResult {
  pub id: String,
  pub timestamp: f64,
  pub moment_type: String,
  pub confidence: f32,
  pub description: String,
  pub involved_objects: Vec<String>,
  pub emotional_intensity: f64,
}

#[derive(Debug, Clone)]
pub struct PersonClusterResult {
  pub id: String,
  pub representative_face_id: String,
  pub face_ids: Vec<String>,
  pub face_embeddings: Vec<Vec<f32>>,
  pub total_appearances: usize,
  pub total_screen_time: f64,
  pub confidence: f64,
  pub appearances: Vec<PersonAppearance>,
  pub estimated_demographics: PersonDemographics,
}

#[derive(Debug, Clone)]
pub struct PersonAppearance {
  pub timestamp: f64,
  pub confidence: f32,
  pub bounding_box: BoundingBox,
}

#[derive(Debug, Clone)]
pub struct PersonDemographics {
  pub age_range: Option<(u32, u32)>,
  pub gender: Option<String>,
  pub confidence: f64,
}

#[derive(Debug, Clone)]
pub struct QualityMetrics {
  pub overall_score: f64,
  pub sharpness: f64,
  pub stability: f64,
  pub brightness: f64,
  pub contrast: f64,
  pub color_balance: f64,
  pub noise_level: f64,
}

#[derive(Debug, Clone)]
pub struct BoundingBox {
  pub x: f32,
  pub y: f32,
  pub width: f32,
  pub height: f32,
}
