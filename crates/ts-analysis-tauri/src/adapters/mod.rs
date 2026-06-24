//! Audio Analysis Adapters
//!
//! Адаптеры для конвертации между legacy типами и unified system

pub mod ffmpeg_adapter;
pub mod montage_adapter;
pub mod whisper_adapter;

pub use ffmpeg_adapter::FFmpegAudioAdapter;
pub use montage_adapter::MontageAudioAdapter;
pub use whisper_adapter::WhisperAudioAdapter;

use crate::types::AudioAnalysisError;

/// Trait для всех audio adapters
pub trait AudioAdapter<Input, Output> {
  /// Конвертировать legacy type в unified format
  fn convert(&self, input: Input) -> Result<Output, AudioAnalysisError>;
}
