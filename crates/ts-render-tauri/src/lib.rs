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
