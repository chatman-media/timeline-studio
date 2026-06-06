// Analysis module - интеграция с существующей person database

pub mod engines; // 🆕 Analysis engines
pub mod models;
pub mod types; // 🆕 Unified type system

// Re-export для удобства использования
pub use engines::ContentEngine;
pub use engines::MomentEngine; // 🆕 Moment Detection Engine

// services/adapters отрезаны при выносе (хаб-оркестрация с циклами) — #91.

// 🆕 Re-export unified audio types
pub use types::{
  AudioAnalysisError, AudioAnalysisMetadata, AudioBasicMetrics, AudioDuration, AudioFFmpegAnalysis,
  AudioFloat, AudioFrequency, AudioMontageAnalysis, AudioQualityLevel, AudioSampleRate,
  AudioTimeRange, AudioTimestamp, AudioTranscriptionAnalysis, AudioVolume,
  UnifiedAudioAnalysisResult, UnifiedAudioConfig,
};
