//! Модуль для команд работы со схемой
//!
//! Команды создания и управления элементами схемы проекта:
//! - Клипы, треки, эффекты, фильтры, субтитры
//! - Шаблоны и стили

pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;

// Re-export основных типов и команд
pub use commands::*;
pub use types::*;
