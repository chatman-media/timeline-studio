//! `ts-media-tauri` — Tauri-командный слой медиа Timeline Studio (#354/#357).
//!
//! Вынесено из монолита `src-tauri/src/media/`: `#[tauri::command]`-обёртки (commands/
//! additional_commands/phase5_commands), registry, и AppHandle-привязанные файлы
//! (processor/file_scanner/metadata_extractor/thumbnail_generator/preview_manager).
//! Медиа-ядро (ffmpeg/files/metadata/types/...) — в headless-крейте `ts-media` (#95),
//! реэкспортируется отсюда.

pub use ts_media::media::*;

pub mod commands;
pub mod additional_commands;
pub mod phase5_commands;
pub mod registry;
pub mod processor;
pub mod file_scanner;
pub mod metadata_extractor;
pub mod thumbnail_generator;
pub mod preview_manager;

pub use processor::{MediaProcessor, ThumbnailOptions};
