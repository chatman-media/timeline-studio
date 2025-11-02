//! Basic tests для unified audio types
//!
//! Простые тесты чтобы проверить основную функциональность unified системы

#[cfg(test)]
mod tests {
  use super::super::audio_analysis::*;
  use crate::analysis::types::{
    AudioDuration, AudioFloat, AudioFrequency, AudioTimestamp, AudioVolume,
  };

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
  fn test_audio_duration_basic() {
    let duration = AudioDuration::from_seconds(1.5);
    assert_eq!(duration.seconds, 1.5);

    // Test millis conversion
    let millis_duration = AudioDuration::from_millis(1500.0);
    assert_eq!(millis_duration.seconds, 1.5);
    assert_eq!(millis_duration.as_millis(), 1500.0);
  }

  #[test]
  fn test_audio_volume_basic() {
    let volume = AudioVolume::from_normalized(0.5);
    assert_eq!(volume.level, 0.5);

    // Test dB conversion
    let vol_db = AudioVolume::from_db(-6.0);
    let db_value = vol_db.to_db();
    assert!(db_value >= -6.1 && db_value <= -5.9);
  }

  #[test]
  fn test_audio_timestamp_basic() {
    let timestamp = AudioTimestamp::from_seconds(123.456);
    assert_eq!(timestamp.seconds, 123.456);
    assert_eq!(timestamp.as_millis(), 123456.0);
  }

  #[test]
  fn test_audio_frequency_basic() {
    let freq = AudioFrequency::from_hz(440.0);
    assert_eq!(freq.hz, 440.0);

    let freq_khz = AudioFrequency::from_khz(1.0);
    assert_eq!(freq_khz.hz, 1000.0);
  }

  #[test]
  fn test_unified_audio_config_default() {
    let config = UnifiedAudioConfig::default();

    assert!(config.enable_ffmpeg_analysis);
    assert!(config.enable_montage_analysis);
    assert!(!config.enable_transcription);
    assert!(config.enable_caching);
  }

  #[test]
  fn test_audio_analysis_error_display() {
    let error = AudioAnalysisError::FileNotFound("test.mp3".to_string());
    let error_string = format!("{}", error);
    assert!(error_string.contains("test.mp3"));
  }
}
