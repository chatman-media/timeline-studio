//! Слой анализа вынесен в крейт `ts-analysis-tauri` (#354/#356) поверх ts-analysis.
//! Ре-экспорт-шим: `crate::analysis::{commands,services,engines,adapters,types,...}`.
pub use ts_analysis_tauri::*;
