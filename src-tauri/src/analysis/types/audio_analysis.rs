//! Unified audio analysis result types
//! 
//! Заменяет все существующие audio analysis результаты единой структурой
//! совместимой с FFmpeg, Montage Planner и Whisper компонентами

use serde::{Deserialize, Serialize};
use super::audio_core::*;
use std::collections::HashMap;

/// Unified Audio Analysis Result - главная структура результатов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedAudioAnalysisResult {
    /// Базовые метрики (всегда доступно)
    pub basic_metrics: AudioBasicMetrics,
    
    /// Расширенный FFmpeg анализ (optional)
    pub ffmpeg_analysis: Option<AudioFFmpegAnalysis>,
    
    /// Montage planning анализ (optional)
    pub montage_analysis: Option<AudioMontageAnalysis>,
    
    /// Whisper transcription анализ (optional)
    pub transcription_analysis: Option<AudioTranscriptionAnalysis>,
    
    /// Метаданные анализа
    pub analysis_metadata: AudioAnalysisMetadata,
}

impl UnifiedAudioAnalysisResult {
    /// Создать минимальный результат только с basic metrics
    pub fn basic_only(
        basic_metrics: AudioBasicMetrics,
        analysis_metadata: AudioAnalysisMetadata,
    ) -> Self {
        Self {
            basic_metrics,
            ffmpeg_analysis: None,
            montage_analysis: None,
            transcription_analysis: None,
            analysis_metadata,
        }
    }
    
    /// Проверить имеет ли аудио
    pub fn has_audio(&self) -> bool {
        self.basic_metrics.has_audio
    }
    
    /// Получить общую оценку качества
    pub fn overall_quality_score(&self) -> AudioFloat {
        let mut score = self.basic_metrics.estimated_quality;
        
        // Добавляем вес от FFmpeg анализа
        if let Some(ref ffmpeg) = self.ffmpeg_analysis {
            score = (score + ffmpeg.quality_metrics.overall_score) / 2.0;
        }
        
        // Добавляем вес от Montage анализа
        if let Some(ref montage) = self.montage_analysis {
            score = (score + montage.overall_quality_score) / 2.0;
        }
        
        score.clamp(0.0, 1.0)
    }
    
    /// Получить список доступных insights
    pub fn available_insights(&self) -> Vec<String> {
        let mut insights = vec!["basic_metrics".to_string()];
        
        if self.ffmpeg_analysis.is_some() {
            insights.push("ffmpeg_analysis".to_string());
        }
        if self.montage_analysis.is_some() {
            insights.push("montage_analysis".to_string());
        }
        if self.transcription_analysis.is_some() {
            insights.push("transcription_analysis".to_string());
        }
        
        insights
    }
}

/// Базовые audio метрики (всегда доступно)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioBasicMetrics {
    pub duration: AudioDuration,
    pub has_audio: bool,
    pub sample_rate: AudioSampleRate,
    pub channels: u32,
    pub overall_volume: AudioVolume,
    pub estimated_quality: AudioFloat, // 0.0 - 1.0
    pub file_size_bytes: Option<u64>,
    pub codec: Option<String>,
    pub bitrate: Option<u32>,
}

impl AudioBasicMetrics {
    /// Создать базовые метрики для файла без аудио
    pub fn no_audio(duration: AudioDuration) -> Self {
        Self {
            duration,
            has_audio: false,
            sample_rate: AudioSampleRate::from_hz(0),
            channels: 0,
            overall_volume: AudioVolume::min(),
            estimated_quality: 0.0,
            file_size_bytes: None,
            codec: None,
            bitrate: None,
        }
    }
    
    /// Оценить качество на основе базовых параметров
    pub fn calculate_basic_quality(&self) -> AudioFloat {
        if !self.has_audio {
            return 0.0;
        }
        
        let mut quality = 0.0;
        
        // Sample rate качество
        quality += match self.sample_rate.quality_level() {
            AudioQualityLevel::Low => 0.2,
            AudioQualityLevel::Medium => 0.5,
            AudioQualityLevel::High => 0.8,
            AudioQualityLevel::VeryHigh => 1.0,
        };
        
        // Channels качество
        quality += match self.channels {
            0 => 0.0,
            1 => 0.3, // mono
            2 => 0.6, // stereo
            _ => 0.8, // surround
        };
        
        // Bitrate качество (если доступно)
        if let Some(bitrate) = self.bitrate {
            quality += match bitrate {
                0..=64 => 0.2,
                65..=128 => 0.4,
                129..=256 => 0.6,
                257..=320 => 0.8,
                _ => 1.0,
            };
        } else {
            quality += 0.5; // средняя оценка если bitrate неизвестен
        }
        
        (quality as f64 / 3.0).clamp(0.0, 1.0)
    }
}

/// FFmpeg расширенный анализ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioFFmpegAnalysis {
    pub volume_analysis: UnifiedVolumeAnalysis,
    pub frequency_analysis: UnifiedFrequencyAnalysis,
    pub dynamics_analysis: UnifiedDynamicsAnalysis,
    pub quality_metrics: UnifiedQualityAnalysis,
}

/// Unified Volume Analysis (из FFmpeg)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedVolumeAnalysis {
    pub peak_volume: AudioVolume,
    pub average_volume: AudioVolume,
    pub rms_volume: AudioVolume,
    pub dynamic_range: AudioFloat,
    pub loudness_lufs: Option<AudioFloat>, // LUFS измерение
    pub volume_histogram: Vec<VolumeHistogramBin>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeHistogramBin {
    pub volume_range: (AudioVolume, AudioVolume),
    pub duration: AudioDuration,
    pub percentage: AudioFloat,
}

/// Unified Frequency Analysis (из FFmpeg)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedFrequencyAnalysis {
    pub dominant_frequencies: Vec<AudioFrequency>,
    pub frequency_distribution: FrequencyDistribution,
    pub spectral_centroid: AudioFrequency,
    pub spectral_rolloff: AudioFrequency,
    pub zero_crossing_rate: AudioFloat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrequencyDistribution {
    pub bass_energy: AudioFloat,    // 20Hz - 250Hz
    pub mid_energy: AudioFloat,     // 250Hz - 4kHz
    pub treble_energy: AudioFloat,  // 4kHz - 20kHz
    pub total_energy: AudioFloat,
}

/// Unified Dynamics Analysis (из FFmpeg)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedDynamicsAnalysis {
    pub crest_factor: AudioFloat,
    pub dynamic_range: AudioFloat,
    pub compression_ratio: AudioFloat,
    pub attack_time: AudioDuration,
    pub release_time: AudioDuration,
}

/// Unified Quality Analysis (из FFmpeg)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedQualityAnalysis {
    pub overall_score: AudioFloat, // 0.0 - 1.0
    pub noise_level: AudioFloat,
    pub clipping_detected: bool,
    pub distortion_level: AudioFloat,
    pub signal_to_noise_ratio: AudioFloat,
    pub issues: Vec<AudioQualityIssue>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioQualityIssue {
    pub issue_type: AudioIssueType,
    pub severity: AudioIssueSeverity,
    pub time_range: Option<AudioTimeRange>,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioIssueType {
    Clipping,
    Noise,
    Distortion,
    LowVolume,
    Silence,
    PhaseIssue,
    FrequencyImbalance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioIssueSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Montage планирование анализ (конвертированный из f32)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioMontageAnalysis {
    // Основные метрики (конвертированы f32 -> f64)
    pub dynamic_range: AudioFloat,
    pub speech_probability: AudioFloat,
    pub music_probability: AudioFloat,
    pub overall_quality_score: AudioFloat,
    
    // Детекция контента
    pub content_segments: Vec<AudioContentSegment>,
    pub silence_segments: Vec<AudioSilenceSegment>,
    
    // Музыкальный анализ
    pub beat_detection: Option<AudioBeatAnalysis>,
    pub tempo_analysis: Option<AudioTempoAnalysis>,
    pub key_detection: Option<AudioKeyDetection>,
    
    // Эмоциональный анализ
    pub emotional_tone: Option<AudioEmotionalTone>,
    pub energy_level: AudioFloat,
    pub valence: AudioFloat, // positive/negative emotion
    
    // Технический анализ
    pub sync_analysis: Option<AudioVideoSyncAnalysis>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioContentSegment {
    pub time_range: AudioTimeRange,
    pub content_type: AudioContentType,
    pub confidence: AudioFloat,
    pub characteristics: HashMap<String, AudioFloat>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AudioContentType {
    Speech,
    Music,
    SoundEffect,
    Ambient,
    Silence,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioSilenceSegment {
    pub start_time: AudioTimestamp,
    pub end_time: AudioTimestamp,
    pub silence_level: AudioVolume,
    pub duration: AudioDuration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioBeatAnalysis {
    pub bpm: AudioFloat,
    pub beat_times: Vec<AudioTimestamp>,
    pub beat_strength: AudioFloat,
    pub rhythm_regularity: AudioFloat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioTempoAnalysis {
    pub average_tempo: AudioFloat,
    pub tempo_stability: AudioFloat,
    pub tempo_changes: Vec<AudioTempoChange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioTempoChange {
    pub time: AudioTimestamp,
    pub old_tempo: AudioFloat,
    pub new_tempo: AudioFloat,
    pub transition_duration: AudioDuration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioKeyDetection {
    pub detected_key: String, // e.g., "C major", "A minor"
    pub confidence: AudioFloat,
    pub key_changes: Vec<AudioKeyChange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioKeyChange {
    pub time: AudioTimestamp,
    pub old_key: String,
    pub new_key: String,
    pub confidence: AudioFloat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioEmotionalTone {
    pub primary_emotion: String,
    pub emotion_scores: HashMap<String, AudioFloat>,
    pub emotional_timeline: Vec<AudioEmotionalMoment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioEmotionalMoment {
    pub time: AudioTimestamp,
    pub emotion: String,
    pub intensity: AudioFloat,
    pub confidence: AudioFloat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioVideoSyncAnalysis {
    pub sync_offset: AudioDuration,
    pub sync_quality: AudioFloat,
    pub drift_detected: bool,
    pub sync_issues: Vec<AudioSyncIssue>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioSyncIssue {
    pub time_range: AudioTimeRange,
    pub offset: AudioDuration,
    pub severity: AudioIssueSeverity,
}

/// Whisper transcription анализ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioTranscriptionAnalysis {
    // Unified API fields (новая архитектура)
    pub engine_name: String,
    pub full_text: String,
    pub detected_language: Option<String>,
    pub total_duration: Option<AudioDuration>,
    pub segments: Vec<TranscriptionSegment>,
    pub words: Vec<TranscriptionWord>,
    pub confidence_score: AudioFloat,
    pub processing_time: AudioDuration,
    
    // Legacy fields (для совместимости)
    pub transcription_text: Option<String>,
    pub language_detected: Option<String>,
    pub overall_confidence: Option<AudioFloat>,
    pub word_segments: Option<Vec<AudioWordSegment>>,
    pub sentence_segments: Option<Vec<AudioSentenceSegment>>,
    pub speaker_segments: Option<Vec<AudioSpeakerSegment>>,
    pub speech_rate: Option<AudioFloat>, // words per minute
    pub pause_analysis: Option<AudioPauseAnalysis>,
    pub pronunciation_quality: Option<AudioFloat>,
    pub model_used: Option<String>,
    pub provider_used: Option<String>, // "openai", "local", "faster_whisper"
}

/// Unified transcription segment (compatible with Whisper output)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionSegment {
    pub start_time: AudioTimestamp,
    pub end_time: AudioTimestamp,
    pub text: String,
    pub confidence: AudioFloat,
    pub language: Option<String>,
    pub speaker_id: Option<String>,
}

/// Unified transcription word (compatible with Whisper output)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionWord {
    pub word: String,
    pub start_time: AudioTimestamp,
    pub end_time: AudioTimestamp,
    pub confidence: AudioFloat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioWordSegment {
    pub word: String,
    pub start_time: AudioTimestamp,
    pub end_time: AudioTimestamp,
    pub confidence: AudioFloat,
    pub pronunciation_score: Option<AudioFloat>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioSentenceSegment {
    pub text: String,
    pub start_time: AudioTimestamp,
    pub end_time: AudioTimestamp,
    pub confidence: AudioFloat,
    pub word_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioSpeakerSegment {
    pub speaker_id: String,
    pub start_time: AudioTimestamp,
    pub end_time: AudioTimestamp,
    pub confidence: AudioFloat,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioPauseAnalysis {
    pub total_pause_duration: AudioDuration,
    pub average_pause_length: AudioDuration,
    pub pause_frequency: AudioFloat, // pauses per minute
    pub longest_pause: AudioDuration,
    pub pause_segments: Vec<AudioTimeRange>,
}

/// Метаданные анализа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioAnalysisMetadata {
    pub analysis_version: String,
    pub processing_time_ms: u64,
    pub config_used: UnifiedAudioConfig,
    pub engines_used: Vec<String>,
    pub total_engines_available: u32,
    pub analysis_timestamp: String, // ISO 8601
    pub success_rate: AudioFloat, // 0.0 - 1.0
}

/// Unified конфигурация для audio analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedAudioConfig {
    // Основные настройки
    pub enable_ffmpeg_analysis: bool,
    pub enable_montage_analysis: bool,
    pub enable_transcription: bool,
    
    // FFmpeg конфигурация
    pub ffmpeg_config: Option<AudioFFmpegConfig>,
    
    // Montage конфигурация
    pub montage_config: Option<AudioMontageConfig>,
    
    // Whisper конфигурация
    pub whisper_config: Option<AudioWhisperConfig>,
    
    // Performance настройки
    pub performance_mode: AudioPerformanceMode,
    pub max_processing_time_seconds: Option<u64>,
    pub enable_caching: bool,
}

impl Default for UnifiedAudioConfig {
    fn default() -> Self {
        Self {
            enable_ffmpeg_analysis: true,
            enable_montage_analysis: true,
            enable_transcription: false, // дорого
            ffmpeg_config: Some(AudioFFmpegConfig::default()),
            montage_config: Some(AudioMontageConfig::default()),
            whisper_config: Some(AudioWhisperConfig::default()),
            performance_mode: AudioPerformanceMode::Balanced,
            max_processing_time_seconds: Some(300), // 5 минут max
            enable_caching: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioFFmpegConfig {
    pub enable_volume_analysis: bool,
    pub enable_frequency_analysis: bool,
    pub enable_dynamics_analysis: bool,
    pub enable_quality_analysis: bool,
    pub sample_rate: AudioSampleRate,
}

impl Default for AudioFFmpegConfig {
    fn default() -> Self {
        Self {
            enable_volume_analysis: true,
            enable_frequency_analysis: true,
            enable_dynamics_analysis: true,
            enable_quality_analysis: true,
            sample_rate: AudioSampleRate::cd_quality(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioMontageConfig {
    pub enable_beat_detection: bool,
    pub enable_emotion_analysis: bool,
    pub enable_content_classification: bool,
    pub silence_threshold: AudioVolume,
    pub minimum_segment_duration: AudioDuration,
}

impl Default for AudioMontageConfig {
    fn default() -> Self {
        Self {
            enable_beat_detection: true,
            enable_emotion_analysis: true,
            enable_content_classification: true,
            silence_threshold: AudioVolume::from_normalized(0.01), // 1%
            minimum_segment_duration: AudioDuration::from_seconds(0.5),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioWhisperConfig {
    pub model_size: String, // "tiny", "base", "small", "medium", "large"
    pub language: Option<String>, // auto-detect if None
    pub provider: String, // "openai", "local", "faster_whisper"
    pub enable_word_timestamps: bool,
    pub enable_speaker_diarization: bool,
}

impl Default for AudioWhisperConfig {
    fn default() -> Self {
        Self {
            model_size: "base".to_string(),
            language: None, // auto-detect
            provider: "local".to_string(),
            enable_word_timestamps: true,
            enable_speaker_diarization: false, // дорого
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioPerformanceMode {
    Fast,     // быстрый анализ, минимальные детали
    Balanced, // баланс между скоростью и качеством
    Quality,  // максимальное качество анализа
    Custom,   // пользовательские настройки
}

/// Ошибки audio analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioAnalysisError {
    FileNotFound(String),
    UnsupportedFormat(String),
    FFmpegError(String),
    MontageError(String),
    WhisperError(String),
    ConfigurationError(String),
    TimeoutError(String),
    InsufficientMemory(String),
    ConversionError(String),
    ProcessingError(String),  // Добавляем недостающий вариант
}

impl std::fmt::Display for AudioAnalysisError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::FileNotFound(path) => write!(f, "Audio file not found: {}", path),
            Self::UnsupportedFormat(format) => write!(f, "Unsupported audio format: {}", format),
            Self::FFmpegError(msg) => write!(f, "FFmpeg analysis error: {}", msg),
            Self::MontageError(msg) => write!(f, "Montage analysis error: {}", msg),
            Self::WhisperError(msg) => write!(f, "Whisper analysis error: {}", msg),
            Self::ConfigurationError(msg) => write!(f, "Configuration error: {}", msg),
            Self::TimeoutError(msg) => write!(f, "Analysis timeout: {}", msg),
            Self::InsufficientMemory(msg) => write!(f, "Insufficient memory: {}", msg),
            Self::ConversionError(msg) => write!(f, "Type conversion error: {}", msg),
            Self::ProcessingError(msg) => write!(f, "Audio processing error: {}", msg),
        }
    }
}

impl std::error::Error for AudioAnalysisError {}

impl From<anyhow::Error> for AudioAnalysisError {
    fn from(err: anyhow::Error) -> Self {
        Self::ProcessingError(err.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unified_audio_analysis_result() {
        let basic_metrics = AudioBasicMetrics {
            duration: AudioDuration::from_seconds(60.0),
            has_audio: true,
            sample_rate: AudioSampleRate::cd_quality(),
            channels: 2,
            overall_volume: AudioVolume::from_normalized(0.7),
            estimated_quality: 0.8,
            file_size_bytes: Some(1024 * 1024),
            codec: Some("aac".to_string()),
            bitrate: Some(128),
        };
        
        let metadata = AudioAnalysisMetadata {
            analysis_version: "2.0-unified".to_string(),
            processing_time_ms: 1000,
            config_used: UnifiedAudioConfig::default(),
            engines_used: vec!["basic".to_string()],
            total_engines_available: 1,
            analysis_timestamp: "2024-01-01T00:00:00Z".to_string(),
            success_rate: 1.0,
        };
        
        let result = UnifiedAudioAnalysisResult::basic_only(basic_metrics, metadata);
        
        assert!(result.has_audio());
        assert_eq!(result.available_insights().len(), 1);
        assert_eq!(result.overall_quality_score(), 0.8);
    }

    #[test]
    fn test_audio_basic_metrics_quality() {
        let metrics = AudioBasicMetrics {
            duration: AudioDuration::from_seconds(60.0),
            has_audio: true,
            sample_rate: AudioSampleRate::cd_quality(),
            channels: 2,
            overall_volume: AudioVolume::from_normalized(0.7),
            estimated_quality: 0.0, // will be calculated
            file_size_bytes: Some(1024 * 1024),
            codec: Some("aac".to_string()),
            bitrate: Some(256),
        };
        
        let quality = metrics.calculate_basic_quality();
        assert!(quality > 0.5); // should be good quality
        assert!(quality <= 1.0);
    }

    #[test]
    fn test_audio_content_type() {
        let segment = AudioContentSegment {
            time_range: AudioTimeRange::new(
                AudioTimestamp::from_seconds(0.0),
                AudioTimestamp::from_seconds(10.0)
            ),
            content_type: AudioContentType::Speech,
            confidence: 0.95,
            characteristics: HashMap::new(),
        };
        
        assert_eq!(segment.content_type, AudioContentType::Speech);
        assert_eq!(segment.time_range.duration().seconds, 10.0);
    }

    #[test]
    fn test_unified_audio_config_default() {
        let config = UnifiedAudioConfig::default();
        
        assert!(config.enable_ffmpeg_analysis);
        assert!(config.enable_montage_analysis);
        assert!(!config.enable_transcription); // дорого по умолчанию
        assert!(config.enable_caching);
        assert_eq!(config.max_processing_time_seconds, Some(300));
    }
}