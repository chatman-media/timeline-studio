// Analysis. ДЕДУП (#97/#98): models/types и движки content/moment — из крейта ts-analysis;
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
