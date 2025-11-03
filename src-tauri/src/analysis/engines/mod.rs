//! Analysis Engines Module
//!
//! Централизованный модуль для всех analysis движков.
//! Унифицирует разрозненные анализаторы из services/ и montage_planner/.

pub mod content_engine;
pub mod moment_engine; // 🆕 Unified Moment Detection Engine
pub mod scene_engine; // 🆕 Unified Content Analysis Engine

pub use content_engine::ContentEngine;
pub use moment_engine::MomentEngine; // 🆕
pub use scene_engine::SceneEngine; // 🆕
