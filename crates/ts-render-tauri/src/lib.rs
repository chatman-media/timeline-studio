//! `ts-render-tauri` — Tauri-командный слой Timeline Studio.
//!
//! Цель крейта (эпик #91/#92, Option B плана выноса `video_compiler/`): постепенно
//! переселить сюда `src-tauri/src/video_compiler/{commands,services,state}` из монолита,
//! сохраняя пути и сигнатуры байт-в-байт, чтобы `app_builder.rs::generate_handler!` и
//! `specta_export.rs` продолжали резолвиться без изменений.
//!
//! Перенос идёт ПОГРУППНО. Каждая группа команд переезжает целиком вместе со своими
//! `business_logic`/`types`/`tests`, после чего в монолите `video_compiler/commands/mod.rs`
//! строка `pub mod <group>;` заменяется на ре-экспорт `pub use ts_render_tauri::<group>;`.
//! Это сохраняет плоский путь `crate::video_compiler::commands::<fn>` валидным.
//!
//! ВАЖНО: в отличие от headless-крейта `ts-render` (Tauri/ort/libav-free), этот крейт
//! ЗАВИСИТ от `tauri`, потому что несёт `#[tauri::command]`-обёртки. Это сознательное
//! отступление от чартера `ts-render` и причина, по которой command/service-слой не может
//! жить в `ts-render`.

/// Первая перенесённая группа: автоматизированные workflow видеомонтажа.
///
/// Выбрана как пилотный вертикальный срез: единственная группа из 28, НЕ зависящая от
/// `VideoCompilerState` / `ServiceContainer` / `video_compiler::core::*`. Все команды
/// возвращают `Result<_, String>` и шелятся в `ffmpeg`/`ffprobe` через `std::process::Command`
/// — никакой линковки libav, никакого общего состояния.
pub mod workflow;

/// Сервисный слой Video Compiler (Wave 1, эпик #91): DI-контейнер `ServiceContainer`
/// + 8 сервисов (cache/ffmpeg/gpu/monitoring/preview/project/render/transition).
/// Обёртывают движок `ts-render` для работающего приложения и держат общее состояние.
///
/// В монолите `video_compiler/services/mod.rs` оставлен ре-экспорт-шим
/// (`pub use ts_render_tauri::services::*;`), чтобы путь
/// `crate::video_compiler::services::*` у ~26 групп команд резолвился без правок.
pub mod services;

/// Состояние Video Compiler для Tauri (Wave 1): `VideoCompilerState`
/// (handler-стейт через `tauri::State<VideoCompilerState>`), `ActiveRenderJob`,
/// `RenderJobMetadata`, `RenderJob`.
///
/// КРИТИЧНО (B2): тип, инжектируемый в `tauri::Builder::manage(...)`, ДОЛЖЕН быть ровно
/// этот тип. В монолите `video_compiler/commands/state.rs` оставлен ре-экспорт-шим, а
/// `video_compiler/mod.rs` продолжает `pub use commands::VideoCompilerState;` — так что
/// `crate::video_compiler::VideoCompilerState` и `::commands::state::*` остаются валидны.
pub mod state;

/// FFmpeg-командный примитив, нужный сервисному слою (`preview_service`).
///
/// Извлечён из монолитного `core/ffmpeg/mod.rs` БЕЗ изменения логики (волна 1 не может
/// переехать без него). Анализное поддерево `core/ffmpeg/` остаётся в монолите и видит
/// эти символы через ре-экспорт-шим `pub use ts_render_tauri::ffmpeg_command::*;`.
pub mod ffmpeg_command;

/// Re-export фундамента под именами, ожидаемыми монолитом и будущими волнами.
pub use services::ServiceContainer;
pub use state::VideoCompilerState;
