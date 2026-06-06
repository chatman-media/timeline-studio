// Модуль для работы с файлами

use super::types::SUPPORTED_EXTENSIONS;
use std::path::Path;
/// Получение списка медиафайлов в директории
#[allow(dead_code)]
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

/// Проверяет, является ли файл медиафайлом по расширению
#[allow(dead_code)]
pub fn is_media_file(file_path: &str) -> bool {
  if let Some(extension) = Path::new(file_path).extension().and_then(|e| e.to_str()) {
    let ext = extension.to_lowercase();
    SUPPORTED_EXTENSIONS.contains(&ext.as_str())
  } else {
    false
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs;
  use tempfile::TempDir;

  /// Создает временный тестовый файл
  fn create_test_file(dir: &TempDir, name: &str, content: &[u8]) -> String {
    let file_path = dir.path().join(name);
    fs::write(&file_path, content).expect("Failed to write test file");
    file_path.to_string_lossy().to_string()
  }

  /// Создает временную директорию с тестовыми файлами
  fn create_test_directory() -> TempDir {
    let temp_dir = TempDir::new().expect("Failed to create temp directory");

    // Создаем тестовые файлы разных типов
    create_test_file(&temp_dir, "video.mp4", b"fake video content");
    create_test_file(&temp_dir, "audio.mp3", b"fake audio content");
    create_test_file(&temp_dir, "image.jpg", b"fake image content");
    create_test_file(&temp_dir, "document.txt", b"not a media file");

    temp_dir
  }

  #[test]
  fn test_get_media_files_with_valid_directory() {
    let temp_dir = create_test_directory();
    let dir_path = temp_dir.path().to_string_lossy().to_string();

    let result = get_media_files(dir_path);
    assert!(result.is_ok());

    let files = result.unwrap();
    assert_eq!(files.len(), 3); // video.mp4, audio.mp3, image.jpg

    // Проверяем, что все файлы имеют правильные расширения
    let extensions: Vec<String> = files
      .iter()
      .filter_map(|f| {
        std::path::Path::new(f)
          .extension()
          .and_then(|e| e.to_str())
          .map(|s| s.to_lowercase())
      })
      .collect();

    assert!(extensions.contains(&"mp4".to_string()));
    assert!(extensions.contains(&"mp3".to_string()));
    assert!(extensions.contains(&"jpg".to_string()));
    assert!(!extensions.contains(&"txt".to_string()));
  }

  #[test]
  fn test_get_media_files_with_invalid_directory() {
    let result = get_media_files("/nonexistent/directory".to_string());
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Директория не найдена"));
  }

  #[test]
  fn test_get_media_files_with_empty_directory() {
    let temp_dir = TempDir::new().expect("Failed to create temp directory");
    let dir_path = temp_dir.path().to_string_lossy().to_string();

    let result = get_media_files(dir_path);
    assert!(result.is_ok());

    let files = result.unwrap();
    assert_eq!(files.len(), 0);
  }

  #[test]
  fn test_supported_media_extensions() {
    // Тестируем, что поддерживаются правильные расширения файлов
    let temp_dir = TempDir::new().expect("Failed to create temp directory");

    // Создаем файлы с разными расширениями
    let supported_extensions = [
      "mp4", "avi", "mkv", "mov", "webm", // видео
      "mp3", "wav", "ogg", "flac", // аудио
      "jpg", "jpeg", "png", "gif", "webp", // изображения
    ];

    let unsupported_extensions = ["txt", "doc", "pdf", "exe"];

    // Создаем поддерживаемые файлы
    for ext in &supported_extensions {
      create_test_file(&temp_dir, &format!("test.{ext}"), b"test content");
    }

    // Создаем неподдерживаемые файлы
    for ext in &unsupported_extensions {
      create_test_file(&temp_dir, &format!("test.{ext}"), b"test content");
    }

    let dir_path = temp_dir.path().to_string_lossy().to_string();
    let result = get_media_files(dir_path);
    assert!(result.is_ok());

    let files = result.unwrap();
    assert_eq!(files.len(), supported_extensions.len());

    // Проверяем, что все найденные файлы имеют поддерживаемые расширения
    for file in &files {
      let extension = std::path::Path::new(file)
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_default();

      assert!(
        supported_extensions.contains(&extension.as_str()),
        "Неподдерживаемое расширение найдено: {extension}"
      );
    }
  }

  #[test]
  fn test_is_media_file() {
    // Тестируем функцию проверки медиафайлов
    assert!(is_media_file("video.mp4"));
    assert!(is_media_file("audio.mp3"));
    assert!(is_media_file("image.jpg"));
    assert!(is_media_file("VIDEO.MP4")); // Проверяем регистронезависимость

    assert!(!is_media_file("document.txt"));
    assert!(!is_media_file("archive.zip"));
    assert!(!is_media_file("no_extension"));
  }
}
