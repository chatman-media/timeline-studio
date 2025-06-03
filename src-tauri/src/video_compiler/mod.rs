//! Video Compiler Module - Центральный модуль компиляции видео
//!
//! Этот модуль отвечает за компиляцию проектов Timeline Studio в финальное видео
//! с использованием FFmpeg. Включает в себя:
//! - Схему данных проекта (ProjectSchema)
//! - Рендерер видео (VideoRenderer)
//! - Генератор превью (PreviewGenerator)
//! - Отслеживание прогресса (ProgressTracker)

pub mod cache;
pub mod error;
pub mod ffmpeg_builder;
pub mod pipeline;
pub mod preview;
pub mod progress;
pub mod renderer;
pub mod schema;

// Re-export основных типов для удобства использования
pub use cache::RenderCache;
pub use error::{Result, VideoCompilerError};
pub use preview::PreviewGenerator;
pub use progress::{RenderJob, RenderProgress};
pub use schema::ProjectSchema;

use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Состояние Video Compiler для Tauri
#[derive(Debug)]
pub struct VideoCompilerState {
  /// Активные задачи рендеринга
  pub active_jobs: Arc<DashMap<String, RenderJob>>,
  /// Кэш рендеринга и превью
  pub cache: Arc<RwLock<RenderCache>>,
  /// Настройки компилятора
  pub settings: Arc<RwLock<CompilerSettings>>,
}

impl VideoCompilerState {
  /// Создать новое состояние Video Compiler
  pub fn new() -> Self {
    Self {
      active_jobs: Arc::new(DashMap::new()),
      cache: Arc::new(RwLock::new(RenderCache::new())),
      settings: Arc::new(RwLock::new(CompilerSettings::default())),
    }
  }
}

impl Default for VideoCompilerState {
  fn default() -> Self {
    Self::new()
  }
}

/// Настройки компилятора видео
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

/// События Video Compiler для WebSocket
#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum VideoCompilerEvent {
  /// Рендеринг начат
  RenderStarted { job_id: String },
  /// Прогресс рендеринга обновлен
  RenderProgress {
    job_id: String,
    progress: RenderProgress,
  },
  /// Рендеринг завершен успешно
  RenderCompleted { job_id: String, output_path: String },
  /// Рендеринг завершился с ошибкой
  RenderFailed { job_id: String, error: String },
  /// Превью сгенерировано
  PreviewGenerated { timestamp: f64, image_data: Vec<u8> },
  /// Кэш обновлен
  CacheUpdated { cache_size_mb: f64 },
}

/// Проверка зависимостей Video Compiler
pub async fn check_dependencies() -> Result<()> {
  // Проверяем наличие FFmpeg
  let output = tokio::process::Command::new("ffmpeg")
    .arg("-version")
    .output()
    .await;

  match output {
    Ok(output) => {
      if output.status.success() {
        log::info!("FFmpeg найден и доступен");
        Ok(())
      } else {
        Err(VideoCompilerError::DependencyMissing(
          "FFmpeg не работает корректно".to_string(),
        ))
      }
    }
    Err(_) => Err(VideoCompilerError::DependencyMissing(
      "FFmpeg не найден в системе. Установите FFmpeg для работы Video Compiler".to_string(),
    )),
  }
}

/// Инициализация Video Compiler модуля
pub async fn initialize() -> Result<VideoCompilerState> {
  log::info!("Инициализация Video Compiler модуля");

  // Проверяем зависимости
  check_dependencies().await?;

  // Создаем состояние
  let state = VideoCompilerState::new();

  // Создаем временную директорию если не существует
  {
    let settings = state.settings.read().await;
    if !settings.temp_directory.exists() {
      tokio::fs::create_dir_all(&settings.temp_directory.clone())
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
    }
  }

  log::info!("Video Compiler модуль успешно инициализирован");
  Ok(state)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_video_compiler_state_creation() {
    let state = VideoCompilerState::new();
    assert_eq!(state.active_jobs.len(), 0);

    let settings = state.settings.read().await;
    assert_eq!(settings.max_concurrent_jobs, 2);
    assert_eq!(settings.cache_size_mb, 512);
  }

  #[tokio::test]
  async fn test_compiler_settings_default() {
    let settings = CompilerSettings::default();
    assert_eq!(settings.max_concurrent_jobs, 2);
    assert_eq!(settings.cache_size_mb, 512);
    assert!(settings.hardware_acceleration);
    assert_eq!(settings.preview_quality, 75);
  }

  #[tokio::test]
  async fn test_check_dependencies() {
    // Тест может не пройти если FFmpeg не установлен, но это ожидаемо
    match check_dependencies().await {
      Ok(_) => println!("FFmpeg найден и работает"),
      Err(e) => println!("FFmpeg недоступен: {:?}", e),
    }
  }

  #[test]
  fn test_video_compiler_event_serialization() {
    let event = VideoCompilerEvent::RenderStarted {
      job_id: "test-123".to_string(),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("RenderStarted"));
    assert!(json.contains("test-123"));
  }
}
