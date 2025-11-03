//! Content Engine - Unified Content Analysis
//!
//! Combines functionality from:
//! - analysis/services/content_classification_engine.rs
//! - montage_planner/services/composition_analyzer.rs
//!
//! Provides comprehensive content analysis including:
//! - Content classification (categories, genres, themes)
//! - Composition analysis (rule of thirds, balance, symmetry)
//! - Visual quality scoring
//! - Mood and sentiment analysis
//! - Platform suitability recommendations

use crate::analysis::types::unified_types::{SceneAnalysis, VisualCharacteristics};
use anyhow::Result;
use log::{debug, info};
use serde::{Deserialize, Serialize};
use specta::Type;

// ============================================================================
// CONFIGURATION
// ============================================================================

/// Content Engine Configuration
#[derive(Debug, Clone)]
pub struct ContentEngineConfig {
  /// Enable content classification
  pub enable_classification: bool,

  /// Enable composition analysis
  pub enable_composition: bool,

  /// Enable mood analysis
  pub enable_mood: bool,

  /// Enable quality scoring
  pub enable_quality: bool,

  /// Minimum confidence threshold
  pub confidence_threshold: f64,
}

impl Default for ContentEngineConfig {
  fn default() -> Self {
    Self {
      enable_classification: true,
      enable_composition: true,
      enable_mood: true,
      enable_quality: true,
      confidence_threshold: 0.6,
    }
  }
}

/// Composition Weights for scoring
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CompositionWeights {
  pub rule_of_thirds: f64,
  pub balance: f64,
  pub focus_clarity: f64,
  pub symmetry: f64,
}

impl Default for CompositionWeights {
  fn default() -> Self {
    Self {
      rule_of_thirds: 0.3,
      balance: 0.25,
      focus_clarity: 0.25,
      symmetry: 0.2,
    }
  }
}

// ============================================================================
// CONTENT ENGINE
// ============================================================================

/// Unified Content Analysis Engine
pub struct ContentEngine {
  config: ContentEngineConfig,
  composition_weights: CompositionWeights,
}

impl ContentEngine {
  /// Create new engine with default configuration
  pub fn new() -> Self {
    Self {
      config: ContentEngineConfig::default(),
      composition_weights: CompositionWeights::default(),
    }
  }

  /// Create with custom configuration
  pub fn with_config(config: ContentEngineConfig) -> Self {
    Self {
      config,
      composition_weights: CompositionWeights::default(),
    }
  }

  /// Create with custom weights
  pub fn with_weights(weights: CompositionWeights) -> Self {
    Self {
      config: ContentEngineConfig::default(),
      composition_weights: weights,
    }
  }

  // ========================================================================
  // CONTENT CLASSIFICATION
  // ========================================================================

  /// Classify content from scene analysis
  pub async fn classify_content(&self, scenes: &[SceneAnalysis]) -> Result<ContentClassification> {
    info!("Classifying content from {} scenes", scenes.len());

    if !self.config.enable_classification {
      return Ok(ContentClassification::default());
    }

    // Analyze scene types to determine overall content type
    let categories = self.determine_categories(scenes);
    let genre = self.determine_genre(scenes);
    let themes = self.extract_themes(scenes);
    let tags = self.generate_content_tags(scenes);

    let confidence = self.calculate_classification_confidence(scenes);

    Ok(ContentClassification {
      primary_category: categories.first().cloned().unwrap_or_default(),
      categories,
      genre,
      themes,
      tags,
      confidence,
    })
  }

  /// Determine content categories
  fn determine_categories(&self, scenes: &[SceneAnalysis]) -> Vec<String> {
    let mut categories = Vec::new();

    // Count scene types
    let mut action_count = 0;
    let mut dialog_count = 0;
    let mut visual_count = 0;

    for scene in scenes {
      match scene.scene_type {
        crate::analysis::types::unified_types::SceneType::Action => action_count += 1,
        crate::analysis::types::unified_types::SceneType::Dialog => dialog_count += 1,
        crate::analysis::types::unified_types::SceneType::Landscape
        | crate::analysis::types::unified_types::SceneType::Establishing => visual_count += 1,
        _ => {}
      }
    }

    let total = scenes.len() as f64;
    if action_count as f64 / total > 0.3 {
      categories.push("Action".to_string());
    }
    if dialog_count as f64 / total > 0.3 {
      categories.push("Dialog-Heavy".to_string());
    }
    if visual_count as f64 / total > 0.3 {
      categories.push("Visual".to_string());
    }

    if categories.is_empty() {
      categories.push("General".to_string());
    }

    categories
  }

  /// Determine genre
  fn determine_genre(&self, scenes: &[SceneAnalysis]) -> String {
    // Simple heuristic - can be enhanced with AI
    let has_music = scenes
      .iter()
      .filter(|s| s.audio.as_ref().map(|a| a.has_music).unwrap_or(false))
      .count();

    let has_speech = scenes
      .iter()
      .filter(|s| s.audio.as_ref().map(|a| a.has_speech).unwrap_or(false))
      .count();

    let high_motion = scenes
      .iter()
      .filter(|s| {
        s.visual
          .as_ref()
          .map(|v| v.motion_level > 0.7)
          .unwrap_or(false)
      })
      .count();

    if high_motion > scenes.len() / 2 {
      "Action".to_string()
    } else if has_music > has_speech {
      "Music Video".to_string()
    } else if has_speech > scenes.len() / 2 {
      "Documentary/Vlog".to_string()
    } else {
      "General".to_string()
    }
  }

  /// Extract themes
  fn extract_themes(&self, scenes: &[SceneAnalysis]) -> Vec<String> {
    let mut themes = Vec::new();

    // Extract from descriptions
    for scene in scenes {
      if let Some(desc) = &scene.description {
        // Simple keyword extraction
        if desc.contains("nature") || desc.contains("landscape") {
          themes.push("Nature".to_string());
        }
        if desc.contains("urban") || desc.contains("city") {
          themes.push("Urban".to_string());
        }
        if desc.contains("people") || desc.contains("person") {
          themes.push("People".to_string());
        }
      }
    }

    themes.sort();
    themes.dedup();
    themes
  }

  /// Generate content tags
  fn generate_content_tags(&self, scenes: &[SceneAnalysis]) -> Vec<String> {
    let mut tags = Vec::new();

    for scene in scenes {
      // Add object tags
      tags.extend(scene.objects.clone());

      // Add scene type tags
      tags.push(format!("{:?}", scene.scene_type));
    }

    tags.sort();
    tags.dedup();
    tags.truncate(20); // Limit to top 20 tags
    tags
  }

  /// Calculate classification confidence
  fn calculate_classification_confidence(&self, scenes: &[SceneAnalysis]) -> f64 {
    if scenes.is_empty() {
      return 0.0;
    }

    let avg_confidence: f64 =
      scenes.iter().map(|s| s.confidence).sum::<f64>() / scenes.len() as f64;
    avg_confidence
  }

  // ========================================================================
  // COMPOSITION ANALYSIS
  // ========================================================================

  /// Analyze composition quality
  pub async fn analyze_composition(
    &self,
    visual: &VisualCharacteristics,
  ) -> Result<CompositionScore> {
    if !self.config.enable_composition {
      return Ok(CompositionScore::default());
    }

    debug!("Analyzing composition");

    // Rule of thirds score (use composition_score as proxy)
    let rule_of_thirds = visual.composition_score;

    // Balance score (use saturation and brightness balance)
    let balance = (visual.brightness + visual.saturation) / 2.0;

    // Focus clarity (use sharpness)
    let focus_clarity = visual.sharpness;

    // Symmetry (estimate from contrast)
    let symmetry = visual.contrast;

    // Calculate overall score
    let overall = (rule_of_thirds * self.composition_weights.rule_of_thirds)
      + (balance * self.composition_weights.balance)
      + (focus_clarity * self.composition_weights.focus_clarity)
      + (symmetry * self.composition_weights.symmetry);

    Ok(CompositionScore {
      overall,
      rule_of_thirds,
      balance,
      focus_clarity,
      symmetry,
    })
  }

  // ========================================================================
  // MOOD ANALYSIS
  // ========================================================================

  /// Analyze mood from scenes
  pub async fn analyze_mood(&self, scenes: &[SceneAnalysis]) -> Result<MoodAnalysis> {
    if !self.config.enable_mood {
      return Ok(MoodAnalysis::default());
    }

    info!("Analyzing mood from {} scenes", scenes.len());

    // Aggregate visual characteristics
    let avg_brightness = scenes
      .iter()
      .filter_map(|s| s.visual.as_ref())
      .map(|v| v.brightness)
      .sum::<f64>()
      / scenes.len() as f64;

    let avg_saturation = scenes
      .iter()
      .filter_map(|s| s.visual.as_ref())
      .map(|v| v.saturation)
      .sum::<f64>()
      / scenes.len() as f64;

    let avg_motion = scenes
      .iter()
      .filter_map(|s| s.visual.as_ref())
      .map(|v| v.motion_level)
      .sum::<f64>()
      / scenes.len() as f64;

    // Determine mood
    let mood = if avg_motion > 0.7 {
      "Energetic".to_string()
    } else if avg_brightness > 0.7 && avg_saturation > 0.6 {
      "Uplifting".to_string()
    } else if avg_brightness < 0.3 {
      "Moody/Dark".to_string()
    } else if avg_saturation < 0.3 {
      "Calm/Minimal".to_string()
    } else {
      "Neutral".to_string()
    };

    let energy_level = avg_motion;
    let emotional_intensity = avg_saturation;

    let confidence = self.calculate_classification_confidence(scenes);

    Ok(MoodAnalysis {
      mood,
      energy_level,
      emotional_intensity,
      confidence,
    })
  }

  // ========================================================================
  // QUALITY SCORING
  // ========================================================================

  /// Calculate overall quality score
  pub async fn calculate_quality(&self, scenes: &[SceneAnalysis]) -> Result<QualityScore> {
    if !self.config.enable_quality {
      return Ok(QualityScore::default());
    }

    if scenes.is_empty() {
      return Ok(QualityScore::default());
    }

    // Visual quality
    let visual_quality = scenes
      .iter()
      .filter_map(|s| s.visual.as_ref())
      .map(|v| (v.sharpness + v.contrast + v.brightness) / 3.0)
      .sum::<f64>()
      / scenes.len() as f64;

    // Audio quality
    let audio_quality = scenes
      .iter()
      .filter_map(|s| s.audio.as_ref())
      .map(|a| (a.clarity + a.volume_level) / 2.0)
      .sum::<f64>()
      / scenes.len() as f64;

    // Composition quality (average composition scores)
    let composition_quality = scenes
      .iter()
      .filter_map(|s| s.visual.as_ref())
      .map(|v| v.composition_score)
      .sum::<f64>()
      / scenes.len() as f64;

    // Overall quality
    let overall = (visual_quality * 0.4) + (audio_quality * 0.3) + (composition_quality * 0.3);

    Ok(QualityScore {
      overall,
      visual: visual_quality,
      audio: audio_quality,
      composition: composition_quality,
    })
  }
}

impl Default for ContentEngine {
  fn default() -> Self {
    Self::new()
  }
}

// ============================================================================
// TYPES
// ============================================================================

/// Content Classification Result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ContentClassification {
  pub primary_category: String,
  pub categories: Vec<String>,
  pub genre: String,
  pub themes: Vec<String>,
  pub tags: Vec<String>,
  pub confidence: f64,
}

impl Default for ContentClassification {
  fn default() -> Self {
    Self {
      primary_category: "General".to_string(),
      categories: vec!["General".to_string()],
      genre: "General".to_string(),
      themes: Vec::new(),
      tags: Vec::new(),
      confidence: 0.5,
    }
  }
}

/// Composition Score
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CompositionScore {
  pub overall: f64,
  pub rule_of_thirds: f64,
  pub balance: f64,
  pub focus_clarity: f64,
  pub symmetry: f64,
}

impl Default for CompositionScore {
  fn default() -> Self {
    Self {
      overall: 0.5,
      rule_of_thirds: 0.5,
      balance: 0.5,
      focus_clarity: 0.5,
      symmetry: 0.5,
    }
  }
}

/// Mood Analysis Result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MoodAnalysis {
  pub mood: String,
  pub energy_level: f64,
  pub emotional_intensity: f64,
  pub confidence: f64,
}

impl Default for MoodAnalysis {
  fn default() -> Self {
    Self {
      mood: "Neutral".to_string(),
      energy_level: 0.5,
      emotional_intensity: 0.5,
      confidence: 0.5,
    }
  }
}

/// Quality Score
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct QualityScore {
  pub overall: f64,
  pub visual: f64,
  pub audio: f64,
  pub composition: f64,
}

impl Default for QualityScore {
  fn default() -> Self {
    Self {
      overall: 0.5,
      visual: 0.5,
      audio: 0.5,
      composition: 0.5,
    }
  }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
  use super::*;
  use crate::analysis::types::unified_types::{AudioCharacteristics, SceneType};

  fn create_test_scene() -> SceneAnalysis {
    SceneAnalysis {
      id: "test-scene".to_string(),
      file_id: "test-file".to_string(),
      start_time: 0.0,
      end_time: 10.0,
      duration: 10.0,
      scene_type: SceneType::Action,
      confidence: 0.9,
      key_frames: vec![0.0, 5.0],
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
        dominant_frequencies: vec![440.0],
      }),
      objects: vec!["person".to_string()],
      persons: vec!["person1".to_string()],
      transition: None,
    }
  }

  #[test]
  fn test_engine_creation() {
    let engine = ContentEngine::new();
    assert!(engine.config.enable_classification);
    assert!(engine.config.enable_composition);
  }

  #[tokio::test]
  async fn test_content_classification() {
    let engine = ContentEngine::new();
    let scenes = vec![create_test_scene()];

    let classification = engine.classify_content(&scenes).await.unwrap();
    assert!(!classification.categories.is_empty());
    assert!(classification.confidence > 0.0);
  }

  #[tokio::test]
  async fn test_composition_analysis() {
    let engine = ContentEngine::new();
    let scene = create_test_scene();
    let visual = scene.visual.unwrap();

    let score = engine.analyze_composition(&visual).await.unwrap();
    assert!(score.overall > 0.0 && score.overall <= 1.0);
  }

  #[tokio::test]
  async fn test_mood_analysis() {
    let engine = ContentEngine::new();
    let scenes = vec![create_test_scene()];

    let mood = engine.analyze_mood(&scenes).await.unwrap();
    assert!(!mood.mood.is_empty());
    assert!(mood.energy_level >= 0.0 && mood.energy_level <= 1.0);
  }

  #[tokio::test]
  async fn test_quality_scoring() {
    let engine = ContentEngine::new();
    let scenes = vec![create_test_scene()];

    let quality = engine.calculate_quality(&scenes).await.unwrap();
    assert!(quality.overall > 0.0 && quality.overall <= 1.0);
    assert!(quality.visual > 0.0);
    assert!(quality.audio > 0.0);
  }
}
