//! ДЕДУП (#99): логика субтитров — из крейта `ts-subtitles`; монолит хранит только Tauri-commands.
pub use ts_subtitles::subtitles::*;

pub mod commands;
pub use commands::*;
