//! Pipeline - Модуль конвейера обработки видео
//!
//! Этот модуль реализует конвейер обработки видео проектов,
//! включая этапы валидации, предобработки, композиции и кодирования.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tokio::sync::RwLock;

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::progress::ProgressTracker;
use crate::video_compiler::schema::ProjectSchema;
use crate::video_compiler::CompilerSettings;

/// Основной конвейер обработки видео
#[derive(Debug)]
pub struct RenderPipeline {
  /// Схема проекта
  project: ProjectSchema,
  /// Этапы конвейера
  stages: Vec<Box<dyn PipelineStage>>,
  /// Трекер прогресса
  progress_tracker: Arc<ProgressTracker>,
  /// Настройки
  settings: Arc<RwLock<CompilerSettings>>,
  /// Контекст выполнения
  context: PipelineContext,
}

impl RenderPipeline {
  /// Создать новый конвейер
  pub async fn new(
    project: ProjectSchema,
    progress_tracker: Arc<ProgressTracker>,
    settings: Arc<RwLock<CompilerSettings>>,
    output_path: PathBuf,
  ) -> Result<Self> {
    let context = PipelineContext::new(project.clone(), output_path);

    let mut pipeline = Self {
      project,
      stages: Vec::new(),
      progress_tracker,
      settings,
      context,
    };

    // Добавляем стандартные этапы
    pipeline.add_default_stages().await?;

    Ok(pipeline)
  }

  /// Добавить стандартные этапы конвейера
  async fn add_default_stages(&mut self) -> Result<()> {
    self.add_stage(Box::new(ValidationStage::new()));
    self.add_stage(Box::new(PreprocessingStage::new()));
    self.add_stage(Box::new(CompositionStage::new()));
    self.add_stage(Box::new(EncodingStage::new()));
    self.add_stage(Box::new(FinalizationStage::new()));
    Ok(())
  }

  /// Добавить этап в конвейер
  pub fn add_stage(&mut self, stage: Box<dyn PipelineStage>) {
    self.stages.push(stage);
  }

  /// Выполнить весь конвейер
  pub async fn execute(&mut self, job_id: &str) -> Result<PathBuf> {
    log::info!("Запуск конвейера обработки для задачи {}", job_id);

    let total_stages = self.stages.len();
    let mut current_stage = 0;

    for stage in &self.stages {
      current_stage += 1;
      let stage_name = stage.name();

      log::info!(
        "Выполнение этапа {}/{}: {}",
        current_stage,
        total_stages,
        stage_name
      );

      // Обновляем прогресс
      let progress_percentage = ((current_stage - 1) as f64 / total_stages as f64) * 100.0;
      self
        .update_progress(job_id, progress_percentage as u64, stage_name)
        .await?;

      // Выполняем этап
      let start_time = SystemTime::now();

      match stage.process(&mut self.context).await {
        Ok(_) => {
          let duration = start_time.elapsed().unwrap_or(Duration::ZERO);
          log::info!("Этап '{}' завершен за {:?}", stage_name, duration);
        }
        Err(e) => {
          log::error!("Ошибка на этапе '{}': {}", stage_name, e);
          return Err(VideoCompilerError::render(
            job_id,
            stage_name,
            e.to_string(),
          ));
        }
      }
    }

    // Финальное обновление прогресса
    self.update_progress(job_id, 100, "Completed").await?;

    log::info!("Конвейер обработки завершен успешно");
    Ok(self.context.output_path.clone())
  }

  /// Обновить прогресс выполнения
  async fn update_progress(&self, job_id: &str, percentage: u64, stage: &str) -> Result<()> {
    let total_frames = (self.project.get_duration() * self.project.timeline.fps as f64) as u64;
    let current_frame = (total_frames * percentage) / 100;

    self
      .progress_tracker
      .update_progress(job_id, current_frame, stage.to_string(), None)
      .await
  }

  /// Отменить выполнение конвейера
  pub async fn cancel(&mut self) -> Result<()> {
    self.context.cancelled = true;
    log::info!("Конвейер отменен");
    Ok(())
  }

  /// Получить статистику выполнения
  pub fn get_statistics(&self) -> PipelineStatistics {
    self.context.statistics.clone()
  }
}

/// Контекст выполнения конвейера
#[derive(Debug)]
pub struct PipelineContext {
  /// Схема проекта
  pub project: ProjectSchema,
  /// Путь к выходному файлу
  pub output_path: PathBuf,
  /// Временная директория
  pub temp_dir: PathBuf,
  /// Промежуточные файлы
  pub intermediate_files: HashMap<String, PathBuf>,
  /// Флаг отмены
  pub cancelled: bool,
  /// Пользовательские данные
  pub user_data: HashMap<String, serde_json::Value>,
  /// Статистика выполнения
  pub statistics: PipelineStatistics,
}

impl PipelineContext {
  /// Создать новый контекст
  pub fn new(project: ProjectSchema, output_path: PathBuf) -> Self {
    let temp_dir = std::env::temp_dir()
      .join("timeline-studio")
      .join("pipeline")
      .join(uuid::Uuid::new_v4().to_string());

    Self {
      project,
      output_path,
      temp_dir,
      intermediate_files: HashMap::new(),
      cancelled: false,
      user_data: HashMap::new(),
      statistics: PipelineStatistics::default(),
    }
  }

  /// Добавить промежуточный файл
  pub fn add_intermediate_file(&mut self, key: String, path: PathBuf) {
    self.intermediate_files.insert(key, path);
  }

  /// Получить промежуточный файл
  pub fn get_intermediate_file(&self, key: &str) -> Option<&PathBuf> {
    self.intermediate_files.get(key)
  }

  /// Проверить, отменено ли выполнение
  pub fn is_cancelled(&self) -> bool {
    self.cancelled
  }

  /// Создать временную директорию
  pub async fn ensure_temp_dir(&self) -> Result<()> {
    if !self.temp_dir.exists() {
      tokio::fs::create_dir_all(&self.temp_dir)
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
    }
    Ok(())
  }

  /// Очистить временные файлы
  pub async fn cleanup(&self) -> Result<()> {
    if self.temp_dir.exists() {
      tokio::fs::remove_dir_all(&self.temp_dir)
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
    }
    Ok(())
  }
}

/// Трейт для этапа конвейера
#[async_trait]
pub trait PipelineStage: Send + Sync + std::fmt::Debug {
  /// Выполнить этап
  async fn process(&self, context: &mut PipelineContext) -> Result<()>;

  /// Получить название этапа
  fn name(&self) -> &str;

  /// Получить оценочную длительность этапа
  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(10)
  }

  /// Проверить, можно ли пропустить этап
  fn can_skip(&self, _context: &PipelineContext) -> bool {
    false
  }
}

/// Этап валидации проекта
#[derive(Debug)]
pub struct ValidationStage;

impl ValidationStage {
  pub fn new() -> Self {
    Self
  }
}

#[async_trait]
impl PipelineStage for ValidationStage {
  async fn process(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("Начало валидации проекта");

    // Валидация схемы проекта
    context
      .project
      .validate()
      .map_err(VideoCompilerError::validation)?;

    // Проверка существования медиа файлов
    for track in &context.project.tracks {
      for clip in &track.clips {
        if !clip.source_path.exists() {
          return Err(VideoCompilerError::media_file(
            clip.source_path.to_string_lossy(),
            "Файл не найден",
          ));
        }
      }
    }

    // Создание временной директории
    context.ensure_temp_dir().await?;

    context.statistics.validation_time = SystemTime::now();
    log::info!("Валидация проекта завершена успешно");
    Ok(())
  }

  fn name(&self) -> &str {
    "Validation"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(5)
  }
}

/// Этап предобработки медиа
#[derive(Debug)]
pub struct PreprocessingStage;

impl PreprocessingStage {
  pub fn new() -> Self {
    Self
  }
}

#[async_trait]
impl PipelineStage for PreprocessingStage {
  async fn process(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("Начало предобработки медиа");

    // Анализ медиа файлов
    for track in &context.project.tracks {
      for clip in &track.clips {
        self.analyze_media_file(&clip.source_path).await?;
      }
    }

    // Подготовка промежуточных файлов
    self.prepare_intermediate_files(context).await?;

    context.statistics.preprocessing_time = SystemTime::now();
    log::info!("Предобработка медиа завершена");
    Ok(())
  }

  fn name(&self) -> &str {
    "Preprocessing"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(30)
  }
}

impl PreprocessingStage {
  /// Анализ медиа файла
  async fn analyze_media_file(&self, path: &Path) -> Result<()> {
    // Проверяем доступность файла
    if !path.exists() {
      return Err(VideoCompilerError::media_file(
        path.to_string_lossy().to_string(),
        "Файл не существует".to_string(),
      ));
    }

    // Здесь можно добавить дополнительную логику анализа
    log::debug!("Анализ файла: {:?}", path);
    Ok(())
  }

  /// Подготовка промежуточных файлов
  async fn prepare_intermediate_files(&self, context: &mut PipelineContext) -> Result<()> {
    // Создаем пути для промежуточных файлов
    let video_temp = context.temp_dir.join("video_temp.mp4");
    let audio_temp = context.temp_dir.join("audio_temp.wav");

    context.add_intermediate_file("video_temp".to_string(), video_temp);
    context.add_intermediate_file("audio_temp".to_string(), audio_temp);

    Ok(())
  }
}

/// Этап композиции видео
#[derive(Debug)]
pub struct CompositionStage;

impl CompositionStage {
  pub fn new() -> Self {
    Self
  }
}

#[async_trait]
impl PipelineStage for CompositionStage {
  async fn process(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("Начало композиции видео");

    // Проверка отмены
    if context.is_cancelled() {
      return Err(VideoCompilerError::CancelledError(
        "Композиция отменена".to_string(),
      ));
    }

    // Композиция видео дорожек
    self.compose_video_tracks(context).await?;

    // Композиция аудио дорожек
    self.compose_audio_tracks(context).await?;

    context.statistics.composition_time = SystemTime::now();
    log::info!("Композиция видео завершена");
    Ok(())
  }

  fn name(&self) -> &str {
    "Composition"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(120)
  }
}

impl CompositionStage {
  /// Композиция видео дорожек
  async fn compose_video_tracks(&self, context: &mut PipelineContext) -> Result<()> {
    let video_tracks: Vec<_> = context
      .project
      .tracks
      .iter()
      .filter(|t| t.track_type == crate::video_compiler::schema::TrackType::Video)
      .collect();

    if video_tracks.is_empty() {
      return Err(VideoCompilerError::validation(
        "Нет видео дорожек для композиции",
      ));
    }

    log::debug!("Композиция {} видео дорожек", video_tracks.len());
    // Здесь будет логика композиции видео
    Ok(())
  }

  /// Композиция аудио дорожек
  async fn compose_audio_tracks(&self, context: &mut PipelineContext) -> Result<()> {
    let audio_tracks: Vec<_> = context
      .project
      .tracks
      .iter()
      .filter(|t| t.track_type == crate::video_compiler::schema::TrackType::Audio)
      .collect();

    log::debug!("Композиция {} аудио дорожек", audio_tracks.len());
    // Здесь будет логика композиции аудио
    Ok(())
  }
}

/// Этап кодирования
#[derive(Debug)]
pub struct EncodingStage;

impl EncodingStage {
  pub fn new() -> Self {
    Self
  }
}

#[async_trait]
impl PipelineStage for EncodingStage {
  async fn process(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("Начало кодирования видео");

    // Проверка отмены
    if context.is_cancelled() {
      return Err(VideoCompilerError::CancelledError(
        "Кодирование отменено".to_string(),
      ));
    }

    // Кодирование финального видео
    self.encode_final_video(context).await?;

    context.statistics.encoding_time = SystemTime::now();
    log::info!("Кодирование видео завершено");
    Ok(())
  }

  fn name(&self) -> &str {
    "Encoding"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(300)
  }
}

impl EncodingStage {
  /// Кодирование финального видео
  async fn encode_final_video(&self, context: &mut PipelineContext) -> Result<()> {
    log::debug!("Кодирование в файл: {:?}", context.output_path);

    // Создаем родительскую директорию если не существует
    if let Some(parent) = context.output_path.parent() {
      tokio::fs::create_dir_all(parent)
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
    }

    // Здесь будет логика кодирования через FFmpeg
    Ok(())
  }
}

/// Этап финализации
#[derive(Debug)]
pub struct FinalizationStage;

impl FinalizationStage {
  pub fn new() -> Self {
    Self
  }
}

#[async_trait]
impl PipelineStage for FinalizationStage {
  async fn process(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("Начало финализации");

    // Проверка выходного файла
    if !context.output_path.exists() {
      return Err(VideoCompilerError::render(
        "finalization",
        "file_check",
        "Выходной файл не был создан",
      ));
    }

    // Очистка временных файлов
    context.cleanup().await?;

    context.statistics.finalization_time = SystemTime::now();
    log::info!("Финализация завершена");
    Ok(())
  }

  fn name(&self) -> &str {
    "Finalization"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(5)
  }
}

/// Статистика выполнения конвейера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineStatistics {
  /// Время начала валидации
  pub validation_time: SystemTime,
  /// Время начала предобработки
  pub preprocessing_time: SystemTime,
  /// Время начала композиции
  pub composition_time: SystemTime,
  /// Время начала кодирования
  pub encoding_time: SystemTime,
  /// Время финализации
  pub finalization_time: SystemTime,
  /// Количество обработанных кадров
  pub frames_processed: u64,
  /// Использованная память (байты)
  pub memory_used: u64,
  /// Количество ошибок
  pub error_count: u32,
  /// Количество предупреждений
  pub warning_count: u32,
}

impl Default for PipelineStatistics {
  fn default() -> Self {
    let now = SystemTime::now();
    Self {
      validation_time: now,
      preprocessing_time: now,
      composition_time: now,
      encoding_time: now,
      finalization_time: now,
      frames_processed: 0,
      memory_used: 0,
      error_count: 0,
      warning_count: 0,
    }
  }
}

impl PipelineStatistics {
  /// Получить общее время выполнения
  pub fn total_duration(&self) -> Duration {
    if let Ok(duration) = self.finalization_time.duration_since(self.validation_time) {
      duration
    } else {
      Duration::ZERO
    }
  }

  /// Добавить ошибку
  pub fn add_error(&mut self) {
    self.error_count += 1;
  }

  /// Добавить предупреждение
  pub fn add_warning(&mut self) {
    self.warning_count += 1;
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::progress::ProgressUpdate;
  use crate::video_compiler::schema::ProjectSchema;
  use tokio::sync::mpsc;

  async fn create_test_pipeline() -> RenderPipeline {
    let project = ProjectSchema::new("Test Project".to_string());
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let output_path = PathBuf::from("/tmp/test_output.mp4");

    RenderPipeline::new(project, progress_tracker, settings, output_path)
      .await
      .unwrap()
  }

  #[tokio::test]
  async fn test_pipeline_creation() {
    let pipeline = create_test_pipeline().await;
    assert_eq!(pipeline.stages.len(), 5); // 5 стандартных этапов
  }

  #[tokio::test]
  async fn test_pipeline_context() {
    let project = ProjectSchema::new("Test".to_string());
    let output_path = PathBuf::from("/tmp/test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    // Тест добавления промежуточного файла
    let temp_file = PathBuf::from("/tmp/temp.mp4");
    context.add_intermediate_file("temp".to_string(), temp_file.clone());

    assert_eq!(context.get_intermediate_file("temp"), Some(&temp_file));
    assert_eq!(context.get_intermediate_file("nonexistent"), None);
  }

  #[tokio::test]
  async fn test_validation_stage() {
    let stage = ValidationStage::new();
    assert_eq!(stage.name(), "Validation");
    assert!(!stage.can_skip(&PipelineContext::new(
      ProjectSchema::new("Test".to_string()),
      PathBuf::from("/tmp/test.mp4")
    )));
  }

  #[tokio::test]
  async fn test_pipeline_statistics() {
    let mut stats = PipelineStatistics::default();

    assert_eq!(stats.error_count, 0);
    assert_eq!(stats.warning_count, 0);

    stats.add_error();
    stats.add_warning();

    assert_eq!(stats.error_count, 1);
    assert_eq!(stats.warning_count, 1);
  }

  #[tokio::test]
  async fn test_stage_estimated_duration() {
    let validation_stage = ValidationStage::new();
    let preprocessing_stage = PreprocessingStage::new();
    let composition_stage = CompositionStage::new();
    let encoding_stage = EncodingStage::new();
    let finalization_stage = FinalizationStage::new();

    assert_eq!(
      validation_stage.estimated_duration(),
      Duration::from_secs(5)
    );
    assert_eq!(
      preprocessing_stage.estimated_duration(),
      Duration::from_secs(30)
    );
    assert_eq!(
      composition_stage.estimated_duration(),
      Duration::from_secs(120)
    );
    assert_eq!(
      encoding_stage.estimated_duration(),
      Duration::from_secs(300)
    );
    assert_eq!(
      finalization_stage.estimated_duration(),
      Duration::from_secs(5)
    );
  }

  #[tokio::test]
  async fn test_pipeline_cancel() {
    let mut pipeline = create_test_pipeline().await;

    let result = pipeline.cancel().await;
    assert!(result.is_ok());
    assert!(pipeline.context.is_cancelled());
  }

  #[tokio::test]
  async fn test_context_temp_dir_creation() {
    let project = ProjectSchema::new("Test".to_string());
    let output_path = PathBuf::from("/tmp/test.mp4");
    let context = PipelineContext::new(project, output_path);

    // Проверяем, что временная директория содержит нужные компоненты
    let temp_dir_str = context.temp_dir.to_string_lossy();
    assert!(temp_dir_str.contains("timeline-studio"));
    assert!(temp_dir_str.contains("pipeline"));
  }
}
