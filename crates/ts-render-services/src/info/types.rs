//! Типы для команд получения информации о системе и компиляторе

use serde::{Deserialize, Serialize};

/// Информация о системе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
  pub os: OsInfo,
  pub cpu: CpuInfo,
  pub memory: MemoryInfo,
  pub runtime: RuntimeInfo,
}

/// Информация об операционной системе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OsInfo {
  pub os_type: String,
  pub version: String,
  pub architecture: String,
}

/// Информация о процессоре
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuInfo {
  pub cores: usize,
  pub arch: String,
}

/// Информация о памяти
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryInfo {
  pub total_bytes: u64,
  pub total_mb: u64,
  pub total_gb: u64,
}

/// Информация о runtime окружении
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeInfo {
  pub rust_version: String,
  pub tauri_version: String,
}

/// Информация о дисковом пространстве
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskSpaceInfo {
  pub mount_point: String,
  pub total_bytes: u64,
  pub free_bytes: u64,
  pub used_bytes: u64,
  pub free_percentage: f64,
}

/// Конфигурация компилятора
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilerConfig {
  pub ffmpeg_path: String,
  pub hardware_acceleration: bool,
  pub gpu_index: Option<usize>,
  pub parallel_jobs: usize,
  pub memory_limit_mb: Option<u64>,
  pub temp_directory: String,
  pub log_level: String,
}

/// Статистика производительности
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceStats {
  pub active_render_jobs: usize,
  pub memory: MemoryStats,
  pub cache: InfoCacheStats,
  pub cpu_usage: f32,
}

/// Статистика памяти
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
  pub used_mb: u64,
  pub free_mb: u64,
  pub total_mb: u64,
  pub usage_percentage: f64,
}

/// Статистика кэша для информационных команд
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InfoCacheStats {
  pub size_mb: u64,
  pub entries: u64,
}
