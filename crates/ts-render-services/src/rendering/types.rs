use serde::{Deserialize, Serialize};

/// Настройки экспорта для различных платформ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportPreset {
  pub name: String,
  pub format: String,
  pub video_bitrate: u32,
  pub audio_bitrate: u32,
  pub quality: u32,
}

/// Статистика рендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderStatistics {
  pub job_id: String,
  pub frames_processed: u64,
  pub memory_used: u64,
  pub error_count: u32,
  pub warning_count: u32,
  pub validation_time_secs: u64,
  pub preprocessing_time_secs: u64,
  pub composition_time_secs: u64,
  pub encoding_time_secs: u64,
  pub finalization_time_secs: u64,
}

/// Настройки рендеринга с пользовательскими параметрами FFmpeg
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomRenderSettings {
  pub use_hardware_acceleration: bool,
  pub hardware_acceleration_type: Option<String>,
  pub global_options: Vec<String>,
}

/// Информация о валидации временных меток сегмента
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentValidation {
  pub is_valid: bool,
  pub start_time: f64,
  pub end_time: f64,
  pub segment_duration: f64,
  pub project_duration: f64,
  pub warnings: Option<String>,
}

/// Информация о фильтрах сегмента
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentFiltersInfo {
  pub segment_start: f64,
  pub segment_end: f64,
  pub duration: f64,
  pub has_video_tracks: bool,
  pub has_audio_tracks: bool,
  pub filter_complexity: String,
}

/// Информация о проекте из FFmpeg Builder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegProjectInfo {
  pub name: String,
  pub duration: f64,
  pub resolution: (u32, u32),
  pub frame_rate: u32,
  pub format: String,
}

/// Информация о настройках FFmpeg Builder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegBuilderInfo {
  pub ffmpeg_path: String,
  pub use_hardware_acceleration: bool,
  pub hardware_acceleration_type: Option<String>,
  pub global_options: Vec<String>,
}

/// Информация об индексе входа клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipInputIndexInfo {
  pub clip_id: String,
  pub input_index: Option<usize>,
  pub found: bool,
}

/// Информация о кэше извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameExtractionCacheInfo {
  pub cache_available: bool,
  pub message: String,
}

/// Параметры для создания статистики рендеринга
#[derive(Debug, Clone)]
pub struct RenderStatisticsParams {
  pub job_id: String,
  pub frames_processed: u64,
  pub memory_used: u64,
  pub error_count: u32,
  pub warning_count: u32,
  pub validation_time_secs: u64,
  pub preprocessing_time_secs: u64,
  pub composition_time_secs: u64,
  pub encoding_time_secs: u64,
  pub finalization_time_secs: u64,
}
