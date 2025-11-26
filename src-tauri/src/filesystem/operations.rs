use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/**
 * Структура для статистики файла
 */
#[derive(Debug, Serialize, Deserialize)]
pub struct FileStats {
  pub size: u64,
  #[serde(rename = "lastModified")]
  pub last_modified: u64,
}

/**
 * Проверяет существование файла
 */
#[tauri::command]
pub fn file_exists(path: String) -> Result<bool, String> {
  let file_path = Path::new(&path);
  Ok(file_path.exists() && file_path.is_file())
}

/**
 * Получает статистику файла (размер и время модификации)
 */
#[tauri::command]
pub fn get_file_stats(path: String) -> Result<FileStats, String> {
  let file_path = Path::new(&path);

  if !file_path.exists() {
    return Err(format!("File does not exist: {path}"));
  }

  match fs::metadata(file_path) {
    Ok(metadata) => {
      let size = metadata.len();

      // Получаем время модификации в миллисекундах
      let last_modified = metadata
        .modified()
        .map_err(|e| format!("Failed to get modification time: {e}"))?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Failed to convert time: {e}"))?
        .as_millis() as u64;

      Ok(FileStats {
        size,
        last_modified,
      })
    }
    Err(e) => Err(format!("Failed to get file metadata: {e}")),
  }
}

/**
 * Получает платформу операционной системы
 */
#[tauri::command]
pub fn get_platform() -> Result<String, String> {
  Ok(std::env::consts::OS.to_string())
}

/**
 * Рекурсивно ищет файлы в директории с заданным именем
 */
#[tauri::command]
pub fn search_files_by_name(
  directory: String,
  filename: String,
  max_depth: Option<u32>,
) -> Result<Vec<String>, String> {
  let dir_path = Path::new(&directory);

  if !dir_path.exists() {
    return Err(format!("Directory does not exist: {directory}"));
  }

  let mut found_files = Vec::new();
  let max_depth = max_depth.unwrap_or(5); // По умолчанию максимум 5 уровней

  search_files_recursive(dir_path, &filename, &mut found_files, 0, max_depth)?;

  Ok(found_files)
}

/**
 * Рекурсивная функция для поиска файлов
 */
fn search_files_recursive(
  dir: &Path,
  target_filename: &str,
  found_files: &mut Vec<String>,
  current_depth: u32,
  max_depth: u32,
) -> Result<(), String> {
  if current_depth >= max_depth {
    return Ok(());
  }

  match fs::read_dir(dir) {
    Ok(entries) => {
      for entry in entries {
        match entry {
          Ok(entry) => {
            let entry_path = entry.path();

            if entry_path.is_file() {
              if let Some(filename) = entry_path.file_name() {
                if filename == target_filename {
                  if let Some(path_str) = entry_path.to_str() {
                    found_files.push(path_str.to_string());
                  }
                }
              }
            } else if entry_path.is_dir() {
              // Рекурсивно ищем в поддиректории
              search_files_recursive(
                &entry_path,
                target_filename,
                found_files,
                current_depth + 1,
                max_depth,
              )?;
            }
          }
          Err(e) => {
            eprintln!("Error reading directory entry: {e}");
          }
        }
      }
    }
    Err(e) => return Err(format!("Failed to read directory: {e}")),
  }

  Ok(())
}

/**
 * Получает абсолютный путь к файлу
 */
#[tauri::command]
pub fn get_absolute_path(path: String) -> Result<String, String> {
  let file_path = Path::new(&path);

  match file_path.canonicalize() {
    Ok(absolute_path) => {
      if let Some(path_str) = absolute_path.to_str() {
        Ok(path_str.to_string())
      } else {
        Err("Failed to convert path to string".to_string())
      }
    }
    Err(e) => Err(format!("Failed to get absolute path: {e}")),
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs;
  use tempfile::{NamedTempFile, TempDir};

  #[test]
  fn test_file_exists() {
    let temp_file = NamedTempFile::new().unwrap();
    let path = temp_file.path().to_str().unwrap().to_string();

    let result = file_exists(path.clone());
    assert!(result.is_ok());
    assert!(result.unwrap());

    let result = file_exists("/nonexistent/file.txt".to_string());
    assert!(result.is_ok());
    assert!(!result.unwrap());
  }

  #[test]
  fn test_get_file_stats() {
    let temp_file = NamedTempFile::new().unwrap();
    fs::write(temp_file.path(), b"test content").unwrap();
    let path = temp_file.path().to_str().unwrap().to_string();

    let result = get_file_stats(path);
    assert!(result.is_ok());

    let stats = result.unwrap();
    assert_eq!(stats.size, 12); // "test content" is 12 bytes
    assert!(stats.last_modified > 0);
  }

  #[test]
  fn test_get_file_stats_nonexistent() {
    let result = get_file_stats("/nonexistent/file.txt".to_string());
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("File does not exist"));
  }

  #[test]
  fn test_get_file_stats_directory() {
    let temp_dir = TempDir::new().unwrap();
    let path = temp_dir.path().to_str().unwrap().to_string();

    // get_file_stats actually succeeds for directories since it only checks existence
    let result = get_file_stats(path);
    assert!(result.is_ok());
    let stats = result.unwrap();
    assert!(stats.last_modified > 0);
  }

  #[test]
  fn test_get_platform() {
    let result = get_platform();
    assert!(result.is_ok());

    let platform = result.unwrap();
    assert!(!platform.is_empty());

    // Platform should be one of the known values
    let valid_platforms = ["windows", "macos", "linux", "ios", "android"];
    assert!(valid_platforms.contains(&platform.as_str()));
  }

  #[test]
  fn test_search_files_by_name() {
    let temp_dir = TempDir::new().unwrap();

    // Create test files
    fs::write(temp_dir.path().join("test1.txt"), b"content").unwrap();
    fs::write(temp_dir.path().join("test2.txt"), b"content").unwrap();
    fs::write(temp_dir.path().join("other.doc"), b"content").unwrap();

    let result = search_files_by_name(
      temp_dir.path().to_str().unwrap().to_string(),
      "test1.txt".to_string(),
      None,
    );

    assert!(result.is_ok());
    let files = result.unwrap();
    assert_eq!(files.len(), 1);
    assert!(files[0].contains("test1.txt"));
  }

  #[test]
  fn test_search_files_by_name_with_subdirectories() {
    let temp_dir = TempDir::new().unwrap();

    // Create subdirectories
    let sub_dir = temp_dir.path().join("subdir");
    fs::create_dir(&sub_dir).unwrap();

    // Create files in different locations
    fs::write(temp_dir.path().join("target.txt"), b"content").unwrap();
    fs::write(sub_dir.join("target.txt"), b"content").unwrap();

    let result = search_files_by_name(
      temp_dir.path().to_str().unwrap().to_string(),
      "target.txt".to_string(),
      None,
    );

    assert!(result.is_ok());
    let files = result.unwrap();
    assert_eq!(files.len(), 2);
  }

  #[test]
  fn test_search_files_by_name_max_depth() {
    let temp_dir = TempDir::new().unwrap();

    // Create nested directories
    let sub1 = temp_dir.path().join("level1");
    let sub2 = sub1.join("level2");
    let sub3 = sub2.join("level3");
    fs::create_dir_all(&sub3).unwrap();

    // Create files at different depths
    fs::write(temp_dir.path().join("file.txt"), b"content").unwrap();
    fs::write(sub1.join("file.txt"), b"content").unwrap();
    fs::write(sub2.join("file.txt"), b"content").unwrap();
    fs::write(sub3.join("file.txt"), b"content").unwrap();

    // Search with max depth of 2
    let result = search_files_by_name(
      temp_dir.path().to_str().unwrap().to_string(),
      "file.txt".to_string(),
      Some(2),
    );

    assert!(result.is_ok());
    let files = result.unwrap();
    // Should find files at depth 0 and 1, but not 2 or 3
    assert_eq!(files.len(), 2);
  }

  #[test]
  fn test_search_files_by_name_empty_result() {
    let temp_dir = TempDir::new().unwrap();

    let result = search_files_by_name(
      temp_dir.path().to_str().unwrap().to_string(),
      "nonexistent.txt".to_string(),
      None,
    );

    assert!(result.is_ok());
    let files = result.unwrap();
    assert_eq!(files.len(), 0);
  }

  #[test]
  fn test_search_files_by_name_nonexistent_directory() {
    let result = search_files_by_name(
      "/nonexistent/directory".to_string(),
      "file.txt".to_string(),
      None,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Directory does not exist"));
  }

  #[test]
  fn test_get_absolute_path() {
    let temp_file = NamedTempFile::new().unwrap();
    let path = temp_file.path().to_str().unwrap().to_string();

    let result = get_absolute_path(path.clone());
    assert!(result.is_ok());

    let abs_path = result.unwrap();
    assert!(abs_path.starts_with('/') || abs_path.contains(':'));
  }

  #[test]
  fn test_get_absolute_path_nonexistent() {
    // get_absolute_path can still work with non-existent files
    // as long as the parent directory exists
    let result = get_absolute_path("./nonexistent.txt".to_string());

    // This might succeed or fail depending on the current directory
    // If it succeeds, check that it's absolute
    if let Ok(abs_path) = result {
      assert!(abs_path.starts_with('/') || abs_path.contains(':'));
    }
  }

  #[test]
  #[cfg(unix)]
  fn test_search_files_recursive_error_handling() {
    // Test error handling in recursive search
    let temp_dir = TempDir::new().unwrap();

    use std::os::unix::fs::PermissionsExt;

    // Create a readable file in root
    fs::write(temp_dir.path().join("test.txt"), b"content").unwrap();

    // Create a directory with restricted permissions
    let restricted_dir = temp_dir.path().join("restricted");
    fs::create_dir(&restricted_dir).unwrap();

    // Create a file inside before restricting
    fs::write(restricted_dir.join("test.txt"), b"content").unwrap();

    // Now restrict the directory
    fs::set_permissions(&restricted_dir, fs::Permissions::from_mode(0o000)).unwrap();

    // Search should find the file in root directory but fail on restricted directory
    let result = search_files_by_name(
      temp_dir.path().to_str().unwrap().to_string(),
      "test.txt".to_string(),
      None,
    );

    // Clean up permissions before assertions
    fs::set_permissions(&restricted_dir, fs::Permissions::from_mode(0o755)).unwrap();

    // The function returns error when it can't read a directory
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Failed to read directory"));
  }
}
