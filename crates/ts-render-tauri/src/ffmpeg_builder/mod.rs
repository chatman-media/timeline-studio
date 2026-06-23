//! Модуль для команд работы с FFmpeg builder
//!
//! Команды для создания и управления FFmpeg командами:
//! - Добавление сегментных входов
//! - Настройки пререндеринга
//! - Поиск индексов клипов
//! - Информация о возможностях builder'а

pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;

// Re-export основных типов и команд
pub use commands::*;
pub use types::*;
