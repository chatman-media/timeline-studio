//! FFmpeg сервис для работы с видео

use crate::services::Service;
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};
use async_trait::async_trait;
use std::{
  path::Path,
  process::{Command, Stdio},
};

/// Трейт для работы с FFmpeg
#[async_trait]
#[allow(dead_code)]
pub trait FfmpegService: Service + Send + Sync {
  /// Получение версии FFmpeg
  async fn get_version(&self) -> Result<String>;

  /// Проверка доступности FFmpeg
  async fn is_available(&self) -> Result<bool>;

  /// Получение информации о файле
  async fn get_file_info(&self, path: &Path) -> Result<FileInfo>;

  /// Получение поддерживаемых форматов
  async fn get_supported_formats(&self) -> Result<Vec<String>>;

  /// Получение поддерживаемых кодеков
  async fn get_supported_codecs(&self) -> Result<Vec<String>>;

  /// Получение пути к FFmpeg
  async fn get_ffmpeg_path(&self) -> Result<String>;

  /// Запуск FFmpeg команды
  async fn run_command(&self, args: Vec<String>) -> Result<String>;
}

/// Информация о медиа файле
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[allow(dead_code)]
pub struct FileInfo {
  pub duration: f64,
  pub width: u32,
  pub height: u32,
  pub fps: f64,
  pub codec: String,
  pub bitrate: u64,
  pub has_audio: bool,
  pub audio_codec: Option<String>,
  pub audio_bitrate: Option<u64>,
}

/// Реализация FFmpeg сервиса
pub struct FfmpegServiceImpl {
  ffmpeg_path: String,
}

impl FfmpegServiceImpl {
  pub fn new(ffmpeg_path: String) -> Self {
    Self { ffmpeg_path }
  }
}

#[async_trait]
impl Service for FfmpegServiceImpl {
  async fn initialize(&self) -> Result<()> {
    // Проверяем доступность FFmpeg
    if !self.is_available().await? {
      return Err(VideoCompilerError::DependencyMissing(
        "FFmpeg не найден".to_string(),
      ));
    }

    log::info!("FFmpeg сервис инициализирован: {}", self.ffmpeg_path);
    Ok(())
  }

  async fn health_check(&self) -> Result<()> {
    if !self.is_available().await? {
      return Err(VideoCompilerError::DependencyMissing(
        "FFmpeg не найден".to_string(),
      ));
    }
    Ok(())
  }

  async fn shutdown(&self) -> Result<()> {
    log::info!("FFmpeg сервис остановлен");
    Ok(())
  }
}

#[async_trait]
impl FfmpegService for FfmpegServiceImpl {
  async fn get_version(&self) -> Result<String> {
    let output = Command::new(&self.ffmpeg_path)
      .arg("-version")
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Не удалось запустить FFmpeg: {e}"),
        command: "-version".to_string(),
      })?;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: Some(output.status.code().unwrap_or(-1)),
        stderr: "Не удалось получить версию FFmpeg".to_string(),
        command: "-version".to_string(),
      });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let version_line = stdout
      .lines()
      .next()
      .ok_or_else(|| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: "Пустой вывод версии".to_string(),
        command: "-version".to_string(),
      })?;

    Ok(version_line.to_string())
  }

  async fn is_available(&self) -> Result<bool> {
    match Command::new(&self.ffmpeg_path)
      .arg("-version")
      .stdout(Stdio::null())
      .stderr(Stdio::null())
      .status()
    {
      Ok(status) => Ok(status.success()),
      Err(_) => Ok(false),
    }
  }

  async fn get_file_info(&self, path: &Path) -> Result<FileInfo> {
    let output = Command::new(&self.ffmpeg_path)
      .args([
        "-i",
        path.to_str().ok_or_else(|| {
          VideoCompilerError::ValidationError("Неверный путь к файлу".to_string())
        })?,
        "-f",
        "null",
        "-",
      ])
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Ошибка запуска FFmpeg: {e}"),
        command: "ffprobe".to_string(),
      })?;

    let stderr = String::from_utf8_lossy(&output.stderr);

    // Парсим информацию из вывода FFmpeg
    let duration = parse_duration(&stderr)?;
    let (width, height) = parse_resolution(&stderr)?;
    let fps = parse_fps(&stderr)?;
    let codec = parse_video_codec(&stderr)?;
    let bitrate = parse_bitrate(&stderr)?;
    let has_audio = stderr.contains("Audio:");
    let audio_codec = if has_audio {
      parse_audio_codec(&stderr)
    } else {
      None
    };
    let audio_bitrate = if has_audio {
      parse_audio_bitrate(&stderr)
    } else {
      None
    };

    Ok(FileInfo {
      duration,
      width,
      height,
      fps,
      codec,
      bitrate,
      has_audio,
      audio_codec,
      audio_bitrate,
    })
  }

  async fn get_supported_formats(&self) -> Result<Vec<String>> {
    let output = Command::new(&self.ffmpeg_path)
      .arg("-formats")
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Ошибка получения форматов: {e}"),
        command: "-formats".to_string(),
      })?;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: Some(output.status.code().unwrap_or(-1)),
        stderr: "Не удалось получить список форматов".to_string(),
        command: "-formats".to_string(),
      });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let formats = stdout
      .lines()
      .filter_map(|line| {
        if line.contains("E ") || line.contains("DE") {
          line.split_whitespace().nth(1).map(|s| s.to_string())
        } else {
          None
        }
      })
      .collect();

    Ok(formats)
  }

  async fn get_supported_codecs(&self) -> Result<Vec<String>> {
    let output = Command::new(&self.ffmpeg_path)
      .arg("-codecs")
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Ошибка получения кодеков: {e}"),
        command: "-codecs".to_string(),
      })?;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: Some(output.status.code().unwrap_or(-1)),
        stderr: "Не удалось получить список кодеков".to_string(),
        command: "-codecs".to_string(),
      });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let codecs = stdout
      .lines()
      .filter_map(|line| {
        if line.contains("EV") || line.contains("DEV") {
          line.split_whitespace().nth(1).map(|s| s.to_string())
        } else {
          None
        }
      })
      .collect();

    Ok(codecs)
  }

  async fn get_ffmpeg_path(&self) -> Result<String> {
    Ok(self.ffmpeg_path.clone())
  }

  async fn run_command(&self, args: Vec<String>) -> Result<String> {
    let output = Command::new(&self.ffmpeg_path)
      .args(&args)
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Ошибка выполнения команды: {e}"),
        command: args.join(" "),
      })?;

    if !output.status.success() {
      let stderr = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: stderr.to_string(),
        command: args.join(" "),
      });
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
  }
}

// Вспомогательные функции для парсинга вывода FFmpeg

fn parse_duration(stderr: &str) -> Result<f64> {
  for line in stderr.lines() {
    if line.contains("Duration:") {
      if let Some(duration_str) = line.split("Duration: ").nth(1) {
        if let Some(time_str) = duration_str.split(',').next() {
          return parse_time_to_seconds(time_str.trim());
        }
      }
    }
  }
  Err(VideoCompilerError::ValidationError(
    "Не удалось найти длительность".to_string(),
  ))
}

fn parse_resolution(stderr: &str) -> Result<(u32, u32)> {
  for line in stderr.lines() {
    if line.contains("Video:") {
      if let Some(res_part) = line.split("Video:").nth(1) {
        for part in res_part.split(',') {
          if let Some(res_str) = part.split_whitespace().find(|s| s.contains('x')) {
            let dimensions: Vec<&str> = res_str.split('x').collect();
            if dimensions.len() == 2 {
              if let (Ok(width), Ok(height)) =
                (dimensions[0].parse::<u32>(), dimensions[1].parse::<u32>())
              {
                return Ok((width, height));
              }
            }
          }
        }
      }
    }
  }
  Err(VideoCompilerError::ValidationError(
    "Не удалось найти разрешение".to_string(),
  ))
}

fn parse_fps(stderr: &str) -> Result<f64> {
  for line in stderr.lines() {
    if line.contains("Video:") && line.contains(" fps") {
      if let Some(fps_part) = line.split(" fps").next() {
        if let Some(fps_str) = fps_part.split(' ').next_back() {
          if let Ok(fps) = fps_str.parse::<f64>() {
            return Ok(fps);
          }
        }
      }
    }
  }
  Ok(30.0) // Значение по умолчанию
}

fn parse_video_codec(stderr: &str) -> Result<String> {
  for line in stderr.lines() {
    if line.contains("Video:") {
      if let Some(codec_part) = line.split("Video: ").nth(1) {
        if let Some(codec) = codec_part.split(',').next() {
          return Ok(codec.trim().to_string());
        }
      }
    }
  }
  Ok("unknown".to_string())
}

fn parse_bitrate(stderr: &str) -> Result<u64> {
  for line in stderr.lines() {
    if line.contains("bitrate:") {
      if let Some(bitrate_part) = line.split("bitrate: ").nth(1) {
        if let Some(bitrate_str) = bitrate_part.split(' ').next() {
          if let Ok(bitrate) = bitrate_str.parse::<u64>() {
            return Ok(bitrate);
          }
        }
      }
    }
  }
  Ok(0)
}

fn parse_audio_codec(stderr: &str) -> Option<String> {
  for line in stderr.lines() {
    if line.contains("Audio:") {
      if let Some(codec_part) = line.split("Audio: ").nth(1) {
        if let Some(codec) = codec_part.split(',').next() {
          return Some(codec.trim().to_string());
        }
      }
    }
  }
  None
}

fn parse_audio_bitrate(stderr: &str) -> Option<u64> {
  for line in stderr.lines() {
    if line.contains("Audio:") && line.contains(" kb/s") {
      if let Some(bitrate_part) = line.split(" kb/s").next() {
        if let Some(bitrate_str) = bitrate_part.split(' ').next_back() {
          if let Ok(bitrate) = bitrate_str.parse::<u64>() {
            return Some(bitrate);
          }
        }
      }
    }
  }
  None
}

fn parse_time_to_seconds(time_str: &str) -> Result<f64> {
  let parts: Vec<&str> = time_str.split(':').collect();
  if parts.len() != 3 {
    return Err(VideoCompilerError::ValidationError(
      "Неверный формат времени".to_string(),
    ));
  }

  let hours: f64 = parts[0]
    .parse()
    .map_err(|_| VideoCompilerError::ValidationError("Неверные часы".to_string()))?;
  let minutes: f64 = parts[1]
    .parse()
    .map_err(|_| VideoCompilerError::ValidationError("Неверные минуты".to_string()))?;
  let seconds: f64 = parts[2]
    .parse()
    .map_err(|_| VideoCompilerError::ValidationError("Неверные секунды".to_string()))?;

  Ok(hours * 3600.0 + minutes * 60.0 + seconds)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_ffmpeg_service_creation() {
    let service = FfmpegServiceImpl::new("ffmpeg".to_string());
    assert_eq!(service.ffmpeg_path, "ffmpeg");
  }

  #[tokio::test]
  async fn test_get_ffmpeg_path() {
    let service = FfmpegServiceImpl::new("/custom/path/ffmpeg".to_string());
    let path = service.get_ffmpeg_path().await.unwrap();
    assert_eq!(path, "/custom/path/ffmpeg");
  }

  #[tokio::test]
  async fn test_is_available_with_echo() {
    // Используем echo как mock для FFmpeg
    let service = FfmpegServiceImpl::new("echo".to_string());
    let available = service.is_available().await.unwrap();
    assert!(available); // echo должен быть доступен в системе
  }

  #[tokio::test]
  async fn test_is_available_with_nonexistent() {
    let service = FfmpegServiceImpl::new("/definitely/does/not/exist".to_string());
    let available = service.is_available().await.unwrap();
    assert!(!available);
  }

  #[tokio::test]
  async fn test_get_version_with_echo() {
    let service = FfmpegServiceImpl::new("echo".to_string());
    let version = service.get_version().await.unwrap();
    assert_eq!(version, "-version"); // echo просто вернет аргумент
  }

  #[tokio::test]
  async fn test_run_command() {
    let service = FfmpegServiceImpl::new("echo".to_string());
    let output = service
      .run_command(vec!["hello".to_string(), "world".to_string()])
      .await
      .unwrap();
    assert_eq!(output.trim(), "hello world");
  }

  #[tokio::test]
  async fn test_run_command_failure() {
    let service = FfmpegServiceImpl::new("false".to_string()); // false всегда возвращает код ошибки
    let result = service.run_command(vec!["test".to_string()]).await;
    assert!(result.is_err());

    match result.unwrap_err() {
      VideoCompilerError::FFmpegError { exit_code, .. } => {
        assert!(exit_code.is_some());
      }
      _ => panic!("Expected FFmpegError"),
    }
  }

  #[tokio::test]
  async fn test_service_lifecycle() {
    let service = FfmpegServiceImpl::new("echo".to_string());

    // Initialize
    assert!(service.initialize().await.is_ok());

    // Health check
    assert!(service.health_check().await.is_ok());

    // Shutdown
    assert!(service.shutdown().await.is_ok());
  }

  #[tokio::test]
  async fn test_service_initialization_failure() {
    let service = FfmpegServiceImpl::new("/nonexistent/ffmpeg".to_string());
    let result = service.initialize().await;
    assert!(result.is_err());

    match result.unwrap_err() {
      VideoCompilerError::DependencyMissing(msg) => {
        assert!(msg.contains("FFmpeg не найден"));
      }
      _ => panic!("Expected DependencyMissing error"),
    }
  }

  // Тесты для парсинга функций

  #[test]
  fn test_parse_time_to_seconds() {
    assert_eq!(parse_time_to_seconds("00:01:30.00").unwrap(), 90.0);
    assert_eq!(parse_time_to_seconds("01:00:00.00").unwrap(), 3600.0);
    assert_eq!(parse_time_to_seconds("00:00:05.50").unwrap(), 5.5);
    assert_eq!(parse_time_to_seconds("10:15:30.25").unwrap(), 36930.25);
  }

  #[test]
  fn test_parse_time_to_seconds_invalid() {
    assert!(parse_time_to_seconds("invalid").is_err());
    assert!(parse_time_to_seconds("1:30").is_err());
    assert!(parse_time_to_seconds("").is_err());
  }

  #[test]
  fn test_parse_duration() {
    let ffmpeg_output = r#"
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'test.mp4':
  Duration: 00:05:30.50, start: 0.000000, bitrate: 1234 kb/s
    Stream #0:0(und): Video: h264
"#;

    let duration = parse_duration(ffmpeg_output).unwrap();
    assert_eq!(duration, 330.5);
  }

  #[test]
  fn test_parse_duration_not_found() {
    let ffmpeg_output = "No duration info";
    let result = parse_duration(ffmpeg_output);
    assert!(result.is_err());
  }

  #[test]
  fn test_parse_resolution() {
    let ffmpeg_output = r#"
Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p, 1920x1080 [SAR 1:1 DAR 16:9], 8000 kb/s, 30 fps
"#;

    let (width, height) = parse_resolution(ffmpeg_output).unwrap();
    assert_eq!(width, 1920);
    assert_eq!(height, 1080);
  }

  #[test]
  fn test_parse_resolution_different_format() {
    let ffmpeg_output = r#"
Stream #0:0: Video: mpeg4, yuv420p, 640x480, 25 fps
"#;

    let (width, height) = parse_resolution(ffmpeg_output).unwrap();
    assert_eq!(width, 640);
    assert_eq!(height, 480);
  }

  #[test]
  fn test_parse_fps() {
    let ffmpeg_output = r#"
Stream #0:0(und): Video: h264, yuv420p, 1920x1080, 8000 kb/s, 60 fps, 60 tbr
"#;

    let fps = parse_fps(ffmpeg_output).unwrap();
    assert_eq!(fps, 60.0);
  }

  #[test]
  fn test_parse_fps_decimal() {
    let ffmpeg_output = r#"
Stream #0:0: Video: h264, 1280x720, 29.97 fps
"#;

    let fps = parse_fps(ffmpeg_output).unwrap();
    assert_eq!(fps, 29.97);
  }

  #[test]
  fn test_parse_fps_default() {
    let ffmpeg_output = "No fps info";
    let fps = parse_fps(ffmpeg_output).unwrap();
    assert_eq!(fps, 30.0); // Значение по умолчанию
  }

  #[test]
  fn test_parse_video_codec() {
    let ffmpeg_output = r#"
Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p
"#;

    let codec = parse_video_codec(ffmpeg_output).unwrap();
    assert_eq!(codec, "h264 (High) (avc1 / 0x31637661)");
  }

  #[test]
  fn test_parse_bitrate() {
    let ffmpeg_output = r#"
Duration: 00:01:00.00, start: 0.000000, bitrate: 1500 kb/s
"#;

    let bitrate = parse_bitrate(ffmpeg_output).unwrap();
    assert_eq!(bitrate, 1500);
  }

  #[test]
  fn test_parse_audio_codec() {
    let ffmpeg_output = r#"
Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 192 kb/s
"#;

    let codec = parse_audio_codec(ffmpeg_output);
    assert_eq!(codec, Some("aac (LC) (mp4a / 0x6134706D)".to_string()));
  }

  #[test]
  fn test_parse_audio_codec_not_found() {
    let ffmpeg_output = "No audio stream";
    let codec = parse_audio_codec(ffmpeg_output);
    assert!(codec.is_none());
  }

  #[test]
  fn test_parse_audio_bitrate() {
    let ffmpeg_output = r#"
Stream #0:1(und): Audio: aac, 48000 Hz, stereo, fltp, 192 kb/s
"#;

    let bitrate = parse_audio_bitrate(ffmpeg_output);
    assert_eq!(bitrate, Some(192));
  }

  #[test]
  fn test_parse_audio_bitrate_not_found() {
    let ffmpeg_output = "No audio bitrate info";
    let bitrate = parse_audio_bitrate(ffmpeg_output);
    assert!(bitrate.is_none());
  }

  #[tokio::test]
  async fn test_get_file_info_mock() {
    let service = FfmpegServiceImpl::new("echo".to_string());
    let result = service.get_file_info(Path::new("test.mp4")).await;

    // С echo вместо ffmpeg это не сработает
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_get_supported_formats_mock() {
    let service = FfmpegServiceImpl::new("echo".to_string());
    let result = service.get_supported_formats().await;

    // echo вернет успех, но список будет пустой
    assert!(result.is_ok());
    let formats = result.unwrap();
    assert!(formats.is_empty()); // echo не возвращает форматы
  }

  #[tokio::test]
  async fn test_get_supported_codecs_mock() {
    let service = FfmpegServiceImpl::new("echo".to_string());
    let result = service.get_supported_codecs().await;

    // echo вернет успех, но список будет пустой
    assert!(result.is_ok());
    let codecs = result.unwrap();
    assert!(codecs.is_empty()); // echo не возвращает кодеки
  }

  // Интеграционный тест для проверки полного парсинга
  #[test]
  fn test_full_ffmpeg_output_parsing() {
    let ffmpeg_output = r#"
ffmpeg version 4.4.0 Copyright (c) 2000-2021 the FFmpeg developers
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'sample.mp4':
  Metadata:
    major_brand     : isom
    minor_version   : 512
    compatible_brands: isomiso2avc1mp41
    encoder         : Lavf58.76.100
  Duration: 00:10:34.53, start: 0.000000, bitrate: 4567 kb/s
    Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p, 1920x1080 [SAR 1:1 DAR 16:9], 4321 kb/s, 29.97 fps, 29.97 tbr, 30k tbn, 59.94 tbc (default)
    Metadata:
      handler_name    : VideoHandler
    Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 192 kb/s (default)
    Metadata:
      handler_name    : SoundHandler
"#;

    // Тестируем все функции парсинга
    assert_eq!(parse_duration(ffmpeg_output).unwrap(), 634.53);
    assert_eq!(parse_resolution(ffmpeg_output).unwrap(), (1920, 1080));
    assert_eq!(parse_fps(ffmpeg_output).unwrap(), 29.97);
    assert_eq!(
      parse_video_codec(ffmpeg_output).unwrap(),
      "h264 (High) (avc1 / 0x31637661)"
    );
    assert_eq!(parse_bitrate(ffmpeg_output).unwrap(), 4567);
    assert_eq!(
      parse_audio_codec(ffmpeg_output).unwrap(),
      "aac (LC) (mp4a / 0x6134706D)"
    );
    assert_eq!(parse_audio_bitrate(ffmpeg_output).unwrap(), 192);
  }
}
