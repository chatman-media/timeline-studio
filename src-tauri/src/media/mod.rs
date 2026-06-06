//! ДЕДУП (#95): медиа-ядро (ffmpeg/files/metadata/preview_data/thumbnail/types/
//! media_analyzer/performance_limits) — из крейта `ts-media`. Монолит хранит
//! Tauri-команды, registry, processor и файлы с AppHandle (video_compiler/registry).
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
