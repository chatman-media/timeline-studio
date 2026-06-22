//! Модуль для команд получения информации о системе и компиляторе
//!
//! Команды для получения версии FFmpeg, информации о системе,
//! поддерживаемых форматах и кодеках.

pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;

// Re-export основных типов и команд
pub use commands::*;
pub use types::*;
