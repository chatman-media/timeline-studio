// Analysis services - основные сервисы для системы анализа

pub mod ai_director; // 🆕 AI Director - главный координатор всех анализов
pub mod ai_director_with_events;
pub mod analysis_engine;
pub mod analysis_frame_integration;
pub mod content_classification_engine; // 🆕 Content Classification Engine
pub mod moment_analyzer;
pub mod project_manager;
pub mod real_analysis_engine;
pub mod scene_detector;
pub mod script_generator; // 🆕 AI-powered script generation
pub mod unified_audio_analyzer; // 🆕 Modern unified audio analysis service

// Избегаем конфликтов имен, импортируем специфично
pub use ai_director::{
  AIDirector, AIDirectorConfig, ComprehensiveAnalysisResult, SystemCapabilities,
};
pub use analysis_engine::{AnalysisEngine, ConfidenceScores, PersonMetadata, PersonSettings};
pub use analysis_frame_integration::{
  AnalysisFrameIntegrator, ClipAnalysisResult, VideoAnalysisResult,
};
pub use content_classification_engine::ContentClassificationEngine;
pub use moment_analyzer::MomentAnalyzer;
pub use project_manager::ProjectManager;
pub use real_analysis_engine::{AnalysisEngineConfig, RealAnalysisEngine};
pub use scene_detector::SceneDetector;
pub use script_generator::{
  Dialogue, GeneratedScript, ScriptGenerationConfig, ScriptGenerator, ScriptGenre, ScriptMetadata,
  ScriptScene, Voiceover, VoiceoverStyle,
};
pub use unified_audio_analyzer::UnifiedAudioAnalyzer;
