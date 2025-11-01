//! Unified type system для всех audio analysis компонентов
//! 
//! Решает критические конфликты типов между FFmpeg (f64), 
//! Montage Planner (f32) и Whisper сервисами

pub mod audio_core;
pub mod audio_analysis;

#[cfg(test)]
pub mod tests_basic;

pub use audio_core::*;
pub use audio_analysis::*;