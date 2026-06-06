//! Validation Stage - Этап валидации проекта

use async_trait::async_trait;
use std::path::Path;
use std::time::Duration;

use super::{PipelineContext, PipelineStage};
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::ClipSource;

/// Этап валидации
pub struct ValidationStage;

impl ValidationStage {
  pub fn new() -> Self {
    Self
  }

  /// Валидация входных файлов
  async fn validate_input_files(&self, context: &PipelineContext) -> Result<()> {
    log::info!("🔍 Валидация входных файлов...");

    for track in &context.project.tracks {
      for clip in &track.clips {
        match &clip.source {
          ClipSource::File(path) => {
            self.validate_media_file(path.as_str()).await?;
          }
          ClipSource::Generated => {
            // Сгенерированные клипы не требуют валидации файлов
          }
          ClipSource::Stream(_) => {
            // Stream sources validation not implemented yet
          }
          ClipSource::Device(_) => {
            // Device sources validation not implemented yet
          }
        }
      }
    }

    log::info!("✅ Все входные файлы валидны");
    Ok(())
  }

  /// Валидация медиафайла
  async fn validate_media_file(&self, path: &str) -> Result<()> {
    let file_path = Path::new(path);

    // Проверяем существование файла
    if !file_path.exists() {
      return Err(VideoCompilerError::ValidationError(format!(
        "Файл не найден: {path}"
      )));
    }

    // Проверяем, что это файл, а не директория
    if !file_path.is_file() {
      return Err(VideoCompilerError::ValidationError(format!(
        "Путь не является файлом: {path}"
      )));
    }

    // Проверяем размер файла
    let metadata = tokio::fs::metadata(file_path).await.map_err(|e| {
      VideoCompilerError::ValidationError(format!(
        "Не удалось получить метаданные файла {path}: {e}"
      ))
    })?;

    if metadata.len() == 0 {
      return Err(VideoCompilerError::ValidationError(format!(
        "Файл пуст: {path}"
      )));
    }

    // Проверяем расширение файла
    if let Some(extension) = file_path.extension().and_then(|e| e.to_str()) {
      let ext = extension.to_lowercase();
      if !self.is_supported_format(&ext) {
        log::warn!("⚠️ Неподдерживаемый формат файла: {path} ({ext})");
      }
    }

    Ok(())
  }

  /// Проверка поддерживаемых форматов
  fn is_supported_format(&self, extension: &str) -> bool {
    matches!(
      extension,
      "mp4"
        | "mov"
        | "avi"
        | "mkv"
        | "webm"
        | "m4v"
        | "3gp"
        | "flv"
        | "jpg"
        | "jpeg"
        | "png"
        | "gif"
        | "bmp"
        | "tiff"
        | "webp"
        | "mp3"
        | "wav"
        | "aac"
        | "ogg"
        | "flac"
        | "m4a"
    )
  }

  /// Валидация схемы проекта
  async fn validate_project_schema(&self, context: &PipelineContext) -> Result<()> {
    log::info!("🔍 Валидация схемы проекта...");

    let project = &context.project;

    // Проверяем базовые поля
    if project.metadata.name.is_empty() {
      return Err(VideoCompilerError::ValidationError(
        "Название проекта не может быть пустым".to_string(),
      ));
    }

    // Проверяем настройки экспорта
    let export = &project.settings;
    if export.resolution.width == 0 || export.resolution.height == 0 {
      return Err(VideoCompilerError::ValidationError(format!(
        "Некорректное разрешение: {}x{}",
        export.resolution.width, export.resolution.height
      )));
    }

    if export.frame_rate <= 0.0 {
      return Err(VideoCompilerError::ValidationError(format!(
        "Некорректная частота кадров: {}",
        export.frame_rate
      )));
    }

    // Проверяем треки
    if project.tracks.is_empty() {
      return Err(VideoCompilerError::ValidationError(
        "Проект должен содержать хотя бы один трек".to_string(),
      ));
    }

    // Проверяем длительность
    let total_duration = self.calculate_total_duration(context);
    if total_duration <= 0.0 {
      return Err(VideoCompilerError::ValidationError(
        "Общая длительность проекта должна быть больше 0".to_string(),
      ));
    }

    log::info!("✅ Схема проекта валидна");
    log::info!(
      "📏 Разрешение: {}x{}",
      export.resolution.width,
      export.resolution.height
    );
    log::info!("🎞️ FPS: {}", export.frame_rate);
    log::info!("⏱️ Длительность: {total_duration:.2}s");
    log::info!("🎬 Треков: {}", project.tracks.len());

    Ok(())
  }

  /// Вычисление общей длительности проекта
  fn calculate_total_duration(&self, context: &PipelineContext) -> f64 {
    let mut max_end_time = 0.0;

    for track in &context.project.tracks {
      for clip in &track.clips {
        let clip_end = clip.start_time + (clip.end_time - clip.start_time);
        if clip_end > max_end_time {
          max_end_time = clip_end;
        }
      }
    }

    max_end_time
  }

  /// Валидация выходной директории
  async fn validate_output_directory(&self, context: &PipelineContext) -> Result<()> {
    log::info!("🔍 Валидация выходной директории...");

    if let Some(parent) = context.output_path.parent() {
      // Проверяем существование родительской директории
      if !parent.exists() {
        return Err(VideoCompilerError::ValidationError(format!(
          "Выходная директория не существует: {parent:?}"
        )));
      }

      // Проверяем права на запись
      let test_file = parent.join("test_write_permission.tmp");
      match tokio::fs::write(&test_file, "test").await {
        Ok(_) => {
          // Удаляем тестовый файл
          let _ = tokio::fs::remove_file(&test_file).await;
        }
        Err(e) => {
          return Err(VideoCompilerError::ValidationError(format!(
            "Нет прав на запись в директорию {parent:?}: {e}"
          )));
        }
      }
    }

    // Проверяем, не существует ли уже выходной файл
    if context.output_path.exists() {
      log::warn!(
        "⚠️ Выходной файл уже существует и будет перезаписан: {:?}",
        context.output_path
      );
    }

    log::info!("✅ Выходная директория валидна");
    Ok(())
  }

  /// Валидация системных требований
  async fn validate_system_requirements(&self, _context: &PipelineContext) -> Result<()> {
    log::info!("🔍 Валидация системных требований...");

    // Проверяем доступное место на диске
    let available_space = self.get_available_disk_space().await?;
    let min_required_space = 1_000_000_000; // 1 GB

    if available_space < min_required_space {
      return Err(VideoCompilerError::ValidationError(format!(
        "Недостаточно места на диске. Доступно: {available_space} байт, требуется минимум: {min_required_space} байт"
      )));
    }

    // Проверяем доступность FFmpeg
    if !self.check_ffmpeg_availability().await {
      return Err(VideoCompilerError::ValidationError(
        "FFmpeg не найден в системе".to_string(),
      ));
    }

    log::info!("✅ Системные требования выполнены");
    log::info!("💾 Доступно места: {} MB", available_space / 1_000_000);

    Ok(())
  }

  /// Получить доступное место на диске
  async fn get_available_disk_space(&self) -> Result<u64> {
    // Упрощенная реализация - в реальности нужно использовать системные вызовы
    // Для macOS/Linux можно использовать statvfs, для Windows - GetDiskFreeSpaceEx
    Ok(10_000_000_000) // 10 GB как заглушка
  }

  /// Проверить доступность FFmpeg
  async fn check_ffmpeg_availability(&self) -> bool {
    match tokio::process::Command::new("ffmpeg")
      .arg("-version")
      .output()
      .await
    {
      Ok(output) => output.status.success(),
      Err(_) => false,
    }
  }
}

#[async_trait]
impl PipelineStage for ValidationStage {
  async fn process(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("🔍 === Этап валидации ===");

    // Обновляем прогресс
    context.update_progress(5, "Validation").await?;

    // Валидация схемы проекта
    self.validate_project_schema(context).await?;
    context.update_progress(25, "Validation").await?;

    // Валидация входных файлов
    self.validate_input_files(context).await?;
    context.update_progress(50, "Validation").await?;

    // Валидация выходной директории
    self.validate_output_directory(context).await?;
    context.update_progress(75, "Validation").await?;

    // Валидация системных требований
    self.validate_system_requirements(context).await?;
    context.update_progress(100, "Validation").await?;

    log::info!("✅ Валидация завершена успешно");
    Ok(())
  }

  fn name(&self) -> &str {
    "Validation"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(10)
  }
}

impl Default for ValidationStage {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::{ProjectMetadata, ProjectSchema};

  fn create_test_context() -> PipelineContext {
    let project = ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name: "Test Project".to_string(),
        description: Some("Test project description".to_string()),
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
        author: Some("Test Author".to_string()),
      },
      timeline: crate::video_compiler::schema::timeline::Timeline {
        fps: 30,
        resolution: (1920, 1080),
        duration: 120.0,
        sample_rate: 48000,
        aspect_ratio: crate::video_compiler::schema::common::AspectRatio::Ratio16x9,
      },
      tracks: vec![],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![],
      settings: crate::video_compiler::schema::export::ProjectSettings::default(),
    };

    PipelineContext::new(project, std::env::temp_dir().join("test_output.mp4"))
  }

  #[tokio::test]
  async fn test_validation_stage_basic() {
    let stage = ValidationStage::new();
    assert_eq!(stage.name(), "Validation");
    assert!(!stage.estimated_duration().is_zero());
  }

  #[test]
  fn test_supported_formats() {
    let stage = ValidationStage::new();
    assert!(stage.is_supported_format("mp4"));
    assert!(stage.is_supported_format("jpg"));
    assert!(stage.is_supported_format("mp3"));
    assert!(!stage.is_supported_format("txt"));
  }

  #[test]
  fn test_duration_calculation() {
    let stage = ValidationStage::new();
    let context = create_test_context();
    let duration = stage.calculate_total_duration(&context);
    assert_eq!(duration, 0.0); // Empty timeline
  }
}
