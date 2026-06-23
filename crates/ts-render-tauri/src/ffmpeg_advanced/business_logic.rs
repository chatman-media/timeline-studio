//! Бизнес-логика для продвинутых команд FFmpeg

use super::types::*;
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use std::path::Path;

/// Валидирует параметры превью видео
pub fn validate_video_preview_params(params: &VideoPreviewParams) -> Result<()> {
  validate_input_path(&params.input_path)?;
  validate_output_path(&params.output_path)?;

  if params.duration <= 0.0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Duration must be positive".to_string(),
    ));
  }

  if let Some((width, height)) = params.resolution {
    if width == 0 || height == 0 {
      return Err(VideoCompilerError::InvalidParameter(
        "Resolution dimensions must be positive".to_string(),
      ));
    }
  }

  if let Some(bitrate) = params.bitrate {
    if bitrate == 0 {
      return Err(VideoCompilerError::InvalidParameter(
        "Bitrate must be positive".to_string(),
      ));
    }
  }

  Ok(())
}

/// Валидирует параметры GIF превью
pub fn validate_gif_preview_params(params: &GifPreviewParams) -> Result<()> {
  validate_input_path(&params.input_path)?;
  validate_output_path(&params.output_path)?;

  if params.start_time < 0.0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Start time cannot be negative".to_string(),
    ));
  }

  if params.duration <= 0.0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Duration must be positive".to_string(),
    ));
  }

  if params.fps == 0 || params.fps > 60 {
    return Err(VideoCompilerError::InvalidParameter(
      "FPS must be between 1 and 60".to_string(),
    ));
  }

  if let Some((width, height)) = params.resolution {
    if width == 0 || height == 0 {
      return Err(VideoCompilerError::InvalidParameter(
        "Resolution dimensions must be positive".to_string(),
      ));
    }
  }

  Ok(())
}

/// Валидирует параметры объединения видео
pub fn validate_concat_params(params: &ConcatVideosParams) -> Result<()> {
  if params.input_paths.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "At least one input path is required".to_string(),
    ));
  }

  for path in &params.input_paths {
    validate_input_path(path)?;
  }

  validate_output_path(&params.output_path)?;

  Ok(())
}

/// Валидирует параметры фильтра
pub fn validate_filter_params(params: &VideoFilterParams) -> Result<()> {
  validate_input_path(&params.input_path)?;
  validate_output_path(&params.output_path)?;

  if params.filter_name.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Filter name cannot be empty".to_string(),
    ));
  }

  if let Some(duration) = params.duration {
    if duration <= 0.0 {
      return Err(VideoCompilerError::InvalidParameter(
        "Duration must be positive".to_string(),
      ));
    }
  }

  Ok(())
}

/// Валидирует параметры превью с субтитрами
pub fn validate_subtitle_preview_params(params: &SubtitlePreviewParams) -> Result<()> {
  validate_input_path(&params.video_path)?;
  validate_input_path(&params.subtitle_path)?;
  validate_output_path(&params.output_path)?;

  if let Some(start_time) = params.start_time {
    if start_time < 0.0 {
      return Err(VideoCompilerError::InvalidParameter(
        "Start time cannot be negative".to_string(),
      ));
    }
  }

  Ok(())
}

/// Валидирует входной путь
pub fn validate_input_path(path: &str) -> Result<()> {
  if path.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Input path cannot be empty".to_string(),
    ));
  }

  if !Path::new(path).exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: path.to_string(),
      reason: "File not found".to_string(),
    });
  }

  Ok(())
}

/// Валидирует выходной путь
pub fn validate_output_path(path: &str) -> Result<()> {
  if path.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Output path cannot be empty".to_string(),
    ));
  }

  // Проверяем расширение файла
  let path_obj = Path::new(path);
  if path_obj.extension().is_none() {
    return Err(VideoCompilerError::InvalidParameter(
      "Output path must have a file extension".to_string(),
    ));
  }

  // Проверяем что родительская директория существует
  if let Some(parent) = path_obj.parent() {
    if !parent.exists() && parent != Path::new("") {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Parent directory does not exist: {}",
        parent.display()
      )));
    }
  }

  Ok(())
}

/// Парсит информацию о медиа файле из JSON вывода ffprobe
pub fn parse_media_file_info(json_output: &str) -> Result<MediaFileInfo> {
  let json: serde_json::Value = serde_json::from_str(json_output)
    .map_err(|e| VideoCompilerError::InvalidParameter(format!("Invalid JSON: {e}")))?;

  let format = json["format"]["format_name"]
    .as_str()
    .unwrap_or("unknown")
    .to_string();

  let duration = json["format"]["duration"]
    .as_str()
    .and_then(|s| s.parse::<f64>().ok())
    .unwrap_or(0.0);

  let mut video_codec = None;
  let mut audio_codec = None;
  let mut video_resolution = None;
  let mut video_bitrate = None;
  let mut audio_bitrate = None;
  let mut frame_rate = None;

  if let Some(streams) = json["streams"].as_array() {
    for stream in streams {
      let codec_type = stream["codec_type"].as_str().unwrap_or("");

      match codec_type {
        "video" => {
          video_codec = stream["codec_name"].as_str().map(String::from);

          if let (Some(width), Some(height)) = (stream["width"].as_u64(), stream["height"].as_u64())
          {
            video_resolution = Some((width as u32, height as u32));
          }

          video_bitrate = stream["bit_rate"]
            .as_str()
            .and_then(|s| s.parse::<u32>().ok());

          // Parse frame rate (может быть в формате "30/1" или "29.97")
          if let Some(fps_str) = stream["r_frame_rate"].as_str() {
            frame_rate = parse_frame_rate(fps_str);
          }
        }
        "audio" => {
          audio_codec = stream["codec_name"].as_str().map(String::from);
          audio_bitrate = stream["bit_rate"]
            .as_str()
            .and_then(|s| s.parse::<u32>().ok());
        }
        _ => {}
      }
    }
  }

  Ok(MediaFileInfo {
    format,
    duration,
    video_codec,
    audio_codec,
    video_resolution,
    video_bitrate,
    audio_bitrate,
    frame_rate,
  })
}

/// Парсит frame rate из строки формата "30/1" или "29.97"
fn parse_frame_rate(fps_str: &str) -> Option<f64> {
  if fps_str.contains('/') {
    let parts: Vec<&str> = fps_str.split('/').collect();
    if parts.len() == 2 {
      let numerator = parts[0].parse::<f64>().ok()?;
      let denominator = parts[1].parse::<f64>().ok()?;
      if denominator != 0.0 {
        return Some(numerator / denominator);
      }
    }
  } else {
    return fps_str.parse::<f64>().ok();
  }
  None
}

/// Парсит доступные аппаратные кодировщики из вывода FFmpeg
pub fn parse_hardware_encoders(output: &str) -> HardwareAccelerationInfo {
  let lines: Vec<&str> = output.lines().collect();
  let mut available_encoders = Vec::new();
  let mut nvidia_available = false;
  let mut videotoolbox_available = false;
  let mut vaapi_available = false;

  for line in lines {
    let trimmed = line.trim();

    if trimmed.contains("_nvenc") {
      nvidia_available = true;
      available_encoders.push(trimmed.to_string());
    } else if trimmed.contains("_videotoolbox") {
      videotoolbox_available = true;
      available_encoders.push(trimmed.to_string());
    } else if trimmed.contains("_vaapi") {
      vaapi_available = true;
      available_encoders.push(trimmed.to_string());
    }
  }

  HardwareAccelerationInfo {
    available_encoders,
    nvidia_available,
    videotoolbox_available,
    vaapi_available,
  }
}

/// Парсит информацию об установке FFmpeg
pub fn parse_ffmpeg_version(output: &str) -> Result<FFmpegInstallationInfo> {
  let lines: Vec<&str> = output.lines().collect();

  if lines.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "Empty FFmpeg version output".to_string(),
    ));
  }

  // Первая строка обычно содержит версию
  let version_line = lines[0];
  let version = if let Some(start) = version_line.find("version ") {
    let version_start = start + 8;
    let version_str = &version_line[version_start..];
    version_str
      .split_whitespace()
      .next()
      .unwrap_or("unknown")
      .to_string()
  } else {
    "unknown".to_string()
  };

  // Парсим конфигурацию
  let mut configuration = Vec::new();
  for line in &lines {
    if line.contains("configuration:") {
      let config_str = line.split("configuration:").nth(1).unwrap_or("");
      configuration = config_str
        .split_whitespace()
        .filter(|s| s.starts_with("--"))
        .map(String::from)
        .collect();
      break;
    }
  }

  // Парсим версии библиотек
  let mut libav_versions = Vec::new();
  for line in &lines {
    if line.trim().starts_with("libav") {
      libav_versions.push(line.trim().to_string());
    }
  }

  Ok(FFmpegInstallationInfo {
    version,
    configuration,
    libav_versions,
  })
}

/// Конвертирует аргументы команды в строку для логирования
pub fn format_command_args(args: &[String]) -> String {
  args.join(" ")
}

/// Создает результат выполнения FFmpeg
pub fn create_execution_result(
  exit_code: i32,
  stdout: String,
  stderr: String,
  duration_ms: u64,
  final_progress: Option<ts_render::video_compiler::progress::RenderProgress>,
) -> FFmpegExecutionResult {
  FFmpegExecutionResult {
    exit_code,
    stdout,
    stderr,
    duration_ms,
    final_progress: final_progress.map(|p| FFmpegProgress {
      percentage: p.percentage,
      current_frame: p.current_frame,
      total_frames: Some(p.total_frames),
      elapsed_time_secs: p.elapsed_time.as_secs(),
      message: p.message,
    }),
  }
}

/// Проверяет успешность выполнения команды
pub fn check_execution_success(result: &FFmpegExecutionResult) -> Result<()> {
  if result.exit_code != 0 {
    Err(VideoCompilerError::FFmpegError {
      exit_code: Some(result.exit_code),
      stderr: result.stderr.clone(),
      command: "ffmpeg".to_string(),
    })
  } else {
    Ok(())
  }
}

/// Форматирует длительность в человекочитаемый формат
#[allow(dead_code)]
pub fn format_duration(seconds: f64) -> String {
  if seconds < 60.0 {
    format!("{seconds:.1}s")
  } else if seconds < 3600.0 {
    let minutes = (seconds / 60.0).floor();
    let secs = seconds % 60.0;
    format!("{minutes}m {secs:.0}s")
  } else {
    let hours = (seconds / 3600.0).floor();
    let minutes = ((seconds % 3600.0) / 60.0).floor();
    format!("{hours}h {minutes}m")
  }
}

/// Определяет подходящий битрейт на основе разрешения
#[allow(dead_code)]
pub fn suggest_bitrate_for_resolution(resolution: (u32, u32)) -> u32 {
  let pixels = resolution.0 * resolution.1;

  match pixels {
    p if p <= 640 * 480 => 1000,    // SD
    p if p <= 1280 * 720 => 2500,   // HD
    p if p <= 1920 * 1080 => 5000,  // Full HD
    p if p <= 3840 * 2160 => 15000, // 4K
    _ => 25000,                     // 8K+
  }
}
