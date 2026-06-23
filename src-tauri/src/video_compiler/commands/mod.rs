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

// `ai_api_proxy` вынесена в крейт `ts-render-tauri` (#91) — ре-экспорт-шим.
// Пути в app_builder/specta_export уже квалифицированы подмодулем, остаются валидны.
pub use ts_render_tauri::ai_api_proxy;
// `batch` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::batch;
// `cache` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::cache;
// `compiler_settings_commands` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::compiler_settings_commands;
// `ffmpeg_advanced`/`ffmpeg_builder`/`frame_extraction` вынесены в крейт ts-render-tauri (Wave 2) — ре-экспорт-шимы.
pub use ts_render_tauri::ffmpeg_advanced;
pub use ts_render_tauri::ffmpeg_builder;
pub use ts_render_tauri::frame_extraction;
// `gpu` вынесена в крейт `ts-render-tauri` (Wave 2, эпик #91/#92).
// Ре-экспорт сохраняет плоский путь `crate::video_compiler::commands::gpu::*`
// и записи в `app_builder.rs::generate_handler!` валидными байт-в-байт.
pub use ts_render_tauri::gpu;
// `info` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::info;
// `metrics` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::metrics;
// `misc` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::misc;
// `monitoring` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::monitoring;
// `multimodal_commands` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::multimodal_commands;
// `pipeline` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::pipeline;
// `platform_optimization` вынесена в крейт `ts-render-tauri` (#91) — ре-экспорт-шим.
// specta_export-пути квалифицированы подмодулем, остаются валидны.
pub use ts_render_tauri::platform_optimization;
// `prerender` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::prerender;
// `preview` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::preview;
// `preview_advanced` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::preview_advanced;
// `project` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::project;
// `recognition_advanced_commands` вынесена в крейт `ts-render-tauri` (#91) — ре-экспорт-шим.
// Пути в app_builder уже квалифицированы подмодулем, поэтому остаются валидны.
pub use ts_render_tauri::recognition_advanced_commands;
// `rendering` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::rendering;
// `schema` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::schema;
// `service` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::service;
// `service_container` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::service_container;
pub mod state;
// `video_analysis` вынесена в крейт `ts-render-tauri` (#91) — ре-экспорт-шим.
pub use ts_render_tauri::video_analysis;
// `whisper_commands` вынесена в крейт `ts-render-tauri` (Wave 2, #91/#92) — ре-экспорт-шим.
pub use ts_render_tauri::whisper_commands;
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
// `CacheConfig` приходит и из misc::*, и из ai_api_proxy::* — разные типы; флэтовый
// commands::CacheConfig нигде не используется (все пути квалифицированы). #91 Wave 2.
#[allow(ambiguous_glob_reexports)]
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
