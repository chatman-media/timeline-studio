//! Tauri команды для интеграции FrameExtraction с Real Analysis Engine

use anyhow::Result;
use std::sync::Arc;
use std::path::PathBuf;
use tauri::State;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};

use crate::analysis::services::analysis_frame_integration::{
    AnalysisFrameIntegrator, VideoAnalysisResult, ClipAnalysisResult
};
use crate::analysis::services::real_analysis_engine::AnalysisEngineConfig;
use crate::video_compiler::schema::Clip;
use crate::video_compiler::cache::RenderCache;
use crate::VideoCompilerState;

/// Параметры для анализа видео файла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoAnalysisParams {
    pub video_path: String,
    pub config: Option<AnalysisEngineConfigParams>,
}

/// Сериализуемая версия AnalysisEngineConfig
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisEngineConfigParams {
    pub object_model: String,
    pub face_detection_model: String,
    pub face_encoding_model: String,
    pub object_confidence_threshold: f32,
    pub face_confidence_threshold: f32,
    pub frames_per_minute: u32,
    pub detailed_analysis: bool,
}

impl From<AnalysisEngineConfigParams> for AnalysisEngineConfig {
    fn from(params: AnalysisEngineConfigParams) -> Self {
        Self {
            object_model: params.object_model.parse().unwrap_or_default(),
            face_detection_model: params.face_detection_model.parse().unwrap_or_default(),
            face_encoding_model: params.face_encoding_model.parse().unwrap_or_default(),
            object_confidence_threshold: params.object_confidence_threshold,
            face_confidence_threshold: params.face_confidence_threshold,
            frames_per_minute: params.frames_per_minute,
            detailed_analysis: params.detailed_analysis,
        }
    }
}

/// Параметры для анализа клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipAnalysisParams {
    pub clip: Clip,
    pub config: Option<AnalysisEngineConfigParams>,
}

/// Сериализуемая версия VideoAnalysisResult
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoAnalysisResultDto {
    pub video_path: String,
    pub duration: f64,
    pub total_frames_analyzed: usize,
    pub scenes_count: usize,
    pub objects_count: usize,
    pub faces_count: usize,
    pub persons_count: usize,
    pub key_moments_count: usize,
    pub overall_quality: f64,
    pub processing_time_ms: u64,
}

/// Сериализуемая версия ClipAnalysisResult
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipAnalysisResultDto {
    pub clip_id: String,
    pub duration: f64,
    pub objects_count: usize,
    pub faces_count: usize,
    pub overall_quality: f64,
    pub processing_time_ms: u64,
}

/// Статус интеграции Frame Extraction + Real Analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameIntegrationStatus {
    pub frame_extractor_ready: bool,
    pub real_engine_ready: bool,
    pub object_detector_ready: bool,
    pub face_processors_ready: bool,
    pub cache_available: bool,
    pub supported_formats: Vec<String>,
}

/// Анализировать видео файл с помощью FFmpeg + ONNX интеграции
#[tauri::command]
pub async fn analyze_video_with_frame_integration(
    params: VideoAnalysisParams,
    state: State<'_, VideoCompilerState>,
) -> Result<VideoAnalysisResultDto, String> {
    let start_time = std::time::Instant::now();
    
    // Создаем интегратор
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let integrator = AnalysisFrameIntegrator::with_cache(cache);
    
    let video_path = PathBuf::from(&params.video_path);
    let config = params.config.map(|c| c.into());
    
    match integrator.analyze_video_file(&video_path, config).await {
        Ok(result) => {
            let processing_time = start_time.elapsed().as_millis() as u64;
            
            Ok(VideoAnalysisResultDto {
                video_path: result.video_path,
                duration: result.duration,
                total_frames_analyzed: result.total_frames_analyzed,
                scenes_count: result.scenes.len(),
                objects_count: result.objects.len(),
                faces_count: result.faces.len(),
                persons_count: result.persons.len(),
                key_moments_count: result.key_moments.len(),
                overall_quality: result.quality_metrics.overall_score,
                processing_time_ms: processing_time,
            })
        }
        Err(e) => {
            log::error!("Video analysis failed: {}", e);
            Err(format!("Failed to analyze video: {}", e))
        }
    }
}

/// Анализировать клип с помощью интеграции
#[tauri::command]
pub async fn analyze_clip_with_frame_integration(
    params: ClipAnalysisParams,
    state: State<'_, VideoCompilerState>,
) -> Result<ClipAnalysisResultDto, String> {
    let start_time = std::time::Instant::now();
    
    // Создаем интегратор
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let integrator = AnalysisFrameIntegrator::with_cache(cache);
    
    let config = params.config.map(|c| c.into());
    
    match integrator.analyze_clip(&params.clip, config).await {
        Ok(result) => {
            let processing_time = start_time.elapsed().as_millis() as u64;
            
            Ok(ClipAnalysisResultDto {
                clip_id: result.clip_id,
                duration: result.duration,
                objects_count: result.objects.len(),
                faces_count: result.faces.len(),
                overall_quality: result.quality.overall_score,
                processing_time_ms: processing_time,
            })
        }
        Err(e) => {
            log::error!("Clip analysis failed: {}", e);
            Err(format!("Failed to analyze clip: {}", e))
        }
    }
}

/// Получить статус интеграции Frame Extraction + Real Analysis
#[tauri::command]
pub async fn get_frame_integration_status(
    state: State<'_, VideoCompilerState>,
) -> Result<FrameIntegrationStatus, String> {
    // Создаем интегратор для проверки статуса
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let integrator = AnalysisFrameIntegrator::with_cache(cache);
    
    // Проверяем доступность компонентов
    let frame_extractor_ready = true; // FrameExtractionManager всегда готов
    let real_engine_ready = true; // RealAnalysisEngine создается
    let cache_available = true; // RenderCache всегда доступен
    
    // Проверяем ONNX процессоры (требует инициализации)
    let object_detector_ready = integrator.real_engine.is_object_detector_ready().await;
    let face_processors_ready = integrator.real_engine.is_face_processors_ready().await;
    
    let supported_formats = vec![
        "mp4".to_string(),
        "avi".to_string(),
        "mov".to_string(),
        "mkv".to_string(),
        "webm".to_string(),
    ];
    
    Ok(FrameIntegrationStatus {
        frame_extractor_ready,
        real_engine_ready,
        object_detector_ready,
        face_processors_ready,
        cache_available,
        supported_formats,
    })
}

/// Получить рекомендуемые настройки для анализа
#[tauri::command]
pub async fn get_recommended_analysis_config(
    video_duration: f64,
    performance_mode: String, // "fast", "balanced", "quality"
) -> Result<AnalysisEngineConfigParams, String> {
    let config = match performance_mode.as_str() {
        "fast" => AnalysisEngineConfigParams {
            object_model: "YoloV11Nano".to_string(),
            face_detection_model: "YoloV11FaceNano".to_string(),
            face_encoding_model: "FaceNet128D".to_string(),
            object_confidence_threshold: 0.6,
            face_confidence_threshold: 0.7,
            frames_per_minute: if video_duration > 300.0 { 20 } else { 30 }, // Меньше кадров для длинных видео
            detailed_analysis: false,
        },
        "balanced" => AnalysisEngineConfigParams {
            object_model: "YoloV11Small".to_string(),
            face_detection_model: "YoloV11FaceSmall".to_string(),
            face_encoding_model: "FaceNet128D".to_string(),
            object_confidence_threshold: 0.5,
            face_confidence_threshold: 0.7,
            frames_per_minute: 30,
            detailed_analysis: false,
        },
        "quality" => AnalysisEngineConfigParams {
            object_model: "YoloV11Medium".to_string(),
            face_detection_model: "YoloV11FaceMedium".to_string(),
            face_encoding_model: "FaceNet512D".to_string(),
            object_confidence_threshold: 0.4,
            face_confidence_threshold: 0.6,
            frames_per_minute: 60, // Больше кадров для детального анализа
            detailed_analysis: true,
        },
        _ => return Err("Invalid performance mode. Use: fast, balanced, quality".to_string()),
    };
    
    Ok(config)
}

/// Получить информацию о поддерживаемых ONNX моделях
#[tauri::command]
pub async fn get_supported_onnx_models() -> Result<SupportedModelsInfo, String> {
    Ok(SupportedModelsInfo {
        object_detection_models: vec![
            ModelInfo {
                name: "YoloV11Nano".to_string(),
                description: "Fastest, good accuracy (85%)".to_string(),
                memory_usage_mb: 512,
                speed_rating: 5,
                accuracy_rating: 3,
            },
            ModelInfo {
                name: "YoloV11Small".to_string(),
                description: "Fast, better accuracy (88%)".to_string(),
                memory_usage_mb: 1024,
                speed_rating: 4,
                accuracy_rating: 4,
            },
            ModelInfo {
                name: "YoloV11Medium".to_string(),
                description: "Moderate, high accuracy (91%)".to_string(),
                memory_usage_mb: 2048,
                speed_rating: 3,
                accuracy_rating: 5,
            },
        ],
        face_detection_models: vec![
            ModelInfo {
                name: "YoloV11FaceNano".to_string(),
                description: "Fast face detection".to_string(),
                memory_usage_mb: 256,
                speed_rating: 5,
                accuracy_rating: 4,
            },
            ModelInfo {
                name: "YoloV11FaceSmall".to_string(),
                description: "Balanced face detection".to_string(),
                memory_usage_mb: 512,
                speed_rating: 4,
                accuracy_rating: 4,
            },
        ],
        face_encoding_models: vec![
            ModelInfo {
                name: "FaceNet128D".to_string(),
                description: "Fast face encoding, 128-dimensional".to_string(),
                memory_usage_mb: 256,
                speed_rating: 5,
                accuracy_rating: 4,
            },
            ModelInfo {
                name: "FaceNet512D".to_string(),
                description: "High quality face encoding, 512-dimensional".to_string(),
                memory_usage_mb: 512,
                speed_rating: 3,
                accuracy_rating: 5,
            },
        ],
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupportedModelsInfo {
    pub object_detection_models: Vec<ModelInfo>,
    pub face_detection_models: Vec<ModelInfo>,
    pub face_encoding_models: Vec<ModelInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub description: String,
    pub memory_usage_mb: u32,
    pub speed_rating: u8,    // 1-5, где 5 = самый быстрый
    pub accuracy_rating: u8,  // 1-5, где 5 = самая высокая точность
}

/// Тестировать интеграцию на примере видео
#[tauri::command]
pub async fn test_frame_integration_on_sample(
    test_video_path: String,
) -> Result<FrameIntegrationTestResult, String> {
    let start_time = std::time::Instant::now();
    
    // Создаем интегратор
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let integrator = AnalysisFrameIntegrator::with_cache(cache);
    
    let video_path = PathBuf::from(&test_video_path);
    
    // Проверяем, что файл существует
    if !video_path.exists() {
        return Err(format!("Test video file not found: {}", test_video_path));
    }
    
    // Быстрый тест с минимальными настройками
    let test_config = AnalysisEngineConfig {
        object_model: crate::recognition::yolo_processor::YoloModel::YoloV11Nano,
        face_detection_model: crate::recognition::yolo_processor::YoloModel::YoloV11FaceNano,
        face_encoding_model: crate::recognition::facenet_processor::FaceNetModel::FaceNet128D,
        object_confidence_threshold: 0.7,
        face_confidence_threshold: 0.8,
        frames_per_minute: 10, // Только 10 кадров в минуту для теста
        detailed_analysis: false,
    };
    
    match integrator.analyze_video_file(&video_path, Some(test_config)).await {
        Ok(result) => {
            let processing_time = start_time.elapsed().as_millis() as u64;
            
            Ok(FrameIntegrationTestResult {
                success: true,
                video_path: result.video_path,
                duration: result.duration,
                frames_analyzed: result.total_frames_analyzed,
                objects_detected: result.objects.len(),
                faces_detected: result.faces.len(),
                scenes_detected: result.scenes.len(),
                persons_identified: result.persons.len(),
                key_moments_found: result.key_moments.len(),
                processing_time_ms: processing_time,
                error_message: None,
            })
        }
        Err(e) => {
            let processing_time = start_time.elapsed().as_millis() as u64;
            
            Ok(FrameIntegrationTestResult {
                success: false,
                video_path: test_video_path,
                duration: 0.0,
                frames_analyzed: 0,
                objects_detected: 0,
                faces_detected: 0,
                scenes_detected: 0,
                persons_identified: 0,
                key_moments_found: 0,
                processing_time_ms: processing_time,
                error_message: Some(e.to_string()),
            })
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameIntegrationTestResult {
    pub success: bool,
    pub video_path: String,
    pub duration: f64,
    pub frames_analyzed: usize,
    pub objects_detected: usize,
    pub faces_detected: usize,
    pub scenes_detected: usize,
    pub persons_identified: usize,
    pub key_moments_found: usize,
    pub processing_time_ms: u64,
    pub error_message: Option<String>,
}