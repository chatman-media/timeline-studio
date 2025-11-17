use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;
use std::process::Command;

use crate::app_dirs::AppDirectories;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProxyGenerationParams {
  pub source_path: String,
  pub width: u32,
  pub height: u32,
  pub codec: String,
  pub bitrate: String,
  pub preserve_audio: bool,
  pub fps: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProxyGenerationResult {
  pub proxy_path: String,
  pub source_path: String,
  pub size: u64,
  pub resolution: Resolution,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Resolution {
  pub width: u32,
  pub height: u32,
}

/// Generate proxy file using FFmpeg
pub fn generate_proxy(
  params: ProxyGenerationParams,
  proxy_dir: &Path,
) -> Result<ProxyGenerationResult, String> {
  log::info!("Starting proxy generation: {:?}", params);

  // Validate source file exists
  let source_path = Path::new(&params.source_path);
  if !source_path.exists() {
    return Err(format!("Source file not found: {}", params.source_path));
  }

  // Create proxy directory if it doesn't exist
  if !proxy_dir.exists() {
    std::fs::create_dir_all(proxy_dir)
      .map_err(|e| format!("Failed to create proxy directory: {}", e))?;
  }

  // Generate proxy filename
  let source_filename = source_path
    .file_stem()
    .and_then(|s| s.to_str())
    .ok_or("Invalid source filename")?;

  let proxy_filename = format!(
    "{}_proxy_{}x{}.mp4",
    source_filename, params.width, params.height
  );
  let proxy_path = proxy_dir.join(&proxy_filename);

  // Build FFmpeg command
  let mut ffmpeg_cmd = Command::new("ffmpeg");

  // Input file
  ffmpeg_cmd.arg("-i").arg(&params.source_path);

  // Overwrite output file without asking
  ffmpeg_cmd.arg("-y");

  // Video codec and settings
  match params.codec.as_str() {
    "h264" => {
      ffmpeg_cmd
        .arg("-c:v")
        .arg("libx264")
        .arg("-preset")
        .arg("medium")
        .arg("-crf")
        .arg("23");
    }
    "h265" | "hevc" => {
      ffmpeg_cmd
        .arg("-c:v")
        .arg("libx265")
        .arg("-preset")
        .arg("medium")
        .arg("-crf")
        .arg("28");
    }
    _ => {
      ffmpeg_cmd.arg("-c:v").arg("libx264");
    }
  }

  // Resolution scaling
  ffmpeg_cmd
    .arg("-vf")
    .arg(format!("scale={}:{}", params.width, params.height));

  // Bitrate
  ffmpeg_cmd.arg("-b:v").arg(&params.bitrate);

  // FPS (if specified)
  if let Some(fps) = params.fps {
    ffmpeg_cmd.arg("-r").arg(fps.to_string());
  }

  // Audio settings
  if params.preserve_audio {
    ffmpeg_cmd.arg("-c:a").arg("aac").arg("-b:a").arg("128k");
  } else {
    ffmpeg_cmd.arg("-an"); // No audio
  }

  // Output file
  ffmpeg_cmd.arg(proxy_path.to_str().ok_or("Invalid proxy path")?);

  log::info!("FFmpeg command: {:?}", ffmpeg_cmd);

  // Execute FFmpeg
  let output = ffmpeg_cmd
    .output()
    .map_err(|e| format!("Failed to execute FFmpeg: {}. Make sure FFmpeg is installed and in PATH", e))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    log::error!("FFmpeg error: {}", stderr);
    return Err(format!("FFmpeg failed: {}", stderr));
  }

  // Get file size
  let metadata = std::fs::metadata(&proxy_path)
    .map_err(|e| format!("Failed to get proxy file metadata: {}", e))?;

  let size = metadata.len();

  log::info!(
    "Proxy generation completed: {} ({} bytes)",
    proxy_path.display(),
    size
  );

  Ok(ProxyGenerationResult {
    proxy_path: proxy_path.to_string_lossy().to_string(),
    source_path: params.source_path.clone(),
    size,
    resolution: Resolution {
      width: params.width,
      height: params.height,
    },
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::TempDir;

  #[test]
  fn test_generate_proxy_params_serialization() {
    let params = ProxyGenerationParams {
      source_path: "/path/to/video.mp4".to_string(),
      width: 1280,
      height: 720,
      codec: "h264".to_string(),
      bitrate: "3M".to_string(),
      preserve_audio: true,
      fps: Some(30),
    };

    let json = serde_json::to_string(&params).unwrap();
    let deserialized: ProxyGenerationParams = serde_json::from_str(&json).unwrap();

    assert_eq!(params.source_path, deserialized.source_path);
    assert_eq!(params.width, deserialized.width);
    assert_eq!(params.height, deserialized.height);
  }

  #[test]
  fn test_proxy_path_generation() {
    let _temp_dir = TempDir::new().unwrap();
    let source_path = "/path/to/my_video.mp4";

    let params = ProxyGenerationParams {
      source_path: source_path.to_string(),
      width: 1280,
      height: 720,
      codec: "h264".to_string(),
      bitrate: "3M".to_string(),
      preserve_audio: true,
      fps: None,
    };

    // Expected proxy filename format
    let source_filename = Path::new(source_path).file_stem().unwrap().to_str().unwrap();
    let expected_filename = format!("{}_proxy_{}x{}.mp4", source_filename, params.width, params.height);

    assert_eq!(expected_filename, "my_video_proxy_1280x720.mp4");
  }

  #[test]
  fn test_missing_source_file() {
    let temp_dir = TempDir::new().unwrap();
    let params = ProxyGenerationParams {
      source_path: "/nonexistent/video.mp4".to_string(),
      width: 1280,
      height: 720,
      codec: "h264".to_string(),
      bitrate: "3M".to_string(),
      preserve_audio: true,
      fps: None,
    };

    let result = generate_proxy(params, temp_dir.path());
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("not found"));
  }
}

/// Tauri command to generate proxy file
#[tauri::command]
#[specta::specta]
pub async fn generate_proxy_command(
  source_path: String,
  width: u32,
  height: u32,
  codec: String,
  bitrate: String,
  preserve_audio: bool,
  fps: Option<u32>,
) -> Result<ProxyGenerationResult, String> {
  log::info!("Generating proxy via Tauri command");

  let params = ProxyGenerationParams {
    source_path,
    width,
    height,
    codec,
    bitrate,
    preserve_audio,
    fps,
  };

  // Get app directories
  let app_dirs = AppDirectories::get_or_create()
    .map_err(|e| format!("Failed to get app directories: {}", e))?;

  let proxy_dir = &app_dirs.media_proxy_dir;

  generate_proxy(params, proxy_dir)
}
