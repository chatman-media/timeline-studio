//! Модуль для команд управления проектами
//!
//! Команды для валидации, анализа и управления проектами,
//! включая обработку субтитров и оптимизацию.

pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;

// Re-export основных типов и команд
pub use commands::*;
pub use types::*;
