//! Команды для работы с Whisper API
//!
//! Поддерживает транскрипцию и перевод через OpenAI Whisper API,
//! а также работу с локальными моделями whisper.cpp

// ============ Экспорт публичных типов ============
pub use business_logic::*;
pub use commands::*;
pub use types::*;

// ============ Модули ============
pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;
