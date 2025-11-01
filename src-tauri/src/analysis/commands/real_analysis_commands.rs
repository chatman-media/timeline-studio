// Tauri commands для Real Analysis Engine

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;

use crate::analysis::services::real_analysis_engine::{RealAnalysisEngine, AnalysisEngineConfig};
use crate::analysis::models::AnalysisProjectResults;
use crate::recognition::yolo_processor::YoloModel;
use crate::recognition::facenet_processor::FaceNetModel;

/// Состояние Real Analysis Engine
pub struct RealAnalysisEngineState {
    pub engine: Arc<RealAnalysisEngine>,
}

/// Конфигурация для создания Real Analysis Engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRealEngineConfig {
    /// Модель для детекции объектов
    pub object_model: Option<String>,
    /// Модель для детекции лиц  
    pub face_detection_model: Option<String>,
    /// Модель для encoding лиц
    pub face_encoding_model: Option<String>,
    /// Порог confidence для объектов
    pub object_confidence_threshold: Option<f32>,
    /// Порог confidence для лиц
    pub face_confidence_threshold: Option<f32>,
    /// Кадров в минуту для анализа
    pub frames_per_minute: Option<u32>,
    /// Детальный анализ
    pub detailed_analysis: Option<bool>,
}

/// Статус готовности моделей
#[derive(Debug, Serialize)]
pub struct ModelsStatus {
    pub models_ready: bool,
    pub object_detector_ready: bool,
    pub face_detector_ready: bool,
    pub face_encoder_ready: bool,
    pub initialization_errors: Vec<String>,
}

/// Информация о конфигурации движка
#[derive(Debug, Serialize)]
pub struct EngineInfo {
    pub object_model: String,
    pub face_detection_model: String,
    pub face_encoding_model: String,
    pub object_confidence_threshold: f32,
    pub face_confidence_threshold: f32,
    pub frames_per_minute: u32,
    pub detailed_analysis: bool,
}

/// Инициализация Real Analysis Engine с ONNX моделями
#[tauri::command]
pub async fn initialize_real_analysis_engine(
    config: Option<CreateRealEngineConfig>,
    state: State<'_, crate::AppState>,
) -> Result<(), String> {
    log::info!("Initializing Real Analysis Engine...");
    
    let app_state = state.lock().await;
    
    // Создаем конфигурацию
    let engine_config = if let Some(config) = config {
        AnalysisEngineConfig {
            object_model: parse_yolo_model(&config.object_model.unwrap_or("YoloV11Nano".to_string())),
            face_detection_model: parse_yolo_model(&config.face_detection_model.unwrap_or("YoloV11FaceNano".to_string())),
            face_encoding_model: parse_facenet_model(&config.face_encoding_model.unwrap_or("FaceNet128D".to_string())),
            object_confidence_threshold: config.object_confidence_threshold.unwrap_or(0.5),
            face_confidence_threshold: config.face_confidence_threshold.unwrap_or(0.7),
            frames_per_minute: config.frames_per_minute.unwrap_or(30),
            detailed_analysis: config.detailed_analysis.unwrap_or(false),
        }
    } else {
        AnalysisEngineConfig::default()
    };
    
    // Создаем Real Analysis Engine
    let engine = RealAnalysisEngine::new(
        app_state.analysis_db.clone(),
        app_state.person_db.clone(),
        app_state.project_manager.clone(),
        Some(engine_config),
    );
    
    // Инициализируем ONNX модели
    match engine.initialize_models().await {
        Ok(_) => {
            log::info!("Real Analysis Engine initialized successfully");
            // TODO: Сохранить engine в app state
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to initialize Real Analysis Engine: {}", e);
            Err(format!("Failed to initialize ONNX models: {}", e))
        }
    }
}

/// Проверка статуса готовности ONNX моделей
#[tauri::command]
pub async fn check_models_status(
    state: State<'_, crate::AppState>,
) -> Result<ModelsStatus, String> {
    // TODO: Получить engine из state и проверить статус
    // Пока возвращаем mock данные
    Ok(ModelsStatus {
        models_ready: false,
        object_detector_ready: false,
        face_detector_ready: false,
        face_encoder_ready: false,
        initialization_errors: vec![
            "Real Analysis Engine not initialized yet".to_string()
        ],
    })
}

/// Получение информации о конфигурации движка
#[tauri::command]
pub async fn get_engine_info(
    state: State<'_, crate::AppState>,
) -> Result<EngineInfo, String> {
    // TODO: Получить из real engine
    Ok(EngineInfo {
        object_model: "YoloV11Nano".to_string(),
        face_detection_model: "YoloV11FaceNano".to_string(),
        face_encoding_model: "FaceNet128D".to_string(),
        object_confidence_threshold: 0.5,
        face_confidence_threshold: 0.7,
        frames_per_minute: 30,
        detailed_analysis: false,
    })
}

/// Запуск анализа проекта с реальными ONNX моделями
#[tauri::command]
pub async fn start_real_project_analysis(
    project_id: String,
    state: State<'_, crate::AppState>,
) -> Result<AnalysisProjectResults, String> {
    let project_uuid = Uuid::parse_str(&project_id)
        .map_err(|e| format!("Invalid project ID: {}", e))?;
    
    log::info!("Starting real ONNX analysis for project: {}", project_uuid);
    
    // TODO: Получить real engine из state и запустить анализ
    // Пока возвращаем ошибку
    Err("Real Analysis Engine not available. Use initialize_real_analysis_engine first.".to_string())
}

/// Переключение между Real и Mock движками
#[tauri::command]
pub async fn switch_analysis_engine(
    use_real_engine: bool,
    state: State<'_, crate::AppState>,
) -> Result<String, String> {
    if use_real_engine {
        log::info!("Switching to Real Analysis Engine");
        // TODO: Переключиться на real engine
        Ok("Switched to Real Analysis Engine".to_string())
    } else {
        log::info!("Switching to Mock Analysis Engine");
        // TODO: Переключиться на mock engine
        Ok("Switched to Mock Analysis Engine".to_string())
    }
}

/// Получение доступных ONNX моделей
#[tauri::command]
pub async fn get_available_models() -> Result<AvailableModels, String> {
    Ok(AvailableModels {
        object_detection_models: vec![
            "YoloV11Nano".to_string(),
            "YoloV11Small".to_string(),
            "YoloV11Medium".to_string(),
            "YoloV11Large".to_string(),
            "YoloV8Nano".to_string(),
            "YoloV8Small".to_string(),
        ],
        face_detection_models: vec![
            "YoloV11FaceNano".to_string(),
            "YoloV11FaceSmall".to_string(),
            "YoloV8FaceNano".to_string(),
            "YoloV8FaceSmall".to_string(),
        ],
        face_encoding_models: vec![
            "FaceNet128D".to_string(),
            "FaceNet512D".to_string(),
            "ArcFace512D".to_string(),
        ],
    })
}

/// Тестирование ONNX модели на изображении
#[tauri::command]
pub async fn test_model_on_image(
    image_path: String,
    model_type: String,
    state: State<'_, crate::AppState>,
) -> Result<ModelTestResult, String> {
    log::info!("Testing {} model on image: {}", model_type, image_path);
    
    // TODO: Реализовать тестирование модели
    Ok(ModelTestResult {
        success: true,
        detections_count: 0,
        processing_time_ms: 0,
        error: None,
    })
}

/// Доступные модели
#[derive(Debug, Serialize)]
pub struct AvailableModels {
    pub object_detection_models: Vec<String>,
    pub face_detection_models: Vec<String>,
    pub face_encoding_models: Vec<String>,
}

/// Результат тестирования модели
#[derive(Debug, Serialize)]
pub struct ModelTestResult {
    pub success: bool,
    pub detections_count: usize,
    pub processing_time_ms: u64,
    pub error: Option<String>,
}

// Helper functions

fn parse_yolo_model(model_name: &str) -> YoloModel {
    match model_name {
        "YoloV11Nano" => YoloModel::YoloV11Nano,
        "YoloV11Small" => YoloModel::YoloV11Small,
        "YoloV11Medium" => YoloModel::YoloV11Medium,
        "YoloV11Large" => YoloModel::YoloV11Large,
        "YoloV11Extra" => YoloModel::YoloV11Extra,
        "YoloV11FaceNano" => YoloModel::YoloV11FaceNano,
        "YoloV11FaceSmall" => YoloModel::YoloV11FaceSmall,
        "YoloV11FaceMedium" => YoloModel::YoloV11FaceMedium,
        "YoloV11FaceLarge" => YoloModel::YoloV11FaceLarge,
        "YoloV8Nano" => YoloModel::YoloV8Nano,
        "YoloV8Small" => YoloModel::YoloV8Small,
        "YoloV8Medium" => YoloModel::YoloV8Medium,
        "YoloV8Large" => YoloModel::YoloV8Large,
        "YoloV8FaceNano" => YoloModel::YoloV8FaceNano,
        "YoloV8FaceSmall" => YoloModel::YoloV8FaceSmall,
        _ => YoloModel::YoloV11Nano, // Default fallback
    }
}

fn parse_facenet_model(model_name: &str) -> FaceNetModel {
    match model_name {
        "FaceNet128D" => FaceNetModel::FaceNet128D,
        "FaceNet512D" => FaceNetModel::FaceNet512D,
        "ArcFace512D" => FaceNetModel::ArcFace512D,
        _ => FaceNetModel::FaceNet128D, // Default fallback
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_yolo_model() {
        assert!(matches!(parse_yolo_model("YoloV11Nano"), YoloModel::YoloV11Nano));
        assert!(matches!(parse_yolo_model("YoloV8Small"), YoloModel::YoloV8Small));
        assert!(matches!(parse_yolo_model("invalid"), YoloModel::YoloV11Nano));
    }
    
    #[test]
    fn test_parse_facenet_model() {
        assert!(matches!(parse_facenet_model("FaceNet128D"), FaceNetModel::FaceNet128D));
        assert!(matches!(parse_facenet_model("ArcFace512D"), FaceNetModel::ArcFace512D));
        assert!(matches!(parse_facenet_model("invalid"), FaceNetModel::FaceNet128D));
    }
}