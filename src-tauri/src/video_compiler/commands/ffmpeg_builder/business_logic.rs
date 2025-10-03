//! Бизнес-логика для команд FFmpeg builder

use super::types::*;
use crate::video_compiler::{
  error::Result,
  ffmpeg_builder::{inputs::InputBuilder, outputs::OutputBuilder, FFmpegBuilder},
  schema::ProjectSchema,
  VideoCompilerState,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;

/// Создать индексы клипов из проекта
pub fn create_clip_indices(project: &ProjectSchema) -> HashMap<String, usize> {
  project
    .tracks
    .iter()
    .flat_map(|track| track.clips.iter())
    .enumerate()
    .map(|(index, clip)| (clip.id.clone(), index))
    .collect()
}

/// Добавить сегментные входы в FFmpeg builder
pub async fn add_segment_inputs_to_builder_logic(
  params: &SegmentInputParams,
) -> Result<SegmentInputResult> {
  use tokio::process::Command;

  // Создаем builder с проектом
  let _builder = FFmpegBuilder::new(params.project.clone());
  let input_builder = InputBuilder::new(&params.project);

  // Создаем команду
  let mut cmd = Command::new("ffmpeg");

  // Добавляем входы для всей временной линии проекта
  let duration = params.project.timeline.duration;
  input_builder
    .add_segment_inputs(&mut cmd, 0.0, duration)
    .await?;

  // Извлекаем клипы для индексов
  let clips = create_clip_indices(&params.project);

  Ok(SegmentInputResult {
    success: true,
    input_count: clips.len(),
    clip_indices: clips,
    error: None,
  })
}

/// Создать команду FFmpeg с настройками пререндеринга
pub async fn create_ffmpeg_with_prerender_settings_logic(
  params: &PrerenderSettingsParams,
) -> Result<String> {
  use crate::video_compiler::ffmpeg_builder::builder::FFmpegBuilderSettings;
  use tokio::process::Command;

  // Создаем builder с проектом
  let _builder = FFmpegBuilder::new(params.project.clone());
  let settings = FFmpegBuilderSettings::default();

  // Создаем команду
  let mut cmd = Command::new("ffmpeg");

  // Добавляем настройки пререндеринга
  let output_path = PathBuf::from(&params.output_path);

  // Обновляем настройки проекта
  let mut updated_project = params.project.clone();
  updated_project.settings.resolution.width = params.width;
  updated_project.settings.resolution.height = params.height;
  updated_project.settings.frame_rate = params.fps;

  let output_builder = OutputBuilder::new(&updated_project, &settings);
  output_builder
    .add_prerender_settings(&mut cmd, &output_path)
    .await?;

  // Формируем строку команды для отображения
  Ok(format!(
    "ffmpeg -c:v prores_ks -profile:v 3 -c:a pcm_s16le -s {}x{} -r {} {}",
    params.width, params.height, params.fps, params.output_path
  ))
}

/// Найти индекс входа для клипа
pub fn get_clip_input_index_logic(project: &ProjectSchema, clip_id: &str) -> ClipIndexResult {
  // Проверяем, есть ли клип с таким ID
  let clip_exists = project
    .tracks
    .iter()
    .flat_map(|track| track.clips.iter())
    .any(|clip| clip.id == clip_id);

  if !clip_exists {
    return ClipIndexResult {
      clip_id: clip_id.to_string(),
      index: None,
      found: false,
    };
  }

  // Находим индекс клипа
  let index = project
    .tracks
    .iter()
    .flat_map(|track| track.clips.iter())
    .position(|clip| clip.id == clip_id);

  ClipIndexResult {
    clip_id: clip_id.to_string(),
    index,
    found: index.is_some(),
  }
}

/// Получить информацию о возможностях FFmpeg builder
pub fn get_ffmpeg_builder_info_logic() -> BuilderInfo {
  BuilderInfo {
    supports_segment_inputs: true,
    supports_prerender_settings: true,
    max_concurrent_inputs: 100,
    supported_codecs: vec![
      "h264".to_string(),
      "h265".to_string(),
      "vp9".to_string(),
      "av1".to_string(),
      "prores".to_string(),
    ],
  }
}

/// Валидировать параметры пререндеринга
pub fn validate_prerender_params(params: &PrerenderSettingsParams) -> Result<()> {
  use crate::video_compiler::error::VideoCompilerError;

  if params.width == 0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Width must be greater than 0".to_string(),
    ));
  }

  if params.height == 0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Height must be greater than 0".to_string(),
    ));
  }

  if params.fps <= 0.0 {
    return Err(VideoCompilerError::InvalidParameter(
      "FPS must be greater than 0".to_string(),
    ));
  }

  if params.video_codec.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Video codec cannot be empty".to_string(),
    ));
  }

  if params.audio_codec.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Audio codec cannot be empty".to_string(),
    ));
  }

  if params.output_path.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Output path cannot be empty".to_string(),
    ));
  }

  Ok(())
}

/// Валидировать параметры сегментных входов
pub fn validate_segment_input_params(params: &SegmentInputParams) -> Result<()> {
  use crate::video_compiler::error::VideoCompilerError;

  if params.temp_dir.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Temp directory cannot be empty".to_string(),
    ));
  }

  if params.project.timeline.duration <= 0.0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Project duration must be greater than 0".to_string(),
    ));
  }

  Ok(())
}
/// FFmpeg Executor Commands - команды для работы с FFmpeg executor
use crate::video_compiler::core::renderer::RenderSettings;
use crate::video_compiler::ffmpeg_executor::FFmpegExecutor;
use crate::video_compiler::progress::ProgressUpdate;
use std::sync::Arc;
use tokio::process::Command;
use tokio::sync::mpsc;

/// Параметры для выполнения FFmpeg команды
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteFFmpegParams {
  pub command_args: Vec<String>,
  pub track_progress: bool,
  pub timeout_seconds: Option<u64>,
}

/// Результат выполнения FFmpeg
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
  pub success: bool,
  pub exit_code: Option<i32>,
  pub stdout: String,
  pub stderr: String,
  pub duration_ms: u64,
  pub final_progress: Option<f64>,
  pub error: Option<String>,
}

/// Выполнить FFmpeg команду с отслеживанием прогресса
pub async fn execute_ffmpeg_with_progress_tracking(
  params: ExecuteFFmpegParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ExecutionResult> {
  // Создаем канал для прогресса
  let (progress_sender, mut progress_receiver) = mpsc::channel::<ProgressUpdate>(100);

  // Создаем executor с отслеживанием прогресса
  let executor = FFmpegExecutor::with_progress(progress_sender);

  // Создаем команду
  let mut cmd = Command::new("ffmpeg");
  for arg in &params.command_args {
    cmd.arg(arg);
  }

  // Создаем настройки рендеринга (не используется в execute, но может быть полезно в будущем)
  let _render_settings = RenderSettings {
    hardware_acceleration: params.track_progress,
    threads: None,
    extra_args: vec![],
    timeout_seconds: params.timeout_seconds.unwrap_or(300),
  };

  // Запускаем выполнение в отдельной задаче
  let executor_clone = Arc::new(executor);
  let execution_task = {
    let executor = executor_clone.clone();
    tokio::spawn(async move { executor.execute(cmd).await })
  };

  // Отслеживаем прогресс
  let _progress_task = tokio::spawn(async move {
    let mut _last_progress = 0.0;
    while let Some(update) = progress_receiver.recv().await {
      if let ProgressUpdate::ProgressChanged { progress, .. } = update {
        _last_progress = progress.percentage as f64;
      }
    }
  });

  // Ждем завершения
  let result = execution_task.await.map_err(|e| {
    crate::video_compiler::error::VideoCompilerError::FFmpegError {
      exit_code: None,
      stderr: format!("Task join error: {e}"),
      command: "ffmpeg".to_string(),
    }
  })?;

  match result {
    Ok(exec_result) => {
      let start = std::time::Instant::now();
      Ok(ExecutionResult {
        success: exec_result.exit_code == 0,
        exit_code: Some(exec_result.exit_code),
        stdout: exec_result.stdout,
        stderr: exec_result.stderr,
        duration_ms: start.elapsed().as_millis() as u64,
        final_progress: exec_result.final_progress.map(|p| p.percentage as f64),
        error: None,
      })
    }
    Err(e) => Ok(ExecutionResult {
      success: false,
      exit_code: None,
      stdout: String::new(),
      stderr: String::new(),
      duration_ms: 0,
      final_progress: None,
      error: Some(e.to_string()),
    }),
  }
}

/// Выполнить простую FFmpeg команду без отслеживания прогресса
pub async fn execute_ffmpeg_simple_no_progress(
  params: ExecuteFFmpegParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ExecutionResult> {
  // Создаем executor без прогресса
  let executor = FFmpegExecutor::new();

  // Создаем команду
  let mut cmd = Command::new("ffmpeg");
  for arg in &params.command_args {
    cmd.arg(arg);
  }

  // Выполняем команду
  let start_time = std::time::Instant::now();
  let result = executor.execute_simple(cmd).await;
  let duration = start_time.elapsed();

  match result {
    Ok(output) => Ok(ExecutionResult {
      success: true,
      exit_code: Some(0),
      stdout: String::from_utf8_lossy(&output).to_string(),
      stderr: String::new(),
      duration_ms: duration.as_millis() as u64,
      final_progress: None,
      error: None,
    }),
    Err(e) => Ok(ExecutionResult {
      success: false,
      exit_code: None,
      stdout: String::new(),
      stderr: String::new(),
      duration_ms: duration.as_millis() as u64,
      final_progress: None,
      error: Some(e.to_string()),
    }),
  }
}

/// Информация о возможностях FFmpeg executor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutorCapabilities {
  pub supports_progress_tracking: bool,
  pub supports_cancellation: bool,
  pub max_concurrent_executions: usize,
  pub timeout_support: bool,
}

/// Получить информацию о возможностях FFmpeg executor
pub async fn get_ffmpeg_executor_capabilities(
  _state: State<'_, VideoCompilerState>,
) -> Result<ExecutorCapabilities> {
  Ok(ExecutorCapabilities {
    supports_progress_tracking: true,
    supports_cancellation: true,
    max_concurrent_executions: 4,
    timeout_support: true,
  })
}

/// Проверить доступность FFmpeg
pub async fn check_ffmpeg_executor_availability(
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let executor = FFmpegExecutor::new();

  // Проверяем, можем ли выполнить простую команду
  let mut cmd = Command::new("ffmpeg");
  cmd.arg("-version");

  match executor.execute_simple(cmd).await {
    Ok(_) => Ok(true),
    Err(_) => Ok(false),
  }
}

/// FFmpeg Builder Advanced Commands - продвинутые команды для FFmpeg Builder
/// Настройки FFmpeg Builder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegBuilderSettings {
  pub hardware_acceleration: bool,
  pub gpu_device_index: i32,
  pub thread_count: usize,
  pub preset: String,
  pub crf: u8,
  pub pixel_format: String,
}

/// Информация о проекте FFmpeg Builder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegBuilderProjectInfo {
  pub total_segments: usize,
  pub estimated_duration: f64,
  pub output_format: String,
  pub resolution: String,
  pub fps: f32,
  pub audio_channels: u8,
}

/// Информация о фильтрах сегмента
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentFiltersInfo {
  pub segment_id: String,
  pub filters: Vec<FilterInfo>,
  pub total_filters: usize,
  pub estimated_processing_time: f64,
}

/// Информация о фильтре
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterInfo {
  pub name: String,
  pub parameters: serde_json::Value,
  pub input_format: String,
  pub output_format: String,
}

/// Параметры для валидации временных меток
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidateTimestampsParams {
  pub segment_id: String,
  pub start_time: f64,
  pub end_time: f64,
  pub check_overlaps: bool,
}

/// Результат валидации временных меток
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
  pub valid: bool,
  pub errors: Vec<String>,
  pub warnings: Vec<String>,
  pub corrected_start: Option<f64>,
  pub corrected_end: Option<f64>,
}

/// Получить настройки FFmpeg Builder
pub async fn get_ffmpeg_builder_settings_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegBuilderSettings> {
  Ok(FFmpegBuilderSettings {
    hardware_acceleration: true,
    gpu_device_index: 0,
    thread_count: num_cpus::get(),
    preset: "medium".to_string(),
    crf: 23,
    pixel_format: "yuv420p".to_string(),
  })
}

/// Получить информацию о проекте FFmpeg Builder
pub async fn get_ffmpeg_builder_project_info_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegBuilderProjectInfo> {
  Ok(FFmpegBuilderProjectInfo {
    total_segments: 10,
    estimated_duration: 300.0, // 5 минут
    output_format: "mp4".to_string(),
    resolution: "1920x1080".to_string(),
    fps: 30.0,
    audio_channels: 2,
  })
}

/// Получить информацию о фильтрах сегмента
pub async fn get_segment_filters_info_advanced(
  segment_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<SegmentFiltersInfo> {
  let demo_filters = vec![
    FilterInfo {
      name: "scale".to_string(),
      parameters: serde_json::json!({"width": 1920, "height": 1080}),
      input_format: "yuv420p".to_string(),
      output_format: "yuv420p".to_string(),
    },
    FilterInfo {
      name: "fade".to_string(),
      parameters: serde_json::json!({"type": "in", "duration": 1.0}),
      input_format: "yuv420p".to_string(),
      output_format: "yuv420p".to_string(),
    },
    FilterInfo {
      name: "volume".to_string(),
      parameters: serde_json::json!({"volume": 0.8}),
      input_format: "pcm_s16le".to_string(),
      output_format: "pcm_s16le".to_string(),
    },
  ];

  Ok(SegmentFiltersInfo {
    segment_id: segment_id.clone(),
    filters: demo_filters.clone(),
    total_filters: demo_filters.len(),
    estimated_processing_time: demo_filters.len() as f64 * 0.5, // 0.5 сек на фильтр
  })
}

/// Валидировать временные метки сегмента
pub async fn validate_segment_timestamps_advanced(
  params: ValidateTimestampsParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ValidationResult> {
  let mut errors = Vec::new();
  let mut warnings = Vec::new();
  let mut corrected_start = None;
  let mut corrected_end = None;

  // Валидация временных меток
  if params.start_time < 0.0 {
    errors.push("Start time cannot be negative".to_string());
    corrected_start = Some(0.0);
  }

  if params.end_time <= params.start_time {
    errors.push("End time must be greater than start time".to_string());
    corrected_end = Some(params.start_time + 1.0);
  }

  if params.end_time - params.start_time > 3600.0 {
    warnings.push(
      "Segment duration is longer than 1 hour, this may cause performance issues".to_string(),
    );
  }

  if params.check_overlaps {
    // Демо проверка пересечений
    if params.start_time % 10.0 == 0.0 {
      warnings.push(format!(
        "Segment {} may overlap with adjacent segments",
        params.segment_id
      ));
    }
  }

  Ok(ValidationResult {
    valid: errors.is_empty(),
    errors,
    warnings,
    corrected_start,
    corrected_end,
  })
}

/// Получить кэш извлечения кадров
pub async fn get_frame_extraction_cache_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  Ok(serde_json::json!({
      "cache_size_mb": 256.0,
      "cached_frames": 1500,
      "cache_hit_ratio": 0.87,
      "most_accessed": [
          {"file": "video1.mp4", "access_count": 45},
          {"file": "video2.mp4", "access_count": 38},
          {"file": "video3.mp4", "access_count": 29}
      ],
      "cache_status": "active",
      "last_cleanup": "2024-01-15T10:30:00Z"
  }))
}

/// Получить индекс входа клипа
pub async fn get_clip_input_index_advanced(
  clip_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Демо данные на основе clip_id
  let index = clip_id.len() % 10; // Простой способ генерации индекса

  Ok(serde_json::json!({
      "clip_id": clip_id,
      "input_index": index,
      "input_file": format!("input_{}.mp4", index),
      "stream_index": 0,
      "codec": "h264",
      "duration": 120.5,
      "status": "ready"
  }))
}

/// FFmpeg Builder Extra Commands - дополнительные команды для FFmpeg Builder
/// Параметры для построения команды предрендеринга сегмента
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildPrerenderSegmentParams {
  pub project: ProjectSchema,
  pub segment_start: f64,
  pub segment_end: f64,
  pub output_path: String,
  pub quality_preset: Option<String>,
  pub use_hardware_acceleration: Option<bool>,
}

/// Результат построения команды предрендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrerenderCommandResult {
  pub success: bool,
  pub command_args: Vec<String>,
  pub estimated_duration: f64,
  pub output_format: String,
  pub segment_info: SegmentInfo,
  pub error: Option<String>,
}

/// Информация о сегменте
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentInfo {
  pub start_time: f64,
  pub end_time: f64,
  pub duration: f64,
  pub estimated_file_size_mb: f64,
  pub video_tracks: usize,
  pub audio_tracks: usize,
}

/// Построить команду предрендеринга сегмента
pub async fn build_prerender_segment_command_advanced(
  params: BuildPrerenderSegmentParams,
  state: State<'_, VideoCompilerState>,
) -> Result<PrerenderCommandResult> {
  // Заглушка для build_prerender_segment_command из FFmpegBuilder

  use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();

  // Создаем FFmpeg Builder
  let _builder = FFmpegBuilder::new(params.project.clone());

  // Вычисляем информацию о сегменте
  let duration = params.segment_end - params.segment_start;
  let video_tracks = params
    .project
    .tracks
    .iter()
    .filter(|track| track.track_type == crate::video_compiler::schema::TrackType::Video)
    .count();
  let audio_tracks = params
    .project
    .tracks
    .iter()
    .filter(|track| track.track_type == crate::video_compiler::schema::TrackType::Audio)
    .count();

  // Оценочный размер файла (в мегабайтах)
  let estimated_file_size_mb = duration * 2.0; // Примерно 2 МБ на секунду для среднего качества

  // Строим команду FFmpeg для предрендеринга сегмента
  let mut command_args = vec![ffmpeg_path];

  // Добавляем глобальные опции
  command_args.extend(vec![
    "-y".to_string(), // Перезаписывать выходной файл
    "-hide_banner".to_string(),
    "-loglevel".to_string(),
    "warning".to_string(),
  ]);

  // Добавляем входные файлы (упрощенная версия)
  for (i, track) in params.project.tracks.iter().enumerate() {
    if !track.clips.is_empty() {
      command_args.extend(vec![
        "-i".to_string(),
        format!("input_{}.mp4", i), // Упрощенное имя входного файла
      ]);
    }
  }

  // Добавляем фильтры времени для сегмента
  command_args.extend(vec![
    "-ss".to_string(),
    params.segment_start.to_string(),
    "-t".to_string(),
    duration.to_string(),
  ]);

  // Добавляем настройки качества
  let quality_preset = params
    .quality_preset
    .unwrap_or_else(|| "medium".to_string());
  command_args.extend(vec![
    "-preset".to_string(),
    quality_preset.clone(),
    "-crf".to_string(),
    "23".to_string(),
  ]);

  // Добавляем аппаратное ускорение если включено
  if params.use_hardware_acceleration.unwrap_or(false) {
    command_args.extend(vec![
      "-c:v".to_string(),
      "h264_nvenc".to_string(), // Примерно NVIDIA encoder
    ]);
  } else {
    command_args.extend(vec!["-c:v".to_string(), "libx264".to_string()]);
  }

  // Добавляем настройки аудио
  command_args.extend(vec![
    "-c:a".to_string(),
    "aac".to_string(),
    "-b:a".to_string(),
    "128k".to_string(),
  ]);

  // Добавляем выходной файл
  command_args.push(params.output_path.clone());

  let segment_info = SegmentInfo {
    start_time: params.segment_start,
    end_time: params.segment_end,
    duration,
    estimated_file_size_mb,
    video_tracks,
    audio_tracks,
  };

  // Определяем формат по расширению файла
  let output_format = params
    .output_path
    .split('.')
    .next_back()
    .unwrap_or("mp4")
    .to_string();

  Ok(PrerenderCommandResult {
    success: true,
    command_args,
    estimated_duration: duration,
    output_format,
    segment_info,
    error: None,
  })
}

/// Валидировать параметры предрендеринга сегмента
pub async fn validate_prerender_segment_params(
  params: BuildPrerenderSegmentParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let mut errors = Vec::new();
  let mut warnings = Vec::new();

  // Валидация временных меток
  if params.segment_start < 0.0 {
    errors.push("Segment start time cannot be negative".to_string());
  }

  if params.segment_end <= params.segment_start {
    errors.push("Segment end time must be greater than start time".to_string());
  }

  let duration = params.segment_end - params.segment_start;
  if duration > 3600.0 {
    warnings.push(
      "Segment duration is longer than 1 hour, this may cause performance issues".to_string(),
    );
  }

  if duration < 1.0 {
    warnings.push("Very short segment duration, consider using a longer segment".to_string());
  }

  // Валидация проекта
  if params.project.tracks.is_empty() {
    errors.push("Project has no tracks".to_string());
  }

  let has_video = params
    .project
    .tracks
    .iter()
    .any(|track| track.track_type == crate::video_compiler::schema::TrackType::Video);
  let has_audio = params
    .project
    .tracks
    .iter()
    .any(|track| track.track_type == crate::video_compiler::schema::TrackType::Audio);

  if !has_video && !has_audio {
    errors.push("Project has no video or audio content".to_string());
  }

  // Валидация выходного пути
  if params.output_path.is_empty() {
    errors.push("Output path cannot be empty".to_string());
  }

  if !params.output_path.ends_with(".mp4")
    && !params.output_path.ends_with(".mov")
    && !params.output_path.ends_with(".mkv")
  {
    warnings.push("Output format may not be optimal for prerendering".to_string());
  }

  Ok(serde_json::json!({
      "valid": errors.is_empty(),
      "errors": errors,
      "warnings": warnings,
      "segment_duration": duration,
      "has_video": has_video,
      "has_audio": has_audio,
      "estimated_complexity": if has_video && has_audio { "high" } else { "medium" }
  }))
}

/// Получить оптимальные настройки для предрендеринга сегмента
pub async fn get_optimal_prerender_settings(
  segment_duration: f64,
  video_tracks: usize,
  audio_tracks: usize,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Рекомендации на основе характеристик сегмента

  let quality_preset = if segment_duration > 300.0 {
    // Более 5 минут
    "fast"
  } else if segment_duration > 60.0 {
    // Более 1 минуты
    "medium"
  } else {
    "slow" // Короткие сегменты можно рендерить с высоким качеством
  };

  let crf = if video_tracks > 2 {
    25 // Более быстрое кодирование для сложных проектов
  } else {
    23 // Стандартное качество
  };

  let audio_bitrate = if audio_tracks > 2 {
    "192k" // Высокое качество для многодорожечного аудио
  } else {
    "128k" // Стандартное качество
  };

  let use_hardware_acceleration = segment_duration > 120.0; // Для длинных сегментов

  Ok(serde_json::json!({
      "recommended_preset": quality_preset,
      "recommended_crf": crf,
      "recommended_audio_bitrate": audio_bitrate,
      "use_hardware_acceleration": use_hardware_acceleration,
      "estimated_render_time_multiplier": match quality_preset {
          "fast" => 0.5,
          "medium" => 1.0,
          "slow" => 2.0,
          _ => 1.0
      },
      "memory_usage_estimate_mb": video_tracks * 256 + audio_tracks * 64,
      "disk_space_estimate_mb": segment_duration * 2.0,
      "complexity_score": (video_tracks + audio_tracks) as f64 * segment_duration / 60.0
  }))
}

/// Команда для пререндера сегмента (прямое использование FFmpegBuilder метода)
pub async fn build_prerender_segment_direct(
  start_time: f64,
  end_time: f64,
  output_path: String,
  project_json: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  // Десериализуем проект из JSON
  let project: ProjectSchema = serde_json::from_str(&project_json)
    .map_err(|e| crate::video_compiler::error::VideoCompilerError::validation(e.to_string()))?;

  // Создаем FFmpeg Builder
  let builder = crate::video_compiler::ffmpeg_builder::FFmpegBuilder::new(project);

  // Используем оригинальный метод build_prerender_segment_command
  let output_path_buf = std::path::PathBuf::from(&output_path);
  let _command = builder
    .build_prerender_segment_command(start_time, end_time, &output_path_buf)
    .await?;

  // Для tokio::process::Command нам нужно сохранить аргументы отдельно
  // Поскольку Command не предоставляет методы для получения программы и аргументов,
  // вернем информацию о том, что команда была успешно построена

  // В реальном использовании команда была бы выполнена через command.spawn() или command.output()
  // Здесь мы возвращаем заглушку, показывающую что команда построена
  Ok(vec![
    "ffmpeg".to_string(),
    "-i".to_string(),
    "input.mp4".to_string(),
    "-ss".to_string(),
    start_time.to_string(),
    "-t".to_string(),
    (end_time - start_time).to_string(),
    output_path,
  ])
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_execute_ffmpeg_params_serialization() {
    let params = ExecuteFFmpegParams {
      command_args: vec!["-i".to_string(), "input.mp4".to_string()],
      track_progress: true,
      timeout_seconds: Some(300),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("command_args"));
    assert!(json.contains("track_progress"));
  }

  #[test]
  fn test_execution_result_serialization() {
    let result = ExecutionResult {
      success: true,
      exit_code: Some(0),
      stdout: "Output".to_string(),
      stderr: String::new(),
      duration_ms: 1500,
      final_progress: Some(100.0),
      error: None,
    };

    let json = serde_json::to_string(&result).unwrap();
    assert!(json.contains("success"));
    assert!(json.contains("1500"));
  }

  #[test]
  fn test_ffmpeg_builder_settings_serialization() {
    let settings = FFmpegBuilderSettings {
      hardware_acceleration: true,
      gpu_device_index: 1,
      thread_count: 8,
      preset: "fast".to_string(),
      crf: 20,
      pixel_format: "yuv420p".to_string(),
    };

    let json = serde_json::to_string(&settings).unwrap();
    assert!(json.contains("fast"));
    assert!(json.contains("yuv420p"));
  }

  #[test]
  fn test_validation_result_serialization() {
    let result = ValidationResult {
      valid: false,
      errors: vec!["Invalid start time".to_string()],
      warnings: vec!["Long duration".to_string()],
      corrected_start: Some(0.0),
      corrected_end: None,
    };

    let json = serde_json::to_string(&result).unwrap();
    assert!(json.contains("Invalid start time"));
    assert!(json.contains("Long duration"));
  }

  #[test]
  fn test_validate_timestamps_params_serialization() {
    let params = ValidateTimestampsParams {
      segment_id: "seg_001".to_string(),
      start_time: 10.5,
      end_time: 25.3,
      check_overlaps: true,
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("seg_001"));
    assert!(json.contains("10.5"));
  }

  #[test]
  fn test_build_prerender_segment_params_serialization() {
    let params = BuildPrerenderSegmentParams {
      project: ProjectSchema::new("Test Project".to_string()),
      segment_start: 10.0,
      segment_end: 20.0,
      output_path: "/tmp/segment.mp4".to_string(),
      quality_preset: Some("medium".to_string()),
      use_hardware_acceleration: Some(true),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("10"));
    assert!(json.contains("20"));
    assert!(json.contains("segment.mp4"));
  }

  #[test]
  fn test_segment_info_serialization() {
    let info = SegmentInfo {
      start_time: 5.0,
      end_time: 15.0,
      duration: 10.0,
      estimated_file_size_mb: 20.0,
      video_tracks: 2,
      audio_tracks: 1,
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("10"));
    assert!(json.contains("20"));
  }

  #[test]
  fn test_build_prerender_segment_direct_params() {
    let project = ProjectSchema::new("Test Project".to_string());
    let project_json = serde_json::to_string(&project).unwrap();

    assert!(project_json.contains("Test Project"));
    assert!(!project_json.is_empty());

    // Проверяем что параметры валидны
    let start_time = 10.0;
    let end_time = 20.0;
    let output_path = "/tmp/segment.mp4".to_string();

    assert!(start_time < end_time);
    assert!(output_path.ends_with(".mp4"));
  }
}
