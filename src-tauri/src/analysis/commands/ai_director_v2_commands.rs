/**
 * AI Director v2 Commands - Tauri команды с поддержкой real-time событий
 *
 * Эти команды используют AIDirectorWithEvents для отправки детальных progress events
 */
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, State};
use tokio::sync::RwLock;

use crate::analysis::database::AnalysisDatabase;
use crate::analysis::services::ai_director::{AIDirectorConfig, ComprehensiveAnalysisResult};
use crate::analysis::services::ai_director_with_events::AIDirectorWithEvents;
use crate::recognition::commands::yolo_commands::YoloProcessorState;
use crate::recognition::person_database::PersonDatabase;

/// Global AI Director v2 State (с поддержкой событий)
pub struct AIDirectorV2State {
  director: Arc<AIDirectorWithEvents>,
}

impl AIDirectorV2State {
  pub fn new(
    analysis_db: Arc<AnalysisDatabase>,
    person_db: Arc<PersonDatabase>,
    yolo_state: Arc<RwLock<YoloProcessorState>>,
    app_handle: AppHandle,
  ) -> Self {
    let director = Arc::new(AIDirectorWithEvents::new(
      analysis_db,
      person_db,
      yolo_state,
      app_handle,
    ));

    Self { director }
  }
}

/// 🆕 v2: Comprehensive анализ с real-time events
#[tauri::command]
#[specta::specta]
pub async fn ai_director_v2_analyze_comprehensive(
  video_path: String,
  config: Option<AIDirectorConfig>,
  state: State<'_, AIDirectorV2State>,
) -> Result<ComprehensiveAnalysisResult, String> {
  log::info!(
    "AI Director v2 comprehensive analysis request for: {}",
    video_path
  );

  let path = PathBuf::from(&video_path);
  if !path.exists() {
    return Err(format!("File not found: {}", video_path));
  }

  match state
    .director
    .analyze_comprehensive_with_events(&path, config)
    .await
  {
    Ok(result) => {
      log::info!(
        "AI Director v2 analysis completed successfully for: {}",
        video_path
      );
      Ok(result)
    }
    Err(e) => {
      log::error!("AI Director v2 analysis failed for {}: {}", video_path, e);
      Err(format!("Analysis failed: {}", e))
    }
  }
}

/// 🆕 v2: Быстрый анализ с real-time events
#[tauri::command]
#[specta::specta]
pub async fn ai_director_v2_analyze_quick(
  video_path: String,
  state: State<'_, AIDirectorV2State>,
) -> Result<ComprehensiveAnalysisResult, String> {
  log::info!("AI Director v2 quick analysis request for: {}", video_path);

  let path = PathBuf::from(&video_path);
  if !path.exists() {
    return Err(format!("File not found: {}", video_path));
  }

  match state.director.analyze_quick_with_events(&path).await {
    Ok(result) => {
      log::info!(
        "AI Director v2 quick analysis completed for: {}",
        video_path
      );
      Ok(result)
    }
    Err(e) => {
      log::error!(
        "AI Director v2 quick analysis failed for {}: {}",
        video_path,
        e
      );
      Err(format!("Quick analysis failed: {}", e))
    }
  }
}

/// 🆕 v2 Phase 2: Batch анализ с real-time events
#[tauri::command]
#[specta::specta]
pub async fn ai_director_v2_analyze_batch(
  file_paths: Vec<String>,
  config: Option<AIDirectorConfig>,
  state: State<'_, AIDirectorV2State>,
) -> Result<Vec<ComprehensiveAnalysisResult>, String> {
  log::info!(
    "AI Director v2 batch analysis request for {} files",
    file_paths.len()
  );

  if file_paths.is_empty() {
    return Err("No files provided for batch analysis".to_string());
  }

  match state
    .director
    .analyze_batch_with_events(file_paths, config)
    .await
  {
    Ok(results) => {
      log::info!(
        "AI Director v2 batch analysis completed: {}/{} files successful",
        results.len(),
        results.len()
      );
      Ok(results)
    }
    Err(e) => {
      log::error!("AI Director v2 batch analysis failed: {}", e);
      Err(format!("Batch analysis failed: {}", e))
    }
  }
}

#[cfg(test)]
mod tests {
  #[test]
  fn test_ai_director_v2_state_creation() {
    // This test requires mocking AppHandle, Analysis DB, Person DB, and Yolo State
    // Will be implemented when testing infrastructure is set up
  }
}
