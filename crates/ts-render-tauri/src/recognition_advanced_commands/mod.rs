//! Recognition Advanced Commands - продвинутые команды для системы распознавания

// ============ Экспорт публичных типов ============
pub use business_logic::*;
pub use commands::*;
pub use types::*;

// ============ Модули ============
mod business_logic;
mod commands;
mod types;

#[cfg(test)]
mod tests;
