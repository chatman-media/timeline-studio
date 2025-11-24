//! Montage Planner Audio Analysis Adapter
//!
//! Конвертация Montage Planner results (f32) в unified format (f64)

use crate::analysis::types::{AudioAnalysisError, AudioFloat, AudioMontageAnalysis};
use crate::montage_planner::types::{AudioAnalysisResult, AudioContentType, EmotionalTone};

/// Montage Audio Adapter
///
/// Конвертирует Montage Planner audio analysis (использует f32)
/// в unified format (использует f64)
pub struct MontageAudioAdapter;

impl MontageAudioAdapter {
    /// Create new Montage adapter
    pub fn new() -> Self {
        Self
    }

    /// Convert Montage result (f32) to unified format (f64)
    pub fn convert(
        &self,
        montage_result: AudioAnalysisResult,
    ) -> Result<AudioMontageAnalysis, AudioAnalysisError> {
        // Конвертируем все f32 → f64
        Ok(AudioMontageAnalysis {
            // Основные метрики
            dynamic_range: montage_result.dynamic_range as AudioFloat,
            speech_probability: (montage_result.speech_presence / 100.0) as AudioFloat,
            music_probability: (montage_result.music_presence / 100.0) as AudioFloat,
            overall_quality_score: 0.8, // Default - можно улучшить позже

            // Сегменты контента - пока пустые, можно добавить детализацию позже
            content_segments: vec![],
            silence_segments: vec![],

            // Музыкальный анализ
            beat_detection: None, // TODO: Add beat detection conversion
            tempo_analysis: montage_result.tempo.map(|t| crate::analysis::types::AudioTempoAnalysis {
                average_tempo: t as AudioFloat,
                tempo_stability: 0.9, // High stability assumed
                tempo_changes: vec![], // No tempo changes tracked by Montage Planner
            }),
            key_detection: None, // TODO: Add key detection if available

            // Эмоциональный анализ
            emotional_tone: Some(crate::analysis::types::AudioEmotionalTone {
                primary_emotion: Self::convert_emotional_tone(&montage_result.emotional_tone),
                emotion_scores: {
                    let mut scores = std::collections::HashMap::new();
                    scores.insert(
                        Self::convert_emotional_tone(&montage_result.emotional_tone),
                        0.8,
                    );
                    scores
                },
                emotional_timeline: vec![], // TODO: Add timeline если Montage Planner предоставляет
            }),
            energy_level: (montage_result.energy_level / 100.0) as AudioFloat,
            valence: 0.5, // Neutral default - можно улучшить на основе emotional_tone

            // Технический анализ
            sync_analysis: None, // TODO: Add sync analysis если доступно
        })
    }

    /// Конвертировать AudioContentType
    fn convert_content_type(content_type: &AudioContentType) -> String {
        match content_type {
            AudioContentType::Speech => "speech".to_string(),
            AudioContentType::Music => "music".to_string(),
            AudioContentType::Ambient => "ambient".to_string(),
            AudioContentType::Mixed => "mixed".to_string(),
            AudioContentType::Silence => "silence".to_string(),
        }
    }

    /// Конвертировать EmotionalTone
    fn convert_emotional_tone(tone: &EmotionalTone) -> String {
        match tone {
            EmotionalTone::Calm => "calm".to_string(),
            EmotionalTone::Excited => "excited".to_string(),
            EmotionalTone::Happy => "happy".to_string(),
            EmotionalTone::Sad => "sad".to_string(),
            EmotionalTone::Angry => "angry".to_string(),
            EmotionalTone::Surprised => "surprised".to_string(),
            EmotionalTone::Fear => "fear".to_string(),
            EmotionalTone::Disgust => "disgust".to_string(),
            EmotionalTone::Neutral => "neutral".to_string(),
            EmotionalTone::Tense => "tense".to_string(),
        }
    }
}

impl Default for MontageAudioAdapter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_montage_adapter_f32_to_f64_conversion() {
        let adapter = MontageAudioAdapter::new();

        let montage_result = AudioAnalysisResult {
            content_type: AudioContentType::Speech,
            speech_presence: 85.5f32,
            music_presence: 10.2f32,
            ambient_level: 15.7f32,
            emotional_tone: EmotionalTone::Excited,
            tempo: Some(120.5f32),
            beat_markers: vec![1.0, 2.5, 4.0],
            energy_level: 75.3f32,
            dynamic_range: 45.8f32,
        };

        let result = adapter.convert(montage_result);
        assert!(result.is_ok());

        let unified = result.unwrap();

        // Проверяем конвертацию f32 → f64
        assert!((unified.speech_probability - 0.855).abs() < 0.01);
        assert!((unified.music_probability - 0.102).abs() < 0.01);
        assert!((unified.dynamic_range - 45.8).abs() < 0.01);
    }

    #[test]
    fn test_montage_adapter_basic_conversion() {
        let adapter = MontageAudioAdapter::new();

        let montage_result = AudioAnalysisResult {
            content_type: AudioContentType::Music,
            speech_presence: 10.0,
            music_presence: 80.0,
            ambient_level: 10.0,
            emotional_tone: EmotionalTone::Happy,
            tempo: Some(128.0f32),
            beat_markers: vec![0.0, 0.5, 1.0, 1.5],
            energy_level: 85.0,
            dynamic_range: 50.0,
        };

        let unified = adapter.convert(montage_result).unwrap();
        assert!(unified.speech_probability < 0.2);
        assert!(unified.music_probability > 0.7);
        assert!(unified.energy_level > 0.8);
        assert!(unified.tempo_analysis.is_some());
    }

    #[test]
    fn test_montage_adapter_with_tempo() {
        let adapter = MontageAudioAdapter::new();

        let montage_result = AudioAnalysisResult {
            content_type: AudioContentType::Music,
            speech_presence: 0.0,
            music_presence: 100.0,
            ambient_level: 0.0,
            emotional_tone: EmotionalTone::Neutral,
            tempo: Some(120.0f32),
            beat_markers: vec![0.0, 0.5, 1.0],
            energy_level: 70.0,
            dynamic_range: 40.0,
        };

        let unified = adapter.convert(montage_result).unwrap();
        assert!(unified.tempo_analysis.is_some());
        let tempo_analysis = unified.tempo_analysis.unwrap();
        assert!((tempo_analysis.average_tempo - 120.0).abs() < 0.01);
        assert!(tempo_analysis.tempo_stability > 0.8);
    }

    #[test]
    fn test_montage_adapter_no_tempo() {
        let adapter = MontageAudioAdapter::new();

        let montage_result = AudioAnalysisResult {
            content_type: AudioContentType::Ambient,
            speech_presence: 0.0,
            music_presence: 0.0,
            ambient_level: 100.0,
            emotional_tone: EmotionalTone::Calm,
            tempo: None,
            beat_markers: vec![],
            energy_level: 20.0,
            dynamic_range: 15.0,
        };

        let unified = adapter.convert(montage_result).unwrap();
        assert!(unified.tempo_analysis.is_none());
    }
}
