//! Audio correlation module for multicam synchronization
//!
//! Provides cross-correlation analysis between two audio files to find
//! the time offset for synchronization.

use std::path::Path;
use symphonia::core::audio::{AudioBuffer, Signal};
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use tauri::command;

/// Result of audio correlation analysis
#[derive(serde::Serialize, Debug)]
pub struct AudioCorrelationResult {
  /// Time offset in seconds (positive = target is ahead of base)
  pub offset_seconds: f64,
  /// Confidence score (0.0 to 1.0)
  pub confidence: f64,
  /// Peak correlation value
  pub correlation_peak: f64,
}

/// Correlates two audio files and returns the time offset
#[command]
pub async fn correlate_audio_files(
  base_path: String,
  target_path: String,
  max_offset_seconds: f64,
) -> Result<AudioCorrelationResult, String> {
  // Extract audio samples from both files
  let base_samples = extract_audio_samples(&base_path, 30.0).await?;
  let target_samples = extract_audio_samples(&target_path, 30.0).await?;

  if base_samples.samples.is_empty() || target_samples.samples.is_empty() {
    return Err("No audio samples extracted from files".to_string());
  }

  // Use the same sample rate for both (resample if different)
  let sample_rate = base_samples.sample_rate;

  // Calculate max offset in samples
  let max_offset_samples = (max_offset_seconds * sample_rate as f64) as i64;

  // Perform cross-correlation
  let (best_offset, peak_correlation) = cross_correlate(
    &base_samples.samples,
    &target_samples.samples,
    max_offset_samples,
  );

  // Convert offset from samples to seconds
  let offset_seconds = best_offset as f64 / sample_rate as f64;

  // Calculate confidence based on correlation peak
  // Normalize correlation peak to 0-1 range
  let confidence = (peak_correlation.abs()).min(1.0);

  Ok(AudioCorrelationResult {
    offset_seconds,
    confidence,
    correlation_peak: peak_correlation,
  })
}

/// Extracted audio data
struct AudioData {
  samples: Vec<f32>,
  sample_rate: u32,
}

/// Extracts mono audio samples from a media file
async fn extract_audio_samples(path: &str, max_duration: f64) -> Result<AudioData, String> {
  let path = Path::new(path);

  if !path.exists() {
    return Err(format!("File not found: {}", path.display()));
  }

  // Open file
  let file = std::fs::File::open(path).map_err(|e| format!("Failed to open file: {}", e))?;

  let mss = MediaSourceStream::new(Box::new(file), Default::default());

  // Create hint for format detection
  let mut hint = Hint::new();
  if let Some(ext) = path.extension() {
    hint.with_extension(ext.to_str().unwrap_or(""));
  }

  // Probe format
  let meta_opts: MetadataOptions = Default::default();
  let fmt_opts: FormatOptions = Default::default();

  let probed = symphonia::default::get_probe()
    .format(&hint, mss, &fmt_opts, &meta_opts)
    .map_err(|e| format!("Failed to probe audio format: {}", e))?;

  let mut format = probed.format;

  // Find first audio track
  let track = format
    .tracks()
    .iter()
    .find(|t| t.codec_params.codec != symphonia::core::codecs::CODEC_TYPE_NULL)
    .ok_or("No audio track found")?;

  let track_id = track.id;
  let sample_rate = track
    .codec_params
    .sample_rate
    .ok_or("Failed to get sample rate")?;

  // Create decoder
  let dec_opts: DecoderOptions = Default::default();
  let mut decoder = symphonia::default::get_codecs()
    .make(&track.codec_params, &dec_opts)
    .map_err(|e| format!("Failed to create decoder: {}", e))?;

  let mut samples = Vec::new();
  let max_samples = (max_duration * sample_rate as f64) as usize;

  // Read and decode packets
  loop {
    if samples.len() >= max_samples {
      break;
    }

    let packet = match format.next_packet() {
      Ok(packet) => packet,
      Err(symphonia::core::errors::Error::IoError(_)) => break,
      Err(err) => return Err(format!("Error reading packet: {}", err)),
    };

    if packet.track_id() != track_id {
      continue;
    }

    // Decode packet
    match decoder.decode(&packet) {
      Ok(decoded) => {
        // Process audio buffer
        match decoded {
          symphonia::core::audio::AudioBufferRef::F32(buf) => {
            append_mono_samples(&buf, &mut samples, max_samples);
          }
          symphonia::core::audio::AudioBufferRef::S16(buf) => {
            // Convert S16 to F32
            let mut f32_buf = AudioBuffer::<f32>::new(buf.capacity() as u64, *buf.spec());
            buf.convert(&mut f32_buf);
            append_mono_samples(&f32_buf, &mut samples, max_samples);
          }
          symphonia::core::audio::AudioBufferRef::S32(buf) => {
            // Convert S32 to F32
            let mut f32_buf = AudioBuffer::<f32>::new(buf.capacity() as u64, *buf.spec());
            buf.convert(&mut f32_buf);
            append_mono_samples(&f32_buf, &mut samples, max_samples);
          }
          _ => continue,
        }
      }
      Err(symphonia::core::errors::Error::DecodeError(_)) => continue,
      Err(err) => return Err(format!("Decode error: {}", err)),
    }
  }

  Ok(AudioData {
    samples,
    sample_rate,
  })
}

/// Appends mono samples from an audio buffer
fn append_mono_samples<S>(buffer: &AudioBuffer<S>, samples: &mut Vec<f32>, max_samples: usize)
where
  S: symphonia::core::sample::Sample,
  f32: symphonia::core::conv::FromSample<S>,
{
  let channels = buffer.spec().channels.count();

  for frame in 0..buffer.frames() {
    if samples.len() >= max_samples {
      break;
    }

    // Average channels to get mono
    let mut sum = 0.0f32;
    for ch in 0..channels {
      let sample = buffer.chan(ch)[frame];
      sum += <f32 as symphonia::core::conv::FromSample<S>>::from_sample(sample);
    }
    samples.push(sum / channels as f32);
  }
}

/// Performs cross-correlation between two signals
/// Returns (best_offset_in_samples, peak_correlation)
fn cross_correlate(signal1: &[f32], signal2: &[f32], max_offset: i64) -> (i64, f64) {
  let mut best_offset: i64 = 0;
  let mut best_correlation: f64 = f64::NEG_INFINITY;

  // Normalize signals for better correlation
  let sig1_normalized = normalize_signal(signal1);
  let sig2_normalized = normalize_signal(signal2);

  // Calculate correlation for each offset
  for offset in -max_offset..=max_offset {
    let correlation = calculate_correlation(&sig1_normalized, &sig2_normalized, offset);

    if correlation > best_correlation {
      best_correlation = correlation;
      best_offset = offset;
    }
  }

  (best_offset, best_correlation)
}

/// Normalizes a signal to zero mean and unit variance
fn normalize_signal(signal: &[f32]) -> Vec<f32> {
  if signal.is_empty() {
    return Vec::new();
  }

  let mean: f32 = signal.iter().sum::<f32>() / signal.len() as f32;
  let variance: f32 = signal.iter().map(|x| (x - mean).powi(2)).sum::<f32>() / signal.len() as f32;
  let std_dev = variance.sqrt().max(1e-10);

  signal.iter().map(|x| (x - mean) / std_dev).collect()
}

/// Calculates normalized cross-correlation at a specific offset
fn calculate_correlation(sig1: &[f32], sig2: &[f32], offset: i64) -> f64 {
  let len1 = sig1.len() as i64;
  let len2 = sig2.len() as i64;

  let mut sum: f64 = 0.0;
  let mut count: i64 = 0;

  for i in 0..len1 {
    let j = i + offset;
    if j >= 0 && j < len2 {
      sum += sig1[i as usize] as f64 * sig2[j as usize] as f64;
      count += 1;
    }
  }

  if count > 0 {
    sum / count as f64
  } else {
    0.0
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_normalize_signal() {
    let signal = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    let normalized = normalize_signal(&signal);

    // Mean should be approximately 0
    let mean: f32 = normalized.iter().sum::<f32>() / normalized.len() as f32;
    assert!(mean.abs() < 0.001);

    // Variance should be approximately 1
    let variance: f32 = normalized.iter().map(|x| x.powi(2)).sum::<f32>() / normalized.len() as f32;
    assert!((variance - 1.0).abs() < 0.1);
  }

  #[test]
  fn test_cross_correlate_identical() {
    let signal = vec![0.0, 0.5, 1.0, 0.5, 0.0, -0.5, -1.0, -0.5];
    let (offset, correlation) = cross_correlate(&signal, &signal, 10);

    // Identical signals should have offset 0 and high correlation
    assert_eq!(offset, 0);
    assert!(correlation > 0.9);
  }

  #[test]
  fn test_cross_correlate_shifted() {
    let signal1: Vec<f32> = (0..100).map(|i| (i as f32 * 0.1).sin()).collect();
    let signal2: Vec<f32> = (5..105).map(|i| (i as f32 * 0.1).sin()).collect();

    let (offset, _) = cross_correlate(&signal1, &signal2, 20);

    // Signal2 starts at index 5, so signal1[5] = signal2[0]
    // To align: sig1[i] with sig2[i + offset], we need offset = -5
    assert!((offset + 5).abs() <= 2);
  }

  #[test]
  fn test_empty_signals() {
    let normalized = normalize_signal(&[]);
    assert!(normalized.is_empty());
  }
}
