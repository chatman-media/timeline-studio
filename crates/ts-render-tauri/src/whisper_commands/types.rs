//! Типы данных для команд Whisper API

use serde::{Deserialize, Serialize};

/// Сегмент транскрипции Whisper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhisperSegment {
  pub id: u32,
  pub seek: u32,
  pub start: f64,
  pub end: f64,
  pub text: String,
  pub tokens: Vec<u32>,
  pub temperature: f64,
  pub avg_logprob: f64,
  pub compression_ratio: f64,
  pub no_speech_prob: f64,
}

/// Отдельное слово в транскрипции с временными метками
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhisperWord {
  pub word: String,
  pub start: f64,
  pub end: f64,
}

/// Результат транскрипции Whisper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhisperTranscriptionResult {
  pub text: String,
  pub language: Option<String>,
  pub duration: Option<f64>,
  pub segments: Option<Vec<WhisperSegment>>,
  pub words: Option<Vec<WhisperWord>>,
}

/// Результат перевода Whisper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhisperTranslationResult {
  pub text: String,
  pub segments: Option<Vec<WhisperSegment>>,
}

/// Локальная модель Whisper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalWhisperModel {
  pub name: String,
  pub size: String,
  pub languages: Vec<String>,
  pub path: Option<String>,
  pub is_downloaded: bool,
  pub download_url: Option<String>,
}
