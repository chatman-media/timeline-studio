//! Unified type system для всех analysis компонентов
//!
//! Решает критические конфликты типов между:
//! - FFmpeg (f64) и Montage Planner (f32)
//! - Frontend TypeScript и Backend Rust
//! - Различными представлениями медиа файлов

pub mod audio_analysis;
pub mod audio_core;
pub mod content_classification;
pub mod unified_types;



pub use audio_analysis::*;
pub use audio_core::*;
pub use content_classification::*;
pub use unified_types::*;
