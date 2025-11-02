//! Unified Audio Analysis Service
//!
//! Главный координатор всех audio analysis компонентов
//! Заменяет audio_analysis_integration.rs и использует unified типы

use crate::analysis::types::{
  AudioAnalysisError, AudioAnalysisMetadata, AudioBasicMetrics, AudioDuration, AudioFFmpegAnalysis,
  AudioFloat, AudioMontageAnalysis, AudioPerformanceMode, AudioTimestamp,
  AudioTranscriptionAnalysis, UnifiedAudioAnalysisResult, UnifiedAudioConfig,
};
use crate::video_compiler::commands::whisper_commands::business_logic::check_local_whisper_availability;
use crate::video_compiler::commands::whisper_commands::types::WhisperTranscriptionResult;
use crate::video_compiler::core::ffmpeg::unified_audio_analysis::UnifiedFFmpegAudioAnalyzer;
use log::{error, info, warn};
use std::path::{Path, PathBuf};
use std::time::Instant;

/// Unified Audio Analysis Service - главный координатор
pub struct UnifiedAudioAnalyzer {
  /// Конфигурация по умолчанию
  default_config: UnifiedAudioConfig,
}

impl UnifiedAudioAnalyzer {
  /// Создать новый unified analyzer
  pub fn new() -> Self {
    Self {
      default_config: UnifiedAudioConfig::default(),
    }
  }

  /// Создать с пользовательской конфигурацией
  pub fn with_config(config: UnifiedAudioConfig) -> Self {
    Self {
      default_config: config,
    }
  }

  /// Comprehensive audio analysis используя все доступные engines
  pub async fn analyze_comprehensive(
    &self,
    video_path: &Path,
    config: Option<UnifiedAudioConfig>,
  ) -> Result<UnifiedAudioAnalysisResult, AudioAnalysisError> {
    let config = config.unwrap_or_else(|| self.default_config.clone());
    let start_time = Instant::now();

    info!(
      "Starting comprehensive audio analysis for: {:?}",
      video_path
    );
    info!(
      "Analysis config: FFmpeg={}, Montage={}, Transcription={}",
      config.enable_ffmpeg_analysis, config.enable_montage_analysis, config.enable_transcription
    );

    // Validate input file
    if !video_path.exists() {
      return Err(AudioAnalysisError::FileNotFound(
        video_path.to_string_lossy().to_string(),
      ));
    }

    // 1. Basic metrics (всегда выполняется)
    let basic_metrics = self.extract_basic_metrics(video_path).await?;
    info!(
      "Basic metrics extracted: has_audio={}, duration={}s",
      basic_metrics.has_audio, basic_metrics.duration.seconds
    );

    if !basic_metrics.has_audio {
      warn!("No audio detected in file, returning basic-only result");
      return Ok(UnifiedAudioAnalysisResult::basic_only(
        basic_metrics,
        AudioAnalysisMetadata {
          analysis_version: "2.0-unified".to_string(),
          processing_time_ms: start_time.elapsed().as_millis() as u32,
          config_used: config,
          engines_used: vec!["basic".to_string()],
          total_engines_available: 1,
          analysis_timestamp: chrono::Utc::now().to_rfc3339(),
          success_rate: 1.0,
        },
      ));
    }

    // Track успешных engines
    let mut engines_used = vec!["basic".to_string()];
    let mut analysis_errors = Vec::new();

    // 2. FFmpeg analysis (если включен)
    let ffmpeg_analysis = if config.enable_ffmpeg_analysis {
      match self.run_ffmpeg_analysis(video_path, &config).await {
        Ok(analysis) => {
          engines_used.push("ffmpeg".to_string());
          info!("FFmpeg analysis completed successfully");
          Some(analysis)
        }
        Err(e) => {
          analysis_errors.push(format!("FFmpeg analysis failed: {}", e));
          warn!("FFmpeg analysis failed: {}", e);
          None
        }
      }
    } else {
      None
    };

    // 3. Montage analysis (если включен)
    let montage_analysis = if config.enable_montage_analysis {
      match self.run_montage_analysis(video_path, &config).await {
        Ok(analysis) => {
          engines_used.push("montage".to_string());
          info!("Montage analysis completed successfully");
          Some(analysis)
        }
        Err(e) => {
          analysis_errors.push(format!("Montage analysis failed: {}", e));
          warn!("Montage analysis failed: {}", e);
          None
        }
      }
    } else {
      None
    };

    // 4. Whisper transcription (если включен)
    let transcription_analysis = if config.enable_transcription {
      match self.run_whisper_analysis(video_path, &config).await {
        Ok(analysis) => {
          engines_used.push("whisper".to_string());
          info!("Whisper analysis completed successfully");
          Some(analysis)
        }
        Err(e) => {
          analysis_errors.push(format!("Whisper analysis failed: {}", e));
          warn!("Whisper analysis failed: {}", e);
          None
        }
      }
    } else {
      None
    };

    let processing_time = start_time.elapsed();
    let success_rate = engines_used.len() as f64 / self.count_enabled_engines(&config) as f64;

    if !analysis_errors.is_empty() {
      warn!("Some analysis engines failed: {:?}", analysis_errors);
    }

    info!(
      "Comprehensive audio analysis completed in {}ms with {:.1}% success rate",
      processing_time.as_millis(),
      success_rate * 100.0
    );

    Ok(UnifiedAudioAnalysisResult {
      basic_metrics,
      ffmpeg_analysis,
      montage_analysis,
      transcription_analysis,
      analysis_metadata: AudioAnalysisMetadata {
        analysis_version: "2.0-unified".to_string(),
        processing_time_ms: processing_time.as_millis() as u32,
        config_used: config,
        engines_used,
        total_engines_available: self.count_available_engines().await,
        analysis_timestamp: chrono::Utc::now().to_rfc3339(),
        success_rate,
      },
    })
  }

  /// Быстрый анализ для real-time использования
  pub async fn analyze_quick(
    &self,
    video_path: &Path,
  ) -> Result<UnifiedAudioAnalysisResult, AudioAnalysisError> {
    let config = UnifiedAudioConfig {
      enable_ffmpeg_analysis: true,
      enable_montage_analysis: false, // Skip для скорости
      enable_transcription: false,    // Skip для скорости
      performance_mode: AudioPerformanceMode::Fast,
      max_processing_time_seconds: Some(30), // 30 секунд max
      ..Default::default()
    };

    self.analyze_comprehensive(video_path, Some(config)).await
  }

  // Removed duplicate analyze_with_fallback - using the one at line 597

  /// Extract basic audio metrics (всегда работает)
  async fn extract_basic_metrics(
    &self,
    video_path: &Path,
  ) -> Result<AudioBasicMetrics, AudioAnalysisError> {
    UnifiedFFmpegAudioAnalyzer::extract_basic_metrics(video_path)
      .await
      .map_err(|e| AudioAnalysisError::FFmpegError(e.to_string()))
  }

  /// Run FFmpeg comprehensive analysis
  async fn run_ffmpeg_analysis(
    &self,
    video_path: &Path,
    config: &UnifiedAudioConfig,
  ) -> Result<AudioFFmpegAnalysis, AudioAnalysisError> {
    let enable_advanced = matches!(config.performance_mode, AudioPerformanceMode::Quality);

    UnifiedFFmpegAudioAnalyzer::analyze_audio_comprehensive(video_path, enable_advanced)
      .await
      .map_err(|e| AudioAnalysisError::FFmpegError(e.to_string()))
  }

  /// Run Montage Planner analysis с unified типами
  async fn run_montage_analysis(
    &self,
    video_path: &Path,
    config: &UnifiedAudioConfig,
  ) -> Result<AudioMontageAnalysis, AudioAnalysisError> {
    info!("Running unified Montage Planner audio analysis");

    // Создаем unified Montage analyzer
    let montage_config =
      crate::montage_planner::services::unified_audio_analyzer::UnifiedAudioAnalysisConfig {
        sample_rate: 44100,
        frame_size: 2048,
        hop_length: 512,
        enable_speech_detection: true,
        enable_music_detection: true,
        enable_beat_detection: true,
        enable_emotion_detection: true,
        max_processing_time: crate::analysis::types::AudioDuration::from_seconds(
          config.max_processing_time_seconds.unwrap_or(60) as f64,
        ),
        quality_threshold: 0.7,
      };

    let montage_analyzer =
      crate::montage_planner::services::UnifiedMontageAudioAnalyzer::with_config(montage_config);

    // Выполняем unified analysis
    match montage_analyzer.analyze_audio(video_path).await {
      Ok(montage_result) => {
        info!("Unified Montage analysis completed successfully");

        // Конвертируем unified result в AudioMontageAnalysis format
        let analysis = montage_analyzer.to_legacy_montage_analysis(&montage_result);

        Ok(analysis)
      }
      Err(e) => {
        error!("Unified Montage analysis failed: {}", e);
        Err(AudioAnalysisError::MontageError(format!(
          "Unified Montage analysis failed: {}",
          e
        )))
      }
    }
  }

  /// Run Whisper transcription analysis with unified types
  async fn run_whisper_analysis(
    &self,
    video_path: &Path,
    config: &UnifiedAudioConfig,
  ) -> Result<AudioTranscriptionAnalysis, AudioAnalysisError> {
    info!(
      "Starting Whisper transcription analysis for: {:?}",
      video_path
    );

    // Проверяем доступность Whisper
    if !check_local_whisper_availability() {
      return Err(AudioAnalysisError::WhisperError(
        "Whisper is not available on this system".to_string(),
      ));
    }

    // Используем существующую Whisper команду через внутренний API
    let video_path_str = video_path.to_string_lossy().to_string();

    // Определяем параметры на основе unified config
    let (model, language, temperature) = match config.performance_mode {
      AudioPerformanceMode::Fast => ("whisper-tiny", Some("auto"), 0.0),
      AudioPerformanceMode::Balanced => ("whisper-base", Some("auto"), 0.2),
      AudioPerformanceMode::Quality => ("whisper-small", Some("auto"), 0.4),
      AudioPerformanceMode::Custom => ("whisper-base", Some("auto"), 0.2), // Default для custom
    };

    // Вызываем Whisper transcription
    match self
      .call_whisper_transcribe(
        video_path_str,
        model.to_string(),
        language.map(|s| s.to_string()),
        "verbose_json".to_string(),
        temperature,
      )
      .await
    {
      Ok(whisper_result) => {
        info!("Whisper transcription completed successfully");

        // Конвертируем результат Whisper в unified types
        let analysis = self.convert_whisper_to_unified(whisper_result)?;
        Ok(analysis)
      }
      Err(e) => {
        error!("Whisper transcription failed: {}", e);
        Err(AudioAnalysisError::WhisperError(format!(
          "Transcription failed: {}",
          e
        )))
      }
    }
  }

  /// Call Whisper transcription via internal API
  async fn call_whisper_transcribe(
    &self,
    audio_file_path: String,
    model: String,
    language: Option<String>,
    response_format: String,
    _temperature: f64,
  ) -> Result<WhisperTranscriptionResult, AudioAnalysisError> {
    // Используем прямой вызов business logic функций Whisper
    use crate::video_compiler::commands::whisper_commands::commands::whisper_transcribe_local;

    match whisper_transcribe_local(
      audio_file_path,
      model.to_string(),
      language.unwrap_or_else(|| "auto".to_string()),
      4, // threads
      response_format,
    )
    .await
    {
      Ok(result) => Ok(result),
      Err(e) => Err(AudioAnalysisError::WhisperError(format!(
        "Whisper API error: {}",
        e
      ))),
    }
  }

  /// Convert Whisper result to unified audio transcription analysis
  fn convert_whisper_to_unified(
    &self,
    whisper_result: WhisperTranscriptionResult,
  ) -> Result<AudioTranscriptionAnalysis, AudioAnalysisError> {
    use crate::analysis::types::audio_analysis::{TranscriptionSegment, TranscriptionWord};

    // Конвертируем Whisper segments в unified format
    let segments = whisper_result
      .segments
      .unwrap_or_default()
      .into_iter()
      .map(|seg| TranscriptionSegment {
        start_time: AudioTimestamp::from_seconds(seg.start),
        end_time: AudioTimestamp::from_seconds(seg.end),
        text: seg.text,
        confidence: (1.0 - seg.no_speech_prob.clamp(0.0, 1.0)) as AudioFloat, // Convert to confidence
        language: whisper_result.language.clone(),
        speaker_id: None, // Whisper не поддерживает speaker diarization
      })
      .collect();

    let words = whisper_result
      .words
      .unwrap_or_default()
      .into_iter()
      .map(|word| TranscriptionWord {
        word: word.word,
        start_time: AudioTimestamp::from_seconds(word.start),
        end_time: AudioTimestamp::from_seconds(word.end),
        confidence: 0.8, // Default confidence для words
      })
      .collect();

    // Clone the text before moving it
    let full_text = whisper_result.text.clone();
    let detected_language = whisper_result.language.clone();

    Ok(AudioTranscriptionAnalysis {
      // Unified API fields
      engine_name: "whisper".to_string(),
      full_text: full_text.clone(),
      detected_language: detected_language.clone(),
      total_duration: whisper_result.duration.map(AudioDuration::from_seconds),
      segments,
      words,
      confidence_score: 0.85, // Average confidence for Whisper
      processing_time: AudioDuration::from_seconds(0.0), // TODO: Track actual processing time

      // Legacy fields для совместимости
      transcription_text: Some(full_text),
      language_detected: detected_language,
      overall_confidence: Some(0.85),
      word_segments: None,     // TODO: Convert if needed
      sentence_segments: None, // TODO: Convert if needed
      speaker_segments: None,  // Whisper не поддерживает
      speech_rate: None,       // TODO: Calculate if needed
      pause_analysis: None,    // TODO: Calculate if needed
      pronunciation_quality: None,
      model_used: Some("whisper".to_string()),
      provider_used: Some("local".to_string()),
    })
  }

  /// Check system capabilities
  pub async fn check_system_capabilities(&self) -> AudioSystemCapabilities {
    // Check FFmpeg availability
    let ffmpeg_available = crate::video_compiler::core::ffmpeg::check_ffmpeg_available()
      .await
      .unwrap_or(false);

    let ffprobe_available = crate::video_compiler::core::ffmpeg::check_ffprobe_available()
      .await
      .unwrap_or(false);

    // Check Montage Planner availability (always available as it's built-in)
    let montage_planner_available = true;

    // Check Whisper availability
    let whisper_available = check_local_whisper_availability();

    // Check GPU capabilities
    let gpu_acceleration_available = if let Ok(gpu_caps) =
      crate::video_compiler::core::ffmpeg::check_gpu_encoders_available().await
    {
      gpu_caps.has_any_gpu_support()
    } else {
      false
    };

    AudioSystemCapabilities {
      ffmpeg_available,
      ffprobe_available,
      montage_planner_available,
      whisper_available,
      gpu_acceleration_available,
    }
  }

  /// Count available engines
  async fn count_available_engines(&self) -> u32 {
    let capabilities = self.check_system_capabilities().await;
    let mut count = 1; // Basic всегда доступен

    if capabilities.ffmpeg_available {
      count += 1;
    }
    if capabilities.montage_planner_available {
      count += 1;
    }
    if capabilities.whisper_available {
      count += 1;
    }

    count
  }

  /// Count enabled engines в конфигурации
  fn count_enabled_engines(&self, config: &UnifiedAudioConfig) -> u32 {
    let mut count = 1; // Basic всегда включен

    if config.enable_ffmpeg_analysis {
      count += 1;
    }
    if config.enable_montage_analysis {
      count += 1;
    }
    if config.enable_transcription {
      count += 1;
    }

    count
  }

  /// Get recommended configuration на основе capabilities и performance mode
  pub async fn get_recommended_config(
    &self,
    performance_mode: AudioPerformanceMode,
  ) -> UnifiedAudioConfig {
    let capabilities = self.check_system_capabilities().await;

    match performance_mode {
      AudioPerformanceMode::Fast => {
        UnifiedAudioConfig {
          enable_ffmpeg_analysis: capabilities.ffmpeg_available,
          enable_montage_analysis: false, // Skip для скорости
          enable_transcription: false,    // Skip для скорости
          performance_mode,
          max_processing_time_seconds: Some(30),
          enable_caching: true,
          ..Default::default()
        }
      }
      AudioPerformanceMode::Balanced => {
        UnifiedAudioConfig {
          enable_ffmpeg_analysis: capabilities.ffmpeg_available,
          enable_montage_analysis: capabilities.montage_planner_available,
          enable_transcription: false, // Still expensive
          performance_mode,
          max_processing_time_seconds: Some(120),
          enable_caching: true,
          ..Default::default()
        }
      }
      AudioPerformanceMode::Quality => {
        UnifiedAudioConfig {
          enable_ffmpeg_analysis: capabilities.ffmpeg_available,
          enable_montage_analysis: capabilities.montage_planner_available,
          enable_transcription: capabilities.whisper_available,
          performance_mode,
          max_processing_time_seconds: Some(600), // 10 минут
          enable_caching: true,
          ..Default::default()
        }
      }
      AudioPerformanceMode::Custom => {
        // Return default и let user customize
        UnifiedAudioConfig::default()
      }
    }
  }
}

impl Default for UnifiedAudioAnalyzer {
  fn default() -> Self {
    Self::new()
  }
}

/// System capabilities для audio analysis
#[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
pub struct AudioSystemCapabilities {
  pub ffmpeg_available: bool,
  pub ffprobe_available: bool,
  pub montage_planner_available: bool,
  pub whisper_available: bool,
  pub gpu_acceleration_available: bool,
}

impl AudioSystemCapabilities {
  /// Check если можно выполнить comprehensive analysis
  pub fn can_run_comprehensive(&self) -> bool {
    self.ffmpeg_available || self.montage_planner_available || self.whisper_available
  }

  /// Get summary строка capabilities
  pub fn summary(&self) -> String {
    let mut parts = Vec::new();

    if self.ffmpeg_available {
      parts.push("FFmpeg");
    }
    if self.montage_planner_available {
      parts.push("Montage");
    }
    if self.whisper_available {
      parts.push("Whisper");
    }
    if self.gpu_acceleration_available {
      parts.push("GPU");
    }

    if parts.is_empty() {
      "Basic only".to_string()
    } else {
      format!("Available: {}", parts.join(", "))
    }
  }
}

impl std::fmt::Display for AudioSystemCapabilities {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.summary())
  }
}

// Additional methods required by unified_audio_commands.rs
impl UnifiedAudioAnalyzer {
  /// Wrapper for analyze_comprehensive with UnifiedAudioConfig parameter
  pub async fn analyze_comprehensive_with_config(
    &self,
    video_path: &Path,
    config: UnifiedAudioConfig,
  ) -> Result<UnifiedAudioAnalysisResult, AudioAnalysisError> {
    self.analyze_comprehensive(video_path, Some(config)).await
  }

  /// Analyze basic metrics only
  pub async fn analyze_basic_metrics(
    &self,
    video_path: &Path,
  ) -> Result<AudioBasicMetrics, AudioAnalysisError> {
    self.extract_basic_metrics(video_path).await
  }

  /// Analyze with fallback strategy
  pub async fn analyze_with_fallback(
    &self,
    video_path: &Path,
    config: UnifiedAudioConfig,
  ) -> Result<UnifiedAudioAnalysisResult, AudioAnalysisError> {
    // Try comprehensive first, fallback to basic if needed
    match self
      .analyze_comprehensive(video_path, Some(config.clone()))
      .await
    {
      Ok(result) => Ok(result),
      Err(e) => {
        warn!(
          "Comprehensive analysis failed: {}, falling back to basic",
          e
        );
        let basic_metrics = self.analyze_basic_metrics(video_path).await?;
        Ok(UnifiedAudioAnalysisResult::basic_only(
          basic_metrics,
          AudioAnalysisMetadata {
            analysis_version: "2.0-fallback".to_string(),
            processing_time_ms: 0,
            config_used: config,
            engines_used: vec!["basic".to_string()],
            total_engines_available: 1,
            analysis_timestamp: chrono::Utc::now().to_rfc3339(),
            success_rate: 0.5,
          },
        ))
      }
    }
  }

  /// Get system capabilities
  pub async fn get_system_capabilities(&self) -> AudioSystemCapabilities {
    self.check_system_capabilities().await
  }

  /// Get recommended config for file and performance mode
  pub async fn get_recommended_config_for_file(
    &self,
    _video_path: &Path,
    performance_mode: AudioPerformanceMode,
  ) -> UnifiedAudioConfig {
    self.get_recommended_config(performance_mode).await
  }

  /// Batch analysis for multiple files
  pub async fn analyze_batch(
    &self,
    file_paths: &[PathBuf],
    config: UnifiedAudioConfig,
  ) -> Result<Vec<UnifiedAudioAnalysisResult>, AudioAnalysisError> {
    let mut results = Vec::new();

    for path in file_paths {
      match self
        .analyze_comprehensive(path.as_path(), Some(config.clone()))
        .await
      {
        Ok(result) => results.push(result),
        Err(e) => {
          error!("Failed to analyze {}: {}", path.display(), e);
          // Continue with other files instead of failing completely
        }
      }
    }

    if results.is_empty() {
      Err(AudioAnalysisError::ProcessingError(
        "All batch analyses failed".to_string(),
      ))
    } else {
      Ok(results)
    }
  }

  /// Performance benchmark
  pub async fn benchmark_performance(
    &self,
    test_file_path: &Path,
    iterations: u32,
  ) -> Result<BenchmarkResult, AudioAnalysisError> {
    let start_time = Instant::now();
    let mut total_processing_time = 0u64;
    let mut successful_runs = 0u32;

    for i in 0..iterations {
      let run_start = Instant::now();

      match self.analyze_comprehensive(test_file_path, None).await {
        Ok(_) => {
          successful_runs += 1;
          total_processing_time += run_start.elapsed().as_millis() as u64;
        }
        Err(e) => {
          warn!("Benchmark iteration {} failed: {}", i, e);
        }
      }
    }

    let total_time = start_time.elapsed();

    Ok(BenchmarkResult {
      total_iterations: iterations,
      successful_iterations: successful_runs,
      total_time_ms: total_time.as_millis() as u64,
      average_processing_time_ms: if successful_runs > 0 {
        total_processing_time / successful_runs as u64
      } else {
        0
      },
      success_rate: successful_runs as f64 / iterations as f64,
    })
  }

  /// Get system status
  pub async fn get_system_status(&self) -> SystemStatus {
    let capabilities = self.get_system_capabilities().await;

    SystemStatus {
      is_healthy: capabilities.can_run_comprehensive(),
      available_engines: capabilities.summary(),
      ffmpeg_available: capabilities.ffmpeg_available,
      montage_available: capabilities.montage_planner_available,
      whisper_available: capabilities.whisper_available,
      gpu_available: capabilities.gpu_acceleration_available,
      last_check: chrono::Utc::now().to_rfc3339(),
    }
  }
}

/// Benchmark result structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct BenchmarkResult {
  pub total_iterations: u32,
  pub successful_iterations: u32,
  pub total_time_ms: u64,
  pub average_processing_time_ms: u64,
  pub success_rate: f64,
}

/// System status structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SystemStatus {
  pub is_healthy: bool,
  pub available_engines: String,
  pub ffmpeg_available: bool,
  pub montage_available: bool,
  pub whisper_available: bool,
  pub gpu_available: bool,
  pub last_check: String,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_unified_analyzer_creation() {
    let analyzer = UnifiedAudioAnalyzer::new();
    assert!(analyzer.default_config.enable_ffmpeg_analysis);
    assert!(analyzer.default_config.enable_montage_analysis);
  }

  #[tokio::test]
  async fn test_system_capabilities_check() {
    let analyzer = UnifiedAudioAnalyzer::new();
    let capabilities = analyzer.check_system_capabilities().await;

    // Should at least detect basic capability
    assert!(capabilities.ffmpeg_available || !capabilities.can_run_comprehensive());
  }

  #[tokio::test]
  async fn test_recommended_config_generation() {
    let analyzer = UnifiedAudioAnalyzer::new();

    let fast_config = analyzer
      .get_recommended_config(AudioPerformanceMode::Fast)
      .await;
    assert_eq!(fast_config.performance_mode, AudioPerformanceMode::Fast);
    assert!(!fast_config.enable_transcription); // Should be disabled для speed

    let quality_config = analyzer
      .get_recommended_config(AudioPerformanceMode::Quality)
      .await;
    assert_eq!(
      quality_config.performance_mode,
      AudioPerformanceMode::Quality
    );
    assert!(quality_config.max_processing_time_seconds.unwrap_or(0) > 300); // Should allow more time
  }

  #[test]
  fn test_count_enabled_engines() {
    let analyzer = UnifiedAudioAnalyzer::new();
    let config = UnifiedAudioConfig {
      enable_ffmpeg_analysis: true,
      enable_montage_analysis: true,
      enable_transcription: false,
      ..Default::default()
    };

    assert_eq!(analyzer.count_enabled_engines(&config), 3); // basic + ffmpeg + montage
  }

  #[test]
  fn test_audio_system_capabilities_summary() {
    let capabilities = AudioSystemCapabilities {
      ffmpeg_available: true,
      ffprobe_available: true,
      montage_planner_available: false,
      whisper_available: false,
      gpu_acceleration_available: true,
    };

    let summary = capabilities.summary();
    assert!(summary.contains("FFmpeg"));
    assert!(summary.contains("GPU"));
    assert!(!summary.contains("Whisper"));
  }

  // Note: File-based tests would require test media files
  // They should be added when setting up integration tests
}
