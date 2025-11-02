//! FFmpeg интеграция для Timeline Studio
//!
//! Этот модуль предоставляет функциональность для работы с FFmpeg,
//! включая анализ видео, детекцию сцен, работу с аудио и другие операции.

pub mod analysis;
pub mod audio_analysis;
pub mod color_correction;
pub mod keyframes;
pub mod motion_analysis;
pub mod quality;
pub mod scene_detection;
pub mod silence_detection;
pub mod stabilization;
pub mod unified_audio_analysis; // 🆕 Modern unified audio analysis

use crate::video_compiler::error::{Result, VideoCompilerError};
use std::process::Output;
use tokio::process::Command;

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

  /// Добавить аргумент
  pub fn arg<S: Into<String>>(mut self, arg: S) -> Self {
    self.args.push(arg.into());
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
}
