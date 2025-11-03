// Analysis module - интеграция с существующей person database

pub mod commands;
pub mod database; // ✅ Включаем обратно и исправляем проблемы
pub mod engines; // 🆕 Analysis engines
pub mod models;
pub mod services; // ✅ Включено обратно - проблемы решены
pub mod types; // 🆕 Unified type system

// Re-export для удобства использования
pub use engines::ContentEngine;
pub use engines::MomentEngine; // 🆕 Moment Detection Engine
pub use engines::SceneEngine; // 🆕 Scene Analysis Engine // 🆕 Content Analysis Engine

pub use services::{
  AnalysisEngineConfig, // Real Analysis Engine
  RealAnalysisEngine,
  UnifiedAudioAnalyzer, // Unified Audio Analysis
};

// 🆕 Re-export unified audio types
pub use types::{
  AudioAnalysisError, AudioAnalysisMetadata, AudioBasicMetrics, AudioDuration, AudioFFmpegAnalysis,
  AudioFloat, AudioFrequency, AudioMontageAnalysis, AudioQualityLevel, AudioSampleRate,
  AudioTimeRange, AudioTimestamp, AudioTranscriptionAnalysis, AudioVolume,
  UnifiedAudioAnalysisResult, UnifiedAudioConfig,
};
