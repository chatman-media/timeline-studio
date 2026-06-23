//! Tauri команды для анализа видео

use super::{business_logic::*, types::*};
use ts_render_services::VideoCompilerState;
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};
use ts_render::video_compiler::ffmpeg_executor::FFmpegExecutor;
use std::path::Path;
use tauri::State;

/// Получить метаданные видеофайла
#[tauri::command]
pub async fn ffmpeg_get_metadata(file_path: String) -> Result<VideoMetadata> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  let executor = FFmpegExecutor::new();

  // Создаем команду ffprobe для получения метаданных
  let mut cmd = tokio::process::Command::new("ffprobe");
  cmd.args([
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    &file_path,
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| VideoCompilerError::FFmpegError {
      exit_code: None,
      stderr: format!("Ошибка выполнения ffprobe: {e}"),
      command: "ffprobe".to_string(),
    })?;

  if result.exit_code != 0 {
    return Err(VideoCompilerError::FFmpegError {
      exit_code: Some(result.exit_code),
      stderr: result.stderr,
      command: "ffprobe".to_string(),
    });
  }

  // Используем бизнес-логику для парсинга
  parse_ffprobe_metadata(&result.stdout)
    .map_err(|e| VideoCompilerError::SerializationError(format!("Metadata parse error: {e}")))
}

/// Получить метаданные видеофайла (обновленная команда)
#[tauri::command]
pub async fn ffmpeg_get_metadata_enhanced(
  file_path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<VideoMetadata> {
  if !Path::new(&file_path).exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffprobe");
  cmd.args([
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    &file_path,
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| VideoCompilerError::FFmpegError {
      exit_code: None,
      stderr: format!("Ошибка выполнения ffprobe: {e}"),
      command: "ffprobe".to_string(),
    })?;

  if result.exit_code != 0 {
    return Err(VideoCompilerError::FFmpegError {
      exit_code: Some(result.exit_code),
      stderr: result.stderr,
      command: "ffprobe".to_string(),
    });
  }

  parse_ffprobe_metadata(&result.stdout)
    .map_err(|e| VideoCompilerError::SerializationError(format!("Metadata parse error: {e}")))
}

/// Детекция сцен в видео
#[tauri::command]
pub async fn ffmpeg_detect_scenes(
  file_path: String,
  threshold: f64,
  min_scene_length: f64,
) -> Result<SceneDetectionResult> {
  let path = Path::new(&file_path);

  // Используем реальную FFmpeg реализацию
  ts_render_analysis::scene_detection::detect_scenes(
    path,
    threshold,
    min_scene_length,
  )
  .await
}

/// Анализ качества видео
#[tauri::command]
pub async fn ffmpeg_analyze_quality(
  file_path: String,
  sample_rate: f64,
  enable_noise_detection: bool,
  enable_stability_check: bool,
) -> Result<QualityAnalysisResult> {
  let path = Path::new(&file_path);

  // Используем реальную FFmpeg реализацию
  ts_render_analysis::quality::analyze_video_quality(
    path,
    sample_rate,
    enable_noise_detection,
    enable_stability_check,
  )
  .await
}

/// Анализ качества видео (обновленная команда)
#[tauri::command]
pub async fn ffmpeg_analyze_quality_enhanced(
  file_path: String,
  sample_rate: f64,
  enable_noise_detection: bool,
  enable_stability_check: bool,
  _state: State<'_, VideoCompilerState>,
) -> Result<QualityAnalysisResult> {
  let path = Path::new(&file_path);

  if sample_rate <= 0.0 || sample_rate > 10.0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Sample rate должен быть между 0.1 и 10.0".to_string(),
    ));
  }

  log::debug!(
    "Анализ качества видео: {file_path}, sample_rate: {sample_rate}, noise: {enable_noise_detection}, stability: {enable_stability_check}"
  );

  // Используем реальную FFmpeg реализацию
  ts_render_analysis::quality::analyze_video_quality(
    path,
    sample_rate,
    enable_noise_detection,
    enable_stability_check,
  )
  .await
}

/// Детекция тишины в аудио
#[tauri::command]
pub async fn ffmpeg_detect_silence(
  file_path: String,
  threshold: f64,
  min_duration: f64,
) -> Result<SilenceDetectionResult> {
  let path = Path::new(&file_path);

  // Используем реальную FFmpeg реализацию
  ts_render_analysis::silence_detection::detect_silence(
    path,
    threshold,
    min_duration,
  )
  .await
}

/// Анализ движения в видео
#[tauri::command]
pub async fn ffmpeg_analyze_motion(
  file_path: String,
  sensitivity: f64,
) -> Result<MotionAnalysisResult> {
  let path = Path::new(&file_path);

  // Используем реальную FFmpeg реализацию
  ts_render_analysis::motion_analysis::analyze_motion(path, sensitivity).await
}

/// Извлечение ключевых кадров
#[tauri::command]
pub async fn ffmpeg_extract_keyframes(
  file_path: String,
  interval: f64,
  max_frames: u32,
) -> Result<KeyFrameExtractionResult> {
  let path = Path::new(&file_path);

  // Используем реальную FFmpeg реализацию
  ts_render_analysis::keyframes::extract_keyframes(path, interval, max_frames)
    .await
}

/// Анализ аудио
#[tauri::command]
pub async fn ffmpeg_analyze_audio(
  file_path: String,
  sample_rate: f64,
) -> Result<AudioAnalysisResult> {
  let path = Path::new(&file_path);

  // Используем реальную FFmpeg реализацию
  ts_render_analysis::audio_analysis::analyze_audio(path, sample_rate).await
}

/// Быстрый анализ видео
#[tauri::command]
pub async fn ffmpeg_quick_analysis(file_path: String) -> Result<serde_json::Value> {
  let path = Path::new(&file_path);

  // Используем несколько FFmpeg функций для быстрого анализа
  let metadata = ts_render_analysis::analysis::get_video_metadata(path).await?;

  // Базовый анализ качества с минимальным sample rate
  let quality = ts_render_analysis::quality::analyze_video_quality(
    path, 0.5,   // Низкий sample rate для быстрого анализа
    false, // Без детекции шума
    false, // Без проверки стабильности
  )
  .await?;

  // Формируем результат
  Ok(serde_json::json!({
    "duration": metadata.duration,
    "resolution": format!("{}x{}", metadata.width, metadata.height),
    "fps": metadata.fps,
    "codec": metadata.codec,
    "bitrate": metadata.bitrate,
    "overall_quality": quality.overall,
    "brightness": quality.brightness,
    "contrast": quality.contrast,
    "sharpness": quality.sharpness,
    "issues": quality.issues
  }))
}
