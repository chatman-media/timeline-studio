//! Moment Engine - Unified Key Moment Detection
//!
//! Combines functionality from:
//! - analysis/services/moment_analyzer.rs
//! - montage_planner/services/moment_detector.rs
//!
//! Detects and scores key moments in video content using:
//! - Scene analysis
//! - Audio analysis (speech, music, silence)
//! - Visual features (faces, objects, motion)
//! - Emotional content
//! - Narrative importance

use crate::analysis::types::unified_types::{KeyMoment, MomentScoring, MomentType, SceneAnalysis};
use anyhow::Result;
use log::{debug, info, warn};
use uuid::Uuid;

// ============================================================================
// CONFIGURATION
// ============================================================================

/// Moment Engine Configuration
#[derive(Debug, Clone)]
pub struct MomentEngineConfig {
  /// Minimum importance threshold (0-1)
  pub importance_threshold: f64,

  /// Maximum moments per scene
  pub max_moments_per_scene: usize,

  /// Minimum moment duration (seconds)
  pub min_duration: f64,

  /// Maximum moment duration (seconds)
  pub max_duration: f64,

  /// Enable audio-based moment detection
  pub enable_audio_detection: bool,

  /// Enable visual-based moment detection
  pub enable_visual_detection: bool,

  /// Enable emotion-based detection
  pub enable_emotion_detection: bool,
}

impl Default for MomentEngineConfig {
  fn default() -> Self {
    Self {
      importance_threshold: 0.7, // Only high-importance moments
      max_moments_per_scene: 5,
      min_duration: 1.0,
      max_duration: 10.0,
      enable_audio_detection: true,
      enable_visual_detection: true,
      enable_emotion_detection: true,
    }
  }
}

/// Builder for Moment Engine Configuration
pub struct MomentEngineConfigBuilder {
  config: MomentEngineConfig,
}

impl MomentEngineConfigBuilder {
  pub fn new() -> Self {
    Self {
      config: MomentEngineConfig::default(),
    }
  }

  pub fn importance_threshold(mut self, threshold: f64) -> Self {
    self.config.importance_threshold = threshold.clamp(0.0, 1.0);
    self
  }

  pub fn max_moments_per_scene(mut self, max: usize) -> Self {
    self.config.max_moments_per_scene = max;
    self
  }

  pub fn duration_range(mut self, min: f64, max: f64) -> Self {
    self.config.min_duration = min;
    self.config.max_duration = max;
    self
  }

  pub fn enable_audio(mut self, enable: bool) -> Self {
    self.config.enable_audio_detection = enable;
    self
  }

  pub fn enable_visual(mut self, enable: bool) -> Self {
    self.config.enable_visual_detection = enable;
    self
  }

  pub fn enable_emotion(mut self, enable: bool) -> Self {
    self.config.enable_emotion_detection = enable;
    self
  }

  pub fn build(self) -> MomentEngineConfig {
    self.config
  }
}

impl Default for MomentEngineConfigBuilder {
  fn default() -> Self {
    Self::new()
  }
}

// ============================================================================
// MOMENT ENGINE
// ============================================================================

/// Unified Moment Engine
pub struct MomentEngine {
  config: MomentEngineConfig,
}

impl MomentEngine {
  /// Create new engine with default configuration
  pub fn new() -> Self {
    Self {
      config: MomentEngineConfig::default(),
    }
  }

  /// Create with custom configuration
  pub fn with_config(config: MomentEngineConfig) -> Self {
    Self { config }
  }

  /// Builder for configuration
  pub fn builder() -> MomentEngineConfigBuilder {
    MomentEngineConfigBuilder::new()
  }

  // ========================================================================
  // MOMENT DETECTION
  // ========================================================================

  /// Detect key moments in scenes
  pub async fn detect_moments(&self, scenes: &[SceneAnalysis]) -> Result<Vec<KeyMoment>> {
    info!("Detecting key moments in {} scenes", scenes.len());

    let mut all_moments = Vec::new();

    for scene in scenes {
      match self.detect_moments_in_scene(scene).await {
        Ok(mut scene_moments) => {
          // Sort by importance and limit
          scene_moments.sort_by(|a, b| {
            b.importance_score
              .partial_cmp(&a.importance_score)
              .unwrap_or(std::cmp::Ordering::Equal)
          });
          scene_moments.truncate(self.config.max_moments_per_scene);

          all_moments.extend(scene_moments);
        }
        Err(e) => {
          warn!("Failed to detect moments in scene {}: {}", scene.id, e);
        }
      }
    }

    // Global sorting by importance
    all_moments.sort_by(|a, b| {
      b.importance_score
        .partial_cmp(&a.importance_score)
        .unwrap_or(std::cmp::Ordering::Equal)
    });

    info!("Detected {} key moments total", all_moments.len());
    Ok(all_moments)
  }

  /// Detect moments in a single scene
  async fn detect_moments_in_scene(&self, scene: &SceneAnalysis) -> Result<Vec<KeyMoment>> {
    debug!(
      "Analyzing scene {} ({}s - {}s)",
      scene.id, scene.start_time, scene.end_time
    );

    let mut moments = Vec::new();

    // Calculate how many moments this scene should have
    let moment_count = self.calculate_moment_count(scene);

    for i in 0..moment_count {
      // Distribute moments across the scene
      let progress = i as f64 / moment_count.max(1) as f64;
      let timestamp = scene.start_time + (scene.duration * progress);

      // Calculate moment importance
      let importance = self.calculate_importance(scene, timestamp, progress);

      // Only create moments above threshold
      if importance >= self.config.importance_threshold {
        let moment = self.create_moment(scene, timestamp, importance, i)?;
        moments.push(moment);
      }
    }

    debug!(
      "Found {} moments in scene {} (above threshold {:.2})",
      moments.len(),
      scene.id,
      self.config.importance_threshold
    );

    Ok(moments)
  }

  // ========================================================================
  // MOMENT SCORING
  // ========================================================================

  /// Calculate how many moments a scene should have
  fn calculate_moment_count(&self, scene: &SceneAnalysis) -> usize {
    // Base count on duration
    let base_count = if scene.duration < 10.0 {
      1
    } else if scene.duration < 30.0 {
      2
    } else if scene.duration < 60.0 {
      3
    } else {
      4
    };

    // Bonus for high quality or many key frames
    let quality_bonus = if scene.key_frames.len() > 5 { 1 } else { 0 };

    (base_count + quality_bonus).min(self.config.max_moments_per_scene)
  }

  /// Calculate importance score for a moment
  fn calculate_importance(&self, scene: &SceneAnalysis, _timestamp: f64, progress: f64) -> f64 {
    let mut score = 0.0;

    // Visual contribution (40%)
    if self.config.enable_visual_detection {
      score += self.score_visual_importance(scene) * 0.4;
    }

    // Audio contribution (30%)
    if self.config.enable_audio_detection {
      score += self.score_audio_importance(scene) * 0.3;
    }

    // Emotional contribution (20%)
    if self.config.enable_emotion_detection {
      score += self.score_emotional_importance(scene) * 0.2;
    }

    // Positional contribution (10%)
    score += self.score_positional_importance(progress) * 0.1;

    score.clamp(0.0, 1.0)
  }

  /// Score visual importance
  fn score_visual_importance(&self, scene: &SceneAnalysis) -> f64 {
    let visual = match &scene.visual {
      Some(v) => v,
      None => return 0.5,
    };

    let mut score = 0.0;

    // Motion level
    score += visual.motion_level * 0.3;

    // Composition quality
    score += visual.composition_score * 0.2;

    // Sharpness (clarity)
    score += visual.sharpness * 0.2;

    // Number of interesting objects
    let object_score = (scene.objects.len().min(10) as f64 / 10.0) * 0.15;
    score += object_score;

    // Key frames indicate interesting visuals
    let keyframe_score = (scene.key_frames.len().min(10) as f64 / 10.0) * 0.15;
    score += keyframe_score;

    score.clamp(0.0, 1.0)
  }

  /// Score audio importance
  fn score_audio_importance(&self, scene: &SceneAnalysis) -> f64 {
    let audio = match &scene.audio {
      Some(a) => a,
      None => return 0.5,
    };

    let mut score = 0.0;

    // Speech presence is important
    if audio.has_speech {
      score += 0.3;
    }

    // Music presence
    if audio.has_music {
      score += 0.2;
    }

    // Volume level (normalized 0-1)
    score += audio.volume_level * 0.25;

    // Audio clarity
    score += audio.clarity * 0.25;

    score.clamp(0.0, 1.0)
  }

  /// Score emotional importance
  fn score_emotional_importance(&self, scene: &SceneAnalysis) -> f64 {
    if scene.description.is_none() {
      return 0.5;
    }

    // In real implementation, we would use AI to detect emotional content
    // For now, use heuristics based on scene type

    match scene.scene_type {
      crate::analysis::types::unified_types::SceneType::Action => 0.8,
      crate::analysis::types::unified_types::SceneType::Dialog => 0.7,
      crate::analysis::types::unified_types::SceneType::Transition => 0.3,
      crate::analysis::types::unified_types::SceneType::Establishing => 0.4,
      crate::analysis::types::unified_types::SceneType::Ending => 0.9,
      _ => 0.5,
    }
  }

  /// Score based on position in scene
  fn score_positional_importance(&self, progress: f64) -> f64 {
    // Beginning and end of scenes are usually more important
    if !(0.2..=0.8).contains(&progress) {
      0.8
    } else {
      0.5
    }
  }

  // ========================================================================
  // MOMENT CREATION
  // ========================================================================

  /// Create a key moment
  fn create_moment(
    &self,
    scene: &SceneAnalysis,
    timestamp: f64,
    importance: f64,
    _index: usize,
  ) -> Result<KeyMoment> {
    let moment_type = self.determine_moment_type(scene, timestamp);

    let duration = self
      .calculate_moment_duration(scene, timestamp, importance)
      .clamp(self.config.min_duration, self.config.max_duration);

    let description = self.generate_description(scene, &moment_type, timestamp, importance);

    let visual_score = self.score_visual_importance(scene);
    let audio_score = self.score_audio_importance(scene);
    let emotion_score = self.score_emotional_importance(scene);

    // Create detailed scoring
    let scoring = MomentScoring {
      emotion_intensity: emotion_score,
      emotion_variety: emotion_score * 0.8,  // Estimate
      emotional_change: emotion_score * 0.7, // Estimate
      visual_quality: visual_score,
      composition_quality: scene
        .visual
        .as_ref()
        .map(|v| v.composition_score)
        .unwrap_or(0.5),
      motion_interest: scene.visual.as_ref().map(|v| v.motion_level).unwrap_or(0.5),
      audio_clarity: scene.audio.as_ref().map(|a| a.clarity).unwrap_or(0.5),
      audio_dynamics: audio_score,
      music_sync: if scene.audio.as_ref().map(|a| a.has_music).unwrap_or(false) {
        0.8
      } else {
        0.3
      },
      person_prominence: if scene.persons.is_empty() { 0.3 } else { 0.7 },
      scene_uniqueness: scene.confidence,
      confidence: importance,
    };

    Ok(KeyMoment {
      id: Uuid::new_v4().to_string(),
      file_id: scene.file_id.clone(),
      timestamp,
      duration,
      moment_type,
      importance_score: importance,
      scoring,
      description,
      thumbnail_timestamp: timestamp,
      persons: scene.persons.clone(),
      tags: self.generate_tags(scene),
    })
  }

  /// Determine moment type
  fn determine_moment_type(&self, scene: &SceneAnalysis, _timestamp: f64) -> MomentType {
    // Use scene type as primary indicator
    match scene.scene_type {
      crate::analysis::types::unified_types::SceneType::Action => MomentType::ActionClimax,
      crate::analysis::types::unified_types::SceneType::Dialog => MomentType::DialogueHighlight,
      crate::analysis::types::unified_types::SceneType::Landscape => MomentType::VisualStunning,
      crate::analysis::types::unified_types::SceneType::Closeup => MomentType::EmotionalPeak,
      crate::analysis::types::unified_types::SceneType::Establishing => MomentType::VisualStunning,
      crate::analysis::types::unified_types::SceneType::Ending => MomentType::Highlight,
      _ => {
        // Use audio/visual characteristics
        if let Some(audio) = &scene.audio {
          if audio.has_speech {
            return MomentType::DialogueHighlight;
          }
          if audio.has_music {
            return MomentType::MusicSync;
          }
        }

        if let Some(visual) = &scene.visual {
          if visual.motion_level > 0.7 {
            return MomentType::ActionClimax;
          }
        }

        MomentType::UserDefined
      }
    }
  }

  /// Calculate moment duration
  fn calculate_moment_duration(
    &self,
    scene: &SceneAnalysis,
    timestamp: f64,
    importance: f64,
  ) -> f64 {
    // Base duration on importance
    let base_duration = 2.0 + (importance * 3.0); // 2-5 seconds

    // Adjust based on scene characteristics
    let mut duration = base_duration;

    if let Some(audio) = &scene.audio {
      if audio.has_speech {
        duration += 1.0; // Speech needs more time
      }
    }

    // Ensure we don't exceed scene boundaries
    let remaining = scene.end_time - timestamp;
    duration.min(remaining).max(self.config.min_duration)
  }

  /// Generate moment description
  fn generate_description(
    &self,
    scene: &SceneAnalysis,
    moment_type: &MomentType,
    timestamp: f64,
    importance: f64,
  ) -> String {
    let type_str = format!("{:?}", moment_type);
    let importance_pct = (importance * 100.0) as u32;

    let mut parts = vec![
      format!("{} moment", type_str),
      format!("{}% importance", importance_pct),
      format!("at {:.1}s", timestamp),
    ];

    if !scene.persons.is_empty() {
      parts.push(format!("{} person(s)", scene.persons.len()));
    }

    if let Some(audio) = &scene.audio {
      if audio.has_speech {
        parts.push("with speech".to_string());
      }
      if audio.has_music {
        parts.push("with music".to_string());
      }
    }

    parts.join(", ")
  }

  /// Generate tags for moment
  fn generate_tags(&self, scene: &SceneAnalysis) -> Vec<String> {
    let mut tags = Vec::new();

    // Scene type tag
    tags.push(format!("{:?}", scene.scene_type));

    // Audio tags
    if let Some(audio) = &scene.audio {
      if audio.has_speech {
        tags.push("speech".to_string());
      }
      if audio.has_music {
        tags.push("music".to_string());
      }
    }

    // Visual tags
    if let Some(visual) = &scene.visual {
      if !scene.persons.is_empty() {
        tags.push("people".to_string());
      }
      if visual.motion_level > 0.7 {
        tags.push("high-motion".to_string());
      }
    }

    // Object tags
    for object in &scene.objects {
      if !tags.contains(object) {
        tags.push(object.clone());
      }
    }

    tags
  }
}

impl Default for MomentEngine {
  fn default() -> Self {
    Self::new()
  }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
  use super::*;
  use crate::analysis::types::unified_types::SceneType;

  fn create_test_scene() -> SceneAnalysis {
    SceneAnalysis {
      id: "test-scene".to_string(),
      file_id: "test-file".to_string(),
      start_time: 0.0,
      end_time: 30.0,
      duration: 30.0,
      scene_type: SceneType::Action,
      confidence: 0.9,
      key_frames: vec![0.0, 10.0, 20.0],
      description: Some("Test action scene".to_string()),
      visual: Some(VisualCharacteristics {
        dominant_colors: Vec::new(),
        brightness: 0.7,
        contrast: 0.8,
        saturation: 0.6,
        motion_level: 0.8,
        composition_score: 0.75,
        sharpness: 0.85,
        noise_level: 0.2,
      }),
      audio: Some(AudioCharacteristics {
        has_speech: true,
        has_music: false,
        volume_level: 0.7,
        clarity: 0.8,
        dominant_frequencies: vec![440.0, 880.0],
      }),
      objects: vec!["person".to_string(), "car".to_string()],
      persons: vec!["person1".to_string()],
      transition: None,
    }
  }

  #[test]
  fn test_engine_creation() {
    let engine = MomentEngine::new();
    assert_eq!(engine.config.importance_threshold, 0.7);
    assert_eq!(engine.config.max_moments_per_scene, 5);
  }

  #[test]
  fn test_config_builder() {
    let config = MomentEngine::builder()
      .importance_threshold(0.8)
      .max_moments_per_scene(3)
      .duration_range(1.5, 8.0)
      .enable_audio(true)
      .build();

    assert_eq!(config.importance_threshold, 0.8);
    assert_eq!(config.max_moments_per_scene, 3);
    assert_eq!(config.min_duration, 1.5);
    assert_eq!(config.max_duration, 8.0);
  }

  #[tokio::test]
  async fn test_moment_detection() {
    let engine = MomentEngine::builder()
      .importance_threshold(0.5) // Lower threshold for testing
      .build();
    let engine = MomentEngine::with_config(engine);

    let scenes = vec![create_test_scene()];
    let moments = engine.detect_moments(&scenes).await.unwrap();

    assert!(!moments.is_empty(), "Should detect at least one moment");
    assert!(
      moments[0].importance_score >= 0.5,
      "Moments should meet threshold"
    );
  }

  #[test]
  fn test_moment_count_calculation() {
    let engine = MomentEngine::new();

    let mut scene = create_test_scene();

    // Short scene
    scene.duration = 5.0;
    assert_eq!(engine.calculate_moment_count(&scene), 1);

    // Medium scene
    scene.duration = 20.0;
    assert_eq!(engine.calculate_moment_count(&scene), 2);

    // Long scene
    scene.duration = 45.0;
    assert_eq!(engine.calculate_moment_count(&scene), 3);

    // Very long scene with many keyframes
    scene.duration = 90.0;
    scene.key_frames = vec![0.0; 10];
    assert!(engine.calculate_moment_count(&scene) <= 5); // Respects max
  }

  #[test]
  fn test_visual_scoring() {
    let engine = MomentEngine::new();
    let scene = create_test_scene();

    let score = engine.score_visual_importance(&scene);
    assert!(score > 0.0 && score <= 1.0);
    assert!(score > 0.5, "Action scene with faces should score high");
  }

  #[test]
  fn test_audio_scoring() {
    let engine = MomentEngine::new();
    let scene = create_test_scene();

    let score = engine.score_audio_importance(&scene);
    assert!(score > 0.0 && score <= 1.0);
    assert!(score > 0.4, "Scene with speech should score well");
  }

  #[test]
  fn test_moment_type_determination() {
    let engine = MomentEngine::new();
    let mut scene = create_test_scene();

    scene.scene_type = SceneType::Action;
    let moment_type = engine.determine_moment_type(&scene, 10.0);
    assert!(matches!(moment_type, MomentType::ActionClimax));

    scene.scene_type = SceneType::Dialog;
    let moment_type = engine.determine_moment_type(&scene, 10.0);
    assert!(matches!(moment_type, MomentType::DialogueHighlight));
  }
}
