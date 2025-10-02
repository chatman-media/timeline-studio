// Типы данных для работы с медиафайлами

use serde::{Deserialize, Deserializer, Serialize};
use serde_json;

/// Вспомогательная функция для десериализации строки в Option<f64>
fn deserialize_string_to_f64<'de, D>(deserializer: D) -> Result<Option<f64>, D::Error>
where
  D: Deserializer<'de>,
{
  let value: Option<serde_json::Value> = Option::deserialize(deserializer)?;
  match value {
    Some(serde_json::Value::String(s)) => {
      s.parse::<f64>().map(Some).map_err(serde::de::Error::custom)
    }
    Some(serde_json::Value::Number(n)) => Ok(n.as_f64()),
    None => Ok(None),
    _ => Err(serde::de::Error::custom("expected string or number")),
  }
}

/// Вспомогательная функция для десериализации строки в Option<u64>
fn deserialize_string_to_u64<'de, D>(deserializer: D) -> Result<Option<u64>, D::Error>
where
  D: Deserializer<'de>,
{
  let value: Option<serde_json::Value> = Option::deserialize(deserializer)?;
  match value {
    Some(serde_json::Value::String(s)) => {
      s.parse::<u64>().map(Some).map_err(serde::de::Error::custom)
    }
    Some(serde_json::Value::Number(n)) => Ok(n.as_u64()),
    None => Ok(None),
    _ => Err(serde::de::Error::custom("expected string or number")),
  }
}

/// Структура для хранения метаданных видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoMetadata {
  pub duration: Option<f64>,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub fps: Option<f64>,
  pub codec: Option<String>,
  pub bitrate: Option<u64>,
  pub size: Option<u64>,
  pub creation_time: Option<String>,
}

/// Структура для хранения метаданных аудио
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioMetadata {
  pub duration: Option<f64>,
  pub codec: Option<String>,
  pub bitrate: Option<u64>,
  pub sample_rate: Option<u32>,
  pub channels: Option<u8>,
  pub size: Option<u64>,
  pub creation_time: Option<String>,
}

/// Структура для хранения метаданных изображения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageMetadata {
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub format: Option<String>,
  pub size: Option<u64>,
  pub creation_time: Option<String>,
}

/// Перечисление для типов медиафайлов
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MediaMetadata {
  Video(VideoMetadata),
  Audio(AudioMetadata),
  Image(ImageMetadata),
  Unknown,
}

/// Структура для потока в формате FFprobe
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FfprobeStream {
  pub index: u32,
  pub codec_type: String,
  pub codec_name: Option<String>,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub bit_rate: Option<String>,
  pub r_frame_rate: Option<String>,
  pub sample_rate: Option<String>,
  pub channels: Option<u8>,
  pub display_aspect_ratio: Option<String>,
}

/// Структура для формата в формате FFprobe
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FfprobeFormat {
  #[serde(deserialize_with = "deserialize_string_to_f64")]
  pub duration: Option<f64>,
  #[serde(deserialize_with = "deserialize_string_to_u64")]
  pub size: Option<u64>,
  pub bit_rate: Option<String>,
  pub format_name: Option<String>,
}

/// Структура для хранения данных FFprobe
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProbeData {
  pub streams: Vec<FfprobeStream>,
  pub format: FfprobeFormat,
}

/// Структура для медиафайла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaFile {
  pub id: String,
  pub name: String,
  pub path: String,
  pub is_video: bool,
  pub is_audio: bool,
  pub is_image: bool,
  pub size: u64,
  pub duration: Option<f64>,
  pub start_time: u64,
  pub creation_time: String,
  pub probe_data: ProbeData,
  pub thumbnail_path: Option<String>,
}

/// Поддерживаемые расширения медиафайлов
pub const SUPPORTED_EXTENSIONS: &[&str] = &[
  // Видео
  "mp4", "avi", "mkv", "mov", "webm", // Аудио
  "mp3", "wav", "ogg", "flac", // Изображения
  "jpg", "jpeg", "png", "gif", "webp",
];

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_media_file_structure_serialization() {
    // Тестируем сериализацию/десериализацию структур
    let stream = FfprobeStream {
      index: 0,
      codec_type: "video".to_string(),
      codec_name: Some("h264".to_string()),
      width: Some(1920),
      height: Some(1080),
      bit_rate: Some("5000000".to_string()),
      r_frame_rate: Some("30/1".to_string()),
      sample_rate: None,
      channels: None,
      display_aspect_ratio: Some("16:9".to_string()),
    };

    let format = FfprobeFormat {
      duration: Some(120.5),
      size: Some(1024000),
      bit_rate: Some("5000000".to_string()),
      format_name: Some("mov,mp4,m4a,3gp,3g2,mj2".to_string()),
    };

    let probe_data = ProbeData {
      streams: vec![stream],
      format,
    };

    let media_file = MediaFile {
      id: "test_id".to_string(),
      name: "test.mp4".to_string(),
      path: "/path/to/test.mp4".to_string(),
      is_video: true,
      is_audio: false,
      is_image: false,
      size: 1024000,
      duration: Some(120.5),
      start_time: 1234567890,
      creation_time: "2023-01-01T00:00:00Z".to_string(),
      probe_data,
      thumbnail_path: Some("/path/to/thumbnail.jpg".to_string()),
    };

    // Тестируем сериализацию в JSON
    let json = serde_json::to_string(&media_file);
    assert!(json.is_ok());

    // Тестируем десериализацию из JSON
    let json_str = json.unwrap();
    let deserialized: Result<MediaFile, _> = serde_json::from_str(&json_str);
    assert!(deserialized.is_ok());

    let deserialized_file = deserialized.unwrap();
    assert_eq!(deserialized_file.name, "test.mp4");
    assert!(deserialized_file.is_video);
    assert_eq!(deserialized_file.probe_data.streams.len(), 1);
    assert_eq!(deserialized_file.probe_data.streams[0].codec_type, "video");
  }

  #[test]
  fn test_media_metadata_enum() {
    // Тестируем перечисление MediaMetadata
    let video_metadata = VideoMetadata {
      duration: Some(120.0),
      width: Some(1920),
      height: Some(1080),
      fps: Some(30.0),
      codec: Some("h264".to_string()),
      bitrate: Some(5000000),
      size: Some(1024000),
      creation_time: Some("2023-01-01T00:00:00Z".to_string()),
    };

    let media_metadata = MediaMetadata::Video(video_metadata);

    // Тестируем сериализацию
    let json = serde_json::to_string(&media_metadata);
    assert!(json.is_ok());

    // Проверяем, что JSON содержит тег типа
    let json_str = json.unwrap();
    assert!(json_str.contains("\"type\":\"Video\""));
  }

  #[test]
  fn test_supported_extensions() {
    // Проверяем, что константа содержит ожидаемые расширения
    assert!(SUPPORTED_EXTENSIONS.contains(&"mp4"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"mp3"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"jpg"));
    assert!(!SUPPORTED_EXTENSIONS.contains(&"txt"));
  }
}
