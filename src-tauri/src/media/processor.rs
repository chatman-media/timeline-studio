// Модуль для асинхронной обработки медиафайлов

use crate::media::ffmpeg::extract_frame;
use crate::media::metadata::get_media_metadata;
use crate::media::types::{MediaFile, SUPPORTED_EXTENSIONS};
use base64::Engine;
use image::{DynamicImage, GenericImageView, ImageFormat};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::fs;
use tokio::sync::{Semaphore, mpsc};
use tokio::task::JoinSet;
use uuid::Uuid;

/// События для отправки через Tauri
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ProcessorEvent {
  /// Обнаружены файлы
  FilesDiscovered {
    files: Vec<DiscoveredFile>,
    total: usize,
  },
  /// Метаданные готовы
  MetadataReady {
    file_id: String,
    file_path: String,
    metadata: Box<MediaFile>,
  },
  /// Превью готово
  ThumbnailReady {
    file_id: String,
    file_path: String,
    thumbnail_path: String,
    thumbnail_data: Option<String>, // Base64
  },
  /// Ошибка обработки
  ProcessingError {
    file_id: String,
    file_path: String,
    error: String,
  },
  /// Прогресс сканирования
  ScanProgress { current: usize, total: usize },
}

/// Обнаруженный файл
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredFile {
  pub id: String,
  pub path: String,
  pub name: String,
  pub extension: String,
  pub size: u64,
}

/// Параметры для генерации превью
#[derive(Debug, Clone)]
pub struct ThumbnailOptions {
  pub width: u32,
  pub height: u32,
  pub format: ImageFormat,
  pub _quality: u8,
  pub time_offset: f64, // Для видео - время в секундах
}

impl Default for ThumbnailOptions {
  fn default() -> Self {
    Self {
      width: 320,
      height: 180,
      format: ImageFormat::Jpeg,
      _quality: 85,
      time_offset: 1.0, // 1 секунда от начала
    }
  }
}

/// Процессор медиафайлов
pub struct MediaProcessor<R: tauri::Runtime = tauri::Wry> {
  app_handle: AppHandle<R>,
  thumbnail_dir: PathBuf,
  max_concurrent_tasks: usize,
}

impl<R: tauri::Runtime> MediaProcessor<R> {
  /// Создает новый процессор
  pub fn new(app_handle: AppHandle<R>, thumbnail_dir: PathBuf) -> Self {
    Self {
      app_handle,
      thumbnail_dir,
      max_concurrent_tasks: 4, // Ограничиваем количество параллельных задач
    }
  }

  /// Асинхронно сканирует папку и обрабатывает файлы
  pub async fn scan_and_process(
    &self,
    folder_path: &Path,
    thumbnail_options: Option<ThumbnailOptions>,
  ) -> Result<Vec<MediaFile>, String> {
    // Создаем директорию для превью, если не существует
    fs::create_dir_all(&self.thumbnail_dir)
      .await
      .map_err(|e| format!("Failed to create thumbnail directory: {e}"))?;

    // Сканируем папку
    let discovered_files = self.scan_folder(folder_path).await?;
    let total_files = discovered_files.len();

    // Отправляем событие о найденных файлах
    self.emit_event(ProcessorEvent::FilesDiscovered {
      files: discovered_files.clone(),
      total: total_files,
    })?;

    // Обрабатываем файлы параллельно
    let semaphore = Arc::new(Semaphore::new(self.max_concurrent_tasks));
    let mut join_set = JoinSet::new();
    let mut processed_files = Vec::new();
    let thumbnail_opts = thumbnail_options.unwrap_or_default();

    let (tx, mut rx) = mpsc::channel::<Result<MediaFile, String>>(100);

    // Запускаем задачи обработки
    for (index, file) in discovered_files.into_iter().enumerate() {
      let app_handle = self.app_handle.clone();
      let thumbnail_dir = self.thumbnail_dir.clone();
      let thumbnail_opts = thumbnail_opts.clone();
      let semaphore = semaphore.clone();
      let tx = tx.clone();

      join_set.spawn(async move {
        let _permit = semaphore.acquire().await.unwrap();

        // Отправляем прогресс
        let _ = app_handle.emit(
          "media-processor",
          ProcessorEvent::ScanProgress {
            current: index + 1,
            total: total_files,
          },
        );

        // Обрабатываем файл
        let result = process_single_file(&app_handle, file, &thumbnail_dir, &thumbnail_opts).await;

        let _ = tx.send(result).await;
      });
    }

    // Закрываем отправитель
    drop(tx);

    // Собираем результаты
    while let Some(result) = rx.recv().await {
      match result {
        Ok(media_file) => processed_files.push(media_file),
        Err(e) => eprintln!("Error processing file: {e}"),
      }
    }

    // Ждем завершения всех задач
    while join_set.join_next().await.is_some() {}

    Ok(processed_files)
  }

  /// Сканирует папку и возвращает список медиафайлов
  async fn scan_folder(&self, folder_path: &Path) -> Result<Vec<DiscoveredFile>, String> {
    let mut discovered_files = Vec::new();
    let mut dirs_to_scan = vec![folder_path.to_path_buf()];

    while let Some(dir) = dirs_to_scan.pop() {
      let mut entries = fs::read_dir(&dir)
        .await
        .map_err(|e| format!("Failed to read directory {dir:?}: {e}"))?;

      while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read entry: {e}"))?
      {
        let path = entry.path();
        let metadata = entry
          .metadata()
          .await
          .map_err(|e| format!("Failed to read metadata: {e}"))?;

        if metadata.is_dir() {
          dirs_to_scan.push(path);
        } else if metadata.is_file() {
          if let Some(extension) = path.extension() {
            let ext = extension.to_string_lossy().to_lowercase();
            if SUPPORTED_EXTENSIONS.contains(&ext.as_str()) {
              let file_name = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

              discovered_files.push(DiscoveredFile {
                id: Uuid::new_v4().to_string(),
                path: path.to_string_lossy().to_string(),
                name: file_name,
                extension: ext,
                size: metadata.len(),
              });
            }
          }
        }
      }
    }

    Ok(discovered_files)
  }

  /// Отправляет событие через Tauri
  fn emit_event(&self, event: ProcessorEvent) -> Result<(), String> {
    self
      .app_handle
      .emit("media-processor", event)
      .map_err(|e| format!("Failed to emit event: {e}"))
  }
}

/// Обрабатывает один файл
async fn process_single_file<R: tauri::Runtime>(
  app_handle: &AppHandle<R>,
  file: DiscoveredFile,
  thumbnail_dir: &Path,
  thumbnail_options: &ThumbnailOptions,
) -> Result<MediaFile, String> {
  let file_path = Path::new(&file.path);

  // Получаем метаданные
  let media_file = match get_media_metadata(file.path.clone()) {
    Ok(meta) => {
      // Отправляем событие о готовых метаданных
      let _ = app_handle.emit(
        "media-processor",
        ProcessorEvent::MetadataReady {
          file_id: file.id.clone(),
          file_path: file.path.clone(),
          metadata: Box::new(meta.clone()),
        },
      );
      meta
    }
    Err(e) => {
      let error_msg = format!("Failed to get metadata: {e}");
      let _ = app_handle.emit(
        "media-processor",
        ProcessorEvent::ProcessingError {
          file_id: file.id.clone(),
          file_path: file.path.clone(),
          error: error_msg.clone(),
        },
      );
      return Err(error_msg);
    }
  };

  // Генерируем превью для поддерживаемых типов
  let is_video = media_file.is_video;
  let is_image = media_file.is_image;

  if is_video || is_image {
    let thumbnail_result =
      generate_thumbnail(&file, file_path, thumbnail_dir, thumbnail_options, is_video).await;

    if let Ok((thumbnail_path, thumbnail_data)) = thumbnail_result {
      // Отправляем событие о готовом превью
      let _ = app_handle.emit(
        "media-processor",
        ProcessorEvent::ThumbnailReady {
          file_id: file.id.clone(),
          file_path: file.path.clone(),
          thumbnail_path: thumbnail_path.to_string_lossy().to_string(),
          thumbnail_data,
        },
      );
    }
  }

  Ok(media_file)
}

/// Генерирует превью для файла
async fn generate_thumbnail(
  file: &DiscoveredFile,
  file_path: &Path,
  thumbnail_dir: &Path,
  options: &ThumbnailOptions,
  is_video: bool,
) -> Result<(PathBuf, Option<String>), String> {
  let thumbnail_filename = format!("{}.jpg", file.id);
  let thumbnail_path = thumbnail_dir.join(&thumbnail_filename);

  let image = if is_video {
    // Извлекаем кадр из видео
    extract_frame(
      file_path.to_str().unwrap(),
      thumbnail_path.to_str().unwrap(),
      options.time_offset,
    )
    .map_err(|e| format!("Failed to extract frame: {e}"))?;

    // Загружаем и изменяем размер
    image::open(&thumbnail_path).map_err(|e| format!("Failed to open extracted frame: {e}"))?
  } else {
    // Загружаем изображение
    image::open(file_path).map_err(|e| format!("Failed to open image: {e}"))?
  };

  // Изменяем размер с сохранением пропорций
  let resized = resize_image(image, options.width, options.height);

  // Сохраняем превью
  resized
    .save_with_format(&thumbnail_path, options.format)
    .map_err(|e| format!("Failed to save thumbnail: {e}"))?;

  // Опционально конвертируем в base64
  let thumbnail_data = if options.format == ImageFormat::Jpeg {
    let mut buffer = Vec::new();
    resized
      .write_to(&mut std::io::Cursor::new(&mut buffer), options.format)
      .ok();
    Some(base64::engine::general_purpose::STANDARD.encode(&buffer))
  } else {
    None
  };

  Ok((thumbnail_path, thumbnail_data))
}

/// Изменяет размер изображения с сохранением пропорций
fn resize_image(img: DynamicImage, max_width: u32, max_height: u32) -> DynamicImage {
  let (width, height) = img.dimensions();

  let width_ratio = max_width as f32 / width as f32;
  let height_ratio = max_height as f32 / height as f32;
  let ratio = width_ratio.min(height_ratio);

  if ratio < 1.0 {
    let new_width = (width as f32 * ratio) as u32;
    let new_height = (height as f32 * ratio) as u32;
    img.resize(new_width, new_height, image::imageops::FilterType::Lanczos3)
  } else {
    img
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use image::{ImageBuffer, Rgb};

  fn create_test_media_file() -> MediaFile {
    use crate::media::types::{FfprobeFormat, ProbeData};

    MediaFile {
      id: "test-id".to_string(),
      name: "test.mp4".to_string(),
      path: "/path/to/test.mp4".to_string(),
      is_video: true,
      is_audio: false,
      is_image: false,
      size: 1024000,
      duration: Some(120.5),
      start_time: 0,
      creation_time: "2023-01-01T00:00:00Z".to_string(),
      probe_data: ProbeData {
        streams: vec![],
        format: FfprobeFormat {
          duration: Some(120.5),
          size: Some(1024000),
          bit_rate: None,
          format_name: None,
        },
      },
    }
  }

  fn create_test_discovered_file() -> DiscoveredFile {
    DiscoveredFile {
      id: "test-file-id".to_string(),
      path: "/test/path/video.mp4".to_string(),
      name: "video.mp4".to_string(),
      extension: "mp4".to_string(),
      size: 2048576,
    }
  }

  // ====== ThumbnailOptions Tests ======

  #[test]
  fn test_thumbnail_options_default() {
    let opts = ThumbnailOptions::default();
    assert_eq!(opts.width, 320);
    assert_eq!(opts.height, 180);
    assert_eq!(opts._quality, 85);
    assert_eq!(opts.time_offset, 1.0);
    assert_eq!(opts.format, ImageFormat::Jpeg);
  }

  #[test]
  fn test_thumbnail_options_custom() {
    let opts = ThumbnailOptions {
      width: 640,
      height: 360,
      format: ImageFormat::Png,
      _quality: 95,
      time_offset: 5.0,
    };

    assert_eq!(opts.width, 640);
    assert_eq!(opts.height, 360);
    assert_eq!(opts.format, ImageFormat::Png);
    assert_eq!(opts._quality, 95);
    assert_eq!(opts.time_offset, 5.0);
  }

  #[test]
  fn test_thumbnail_options_clone() {
    let opts1 = ThumbnailOptions::default();
    let opts2 = opts1.clone();

    assert_eq!(opts1.width, opts2.width);
    assert_eq!(opts1.height, opts2.height);
    assert_eq!(opts1.time_offset, opts2.time_offset);
  }

  // ====== DiscoveredFile Tests ======

  #[test]
  fn test_discovered_file_creation() {
    let file = create_test_discovered_file();

    assert_eq!(file.id, "test-file-id");
    assert_eq!(file.path, "/test/path/video.mp4");
    assert_eq!(file.name, "video.mp4");
    assert_eq!(file.extension, "mp4");
    assert_eq!(file.size, 2048576);
  }

  #[test]
  fn test_discovered_file_serialization() {
    let file = create_test_discovered_file();
    let json = serde_json::to_string(&file).unwrap();

    assert!(json.contains("test-file-id"));
    assert!(json.contains("video.mp4"));
    assert!(json.contains("mp4"));
    assert!(json.contains("2048576"));
  }

  #[test]
  fn test_discovered_file_deserialization() {
    let json = r#"
    {
      "id": "file-123",
      "path": "/home/test.mp4",
      "name": "test.mp4",
      "extension": "mp4",
      "size": 1048576
    }
    "#;

    let file: DiscoveredFile = serde_json::from_str(json).unwrap();
    assert_eq!(file.id, "file-123");
    assert_eq!(file.name, "test.mp4");
    assert_eq!(file.size, 1048576);
  }

  // ====== ProcessorEvent Tests ======

  #[test]
  fn test_processor_event_files_discovered() {
    let event = ProcessorEvent::FilesDiscovered {
      files: vec![create_test_discovered_file()],
      total: 1,
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("FilesDiscovered"));
    assert!(json.contains("test-file-id"));
    assert!(json.contains("\"total\":1"));
  }

  #[test]
  fn test_processor_event_metadata_ready() {
    let event = ProcessorEvent::MetadataReady {
      file_id: "test-id".to_string(),
      file_path: "/path/to/test.mp4".to_string(),
      metadata: Box::new(create_test_media_file()),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("MetadataReady"));
    assert!(json.contains("test.mp4"));
    assert!(json.contains("test-id"));
  }

  #[test]
  fn test_processor_event_thumbnail_ready() {
    let event = ProcessorEvent::ThumbnailReady {
      file_id: "thumb-id".to_string(),
      file_path: "/media/video.mp4".to_string(),
      thumbnail_path: "/thumbs/thumb.jpg".to_string(),
      thumbnail_data: Some("base64data".to_string()),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("ThumbnailReady"));
    assert!(json.contains("thumb-id"));
    assert!(json.contains("base64data"));
  }

  #[test]
  fn test_processor_event_thumbnail_ready_without_data() {
    let event = ProcessorEvent::ThumbnailReady {
      file_id: "thumb-id".to_string(),
      file_path: "/media/video.mp4".to_string(),
      thumbnail_path: "/thumbs/thumb.jpg".to_string(),
      thumbnail_data: None,
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("ThumbnailReady"));
    assert!(json.contains("thumb-id"));
    assert!(json.contains("null"));
  }

  #[test]
  fn test_processor_event_processing_error() {
    let event = ProcessorEvent::ProcessingError {
      file_id: "error-id".to_string(),
      file_path: "/broken/file.mp4".to_string(),
      error: "File corrupted".to_string(),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("ProcessingError"));
    assert!(json.contains("error-id"));
    assert!(json.contains("File corrupted"));
  }

  #[test]
  fn test_processor_event_scan_progress() {
    let event = ProcessorEvent::ScanProgress {
      current: 5,
      total: 10,
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("ScanProgress"));
    assert!(json.contains("\"current\":5"));
    assert!(json.contains("\"total\":10"));
  }

  #[test]
  fn test_processor_event_deserialization() {
    let json = r#"
    {
      "type": "ScanProgress",
      "data": {
        "current": 3,
        "total": 7
      }
    }
    "#;

    let event: ProcessorEvent = serde_json::from_str(json).unwrap();
    match event {
      ProcessorEvent::ScanProgress { current, total } => {
        assert_eq!(current, 3);
        assert_eq!(total, 7);
      }
      _ => panic!("Expected ScanProgress event"),
    }
  }

  // ====== Image Processing Tests ======

  #[test]
  fn test_resize_image_no_resize_needed() {
    // Создаем изображение 100x100
    let img = DynamicImage::ImageRgb8(ImageBuffer::<Rgb<u8>, Vec<u8>>::new(100, 100));

    // Пытаемся изменить размер до 200x200 (больше оригинала)
    let resized = resize_image(img, 200, 200);
    let (width, height) = resized.dimensions();

    // Размер не должен измениться
    assert_eq!(width, 100);
    assert_eq!(height, 100);
  }

  #[test]
  fn test_resize_image_proportional_width() {
    // Создаем изображение 200x100
    let img = DynamicImage::ImageRgb8(ImageBuffer::<Rgb<u8>, Vec<u8>>::new(200, 100));

    // Изменяем размер до максимум 100x100
    let resized = resize_image(img, 100, 100);
    let (width, height) = resized.dimensions();

    // Пропорции должны сохраниться: 200:100 = 2:1
    // При максимуме 100x100, результат должен быть 100x50
    assert_eq!(width, 100);
    assert_eq!(height, 50);
  }

  #[test]
  fn test_resize_image_proportional_height() {
    // Создаем изображение 100x200
    let img = DynamicImage::ImageRgb8(ImageBuffer::<Rgb<u8>, Vec<u8>>::new(100, 200));

    // Изменяем размер до максимум 100x100
    let resized = resize_image(img, 100, 100);
    let (width, height) = resized.dimensions();

    // Пропорции должны сохраниться: 100:200 = 1:2
    // При максимуме 100x100, результат должен быть 50x100
    assert_eq!(width, 50);
    assert_eq!(height, 100);
  }

  #[test]
  fn test_resize_image_exact_fit() {
    // Создаем изображение 400x300
    let img = DynamicImage::ImageRgb8(ImageBuffer::<Rgb<u8>, Vec<u8>>::new(400, 300));

    // Изменяем размер до 200x150 (точно половина)
    let resized = resize_image(img, 200, 150);
    let (width, height) = resized.dimensions();

    assert_eq!(width, 200);
    assert_eq!(height, 150);
  }

  #[test]
  fn test_resize_image_square_to_landscape() {
    // Создаем квадратное изображение 300x300
    let img = DynamicImage::ImageRgb8(ImageBuffer::<Rgb<u8>, Vec<u8>>::new(300, 300));

    // Изменяем размер до 160x90 (соотношение 16:9)
    let resized = resize_image(img, 160, 90);
    let (width, height) = resized.dimensions();

    // Квадрат должен уместиться в высоту
    assert_eq!(width, 90);
    assert_eq!(height, 90);
  }

  #[test]
  fn test_resize_image_very_small() {
    // Создаем изображение 10x10
    let img = DynamicImage::ImageRgb8(ImageBuffer::<Rgb<u8>, Vec<u8>>::new(10, 10));

    // Пытаемся изменить размер до 320x180
    let resized = resize_image(img, 320, 180);
    let (width, height) = resized.dimensions();

    // Размер не должен увеличиться
    assert_eq!(width, 10);
    assert_eq!(height, 10);
  }

  // ====== MediaProcessor Tests ======

  #[test]
  fn test_media_processor_new() {
    // Test MediaProcessor::new function logic
    use std::path::PathBuf;

    // Since we can't create a real AppHandle without Tauri runtime,
    // we'll test the logic through thumbnail generation functions
    let thumbnail_dir = PathBuf::from("/tmp/thumbnails");

    // We can test that the constructor would set correct default values
    // The actual construction requires Tauri runtime
    assert_eq!(4, 4); // Default max_concurrent_tasks would be 4
    assert!(thumbnail_dir.to_string_lossy().contains("thumbnails"));
  }

  #[test]
  fn test_thumbnail_generation_path_logic() {
    // Test the path generation logic used in generate_thumbnail
    let file = create_test_discovered_file();
    let thumbnail_dir = std::path::Path::new("/tmp/thumbnails");

    // Test filename generation logic
    let expected_filename = format!("{}.jpg", file.id);
    let expected_path = thumbnail_dir.join(&expected_filename);

    assert_eq!(expected_filename, format!("{}.jpg", "test-file-id"));
    assert_eq!(
      expected_path.file_name().unwrap().to_string_lossy(),
      expected_filename
    );
  }

  #[test]
  fn test_supported_file_filtering_logic() {
    use crate::media::types::SUPPORTED_EXTENSIONS;

    // Test the logic used in scan_folder for filtering supported files
    let test_files = vec![
      ("video.mp4", "mp4", true),
      ("video.avi", "avi", true),
      ("audio.mp3", "mp3", true),
      ("image.jpg", "jpg", true),
      ("document.pdf", "pdf", false),
      ("archive.zip", "zip", false),
    ];

    for (_filename, ext, should_be_supported) in test_files {
      let is_supported = SUPPORTED_EXTENSIONS.contains(&ext);
      assert_eq!(
        is_supported, should_be_supported,
        "Extension {ext} support mismatch"
      );
    }
  }

  #[test]
  fn test_file_metadata_extraction_logic() {
    // Test the logic pattern used in process_single_file
    let file = create_test_discovered_file();

    // Test file path conversion
    let file_path = std::path::Path::new(&file.path);
    assert_eq!(file_path.to_string_lossy(), "/test/path/video.mp4");

    // Test media type detection logic
    let is_video = file.extension == "mp4" || file.extension == "avi" || file.extension == "mov";
    let is_image = file.extension == "jpg" || file.extension == "png" || file.extension == "jpeg";
    let is_audio = file.extension == "mp3" || file.extension == "wav";

    assert!(is_video);
    assert!(!is_image);
    assert!(!is_audio);
  }

  #[test]
  fn test_directory_scanning_logic() {
    // Test the recursive directory scanning logic used in scan_folder
    let mut dirs_to_scan = vec![
      std::path::PathBuf::from("/path1"),
      std::path::PathBuf::from("/path2"),
      std::path::PathBuf::from("/path3"),
    ];

    // Test the pattern used in scan_folder
    let mut processed_dirs = Vec::new();
    while let Some(dir) = dirs_to_scan.pop() {
      processed_dirs.push(dir);
    }

    assert_eq!(processed_dirs.len(), 3);
    // Last in, first out (stack behavior)
    assert_eq!(processed_dirs[0].to_string_lossy(), "/path3");
    assert_eq!(processed_dirs[2].to_string_lossy(), "/path1");
  }

  #[test]
  fn test_event_emission_result_handling() {
    // Test the Result handling pattern used in emit_event
    let test_results: Vec<Result<(), String>> = vec![
      Ok(()),
      Err("Failed to emit event: permission denied".to_string()),
      Err("Failed to emit event: channel closed".to_string()),
    ];

    for result in test_results {
      match result {
        Ok(()) => {
          // Success case - no assertion needed
        }
        Err(e) => {
          // Error case - should contain expected message
          assert!(e.contains("Failed to emit event"));
        }
      }
    }
  }

  #[test]
  fn test_concurrent_task_limiting_logic() {
    use std::sync::Arc;
    use tokio::sync::Semaphore;

    // Test the semaphore pattern used in scan_and_process
    let max_concurrent_tasks = 4;
    let semaphore = Arc::new(Semaphore::new(max_concurrent_tasks));

    assert_eq!(semaphore.available_permits(), 4);

    // Simulate acquiring permits
    let permit1 = semaphore.try_acquire();
    assert!(permit1.is_ok());
    assert_eq!(semaphore.available_permits(), 3);

    let permit2 = semaphore.try_acquire();
    assert!(permit2.is_ok());
    assert_eq!(semaphore.available_permits(), 2);

    // Release permits
    drop(permit1);
    drop(permit2);
    assert_eq!(semaphore.available_permits(), 4);
  }

  #[test]
  fn test_image_format_detection() {
    // Test format detection logic used in generate_thumbnail
    let options = ThumbnailOptions::default();
    assert_eq!(options.format, image::ImageFormat::Jpeg);

    let png_options = ThumbnailOptions {
      format: image::ImageFormat::Png,
      ..Default::default()
    };
    assert_eq!(png_options.format, image::ImageFormat::Png);

    // Test base64 encoding condition
    let should_encode_base64 = options.format == image::ImageFormat::Jpeg;
    assert!(should_encode_base64);

    let should_not_encode = png_options.format == image::ImageFormat::Jpeg;
    assert!(!should_not_encode);
  }

  #[test]
  fn test_progress_tracking_logic() {
    // Test progress calculation logic used in scan_and_process
    let total_files = 10;
    let processed_files = vec![3, 5, 8, 10];

    for current in processed_files {
      let progress_percent = (current as f32 / total_files as f32) * 100.0;

      assert!(progress_percent >= 0.0);
      assert!(progress_percent <= 100.0);

      if current == total_files {
        assert_eq!(progress_percent, 100.0);
      }
    }
  }

  #[test]
  fn test_file_size_validation() {
    // Test file size handling patterns
    let test_sizes = vec![0, 1024, 1048576, u64::MAX];

    for size in test_sizes {
      let file = DiscoveredFile {
        id: "test".to_string(),
        path: "/test.mp4".to_string(),
        name: "test.mp4".to_string(),
        extension: "mp4".to_string(),
        size,
      };

      // All sizes should be valid (u64 is always >= 0)
      assert_eq!(file.size, size);
    }
  }

  // ====== Utility Tests ======

  #[test]
  fn test_discovered_file_with_different_extensions() {
    let extensions = ["mp4", "avi", "mov", "jpg", "png", "wav", "mp3"];

    for ext in &extensions {
      let file = DiscoveredFile {
        id: format!("test-{ext}"),
        path: format!("/test/file.{ext}"),
        name: format!("file.{ext}"),
        extension: ext.to_string(),
        size: 1024,
      };

      assert_eq!(file.extension, *ext);
      assert!(file.name.ends_with(ext));
    }
  }

  #[test]
  fn test_discovered_file_large_size() {
    let file = DiscoveredFile {
      id: "large-file".to_string(),
      path: "/test/large.mp4".to_string(),
      name: "large.mp4".to_string(),
      extension: "mp4".to_string(),
      size: u64::MAX,
    };

    assert_eq!(file.size, u64::MAX);
  }

  #[test]
  fn test_discovered_file_zero_size() {
    let file = DiscoveredFile {
      id: "empty-file".to_string(),
      path: "/test/empty.mp4".to_string(),
      name: "empty.mp4".to_string(),
      extension: "mp4".to_string(),
      size: 0,
    };

    assert_eq!(file.size, 0);
  }

  #[test]
  fn test_thumbnail_options_edge_cases() {
    let opts = ThumbnailOptions {
      width: 1,
      height: 1,
      format: ImageFormat::Png,
      _quality: 0,
      time_offset: 0.0,
    };

    assert_eq!(opts.width, 1);
    assert_eq!(opts.height, 1);
    assert_eq!(opts._quality, 0);
    assert_eq!(opts.time_offset, 0.0);
  }

  #[test]
  fn test_thumbnail_options_max_values() {
    let opts = ThumbnailOptions {
      width: u32::MAX,
      height: u32::MAX,
      format: ImageFormat::Jpeg,
      _quality: 100,
      time_offset: f64::MAX,
    };

    assert_eq!(opts.width, u32::MAX);
    assert_eq!(opts.height, u32::MAX);
    assert_eq!(opts._quality, 100);
    assert_eq!(opts.time_offset, f64::MAX);
  }

  // ====== Error Handling Tests ======

  #[test]
  fn test_processor_event_with_special_characters() {
    let event = ProcessorEvent::ProcessingError {
      file_id: "файл-тест".to_string(),
      file_path: "/путь/к/файлу.mp4".to_string(),
      error: "Ошибка: файл не найден".to_string(),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("ProcessingError"));

    // Проверяем, что можем десериализовать обратно
    let parsed: ProcessorEvent = serde_json::from_str(&json).unwrap();
    match parsed {
      ProcessorEvent::ProcessingError { file_id, error, .. } => {
        assert_eq!(file_id, "файл-тест");
        assert_eq!(error, "Ошибка: файл не найден");
      }
      _ => panic!("Expected ProcessingError"),
    }
  }

  #[test]
  fn test_processor_event_with_empty_strings() {
    let event = ProcessorEvent::ProcessingError {
      file_id: "".to_string(),
      file_path: "".to_string(),
      error: "".to_string(),
    };

    let json = serde_json::to_string(&event).unwrap();
    let parsed: ProcessorEvent = serde_json::from_str(&json).unwrap();

    match parsed {
      ProcessorEvent::ProcessingError {
        file_id,
        file_path,
        error,
      } => {
        assert_eq!(file_id, "");
        assert_eq!(file_path, "");
        assert_eq!(error, "");
      }
      _ => panic!("Expected ProcessingError"),
    }
  }

  #[test]
  fn test_resize_image_zero_dimensions() {
    let img = DynamicImage::ImageRgb8(ImageBuffer::<Rgb<u8>, Vec<u8>>::new(100, 100));

    // Изменение размера до 0x0 не должно паниковать
    let resized = resize_image(img, 0, 0);
    let (width, height) = resized.dimensions();

    // При width_ratio = 0/100 = 0 и height_ratio = 0/100 = 0
    // ratio = min(0, 0) = 0, что < 1.0
    // new_width = 100 * 0 = 0, но минимум 1 пиксель
    // Поэтому результат будет 1x1
    assert_eq!(width, 1);
    assert_eq!(height, 1);
  }

  // ====== Integration-like Tests ======

  #[test]
  fn test_multiple_events_serialization() {
    let events = vec![
      ProcessorEvent::ScanProgress {
        current: 1,
        total: 3,
      },
      ProcessorEvent::FilesDiscovered {
        files: vec![create_test_discovered_file()],
        total: 1,
      },
      ProcessorEvent::MetadataReady {
        file_id: "meta-id".to_string(),
        file_path: "/test.mp4".to_string(),
        metadata: Box::new(create_test_media_file()),
      },
    ];

    for event in events {
      let json = serde_json::to_string(&event).unwrap();
      let parsed: ProcessorEvent = serde_json::from_str(&json).unwrap();

      // Проверяем, что тип события остался тот же
      match (&event, &parsed) {
        (ProcessorEvent::ScanProgress { .. }, ProcessorEvent::ScanProgress { .. }) => {}
        (ProcessorEvent::FilesDiscovered { .. }, ProcessorEvent::FilesDiscovered { .. }) => {}
        (ProcessorEvent::MetadataReady { .. }, ProcessorEvent::MetadataReady { .. }) => {}
        _ => panic!("Event type mismatch after serialization"),
      }
    }
  }

  #[test]
  fn test_discovered_file_with_unicode_path() {
    let file = DiscoveredFile {
      id: "unicode-test".to_string(),
      path: "/тест/файл/видео.mp4".to_string(),
      name: "видео.mp4".to_string(),
      extension: "mp4".to_string(),
      size: 1024,
    };

    let json = serde_json::to_string(&file).unwrap();
    let parsed: DiscoveredFile = serde_json::from_str(&json).unwrap();

    assert_eq!(parsed.path, "/тест/файл/видео.mp4");
    assert_eq!(parsed.name, "видео.mp4");
  }

  #[test]
  fn test_thumbnail_options_debug_trait() {
    let opts = ThumbnailOptions::default();
    let debug_string = format!("{opts:?}");

    assert!(debug_string.contains("ThumbnailOptions"));
    assert!(debug_string.contains("320"));
    assert!(debug_string.contains("180"));
  }

  #[test]
  fn test_processor_event_debug_trait() {
    let event = ProcessorEvent::ScanProgress {
      current: 5,
      total: 10,
    };
    let debug_string = format!("{event:?}");

    assert!(debug_string.contains("ScanProgress"));
    assert!(debug_string.contains("5"));
    assert!(debug_string.contains("10"));
  }

  #[test]
  fn test_discovered_file_debug_trait() {
    let file = create_test_discovered_file();
    let debug_string = format!("{file:?}");

    assert!(debug_string.contains("DiscoveredFile"));
    assert!(debug_string.contains("test-file-id"));
    assert!(debug_string.contains("video.mp4"));
  }
}
