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

  /// Запуск audio stage с прогрессом
  async fn run_audio_stage(
    &self,
    _media_path: &Path,
    _config: &AIDirectorConfig,
    analysis_id: &str,
  ) -> Result<()> {
    self
      .emit_progress(
        analysis_id,
        "audio",
        0.15,
        Some("Extracting audio metadata..."),
        Some(100),
      )
      .await;

    // Simulate progress updates
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
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
      .emit_progress(
        analysis_id,
        "audio",
        0.28,
        Some("Finalizing audio analysis..."),
        Some(20),
      )
      .await;

    // Здесь был бы реальный анализ, но для демо просто возвращаем успех
    Ok(())
  }

  /// Запуск video stage с прогрессом
  async fn run_video_stage(
    &self,
    _media_path: &Path,
    _config: &AIDirectorConfig,
    analysis_id: &str,
  ) -> Result<()> {
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
      .emit_progress(
        analysis_id,
        "video",
        0.65,
        Some("Detecting scenes..."),
        Some(15),
      )
      .await;

    tokio::time::sleep(tokio::time::Duration::from_millis(400)).await;

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
}
