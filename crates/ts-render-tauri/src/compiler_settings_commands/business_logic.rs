//! Бизнес-логика для настроек компилятора

use super::types::*;
use std::path::Path;
use ts_render::video_compiler::core::constants::{compiler::*, export::*, quality_presets};
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};

/// Валидирует настройки компилятора
pub fn validate_compiler_settings(settings: &CompilerSettings) -> Result<()> {
  // Валидация пути к FFmpeg
  validate_ffmpeg_path(&settings.ffmpeg_path)?;

  // Валидация параллельных задач
  validate_parallel_jobs(settings.parallel_jobs)?;

  // Валидация лимита памяти
  validate_memory_limit(settings.memory_limit_mb)?;

  // Валидация временной директории
  validate_temp_directory(&settings.temp_directory)?;

  // Валидация уровня логирования
  validate_log_level(&settings.log_level)?;

  Ok(())
}

/// Валидирует путь к FFmpeg
pub fn validate_ffmpeg_path(path: &str) -> Result<()> {
  if path.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "FFmpeg path cannot be empty".to_string(),
    ));
  }

  // Проверяем расширение на Windows
  if cfg!(windows) && !path.ends_with(".exe") && !path.contains("ffmpeg") {
    return Err(VideoCompilerError::InvalidParameter(
      "FFmpeg path should point to ffmpeg.exe on Windows".to_string(),
    ));
  }

  Ok(())
}

/// Валидирует количество параллельных задач
pub fn validate_parallel_jobs(jobs: usize) -> Result<()> {
  if jobs == 0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Parallel jobs must be at least 1".to_string(),
    ));
  }

  if jobs > 64 {
    return Err(VideoCompilerError::InvalidParameter(
      "Parallel jobs cannot exceed 64".to_string(),
    ));
  }

  Ok(())
}

/// Валидирует лимит памяти
pub fn validate_memory_limit(limit_mb: usize) -> Result<()> {
  if limit_mb < 512 {
    return Err(VideoCompilerError::InvalidParameter(
      "Memory limit must be at least 512 MB".to_string(),
    ));
  }

  if limit_mb > 1048576 {
    // 1TB
    return Err(VideoCompilerError::InvalidParameter(
      "Memory limit cannot exceed 1 TB".to_string(),
    ));
  }

  Ok(())
}

/// Валидирует временную директорию
pub fn validate_temp_directory(directory: &str) -> Result<()> {
  if directory.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Temp directory cannot be empty".to_string(),
    ));
  }

  // Проверяем что путь не содержит недопустимых символов
  if directory.contains('\0') {
    return Err(VideoCompilerError::InvalidParameter(
      "Temp directory contains invalid characters".to_string(),
    ));
  }

  Ok(())
}

/// Валидирует уровень логирования
pub fn validate_log_level(level: &str) -> Result<()> {
  let valid_levels = ["trace", "debug", "info", "warn", "error", "off"];

  if !valid_levels.contains(&level.to_lowercase().as_str()) {
    return Err(VideoCompilerError::InvalidParameter(format!(
      "Invalid log level '{}'. Must be one of: {}",
      level,
      valid_levels.join(", ")
    )));
  }

  Ok(())
}

/// Создает настройки по умолчанию
pub fn create_default_settings() -> CompilerSettings {
  CompilerSettings {
    ffmpeg_path: DEFAULT_FFMPEG_PATH.to_string(),
    parallel_jobs: DEFAULT_PARALLEL_JOBS,
    memory_limit_mb: DEFAULT_MEMORY_LIMIT_MB,
    temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
    log_level: DEFAULT_LOG_LEVEL.to_string(),
    hardware_acceleration: DEFAULT_HARDWARE_ACCELERATION,
  }
}

/// Создает рекомендуемые настройки на основе системных ресурсов
pub fn create_recommended_settings() -> RecommendedSettings {
  let cpu_cores = num_cpus::get();
  let memory_gb = estimate_system_memory_gb();

  // Рекомендуем использовать не более 75% CPU и 50% памяти
  let recommended_jobs = (cpu_cores as f64 * 0.75).ceil() as usize;
  let recommended_memory_mb = (memory_gb * 512).min(16384); // Max 16GB

  RecommendedSettings {
    cpu_cores,
    memory_gb,
    parallel_jobs: recommended_jobs.min(8), // Cap at 8 jobs
    settings: CompilerSettings {
      ffmpeg_path: DEFAULT_FFMPEG_PATH.to_string(),
      parallel_jobs: recommended_jobs.min(8),
      memory_limit_mb: recommended_memory_mb,
      temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
      log_level: DEFAULT_LOG_LEVEL.to_string(),
      hardware_acceleration: DEFAULT_HARDWARE_ACCELERATION,
    },
  }
}

/// Оценивает объем системной памяти в ГБ
fn estimate_system_memory_gb() -> usize {
  // Простая эвристика - возвращаем 8 ГБ по умолчанию
  // В реальном приложении можно использовать системные API
  8
}

/// Экспортирует настройки в JSON
pub fn export_settings_to_json(settings: &CompilerSettings) -> Result<String> {
  serde_json::to_string_pretty(settings)
    .map_err(|e| VideoCompilerError::SerializationError(format!("Failed to export settings: {e}")))
}

/// Импортирует настройки из JSON
pub fn import_settings_from_json(json: &str) -> Result<CompilerSettings> {
  let settings: CompilerSettings = serde_json::from_str(json).map_err(|e| {
    VideoCompilerError::SerializationError(format!("Failed to import settings: {e}"))
  })?;

  // Валидируем импортированные настройки
  validate_compiler_settings(&settings)?;

  Ok(settings)
}

/// Создает список пресетов качества
pub fn create_quality_presets() -> Vec<QualityPreset> {
  vec![
    QualityPreset {
      name: quality_presets::low::NAME.to_string(),
      description: quality_presets::low::DESCRIPTION.to_string(),
      bitrate_kbps: quality_presets::low::VIDEO_BITRATE,
      resolution: quality_presets::low::RESOLUTION.to_string(),
      fps: quality_presets::low::FPS,
      codec: quality_presets::low::CODEC.to_string(),
    },
    QualityPreset {
      name: quality_presets::medium::NAME.to_string(),
      description: quality_presets::medium::DESCRIPTION.to_string(),
      bitrate_kbps: quality_presets::medium::VIDEO_BITRATE,
      resolution: quality_presets::medium::RESOLUTION.to_string(),
      fps: quality_presets::medium::FPS,
      codec: quality_presets::medium::CODEC.to_string(),
    },
    QualityPreset {
      name: quality_presets::high::NAME.to_string(),
      description: quality_presets::high::DESCRIPTION.to_string(),
      bitrate_kbps: quality_presets::high::VIDEO_BITRATE,
      resolution: quality_presets::high::RESOLUTION.to_string(),
      fps: quality_presets::high::FPS,
      codec: quality_presets::high::CODEC.to_string(),
    },
    QualityPreset {
      name: quality_presets::ultra::NAME.to_string(),
      description: quality_presets::ultra::DESCRIPTION.to_string(),
      bitrate_kbps: quality_presets::ultra::VIDEO_BITRATE,
      resolution: quality_presets::ultra::RESOLUTION.to_string(),
      fps: quality_presets::ultra::FPS,
      codec: quality_presets::ultra::CODEC.to_string(),
    },
  ]
}

/// Проверяет доступность FFmpeg по указанному пути
pub fn check_ffmpeg_available(path: &str) -> bool {
  if path.is_empty() || path == DEFAULT_FFMPEG_PATH {
    // Для пути по умолчанию предполагаем что FFmpeg в PATH
    return true;
  }

  Path::new(path).exists()
}

/// Определяет оптимальное количество параллельных задач
pub fn calculate_optimal_parallel_jobs(cpu_cores: usize, memory_gb: usize) -> usize {
  // Основываемся на CPU (75% от ядер)
  let cpu_based = (cpu_cores as f64 * 0.75).ceil() as usize;

  // Ограничиваем по памяти (минимум 2GB на задачу)
  let memory_based = memory_gb / 2;

  // Берем минимум и ограничиваем максимум
  cpu_based.min(memory_based).clamp(1, 8)
}

/// Форматирует размер памяти в человекочитаемый формат
pub fn format_memory_size(mb: usize) -> String {
  if mb < 1024 {
    format!("{mb} MB")
  } else {
    let gb = mb as f64 / 1024.0;
    if gb < 10.0 {
      format!("{gb:.1} GB")
    } else {
      format!("{gb:.0} GB")
    }
  }
}

/// Нормализует путь к временной директории
pub fn normalize_temp_path(path: &str) -> String {
  let path = path.trim();

  // Заменяем обратные слеши на прямые для консистентности
  let normalized = path.replace('\\', "/");

  // Убираем завершающий слеш если есть
  if normalized.ends_with('/') && normalized.len() > 1 {
    normalized[..normalized.len() - 1].to_string()
  } else {
    normalized
  }
}

/// Проверяет что настройки изменились
pub fn settings_changed(current: &CompilerSettings, new: &CompilerSettings) -> bool {
  current != new
}

/// Объединяет настройки, применяя только измененные поля
pub fn merge_settings(current: &CompilerSettings, updates: &CompilerSettings) -> CompilerSettings {
  CompilerSettings {
    ffmpeg_path: if updates.ffmpeg_path != current.ffmpeg_path {
      updates.ffmpeg_path.clone()
    } else {
      current.ffmpeg_path.clone()
    },
    parallel_jobs: if updates.parallel_jobs != current.parallel_jobs {
      updates.parallel_jobs
    } else {
      current.parallel_jobs
    },
    memory_limit_mb: if updates.memory_limit_mb != current.memory_limit_mb {
      updates.memory_limit_mb
    } else {
      current.memory_limit_mb
    },
    temp_directory: if updates.temp_directory != current.temp_directory {
      updates.temp_directory.clone()
    } else {
      current.temp_directory.clone()
    },
    log_level: if updates.log_level != current.log_level {
      updates.log_level.clone()
    } else {
      current.log_level.clone()
    },
    hardware_acceleration: if updates.hardware_acceleration != current.hardware_acceleration {
      updates.hardware_acceleration
    } else {
      current.hardware_acceleration
    },
  }
}
