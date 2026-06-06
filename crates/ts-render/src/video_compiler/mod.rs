//! Тонкий фасад вокруг вынесенного `core/` (без Tauri/services/commands/registry).
//! Сохраняет module-путь `crate::video_compiler::*`, на который ссылается код core/,
//! поэтому исходники core/ переехали без переписывания `use`.

pub mod core;

pub use core::error::{Result, VideoCompilerError};
pub use core::progress::RenderProgress;
pub use core::{
  cache, error, ffmpeg_builder, ffmpeg_executor, frame_extraction, gpu, pipeline, preview,
  progress, renderer, schema,
};

use serde::{Deserialize, Serialize};

/// Настройки компилятора видео (скопировано из монолита; убран `ServiceContainer`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilerSettings {
  /// Максимальное количество одновременных задач рендеринга
  pub max_concurrent_jobs: usize,
  /// Размер кэша в мегабайтах
  pub cache_size_mb: usize,
  /// Временная директория для промежуточных файлов
  pub temp_directory: std::path::PathBuf,
  /// Путь к FFmpeg (если не в системном PATH)
  pub ffmpeg_path: Option<std::path::PathBuf>,
  /// Использование аппаратного ускорения
  pub hardware_acceleration: bool,
  /// Качество превью (от 1 до 100)
  pub preview_quality: u8,
}

impl Default for CompilerSettings {
  fn default() -> Self {
    Self {
      max_concurrent_jobs: 2,
      cache_size_mb: 512,
      temp_directory: std::env::temp_dir().join("timeline-studio"),
      ffmpeg_path: None,
      hardware_acceleration: true,
      preview_quality: 75,
    }
  }
}

#[cfg(test)]
pub mod tests;
