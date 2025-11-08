//! Scene Analysis Commands
//!
//! Tauri commands для взаимодействия с Scene Engine.
//! Предоставляет API для фронтенда для анализа сцен в видео.

use crate::analysis::engines::SceneEngine;
use crate::analysis::services::scene_detector::SceneDetector;
use crate::analysis::types::{SceneAnalysis, TransitionInfo, UnifiedMediaFile};
use anyhow::Result;
use log::{error, info};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

/// Scene Engine State - глобальный state для Scene Engine
pub struct SceneEngineState {
  engine: Arc<RwLock<SceneEngine>>,
}

impl SceneEngineState {
  pub fn new() -> Self {
    Self {
      engine: Arc::new(RwLock::new(SceneEngine::new())),
    }
  }

  pub fn with_engine(engine: SceneEngine) -> Self {
    Self {
      engine: Arc::new(RwLock::new(engine)),
    }
  }
}

impl Default for SceneEngineState {
  fn default() -> Self {
    Self::new()
  }
}

// ============================================================================
// CONFIGURATION COMMANDS
// ============================================================================

/// Scene Analysis Configuration
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SceneAnalysisConfig {
  /// Enable AI classification
  pub enable_ai_classification: bool,

  /// Enable visual analysis
  pub enable_visual_analysis: bool,

  /// Enable audio analysis
  pub enable_audio_analysis: bool,

  /// Enable transition analysis
  pub enable_transition_analysis: bool,

  /// Minimum scene duration (seconds)
  pub min_scene_duration: Option<f32>,

  /// Maximum scene duration (seconds)
  pub max_scene_duration: Option<f32>,

  /// Scene change threshold (0.0-1.0)
  pub scene_change_threshold: Option<f32>,
}

impl Default for SceneAnalysisConfig {
  fn default() -> Self {
    Self {
      enable_ai_classification: true,
      enable_visual_analysis: true,
      enable_audio_analysis: true,
      enable_transition_analysis: true,
      min_scene_duration: None,
      max_scene_duration: None,
      scene_change_threshold: None,
    }
  }
}

/// Configure Scene Engine
///
/// Обновляет конфигурацию Scene Engine с новыми настройками.
#[tauri::command]
#[specta::specta]
pub async fn configure_scene_engine(
  config: SceneAnalysisConfig,
  state: State<'_, SceneEngineState>,
) -> Result<bool, String> {
  info!("Configuring Scene Engine with new settings");

  let mut engine = state.engine.write().await;

  // Create new engine with configuration
  let mut detector = SceneDetector::new();

  if let Some(min_duration) = config.min_scene_duration {
    detector.min_scene_duration = min_duration;
  }
  if let Some(max_duration) = config.max_scene_duration {
    detector.max_scene_duration = max_duration;
  }
  if let Some(threshold) = config.scene_change_threshold {
    detector.scene_change_threshold = threshold;
  }

  let new_engine = SceneEngine::with_detector(detector)
    .with_ai_classification(config.enable_ai_classification)
    .with_visual_analysis(config.enable_visual_analysis)
    .with_audio_analysis(config.enable_audio_analysis)
    .with_transition_analysis(config.enable_transition_analysis);

  *engine = new_engine;

  info!("Scene Engine configured successfully");
  Ok(true)
}

// ============================================================================
// ANALYSIS COMMANDS
// ============================================================================

/// Analyze scenes in a media file
///
/// Главная команда для анализа сцен. Возвращает список всех сцен с детальной информацией.
///
/// # Parameters
/// - `media`: UnifiedMediaFile - информация о медиа файле
///
/// # Returns
/// Vec<SceneAnalysis> - список проанализированных сцен
#[tauri::command]
#[specta::specta]
pub async fn analyze_scenes_command(
  media: UnifiedMediaFile,
  state: State<'_, SceneEngineState>,
) -> Result<Vec<SceneAnalysis>, String> {
  info!(
    "Analyzing scenes for media file: {} ({})",
    media.filename, media.id
  );

  let engine = state.engine.read().await;

  match engine.analyze_scenes(&media).await {
    Ok(scenes) => {
      info!("Scene analysis complete: {} scenes found", scenes.len());
      Ok(scenes)
    }
    Err(e) => {
      error!("Scene analysis failed: {}", e);
      Err(format!("Failed to analyze scenes: {}", e))
    }
  }
}

/// Analyze scenes by file path (convenience command)
///
/// Упрощенная версия analyze_scenes_command для случаев,
/// когда у нас есть только путь к файлу.
///
/// # Parameters
/// - `file_path`: String - путь к медиа файлу
///
/// # Returns
/// Vec<SceneAnalysis> - список проанализированных сцен
#[tauri::command]
#[specta::specta]
pub async fn analyze_scenes_by_path_command(
  file_path: String,
  state: State<'_, SceneEngineState>,
) -> Result<Vec<SceneAnalysis>, String> {
  info!("Analyzing scenes for file: {}", file_path);

  // Create minimal UnifiedMediaFile from path
  let filename = std::path::Path::new(&file_path)
    .file_name()
    .and_then(|n| n.to_str())
    .unwrap_or("unknown")
    .to_string();

  let file_size = std::fs::metadata(&file_path).map(|m| m.len()).unwrap_or(0);

  let media = UnifiedMediaFile {
    id: uuid::Uuid::new_v4().to_string(),
    path: file_path.clone(),
    filename,
    size: file_size as f64,
    media_type: crate::analysis::types::UnifiedMediaType::Video,
    duration: None,
    format: None,
    metadata: None,
    created_at: None,
  };

  analyze_scenes_command(media, state).await
}

/// Analyze transitions between scenes
///
/// Анализирует переходы между последовательными сценами.
///
/// # Parameters
/// - `scenes`: Vec<SceneAnalysis> - список сцен для анализа
///
/// # Returns
/// Vec<TransitionInfo> - информация о переходах
#[tauri::command]
#[specta::specta]
pub async fn analyze_scene_transitions_command(
  scenes: Vec<SceneAnalysis>,
  state: State<'_, SceneEngineState>,
) -> Result<Vec<TransitionInfo>, String> {
  info!("Analyzing transitions between {} scenes", scenes.len());

  let engine = state.engine.read().await;

  match engine.analyze_transitions(&scenes).await {
    Ok(transitions) => {
      info!(
        "Transition analysis complete: {} transitions found",
        transitions.len()
      );
      Ok(transitions)
    }
    Err(e) => {
      error!("Transition analysis failed: {}", e);
      Err(format!("Failed to analyze transitions: {}", e))
    }
  }
}

// ============================================================================
// QUICK ANALYSIS COMMANDS
// ============================================================================

/// Quick scene count estimation
///
/// Быстрая оценка количества сцен без полного анализа.
/// Полезно для предварительного просмотра.
///
/// # Parameters
/// - `file_path`: String - путь к медиа файлу
/// - `min_duration`: f32 - минимальная длительность сцены
///
/// # Returns
/// usize - примерное количество сцен
#[tauri::command]
#[specta::specta]
pub async fn estimate_scene_count_command(
  file_path: String,
  min_duration: Option<f32>,
) -> Result<usize, String> {
  info!("Estimating scene count for: {}", file_path);

  // Get file duration
  let file_size = std::fs::metadata(&file_path)
    .map(|m| m.len())
    .map_err(|e| format!("Failed to read file metadata: {}", e))?;

  // Rough estimation: 1MB ≈ 1 second of video
  let estimated_duration = (file_size as f32 / 1_000_000.0).clamp(10.0, 3600.0);

  let min_scene_duration = min_duration.unwrap_or(2.0);
  let estimated_count = (estimated_duration / min_scene_duration).ceil() as usize;

  info!(
    "Estimated {} scenes (duration: {:.1}s, min scene: {:.1}s)",
    estimated_count, estimated_duration, min_scene_duration
  );

  Ok(estimated_count.max(1))
}

// ============================================================================
// SCENE QUERY COMMANDS
// ============================================================================

/// Scene Query Parameters
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SceneQueryParams {
  /// Filter by scene type
  pub scene_type: Option<String>,

  /// Minimum confidence
  pub min_confidence: Option<f64>,

  /// Minimum duration
  pub min_duration: Option<f64>,

  /// Maximum duration
  pub max_duration: Option<f64>,

  /// Filter by presence of persons
  pub has_persons: Option<bool>,

  /// Filter by presence of objects
  pub has_objects: Option<bool>,

  /// Minimum motion level
  pub min_motion: Option<f64>,

  /// Maximum motion level
  pub max_motion: Option<f64>,
}

/// Filter scenes by query parameters
///
/// Фильтрует список сцен согласно заданным параметрам.
///
/// # Parameters
/// - `scenes`: Vec<SceneAnalysis> - исходный список сцен
/// - `query`: SceneQueryParams - параметры фильтрации
///
/// # Returns
/// Vec<SceneAnalysis> - отфильтрованные сцены
#[tauri::command]
#[specta::specta]
pub async fn filter_scenes_command(
  scenes: Vec<SceneAnalysis>,
  query: SceneQueryParams,
) -> Result<Vec<SceneAnalysis>, String> {
  info!("Filtering {} scenes with query params", scenes.len());

  let filtered: Vec<SceneAnalysis> = scenes
    .into_iter()
    .filter(|scene| {
      // Filter by scene type
      if let Some(ref scene_type) = query.scene_type {
        let scene_type_str = format!("{:?}", scene.scene_type).to_lowercase();
        if !scene_type_str.contains(&scene_type.to_lowercase()) {
          return false;
        }
      }

      // Filter by confidence
      if let Some(min_conf) = query.min_confidence {
        if scene.confidence < min_conf {
          return false;
        }
      }

      // Filter by duration
      if let Some(min_dur) = query.min_duration {
        if scene.duration < min_dur {
          return false;
        }
      }
      if let Some(max_dur) = query.max_duration {
        if scene.duration > max_dur {
          return false;
        }
      }

      // Filter by persons
      if let Some(has_persons) = query.has_persons {
        if has_persons && scene.persons.is_empty() {
          return false;
        }
        if !has_persons && !scene.persons.is_empty() {
          return false;
        }
      }

      // Filter by objects
      if let Some(has_objects) = query.has_objects {
        if has_objects && scene.objects.is_empty() {
          return false;
        }
        if !has_objects && !scene.objects.is_empty() {
          return false;
        }
      }

      // Filter by motion level
      if let (Some(visual), Some(min_motion)) = (&scene.visual, query.min_motion) {
        if visual.motion_level < min_motion {
          return false;
        }
      }
      if let (Some(visual), Some(max_motion)) = (&scene.visual, query.max_motion) {
        if visual.motion_level > max_motion {
          return false;
        }
      }

      true
    })
    .collect();

  info!("Filtered to {} scenes", filtered.len());
  Ok(filtered)
}

// ============================================================================
// STATISTICS COMMANDS
// ============================================================================

/// Scene Analysis Statistics
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SceneStatistics {
  /// Total number of scenes
  pub total_scenes: usize,

  /// Total duration covered
  pub total_duration: f64,

  /// Average scene duration
  pub average_duration: f64,

  /// Shortest scene duration
  pub min_duration: f64,

  /// Longest scene duration
  pub max_duration: f64,

  /// Average confidence
  pub average_confidence: f64,

  /// Scene type distribution
  pub scene_type_distribution: std::collections::HashMap<String, usize>,

  /// Scenes with persons
  pub scenes_with_persons: usize,

  /// Scenes with objects
  pub scenes_with_objects: usize,

  /// Average motion level
  pub average_motion: Option<f64>,
}

/// Get scene analysis statistics
///
/// Вычисляет статистику по результатам анализа сцен.
///
/// # Parameters
/// - `scenes`: Vec<SceneAnalysis> - список сцен
///
/// # Returns
/// SceneStatistics - статистика
#[tauri::command]
#[specta::specta]
pub async fn get_scene_statistics_command(
  scenes: Vec<SceneAnalysis>,
) -> Result<SceneStatistics, String> {
  info!("Calculating statistics for {} scenes", scenes.len());

  if scenes.is_empty() {
    return Ok(SceneStatistics {
      total_scenes: 0,
      total_duration: 0.0,
      average_duration: 0.0,
      min_duration: 0.0,
      max_duration: 0.0,
      average_confidence: 0.0,
      scene_type_distribution: Default::default(),
      scenes_with_persons: 0,
      scenes_with_objects: 0,
      average_motion: None,
    });
  }

  let total_scenes = scenes.len();
  let total_duration: f64 = scenes.iter().map(|s| s.duration).sum();
  let average_duration = total_duration / total_scenes as f64;

  let min_duration = scenes
    .iter()
    .map(|s| s.duration)
    .min_by(|a, b| a.partial_cmp(b).unwrap())
    .unwrap_or(0.0);

  let max_duration = scenes
    .iter()
    .map(|s| s.duration)
    .max_by(|a, b| a.partial_cmp(b).unwrap())
    .unwrap_or(0.0);

  let average_confidence: f64 =
    scenes.iter().map(|s| s.confidence).sum::<f64>() / total_scenes as f64;

  // Scene type distribution
  let mut scene_type_distribution = std::collections::HashMap::new();
  for scene in &scenes {
    let type_str = format!("{:?}", scene.scene_type);
    *scene_type_distribution.entry(type_str).or_insert(0) += 1;
  }

  let scenes_with_persons = scenes.iter().filter(|s| !s.persons.is_empty()).count();
  let scenes_with_objects = scenes.iter().filter(|s| !s.objects.is_empty()).count();

  // Average motion (if visual analysis is available)
  let motion_scenes: Vec<f64> = scenes
    .iter()
    .filter_map(|s| s.visual.as_ref().map(|v| v.motion_level))
    .collect();

  let average_motion = if !motion_scenes.is_empty() {
    Some(motion_scenes.iter().sum::<f64>() / motion_scenes.len() as f64)
  } else {
    None
  };

  let stats = SceneStatistics {
    total_scenes,
    total_duration,
    average_duration,
    min_duration,
    max_duration,
    average_confidence,
    scene_type_distribution,
    scenes_with_persons,
    scenes_with_objects,
    average_motion,
  };

  info!("Statistics calculated successfully");
  Ok(stats)
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
  use super::*;

  // TODO: This test requires full Tauri State<'_, SceneEngineState> environment
  // Commented out until proper test harness is implemented

  // #[tokio::test]
  // async fn test_configure_scene_engine() {
  //     let state = SceneEngineState::new();
  //     let config = SceneAnalysisConfig {
  //         enable_ai_classification: false,
  //         enable_visual_analysis: true,
  //         ..Default::default()
  //     };
  //
  //     let result = configure_scene_engine(config, State::from(&state)).await;
  //     assert!(result.is_ok());
  // }

  #[tokio::test]
  async fn test_estimate_scene_count() {
    // This test requires a real file, so we'll skip it in CI
    // Just test that the function signature is correct
    let result = estimate_scene_count_command("/nonexistent/file.mp4".to_string(), Some(2.0)).await;
    // Should fail because file doesn't exist
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_filter_scenes() {
    let scenes = vec![]; // Empty scenes
    let query = SceneQueryParams {
      scene_type: Some("action".to_string()),
      min_confidence: Some(0.8),
      min_duration: None,
      max_duration: None,
      has_persons: None,
      has_objects: None,
      min_motion: None,
      max_motion: None,
    };

    let result = filter_scenes_command(scenes, query).await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 0);
  }

  #[tokio::test]
  async fn test_get_scene_statistics_empty() {
    let scenes = vec![];
    let result = get_scene_statistics_command(scenes).await;
    assert!(result.is_ok());
    let stats = result.unwrap();
    assert_eq!(stats.total_scenes, 0);
    assert_eq!(stats.total_duration, 0.0);
  }
}
