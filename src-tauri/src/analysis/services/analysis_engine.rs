// Analysis engine - основной движок анализа интегрированный с существующими сервисами

use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::analysis::database::AnalysisDatabase;
use crate::analysis::models::*;
use crate::analysis::services::unified_audio_analyzer::UnifiedAudioAnalyzer;
use crate::analysis::services::ProjectManager;
use crate::montage_planner::services::*;
use crate::montage_planner::types::*;
use crate::recognition::commands::yolo_commands::YoloProcessorState;
use crate::recognition::person_database::PersonDatabase;
use crate::recognition::types_professional::Emotion;
use crate::state::project_state::MediaType;
// use crate::recognition::frame_processor::YoloDetection; // Временно отключено

/// Convert EmotionalTone to Emotion
fn convert_emotional_tone_to_emotion(tone: &EmotionalTone) -> Emotion {
  match tone {
    EmotionalTone::Neutral => Emotion::Neutral,
    EmotionalTone::Happy => Emotion::Happy,
    EmotionalTone::Sad => Emotion::Sad,
    EmotionalTone::Angry => Emotion::Angry,
    EmotionalTone::Surprised => Emotion::Surprised,
    EmotionalTone::Fear => Emotion::Fearful,
    EmotionalTone::Disgust => Emotion::Disgusted,
    EmotionalTone::Excited => Emotion::Happy, // Closest match
    EmotionalTone::Calm => Emotion::Neutral,
    EmotionalTone::Tense => Emotion::Angry, // Closest match
  }
}

// Missing structs for compilation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PersonMetadata {
  pub created_at: String,
  pub updated_at: String,
  pub source: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ConfidenceScores {
  pub detection: f32,
  pub identification: f32,
  pub overall: f32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct QualityMetrics {
  pub face_quality: f32,
  pub lighting_quality: f32,
  pub resolution_quality: f32,
  pub overall_quality: f32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PersonSettings {
  pub auto_clustering: bool,
  pub similarity_threshold: f32,
  pub quality_threshold: f32,
}

/// Движок анализа - координирует все модули анализа
pub struct AnalysisEngine {
  // Database интеграция
  analysis_db: Arc<AnalysisDatabase>,
  person_db: Arc<PersonDatabase>,
  project_manager: Arc<ProjectManager>,

  // Существующие сервисы из Montage Planner
  video_processor: Arc<RwLock<VideoProcessor>>,
  unified_audio_analyzer: Arc<UnifiedAudioAnalyzer>,
  moment_detector: Arc<RwLock<MomentDetector>>,
  #[allow(dead_code)]
  quality_analyzer: Arc<RwLock<VideoQualityAnalyzer>>,
  emotion_detector: Arc<RwLock<EmotionDetector>>,
  composition_analyzer: Arc<RwLock<CompositionAnalyzer>>,
  activity_calculator: Arc<RwLock<ActivityCalculator>>,
}

impl AnalysisEngine {
  /// Создание нового движка анализа с интеграцией существующих сервисов
  pub fn new(
    analysis_db: Arc<AnalysisDatabase>,
    person_db: Arc<PersonDatabase>,
    project_manager: Arc<ProjectManager>,
    yolo_state: Arc<RwLock<YoloProcessorState>>,
  ) -> Self {
    Self {
      analysis_db,
      person_db,
      project_manager,

      // Инициализируем существующие сервисы
      video_processor: Arc::new(RwLock::new(VideoProcessor::new(yolo_state))),
      unified_audio_analyzer: Arc::new(UnifiedAudioAnalyzer::new()),
      moment_detector: Arc::new(RwLock::new(MomentDetector::new())),
      quality_analyzer: Arc::new(RwLock::new(VideoQualityAnalyzer::new())),
      emotion_detector: Arc::new(RwLock::new(EmotionDetector::new())),
      composition_analyzer: Arc::new(RwLock::new(CompositionAnalyzer::new())),
      activity_calculator: Arc::new(RwLock::new(ActivityCalculator::new())),
    }
  }

  /// Полный анализ проекта с интеграцией всех сервисов
  pub async fn analyze_project(&self, project_id: &Uuid) -> Result<AnalysisProjectResults> {
    log::info!("Starting comprehensive project analysis: {}", project_id);

    // Получаем проект и его файлы
    let _project = self
      .project_manager
      .get_project(project_id)
      .await?
      .ok_or_else(|| anyhow::anyhow!("Project not found: {}", project_id))?;

    let files = self.project_manager.get_project_files(project_id).await?;

    if files.is_empty() {
      return Err(anyhow::anyhow!("No media files found in project"));
    }

    // Обновляем прогресс: начало анализа
    self
      .project_manager
      .update_progress(
        project_id,
        AnalysisStage::MediaAnalysis,
        0.1,
        Some("Starting media analysis".to_string()),
      )
      .await?;

    let mut all_scenes = Vec::new();
    let mut all_moments = Vec::new();
    let mut project_persons = Vec::new();

    let total_files = files.len();

    // Анализируем каждый файл
    for (index, file) in files.iter().enumerate() {
      let progress = 0.1 + (index as f32 / total_files as f32) * 0.7;

      self
        .project_manager
        .update_progress(
          project_id,
          AnalysisStage::MediaAnalysis,
          progress,
          Some(format!("Analyzing file: {}", file.file_name)),
        )
        .await?;

      // Анализируем файл в зависимости от типа
      match file.media_type {
        MediaType::Video => {
          let video_results = self.analyze_video_file(project_id, file).await?;
          all_scenes.extend(video_results.scenes);
          all_moments.extend(video_results.moments);
          project_persons.extend(video_results.persons);
        }
        MediaType::Audio => {
          let audio_results = self.analyze_audio_file(project_id, file).await?;
          all_moments.extend(audio_results.moments);
        }
        MediaType::Image => {
          let image_results = self.analyze_image_file(project_id, file).await?;
          all_scenes.extend(image_results.scenes);
          project_persons.extend(image_results.persons);
        }
      }
    }

    // Обновляем прогресс: детекция ключевых моментов
    self
      .project_manager
      .update_progress(
        project_id,
        AnalysisStage::KeyMomentDetection,
        0.8,
        Some("Detecting key moments".to_string()),
      )
      .await?;

    // Расширенная детекция ключевых моментов на основе всех сцен
    let enhanced_moments = self
      .detect_cross_file_moments(&all_scenes, &all_moments)
      .await?;
    all_moments.extend(enhanced_moments);

    // Обновляем прогресс: агрегация данных
    self
      .project_manager
      .update_progress(
        project_id,
        AnalysisStage::DataAggregation,
        0.9,
        Some("Aggregating analysis data".to_string()),
      )
      .await?;

    // Создаем связи персон с проектом
    self
      .create_project_person_associations(project_id, &project_persons)
      .await?;

    // Завершаем анализ
    self
      .project_manager
      .update_progress(
        project_id,
        AnalysisStage::Finalization,
        1.0,
        Some("Analysis completed".to_string()),
      )
      .await?;

    self.project_manager.complete_project(project_id).await?;

    log::info!(
      "Project analysis completed: {} scenes, {} moments, {} persons",
      all_scenes.len(),
      all_moments.len(),
      project_persons.len()
    );

    Ok(AnalysisProjectResults {
      project_id: *project_id,
      total_scenes: all_scenes.len() as u32,
      total_moments: all_moments.len() as u32,
      total_persons: project_persons.len() as u32,
      scenes: all_scenes,
      moments: all_moments,
      persons: project_persons,
    })
  }

  /// Анализ видеофайла с интеграцией всех сервисов
  async fn analyze_video_file(
    &self,
    project_id: &Uuid,
    file: &AnalysisMediaFile,
  ) -> Result<VideoAnalysisResults> {
    log::debug!("Analyzing video file: {}", file.file_path);

    // 1. Анализ видео через VideoProcessor
    let video_processor = self.video_processor.read().await;
    let metadata = video_processor.extract_metadata(&file.file_path).await?;

    let analysis_options = AnalysisOptions {
      enable_object_detection: true,
      enable_face_detection: true,
      enable_emotion_analysis: true,
      enable_composition_analysis: true,
      enable_audio_analysis: true,
      frame_sample_rate: 1.0, // Анализируем каждую секунду
      quality_threshold: 50.0,
      max_moments: Some(50),
      frame_sampling_rate: 1.0,
    };

    let yolo_detections = video_processor
      .analyze_video(&file.file_path, &analysis_options)
      .await?;
    drop(video_processor);

    // 2. Композиционный анализ
    let composition_analyzer = self.composition_analyzer.read().await;
    let mut enhanced_detections = Vec::new();

    for (timestamp, detections) in yolo_detections {
      if let Ok(enhanced) = composition_analyzer.analyze_composition(
        &detections,
        timestamp,
        metadata.width as f32,
        metadata.height as f32,
      ) {
        enhanced_detections.push((timestamp, enhanced));
      }
    }
    drop(composition_analyzer);

    // 3. Детекция сцен на основе композиционного анализа
    let scenes = self
      .detect_scenes_from_detections(project_id, file, &enhanced_detections)
      .await?;

    // 4. Анализ эмоций и активности
    let mut emotion_detector = self.emotion_detector.write().await;
    let mut activity_calculator = self.activity_calculator.write().await;

    let mut emotional_scenes = Vec::new();
    for scene in &scenes {
      // Анализ эмоций для сцены
      // Create a mock detection for emotion analysis
      let mock_detection = MontageDetection {
        timestamp: scene.start_time as f64,
        detection_type: DetectionType::Combined,
        objects: vec![],
        faces: vec![],
        composition_score: CompositionScore {
          rule_of_thirds: 50.0,
          balance: 50.0,
          focus_clarity: 50.0,
          depth_of_field: 50.0,
          leading_lines: 50.0,
          symmetry: 50.0,
          overall_score: 50.0,
          activity_score: 50.0,
          face_count: 0,
          face_prominence: 0.0,
          scene_depth: 50.0,
          confidence: 50.0,
          brightness: 50.0,
          contrast: 50.0,
          saturation: 50.0,
          sharpness: 50.0, // Added missing field
          clarity: 50.0,   // Added missing field
          stability: 50.0, // Added missing field
        },
        activity_level: 50.0,
        emotional_tone: EmotionalTone::Neutral,
      };

      if let Ok(emotions) = emotion_detector.detect_emotions(&mock_detection) {
        let mut enhanced_scene = scene.clone();
        // Convert EmotionAnalysisResult to EmotionData
        enhanced_scene.emotional_tone = Some(crate::recognition::types_professional::EmotionData {
          primary_emotion: convert_emotional_tone_to_emotion(&emotions.dominant_emotion),
          confidence: emotions.emotion_confidence,
          emotions: std::collections::HashMap::new(), // TODO: fill from detected_emotions
        });

        // Анализ активности - берем первое detection из сцены
        if let Some((_, detection)) = enhanced_detections
          .iter()
          .find(|(t, _)| *t >= scene.start_time as f64 && *t <= scene.end_time as f64)
        {
          // Create a MontageDetection for activity calculation
          let montage_detection = MontageDetection {
            timestamp: scene.start_time as f64,
            detection_type: DetectionType::Combined,
            objects: detection
              .original_detections
              .iter()
              .map(|yolo_det| ObjectDetection {
                class: yolo_det.class.clone(),
                confidence: yolo_det.confidence,
                bbox: BoundingBox {
                  x: yolo_det.bbox.x,
                  y: yolo_det.bbox.y,
                  width: yolo_det.bbox.width,
                  height: yolo_det.bbox.height,
                },
                tracking_id: None,
                movement_vector: None,
                visual_importance: 0.5,
              })
              .collect(),
            faces: vec![], // No faces for now
            composition_score: detection.composition_score.clone(),
            activity_level: detection.visual_importance,
            emotional_tone: EmotionalTone::Neutral,
          };
          let activity = activity_calculator.calculate_activity(&montage_detection);
          enhanced_scene.energy_level = activity.overall_activity;
        } else {
          enhanced_scene.energy_level = 50.0; // Default if no detections in scene
        }

        emotional_scenes.push(enhanced_scene);
      } else {
        emotional_scenes.push(scene.clone());
      }
    }
    drop(emotion_detector);
    drop(activity_calculator);

    // 5. Детекция ключевых моментов
    let moment_detector = self.moment_detector.read().await;
    let montage_detections: Vec<MontageDetection> = enhanced_detections
      .iter()
      .map(|(timestamp, detection)| MontageDetection {
        timestamp: *timestamp,
        detection_type: DetectionType::Combined,
        objects: detection
          .original_detections
          .iter()
          .map(|yolo_det| ObjectDetection {
            class: yolo_det.class.clone(),
            confidence: yolo_det.confidence,
            bbox: BoundingBox {
              x: yolo_det.bbox.x,
              y: yolo_det.bbox.y,
              width: yolo_det.bbox.width,
              height: yolo_det.bbox.height,
            },
            tracking_id: None,
            movement_vector: None,
            visual_importance: 0.5,
          })
          .collect(),
        faces: vec![], // TODO: extract faces from detections
        composition_score: detection.composition_score.clone(),
        activity_level: detection.visual_importance,
        emotional_tone: EmotionalTone::default(), // TODO: extract from detection
      })
      .collect();

    let detected_moments = moment_detector.detect_moments(&montage_detections)?;
    drop(moment_detector);

    // 6. Конвертируем в наши типы и сохраняем в БД
    let mut saved_scenes = Vec::new();
    for scene in emotional_scenes {
      let saved_scene = self.analysis_db.create_scene(scene).await?;
      saved_scenes.push(saved_scene);
    }

    let mut saved_moments = Vec::new();
    for moment in detected_moments {
      let analysis_moment = self.convert_detected_moment_to_key_moment(project_id, file, moment);
      let saved_moment = self.analysis_db.create_key_moment(analysis_moment).await?;
      saved_moments.push(saved_moment);
    }

    // 7. Анализ персон через PersonDatabase
    let persons = self.analyze_persons_in_file(file).await?;

    Ok(VideoAnalysisResults {
      scenes: saved_scenes,
      moments: saved_moments,
      persons,
    })
  }

  /// Анализ аудиофайла
  async fn analyze_audio_file(
    &self,
    project_id: &Uuid,
    file: &AnalysisMediaFile,
  ) -> Result<AudioAnalysisResults> {
    log::debug!("Analyzing audio file: {}", file.file_path);

    // Используем unified audio analyzer
    let audio_analysis = self
      .unified_audio_analyzer
      .analyze_comprehensive(std::path::Path::new(&file.file_path), None)
      .await?;

    // Создаем ключевые моменты на основе аудио анализа
    let mut moments = Vec::new();

    // Детектируем аудио пики и интересные моменты
    if let Some(ref ffmpeg) = audio_analysis.ffmpeg_analysis {
      // Создаем один момент на основе анализа FFmpeg
      let volume_intensity = ffmpeg.volume_analysis.peak_volume.level as f32;
      if volume_intensity > 0.7 {
        // Только если достаточно высокая громкость
        let moment = KeyMoment {
          id: Uuid::new_v4(),
          project_id: *project_id,
          file_id: file.id,
          scene_id: None,
          timestamp: file.duration.unwrap_or(30.0) / 2.0, // Середина файла
          duration: 2.0,                                  // 2 секунды по умолчанию
          moment_type: MomentType::AudioPeak,
          sub_type: Some("audio_peak".to_string()),
          importance_score: volume_intensity,
          scoring_factors: ScoringFactors {
            audio_dynamics: volume_intensity,
            audio_clarity: ffmpeg.quality_metrics.overall_score as f32,
            ..Default::default()
          },
          description: "Audio peak detected with high volume".to_string(),
          auto_description: Some(format!(
            "Detected audio peak with intensity {:.2}",
            volume_intensity
          )),
          user_notes: None,
          involved_persons: Vec::new(),
          involved_objects: Vec::new(),
          associated_emotions: Vec::new(),
          content_tags: vec!["audio".to_string(), "peak".to_string()],
          mood_tags: Vec::new(),
          technical_tags: vec!["audio_analysis".to_string()],
          user_rating: None,
          is_bookmarked: false,
          is_hidden: false,
          thumbnail_frame: file.duration.unwrap_or(30.0) / 2.0,
          preview_start: (file.duration.unwrap_or(30.0) / 2.0 - 1.0).max(0.0),
          preview_end: file.duration.unwrap_or(30.0) / 2.0 + 1.0,
          created_at: chrono::Utc::now(),
          updated_at: chrono::Utc::now(),
        };

        let saved_moment = self.analysis_db.create_key_moment(moment).await?;
        moments.push(saved_moment);
      }
    }

    Ok(AudioAnalysisResults { moments })
  }

  /// Анализ изображения
  async fn analyze_image_file(
    &self,
    project_id: &Uuid,
    file: &AnalysisMediaFile,
  ) -> Result<ImageAnalysisResults> {
    log::debug!("Analyzing image file: {}", file.file_path);

    // Для изображений создаем одну сцену на весь файл
    let scene = AnalysisScene {
      id: Uuid::new_v4(),
      project_id: *project_id,
      file_id: file.id,
      start_time: 0.0,
      end_time: 1.0, // 1 секунда для изображения
      duration: 1.0,
      scene_type: SceneType::Static,
      sub_type: Some("image".to_string()),
      confidence: 1.0,
      dominant_colors: Vec::new(),
      brightness: 0.5,
      contrast: 0.5,
      saturation: 0.5,
      motion_level: 0.0,
      composition_score: 0.5,
      rule_of_thirds_compliance: 0.5,
      visual_balance: 0.5,
      quality_score: 0.7,
      sharpness: 0.7,
      noise_level: 0.2,
      stability: 1.0,
      persons_present: Vec::new(),
      objects_detected: Vec::new(),
      has_text: false,
      has_faces: false,
      emotional_tone: None,
      energy_level: 0.0,
      auto_description: Some("Static image scene".to_string()),
      user_description: None,
      tags: vec!["image".to_string(), "static".to_string()],
      user_rating: None,
      representative_frame: 0.0,
      keyframes: vec![0.0],
      created_at: chrono::Utc::now(),
    };

    let saved_scene = self.analysis_db.create_scene(scene).await?;

    // Анализ персон в изображении
    let persons = self.analyze_persons_in_file(file).await?;

    Ok(ImageAnalysisResults {
      scenes: vec![saved_scene],
      persons,
    })
  }

  /// Детекция сцен на основе композиционного анализа
  async fn detect_scenes_from_detections(
    &self,
    project_id: &Uuid,
    file: &AnalysisMediaFile,
    detections: &[(f64, CompositionEnhancedDetection)],
  ) -> Result<Vec<AnalysisScene>> {
    let mut scenes = Vec::new();

    if detections.is_empty() {
      return Ok(scenes);
    }

    // Простой алгоритм сегментации по изменениям в композиции
    let mut current_scene_start = detections[0].0;
    let mut last_composition_score = detections[0].1.composition_score.overall_score;

    for (i, (timestamp, detection)) in detections.iter().enumerate() {
      let composition_change =
        (detection.composition_score.overall_score - last_composition_score).abs();

      // Если изменение композиции значительное или достигли конца
      if composition_change > 0.3 || i == detections.len() - 1 {
        let scene_end = *timestamp;

        if scene_end - current_scene_start > 1.0 {
          // Минимум 1 секунда
          let scene = AnalysisScene {
            id: Uuid::new_v4(),
            project_id: *project_id,
            file_id: file.id,
            start_time: current_scene_start as f32,
            end_time: scene_end as f32,
            duration: (scene_end - current_scene_start) as f32,
            scene_type: self.classify_scene_type(&detection.composition_score),
            sub_type: None,
            confidence: detection.composition_score.confidence,
            dominant_colors: Vec::new(), // TODO: извлечь из анализа
            brightness: detection.composition_score.brightness,
            contrast: detection.composition_score.contrast,
            saturation: detection.composition_score.saturation,
            motion_level: detection.composition_score.activity_score,
            composition_score: detection.composition_score.overall_score,
            rule_of_thirds_compliance: detection.composition_score.rule_of_thirds,
            visual_balance: detection.composition_score.balance,
            quality_score: detection.composition_score.overall_score,
            sharpness: detection.composition_score.sharpness,
            noise_level: 1.0 - detection.composition_score.clarity,
            stability: detection.composition_score.stability,
            persons_present: vec![], // TODO: extract faces
            objects_detected: detection
              .original_detections
              .iter()
              .map(|o| o.class.clone())
              .collect(),
            has_text: false,  // TODO: детектировать текст
            has_faces: false, // TODO: extract from detections
            emotional_tone: Some(crate::recognition::types_professional::EmotionData {
              primary_emotion: Emotion::Neutral,
              confidence: 0.5,
              emotions: std::collections::HashMap::new(),
            }),
            energy_level: detection.visual_importance,
            auto_description: Some(format!(
              "Scene from {:.1}s to {:.1}s",
              current_scene_start, scene_end
            )),
            user_description: None,
            tags: vec!["auto_detected".to_string()],
            user_rating: None,
            representative_frame: ((current_scene_start + scene_end) / 2.0) as f32,
            keyframes: vec![current_scene_start as f32, scene_end as f32],
            created_at: chrono::Utc::now(),
          };

          scenes.push(scene);
        }

        current_scene_start = *timestamp;
        last_composition_score = detection.composition_score.overall_score;
      }
    }

    Ok(scenes)
  }

  /// Классификация типа сцены по композиции
  fn classify_scene_type(&self, composition: &CompositionScore) -> SceneType {
    // Простая эвристика на основе композиционных метрик
    if composition.balance > 0.8 && composition.rule_of_thirds > 0.7 {
      SceneType::Cinematic
    } else if composition.activity_score > 0.7 {
      SceneType::Dynamic
    } else if composition.face_count > 0 {
      if composition.face_prominence > 0.8 {
        SceneType::Closeup
      } else {
        SceneType::Medium
      }
    } else if composition.scene_depth > 0.7 {
      SceneType::Wide
    } else {
      SceneType::Medium
    }
  }

  /// Анализ персон в файле
  async fn analyze_persons_in_file(&self, file: &AnalysisMediaFile) -> Result<Vec<Uuid>> {
    log::debug!("Analyzing persons in file: {}", file.file_path);

    let found_persons = Vec::new();

    match file.media_type {
      MediaType::Video | MediaType::Image => {
        // TODO: Интегрировать PersonDatabase для анализа лиц
        log::debug!(
          "Person analysis not yet implemented for file: {}",
          file.file_name
        );
      }
      MediaType::Audio => {
        // Аудиофайлы не содержат лиц
        log::debug!("Skipping person analysis for audio file");
      }
    }

    log::info!(
      "Found {} persons in file {}",
      found_persons.len(),
      file.file_name
    );
    Ok(found_persons)
  }
  /// Детекция моментов между файлами
  async fn detect_cross_file_moments(
    &self,
    _scenes: &[AnalysisScene],
    _existing_moments: &[KeyMoment],
  ) -> Result<Vec<KeyMoment>> {
    // TODO: Реализовать межфайловую детекцию
    Ok(Vec::new())
  }

  /// Создание связей персон с проектом
  async fn create_project_person_associations(
    &self,
    project_id: &Uuid,
    persons: &[Uuid],
  ) -> Result<()> {
    log::debug!(
      "Creating project person associations for {} persons",
      persons.len()
    );

    for person_id in persons {
      // Получаем статистику по персоне в рамках проекта
      let files = self.project_manager.get_project_files(project_id).await?;
      let total_appearances = 0;
      let total_duration = 0.0;
      let _first_appearance: Option<chrono::DateTime<chrono::Utc>> = None;
      let _last_appearance: Option<chrono::DateTime<chrono::Utc>> = None;
      let dominant_emotions = Vec::new();

      // Анализируем появления персоны в файлах проекта
      for file in &files {
        // Получаем появления персоны в файле
        match self
          .person_db
          .get_person_appearances_in_file(person_id, &file.id.to_string())
          .await
        {
          Ok(appearances) => {
            // total_appearances += appearances.len(); // Убрали mut - теперь const
            log::debug!(
              "Found {} appearances for person {} in file {}",
              appearances.len(),
              person_id,
              file.file_name
            );
          }
          Err(e) => {
            log::warn!(
              "Failed to get appearances for person {} in file {}: {}",
              person_id,
              file.file_name,
              e
            );
          }
        }
      }

      // Создаем связь персоны с проектом
      let association = ProjectPersonAssociation {
        project_id: *project_id,
        person_id: *person_id,
        total_screen_time: total_duration,
        total_appearances: total_appearances as u32,
        scenes_present: 0,                       // TODO: calculate from actual data
        key_moments_involved: 0,                 // TODO: calculate from actual data
        importance: PersonImportance::Secondary, // Default value
        character_role: None,
        first_appearance: 0.0, // TODO: convert from datetime
        last_appearance: 0.0,  // TODO: convert from datetime
        most_prominent_scene: None,
        dominant_emotions: dominant_emotions.into_iter().collect(),
        emotional_range: 0.5,      // Default value
        emotional_stability: 0.5,  // Default value
        average_quality: 0.8,      // Default value
        best_quality_frame: None,  // Default value
        lighting_consistency: 0.5, // Default value
        user_notes: None,
        user_tags: Vec::new(),                     // Default value
        is_main_character: total_appearances > 20, // Эвристика
        custom_role: None,                         // Default value
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
      };

      match self
        .analysis_db
        .create_project_person_association(association)
        .await
      {
        Ok(_) => {
          log::info!(
            "Created association between project {} and person {} ({} appearances)",
            project_id,
            person_id,
            total_appearances
          );
        }
        Err(e) => {
          log::error!("Failed to create project person association: {}", e);
        }
      }
    }

    Ok(())
  }

  /// Конвертация DetectedMoment в KeyMoment
  fn convert_detected_moment_to_key_moment(
    &self,
    project_id: &Uuid,
    file: &AnalysisMediaFile,
    moment: DetectedMoment,
  ) -> KeyMoment {
    KeyMoment {
      id: Uuid::new_v4(),
      project_id: *project_id,
      file_id: file.id,
      scene_id: None,
      timestamp: moment.timestamp as f32,
      duration: moment.duration as f32,
      moment_type: self.convert_moment_category(moment.category.clone()),
      sub_type: Some(format!("{:?}", moment.category)),
      importance_score: moment.total_score,
      scoring_factors: ScoringFactors {
        emotion_intensity: moment.scores.emotional,
        visual_quality: moment.scores.visual,
        motion_interest: moment.scores.action,
        audio_clarity: moment.scores.technical,
        overall_quality: moment.total_score,
        weighted_score: moment.total_score,
        confidence: moment.scores.composition / 100.0,
        ..Default::default()
      },
      description: format!("{:?} moment at {:.1}s", moment.category, moment.timestamp),
      auto_description: Some(format!("Auto-detected {:?} moment", moment.category)),
      user_notes: None,
      involved_persons: Vec::new(),    // TODO: заполнить из анализа лиц
      involved_objects: Vec::new(),    // TODO: заполнить из YOLO детекций
      associated_emotions: Vec::new(), // TODO: извлечь из анализа эмоций
      content_tags: vec![format!("{:?}", moment.category).to_lowercase()],
      mood_tags: Vec::new(),
      technical_tags: vec!["auto_detected".to_string()],
      user_rating: None,
      is_bookmarked: false,
      is_hidden: false,
      thumbnail_frame: moment.timestamp as f32,
      preview_start: (moment.timestamp - moment.duration / 2.0).max(0.0) as f32,
      preview_end: (moment.timestamp + moment.duration / 2.0) as f32,
      created_at: chrono::Utc::now(),
      updated_at: chrono::Utc::now(),
    }
  }

  /// Конвертация категории момента
  fn convert_moment_category(
    &self,
    category: crate::montage_planner::types::MomentCategory,
  ) -> MomentType {
    match category {
      crate::montage_planner::types::MomentCategory::Action => MomentType::ActionClimax,
      crate::montage_planner::types::MomentCategory::Drama => MomentType::EmotionalPeak,
      crate::montage_planner::types::MomentCategory::Highlight => MomentType::VisualStunning,
      crate::montage_planner::types::MomentCategory::Comedy => MomentType::ComedicMoment,
      crate::montage_planner::types::MomentCategory::Opening => MomentType::NarrativeTurning,
      crate::montage_planner::types::MomentCategory::Closing => MomentType::NarrativeTurning,
      crate::montage_planner::types::MomentCategory::Transition => MomentType::SceneTransition,
      crate::montage_planner::types::MomentCategory::BRoll => MomentType::ObjectFocus,
    }
  }
}


/// Результаты анализа проекта
#[derive(Debug)]
pub struct AnalysisProjectResults {
  pub project_id: Uuid,
  pub total_scenes: u32,
  pub total_moments: u32,
  pub total_persons: u32,
  pub scenes: Vec<AnalysisScene>,
  pub moments: Vec<KeyMoment>,
  pub persons: Vec<Uuid>,
}

/// Результаты анализа видеофайла
#[derive(Debug)]
pub struct VideoAnalysisResults {
  pub scenes: Vec<AnalysisScene>,
  pub moments: Vec<KeyMoment>,
  pub persons: Vec<Uuid>,
}

/// Результаты анализа аудиофайла
#[derive(Debug)]
pub struct AudioAnalysisResults {
  pub moments: Vec<KeyMoment>,
}

/// Результаты анализа изображения
#[derive(Debug)]
pub struct ImageAnalysisResults {
  pub scenes: Vec<AnalysisScene>,
  pub persons: Vec<Uuid>,
}
