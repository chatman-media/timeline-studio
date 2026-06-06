//! Pipeline Stages - Модули этапов конвейера обработки видео

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use crate::video_compiler::error::Result;
use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;
use crate::video_compiler::progress::ProgressTracker;
use crate::video_compiler::schema::ProjectSchema;

// Модули этапов
pub mod composition;
pub mod encoding;
pub mod finalization;
pub mod preprocessing;
pub mod validation;

// Re-export этапов
pub use composition::CompositionStage;
pub use encoding::EncodingStage;
pub use finalization::FinalizationStage;
pub use preprocessing::PreprocessingStage;
pub use validation::ValidationStage;

/// Трейт для этапа конвейера
#[async_trait]
pub trait PipelineStage: Send + Sync {
  /// Обработать этап
  async fn process(&self, context: &mut PipelineContext) -> Result<()>;

  /// Название этапа
  fn name(&self) -> &str;

  /// Предполагаемая длительность
  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(30)
  }

  /// Можно ли пропустить этап
  fn can_skip(&self, _context: &PipelineContext) -> bool {
    false
  }
}

/// Контекст выполнения конвейера
#[derive(Debug, Clone)]
pub struct PipelineContext {
  /// Схема проекта
  pub project: ProjectSchema,
  /// Путь к выходному файлу
  pub output_path: PathBuf,
  /// Временная директория
  pub temp_dir: PathBuf,
  /// Промежуточные файлы
  pub intermediate_files: HashMap<String, PathBuf>,
  /// Пользовательские данные
  pub user_data: HashMap<String, String>,
  /// Флаг отмены
  pub cancelled: bool,
  /// ID текущей задачи
  pub current_job_id: Option<String>,
  /// FFmpeg builder
  pub ffmpeg_builder: Option<FFmpegBuilder>,
  /// Трекер прогресса
  pub progress_tracker: Option<Arc<ProgressTracker>>,
}

impl PipelineContext {
  /// Создать новый контекст
  pub fn new(project: ProjectSchema, output_path: PathBuf) -> Self {
    let temp_dir = std::env::temp_dir()
      .join("timeline-studio-pipeline")
      .join(uuid::Uuid::new_v4().to_string());

    Self {
      project,
      output_path,
      temp_dir,
      intermediate_files: HashMap::new(),
      user_data: HashMap::new(),
      cancelled: false,
      current_job_id: None,
      ffmpeg_builder: None,
      progress_tracker: None,
    }
  }

  /// Добавить промежуточный файл
  pub fn add_intermediate_file(&mut self, key: String, path: PathBuf) {
    log::debug!("Добавляем промежуточный файл: {key} -> {path:?}");
    self.intermediate_files.insert(key, path);
  }

  /// Получить промежуточный файл
  pub fn get_intermediate_file(&self, key: &str) -> Option<&PathBuf> {
    self.intermediate_files.get(key)
  }

  /// Установить пользовательские данные
  pub fn set_user_data<T: serde::Serialize>(&mut self, key: String, value: T) -> Result<()> {
    let serialized = serde_json::to_string(&value).map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::SerializationError(e.to_string())
    })?;
    self.user_data.insert(key, serialized);
    Ok(())
  }

  /// Получить пользовательские данные
  pub fn get_user_data<T: serde::de::DeserializeOwned>(&self, key: &str) -> Option<T> {
    self
      .user_data
      .get(key)
      .and_then(|data| serde_json::from_str(data).ok())
  }

  /// Проверить, отменена ли обработка
  pub fn is_cancelled(&self) -> bool {
    self.cancelled
  }

  /// Создать временную директорию
  pub async fn ensure_temp_dir(&self) -> Result<()> {
    if !self.temp_dir.exists() {
      tokio::fs::create_dir_all(&self.temp_dir)
        .await
        .map_err(|e| crate::video_compiler::error::VideoCompilerError::Io(e.to_string()))?;
      log::debug!("Создана временная директория: {:?}", self.temp_dir);
    }
    Ok(())
  }

  /// Очистить временные файлы
  pub async fn cleanup(&self) -> Result<()> {
    if self.temp_dir.exists() {
      tokio::fs::remove_dir_all(&self.temp_dir)
        .await
        .map_err(|e| {
          log::warn!("Не удалось удалить временную директорию: {e}");
          crate::video_compiler::error::VideoCompilerError::Io(e.to_string())
        })?;
      log::debug!("Очищена временная директория: {:?}", self.temp_dir);
    }
    Ok(())
  }

  /// Получить путь к временному файлу
  pub fn get_temp_file_path(&self, filename: &str) -> PathBuf {
    self.temp_dir.join(filename)
  }

  /// Отправить прогресс
  pub async fn update_progress(&self, percentage: u64, stage: &str) -> Result<()> {
    if let (Some(tracker), Some(job_id)) = (&self.progress_tracker, &self.current_job_id) {
      tracker
        .update_progress(job_id, percentage, stage.to_string(), None)
        .await
        .unwrap_or_else(|e| {
          log::warn!("Failed to update progress: {e:?}");
        });
    }
    Ok(())
  }
}

/// Статистика выполнения конвейера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineStatistics {
  /// Общее время выполнения
  pub total_duration: Duration,
  /// Время выполнения каждого этапа
  pub stage_durations: HashMap<String, Duration>,
  /// Размер выходного файла
  pub output_file_size: u64,
  /// Количество обработанных кадров
  pub frames_processed: u64,
}

impl Default for PipelineStatistics {
  fn default() -> Self {
    Self {
      total_duration: Duration::ZERO,
      stage_durations: HashMap::new(),
      output_file_size: 0,
      frames_processed: 0,
    }
  }
}
