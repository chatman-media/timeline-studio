//! Services for Smart Montage Planner module
//!
//! This module contains the core business logic for montage analysis and planning.

pub mod activity_calculator;
pub mod audio_analyzer;
pub mod unified_audio_analyzer; // 🆕 Modern unified audio analyzer
pub mod composition_analyzer;
pub mod emotion_detector;
pub mod moment_detector;
pub mod plan_generator;
pub mod quality_analyzer;
pub mod video_processor;

#[cfg(test)]
pub mod tests;

// Re-export main services
pub use activity_calculator::ActivityCalculator;
pub use audio_analyzer::AudioAnalyzer;
pub use unified_audio_analyzer::UnifiedMontageAudioAnalyzer; // 🆕 Modern unified analyzer
pub use composition_analyzer::CompositionAnalyzer;
pub use emotion_detector::EmotionDetector;
pub use moment_detector::MomentDetector;
pub use plan_generator::PlanGenerator;
pub use quality_analyzer::VideoQualityAnalyzer;
pub use video_processor::VideoProcessor;
