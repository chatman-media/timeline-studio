//! Refactored Pipeline - Модульный конвейер обработки видео

use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;
use crate::video_compiler::progress::ProgressTracker;
use crate::video_compiler::schema::ProjectSchema;
use crate::video_compiler::CompilerSettings;

use super::stages::{
  CompositionStage, EncodingStage, FinalizationStage, PipelineContext, PipelineStage,
  PipelineStatistics, PreprocessingStage, ValidationStage,
};

/// Основной конвейер обработки видео
pub struct RenderPipeline {
  /// Схема проекта
  project: ProjectSchema,
  /// Этапы конвейера
  stages: Vec<Box<dyn PipelineStage>>,
  /// Трекер прогресса
  #[allow(dead_code)]
  progress_tracker: Arc<ProgressTracker>,
  /// Настройки
  settings: Arc<RwLock<CompilerSettings>>,
  /// Контекст выполнения
  context: PipelineContext,
  /// Статистика выполнения
  statistics: PipelineStatistics,
  /// Время начала обработки
  start_time: Option<Instant>,
}

impl RenderPipeline {
  /// Создать новый конвейер
  pub async fn new(
    project: ProjectSchema,
    progress_tracker: Arc<ProgressTracker>,
    settings: Arc<RwLock<CompilerSettings>>,
    output_path: PathBuf,
  ) -> Result<Self> {
    let mut context = PipelineContext::new(project.clone(), output_path);
    let ffmpeg_builder = FFmpegBuilder::new(project.clone());

    // Добавляем ffmpeg_builder и progress_tracker в контекст
    context.ffmpeg_builder = Some(ffmpeg_builder);
    context.progress_tracker = Some(progress_tracker.clone());

    let mut pipeline = Self {
      project,
      stages: Vec::new(),
      progress_tracker,
      settings,
      context,
      statistics: PipelineStatistics::default(),
      start_time: None,
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
    log::debug!("Добавлен этап: {}", stage.name());
    self.stages.push(stage);
  }

  /// Вставить этап в определенную позицию
  pub fn insert_stage(&mut self, index: usize, stage: Box<dyn PipelineStage>) {
    if index <= self.stages.len() {
      log::debug!("Вставлен этап {} на позицию {}", stage.name(), index);
      self.stages.insert(index, stage);
    }
  }

  /// Удалить этап по имени
  pub fn remove_stage(&mut self, name: &str) -> bool {
    if let Some(pos) = self.stages.iter().position(|stage| stage.name() == name) {
      let removed = self.stages.remove(pos);
      log::debug!("Удален этап: {}", removed.name());
      true
    } else {
      false
    }
  }

  /// Получить список этапов
  pub fn get_stage_names(&self) -> Vec<String> {
    self
      .stages
      .iter()
      .map(|stage| stage.name().to_string())
      .collect()
  }

  /// Выполнить весь конвейер
  pub async fn execute(&mut self, job_id: &str) -> Result<PathBuf> {
    self.start_time = Some(Instant::now());

    log::info!("=== Запуск конвейера обработки ===");
    log::info!("ID задачи: {job_id}");
    log::info!("Проект: {}", self.project.metadata.name);
    log::info!("Выходной файл: {:?}", self.context.output_path);
    log::info!("Временная директория: {:?}", self.context.temp_dir);
    log::info!("Количество этапов: {}", self.stages.len());

    // Устанавливаем ID текущей задачи в контекст
    self.context.current_job_id = Some(job_id.to_string());

    // Создаем временную директорию
    self.context.ensure_temp_dir().await?;

    // Вычисляем общую оценочную длительность всех этапов
    let total_estimated_duration: Duration = self
      .stages
      .iter()
      .map(|stage| stage.estimated_duration())
      .sum();

    log::info!("⏱️ Оценочная длительность: {total_estimated_duration:?}");

    // Выполняем каждый этап
    let mut _current_progress = 0u64;
    let progress_per_stage = 100 / self.stages.len() as u64;

    for (index, stage) in self.stages.iter().enumerate() {
      if self.context.is_cancelled() {
        log::warn!("⚠️ Обработка отменена пользователем");
        self.cleanup().await?;
        return Err(VideoCompilerError::CancelledError(
          "Обработка отменена".to_string(),
        ));
      }

      let stage_start = Instant::now();
      log::info!(
        "🚀 Этап {}/{}: {}",
        index + 1,
        self.stages.len(),
        stage.name()
      );

      // Проверяем, можно ли пропустить этап
      if stage.can_skip(&self.context) {
        log::info!("⏭️ Этап {} пропущен", stage.name());
        _current_progress += progress_per_stage;
        continue;
      }

      // Выполняем этап
      match stage.process(&mut self.context).await {
        Ok(_) => {
          let stage_duration = stage_start.elapsed();
          self
            .statistics
            .stage_durations
            .insert(stage.name().to_string(), stage_duration);

          _current_progress += progress_per_stage;
          log::info!("✅ Этап {} завершен за {:?}", stage.name(), stage_duration);
        }
        Err(e) => {
          log::error!("❌ Ошибка на этапе {}: {}", stage.name(), e);
          self.cleanup().await?;
          return Err(e);
        }
      }
    }

    // Финализация статистики
    if let Some(start_time) = self.start_time {
      self.statistics.total_duration = start_time.elapsed();
    }

    if let Ok(metadata) = tokio::fs::metadata(&self.context.output_path).await {
      self.statistics.output_file_size = metadata.len();
    }

    log::info!("🎉 Конвейер завершен успешно!");
    log::info!("📊 Общее время: {:?}", self.statistics.total_duration);
    log::info!("📁 Результат: {:?}", self.context.output_path);

    Ok(self.context.output_path.clone())
  }

  /// Отменить выполнение конвейера
  pub async fn cancel(&mut self) -> Result<()> {
    log::warn!("🛑 Отмена конвейера...");
    self.context.cancelled = true;
    self.cleanup().await
  }

  /// Очистить временные файлы
  async fn cleanup(&self) -> Result<()> {
    log::info!("🧹 Очистка ресурсов...");

    if let Err(e) = self.context.cleanup().await {
      log::warn!("⚠️ Ошибка при очистке: {e}");
    }

    Ok(())
  }

  /// Получить статистику выполнения
  pub fn get_statistics(&self) -> &PipelineStatistics {
    &self.statistics
  }

  /// Получить контекст выполнения
  pub fn get_context(&self) -> &PipelineContext {
    &self.context
  }

  /// Получить мутабельный контекст выполнения
  #[allow(dead_code)]
  pub fn get_context_mut(&mut self) -> &mut PipelineContext {
    &mut self.context
  }

  /// Проверить, выполняется ли конвейер
  pub fn is_running(&self) -> bool {
    self.start_time.is_some() && !self.context.is_cancelled()
  }

  /// Получить прогресс выполнения (0-100)
  pub async fn get_progress(&self) -> u64 {
    // Здесь можно добавить более сложную логику вычисления прогресса
    // на основе текущего этапа и его прогресса
    0
  }

  /// Обновить настройки конвейера
  pub async fn update_settings(&mut self, new_settings: CompilerSettings) -> Result<()> {
    let mut settings = self.settings.write().await;
    *settings = new_settings;
    log::debug!("Настройки конвейера обновлены");
    Ok(())
  }

  /// Валидация конфигурации перед запуском
  pub async fn validate_configuration(&self) -> Result<()> {
    log::info!("🔍 Валидация конфигурации конвейера...");

    // Проверяем наличие этапов
    if self.stages.is_empty() {
      return Err(VideoCompilerError::ValidationError(
        "Конвейер не содержит этапов".to_string(),
      ));
    }

    // Проверяем валидность схемы проекта
    if self.project.metadata.name.is_empty() {
      return Err(VideoCompilerError::ValidationError(
        "Название проекта не может быть пустым".to_string(),
      ));
    }

    // Проверяем выходную директорию
    if let Some(parent) = self.context.output_path.parent() {
      if !parent.exists() {
        return Err(VideoCompilerError::ValidationError(format!(
          "Выходная директория не существует: {parent:?}"
        )));
      }
    }

    log::info!("✅ Конфигурация валидна");
    Ok(())
  }

  /// Создать резюме выполнения
  pub fn create_execution_summary(&self) -> ExecutionSummary {
    ExecutionSummary {
      project_name: self.project.metadata.name.clone(),
      total_stages: self.stages.len(),
      completed_stages: self.statistics.stage_durations.len(),
      total_duration: self.statistics.total_duration,
      output_file: self.context.output_path.clone(),
      output_file_size: self.statistics.output_file_size,
      success: !self.context.is_cancelled(),
      stage_details: self.statistics.stage_durations.clone(),
    }
  }
}

/// Построитель конвейера для удобной конфигурации
pub struct PipelineBuilder {
  project: Option<ProjectSchema>,
  output_path: Option<PathBuf>,
  custom_stages: Vec<Box<dyn PipelineStage>>,
  skip_default_stages: bool,
}

impl PipelineBuilder {
  /// Создать новый построитель
  pub fn new() -> Self {
    Self {
      project: None,
      output_path: None,
      custom_stages: Vec::new(),
      skip_default_stages: false,
    }
  }

  /// Установить проект
  pub fn with_project(mut self, project: ProjectSchema) -> Self {
    self.project = Some(project);
    self
  }

  /// Установить выходной путь
  pub fn with_output_path(mut self, path: PathBuf) -> Self {
    self.output_path = Some(path);
    self
  }

  /// Добавить пользовательский этап
  pub fn add_stage(mut self, stage: Box<dyn PipelineStage>) -> Self {
    self.custom_stages.push(stage);
    self
  }

  /// Пропустить стандартные этапы
  pub fn skip_default_stages(mut self) -> Self {
    self.skip_default_stages = true;
    self
  }

  /// Построить конвейер
  pub async fn build(
    self,
    progress_tracker: Arc<ProgressTracker>,
    settings: Arc<RwLock<CompilerSettings>>,
  ) -> Result<RenderPipeline> {
    let project = self
      .project
      .ok_or_else(|| VideoCompilerError::ValidationError("Проект не установлен".to_string()))?;

    let output_path = self.output_path.ok_or_else(|| {
      VideoCompilerError::ValidationError("Выходной путь не установлен".to_string())
    })?;

    let mut pipeline = if self.skip_default_stages {
      // Создаем пустой конвейер
      let context = PipelineContext::new(project.clone(), output_path);
      RenderPipeline {
        project,
        stages: Vec::new(),
        progress_tracker,
        settings,
        context,
        statistics: PipelineStatistics::default(),
        start_time: None,
      }
    } else {
      // Создаем конвейер со стандартными этапами
      RenderPipeline::new(project, progress_tracker, settings, output_path).await?
    };

    // Добавляем пользовательские этапы
    for stage in self.custom_stages {
      pipeline.add_stage(stage);
    }

    Ok(pipeline)
  }
}

impl Default for PipelineBuilder {
  fn default() -> Self {
    Self::new()
  }
}

/// Резюме выполнения конвейера
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ExecutionSummary {
  pub project_name: String,
  pub total_stages: usize,
  pub completed_stages: usize,
  pub total_duration: Duration,
  pub output_file: PathBuf,
  pub output_file_size: u64,
  pub success: bool,
  pub stage_details: std::collections::HashMap<String, Duration>,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::{ProjectMetadata, ProjectSettings, Timeline};

  fn create_test_project() -> ProjectSchema {
    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name: "Test Project".to_string(),
        description: None,
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
        author: None,
      },
      timeline: Timeline::default(),
      tracks: vec![],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![],
      settings: ProjectSettings::default(),
    }
  }

  #[tokio::test]
  async fn test_pipeline_builder() {
    let project = create_test_project();
    let output_path = std::env::temp_dir().join("test_output.mp4");
    let (progress_sender, _progress_receiver) = tokio::sync::mpsc::unbounded_channel();
    let progress_tracker = Arc::new(ProgressTracker::new(progress_sender));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));

    let pipeline = PipelineBuilder::new()
      .with_project(project)
      .with_output_path(output_path)
      .build(progress_tracker, settings)
      .await;

    assert!(pipeline.is_ok());
    let pipeline = pipeline.unwrap();
    assert_eq!(pipeline.stages.len(), 5); // 5 default stages
  }

  #[tokio::test]
  async fn test_pipeline_stage_management() {
    let project = create_test_project();
    let output_path = std::env::temp_dir().join("test_output.mp4");
    let (progress_sender, _progress_receiver) = tokio::sync::mpsc::unbounded_channel();
    let progress_tracker = Arc::new(ProgressTracker::new(progress_sender));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));

    let mut pipeline = RenderPipeline::new(project, progress_tracker, settings, output_path)
      .await
      .unwrap();

    let initial_count = pipeline.stages.len();

    // Удаляем этап
    assert!(pipeline.remove_stage("Validation"));
    assert_eq!(pipeline.stages.len(), initial_count - 1);

    // Добавляем этап обратно
    pipeline.add_stage(Box::new(ValidationStage::new()));
    assert_eq!(pipeline.stages.len(), initial_count);
  }

  #[test]
  fn test_execution_summary() {
    let project = create_test_project();
    let output_path = std::env::temp_dir().join("test_output.mp4");
    let context = PipelineContext::new(project.clone(), output_path.clone());

    let pipeline = RenderPipeline {
      project,
      stages: vec![],
      progress_tracker: {
        let (progress_sender, _) = tokio::sync::mpsc::unbounded_channel();
        Arc::new(ProgressTracker::new(progress_sender))
      },
      settings: Arc::new(RwLock::new(CompilerSettings::default())),
      context,
      statistics: PipelineStatistics::default(),
      start_time: Some(Instant::now()),
    };

    let summary = pipeline.create_execution_summary();
    assert_eq!(summary.project_name, "Test Project");
    assert_eq!(summary.output_file, output_path);
  }
}
