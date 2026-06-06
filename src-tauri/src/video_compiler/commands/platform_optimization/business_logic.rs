//! ДЕДУП (#121): логика платформо-оптимизации (optimize/thumbnail, ffmpeg-CLI) — в крейте
//! `ts-platform`. Здесь только ре-экспорт; Tauri-команды (commands.rs) — тонкие обёртки.
pub use ts_platform::business_logic::*;
