//! Security utilities for FFmpeg command execution
//!
//! This module provides validation and sanitization for FFmpeg commands
//! to prevent command injection and other security vulnerabilities.

use ts_render::video_compiler::core::error::{Result, VideoCompilerError};
use std::path::PathBuf;

/// Maximum allowed output file size (10GB)
const MAX_OUTPUT_SIZE: u64 = 10 * 1024 * 1024 * 1024;

/// Maximum allowed input file size (50GB)
const MAX_INPUT_SIZE: u64 = 50 * 1024 * 1024 * 1024;

/// Allowed file extensions for input files
const ALLOWED_INPUT_EXTENSIONS: &[&str] = &[
  "mp4", "mov", "avi", "mkv", "webm", "flv", "wmv", "m4v", "mp3", "wav", "aac", "flac", "ogg",
  "m4a", "wma", "jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp",
];

/// Allowed file extensions for output files
const ALLOWED_OUTPUT_EXTENSIONS: &[&str] = &[
  "mp4", "mov", "avi", "mkv", "webm", "flv", "m4v", "mp3", "wav", "aac", "flac", "ogg", "m4a",
  "jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp",
];

/// Security validator for FFmpeg operations
pub struct FFmpegSecurity;

impl FFmpegSecurity {
  /// Validate file path to prevent path traversal attacks
  pub fn validate_path(path: &str) -> Result<PathBuf> {
    // Check for null bytes
    if path.contains('\0') {
      return Err(VideoCompilerError::ValidationError(
        "Path contains null bytes".to_string(),
      ));
    }

    // Check for path traversal attempts
    if path.contains("..") || path.contains("./") || path.contains(".\\") {
      return Err(VideoCompilerError::ValidationError(
        "Path traversal detected".to_string(),
      ));
    }

    // Convert to absolute path
    let path_buf = PathBuf::from(path);

    // Canonicalize to resolve symlinks and get absolute path
    let canonical = path_buf
      .canonicalize()
      .map_err(|e| VideoCompilerError::ValidationError(format!("Invalid path: {}", e)))?;

    // Ensure path is absolute
    if !canonical.is_absolute() {
      return Err(VideoCompilerError::ValidationError(
        "Path must be absolute".to_string(),
      ));
    }

    Ok(canonical)
  }

  /// Validate input file path and check file size
  pub fn validate_input_file(path: &str) -> Result<PathBuf> {
    let validated_path = Self::validate_path(path)?;

    // Check file exists
    if !validated_path.exists() {
      return Err(VideoCompilerError::ValidationError(format!(
        "File does not exist: {}",
        path
      )));
    }

    // Check it's a file, not a directory
    if !validated_path.is_file() {
      return Err(VideoCompilerError::ValidationError(format!(
        "Path is not a file: {}",
        path
      )));
    }

    // Check file extension
    if let Some(ext) = validated_path.extension() {
      let ext_str = ext.to_string_lossy().to_lowercase();
      if !ALLOWED_INPUT_EXTENSIONS.contains(&ext_str.as_str()) {
        return Err(VideoCompilerError::ValidationError(format!(
          "Unsupported input file extension: {}",
          ext_str
        )));
      }
    } else {
      return Err(VideoCompilerError::ValidationError(
        "File has no extension".to_string(),
      ));
    }

    // Check file size
    let metadata = validated_path.metadata().map_err(|e| {
      VideoCompilerError::ValidationError(format!("Cannot read file metadata: {}", e))
    })?;

    if metadata.len() > MAX_INPUT_SIZE {
      return Err(VideoCompilerError::ValidationError(format!(
        "Input file too large: {} bytes (max: {} bytes)",
        metadata.len(),
        MAX_INPUT_SIZE
      )));
    }

    Ok(validated_path)
  }

  /// Validate output file path and check available disk space
  pub fn validate_output_file(path: &str, estimated_size: Option<u64>) -> Result<PathBuf> {
    // For output files, we need to validate the parent directory exists
    let path_buf = PathBuf::from(path);

    // Check for null bytes
    if path.contains('\0') {
      return Err(VideoCompilerError::ValidationError(
        "Path contains null bytes".to_string(),
      ));
    }

    // Check for path traversal
    if path.contains("..") {
      return Err(VideoCompilerError::ValidationError(
        "Path traversal detected".to_string(),
      ));
    }

    // Check parent directory exists
    if let Some(parent) = path_buf.parent() {
      if !parent.exists() {
        return Err(VideoCompilerError::ValidationError(format!(
          "Parent directory does not exist: {:?}",
          parent
        )));
      }
    } else {
      return Err(VideoCompilerError::ValidationError(
        "Invalid output path: no parent directory".to_string(),
      ));
    }

    // Check file extension
    if let Some(ext) = path_buf.extension() {
      let ext_str = ext.to_string_lossy().to_lowercase();
      if !ALLOWED_OUTPUT_EXTENSIONS.contains(&ext_str.as_str()) {
        return Err(VideoCompilerError::ValidationError(format!(
          "Unsupported output file extension: {}",
          ext_str
        )));
      }
    } else {
      return Err(VideoCompilerError::ValidationError(
        "Output file has no extension".to_string(),
      ));
    }

    // Check estimated size
    if let Some(size) = estimated_size {
      if size > MAX_OUTPUT_SIZE {
        return Err(VideoCompilerError::ValidationError(format!(
          "Estimated output size too large: {} bytes (max: {} bytes)",
          size, MAX_OUTPUT_SIZE
        )));
      }
    }

    Ok(path_buf)
  }

  /// Sanitize FFmpeg argument to prevent command injection
  pub fn sanitize_argument(arg: &str) -> Result<String> {
    // Check for null bytes
    if arg.contains('\0') {
      return Err(VideoCompilerError::ValidationError(
        "Argument contains null bytes".to_string(),
      ));
    }

    // Check for shell metacharacters that could lead to command injection
    let dangerous_chars = [
      '|', '&', ';', '$', '`', '>', '<', '(', ')', '{', '}', '[', ']', '!', '#',
    ];

    if arg.chars().any(|c| dangerous_chars.contains(&c)) {
      return Err(VideoCompilerError::ValidationError(format!(
        "Argument contains dangerous characters: {}",
        arg
      )));
    }

    // Check for newlines (can break command parsing)
    if arg.contains('\n') || arg.contains('\r') {
      return Err(VideoCompilerError::ValidationError(
        "Argument contains newline characters".to_string(),
      ));
    }

    Ok(arg.to_string())
  }

  /// Validate codec name
  pub fn validate_codec(codec: &str) -> Result<String> {
    // Whitelist of allowed codecs
    const ALLOWED_CODECS: &[&str] = &[
      // Video codecs
      "libx264",
      "libx265",
      "h264_nvenc",
      "hevc_nvenc",
      "h264_qsv",
      "hevc_qsv",
      "h264_videotoolbox",
      "hevc_videotoolbox",
      "libvpx",
      "libvpx-vp9",
      "libaom-av1",
      "librav1e",
      "prores",
      "prores_ks",
      "dnxhd",
      "copy",
      // Audio codecs
      "aac",
      "libmp3lame",
      "libopus",
      "libvorbis",
      "flac",
      "pcm_s16le",
      "pcm_s24le",
      "copy",
    ];

    if !ALLOWED_CODECS.contains(&codec) {
      return Err(VideoCompilerError::ValidationError(format!(
        "Unsupported codec: {}",
        codec
      )));
    }

    Ok(codec.to_string())
  }

  /// Validate numeric parameter
  pub fn validate_numeric<T: std::str::FromStr + PartialOrd + std::fmt::Display>(
    value: &str,
    min: T,
    max: T,
    name: &str,
  ) -> Result<T> {
    let parsed = value
      .parse::<T>()
      .map_err(|_| VideoCompilerError::ValidationError(format!("Invalid {}: {}", name, value)))?;

    if parsed < min || parsed > max {
      return Err(VideoCompilerError::ValidationError(format!(
        "{} out of range: {} (allowed: {} - {})",
        name, value, min, max
      )));
    }

    Ok(parsed)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_path_traversal_detection() {
    assert!(FFmpegSecurity::validate_path("../etc/passwd").is_err());
    assert!(FFmpegSecurity::validate_path("./../../etc/passwd").is_err());
    assert!(FFmpegSecurity::validate_path("test/../secret").is_err());
  }

  #[test]
  fn test_null_byte_detection() {
    assert!(FFmpegSecurity::validate_path("test\0file").is_err());
    assert!(FFmpegSecurity::sanitize_argument("arg\0value").is_err());
  }

  #[test]
  fn test_command_injection_detection() {
    assert!(FFmpegSecurity::sanitize_argument("test|whoami").is_err());
    assert!(FFmpegSecurity::sanitize_argument("test; rm -rf /").is_err());
    assert!(FFmpegSecurity::sanitize_argument("test`whoami`").is_err());
    assert!(FFmpegSecurity::sanitize_argument("test$(whoami)").is_err());
  }

  #[test]
  fn test_codec_validation() {
    assert!(FFmpegSecurity::validate_codec("libx264").is_ok());
    assert!(FFmpegSecurity::validate_codec("malicious_codec").is_err());
  }

  #[test]
  fn test_numeric_validation() {
    assert!(FFmpegSecurity::validate_numeric::<i32>("10", 0, 100, "test").is_ok());
    assert!(FFmpegSecurity::validate_numeric::<i32>("150", 0, 100, "test").is_err());
    assert!(FFmpegSecurity::validate_numeric::<i32>("-10", 0, 100, "test").is_err());
  }
}
