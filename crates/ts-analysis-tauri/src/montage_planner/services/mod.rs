//! ДЕДУП (#98): базовые сервисы монтажа — из крейта `ts-montage`. В монолите остаются
//! сервисы с тендрилами в analysis/recognition (composition_analyzer/video_processor/
//! unified_audio_analyzer) — вернутся в крейт через трейты позже.
pub use ts_montage::montage_planner::services::{
  activity_calculator, audio_analyzer, emotion_detector, moment_detector, plan_generator,
  quality_analyzer, ActivityCalculator, AudioAnalyzer, EmotionDetector, MomentDetector,
  PlanGenerator, VideoQualityAnalyzer,
};

pub mod composition_analyzer;
pub mod unified_audio_analyzer;
pub mod video_processor;

pub use composition_analyzer::CompositionAnalyzer;
pub use unified_audio_analyzer::UnifiedMontageAudioAnalyzer;
pub use video_processor::VideoProcessor;
