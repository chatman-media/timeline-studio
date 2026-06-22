//! Модуль настроек компилятора

pub mod business_logic;
pub mod commands;
pub mod tests;
pub mod types;

// Re-export commands for Tauri
pub use commands::*;
