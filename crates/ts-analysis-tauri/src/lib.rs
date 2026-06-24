// Analysis. ДЕДУП (#97/#98): models/types и движки content/moment — из крейта ts-analysis;
pub mod montage_planner;

/// Состояние подсистемы анализа (#356). Перенесено из монолита `lib.rs` (там оно было
/// определено не на месте); монолит держит ре-экспорт `pub use ts_analysis_tauri::AppState`.
#[derive(Clone)]
pub struct AppState {
  pub analysis_db: std::sync::Arc<tokio::sync::RwLock<Option<String>>>,
  pub person_db:
    Option<std::sync::Arc<ts_recognition::recognition::person_database::PersonDatabase>>,
  pub project_manager: std::sync::Arc<tokio::sync::RwLock<Option<String>>>,
}

impl Default for AppState {
  fn default() -> Self {
    Self {
      analysis_db: std::sync::Arc::new(tokio::sync::RwLock::new(None)),
      person_db: None,
      project_manager: std::sync::Arc::new(tokio::sync::RwLock::new(None)),
    }
  }
}
// в монолите остаются adapters/commands/database/services + scene_engine (оркестрация/тендрилы).
pub mod adapters;
pub mod commands;
pub mod database;
pub mod engines;
pub mod services;

pub use ts_analysis::analysis::{models, types};

pub use engines::{ContentEngine, MomentEngine, SceneEngine};
pub use services::{AnalysisEngineConfig, RealAnalysisEngine, UnifiedAudioAnalyzer};
pub use adapters::{FFmpegAudioAdapter, MontageAudioAdapter, WhisperAudioAdapter};
pub use types::{
  AudioAnalysisError, AudioAnalysisMetadata, AudioBasicMetrics, AudioDuration, AudioFFmpegAnalysis,
  AudioFloat, AudioFrequency, AudioMontageAnalysis, AudioQualityLevel, AudioSampleRate,
  AudioTimeRange, AudioTimestamp, AudioTranscriptionAnalysis, AudioVolume,
  UnifiedAudioAnalysisResult, UnifiedAudioConfig,
};
