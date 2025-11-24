//! Whisper Audio Transcription Adapter
//!
//! Конвертация Whisper transcription results в unified format

use crate::analysis::types::{
  AudioAnalysisError, AudioDuration, AudioFloat, AudioTimestamp, AudioTranscriptionAnalysis,
  TranscriptionSegment, TranscriptionWord,
};
use crate::video_compiler::commands::whisper_commands::types::{
  WhisperSegment, WhisperTranscriptionResult, WhisperWord,
};

/// Whisper Audio Adapter
///
/// Конвертирует Whisper transcription results в unified format
pub struct WhisperAudioAdapter;

impl WhisperAudioAdapter {
  /// Create new Whisper adapter
  pub fn new() -> Self {
    Self
  }

  /// Convert Whisper result to unified format
  pub fn convert(
    &self,
    whisper_result: WhisperTranscriptionResult,
  ) -> Result<AudioTranscriptionAnalysis, AudioAnalysisError> {
    // Calculate overall confidence from segments
    let confidence_score = Self::calculate_confidence(&whisper_result.segments);

    // Convert segments
    let segments = Self::convert_segments(&whisper_result.segments);

    // Convert words
    let words = Self::convert_words(&whisper_result.words, &whisper_result.segments);

    // Calculate total duration
    let total_duration = whisper_result
      .duration
      .map(|d| AudioDuration { seconds: d });

    Ok(AudioTranscriptionAnalysis {
      // Unified API fields
      engine_name: "whisper".to_string(),
      full_text: whisper_result.text.clone(),
      detected_language: whisper_result.language.clone(),
      total_duration,
      segments,
      words,
      confidence_score,
      processing_time: AudioDuration { seconds: 0.0 }, // TODO: track actual processing time

      // Legacy fields для совместимости
      transcription_text: Some(whisper_result.text),
      language_detected: whisper_result.language,
      overall_confidence: Some(confidence_score),
      word_segments: None, // Используем новое поле words вместо этого
      sentence_segments: None,
      speaker_segments: None, // Whisper не поддерживает speaker diarization
      speech_rate: None,
      pause_analysis: None,
      pronunciation_quality: None,
      model_used: Some("whisper".to_string()),
      provider_used: Some("local".to_string()),
    })
  }

  /// Calculate overall confidence from Whisper segments
  fn calculate_confidence(segments: &Option<Vec<WhisperSegment>>) -> AudioFloat {
    match segments {
      Some(segs) if !segs.is_empty() => {
        let total_confidence: f64 = segs
          .iter()
          .map(|seg| {
            // Конвертируем avg_logprob в confidence (0-1)
            // avg_logprob обычно от -∞ до 0, где ближе к 0 = выше уверенность
            // Используем exp(avg_logprob) для конвертации в 0-1
            let logprob_confidence = seg.avg_logprob.exp().clamp(0.0, 1.0);
            // Учитываем no_speech_prob
            let speech_confidence = 1.0 - seg.no_speech_prob;
            (logprob_confidence + speech_confidence) / 2.0
          })
          .sum();
        (total_confidence / segs.len() as f64).clamp(0.0, 1.0)
      }
      _ => 0.5,
    }
  }

  /// Convert Whisper segments to unified format
  fn convert_segments(whisper_segments: &Option<Vec<WhisperSegment>>) -> Vec<TranscriptionSegment> {
    match whisper_segments {
      Some(segs) => segs
        .iter()
        .map(|seg| TranscriptionSegment {
          start_time: AudioTimestamp { seconds: seg.start },
          end_time: AudioTimestamp { seconds: seg.end },
          text: seg.text.clone(),
          confidence: 1.0 - seg.no_speech_prob,
          language: None,   // Whisper предоставляет язык на уровне result, не segment
          speaker_id: None, // Whisper не поддерживает speaker diarization
        })
        .collect(),
      None => vec![],
    }
  }

  /// Convert Whisper words to unified format
  fn convert_words(
    whisper_words: &Option<Vec<WhisperWord>>,
    segments: &Option<Vec<WhisperSegment>>,
  ) -> Vec<TranscriptionWord> {
    // Если есть word-level timestamps, используем их
    if let Some(words) = whisper_words {
      return words
        .iter()
        .map(|word| TranscriptionWord {
          word: word.word.clone(),
          start_time: AudioTimestamp {
            seconds: word.start,
          },
          end_time: AudioTimestamp { seconds: word.end },
          confidence: 0.8, // Whisper не предоставляет per-word confidence
        })
        .collect();
    }

    // Fallback: извлекаем слова из segment text
    if let Some(segs) = segments {
      let mut words = Vec::new();
      for segment in segs {
        let segment_words: Vec<&str> = segment.text.split_whitespace().collect();
        let segment_duration = segment.end - segment.start;
        let word_duration = if !segment_words.is_empty() {
          segment_duration / segment_words.len() as f64
        } else {
          0.0
        };

        for (i, word) in segment_words.iter().enumerate() {
          let word_start = segment.start + (i as f64 * word_duration);
          let word_end = word_start + word_duration;

          words.push(TranscriptionWord {
            word: word.to_string(),
            start_time: AudioTimestamp {
              seconds: word_start,
            },
            end_time: AudioTimestamp { seconds: word_end },
            confidence: 1.0 - segment.no_speech_prob,
          });
        }
      }
      return words;
    }

    vec![]
  }
}

impl Default for WhisperAudioAdapter {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_whisper_adapter_basic_conversion() {
    let adapter = WhisperAudioAdapter::new();

    let whisper_result = WhisperTranscriptionResult {
      text: "Hello world".to_string(),
      language: Some("en".to_string()),
      duration: Some(1.5),
      segments: Some(vec![WhisperSegment {
        id: 0,
        seek: 0,
        start: 0.0,
        end: 1.5,
        text: "Hello world".to_string(),
        tokens: vec![],
        temperature: 0.0,
        avg_logprob: -0.2,
        compression_ratio: 1.1,
        no_speech_prob: 0.05,
      }]),
      words: None,
    };

    let result = adapter.convert(whisper_result);
    assert!(result.is_ok());

    let unified = result.unwrap();
    assert_eq!(unified.engine_name, "whisper");
    assert_eq!(unified.full_text, "Hello world");
    assert_eq!(unified.detected_language, Some("en".to_string()));
    assert!(unified.confidence_score > 0.0);
    assert_eq!(unified.segments.len(), 1);
  }

  #[test]
  fn test_whisper_adapter_with_word_timestamps() {
    let adapter = WhisperAudioAdapter::new();

    let whisper_result = WhisperTranscriptionResult {
      text: "Hello world".to_string(),
      language: Some("en".to_string()),
      duration: Some(1.0),
      segments: None,
      words: Some(vec![
        WhisperWord {
          word: "Hello".to_string(),
          start: 0.0,
          end: 0.5,
        },
        WhisperWord {
          word: "world".to_string(),
          start: 0.5,
          end: 1.0,
        },
      ]),
    };

    let unified = adapter.convert(whisper_result).unwrap();
    assert_eq!(unified.words.len(), 2);
    assert_eq!(unified.words[0].word, "Hello");
    assert_eq!(unified.words[0].start_time.seconds, 0.0);
    assert_eq!(unified.words[1].word, "world");
  }

  #[test]
  fn test_whisper_adapter_confidence_calculation() {
    let adapter = WhisperAudioAdapter::new();

    // High confidence
    let high_conf = WhisperTranscriptionResult {
      text: "Test".to_string(),
      language: Some("en".to_string()),
      duration: Some(1.0),
      segments: Some(vec![WhisperSegment {
        id: 0,
        seek: 0,
        start: 0.0,
        end: 1.0,
        text: "Test".to_string(),
        tokens: vec![],
        temperature: 0.0,
        avg_logprob: -0.1,
        compression_ratio: 1.0,
        no_speech_prob: 0.01,
      }]),
      words: None,
    };

    let unified = adapter.convert(high_conf).unwrap();
    assert!(unified.confidence_score > 0.8);

    // Low confidence
    let low_conf = WhisperTranscriptionResult {
      text: "Test".to_string(),
      language: Some("en".to_string()),
      duration: Some(1.0),
      segments: Some(vec![WhisperSegment {
        id: 0,
        seek: 0,
        start: 0.0,
        end: 1.0,
        text: "Test".to_string(),
        tokens: vec![],
        temperature: 0.0,
        avg_logprob: -1.5,
        compression_ratio: 1.0,
        no_speech_prob: 0.8,
      }]),
      words: None,
    };

    let unified = adapter.convert(low_conf).unwrap();
    assert!(unified.confidence_score < 0.5);
  }

  #[test]
  fn test_whisper_adapter_unknown_language() {
    let adapter = WhisperAudioAdapter::new();

    let whisper_result = WhisperTranscriptionResult {
      text: "Test".to_string(),
      language: None,
      duration: Some(1.0),
      segments: None,
      words: None,
    };

    let unified = adapter.convert(whisper_result).unwrap();
    assert_eq!(unified.detected_language, None);
    assert_eq!(unified.language_detected, None);
  }

  #[test]
  fn test_whisper_adapter_empty_result() {
    let adapter = WhisperAudioAdapter::new();

    let whisper_result = WhisperTranscriptionResult {
      text: "".to_string(),
      language: Some("en".to_string()),
      duration: Some(0.0),
      segments: Some(vec![]),
      words: None,
    };

    let unified = adapter.convert(whisper_result).unwrap();
    assert_eq!(unified.full_text, "");
    assert_eq!(unified.segments.len(), 0);
    assert_eq!(unified.words.len(), 0);
    assert_eq!(unified.confidence_score, 0.5); // Default
  }
}
