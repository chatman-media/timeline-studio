// Модуль для работы с медиафайлами
// Экспортируем публичные типы и функции

pub mod commands;
pub mod ffmpeg;
pub mod files;
pub mod metadata;
pub mod preview_data;
pub mod preview_manager;
pub mod processor;
pub mod registry;
pub mod thumbnail;
pub mod types;

// Новые модули после рефакторинга
pub mod additional_commands;
pub mod file_scanner;
pub mod media_analyzer;
pub mod metadata_extractor;
pub mod thumbnail_generator;

// Phase 5: Media & Compiler Commands
pub mod phase5_commands;

// Performance configuration for tests
#[cfg(test)]
pub mod performance_limits;

// Реэкспортируем основные типы для удобства использования
pub use processor::{MediaProcessor, ThumbnailOptions};

#[cfg(test)]
mod __tests__;
