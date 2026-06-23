//! Модуль для анализа видео с помощью FFmpeg

use super::FFmpegCommand;
use crate::types::VideoMetadata;
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use serde_json::Value;
use std::path::Path;

/// Получить метаданные видеофайла через ffprobe
pub async fn get_video_metadata(file_path: &Path) -> Result<VideoMetadata> {
  // Проверяем существование файла
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path.to_string_lossy().to_string(),
      reason: "File not found".to_string(),
    });
  }

  // Выполняем ffprobe
  let output = FFmpegCommand::ffprobe()
    .args(vec![
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
    ])
    .arg(file_path.to_string_lossy())
    .execute_string()
    .await?;

  // Парсим JSON результат
  parse_metadata_from_json(&output)
}

/// Парсинг метаданных из JSON вывода ffprobe
fn parse_metadata_from_json(json_str: &str) -> Result<VideoMetadata> {
  let json: Value = serde_json::from_str(json_str)
    .map_err(|e| VideoCompilerError::SerializationError(format!("Failed to parse JSON: {}", e)))?;

  let format = json.get("format").ok_or_else(|| {
    VideoCompilerError::SerializationError("Missing 'format' section".to_string())
  })?;

  let streams = json
    .get("streams")
    .and_then(|s| s.as_array())
    .ok_or_else(|| {
      VideoCompilerError::SerializationError("Missing 'streams' section".to_string())
    })?;

  // Находим видео поток
  let video_stream = streams
    .iter()
    .find(|s| s.get("codec_type").and_then(|t| t.as_str()) == Some("video"))
    .ok_or_else(|| VideoCompilerError::SerializationError("No video stream found".to_string()))?;

  // Находим аудио поток
  let audio_stream = streams
    .iter()
    .find(|s| s.get("codec_type").and_then(|t| t.as_str()) == Some("audio"));

  // Извлекаем данные
  let duration = format
    .get("duration")
    .and_then(|d| d.as_str())
    .and_then(|d| d.parse::<f64>().ok())
    .unwrap_or(0.0);

  let width = video_stream
    .get("width")
    .and_then(|w| w.as_u64())
    .unwrap_or(0) as u32;

  let height = video_stream
    .get("height")
    .and_then(|h| h.as_u64())
    .unwrap_or(0) as u32;

  let fps = parse_frame_rate(
    video_stream
      .get("r_frame_rate")
      .and_then(|f| f.as_str())
      .unwrap_or("0/1"),
  );

  let bitrate = format
    .get("bit_rate")
    .and_then(|b| b.as_str())
    .and_then(|b| b.parse::<u64>().ok())
    .unwrap_or(0);

  let codec = video_stream
    .get("codec_name")
    .and_then(|c| c.as_str())
    .unwrap_or("unknown")
    .to_string();

  let format_name = format
    .get("format_name")
    .and_then(|f| f.as_str())
    .unwrap_or("unknown")
    .to_string();

  let file_size = format
    .get("size")
    .and_then(|s| s.as_str())
    .and_then(|s| s.parse::<u64>().ok())
    .unwrap_or(0);

  let has_audio = audio_stream.is_some();

  let audio_codec = audio_stream
    .and_then(|s| s.get("codec_name"))
    .and_then(|c| c.as_str())
    .map(|s| s.to_string());

  let audio_channels = audio_stream
    .and_then(|s| s.get("channels"))
    .and_then(|c| c.as_u64())
    .map(|c| c as u32);

  let audio_sample_rate = audio_stream
    .and_then(|s| s.get("sample_rate"))
    .and_then(|r| r.as_str())
    .and_then(|r| r.parse::<u32>().ok());

  Ok(VideoMetadata {
    duration,
    width,
    height,
    fps,
    bitrate,
    codec,
    format: format_name,
    has_audio,
    audio_codec,
    audio_channels,
    audio_sample_rate,
    file_size,
  })
}

/// Парсинг frame rate из строки вида "30/1" или "24000/1001"
fn parse_frame_rate(fps_str: &str) -> f64 {
  let parts: Vec<&str> = fps_str.split('/').collect();
  if parts.len() == 2 {
    if let (Ok(num), Ok(den)) = (parts[0].parse::<f64>(), parts[1].parse::<f64>()) {
      if den != 0.0 {
        return num / den;
      }
    }
  }
  fps_str.parse().unwrap_or(0.0)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_parse_frame_rate() {
    assert_eq!(parse_frame_rate("30/1"), 30.0);
    assert_eq!(parse_frame_rate("24000/1001"), 23.976023976023978);
    assert_eq!(parse_frame_rate("25"), 25.0);
    assert_eq!(parse_frame_rate("invalid"), 0.0);
    assert_eq!(parse_frame_rate("30/0"), 0.0);
  }

  #[test]
  fn test_parse_metadata_from_json() {
    let json_str = r#"{
            "format": {
                "duration": "120.5",
                "bit_rate": "1500000",
                "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
                "size": "22687500"
            },
            "streams": [
                {
                    "codec_type": "video",
                    "codec_name": "h264",
                    "width": 1920,
                    "height": 1080,
                    "r_frame_rate": "30/1"
                },
                {
                    "codec_type": "audio",
                    "codec_name": "aac",
                    "channels": 2,
                    "sample_rate": "48000"
                }
            ]
        }"#;

    let metadata = parse_metadata_from_json(json_str).unwrap();

    assert_eq!(metadata.duration, 120.5);
    assert_eq!(metadata.width, 1920);
    assert_eq!(metadata.height, 1080);
    assert_eq!(metadata.fps, 30.0);
    assert_eq!(metadata.bitrate, 1500000);
    assert_eq!(metadata.codec, "h264");
    assert!(metadata.has_audio);
    assert_eq!(metadata.audio_codec, Some("aac".to_string()));
    assert_eq!(metadata.audio_channels, Some(2));
    assert_eq!(metadata.audio_sample_rate, Some(48000));
  }
}
