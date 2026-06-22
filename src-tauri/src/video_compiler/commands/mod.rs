//! Commands - Модульная структура Tauri команд для Video Compiler
//!
//! Команды разделены на следующие модули:
//! - `rendering` - Команды рендеринга и компиляции видео
//! - `cache` - Команды управления кэшем
//! - `gpu` - Команды работы с GPU и аппаратным ускорением
//! - `project` - Команды управления проектами
//! - `preview` - Команды генерации превью
//! - `settings` - Команды настроек компилятора
//! - `info` - Команды получения информации о системе и ресурсах
//! - `schema` - Команды создания и работы с элементами схемы (эффекты, фильтры, клипы, субтитры)
//! - `prerender_commands` - Команды предрендеринга
//! - `frame_extraction_commands` - Команды извлечения кадров
//! - `ai_api_proxy` - Команды для проксирования AI API запросов (Claude, OpenAI и др.)
//! - `misc` - Дополнительные команды

pub mod ai_api_proxy;
pub mod batch;
pub mod cache;
// `compiler_settings_commands` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::compiler_settings_commands;
pub mod ffmpeg_advanced;
pub mod ffmpeg_builder;
pub mod frame_extraction;
// `gpu` вынесена в крейт `ts-render-tauri` (Wave 2, эпик #91/#92).
// Ре-экспорт сохраняет плоский путь `crate::video_compiler::commands::gpu::*`
// и записи в `app_builder.rs::generate_handler!` валидными байт-в-байт.
pub use ts_render_tauri::gpu;
// `info` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::info;
pub mod metrics;
pub mod misc;
// `monitoring` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::monitoring;
pub mod multimodal_commands;
pub mod pipeline;
pub mod platform_optimization;
// `prerender` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::prerender;
pub mod preview;
// `preview_advanced` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::preview_advanced;
// `project` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::project;
pub mod recognition_advanced_commands;
pub mod rendering;
pub mod schema;
pub mod service;
// `service_container` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::service_container;
pub mod state;
pub mod video_analysis;
pub mod whisper_commands;
// `workflow` вынесена в крейт `ts-render-tauri` (Option B, эпик #91/#92).
// Ре-экспорт сохраняет плоский путь `crate::video_compiler::commands::workflow::*`
// и записи в `app_builder.rs::generate_handler!` валидными байт-в-байт.
pub use ts_render_tauri::workflow;
// pub mod workflow_commands; // Заменено на модуль workflow

// Re-export всех команд для удобства использования
#[allow(ambiguous_glob_reexports)]
pub use ai_api_proxy::*;
#[allow(ambiguous_glob_reexports)]
pub use batch::*;
// `CacheStats` приходит и из `cache::*` (рендер-кэш, теперь тип крейта ts-render-tauri),
// и из `ai_api_proxy::*` (AI-кэш) — это разные типы. Флэтовый `commands::CacheStats`
// нигде не используется (все пути квалифицированы), поэтому глушим как и соседние строки.
#[allow(ambiguous_glob_reexports)]
pub use cache::*;
#[allow(ambiguous_glob_reexports, hidden_glob_reexports)]
pub use compiler_settings_commands::*;
#[allow(unused_imports, ambiguous_glob_reexports)]
pub use ffmpeg_advanced::*;
pub use ffmpeg_builder::*;
#[allow(ambiguous_glob_reexports)]
pub use frame_extraction::*;
pub use gpu::*;
pub use info::*;
pub use metrics::*;
pub use misc::*;
#[allow(ambiguous_glob_reexports)]
pub use monitoring::*;
#[allow(ambiguous_glob_reexports)]
pub use multimodal_commands::*;
pub use pipeline::*;
pub use platform_optimization::*;
pub use prerender::*;
#[allow(ambiguous_glob_reexports)]
pub use preview::*;
#[allow(ambiguous_glob_reexports)]
pub use preview_advanced::*;
pub use project::*;
pub use recognition_advanced_commands::*;
#[allow(ambiguous_glob_reexports)]
pub use rendering::*;
pub use schema::*;
pub use service::*;
pub use service_container::*;
// Video analysis commands
pub use video_analysis::*;
pub use whisper_commands::*;
pub use workflow::*;
// pub use workflow_commands::*; // Заменено на модуль workflow

// Re-export основных типов
pub use state::VideoCompilerState;

#[cfg(test)]
mod commands_tests;
