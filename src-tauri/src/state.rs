//! Рантайм состояния вынесен в крейт `ts-state-tauri` (#354/#360).
//! Ре-экспорт-шим: `crate::state::{StateManager,ProjectState,commands,commands_api,...}`
//! резолвятся у потребителей (recognition, analysis, mcp, app_builder) без правок.
pub use ts_state_tauri::*;
