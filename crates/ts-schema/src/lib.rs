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
//! - `contracts` - Agent contract types (AnalysisResult, OptimizeRequest/Result, PublishRequest/Result)

pub mod common;
pub mod contracts;
pub mod effects;
pub mod export;
pub mod project;
pub mod subtitles;
pub mod templates;
pub mod timeline;
pub mod constants;
pub mod versioning;

// Re-export всех основных типов для удобства использования
pub use common::*;
pub use versioning::{check_compatibility, is_compatible, parse_semver, SCHEMA_VERSION};
pub use effects::*;
pub use export::*;
pub use project::*;
pub use subtitles::*;
pub use templates::*;
pub use timeline::*;

