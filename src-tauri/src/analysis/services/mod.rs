// Analysis services - основные сервисы для системы анализа

pub mod analysis_engine;
pub mod moment_analyzer; 
pub mod project_manager;
pub mod scene_detector;
pub mod real_analysis_engine;
pub mod analysis_frame_integration; 
pub mod unified_audio_analyzer; // 🆕 Modern unified audio analysis service

// Избегаем конфликтов имен, импортируем специфично
pub use analysis_engine::{AnalysisEngine, PersonMetadata, ConfidenceScores, PersonSettings};
pub use moment_analyzer::MomentAnalyzer; 
pub use project_manager::ProjectManager;
pub use scene_detector::SceneDetector;
pub use real_analysis_engine::{RealAnalysisEngine, AnalysisEngineConfig};
pub use analysis_frame_integration::{AnalysisFrameIntegrator, VideoAnalysisResult, ClipAnalysisResult}; 
pub use unified_audio_analyzer::UnifiedAudioAnalyzer;
