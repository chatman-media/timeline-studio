use ts_render::video_compiler::error::{Result, VideoCompilerError};
use ts_render::video_compiler::schema::{OutputFormat, ProjectSchema};

use super::types::*;

/// Применяет предустановки экспорта к схеме проекта
pub fn apply_export_preset(mut schema: ProjectSchema, preset: &str) -> Result<ProjectSchema> {
  match preset {
    "youtube" => {
      schema.settings.export.format = OutputFormat::Mp4;
      schema.settings.export.video_bitrate = 8000;
      schema.settings.export.audio_bitrate = 192;
      schema.settings.export.quality = 90;
    }
    "instagram" => {
      schema.settings.export.format = OutputFormat::Mp4;
      schema.settings.export.video_bitrate = 5000;
      schema.settings.export.audio_bitrate = 128;
      schema.settings.export.quality = 85;
    }
    "twitter" => {
      schema.settings.export.format = OutputFormat::Mp4;
      schema.settings.export.video_bitrate = 6000;
      schema.settings.export.audio_bitrate = 128;
      schema.settings.export.quality = 85;
    }
    _ => {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Unknown preset: {preset}"
      )));
    }
  }
  Ok(schema)
}

/// Получает предустановку экспорта по имени
pub fn get_export_preset(preset_name: &str) -> Option<ExportPreset> {
  match preset_name {
    "youtube" => Some(ExportPreset {
      name: "YouTube".to_string(),
      format: "mp4".to_string(),
      video_bitrate: 8000,
      audio_bitrate: 192,
      quality: 90,
    }),
    "instagram" => Some(ExportPreset {
      name: "Instagram".to_string(),
      format: "mp4".to_string(),
      video_bitrate: 5000,
      audio_bitrate: 128,
      quality: 85,
    }),
    "twitter" => Some(ExportPreset {
      name: "Twitter".to_string(),
      format: "mp4".to_string(),
      video_bitrate: 6000,
      audio_bitrate: 128,
      quality: 85,
    }),
    _ => None,
  }
}

/// Получает список всех доступных предустановок экспорта
pub fn get_available_presets() -> Vec<String> {
  vec![
    "youtube".to_string(),
    "instagram".to_string(),
    "twitter".to_string(),
  ]
}

/// Валидирует временные метки сегмента
pub fn validate_segment_timestamps(
  start_time: f64,
  end_time: f64,
  project_duration: f64,
) -> SegmentValidation {
  let is_valid = start_time >= 0.0 && end_time > start_time && end_time <= project_duration;

  let warnings = if start_time < 0.0 {
    Some("Start time cannot be negative".to_string())
  } else if end_time <= start_time {
    Some("End time must be greater than start time".to_string())
  } else if end_time > project_duration {
    Some("End time exceeds project duration".to_string())
  } else {
    None
  };

  SegmentValidation {
    is_valid,
    start_time,
    end_time,
    segment_duration: end_time - start_time,
    project_duration,
    warnings,
  }
}

/// Создает информацию о фильтрах сегмента
pub fn create_segment_filters_info(
  start_time: f64,
  end_time: f64,
  has_video: bool,
  has_audio: bool,
) -> SegmentFiltersInfo {
  let filter_complexity = if has_video && has_audio {
    "complex"
  } else {
    "simple"
  };

  SegmentFiltersInfo {
    segment_start: start_time,
    segment_end: end_time,
    duration: end_time - start_time,
    has_video_tracks: has_video,
    has_audio_tracks: has_audio,
    filter_complexity: filter_complexity.to_string(),
  }
}

/// Создает статистику рендеринга из внутренних данных
pub fn create_render_statistics(params: RenderStatisticsParams) -> RenderStatistics {
  RenderStatistics {
    job_id: params.job_id,
    frames_processed: params.frames_processed,
    memory_used: params.memory_used,
    error_count: params.error_count,
    warning_count: params.warning_count,
    validation_time_secs: params.validation_time_secs,
    preprocessing_time_secs: params.preprocessing_time_secs,
    composition_time_secs: params.composition_time_secs,
    encoding_time_secs: params.encoding_time_secs,
    finalization_time_secs: params.finalization_time_secs,
  }
}

/// Парсит настройки рендеринга из JSON
pub fn parse_custom_render_settings(settings: &serde_json::Value) -> CustomRenderSettings {
  let use_hw = settings
    .get("use_hardware_acceleration")
    .and_then(|v| v.as_bool())
    .unwrap_or(false);

  let hw_type = settings
    .get("hardware_acceleration_type")
    .and_then(|v| v.as_str())
    .map(String::from);

  let global_options = settings
    .get("global_options")
    .and_then(|v| v.as_array())
    .map(|arr| {
      arr
        .iter()
        .filter_map(|v| v.as_str().map(String::from))
        .collect()
    })
    .unwrap_or_default();

  CustomRenderSettings {
    use_hardware_acceleration: use_hw,
    hardware_acceleration_type: hw_type,
    global_options,
  }
}

/// Конвертирует команду в массив строк для возврата
pub fn command_to_string_array(command: &tokio::process::Command) -> Vec<String> {
  let program = format!("{}", command.as_std().get_program().to_string_lossy());
  let args: Vec<String> = command
    .as_std()
    .get_args()
    .map(|arg| arg.to_string_lossy().to_string())
    .collect();

  let mut result = vec![program];
  result.extend(args);
  result
}

/// Создает информацию о проекте из схемы
pub fn create_project_info(schema: &ProjectSchema) -> FFmpegProjectInfo {
  FFmpegProjectInfo {
    name: schema.metadata.name.clone(),
    duration: schema.timeline.duration,
    resolution: (
      schema.settings.resolution.width,
      schema.settings.resolution.height,
    ),
    frame_rate: schema.settings.frame_rate as u32,
    format: format!("{:?}", schema.settings.export.format),
  }
}

/// Создает информацию о настройках FFmpeg Builder
pub fn create_ffmpeg_builder_info(
  ffmpeg_path: String,
  use_hardware_acceleration: bool,
  hardware_acceleration_type: Option<String>,
  global_options: Vec<String>,
) -> FFmpegBuilderInfo {
  FFmpegBuilderInfo {
    ffmpeg_path,
    use_hardware_acceleration,
    hardware_acceleration_type,
    global_options,
  }
}

/// Создает информацию об индексе входа клипа
pub fn create_clip_input_index_info(
  clip_id: String,
  input_index: Option<usize>,
) -> ClipInputIndexInfo {
  ClipInputIndexInfo {
    clip_id,
    input_index,
    found: input_index.is_some(),
  }
}

/// Создает информацию о кэше извлечения кадров
pub fn create_frame_extraction_cache_info(available: bool) -> FrameExtractionCacheInfo {
  FrameExtractionCacheInfo {
    cache_available: available,
    message: if available {
      "Frame extraction cache accessed successfully".to_string()
    } else {
      "Frame extraction cache not available".to_string()
    },
  }
}

/// Валидирует путь вывода
pub fn validate_output_path(output_path: &str) -> Result<()> {
  if output_path.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Output path cannot be empty".to_string(),
    ));
  }

  // Проверяем расширение файла
  let path = std::path::Path::new(output_path);
  if path.extension().is_none() {
    return Err(VideoCompilerError::InvalidParameter(
      "Output path must have a file extension".to_string(),
    ));
  }

  Ok(())
}

/// Определяет первый входной файл из схемы проекта
pub fn get_first_input_path(project_schema: &ProjectSchema) -> std::path::PathBuf {
  if let Some(track) = project_schema.tracks.first() {
    if let Some(clip) = track.clips.first() {
      match &clip.source {
        ts_render::video_compiler::schema::ClipSource::File(path) => std::path::PathBuf::from(path),
        _ => std::path::PathBuf::from("/tmp/empty.mp4"),
      }
    } else {
      std::path::PathBuf::from("/tmp/empty.mp4")
    }
  } else {
    std::path::PathBuf::from("/tmp/empty.mp4")
  }
}

/// Валидирует ID рендер-задачи
pub fn validate_job_id(job_id: &str) -> Result<()> {
  if job_id.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Job ID cannot be empty".to_string(),
    ));
  }
  Ok(())
}

/// Форматирует размер памяти в человекочитаемый формат
pub fn format_memory_size(bytes: u64) -> String {
  const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];

  if bytes == 0 {
    return "0 B".to_string();
  }

  let k: f64 = 1024.0;
  let i = ((bytes as f64).ln() / k.ln()).floor() as i32;
  let size = (bytes as f64) / k.powi(i);

  format!("{:.2} {}", size, UNITS[i as usize])
}

/// Вычисляет общее время обработки
pub fn calculate_total_processing_time(stats: &RenderStatistics) -> u64 {
  stats.validation_time_secs
    + stats.preprocessing_time_secs
    + stats.composition_time_secs
    + stats.encoding_time_secs
    + stats.finalization_time_secs
}
