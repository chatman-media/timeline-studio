//! Модуль для оптимизации видео под социальные платформы
//!
//! Команды для оптимизации видео под различные платформы:
//! - YouTube, Instagram, TikTok, Facebook, Twitter
//! - Генерация миниатюр
//! - Проверка совместимости
//! - Автоматическая оптимизация под профили платформ
//! - 🆕 AI-powered генерация метаданных (title, description, tags, hashtags, SEO)

pub mod ai_metadata_commands; // 🆕 AI metadata generation commands
pub mod ai_metadata_generator; // 🆕 AI metadata generation service
pub mod ai_metadata_types; // 🆕 AI metadata types
pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;

// Re-export основных типов и команд
pub use ai_metadata_commands::*;
pub use ai_metadata_types::*;
pub use commands::*;
pub use types::*;
