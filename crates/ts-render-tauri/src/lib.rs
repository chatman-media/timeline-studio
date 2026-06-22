//! `ts-render-tauri` — тонкий Tauri-командный слой Timeline Studio.
//!
//! Цель крейта (эпик #91/#92, Option B плана выноса `video_compiler/`): постепенно
//! переселить сюда `src-tauri/src/video_compiler/{commands,...}` из монолита,
//! сохраняя пути и сигнатуры байт-в-байт, чтобы `app_builder.rs::generate_handler!` и
//! `specta_export.rs` продолжали резолвиться без изменений.
//!
//! Перенос идёт ПОГРУППНО. Каждая группа команд переезжает целиком вместе со своими
//! `business_logic`/`types`/`tests`, после чего в монолите `video_compiler/commands/mod.rs`
//! строка `pub mod <group>;` заменяется на ре-экспорт `pub use ts_render_tauri::<group>;`.
//! Это сохраняет плоский путь `crate::video_compiler::commands::<fn>` валидным.
//!
//! ВАЖНО: в отличие от headless-крейтов `ts-render` (#90) и `ts-render-services` (Wave 1),
//! этот крейт ЗАВИСИТ от `tauri`, потому что несёт `#[tauri::command]`-обёртки. Это
//! сознательное отступление от чартера headless-крейтов и причина, по которой
//! command-слой не может жить в `ts-render` / `ts-render-services`.
//!
//! Tauri-free фундамент (`VideoCompilerState` + `ServiceContainer` + `services/*` +
//! `ffmpeg_command/`) вынесен в крейт `ts-render-services` и реэкспортируется оттуда;
//! здесь его больше нет.

/// Первая перенесённая группа: автоматизированные workflow видеомонтажа.
///
/// Выбрана как пилотный вертикальный срез: единственная группа из 28, НЕ зависящая от
/// `VideoCompilerState` / `ServiceContainer` / `video_compiler::core::*`. Все команды
/// возвращают `Result<_, String>` и шелятся в `ffmpeg`/`ffprobe` через `std::process::Command`
/// — никакой линковки libav, никакого общего состояния.
pub mod workflow;

/// Re-export Tauri-free фундамента из `ts-render-services` под именами, которые
/// исторически жили в этом крейте, — чтобы потребители, ссылавшиеся на
/// `ts_render_tauri::{VideoCompilerState, ServiceContainer}`, продолжали резолвиться.
/// Источник истины — крейт `ts-render-services`.
pub use ts_render_services::{ServiceContainer, VideoCompilerState};
