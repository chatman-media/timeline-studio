// Модуль для работы с медиафайлами
// Экспортируем публичные типы и функции

pub mod ffmpeg;
pub mod files;
pub mod metadata;
pub mod preview_data;
pub mod thumbnail;
pub mod types;

// Новые модули после рефакторинга
pub mod media_analyzer;

// Phase 5: Media & Compiler Commands

// Performance configuration for tests
pub mod performance_limits;

// Реэкспортируем основные типы для удобства использования

