//! FFmpeg Builder - Модульная структура для построения команд FFmpeg
//!
//! Этот модуль разделен на несколько подмодулей для лучшей организации:
//! - `builder` - Основная логика построителя
//! - `filters` - Построение фильтров (видео, аудио, эффекты)
//! - `inputs` - Обработка входных источников
//! - `outputs` - Конфигурация выходных параметров
//! - `effects` - Обработка эффектов и переходов
//! - `subtitles` - Обработка субтитров
//! - `templates` - Обработка шаблонов
//! - `advanced` - Расширенные операции FFmpeg

pub mod advanced;
pub mod builder;
pub mod effects;
pub mod filters;
pub mod inputs;
pub mod outputs;
pub mod subtitles;
pub mod templates;

// Re-export main types
pub use builder::FFmpegBuilder;
