//! Типы для настроек компилятора

use serde::{Deserialize, Serialize};

/// Настройки компилятора
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CompilerSettings {
  pub ffmpeg_path: String,
  pub parallel_jobs: usize,
  pub memory_limit_mb: usize,
  pub temp_directory: String,
  pub log_level: String,
  pub hardware_acceleration: bool,
}

/// Рекомендуемые настройки
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendedSettings {
  pub cpu_cores: usize,
  pub memory_gb: usize,
  pub parallel_jobs: usize,
  pub settings: CompilerSettings,
}

/// Пресет качества
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct QualityPreset {
  pub name: String,
  pub description: String,
  pub bitrate_kbps: u32,
  pub resolution: String,
  pub fps: u32,
  pub codec: String,
}

/// Параметры обновления настроек
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSettingsParams {
  pub settings: CompilerSettings,
}

/// Параметры установки пути к FFmpeg
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetFFmpegPathParams {
  pub path: String,
}

/// Параметры установки параллельных задач
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetParallelJobsParams {
  pub jobs: usize,
}

/// Параметры установки лимита памяти
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetMemoryLimitParams {
  pub limit_mb: usize,
}

/// Параметры установки временной директории
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetTempDirectoryParams {
  pub directory: String,
}

/// Параметры установки уровня логирования
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetLogLevelParams {
  pub level: String,
}

/// Параметры импорта настроек
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportSettingsParams {
  pub settings_json: String,
}
