//! Scene Analysis Engine
//!
//! Unified scene analysis система, которая объединяет:
//! - Существующий SceneDetector (базовая детекция)
//! - AI классификация сцен (через MCP agents в будущем)
//! - Визуальный и аудио анализ характеристик
//! - Unified types для совместимости с frontend

use crate::analysis::models::{AnalysisScene, SceneType as ModelSceneType};
use crate::analysis::services::scene_detector::SceneDetector;
use crate::analysis::types::{
  AudioCharacteristics, FaceDetection, ObjectDetection, SceneAnalysis, SceneType, TransitionInfo,
  UnifiedMediaFile, VisualCharacteristics,
};
use anyhow::{Context, Result};
use log::{debug, info, warn};
use std::sync::Arc;

/// Scene Analysis Engine
///
/// Главный движок для анализа сцен в видео.
/// Использует существующий SceneDetector и добавляет:
/// - AI классификацию
/// - Расширенный визуальный анализ
/// - Аудио характеристики
/// - Unified result types
pub struct SceneEngine {
  /// Базовый детектор сцен (переиспользуем существующий)
  scene_detector: Arc<SceneDetector>,

  /// Enable AI classification
  enable_ai_classification: bool,

  /// Enable visual analysis
  enable_visual_analysis: bool,

  /// Enable audio analysis
  enable_audio_analysis: bool,

  /// Enable transition analysis
  enable_transition_analysis: bool,
}

impl SceneEngine {
  /// Create new Scene Engine with default configuration
  pub fn new() -> Self {
    Self {
      scene_detector: Arc::new(SceneDetector::new()),
      enable_ai_classification: true,
      enable_visual_analysis: true,
      enable_audio_analysis: true,
      enable_transition_analysis: true,
    }
  }

  /// Create with custom scene detector
  pub fn with_detector(detector: SceneDetector) -> Self {
    Self {
      scene_detector: Arc::new(detector),
      enable_ai_classification: true,
      enable_visual_analysis: true,
      enable_audio_analysis: true,
      enable_transition_analysis: true,
    }
  }

  /// Builder pattern: enable/disable features
  pub fn with_ai_classification(mut self, enable: bool) -> Self {
    self.enable_ai_classification = enable;
    self
  }

  pub fn with_visual_analysis(mut self, enable: bool) -> Self {
    self.enable_visual_analysis = enable;
    self
  }

  pub fn with_audio_analysis(mut self, enable: bool) -> Self {
    self.enable_audio_analysis = enable;
    self
  }

  pub fn with_transition_analysis(mut self, enable: bool) -> Self {
    self.enable_transition_analysis = enable;
    self
  }

  /// Analyze scenes in media file
  ///
  /// Главный entry point для анализа сцен.
  /// Возвращает Vec<SceneAnalysis> с unified types.
  pub async fn analyze_scenes(&self, media: &UnifiedMediaFile) -> Result<Vec<SceneAnalysis>> {
    info!("Starting scene analysis for file: {}", media.filename);

    // Step 1: Базовая детекция сцен через существующий SceneDetector
    let detected_scenes = self
      .scene_detector
      .detect_scenes(&media.path)
      .await
      .context("Failed to detect scenes")?;

    info!("Detected {} scenes", detected_scenes.len());

    // Step 2: Конвертируем и обогащаем каждую сцену
    let mut unified_scenes = Vec::new();

    for scene in detected_scenes {
      let unified_scene = self.convert_and_enrich_scene(scene, media).await?;
      unified_scenes.push(unified_scene);
    }

    info!(
      "Scene analysis complete: {} scenes analyzed",
      unified_scenes.len()
    );

    Ok(unified_scenes)
  }

  /// Convert AnalysisScene to unified SceneAnalysis and enrich with additional data
  async fn convert_and_enrich_scene(
    &self,
    scene: AnalysisScene,
    media: &UnifiedMediaFile,
  ) -> Result<SceneAnalysis> {
    debug!(
      "Converting scene {:.2}-{:.2}s",
      scene.start_time, scene.end_time
    );

    // Convert scene type
    let scene_type = Self::convert_scene_type(&scene.scene_type);

    // Extract visual characteristics
    let visual = if self.enable_visual_analysis {
      Some(VisualCharacteristics {
        dominant_colors: scene.dominant_colors.clone(),
        brightness: scene.brightness as f64,
        contrast: scene.contrast as f64,
        saturation: scene.saturation as f64,
        motion_level: scene.motion_level as f64,
        composition_score: scene.composition_score as f64,
        sharpness: scene.sharpness as f64,
        noise_level: scene.noise_level as f64,
      })
    } else {
      None
    };

    // Extract audio characteristics (if available)
    let audio = if self.enable_audio_analysis {
      // TODO: Integrate with Unified Audio Analyzer results
      Some(AudioCharacteristics {
        has_speech: scene.has_faces,  // Proxy: faces often correlate with speech
        has_music: false,             // TODO: from audio analysis
        volume_level: 0.5,            // TODO: from audio analysis
        clarity: 0.7,                 // TODO: from audio analysis
        dominant_frequencies: vec![], // TODO: from audio analysis
      })
    } else {
      None
    };

    // Analyze transitions (if enabled)
    let transition = if self.enable_transition_analysis {
      self.analyze_transition(&scene).await?
    } else {
      None
    };

    // AI Classification (if enabled)
    let (classified_type, description) = if self.enable_ai_classification {
      self.classify_scene_with_ai(&scene, &scene_type).await?
    } else {
      (scene_type.clone(), scene.auto_description.clone())
    };

    // Convert keyframes timestamps
    let key_frames: Vec<f64> = scene.keyframes.iter().map(|&kf| kf as f64).collect();

    Ok(SceneAnalysis {
      id: scene.id.to_string(),
      file_id: media.id.clone(),
      start_time: scene.start_time as f64,
      end_time: scene.end_time as f64,
      duration: scene.duration as f64,
      scene_type: classified_type,
      confidence: scene.confidence as f64,
      key_frames,
      description,
      visual,
      audio,
      objects: scene.objects_detected,
      persons: scene
        .persons_present
        .iter()
        .map(|uuid| uuid.to_string())
        .collect(),
      transition,
    })
  }

  /// Convert ModelSceneType to unified SceneType
  fn convert_scene_type(model_type: &ModelSceneType) -> SceneType {
    match model_type {
      ModelSceneType::Action => SceneType::Action,
      ModelSceneType::Dialogue => SceneType::Dialog,
      ModelSceneType::Landscape => SceneType::Landscape,
      ModelSceneType::Closeup => SceneType::Closeup,
      ModelSceneType::Transition => SceneType::Transition,
      ModelSceneType::Static => SceneType::Static,
      ModelSceneType::Dynamic => SceneType::Dynamic,
      ModelSceneType::Interview => SceneType::Interview,
      ModelSceneType::Establishing => SceneType::Establishing,
      ModelSceneType::Reaction => SceneType::Reaction,
      ModelSceneType::Montage => SceneType::Montage,
      ModelSceneType::Opening => SceneType::Opening,
      ModelSceneType::Ending => SceneType::Ending,
      ModelSceneType::Content | _ => SceneType::Unknown,
    }
  }

  /// Classify scene type using AI (future: MCP agents)
  ///
  /// TODO: Интегрировать с MCP agents для настоящей AI классификации
  /// Сейчас возвращаем базовую классификацию
  async fn classify_scene_with_ai(
    &self,
    scene: &AnalysisScene,
    base_type: &SceneType,
  ) -> Result<(SceneType, Option<String>)> {
    debug!(
      "AI classification for scene {:.2}-{:.2}s",
      scene.start_time, scene.end_time
    );

    // TODO: Future implementation with MCP agents
    // Example:
    // let ai_result = self.mcp_client.classify_scene(scene).await?;
    // return Ok((ai_result.scene_type, Some(ai_result.description)));

    // Temporary: enhanced heuristic classification
    let enhanced_type = self.enhance_classification_heuristic(scene, base_type);

    let description = Some(format!(
      "{:?} scene: {:.1}s duration, quality {:.2}, motion {:.2}",
      enhanced_type, scene.duration, scene.quality_score, scene.motion_level
    ));

    Ok((enhanced_type, description))
  }

  /// Enhanced heuristic classification (until MCP integration)
  fn enhance_classification_heuristic(
    &self,
    scene: &AnalysisScene,
    base_type: &SceneType,
  ) -> SceneType {
    // Improve classification based on multiple factors

    // Check for interview patterns
    if scene.has_faces && scene.duration > 10.0 && scene.motion_level < 0.3 {
      return SceneType::Interview;
    }

    // Check for action scenes
    if scene.motion_level > 0.7 && scene.energy_level > 0.7 {
      return SceneType::Action;
    }

    // Check for landscape scenes
    if !scene.has_faces && scene.motion_level < 0.4 && scene.composition_score > 0.7 {
      return SceneType::Landscape;
    }

    // Check for closeup scenes
    if scene.has_faces && scene.duration < 5.0 {
      return SceneType::Closeup;
    }

    // Check for dynamic scenes
    if scene.motion_level > 0.5 {
      return SceneType::Dynamic;
    }

    // Check for static scenes
    if scene.motion_level < 0.2 {
      return SceneType::Static;
    }

    // Fallback to base type
    base_type.clone()
  }

  /// Analyze transition between scenes
  async fn analyze_transition(&self, scene: &AnalysisScene) -> Result<Option<TransitionInfo>> {
    // Analyze if this is a transition scene
    if scene.scene_type == ModelSceneType::Transition {
      Ok(Some(TransitionInfo {
        transition_type: self.detect_transition_type(scene),
        quality: scene.quality_score as f64,
        duration: scene.duration as f64,
      }))
    } else {
      Ok(None)
    }
  }

  /// Detect transition type based on scene characteristics
  fn detect_transition_type(&self, scene: &AnalysisScene) -> String {
    // Heuristic detection of transition types

    if scene.brightness < 0.1 {
      "fade_to_black".to_string()
    } else if scene.brightness > 0.9 {
      "fade_to_white".to_string()
    } else if scene.motion_level > 0.8 {
      "wipe".to_string()
    } else if scene.duration < 0.5 {
      "cut".to_string()
    } else {
      "dissolve".to_string()
    }
  }

  /// Classify a single scene (convenience method)
  pub async fn classify_scene_type(&self, scene: &AnalysisScene) -> Result<SceneType> {
    let base_type = Self::convert_scene_type(&scene.scene_type);

    if self.enable_ai_classification {
      let (classified, _) = self.classify_scene_with_ai(scene, &base_type).await?;
      Ok(classified)
    } else {
      Ok(base_type)
    }
  }

  /// Extract visual elements from scene
  ///
  /// TODO: Integrate with Vision Service when it's implemented
  pub async fn extract_visual_elements(&self, _scene: &SceneAnalysis) -> Result<VisualElements> {
    // Placeholder for vision service integration
    warn!("Visual elements extraction not yet implemented (Vision Service pending)");

    Ok(VisualElements {
      objects: vec![],
      faces: vec![],
      dominant_colors: vec![],
    })
  }

  /// Analyze transitions between consecutive scenes
  pub async fn analyze_transitions(&self, scenes: &[SceneAnalysis]) -> Result<Vec<TransitionInfo>> {
    info!("Analyzing transitions between {} scenes", scenes.len());

    let mut transitions = Vec::new();

    for i in 0..scenes.len().saturating_sub(1) {
      let current = &scenes[i];
      let next = &scenes[i + 1];

      let transition = self.analyze_scene_transition(current, next).await?;
      transitions.push(transition);
    }

    Ok(transitions)
  }

  /// Analyze transition between two consecutive scenes
  async fn analyze_scene_transition(
    &self,
    current: &SceneAnalysis,
    next: &SceneAnalysis,
  ) -> Result<TransitionInfo> {
    // Analyze the gap/overlap between scenes
    let gap_duration = next.start_time - current.end_time;

    // Determine transition type based on characteristics
    let transition_type = if gap_duration.abs() < 0.1 {
      "cut".to_string()
    } else if gap_duration > 0.5 {
      "fade".to_string()
    } else {
      "dissolve".to_string()
    };

    // Quality score based on smoothness
    let quality = if current.visual.is_some() && next.visual.is_some() {
      let curr_visual = current.visual.as_ref().unwrap();
      let next_visual = next.visual.as_ref().unwrap();

      // Smooth transitions have similar visual characteristics
      let brightness_diff = (curr_visual.brightness - next_visual.brightness).abs();
      let motion_diff = (curr_visual.motion_level - next_visual.motion_level).abs();

      1.0 - ((brightness_diff + motion_diff) / 2.0).min(1.0)
    } else {
      0.5
    };

    Ok(TransitionInfo {
      transition_type,
      quality,
      duration: gap_duration.abs().max(0.1),
    })
  }
}

impl Default for SceneEngine {
  fn default() -> Self {
    Self::new()
  }
}

/// Visual elements extracted from scene
#[derive(Debug, Clone)]
pub struct VisualElements {
  pub objects: Vec<ObjectDetection>,
  pub faces: Vec<FaceDetection>,
  pub dominant_colors: Vec<String>,
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
  use super::*;
  use crate::analysis::types::UnifiedMediaType;

  fn create_test_media() -> UnifiedMediaFile {
    UnifiedMediaFile {
      id: "test-media-1".to_string(),
      path: "/path/to/test.mp4".to_string(),
      filename: "test.mp4".to_string(),
      size: 1024000,
      media_type: UnifiedMediaType::Video,
      duration: Some(120.5),
      format: Some("mp4".to_string()),
      metadata: None,
      created_at: None,
    }
  }

  #[test]
  fn test_scene_engine_creation() {
    let engine = SceneEngine::new();
    assert!(engine.enable_ai_classification);
    assert!(engine.enable_visual_analysis);
  }

  #[test]
  fn test_scene_engine_builder() {
    let engine = SceneEngine::new()
      .with_ai_classification(false)
      .with_visual_analysis(false);

    assert!(!engine.enable_ai_classification);
    assert!(!engine.enable_visual_analysis);
  }

  #[test]
  fn test_scene_type_conversion() {
    let model_type = ModelSceneType::Dialogue;
    let unified_type = SceneEngine::convert_scene_type(&model_type);
    assert_eq!(unified_type, SceneType::Dialog);
  }

  #[test]
  fn test_transition_type_detection() {
    let engine = SceneEngine::new();

    // Test fade to black detection
    let scene = AnalysisScene {
      id: Uuid::new_v4(),
      project_id: Uuid::new_v4(),
      file_id: Uuid::new_v4(),
      start_time: 0.0,
      end_time: 1.0,
      duration: 1.0,
      scene_type: ModelSceneType::Transition,
      sub_type: None,
      confidence: 0.9,
      dominant_colors: vec![],
      brightness: 0.05, // Very dark -> fade to black
      contrast: 0.5,
      saturation: 0.5,
      motion_level: 0.2,
      composition_score: 0.5,
      rule_of_thirds_compliance: 0.5,
      visual_balance: 0.5,
      quality_score: 0.8,
      sharpness: 0.7,
      noise_level: 0.1,
      stability: 0.9,
      persons_present: vec![],
      objects_detected: vec![],
      has_text: false,
      has_faces: false,
      emotional_tone: None,
      energy_level: 0.2,
      auto_description: None,
      user_description: None,
      tags: vec![],
      user_rating: None,
      representative_frame: 0.5,
      keyframes: vec![0.0, 0.5, 1.0],
      created_at: chrono::Utc::now(),
    };

    let transition_type = engine.detect_transition_type(&scene);
    assert_eq!(transition_type, "fade_to_black");
  }

  #[test]
  fn test_enhance_classification_heuristic() {
    let engine = SceneEngine::new();

    // Test interview detection
    let interview_scene = AnalysisScene {
      id: Uuid::new_v4(),
      project_id: Uuid::new_v4(),
      file_id: Uuid::new_v4(),
      start_time: 0.0,
      end_time: 15.0,
      duration: 15.0,
      scene_type: ModelSceneType::Content,
      sub_type: None,
      confidence: 0.8,
      dominant_colors: vec![],
      brightness: 0.6,
      contrast: 0.6,
      saturation: 0.5,
      motion_level: 0.2, // Low motion
      composition_score: 0.7,
      rule_of_thirds_compliance: 0.7,
      visual_balance: 0.7,
      quality_score: 0.8,
      sharpness: 0.8,
      noise_level: 0.1,
      stability: 0.9,
      persons_present: vec![],
      objects_detected: vec![],
      has_text: false,
      has_faces: true, // Has faces
      emotional_tone: None,
      energy_level: 0.3,
      auto_description: None,
      user_description: None,
      tags: vec![],
      user_rating: None,
      representative_frame: 7.5,
      keyframes: vec![0.0, 7.5, 15.0],
      created_at: chrono::Utc::now(),
    };

    let base_type = SceneType::Unknown;
    let enhanced_type = engine.enhance_classification_heuristic(&interview_scene, &base_type);
    assert_eq!(enhanced_type, SceneType::Interview);
  }
}
