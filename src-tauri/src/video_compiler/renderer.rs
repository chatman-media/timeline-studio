//! Renderer - Основной модуль рендеринга видео
//!
//! Этот модуль реализует основную логику рендеринга видео проектов,
//! включая управление задачами, интеграцию с FFmpeg и обработку ошибок.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use tokio::process::Command;
use tokio::sync::{mpsc, RwLock};

use crate::video_compiler::cache::RenderCache;
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;
use crate::video_compiler::progress::ProgressTracker;
use crate::video_compiler::schema::ProjectSchema;
use crate::video_compiler::CompilerSettings;

/// Основной рендерер видео
#[derive(Debug)]
pub struct VideoRenderer {
  /// Схема проекта для рендеринга
  project: ProjectSchema,
  /// Настройки компилятора
  settings: Arc<RwLock<CompilerSettings>>,
  /// Кэш рендеринга
  cache: Arc<RwLock<RenderCache>>,
  /// Трекер прогресса
  progress_tracker: Arc<ProgressTracker>,
  /// Построитель команд FFmpeg
  ffmpeg_builder: FFmpegBuilder,
}

impl VideoRenderer {
  /// Создать новый рендерер
  pub async fn new(
    project: ProjectSchema,
    settings: Arc<RwLock<CompilerSettings>>,
    cache: Arc<RwLock<RenderCache>>,
    progress_sender: mpsc::UnboundedSender<crate::video_compiler::progress::ProgressUpdate>,
  ) -> Result<Self> {
    // Валидация проекта
    project.validate().map_err(VideoCompilerError::validation)?;

    let progress_tracker = Arc::new(ProgressTracker::new(progress_sender));
    let ffmpeg_builder = FFmpegBuilder::new(project.clone());

    Ok(Self {
      project,
      settings,
      cache,
      progress_tracker,
      ffmpeg_builder,
    })
  }

  /// Запустить рендеринг видео
  pub async fn render(&mut self, output_path: &Path) -> Result<String> {
    let job_id = self.create_render_job(output_path).await?;

    // Запускаем рендеринг в отдельной задаче
    let job_id_clone = job_id.clone();
    let project = self.project.clone();
    let output_path = output_path.to_owned();
    let progress_tracker = self.progress_tracker.clone();
    let ffmpeg_builder = self.ffmpeg_builder.clone();
    let settings = self.settings.clone();

    let progress_tracker_clone = progress_tracker.clone();
    tokio::spawn(async move {
      let result = Self::render_internal(
        project,
        output_path,
        progress_tracker,
        ffmpeg_builder,
        settings,
      )
      .await;

      match result {
        Ok(final_path) => {
          let _ = progress_tracker_clone
            .complete_job(&job_id_clone, final_path)
            .await;
        }
        Err(e) => {
          let _ = progress_tracker_clone
            .fail_job(&job_id_clone, e.to_string())
            .await;
        }
      }
    });

    Ok(job_id)
  }

  /// Создать задачу рендеринга
  async fn create_render_job(&self, output_path: &Path) -> Result<String> {
    let total_frames = self.estimate_total_frames();

    self
      .progress_tracker
      .create_job(
        self.project.metadata.name.clone(),
        output_path.to_string_lossy().to_string(),
        total_frames,
      )
      .await
  }

  /// Оценить общее количество кадров
  fn estimate_total_frames(&self) -> u64 {
    let duration = self.project.get_duration();
    let fps = self.project.timeline.fps as f64;
    (duration * fps) as u64
  }

  /// Внутренняя логика рендеринга
  async fn render_internal(
    project: ProjectSchema,
    output_path: PathBuf,
    progress_tracker: Arc<ProgressTracker>,
    ffmpeg_builder: FFmpegBuilder,
    _settings: Arc<RwLock<CompilerSettings>>,
  ) -> Result<String> {
    log::info!("Начало рендеринга проекта: {}", project.metadata.name);

    // Этап 1: Валидация
    Self::update_progress(&progress_tracker, &project, 0, "Validation").await?;
    Self::validate_project_files(&project).await?;

    // Этап 2: Подготовка
    Self::update_progress(&progress_tracker, &project, 5, "Preparation").await?;
    let temp_dir = Self::create_temp_directory(&project).await?;

    // Этап 3: Построение команды FFmpeg
    Self::update_progress(&progress_tracker, &project, 10, "Building FFmpeg command").await?;
    let ffmpeg_command = ffmpeg_builder.build_render_command(&output_path).await?;

    // Этап 4: Выполнение рендеринга
    Self::update_progress(&progress_tracker, &project, 15, "Rendering").await?;
    let final_output = Self::execute_ffmpeg_render(
      ffmpeg_command,
      progress_tracker.clone(),
      &project,
      &output_path,
    )
    .await?;

    // Этап 5: Финализация
    Self::update_progress(&progress_tracker, &project, 95, "Finalizing").await?;
    Self::cleanup_temp_files(&temp_dir).await?;

    Self::update_progress(&progress_tracker, &project, 100, "Completed").await?;
    log::info!("Рендеринг завершен: {}", final_output);

    Ok(final_output)
  }

  /// Обновить прогресс рендеринга
  async fn update_progress(
    progress_tracker: &ProgressTracker,
    project: &ProjectSchema,
    percentage: u64,
    stage: &str,
  ) -> Result<()> {
    // Находим первую активную задачу для этого проекта
    let jobs = progress_tracker.get_active_jobs().await;
    if let Some(job) = jobs.first() {
      let total_frames = (project.get_duration() * project.timeline.fps as f64) as u64;
      let current_frame = (total_frames * percentage) / 100;

      progress_tracker
        .update_progress(&job.id, current_frame, stage.to_string(), None)
        .await?;
    }
    Ok(())
  }

  /// Валидация файлов проекта
  async fn validate_project_files(project: &ProjectSchema) -> Result<()> {
    for track in &project.tracks {
      for clip in &track.clips {
        if !clip.source_path.exists() {
          return Err(VideoCompilerError::media_file(
            clip.source_path.to_string_lossy().to_string(),
            "Файл не найден".to_string(),
          ));
        }
      }
    }
    Ok(())
  }

  /// Создать временную директорию
  async fn create_temp_directory(project: &ProjectSchema) -> Result<PathBuf> {
    let temp_dir = std::env::temp_dir()
      .join("timeline-studio")
      .join(&project.metadata.name)
      .join(uuid::Uuid::new_v4().to_string());

    tokio::fs::create_dir_all(&temp_dir)
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    Ok(temp_dir)
  }

  /// Выполнить рендеринг через FFmpeg
  async fn execute_ffmpeg_render(
    mut command: Command,
    progress_tracker: Arc<ProgressTracker>,
    project: &ProjectSchema,
    output_path: &Path,
  ) -> Result<String> {
    log::debug!("Выполнение команды FFmpeg: {:?}", command);

    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    let mut child = command.spawn().map_err(|e| {
      VideoCompilerError::ffmpeg(
        None,
        format!("Не удалось запустить FFmpeg: {}", e),
        "spawn".to_string(),
      )
    })?;

    // Читаем stderr для отслеживания прогресса
    if let Some(stderr) = child.stderr.take() {
      let progress_tracker = Arc::clone(&progress_tracker);
      let project = project.clone();

      tokio::spawn(async move {
        Self::monitor_ffmpeg_progress(stderr, progress_tracker, project).await;
      });
    }

    // Ждем завершения процесса
    let output = child.wait_with_output().await.map_err(|e| {
      VideoCompilerError::ffmpeg(
        None,
        format!("Ошибка выполнения FFmpeg: {}", e),
        "wait".to_string(),
      )
    })?;

    if !output.status.success() {
      let stderr = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::ffmpeg(
        output.status.code(),
        stderr.to_string(),
        "render execution".to_string(),
      ));
    }

    Ok(output_path.to_string_lossy().to_string())
  }

  /// Мониторинг прогресса FFmpeg
  async fn monitor_ffmpeg_progress(
    stderr: tokio::process::ChildStderr,
    progress_tracker: Arc<ProgressTracker>,
    project: ProjectSchema,
  ) {
    use tokio::io::{AsyncBufReadExt, BufReader};

    let reader = BufReader::new(stderr);
    let mut lines = reader.lines();

    while let Ok(Some(line)) = lines.next_line().await {
      if let Some(ffmpeg_progress) = progress_tracker.parse_ffmpeg_progress(&line) {
        // Конвертируем прогресс FFmpeg в прогресс задачи
        let total_frames = (project.get_duration() * project.timeline.fps as f64) as u64;
        let _percentage = if total_frames > 0 {
          ((ffmpeg_progress.frame as f64 / total_frames as f64) * 80.0) + 15.0 // 15-95%
        } else {
          50.0
        };

        // Обновляем прогресс
        let jobs = progress_tracker.get_active_jobs().await;
        if let Some(job) = jobs.first() {
          let _ = progress_tracker
            .update_progress(
              &job.id,
              ffmpeg_progress.frame,
              format!("Rendering ({}fps)", ffmpeg_progress.fps),
              Some(format!("Frame {}/{}", ffmpeg_progress.frame, total_frames)),
            )
            .await;
        }
      }
    }
  }

  /// Очистка временных файлов
  async fn cleanup_temp_files(temp_dir: &Path) -> Result<()> {
    if temp_dir.exists() {
      tokio::fs::remove_dir_all(temp_dir).await.map_err(|e| {
        VideoCompilerError::IoError(format!("Не удалось очистить временные файлы: {}", e))
      })?;
    }
    Ok(())
  }

  /// Отменить рендеринг
  pub async fn cancel(&mut self) -> Result<()> {
    // Получаем активные задачи и отменяем их
    let jobs = self.progress_tracker.get_active_jobs().await;
    for job in jobs {
      self.progress_tracker.cancel_job(&job.id).await?;
    }
    Ok(())
  }

  /// Получить текущий прогресс
  pub async fn get_progress(&self) -> Option<crate::video_compiler::progress::RenderProgress> {
    let jobs = self.progress_tracker.get_active_jobs().await;
    jobs.first().map(|job| job.get_progress())
  }
}

/// Настройки рендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderSettings {
  /// Использовать аппаратное ускорение
  pub hardware_acceleration: bool,
  /// Количество потоков FFmpeg
  pub threads: Option<u32>,
  /// Дополнительные параметры FFmpeg
  pub extra_args: Vec<String>,
  /// Таймаут рендеринга (секунды)
  pub timeout_seconds: u64,
}

impl Default for RenderSettings {
  fn default() -> Self {
    Self {
      hardware_acceleration: true,
      threads: None, // Автоматическое определение
      extra_args: Vec::new(),
      timeout_seconds: 3600, // 1 час
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::cache::RenderCache;
  use crate::video_compiler::progress::ProgressUpdate;
  use std::sync::Arc;
  use tokio::sync::{mpsc, RwLock};

  async fn create_test_renderer() -> VideoRenderer {
    let project = ProjectSchema::new("Test Project".to_string());
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();

    VideoRenderer::new(project, settings, cache, tx)
      .await
      .unwrap()
  }

  #[tokio::test]
  async fn test_renderer_creation() {
    let renderer = create_test_renderer().await;
    assert_eq!(renderer.project.metadata.name, "Test Project");
  }

  #[tokio::test]
  async fn test_estimate_total_frames() {
    let renderer = create_test_renderer().await;
    let frames = renderer.estimate_total_frames();
    // Пустой проект должен иметь 0 кадров
    assert_eq!(frames, 0);
  }

  #[tokio::test]
  async fn test_validate_project_files() {
    let project = ProjectSchema::new("Test".to_string());

    // Пустой проект должен проходить валидацию
    let result = VideoRenderer::validate_project_files(&project).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_create_temp_directory() {
    let project = ProjectSchema::new("Test Project".to_string());
    let temp_dir = VideoRenderer::create_temp_directory(&project)
      .await
      .unwrap();

    assert!(temp_dir.exists());
    assert!(temp_dir.to_string_lossy().contains("timeline-studio"));
    assert!(temp_dir.to_string_lossy().contains("Test Project"));

    // Очищаем
    let _ = tokio::fs::remove_dir_all(&temp_dir).await;
  }

  #[tokio::test]
  async fn test_cleanup_temp_files() {
    let temp_dir = std::env::temp_dir().join("test_cleanup");
    tokio::fs::create_dir_all(&temp_dir).await.unwrap();

    assert!(temp_dir.exists());

    VideoRenderer::cleanup_temp_files(&temp_dir).await.unwrap();
    assert!(!temp_dir.exists());
  }

  #[tokio::test]
  async fn test_render_settings_default() {
    let settings = RenderSettings::default();
    assert!(settings.hardware_acceleration);
    assert_eq!(settings.timeout_seconds, 3600);
    assert!(settings.extra_args.is_empty());
  }

  #[tokio::test]
  async fn test_cancel_render() {
    let mut renderer = create_test_renderer().await;

    // Отмена рендеринга не должна вызывать ошибку, даже если нет активных задач
    let result = renderer.cancel().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_get_progress_empty() {
    let renderer = create_test_renderer().await;

    // Без активных задач прогресс должен быть None
    let progress = renderer.get_progress().await;
    assert!(progress.is_none());
  }
}
