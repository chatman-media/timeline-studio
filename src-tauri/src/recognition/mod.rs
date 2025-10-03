pub mod commands;
pub mod face_clustering;
pub mod facenet_processor;
pub mod mediapipe_processor;
pub mod ort_manager;
pub mod person_clustering;
pub mod person_database;
pub mod privacy_processor;
pub mod recognition_service;
pub mod retinaface_processor;
pub mod types;
pub mod types_professional;
pub mod yolo_processor;

// Новые модули после рефакторинга
pub mod frame_processor;
pub mod model_manager;
pub mod result_aggregator;
pub mod yolo_processor_refactored;

// Экспорт основных типов и сервисов
pub use face_clustering::{ClusteringStats, FaceClusteringEngine};
pub use person_clustering::PersonClusteringService;
pub use recognition_service::RecognitionService;
pub use types::RecognitionResults;

// Экспорт команд для использования в приложении
pub use commands::person_commands;
pub use commands::RecognitionState;

#[cfg(test)]
mod tests;

#[cfg(test)]
mod real_data_tests;

#[cfg(test)]
mod commands_test;
