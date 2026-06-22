//! Сервисный слой Video Compiler — РЕ-ЭКСПОРТ-ШИМ (волна 1, эпик #91).
//!
//! Реальный код переехал в крейт `ts-render-services` (`ts_render_services::services`).
//! Здесь оставлен ре-экспорт, чтобы существующие пути
//! `crate::video_compiler::services::*` (включая подмодули `cache_service`,
//! `ffmpeg_service`, `gpu_service`, `monitoring`, `preview_service`, `project_service`,
//! `render_service`, `transition_ffmpeg_service`) у ~26 групп команд и внешних
//! потребителей резолвились БЕЗ правок.

// Подмодули — чтобы `services::cache_service::CacheStats`,
// `services::gpu_service::GpuCapabilities`, `services::monitoring::MetricsRegistry` и т.п.
// продолжали указывать на крейтовые модули.
pub use ts_render_services::services::{
  cache_service, cache_service_with_metrics, ffmpeg_service, gpu_service, monitoring,
  preview_service, project_service, render_service, transition_ffmpeg_service,
};

// Плоские типы/трейты (`services::ServiceContainer`, `services::Service`, `*Impl`,
// `ServiceMetrics`, `ServiceMetricsContainer`, `FileInfo`, `Transition*` и пр.).
pub use ts_render_services::services::*;
