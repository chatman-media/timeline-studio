//! Модуль извлечения кадров
//!
//! Предоставляет функциональность для извлечения кадров из видео и таймлайна,
//! включая генерацию превью, извлечение ключевых кадров и работу с субтитрами.

pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;

// Re-export основных типов и команд
pub use commands::*;
pub use types::*;
