// Project manager - управление проектами анализа

use anyhow::{Context, Result};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::analysis::database::queries::ProjectStatistics;
use crate::analysis::database::AnalysisDatabase;
use crate::analysis::models::*;
// use crate::recognition::person_database::PersonDatabase;  // TODO: интегрировать с person database

/// Менеджер проектов анализа
pub struct ProjectManager {
  analysis_db: Arc<AnalysisDatabase>,
  active_projects: Arc<Mutex<HashMap<Uuid, AnalysisProgress>>>,
}

impl ProjectManager {
  /// Создание нового менеджера проектов
  pub fn new(analysis_db: Arc<AnalysisDatabase>) -> Self {
    Self {
      analysis_db,
      active_projects: Arc::new(Mutex::new(HashMap::new())),
    }
  }

  /// Создание нового проекта анализа
  pub async fn create_project(
    &self,
    name: String,
    description: Option<String>,
    config: AnalysisConfig,
    files: Vec<String>,
  ) -> Result<AnalysisProject> {
    // Создаем базовый проект
    let mut project = AnalysisProject {
      id: Uuid::new_v4(),
      name,
      description,
      created_at: chrono::Utc::now(),
      updated_at: chrono::Utc::now(),
      status: AnalysisStatus::Created,
      progress: 0.0,
      error_message: None,
      config,
      total_files: files.len() as u32,
      total_duration: 0.0,
      processed_files: 0,
      total_scenes: 0,
      total_persons: 0,
      total_key_moments: 0,
      average_quality: 0.0,
      tags: Vec::new(),
      location: None,
      recording_date: None,
      metadata: HashMap::new(),
    };

    // Анализируем файлы для получения базовой информации
    let mut total_duration = 0.0;
    for file_path in &files {
      if let Ok(duration) = self.get_file_duration(file_path).await {
        total_duration += duration;
      }
    }
    project.total_duration = total_duration;

    // Сохраняем проект в базу
    let project = self
      .analysis_db
      .create_project(project)
      .await
      .context("Failed to create analysis project")?;

    // Добавляем медиафайлы в проект
    for file_path in files {
      self
        .add_media_file_to_project(&project.id, &file_path)
        .await?;
    }

    // Инициализируем прогресс
    let progress = AnalysisProgress {
      project_id: project.id,
      overall_progress: 0.0,
      current_stage: AnalysisStage::Initialization,
      current_file: None,
      files_completed: 0,
      files_total: project.total_files,
      estimated_time_remaining: None,
      stages_progress: HashMap::new(),
      last_updated: chrono::Utc::now(),
    };

    self
      .active_projects
      .lock()
      .await
      .insert(project.id, progress);

    log::info!(
      "Created analysis project '{}' with {} files",
      project.name,
      project.total_files
    );
    Ok(project)
  }

  /// Добавление медиафайла в проект
  async fn add_media_file_to_project(
    &self,
    project_id: &Uuid,
    file_path: &str,
  ) -> Result<AnalysisMediaFile> {
    let path = Path::new(file_path);
    let file_name = path
      .file_name()
      .and_then(|n| n.to_str())
      .unwrap_or("unknown")
      .to_string();

    let media_type = self.detect_media_type(file_path)?;
    let file_size = std::fs::metadata(file_path).map(|m| m.len()).unwrap_or(0);

    let duration = if media_type == MediaType::Video || media_type == MediaType::Audio {
      self.get_file_duration(file_path).await.ok()
    } else {
      None
    };

    let (resolution, fps, codec, format) = if media_type == MediaType::Video {
      self
        .get_video_info(file_path)
        .await
        .unwrap_or((None, None, None, None))
    } else {
      (None, None, None, None)
    };

    let media_file = AnalysisMediaFile {
      id: Uuid::new_v4(),
      project_id: *project_id,
      file_path: file_path.to_string(),
      file_name,
      file_size,
      media_type,
      duration,
      resolution,
      fps,
      codec,
      format,
      processing_status: ProcessingStatus::Pending,
      processing_progress: 0.0,
      processed_at: None,
      scenes_count: 0,
      persons_count: 0,
      key_moments_count: 0,
      overall_quality: 0.0,
      average_motion: 0.0,
      average_brightness: 0.0,
      audio_clarity: None,
      has_speech: false,
      created_at: chrono::Utc::now(),
    };

    self.analysis_db.add_media_file(media_file).await
  }

  /// Определение типа медиафайла
  fn detect_media_type(&self, file_path: &str) -> Result<MediaType> {
    let path = Path::new(file_path);
    let extension = path
      .extension()
      .and_then(|ext| ext.to_str())
      .unwrap_or("")
      .to_lowercase();

    match extension.as_str() {
      "mp4" | "mov" | "avi" | "mkv" | "webm" | "m4v" => Ok(MediaType::Video),
      "mp3" | "wav" | "aac" | "flac" | "ogg" | "m4a" => Ok(MediaType::Audio),
      "jpg" | "jpeg" | "png" | "bmp" | "tiff" | "webp" => Ok(MediaType::Image),
      _ => Err(anyhow::anyhow!("Unsupported file type: {}", extension)),
    }
  }

  /// Получение длительности файла
  async fn get_file_duration(&self, file_path: &str) -> Result<f32> {
    // Простая оценка на основе размера файла
    let path = std::path::Path::new(file_path);
    if !path.exists() {
      return Err(anyhow::anyhow!("File not found: {}", file_path));
    }

    let file_size = path.metadata()?.len() as f32;
    let extension = path
      .extension()
      .and_then(|s| s.to_str())
      .unwrap_or("")
      .to_lowercase();

    // Оценочная длительность на основе размера и типа файла
    let duration = match extension.as_str() {
      "mp4" | "mkv" | "avi" | "mov" => file_size / 2_000_000.0, // ~2MB per second for video
      "mp3" | "wav" | "flac" => file_size / 150_000.0,          // ~150KB per second for audio
      "jpg" | "png" | "jpeg" => 0.0,                            // Images have no duration
      _ => file_size / 1_000_000.0,                             // Default: 1MB per second
    };

    Ok(duration.clamp(1.0, 7200.0)) // Min 1s, max 2 hours
  }

  /// Получение информации о видео
  async fn get_video_info(
    &self,
    file_path: &str,
  ) -> Result<(
    Option<Resolution>,
    Option<f32>,
    Option<String>,
    Option<String>,
  )> {
    let path = std::path::Path::new(file_path);
    if !path.exists() {
      return Err(anyhow::anyhow!("File not found: {}", file_path));
    }

    let extension = path
      .extension()
      .and_then(|s| s.to_str())
      .unwrap_or("")
      .to_lowercase();

    // Определяем параметры на основе расширения файла
    match extension.as_str() {
      "mp4" | "mkv" | "avi" | "mov" => {
        let file_size = path.metadata()?.len();

        // Оценочное разрешение на основе размера файла
        let (width, height) = if file_size > 500_000_000 {
          // > 500MB
          (3840, 2160) // 4K
        } else if file_size > 100_000_000 {
          // > 100MB
          (1920, 1080) // FullHD
        } else {
          (1280, 720) // HD
        };

        Ok((
          Some(Resolution { width, height }),
          Some(30.0),               // Default FPS
          Some("h264".to_string()), // Most common codec
          Some(extension),
        ))
      }
      "jpg" | "png" | "jpeg" | "gif" => {
        // Images - default resolution, no FPS
        Ok((
          Some(Resolution {
            width: 1920,
            height: 1080,
          }),
          None, // No FPS for images
          Some("image".to_string()),
          Some(extension),
        ))
      }
      "mp3" | "wav" | "flac" | "aac" => {
        // Audio only - no video info
        Ok((None, None, Some("audio".to_string()), Some(extension)))
      }
      _ => {
        // Unknown format
        Ok((None, None, None, Some(extension)))
      }
    }
  }

  /// Получение проекта по ID
  pub async fn get_project(&self, project_id: &Uuid) -> Result<Option<AnalysisProject>> {
    self.analysis_db.get_project(project_id).await
  }

  /// Обновление прогресса проекта
  pub async fn update_progress(
    &self,
    project_id: &Uuid,
    stage: AnalysisStage,
    progress: f32,
    current_file: Option<String>,
  ) -> Result<()> {
    // Обновляем в памяти
    if let Some(project_progress) = self.active_projects.lock().await.get_mut(project_id) {
      project_progress.current_stage = stage.clone();
      project_progress.overall_progress = progress;
      project_progress.current_file = current_file;
      project_progress.last_updated = chrono::Utc::now();

      // Добавляем прогресс для этапа
      project_progress
        .stages_progress
        .insert(stage.clone(), progress);
    }

    // Обновляем статус в базе
    let status = match stage {
      AnalysisStage::Initialization => AnalysisStatus::Created,
      AnalysisStage::Finalization if progress >= 1.0 => AnalysisStatus::Completed,
      _ => AnalysisStatus::Analyzing,
    };

    self
      .analysis_db
      .update_project_progress(project_id, progress, status)
      .await
  }

  /// Получение прогресса проекта
  pub async fn get_progress(&self, project_id: &Uuid) -> Result<Option<AnalysisProgress>> {
    Ok(self.active_projects.lock().await.get(project_id).cloned())
  }

  /// Получение файлов проекта
  pub async fn get_project_files(&self, project_id: &Uuid) -> Result<Vec<AnalysisMediaFile>> {
    self.analysis_db.get_project_files(project_id).await
  }

  /// Получение сцен проекта
  pub async fn get_project_scenes(&self, project_id: &Uuid) -> Result<Vec<AnalysisScene>> {
    self.analysis_db.get_project_scenes(project_id).await
  }

  /// Получение ключевых моментов проекта
  pub async fn get_project_key_moments(&self, project_id: &Uuid) -> Result<Vec<KeyMoment>> {
    self.analysis_db.get_project_key_moments(project_id).await
  }

  /// Получение статистики проекта
  pub async fn get_project_statistics(&self, project_id: &Uuid) -> Result<ProjectStatistics> {
    self.analysis_db.get_project_statistics(project_id).await
  }

  /// Поиск в данных проекта
  pub async fn search_project_data(
    &self,
    project_id: &Uuid,
    query: &str,
    result_types: Option<Vec<SearchResultType>>,
  ) -> Result<Vec<AnalysisSearchResult>> {
    self
      .analysis_db
      .search_analysis_data(project_id, query, result_types)
      .await
  }

  /// Завершение анализа проекта
  pub async fn complete_project(&self, project_id: &Uuid) -> Result<()> {
    // Финальное обновление прогресса
    self
      .update_progress(project_id, AnalysisStage::Finalization, 1.0, None)
      .await?;

    // Удаляем из активных проектов
    self.active_projects.lock().await.remove(project_id);

    log::info!("Completed analysis project: {}", project_id);
    Ok(())
  }

  /// Отмена анализа проекта
  pub async fn cancel_project(
    &self,
    project_id: &Uuid,
    error_message: Option<String>,
  ) -> Result<()> {
    // Обновляем статус
    let status = if error_message.is_some() {
      AnalysisStatus::Failed
    } else {
      AnalysisStatus::Cancelled
    };

    self
      .analysis_db
      .update_project_progress(project_id, 0.0, status)
      .await?;

    // Удаляем из активных проектов
    self.active_projects.lock().await.remove(project_id);

    log::info!(
      "Cancelled analysis project: {} (reason: {:?})",
      project_id,
      error_message
    );
    Ok(())
  }

  /// Получение всех активных проектов
  pub async fn get_active_projects(&self) -> Result<Vec<AnalysisProgress>> {
    Ok(
      self
        .active_projects
        .lock()
        .await
        .values()
        .cloned()
        .collect(),
    )
  }
}
