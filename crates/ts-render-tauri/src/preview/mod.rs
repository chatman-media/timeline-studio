//! Модуль для команд генерации превью
//!
//! Команды для создания превью кадров, миниатюр
//! и предварительного просмотра проекта.

pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;

// Re-export основных типов и команд
pub use commands::*;
pub use types::*;
