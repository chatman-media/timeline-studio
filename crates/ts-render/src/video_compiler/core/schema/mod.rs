//! Schema - Модульная структура схемы данных проекта Timeline Studio
//!
//! Схема разделена на следующие модули:
//! - `project` - Основная схема проекта и метаданные
//! - `timeline` - Timeline, треки и клипы
//! - `effects` - Эффекты, фильтры и переходы
//! - `templates` - Шаблоны и стилевые шаблоны
//! - `subtitles` - Субтитры и их настройки
//! - `export` - Настройки экспорта и форматы вывода
//! - `common` - Общие типы и утилиты

pub mod common;
pub mod effects;
pub mod export;
pub mod project;
pub mod subtitles;
pub mod templates;
pub mod timeline;

// Re-export всех основных типов для удобства использования
pub use common::*;
pub use effects::*;
pub use export::*;
pub use project::*;
pub use subtitles::*;
pub use templates::*;
pub use timeline::*;

#[cfg(test)]
mod tests;
