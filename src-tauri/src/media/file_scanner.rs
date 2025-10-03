//! File Scanner - Сканирование и обнаружение медиафайлов

use crate::media::types::SUPPORTED_EXTENSIONS;
use serde::{Deserialize, Serialize};
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use tauri::{AppHandle, Emitter};
use tokio::fs;
use uuid::Uuid;

/// Обнаруженный файл
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredFile {
  pub id: String,
  pub path: String,
  pub name: String,
  pub extension: String,
  pub size: u64,
}

/// События сканирования
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ScannerEvent {
  /// Обнаружены файлы
  FilesDiscovered {
    files: Vec<DiscoveredFile>,
    total: usize,
  },
  /// Прогресс сканирования
  ScanProgress { current: usize, total: usize },
  /// Ошибка сканирования
  ScanError { path: String, error: String },
}

/// Сканер файлов
#[allow(dead_code)]
pub struct FileScanner {
  app_handle: AppHandle,
}

impl FileScanner {
  /// Создает новый сканер
  #[allow(dead_code)]
  pub fn new(app_handle: AppHandle) -> Self {
    Self { app_handle }
  }

  /// Рекурсивно сканирует директорию
  #[allow(dead_code)]
  pub async fn scan_directory(
    &self,
    path: &Path,
    recursive: bool,
  ) -> Result<Vec<DiscoveredFile>, String> {
    let mut discovered_files = Vec::new();
    self
      .scan_directory_recursive(path, recursive, &mut discovered_files)
      .await?;

    // Отправляем событие о найденных файлах
    let total = discovered_files.len();
    let _ = self.app_handle.emit(
      "media-processor",
      ScannerEvent::FilesDiscovered {
        files: discovered_files.clone(),
        total,
      },
    );

    Ok(discovered_files)
  }

  /// Внутренняя рекурсивная функция сканирования
  #[allow(dead_code)]
  fn scan_directory_recursive<'a>(
    &'a self,
    path: &'a Path,
    recursive: bool,
    discovered_files: &'a mut Vec<DiscoveredFile>,
  ) -> Pin<Box<dyn Future<Output = Result<(), String>> + 'a + Send>> {
    Box::pin(async move {
      let mut entries = fs::read_dir(path)
        .await
        .map_err(|e| format!("Failed to read directory {path:?}: {e}"))?;

      while let Ok(Some(entry)) = entries.next_entry().await {
        let path = entry.path();
        let metadata = match entry.metadata().await {
          Ok(m) => m,
          Err(e) => {
            self.emit_error(path.to_string_lossy().to_string(), e.to_string());
            continue;
          }
        };

        if metadata.is_dir() && recursive {
          // Рекурсивно сканируем поддиректорию
          if let Err(e) = self
            .scan_directory_recursive(&path, recursive, discovered_files)
            .await
          {
            self.emit_error(path.to_string_lossy().to_string(), e);
          }
        } else if metadata.is_file() {
          if let Some(file) = self.process_file(path, metadata).await {
            discovered_files.push(file);

            // Отправляем прогресс
            if discovered_files.len().is_multiple_of(10) {
              let _ = self.app_handle.emit(
                "media-processor",
                ScannerEvent::ScanProgress {
                  current: discovered_files.len(),
                  total: 0, // Неизвестно заранее
                },
              );
            }
          }
        }
      }

      Ok(())
    })
  }

  /// Обрабатывает отдельный файл
  #[allow(dead_code)]
  async fn process_file(
    &self,
    path: PathBuf,
    metadata: std::fs::Metadata,
  ) -> Option<DiscoveredFile> {
    let ext = path
      .extension()
      .and_then(|e| e.to_str())
      .map(|e| e.to_lowercase());

    if let Some(extension) = ext {
      if SUPPORTED_EXTENSIONS.contains(&extension.as_str()) {
        let file_name = path
          .file_name()
          .unwrap_or_default()
          .to_string_lossy()
          .to_string();

        return Some(DiscoveredFile {
          id: Uuid::new_v4().to_string(),
          path: path.to_string_lossy().to_string(),
          name: file_name,
          extension,
          size: metadata.len(),
        });
      }
    }

    None
  }

  /// Отправляет событие об ошибке
  #[allow(dead_code)]
  fn emit_error(&self, path: String, error: String) {
    let _ = self
      .app_handle
      .emit("media-processor", ScannerEvent::ScanError { path, error });
  }

  /// Проверяет, является ли путь медиафайлом
  #[allow(dead_code)]
  pub fn is_media_file(path: &Path) -> bool {
    path
      .extension()
      .and_then(|ext| ext.to_str())
      .map(|ext| {
        let ext_lower = ext.to_lowercase();
        SUPPORTED_EXTENSIONS.contains(&ext_lower.as_str())
      })
      .unwrap_or(false)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_is_media_file() {
    assert!(FileScanner::is_media_file(Path::new("video.mp4")));
    assert!(FileScanner::is_media_file(Path::new("photo.jpg")));
    assert!(FileScanner::is_media_file(Path::new("audio.mp3")));
    assert!(FileScanner::is_media_file(Path::new("VIDEO.MOV"))); // Case insensitive
    assert!(!FileScanner::is_media_file(Path::new("document.pdf")));
    assert!(!FileScanner::is_media_file(Path::new("no_extension")));
  }

  #[test]
  fn test_discovered_file_creation() {
    let file = DiscoveredFile {
      id: "test-id".to_string(),
      path: "/path/to/file.mp4".to_string(),
      name: "file.mp4".to_string(),
      extension: "mp4".to_string(),
      size: 1024,
    };

    assert_eq!(file.name, "file.mp4");
    assert_eq!(file.extension, "mp4");
    assert_eq!(file.size, 1024);
  }
}
