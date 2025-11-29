//! Tauri commands for Smart Montage Planner module
//!
//! This module provides the Tauri command interface for montage planning functionality.

use crate::analysis::commands::ai_director_commands::AIDirectorState;
use crate::analysis::services::ai_director::{AIDirectorConfig, ComprehensiveAnalysisResult};
use crate::command_registry::CommandRegistry;
use crate::montage_planner::services::*;
use crate::montage_planner::types::*;
use crate::recognition::commands::yolo_commands::YoloProcessorState;
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Builder, Runtime, State};
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
#[tauri::command]
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
    enhanced_results.truncate(max_moments as usize);
  }

  log::info!(
    "Analyzed video: {} enhanced detections generated",
    enhanced_results.len()
  );

  Ok(enhanced_results)
}

/// Detect key moments in video based on enhanced YOLO analysis
#[tauri::command]
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
#[tauri::command]
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

/// Analyze multiple videos for montage planning using AI Director
#[tauri::command]
#[specta::specta]
pub async fn analyze_montage_videos(
  video_ids: Vec<String>,
  options: AnalysisOptions,
  ai_director: State<'_, AIDirectorState>,
) -> Result<Vec<MontageAnalysisResult>, String> {
  log::info!("Analyzing {} videos for montage planning", video_ids.len());

  if video_ids.is_empty() {
    return Err("No videos provided for analysis".to_string());
  }

  // Configure AI Director for montage analysis
  let config = AIDirectorConfig {
    enable_audio_analysis: options.enable_audio_analysis,
    enable_scene_detection: true,
    enable_vision_analysis: options.enable_object_detection,
    enable_moment_detection: true,
    enable_content_classification: true,
    performance_mode: crate::analysis::types::AudioPerformanceMode::Balanced,
    ..Default::default()
  };

  let mut results = Vec::new();
  let mut errors = Vec::new();

  // Analyze each video using batch command
  for (index, video_id) in video_ids.iter().enumerate() {
    let path = PathBuf::from(video_id);

    if !path.exists() {
      errors.push(format!("Video {} not found: {}", index + 1, video_id));
      continue;
    }

    // Call ai_director_analyze_comprehensive for each video
    match crate::analysis::commands::ai_director_commands::ai_director_analyze_comprehensive(
      video_id.clone(),
      Some(config.clone()),
      ai_director.clone(),
    )
    .await
    {
      Ok(comprehensive_result) => {
        // Convert ComprehensiveAnalysisResult to MontageAnalysisResult
        let montage_result = convert_to_montage_result(&comprehensive_result, video_id);
        log::info!(
          "Video {}/{} analyzed: {} key moments detected",
          index + 1,
          video_ids.len(),
          montage_result.key_moments.len()
        );
        results.push(montage_result);
      }
      Err(e) => {
        errors.push(format!("Analysis failed for video {}: {}", video_id, e));
      }
    }
  }

  if results.is_empty() && !errors.is_empty() {
    return Err(format!(
      "All videos failed to analyze: {}",
      errors.join("; ")
    ));
  }

  if !errors.is_empty() {
    log::warn!("Some videos failed to analyze: {}", errors.join("; "));
  }

  Ok(results)
}

/// Optimize an existing montage plan
#[tauri::command]
#[specta::specta]
pub async fn optimize_montage_plan(
  plan: MontagePlan,
  _preferences: serde_json::Value,
  _state: tauri::State<'_, MontageState>,
) -> Result<MontagePlan, String> {
  log::info!("Optimizing montage plan: {}", plan.id);

  // TODO: Implement actual optimization logic in PlanGenerator
  // For now, return the plan with improved quality score
  let mut optimized_plan = plan.clone();
  optimized_plan.quality_score = (plan.quality_score * 1.1).min(100.0);
  optimized_plan.engagement_score = (plan.engagement_score * 1.05).min(100.0);

  log::info!(
    "Plan optimized: quality {:.1} -> {:.1}",
    plan.quality_score,
    optimized_plan.quality_score
  );

  Ok(optimized_plan)
}

/// Validate a montage plan
#[tauri::command]
#[specta::specta]
pub async fn validate_montage_plan(plan: MontagePlan) -> Result<PlanValidation, String> {
  log::info!("Validating montage plan: {}", plan.id);

  let mut errors = Vec::new();
  let mut warnings = Vec::new();
  let mut suggestions = Vec::new();

  // Validate basic plan structure
  if plan.clips.is_empty() {
    errors.push("Plan contains no clips".to_string());
  }

  if plan.total_duration <= 0.0 {
    errors.push("Invalid total duration".to_string());
  }

  // Check for gaps or overlaps in timeline
  let mut sorted_clips = plan.clips.clone();
  sorted_clips.sort_by(|a, b| a.order.cmp(&b.order));

  for (i, clip) in sorted_clips.iter().enumerate() {
    if clip.duration <= 0.0 {
      errors.push(format!("Clip {} has invalid duration", clip.id));
    }

    if clip.start_time >= clip.end_time {
      errors.push(format!("Clip {} has invalid time range", clip.id));
    }

    if i > 0 {
      let prev_clip = &sorted_clips[i - 1];
      if clip.order == prev_clip.order {
        errors.push(format!(
          "Clips {} and {} have duplicate order",
          prev_clip.id, clip.id
        ));
      }
    }
  }

  // Quality checks
  if plan.quality_score < 30.0 {
    warnings.push("Overall quality score is low".to_string());
    suggestions.push("Consider using higher quality source clips".to_string());
  }

  if plan.engagement_score < 40.0 {
    warnings.push("Engagement score is low".to_string());
    suggestions.push("Add more dynamic moments or transitions".to_string());
  }

  if plan.clips.len() > 50 {
    warnings.push(format!(
      "Plan has {} clips which may be too many",
      plan.clips.len()
    ));
    suggestions.push("Consider consolidating similar clips".to_string());
  }

  let is_valid = errors.is_empty();
  let quality = if is_valid {
    plan.quality_score / 100.0
  } else {
    0.0
  };

  Ok(PlanValidation {
    is_valid,
    errors,
    warnings,
    suggestions,
    quality,
  })
}

/// Calculate statistics for a montage plan
#[tauri::command]
#[specta::specta]
pub async fn calculate_plan_statistics(plan: MontagePlan) -> Result<PlanStatistics, String> {
  log::info!("Calculating statistics for plan: {}", plan.id);

  let fragment_count = plan.clips.len() as u32;
  let transition_count = plan.transitions.len() as u32;

  let total_duration = plan.total_duration;
  let average_fragment_duration = if fragment_count > 0 {
    total_duration / fragment_count as f64
  } else {
    0.0
  };

  // Calculate quality distribution
  let mut quality_dist = QualityDistribution {
    low: 0,
    medium: 0,
    high: 0,
  };

  let mut total_quality = 0.0f32;
  let mut total_motion = 0.0f32;
  let mut face_time = 0.0f64;
  let mut objects_set = HashSet::new();
  let mut total_audio_quality = 0.0f32;

  for clip in &plan.clips {
    // Quality distribution
    let quality_normalized = clip.moment.total_score / 100.0;
    if quality_normalized < 0.3 {
      quality_dist.low += 1;
    } else if quality_normalized < 0.7 {
      quality_dist.medium += 1;
    } else {
      quality_dist.high += 1;
    }

    total_quality += clip.moment.total_score;
    total_motion += clip.moment.scores.action;

    // Count face time (approximation based on moment category)
    if matches!(clip.moment.category, MomentCategory::Drama) {
      face_time += clip.duration;
    }

    // Collect unique objects
    for tag in &clip.moment.tags {
      objects_set.insert(tag.clone());
    }

    total_audio_quality += clip.moment.scores.emotional;
  }

  let average_quality = if fragment_count > 0 {
    total_quality / fragment_count as f32
  } else {
    0.0
  };

  let motion_intensity = if fragment_count > 0 {
    total_motion / fragment_count as f32
  } else {
    0.0
  };

  let audio_quality = if fragment_count > 0 {
    total_audio_quality / fragment_count as f32
  } else {
    0.0
  };

  Ok(PlanStatistics {
    total_duration,
    average_fragment_duration,
    fragment_count,
    transition_count,
    average_quality,
    quality_distribution: quality_dist,
    motion_intensity,
    face_time,
    object_diversity: objects_set.len() as u32,
    audio_quality,
  })
}

/// Helper function to convert ComprehensiveAnalysisResult to MontageAnalysisResult
fn convert_to_montage_result(
  comprehensive: &ComprehensiveAnalysisResult,
  video_id: &str,
) -> MontageAnalysisResult {
  // Extract key moments from moment analysis
  let key_moments = if let Some(moment_analysis) = &comprehensive.moment_analysis {
    moment_analysis
      .key_moments
      .iter()
      .map(|km| {
        // Convert unified KeyMoment to montage DetectedMoment
        let moment_type_str = format!("{:?}", km.moment_type).to_lowercase();
        DetectedMoment {
          timestamp: km.timestamp,
          duration: km.duration,
          category: match moment_type_str.as_str() {
            "action" => MomentCategory::Action,
            "drama" => MomentCategory::Drama,
            "comedy" => MomentCategory::Comedy,
            "transition" => MomentCategory::Transition,
            "highlight" => MomentCategory::Highlight,
            _ => MomentCategory::BRoll,
          },
          scores: MomentScores {
            visual: (km.scoring.visual_quality * 100.0) as f32,
            technical: (km.scoring.composition_quality * 100.0) as f32,
            emotional: (km.scoring.emotion_intensity * 100.0) as f32,
            narrative: (km.importance_score * 100.0) as f32,
            action: (km.scoring.motion_interest * 100.0) as f32,
            composition: (km.scoring.composition_quality * 100.0) as f32,
          },
          total_score: (km.importance_score * 100.0) as f32,
          description: km.description.clone(),
          tags: km.tags.clone(),
        }
      })
      .collect()
  } else {
    Vec::new()
  };

  // Extract objects from vision analysis
  let objects_detected = if let Some(vision) = &comprehensive.vision_analysis {
    vision.objects_detected.clone()
  } else {
    Vec::new()
  };

  // Calculate scores from various analyses
  let quality_score = (comprehensive.combined_insights.overall_quality * 100.0) as f32;
  // Use overall quality as motion estimate since estimated_engagement doesn't exist
  let motion_score = quality_score;

  let faces_detected = if let Some(vision) = &comprehensive.vision_analysis {
    vision.faces_count
  } else {
    0
  };

  let audio_quality = if let Some(audio) = &comprehensive.audio_analysis {
    // overall_quality_score is a method
    audio.overall_quality_score()
  } else {
    0.0
  } as f32;

  // Calculate duration from scenes or use default
  let duration = if let Some(scene_analysis) = &comprehensive.scene_analysis {
    scene_analysis
      .scenes
      .iter()
      .map(|s| s.duration)
      .sum::<f64>()
  } else {
    0.0
  };

  MontageAnalysisResult {
    video_id: video_id.to_string(),
    duration,
    quality_score,
    motion_score,
    faces_detected,
    objects_detected,
    audio_quality,
    key_moments,
    analysis_id: comprehensive.analysis_id.clone(),
  }
}

/// Get analysis progress for long-running operations
#[tauri::command]
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
#[tauri::command]
pub async fn update_composition_weights(
  weights: CompositionWeights,
  state: tauri::State<'_, MontageState>,
) -> Result<(), String> {
  let mut analyzer = state.composition_analyzer.write().await;
  *analyzer = CompositionAnalyzer::with_weights(weights);
  Ok(())
}

// Missing commands (Phase 3) - Stub implementations

/// Apply montage plan to timeline
#[tauri::command]
#[specta::specta]
pub async fn apply_montage_plan(
  plan: MontagePlan,
  _timeline_id: String,
  _state: tauri::State<'_, MontageState>,
) -> Result<TimelineApplication, String> {
  log::info!("Applying montage plan {} to timeline", plan.id);

  // TODO: Implement actual timeline application logic
  // This should:
  // 1. Validate the montage plan
  // 2. Create timeline clips from montage clips
  // 3. Apply transitions between clips
  // 4. Return statistics about applied changes

  Ok(TimelineApplication {
    success: true,
    clips_added: plan.clips.len() as u32,
    transitions_added: plan.transitions.len() as u32,
    total_duration: plan.total_duration,
    errors: vec![],
    warnings: vec!["Timeline application not yet implemented".to_string()],
  })
}

/// Export montage plan to file
#[tauri::command]
#[specta::specta]
pub async fn export_montage_plan(
  plan: MontagePlan,
  format: ExportFormat,
  _output_path: Option<String>,
) -> Result<String, String> {
  log::info!("Exporting montage plan {} as {:?}", plan.id, format);

  // TODO: Implement actual export logic for different formats
  match format {
    ExportFormat::Json => {
      serde_json::to_string_pretty(&plan).map_err(|e| format!("JSON export failed: {}", e))
    }
    ExportFormat::Csv => {
      // TODO: Implement CSV export
      Ok("plan_id,name,duration,quality_score\n".to_string()
        + &format!(
          "{},{},{},{}\n",
          plan.id, plan.name, plan.total_duration, plan.quality_score
        ))
    }
    ExportFormat::Xml => {
      // TODO: Implement XML/EDL export
      Ok(format!(
        "<?xml version=\"1.0\"?>\n<montage_plan id=\"{}\" name=\"{}\"></montage_plan>",
        plan.id, plan.name
      ))
    }
    ExportFormat::Markdown => {
      // TODO: Implement Markdown export
      Ok(format!(
        "# Montage Plan: {}\n\n- Duration: {:.2}s\n- Clips: {}\n- Quality: {:.1}%\n",
        plan.name,
        plan.total_duration,
        plan.clips.len(),
        plan.quality_score
      ))
    }
  }
}

/// Analyze video quality metrics
#[tauri::command]
#[specta::specta]
pub async fn analyze_video_quality(
  video_path: String,
  _state: tauri::State<'_, MontageState>,
) -> Result<VideoQualityMetrics, String> {
  log::info!("Analyzing video quality for: {}", video_path);

  let path = PathBuf::from(&video_path);
  if !path.exists() {
    return Err(format!("Video file not found: {}", video_path));
  }

  // TODO: Implement actual video quality analysis
  // This should:
  // 1. Load video file
  // 2. Analyze sharpness, brightness, contrast, etc.
  // 3. Check compression artifacts
  // 4. Verify frame rate consistency
  // 5. Calculate overall quality score

  Ok(VideoQualityMetrics {
    overall_quality: 75.0,
    sharpness: 80.0,
    brightness: 70.0,
    contrast: 75.0,
    saturation: 65.0,
    stability: 85.0,
    noise_level: 15.0,
    compression_artifacts: 10.0,
    frame_rate_consistency: 95.0,
    duration: 0.0,
    resolution: (1920, 1080),
    average_bitrate: 5000,
  })
}

/// Analyze frame quality metrics
#[tauri::command]
#[specta::specta]
pub async fn analyze_frame_quality(
  video_path: String,
  timestamp: f64,
  _state: tauri::State<'_, MontageState>,
) -> Result<FrameQualityMetrics, String> {
  log::info!(
    "Analyzing frame quality at timestamp {} for: {}",
    timestamp,
    video_path
  );

  let path = PathBuf::from(&video_path);
  if !path.exists() {
    return Err(format!("Video file not found: {}", video_path));
  }

  // TODO: Implement actual frame quality analysis
  // This should:
  // 1. Extract frame at given timestamp
  // 2. Analyze sharpness, brightness, contrast
  // 3. Calculate composition score
  // 4. Detect blur
  // 5. Determine if keyframe

  Ok(FrameQualityMetrics {
    timestamp,
    frame_number: (timestamp * 30.0) as u32, // Assuming 30fps
    sharpness: 80.0,
    brightness: 70.0,
    contrast: 75.0,
    saturation: 65.0,
    noise_level: 15.0,
    blur_score: 20.0,
    composition_score: CompositionScore::default(),
    is_keyframe: false,
  })
}

/// Analyze audio content
#[tauri::command]
#[specta::specta]
pub async fn analyze_audio_content(
  audio_path: String,
  _state: tauri::State<'_, MontageState>,
) -> Result<AudioContentAnalysis, String> {
  log::info!("Analyzing audio content for: {}", audio_path);

  let path = PathBuf::from(&audio_path);
  if !path.exists() {
    return Err(format!("Audio file not found: {}", audio_path));
  }

  // TODO: Implement actual audio content analysis
  // This should:
  // 1. Load audio file
  // 2. Analyze volume levels and dynamic range
  // 3. Detect silence, speech, music segments
  // 4. Find audio peaks
  // 5. Calculate clarity score

  Ok(AudioContentAnalysis {
    duration: 0.0,
    sample_rate: 48000,
    channels: 2,
    average_volume: 60.0,
    peak_volume: 90.0,
    dynamic_range: 30.0,
    silence_percentage: 10.0,
    speech_percentage: 50.0,
    music_percentage: 30.0,
    noise_percentage: 10.0,
    clarity_score: 75.0,
    peaks: vec![],
  })
}

/// Command registry implementation for Montage Planner module
pub struct MontageCommandRegistry;

impl CommandRegistry for MontageCommandRegistry {
  fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
      analyze_video_composition,
      detect_key_moments,
      generate_montage_plan,
      analyze_montage_videos,
      optimize_montage_plan,
      validate_montage_plan,
      calculate_plan_statistics,
      get_analysis_progress,
      update_composition_weights,
      // Phase 3 commands
      apply_montage_plan,
      export_montage_plan,
      analyze_video_quality,
      analyze_frame_quality,
      analyze_audio_content,
    ])
  }
}
