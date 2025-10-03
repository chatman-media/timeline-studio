//! Tauri commands for Smart Montage Planner module
//!
//! This module provides the Tauri command interface for montage planning functionality.

use crate::command_registry::CommandRegistry;
use crate::montage_planner::services::*;
use crate::montage_planner::types::*;
use crate::recognition::commands::yolo_commands::YoloProcessorState;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{command, Builder, Runtime, State};
use tokio::sync::RwLock;

/// Global state for montage planner services
pub struct MontageState {
  pub composition_analyzer: Arc<RwLock<CompositionAnalyzer>>,
  pub moment_detector: Arc<RwLock<MomentDetector>>,
  pub quality_analyzer: Arc<RwLock<VideoQualityAnalyzer>>,
  pub activity_calculator: Arc<RwLock<ActivityCalculator>>,
  pub emotion_detector: Arc<RwLock<EmotionDetector>>,
  pub plan_generator: Arc<RwLock<PlanGenerator>>,
  pub audio_analyzer: Arc<RwLock<AudioAnalyzer>>,
  pub video_processor: Arc<RwLock<VideoProcessor>>,
}

impl MontageState {
  pub fn new(yolo_state: Arc<RwLock<YoloProcessorState>>) -> Self {
    Self {
      composition_analyzer: Arc::new(RwLock::new(CompositionAnalyzer::new())),
      moment_detector: Arc::new(RwLock::new(MomentDetector::new())),
      quality_analyzer: Arc::new(RwLock::new(VideoQualityAnalyzer::new())),
      activity_calculator: Arc::new(RwLock::new(ActivityCalculator::new())),
      emotion_detector: Arc::new(RwLock::new(EmotionDetector::new())),
      plan_generator: Arc::new(RwLock::new(PlanGenerator::new())),
      audio_analyzer: Arc::new(RwLock::new(AudioAnalyzer::new())),
      video_processor: Arc::new(RwLock::new(VideoProcessor::new(yolo_state))),
    }
  }
}

/// Analyze video file and generate enhanced YOLO results with composition analysis
#[command]
pub async fn analyze_video_composition(
  file_path: String,
  analysis_options: AnalysisOptions,
  montage_state: State<'_, MontageState>,
  _yolo_state: State<'_, YoloProcessorState>,
) -> Result<Vec<CompositionEnhancedDetection>, String> {
  let path = PathBuf::from(&file_path);

  // Validate file exists
  if !path.exists() {
    return Err(format!("File not found: {file_path}"));
  }

  // Check if composition analysis is enabled
  if !analysis_options.enable_composition_analysis {
    return Ok(Vec::new());
  }

  let video_processor = montage_state.video_processor.read().await;
  let composition_analyzer = montage_state.composition_analyzer.read().await;

  // Step 1: Analyze video with YOLO processor
  let yolo_detections = video_processor
    .analyze_video(&path, &analysis_options)
    .await
    .map_err(|e| format!("Video analysis failed: {e}"))?;

  // Step 2: Get video metadata for frame dimensions
  let metadata = video_processor
    .extract_metadata(&path)
    .await
    .map_err(|e| format!("Failed to extract metadata: {e}"))?;

  let frame_width = metadata.width as f32;
  let frame_height = metadata.height as f32;

  // Step 3: Enhance YOLO results with composition analysis
  let mut enhanced_results = Vec::new();
  let quality_analyzer = montage_state.quality_analyzer.read().await;

  for (timestamp, detections) in yolo_detections {
    // Get actual frame quality from metadata
    let frame_quality = match quality_analyzer
      .analyze_frame_quality(&path, timestamp)
      .await
    {
      Ok(analysis) => analysis.overall_quality,
      Err(e) => {
        log::warn!("Failed to analyze frame quality at {timestamp}: {e:?}");
        85.0 // Fallback to reasonable default
      }
    };

    if frame_quality >= analysis_options.quality_threshold {
      match composition_analyzer.analyze_composition(
        &detections,
        timestamp,
        frame_width,
        frame_height,
      ) {
        Ok(enhanced) => enhanced_results.push(enhanced),
        Err(e) => {
          log::warn!("Composition analysis failed for frame at {timestamp}: {e:?}");
        }
      }
    }
  }

  // Step 4: Sort by timestamp and limit if specified
  enhanced_results.sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());

  if let Some(max_moments) = analysis_options.max_moments {
    enhanced_results.truncate(max_moments);
  }

  log::info!(
    "Analyzed video: {} enhanced detections generated",
    enhanced_results.len()
  );

  Ok(enhanced_results)
}

/// Detect key moments in video based on enhanced YOLO analysis
#[command]
pub async fn detect_key_moments(
  enhanced_detections: Vec<CompositionEnhancedDetection>,
  _config: MontageConfig,
  state: tauri::State<'_, MontageState>,
) -> Result<Vec<DetectedMoment>, String> {
  let moment_detector = state.moment_detector.read().await;

  // Convert enhanced detections to montage detections
  let mut montage_detections = Vec::new();

  for detection in &enhanced_detections {
    // Create MontageDetection from CompositionEnhancedDetection
    let montage_detection = MontageDetection {
      timestamp: detection.timestamp,
      detection_type: if detection.original_detections.is_empty() {
        DetectionType::Scene
      } else {
        DetectionType::Combined
      },
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
          visual_importance: detection.visual_importance,
        })
        .collect(),
      faces: Vec::new(), // TODO: Separate faces from objects
      composition_score: detection.composition_score.clone(),
      activity_level: detection.frame_dominance,
      emotional_tone: EmotionalTone::Neutral,
    };
    montage_detections.push(montage_detection);
  }

  // Use the moment detector to detect moments
  let detected_moments = moment_detector
    .detect_moments(&montage_detections)
    .map_err(|e| format!("Moment detection failed: {e:?}"))?;

  Ok(detected_moments)
}

/// Generate montage plan from detected moments
#[command]
pub async fn generate_montage_plan(
  moments: Vec<DetectedMoment>,
  config: MontageConfig,
  source_files: Vec<String>,
  state: tauri::State<'_, MontageState>,
) -> Result<MontagePlan, String> {
  let mut plan_generator = state.plan_generator.write().await;

  // Use the plan generator to create an optimized montage plan
  let generated_plan = plan_generator
    .generate_plan(&moments, &config, &source_files)
    .map_err(|e| format!("Plan generation failed: {e:?}"))?;

  Ok(generated_plan)
}

/// Get analysis progress for long-running operations
#[command]
pub async fn get_analysis_progress(_operation_id: String) -> Result<AnalysisProgress, String> {
  // TODO: Implement progress tracking
  Ok(AnalysisProgress {
    stage: "Analyzing composition".to_string(),
    progress: 75.0,
    current_file: Some("video.mp4".to_string()),
    eta_seconds: Some(30),
    message: "Processing frame analysis...".to_string(),
  })
}

/// Update composition analysis weights
#[command]
pub async fn update_composition_weights(
  weights: CompositionWeights,
  state: tauri::State<'_, MontageState>,
) -> Result<(), String> {
  let mut analyzer = state.composition_analyzer.write().await;
  *analyzer = CompositionAnalyzer::with_weights(weights);
  Ok(())
}

/// Command registry implementation for Montage Planner module
pub struct MontageCommandRegistry;

impl CommandRegistry for MontageCommandRegistry {
  fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
      analyze_video_composition,
      detect_key_moments,
      generate_montage_plan,
      get_analysis_progress,
      update_composition_weights
    ])
  }
}
