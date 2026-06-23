//! Типы для модуля ffmpeg_builder

use ts_render::video_compiler::schema::ProjectSchema;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Параметры для добавления сегментных входов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentInputParams {
  pub project: ProjectSchema,
  pub temp_dir: String,
}

/// Результат добавления сегментных входов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentInputResult {
  pub success: bool,
  pub input_count: usize,
  pub clip_indices: HashMap<String, usize>,
  pub error: Option<String>,
}

/// Параметры для настроек пререндеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrerenderSettingsParams {
  pub project: ProjectSchema,
  pub output_path: String,
  pub width: u32,
  pub height: u32,
  pub fps: f64,
  pub video_codec: String,
  pub audio_codec: String,
}

/// Информация о FFmpeg builder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuilderInfo {
  pub supports_segment_inputs: bool,
  pub supports_prerender_settings: bool,
  pub max_concurrent_inputs: usize,
  pub supported_codecs: Vec<String>,
}

/// Результат создания FFmpeg команды
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegCommandResult {
  pub command: String,
  pub success: bool,
  pub error: Option<String>,
}

/// Параметры для поиска индекса клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipIndexParams {
  pub clip_id: String,
  pub project: ProjectSchema,
}

/// Результат поиска индекса клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipIndexResult {
  pub clip_id: String,
  pub index: Option<usize>,
  pub found: bool,
}
