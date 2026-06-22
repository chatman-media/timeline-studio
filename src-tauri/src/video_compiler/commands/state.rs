//! State Video Compiler — РЕ-ЭКСПОРТ-ШИМ (волна 1, эпик #91).
//!
//! Реальные типы переехали в крейт `ts-render-services` (`ts_render_services::state`).
//! Здесь оставлен ре-экспорт, чтобы пути
//! `crate::video_compiler::commands::state::{VideoCompilerState, ActiveRenderJob,
//! RenderJobMetadata, RenderJob}` (а через `commands/mod.rs` и
//! `crate::video_compiler::commands::VideoCompilerState`, и через `video_compiler/mod.rs`
//! — `crate::video_compiler::VideoCompilerState`) резолвились БЕЗ правок у команд и тестов.
//!
//! Поля `VideoCompilerState` остаются `pub`, поэтому конструирование struct-литералом в
//! тестовых моках (`tests/mocks.rs`) продолжает работать через ре-экспорт.

pub use ts_render_services::state::*;
