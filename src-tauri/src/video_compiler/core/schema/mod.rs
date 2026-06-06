//! Schema — доменная модель проекта Timeline Studio.
//!
//! ДЕДУП (#92/#93): исходники схемы вынесены в крейт `ts-schema` и здесь больше НЕ
//! дублируются — это тонкий ре-экспорт. Пути сохранены полностью:
//! - flattened: `crate::video_compiler::schema::ProjectSchema`, `...::Clip`, …
//! - submodules: `...::schema::{common,effects,export,project,subtitles,templates,timeline}::*`
//!
//! Всё резолвится через `ts_schema` (см. `crates/ts-schema`). Монолит и крейты
//! используют ОДНУ модель, без копий. Часть эпика декомпозиции #91.

pub use ts_schema::*;
