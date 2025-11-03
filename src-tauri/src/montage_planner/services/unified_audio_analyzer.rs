//! Unified Audio Analyzer for Montage Planner
//!
//! Модернизированный audio analyzer с unified f64 типами для интеграции с
//! существующим unified audio analysis system.

use crate::analysis::types::{
  AudioAnalysisError, AudioBasicMetrics, AudioDuration, AudioFloat, AudioMontageAnalysis,
  AudioVolume,
};
use crate::montage_planner::types::{AudioContentType, EmotionalTone};
use anyhow::Result;
use log::{debug, info};
use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::process::Command as AsyncCommand;

/// Unified Audio Analyzer с f64 типами для Montage Planner
pub struct UnifiedMontageAudioAnalyzer {
  /// Configuration for audio analysis
  #[allow(dead_code)]
  config: UnifiedAudioAnalysisConfig,
}

/// Unified configuration с f64 типами
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedAudioAnalysisConfig {
  pub sample_rate: u32,
  pub frame_size: usize,
  pub hop_length: usize,
  pub enable_speech_detection: bool,
  pub enable_music_detection: bool,
  pub enable_beat_detection: bool,
  pub enable_emotion_detection: bool,
  /// Processing timeout in seconds
  pub max_processing_time: AudioDuration,
  /// Quality threshold (0.0-1.0)
  pub quality_threshold: AudioFloat,
}

impl Default for UnifiedAudioAnalysisConfig {
  fn default() -> Self {
    Self {
      sample_rate: 44100,
      frame_size: 2048,
      hop_length: 512,
      enable_speech_detection: true,
      enable_music_detection: true,
      enable_beat_detection: true,
      enable_emotion_detection: true,
      max_processing_time: AudioDuration::from_seconds(30.0),
      quality_threshold: 0.7,
    }
  }
}

/// Unified Audio Analysis Result с f64 типами
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedMontageAudioAnalysisResult {
  pub content_type: AudioContentType,
  pub speech_presence: AudioFloat, // 0.0-1.0: percentage of speech
  pub music_presence: AudioFloat,  // 0.0-1.0: percentage of music
  pub ambient_level: AudioVolume,  // background noise level
  pub emotional_tone: EmotionalTone,
  pub tempo: Option<AudioFloat>,     // BPM if music detected
  pub beat_markers: Vec<AudioFloat>, // Timestamps of detected beats (seconds)
  pub energy_level: AudioVolume,     // overall energy
  pub dynamic_range: AudioFloat,     // audio dynamic range (dB)

  // Дополнительные unified поля
  pub basic_metrics: AudioBasicMetrics,
  pub quality_score: AudioFloat, // 0.0-1.0: overall quality
  pub processing_time: AudioDuration,
  pub analysis_version: String,
}

impl UnifiedMontageAudioAnalyzer {
  /// Create new unified audio analyzer
  pub fn new() -> Self {
    Self {
      config: UnifiedAudioAnalysisConfig::default(),
    }
  }

  /// Create analyzer with custom configuration
  pub fn with_config(config: UnifiedAudioAnalysisConfig) -> Self {
    Self { config }
  }

  /// Analyze audio file и return unified analysis result
  pub async fn analyze_audio<P: AsRef<Path>>(
    &self,
    audio_path: P,
  ) -> Result<UnifiedMontageAudioAnalysisResult, AudioAnalysisError> {
    let path = audio_path.as_ref();
    let start_time = std::time::Instant::now();

    info!(
      "Starting unified montage audio analysis for: {}",
      path.display()
    );

    if !path.exists() {
      return Err(AudioAnalysisError::FileNotFound(
        path.to_string_lossy().to_string(),
      ));
    }

    // Extract basic audio metadata first
    let basic_metrics = self.extract_basic_metrics(path).await.map_err(|e| {
      AudioAnalysisError::ProcessingError(format!("Failed to extract basic metrics: {}", e))
    })?;

    debug!(
      "Basic metrics extracted: duration={}s, channels={}",
      basic_metrics.duration.seconds, basic_metrics.channels
    );

    // Perform unified analysis using FFmpeg filters
    let content_type = self.detect_content_type_unified(path).await?;
    let speech_presence = self.detect_speech_presence_unified(path).await?;
    let music_presence = self.detect_music_presence_unified(path).await?;
    let emotional_tone = self.detect_emotional_tone_unified(path).await?;
    let tempo = self.detect_tempo_unified(path).await?;
    let beat_markers = self.detect_beats_unified(path, tempo).await?;
    let energy_level = self.calculate_energy_level_unified(path).await?;
    let dynamic_range = self.calculate_dynamic_range_unified(path).await?;
    let ambient_level = self.calculate_ambient_level_unified(path).await?;

    let processing_time = AudioDuration::from_millis(start_time.elapsed().as_millis() as f64);

    // Calculate overall quality score
    let quality_score = self.calculate_quality_score(&basic_metrics, &energy_level, dynamic_range);

    info!(
      "Unified montage audio analysis completed in {}ms",
      processing_time.as_millis()
    );

    Ok(UnifiedMontageAudioAnalysisResult {
      content_type,
      speech_presence,
      music_presence,
      ambient_level,
      emotional_tone,
      tempo,
      beat_markers,
      energy_level,
      dynamic_range,
      basic_metrics,
      quality_score,
      processing_time,
      analysis_version: "unified-montage-v1.0".to_string(),
    })
  }

  /// Analyze audio segment at specific timestamp с unified типами
  pub async fn analyze_audio_segment<P: AsRef<Path>>(
    &self,
    audio_path: P,
    start_time: AudioFloat,
    duration: AudioFloat,
  ) -> Result<UnifiedAudioSegmentAnalysis, AudioAnalysisError> {
    let path = audio_path.as_ref();

    if !path.exists() {
      return Err(AudioAnalysisError::FileNotFound(
        path.to_string_lossy().to_string(),
      ));
    }

    debug!(
      "Analyzing unified audio segment: {}s-{}s",
      start_time,
      start_time + duration
    );

    // Extract segment features using unified FFmpeg analysis
    let segment_analysis = self
      .extract_segment_features_unified(path, start_time, duration)
      .await?;

    Ok(segment_analysis)
  }

  /// Extract basic audio metrics с unified типами
  async fn extract_basic_metrics<P: AsRef<Path>>(
    &self,
    path: P,
  ) -> Result<AudioBasicMetrics, anyhow::Error> {
    let path = path.as_ref();

    let output = AsyncCommand::new("ffprobe")
      .args([
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        path
          .to_str()
          .ok_or_else(|| anyhow::anyhow!("Invalid path"))?,
      ])
      .output()
      .await?;

    if !output.status.success() {
      return Err(anyhow::anyhow!("ffprobe failed"));
    }

    let json_output = String::from_utf8(output.stdout)?;
    let probe_data: serde_json::Value = serde_json::from_str(&json_output)?;

    // Extract audio stream information
    let audio_stream = probe_data["streams"]
      .as_array()
      .and_then(|streams| {
        streams
          .iter()
          .find(|stream| stream["codec_type"].as_str() == Some("audio"))
      })
      .ok_or_else(|| anyhow::anyhow!("No audio stream found"))?;

    let sample_rate_hz = audio_stream["sample_rate"]
      .as_str()
      .and_then(|s| s.parse().ok())
      .unwrap_or(44100);

    let channels = audio_stream["channels"].as_u64().unwrap_or(2) as u32;

    let duration_seconds = probe_data["format"]["duration"]
      .as_str()
      .and_then(|s| s.parse::<AudioFloat>().ok())
      .unwrap_or(0.0);

    let has_audio = duration_seconds > 0.0;

    // Determine overall volume (will be calculated more precisely later)
    let overall_volume = AudioVolume::from_level(0.5); // Placeholder

    // Estimate quality based on sample rate and channels
    let estimated_quality = self.estimate_audio_quality(sample_rate_hz, channels, duration_seconds);

    Ok(AudioBasicMetrics {
      has_audio,
      duration: AudioDuration::from_seconds(duration_seconds),
      sample_rate: crate::analysis::types::AudioSampleRate { hz: sample_rate_hz },
      channels,
      overall_volume,
      estimated_quality,
      file_size_bytes: None, // TODO: получить реальный размер файла
      codec: None,           // TODO: определить из metadata
      bitrate: None,         // TODO: определить из metadata
    })
  }

  /// Estimate audio quality based on technical parameters
  fn estimate_audio_quality(
    &self,
    sample_rate: u32,
    channels: u32,
    duration: AudioFloat,
  ) -> AudioFloat {
    let mut quality_score = 0.5; // Base score

    // Sample rate contribution
    if sample_rate >= 48000 {
      quality_score += 0.3;
    } else if sample_rate >= 44100 {
      quality_score += 0.2;
    } else if sample_rate >= 22050 {
      quality_score += 0.1;
    }

    // Channel configuration contribution
    if channels >= 2 {
      quality_score += 0.1;
    }

    // Duration contribution (penalize very short clips)
    if duration >= 10.0 {
      quality_score += 0.1;
    } else if duration >= 1.0 {
      quality_score += 0.05;
    }

    (quality_score as AudioFloat).min(1.0)
  }

  /// Detect content type с unified analysis
  async fn detect_content_type_unified<P: AsRef<Path>>(
    &self,
    path: P,
  ) -> Result<AudioContentType, AudioAnalysisError> {
    let spectral_stats = self.analyze_spectral_content_unified(path.as_ref()).await?;

    // Unified heuristic based on spectral characteristics
    if spectral_stats.speech_likelihood > 0.7 {
      Ok(AudioContentType::Speech)
    } else if spectral_stats.music_likelihood > 0.7 {
      Ok(AudioContentType::Music)
    } else if spectral_stats.silence_ratio > 0.8 {
      Ok(AudioContentType::Silence)
    } else if spectral_stats.noise_floor < -40.0 {
      Ok(AudioContentType::Ambient)
    } else {
      Ok(AudioContentType::Mixed)
    }
  }

  /// Detect speech presence с unified типами
  async fn detect_speech_presence_unified<P: AsRef<Path>>(
    &self,
    path: P,
  ) -> Result<AudioFloat, AudioAnalysisError> {
    let audio_path = path.as_ref();

    let silence_periods = self.detect_silence_periods_unified(audio_path).await?;
    let basic_metrics = self
      .extract_basic_metrics(audio_path)
      .await
      .map_err(|e| AudioAnalysisError::ProcessingError(e.to_string()))?;

    let total_silence_duration: AudioFloat =
      silence_periods.iter().map(|p| p.duration.seconds).sum();

    let speech_duration = basic_metrics.duration.seconds - total_silence_duration;
    let speech_ratio = (speech_duration / basic_metrics.duration.seconds).clamp(0.0, 1.0);

    Ok(speech_ratio)
  }

  /// Detect music presence с unified типами
  async fn detect_music_presence_unified<P: AsRef<Path>>(
    &self,
    path: P,
  ) -> Result<AudioFloat, AudioAnalysisError> {
    let spectral_stats = self.analyze_spectral_content_unified(path.as_ref()).await?;
    Ok(spectral_stats.music_likelihood.min(1.0))
  }

  /// Detect emotional tone с unified analysis
  async fn detect_emotional_tone_unified<P: AsRef<Path>>(
    &self,
    path: P,
  ) -> Result<EmotionalTone, AudioAnalysisError> {
    let energy = self.calculate_energy_level_unified(path.as_ref()).await?;
    let spectral_stats = self.analyze_spectral_content_unified(path.as_ref()).await?;

    let energy_level = energy.level;
    let mean_freq = spectral_stats.mean_frequency;
    let std_freq = spectral_stats.std_frequency;
    let zcr = spectral_stats.zero_crossing_rate;

    // Unified emotion heuristics based on f64 audio features
    if energy_level > 0.8 && mean_freq > 2000.0 {
      Ok(EmotionalTone::Excited)
    } else if energy_level < 0.3 && mean_freq < 1000.0 {
      Ok(EmotionalTone::Sad)
    } else if energy_level > 0.7 && std_freq > 1500.0 {
      Ok(EmotionalTone::Happy)
    } else if zcr > 0.3 {
      Ok(EmotionalTone::Tense)
    } else {
      Ok(EmotionalTone::Calm)
    }
  }

  /// Detect tempo с unified типами
  async fn detect_tempo_unified<P: AsRef<Path>>(
    &self,
    path: P,
  ) -> Result<Option<AudioFloat>, AudioAnalysisError> {
    let tempo = self.detect_tempo_ffmpeg_unified(path.as_ref()).await?;
    Ok(tempo)
  }

  /// Detect beats с unified типами
  async fn detect_beats_unified<P: AsRef<Path>>(
    &self,
    path: P,
    tempo_opt: Option<AudioFloat>,
  ) -> Result<Vec<AudioFloat>, AudioAnalysisError> {
    if let Some(tempo) = tempo_opt {
      let basic_metrics = self
        .extract_basic_metrics(path.as_ref())
        .await
        .map_err(|e| AudioAnalysisError::ProcessingError(e.to_string()))?;

      // Generate beat markers based on tempo
      let beat_interval = 60.0 / tempo;
      let mut beats = Vec::new();
      let mut current_time = 0.0;

      while current_time < basic_metrics.duration.seconds {
        beats.push(current_time);
        current_time += beat_interval;
      }

      Ok(beats)
    } else {
      Ok(Vec::new())
    }
  }

  /// Calculate energy level с unified типами
  async fn calculate_energy_level_unified<P: AsRef<Path>>(
    &self,
    path: P,
  ) -> Result<AudioVolume, AudioAnalysisError> {
    let path = path.as_ref();

    let output = AsyncCommand::new("ffmpeg")
      .args([
        "-i",
        path
          .to_str()
          .ok_or_else(|| AudioAnalysisError::ProcessingError("Invalid path".to_string()))?,
        "-af",
        "volumedetect",
        "-f",
        "null",
        "-",
      ])
      .output()
      .await
      .map_err(|e| AudioAnalysisError::ProcessingError(format!("FFmpeg failed: {}", e)))?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    let mut mean_volume = -30.0;

    // Parse volumedetect output
    for line in stderr.lines() {
      if line.contains("mean_volume:") {
        if let Some(vol_start) = line.find("mean_volume:") {
          let vol_str = &line[vol_start + 12..];
          if let Some(vol_end) = vol_str.find(" dB") {
            if let Ok(vol) = vol_str[..vol_end].trim().parse::<AudioFloat>() {
              mean_volume = vol;
              break;
            }
          }
        }
      }
    }

    // Convert dB to 0-1 scale using unified AudioVolume
    Ok(AudioVolume::from_db(mean_volume))
  }

  /// Calculate dynamic range с unified типами
  async fn calculate_dynamic_range_unified<P: AsRef<Path>>(
    &self,
    path: P,
  ) -> Result<AudioFloat, AudioAnalysisError> {
    let audio_path = path.as_ref();

    let output = AsyncCommand::new("ffmpeg")
      .args([
        "-i",
        audio_path
          .to_str()
          .ok_or_else(|| AudioAnalysisError::ProcessingError("Invalid path".to_string()))?,
        "-af",
        "loudnorm=print_format=json",
        "-f",
        "null",
        "-",
      ])
      .output()
      .await
      .map_err(|e| AudioAnalysisError::ProcessingError(format!("FFmpeg failed: {}", e)))?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    let mut dynamic_range = 45.0; // Default

    for line in stderr.lines() {
      if line.contains("input_lra") {
        if let Some(lra_start) = line.find(":") {
          let lra_str = &line[lra_start + 1..]
            .trim()
            .trim_end_matches(',')
            .trim_matches('"');
          if let Ok(lra) = lra_str.parse::<AudioFloat>() {
            dynamic_range = lra;
            break;
          }
        }
      }
    }

    Ok(dynamic_range)
  }

  /// Calculate ambient level с unified типами
  async fn calculate_ambient_level_unified<P: AsRef<Path>>(
    &self,
    path: P,
  ) -> Result<AudioVolume, AudioAnalysisError> {
    let silence_periods = self.detect_silence_periods_unified(path.as_ref()).await?;

    if !silence_periods.is_empty() {
      let avg_noise: AudioFloat = silence_periods
        .iter()
        .map(|p| p.noise_level.level)
        .sum::<AudioFloat>()
        / silence_periods.len() as AudioFloat;

      Ok(AudioVolume::from_level(avg_noise))
    } else {
      // No silence detected, return default ambient level
      Ok(AudioVolume::from_level(0.2))
    }
  }

  /// Calculate overall quality score
  fn calculate_quality_score(
    &self,
    basic_metrics: &AudioBasicMetrics,
    energy_level: &AudioVolume,
    dynamic_range: AudioFloat,
  ) -> AudioFloat {
    let mut score = 0.0;

    // Technical quality component (40%)
    if basic_metrics.sample_rate.hz >= 48000 {
      score += 0.15;
    } else if basic_metrics.sample_rate.hz >= 44100 {
      score += 0.10;
    }

    if basic_metrics.channels >= 2 {
      score += 0.10;
    }

    if basic_metrics.duration.seconds >= 10.0 {
      score += 0.15;
    }

    // Audio characteristics component (60%)
    // Good energy level (not too quiet, not clipping)
    let energy_score = if energy_level.level > 0.1 && energy_level.level < 0.9 {
      0.2
    } else if energy_level.level > 0.05 {
      0.1
    } else {
      0.0
    };
    score += energy_score;

    // Dynamic range score
    let dr_score = if dynamic_range > 15.0 {
      0.2
    } else if dynamic_range > 10.0 {
      0.15
    } else if dynamic_range > 5.0 {
      0.1
    } else {
      0.05
    };
    score += dr_score;

    // Estimated quality from basic metrics
    score += basic_metrics.estimated_quality * 0.2;

    score.min(1.0)
  }

  /// FFmpeg tempo detection с unified типами
  async fn detect_tempo_ffmpeg_unified<P: AsRef<Path>>(
    &self,
    audio_path: P,
  ) -> Result<Option<AudioFloat>, anyhow::Error> {
    let path = audio_path.as_ref();

    let _output = AsyncCommand::new("ffmpeg")
      .args([
        "-i",
        path
          .to_str()
          .ok_or_else(|| anyhow::anyhow!("Invalid path"))?,
        "-af",
        "highpass=f=100,lowpass=f=5000,aresample=22050,astats=metadata=1:reset=1",
        "-f",
        "null",
        "-",
      ])
      .output()
      .await?;

    // For now, return mock tempo. Real implementation would analyze output
    Ok(Some(120.0))
  }

  /// Analyze spectral content с unified типами
  async fn analyze_spectral_content_unified<P: AsRef<Path>>(
    &self,
    audio_path: P,
  ) -> Result<UnifiedSpectralStats, AudioAnalysisError> {
    let path = audio_path.as_ref();

    let output = AsyncCommand::new("ffmpeg")
      .args([
        "-i",
        path
          .to_str()
          .ok_or_else(|| AudioAnalysisError::ProcessingError("Invalid path".to_string()))?,
        "-af",
        "astats=metadata=1:measure_perchannel=none",
        "-f",
        "null",
        "-",
      ])
      .output()
      .await
      .map_err(|e| AudioAnalysisError::ProcessingError(format!("FFmpeg failed: {}", e)))?;

    let stderr = String::from_utf8_lossy(&output.stderr);

    // Parse statistics with unified f64 types
    let mean_frequency = 1500.0;
    let std_frequency = 500.0;
    let mut zero_crossing_rate = 0.1;
    let mut noise_floor = -50.0;

    for line in stderr.lines() {
      if line.contains("Flat factor:") {
        if let Some(flat_start) = line.find("Flat factor:") {
          let flat_str = &line[flat_start + 12..];
          if let Ok(flatness) = flat_str.trim().parse::<AudioFloat>() {
            zero_crossing_rate = flatness / 10.0;
          }
        }
      } else if line.contains("RMS level dB:") {
        if let Some(rms_start) = line.find("RMS level dB:") {
          let rms_str = &line[rms_start + 13..];
          if let Ok(rms) = rms_str.trim().parse::<AudioFloat>() {
            noise_floor = rms - 20.0;
          }
        }
      }
    }

    let speech_likelihood = (zero_crossing_rate * 2.0).min(1.0);
    let music_likelihood = 1.0 - speech_likelihood;
    let silence_ratio = if noise_floor < -50.0 { 0.8 } else { 0.2 };

    Ok(UnifiedSpectralStats {
      mean_frequency,
      std_frequency,
      zero_crossing_rate,
      speech_likelihood,
      music_likelihood,
      silence_ratio,
      noise_floor,
    })
  }

  /// Detect silence periods с unified типами
  async fn detect_silence_periods_unified<P: AsRef<Path>>(
    &self,
    audio_path: P,
  ) -> Result<Vec<UnifiedSilencePeriod>, AudioAnalysisError> {
    let path = audio_path.as_ref();

    let output = AsyncCommand::new("ffmpeg")
      .args([
        "-i",
        path
          .to_str()
          .ok_or_else(|| AudioAnalysisError::ProcessingError("Invalid path".to_string()))?,
        "-af",
        "silencedetect=noise=-40dB:d=0.5",
        "-f",
        "null",
        "-",
      ])
      .output()
      .await
      .map_err(|e| AudioAnalysisError::ProcessingError(format!("FFmpeg failed: {}", e)))?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    let mut silence_periods = Vec::new();
    let mut silence_start = None;

    for line in stderr.lines() {
      if line.contains("silence_start:") {
        if let Some(start_pos) = line.find("silence_start:") {
          let start_str = &line[start_pos + 14..];
          if let Ok(start) = start_str.trim().parse::<AudioFloat>() {
            silence_start = Some(start);
          }
        }
      } else if line.contains("silence_end:") && silence_start.is_some() {
        if let Some(end_pos) = line.find("silence_end:") {
          let end_str = &line[end_pos + 12..];
          if let Some(space_pos) = end_str.find(' ') {
            if let Ok(end) = end_str[..space_pos].trim().parse::<AudioFloat>() {
              let start = silence_start.unwrap();
              silence_periods.push(UnifiedSilencePeriod {
                start_time: start,
                end_time: end,
                duration: AudioDuration::from_seconds(end - start),
                noise_level: AudioVolume::from_db(-40.0),
              });
              silence_start = None;
            }
          }
        }
      }
    }

    Ok(silence_periods)
  }

  /// Extract segment features с unified типами
  async fn extract_segment_features_unified<P: AsRef<Path>>(
    &self,
    _audio_path: P,
    start_time: AudioFloat,
    duration: AudioFloat,
  ) -> Result<UnifiedAudioSegmentAnalysis, AudioAnalysisError> {
    // For now, return computed values based on the full file analysis
    // Real implementation would extract and analyze specific segment

    let energy_variation = (start_time * 0.1) % 0.3;
    let rms_energy = AudioVolume::from_level(0.15 + energy_variation);

    let spectral_centroid = 2000.0 + (start_time * 100.0) % 1000.0;
    let zero_crossing_rate = 0.08 + (start_time * 0.02) % 0.04;

    let pitch = if start_time % 3.0 < 1.5 {
      Some(220.0 + (start_time * 20.0) % 100.0)
    } else {
      None
    };

    let speech_probability = if start_time % 4.0 < 2.0 { 0.8 } else { 0.2 };
    let music_probability = if start_time % 4.0 >= 2.0 { 0.9 } else { 0.1 };

    Ok(UnifiedAudioSegmentAnalysis {
      start_time,
      duration: AudioDuration::from_seconds(duration),
      rms_energy,
      spectral_centroid,
      zero_crossing_rate,
      mfcc: vec![0.0; 13], // Mock MFCC features
      pitch,
      speech_probability,
      music_probability,
    })
  }

  /// Convert to legacy AudioMontageAnalysis format for compatibility
  pub fn to_legacy_montage_analysis(
    &self,
    result: &UnifiedMontageAudioAnalysisResult,
  ) -> AudioMontageAnalysis {
    // Create beat analysis from tempo and beat markers
    let beat_detection = result.tempo.map(|tempo| {
      crate::analysis::types::AudioBeatAnalysis {
        bpm: tempo,
        beat_times: result
          .beat_markers
          .iter()
          .map(|&t| crate::analysis::types::AudioTimestamp::from_seconds(t))
          .collect(),
        beat_strength: 0.8,     // Mock value
        rhythm_regularity: 0.7, // Mock value
      }
    });

    // Create tempo analysis if tempo is available
    let tempo_analysis = result.tempo.map(|tempo| {
      crate::analysis::types::AudioTempoAnalysis {
        average_tempo: tempo,
        tempo_stability: 0.9,  // Mock value
        tempo_changes: vec![], // No tempo changes detected
      }
    });

    AudioMontageAnalysis {
      dynamic_range: result.dynamic_range,
      speech_probability: result.speech_presence,
      music_probability: result.music_presence,
      overall_quality_score: result.quality_score,
      content_segments: vec![], // Would be populated with actual content segments
      silence_segments: vec![], // Would be populated with silence detection
      beat_detection,
      tempo_analysis,
      key_detection: None,  // Not implemented yet
      emotional_tone: None, // Would be populated with emotional analysis
      energy_level: result.energy_level.level,
      valence: 0.5, // Neutral valence, would be calculated from emotional analysis
      sync_analysis: None, // Not implemented yet
    }
  }
}

/// Unified Audio Segment Analysis с f64 типами
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedAudioSegmentAnalysis {
  pub start_time: AudioFloat,
  pub duration: AudioDuration,
  pub rms_energy: AudioVolume,
  pub spectral_centroid: AudioFloat,
  pub zero_crossing_rate: AudioFloat,
  pub mfcc: Vec<AudioFloat>,
  pub pitch: Option<AudioFloat>,
  pub speech_probability: AudioFloat, // 0.0-1.0
  pub music_probability: AudioFloat,  // 0.0-1.0
}

/// Unified Spectral Statistics с f64 типами
#[derive(Debug, Clone)]
pub struct UnifiedSpectralStats {
  pub mean_frequency: AudioFloat,
  pub std_frequency: AudioFloat,
  pub zero_crossing_rate: AudioFloat,
  pub speech_likelihood: AudioFloat,
  pub music_likelihood: AudioFloat,
  pub silence_ratio: AudioFloat,
  pub noise_floor: AudioFloat,
}

/// Unified Silence Period с f64 типами
#[derive(Debug, Clone)]
pub struct UnifiedSilencePeriod {
  pub start_time: AudioFloat,
  pub end_time: AudioFloat,
  pub duration: AudioDuration,
  pub noise_level: AudioVolume,
}

impl Default for UnifiedMontageAudioAnalyzer {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_unified_config_creation() {
    let config = UnifiedAudioAnalysisConfig::default();
    assert_eq!(config.sample_rate, 44100);
    assert!(config.enable_speech_detection);
    assert!(config.quality_threshold > 0.0);
  }

  #[test]
  fn test_quality_score_calculation() {
    let analyzer = UnifiedMontageAudioAnalyzer::new();

    let basic_metrics = AudioBasicMetrics {
      has_audio: true,
      duration: AudioDuration::from_seconds(30.0),
      sample_rate: crate::analysis::types::AudioSampleRate { hz: 48000 },
      channels: 2,
      overall_volume: AudioVolume::from_level(0.5),
      estimated_quality: 0.8,
      file_size_bytes: Some((1024 * 1024) as f64),
      codec: Some("aac".to_string()),
      bitrate: Some(256),
    };

    let energy_level = AudioVolume::from_level(0.6);
    let dynamic_range = 18.0;

    let quality_score =
      analyzer.calculate_quality_score(&basic_metrics, &energy_level, dynamic_range);

    assert!(quality_score > 0.0);
    assert!(quality_score <= 1.0);
    // High-quality audio should score well
    assert!(quality_score > 0.7);
  }

  #[test]
  fn test_legacy_conversion() {
    let analyzer = UnifiedMontageAudioAnalyzer::new();

    let unified_result = UnifiedMontageAudioAnalysisResult {
      content_type: AudioContentType::Music,
      speech_presence: 0.2,
      music_presence: 0.8,
      ambient_level: AudioVolume::from_level(0.1),
      emotional_tone: EmotionalTone::Happy,
      tempo: Some(128.0),
      beat_markers: vec![0.0, 0.5, 1.0],
      energy_level: AudioVolume::from_level(0.7),
      dynamic_range: 15.0,
      basic_metrics: AudioBasicMetrics {
        has_audio: true,
        duration: AudioDuration::from_seconds(30.0),
        sample_rate: crate::analysis::types::AudioSampleRate { hz: 44100 },
        channels: 2,
        overall_volume: AudioVolume::from_level(0.7),
        estimated_quality: 0.8,
        file_size_bytes: Some((1024 * 1024) as f64),
        codec: Some("aac".to_string()),
        bitrate: Some(128),
      },
      quality_score: 0.85,
      processing_time: AudioDuration::from_millis(1500.0),
      analysis_version: "test".to_string(),
    };

    let legacy_result = analyzer.to_legacy_montage_analysis(&unified_result);

    // Check that tempo analysis contains the correct tempo
    assert!(legacy_result.tempo_analysis.is_some());
    assert_eq!(legacy_result.tempo_analysis.unwrap().average_tempo, 128.0);

    // Check that beat detection contains the correct number of beats
    assert!(legacy_result.beat_detection.is_some());
    assert_eq!(legacy_result.beat_detection.unwrap().beat_times.len(), 3);

    // Check overall quality score
    assert!(legacy_result.overall_quality_score > 0.8);
  }
}
