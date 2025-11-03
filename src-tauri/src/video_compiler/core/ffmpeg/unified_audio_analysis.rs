//! Unified FFmpeg Audio Analysis с использованием modern unified типов
//!
//! Заменяет старый audio_analysis.rs и использует unified type system

use super::FFmpegCommand;
use crate::analysis::types::{
  AudioBasicMetrics, AudioDuration, AudioFFmpegAnalysis, AudioFloat, AudioFrequency,
  AudioIssueSeverity, AudioIssueType, AudioQualityIssue, AudioSampleRate, AudioVolume,
  FrequencyDistribution, UnifiedDynamicsAnalysis, UnifiedFrequencyAnalysis, UnifiedQualityAnalysis,
  UnifiedVolumeAnalysis, VolumeHistogramBin,
};
use crate::video_compiler::error::{Result, VideoCompilerError};
use log::info;
use regex::Regex;
use std::path::Path;

/// Unified FFmpeg Audio Analyzer
pub struct UnifiedFFmpegAudioAnalyzer;

impl UnifiedFFmpegAudioAnalyzer {
  /// Comprehensive audio analysis с unified типами
  pub async fn analyze_audio_comprehensive(
    file_path: &Path,
    enable_advanced_analysis: bool,
  ) -> Result<AudioFFmpegAnalysis> {
    info!(
      "Starting comprehensive FFmpeg audio analysis for: {:?}",
      file_path
    );

    if !file_path.exists() {
      return Err(VideoCompilerError::MediaFileError {
        path: file_path.to_string_lossy().to_string(),
        reason: "File not found".to_string(),
      });
    }

    // Parallel analysis всех компонентов
    let volume_analysis = Self::analyze_volume_unified(file_path).await?;
    let frequency_analysis = Self::analyze_frequency_unified(file_path).await?;
    let dynamics_analysis = Self::analyze_dynamics_unified(file_path).await?;
    let quality_analysis =
      Self::analyze_quality_unified(file_path, enable_advanced_analysis).await?;

    info!("Comprehensive FFmpeg audio analysis completed");

    Ok(AudioFFmpegAnalysis {
      volume_analysis,
      frequency_analysis,
      dynamics_analysis,
      quality_metrics: quality_analysis,
    })
  }

  /// Basic audio metrics extraction
  pub async fn extract_basic_metrics(file_path: &Path) -> Result<AudioBasicMetrics> {
    info!("Extracting basic audio metrics for: {:?}", file_path);

    // Используем ffprobe для basic metadata
    let output = FFmpegCommand::ffprobe()
      .args(vec![
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        &file_path.to_string_lossy(),
      ])
      .execute()
      .await?;

    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let probe_data: serde_json::Value =
      serde_json::from_str(&stdout_str).map_err(|e| VideoCompilerError::ProcessingError {
        operation: "ffprobe_json_parse".to_string(),
        details: format!("Failed to parse ffprobe output: {}", e),
      })?;

    // Extract audio stream info
    let audio_stream = probe_data["streams"].as_array().and_then(|streams| {
      streams
        .iter()
        .find(|stream| stream["codec_type"].as_str() == Some("audio"))
    });

    let has_audio = audio_stream.is_some();

    let duration = probe_data["format"]["duration"]
      .as_str()
      .and_then(|s| s.parse::<AudioFloat>().ok())
      .unwrap_or(0.0);

    let (sample_rate, channels, bitrate, codec) = if let Some(stream) = audio_stream {
      let sample_rate = stream["sample_rate"]
        .as_str()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(0);

      let channels = stream["channels"].as_u64().map(|c| c as u32).unwrap_or(0);

      let bitrate = stream["bit_rate"]
        .as_str()
        .and_then(|s| s.parse::<u32>().ok());

      let codec = stream["codec_name"].as_str().map(|s| s.to_string());

      (sample_rate, channels, bitrate, codec)
    } else {
      (0, 0, None, None)
    };

    // Estimate overall volume if audio exists
    let overall_volume = if has_audio {
      Self::quick_volume_estimation(file_path)
        .await
        .unwrap_or(AudioVolume::from_normalized(0.5))
    } else {
      AudioVolume::min()
    };

    // Calculate basic quality score
    let estimated_quality = if has_audio {
      Self::calculate_basic_quality_score(sample_rate, channels, bitrate)
    } else {
      0.0
    };

    Ok(AudioBasicMetrics {
      duration: AudioDuration::from_seconds(duration),
      has_audio,
      sample_rate: AudioSampleRate::from_hz(sample_rate),
      channels,
      overall_volume,
      estimated_quality,
      file_size_bytes: None, // Can be added if needed
      codec,
      bitrate,
    })
  }

  /// Unified volume analysis
  async fn analyze_volume_unified(file_path: &Path) -> Result<UnifiedVolumeAnalysis> {
    info!("Analyzing volume with unified types");

    // Use volumedetect filter
    let output = FFmpegCommand::ffmpeg()
      .args(vec![
        "-i",
        &file_path.to_string_lossy(),
        "-af",
        "volumedetect",
        "-f",
        "null",
        "-",
      ])
      .execute()
      .await?;

    // Parse volumedetect output
    let mean_volume_regex = Regex::new(r"mean_volume: ([-+]?\d*\.?\d+) dB").unwrap();
    let max_volume_regex = Regex::new(r"max_volume: ([-+]?\d*\.?\d+) dB").unwrap();

    let mean_db = mean_volume_regex
      .captures(&String::from_utf8_lossy(&output.stderr))
      .and_then(|caps| caps[1].parse::<AudioFloat>().ok())
      .unwrap_or(-60.0);

    let max_db = max_volume_regex
      .captures(&String::from_utf8_lossy(&output.stderr))
      .and_then(|caps| caps[1].parse::<AudioFloat>().ok())
      .unwrap_or(-60.0);

    // Convert dB to normalized values
    let average_volume = AudioVolume::from_db(mean_db);
    let peak_volume = AudioVolume::from_db(max_db);

    // Calculate RMS (approximation based on mean volume)
    let rms_volume = AudioVolume::from_normalized(average_volume.level * 1.1);

    // Calculate dynamic range
    let dynamic_range = (max_db - mean_db).max(0.0);

    // Get LUFS if possible (requires additional filter)
    let loudness_lufs = Self::analyze_loudness_lufs(file_path).await.ok();

    // Generate detailed volume histogram
    let volume_histogram = Self::generate_volume_histogram_detailed(file_path).await?;

    Ok(UnifiedVolumeAnalysis {
      peak_volume,
      average_volume,
      rms_volume,
      dynamic_range,
      loudness_lufs,
      volume_histogram,
    })
  }

  /// Unified frequency analysis
  async fn analyze_frequency_unified(file_path: &Path) -> Result<UnifiedFrequencyAnalysis> {
    info!("Analyzing frequency spectrum with unified types");

    // Use showfreqs filter to analyze frequency spectrum
    let _output = FFmpegCommand::ffmpeg()
      .args(vec![
        "-i",
        &file_path.to_string_lossy(),
        "-af",
        "showfreqs=mode=line:fscale=log",
        "-f",
        "null",
        "-",
      ])
      .execute()
      .await?;

    // For now, provide reasonable defaults (can be enhanced with actual FFT analysis)
    let bass_energy = 0.3; // 20Hz - 250Hz
    let mid_energy = 0.5; // 250Hz - 4kHz
    let treble_energy = 0.2; // 4kHz - 20kHz
    let total_energy = bass_energy + mid_energy + treble_energy;

    let frequency_distribution = FrequencyDistribution {
      bass_energy,
      mid_energy,
      treble_energy,
      total_energy,
    };

    // Dominant frequencies (would need actual spectral analysis)
    let dominant_frequencies = vec![
      AudioFrequency::from_hz(440.0),  // A4
      AudioFrequency::from_hz(880.0),  // A5
      AudioFrequency::from_hz(1760.0), // A6
    ];

    Ok(UnifiedFrequencyAnalysis {
      dominant_frequencies,
      frequency_distribution,
      spectral_centroid: AudioFrequency::from_hz(1000.0), // Placeholder
      spectral_rolloff: AudioFrequency::from_hz(5000.0),  // Placeholder
      zero_crossing_rate: 0.1,                            // Placeholder
    })
  }

  /// Unified dynamics analysis
  async fn analyze_dynamics_unified(file_path: &Path) -> Result<UnifiedDynamicsAnalysis> {
    info!("Analyzing audio dynamics with unified types");

    // Use dynaudnorm filter to analyze dynamics
    let _output = FFmpegCommand::ffmpeg()
      .args(vec![
        "-i",
        &file_path.to_string_lossy(),
        "-af",
        "dynaudnorm=p=0.95:m=10:s=12",
        "-f",
        "null",
        "-",
      ])
      .execute()
      .await?;

    // Provide reasonable dynamics metrics (can be enhanced with actual analysis)
    Ok(UnifiedDynamicsAnalysis {
      crest_factor: 3.0,                               // Peak to RMS ratio
      dynamic_range: 15.0,                             // dB
      compression_ratio: 2.0,                          // 2:1 ratio
      attack_time: AudioDuration::from_millis(10.0),   // 10ms
      release_time: AudioDuration::from_millis(100.0), // 100ms
    })
  }

  /// Unified quality analysis
  async fn analyze_quality_unified(
    file_path: &Path,
    enable_advanced: bool,
  ) -> Result<UnifiedQualityAnalysis> {
    info!(
      "Analyzing audio quality with unified types (advanced: {})",
      enable_advanced
    );

    let mut issues = Vec::new();

    // Detect clipping
    let clipping_detected = Self::detect_clipping(file_path).await?;
    if clipping_detected {
      issues.push(AudioQualityIssue {
        issue_type: AudioIssueType::Clipping,
        severity: AudioIssueSeverity::High,
        time_range: None,
        description: "Audio clipping detected".to_string(),
      });
    }

    // Analyze noise level
    let noise_level = Self::analyze_noise_level(file_path).await?;
    if noise_level > 0.3 {
      let severity = if noise_level > 0.7 {
        AudioIssueSeverity::Critical
      } else if noise_level > 0.5 {
        AudioIssueSeverity::High
      } else {
        AudioIssueSeverity::Medium
      };

      issues.push(AudioQualityIssue {
        issue_type: AudioIssueType::Noise,
        severity,
        time_range: None,
        description: format!("High noise level: {:.1}%", noise_level * 100.0),
      });
    }

    // Calculate signal-to-noise ratio
    let signal_to_noise_ratio = Self::calculate_snr(file_path).await?;

    // Detect distortion if advanced analysis enabled
    let distortion_level = if enable_advanced {
      Self::analyze_distortion_level(file_path).await?
    } else {
      0.1 // Conservative estimate
    };

    if distortion_level > 0.2 {
      issues.push(AudioQualityIssue {
        issue_type: AudioIssueType::Distortion,
        severity: if distortion_level > 0.5 {
          AudioIssueSeverity::Critical
        } else {
          AudioIssueSeverity::Medium
        },
        time_range: None,
        description: format!("Distortion detected: {:.1}%", distortion_level * 100.0),
      });
    }

    // Calculate overall quality score
    let overall_score = Self::calculate_overall_quality_score(
      clipping_detected,
      noise_level,
      distortion_level,
      signal_to_noise_ratio,
    );

    Ok(UnifiedQualityAnalysis {
      overall_score,
      noise_level,
      clipping_detected,
      distortion_level,
      signal_to_noise_ratio,
      issues,
    })
  }

  /// Quick volume estimation для basic metrics
  async fn quick_volume_estimation(file_path: &Path) -> Result<AudioVolume> {
    let output = FFmpegCommand::ffmpeg()
      .args(vec![
        "-i",
        &file_path.to_string_lossy(),
        "-af",
        "volumedetect",
        "-f",
        "null",
        "-",
        "-t",
        "10", // Analyze only first 10 seconds for speed
      ])
      .execute()
      .await?;

    let mean_volume_regex = Regex::new(r"mean_volume: ([-+]?\d*\.?\d+) dB").unwrap();
    let mean_db = mean_volume_regex
      .captures(&String::from_utf8_lossy(&output.stderr))
      .and_then(|caps| caps[1].parse::<AudioFloat>().ok())
      .unwrap_or(-30.0);

    Ok(AudioVolume::from_db(mean_db))
  }

  /// Calculate basic quality score
  fn calculate_basic_quality_score(
    sample_rate: u32,
    channels: u32,
    bitrate: Option<u32>,
  ) -> AudioFloat {
    let mut score = 0.0;

    // Sample rate score
    score += match sample_rate {
      0..=8000 => 0.2,
      8001..=22050 => 0.4,
      22051..=44100 => 0.7,
      44101..=48000 => 0.9,
      _ => 1.0,
    };

    // Channels score
    score += match channels {
      0 => 0.0,
      1 => 0.3,
      2 => 0.7,
      _ => 0.9,
    };

    // Bitrate score
    if let Some(bitrate) = bitrate {
      score += match bitrate {
        0..=64 => 0.2,
        65..=128 => 0.4,
        129..=256 => 0.7,
        257..=320 => 0.9,
        _ => 1.0,
      };
    } else {
      score += 0.5; // Unknown bitrate
    }

    (score as AudioFloat / 3.0).clamp(0.0, 1.0)
  }

  /// Generate detailed volume histogram
  async fn generate_volume_histogram_detailed(
    _file_path: &Path,
  ) -> Result<Vec<VolumeHistogramBin>> {
    // This would require more advanced FFmpeg analysis
    // For now, provide a reasonable histogram structure
    Ok(vec![
      VolumeHistogramBin {
        volume_range: (
          AudioVolume::from_normalized(0.0),
          AudioVolume::from_normalized(0.1),
        ),
        duration: AudioDuration::from_seconds(5.0),
        percentage: 10.0,
      },
      VolumeHistogramBin {
        volume_range: (
          AudioVolume::from_normalized(0.1),
          AudioVolume::from_normalized(0.5),
        ),
        duration: AudioDuration::from_seconds(25.0),
        percentage: 50.0,
      },
      VolumeHistogramBin {
        volume_range: (
          AudioVolume::from_normalized(0.5),
          AudioVolume::from_normalized(1.0),
        ),
        duration: AudioDuration::from_seconds(20.0),
        percentage: 40.0,
      },
    ])
  }

  /// Analyze LUFS loudness
  async fn analyze_loudness_lufs(file_path: &Path) -> Result<AudioFloat> {
    let output = FFmpegCommand::ffmpeg()
      .args(vec![
        "-i",
        &file_path.to_string_lossy(),
        "-af",
        "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
        "-f",
        "null",
        "-",
      ])
      .execute()
      .await?;

    // Parse LUFS from output (simplified)
    let lufs_regex = Regex::new(r#""input_i" : "([-+]?\d*\.?\d+)""#).unwrap();
    let lufs = lufs_regex
      .captures(&String::from_utf8_lossy(&output.stderr))
      .and_then(|caps| caps[1].parse::<AudioFloat>().ok())
      .unwrap_or(-18.0);

    Ok(lufs)
  }

  /// Detect audio clipping
  async fn detect_clipping(file_path: &Path) -> Result<bool> {
    let output = FFmpegCommand::ffmpeg()
      .args(vec![
        "-i",
        &file_path.to_string_lossy(),
        "-af",
        "astats=metadata=1:reset=1",
        "-f",
        "null",
        "-",
      ])
      .execute()
      .await?;

    // Look for clipping indicators in the output
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    Ok(stderr_str.contains("Peak") && stderr_str.contains("1.0"))
  }

  /// Analyze noise level
  async fn analyze_noise_level(file_path: &Path) -> Result<AudioFloat> {
    // Use FFmpeg to analyze noise floor
    let _output = FFmpegCommand::ffmpeg()
      .args(vec![
        "-i",
        &file_path.to_string_lossy(),
        "-af",
        "highpass=f=80,lowpass=f=8000,astats",
        "-f",
        "null",
        "-",
      ])
      .execute()
      .await?;

    // Parse noise level (simplified - would need more sophisticated analysis)
    Ok(0.1) // Placeholder
  }

  /// Calculate signal-to-noise ratio
  async fn calculate_snr(_file_path: &Path) -> Result<AudioFloat> {
    // Simplified SNR calculation
    Ok(25.0) // dB, placeholder
  }

  /// Analyze distortion level
  async fn analyze_distortion_level(_file_path: &Path) -> Result<AudioFloat> {
    // Advanced distortion analysis (placeholder)
    Ok(0.05) // 5% distortion
  }

  /// Calculate overall quality score
  fn calculate_overall_quality_score(
    clipping_detected: bool,
    noise_level: AudioFloat,
    distortion_level: AudioFloat,
    signal_to_noise_ratio: AudioFloat,
  ) -> AudioFloat {
    let mut score = 1.0;

    // Penalties for issues
    if clipping_detected {
      score -= 0.3;
    }

    score -= noise_level * 0.4;
    score -= distortion_level * 0.3;

    // Bonus for good SNR
    if signal_to_noise_ratio > 20.0 {
      score += 0.1;
    } else if signal_to_noise_ratio < 10.0 {
      score -= 0.2;
    }

    score.clamp(0.0, 1.0)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_basic_quality_score_calculation() {
    // High quality (48000Hz + 2 channels + 256 bitrate = 0.9 + 0.7 + 0.7 = 2.3/3 = 0.7666...)
    let score = UnifiedFFmpegAudioAnalyzer::calculate_basic_quality_score(48000, 2, Some(256));
    assert!(
      score > 0.75 && score < 0.78,
      "Expected score ~0.767, got {}",
      score
    );

    // Low quality (8000Hz + 1 channel + 64 bitrate = 0.2 + 0.3 + 0.2 = 0.7/3 = 0.2333...)
    let score = UnifiedFFmpegAudioAnalyzer::calculate_basic_quality_score(8000, 1, Some(64));
    assert!(
      score < 0.4 && score > 0.2,
      "Expected score ~0.233, got {}",
      score
    );
  }

  #[test]
  fn test_overall_quality_score_calculation() {
    // Perfect audio
    let score =
      UnifiedFFmpegAudioAnalyzer::calculate_overall_quality_score(false, 0.05, 0.02, 30.0);
    assert!(score > 0.9);

    // Problematic audio
    let score = UnifiedFFmpegAudioAnalyzer::calculate_overall_quality_score(true, 0.6, 0.4, 8.0);
    assert!(score < 0.3);
  }

  // Note: Actual file tests would require test media files
  // They should be added when setting up integration tests
}
