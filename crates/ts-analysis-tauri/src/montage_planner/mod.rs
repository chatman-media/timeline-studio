//! Smart Montage Planner - AI-powered montage planning module
//!
//! This module provides intelligent video analysis and automatic montage plan generation
//! by extending existing YOLO recognition capabilities and adding FFmpeg-based analysis.

pub mod commands;
pub mod services;
pub mod types;

// Re-export main types and services
pub use commands::*;
pub use services::*;
pub use types::*;
