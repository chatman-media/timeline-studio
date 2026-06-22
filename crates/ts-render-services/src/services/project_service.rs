//! Сервис управления проектами

use crate::services::Service;
use ts_render::video_compiler::core::{
  error::{Result, VideoCompilerError},
  schema::{ClipSource, ProjectMetadata, ProjectSchema, Timeline},
};
use async_trait::async_trait;
use std::path::{Path, PathBuf};
use uuid::Uuid;

/// Результат анализа проекта
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ProjectAnalysis {
  pub total_clips: usize,
  pub total_tracks: usize,
  pub total_effects: usize,
  pub total_duration: f64,
  pub missing_files: Vec<PathBuf>,
  pub warnings: Vec<String>,
  pub complexity_score: f64,
}

/// Опции экспорта проекта
#[derive(Debug, Clone)]
pub struct ProjectExportOptions {
  pub format: ProjectExportFormat,
}

/// Формат экспорта проекта
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum ProjectExportFormat {
  Json,
  Zip,
  Package,
}

/// Трейт для сервиса проектов
#[async_trait]
#[allow(dead_code)]
pub trait ProjectService: Service + Send + Sync {
  /// Создать новый проект
  async fn create_project(&self, name: String) -> Result<ProjectSchema>;

  /// Загрузить проект из файла
  async fn load_project(&self, path: &Path) -> Result<ProjectSchema>;

  /// Сохранить проект в файл
  async fn save_project(&self, project: &ProjectSchema, path: &Path) -> Result<()>;

  /// Валидировать схему проекта
  async fn validate_project(&self, project: &ProjectSchema) -> Result<()>;

  /// Анализировать проект
  async fn analyze_project(&self, project: &ProjectSchema) -> Result<ProjectAnalysis>;

  /// Объединить проекты
  async fn merge_projects(&self, projects: Vec<ProjectSchema>) -> Result<ProjectSchema>;

  /// Разделить проект по времени
  async fn split_project(
    &self,
    project: &ProjectSchema,
    split_points: Vec<f64>,
  ) -> Result<Vec<ProjectSchema>>;

  /// Экспортировать проект
  async fn export_project(
    &self,
    project: &ProjectSchema,
    output_path: &Path,
    options: ProjectExportOptions,
  ) -> Result<()>;

  /// Импортировать проект
  async fn import_project(&self, path: &Path) -> Result<ProjectSchema>;

  /// Создать резервную копию проекта
  async fn backup_project(&self, project: &ProjectSchema, backup_path: &Path) -> Result<()>;

  /// Восстановить отсутствующие медиафайлы
  async fn restore_missing_media(
    &self,
    project: &mut ProjectSchema,
    search_paths: Vec<PathBuf>,
  ) -> Result<usize>;
}

/// Реализация сервиса проектов
pub struct ProjectServiceImpl;

impl Default for ProjectServiceImpl {
  fn default() -> Self {
    Self::new()
  }
}

impl ProjectServiceImpl {
  pub fn new() -> Self {
    Self
  }

  /// Проверить наличие медиафайлов
  async fn check_media_files(&self, project: &ProjectSchema) -> Vec<PathBuf> {
    let mut missing_files = Vec::new();

    // Проверяем файлы в клипах всех треков
    for track in &project.tracks {
      for clip in &track.clips {
        if let ClipSource::File(path) = &clip.source {
          let file_path = PathBuf::from(path);
          if !file_path.exists() {
            missing_files.push(file_path);
          }
        }
      }
    }

    missing_files
  }

  /// Рассчитать сложность проекта
  fn calculate_complexity(&self, project: &ProjectSchema) -> f64 {
    let mut score = 0.0;

    // Базовая сложность по количеству элементов
    let total_clips: usize = project.tracks.iter().map(|t| t.clips.len()).sum();
    score += total_clips as f64 * 1.0;
    score += project.tracks.len() as f64 * 2.0;
    score += project.effects.len() as f64 * 3.0;
    score += project.transitions.len() as f64 * 2.5;
    score += project.filters.len() as f64 * 2.0;

    // Дополнительная сложность за многокамерные шаблоны
    if !project.templates.is_empty() {
      score += 10.0;
    }

    // Нормализуем от 0 до 100
    (score / 10.0).min(100.0)
  }
}

#[async_trait]
impl Service for ProjectServiceImpl {
  async fn initialize(&self) -> Result<()> {
    log::info!("Инициализация сервиса проектов");
    Ok(())
  }

  async fn health_check(&self) -> Result<()> {
    Ok(())
  }

  async fn shutdown(&self) -> Result<()> {
    log::info!("Остановка сервиса проектов");
    Ok(())
  }
}

#[async_trait]
impl ProjectService for ProjectServiceImpl {
  async fn create_project(&self, name: String) -> Result<ProjectSchema> {
    let now = chrono::Utc::now();

    Ok(ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name,
        description: None,
        created_at: now,
        modified_at: now,
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
      settings: Default::default(),
    })
  }

  async fn load_project(&self, path: &Path) -> Result<ProjectSchema> {
    let content = tokio::fs::read_to_string(path)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    serde_json::from_str(&content).map_err(|e| VideoCompilerError::ValidationError(e.to_string()))
  }

  async fn save_project(&self, project: &ProjectSchema, path: &Path) -> Result<()> {
    let content = serde_json::to_string_pretty(project)
      .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?;

    tokio::fs::write(path, content)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    Ok(())
  }

  async fn validate_project(&self, project: &ProjectSchema) -> Result<()> {
    project
      .validate()
      .map_err(VideoCompilerError::ValidationError)?;

    // Дополнительные проверки
    let missing_files = self.check_media_files(project).await;
    if !missing_files.is_empty() {
      return Err(VideoCompilerError::MediaFileError {
        path: format!("{} файлов", missing_files.len()),
        reason: "Отсутствуют медиафайлы".to_string(),
      });
    }

    Ok(())
  }

  async fn analyze_project(&self, project: &ProjectSchema) -> Result<ProjectAnalysis> {
    let missing_files = self.check_media_files(project).await;
    let mut warnings = Vec::new();

    // Проверяем наличие пустых треков
    for track in &project.tracks {
      if track.clips.is_empty() {
        warnings.push(format!("Трек '{}' не содержит клипов", track.name));
      }
    }

    // Все клипы теперь находятся внутри треков, поэтому нет неиспользуемых клипов

    let total_clips: usize = project.tracks.iter().map(|t| t.clips.len()).sum();

    Ok(ProjectAnalysis {
      total_clips,
      total_tracks: project.tracks.len(),
      total_effects: project.effects.len() + project.filters.len(),
      total_duration: project.get_duration(),
      missing_files,
      warnings,
      complexity_score: self.calculate_complexity(project),
    })
  }

  async fn merge_projects(&self, projects: Vec<ProjectSchema>) -> Result<ProjectSchema> {
    if projects.is_empty() {
      return Err(VideoCompilerError::InvalidParameter(
        "Нет проектов для объединения".to_string(),
      ));
    }

    let mut merged = self.create_project("Merged Project".to_string()).await?;
    let mut time_offset = 0.0;

    for project in projects {
      let project_duration = project.get_duration();

      // Добавляем треки
      for mut track in project.tracks {
        track.id = Uuid::new_v4().to_string();
        merged.tracks.push(track);
      }

      // Клипы уже находятся в треках, они были обработаны выше

      // Добавляем эффекты и другие элементы
      merged.effects.extend(project.effects);
      merged.filters.extend(project.filters);
      merged.transitions.extend(project.transitions);
      merged.subtitles.extend(project.subtitles);

      time_offset += project_duration;
    }

    // Обновляем общую длительность
    merged.timeline.duration = time_offset;

    Ok(merged)
  }

  async fn split_project(
    &self,
    project: &ProjectSchema,
    split_points: Vec<f64>,
  ) -> Result<Vec<ProjectSchema>> {
    let mut segments = Vec::new();
    let mut current_start = 0.0;

    for (i, &split_point) in split_points.iter().enumerate() {
      let mut segment = self
        .create_project(format!("{} - Part {}", project.metadata.name, i + 1))
        .await?;

      // Копируем настройки
      segment.timeline = project.timeline.clone();
      segment.settings = project.settings.clone();

      // Копируем треки и фильтруем клипы для текущего сегмента
      for track in &project.tracks {
        let mut segment_track = track.clone();
        segment_track.clips.clear();

        // Фильтруем клипы для текущего сегмента
        for clip in &track.clips {
          if clip.start_time >= current_start && clip.end_time <= split_point {
            let mut segment_clip = clip.clone();
            segment_clip.start_time -= current_start;
            segment_clip.end_time -= current_start;
            segment_track.clips.push(segment_clip);
          }
        }

        // Добавляем трек только если в нем есть клипы
        if !segment_track.clips.is_empty() {
          segment.tracks.push(segment_track);
        }
      }

      // Обновляем длительность timeline (duration рассчитывается автоматически)
      segment.timeline.duration = split_point - current_start;

      segments.push(segment);
      current_start = split_point;
    }

    // Добавляем последний сегмент
    if current_start < project.get_duration() {
      let mut final_segment = self
        .create_project(format!(
          "{} - Part {}",
          project.metadata.name,
          segments.len() + 1
        ))
        .await?;

      final_segment.timeline = project.timeline.clone();
      final_segment.settings = project.settings.clone();

      // Копируем треки и фильтруем клипы для финального сегмента
      for track in &project.tracks {
        let mut segment_track = track.clone();
        segment_track.clips.clear();

        for clip in &track.clips {
          if clip.start_time >= current_start {
            let mut segment_clip = clip.clone();
            segment_clip.start_time -= current_start;
            segment_clip.end_time -= current_start;
            segment_track.clips.push(segment_clip);
          }
        }

        // Добавляем трек только если в нем есть клипы
        if !segment_track.clips.is_empty() {
          final_segment.tracks.push(segment_track);
        }
      }

      final_segment.timeline.duration = project.get_duration() - current_start;

      segments.push(final_segment);
    }

    Ok(segments)
  }

  async fn export_project(
    &self,
    project: &ProjectSchema,
    output_path: &Path,
    options: ProjectExportOptions,
  ) -> Result<()> {
    match options.format {
      ProjectExportFormat::Json => {
        self.save_project(project, output_path).await?;
      }
      ProjectExportFormat::Zip => {
        // ZIP экспорт: архивирует проект с медиафайлами
        // Планируется: включение всех медиафайлов, настроек и метаданных
        // Требует добавления zip-rs зависимости
        log::warn!("ZIP экспорт пока не реализован. Используйте JSON формат.");
        return Err(VideoCompilerError::NotImplemented(
          "ZIP экспорт будет реализован в следующих версиях. Требуется интеграция с zip-rs."
            .to_string(),
        ));
      }
      ProjectExportFormat::Package => {
        // Package экспорт: создает полный пакет для дистрибуции
        // Планируется: проект + медиафайлы + плагины + настройки
        // Требует определения формата пакета и компрессии
        log::warn!("Package экспорт пока не реализован. Используйте JSON формат.");
        return Err(VideoCompilerError::NotImplemented(
          "Package экспорт будет реализован в следующих версиях. Формат пакета находится в стадии проектирования.".to_string(),
        ));
      }
    }

    Ok(())
  }

  async fn import_project(&self, path: &Path) -> Result<ProjectSchema> {
    // Пока поддерживаем только JSON
    self.load_project(path).await
  }

  async fn backup_project(&self, project: &ProjectSchema, backup_path: &Path) -> Result<()> {
    // Создаем директорию для бэкапа
    if let Some(parent) = backup_path.parent() {
      tokio::fs::create_dir_all(parent)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    }

    // Сохраняем проект с временной меткой
    let backup_name = format!(
      "{}_backup_{}.json",
      project.metadata.name.replace(' ', "_"),
      chrono::Utc::now().format("%Y%m%d_%H%M%S")
    );

    let full_backup_path = backup_path.join(backup_name);
    self.save_project(project, &full_backup_path).await?;

    Ok(())
  }

  async fn restore_missing_media(
    &self,
    project: &mut ProjectSchema,
    search_paths: Vec<PathBuf>,
  ) -> Result<usize> {
    let mut restored_count = 0;

    for track in &mut project.tracks {
      for clip in &mut track.clips {
        if let ClipSource::File(ref mut path) = clip.source {
          let file_path = PathBuf::from(&path);

          if !file_path.exists() {
            // Ищем файл в альтернативных путях
            let file_name = file_path
              .file_name()
              .ok_or_else(|| VideoCompilerError::InvalidPath(path.clone()))?;

            for search_path in &search_paths {
              let candidate = search_path.join(file_name);
              if candidate.exists() {
                log::info!("Восстановлен файл: {} -> {}", path, candidate.display());
                *path = candidate.to_string_lossy().to_string();
                restored_count += 1;
                break;
              }
            }
          }
        }
      }
    }

    Ok(restored_count)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_project_creation() {
    let service = ProjectServiceImpl::new();
    service.initialize().await.unwrap();

    let project = service
      .create_project("Test Project".to_string())
      .await
      .unwrap();
    assert_eq!(project.metadata.name, "Test Project");
    assert_eq!(project.timeline.fps, 30);
  }

  #[tokio::test]
  async fn test_project_analysis() {
    let service = ProjectServiceImpl::new();
    let project = service
      .create_project("Test Project".to_string())
      .await
      .unwrap();

    let analysis = service.analyze_project(&project).await.unwrap();
    assert_eq!(analysis.total_clips, 0);
    assert_eq!(analysis.total_tracks, 0);
    assert!(analysis.missing_files.is_empty());
  }
}
