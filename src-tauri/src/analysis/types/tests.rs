//! Comprehensive unit tests для unified audio types
//!
//! Проверяет все типы, конвертации, и интеграцию в unified system

#[cfg(test)]
mod tests {
  use super::super::audio_analysis::*;
  use super::super::audio_core::*;
  use crate::analysis::types::{AudioFloat, AudioFrequency, AudioVolume};
  use chrono;

  #[test]
  fn test_audio_float_precision() {
    let value: AudioFloat = 0.123456789012345;
    assert_eq!(value, 0.123456789012345_f64);

    // Проверяем что f64 precision сохраняется
    let precise_value: AudioFloat = 1.0 / 3.0;
    assert!(precise_value > 0.33333333);
    assert!(precise_value < 0.33333334);
  }

  #[test]
  fn test_audio_duration_operations() {
    let duration1 = AudioDuration::from_seconds(1.5);
    let duration2 = AudioDuration::from_seconds(2.5);

    assert_eq!(duration1.seconds, 1.5);
    assert_eq!(duration2.seconds, 2.5);

    // Проверяем конвертации
    let millis_duration = AudioDuration::from_millis(1500.0);
    assert_eq!(millis_duration.seconds, 1.5);
    assert_eq!(millis_duration.as_millis(), 1500.0);

    // Проверяем микросекунды через millis (нет from_micros)
    let micro_duration = AudioDuration::from_millis(1500.0);
    assert_eq!(micro_duration.seconds, 1.5);
  }

  #[test]
  fn test_audio_volume_conversions() {
    // Тест normalized volume (0.0-1.0)
    let vol_norm = AudioVolume::from_normalized(0.5);
    assert_eq!(vol_norm.level, 0.5);

    // Тест dB conversions
    let vol_db = AudioVolume::from_db(-6.0);
    let db_value = vol_db.to_db();
    assert!(db_value >= -6.1 && db_value <= -5.9); // Float precision tolerance

    // Тест level conversions (no to_linear method)
    let vol_level_direct = AudioVolume::from_level(0.25);
    assert_eq!(vol_level_direct.level, 0.25);

    // Тест level alias
    let vol_level = AudioVolume::from_level(0.8);
    assert_eq!(vol_level.level, 0.8);
  }

  #[test]
  fn test_audio_timestamp_operations() {
    let timestamp = AudioTimestamp::from_seconds(123.456);
    assert_eq!(timestamp.seconds, 123.456);

    // Проверяем миллисекунды
    assert_eq!(timestamp.as_millis(), 123456.0);

    // Проверяем что precision сохраняется
    let precise_timestamp = AudioTimestamp::from_millis(123456.789);
    assert!((precise_timestamp.seconds - 123.456789).abs() < 0.000001);

    // Проверяем форматирование времени
    let ts_mmss = AudioTimestamp::from_seconds(125.0);
    assert_eq!(ts_mmss.as_mmss(), "02:05");

    let ts_hhmmss = AudioTimestamp::from_seconds(3725.0);
    assert_eq!(ts_hhmmss.as_hhmmss(), "01:02:05");

    // Проверяем zero
    let zero = AudioTimestamp::zero();
    assert_eq!(zero.seconds, 0.0);

    // Проверяем add_duration
    let start = AudioTimestamp::from_seconds(10.0);
    let duration = AudioDuration::from_seconds(5.5);
    let end = start.add_duration(duration);
    assert_eq!(end.seconds, 15.5);

    // Проверяем duration_to
    let ts1 = AudioTimestamp::from_seconds(10.0);
    let ts2 = AudioTimestamp::from_seconds(20.0);
    let duration_between = ts1.duration_to(ts2);
    assert_eq!(duration_between.seconds, 10.0);
  }

  #[test]
  fn test_audio_frequency_operations() {
    let freq = AudioFrequency::from_hz(440.0);
    assert_eq!(freq.hz, 440.0);

    // Проверяем conversion в kHz
    let freq_khz = AudioFrequency::from_khz(1.0);
    assert_eq!(freq_khz.hz, 1000.0);
    assert_eq!(freq_khz.as_khz(), 1.0);
  }

  #[test]
  fn test_audio_sample_rate() {
    let sample_rate = AudioSampleRate { hz: 44100 };
    assert_eq!(sample_rate.hz, 44100);

    // Стандартные sample rates
    let cd_quality = AudioSampleRate { hz: 44100 };
    let studio_quality = AudioSampleRate { hz: 48000 };
    let high_res = AudioSampleRate { hz: 96000 };

    assert!(cd_quality.hz < studio_quality.hz);
    assert!(studio_quality.hz < high_res.hz);
  }

  #[test]
  fn test_audio_quality_level() {
    let quality = AudioQualityLevel::High;
    // No to_numeric method, just test enum variants

    let low_quality = AudioQualityLevel::Low;
    let very_high_quality = AudioQualityLevel::VeryHigh;

    // Test that variants exist and can be compared
    assert_ne!(low_quality, quality);
    assert_ne!(quality, very_high_quality);

    // Test display
    assert_eq!(format!("{}", quality), "High");
    assert_eq!(format!("{}", low_quality), "Low");
  }

  #[test]
  fn test_audio_time_range() {
    let start = AudioTimestamp::from_seconds(1.0);
    let end = AudioTimestamp::from_seconds(3.5);
    let range = AudioTimeRange::new(start, end);

    assert_eq!(range.start.seconds, 1.0);
    assert_eq!(range.end.seconds, 3.5);

    // Проверяем метод duration
    let duration = range.duration();
    assert_eq!(duration.seconds, 2.5);

    // Проверяем contains
    let middle = AudioTimestamp::from_seconds(2.0);
    assert!(range.contains(middle));

    let outside = AudioTimestamp::from_seconds(5.0);
    assert!(!range.contains(outside));

    // Проверяем is_valid
    assert!(range.is_valid());

    let invalid_range = AudioTimeRange::new(
      AudioTimestamp::from_seconds(10.0),
      AudioTimestamp::from_seconds(5.0),
    );
    assert!(!invalid_range.is_valid());

    // Проверяем overlaps_with
    let overlapping_range = AudioTimeRange::new(
      AudioTimestamp::from_seconds(2.0),
      AudioTimestamp::from_seconds(5.0),
    );
    assert!(range.overlaps_with(&overlapping_range));

    let non_overlapping_range = AudioTimeRange::new(
      AudioTimestamp::from_seconds(10.0),
      AudioTimestamp::from_seconds(15.0),
    );
    assert!(!range.overlaps_with(&non_overlapping_range));
  }

  #[test]
  fn test_unified_audio_config_defaults() {
    let config = UnifiedAudioConfig::default();

    assert!(config.enable_ffmpeg_analysis);
    assert!(!config.enable_transcription); // По умолчанию выключено
    assert!(config.enable_montage_analysis);
    assert!(config.enable_ffmpeg_analysis);

    match config.performance_mode {
      AudioPerformanceMode::Balanced => {} // Expected default
      _ => panic!("Expected default performance mode to be Balanced"),
    }
  }

  #[test]
  fn test_audio_performance_modes() {
    let fast = AudioPerformanceMode::Fast;
    let balanced = AudioPerformanceMode::Balanced;
    let quality = AudioPerformanceMode::Quality;

    // Test that they're different
    assert!(format!("{:?}", fast) != format!("{:?}", balanced));
    assert!(format!("{:?}", balanced) != format!("{:?}", quality));
  }

  #[test]
  fn test_unified_audio_analysis_result_structure() {
    let metadata = AudioAnalysisMetadata {
      analysis_version: "2.0-unified".to_string(),
      processing_time_ms: 5000,
      engines_used: vec!["ffmpeg".to_string(), "montage".to_string()],
      config_used: UnifiedAudioConfig::default(),
      total_engines_available: 3,
      analysis_timestamp: chrono::Utc::now().to_rfc3339(),
      success_rate: 1.0,
    };

    let basic_metrics = AudioBasicMetrics {
      has_audio: true,
      duration: AudioDuration::from_seconds(120.0),
      sample_rate: AudioSampleRate { hz: 44100 },
      channels: 2,
      overall_volume: AudioVolume::from_normalized(0.7),
      estimated_quality: 0.8,            // f64, not enum
      file_size_bytes: Some(10485760.0), // 10MB
      codec: Some("aac".to_string()),
      bitrate: Some(128000),
    };

    let result = UnifiedAudioAnalysisResult {
      basic_metrics,
      ffmpeg_analysis: None,
      montage_analysis: None,
      transcription_analysis: None,
      analysis_metadata: metadata,
    };

    assert_eq!(result.basic_metrics.duration.seconds, 120.0);
    assert_eq!(result.basic_metrics.channels, 2);
    assert!(result.basic_metrics.has_audio);
    assert_eq!(result.analysis_metadata.engines_used.len(), 2);
  }

  #[test]
  fn test_transcription_segment_structure() {
    let segment = TranscriptionSegment {
      start_time: AudioTimestamp::from_seconds(10.5),
      end_time: AudioTimestamp::from_seconds(15.2),
      text: "Hello world".to_string(),
      confidence: 0.95,
      language: Some("en".to_string()),
      speaker_id: None,
    };

    assert_eq!(segment.start_time.seconds, 10.5);
    assert_eq!(segment.end_time.seconds, 15.2);
    assert_eq!(segment.text, "Hello world");
    assert_eq!(segment.confidence, 0.95);
    assert_eq!(segment.language, Some("en".to_string()));
    assert_eq!(segment.speaker_id, None);

    // Duration calculation
    let duration = segment.end_time.seconds - segment.start_time.seconds;
    assert!((duration - 4.7).abs() < 0.1);
  }

  #[test]
  fn test_transcription_word_structure() {
    let word = TranscriptionWord {
      word: "hello".to_string(),
      start_time: AudioTimestamp::from_seconds(1.0),
      end_time: AudioTimestamp::from_seconds(1.5),
      confidence: 0.98,
    };

    assert_eq!(word.word, "hello");
    assert_eq!(word.start_time.seconds, 1.0);
    assert_eq!(word.end_time.seconds, 1.5);
    assert_eq!(word.confidence, 0.98);
  }

  #[test]
  fn test_audio_transcription_analysis_unified_fields() {
    let segments = vec![TranscriptionSegment {
      start_time: AudioTimestamp::from_seconds(0.0),
      end_time: AudioTimestamp::from_seconds(2.0),
      text: "Test segment".to_string(),
      confidence: 0.9,
      language: Some("en".to_string()),
      speaker_id: None,
    }];

    let words = vec![TranscriptionWord {
      word: "Test".to_string(),
      start_time: AudioTimestamp::from_seconds(0.0),
      end_time: AudioTimestamp::from_seconds(0.5),
      confidence: 0.95,
    }];

    let analysis = AudioTranscriptionAnalysis {
      // Unified fields
      engine_name: "whisper".to_string(),
      full_text: "Test segment".to_string(),
      detected_language: Some("en".to_string()),
      total_duration: Some(AudioDuration::from_seconds(2.0)),
      segments,
      words,
      confidence_score: 0.9,
      processing_time: AudioDuration::from_seconds(1.0),

      // Legacy fields для совместимости
      transcription_text: Some("Test segment".to_string()),
      language_detected: Some("en".to_string()),
      overall_confidence: Some(0.9),
      word_segments: None,
      sentence_segments: None,
      speaker_segments: None,
      speech_rate: None,
      pause_analysis: None,
      pronunciation_quality: None,
      model_used: Some("whisper".to_string()),
      provider_used: Some("local".to_string()),
    };

    // Test unified fields
    assert_eq!(analysis.engine_name, "whisper");
    assert_eq!(analysis.full_text, "Test segment");
    assert_eq!(analysis.detected_language, Some("en".to_string()));
    assert_eq!(analysis.segments.len(), 1);
    assert_eq!(analysis.words.len(), 1);
    assert_eq!(analysis.confidence_score, 0.9);

    // Test legacy compatibility
    assert_eq!(
      analysis.transcription_text,
      Some("Test segment".to_string())
    );
    assert_eq!(analysis.language_detected, Some("en".to_string()));
    assert_eq!(analysis.overall_confidence, Some(0.9));
  }

  #[test]
  fn test_audio_analysis_error_types() {
    let file_error = AudioAnalysisError::FileNotFound("test.mp3".to_string());
    let format_error = AudioAnalysisError::UnsupportedFormat("unknown".to_string());
    let ffmpeg_error = AudioAnalysisError::FFmpegError("ffmpeg failed".to_string());
    let whisper_error = AudioAnalysisError::WhisperError("whisper failed".to_string());
    let processing_error = AudioAnalysisError::ProcessingError("processing failed".to_string());

    // Test error messages
    assert!(format!("{}", file_error).contains("test.mp3"));
    assert!(format!("{}", format_error).contains("unknown"));
    assert!(format!("{}", ffmpeg_error).contains("ffmpeg failed"));
    assert!(format!("{}", whisper_error).contains("whisper failed"));
    assert!(format!("{}", processing_error).contains("processing failed"));
  }

  #[test]
  fn test_type_conversions_precision() {
    // Test f32 to f64 conversion (важно для Montage Planner integration)
    let f32_value: f32 = 0.123456;
    let f64_value: AudioFloat = f32_value as f64;

    assert!((f64_value - 0.123456).abs() < 0.000001);

    // Test that unified types maintain precision
    let duration_from_f32 = AudioDuration::from_seconds(f32_value as f64);
    let duration_from_f64 = AudioDuration::from_seconds(0.123456);

    assert!((duration_from_f32.seconds - duration_from_f64.seconds).abs() < 0.000001);
  }

  #[test]
  fn test_serialization_deserialization() {
    use serde_json;

    let volume = AudioVolume::from_normalized(0.75);
    let serialized = serde_json::to_string(&volume).expect("Failed to serialize");
    let deserialized: AudioVolume =
      serde_json::from_str(&serialized).expect("Failed to deserialize");

    assert_eq!(volume.level, deserialized.level);

    // Test duration serialization
    let duration = AudioDuration::from_seconds(123.456);
    let serialized = serde_json::to_string(&duration).expect("Failed to serialize");
    let deserialized: AudioDuration =
      serde_json::from_str(&serialized).expect("Failed to deserialize");

    assert_eq!(duration.seconds, deserialized.seconds);
  }

  #[test]
  fn test_edge_cases() {
    // Test zero values
    let zero_duration = AudioDuration::from_seconds(0.0);
    assert_eq!(zero_duration.seconds, 0.0);
    assert_eq!(zero_duration.as_millis(), 0.0);

    // Test very small values
    let tiny_duration = AudioDuration::from_millis(0.001); // 1 microsecond в millis
    assert_eq!(tiny_duration.as_millis(), 0.001);
    assert!((tiny_duration.seconds - 0.000001).abs() < 0.0000001);

    // Test large values
    let large_duration = AudioDuration::from_seconds(3600.0); // 1 hour
    assert_eq!(large_duration.seconds, 3600.0);
    assert_eq!(large_duration.as_millis(), 3600000.0);

    // Test volume edge cases
    let min_volume = AudioVolume::from_normalized(0.0);
    let max_volume = AudioVolume::from_normalized(1.0);

    assert_eq!(min_volume.level, 0.0);
    assert_eq!(max_volume.level, 1.0);
  }
}
