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

/// Wave 2: группа команд `gpu` (детект/возможности/аппаратное ускорение).
///
/// Первая перенесённая state-зависимая группа: команды берут `GpuService` через
/// `tauri::State<VideoCompilerState>` (фундамент в `ts-render-services`) и движок
/// `GpuDetector`/`GpuInfo` из `ts-render`. В монолите `video_compiler/commands/mod.rs`
/// оставлен ре-экспорт-шим `pub use ts_render_tauri::gpu;`; записи в
/// `app_builder.rs::generate_handler!` квалифицированы подмодулем `gpu::<fn>`.
pub mod gpu;

/// Wave 2: группа команд `info` (версия ffmpeg, кодеки, системная информация).
/// Берёт `FileInfo`/`VideoCompilerState` из `ts-render-services`, `error` из `ts-render`,
/// системные метрики через `sysinfo`. Шим: `pub use ts_render_tauri::info;`.
pub mod info;

/// Wave 2: группа команд `monitoring` (метрики сервисов, prometheus-экспорт,
/// progress tracker). Берёт `services::monitoring::*`/`VideoCompilerState` из
/// `ts-render-services`. Шим: `pub use ts_render_tauri::monitoring;`.
pub mod monitoring;

/// Wave 2: группа команд `service_container` (инфо о сервисах, `MetricsRegistry`).
/// Берёт `ServiceContainer`/`services::monitoring::*` из `ts-render-services`.
/// Шим: `pub use ts_render_tauri::service_container;`.
pub mod service_container;

/// Wave 2: группа команд `compiler_settings_commands` (чтение/запись настроек
/// компилятора, quality-пресеты). Берёт `core::constants`/`error` из `ts-render`,
/// `VideoCompilerState` из `ts-render-services`. Шим: `pub use ts_render_tauri::compiler_settings_commands;`.
pub mod compiler_settings_commands;

/// Wave 2: группа команд `preview_advanced` (расширенная генерация превью,
/// batch/одиночный кадр). Берёт `core::preview` из `ts-render`, base64-декод кадров.
/// Шим: `pub use ts_render_tauri::preview_advanced;`.
pub mod preview_advanced;

/// Wave 2: группа команд `prerender` (пре-рендер сегментов, кэш пре-рендера).
/// Берёт `core::schema::ProjectSchema`/`error` из `ts-render`. Шим: `pub use ts_render_tauri::prerender;`.
pub mod prerender;

/// Wave 2: группа команд `project` (валидация/бэкап/merge/split схемы проекта,
/// субтитры). Берёт `core::{schema,error}` из `ts-render`, `VideoCompilerState` из
/// `ts-render-services`. Шим: `pub use ts_render_tauri::project;`.
pub mod project;

/// Re-export Tauri-free фундамента из `ts-render-services` под именами, которые
/// исторически жили в этом крейте, — чтобы потребители, ссылавшиеся на
/// `ts_render_tauri::{VideoCompilerState, ServiceContainer}`, продолжали резолвиться.
/// Источник истины — крейт `ts-render-services`.
pub use ts_render_services::{ServiceContainer, VideoCompilerState};
