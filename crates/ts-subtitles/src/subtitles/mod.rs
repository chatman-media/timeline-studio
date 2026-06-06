use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct SubtitleExportOptions {
  pub format: String, // "srt", "vtt", "ass"
  pub content: String,
  pub output_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubtitleImportResult {
  pub content: String,
  pub format: String,
  pub file_name: String,
}

/// Читает файл субтитров и возвращает его содержимое
pub async fn read_subtitle_file(file_path: String) -> Result<SubtitleImportResult, String> {
  let path = Path::new(&file_path);

  // Проверяем существование файла
  if !path.exists() {
    return Err(format!("File not found: {file_path}"));
  }

  // Определяем формат по расширению
  let extension = path
    .extension()
    .and_then(|ext| ext.to_str())
    .unwrap_or("")
    .to_lowercase();

  let format = match extension.as_str() {
    "srt" => "srt",
    "vtt" => "vtt",
    "ass" | "ssa" => "ass",
    _ => return Err(format!("Unsupported subtitle format: {extension}")),
  };

  // Читаем содержимое файла
  let content = fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {e}"))?;

  // Получаем имя файла
  let file_name = path
    .file_name()
    .and_then(|name| name.to_str())
    .unwrap_or("unknown")
    .to_string();

  Ok(SubtitleImportResult {
    content,
    format: format.to_string(),
    file_name,
  })
}

/// Сохраняет субтитры в файл
pub async fn save_subtitle_file(options: SubtitleExportOptions) -> Result<(), String> {
  let path = Path::new(&options.output_path);

  // Создаем директорию если не существует
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {e}"))?;
  }

  // Записываем файл
  fs::write(&options.output_path, &options.content)
    .map_err(|e| format!("Failed to write file: {e}"))?;

  Ok(())
}

/// Валидирует формат субтитров
pub async fn validate_subtitle_format(content: String, format: String) -> Result<bool, String> {
  match format.as_str() {
    "srt" => {
      // Проверяем базовый формат SRT
      let has_timing = content.contains(" --> ");
      let has_numbers = content
        .lines()
        .any(|line| line.trim().parse::<u32>().is_ok());
      Ok(has_timing && has_numbers)
    }
    "vtt" => {
      // Проверяем формат VTT
      let has_header = content.trim().starts_with("WEBVTT");
      let has_timing = content.contains(" --> ");
      Ok(has_header && has_timing)
    }
    "ass" | "ssa" => {
      // Проверяем формат ASS/SSA
      let has_script_info = content.contains("[Script Info]");
      let has_events = content.contains("[Events]");
      Ok(has_script_info || has_events)
    }
    _ => Err(format!("Unknown format: {format}")),
  }
}

/// Конвертирует субтитры между форматами (базовая версия)
pub async fn convert_subtitle_format(
  content: String,
  from_format: String,
  to_format: String,
) -> Result<String, String> {
  // Это упрощенная версия - в реальности нужен полноценный парсер
  if from_format == to_format {
    return Ok(content);
  }

  // Для демонстрации - просто возвращаем контент
  // В реальной реализации здесь должна быть конвертация
  log::warn!("Subtitle format conversion from {from_format} to {to_format} is not yet implemented");

  Ok(content)
}

/// Получает информацию о субтитрах
#[derive(Debug, Serialize, Deserialize)]
pub struct SubtitleInfo {
  pub format: String,
  pub subtitle_count: usize,
  pub duration: Option<f64>,
  pub has_styling: bool,
}

pub async fn get_subtitle_info(content: String, format: String) -> Result<SubtitleInfo, String> {
  let subtitle_count = match format.as_str() {
    "srt" => content.matches(" --> ").count(),
    "vtt" => content.matches(" --> ").count(),
    "ass" | "ssa" => content
      .lines()
      .filter(|line| line.starts_with("Dialogue:"))
      .count(),
    _ => 0,
  };

  let has_styling = match format.as_str() {
    "ass" | "ssa" => true,
    "vtt" => content.contains("NOTE") || content.contains("STYLE"),
    _ => false,
  };

  Ok(SubtitleInfo {
    format,
    subtitle_count,
    duration: None, // Требует парсинга таймингов
    has_styling,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::TempDir;

  // Sample subtitle content for testing
  const SAMPLE_SRT: &str = "1
00:00:00,000 --> 00:00:02,000
Hello, world!

2
00:00:02,500 --> 00:00:05,000
This is a test subtitle.";

  const SAMPLE_VTT: &str = "WEBVTT

00:00:00.000 --> 00:00:02.000
Hello, world!

00:00:02.500 --> 00:00:05.000
This is a test subtitle.";

  const SAMPLE_ASS: &str = "[Script Info]
Title: Test Subtitles
ScriptType: v4.00+

[Events]
Format: Layer, Start, End, Style, Text
Dialogue: 0,0:00:00.00,0:00:02.00,Default,Hello, world!
Dialogue: 0,0:00:02.50,0:00:05.00,Default,This is a test subtitle.";

  #[tokio::test]
  async fn test_read_subtitle_file_srt() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.srt");
    fs::write(&file_path, SAMPLE_SRT).unwrap();

    let result = read_subtitle_file(file_path.to_string_lossy().to_string()).await;
    assert!(result.is_ok());

    let import_result = result.unwrap();
    assert_eq!(import_result.format, "srt");
    assert_eq!(import_result.file_name, "test.srt");
    assert_eq!(import_result.content, SAMPLE_SRT);
  }

  #[tokio::test]
  async fn test_read_subtitle_file_vtt() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.vtt");
    fs::write(&file_path, SAMPLE_VTT).unwrap();

    let result = read_subtitle_file(file_path.to_string_lossy().to_string()).await;
    assert!(result.is_ok());

    let import_result = result.unwrap();
    assert_eq!(import_result.format, "vtt");
    assert_eq!(import_result.file_name, "test.vtt");
    assert_eq!(import_result.content, SAMPLE_VTT);
  }

  #[tokio::test]
  async fn test_read_subtitle_file_ass() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.ass");
    fs::write(&file_path, SAMPLE_ASS).unwrap();

    let result = read_subtitle_file(file_path.to_string_lossy().to_string()).await;
    assert!(result.is_ok());

    let import_result = result.unwrap();
    assert_eq!(import_result.format, "ass");
    assert_eq!(import_result.file_name, "test.ass");
  }

  #[tokio::test]
  async fn test_read_subtitle_file_ssa() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.ssa");
    fs::write(&file_path, SAMPLE_ASS).unwrap();

    let result = read_subtitle_file(file_path.to_string_lossy().to_string()).await;
    assert!(result.is_ok());

    let import_result = result.unwrap();
    assert_eq!(import_result.format, "ass"); // SSA maps to ASS
  }

  #[tokio::test]
  async fn test_read_subtitle_file_not_found() {
    let result = read_subtitle_file("/non/existent/file.srt".to_string()).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("File not found"));
  }

  #[tokio::test]
  async fn test_read_subtitle_file_unsupported_format() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.txt");
    fs::write(&file_path, "Some content").unwrap();

    let result = read_subtitle_file(file_path.to_string_lossy().to_string()).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Unsupported subtitle format"));
  }

  #[tokio::test]
  async fn test_save_subtitle_file() {
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("output.srt");

    let options = SubtitleExportOptions {
      format: "srt".to_string(),
      content: SAMPLE_SRT.to_string(),
      output_path: output_path.to_string_lossy().to_string(),
    };

    let result = save_subtitle_file(options).await;
    assert!(result.is_ok());

    // Verify the file was created
    assert!(output_path.exists());
    let content = fs::read_to_string(&output_path).unwrap();
    assert_eq!(content, SAMPLE_SRT);
  }

  #[tokio::test]
  async fn test_save_subtitle_file_with_directory_creation() {
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("sub/dir/output.vtt");

    let options = SubtitleExportOptions {
      format: "vtt".to_string(),
      content: SAMPLE_VTT.to_string(),
      output_path: output_path.to_string_lossy().to_string(),
    };

    let result = save_subtitle_file(options).await;
    assert!(result.is_ok());

    // Verify the file and directories were created
    assert!(output_path.exists());
    let content = fs::read_to_string(&output_path).unwrap();
    assert_eq!(content, SAMPLE_VTT);
  }

  #[tokio::test]
  async fn test_validate_subtitle_format_srt_valid() {
    let result = validate_subtitle_format(SAMPLE_SRT.to_string(), "srt".to_string()).await;
    assert!(result.is_ok());
    assert!(result.unwrap());
  }

  #[tokio::test]
  async fn test_validate_subtitle_format_srt_invalid() {
    let invalid_srt = "This is not a valid SRT file";
    let result = validate_subtitle_format(invalid_srt.to_string(), "srt".to_string()).await;
    assert!(result.is_ok());
    assert!(!result.unwrap());
  }

  #[tokio::test]
  async fn test_validate_subtitle_format_vtt_valid() {
    let result = validate_subtitle_format(SAMPLE_VTT.to_string(), "vtt".to_string()).await;
    assert!(result.is_ok());
    assert!(result.unwrap());
  }

  #[tokio::test]
  async fn test_validate_subtitle_format_vtt_invalid() {
    let invalid_vtt = "00:00:00.000 --> 00:00:02.000\nMissing WEBVTT header";
    let result = validate_subtitle_format(invalid_vtt.to_string(), "vtt".to_string()).await;
    assert!(result.is_ok());
    assert!(!result.unwrap());
  }

  #[tokio::test]
  async fn test_validate_subtitle_format_ass_valid() {
    let result = validate_subtitle_format(SAMPLE_ASS.to_string(), "ass".to_string()).await;
    assert!(result.is_ok());
    assert!(result.unwrap());
  }

  #[tokio::test]
  async fn test_validate_subtitle_format_ass_minimal() {
    let minimal_ass = "[Events]\nDialogue: Test";
    let result = validate_subtitle_format(minimal_ass.to_string(), "ass".to_string()).await;
    assert!(result.is_ok());
    assert!(result.unwrap());
  }

  #[tokio::test]
  async fn test_validate_subtitle_format_unknown() {
    let result = validate_subtitle_format("content".to_string(), "xyz".to_string()).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Unknown format"));
  }

  #[tokio::test]
  async fn test_convert_subtitle_format_same() {
    let result =
      convert_subtitle_format(SAMPLE_SRT.to_string(), "srt".to_string(), "srt".to_string()).await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), SAMPLE_SRT);
  }

  #[tokio::test]
  async fn test_convert_subtitle_format_different() {
    // Currently just returns the same content with a warning
    let result =
      convert_subtitle_format(SAMPLE_SRT.to_string(), "srt".to_string(), "vtt".to_string()).await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), SAMPLE_SRT);
  }

  #[tokio::test]
  async fn test_get_subtitle_info_srt() {
    let result = get_subtitle_info(SAMPLE_SRT.to_string(), "srt".to_string()).await;
    assert!(result.is_ok());

    let info = result.unwrap();
    assert_eq!(info.format, "srt");
    assert_eq!(info.subtitle_count, 2);
    assert!(!info.has_styling);
    assert!(info.duration.is_none());
  }

  #[tokio::test]
  async fn test_get_subtitle_info_vtt() {
    let result = get_subtitle_info(SAMPLE_VTT.to_string(), "vtt".to_string()).await;
    assert!(result.is_ok());

    let info = result.unwrap();
    assert_eq!(info.format, "vtt");
    assert_eq!(info.subtitle_count, 2);
    assert!(!info.has_styling);
  }

  #[tokio::test]
  async fn test_get_subtitle_info_vtt_with_styling() {
    let vtt_with_style =
      "WEBVTT\n\nSTYLE\n::cue { color: red; }\n\n00:00:00.000 --> 00:00:02.000\nStyled text";
    let result = get_subtitle_info(vtt_with_style.to_string(), "vtt".to_string()).await;
    assert!(result.is_ok());

    let info = result.unwrap();
    assert!(info.has_styling);
  }

  #[tokio::test]
  async fn test_get_subtitle_info_ass() {
    let result = get_subtitle_info(SAMPLE_ASS.to_string(), "ass".to_string()).await;
    assert!(result.is_ok());

    let info = result.unwrap();
    assert_eq!(info.format, "ass");
    assert_eq!(info.subtitle_count, 2);
    assert!(info.has_styling); // ASS always has styling
  }

  #[tokio::test]
  async fn test_get_subtitle_info_empty() {
    let result = get_subtitle_info("".to_string(), "srt".to_string()).await;
    assert!(result.is_ok());

    let info = result.unwrap();
    assert_eq!(info.subtitle_count, 0);
  }

  #[tokio::test]
  async fn test_get_subtitle_info_unknown_format() {
    let result = get_subtitle_info("some content".to_string(), "xyz".to_string()).await;
    assert!(result.is_ok());

    let info = result.unwrap();
    assert_eq!(info.subtitle_count, 0);
    assert!(!info.has_styling);
  }

  #[test]
  fn test_subtitle_export_options_structure() {
    let options = SubtitleExportOptions {
      format: "srt".to_string(),
      content: "test content".to_string(),
      output_path: "/path/to/output.srt".to_string(),
    };

    assert_eq!(options.format, "srt");
    assert_eq!(options.content, "test content");
    assert_eq!(options.output_path, "/path/to/output.srt");

    // Test serialization
    let serialized = serde_json::to_string(&options).unwrap();
    assert!(serialized.contains("\"format\":\"srt\""));

    // Test deserialization
    let deserialized: SubtitleExportOptions = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.format, options.format);
  }

  #[test]
  fn test_subtitle_import_result_structure() {
    let result = SubtitleImportResult {
      content: "subtitle content".to_string(),
      format: "vtt".to_string(),
      file_name: "test.vtt".to_string(),
    };

    assert_eq!(result.content, "subtitle content");
    assert_eq!(result.format, "vtt");
    assert_eq!(result.file_name, "test.vtt");
  }

  #[test]
  fn test_subtitle_info_structure() {
    let info = SubtitleInfo {
      format: "ass".to_string(),
      subtitle_count: 10,
      duration: Some(120.5),
      has_styling: true,
    };

    assert_eq!(info.format, "ass");
    assert_eq!(info.subtitle_count, 10);
    assert_eq!(info.duration, Some(120.5));
    assert!(info.has_styling);
  }
}
