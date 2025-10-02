//! Metadata Extractor - Извлечение метаданных из медиафайлов

use crate::media::metadata::get_media_metadata;
use crate::media::types::MediaFile;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::{AppHandle, Emitter};

/// События метаданных
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum MetadataEvent {
  /// Метаданные готовы
  MetadataReady {
    file_id: String,
    file_path: String,
    metadata: Box<MediaFile>,
  },
  /// Ошибка извлечения метаданных
  MetadataError {
    file_id: String,
    file_path: String,
    error: String,
  },
}

/// Экстрактор метаданных
#[allow(dead_code)]
pub struct MetadataExtractor {
  app_handle: AppHandle,
}

impl MetadataExtractor {
  /// Создает новый экстрактор
  #[allow(dead_code)]
  pub fn new(app_handle: AppHandle) -> Self {
    Self { app_handle }
  }

  /// Извлекает метаданные из файла
  #[allow(dead_code)]
  pub async fn extract_metadata(
    &self,
    file_id: String,
    file_path: String,
  ) -> Result<MediaFile, String> {
    match get_media_metadata(file_path.clone()) {
      Ok(metadata) => {
        // Отправляем событие о готовых метаданных
        let _ = self.app_handle.emit(
          "media-processor",
          MetadataEvent::MetadataReady {
            file_id: file_id.clone(),
            file_path: file_path.clone(),
            metadata: Box::new(metadata.clone()),
          },
        );
        Ok(metadata)
      }
      Err(e) => {
        let error_msg = format!("Failed to get metadata: {e}");
        let _ = self.app_handle.emit(
          "media-processor",
          MetadataEvent::MetadataError {
            file_id,
            file_path,
            error: error_msg.clone(),
          },
        );
        Err(error_msg)
      }
    }
  }

  /// Пакетная обработка файлов
  #[allow(dead_code)]
  pub async fn extract_batch(
    &self,
    files: Vec<(String, String)>, // (file_id, file_path)
  ) -> Vec<Result<MediaFile, String>> {
    let mut results = Vec::new();

    for (file_id, file_path) in files {
      let result = self.extract_metadata(file_id, file_path).await;
      results.push(result);
    }

    results
  }

  /// Проверяет, поддерживается ли файл
  #[allow(dead_code)]
  pub fn is_supported(file_path: &Path) -> bool {
    file_path
      .extension()
      .and_then(|ext| ext.to_str())
      .map(|ext| {
        let ext_lower = ext.to_lowercase();
        crate::media::types::SUPPORTED_EXTENSIONS.contains(&ext_lower.as_str())
      })
      .unwrap_or(false)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::path::PathBuf;

  #[test]
  fn test_is_supported() {
    assert!(MetadataExtractor::is_supported(&PathBuf::from("video.mp4")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("image.jpg")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("audio.mp3")));
    assert!(!MetadataExtractor::is_supported(&PathBuf::from(
      "document.pdf"
    )));
    assert!(!MetadataExtractor::is_supported(&PathBuf::from(
      "no_extension"
    )));
  }

  #[test]
  fn test_is_supported_case_insensitive() {
    assert!(MetadataExtractor::is_supported(&PathBuf::from("VIDEO.MP4")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("Image.JPG")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("AUDIO.MP3")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("video.MKV")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from(
      "photo.JPEG"
    )));
  }

  #[test]
  fn test_is_supported_various_extensions() {
    // Video formats
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.mp4")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.avi")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.mov")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.mkv")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.webm")));

    // Image formats
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.jpg")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.jpeg")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.png")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.gif")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.webp")));

    // Audio formats
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.mp3")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.wav")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.ogg")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("test.flac")));
  }

  #[test]
  fn test_is_supported_edge_cases() {
    // Hidden files
    assert!(MetadataExtractor::is_supported(&PathBuf::from(
      ".hidden.mp4"
    )));

    // Files with multiple dots
    assert!(MetadataExtractor::is_supported(&PathBuf::from(
      "file.name.with.dots.mp4"
    )));

    // Path with directories
    assert!(MetadataExtractor::is_supported(&PathBuf::from(
      "/path/to/video.mp4"
    )));
    assert!(MetadataExtractor::is_supported(&PathBuf::from(
      "relative/path/image.jpg"
    )));

    // Empty path
    assert!(!MetadataExtractor::is_supported(&PathBuf::from("")));

    // Just extension
    assert!(!MetadataExtractor::is_supported(&PathBuf::from(".mp4")));
  }

  #[test]
  fn test_metadata_event_serialization() {
    use crate::media::types::{FfprobeFormat, MediaFile, ProbeData};

    let event = MetadataEvent::MetadataReady {
      file_id: "test-id".to_string(),
      file_path: "/path/to/file.mp4".to_string(),
      metadata: Box::new(MediaFile {
        id: "test-id".to_string(),
        name: "file.mp4".to_string(),
        path: "/path/to/file.mp4".to_string(),
        is_video: true,
        is_audio: false,
        is_image: false,
        size: 1024,
        duration: Some(60.0),
        start_time: 0,
        creation_time: "2023-01-01T00:00:00Z".to_string(),
        probe_data: ProbeData {
          streams: vec![],
          format: FfprobeFormat {
            duration: Some(60.0),
            size: Some(1024),
            bit_rate: None,
            format_name: Some("mp4".to_string()),
          },
        },
        thumbnail_path: None,
      }),
    };

    // Test serialization
    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("MetadataReady"));
    assert!(json.contains("test-id"));
    assert!(json.contains("/path/to/file.mp4"));

    // Test deserialization
    let deserialized: MetadataEvent = serde_json::from_str(&json).unwrap();
    match deserialized {
      MetadataEvent::MetadataReady {
        file_id,
        file_path,
        metadata,
      } => {
        assert_eq!(file_id, "test-id");
        assert_eq!(file_path, "/path/to/file.mp4");
        assert_eq!(metadata.id, "test-id");
        assert!(metadata.is_video);
      }
      _ => panic!("Wrong event type"),
    }
  }

  #[test]
  fn test_metadata_error_event_serialization() {
    let event = MetadataEvent::MetadataError {
      file_id: "error-id".to_string(),
      file_path: "/path/to/error.mp4".to_string(),
      error: "Failed to read file".to_string(),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("MetadataError"));
    assert!(json.contains("error-id"));
    assert!(json.contains("Failed to read file"));

    let deserialized: MetadataEvent = serde_json::from_str(&json).unwrap();
    match deserialized {
      MetadataEvent::MetadataError {
        file_id,
        file_path,
        error,
      } => {
        assert_eq!(file_id, "error-id");
        assert_eq!(file_path, "/path/to/error.mp4");
        assert_eq!(error, "Failed to read file");
      }
      _ => panic!("Wrong event type"),
    }
  }

  // Примечание: тесты для методов, требующих AppHandle,
  // должны запускаться в интеграционных тестах с реальным Tauri приложением

  #[test]
  fn test_supported_extensions_constants() {
    // Проверяем, что используемая константа существует
    use crate::media::types::SUPPORTED_EXTENSIONS;

    assert!(SUPPORTED_EXTENSIONS.contains(&"mp4"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"jpg"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"mp3"));
    assert!(!SUPPORTED_EXTENSIONS.contains(&"pdf"));
  }
}
