/**
 * AI Director with Events - Версия с поддержкой real-time событий
 *
 * Отправляет progress события через Tauri event system
 */
use anyhow::Result;
use log::{error, info};
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::analysis::database::AnalysisDatabase;
use crate::analysis::services::ai_director::{
  AIDirector, AIDirectorConfig, ComprehensiveAnalysisResult,
};
use crate::core::events::AppEvent;
use crate::recognition::commands::yolo_commands::YoloProcessorState;
use crate::recognition::person_database::PersonDatabase;

/// AI Director с событиями - wrapper для отправки progress events
pub struct AIDirectorWithEvents {
  inner: AIDirector,
  app_handle: AppHandle,
}

impl AIDirectorWithEvents {
  /// Создать новый AI Director с поддержкой событий
  pub fn new(
    _analysis_db: Arc<AnalysisDatabase>,
    _person_db: Arc<PersonDatabase>,
    _yolo_state: Arc<RwLock<YoloProcessorState>>,
    app_handle: AppHandle,
  ) -> Self {
    let inner = AIDirector::new();

    Self { inner, app_handle }
  }

  /// Comprehensive анализ с real-time events
  pub async fn analyze_comprehensive_with_events(
    &self,
    media_path: &Path,
    config_opt: Option<AIDirectorConfig>,
  ) -> Result<ComprehensiveAnalysisResult> {
    let config = config_opt.unwrap_or_default();
    let analysis_id = Uuid::new_v4().to_string();
    let start_time = Instant::now();

    info!(
      "AI Director starting analysis with events: {:?}",
      media_path
    );

    // 1. Emit AnalysisStarted event
    self
      .emit_analysis_started(&analysis_id, media_path, "comprehensive")
      .await;

    // 2. Emit initial progress
    self
      .emit_progress(
        &analysis_id,
        "initialization",
        0.0,
        Some("Initializing analysis..."),
        None,
      )
      .await;

    let mut stage_results = Vec::new();
    let mut total_errors = Vec::new();

    // 3. Audio Analysis Stage
    if config.enable_audio_analysis {
      self
        .emit_progress(
          &analysis_id,
          "audio",
          0.1,
          Some("Starting audio analysis..."),
          Some(120),
        )
        .await;

      let audio_start = Instant::now();
      match self
        .run_audio_stage(media_path, &config, &analysis_id)
        .await
      {
        Ok(_) => {
          let duration = audio_start.elapsed().as_millis() as u64;
          self
            .emit_stage_completed(&analysis_id, "audio", duration, true, None)
            .await;
          stage_results.push("audio".to_string());
          self
            .emit_progress(
              &analysis_id,
              "audio",
              0.3,
              Some("Audio analysis completed"),
              Some(90),
            )
            .await;
        }
        Err(e) => {
          let duration = audio_start.elapsed().as_millis() as u64;
          let error_msg = format!("Audio analysis failed: {}", e);
          self
            .emit_stage_completed(
              &analysis_id,
              "audio",
              duration,
              false,
              Some(error_msg.clone()),
            )
            .await;
          self
            .emit_analysis_error(&analysis_id, "audio", &error_msg)
            .await;
          total_errors.push(error_msg);
        }
      }
    }

    // 4. Video Analysis Stage
    if config.enable_video_analysis {
      self
        .emit_progress(
          &analysis_id,
          "video",
          0.4,
          Some("Starting video analysis..."),
          Some(60),
        )
        .await;

      let video_start = Instant::now();
      match self
        .run_video_stage(media_path, &config, &analysis_id)
        .await
      {
        Ok(_) => {
          let duration = video_start.elapsed().as_millis() as u64;
          self
            .emit_stage_completed(&analysis_id, "video", duration, true, None)
            .await;
          stage_results.push("video".to_string());
          self
            .emit_progress(
              &analysis_id,
              "video",
              0.7,
              Some("Video analysis completed"),
              Some(30),
            )
            .await;
        }
        Err(e) => {
          let duration = video_start.elapsed().as_millis() as u64;
          let error_msg = format!("Video analysis failed: {}", e);
          self
            .emit_stage_completed(
              &analysis_id,
              "video",
              duration,
              false,
              Some(error_msg.clone()),
            )
            .await;
          self
            .emit_analysis_error(&analysis_id, "video", &error_msg)
            .await;
          total_errors.push(error_msg);
        }
      }
    }

    // 5. Integration Stage
    self
      .emit_progress(
        &analysis_id,
        "integration",
        0.8,
        Some("Integrating results..."),
        Some(15),
      )
      .await;

    let integration_start = Instant::now();
    let result = match self
      .inner
      .analyze_media_comprehensive(media_path, Some(config))
      .await
    {
      Ok(mut result) => {
        // Обновляем analysis_id в результате
        result.analysis_id = analysis_id.clone();

        let duration = integration_start.elapsed().as_millis() as u64;
        self
          .emit_stage_completed(&analysis_id, "integration", duration, true, None)
          .await;
        stage_results.push("integration".to_string());

        result
      }
      Err(e) => {
        let duration = integration_start.elapsed().as_millis() as u64;
        let error_msg = format!("Integration failed: {}", e);
        self
          .emit_stage_completed(
            &analysis_id,
            "integration",
            duration,
            false,
            Some(error_msg.clone()),
          )
          .await;
        self
          .emit_analysis_error(&analysis_id, "integration", &error_msg)
          .await;
        total_errors.push(error_msg);

        return Err(e);
      }
    };

    // 6. Final completion
    let total_duration = start_time.elapsed().as_millis() as u64;
    let success = total_errors.is_empty();

    self
      .emit_analysis_completed(
        &analysis_id,
        success,
        total_duration,
        stage_results,
        total_errors.clone(),
      )
      .await;

    if success {
      self
        .emit_progress(
          &analysis_id,
          "complete",
          1.0,
          Some("Analysis completed successfully!"),
          Some(0),
        )
        .await;
    } else {
      self
        .emit_progress(
          &analysis_id,
          "complete",
          1.0,
          Some("Analysis completed with errors"),
          Some(0),
        )
        .await;
    }

    info!(
      "AI Director analysis with events completed: success={}, duration={}ms",
      success, total_duration
    );

    Ok(result)
  }

  /// Быстрый анализ с событиями
  pub async fn analyze_quick_with_events(
    &self,
    media_path: &Path,
  ) -> Result<ComprehensiveAnalysisResult> {
    let config = AIDirectorConfig {
      performance_mode: crate::analysis::types::AudioPerformanceMode::Fast,
      enable_audio_analysis: true,
      enable_video_analysis: false,
      enable_face_analysis: false,
      enable_object_analysis: false,
      enable_emotion_analysis: false,
      enable_composition_analysis: false,
      enable_scene_detection: false,
      enable_mcp_agents: false,
      max_processing_time: Some(30),
      generate_editing_recommendations: false,
      ..Default::default()
    };

    self
      .analyze_comprehensive_with_events(media_path, Some(config))
      .await
  }

  /// 🆕 Phase 2: Batch Analysis с events и детальным прогрессом
  pub async fn analyze_batch_with_events(
    &self,
    file_paths: Vec<String>,
    config_opt: Option<AIDirectorConfig>,
  ) -> Result<Vec<ComprehensiveAnalysisResult>> {
    let batch_id = Uuid::new_v4().to_string();
    let total_files = file_paths.len();
    let batch_start = Instant::now();

    if file_paths.is_empty() {
      return Err(anyhow::anyhow!("No files provided for batch analysis"));
    }

    // Определяем config mode для события
    let config_mode = match &config_opt {
      Some(cfg) => {
        if !cfg.enable_video_analysis {
          "fast"
        } else if cfg.enable_emotion_analysis && cfg.enable_mood_analysis {
          "quality"
        } else {
          "balanced"
        }
      }
      None => "balanced",
    };

    info!(
      "Starting batch analysis: batch_id={}, files={}, mode={}",
      batch_id, total_files, config_mode
    );

    // 1. Emit BatchAnalysisStarted
    self
      .emit_batch_analysis_started(&batch_id, total_files, config_mode)
      .await;

    let mut results = Vec::new();
    let mut errors = Vec::new();
    let mut successful_files = 0;

    // 2. Process each file sequentially
    for (index, file_path) in file_paths.iter().enumerate() {
      let path = std::path::PathBuf::from(file_path);

      if !path.exists() {
        let error_msg = format!("File not found: {}", file_path);
        errors.push(error_msg.clone());
        error!("{}", error_msg);
        continue;
      }

      info!(
        "Batch analysis: processing file {}/{}: {}",
        index + 1,
        total_files,
        file_path
      );

      // Emit progress before analyzing file
      let progress = index as f32 / total_files as f32;
      let remaining_files = total_files - index;
      let avg_time_per_file = if index > 0 {
        batch_start.elapsed().as_secs() / index as u64
      } else {
        60 // initial estimate: 60 seconds per file
      };
      let estimated_time_remaining = avg_time_per_file * remaining_files as u64;

      self
        .emit_batch_analysis_progress(
          &batch_id,
          index,
          total_files,
          progress,
          Some(file_path),
          Some(estimated_time_remaining),
        )
        .await;

      // Analyze the file
      match self
        .analyze_comprehensive_with_events(&path, config_opt.clone())
        .await
      {
        Ok(result) => {
          successful_files += 1;
          results.push(result);
          info!(
            "Batch analysis: file {}/{} completed successfully",
            index + 1,
            total_files
          );
        }
        Err(e) => {
          let error_msg = format!("File {} failed: {}", file_path, e);
          errors.push(error_msg.clone());
          error!("{}", error_msg);
        }
      }
    }

    let failed_files = total_files - successful_files;
    let total_duration = batch_start.elapsed().as_millis() as u64;

    // 3. Emit final progress
    self
      .emit_batch_analysis_progress(&batch_id, total_files, total_files, 1.0, None, Some(0))
      .await;

    // 4. Emit BatchAnalysisCompleted
    self
      .emit_batch_analysis_completed(
        &batch_id,
        total_files,
        successful_files,
        failed_files,
        total_duration,
        errors.clone(),
      )
      .await;

    info!(
      "Batch analysis completed: batch_id={}, successful={}/{}, duration={}ms",
      batch_id, successful_files, total_files, total_duration
    );

    if results.is_empty() && !errors.is_empty() {
      return Err(anyhow::anyhow!(
        "All batch analyses failed: {}",
        errors.join("; ")
      ));
    }

    Ok(results)
  }

  /// Запуск audio stage с прогрессом
  async fn run_audio_stage(
    &self,
    media_path: &Path,
    _config: &AIDirectorConfig,
    analysis_id: &str,
  ) -> Result<()> {
    let file_id = Uuid::new_v4().to_string();
    let file_path = media_path.to_string_lossy().to_string();

    // 🆕 v2: Emit file analysis started
    self
      .emit_file_analysis_started(
        analysis_id,
        &file_id,
        &file_path,
        0, // file_index
        1, // total_files (single file for now)
      )
      .await;

    // Analyzer 1: Audio Quality
    let metadata_start = Instant::now();
    self
      .emit_analyzer_started(
        analysis_id,
        &file_id,
        "audio_quality",
        "Audio Quality Analyzer",
      )
      .await;

    self
      .emit_progress(
        analysis_id,
        "audio",
        0.15,
        Some("Extracting audio metadata..."),
        Some(100),
      )
      .await;

    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    self
      .emit_analyzer_completed(
        analysis_id,
        &file_id,
        "audio_quality",
        metadata_start.elapsed().as_millis() as u64,
        true,
        Some("Audio quality analyzed"),
        None,
      )
      .await;

    // 🆕 v2: Update file progress
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        0.25,
        Some("speech_recognition"),
        vec!["audio_quality".to_string()],
      )
      .await;

    // Analyzer 2: Speech Recognition
    let ffmpeg_start = Instant::now();
    self
      .emit_analyzer_started(
        analysis_id,
        &file_id,
        "speech_recognition",
        "Speech Recognition",
      )
      .await;

    self
      .emit_progress(
        analysis_id,
        "audio",
        0.2,
        Some("Running FFmpeg analysis..."),
        Some(80),
      )
      .await;

    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

    self
      .emit_analyzer_completed(
        analysis_id,
        &file_id,
        "speech_recognition",
        ffmpeg_start.elapsed().as_millis() as u64,
        true,
        Some("Speech recognized"),
        None,
      )
      .await;

    // 🆕 v2: Update file progress
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        0.5,
        Some("moment_detection"),
        vec![
          "audio_quality".to_string(),
          "speech_recognition".to_string(),
        ],
      )
      .await;

    // Analyzer 3: Moment Detection
    let montage_start = Instant::now();
    self
      .emit_analyzer_started(
        analysis_id,
        &file_id,
        "moment_detection",
        "Moment Detection",
      )
      .await;

    self
      .emit_progress(
        analysis_id,
        "audio",
        0.25,
        Some("Processing montage analysis..."),
        Some(60),
      )
      .await;

    tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;

    self
      .emit_analyzer_completed(
        analysis_id,
        &file_id,
        "moment_detection",
        montage_start.elapsed().as_millis() as u64,
        true,
        Some("Moments detected"),
        None,
      )
      .await;

    // 🆕 v2: Update file progress
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        0.9,
        None,
        vec![
          "audio_quality".to_string(),
          "speech_recognition".to_string(),
          "moment_detection".to_string(),
        ],
      )
      .await;

    self
      .emit_progress(
        analysis_id,
        "audio",
        0.28,
        Some("Finalizing audio analysis..."),
        Some(20),
      )
      .await;

    // 🆕 v2: Emit file analysis completed
    self
      .emit_file_analysis_completed(
        analysis_id,
        &file_id,
        metadata_start.elapsed().as_millis() as u64,
        true,
        None,
      )
      .await;

    Ok(())
  }

  /// Запуск video stage с прогрессом
  async fn run_video_stage(
    &self,
    media_path: &Path,
    _config: &AIDirectorConfig,
    analysis_id: &str,
  ) -> Result<()> {
    let file_id = Uuid::new_v4().to_string();
    let file_path = media_path.to_string_lossy().to_string();

    // 🆕 v2: Emit file analysis started
    self
      .emit_file_analysis_started(
        analysis_id,
        &file_id,
        &file_path,
        0, // file_index
        1, // total_files (single file for now)
      )
      .await;

    // Analyzer 1: Scene Detection
    let metadata_start = Instant::now();
    self
      .emit_analyzer_started(analysis_id, &file_id, "scene_detection", "Scene Detection")
      .await;

    self
      .emit_progress(
        analysis_id,
        "video",
        0.45,
        Some("Extracting video metadata..."),
        Some(70),
      )
      .await;

    tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;

    self
      .emit_analyzer_completed(
        analysis_id,
        &file_id,
        "scene_detection",
        metadata_start.elapsed().as_millis() as u64,
        true,
        Some("Scenes detected"),
        None,
      )
      .await;

    // 🆕 v2: Update file progress
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        0.25,
        Some("object_detection"),
        vec!["scene_detection".to_string()],
      )
      .await;

    // Analyzer 2: Object Detection
    let object_start = Instant::now();
    self
      .emit_analyzer_started(
        analysis_id,
        &file_id,
        "object_detection",
        "YOLO Object Detector",
      )
      .await;

    self
      .emit_progress(
        analysis_id,
        "video",
        0.5,
        Some("Running object detection..."),
        Some(50),
      )
      .await;

    tokio::time::sleep(tokio::time::Duration::from_millis(1200)).await;

    self
      .emit_analyzer_completed(
        analysis_id,
        &file_id,
        "object_detection",
        object_start.elapsed().as_millis() as u64,
        true,
        Some("Objects detected"),
        None,
      )
      .await;

    // 🆕 v2: Update file progress
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        0.5,
        Some("composition_analysis"),
        vec![
          "scene_detection".to_string(),
          "object_detection".to_string(),
        ],
      )
      .await;

    // Analyzer 3: Composition Analysis
    let composition_start = Instant::now();
    self
      .emit_analyzer_started(
        analysis_id,
        &file_id,
        "composition_analysis",
        "Composition Analysis",
      )
      .await;

    self
      .emit_progress(
        analysis_id,
        "video",
        0.6,
        Some("Analyzing composition..."),
        Some(30),
      )
      .await;

    tokio::time::sleep(tokio::time::Duration::from_millis(900)).await;

    self
      .emit_analyzer_completed(
        analysis_id,
        &file_id,
        "composition_analysis",
        composition_start.elapsed().as_millis() as u64,
        true,
        Some("Composition analyzed"),
        None,
      )
      .await;

    // 🆕 v2: Update file progress
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        0.75,
        Some("motion_analysis"),
        vec![
          "scene_detection".to_string(),
          "object_detection".to_string(),
          "composition_analysis".to_string(),
        ],
      )
      .await;

    // Analyzer 4: Motion Analysis
    let scene_start = Instant::now();
    self
      .emit_analyzer_started(analysis_id, &file_id, "motion_analysis", "Motion Analysis")
      .await;

    self
      .emit_progress(
        analysis_id,
        "video",
        0.65,
        Some("Detecting scenes..."),
        Some(15),
      )
      .await;

    tokio::time::sleep(tokio::time::Duration::from_millis(400)).await;

    self
      .emit_analyzer_completed(
        analysis_id,
        &file_id,
        "motion_analysis",
        scene_start.elapsed().as_millis() as u64,
        true,
        Some("Motion analyzed"),
        None,
      )
      .await;

    // 🆕 v2: Update file progress to complete
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        1.0,
        None,
        vec![
          "scene_detection".to_string(),
          "object_detection".to_string(),
          "composition_analysis".to_string(),
          "motion_analysis".to_string(),
        ],
      )
      .await;

    // 🆕 v2: Emit file analysis completed
    self
      .emit_file_analysis_completed(
        analysis_id,
        &file_id,
        metadata_start.elapsed().as_millis() as u64,
        true,
        None,
      )
      .await;

    Ok(())
  }

  /// Emit AnalysisStarted event
  async fn emit_analysis_started(&self, analysis_id: &str, media_path: &Path, analysis_type: &str) {
    let event = AppEvent::AnalysisStarted {
      analysis_id: analysis_id.to_string(),
      media_path: media_path.to_string_lossy().to_string(),
      analysis_type: analysis_type.to_string(),
    };

    if let Err(e) = self.app_handle.emit("analysis-started", &event) {
      error!("Failed to emit AnalysisStarted event: {}", e);
    }
  }

  /// Emit AnalysisProgress event
  async fn emit_progress(
    &self,
    analysis_id: &str,
    stage: &str,
    progress: f32,
    message: Option<&str>,
    estimated_time_remaining: Option<u64>,
  ) {
    let event = AppEvent::AnalysisProgress {
      analysis_id: analysis_id.to_string(),
      stage: stage.to_string(),
      progress,
      message: message.map(|s| s.to_string()),
      estimated_time_remaining,
    };

    if let Err(e) = self.app_handle.emit("analysis-progress", &event) {
      error!("Failed to emit AnalysisProgress event: {}", e);
    }
  }

  /// Emit AnalysisStageCompleted event
  async fn emit_stage_completed(
    &self,
    analysis_id: &str,
    stage: &str,
    duration_ms: u64,
    success: bool,
    error: Option<String>,
  ) {
    let event = AppEvent::AnalysisStageCompleted {
      analysis_id: analysis_id.to_string(),
      stage: stage.to_string(),
      duration_ms,
      success,
      error,
    };

    if let Err(e) = self.app_handle.emit("analysis-stage-completed", &event) {
      error!("Failed to emit AnalysisStageCompleted event: {}", e);
    }
  }

  /// Emit AnalysisCompleted event
  async fn emit_analysis_completed(
    &self,
    analysis_id: &str,
    success: bool,
    total_duration_ms: u64,
    stages_completed: Vec<String>,
    errors: Vec<String>,
  ) {
    let event = AppEvent::AnalysisCompleted {
      analysis_id: analysis_id.to_string(),
      success,
      total_duration_ms,
      stages_completed,
      errors,
    };

    if let Err(e) = self.app_handle.emit("analysis-completed", &event) {
      error!("Failed to emit AnalysisCompleted event: {}", e);
    }
  }

  /// Emit AnalysisError event
  async fn emit_analysis_error(&self, analysis_id: &str, stage: &str, error: &str) {
    let event = AppEvent::AnalysisError {
      analysis_id: analysis_id.to_string(),
      stage: stage.to_string(),
      error: error.to_string(),
    };

    if let Err(e) = self.app_handle.emit("analysis-error", &event) {
      error!("Failed to emit AnalysisError event: {}", e);
    }
  }

  /// Получить системные возможности (делегируем к inner)
  pub async fn get_system_capabilities(
    &self,
  ) -> Result<crate::analysis::services::ai_director::SystemCapabilities> {
    self.inner.get_system_capabilities().await
  }

  // ============================================================================
  // 🆕 AI Director v2 - Детальные события по файлам
  // ============================================================================

  /// Emit FileAnalysisStarted event
  async fn emit_file_analysis_started(
    &self,
    analysis_id: &str,
    file_id: &str,
    file_path: &str,
    file_index: usize,
    total_files: usize,
  ) {
    let event = AppEvent::FileAnalysisStarted {
      analysis_id: analysis_id.to_string(),
      file_id: file_id.to_string(),
      file_path: file_path.to_string(),
      file_index,
      total_files,
    };

    if let Err(e) = self.app_handle.emit("file-analysis-started", &event) {
      error!("Failed to emit FileAnalysisStarted event: {}", e);
    }
  }

  /// Emit FileAnalysisProgress event
  async fn emit_file_analysis_progress(
    &self,
    analysis_id: &str,
    file_id: &str,
    progress: f32,
    current_analyzer: Option<&str>,
    completed_analyzers: Vec<String>,
  ) {
    let event = AppEvent::FileAnalysisProgress {
      analysis_id: analysis_id.to_string(),
      file_id: file_id.to_string(),
      progress,
      current_analyzer: current_analyzer.map(|s| s.to_string()),
      completed_analyzers,
    };

    if let Err(e) = self.app_handle.emit("file-analysis-progress", &event) {
      error!("Failed to emit FileAnalysisProgress event: {}", e);
    }
  }

  /// Emit FileAnalysisCompleted event
  async fn emit_file_analysis_completed(
    &self,
    analysis_id: &str,
    file_id: &str,
    duration_ms: u64,
    success: bool,
    error: Option<String>,
  ) {
    let event = AppEvent::FileAnalysisCompleted {
      analysis_id: analysis_id.to_string(),
      file_id: file_id.to_string(),
      duration_ms,
      success,
      error,
    };

    if let Err(e) = self.app_handle.emit("file-analysis-completed", &event) {
      error!("Failed to emit FileAnalysisCompleted event: {}", e);
    }
  }

  // ============================================================================
  // 🆕 AI Director v2 - События по анализаторам
  // ============================================================================

  /// Emit AnalyzerStarted event
  async fn emit_analyzer_started(
    &self,
    analysis_id: &str,
    file_id: &str,
    analyzer_type: &str,
    analyzer_name: &str,
  ) {
    let event = AppEvent::AnalyzerStarted {
      analysis_id: analysis_id.to_string(),
      file_id: file_id.to_string(),
      analyzer_type: analyzer_type.to_string(),
      analyzer_name: analyzer_name.to_string(),
    };

    if let Err(e) = self.app_handle.emit("analyzer-started", &event) {
      error!("Failed to emit AnalyzerStarted event: {}", e);
    }
  }

  /// Emit AnalyzerProgress event
  async fn emit_analyzer_progress(
    &self,
    analysis_id: &str,
    file_id: &str,
    analyzer_type: &str,
    progress: f32,
    details: Option<&str>,
  ) {
    let event = AppEvent::AnalyzerProgress {
      analysis_id: analysis_id.to_string(),
      file_id: file_id.to_string(),
      analyzer_type: analyzer_type.to_string(),
      progress,
      details: details.map(|s| s.to_string()),
    };

    if let Err(e) = self.app_handle.emit("analyzer-progress", &event) {
      error!("Failed to emit AnalyzerProgress event: {}", e);
    }
  }

  /// Emit AnalyzerCompleted event
  async fn emit_analyzer_completed(
    &self,
    analysis_id: &str,
    file_id: &str,
    analyzer_type: &str,
    duration_ms: u64,
    success: bool,
    result_summary: Option<&str>,
    error: Option<String>,
  ) {
    let event = AppEvent::AnalyzerCompleted {
      analysis_id: analysis_id.to_string(),
      file_id: file_id.to_string(),
      analyzer_type: analyzer_type.to_string(),
      duration_ms,
      success,
      result_summary: result_summary.map(|s| s.to_string()),
      error,
    };

    if let Err(e) = self.app_handle.emit("analyzer-completed", &event) {
      error!("Failed to emit AnalyzerCompleted event: {}", e);
    }
  }

  // 🆕 Phase 2: Batch Analysis Events

  /// Emit BatchAnalysisStarted event
  async fn emit_batch_analysis_started(
    &self,
    batch_id: &str,
    total_files: usize,
    config_mode: &str,
  ) {
    let event = AppEvent::BatchAnalysisStarted {
      batch_id: batch_id.to_string(),
      total_files,
      config_mode: config_mode.to_string(),
    };

    if let Err(e) = self.app_handle.emit("batch-analysis-started", &event) {
      error!("Failed to emit BatchAnalysisStarted event: {}", e);
    }
  }

  /// Emit BatchAnalysisProgress event
  async fn emit_batch_analysis_progress(
    &self,
    batch_id: &str,
    completed_files: usize,
    total_files: usize,
    progress: f32,
    current_file_path: Option<&str>,
    estimated_time_remaining: Option<u64>,
  ) {
    let event = AppEvent::BatchAnalysisProgress {
      batch_id: batch_id.to_string(),
      completed_files,
      total_files,
      progress,
      current_file_path: current_file_path.map(|s| s.to_string()),
      estimated_time_remaining,
    };

    if let Err(e) = self.app_handle.emit("batch-analysis-progress", &event) {
      error!("Failed to emit BatchAnalysisProgress event: {}", e);
    }
  }

  /// Emit BatchAnalysisCompleted event
  async fn emit_batch_analysis_completed(
    &self,
    batch_id: &str,
    total_files: usize,
    successful_files: usize,
    failed_files: usize,
    total_duration_ms: u64,
    errors: Vec<String>,
  ) {
    let event = AppEvent::BatchAnalysisCompleted {
      batch_id: batch_id.to_string(),
      total_files,
      successful_files,
      failed_files,
      total_duration_ms,
      errors,
    };

    if let Err(e) = self.app_handle.emit("batch-analysis-completed", &event) {
      error!("Failed to emit BatchAnalysisCompleted event: {}", e);
    }
  }
}
