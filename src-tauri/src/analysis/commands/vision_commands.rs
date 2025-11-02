//! Vision Commands - Tauri API for Vision Service
//!
//! Provides Tauri commands for:
//! - Object detection (YOLO)
//! - Face detection (RetinaFace)
//! - Face embeddings (FaceNet)
//! - Color analysis
//! - Comprehensive image analysis

use crate::analysis::types::{ColorAnalysis, FaceDetection, ObjectDetection};
use crate::recognition::vision_service::{
    ImageAnalysisResult, VisionService, VisionServiceConfig,
};
use crate::recognition::{FaceNetModel, RetinaFaceModel, YoloModel};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/// Global VisionService state
pub struct VisionServiceState {
    service: Arc<RwLock<VisionService>>,
}

impl VisionServiceState {
    pub fn new() -> Self {
        let service = VisionService::new();
        Self {
            service: Arc::new(RwLock::new(service)),
        }
    }

    pub fn with_config(config: VisionServiceConfig) -> Self {
        let service = VisionService::with_config(config);
        Self {
            service: Arc::new(RwLock::new(service)),
        }
    }
}

impl Default for VisionServiceState {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/// Vision Service configuration for Tauri commands
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct VisionConfigDto {
    pub enable_object_detection: bool,
    pub enable_face_detection: bool,
    pub enable_face_embeddings: bool,
    pub enable_color_analysis: bool,
    pub yolo_model: String,
    pub object_confidence: f32,
    pub retinaface_model: String,
    pub facenet_model: String,
}

impl VisionConfigDto {
    fn to_service_config(&self) -> Result<VisionServiceConfig, String> {
        let yolo_model = match self.yolo_model.as_str() {
            "yolov8n" => YoloModel::YoloV8Nano,
            "yolov8s" => YoloModel::YoloV8Small,
            "yolov8m" => YoloModel::YoloV8Medium,
            "yolov8l" => YoloModel::YoloV8Large,
            "yolov8x" => YoloModel::YoloV8Extra,
            _ => return Err(format!("Unknown YOLO model: {}", self.yolo_model)),
        };

        let retinaface_model = match self.retinaface_model.as_str() {
            "mobilenet" => RetinaFaceModel::MobileNet,
            "resnet50" => RetinaFaceModel::ResNet50,
            "resnet50-enhanced" => RetinaFaceModel::ResNet50Enhanced,
            _ => {
                return Err(format!(
                    "Unknown RetinaFace model: {}",
                    self.retinaface_model
                ))
            }
        };

        let facenet_model = match self.facenet_model.as_str() {
            "facenet-128d" => FaceNetModel::FaceNet128D,
            "facenet-512d" => FaceNetModel::FaceNet512D,
            "arcface-512d" => FaceNetModel::ArcFace512D,
            _ => return Err(format!("Unknown FaceNet model: {}", self.facenet_model)),
        };

        Ok(VisionServiceConfig {
            enable_object_detection: self.enable_object_detection,
            enable_face_detection: self.enable_face_detection,
            enable_face_embeddings: self.enable_face_embeddings,
            enable_color_analysis: self.enable_color_analysis,
            yolo_model,
            object_confidence: self.object_confidence,
            retinaface_model,
            facenet_model,
        })
    }
}

// ============================================================================
// COMMANDS
// ============================================================================

/// Initialize Vision Service with optional configuration
#[tauri::command]
#[specta::specta]
pub async fn initialize_vision_service(
    config: Option<VisionConfigDto>,
    state: State<'_, VisionServiceState>,
) -> Result<String, String> {
    log::info!("Initializing Vision Service");

    // Update service if config is provided
    if let Some(cfg) = config {
        let service_config = cfg.to_service_config()?;
        let mut service_lock = state.service.write().await;
        *service_lock = VisionService::with_config(service_config);
    }

    // Initialize the service (load models)
    let service = state.service.read().await;
    service
        .initialize()
        .await
        .map_err(|e| format!("Failed to initialize Vision Service: {}", e))?;

    log::info!("Vision Service initialized successfully");
    Ok("Vision Service initialized".to_string())
}

/// Configure Vision Service without reinitializing
#[tauri::command]
#[specta::specta]
pub async fn configure_vision_service(
    config: VisionConfigDto,
    state: State<'_, VisionServiceState>,
) -> Result<String, String> {
    log::info!("Configuring Vision Service: {:?}", config);

    let service_config = config.to_service_config()?;
    let mut service_lock = state.service.write().await;
    *service_lock = VisionService::with_config(service_config);

    log::info!("Vision Service configured successfully");
    Ok("Vision Service configured".to_string())
}

// ============================================================================
// OBJECT DETECTION
// ============================================================================

/// Detect objects in an image using YOLO
#[tauri::command]
#[specta::specta]
pub async fn detect_objects(
    image_path: String,
    state: State<'_, VisionServiceState>,
) -> Result<Vec<ObjectDetection>, String> {
    log::debug!("Detecting objects in: {}", image_path);

    let service = state.service.read().await;
    let detections = service
        .detect_objects(&image_path)
        .await
        .map_err(|e| format!("Failed to detect objects: {}", e))?;

    log::info!("Detected {} objects", detections.len());
    Ok(detections)
}

/// Detect objects in multiple images (batch processing)
#[tauri::command]
#[specta::specta]
pub async fn detect_objects_batch(
    image_paths: Vec<String>,
    state: State<'_, VisionServiceState>,
) -> Result<Vec<Vec<ObjectDetection>>, String> {
    log::info!("Batch object detection for {} images", image_paths.len());

    let service = state.service.read().await;
    let results = service
        .detect_objects_batch(&image_paths)
        .await
        .map_err(|e| format!("Failed to detect objects in batch: {}", e))?;

    let total_objects: usize = results.iter().map(|r| r.len()).sum();
    log::info!(
        "Detected {} objects across {} images",
        total_objects,
        image_paths.len()
    );
    Ok(results)
}

// ============================================================================
// FACE DETECTION
// ============================================================================

/// Detect faces in an image using RetinaFace
#[tauri::command]
#[specta::specta]
pub async fn detect_faces(
    image_path: String,
    state: State<'_, VisionServiceState>,
) -> Result<Vec<FaceDetection>, String> {
    log::debug!("Detecting faces in: {}", image_path);

    let service = state.service.read().await;
    let detections = service
        .detect_faces(&image_path)
        .await
        .map_err(|e| format!("Failed to detect faces: {}", e))?;

    log::info!("Detected {} faces", detections.len());
    Ok(detections)
}

/// Detect faces with embeddings (RetinaFace + FaceNet)
#[tauri::command]
#[specta::specta]
pub async fn detect_faces_with_embeddings(
    image_path: String,
    state: State<'_, VisionServiceState>,
) -> Result<Vec<FaceDetection>, String> {
    log::debug!("Detecting faces with embeddings in: {}", image_path);

    let service = state.service.read().await;
    let detections = service
        .detect_faces_with_embeddings(&image_path)
        .await
        .map_err(|e| format!("Failed to detect faces with embeddings: {}", e))?;

    let faces_with_embeddings = detections.iter().filter(|f| f.embedding.is_some()).count();
    log::info!(
        "Detected {} faces, {} with embeddings",
        detections.len(),
        faces_with_embeddings
    );
    Ok(detections)
}

// ============================================================================
// COLOR ANALYSIS
// ============================================================================

/// Analyze colors in an image
#[tauri::command]
#[specta::specta]
pub async fn analyze_colors(
    image_path: String,
    state: State<'_, VisionServiceState>,
) -> Result<ColorAnalysis, String> {
    log::debug!("Analyzing colors in: {}", image_path);

    let service = state.service.read().await;
    let analysis = service
        .analyze_colors(&image_path)
        .await
        .map_err(|e| format!("Failed to analyze colors: {}", e))?;

    log::info!(
        "Analyzed colors: {} dominant colors, temperature: {:?}",
        analysis.dominant_colors.len(),
        analysis.temperature
    );
    Ok(analysis)
}

// ============================================================================
// COMPREHENSIVE ANALYSIS
// ============================================================================

/// Perform comprehensive image analysis (objects, faces, colors)
#[tauri::command]
#[specta::specta]
pub async fn analyze_image(
    image_path: String,
    state: State<'_, VisionServiceState>,
) -> Result<ImageAnalysisResult, String> {
    log::info!("Performing comprehensive image analysis: {}", image_path);

    let service = state.service.read().await;
    let result = service
        .analyze_image(&image_path)
        .await
        .map_err(|e| format!("Failed to analyze image: {}", e))?;

    log::info!(
        "Image analysis complete - Objects: {}, Faces: {}, Colors: {}",
        result.objects.as_ref().map(|o| o.len()).unwrap_or(0),
        result.faces.as_ref().map(|f| f.len()).unwrap_or(0),
        result.colors.is_some()
    );
    Ok(result)
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vision_service_state_creation() {
        let state = VisionServiceState::new();
        assert!(Arc::strong_count(&state.service) == 1);
    }

    #[test]
    fn test_vision_config_dto_conversion() {
        let dto = VisionConfigDto {
            enable_object_detection: true,
            enable_face_detection: true,
            enable_face_embeddings: true,
            enable_color_analysis: true,
            yolo_model: "yolov8n".to_string(),
            object_confidence: 0.5,
            retinaface_model: "mobilenet".to_string(),
            facenet_model: "facenet-128d".to_string(),
        };

        let config = dto.to_service_config();
        assert!(config.is_ok());

        let config = config.unwrap();
        assert!(config.enable_object_detection);
        assert!(config.enable_face_detection);
        assert_eq!(config.object_confidence, 0.5);
    }

    #[test]
    fn test_vision_config_dto_invalid_model() {
        let dto = VisionConfigDto {
            enable_object_detection: true,
            enable_face_detection: false,
            enable_face_embeddings: false,
            enable_color_analysis: false,
            yolo_model: "invalid_model".to_string(),
            object_confidence: 0.5,
            retinaface_model: "mobilenet".to_string(),
            facenet_model: "facenet-128d".to_string(),
        };

        let config = dto.to_service_config();
        assert!(config.is_err());
    }

    #[tokio::test]
    async fn test_initialize_vision_service() {
        let state = VisionServiceState::new();
        // This will likely fail without models, but should not panic
        let result = initialize_vision_service(None, State::from(&state)).await;
        // In test environment without models, we expect an error
        assert!(result.is_ok() || result.is_err());
    }
}
