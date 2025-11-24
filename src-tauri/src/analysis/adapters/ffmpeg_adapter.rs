//! FFmpeg Audio Analysis Adapter
//!
//! Адаптер для FFmpeg audio analysis - passthrough, так как FFmpeg уже использует unified типы

use crate::analysis::types::{AudioAnalysisError, AudioFFmpegAnalysis};

/// FFmpeg Audio Adapter (passthrough)
///
/// FFmpeg уже использует unified типы напрямую через UnifiedFFmpegAudioAnalyzer,
/// поэтому этот adapter просто делает passthrough для consistent API
pub struct FFmpegAudioAdapter;

impl FFmpegAudioAdapter {
    /// Create new FFmpeg adapter
    pub fn new() -> Self {
        Self
    }

    /// Passthrough FFmpeg result (already in unified format)
    pub fn convert(&self, result: AudioFFmpegAnalysis) -> Result<AudioFFmpegAnalysis, AudioAnalysisError> {
        // FFmpeg уже возвращает AudioFFmpegAnalysis в unified format
        // через UnifiedFFmpegAudioAnalyzer, поэтому просто passthrough
        Ok(result)
    }
}

impl Default for FFmpegAudioAdapter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::analysis::types::{
        UnifiedVolumeAnalysis, UnifiedFrequencyAnalysis, UnifiedDynamicsAnalysis,
        UnifiedQualityAnalysis, AudioVolume,
    };

    #[test]
    fn test_ffmpeg_adapter_passthrough() {
        let adapter = FFmpegAudioAdapter::new();

        // Create test FFmpeg result
        let ffmpeg_result = AudioFFmpegAnalysis {
            volume_analysis: UnifiedVolumeAnalysis {
                peak_volume: AudioVolume { level: 0.8 },
                average_volume: AudioVolume { level: 0.5 },
                rms_volume: AudioVolume { level: 0.6 },
                dynamic_range: 20.0,
                loudness_lufs: Some(-18.0),
                volume_histogram: vec![],
            },
            frequency_analysis: UnifiedFrequencyAnalysis {
                dominant_frequencies: vec![
                    crate::analysis::types::AudioFrequency { hz: 440.0 },
                    crate::analysis::types::AudioFrequency { hz: 880.0 },
                ],
                frequency_distribution: crate::analysis::types::FrequencyDistribution {
                    bass_energy: 0.3,
                    mid_energy: 0.5,
                    treble_energy: 0.2,
                    total_energy: 1.0,
                },
                spectral_centroid: crate::analysis::types::AudioFrequency { hz: 2000.0 },
                spectral_rolloff: crate::analysis::types::AudioFrequency { hz: 5000.0 },
                zero_crossing_rate: 0.15,
            },
            dynamics_analysis: UnifiedDynamicsAnalysis {
                crest_factor: 3.0,
                dynamic_range: 20.0,
                compression_ratio: 2.5,
                attack_time: crate::analysis::types::AudioDuration { seconds: 0.01 },
                release_time: crate::analysis::types::AudioDuration { seconds: 0.1 },
            },
            quality_metrics: UnifiedQualityAnalysis {
                overall_score: 0.85,
                noise_level: 0.02,
                clipping_detected: false,
                distortion_level: 0.01,
                signal_to_noise_ratio: 60.0,
                issues: vec![],
            },
        };

        // Passthrough должен вернуть тот же результат
        let result = adapter.convert(ffmpeg_result.clone());
        assert!(result.is_ok());

        let converted = result.unwrap();
        assert_eq!(converted.volume_analysis.peak_volume.level, 0.8);
        assert_eq!(converted.quality_metrics.overall_score, 0.85);
    }
}
