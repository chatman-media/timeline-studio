//! Медиа-слой вынесен в крейт `ts-media-tauri` (#354/#357) поверх ядра `ts-media`.
//! Ре-экспорт-шим: `crate::media::{commands,processor,MediaProcessor,...}` и доступ к
//! медиа-ядру резолвятся у потребителей (state, app_builder, ...) без правок.
pub use ts_media_tauri::*;
