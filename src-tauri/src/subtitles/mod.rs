//! Субтитры Timeline Studio.
//!
//! ДЕДУП (#99): вся логика (read/save/validate/convert/info для SRT/VTT/ASS) — в крейте
//! `ts-subtitles`; здесь только тонкие Tauri-обёртки (`commands`). Ре-экспортируем ТИПЫ
//! из крейта (не функции — иначе коллизия с одноимёнными Tauri-командами).
#[allow(unused_imports)]
pub use ts_subtitles::subtitles::{SubtitleExportOptions, SubtitleImportResult, SubtitleInfo};

pub mod commands;
pub use commands::*;
