//! Тонкие команды для продвинутых функций FFmpeg

use super::business_logic;
use super::types::*;
use crate::video_compiler::error::Result;
use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;
use crate::video_compiler::ffmpeg_executor::{
  check_ffmpeg_available, get_available_codecs, get_available_formats, FFmpegExecutor,
};
use crate::video_compiler::progress::ProgressUpdate;
use crate::video_compiler::schema::ProjectSchema;
use std::path::Path;
use tokio::sync::mpsc;

/// Генерация превью видео
#[tauri::command]
pub async fn generate_video_preview(
  input_path: String,
  output_path: String,
  duration: f64,
  resolution: Option<(u32, u32)>,
  bitrate: Option<u32>,
) -> Result<()> {
  let params = VideoPreviewParams {
    input_path: input_path.clone(),
    output_path: output_path.clone(),
    duration,
    resolution,
    bitrate,
  };

  business_logic::validate_video_preview_params(&params)?;

  log::debug!("Генерация превью видео: {input_path} -> {output_path}");

  let project = ProjectSchema::new("video_preview".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder
    .build_video_preview_command(
      Path::new(&input_path),
      Path::new(&output_path),
      duration,
      resolution,
      bitrate,
    )
    .await?;

  let executor = FFmpegExecutor::new();
  executor.execute(cmd).await?;

  Ok(())
}

/// Генерация GIF превью
#[tauri::command]
pub async fn generate_gif_preview(
  input_path: String,
  output_path: String,
  start_time: f64,
  duration: f64,
  fps: u32,
  resolution: Option<(u32, u32)>,
) -> Result<()> {
  let params = GifPreviewParams {
    input_path: input_path.clone(),
    output_path: output_path.clone(),
    start_time,
    duration,
    fps,
    resolution,
  };

  business_logic::validate_gif_preview_params(&params)?;

  log::debug!("Генерация GIF превью: {input_path} -> {output_path}");

  let project = ProjectSchema::new("gif_preview".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder
    .build_gif_preview_command(
      Path::new(&input_path),
      Path::new(&output_path),
      start_time,
      duration,
      fps,
      resolution,
    )
    .await?;

  let executor = FFmpegExecutor::new();
  executor.execute(cmd).await?;

  Ok(())
}

/// Объединение видео файлов
#[tauri::command]
pub async fn concat_videos(input_paths: Vec<String>, output_path: String) -> Result<()> {
  let params = ConcatVideosParams {
    input_paths: input_paths.clone(),
    output_path: output_path.clone(),
  };

  business_logic::validate_concat_params(&params)?;

  log::debug!("Объединение видео: {input_paths:?} -> {output_path}");

  let project = ProjectSchema::new("concat_videos".to_string());
  let builder = FFmpegBuilder::new(project);

  let paths: Vec<std::path::PathBuf> = input_paths.iter().map(std::path::PathBuf::from).collect();
  let cmd = builder
    .build_concat_command(&paths, Path::new(&output_path))
    .await?;

  let executor = FFmpegExecutor::new();
  executor.execute(cmd).await?;

  Ok(())
}

/// Применение видео фильтра
#[tauri::command]
pub async fn apply_video_filter(
  input_path: String,
  output_path: String,
  filter_name: String,
  duration: Option<f64>,
) -> Result<()> {
  let params = VideoFilterParams {
    input_path: input_path.clone(),
    output_path: output_path.clone(),
    filter_name: filter_name.clone(),
    duration,
  };

  business_logic::validate_filter_params(&params)?;

  log::debug!("Применение фильтра {filter_name} к видео: {input_path} -> {output_path}");

  let project = ProjectSchema::new("filter_preview".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder
    .build_filter_preview_command(
      Path::new(&input_path),
      Path::new(&output_path),
      &filter_name,
      duration,
    )
    .await?;

  let executor = FFmpegExecutor::new();
  executor.execute(cmd).await?;

  Ok(())
}

/// Анализ медиа файла
#[tauri::command]
pub async fn probe_media_file(input_path: String) -> Result<MediaFileInfo> {
  business_logic::validate_input_path(&input_path)?;

  log::debug!("Анализ медиа файла: {input_path}");

  let project = ProjectSchema::new("probe".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder.build_probe_command(Path::new(&input_path)).await?;

  let executor = FFmpegExecutor::new();
  let result = executor.execute(cmd).await?;

  business_logic::parse_media_file_info(&result.stdout)
}

/// Тестирование аппаратного ускорения
#[tauri::command]
pub async fn test_hardware_acceleration() -> Result<HardwareAccelerationInfo> {
  log::debug!("Тестирование аппаратного ускорения");

  let project = ProjectSchema::new("hwaccel_test".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder.build_hwaccel_test_command().await?;

  let executor = FFmpegExecutor::new();
  let result = executor.execute(cmd).await?;

  Ok(business_logic::parse_hardware_encoders(&result.stdout))
}

/// Генерация превью с субтитрами
#[tauri::command]
pub async fn generate_subtitle_preview(
  video_path: String,
  subtitle_path: String,
  output_path: String,
  start_time: Option<f64>,
) -> Result<()> {
  let params = SubtitlePreviewParams {
    video_path: video_path.clone(),
    subtitle_path: subtitle_path.clone(),
    output_path: output_path.clone(),
    start_time,
  };

  business_logic::validate_subtitle_preview_params(&params)?;

  log::debug!("Генерация превью с субтитрами: {video_path} + {subtitle_path} -> {output_path}");

  let project = ProjectSchema::new("subtitle_preview".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder
    .build_subtitle_preview_command(
      Path::new(&video_path),
      Path::new(&subtitle_path),
      Path::new(&output_path),
      start_time.unwrap_or(0.0),
    )
    .await?;

  let executor = FFmpegExecutor::new();
  executor.execute(cmd).await?;

  Ok(())
}

/// Проверка установки FFmpeg
#[tauri::command]
pub async fn check_ffmpeg_installation() -> Result<FFmpegInstallationInfo> {
  log::debug!("Проверка установки FFmpeg");

  let version_output = check_ffmpeg_available("ffmpeg").await?;
  business_logic::parse_ffmpeg_version(&version_output)
}

/// Получение списка поддерживаемых кодеков
#[tauri::command]
pub async fn get_ffmpeg_codecs() -> Result<Vec<String>> {
  log::debug!("Получение списка поддерживаемых кодеков");

  get_available_codecs("ffmpeg").await
}

/// Получение списка поддерживаемых форматов
#[tauri::command]
pub async fn get_ffmpeg_formats() -> Result<Vec<String>> {
  log::debug!("Получение списка поддерживаемых форматов");

  get_available_formats("ffmpeg").await
}

/// Выполнение FFmpeg команды с отслеживанием прогресса
#[tauri::command]
pub async fn execute_ffmpeg_with_progress(
  command_args: Vec<String>,
) -> Result<FFmpegExecutionResult> {
  if command_args.is_empty() {
    return Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(
        "Command arguments cannot be empty".to_string(),
      ),
    );
  }

  log::debug!(
    "Выполнение FFmpeg с отслеживанием прогресса: {}",
    business_logic::format_command_args(&command_args)
  );

  let (tx, mut rx) = mpsc::channel(100);
  let executor = FFmpegExecutor::with_progress(tx);

  // Создаем команду из аргументов
  let mut cmd = tokio::process::Command::new("ffmpeg");
  cmd.args(&command_args);

  let start_time = std::time::Instant::now();

  // Запускаем выполнение в отдельной задаче
  let handle = tokio::spawn(async move { executor.execute(cmd).await });

  // Обрабатываем обновления прогресса
  let progress_handle = tokio::spawn(async move {
    let mut last_progress = None;
    while let Some(update) = rx.recv().await {
      match update {
        ProgressUpdate::JobStarted { job_id } => {
          log::info!("FFmpeg job started: {job_id}");
        }
        ProgressUpdate::ProgressChanged { job_id, progress } => {
          last_progress = Some(progress.clone());
          log::debug!(
            "FFmpeg progress for job {}: {}%",
            job_id,
            progress.percentage
          );
        }
        ProgressUpdate::JobCompleted {
          job_id,
          output_path,
          duration,
        } => {
          log::info!("FFmpeg job completed: {job_id} -> {output_path} (duration: {duration:?})");
        }
        ProgressUpdate::JobPaused { job_id } => {
          log::info!("FFmpeg job paused: {job_id}");
        }
        ProgressUpdate::JobResumed { job_id } => {
          log::info!("FFmpeg job resumed: {job_id}");
        }
        ProgressUpdate::JobFailed {
          job_id,
          error,
          duration,
        } => {
          log::error!("FFmpeg job failed: {job_id} - {error} (duration: {duration:?})");
        }
        ProgressUpdate::JobCancelled { job_id } => {
          log::warn!("FFmpeg job cancelled: {job_id}");
        }
      }
    }
    last_progress
  });

  // Ждем завершения выполнения
  let result = handle.await.map_err(|e| {
    crate::video_compiler::error::VideoCompilerError::InternalError(format!(
      "Task execution failed: {e}"
    ))
  })??;

  let final_progress = progress_handle.await.map_err(|e| {
    crate::video_compiler::error::VideoCompilerError::InternalError(format!(
      "Progress tracking failed: {e}"
    ))
  })?;

  let duration_ms = start_time.elapsed().as_millis() as u64;

  let execution_result = business_logic::create_execution_result(
    result.exit_code,
    result.stdout,
    result.stderr,
    duration_ms,
    final_progress,
  );

  business_logic::check_execution_success(&execution_result)?;

  Ok(execution_result)
}

/// Простое выполнение FFmpeg команды
#[tauri::command]
pub async fn execute_ffmpeg_simple(command_args: Vec<String>) -> Result<Vec<u8>> {
  if command_args.is_empty() {
    return Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(
        "Command arguments cannot be empty".to_string(),
      ),
    );
  }

  log::debug!(
    "Простое выполнение FFmpeg: {}",
    business_logic::format_command_args(&command_args)
  );

  let executor = FFmpegExecutor::new();

  // Создаем команду из аргументов
  let mut cmd = tokio::process::Command::new("ffmpeg");
  cmd.args(&command_args);

  executor.execute_simple(cmd).await
}

/// Получение информации о выполнении FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_execution_info(command_args: Vec<String>) -> Result<FFmpegExecutionResult> {
  if command_args.is_empty() {
    return Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(
        "Command arguments cannot be empty".to_string(),
      ),
    );
  }

  log::debug!(
    "Выполнение FFmpeg с получением информации: {}",
    business_logic::format_command_args(&command_args)
  );

  let executor = FFmpegExecutor::new();

  // Создаем команду из аргументов
  let mut cmd = tokio::process::Command::new("ffmpeg");
  cmd.args(&command_args);

  let start_time = std::time::Instant::now();
  let result = executor.execute(cmd).await?;
  let duration_ms = start_time.elapsed().as_millis() as u64;

  Ok(business_logic::create_execution_result(
    result.exit_code,
    result.stdout,
    result.stderr,
    duration_ms,
    result.final_progress,
  ))
}
