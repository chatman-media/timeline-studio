/**
 * AI Director Commands - Tauri команды для использования AI Director
 *
 * Это основные команды которые вызывает фронтенд для анализа медиа
 */
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

use crate::analysis::services::ai_director::{
  AIDirector, AIDirectorConfig, ComprehensiveAnalysisResult, SystemCapabilities,
};

/// Global AI Director State
pub struct AIDirectorState {
  director: Arc<RwLock<AIDirector>>,
}

impl AIDirectorState {
  pub fn new() -> Self {
    Self {
      director: Arc::new(RwLock::new(AIDirector::new())),
    }
  }

  pub fn with_config(config: AIDirectorConfig) -> Self {
    Self {
      director: Arc::new(RwLock::new(AIDirector::with_config(config))),
    }
  }
}

impl Default for AIDirectorState {
  fn default() -> Self {
    Self::new()
  }
}

/// ГЛАВНАЯ КОМАНДА: Comprehensive анализ медиафайла
/// Это то что вызывается когда пользователь нажимает "анализировать видео"
#[tauri::command]
#[specta::specta]
pub async fn ai_director_analyze_comprehensive(
  video_path: String,
  config: Option<AIDirectorConfig>,
  state: State<'_, AIDirectorState>,
) -> Result<ComprehensiveAnalysisResult, String> {
  log::info!(
    "AI Director comprehensive analysis request for: {}",
    video_path
  );

  let path = PathBuf::from(&video_path);
  if !path.exists() {
    return Err(format!("File not found: {}", video_path));
  }

  let director = state.director.read().await;

  match director.analyze_media_comprehensive(&path, config).await {
    Ok(result) => {
      log::info!(
        "AI Director analysis completed successfully for: {}",
        video_path
      );
      Ok(result)
    }
    Err(e) => {
      log::error!("AI Director analysis failed for {}: {}", video_path, e);
      Err(format!("Analysis failed: {}", e))
    }
  }
}

/// Быстрый анализ (только основные метрики)
#[tauri::command]
#[specta::specta]
pub async fn ai_director_analyze_quick(
  video_path: String,
  state: State<'_, AIDirectorState>,
) -> Result<ComprehensiveAnalysisResult, String> {
  log::info!("AI Director quick analysis request for: {}", video_path);

  let path = PathBuf::from(&video_path);
  if !path.exists() {
    return Err(format!("File not found: {}", video_path));
  }

  let director = state.director.read().await;

  match director.analyze_media_quick(&path).await {
    Ok(result) => {
      log::info!("AI Director quick analysis completed for: {}", video_path);
      Ok(result)
    }
    Err(e) => {
      log::error!(
        "AI Director quick analysis failed for {}: {}",
        video_path,
        e
      );
      Err(format!("Quick analysis failed: {}", e))
    }
  }
}

/// Пакетный анализ нескольких файлов
#[tauri::command]
#[specta::specta]
pub async fn ai_director_analyze_batch(
  file_paths: Vec<String>,
  config: Option<AIDirectorConfig>,
  state: State<'_, AIDirectorState>,
) -> Result<Vec<ComprehensiveAnalysisResult>, String> {
  log::info!(
    "AI Director batch analysis request for {} files",
    file_paths.len()
  );

  if file_paths.is_empty() {
    return Err("No files provided for batch analysis".to_string());
  }

  let director = state.director.read().await;

  let mut results = Vec::new();
  let mut errors = Vec::new();

  for (index, file_path) in file_paths.iter().enumerate() {
    let path = PathBuf::from(file_path);

    if !path.exists() {
      errors.push(format!("File {} not found: {}", index + 1, file_path));
      continue;
    }

    match director
      .analyze_media_comprehensive(&path, config.clone())
      .await
    {
      Ok(result) => {
        log::info!(
          "Batch analysis completed for file {}/{}: {}",
          index + 1,
          file_paths.len(),
          file_path
        );
        results.push(result);
      }
      Err(e) => {
        let error_msg = format!(
          "File {}/{} failed ({}): {}",
          index + 1,
          file_paths.len(),
          file_path,
          e
        );
        log::error!("{}", error_msg);
        errors.push(error_msg);
      }
    }
  }

  if results.is_empty() && !errors.is_empty() {
    return Err(format!("All batch analyses failed: {}", errors.join("; ")));
  }

  if !errors.is_empty() {
    log::warn!(
      "Batch analysis completed with some errors: {}",
      errors.join("; ")
    );
  }

  log::info!(
    "Batch analysis completed: {}/{} files successful",
    results.len(),
    file_paths.len()
  );
  Ok(results)
}

/// Получение системных возможностей AI Director
#[tauri::command]
#[specta::specta]
pub async fn ai_director_get_capabilities(
  state: State<'_, AIDirectorState>,
) -> Result<SystemCapabilities, String> {
  log::debug!("Getting AI Director system capabilities");

  let director = state.director.read().await;

  match director.get_system_capabilities().await {
    Ok(capabilities) => {
      log::debug!("AI Director capabilities: {:?}", capabilities);
      Ok(capabilities)
    }
    Err(e) => {
      log::error!("Failed to get AI Director capabilities: {}", e);
      Err(format!("Failed to get capabilities: {}", e))
    }
  }
}

/// Создание конфигурации по умолчанию для разных режимов
#[tauri::command]
#[specta::specta]
pub fn ai_director_get_default_config(
  mode: String, // "fast", "balanced", "quality", "custom"
) -> Result<AIDirectorConfig, String> {
  let config = match mode.as_str() {
    "fast" => AIDirectorConfig {
      performance_mode: crate::analysis::types::AudioPerformanceMode::Fast,
      enable_audio_analysis: true,
      enable_scene_detection: false,
      enable_video_analysis: false,
      enable_vision_analysis: false,
      enable_face_detection: false,
      enable_face_analysis: false,
      enable_object_detection: false,
      enable_object_analysis: false,
      enable_emotion_analysis: false,
      enable_moment_detection: false,
      enable_content_classification: false,
      enable_composition_analysis: false,
      enable_mood_analysis: false,
      enable_quality_analysis: false,
      max_processing_time: Some(30),
      generate_editing_recommendations: false,
      enable_mcp_agents: false,
      ..Default::default()
    },
    "balanced" => AIDirectorConfig {
      performance_mode: crate::analysis::types::AudioPerformanceMode::Balanced,
      enable_audio_analysis: true,
      enable_scene_detection: true,
      enable_video_analysis: true,
      enable_vision_analysis: true,
      enable_face_detection: true,
      enable_face_analysis: true,
      enable_object_detection: true,
      enable_object_analysis: true,
      enable_emotion_analysis: false,
      enable_moment_detection: true,
      enable_content_classification: true,
      enable_composition_analysis: true,
      enable_mood_analysis: false,
      enable_quality_analysis: true,
      max_processing_time: Some(120),
      generate_editing_recommendations: true,
      enable_mcp_agents: false,
      ..Default::default()
    },
    "quality" => AIDirectorConfig {
      performance_mode: crate::analysis::types::AudioPerformanceMode::Quality,
      enable_audio_analysis: true,
      enable_scene_detection: true,
      enable_video_analysis: true,
      enable_vision_analysis: true,
      enable_face_detection: true,
      enable_face_analysis: true,
      enable_object_detection: true,
      enable_object_analysis: true,
      enable_emotion_analysis: true,
      enable_moment_detection: true,
      enable_content_classification: true,
      enable_composition_analysis: true,
      enable_mood_analysis: true,
      enable_quality_analysis: true,
      max_processing_time: Some(600),
      generate_editing_recommendations: true,
      enable_mcp_agents: true,
      ..Default::default()
    },
    "custom" => AIDirectorConfig::default(),
    _ => return Err(format!("Unknown config mode: {}", mode)),
  };

  log::debug!(
    "Generated AI Director config for mode '{}': {:?}",
    mode,
    config
  );
  Ok(config)
}

/// Валидация конфигурации
#[tauri::command]
#[specta::specta]
pub async fn ai_director_validate_config(
  config: AIDirectorConfig,
  state: State<'_, AIDirectorState>,
) -> Result<ConfigValidationResult, String> {
  log::debug!("Validating AI Director config: {:?}", config);

  let director = state.director.read().await;

  let capabilities = director
    .get_system_capabilities()
    .await
    .map_err(|e| format!("Failed to check system capabilities: {}", e))?;

  let mut validation = ConfigValidationResult {
    is_valid: true,
    warnings: Vec::new(),
    errors: Vec::new(),
    estimated_time: 0,
    estimated_memory: 0,
  };

  // Проверяем доступность возможностей
  if config.enable_audio_analysis && !capabilities.audio_analysis {
    validation
      .errors
      .push("Audio analysis is enabled but FFmpeg is not available".to_string());
    validation.is_valid = false;
  }

  if config.enable_face_detection && !capabilities.face_recognition {
    validation
      .warnings
      .push("Face detection is enabled but face recognition may not be available".to_string());
  }

  if config.enable_object_detection && !capabilities.object_detection {
    validation
      .warnings
      .push("Object detection is enabled but object detection may not be available".to_string());
  }

  // Оценка времени выполнения
  let mut estimated_time = 10u32; // Базовое время

  if config.enable_audio_analysis {
    estimated_time += match config.performance_mode {
      crate::analysis::types::AudioPerformanceMode::Fast => 20,
      crate::analysis::types::AudioPerformanceMode::Balanced => 60,
      crate::analysis::types::AudioPerformanceMode::Quality => 180,
      crate::analysis::types::AudioPerformanceMode::Custom => 60,
    };
  }

  if config.enable_scene_detection {
    estimated_time += 30;
  }

  if config.enable_vision_analysis {
    estimated_time += 20;
  }

  if config.enable_face_detection {
    estimated_time += 45;
  }

  if config.enable_object_detection {
    estimated_time += 30;
  }

  if config.enable_moment_detection {
    estimated_time += 15;
  }

  if config.enable_content_classification {
    estimated_time += 10;
  }

  if config.enable_composition_analysis {
    estimated_time += 15;
  }

  if config.enable_mood_analysis {
    estimated_time += 10;
  }

  if config.enable_quality_analysis {
    estimated_time += 10;
  }

  validation.estimated_time = estimated_time;
  validation.estimated_memory = estimated_time * 2; // Примерная оценка памяти

  // Проверяем лимиты времени
  if let Some(max_time) = config.max_processing_time {
    if estimated_time > max_time {
      validation.warnings.push(format!(
        "Estimated processing time ({}s) exceeds configured limit ({}s)",
        estimated_time, max_time
      ));
    }
  }

  log::debug!("Config validation result: {:?}", validation);
  Ok(validation)
}

/// Результат валидации конфигурации
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ConfigValidationResult {
  pub is_valid: bool,
  pub warnings: Vec<String>,
  pub errors: Vec<String>,
  pub estimated_time: u32,   // секунды
  pub estimated_memory: u32, // МБ
}

/// Health check AI Director системы
#[tauri::command]
#[specta::specta]
pub async fn ai_director_health_check(
  state: State<'_, AIDirectorState>,
) -> Result<HealthCheckResult, String> {
  log::debug!("Running AI Director health check");

  let director = state.director.read().await;

  let mut health = HealthCheckResult {
    overall_status: "healthy".to_string(),
    services: std::collections::HashMap::new(),
    last_check: chrono::Utc::now().to_rfc3339(),
  };

  // Проверяем возможности
  match director.get_system_capabilities().await {
    Ok(capabilities) => {
      health.services.insert(
        "audio_analysis".to_string(),
        if capabilities.audio_analysis {
          "healthy".to_string()
        } else {
          "unavailable".to_string()
        },
      );
      health.services.insert(
        "scene_detection".to_string(),
        if capabilities.scene_detection {
          "healthy".to_string()
        } else {
          "unavailable".to_string()
        },
      );
      health.services.insert(
        "vision_analysis".to_string(),
        if capabilities.vision_analysis {
          "healthy".to_string()
        } else {
          "unavailable".to_string()
        },
      );
      health.services.insert(
        "face_recognition".to_string(),
        if capabilities.face_recognition {
          "healthy".to_string()
        } else {
          "unavailable".to_string()
        },
      );
      health.services.insert(
        "object_detection".to_string(),
        if capabilities.object_detection {
          "healthy".to_string()
        } else {
          "unavailable".to_string()
        },
      );
      health.services.insert(
        "moment_detection".to_string(),
        if capabilities.moment_detection {
          "healthy".to_string()
        } else {
          "unavailable".to_string()
        },
      );
      health.services.insert(
        "content_classification".to_string(),
        if capabilities.content_classification {
          "healthy".to_string()
        } else {
          "unavailable".to_string()
        },
      );
      health.services.insert(
        "transcription".to_string(),
        if capabilities.transcription {
          "healthy".to_string()
        } else {
          "unavailable".to_string()
        },
      );
      health.services.insert(
        "gpu_acceleration".to_string(),
        if capabilities.gpu_acceleration {
          "available".to_string()
        } else {
          "unavailable".to_string()
        },
      );
    }
    Err(e) => {
      health.overall_status = "error".to_string();
      health
        .services
        .insert("system".to_string(), format!("error: {}", e));
    }
  }

  // Определяем общий статус
  let has_errors = health
    .services
    .values()
    .any(|status| status.starts_with("error"));
  let has_unavailable = health
    .services
    .values()
    .any(|status| status == "unavailable");

  if has_errors {
    health.overall_status = "error".to_string();
  } else if has_unavailable {
    health.overall_status = "warning".to_string();
  } else {
    health.overall_status = "healthy".to_string();
  }

  log::debug!("Health check completed: {}", health.overall_status);
  Ok(health)
}

/// Результат health check
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckResult {
  pub overall_status: String, // "healthy", "warning", "error"
  pub services: std::collections::HashMap<String, String>,
  pub last_check: String,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_ai_director_state_creation() {
    let state = AIDirectorState::new();
    assert!(Arc::strong_count(&state.director) == 1);
  }

  #[tokio::test]
  async fn test_get_default_config() {
    let fast_config = ai_director_get_default_config("fast".to_string());
    assert!(fast_config.is_ok());
    assert!(!fast_config.unwrap().enable_scene_detection);

    let balanced_config = ai_director_get_default_config("balanced".to_string());
    assert!(balanced_config.is_ok());
    assert!(balanced_config.unwrap().enable_scene_detection);
  }
}
