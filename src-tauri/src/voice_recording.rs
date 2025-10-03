//! Модуль для работы с голосовыми записями
//!
//! Обеспечивает функциональность сохранения аудио записей в структуре проекта

use crate::app_dirs::AppDirectories;
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Поддерживаемые форматы аудио
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioFormat {
  #[serde(rename = "webm")]
  WebM,
  #[serde(rename = "mp3")]
  Mp3,
  #[serde(rename = "wav")]
  Wav,
  #[serde(rename = "ogg")]
  Ogg,
  #[serde(rename = "m4a")]
  M4a,
}

impl AudioFormat {
  /// Получить расширение файла для формата
  pub fn extension(&self) -> &'static str {
    match self {
      AudioFormat::WebM => "webm",
      AudioFormat::Mp3 => "mp3",
      AudioFormat::Wav => "wav",
      AudioFormat::Ogg => "ogg",
      AudioFormat::M4a => "m4a",
    }
  }

  /// Получить MIME тип для формата
  #[allow(dead_code)]
  pub fn mime_type(&self) -> &'static str {
    match self {
      AudioFormat::WebM => "audio/webm",
      AudioFormat::Mp3 => "audio/mpeg",
      AudioFormat::Wav => "audio/wav",
      AudioFormat::Ogg => "audio/ogg",
      AudioFormat::M4a => "audio/mp4",
    }
  }
}

/// Параметры для сохранения аудио записи
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAudioParams {
  /// Base64 encoded audio data
  pub audio_data: String,
  /// Имя файла (без расширения)
  pub file_name: String,
  /// Формат аудио
  pub format: AudioFormat,
  /// Использовать ли поддиректорию в Recorded
  pub use_subdirectory: Option<bool>,
}

/// Результат сохранения аудио
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAudioResult {
  /// Полный путь к сохраненному файлу
  pub file_path: String,
  /// Имя файла с расширением
  pub file_name: String,
  /// Размер файла в байтах
  pub file_size: u64,
  /// Формат аудио
  pub format: AudioFormat,
}

/// Сохранить аудио запись в директории проекта
#[tauri::command]
pub async fn save_voice_recording(params: SaveAudioParams) -> Result<SaveAudioResult, String> {
  // Получаем директории приложения
  let app_dirs = AppDirectories::get_or_create()
    .map_err(|e| format!("Не удалось получить директории приложения: {}", e))?;

  // Определяем директорию для сохранения
  let save_dir = if params.use_subdirectory.unwrap_or(true) {
    // Создаем поддиректорию VoiceRecordings в Recorded
    let voice_dir = app_dirs.recorded_dir.join("VoiceRecordings");
    fs::create_dir_all(&voice_dir)
      .map_err(|e| format!("Не удалось создать директорию для записей: {}", e))?;
    voice_dir
  } else {
    app_dirs.recorded_dir.clone()
  };

  // Формируем полное имя файла
  let file_name_with_ext = format!("{}.{}", params.file_name, params.format.extension());
  let file_path = save_dir.join(&file_name_with_ext);

  // Проверяем, существует ли файл, и добавляем номер если нужно
  let final_path = ensure_unique_filename(file_path);
  let final_name = final_path
    .file_name()
    .and_then(|n| n.to_str())
    .ok_or("Не удалось получить имя файла")?
    .to_string();

  // Декодируем base64 данные
  let audio_bytes = general_purpose::STANDARD
    .decode(&params.audio_data)
    .map_err(|e| format!("Ошибка декодирования base64: {}", e))?;

  // Сохраняем файл
  fs::write(&final_path, &audio_bytes).map_err(|e| format!("Не удалось сохранить файл: {}", e))?;

  // Получаем размер файла
  let metadata = fs::metadata(&final_path)
    .map_err(|e| format!("Не удалось получить метаданные файла: {}", e))?;

  log::info!(
    "Сохранена голосовая запись: {} ({} байт)",
    final_path.display(),
    metadata.len()
  );

  Ok(SaveAudioResult {
    file_path: final_path.to_string_lossy().to_string(),
    file_name: final_name,
    file_size: metadata.len(),
    format: params.format,
  })
}

/// Получить список поддерживаемых форматов аудио
#[tauri::command]
pub async fn get_supported_audio_formats() -> Vec<AudioFormatInfo> {
  vec![
    AudioFormatInfo {
      format: AudioFormat::WebM,
      name: "WebM Audio".to_string(),
      description: "Современный формат с хорошим сжатием".to_string(),
      supported: true,
    },
    AudioFormatInfo {
      format: AudioFormat::Mp3,
      name: "MP3".to_string(),
      description: "Универсальный формат, поддерживается везде".to_string(),
      supported: true,
    },
    AudioFormatInfo {
      format: AudioFormat::Wav,
      name: "WAV".to_string(),
      description: "Несжатый формат, высокое качество".to_string(),
      supported: true,
    },
    AudioFormatInfo {
      format: AudioFormat::Ogg,
      name: "OGG Vorbis".to_string(),
      description: "Открытый формат с хорошим качеством".to_string(),
      supported: true,
    },
    AudioFormatInfo {
      format: AudioFormat::M4a,
      name: "M4A (AAC)".to_string(),
      description: "Формат Apple, хорошее качество и сжатие".to_string(),
      supported: true,
    },
  ]
}

/// Информация о формате аудио
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioFormatInfo {
  pub format: AudioFormat,
  pub name: String,
  pub description: String,
  pub supported: bool,
}

/// Обеспечить уникальность имени файла
fn ensure_unique_filename(path: PathBuf) -> PathBuf {
  if !path.exists() {
    return path;
  }

  let parent = path.parent().unwrap();
  let stem = path.file_stem().unwrap().to_str().unwrap();
  let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");

  let mut counter = 1;
  loop {
    let new_name = if extension.is_empty() {
      format!("{}_{}", stem, counter)
    } else {
      format!("{}_{}.{}", stem, counter, extension)
    };

    let new_path = parent.join(new_name);
    if !new_path.exists() {
      return new_path;
    }

    counter += 1;
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::TempDir;

  #[test]
  fn test_audio_format_extension() {
    assert_eq!(AudioFormat::WebM.extension(), "webm");
    assert_eq!(AudioFormat::Mp3.extension(), "mp3");
    assert_eq!(AudioFormat::Wav.extension(), "wav");
    assert_eq!(AudioFormat::Ogg.extension(), "ogg");
    assert_eq!(AudioFormat::M4a.extension(), "m4a");
  }

  #[test]
  fn test_audio_format_mime_type() {
    assert_eq!(AudioFormat::WebM.mime_type(), "audio/webm");
    assert_eq!(AudioFormat::Mp3.mime_type(), "audio/mpeg");
    assert_eq!(AudioFormat::Wav.mime_type(), "audio/wav");
    assert_eq!(AudioFormat::Ogg.mime_type(), "audio/ogg");
    assert_eq!(AudioFormat::M4a.mime_type(), "audio/mp4");
  }

  #[test]
  fn test_ensure_unique_filename() {
    let temp_dir = TempDir::new().unwrap();
    let base_path = temp_dir.path().join("test.txt");

    // Первый файл должен сохраниться без изменений
    assert_eq!(ensure_unique_filename(base_path.clone()), base_path);

    // Создаем файл
    std::fs::write(&base_path, "test").unwrap();

    // Второй файл должен получить суффикс
    let unique_path = ensure_unique_filename(base_path.clone());
    assert_eq!(
      unique_path.file_name().unwrap().to_str().unwrap(),
      "test_1.txt"
    );

    // Создаем второй файл
    std::fs::write(&unique_path, "test").unwrap();

    // Третий файл должен получить суффикс _2
    let unique_path2 = ensure_unique_filename(base_path);
    assert_eq!(
      unique_path2.file_name().unwrap().to_str().unwrap(),
      "test_2.txt"
    );
  }

  #[test]
  fn test_audio_format_serialization() {
    let format = AudioFormat::Mp3;
    let json = serde_json::to_string(&format).unwrap();
    assert_eq!(json, "\"mp3\"");

    let deserialized: AudioFormat = serde_json::from_str(&json).unwrap();
    assert!(matches!(deserialized, AudioFormat::Mp3));
  }

  #[tokio::test]
  async fn test_get_supported_audio_formats() {
    let formats = get_supported_audio_formats().await;
    assert_eq!(formats.len(), 5);
    assert!(formats.iter().all(|f| f.supported));
    assert!(formats.iter().any(|f| matches!(f.format, AudioFormat::Mp3)));
    assert!(formats
      .iter()
      .any(|f| matches!(f.format, AudioFormat::WebM)));
  }
}
