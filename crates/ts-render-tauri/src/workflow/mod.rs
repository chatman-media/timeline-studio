//! Модуль автоматизированных рабочих процессов видеомонтажа
//!
//! Команды для создания и выполнения workflow:
//! - Создание временных директорий
//! - Создание проектов timeline
//! - Компиляция видео workflow
//! - Анализ качества видео
//! - Создание превью
//! - Очистка временных файлов

pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;

// Re-export основных типов и команд
pub use commands::*;
pub use types::*;
