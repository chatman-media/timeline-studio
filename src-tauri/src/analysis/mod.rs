// Analysis module - интеграция с существующей person database

pub mod commands;
pub mod database;  // ✅ Включаем обратно и исправляем проблемы
pub mod models;
pub mod services;  // ✅ Включено обратно - проблемы решены
pub mod types; // 🆕 Unified type system

// Re-export для удобства использования  
pub use services::{
    RealAnalysisEngine, AnalysisEngineConfig, // Real Analysis Engine 
    UnifiedAudioAnalyzer, // Unified Audio Analysis
};

// 🆕 Re-export unified audio types
pub use types::{
    AudioFloat, AudioDuration, AudioVolume, AudioFrequency, AudioTimestamp,
    AudioSampleRate, AudioQualityLevel, AudioTimeRange,
    UnifiedAudioAnalysisResult, AudioBasicMetrics, AudioFFmpegAnalysis,
    AudioMontageAnalysis, AudioTranscriptionAnalysis, AudioAnalysisMetadata,
    UnifiedAudioConfig, AudioAnalysisError,
};
