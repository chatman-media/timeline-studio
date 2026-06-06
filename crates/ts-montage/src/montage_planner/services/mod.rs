//! Services for Smart Montage Planner module
//!
//! This module contains the core business logic for montage analysis and planning.

pub mod activity_calculator;
pub mod audio_analyzer;
pub mod emotion_detector;
pub mod moment_detector;
pub mod plan_generator;
pub mod quality_analyzer;


// Re-export main services
pub use activity_calculator::ActivityCalculator;
pub use audio_analyzer::AudioAnalyzer;
pub use emotion_detector::EmotionDetector;
pub use moment_detector::MomentDetector;
pub use plan_generator::PlanGenerator;
pub use quality_analyzer::VideoQualityAnalyzer;
