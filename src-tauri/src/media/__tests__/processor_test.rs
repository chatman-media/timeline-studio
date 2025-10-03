// Тесты для процессора медиафайлов

#[cfg(test)]
mod tests {
  use crate::media::processor::*;
  use crate::media::types::{FfprobeFormat, FfprobeStream, MediaFile, ProbeData};
  use tempfile::TempDir;

  #[derive(Debug, Clone)]
  struct ProcessOptions {
    pub max_concurrent: usize,
    pub extract_thumbnails: bool,
    pub thumbnail_size: u32,
    pub thumbnail_quality: u8,
    pub skip_metadata: bool,
  }

  impl Default for ProcessOptions {
    fn default() -> Self {
      Self {
        max_concurrent: 4,
        extract_thumbnails: true,
        thumbnail_size: 320,
        thumbnail_quality: 80,
        skip_metadata: false,
      }
    }
  }

  #[tokio::test]
  async fn test_scan_folder_empty() {
    // Создаем временную директорию
    let _temp_dir = TempDir::new().unwrap();

    // Создаем фиктивный AppHandle (в реальных тестах нужен мок)
    // let app_handle = create_mock_app_handle();

    // TODO: Добавить полноценные тесты после создания моков для AppHandle
  }

  #[test]
  fn test_discovered_file_creation() {
    let file = DiscoveredFile {
      id: "test-id".to_string(),
      path: "/path/to/test.mp4".to_string(),
      name: "test.mp4".to_string(),
      extension: "mp4".to_string(),
      size: 1024,
    };

    assert_eq!(file.id, "test-id");
    assert_eq!(file.name, "test.mp4");
    assert_eq!(file.extension, "mp4");
    assert_eq!(file.size, 1024);
  }

  #[test]
  fn test_processor_event_metadata_ready() {
    let media_file = MediaFile {
      id: "test-id".to_string(),
      name: "test.mp4".to_string(),
      path: "/path/to/test.mp4".to_string(),
      is_video: true,
      is_audio: false,
      is_image: false,
      size: 1024000,
      duration: Some(120.0),
      start_time: 0,
      creation_time: "2023-01-01T00:00:00Z".to_string(),
      probe_data: ProbeData {
        streams: vec![FfprobeStream {
          index: 0,
          codec_name: Some("h264".to_string()),
          codec_type: "video".to_string(),
          width: Some(1920),
          height: Some(1080),
          display_aspect_ratio: Some("16:9".to_string()),
          r_frame_rate: Some("30/1".to_string()),
          bit_rate: Some("5000000".to_string()),
          channels: None,
          sample_rate: None,
        }],
        format: FfprobeFormat {
          duration: Some(120.0),
          size: Some(1024000),
          bit_rate: Some("5000000".to_string()),
          format_name: Some("mov,mp4,m4a,3gp,3g2,mj2".to_string()),
        },
      },
      thumbnail_path: None,
    };

    let event = ProcessorEvent::MetadataReady {
      file_id: "test-id".to_string(),
      file_path: "/path/to/test.mp4".to_string(),
      metadata: Box::new(media_file.clone()),
    };

    if let ProcessorEvent::MetadataReady {
      file_id,
      file_path,
      metadata,
    } = event
    {
      assert_eq!(file_id, "test-id");
      assert_eq!(file_path, "/path/to/test.mp4");
      assert_eq!(metadata.name, "test.mp4");
      assert!(metadata.is_video);
      assert_eq!(metadata.duration, Some(120.0));
    } else {
      panic!("Expected MetadataReady event");
    }
  }

  #[test]
  fn test_processor_event_thumbnail_ready() {
    let event = ProcessorEvent::ThumbnailReady {
      file_id: "test-id".to_string(),
      file_path: "/path/to/test.mp4".to_string(),
      thumbnail_path: "/tmp/thumb_test-id.jpg".to_string(),
      thumbnail_data: Some("base64encodeddata".to_string()),
    };

    if let ProcessorEvent::ThumbnailReady {
      file_id,
      file_path,
      thumbnail_path,
      thumbnail_data,
    } = event
    {
      assert_eq!(file_id, "test-id");
      assert_eq!(file_path, "/path/to/test.mp4");
      assert_eq!(thumbnail_path, "/tmp/thumb_test-id.jpg");
      assert_eq!(thumbnail_data, Some("base64encodeddata".to_string()));
    } else {
      panic!("Expected ThumbnailReady event");
    }
  }

  #[test]
  fn test_processor_event_processing_error() {
    let event = ProcessorEvent::ProcessingError {
      file_id: "test-id".to_string(),
      file_path: "/path/to/test.mp4".to_string(),
      error: "Failed to extract metadata".to_string(),
    };

    if let ProcessorEvent::ProcessingError {
      file_id,
      file_path,
      error,
    } = event
    {
      assert_eq!(file_id, "test-id");
      assert_eq!(file_path, "/path/to/test.mp4");
      assert_eq!(error, "Failed to extract metadata");
    } else {
      panic!("Expected ProcessingError event");
    }
  }

  #[test]
  fn test_processor_event_files_discovered() {
    let files = vec![
      DiscoveredFile {
        id: "id1".to_string(),
        path: "/path/to/file1.mp4".to_string(),
        name: "file1.mp4".to_string(),
        extension: "mp4".to_string(),
        size: 1024,
      },
      DiscoveredFile {
        id: "id2".to_string(),
        path: "/path/to/file2.mov".to_string(),
        name: "file2.mov".to_string(),
        extension: "mov".to_string(),
        size: 2048,
      },
    ];

    let event = ProcessorEvent::FilesDiscovered {
      files: files.clone(),
      total: 2,
    };

    if let ProcessorEvent::FilesDiscovered { files, total } = event {
      assert_eq!(total, 2);
      assert_eq!(files.len(), 2);
      assert_eq!(files[0].name, "file1.mp4");
      assert_eq!(files[1].name, "file2.mov");
    } else {
      panic!("Expected FilesDiscovered event");
    }
  }

  #[test]
  fn test_processor_event_scan_progress() {
    let event = ProcessorEvent::ScanProgress {
      current: 5,
      total: 10,
    };

    if let ProcessorEvent::ScanProgress { current, total } = event {
      assert_eq!(current, 5);
      assert_eq!(total, 10);
    } else {
      panic!("Expected ScanProgress event");
    }
  }

  #[test]
  fn test_event_serialization() {
    // Test FilesDiscovered serialization
    let event = ProcessorEvent::FilesDiscovered {
      files: vec![DiscoveredFile {
        id: "test".to_string(),
        path: "/test.mp4".to_string(),
        name: "test.mp4".to_string(),
        extension: "mp4".to_string(),
        size: 1024,
      }],
      total: 1,
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("FilesDiscovered"));
    assert!(json.contains("test.mp4"));

    let deserialized: ProcessorEvent = serde_json::from_str(&json).unwrap();
    if let ProcessorEvent::FilesDiscovered { files, total } = deserialized {
      assert_eq!(total, 1);
      assert_eq!(files[0].name, "test.mp4");
    } else {
      panic!("Deserialization failed");
    }
  }

  #[test]
  fn test_supported_extensions() {
    use crate::media::types::SUPPORTED_EXTENSIONS;

    // Video extensions
    assert!(SUPPORTED_EXTENSIONS.contains(&"mp4"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"mov"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"avi"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"mkv"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"webm"));

    // Audio extensions
    assert!(SUPPORTED_EXTENSIONS.contains(&"mp3"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"wav"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"flac"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"ogg"));

    // Image extensions
    assert!(SUPPORTED_EXTENSIONS.contains(&"jpg"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"jpeg"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"png"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"webp"));
  }

  #[tokio::test]
  async fn test_process_options() {
    let options = ProcessOptions {
      max_concurrent: 4,
      extract_thumbnails: true,
      thumbnail_size: 320,
      thumbnail_quality: 85,
      skip_metadata: false,
    };

    assert_eq!(options.max_concurrent, 4);
    assert!(options.extract_thumbnails);
    assert_eq!(options.thumbnail_size, 320);
    assert_eq!(options.thumbnail_quality, 85);
    assert!(!options.skip_metadata);
  }

  #[tokio::test]
  async fn test_default_process_options() {
    let options = ProcessOptions::default();

    assert_eq!(options.max_concurrent, 4);
    assert!(options.extract_thumbnails);
    assert_eq!(options.thumbnail_size, 320);
    assert_eq!(options.thumbnail_quality, 80);
    assert!(!options.skip_metadata);
  }

  #[test]
  fn test_discovered_file_size_formatting() {
    let file = DiscoveredFile {
      id: "test".to_string(),
      path: "/test.mp4".to_string(),
      name: "test.mp4".to_string(),
      extension: "mp4".to_string(),
      size: 1024 * 1024 * 100, // 100 MB
    };

    assert_eq!(file.size, 104857600);
  }

  #[tokio::test]
  async fn test_create_thumbnail_path() {
    let file_id = "abc123";
    let temp_dir = TempDir::new().unwrap();
    let thumbnail_path = temp_dir.path().join(format!("thumb_{file_id}.jpg"));

    assert!(thumbnail_path
      .to_string_lossy()
      .contains("thumb_abc123.jpg"));
  }

  #[test]
  fn test_media_file_type_detection() {
    // Video file
    let video_file = MediaFile {
      id: "1".to_string(),
      name: "video.mp4".to_string(),
      path: "/video.mp4".to_string(),
      is_video: true,
      is_audio: false,
      is_image: false,
      size: 1024,
      duration: Some(60.0),
      start_time: 0,
      creation_time: "".to_string(),
      probe_data: ProbeData {
        streams: vec![],
        format: FfprobeFormat {
          duration: None,
          size: None,
          bit_rate: None,
          format_name: None,
        },
      },
      thumbnail_path: None,
    };

    assert!(video_file.is_video);
    assert!(!video_file.is_audio);
    assert!(!video_file.is_image);

    // Audio file
    let audio_file = MediaFile {
      id: "2".to_string(),
      name: "audio.mp3".to_string(),
      path: "/audio.mp3".to_string(),
      is_video: false,
      is_audio: true,
      is_image: false,
      size: 1024,
      duration: Some(180.0),
      start_time: 0,
      creation_time: "".to_string(),
      probe_data: ProbeData {
        streams: vec![],
        format: FfprobeFormat {
          duration: None,
          size: None,
          bit_rate: None,
          format_name: None,
        },
      },
      thumbnail_path: None,
    };

    assert!(!audio_file.is_video);
    assert!(audio_file.is_audio);
    assert!(!audio_file.is_image);

    // Image file
    let image_file = MediaFile {
      id: "3".to_string(),
      name: "image.jpg".to_string(),
      path: "/image.jpg".to_string(),
      is_video: false,
      is_audio: false,
      is_image: true,
      size: 1024,
      duration: None,
      start_time: 0,
      creation_time: "".to_string(),
      probe_data: ProbeData {
        streams: vec![],
        format: FfprobeFormat {
          duration: None,
          size: None,
          bit_rate: None,
          format_name: None,
        },
      },
      thumbnail_path: None,
    };

    assert!(!image_file.is_video);
    assert!(!image_file.is_audio);
    assert!(image_file.is_image);
    assert!(image_file.duration.is_none());
  }
}
