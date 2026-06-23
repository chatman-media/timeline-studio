//! Бизнес-логика для команд получения информации
//! Note: tauri::VERSION cannot be referenced here (Tauri-free crate).
//! The commands layer passes it as a parameter.

use super::types::*;
use std::process::Command;
use sysinfo::{Disks, System};
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};

/// Получить версию FFmpeg из вывода команды
pub fn parse_ffmpeg_version(output: &str) -> String {
  output
    .lines()
    .next()
    .unwrap_or("Unknown version")
    .to_string()
}

/// Проверить доступность FFmpeg
pub fn check_ffmpeg_availability(ffmpeg_path: &str) -> bool {
  Command::new(ffmpeg_path)
    .arg("-version")
    .output()
    .map(|output| output.status.success())
    .unwrap_or(false)
}

/// Парсить поддерживаемые форматы из вывода FFmpeg
pub fn parse_supported_formats(formats_output: &str) -> Vec<String> {
  formats_output
    .lines()
    .skip(4) // Пропускаем заголовок
    .filter_map(|line| {
      let parts: Vec<&str> = line.split_whitespace().collect();
      if parts.len() >= 2 && parts[0].contains('E') {
        // E означает, что формат поддерживает кодирование
        Some(parts[1].to_string())
      } else {
        None
      }
    })
    .collect()
}

/// Парсить видео кодеки из вывода FFmpeg
pub fn parse_video_codecs(codecs_output: &str) -> Vec<String> {
  codecs_output
    .lines()
    .skip(10) // Пропускаем заголовок
    .filter_map(|line| {
      let parts: Vec<&str> = line.split_whitespace().collect();
      if parts.len() >= 2 {
        let flags = parts[0];
        // Проверяем, что это видео кодек (V) и поддерживает кодирование (E)
        if flags.contains('V') && flags.contains('E') {
          Some(parts[1].to_string())
        } else {
          None
        }
      } else {
        None
      }
    })
    .collect()
}

/// Парсить аудио кодеки из вывода FFmpeg
pub fn parse_audio_codecs(codecs_output: &str) -> Vec<String> {
  codecs_output
    .lines()
    .skip(10) // Пропускаем заголовок
    .filter_map(|line| {
      let parts: Vec<&str> = line.split_whitespace().collect();
      if parts.len() >= 2 {
        let flags = parts[0];
        // Проверяем, что это аудио кодек (A) и поддерживает кодирование (E)
        if flags.contains('A') && flags.contains('E') {
          Some(parts[1].to_string())
        } else {
          None
        }
      } else {
        None
      }
    })
    .collect()
}

/// Парсить фильтры из вывода FFmpeg
pub fn parse_available_filters(filters_output: &str) -> Vec<String> {
  filters_output
    .lines()
    .skip(8) // Пропускаем заголовок
    .filter_map(|line| {
      let parts: Vec<&str> = line.split_whitespace().collect();
      if parts.len() >= 2 {
        Some(parts[1].to_string())
      } else {
        None
      }
    })
    .collect()
}

/// Создать информацию о системе
/// tauri_version передаётся извне (из Tauri-слоя), чтобы этот крейт не зависел от tauri.
pub fn create_system_info(tauri_version: &str) -> SystemInfo {
  let cpu_count = num_cpus::get();
  let total_memory = System::new_all().total_memory();
  let os_info = os_info::get();

  SystemInfo {
    os: OsInfo {
      os_type: os_info.os_type().to_string(),
      version: os_info.version().to_string(),
      architecture: std::env::consts::ARCH.to_string(),
    },
    cpu: CpuInfo {
      cores: cpu_count,
      arch: std::env::consts::ARCH.to_string(),
    },
    memory: MemoryInfo {
      total_bytes: total_memory,
      total_mb: total_memory / 1024,
      total_gb: total_memory / (1024 * 1024),
    },
    runtime: RuntimeInfo {
      rust_version: env!("CARGO_PKG_VERSION").to_string(),
      tauri_version: tauri_version.to_string(),
    },
  }
}

/// Получить информацию о дисковом пространстве
pub fn get_disk_space_info(path: &str) -> Result<DiskSpaceInfo> {
  let disks = Disks::new_with_refreshed_list();
  let path_disk = disks
    .list()
    .iter()
    .find(|disk| path.starts_with(disk.mount_point().to_str().unwrap_or("")))
    .ok_or_else(|| VideoCompilerError::InternalError(format!("No disk found for path: {path}")))?;

  Ok(DiskSpaceInfo {
    mount_point: path_disk.mount_point().to_str().unwrap_or("").to_string(),
    total_bytes: path_disk.total_space(),
    free_bytes: path_disk.available_space(),
    used_bytes: path_disk.total_space() - path_disk.available_space(),
    free_percentage: (path_disk.available_space() as f64 / path_disk.total_space() as f64) * 100.0,
  })
}

/// Создать конфигурацию компилятора
pub fn create_compiler_config(
  ffmpeg_path: String,
  hardware_acceleration: bool,
  max_concurrent_jobs: usize,
  temp_directory: String,
) -> CompilerConfig {
  CompilerConfig {
    ffmpeg_path,
    hardware_acceleration,
    gpu_index: None,
    parallel_jobs: max_concurrent_jobs,
    memory_limit_mb: None,
    temp_directory,
    log_level: "info".to_string(),
  }
}

/// Создать статистику производительности
pub fn create_performance_stats(
  active_jobs_count: usize,
  cache_total_bytes: usize,
  cache_preview_bytes: usize,
) -> PerformanceStats {
  let mut sys = System::new_all();
  sys.refresh_memory();
  sys.refresh_cpu_usage();

  let total_memory = sys.total_memory();
  let used_memory = sys.used_memory();
  let free_memory = total_memory - used_memory;

  PerformanceStats {
    active_render_jobs: active_jobs_count,
    memory: MemoryStats {
      used_mb: used_memory / 1024,
      free_mb: free_memory / 1024,
      total_mb: total_memory / 1024,
      usage_percentage: (used_memory as f64 / total_memory as f64) * 100.0,
    },
    cache: InfoCacheStats {
      size_mb: cache_total_bytes as u64 / (1024 * 1024),
      entries: cache_preview_bytes as u64 / 1024, // Приблизительно
    },
    cpu_usage: sys.global_cpu_usage(),
  }
}
