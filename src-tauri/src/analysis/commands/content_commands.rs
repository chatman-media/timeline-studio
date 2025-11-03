//! Content Commands - Tauri API for Content Engine
//!
//! Provides Tauri commands for:
//! - Content classification (categories, genres, themes)
//! - Composition analysis (visual quality, balance)
//! - Mood analysis
//! - Quality scoring

use crate::analysis::engines::content_engine::{
    CompositionScore, CompositionWeights, ContentClassification, ContentEngine,
    ContentEngineConfig, MoodAnalysis, QualityScore,
};
use crate::analysis::types::unified_types::{SceneAnalysis, VisualCharacteristics};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/// Global ContentEngine state
pub struct ContentEngineState {
    engine: Arc<RwLock<ContentEngine>>,
}

impl ContentEngineState {
    pub fn new() -> Self {
        Self {
            engine: Arc::new(RwLock::new(ContentEngine::new())),
        }
    }

    pub fn with_config(config: ContentEngineConfig) -> Self {
        Self {
            engine: Arc::new(RwLock::new(ContentEngine::with_config(config))),
        }
    }
}

impl Default for ContentEngineState {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/// Content Engine configuration for Tauri commands
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ContentConfigDto {
    pub enable_classification: bool,
    pub enable_composition: bool,
    pub enable_mood: bool,
    pub enable_quality: bool,
    pub confidence_threshold: f64,
}

impl ContentConfigDto {
    fn to_engine_config(&self) -> ContentEngineConfig {
        ContentEngineConfig {
            enable_classification: self.enable_classification,
            enable_composition: self.enable_composition,
            enable_mood: self.enable_mood,
            enable_quality: self.enable_quality,
            confidence_threshold: self.confidence_threshold,
        }
    }
}

impl Default for ContentConfigDto {
    fn default() -> Self {
        let config = ContentEngineConfig::default();
        Self {
            enable_classification: config.enable_classification,
            enable_composition: config.enable_composition,
            enable_mood: config.enable_mood,
            enable_quality: config.enable_quality,
            confidence_threshold: config.confidence_threshold,
        }
    }
}

// ============================================================================
// COMMANDS
// ============================================================================

/// Configure Content Engine
#[tauri::command]
#[specta::specta]
pub async fn configure_content_engine(
    config: ContentConfigDto,
    state: State<'_, ContentEngineState>,
) -> Result<String, String> {
    log::info!("Configuring Content Engine: {:?}", config);

    let engine_config = config.to_engine_config();
    let mut engine_lock = state.engine.write().await;
    *engine_lock = ContentEngine::with_config(engine_config);

    log::info!("Content Engine configured successfully");
    Ok("Content Engine configured".to_string())
}

/// Set composition weights
#[tauri::command]
#[specta::specta]
pub async fn set_composition_weights(
    weights: CompositionWeights,
    state: State<'_, ContentEngineState>,
) -> Result<String, String> {
    log::info!("Setting composition weights: {:?}", weights);

    let mut engine_lock = state.engine.write().await;
    *engine_lock = ContentEngine::with_weights(weights);

    Ok("Composition weights set".to_string())
}

// ============================================================================
// CONTENT CLASSIFICATION
// ============================================================================

/// Classify content from scenes
#[tauri::command]
#[specta::specta]
pub async fn classify_content(
    scenes: Vec<SceneAnalysis>,
    state: State<'_, ContentEngineState>,
) -> Result<ContentClassification, String> {
    log::info!("Classifying content from {} scenes", scenes.len());

    let engine = state.engine.read().await;
    let classification = engine
        .classify_content(&scenes)
        .await
        .map_err(|e| format!("Failed to classify content: {}", e))?;

    log::info!(
        "Content classified: {} ({})",
        classification.primary_category,
        classification.genre
    );
    Ok(classification)
}

// ============================================================================
// COMPOSITION ANALYSIS
// ============================================================================

/// Analyze composition for visual characteristics
#[tauri::command]
#[specta::specta]
pub async fn analyze_composition(
    visual: VisualCharacteristics,
    state: State<'_, ContentEngineState>,
) -> Result<CompositionScore, String> {
    log::debug!("Analyzing composition");

    let engine = state.engine.read().await;
    let score = engine
        .analyze_composition(&visual)
        .await
        .map_err(|e| format!("Failed to analyze composition: {}", e))?;

    log::debug!("Composition score: {:.2}", score.overall);
    Ok(score)
}

/// Analyze composition for multiple scenes
#[tauri::command]
#[specta::specta]
pub async fn analyze_scenes_composition(
    scenes: Vec<SceneAnalysis>,
    state: State<'_, ContentEngineState>,
) -> Result<Vec<CompositionScore>, String> {
    log::info!("Analyzing composition for {} scenes", scenes.len());

    let engine = state.engine.read().await;
    let mut scores = Vec::new();

    for scene in scenes {
        if let Some(visual) = scene.visual {
            match engine.analyze_composition(&visual).await {
                Ok(score) => scores.push(score),
                Err(e) => {
                    log::warn!("Failed to analyze composition for scene {}: {}", scene.id, e);
                }
            }
        }
    }

    log::info!("Analyzed {} compositions", scores.len());
    Ok(scores)
}

// ============================================================================
// MOOD ANALYSIS
// ============================================================================

/// Analyze mood from scenes
#[tauri::command]
#[specta::specta]
pub async fn analyze_mood(
    scenes: Vec<SceneAnalysis>,
    state: State<'_, ContentEngineState>,
) -> Result<MoodAnalysis, String> {
    log::info!("Analyzing mood from {} scenes", scenes.len());

    let engine = state.engine.read().await;
    let mood = engine
        .analyze_mood(&scenes)
        .await
        .map_err(|e| format!("Failed to analyze mood: {}", e))?;

    log::info!("Mood analyzed: {} (energy: {:.2})", mood.mood, mood.energy_level);
    Ok(mood)
}

// ============================================================================
// QUALITY SCORING
// ============================================================================

/// Calculate quality score from scenes
#[tauri::command]
#[specta::specta]
pub async fn calculate_quality(
    scenes: Vec<SceneAnalysis>,
    state: State<'_, ContentEngineState>,
) -> Result<QualityScore, String> {
    log::info!("Calculating quality for {} scenes", scenes.len());

    let engine = state.engine.read().await;
    let quality = engine
        .calculate_quality(&scenes)
        .await
        .map_err(|e| format!("Failed to calculate quality: {}", e))?;

    log::info!("Quality calculated: overall {:.2}", quality.overall);
    Ok(quality)
}

// ============================================================================
// COMPREHENSIVE ANALYSIS
// ============================================================================

/// Comprehensive content analysis result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ComprehensiveAnalysis {
    pub classification: ContentClassification,
    pub mood: MoodAnalysis,
    pub quality: QualityScore,
    pub average_composition: CompositionScore,
}

/// Perform comprehensive content analysis
#[tauri::command]
#[specta::specta]
pub async fn analyze_content_comprehensive(
    scenes: Vec<SceneAnalysis>,
    state: State<'_, ContentEngineState>,
) -> Result<ComprehensiveAnalysis, String> {
    log::info!("Performing comprehensive content analysis for {} scenes", scenes.len());

    let engine = state.engine.read().await;

    // Run all analyses
    let classification = engine
        .classify_content(&scenes)
        .await
        .map_err(|e| format!("Classification failed: {}", e))?;

    let mood = engine
        .analyze_mood(&scenes)
        .await
        .map_err(|e| format!("Mood analysis failed: {}", e))?;

    let quality = engine
        .calculate_quality(&scenes)
        .await
        .map_err(|e| format!("Quality calculation failed: {}", e))?;

    // Calculate average composition
    let mut total_composition = CompositionScore::default();
    let mut count = 0;

    for scene in &scenes {
        if let Some(visual) = &scene.visual {
            if let Ok(score) = engine.analyze_composition(visual).await {
                total_composition.overall += score.overall;
                total_composition.rule_of_thirds += score.rule_of_thirds;
                total_composition.balance += score.balance;
                total_composition.focus_clarity += score.focus_clarity;
                total_composition.symmetry += score.symmetry;
                count += 1;
            }
        }
    }

    if count > 0 {
        let count_f = count as f64;
        total_composition.overall /= count_f;
        total_composition.rule_of_thirds /= count_f;
        total_composition.balance /= count_f;
        total_composition.focus_clarity /= count_f;
        total_composition.symmetry /= count_f;
    }

    log::info!("Comprehensive analysis complete");

    Ok(ComprehensiveAnalysis {
        classification,
        mood,
        quality,
        average_composition: total_composition,
    })
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
            description: Some("Test scene".to_string()),
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
    fn test_state_creation() {
        let state = ContentEngineState::new();
        assert!(Arc::strong_count(&state.engine) == 1);
    }

    #[test]
    fn test_config_dto_conversion() {
        let dto = ContentConfigDto::default();
        let config = dto.to_engine_config();
        assert!(config.enable_classification);
        assert!(config.enable_composition);
    }

    // TODO: These tests require full Tauri State<'_, ContentEngineState> environment
    // Commented out until proper test harness is implemented

    // #[tokio::test]
    // async fn test_classify_content_command() ...

    // #[tokio::test]
    // async fn test_analyze_composition_command() ...

    // #[tokio::test]
    // async fn test_comprehensive_analysis() ...
}
