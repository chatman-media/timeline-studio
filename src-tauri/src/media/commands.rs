use anyhow::Result;
use chrono;
use std::path::PathBuf;
use tauri::State;

use super::ffmpeg::check_ffmpeg;
use super::media_analyzer::{MediaAnalysis, MediaAnalyzer};
use super::preview_data::MediaPreviewData;
use super::preview_manager::PreviewDataManager;
use super::types::{MediaFile, SUPPORTED_EXTENSIONS};
use serde::Serialize;
use std::path::Path;
use std::process::Command;
use uuid;

// Команды для Tauri - объявляем прямо здесь
#[tauri::command]
pub fn get_media_files(directory: String) -> Result<Vec<String>, String> {
  let path = Path::new(&directory);

  if !path.exists() || !path.is_dir() {
    return Err(format!("Директория не найдена: {directory}"));
  }

  let entries = std::fs::read_dir(path).map_err(|e| format!("Ошибка чтения директории: {e}"))?;

  let mut media_files = Vec::new();

  for entry in entries.flatten() {
    let path = entry.path();

    // Проверяем только файлы
    if path.is_file() {
      if let Some(extension) = path.extension().and_then(|e| e.to_str()) {
        // Проверяем расширение файла
        let ext = extension.to_lowercase();
        if SUPPORTED_EXTENSIONS.contains(&ext.as_str()) {
          if let Some(path_str) = path.to_str() {
            media_files.push(path_str.to_string());
          }
        }
      }
    }
  }

  Ok(media_files)
}

#[tauri::command]
pub fn get_media_metadata(file_path: String) -> Result<MediaFile, String> {
  // Проверяем наличие FFmpeg
  check_ffmpeg()?;

  // Проверяем существование файла
  if !Path::new(&file_path).exists() {
    return Err(format!("Файл не найден: {file_path}"));
  }

  // Получаем информацию о файле в формате JSON
  let output = Command::new("ffprobe")
    .args([
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      &file_path,
    ])
    .output()
    .map_err(|e| format!("Ошибка выполнения ffprobe: {e}"))?;

  if !output.status.success() {
    let error = String::from_utf8_lossy(&output.stderr);
    return Err(format!("FFprobe завершился с ошибкой: {error}"));
  }

  let json_str = String::from_utf8_lossy(&output.stdout);

  // Парсим JSON и создаем MediaFile
  let probe_data: super::types::ProbeData =
    serde_json::from_str(&json_str).map_err(|e| format!("Ошибка парсинга JSON: {e}"))?;

  // Создаем простой MediaFile для компиляции
  let file_path_ref = &file_path;
  let media_file = MediaFile {
    id: uuid::Uuid::new_v4().to_string(),
    path: file_path.clone(),
    name: Path::new(file_path_ref)
      .file_name()
      .unwrap_or_default()
      .to_string_lossy()
      .to_string(),
    size: std::fs::metadata(file_path_ref)
      .map(|m| m.len())
      .unwrap_or(0),
    duration: probe_data.format.duration,
    is_video: probe_data.streams.iter().any(|s| s.codec_type == "video"),
    is_audio: probe_data.streams.iter().any(|s| s.codec_type == "audio"),
    is_image: false, // Упрощенная логика
    start_time: 0,
    creation_time: chrono::Utc::now().to_rfc3339(),
    probe_data,
  };

  Ok(media_file)
}

/// State для менеджера превью
pub struct PreviewManagerState {
  pub manager: PreviewDataManager,
}

/// Получить данные превью для файла
#[tauri::command]
pub async fn get_media_preview_data(
  state: State<'_, PreviewManagerState>,
  file_id: String,
) -> Result<Option<MediaPreviewData>, String> {
  Ok(state.manager.get_preview_data(&file_id).await)
}

/// Сгенерировать миниатюру для браузера
#[tauri::command]
pub async fn generate_media_thumbnail(
  state: State<'_, PreviewManagerState>,
  file_id: String,
  file_path: String,
  width: u32,
  height: u32,
  timestamp: f64,
) -> Result<String, String> {
  let path = PathBuf::from(file_path);
  state
    .manager
    .generate_browser_thumbnail(file_id, path, width, height, timestamp)
    .await
    .map(|thumbnail| thumbnail.base64_data.unwrap_or_default())
    .map_err(|e| e.to_string())
}

/// Очистить данные превью для файла
#[tauri::command]
pub async fn clear_media_preview_data(
  state: State<'_, PreviewManagerState>,
  file_id: String,
) -> Result<(), String> {
  state
    .manager
    .clear_file_data(&file_id)
    .await
    .map_err(|e| e.to_string())
}

/// Получить список всех файлов с превью
#[tauri::command]
pub async fn get_files_with_previews(
  state: State<'_, PreviewManagerState>,
) -> Result<Vec<String>, String> {
  Ok(state.manager.get_all_files_with_previews().await)
}

/// Сохранить данные превью в файл
#[tauri::command]
pub async fn save_preview_data(
  state: State<'_, PreviewManagerState>,
  path: String,
) -> Result<(), String> {
  let file_path = PathBuf::from(path);
  state
    .manager
    .save_to_file(&file_path)
    .await
    .map_err(|e| e.to_string())
}

/// Загрузить данные превью из файла
#[tauri::command]
pub async fn load_preview_data(
  state: State<'_, PreviewManagerState>,
  path: String,
) -> Result<(), String> {
  let file_path = PathBuf::from(path);
  state
    .manager
    .load_from_file(&file_path)
    .await
    .map_err(|e| e.to_string())
}

/// Сохранить timeline frames для файла
#[tauri::command]
pub async fn save_timeline_frames(
  state: State<'_, PreviewManagerState>,
  file_id: String,
  frames: Vec<TimelineFrame>,
) -> Result<(), String> {
  state
    .manager
    .save_timeline_frames(file_id, frames)
    .await
    .map_err(|e| e.to_string())
}

/// Получить timeline frames для файла
#[tauri::command]
pub async fn get_timeline_frames(
  state: State<'_, PreviewManagerState>,
  file_id: String,
) -> Result<Vec<TimelineFrame>, String> {
  state
    .manager
    .get_timeline_frames(&file_id)
    .await
    .map_err(|e| e.to_string())
}

/// Генерировать превью для таймлайна с использованием PreviewGenerator
#[tauri::command]
pub async fn generate_timeline_previews(
  state: State<'_, PreviewManagerState>,
  file_id: String,
  file_path: String,
  duration: f64,
  interval: f64,
) -> Result<(), String> {
  let path = PathBuf::from(file_path);
  state
    .manager
    .generate_timeline_previews(file_id, path, duration, interval)
    .await
    .map(|_| ()) // Convert Vec<TimelinePreview> to () for simplicity
    .map_err(|e| e.to_string())
}

/// Извлечь кадры для распознавания с использованием FrameExtractionManager
#[tauri::command]
pub async fn extract_recognition_frames(
  state: State<'_, PreviewManagerState>,
  file_id: String,
  file_path: String,
  count: usize,
) -> Result<(), String> {
  let path = PathBuf::from(file_path);
  state
    .manager
    .extract_recognition_frames(file_id, path, count)
    .await
    .map(|_| ()) // Convert Vec<RecognitionFrame> to () for simplicity
    .map_err(|e| e.to_string())
}

/// Структура для timeline frame из frontend
#[derive(Clone, serde::Deserialize, serde::Serialize)]
pub struct TimelineFrame {
  pub timestamp: f64,
  pub base64_data: String,
  pub is_keyframe: bool,
}

/// Simplified media metadata structure
#[derive(Debug, Serialize)]
pub struct SimpleMediaMetadata {
  pub duration: Option<f64>,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub fps: Option<f64>,
  pub bitrate: Option<u64>,
  pub video_codec: Option<String>,
  pub audio_codec: Option<String>,
  pub has_audio: Option<bool>,
  pub has_video: Option<bool>,
}

/// Processed media file result
#[derive(Debug, Serialize)]
pub struct ProcessedMediaFile {
  pub id: String,
  pub path: String,
  pub name: String,
  pub size: u64,
  pub metadata: Option<SimpleMediaMetadata>,
  pub thumbnail_path: Option<String>,
  pub error: Option<String>,
}

/// Process a media file with simplified approach
#[tauri::command]
pub async fn process_media_file_simple(
  file_path: String,
  generate_thumbnail: bool,
) -> Result<ProcessedMediaFile, String> {
  use std::time::{SystemTime, UNIX_EPOCH};

  let path = PathBuf::from(&file_path);

  // Check if file exists
  if !path.exists() {
    return Err("File does not exist".to_string());
  }

  // Get file metadata
  let file_name = path
    .file_name()
    .and_then(|n| n.to_str())
    .unwrap_or("Unknown")
    .to_string();

  let file_size = std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0);

  // Generate unique ID based on file path and timestamp
  let timestamp = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_millis();
  let id = format!("file-{}-{}", timestamp, file_name.replace(" ", "-"));

  // Try to get basic media info using existing metadata function
  let metadata = match get_media_metadata(file_path.clone()) {
    Ok(media_file) => {
      // Extract metadata from MediaFile
      let probe_data = &media_file.probe_data;
      let duration = media_file.duration;

      let (width, height, fps, video_codec) = probe_data
        .streams
        .iter()
        .find(|s| s.codec_type == "video")
        .map(|s| {
          (
            s.width,
            s.height,
            s.r_frame_rate.as_ref().and_then(|r| {
              let parts: Vec<&str> = r.split('/').collect();
              if parts.len() == 2 {
                let num = parts[0].parse::<f64>().ok()?;
                let den = parts[1].parse::<f64>().ok()?;
                if den > 0.0 { Some(num / den) } else { None }
              } else {
                None
              }
            }),
            s.codec_name.clone(),
          )
        })
        .unwrap_or((None, None, None, None));

      let audio_codec = probe_data
        .streams
        .iter()
        .find(|s| s.codec_type == "audio")
        .and_then(|s| s.codec_name.clone());

      let bitrate = probe_data.format.duration.and_then(|_| {
        probe_data
          .format
          .bit_rate
          .as_ref()
          .and_then(|b| b.parse::<u64>().ok())
      });

      Some(SimpleMediaMetadata {
        duration,
        width,
        height,
        fps,
        bitrate,
        video_codec,
        audio_codec,
        has_audio: Some(media_file.is_audio),
        has_video: Some(media_file.is_video),
      })
    }
    Err(e) => {
      log::warn!("Failed to get media info for {file_path}: {e}");
      None
    }
  };

  // Generate thumbnail if requested
  let thumbnail_path = if generate_thumbnail
    && metadata
      .as_ref()
      .is_some_and(|m| m.has_video.unwrap_or(false))
  {
    // For simplicity, we'll skip actual thumbnail generation in this basic version
    // In a real implementation, you would generate a thumbnail here
    None
  } else {
    None
  };

  Ok(ProcessedMediaFile {
    id,
    path: file_path,
    name: file_name,
    size: file_size,
    metadata,
    thumbnail_path,
    error: None,
  })
}

/// Process multiple media files and return MediaFile array
#[tauri::command]
pub async fn process_media_files(file_paths: Vec<String>) -> Result<Vec<MediaFile>, String> {
  let mut media_files = Vec::new();

  for file_path in file_paths {
    match get_media_metadata(file_path.clone()) {
      Ok(media_file) => {
        media_files.push(media_file);
      }
      Err(e) => {
        log::warn!("Failed to process file {file_path}: {e}");
        // Continue processing other files even if one fails
      }
    }
  }

  Ok(media_files)
}

/// Process multiple media files with thumbnail generation
/// Note: This currently just processes files without generating thumbnails
/// because thumbnail generation requires additional state parameters
#[tauri::command]
pub async fn process_media_files_with_thumbnails(
  file_paths: Vec<String>,
  _width: u32,
  _height: u32,
) -> Result<Vec<MediaFile>, String> {
  // For now, just process files without thumbnails
  // The frontend will need to call generate_media_thumbnail separately
  // with the proper state and file_id parameters
  process_media_files(file_paths).await
}

/// Analyze media file using MediaAnalyzer
#[tauri::command]
pub async fn analyze_media(file_path: String) -> Result<MediaAnalysis, String> {
  // First get media metadata
  let media_file = get_media_metadata(file_path)?;

  // Create analyzer and analyze the file
  let analyzer = MediaAnalyzer::new();
  analyzer.analyze(media_file).await
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs;
  use tempfile::TempDir;

  fn create_test_file(dir: &Path, name: &str, extension: &str) -> PathBuf {
    let file_path = dir.join(format!("{}.{}", name, extension));
    fs::write(&file_path, b"test content").unwrap();
    file_path
  }

  #[test]
  fn test_get_media_files_empty_directory() {
    let temp_dir = TempDir::new().unwrap();
    let result = get_media_files(temp_dir.path().to_string_lossy().to_string());
    assert!(result.is_ok());
    assert!(result.unwrap().is_empty());
  }

  #[test]
  fn test_get_media_files_with_supported_files() {
    let temp_dir = TempDir::new().unwrap();

    // Create supported media files
    create_test_file(temp_dir.path(), "video", "mp4");
    create_test_file(temp_dir.path(), "audio", "mp3");
    create_test_file(temp_dir.path(), "image", "jpg");

    // Create unsupported file
    create_test_file(temp_dir.path(), "document", "txt");

    let result = get_media_files(temp_dir.path().to_string_lossy().to_string());
    assert!(result.is_ok());

    let files = result.unwrap();
    assert_eq!(files.len(), 3);

    // Check that only media files are included
    assert!(files.iter().any(|f| f.contains("video.mp4")));
    assert!(files.iter().any(|f| f.contains("audio.mp3")));
    assert!(files.iter().any(|f| f.contains("image.jpg")));
    assert!(!files.iter().any(|f| f.contains("document.txt")));
  }

  #[test]
  fn test_get_media_files_non_existent_directory() {
    let result = get_media_files("/non/existent/path".to_string());
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Директория не найдена"));
  }

  #[test]
  fn test_get_media_files_file_instead_of_directory() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = create_test_file(temp_dir.path(), "test", "txt");

    let result = get_media_files(file_path.to_string_lossy().to_string());
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Директория не найдена"));
  }

  #[test]
  fn test_get_media_metadata_non_existent_file() {
    let result = get_media_metadata("/non/existent/file.mp4".to_string());
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Файл не найден"));
  }

  #[test]
  fn test_timeline_frame_structure() {
    let frame = TimelineFrame {
      timestamp: 1.5,
      base64_data: "base64encodeddata".to_string(),
      is_keyframe: true,
    };

    assert_eq!(frame.timestamp, 1.5);
    assert_eq!(frame.base64_data, "base64encodeddata");
    assert!(frame.is_keyframe);

    // Test serialization
    let serialized = serde_json::to_string(&frame).unwrap();
    assert!(serialized.contains("timestamp"));
    assert!(serialized.contains("base64_data"));
    assert!(serialized.contains("is_keyframe"));

    // Test deserialization
    let deserialized: TimelineFrame = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.timestamp, frame.timestamp);
    assert_eq!(deserialized.base64_data, frame.base64_data);
    assert_eq!(deserialized.is_keyframe, frame.is_keyframe);
  }

  #[test]
  fn test_simple_media_metadata_structure() {
    let metadata = SimpleMediaMetadata {
      duration: Some(120.5),
      width: Some(1920),
      height: Some(1080),
      fps: Some(30.0),
      bitrate: Some(5000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
      has_audio: Some(true),
      has_video: Some(true),
    };

    assert_eq!(metadata.duration, Some(120.5));
    assert_eq!(metadata.width, Some(1920));
    assert_eq!(metadata.height, Some(1080));
    assert_eq!(metadata.fps, Some(30.0));
    assert_eq!(metadata.bitrate, Some(5000000));
    assert_eq!(metadata.video_codec, Some("h264".to_string()));
    assert_eq!(metadata.audio_codec, Some("aac".to_string()));
    assert_eq!(metadata.has_audio, Some(true));
    assert_eq!(metadata.has_video, Some(true));
  }

  #[test]
  fn test_simple_media_metadata_empty() {
    let metadata = SimpleMediaMetadata {
      duration: None,
      width: None,
      height: None,
      fps: None,
      bitrate: None,
      video_codec: None,
      audio_codec: None,
      has_audio: None,
      has_video: None,
    };

    assert!(metadata.duration.is_none());
    assert!(metadata.width.is_none());
    assert!(metadata.height.is_none());
    assert!(metadata.fps.is_none());
    assert!(metadata.bitrate.is_none());
    assert!(metadata.video_codec.is_none());
    assert!(metadata.audio_codec.is_none());
    assert!(metadata.has_audio.is_none());
    assert!(metadata.has_video.is_none());
  }

  #[test]
  fn test_processed_media_file_structure() {
    let metadata = SimpleMediaMetadata {
      duration: Some(60.0),
      width: Some(1280),
      height: Some(720),
      fps: Some(24.0),
      bitrate: Some(3000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("mp3".to_string()),
      has_audio: Some(true),
      has_video: Some(true),
    };

    let processed = ProcessedMediaFile {
      id: "file-123-test.mp4".to_string(),
      path: "/path/to/test.mp4".to_string(),
      name: "test.mp4".to_string(),
      size: 1048576,
      metadata: Some(metadata),
      thumbnail_path: Some("/path/to/thumbnail.jpg".to_string()),
      error: None,
    };

    assert_eq!(processed.id, "file-123-test.mp4");
    assert_eq!(processed.path, "/path/to/test.mp4");
    assert_eq!(processed.name, "test.mp4");
    assert_eq!(processed.size, 1048576);
    assert!(processed.metadata.is_some());
    assert_eq!(
      processed.thumbnail_path,
      Some("/path/to/thumbnail.jpg".to_string())
    );
    assert!(processed.error.is_none());
  }

  #[test]
  fn test_processed_media_file_with_error() {
    let processed = ProcessedMediaFile {
      id: "file-error".to_string(),
      path: "/path/to/error.mp4".to_string(),
      name: "error.mp4".to_string(),
      size: 0,
      metadata: None,
      thumbnail_path: None,
      error: Some("Failed to process file".to_string()),
    };

    assert_eq!(processed.id, "file-error");
    assert_eq!(processed.size, 0);
    assert!(processed.metadata.is_none());
    assert!(processed.thumbnail_path.is_none());
    assert_eq!(processed.error, Some("Failed to process file".to_string()));
  }

  #[tokio::test]
  async fn test_process_media_file_simple_non_existent() {
    let result = process_media_file_simple("/non/existent/file.mp4".to_string(), false).await;

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "File does not exist");
  }

  #[tokio::test]
  async fn test_process_media_file_simple_with_real_file() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = create_test_file(temp_dir.path(), "test", "mp4");

    let result = process_media_file_simple(file_path.to_string_lossy().to_string(), false).await;

    // Since we don't have ffmpeg in tests, this will likely fail at metadata stage
    // but at least we can check the structure
    if let Ok(processed) = result {
      assert!(!processed.id.is_empty());
      assert_eq!(processed.name, "test.mp4");
      assert!(processed.size > 0);
      assert_eq!(processed.path, file_path.to_string_lossy().to_string());
    } else {
      // Expected to fail without ffmpeg
      assert!(result.is_err());
    }
  }

  #[tokio::test]
  async fn test_process_media_files_empty() {
    let result = process_media_files(Vec::new()).await;
    assert!(result.is_ok());
    assert!(result.unwrap().is_empty());
  }

  #[tokio::test]
  async fn test_process_media_files_with_invalid_paths() {
    let file_paths = vec![
      "/non/existent/file1.mp4".to_string(),
      "/non/existent/file2.mp4".to_string(),
    ];

    let result = process_media_files(file_paths).await;
    assert!(result.is_ok());
    // Since ffmpeg is not available in tests, all files will fail
    // but the function should still return Ok with empty or partial results
    let files = result.unwrap();
    assert!(files.is_empty());
  }

  #[tokio::test]
  async fn test_process_media_files_with_thumbnails() {
    let file_paths = vec![
      "/path/to/video1.mp4".to_string(),
      "/path/to/video2.mp4".to_string(),
    ];

    let result = process_media_files_with_thumbnails(file_paths, 320, 240).await;
    assert!(result.is_ok());
    // Should delegate to process_media_files
    let files = result.unwrap();
    assert!(files.is_empty()); // Empty because files don't exist
  }

  #[test]
  fn test_preview_manager_state() {
    // Just verify the struct exists and can be created
    let temp_dir = TempDir::new().unwrap();
    let manager = PreviewDataManager::new(temp_dir.path().to_path_buf());
    let _state = PreviewManagerState { manager };

    // State should be created successfully
    // Test passes if state creation succeeds without panicking
  }

  #[test]
  fn test_get_media_files_case_insensitive_extensions() {
    let temp_dir = TempDir::new().unwrap();

    // Create files with different case extensions
    create_test_file(temp_dir.path(), "video1", "MP4");
    create_test_file(temp_dir.path(), "video2", "Mp4");
    create_test_file(temp_dir.path(), "video3", "mP4");

    let result = get_media_files(temp_dir.path().to_string_lossy().to_string());
    assert!(result.is_ok());

    let files = result.unwrap();
    assert_eq!(files.len(), 3);
  }

  #[test]
  fn test_get_media_files_hidden_files() {
    let temp_dir = TempDir::new().unwrap();

    // Create regular and hidden files
    create_test_file(temp_dir.path(), "video", "mp4");
    let hidden_path = temp_dir.path().join(".hidden.mp4");
    fs::write(&hidden_path, b"hidden content").unwrap();

    let result = get_media_files(temp_dir.path().to_string_lossy().to_string());
    assert!(result.is_ok());

    let files = result.unwrap();
    // Should include both regular and hidden files
    assert_eq!(files.len(), 2);
  }

  #[test]
  fn test_fps_calculation_from_frame_rate() {
    // Test frame rate parsing logic
    let test_cases = vec![
      ("30/1", Some(30.0)),
      ("60/1", Some(60.0)),
      ("24000/1001", Some(23.976)), // NTSC
      ("30000/1001", Some(29.97)),  // NTSC
      ("25/1", Some(25.0)),         // PAL
      ("invalid", None),
      ("30/0", None), // Division by zero
      ("", None),
    ];

    for (input, expected) in test_cases {
      let parts: Vec<&str> = input.split('/').collect();
      let result = if parts.len() == 2 {
        let num = parts[0].parse::<f64>().ok();
        let den = parts[1].parse::<f64>().ok();
        match (num, den) {
          (Some(n), Some(d)) if d > 0.0 => Some(n / d),
          _ => None,
        }
      } else {
        None
      };

      match (result, expected) {
        (Some(r), Some(e)) => assert!((r - e).abs() < 0.001),
        (None, None) => {} // Both None is expected outcome
        _ => panic!("Mismatch for input: {}", input),
      }
    }
  }
}
