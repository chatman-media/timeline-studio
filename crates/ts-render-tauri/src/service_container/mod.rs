//! Модуль для работы с ServiceContainer и метриками
//!
//! Команды для управления сервисами и мониторинга:
//! - Информация о проектных сервисах
//! - Получение детальных метрик сервисов
//! - Сводки всех метрик системы
//! - Экспорт метрик в формате Prometheus

pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;

// Re-export основных типов и команд
pub use commands::*;
pub use types::*;
