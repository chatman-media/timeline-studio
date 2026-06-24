//! Слой распознавания вынесен в крейт `ts-recognition-tauri` (#354/#355) поверх ts-recognition.
//! Ре-экспорт-шим: `crate::recognition::{commands,vision_service,RecognitionState,...}` и движок
//! резолвятся у потребителей (montage_planner, app_builder, media) без правок.
pub use ts_recognition_tauri::*;
