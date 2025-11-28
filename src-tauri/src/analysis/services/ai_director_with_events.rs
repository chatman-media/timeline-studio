/**
 * AI Director with Events - Версия с поддержкой real-time событий
 *
 * Отправляет progress события через Tauri event system
 */
use anyhow::Result;
use futures::future::join_all;
use log::{error, info};
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tauri::{AppHandle, Emitter};
use tokio::sync::{RwLock, Semaphore};
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

  /// 🆕 Phase 3: Параллельная batch обработка с real-time событиями
  ///
  /// Обрабатывает несколько файлов одновременно для ускорения анализа.
  /// Использует Semaphore для ограничения количества параллельных задач.
  pub async fn analyze_batch_parallel_with_events(
    &self,
    file_paths: Vec<String>,
    config_opt: Option<AIDirectorConfig>,
  ) -> Result<Vec<ComprehensiveAnalysisResult>> {
    let config = config_opt.clone().unwrap_or_default();
    let batch_id = Uuid::new_v4().to_string();
    let total_files = file_paths.len();
    let batch_start = Instant::now();

    if file_paths.is_empty() {
      return Err(anyhow::anyhow!("No files provided for batch analysis"));
    }

    // Определяем количество параллельных задач
    let max_parallel = config
      .max_parallel_files
      .unwrap_or_else(|| num_cpus::get().min(4));

    // Определяем config mode для события
    let config_mode = if !config.enable_video_analysis {
      "fast"
    } else if config.enable_emotion_analysis && config.enable_mood_analysis {
      "quality"
    } else {
      "balanced"
    };

    info!(
      "Starting PARALLEL batch analysis: batch_id={}, files={}, mode={}, max_parallel={}",
      batch_id, total_files, config_mode, max_parallel
    );

    // 1. Emit BatchAnalysisStarted
    self
      .emit_batch_analysis_started(&batch_id, total_files, config_mode)
      .await;

    // Создаем semaphore для ограничения параллелизма
    let semaphore = Arc::new(Semaphore::new(max_parallel));

    // Atomic counters для прогресс-трекинга
    let completed_count = Arc::new(AtomicUsize::new(0));
    let success_count = Arc::new(AtomicUsize::new(0));

    // Собираем все задачи
    let mut handles = Vec::new();

    for (index, file_path) in file_paths.into_iter().enumerate() {
      let semaphore = semaphore.clone();
      let config_opt = config_opt.clone();
      let batch_id = batch_id.clone();
      let completed_count = completed_count.clone();
      let success_count = success_count.clone();
      let app_handle = self.app_handle.clone();
      let inner = self.inner.clone();

      let handle = tokio::spawn(async move {
        // Ждем свободный слот
        let _permit = semaphore.acquire().await.unwrap();

        let path = std::path::PathBuf::from(&file_path);

        if !path.exists() {
          let error_msg = format!("File not found: {}", file_path);
          error!("{}", error_msg);

          // Увеличиваем completed_count
          let current_completed = completed_count.fetch_add(1, Ordering::SeqCst) + 1;

          // Emit progress
          let progress = current_completed as f32 / total_files as f32;
          let event = AppEvent::BatchAnalysisProgress {
            batch_id: batch_id.clone(),
            completed_files: current_completed,
            total_files,
            progress,
            current_file_path: Some(file_path.clone()),
            estimated_time_remaining: None,
          };
          let _ = app_handle.emit("batch-analysis-progress", &event);

          return (index, file_path, Err(anyhow::anyhow!(error_msg)));
        }

        info!(
          "Parallel batch: processing file {}/{}: {} (worker acquired)",
          index + 1,
          total_files,
          file_path
        );

        // Выполняем анализ
        let result = inner.analyze_media_comprehensive(&path, config_opt).await;

        // Увеличиваем counters
        let current_completed = completed_count.fetch_add(1, Ordering::SeqCst) + 1;
        if result.is_ok() {
          success_count.fetch_add(1, Ordering::SeqCst);
        }

        // Emit progress
        let progress = current_completed as f32 / total_files as f32;
        let remaining = total_files - current_completed;
        // Примерная оценка ETA: оставшиеся файлы / max_parallel * среднее время (60 сек)
        let eta = if remaining > 0 {
          Some((remaining as f64 / max_parallel as f64 * 60.0) as u64)
        } else {
          Some(0)
        };

        let event = AppEvent::BatchAnalysisProgress {
          batch_id: batch_id.clone(),
          completed_files: current_completed,
          total_files,
          progress,
          current_file_path: Some(file_path.clone()),
          estimated_time_remaining: eta,
        };
        let _ = app_handle.emit("batch-analysis-progress", &event);

        info!(
          "Parallel batch: file {}/{} completed (success: {})",
          current_completed,
          total_files,
          result.is_ok()
        );

        (index, file_path, result)
      });

      handles.push(handle);
    }

    // Ждем завершения всех задач
    let task_results = join_all(handles).await;

    // Собираем результаты с сортировкой по original index
    let mut indexed_results: Vec<(usize, String, Result<ComprehensiveAnalysisResult>)> = Vec::new();
    let mut errors = Vec::new();

    for task_result in task_results {
      match task_result {
        Ok((index, file_path, result)) => match result {
          Ok(analysis) => {
            indexed_results.push((index, file_path, Ok(analysis)));
          }
          Err(e) => {
            let error_msg = format!("File {} failed: {}", file_path, e);
            errors.push(error_msg.clone());
            error!("{}", error_msg);
            indexed_results.push((index, file_path, Err(e)));
          }
        },
        Err(e) => {
          let error_msg = format!("Task join error: {}", e);
          errors.push(error_msg.clone());
          error!("{}", error_msg);
        }
      }
    }

    // Сортируем по original index для сохранения порядка
    indexed_results.sort_by_key(|(idx, _, _)| *idx);

    // Извлекаем успешные результаты
    let results: Vec<ComprehensiveAnalysisResult> = indexed_results
      .into_iter()
      .filter_map(|(_, _, r)| r.ok())
      .collect();

    let successful_files = results.len();
    let failed_files = total_files - successful_files;
    let total_duration = batch_start.elapsed().as_millis() as u64;

    // Emit BatchAnalysisCompleted
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
      "PARALLEL batch analysis completed: batch_id={}, successful={}/{}, duration={}ms, speedup vs sequential: ~{:.1}x",
      batch_id,
      successful_files,
      total_files,
      total_duration,
      (total_files as f64 / max_parallel as f64).max(1.0)
    );

    if results.is_empty() && !errors.is_empty() {
      return Err(anyhow::anyhow!(
        "All batch analyses failed: {}",
        errors.join("; ")
      ));
    }

    Ok(results)
  }

  /// Запуск audio stage с прогрессом - РЕАЛЬНЫЙ АНАЛИЗ
  async fn run_audio_stage(
    &self,
    media_path: &Path,
    config: &AIDirectorConfig,
    analysis_id: &str,
  ) -> Result<()> {
    let file_id = Uuid::new_v4().to_string();
    let file_path = media_path.to_string_lossy().to_string();
    let stage_start = Instant::now();

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

    // Analyzer: Unified Audio Analysis (реальный анализ)
    self
      .emit_analyzer_started(
        analysis_id,
        &file_id,
        "unified_audio",
        "Unified Audio Analyzer",
      )
      .await;

    self
      .emit_progress(
        analysis_id,
        "audio",
        0.1,
        Some("Starting unified audio analysis..."),
        None,
      )
      .await;

    self
      .emit_analyzer_progress(
        analysis_id,
        &file_id,
        "unified_audio",
        0.1,
        Some("Initializing audio analysis..."),
      )
      .await;

    // Вызов реального анализа
    let analysis_result = self
      .inner
      .run_unified_audio_analysis(media_path, config)
      .await;

    match &analysis_result {
      Ok(result) => {
        // Emit прогресс по мере получения результатов
        let mut completed_analyzers = Vec::new();
        let mut progress = 0.2;

        // Проверяем какие компоненты анализа завершены
        if result.ffmpeg_analysis.is_some() {
          self
            .emit_analyzer_progress(
              analysis_id,
              &file_id,
              "unified_audio",
              progress,
              Some("FFmpeg analysis completed"),
            )
            .await;
          completed_analyzers.push("ffmpeg_analysis".to_string());
          progress += 0.25;
        }

        if result.montage_analysis.is_some() {
          self
            .emit_analyzer_progress(
              analysis_id,
              &file_id,
              "unified_audio",
              progress,
              Some("Montage analysis completed"),
            )
            .await;
          completed_analyzers.push("montage_analysis".to_string());
          progress += 0.25;
        }

        if result.transcription_analysis.is_some() {
          self
            .emit_analyzer_progress(
              analysis_id,
              &file_id,
              "unified_audio",
              progress,
              Some("Transcription analysis completed"),
            )
            .await;
          completed_analyzers.push("transcription_analysis".to_string());
        }

        // Update file progress
        self
          .emit_file_analysis_progress(analysis_id, &file_id, 0.9, None, completed_analyzers)
          .await;

        // Emit общий прогресс
        self
          .emit_progress(
            analysis_id,
            "audio",
            0.28,
            Some("Audio analysis completed successfully"),
            Some(stage_start.elapsed().as_secs().saturating_sub(1).max(1)),
          )
          .await;

        // Emit analyzer completed с успехом
        self
          .emit_analyzer_completed(
            analysis_id,
            &file_id,
            "unified_audio",
            stage_start.elapsed().as_millis() as u64,
            true,
            Some(&format!(
              "Audio analyzed: quality={:.2}, insights={}",
              result.overall_quality_score(),
              result.available_insights().join(", ")
            )),
            None,
          )
          .await;
      }
      Err(e) => {
        // Emit analyzer completed с ошибкой
        self
          .emit_analyzer_completed(
            analysis_id,
            &file_id,
            "unified_audio",
            stage_start.elapsed().as_millis() as u64,
            false,
            None,
            Some(e.to_string()),
          )
          .await;

        self
          .emit_progress(
            analysis_id,
            "audio",
            0.28,
            Some(&format!("Audio analysis failed: {}", e)),
            None,
          )
          .await;
      }
    }

    // 🆕 v2: Emit file analysis completed
    self
      .emit_file_analysis_completed(
        analysis_id,
        &file_id,
        stage_start.elapsed().as_millis() as u64,
        analysis_result.is_ok(),
        analysis_result.err().map(|e| e.to_string()),
      )
      .await;

    Ok(())
  }

  /// Запуск video stage с прогрессом - РЕАЛЬНЫЙ АНАЛИЗ
  async fn run_video_stage(
    &self,
    media_path: &Path,
    config: &AIDirectorConfig,
    analysis_id: &str,
  ) -> Result<()> {
    let file_id = Uuid::new_v4().to_string();
    let file_path = media_path.to_string_lossy().to_string();
    let stage_start = Instant::now();
    let mut completed_analyzers = Vec::new();
    let mut all_scenes = Vec::new();
    let mut has_errors = false;

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

    // ========== Analyzer 1: Scene Detection ==========
    let scene_start = Instant::now();
    self
      .emit_analyzer_started(analysis_id, &file_id, "scene_detection", "Scene Detection")
      .await;

    self
      .emit_progress(
        analysis_id,
        "video",
        0.35,
        Some("Running scene detection..."),
        None,
      )
      .await;

    self
      .emit_analyzer_progress(
        analysis_id,
        &file_id,
        "scene_detection",
        0.2,
        Some("Analyzing video frames..."),
      )
      .await;

    // Реальный вызов scene detection
    match self.inner.run_scene_detection(media_path, config).await {
      Ok(scenes) => {
        all_scenes = scenes;
        self
          .emit_analyzer_completed(
            analysis_id,
            &file_id,
            "scene_detection",
            scene_start.elapsed().as_millis() as u64,
            true,
            Some(&format!("{} scenes detected", all_scenes.len())),
            None,
          )
          .await;
        completed_analyzers.push("scene_detection".to_string());
      }
      Err(e) => {
        self
          .emit_analyzer_completed(
            analysis_id,
            &file_id,
            "scene_detection",
            scene_start.elapsed().as_millis() as u64,
            false,
            None,
            Some(e.to_string()),
          )
          .await;
        has_errors = true;
      }
    }

    // 🆕 v2: Update file progress
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        0.25,
        Some("vision_analysis"),
        completed_analyzers.clone(),
      )
      .await;

    // ========== Analyzer 2: Vision Analysis ==========
    if !all_scenes.is_empty() {
      let vision_start = Instant::now();
      self
        .emit_analyzer_started(analysis_id, &file_id, "vision_analysis", "Vision Analyzer")
        .await;

      self
        .emit_progress(
          analysis_id,
          "video",
          0.5,
          Some("Running vision analysis..."),
          None,
        )
        .await;

      self
        .emit_analyzer_progress(
          analysis_id,
          &file_id,
          "vision_analysis",
          0.3,
          Some("Analyzing visual features..."),
        )
        .await;

      // Реальный вызов vision analysis
      match self.inner.run_vision_analysis(&all_scenes, config).await {
        Ok(vision_result) => {
          self
            .emit_analyzer_completed(
              analysis_id,
              &file_id,
              "vision_analysis",
              vision_start.elapsed().as_millis() as u64,
              true,
              Some(&format!(
                "Objects: {}, Faces: {}, Quality: {:.2}",
                vision_result.objects_detected.len(),
                vision_result.faces_count,
                vision_result.visual_quality_avg
              )),
              None,
            )
            .await;
          completed_analyzers.push("vision_analysis".to_string());
        }
        Err(e) => {
          self
            .emit_analyzer_completed(
              analysis_id,
              &file_id,
              "vision_analysis",
              vision_start.elapsed().as_millis() as u64,
              false,
              None,
              Some(e.to_string()),
            )
            .await;
          has_errors = true;
        }
      }
    }

    // 🆕 v2: Update file progress
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        0.5,
        Some("content_analysis"),
        completed_analyzers.clone(),
      )
      .await;

    // ========== Analyzer 3: Content Analysis ==========
    if !all_scenes.is_empty() {
      let content_start = Instant::now();
      self
        .emit_analyzer_started(
          analysis_id,
          &file_id,
          "content_analysis",
          "Content Analyzer",
        )
        .await;

      self
        .emit_progress(
          analysis_id,
          "video",
          0.6,
          Some("Analyzing content..."),
          None,
        )
        .await;

      self
        .emit_analyzer_progress(
          analysis_id,
          &file_id,
          "content_analysis",
          0.4,
          Some("Classifying content..."),
        )
        .await;

      // Реальный вызов content analysis
      match self.inner.run_content_analysis(&all_scenes, config).await {
        Ok(content_result) => {
          self
            .emit_analyzer_completed(
              analysis_id,
              &file_id,
              "content_analysis",
              content_start.elapsed().as_millis() as u64,
              true,
              Some(&format!(
                "Classification: {:?}, Quality: {:.2}",
                content_result.classification, content_result.quality.overall
              )),
              None,
            )
            .await;
          completed_analyzers.push("content_analysis".to_string());
        }
        Err(e) => {
          self
            .emit_analyzer_completed(
              analysis_id,
              &file_id,
              "content_analysis",
              content_start.elapsed().as_millis() as u64,
              false,
              None,
              Some(e.to_string()),
            )
            .await;
          has_errors = true;
        }
      }
    }

    // 🆕 v2: Update file progress
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        0.75,
        Some("moment_detection"),
        completed_analyzers.clone(),
      )
      .await;

    // ========== Analyzer 4: Moment Detection ==========
    if !all_scenes.is_empty() {
      let moment_start = Instant::now();
      self
        .emit_analyzer_started(analysis_id, &file_id, "moment_detection", "Moment Detector")
        .await;

      self
        .emit_progress(
          analysis_id,
          "video",
          0.7,
          Some("Detecting key moments..."),
          None,
        )
        .await;

      self
        .emit_analyzer_progress(
          analysis_id,
          &file_id,
          "moment_detection",
          0.5,
          Some("Analyzing key moments..."),
        )
        .await;

      // Реальный вызов moment detection
      match self.inner.run_moment_detection(&all_scenes, config).await {
        Ok(moments) => {
          self
            .emit_analyzer_completed(
              analysis_id,
              &file_id,
              "moment_detection",
              moment_start.elapsed().as_millis() as u64,
              true,
              Some(&format!("{} key moments detected", moments.len())),
              None,
            )
            .await;
          completed_analyzers.push("moment_detection".to_string());
        }
        Err(e) => {
          self
            .emit_analyzer_completed(
              analysis_id,
              &file_id,
              "moment_detection",
              moment_start.elapsed().as_millis() as u64,
              false,
              None,
              Some(e.to_string()),
            )
            .await;
          has_errors = true;
        }
      }
    }

    // 🆕 v2: Update file progress to complete
    self
      .emit_file_analysis_progress(
        analysis_id,
        &file_id,
        1.0,
        None,
        completed_analyzers.clone(),
      )
      .await;

    // Final progress update
    self
      .emit_progress(
        analysis_id,
        "video",
        0.7,
        Some(&format!(
          "Video analysis completed: {} analyzers succeeded",
          completed_analyzers.len()
        )),
        None,
      )
      .await;

    // 🆕 v2: Emit file analysis completed
    self
      .emit_file_analysis_completed(
        analysis_id,
        &file_id,
        stage_start.elapsed().as_millis() as u64,
        !has_errors,
        if has_errors {
          Some("Some analyzers failed".to_string())
        } else {
          None
        },
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
