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
pub mod compiler_settings_commands;
pub mod ffmpeg_advanced;
pub mod ffmpeg_builder;
pub mod frame_extraction;
pub mod gpu;
pub mod info;
pub mod metrics;
pub mod misc;
pub mod monitoring;
pub mod multimodal_commands;
pub mod pipeline;
pub mod platform_optimization;
pub mod prerender;
pub mod preview;
pub mod preview_advanced;
pub mod project;
pub mod recognition_advanced_commands;
pub mod rendering;
pub mod schema;
pub mod service;
pub mod service_container;
pub mod state;
pub mod video_analysis;
pub mod whisper_commands;
pub mod workflow;
// pub mod workflow_commands; // Заменено на модуль workflow

// Re-export всех команд для удобства использования
#[allow(ambiguous_glob_reexports)]
pub use ai_api_proxy::*;
#[allow(ambiguous_glob_reexports)]
pub use ollama_proxy::*;
#[allow(ambiguous_glob_reexports)]
pub use batch::*;
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
