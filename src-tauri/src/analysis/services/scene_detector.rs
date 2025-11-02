// Scene detector - детекция сцен с интеграцией FFmpeg и Video Analysis

use crate::analysis::models::*;
// use crate::video_compiler::core::ffmpeg::audio_analysis::FFmpegAudioAnalyzer;  // Временно отключено
// use crate::video_compiler::core::ffmpeg::video_analysis::FFmpegVideoAnalyzer;  // Временно отключено
use crate::montage_planner::EmotionalTone;
use crate::recognition::types_professional::Emotion;
use anyhow::{Context, Result};
use chrono::Utc;
use log::{debug, info, warn};
use std::path::Path;
use uuid::Uuid;

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

/// Детектор сцен с интеграцией FFmpeg
pub struct SceneDetector {
  /// Минимальная длительность сцены (секунды)
  pub min_scene_duration: f32,
  /// Максимальная длительность сцены (секунды)
  pub max_scene_duration: f32,
  /// Порог чувствительности для детекции смены сцен
  pub scene_change_threshold: f32,
  /// Включить ли audio analysis для каждой сцены
  pub enable_audio_analysis: bool,
}

impl SceneDetector {
  pub fn new() -> Self {
    Self {
      min_scene_duration: 2.0,     // Минимум 2 секунды
      max_scene_duration: 300.0,   // Максимум 5 минут
      scene_change_threshold: 0.3, // 30% изменения для новой сцены
      enable_audio_analysis: true,
    }
  }

  /// Конфигурация с пользовательскими параметрами
  pub fn with_config(
    min_duration: f32,
    max_duration: f32,
    threshold: f32,
    enable_audio: bool,
  ) -> Self {
    Self {
      min_scene_duration: min_duration,
      max_scene_duration: max_duration,
      scene_change_threshold: threshold,
      enable_audio_analysis: enable_audio,
    }
  }

  /// Детекция сцен в файле
  pub async fn detect_scenes(&self, file_path: &str) -> Result<Vec<AnalysisScene>> {
    info!("Starting scene detection for file: {}", file_path);

    let path = Path::new(file_path);
    if !path.exists() {
      return Err(anyhow::anyhow!("File not found: {}", file_path));
    }

    // Получаем метаданные файла через FFmpeg
    let file_metadata = self
      .extract_file_metadata(file_path)
      .await
      .context("Failed to extract file metadata")?;

    info!(
      "File duration: {:.2}s, analyzing scenes...",
      file_metadata.duration
    );

    // Выполняем детекцию смены сцен через FFmpeg
    let scene_changes = self
      .detect_scene_changes(file_path)
      .await
      .context("Failed to detect scene changes")?;

    info!("Detected {} scene changes", scene_changes.len());

    // Создаем сцены на основе точек смены
    let scenes = self
      .create_scenes_from_changes(&file_metadata, &scene_changes, file_path)
      .await?;

    info!("Created {} scenes from detected changes", scenes.len());
    Ok(scenes)
  }

  /// Извлечение метаданных файла
  async fn extract_file_metadata(&self, file_path: &str) -> Result<FileMetadata> {
    debug!("Extracting metadata for: {}", file_path);

    // Базовые метаданные без FFmpeg (можно расширить позже)
    let path = Path::new(file_path);
    let file_size = path.metadata()?.len();

    // Оценочные значения на основе размера файла
    let estimated_duration = (file_size as f32 / 1_000_000.0).clamp(10.0, 3600.0); // 1MB ≈ 1 секунда

    Ok(FileMetadata {
      duration: estimated_duration,
      width: 1920, // Default HD
      height: 1080,
      fps: 30.0,
      has_audio: true, // Assume most videos have audio
    })
  }

  /// Детекция точек смены сцен
  async fn detect_scene_changes(&self, file_path: &str) -> Result<Vec<f32>> {
    debug!(
      "Detecting scene changes with threshold: {}",
      self.scene_change_threshold
    );

    // Пока используем time-based подход (можно добавить FFmpeg позже)
    warn!("Using time-based scene detection (FFmpeg integration pending)");
    self.create_time_based_scenes(file_path).await
  }

  /// Fallback: создание сцен на основе времени
  async fn create_time_based_scenes(&self, file_path: &str) -> Result<Vec<f32>> {
    let metadata = self.extract_file_metadata(file_path).await?;
    let mut changes = Vec::new();

    // Создаем сцены фиксированной длительности
    let scene_duration = self.max_scene_duration.min(metadata.duration / 4.0); // Не более 4 сцен
    let mut current_time = 0.0;

    while current_time < metadata.duration {
      changes.push(current_time);
      current_time += scene_duration;
    }

    info!("Created {} time-based scene changes", changes.len());
    Ok(changes)
  }

  /// Создание сцен из точек смены
  async fn create_scenes_from_changes(
    &self,
    metadata: &FileMetadata,
    scene_changes: &[f32],
    file_path: &str,
  ) -> Result<Vec<AnalysisScene>> {
    let mut scenes = Vec::new();
    let project_id = Uuid::new_v4(); // TODO: получать из контекста
    let file_id = Uuid::new_v4(); // TODO: получать из контекста

    for (i, &start_time) in scene_changes.iter().enumerate() {
      let end_time = if i + 1 < scene_changes.len() {
        scene_changes[i + 1]
      } else {
        metadata.duration
      };

      let duration = end_time - start_time;

      // Пропускаем слишком короткие сцены
      if duration < self.min_scene_duration {
        debug!(
          "Skipping scene {:.2}-{:.2}s (too short: {:.2}s)",
          start_time, end_time, duration
        );
        continue;
      }

      debug!(
        "Analyzing scene {:.2}-{:.2}s (duration: {:.2}s)",
        start_time, end_time, duration
      );

      // Анализируем качество и характеристики сцены
      let scene_analysis = self
        .analyze_scene_segment(file_path, start_time, end_time, metadata)
        .await?;

      let scene = AnalysisScene {
        id: Uuid::new_v4(),
        project_id,
        file_id,
        start_time,
        end_time,
        duration,
        scene_type: scene_analysis.scene_type,
        sub_type: scene_analysis.sub_type,
        confidence: scene_analysis.confidence,
        dominant_colors: scene_analysis.dominant_colors,
        brightness: scene_analysis.brightness,
        contrast: scene_analysis.contrast,
        saturation: scene_analysis.saturation,
        motion_level: scene_analysis.motion_level,
        composition_score: scene_analysis.composition_score,
        rule_of_thirds_compliance: scene_analysis.rule_of_thirds_compliance,
        visual_balance: scene_analysis.visual_balance,
        quality_score: scene_analysis.quality_score,
        sharpness: scene_analysis.sharpness,
        noise_level: scene_analysis.noise_level,
        stability: scene_analysis.stability,
        persons_present: scene_analysis.persons_present,
        objects_detected: scene_analysis.objects_detected,
        has_text: scene_analysis.has_text,
        has_faces: scene_analysis.has_faces,
        emotional_tone: scene_analysis.emotional_tone.map(|tone| {
          crate::recognition::types_professional::EmotionData {
            primary_emotion: convert_emotional_tone_to_emotion(&tone),
            confidence: 0.5,
            emotions: std::collections::HashMap::new(),
          }
        }),
        energy_level: scene_analysis.energy_level,
        auto_description: scene_analysis.auto_description,
        user_description: None,
        tags: scene_analysis.tags,
        user_rating: None,
        representative_frame: scene_analysis
          .representative_frame
          .as_ref()
          .map(|_| 0.0)
          .unwrap_or(0.0),
        keyframes: scene_analysis
          .keyframes
          .iter()
          .enumerate()
          .map(|(i, _)| i as f32)
          .collect(),
        created_at: Utc::now(),
      };

      scenes.push(scene);
    }

    Ok(scenes)
  }

  /// Анализ сегмента сцены
  async fn analyze_scene_segment(
    &self,
    _file_path: &str,
    start_time: f32,
    end_time: f32,
    metadata: &FileMetadata,
  ) -> Result<SceneAnalysisResult> {
    debug!("Analyzing scene segment {:.2}-{:.2}s", start_time, end_time);

    // Базовый анализ (всегда доступен)
    let mut result = SceneAnalysisResult::default();
    result.duration = end_time - start_time;

    // Определяем тип сцены на основе длительности и позиции
    result.scene_type = self.classify_scene_type(start_time, end_time, metadata.duration);
    result.confidence = 0.8; // Базовая уверенность

    // Технические метрики (можно получить из FFmpeg)
    result.quality_score = 0.75; // TODO: реальный анализ качества
    result.brightness = 0.5;
    result.contrast = 0.6;
    result.saturation = 0.5;
    result.sharpness = 0.7;
    result.noise_level = 0.2;
    result.stability = 0.8;

    // Композиционные метрики
    result.motion_level = self.estimate_motion_level(start_time, end_time);
    result.composition_score = 0.6;
    result.rule_of_thirds_compliance = 0.5;
    result.visual_balance = 0.6;
    result.energy_level = result.motion_level;

    // Автоматическое описание
    result.auto_description = Some(format!(
      "{:?} scene from {:.1}s to {:.1}s (duration: {:.1}s)",
      result.scene_type, start_time, end_time, result.duration
    ));

    // Представительный кадр (в середине сцены)
    let middle_time = start_time + (end_time - start_time) / 2.0;
    result.representative_frame = Some(format!("frame_at_{:.2}s", middle_time));

    // Ключевые кадры (начало, середина, конец)
    result.keyframes = vec![
      format!("frame_at_{:.2}s", start_time),
      format!("frame_at_{:.2}s", middle_time),
      format!("frame_at_{:.2}s", end_time - 0.1),
    ];

    // Тэги на основе анализа
    result.tags = vec![
      format!("duration:{:.1}s", result.duration),
      format!("quality:{:.1}", result.quality_score),
      format!("motion:{:.1}", result.motion_level),
    ];

    Ok(result)
  }

  /// Классификация типа сцены
  fn classify_scene_type(&self, start_time: f32, end_time: f32, total_duration: f32) -> SceneType {
    let duration = end_time - start_time;
    let position_ratio = start_time / total_duration;

    // Логика классификации
    if position_ratio < 0.1 {
      SceneType::Opening
    } else if position_ratio > 0.9 {
      SceneType::Ending
    } else if duration < 5.0 {
      SceneType::Transition
    } else if duration > 60.0 {
      SceneType::Interview
    } else {
      SceneType::Content
    }
  }

  /// Оценка уровня движения
  fn estimate_motion_level(&self, start_time: f32, end_time: f32) -> f32 {
    let duration = end_time - start_time;

    // Простая эвристика: короткие сцены обычно более динамичные
    if duration < 5.0 {
      0.8
    } else if duration < 15.0 {
      0.6
    } else if duration < 60.0 {
      0.4
    } else {
      0.2
    }
  }
}

impl Default for SceneDetector {
  fn default() -> Self {
    Self::new()
  }
}

/// Метаданные файла
#[derive(Debug, Clone)]
struct FileMetadata {
  duration: f32,
  #[allow(dead_code)]
  width: u32,
  #[allow(dead_code)]
  height: u32,
  #[allow(dead_code)]
  fps: f32,
  #[allow(dead_code)]
  has_audio: bool,
}

/// Результат анализа сцены
#[derive(Debug, Clone, Default)]
struct SceneAnalysisResult {
  duration: f32,
  scene_type: SceneType,
  sub_type: Option<String>,
  confidence: f32,
  dominant_colors: Vec<String>,
  brightness: f32,
  contrast: f32,
  saturation: f32,
  motion_level: f32,
  composition_score: f32,
  rule_of_thirds_compliance: f32,
  visual_balance: f32,
  quality_score: f32,
  sharpness: f32,
  noise_level: f32,
  stability: f32,
  persons_present: Vec<Uuid>,
  objects_detected: Vec<String>,
  has_text: bool,
  has_faces: bool,
  emotional_tone: Option<EmotionalTone>,
  energy_level: f32,
  auto_description: Option<String>,
  tags: Vec<String>,
  representative_frame: Option<String>,
  keyframes: Vec<String>,
}
