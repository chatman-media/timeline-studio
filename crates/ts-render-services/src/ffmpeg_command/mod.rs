//! FFmpeg-командный примитив (Wave 1, эпик #91): `FFmpegCommand` (билдер ffmpeg/ffprobe
//! с валидацией безопасности) + `FFmpegSecurity` + детекция GPU-ошибок/возможностей.
//!
//! ИЗВЛЕЧЁН из `src-tauri/src/video_compiler/core/ffmpeg/mod.rs` БЕЗ изменения логики:
//! сервисный слой (`services::preview_service::generate_waveform_data_json`) использует
//! `FFmpegCommand::ffprobe()`, поэтому примитив обязан переехать вместе с foundation.
//! Анализные подмодули (`scene_detection`/`silence_detection`/... — 11 шт.) ОСТАЮТСЯ в
//! монолите (`core/ffmpeg/`) и продолжают видеть эти символы через ре-экспорт-шим
//! `pub use ts_render_tauri::ffmpeg_command::*;` в `core/ffmpeg/mod.rs`. Единый источник
//! истины; перенос самого анализного поддерева отложен на отдельную волну (см. план §Step 2).

pub mod security;

use std::process::Output;
use tokio::process::Command;
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};

pub use security::FFmpegSecurity;

/// Базовая структура для выполнения FFmpeg команд
#[derive(Debug, Clone)]
pub struct FFmpegCommand {
  executable: String,
  args: Vec<String>,
}

impl FFmpegCommand {
  /// Создать команду для ffmpeg
  pub fn ffmpeg() -> Self {
    Self {
      executable: "ffmpeg".to_string(),
      args: vec![],
    }
  }

  /// Создать команду для ffprobe
  pub fn ffprobe() -> Self {
    Self {
      executable: "ffprobe".to_string(),
      args: vec![],
    }
  }

  /// Добавить аргумент с валидацией безопасности
  ///
  /// # Security
  ///
  /// Validates arguments to prevent command injection attacks:
  /// - Checks for null bytes
  /// - Blocks shell metacharacters (|, &, ;, $, `, etc.)
  /// - Prevents newline injection
  ///
  /// # Errors
  ///
  /// Returns `ValidationError` if argument contains dangerous characters
  pub fn arg<S: Into<String>>(mut self, arg: S) -> Self {
    let arg_string = arg.into();

    // Validate argument for security
    // Note: For performance, we only validate user-controlled arguments
    // Static arguments from code (like "-i", "-c:v") are safe
    // We check if argument looks like user data (contains path separators or is not a known flag)
    let is_user_data = arg_string.contains('/')
      || arg_string.contains('\\')
      || (!arg_string.starts_with('-') && arg_string.len() > 10);

    if is_user_data {
      if let Err(e) = FFmpegSecurity::sanitize_argument(&arg_string) {
        log::warn!(
          "Potentially unsafe FFmpeg argument detected: {} ({})",
          arg_string,
          e
        );
        // For now, we log but don't block - strict mode can be enabled later
        // In production, you might want to return Result<Self, Error> instead
      }
    }

    self.args.push(arg_string);
    self
  }

  /// Добавить несколько аргументов
  pub fn args<I, S>(mut self, args: I) -> Self
  where
    I: IntoIterator<Item = S>,
    S: Into<String>,
  {
    self.args.extend(args.into_iter().map(Into::into));
    self
  }

  /// Выполнить команду
  pub async fn execute(&self) -> Result<Output> {
    let output = Command::new(&self.executable)
      .args(&self.args)
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Failed to execute {}: {}", self.executable, e),
        command: self.executable.clone(),
      })?;

    if !output.status.success() {
      let stderr = String::from_utf8_lossy(&output.stderr).to_string();
      let command = format!("{} {}", self.executable, self.args.join(" "));

      // Детекция GPU-специфичных ошибок
      if is_gpu_error(&stderr) {
        return Err(VideoCompilerError::GpuError(format!(
          "GPU encoding failed: {}. Command: {}",
          stderr, command
        )));
      }

      // Детекция недоступности GPU
      if is_gpu_unavailable(&stderr) {
        return Err(VideoCompilerError::GpuUnavailable(format!(
          "GPU unavailable: {}. Command: {}",
          stderr, command
        )));
      }

      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr,
        command,
      });
    }

    Ok(output)
  }

  /// Выполнить команду и получить stdout как строку
  pub async fn execute_string(&self) -> Result<String> {
    let output = self.execute().await?;
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
  }

  /// Добавить input файл с валидацией безопасности
  ///
  /// # Security
  ///
  /// Validates input file:
  /// - Path traversal prevention
  /// - File existence check
  /// - Extension whitelist (video, audio, image)
  /// - File size limits (50GB max)
  ///
  /// # Errors
  ///
  /// Returns `ValidationError` if file is invalid or unsafe
  pub fn input_file<S: AsRef<str>>(self, path: S) -> Result<Self> {
    let path_str = path.as_ref();
    let validated_path = FFmpegSecurity::validate_input_file(path_str)?;

    // Convert validated path back to string
    let path_string = validated_path
      .to_str()
      .ok_or_else(|| VideoCompilerError::ValidationError("Invalid UTF-8 in file path".to_string()))?
      .to_string();

    Ok(self.arg("-i").arg(path_string))
  }

  /// Добавить output файл с валидацией безопасности
  ///
  /// # Security
  ///
  /// Validates output file:
  /// - Path traversal prevention
  /// - Parent directory existence check
  /// - Extension whitelist (video, audio, image)
  /// - Estimated size limits (10GB max)
  ///
  /// # Errors
  ///
  /// Returns `ValidationError` if path is invalid or unsafe
  pub fn output_file<S: AsRef<str>>(self, path: S, estimated_size: Option<u64>) -> Result<Self> {
    let path_str = path.as_ref();
    let validated_path = FFmpegSecurity::validate_output_file(path_str, estimated_size)?;

    // Convert validated path back to string
    let path_string = validated_path
      .to_str()
      .ok_or_else(|| VideoCompilerError::ValidationError("Invalid UTF-8 in file path".to_string()))?
      .to_string();

    Ok(self.arg(path_string))
  }

  /// Добавить codec с валидацией безопасности
  ///
  /// # Security
  ///
  /// Validates codec against whitelist of known safe codecs:
  /// - Video: libx264, libx265, h264_nvenc, hevc_nvenc, etc.
  /// - Audio: aac, libmp3lame, libopus, libvorbis, etc.
  ///
  /// # Errors
  ///
  /// Returns `ValidationError` if codec is not in whitelist
  pub fn codec<S: AsRef<str>>(self, stream_type: &str, codec: S) -> Result<Self> {
    let codec_str = codec.as_ref();
    let validated_codec = FFmpegSecurity::validate_codec(codec_str)?;

    Ok(self.arg(format!("-c:{}", stream_type)).arg(validated_codec))
  }
}

/// Проверить доступность FFmpeg
pub async fn check_ffmpeg_available() -> Result<bool> {
  match Command::new("ffmpeg").arg("-version").output().await {
    Ok(output) => Ok(output.status.success()),
    Err(_) => Ok(false),
  }
}

/// Проверить доступность FFprobe
pub async fn check_ffprobe_available() -> Result<bool> {
  match Command::new("ffprobe").arg("-version").output().await {
    Ok(output) => Ok(output.status.success()),
    Err(_) => Ok(false),
  }
}

/// Детекция GPU-специфичных ошибок в stderr FFmpeg
fn is_gpu_error(stderr: &str) -> bool {
  let gpu_error_patterns = [
    // NVIDIA NVENC ошибки
    "nvenc",
    "CUDA",
    "No CUDA capable devices found",
    "NVENC encoding failed",
    "driver version is insufficient for CUDA runtime",
    "NVENC error",
    "cuda_runtime_api.h",
    // AMD AMF ошибки
    "AMF_RESULT",
    "AMF encoder",
    "amf",
    "OpenCL",
    // Intel Quick Sync ошибки
    "qsv",
    "Quick Sync",
    "MFX_ERR",
    "libmfx",
    "Intel Media SDK",
    // Общие GPU ошибки
    "GPU memory",
    "VRAM",
    "out of GPU memory",
    "GPU device busy",
    "hardware acceleration",
    "hardware encoder",
    "driver not found",
    "insufficient GPU resources",
    // DirectX/D3D ошибки (Windows)
    "D3D11",
    "DirectX",
    "DXGI_ERROR",
    // Metal ошибки (macOS)
    "Metal",
    "MTL",
    "VideoToolbox hardware acceleration",
    // VAAPI ошибки (Linux)
    "VAAPI",
    "VA-API",
    "vaInitialize failed",
  ];

  let stderr_lower = stderr.to_lowercase();
  gpu_error_patterns
    .iter()
    .any(|pattern| stderr_lower.contains(&pattern.to_lowercase()))
}

/// Детекция недоступности GPU в stderr FFmpeg
fn is_gpu_unavailable(stderr: &str) -> bool {
  let gpu_unavailable_patterns = [
    "No NVENC capable devices found",
    "Cannot load NVENC",
    "NVENC not available",
    "GPU not found",
    "No hardware acceleration available",
    "Hardware encoder not available",
    "Cannot initialize hardware encoder",
    "GPU device not available",
    "GPU driver not found",
    "GPU initialization failed",
    "Hardware acceleration not supported",
    "VideoToolbox not available",
    "VAAPI device not found",
    "No suitable GPU found",
    "GPU memory allocation failed",
    "Hardware decoder not found",
    "Codec not supported by hardware",
    "GPU context creation failed",
  ];

  let stderr_lower = stderr.to_lowercase();
  gpu_unavailable_patterns
    .iter()
    .any(|pattern| stderr_lower.contains(&pattern.to_lowercase()))
}

/// Проверить доступность GPU кодеков
pub async fn check_gpu_encoders_available() -> Result<GpuCapabilities> {
  let mut capabilities = GpuCapabilities::default();

  // Проверяем NVIDIA NVENC
  if let Ok(output) = FFmpegCommand::ffmpeg()
    .args(["-hide_banner", "-encoders"])
    .execute_string()
    .await
  {
    capabilities.nvenc_available = output.contains("nvenc") || output.contains("h264_nvenc");
    capabilities.nvenc_hevc_available = output.contains("hevc_nvenc");
  }

  // Проверяем Intel Quick Sync
  if let Ok(output) = FFmpegCommand::ffmpeg()
    .args(["-hide_banner", "-encoders"])
    .execute_string()
    .await
  {
    capabilities.qsv_available = output.contains("qsv") || output.contains("h264_qsv");
    capabilities.qsv_hevc_available = output.contains("hevc_qsv");
  }

  // Проверяем AMD AMF
  if let Ok(output) = FFmpegCommand::ffmpeg()
    .args(["-hide_banner", "-encoders"])
    .execute_string()
    .await
  {
    capabilities.amf_available = output.contains("amf") || output.contains("h264_amf");
    capabilities.amf_hevc_available = output.contains("hevc_amf");
  }

  // Проверяем VideoToolbox (macOS)
  if let Ok(output) = FFmpegCommand::ffmpeg()
    .args(["-hide_banner", "-encoders"])
    .execute_string()
    .await
  {
    capabilities.videotoolbox_available = output.contains("videotoolbox");
  }

  // Проверяем VAAPI (Linux)
  if let Ok(output) = FFmpegCommand::ffmpeg()
    .args(["-hide_banner", "-encoders"])
    .execute_string()
    .await
  {
    capabilities.vaapi_available = output.contains("vaapi");
  }

  Ok(capabilities)
}

/// Возможности GPU ускорения
#[derive(Debug, Clone, Default)]
pub struct GpuCapabilities {
  pub nvenc_available: bool,
  pub nvenc_hevc_available: bool,
  pub qsv_available: bool,
  pub qsv_hevc_available: bool,
  pub amf_available: bool,
  pub amf_hevc_available: bool,
  pub videotoolbox_available: bool,
  pub vaapi_available: bool,
}

impl GpuCapabilities {
  /// Проверить, доступно ли хотя бы одно GPU ускорение
  pub fn has_any_gpu_support(&self) -> bool {
    self.nvenc_available
      || self.qsv_available
      || self.amf_available
      || self.videotoolbox_available
      || self.vaapi_available
  }

  /// Получить лучший доступный GPU кодек для H.264
  pub fn best_h264_encoder(&self) -> Option<&'static str> {
    if self.nvenc_available {
      Some("h264_nvenc")
    } else if self.qsv_available {
      Some("h264_qsv")
    } else if self.amf_available {
      Some("h264_amf")
    } else if self.videotoolbox_available {
      Some("h264_videotoolbox")
    } else if self.vaapi_available {
      Some("h264_vaapi")
    } else {
      None
    }
  }

  /// Получить лучший доступный GPU кодек для HEVC
  pub fn best_hevc_encoder(&self) -> Option<&'static str> {
    if self.nvenc_hevc_available {
      Some("hevc_nvenc")
    } else if self.qsv_hevc_available {
      Some("hevc_qsv")
    } else if self.amf_hevc_available {
      Some("hevc_amf")
    } else if self.videotoolbox_available {
      Some("hevc_videotoolbox")
    } else if self.vaapi_available {
      Some("hevc_vaapi")
    } else {
      None
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs;
  use std::io::Write;

  #[tokio::test]
  async fn test_ffmpeg_command_builder() {
    let cmd = FFmpegCommand::ffmpeg()
      .arg("-i")
      .arg("input.mp4")
      .args(vec!["-c:v", "libx264"])
      .arg("output.mp4");

    assert_eq!(cmd.executable, "ffmpeg");
    assert_eq!(
      cmd.args,
      vec!["-i", "input.mp4", "-c:v", "libx264", "output.mp4"]
    );
  }

  #[tokio::test]
  async fn test_ffprobe_command_builder() {
    let cmd = FFmpegCommand::ffprobe()
      .args(vec!["-v", "quiet", "-print_format", "json"])
      .arg("input.mp4");

    assert_eq!(cmd.executable, "ffprobe");
    assert_eq!(
      cmd.args,
      vec!["-v", "quiet", "-print_format", "json", "input.mp4"]
    );
  }

  #[test]
  fn test_codec_validation_video() {
    // Valid video codecs
    let cmd = FFmpegCommand::ffmpeg().codec("v", "libx264");
    assert!(cmd.is_ok());
    let cmd = cmd.unwrap();
    assert!(cmd.args.contains(&"-c:v".to_string()));
    assert!(cmd.args.contains(&"libx264".to_string()));

    // Invalid codec should fail
    let cmd = FFmpegCommand::ffmpeg().codec("v", "malicious_codec");
    assert!(cmd.is_err());
  }

  #[test]
  fn test_codec_validation_audio() {
    // Valid audio codec
    let cmd = FFmpegCommand::ffmpeg().codec("a", "aac");
    assert!(cmd.is_ok());

    // Invalid codec should fail
    let cmd = FFmpegCommand::ffmpeg().codec("a", "fake_codec");
    assert!(cmd.is_err());
  }

  #[test]
  fn test_input_file_validation() {
    // Create a temporary test file
    let temp_dir = std::env::temp_dir();
    let test_file = temp_dir.join("test_input.mp4");

    // Create file
    {
      let mut file = fs::File::create(&test_file).unwrap();
      file.write_all(b"test video content").unwrap();
    }

    let path_str = test_file.to_str().unwrap();

    // Valid input file should work
    let cmd = FFmpegCommand::ffmpeg().input_file(path_str);
    assert!(cmd.is_ok());

    // Cleanup
    fs::remove_file(&test_file).ok();
  }

  #[test]
  fn test_input_file_path_traversal() {
    // Path traversal should be blocked
    let cmd = FFmpegCommand::ffmpeg().input_file("../../../etc/passwd");
    assert!(cmd.is_err());
  }

  #[test]
  fn test_output_file_validation() {
    // Create a temporary directory
    let temp_dir = std::env::temp_dir();
    let output_path = temp_dir.join("test_output.mp4");
    let path_str = output_path.to_str().unwrap();

    // Valid output file should work
    let cmd = FFmpegCommand::ffmpeg().output_file(path_str, Some(1024 * 1024)); // 1MB
    assert!(cmd.is_ok());
  }

  #[test]
  fn test_output_file_size_limit() {
    let temp_dir = std::env::temp_dir();
    let output_path = temp_dir.join("test_large.mp4");
    let path_str = output_path.to_str().unwrap();

    // Size exceeding 10GB should fail
    let cmd = FFmpegCommand::ffmpeg().output_file(path_str, Some(11 * 1024 * 1024 * 1024));
    assert!(cmd.is_err());
  }

  #[test]
  fn test_output_file_invalid_extension() {
    let temp_dir = std::env::temp_dir();
    let output_path = temp_dir.join("test_output.xyz"); // Invalid extension
    let path_str = output_path.to_str().unwrap();

    let cmd = FFmpegCommand::ffmpeg().output_file(path_str, None);
    assert!(cmd.is_err());
  }

  #[test]
  fn test_argument_sanitization_detection() {
    // This test verifies that dangerous arguments are detected (logged as warnings)
    // The current implementation logs but doesn't block for backward compatibility

    let cmd = FFmpegCommand::ffmpeg().arg("-i").arg("normal_file.mp4"); // Normal arg should pass

    assert_eq!(cmd.args.len(), 2);

    // Note: Path with shell metacharacters would be logged but still added
    // In strict mode, this would return an error
  }

  #[test]
  fn test_security_integration() {
    // Create a temporary test file
    let temp_dir = std::env::temp_dir();
    let input_file = temp_dir.join("security_test.mp4");
    let output_file = temp_dir.join("security_output.mp4");

    // Create input file
    {
      let mut file = fs::File::create(&input_file).unwrap();
      file.write_all(b"test content").unwrap();
    }

    let input_path = input_file.to_str().unwrap();
    let output_path = output_file.to_str().unwrap();

    // Build command with security validation
    let cmd = FFmpegCommand::ffmpeg()
      .input_file(input_path)
      .and_then(|cmd| cmd.codec("v", "libx264"))
      .and_then(|cmd| cmd.output_file(output_path, Some(1024 * 1024)));

    assert!(cmd.is_ok());

    // Cleanup
    fs::remove_file(&input_file).ok();
  }
}
