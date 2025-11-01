// Analysis module - интеграция с существующей person database

pub mod commands;
pub mod database;
pub mod models;
pub mod services;

// Re-export для удобства использования
pub use services::analysis_frame_integration::{
    AnalysisFrameIntegrator, VideoAnalysisResult, ClipAnalysisResult
};
pub use commands::frame_integration_commands::{
    VideoAnalysisParams, ClipAnalysisParams, FrameIntegrationStatus
};
