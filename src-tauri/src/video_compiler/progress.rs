//! Progress - Модуль отслеживания прогресса рендеринга
//!
//! Этот модуль реализует систему отслеживания прогресса рендеринга видео,
//! включая парсинг вывода FFmpeg, расчет прогресса и уведомления через WebSocket.

use crate::video_compiler::error::{Result, VideoCompilerError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tokio::sync::{mpsc, RwLock};
use uuid::Uuid;

/// Основной трекер прогресса рендеринга
#[derive(Debug)]
pub struct ProgressTracker {
  /// Активные задачи рендеринга
  active_jobs: Arc<RwLock<HashMap<String, RenderJob>>>,
  /// Канал для отправки обновлений прогресса
  progress_sender: mpsc::UnboundedSender<ProgressUpdate>,
  /// Настройки трекера
  settings: ProgressSettings,
}

impl ProgressTracker {
  /// Создать новый трекер прогресса
  pub fn new(progress_sender: mpsc::UnboundedSender<ProgressUpdate>) -> Self {
    Self {
      active_jobs: Arc::new(RwLock::new(HashMap::new())),
      progress_sender,
      settings: ProgressSettings::default(),
    }
  }

  /// Создать новую задачу рендеринга
  pub async fn create_job(
    &self,
    project_name: String,
    output_path: String,
    total_frames: u64,
  ) -> Result<String> {
    let job_id = Uuid::new_v4().to_string();
    let job = RenderJob::new(job_id.clone(), project_name, output_path, total_frames);

    let mut jobs = self.active_jobs.write().await;
    jobs.insert(job_id.clone(), job);

    // Отправляем уведомление о начале
    let update = ProgressUpdate::JobStarted {
      job_id: job_id.clone(),
    };
    let _ = self.progress_sender.send(update);

    log::info!("Создана новая задача рендеринга: {}", job_id);
    Ok(job_id)
  }

  /// Обновить прогресс задачи
  pub async fn update_progress(
    &self,
    job_id: &str,
    current_frame: u64,
    stage: String,
    message: Option<String>,
  ) -> Result<()> {
    let mut jobs = self.active_jobs.write().await;

    if let Some(job) = jobs.get_mut(job_id) {
      job.update_progress(current_frame, stage, message)?;

      // Отправляем обновление прогресса
      let update = ProgressUpdate::ProgressChanged {
        job_id: job_id.to_string(),
        progress: job.get_progress(),
      };
      let _ = self.progress_sender.send(update);

      log::debug!(
        "Обновлен прогресс задачи {}: {:.1}%",
        job_id,
        job.get_progress().percentage
      );
    } else {
      return Err(VideoCompilerError::render(
        job_id,
        "update_progress",
        "Задача не найдена",
      ));
    }

    Ok(())
  }

  /// Завершить задачу успешно
  pub async fn complete_job(&self, job_id: &str, output_path: String) -> Result<()> {
    let mut jobs = self.active_jobs.write().await;

    if let Some(mut job) = jobs.remove(job_id) {
      job.complete(output_path.clone())?;

      // Отправляем уведомление о завершении
      let update = ProgressUpdate::JobCompleted {
        job_id: job_id.to_string(),
        output_path,
        duration: job.get_elapsed_time(),
      };
      let _ = self.progress_sender.send(update);

      log::info!(
        "Задача {} завершена успешно за {:?}",
        job_id,
        job.get_elapsed_time()
      );
    } else {
      return Err(VideoCompilerError::render(
        job_id,
        "complete_job",
        "Задача не найдена",
      ));
    }

    Ok(())
  }

  /// Завершить задачу с ошибкой
  pub async fn fail_job(&self, job_id: &str, error: String) -> Result<()> {
    let mut jobs = self.active_jobs.write().await;

    if let Some(mut job) = jobs.remove(job_id) {
      job.fail(error.clone())?;

      // Отправляем уведомление об ошибке
      let update = ProgressUpdate::JobFailed {
        job_id: job_id.to_string(),
        error: error.clone(),
        duration: job.get_elapsed_time(),
      };
      let _ = self.progress_sender.send(update);

      log::error!("Задача {} завершена с ошибкой: {}", job_id, error);
    } else {
      return Err(VideoCompilerError::render(
        job_id,
        "fail_job",
        "Задача не найдена",
      ));
    }

    Ok(())
  }

  /// Отменить задачу
  pub async fn cancel_job(&self, job_id: &str) -> Result<()> {
    let mut jobs = self.active_jobs.write().await;

    if let Some(mut job) = jobs.remove(job_id) {
      job.cancel()?;

      // Отправляем уведомление об отмене
      let update = ProgressUpdate::JobCancelled {
        job_id: job_id.to_string(),
      };
      let _ = self.progress_sender.send(update);

      log::info!("Задача {} отменена", job_id);
    } else {
      return Err(VideoCompilerError::render(
        job_id,
        "cancel_job",
        "Задача не найдена",
      ));
    }

    Ok(())
  }

  /// Получить информацию о задаче
  pub async fn get_job(&self, job_id: &str) -> Option<RenderJob> {
    let jobs = self.active_jobs.read().await;
    jobs.get(job_id).cloned()
  }

  /// Получить все активные задачи
  pub async fn get_active_jobs(&self) -> Vec<RenderJob> {
    let jobs = self.active_jobs.read().await;
    jobs.values().cloned().collect()
  }

  /// Парсинг вывода FFmpeg для получения прогресса
  pub fn parse_ffmpeg_progress(&self, output: &str) -> Option<FFmpegProgress> {
    // Ищем строки с прогрессом FFmpeg
    for line in output.lines() {
      if line.starts_with("frame=") {
        return self.parse_progress_line(line);
      }
    }
    None
  }

  /// Парсинг строки прогресса FFmpeg
  fn parse_progress_line(&self, line: &str) -> Option<FFmpegProgress> {
    let mut progress = FFmpegProgress::default();

    // Парсим различные поля из строки прогресса
    // Пример: frame= 1234 fps=30 q=28.0 size= 1024kB time=00:00:41.40 bitrate=8000.0kbits/s
    for part in line.split_whitespace() {
      if let Some(value) = part.strip_prefix("frame=") {
        progress.frame = value.parse().unwrap_or(0);
      } else if let Some(value) = part.strip_prefix("fps=") {
        progress.fps = value.parse().unwrap_or(0.0);
      } else if let Some(value) = part.strip_prefix("q=") {
        progress.quality = value.parse().unwrap_or(0.0);
      } else if let Some(value) = part.strip_prefix("size=") {
        progress.size = parse_size(value);
      } else if let Some(value) = part.strip_prefix("time=") {
        progress.time = parse_time(value);
      } else if let Some(value) = part.strip_prefix("bitrate=") {
        progress.bitrate = parse_bitrate(value);
      } else if let Some(value) = part.strip_prefix("speed=") {
        progress.speed = value.trim_end_matches('x').parse().unwrap_or(0.0);
      }
    }

    Some(progress)
  }
}

/// Задача рендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderJob {
  /// Уникальный идентификатор задачи
  pub id: String,
  /// Название проекта
  pub project_name: String,
  /// Путь к выходному файлу
  pub output_path: String,
  /// Статус задачи
  pub status: RenderStatus,
  /// Общее количество кадров
  pub total_frames: u64,
  /// Текущий кадр
  pub current_frame: u64,
  /// Текущий этап рендеринга
  pub current_stage: String,
  /// Время создания задачи
  pub created_at: SystemTime,
  /// Время начала рендеринга
  pub started_at: Option<SystemTime>,
  /// Время завершения рендеринга
  pub completed_at: Option<SystemTime>,
  /// Сообщение о состоянии
  pub message: Option<String>,
  /// Ошибка (если есть)
  pub error: Option<String>,
}

impl RenderJob {
  /// Создать новую задачу рендеринга
  pub fn new(id: String, project_name: String, output_path: String, total_frames: u64) -> Self {
    Self {
      id,
      project_name,
      output_path,
      status: RenderStatus::Queued,
      total_frames,
      current_frame: 0,
      current_stage: "Queued".to_string(),
      created_at: SystemTime::now(),
      started_at: None,
      completed_at: None,
      message: None,
      error: None,
    }
  }

  /// Начать выполнение задачи
  pub fn start(&mut self) -> Result<()> {
    if self.status != RenderStatus::Queued {
      return Err(VideoCompilerError::render(
        &self.id,
        "start",
        "Задача не в состоянии ожидания",
      ));
    }

    self.status = RenderStatus::Processing;
    self.started_at = Some(SystemTime::now());
    self.current_stage = "Starting".to_string();
    Ok(())
  }

  /// Обновить прогресс задачи
  pub fn update_progress(
    &mut self,
    current_frame: u64,
    stage: String,
    message: Option<String>,
  ) -> Result<()> {
    if self.status != RenderStatus::Processing {
      return Err(VideoCompilerError::render(
        &self.id,
        "update_progress",
        "Задача не выполняется",
      ));
    }

    self.current_frame = current_frame.min(self.total_frames);
    self.current_stage = stage;
    self.message = message;
    Ok(())
  }

  /// Завершить задачу успешно
  pub fn complete(&mut self, final_output_path: String) -> Result<()> {
    if self.status != RenderStatus::Processing {
      return Err(VideoCompilerError::render(
        &self.id,
        "complete",
        "Задача не выполняется",
      ));
    }

    self.status = RenderStatus::Completed;
    self.completed_at = Some(SystemTime::now());
    self.output_path = final_output_path;
    self.current_frame = self.total_frames;
    self.current_stage = "Completed".to_string();
    Ok(())
  }

  /// Завершить задачу с ошибкой
  pub fn fail(&mut self, error: String) -> Result<()> {
    if self.status == RenderStatus::Completed {
      return Err(VideoCompilerError::render(
        &self.id,
        "fail",
        "Задача уже завершена",
      ));
    }

    self.status = RenderStatus::Failed;
    self.completed_at = Some(SystemTime::now());
    self.error = Some(error);
    self.current_stage = "Failed".to_string();
    Ok(())
  }

  /// Отменить задачу
  pub fn cancel(&mut self) -> Result<()> {
    if matches!(self.status, RenderStatus::Completed | RenderStatus::Failed) {
      return Err(VideoCompilerError::render(
        &self.id,
        "cancel",
        "Задача уже завершена",
      ));
    }

    self.status = RenderStatus::Cancelled;
    self.completed_at = Some(SystemTime::now());
    self.current_stage = "Cancelled".to_string();
    Ok(())
  }

  /// Получить прогресс рендеринга
  pub fn get_progress(&self) -> RenderProgress {
    let percentage = if self.total_frames > 0 {
      (self.current_frame as f32 / self.total_frames as f32) * 100.0
    } else {
      0.0
    };

    let elapsed_time = self.get_elapsed_time();
    let estimated_remaining = if percentage > 0.0 && percentage < 100.0 {
      let total_estimated = elapsed_time.as_secs_f32() * (100.0 / percentage);
      Some(Duration::from_secs_f32(
        total_estimated - elapsed_time.as_secs_f32(),
      ))
    } else {
      None
    };

    RenderProgress {
      job_id: self.id.clone(),
      stage: self.current_stage.clone(),
      percentage,
      current_frame: self.current_frame,
      total_frames: self.total_frames,
      elapsed_time,
      estimated_remaining,
      status: self.status.clone(),
      message: self.message.clone(),
    }
  }

  /// Получить время выполнения
  pub fn get_elapsed_time(&self) -> Duration {
    let start_time = self.started_at.unwrap_or(self.created_at);
    let end_time = self.completed_at.unwrap_or_else(SystemTime::now);
    end_time
      .duration_since(start_time)
      .unwrap_or(Duration::ZERO)
  }
}

/// Статус рендеринга
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum RenderStatus {
  /// В очереди
  Queued,
  /// Выполняется
  Processing,
  /// Завершено успешно
  Completed,
  /// Завершено с ошибкой
  Failed,
  /// Отменено
  Cancelled,
}

/// Прогресс рендеринга
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RenderProgress {
  /// ID задачи
  pub job_id: String,
  /// Текущий этап
  pub stage: String,
  /// Процент выполнения (0.0 - 100.0)
  pub percentage: f32,
  /// Текущий кадр
  pub current_frame: u64,
  /// Общее количество кадров
  pub total_frames: u64,
  /// Прошедшее время
  pub elapsed_time: Duration,
  /// Оценочное оставшееся время
  pub estimated_remaining: Option<Duration>,
  /// Статус задачи
  pub status: RenderStatus,
  /// Дополнительное сообщение
  pub message: Option<String>,
}

/// Обновления прогресса для WebSocket
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum ProgressUpdate {
  /// Задача начата
  JobStarted { job_id: String },
  /// Прогресс изменился
  ProgressChanged {
    job_id: String,
    progress: RenderProgress,
  },
  /// Задача завершена
  JobCompleted {
    job_id: String,
    output_path: String,
    duration: Duration,
  },
  /// Задача завершилась с ошибкой
  JobFailed {
    job_id: String,
    error: String,
    duration: Duration,
  },
  /// Задача отменена
  JobCancelled { job_id: String },
}

/// Настройки трекера прогресса
#[derive(Debug, Clone)]
pub struct ProgressSettings {
  /// Интервал обновления прогресса
  pub update_interval: Duration,
  /// Максимальное количество активных задач
  pub max_concurrent_jobs: usize,
  /// Таймаут для задач
  pub job_timeout: Duration,
}

impl Default for ProgressSettings {
  fn default() -> Self {
    Self {
      update_interval: Duration::from_millis(500),
      max_concurrent_jobs: 3,
      job_timeout: Duration::from_secs(3600), // 1 час
    }
  }
}

/// Прогресс FFmpeg
#[derive(Debug, Default, Clone)]
pub struct FFmpegProgress {
  /// Номер кадра
  pub frame: u64,
  /// FPS
  pub fps: f32,
  /// Качество
  pub quality: f32,
  /// Размер выходного файла
  pub size: u64,
  /// Время обработки
  pub time: Duration,
  /// Битрейт
  pub bitrate: f32,
  /// Скорость обработки
  pub speed: f32,
}

/// Парсинг размера файла из строки FFmpeg
fn parse_size(size_str: &str) -> u64 {
  let size_str = size_str.trim();
  if let Some(value_str) = size_str.strip_suffix("kB") {
    value_str.parse::<f64>().unwrap_or(0.0) as u64 * 1024
  } else if let Some(value_str) = size_str.strip_suffix("MB") {
    value_str.parse::<f64>().unwrap_or(0.0) as u64 * 1024 * 1024
  } else if let Some(value_str) = size_str.strip_suffix("GB") {
    value_str.parse::<f64>().unwrap_or(0.0) as u64 * 1024 * 1024 * 1024
  } else {
    size_str.parse().unwrap_or(0)
  }
}

/// Парсинг времени из строки FFmpeg (формат HH:MM:SS.ss)
fn parse_time(time_str: &str) -> Duration {
  let parts: Vec<&str> = time_str.split(':').collect();
  if parts.len() == 3 {
    let hours: f64 = parts[0].parse().unwrap_or(0.0);
    let minutes: f64 = parts[1].parse().unwrap_or(0.0);
    let seconds: f64 = parts[2].parse().unwrap_or(0.0);

    let total_seconds = hours * 3600.0 + minutes * 60.0 + seconds;
    Duration::from_secs_f64(total_seconds)
  } else {
    Duration::ZERO
  }
}

/// Парсинг битрейта из строки FFmpeg
fn parse_bitrate(bitrate_str: &str) -> f32 {
  let bitrate_str = bitrate_str.trim();
  if let Some(value_str) = bitrate_str.strip_suffix("kbits/s") {
    value_str.parse().unwrap_or(0.0)
  } else if let Some(value_str) = bitrate_str.strip_suffix("Mbits/s") {
    value_str.parse::<f32>().unwrap_or(0.0) * 1000.0
  } else {
    bitrate_str.parse().unwrap_or(0.0)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tokio::sync::mpsc;

  #[tokio::test]
  async fn test_progress_tracker_creation() {
    let (tx, _rx) = mpsc::unbounded_channel();
    let tracker = ProgressTracker::new(tx);

    let jobs = tracker.get_active_jobs().await;
    assert_eq!(jobs.len(), 0);
  }

  #[tokio::test]
  async fn test_job_lifecycle() {
    let (tx, mut rx) = mpsc::unbounded_channel();
    let tracker = ProgressTracker::new(tx);

    // Создаем задачу
    let job_id = tracker
      .create_job(
        "Test Project".to_string(),
        "/test/output.mp4".to_string(),
        1000,
      )
      .await
      .unwrap();

    // Проверяем уведомление о создании
    let update = rx.recv().await.unwrap();
    assert!(matches!(update, ProgressUpdate::JobStarted { .. }));

    // Обновляем прогресс
    tracker
      .update_progress(&job_id, 500, "Encoding".to_string(), None)
      .await
      .unwrap();

    // Проверяем уведомление о прогрессе
    let update = rx.recv().await.unwrap();
    if let ProgressUpdate::ProgressChanged { progress, .. } = update {
      assert_eq!(progress.current_frame, 500);
      assert_eq!(progress.percentage, 50.0);
    } else {
      panic!("Ожидалось ProgressChanged");
    }

    // Завершаем задачу
    tracker
      .complete_job(&job_id, "/test/final.mp4".to_string())
      .await
      .unwrap();

    // Проверяем уведомление о завершении
    let update = rx.recv().await.unwrap();
    assert!(matches!(update, ProgressUpdate::JobCompleted { .. }));

    // Задача должна быть удалена из активных
    let jobs = tracker.get_active_jobs().await;
    assert_eq!(jobs.len(), 0);
  }

  #[tokio::test]
  async fn test_render_job() {
    let mut job = RenderJob::new(
      "test-123".to_string(),
      "Test Project".to_string(),
      "/test/output.mp4".to_string(),
      1000,
    );

    assert_eq!(job.status, RenderStatus::Queued);

    // Начинаем задачу
    job.start().unwrap();
    assert_eq!(job.status, RenderStatus::Processing);
    assert!(job.started_at.is_some());

    // Обновляем прогресс
    job
      .update_progress(250, "Encoding".to_string(), Some("Frame 250".to_string()))
      .unwrap();
    assert_eq!(job.current_frame, 250);

    let progress = job.get_progress();
    assert_eq!(progress.percentage, 25.0);

    // Завершаем задачу
    job.complete("/test/final.mp4".to_string()).unwrap();
    assert_eq!(job.status, RenderStatus::Completed);
    assert!(job.completed_at.is_some());
  }

  #[test]
  fn test_ffmpeg_progress_parsing() {
    let (tx, _rx) = mpsc::unbounded_channel();
    let tracker = ProgressTracker::new(tx);

    let ffmpeg_output =
      "frame= 1234 fps=30.5 q=28.0 size= 2048kB time=00:01:23.45 bitrate=1500.0kbits/s speed=1.2x";
    let progress = tracker.parse_ffmpeg_progress(ffmpeg_output).unwrap();

    assert_eq!(progress.frame, 1234);
    assert_eq!(progress.fps, 30.5);
    assert_eq!(progress.quality, 28.0);
    assert_eq!(progress.size, 2048 * 1024);
    assert_eq!(progress.bitrate, 1500.0);
    assert_eq!(progress.speed, 1.2);
  }

  #[test]
  fn test_size_parsing() {
    assert_eq!(parse_size("1024kB"), 1024 * 1024);
    assert_eq!(parse_size("2MB"), 2 * 1024 * 1024);
    assert_eq!(parse_size("1GB"), 1024 * 1024 * 1024);
    assert_eq!(parse_size("512"), 512);
  }

  #[test]
  fn test_time_parsing() {
    let duration = parse_time("01:23:45.67");
    assert_eq!(duration.as_secs(), 3600 + 23 * 60 + 45);

    let duration = parse_time("00:00:30.50");
    assert_eq!(duration.as_secs_f64(), 30.5);
  }

  #[test]
  fn test_bitrate_parsing() {
    assert_eq!(parse_bitrate("1500.0kbits/s"), 1500.0);
    assert_eq!(parse_bitrate("1.5Mbits/s"), 1500.0);
    assert_eq!(parse_bitrate("8000"), 8000.0);
  }

  #[tokio::test]
  async fn test_job_error_handling() {
    let (tx, mut rx) = mpsc::unbounded_channel();
    let tracker = ProgressTracker::new(tx);

    let job_id = tracker
      .create_job(
        "Error Test".to_string(),
        "/test/output.mp4".to_string(),
        100,
      )
      .await
      .unwrap();

    // Пропускаем уведомление о создании
    rx.recv().await;

    // Завершаем с ошибкой
    tracker
      .fail_job(&job_id, "FFmpeg error".to_string())
      .await
      .unwrap();

    // Проверяем уведомление об ошибке
    let update = rx.recv().await.unwrap();
    if let ProgressUpdate::JobFailed { error, .. } = update {
      assert_eq!(error, "FFmpeg error");
    } else {
      panic!("Ожидалось JobFailed");
    }
  }

  #[tokio::test]
  async fn test_job_cancellation() {
    let (tx, mut rx) = mpsc::unbounded_channel();
    let tracker = ProgressTracker::new(tx);

    let job_id = tracker
      .create_job(
        "Cancel Test".to_string(),
        "/test/output.mp4".to_string(),
        100,
      )
      .await
      .unwrap();

    // Пропускаем уведомление о создании
    rx.recv().await;

    // Отменяем задачу
    tracker.cancel_job(&job_id).await.unwrap();

    // Проверяем уведомление об отмене
    let update = rx.recv().await.unwrap();
    assert!(matches!(update, ProgressUpdate::JobCancelled { .. }));
  }
}
