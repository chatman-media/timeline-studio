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

/// Wave 2: группа команд `batch` (пакетная обработка задач рендеринга, реестр задач).
/// Берёт `error`/`VideoCompilerState` из фундамента, `once_cell::Lazy` для реестра.
/// Шим: `pub use ts_render_tauri::batch;`.
pub mod batch;

/// Wave 2: группа команд `cache` (управление кэшем рендера/превью/метаданных).
/// Берёт `core::cache`/`services::cache_service` из фундамента. Шим: `pub use ts_render_tauri::cache;`.
pub mod cache;

/// Wave 2: группа команд `schema` (создание элементов схемы: клипы/эффекты/фильтры/
/// субтитры/шаблоны/разрешения). Берёт `core::schema::*` (=ts_schema) из `ts-render`.
/// Шим: `pub use ts_render_tauri::schema;`.
pub mod schema;

/// Wave 2: группа команд `multimodal_commands` (извлечение кадров для мультимодального
/// анализа, коллажи, image->base64). Берёт `core::{ffmpeg_executor,schema}` из `ts-render`.
/// Шим: `pub use ts_render_tauri::multimodal_commands;`.
pub mod multimodal_commands;

/// Wave 2: группа команд `pipeline` (конвейер рендеринга: стадии, контекст, прогресс).
/// Берёт `core::{pipeline_refactored,stages,progress}`/`CompilerSettings` из `ts-render`.
/// Шим: `pub use ts_render_tauri::pipeline;`.
pub mod pipeline;

/// Wave 2: группа команд `preview` (генерация превью/раскадровок/waveform/превью-кэш).
/// Берёт `core::preview`/`services::preview_service` из фундамента. Шим: `pub use ts_render_tauri::preview;`.
pub mod preview;

/// Wave 2: группа команд `metrics` (агрегированные метрики, алерты кэша, prometheus).
/// Берёт `services::{monitoring,cache_service,METRICS}` из фундамента. Шим: `pub use ts_render_tauri::metrics;`.
pub mod metrics;

/// Wave 2: группа команд `service` (статус сервисов, задачи рендера, health).
/// Берёт `VideoCompilerState`/`services::*`/`core::{schema,renderer,cache}` из фундамента.
/// Шим: `pub use ts_render_tauri::service;`.
pub mod service;

/// Wave 2: группа команд `ffmpeg_advanced` (расширенные ffmpeg-операции:
/// фильтры, concat, gif/subtitle превью, проба медиа). Берёт
/// `core::{ffmpeg_builder,ffmpeg_executor,progress,schema,error}` из `ts-render`.
/// Шим: `pub use ts_render_tauri::ffmpeg_advanced;`.
pub mod ffmpeg_advanced;

/// Wave 2: группа команд `ffmpeg_builder` (построение ffmpeg-команд из схемы).
/// Берёт `core::{renderer,ffmpeg_builder,ffmpeg_executor,progress,schema}` из `ts-render`.
/// Шим: `pub use ts_render_tauri::ffmpeg_builder;`.
pub mod ffmpeg_builder;

/// Wave 2: группа команд `rendering` (компиляция/отмена рендера, команды рендеринга).
/// Берёт `core::{frame_extraction,ffmpeg_builder,progress,schema,error}` из `ts-render`.
/// Шим: `pub use ts_render_tauri::rendering;`.
pub mod rendering;

/// Wave 2: группа команд `whisper_commands` (локальный/OpenAI Whisper, аудио для транскрипции).
/// Берёт `core::{error,ffmpeg_executor}` из `ts-render`, reqwest для OpenAI API.
/// Шим: `pub use ts_render_tauri::whisper_commands;`.
pub mod whisper_commands;

/// Wave 2: группа команд `frame_extraction` (извлечение кадров/субтитров/распознавания).
/// Берёт `core::{frame_extraction,...}` из `ts-render`. Шим: `pub use ts_render_tauri::frame_extraction;`.
pub mod frame_extraction;

/// Re-export Tauri-free фундамента из `ts-render-services` под именами, которые
/// исторически жили в этом крейте, — чтобы потребители, ссылавшиеся на
/// `ts_render_tauri::{VideoCompilerState, ServiceContainer}`, продолжали резолвиться.
/// Источник истины — крейт `ts-render-services`.
pub use ts_render_services::{ServiceContainer, VideoCompilerState};
