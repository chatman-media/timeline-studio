//! `ts-platform` — платформо-оптимизация видео (optimize/thumbnail под платформы),
//! headless ffmpeg-CLI без Tauri. Вынесено из монолитного video_compiler/commands/
//! platform_optimization (#121 / M2). Tauri-команды монолита делают тонкие обёртки.
pub mod business_logic;
pub mod types;

#[cfg(test)]
mod tests;
