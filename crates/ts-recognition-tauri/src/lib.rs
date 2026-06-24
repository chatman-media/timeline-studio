//! ДЕДУП (#96): инференс-движки/типы/кластеризация — из крейта `ts-recognition`.
//! Монолит хранит Tauri-commands и vision_service (оркестратор поверх analysis).
pub use ts_recognition::recognition::*;

pub mod commands;
pub mod vision_service;
pub mod init_yolo;

pub use commands::person_commands;
pub use commands::RecognitionState;
pub use vision_service::{ImageAnalysisResult, VisionService, VisionServiceConfig};
