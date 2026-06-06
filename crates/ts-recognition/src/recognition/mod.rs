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

// Новые модули после рефакторинга
pub mod frame_processor;
pub mod model_manager;
pub mod result_aggregator;
pub mod yolo_processor_refactored;

// Экспорт основных типов и сервисов
pub use face_clustering::{ClusteringStats, FaceClusteringEngine};
pub use facenet_processor::FaceNetModel; // 🆕 Export FaceNet models
pub use person_clustering::PersonClusteringService;
pub use recognition_service::RecognitionService;
pub use retinaface_processor::RetinaFaceModel; // 🆕 Export RetinaFace models
pub use types::RecognitionResults;

// YOLO exports - using refactored implementation only
pub use frame_processor::{BoundingBox, Detection, FaceAttributes, ProcessingConfig};
pub use model_manager::YoloModel;
pub use yolo_processor_refactored::{ProcessorConfig, YoloProcessor};

// Экспорт команд для использования в приложении



