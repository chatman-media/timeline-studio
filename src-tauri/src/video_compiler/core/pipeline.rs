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
use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;
use crate::video_compiler::progress::ProgressTracker;
use crate::video_compiler::schema::{ClipSource, ProjectSchema};
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
  _settings: Arc<RwLock<CompilerSettings>>,
  /// Контекст выполнения
  context: PipelineContext,
  /// FFmpeg builder для создания команд
  _ffmpeg_builder: FFmpegBuilder,
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
    context.ffmpeg_builder = Some(ffmpeg_builder.clone());
    context.progress_tracker = Some(progress_tracker.clone());

    let mut pipeline = Self {
      project,
      stages: Vec::new(),
      progress_tracker,
      _settings: settings,
      context,
      _ffmpeg_builder: ffmpeg_builder,
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
    log::info!(
      "Оценочная общая длительность: {:.1}с",
      total_estimated_duration.as_secs_f64()
    );

    let total_stages = self.stages.len();
    let mut current_stage = 0;
    let mut elapsed_duration = Duration::ZERO;

    for stage in &self.stages {
      current_stage += 1;
      let stage_name = stage.name();

      // Проверяем, можно ли пропустить этап
      if stage.can_skip(&self.context) {
        log::info!(
          "[{current_stage}/{total_stages}] Этап '{stage_name}' пропущен (can_skip = true)"
        );
        continue;
      }

      let estimated_duration = stage.estimated_duration();
      log::info!(
        "[{}/{}] Начало этапа: {} (оценочное время: {:.1}с)",
        current_stage,
        total_stages,
        stage_name,
        estimated_duration.as_secs_f64()
      );

      // Проверяем отмену
      if self.context.is_cancelled() {
        log::warn!("Конвейер отменен пользователем");
        return Err(VideoCompilerError::render(
          job_id,
          stage_name,
          "Операция отменена пользователем".to_string(),
        ));
      }

      // Обновляем прогресс на основе оценочной длительности
      let progress_percentage = if total_estimated_duration.as_secs() > 0 {
        (elapsed_duration.as_secs_f64() / total_estimated_duration.as_secs_f64()) * 100.0
      } else {
        ((current_stage - 1) as f64 / total_stages as f64) * 100.0
      };

      if let Err(e) = self
        .update_progress(job_id, progress_percentage as u64, stage_name)
        .await
      {
        log::warn!("Не удалось обновить прогресс: {e}");
        // Увеличиваем счетчик предупреждений
        self.context.statistics.add_warning();
        // Продолжаем выполнение
      }

      // Выполняем этап
      let start_time = SystemTime::now();

      match stage.process(&mut self.context).await {
        Ok(_) => {
          let duration = start_time.elapsed().unwrap_or(Duration::ZERO);
          elapsed_duration += duration;

          log::info!(
            "✓ Этап '{}' завершен за {:.2}с (оценочное: {:.1}с)",
            stage_name,
            duration.as_secs_f64(),
            estimated_duration.as_secs_f64()
          );

          // Обновляем статистику
          // Для отслеживания прогресса используем frames_processed
          self.context.statistics.frames_processed += 1;
        }
        Err(e) => {
          log::error!("✗ Ошибка на этапе '{stage_name}': {e}");
          log::error!("  Код ошибки: {}", e.error_code());
          log::error!(
            "  Критическая: {}",
            if e.is_critical() { "да" } else { "нет" }
          );
          log::error!(
            "  Можно повторить: {}",
            if e.is_retryable() { "да" } else { "нет" }
          );
          log::debug!("Детали ошибки: {e:?}");

          // Увеличиваем счетчик ошибок в статистике
          self.context.statistics.add_error();

          // Очищаем временные файлы при ошибке
          if let Err(cleanup_err) = self.context.cleanup().await {
            log::warn!("Не удалось очистить временные файлы: {cleanup_err}");
            // Увеличиваем счетчик предупреждений за проблемы с очисткой
            self.context.statistics.add_warning();
          }

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

    // Очищаем временные файлы
    if let Err(e) = self.context.cleanup().await {
      log::warn!("Не удалось очистить временные файлы: {e}");
      self.context.statistics.add_warning();
    }

    log::info!("=== Конвейер обработки завершен успешно ===");
    log::info!("Выходной файл: {:?}", self.context.output_path);
    log::info!(
      "Общее время: {:.2}с",
      self.context.statistics.total_duration().as_secs_f64()
    );

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

  /// Приостановить выполнение конвейера
  pub async fn pause(&mut self) -> Result<()> {
    self.context.paused = true;
    log::info!("Конвейер приостановлен");
    Ok(())
  }

  /// Возобновить выполнение конвейера
  pub async fn resume(&mut self) -> Result<()> {
    self.context.paused = false;
    log::info!("Конвейер возобновлен");
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
  /// Флаг приостановки
  pub paused: bool,
  /// Пользовательские данные
  pub user_data: HashMap<String, serde_json::Value>,
  /// Статистика выполнения
  pub statistics: PipelineStatistics,
  /// FFmpeg builder для создания команд
  pub ffmpeg_builder: Option<FFmpegBuilder>,
  /// Progress tracker для отслеживания прогресса
  pub progress_tracker: Option<Arc<ProgressTracker>>,
  /// ID текущей задачи рендеринга
  pub current_job_id: Option<String>,
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
      paused: false,
      user_data: HashMap::new(),
      statistics: PipelineStatistics::default(),
      ffmpeg_builder: None,
      progress_tracker: None,
      current_job_id: None,
    }
  }

  /// Добавить промежуточный файл
  pub fn add_intermediate_file(&mut self, key: String, path: PathBuf) {
    self.intermediate_files.insert(key, path);
  }

  /// Получить промежуточный файл
  #[allow(dead_code)]
  pub fn get_intermediate_file(&self, key: &str) -> Option<&PathBuf> {
    self.intermediate_files.get(key)
  }

  /// Добавить пользовательские данные
  pub fn set_user_data<T: serde::Serialize>(&mut self, key: String, value: T) -> Result<()> {
    let json_value = serde_json::to_value(value)
      .map_err(|e| crate::video_compiler::error::VideoCompilerError::validation(e.to_string()))?;
    self.user_data.insert(key, json_value);
    Ok(())
  }

  /// Получить пользовательские данные
  #[allow(dead_code)]
  pub fn get_user_data<T: serde::de::DeserializeOwned>(&self, key: &str) -> Option<T> {
    self
      .user_data
      .get(key)
      .and_then(|value| serde_json::from_value(value.clone()).ok())
  }

  /// Проверить, отменено ли выполнение
  pub fn is_cancelled(&self) -> bool {
    self.cancelled
  }

  /// Проверить, приостановлено ли выполнение
  pub fn is_paused(&self) -> bool {
    self.paused
  }

  /// Создать временную директорию
  pub async fn ensure_temp_dir(&self) -> Result<()> {
    if !self.temp_dir.exists() {
      tokio::fs::create_dir_all(&self.temp_dir)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    }
    Ok(())
  }

  /// Очистить временные файлы
  pub async fn cleanup(&self) -> Result<()> {
    if self.temp_dir.exists() {
      tokio::fs::remove_dir_all(&self.temp_dir)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
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

impl Default for ValidationStage {
  fn default() -> Self {
    Self::new()
  }
}

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

    // Сохраняем информацию о валидации в user_data
    let mut validation_stats = serde_json::json!({
      "project_name": context.project.metadata.name,
      "tracks_count": context.project.tracks.len(),
      "clips_count": 0,
      "missing_files": Vec::<String>::new(),
      "unsupported_formats": Vec::<String>::new()
    });

    let mut total_clips = 0;

    // Проверка существования медиа файлов и их форматов
    for track in &context.project.tracks {
      for clip in &track.clips {
        total_clips += 1;

        // Проверка существования
        match &clip.source {
          ClipSource::File(path) => {
            let path_buf = std::path::PathBuf::from(path);
            if !path_buf.exists() {
              if let Some(missing_files) = validation_stats["missing_files"].as_array_mut() {
                missing_files.push(serde_json::Value::String(path.clone()));
              }
              return Err(VideoCompilerError::media_file(
                path.clone(),
                "Файл не найден",
              ));
            }

            // Проверка поддерживаемых форматов
            let extension = path_buf
              .extension()
              .and_then(|ext| ext.to_str())
              .unwrap_or("");

            let supported_formats = match track.track_type {
              crate::video_compiler::schema::TrackType::Video => {
                vec![
                  "mp4", "mov", "avi", "mkv", "webm", "flv", "m4v", "jpg", "jpeg", "png", "gif",
                  "bmp", "webp",
                ]
              }
              crate::video_compiler::schema::TrackType::Audio => {
                vec!["mp3", "wav", "aac", "m4a", "flac", "ogg", "wma"]
              }
              crate::video_compiler::schema::TrackType::Subtitle => {
                vec!["srt", "vtt", "ass", "ssa"]
              }
            };

            if !supported_formats.contains(&extension.to_lowercase().as_str()) {
              if let Some(unsupported_formats) =
                validation_stats["unsupported_formats"].as_array_mut()
              {
                unsupported_formats
                  .push(serde_json::Value::String(format!("{path}: .{extension}")));
              }
              return Err(VideoCompilerError::media_file(
                path.clone(),
                format!("Неподдерживаемый формат файла: .{extension}"),
              ));
            }
          }
          _ => continue, // Skip non-file sources
        }

        // Проверка временных интервалов
        if clip.start_time < 0.0 {
          return Err(VideoCompilerError::validation(format!(
            "Некорректное время начала клипа: {}",
            clip.start_time
          )));
        }

        let duration = clip.end_time - clip.start_time;
        if duration <= 0.0 {
          return Err(VideoCompilerError::validation(format!(
            "Некорректная длительность клипа: {duration}"
          )));
        }
      }
    }

    // Создание временной директории
    context.ensure_temp_dir().await?;

    // Сохраняем финальную статистику валидации
    validation_stats["clips_count"] =
      serde_json::Value::Number(serde_json::Number::from(total_clips));
    let _ = context.set_user_data("validation_stats".to_string(), validation_stats);

    context.statistics.validation_time = SystemTime::now();
    log::info!(
      "Валидация проекта завершена успешно. Обработано {} клипов в {} треках",
      total_clips,
      context.project.tracks.len()
    );
    Ok(())
  }

  fn name(&self) -> &str {
    "Validation"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(5)
  }

  fn can_skip(&self, context: &PipelineContext) -> bool {
    // Пропускаем валидацию, если проект уже был валидирован недавно
    if let Some(validation_stats) = context.user_data.get("validation_stats") {
      if let Some(validated_at) = validation_stats.get("validated_at") {
        if let Some(timestamp) = validated_at.as_u64() {
          let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
          // Пропускаем если валидация была менее 5 минут назад
          return now - timestamp < 300;
        }
      }
    }
    false
  }
}

/// Этап предобработки медиа
#[derive(Debug)]
pub struct PreprocessingStage;

impl Default for PreprocessingStage {
  fn default() -> Self {
    Self::new()
  }
}

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
        if let ClipSource::File(path) = &clip.source {
          self.analyze_media_file(std::path::Path::new(path)).await?;
        }
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
  /// Анализ медиа файла через FFprobe
  async fn analyze_media_file(&self, path: &Path) -> Result<()> {
    use tokio::process::Command;

    // Проверяем доступность файла
    if !path.exists() {
      return Err(VideoCompilerError::media_file(
        path.to_string_lossy().to_string(),
        "Файл не существует".to_string(),
      ));
    }

    // Запускаем FFprobe для анализа
    let output = Command::new("ffprobe")
      .args([
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=codec_name,width,height,r_frame_rate,duration",
        "-of",
        "json",
        path.to_str().unwrap(),
      ])
      .output()
      .await
      .map_err(|e| {
        VideoCompilerError::ffmpeg(
          None,
          format!("Не удалось запустить FFprobe: {e}"),
          "ffprobe".to_string(),
        )
      })?;

    if !output.status.success() {
      let error = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::media_file(
        path.to_string_lossy(),
        format!("FFprobe ошибка: {error}"),
      ));
    }

    // Парсим JSON результат
    let json_str = String::from_utf8_lossy(&output.stdout);
    let probe_data: serde_json::Value = serde_json::from_str(&json_str).map_err(|e| {
      VideoCompilerError::media_file(
        path.to_string_lossy(),
        format!("Ошибка парсинга FFprobe данных: {e}"),
      )
    })?;

    // Логируем информацию о файле
    if let Some(streams) = probe_data["streams"].as_array() {
      if let Some(stream) = streams.first() {
        log::info!(
          "Медиа файл {}: {}x{}, codec: {}, fps: {}",
          path.display(),
          stream["width"].as_u64().unwrap_or(0),
          stream["height"].as_u64().unwrap_or(0),
          stream["codec_name"].as_str().unwrap_or("unknown"),
          stream["r_frame_rate"].as_str().unwrap_or("unknown")
        );
      }
    }

    // Здесь можно добавить дополнительную логику анализа
    log::debug!("Анализ файла: {path:?}");
    Ok(())
  }

  /// Подготовка промежуточных файлов
  async fn prepare_intermediate_files(&self, context: &mut PipelineContext) -> Result<()> {
    log::debug!("Подготовка промежуточных файлов");

    // Собираем информацию о необходимых преобразованиях
    let mut conversions = Vec::new();

    for (track_idx, track) in context.project.tracks.iter().enumerate() {
      for (clip_idx, clip) in track.clips.iter().enumerate() {
        // Проверяем нужно ли конвертировать файл
        if let ClipSource::File(path) = &clip.source {
          let needs_conversion = self
            .check_needs_conversion(std::path::Path::new(path))
            .await?;

          if needs_conversion {
            conversions.push((track_idx, clip_idx, std::path::PathBuf::from(path)));
          }
        }
      }
    }

    // Теперь добавляем промежуточные файлы
    for (track_idx, clip_idx, source_path) in conversions {
      // Создаем путь для временного файла
      let temp_file = context
        .temp_dir
        .join(format!("track_{track_idx}_clip_{clip_idx}_temp.mp4"));

      // Сохраняем информацию о временном файле
      let key = format!("track_{track_idx}_clip_{clip_idx}");
      context.add_intermediate_file(key, temp_file);

      log::info!("Клип {} требует преобразования", source_path.display());
    }

    // Создаем основные промежуточные файлы для композиции
    let video_composite = context.temp_dir.join("video_composite.mp4");
    let audio_composite = context.temp_dir.join("audio_composite.wav");

    context.add_intermediate_file("video_composite".to_string(), video_composite);
    context.add_intermediate_file("audio_composite".to_string(), audio_composite);

    Ok(())
  }

  /// Проверка необходимости конвертации
  async fn check_needs_conversion(&self, path: &Path) -> Result<bool> {
    // Простая проверка по расширению
    // В реальности здесь должна быть проверка кодеков через FFprobe
    let extension = path.extension().and_then(|ext| ext.to_str()).unwrap_or("");

    // Форматы, которые требуют конвертации
    let needs_conversion_formats = ["avi", "flv", "wmv", "mkv"];

    Ok(needs_conversion_formats.contains(&extension.to_lowercase().as_str()))
  }
}

/// Этап композиции видео
#[derive(Debug)]
pub struct CompositionStage;

impl Default for CompositionStage {
  fn default() -> Self {
    Self::new()
  }
}

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

    // Получаем путь для промежуточного файла
    let video_composite_path = context
      .intermediate_files
      .get("video_composite")
      .ok_or_else(|| {
        VideoCompilerError::InternalError("Video composite path not found".to_string())
      })?;

    // Используем специализированный метод для построения команды композиции
    log::info!("Создание команды композиции видео");
    let command_args = self.build_video_composition_command(context, &video_tracks)?;

    // Добавляем выходной файл к команде
    let mut full_command = command_args;
    full_command.push(video_composite_path.to_string_lossy().to_string());

    // Создаем процесс
    let mut cmd = tokio::process::Command::new(&full_command[0]);
    cmd.args(&full_command[1..]);

    // Выполняем команду FFmpeg
    let output = cmd.output().await.map_err(|e| {
      VideoCompilerError::ffmpeg(
        None,
        format!("Не удалось запустить FFmpeg для видео композиции: {e}"),
        "video composition".to_string(),
      )
    })?;

    if !output.status.success() {
      let error = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::ffmpeg(
        output.status.code(),
        format!("FFmpeg видео композиция не удалась: {error}"),
        "video composition".to_string(),
      ));
    }

    log::info!("Видео композиция завершена успешно");
    Ok(())
  }

  /// Построение команды FFmpeg для композиции видео
  fn build_video_composition_command(
    &self,
    context: &PipelineContext,
    video_tracks: &[&crate::video_compiler::schema::Track],
  ) -> Result<Vec<String>> {
    let mut command = vec!["ffmpeg".to_string()];

    // Добавляем входные файлы
    let mut input_count = 0;
    for track in video_tracks {
      for clip in &track.clips {
        if let ClipSource::File(path) = &clip.source {
          command.extend(["-i".to_string(), path.clone()]);
          input_count += 1;
        }
      }
    }

    // Если только один клип - простое копирование
    if input_count == 1 {
      command.extend([
        "-c:v".to_string(),
        "copy".to_string(),
        "-an".to_string(), // Без аудио на этом этапе
      ]);
    } else {
      // Сложная композиция с filter_complex
      let mut filter_complex = String::new();

      // Простой пример конкатенации
      for i in 0..input_count {
        filter_complex.push_str(&format!("[{i}:v]"));
      }
      filter_complex.push_str(&format!("concat=n={input_count}:v=1:a=0[outv]"));

      command.extend([
        "-filter_complex".to_string(),
        filter_complex,
        "-map".to_string(),
        "[outv]".to_string(),
      ]);
    }

    // Выходной файл
    if let Some(video_composite) = context.intermediate_files.get("video_composite") {
      command.push(video_composite.to_string_lossy().to_string());
    }

    log::debug!("FFmpeg команда для видео: {command:?}");
    Ok(command)
  }

  /// Композиция аудио дорожек
  async fn compose_audio_tracks(&self, context: &mut PipelineContext) -> Result<()> {
    use tokio::process::Command;

    let audio_tracks: Vec<_> = context
      .project
      .tracks
      .iter()
      .filter(|t| t.track_type == crate::video_compiler::schema::TrackType::Audio)
      .collect();

    if audio_tracks.is_empty() {
      log::info!("Нет аудио дорожек для композиции");
      return Ok(());
    }

    log::debug!("Композиция {} аудио дорожек", audio_tracks.len());

    // Строим команду FFmpeg для композиции аудио
    let ffmpeg_command = self.build_audio_composition_command(context, &audio_tracks)?;

    // Выполняем команду FFmpeg
    log::info!("Запуск композиции аудио");
    let output = Command::new(&ffmpeg_command[0])
      .args(&ffmpeg_command[1..])
      .output()
      .await
      .map_err(|e| {
        VideoCompilerError::ffmpeg(
          None,
          format!("Не удалось запустить FFmpeg для аудио композиции: {e}"),
          "audio composition".to_string(),
        )
      })?;

    if !output.status.success() {
      let error = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::ffmpeg(
        output.status.code(),
        format!("FFmpeg аудио композиция не удалась: {error}"),
        "audio composition".to_string(),
      ));
    }

    log::info!("Аудио композиция завершена успешно");
    Ok(())
  }

  /// Построение команды FFmpeg для композиции аудио
  fn build_audio_composition_command(
    &self,
    context: &PipelineContext,
    audio_tracks: &[&crate::video_compiler::schema::Track],
  ) -> Result<Vec<String>> {
    let mut command = vec!["ffmpeg".to_string()];

    // Добавляем входные файлы
    let mut input_count = 0;
    for track in audio_tracks {
      for clip in &track.clips {
        if let ClipSource::File(path) = &clip.source {
          command.extend(["-i".to_string(), path.clone()]);
          input_count += 1;
        }
      }
    }

    // Если только один аудио клип - простое копирование
    if input_count == 1 {
      command.extend([
        "-c:a".to_string(),
        "copy".to_string(),
        "-vn".to_string(), // Без видео на этом этапе
      ]);
    } else {
      // Сложное микширование с amerge или amix
      let mut filter_complex = String::new();

      // Используем amix для микширования нескольких аудио потоков
      for i in 0..input_count {
        filter_complex.push_str(&format!("[{i}:a]"));
      }
      filter_complex.push_str(&format!(
        "amix=inputs={input_count}:duration=longest:dropout_transition=2[outa]"
      ));

      command.extend([
        "-filter_complex".to_string(),
        filter_complex,
        "-map".to_string(),
        "[outa]".to_string(),
      ]);
    }

    // Выходной файл
    if let Some(audio_composite) = context.intermediate_files.get("audio_composite") {
      command.push(audio_composite.to_string_lossy().to_string());
    }

    log::debug!("FFmpeg команда для аудио: {command:?}");
    Ok(command)
  }
}

/// Этап кодирования
#[derive(Debug)]
pub struct EncodingStage;

impl Default for EncodingStage {
  fn default() -> Self {
    Self::new()
  }
}

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
    use tokio::io::{AsyncBufReadExt, BufReader};

    log::info!("Начало кодирования в файл: {:?}", context.output_path);

    // Создаем родительскую директорию если не существует
    if let Some(parent) = context.output_path.parent() {
      tokio::fs::create_dir_all(parent)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    }

    // Получаем FFmpegBuilder из контекста
    let ffmpeg_builder = context.ffmpeg_builder.as_ref().ok_or_else(|| {
      VideoCompilerError::InternalError("FFmpegBuilder not found in context".to_string())
    })?;

    // Используем FFmpegBuilder для создания финальной команды
    log::info!("Создание финальной команды кодирования с FFmpegBuilder");
    let mut cmd = ffmpeg_builder
      .build_render_command(&context.output_path)
      .await?;

    log::debug!("Финальная FFmpeg команда создана с FFmpegBuilder");

    // Запускаем FFmpeg процесс с перенаправлением stderr для чтения прогресса
    let mut child = cmd
      .stderr(std::process::Stdio::piped())
      .spawn()
      .map_err(|e| {
        VideoCompilerError::ffmpeg(
          None,
          format!("Не удалось запустить FFmpeg: {e}"),
          "ffmpeg spawn".to_string(),
        )
      })?;

    // Читаем stderr для прогресса
    if let Some(stderr) = child.stderr.take() {
      let reader = BufReader::new(stderr);
      let mut lines = reader.lines();

      while let Some(line) = lines.next_line().await.ok().flatten() {
        // Парсим прогресс из вывода FFmpeg
        if line.contains("frame=") {
          self.parse_ffmpeg_progress(&line, context).await;
        }
        log::trace!("FFmpeg: {line}");

        // Проверяем отмену
        if context.is_cancelled() {
          child.kill().await.ok();
          return Err(VideoCompilerError::CancelledError(
            "Кодирование отменено пользователем".to_string(),
          ));
        }
      }
    }

    // Ждем завершения процесса
    let status = child.wait().await.map_err(|e| {
      VideoCompilerError::ffmpeg(
        None,
        format!("Ошибка ожидания FFmpeg: {e}"),
        "ffmpeg wait".to_string(),
      )
    })?;

    if !status.success() {
      let error = VideoCompilerError::ffmpeg(
        status.code(),
        "FFmpeg завершился с ошибкой".to_string(),
        "ffmpeg encoding".to_string(),
      );

      // Проверяем, была ли это ошибка GPU
      // FFmpeg обычно возвращает код 1 для общих ошибок
      // Анализируем stderr для определения типа ошибки
      if context.project.settings.export.hardware_acceleration {
        // Если использовалось GPU ускорение и произошла ошибка,
        // возможно это ошибка GPU
        log::error!(
          "Возможная ошибка GPU при кодировании, код выхода: {:?}",
          status.code()
        );

        // Создаем GPU ошибку для автоматического fallback
        return Err(VideoCompilerError::gpu(format!(
          "FFmpeg GPU encoding failed with exit code: {:?}",
          status.code()
        )));
      }

      return Err(error);
    }

    // Проверяем что файл создан
    if !context.output_path.exists() {
      return Err(VideoCompilerError::render(
        "encoding",
        "output_missing",
        "Выходной файл не был создан",
      ));
    }

    log::info!("Кодирование завершено успешно");
    Ok(())
  }

  /// Парсинг прогресса из вывода FFmpeg с использованием ProgressTracker
  async fn parse_ffmpeg_progress(&self, line: &str, context: &mut PipelineContext) {
    // Используем парсер ProgressTracker для получения детальной информации
    if let Some(progress_tracker) = context.progress_tracker.as_ref() {
      if let Some(ffmpeg_progress) = progress_tracker.parse_ffmpeg_progress(line) {
        // Обновляем статистику
        context.statistics.frames_processed = ffmpeg_progress.frame;

        // Логируем детальную информацию о прогрессе
        log::debug!(
          "FFmpeg прогресс: кадр={}, fps={:.1}, качество={:.1}, размер={:.1}MB, время={:?}, битрейт={:.1}kbits/s, скорость={:.1}x",
          ffmpeg_progress.frame,
          ffmpeg_progress.fps,
          ffmpeg_progress.quality,
          ffmpeg_progress.size as f64 / 1_048_576.0,
          ffmpeg_progress.time,
          ffmpeg_progress.bitrate,
          ffmpeg_progress.speed
        );

        // Обновляем прогресс в трекере если есть job_id
        if let Some(job_id) = context.current_job_id.as_ref() {
          let message = format!(
            "FPS: {:.1}, Размер: {:.1}MB, Битрейт: {:.1}kbits/s, Скорость: {:.1}x",
            ffmpeg_progress.fps,
            ffmpeg_progress.size as f64 / 1_048_576.0,
            ffmpeg_progress.bitrate,
            ffmpeg_progress.speed
          );

          if let Err(e) = progress_tracker
            .update_progress(
              job_id,
              ffmpeg_progress.frame,
              "Encoding".to_string(),
              Some(message),
            )
            .await
          {
            log::warn!("Не удалось обновить прогресс: {e}");
          }
        }
      }
    } else {
      // Fallback на простой парсинг если ProgressTracker недоступен
      if let Some(frame_match) = line.split("frame=").nth(1) {
        if let Some(frame_str) = frame_match.split_whitespace().next() {
          if let Ok(frame) = frame_str.trim().parse::<u64>() {
            context.statistics.frames_processed = frame;
            log::trace!("Обработано кадров: {frame}");
          }
        }
      }
    }
  }
}

/// Этап финализации
#[derive(Debug)]
pub struct FinalizationStage;

impl Default for FinalizationStage {
  fn default() -> Self {
    Self::new()
  }
}

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

    // Получаем размер файла
    let file_size = tokio::fs::metadata(&context.output_path)
      .await
      .map(|m| m.len())
      .unwrap_or(0);

    log::info!(
      "Выходной файл создан: {:?}, размер: {} МБ",
      context.output_path,
      file_size / 1_048_576
    );

    // Добавляем метаданные к файлу
    self.add_metadata(context).await?;

    // Сохраняем статистику
    self.save_statistics(context).await?;

    // Очистка временных файлов
    if !context.is_cancelled() {
      log::info!("Очистка временных файлов");
      context.cleanup().await?;
    } else {
      log::warn!("Пропуск очистки временных файлов из-за отмены");
    }

    context.statistics.finalization_time = SystemTime::now();
    log::info!("Финализация завершена успешно");
    Ok(())
  }

  fn name(&self) -> &str {
    "Finalization"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(5)
  }
}

impl FinalizationStage {
  /// Добавление метаданных к выходному файлу
  async fn add_metadata(&self, context: &PipelineContext) -> Result<()> {
    use tokio::process::Command;

    // Создаем временные строки для метаданных
    let title_meta = format!("title={}", context.project.metadata.name);
    let artist_meta = "artist=Timeline Studio".to_string();
    let date_meta = format!("date={}", chrono::Utc::now().format("%Y-%m-%d"));
    let comment_meta = format!(
      "comment=Created with Timeline Studio v{}",
      context.project.version
    );
    let tmp_file = format!("{}.tmp", context.output_path.to_string_lossy());

    let metadata_args = vec![
      "-i",
      context.output_path.to_str().unwrap(),
      "-c",
      "copy",
      "-metadata",
      &title_meta,
      "-metadata",
      &artist_meta,
      "-metadata",
      &date_meta,
      "-metadata",
      &comment_meta,
      "-y", // Перезаписать
      &tmp_file,
    ];

    let output = Command::new("ffmpeg")
      .args(&metadata_args)
      .output()
      .await
      .map_err(|e| {
        VideoCompilerError::ffmpeg(
          None,
          format!("Не удалось добавить метаданные: {e}"),
          "add metadata".to_string(),
        )
      })?;

    if output.status.success() {
      // Заменяем оригинальный файл
      tokio::fs::rename(&tmp_file, &context.output_path)
        .await
        .map_err(|e| VideoCompilerError::Io(format!("Не удалось заменить файл: {e}")))?;

      log::info!("Метаданные добавлены к выходному файлу");
    } else {
      log::warn!("Не удалось добавить метаданные, но файл создан");
    }

    Ok(())
  }

  /// Сохранение статистики рендеринга
  async fn save_statistics(&self, context: &PipelineContext) -> Result<()> {
    let stats_path = context.output_path.with_extension("stats.json");

    let stats_json = serde_json::json!({
      "project_name": context.project.metadata.name,
      "output_file": context.output_path.to_string_lossy(),
      "total_duration": context.statistics.total_duration().as_secs(),
      "frames_processed": context.statistics.frames_processed,
      "memory_used": context.statistics.memory_used,
      "error_count": context.statistics.error_count,
      "warning_count": context.statistics.warning_count,
      "render_date": chrono::Utc::now().to_rfc3339(),
      "timeline_studio_version": context.project.version,
    });

    let stats_string = serde_json::to_string_pretty(&stats_json)
      .map_err(|e| VideoCompilerError::Io(format!("Не удалось сериализовать статистику: {e}")))?;

    tokio::fs::write(&stats_path, stats_string)
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Не удалось сохранить статистику: {e}")))?;

    log::info!("Статистика рендеринга сохранена в {stats_path:?}");
    Ok(())
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
  use crate::video_compiler::schema::{
    Clip, ClipProperties, ClipSource, ProjectSchema, Track, TrackType,
  };
  use std::path::Path;
  use tempfile::TempDir;
  use tokio::sync::{mpsc, Mutex};

  /// Создает тестовый клип
  fn create_test_clip(id: &str, source_path: PathBuf, start_time: f64, end_time: f64) -> Clip {
    Clip {
      id: id.to_string(),
      source: ClipSource::File(source_path.to_string_lossy().to_string()),
      start_time,
      end_time,
      source_start: 0.0,
      source_end: end_time - start_time,
      speed: 1.0,
      opacity: 1.0,
      effects: vec![],
      filters: vec![],
      template_id: None,
      template_position: None,
      color_correction: None,
      crop: None,
      transform: None,
      audio_track_index: None,
      properties: ClipProperties {
        notes: None,
        tags: Vec::new(),
        custom_metadata: HashMap::new(),
      },
    }
  }

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

  #[allow(dead_code)]
  async fn create_test_pipeline_with_clips() -> (RenderPipeline, TempDir) {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Test Project with Clips".to_string());

    // Create test video file
    let video_file = temp_dir.path().join("test_video.mp4");
    std::fs::write(&video_file, b"fake video content").unwrap();

    // Create test audio file
    let audio_file = temp_dir.path().join("test_audio.mp3");
    std::fs::write(&audio_file, b"fake audio content").unwrap();

    // Add video track with clip
    let mut video_track = Track::new(TrackType::Video, "Video Track".to_string());
    video_track
      .clips
      .push(create_test_clip("clip1", video_file, 0.0, 10.0));
    project.tracks.push(video_track);

    // Add audio track with clip
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    audio_track
      .clips
      .push(create_test_clip("clip2", audio_file, 0.0, 10.0));
    project.tracks.push(audio_track);

    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let output_path = temp_dir.path().join("output.mp4");

    let pipeline = RenderPipeline::new(project, progress_tracker, settings, output_path)
      .await
      .unwrap();

    (pipeline, temp_dir)
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
  async fn test_context_user_data() {
    let project = ProjectSchema::new("Test".to_string());
    let output_path = PathBuf::from("/tmp/test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    // Test setting and getting user data
    #[derive(Serialize, Deserialize, Debug, PartialEq)]
    struct TestData {
      value: String,
      count: u32,
    }

    let test_data = TestData {
      value: "test".to_string(),
      count: 42,
    };

    context
      .set_user_data("test_key".to_string(), &test_data)
      .unwrap();

    let retrieved: Option<TestData> = context.get_user_data("test_key");
    assert_eq!(retrieved, Some(test_data));

    // Test missing key
    let missing: Option<TestData> = context.get_user_data("missing_key");
    assert_eq!(missing, None);
  }

  #[tokio::test]
  async fn test_context_cleanup() {
    let project = ProjectSchema::new("Test".to_string());
    let output_path = PathBuf::from("/tmp/test.mp4");
    let context = PipelineContext::new(project, output_path);

    // Create temp dir
    context.ensure_temp_dir().await.unwrap();
    assert!(context.temp_dir.exists());

    // Clean up
    context.cleanup().await.unwrap();
    assert!(!context.temp_dir.exists());
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
  async fn test_validation_stage_with_invalid_clip() {
    let mut project = ProjectSchema::new("Test".to_string());
    let mut track = Track::new(TrackType::Video, "Test Track".to_string());

    // Add clip with non-existent file
    track.clips.push(create_test_clip(
      "clip1",
      PathBuf::from("/nonexistent/file.mp4"),
      0.0,
      10.0,
    ));
    project.tracks.push(track);

    let output_path = PathBuf::from("/tmp/test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    let result = stage.process(&mut context).await;

    assert!(result.is_err());
    if let Err(e) = result {
      // The validation stage checks for missing files
      let error_msg = e.to_string();
      println!("Error message: {error_msg}");
      assert!(
        error_msg.contains("Файл не найден")
          || error_msg.contains("File not found")
          || error_msg.contains("media")
          || error_msg.contains("не найден")
      );
    }
  }

  #[tokio::test]
  async fn test_validation_stage_with_invalid_time_range() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Test".to_string());
    let mut track = Track::new(TrackType::Video, "Test Track".to_string());

    // Create test file
    let video_file = temp_dir.path().join("test.mp4");
    std::fs::write(&video_file, b"fake content").unwrap();

    // Add clip with invalid time range
    track
      .clips
      .push(create_test_clip("clip1", video_file, 10.0, 5.0)); // Invalid: end < start
    project.tracks.push(track);

    let output_path = PathBuf::from("/tmp/test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    let result = stage.process(&mut context).await;

    assert!(result.is_err());
    if let Err(e) = result {
      let error_msg = e.to_string();
      println!("Error message: {error_msg}");
      assert!(
        error_msg.contains("Некорректная длительность")
          || error_msg.contains("duration")
          || error_msg.contains("invalid")
          || error_msg.contains("длительность")
          || error_msg.contains("Время окончания должно быть больше времени начала")
      );
    }
  }

  #[tokio::test]
  async fn test_validation_stage_skip_logic() {
    let project = ProjectSchema::new("Test".to_string());
    let output_path = PathBuf::from("/tmp/test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    // Add validation stats with recent timestamp
    let now = SystemTime::now()
      .duration_since(SystemTime::UNIX_EPOCH)
      .unwrap()
      .as_secs();

    let validation_stats = serde_json::json!({
      "validated_at": now - 100, // 100 seconds ago
    });

    context
      .user_data
      .insert("validation_stats".to_string(), validation_stats);

    let stage = ValidationStage::new();

    // Should skip since validation was recent (< 5 minutes)
    assert!(stage.can_skip(&context));

    // Test with old timestamp
    let old_stats = serde_json::json!({
      "validated_at": now - 400, // 400 seconds ago (> 5 minutes)
    });
    context
      .user_data
      .insert("validation_stats".to_string(), old_stats);

    // Should not skip since validation is old
    assert!(!stage.can_skip(&context));
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
  async fn test_pipeline_statistics_duration() {
    let start_time = SystemTime::now();
    tokio::time::sleep(Duration::from_millis(10)).await;
    let end_time = SystemTime::now();

    let stats = PipelineStatistics {
      validation_time: start_time,
      finalization_time: end_time,
      ..Default::default()
    };

    let duration = stats.total_duration();
    assert!(duration.as_millis() >= 10);
    assert!(duration.as_millis() < 1000); // Should be less than 1 second
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

  #[tokio::test]
  async fn test_pipeline_progress_update() {
    let pipeline = create_test_pipeline().await;
    let _job_id = "test_job_123";

    // Test progress update - note that update_progress is a private method
    // We can test the public interface instead
    let stats = pipeline.get_statistics();
    assert_eq!(stats.frames_processed, 0);
    assert_eq!(stats.error_count, 0);
  }

  #[tokio::test]
  async fn test_preprocessing_stage_file_conversion_check() {
    let stage = PreprocessingStage::new();

    // Test files that need conversion
    let avi_file = Path::new("test.avi");
    assert!(stage.check_needs_conversion(avi_file).await.unwrap());

    let flv_file = Path::new("test.flv");
    assert!(stage.check_needs_conversion(flv_file).await.unwrap());

    // Test files that don't need conversion
    let mp4_file = Path::new("test.mp4");
    assert!(!stage.check_needs_conversion(mp4_file).await.unwrap());

    let jpg_file = Path::new("test.jpg");
    assert!(!stage.check_needs_conversion(jpg_file).await.unwrap());
  }

  #[tokio::test]
  async fn test_composition_stage_command_building() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Test".to_string());

    // Create test file
    let video_file = temp_dir.path().join("test.mp4");
    std::fs::write(&video_file, b"fake content").unwrap();

    // Add video track
    let mut track = Track::new(TrackType::Video, "Test Track".to_string());
    track
      .clips
      .push(create_test_clip("clip1", video_file.clone(), 0.0, 10.0));

    project.tracks.push(track);

    let output_path = temp_dir.path().join("output.mp4");
    let mut context = PipelineContext::new(project, output_path);
    context.add_intermediate_file(
      "video_composite".to_string(),
      temp_dir.path().join("composite.mp4"),
    );

    let stage = CompositionStage::new();
    let video_tracks: Vec<_> = context
      .project
      .tracks
      .iter()
      .filter(|t| t.track_type == TrackType::Video)
      .collect();

    let command = stage
      .build_video_composition_command(&context, &video_tracks)
      .unwrap();

    // Check command structure
    assert_eq!(command[0], "ffmpeg");
    assert!(command.contains(&"-i".to_string()));
    assert!(command.contains(&video_file.to_string_lossy().to_string()));
  }

  #[tokio::test]
  async fn test_encoding_stage_ffmpeg_progress_parsing() {
    let stage = EncodingStage::new();
    let project = ProjectSchema::new("Test".to_string());
    let output_path = PathBuf::from("/tmp/test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    // Test FFmpeg progress line parsing
    let progress_line = "frame=  120 fps=30.0 q=28.0 size=    1024kB time=00:00:04.00 bitrate=2097.2kbits/s speed=1.0x";

    stage
      .parse_ffmpeg_progress(progress_line, &mut context)
      .await;

    // Without ProgressTracker, it should still update statistics
    assert_eq!(context.statistics.frames_processed, 120);
  }

  #[tokio::test]
  async fn test_finalization_stage_metadata() {
    let stage = FinalizationStage::new();
    assert_eq!(stage.name(), "Finalization");
    assert_eq!(stage.estimated_duration(), Duration::from_secs(5));
  }

  #[tokio::test]
  async fn test_pipeline_custom_stage() {
    // Define a custom stage
    #[derive(Debug)]
    struct CustomStage {
      name: String,
      processed: Arc<Mutex<bool>>,
    }

    #[async_trait]
    impl PipelineStage for CustomStage {
      async fn process(&self, _context: &mut PipelineContext) -> Result<()> {
        let mut processed = self.processed.lock().await;
        *processed = true;
        Ok(())
      }

      fn name(&self) -> &str {
        &self.name
      }

      fn estimated_duration(&self) -> Duration {
        Duration::from_secs(1)
      }
    }

    let mut pipeline = create_test_pipeline().await;
    let processed = Arc::new(Mutex::new(false));

    let custom_stage = Box::new(CustomStage {
      name: "Custom".to_string(),
      processed: processed.clone(),
    });

    pipeline.add_stage(custom_stage);
    assert_eq!(pipeline.stages.len(), 6); // 5 default + 1 custom
  }

  #[tokio::test]
  async fn test_pipeline_error_handling() {
    // Create a stage that always fails
    #[derive(Debug)]
    struct FailingStage;

    #[async_trait]
    impl PipelineStage for FailingStage {
      async fn process(&self, _context: &mut PipelineContext) -> Result<()> {
        Err(VideoCompilerError::validation("Test error"))
      }

      fn name(&self) -> &str {
        "Failing"
      }
    }

    let mut pipeline = create_test_pipeline().await;
    pipeline.stages.clear(); // Remove default stages
    pipeline.add_stage(Box::new(FailingStage));

    let result = pipeline.execute("test_job").await;
    assert!(result.is_err());

    // Check that error count was incremented
    let stats = pipeline.get_statistics();
    assert_eq!(stats.error_count, 1);
  }

  #[tokio::test]
  async fn test_pipeline_skip_stage() {
    // Create a stage that can be skipped
    #[derive(Debug)]
    struct SkippableStage;

    #[async_trait]
    impl PipelineStage for SkippableStage {
      async fn process(&self, _context: &mut PipelineContext) -> Result<()> {
        panic!("This stage should be skipped!");
      }

      fn name(&self) -> &str {
        "Skippable"
      }

      fn can_skip(&self, _context: &PipelineContext) -> bool {
        true
      }
    }

    let mut pipeline = create_test_pipeline().await;
    pipeline.stages.clear();
    pipeline.add_stage(Box::new(SkippableStage));

    // Should not panic because stage is skipped
    let result = pipeline.execute("test_job").await;
    // Will fail because no stages produce output, but won't panic
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_multiple_intermediate_files() {
    let project = ProjectSchema::new("Test".to_string());
    let output_path = PathBuf::from("/tmp/test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    // Add multiple intermediate files
    for i in 0..10 {
      let key = format!("temp_{i}");
      let path = PathBuf::from(format!("/tmp/temp_{i}.mp4"));
      context.add_intermediate_file(key.clone(), path.clone());

      assert_eq!(context.get_intermediate_file(&key), Some(&path));
    }

    // Check that all files are stored
    assert_eq!(context.intermediate_files.len(), 10);
  }

  #[tokio::test]
  async fn test_context_serialization() {
    let stats = PipelineStatistics::default();

    // Test serialization
    let json = serde_json::to_string(&stats).unwrap();
    assert!(json.contains("frames_processed"));
    assert!(json.contains("error_count"));

    // Test deserialization
    let deserialized: PipelineStatistics = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.frames_processed, stats.frames_processed);
    assert_eq!(deserialized.error_count, stats.error_count);
  }
}

// Include extended tests module
#[cfg(test)]
mod pipeline_tests;
