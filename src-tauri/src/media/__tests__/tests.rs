#[cfg(test)]
mod media_tests {
  use crate::media::commands::{get_media_files, get_media_metadata};
  use crate::media::types::{MediaFile, ProbeData};
  use tempfile::TempDir;

  #[test]
  fn test_get_media_metadata_mp4() {
    // This test requires FFprobe to be installed
    if std::process::Command::new("ffprobe")
      .arg("-version")
      .output()
      .is_err()
    {
      eprintln!("Skipping test: ffprobe not found");
      return;
    }

    // Create a mock video file path
    let result = get_media_metadata("/nonexistent/video.mp4".to_string());

    // Should handle non-existent file gracefully
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Файл не найден"));
  }

  #[test]
  fn test_get_media_files_empty_directory() {
    let temp_dir = TempDir::new().unwrap();
    let result = get_media_files(temp_dir.path().to_str().unwrap().to_string());

    assert!(result.is_ok());
    let files = result.unwrap();
    assert_eq!(files.len(), 0);
  }

  #[test]
  fn test_get_media_files_with_video_files() {
    let temp_dir = TempDir::new().unwrap();

    // Create some test files
    let video_extensions = vec!["mp4", "avi", "mkv", "mov"];
    for ext in &video_extensions {
      let file_path = temp_dir.path().join(format!("test.{ext}"));
      std::fs::write(&file_path, b"dummy content").unwrap();
    }

    // Create a non-video file that should be ignored
    let txt_file = temp_dir.path().join("readme.txt");
    std::fs::write(&txt_file, b"text content").unwrap();

    let result = get_media_files(temp_dir.path().to_str().unwrap().to_string());

    assert!(result.is_ok());
    let files = result.unwrap();
    assert_eq!(files.len(), video_extensions.len());

    // Check that all files have video extensions
    for file in &files {
      let has_video_ext = video_extensions.iter().any(|ext| file.ends_with(ext));
      assert!(has_video_ext);
    }
  }

  #[test]
  fn test_get_media_files_nonexistent_directory() {
    let result = get_media_files("/nonexistent/directory".to_string());

    // Should return error
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Директория не найдена"));
  }

  #[test]
  fn test_media_file_structure() {
    use crate::media::types::{FfprobeFormat, FfprobeStream};

    // Test the MediaFile structure serialization
    let media_file = MediaFile {
      id: "test-id".to_string(),
      path: "/test/video.mp4".to_string(),
      name: "video.mp4".to_string(),
      size: 1024,
      duration: Some(60.0),
      is_video: true,
      is_audio: false,
      is_image: false,
      start_time: 0,
      creation_time: "2023-01-01T00:00:00Z".to_string(),
      probe_data: ProbeData {
        streams: vec![FfprobeStream {
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
        }],
        format: FfprobeFormat {
          duration: Some(60.0),
          size: Some(1024),
          bit_rate: Some("5000000".to_string()),
          format_name: Some("mov,mp4,m4a,3gp,3g2,mj2".to_string()),
        },
      },
      thumbnail_path: None,
    };

    let json = serde_json::to_string(&media_file).unwrap();
    assert!(json.contains("\"path\""));
    assert!(json.contains("\"probe_data\""));
    assert!(json.contains("\"is_video\":true"));
  }

  #[test]
  fn test_supported_extensions() {
    use crate::media::types::SUPPORTED_EXTENSIONS;

    // Test that common video extensions are supported
    assert!(SUPPORTED_EXTENSIONS.contains(&"mp4"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"avi"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"mkv"));
    assert!(SUPPORTED_EXTENSIONS.contains(&"mov"));

    // Test that non-video extensions are not supported
    assert!(!SUPPORTED_EXTENSIONS.contains(&"txt"));
    assert!(!SUPPORTED_EXTENSIONS.contains(&"doc"));
  }
}
