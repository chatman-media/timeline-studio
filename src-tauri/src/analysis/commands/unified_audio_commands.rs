//! Unified Audio Analysis Tauri Commands
//!
//! Tauri команды для современной unified audio analysis системы

use log::{error, info, warn};
use serde_json;
use std::path::PathBuf;
use tauri::command;

use crate::analysis::services::unified_audio_analyzer::UnifiedAudioAnalyzer;
use crate::analysis::types::audio_analysis::{AudioPerformanceMode, UnifiedAudioConfig};

/// Comprehensive audio analysis с unified типами
#[command]
pub async fn analyze_audio_unified(
  file_path: String,
  config: Option<String>, // JSON-serialized UnifiedAudioConfig
) -> Result<String, String> {
  info!("Starting unified audio analysis for: {}", file_path);

  let path = PathBuf::from(&file_path);
  if !path.exists() {
    return Err(format!("Audio file not found: {}", file_path));
  }

  // Parse config or use default
  let analysis_config = match config {
    Some(config_str) => match serde_json::from_str::<UnifiedAudioConfig>(&config_str) {
      Ok(config) => config,
      Err(e) => {
        warn!("Failed to parse audio config: {}, using default", e);
        UnifiedAudioConfig::default()
      }
    },
    None => UnifiedAudioConfig::default(),
  };

  // Create analyzer and run analysis
  let analyzer = UnifiedAudioAnalyzer::new();

  match analyzer
    .analyze_comprehensive_with_config(&path, analysis_config)
    .await
  {
    Ok(result) => match serde_json::to_string(&result) {
      Ok(json_str) => {
        info!("Unified audio analysis completed successfully");
        Ok(json_str)
      }
      Err(e) => {
        error!("Failed to serialize analysis result: {}", e);
        Err(format!("Failed to serialize analysis result: {}", e))
      }
    },
    Err(e) => {
      error!("Audio analysis failed: {}", e);
      Err(format!("Audio analysis failed: {}", e))
    }
  }
}

/// Quick audio analysis с базовыми метриками
#[command]
pub async fn analyze_audio_quick(file_path: String) -> Result<String, String> {
  info!("Starting quick audio analysis for: {}", file_path);

  let path = PathBuf::from(&file_path);
  if !path.exists() {
    return Err(format!("Audio file not found: {}", file_path));
  }

  let analyzer = UnifiedAudioAnalyzer::new();

  match analyzer.analyze_basic_metrics(&path).await {
    Ok(basic_metrics) => match serde_json::to_string(&basic_metrics) {
      Ok(json_str) => {
        info!("Quick audio analysis completed successfully");
        Ok(json_str)
      }
      Err(e) => {
        error!("Failed to serialize basic metrics: {}", e);
        Err(format!("Failed to serialize basic metrics: {}", e))
      }
    },
    Err(e) => {
      error!("Quick audio analysis failed: {}", e);
      Err(format!("Quick audio analysis failed: {}", e))
    }
  }
}

/// Audio analysis с fallback на доступные engines
#[command]
pub async fn analyze_audio_with_fallback(
  file_path: String,
  preferred_engines: Vec<String>,
) -> Result<String, String> {
  info!(
    "Starting fallback audio analysis for: {} with engines: {:?}",
    file_path, preferred_engines
  );

  let path = PathBuf::from(&file_path);
  if !path.exists() {
    return Err(format!("Audio file not found: {}", file_path));
  }

  // Build config based on preferred engines
  let mut config = UnifiedAudioConfig::default();

  for engine in &preferred_engines {
    match engine.as_str() {
      "ffmpeg" => config.enable_ffmpeg_analysis = true,
      "montage" => config.enable_montage_analysis = true,
      "whisper" => config.enable_transcription = true,
      _ => warn!("Unknown engine: {}", engine),
    }
  }

  let analyzer = UnifiedAudioAnalyzer::new();

  // Try comprehensive analysis with fallback
  match analyzer.analyze_with_fallback(&path, config).await {
    Ok(result) => match serde_json::to_string(&result) {
      Ok(json_str) => {
        info!("Fallback audio analysis completed successfully");
        Ok(json_str)
      }
      Err(e) => {
        error!("Failed to serialize fallback analysis result: {}", e);
        Err(format!(
          "Failed to serialize fallback analysis result: {}",
          e
        ))
      }
    },
    Err(e) => {
      error!("Fallback audio analysis failed: {}", e);
      Err(format!("Fallback audio analysis failed: {}", e))
    }
  }
}

/// Получить системные возможности audio analysis
#[command]
pub async fn get_audio_system_capabilities() -> Result<String, String> {
  info!("Getting audio system capabilities");

  let analyzer = UnifiedAudioAnalyzer::new();
  let capabilities = analyzer.get_system_capabilities().await;

  match serde_json::to_string(&capabilities) {
    Ok(json_str) => Ok(json_str),
    Err(e) => {
      error!("Failed to serialize capabilities: {}", e);
      Err(format!("Failed to serialize capabilities: {}", e))
    }
  }
}

/// Получить рекомендуемую конфигурацию
#[command]
pub async fn get_recommended_audio_config(
  file_path: String,
  performance_mode: String, // AudioPerformanceMode as string
) -> Result<String, String> {
  info!(
    "Getting recommended audio config for: {} (mode: {})",
    file_path, performance_mode
  );

  let path = PathBuf::from(&file_path);
  if !path.exists() {
    return Err(format!("Audio file not found: {}", file_path));
  }

  let mode = match performance_mode.as_str() {
    "fast" => AudioPerformanceMode::Fast,
    "balanced" => AudioPerformanceMode::Balanced,
    "quality" => AudioPerformanceMode::Quality,
    _ => AudioPerformanceMode::Balanced,
  };

  let analyzer = UnifiedAudioAnalyzer::new();
  let config = analyzer.get_recommended_config_for_file(&path, mode).await;

  match serde_json::to_string(&config) {
    Ok(json_str) => Ok(json_str),
    Err(e) => {
      error!("Failed to serialize config: {}", e);
      Err(format!("Failed to serialize config: {}", e))
    }
  }
}

/// Batch audio analysis для нескольких файлов
#[command]
pub async fn analyze_audio_batch(
  file_paths: Vec<String>,
  config: Option<String>,
) -> Result<String, String> {
  info!(
    "Starting batch audio analysis for {} files",
    file_paths.len()
  );

  // Parse config or use default
  let analysis_config = match config {
    Some(config_str) => match serde_json::from_str::<UnifiedAudioConfig>(&config_str) {
      Ok(config) => config,
      Err(e) => {
        warn!("Failed to parse batch config: {}, using default", e);
        UnifiedAudioConfig::default()
      }
    },
    None => UnifiedAudioConfig::default(),
  };

  let analyzer = UnifiedAudioAnalyzer::new();
  let paths: Vec<PathBuf> = file_paths.into_iter().map(PathBuf::from).collect();

  match analyzer.analyze_batch(&paths, analysis_config).await {
    Ok(results) => match serde_json::to_string(&results) {
      Ok(json_str) => {
        info!("Batch audio analysis completed successfully");
        Ok(json_str)
      }
      Err(e) => {
        error!("Failed to serialize batch results: {}", e);
        Err(format!("Failed to serialize batch results: {}", e))
      }
    },
    Err(e) => {
      error!("Batch audio analysis failed: {}", e);
      Err(format!("Batch audio analysis failed: {}", e))
    }
  }
}

/// Benchmark unified audio analysis производительности
#[command]
pub async fn benchmark_unified_audio_analysis(
  test_file_path: String,
  iterations: u32,
) -> Result<String, String> {
  info!(
    "Running unified audio analysis benchmark: {} iterations",
    iterations
  );

  let path = PathBuf::from(&test_file_path);
  if !path.exists() {
    return Err(format!("Test file not found: {}", test_file_path));
  }

  let analyzer = UnifiedAudioAnalyzer::new();

  match analyzer.benchmark_performance(&path, iterations).await {
    Ok(benchmark_result) => match serde_json::to_string(&benchmark_result) {
      Ok(json_str) => {
        info!("Audio analysis benchmark completed successfully");
        Ok(json_str)
      }
      Err(e) => {
        error!("Failed to serialize benchmark result: {}", e);
        Err(format!("Failed to serialize benchmark result: {}", e))
      }
    },
    Err(e) => {
      error!("Audio analysis benchmark failed: {}", e);
      Err(format!("Audio analysis benchmark failed: {}", e))
    }
  }
}

/// Получить статус unified audio analysis системы
#[command]
pub async fn get_unified_audio_analysis_status() -> Result<String, String> {
  info!("Getting unified audio analysis status");

  let analyzer = UnifiedAudioAnalyzer::new();
  let status = analyzer.get_system_status().await;

  match serde_json::to_string(&status) {
    Ok(json_str) => Ok(json_str),
    Err(e) => {
      error!("Failed to serialize system status: {}", e);
      Err(format!("Failed to serialize system status: {}", e))
    }
  }
}

/// Whisper transcription через unified audio system
#[command]
pub async fn analyze_audio_transcription_unified(
  file_path: String,
  performance_mode: Option<String>, // "fast", "balanced", "quality"
  enable_word_timestamps: Option<bool>,
) -> Result<String, String> {
  info!("Starting unified Whisper transcription for: {}", file_path);

  let path = PathBuf::from(&file_path);
  if !path.exists() {
    return Err(format!("Audio file not found: {}", file_path));
  }

  // Создаем unified config
  let perf_mode = match performance_mode.as_deref() {
    Some("fast") => AudioPerformanceMode::Fast,
    Some("quality") => AudioPerformanceMode::Quality,
    _ => AudioPerformanceMode::Balanced,
  };

  let config = UnifiedAudioConfig {
    performance_mode: perf_mode,
    enable_transcription: true,
    enable_montage_analysis: false,
    enable_ffmpeg_analysis: false,
    ..Default::default()
  };

  let analyzer = UnifiedAudioAnalyzer::new();

  match analyzer
    .analyze_comprehensive_with_config(&path, config)
    .await
  {
    Ok(result) => {
      // Извлекаем только transcription часть
      if let Some(transcription) = result.transcription_analysis {
        match serde_json::to_string(&transcription) {
          Ok(json_str) => {
            info!("Unified Whisper transcription completed successfully");
            Ok(json_str)
          }
          Err(e) => {
            error!("Failed to serialize transcription result: {}", e);
            Err(format!("Failed to serialize transcription result: {}", e))
          }
        }
      } else {
        warn!("No transcription analysis available in result");
        Err("Transcription analysis not available".to_string())
      }
    }
    Err(e) => {
      error!("Unified Whisper transcription failed: {}", e);
      Err(format!("Whisper transcription failed: {}", e))
    }
  }
}

/// Проверить доступность Whisper в unified system
#[command]
pub async fn check_whisper_availability_unified() -> Result<String, String> {
  info!("Checking Whisper availability in unified system");

  let analyzer = UnifiedAudioAnalyzer::new();
  let capabilities = analyzer.check_system_capabilities().await;

  let whisper_status = serde_json::json!({
      "whisper_available": capabilities.whisper_available,
      "local_whisper": capabilities.whisper_available,
      "system_summary": capabilities.to_string(),
      "models_available": capabilities.whisper_available,
      "unified_integration": true
  });

  match serde_json::to_string(&whisper_status) {
    Ok(json_str) => Ok(json_str),
    Err(e) => {
      error!("Failed to serialize Whisper status: {}", e);
      Err(format!("Failed to serialize Whisper status: {}", e))
    }
  }
}
