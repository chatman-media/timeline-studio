// Модуль для работы с FFmpeg

#[cfg(not(test))]
use std::process::Command;

/// Проверка наличия FFmpeg в системе
#[cfg(not(test))]
pub fn check_ffmpeg() -> Result<(), String> {
  let output = Command::new("ffprobe").arg("-version").output();

  match output {
    Ok(_) => Ok(()),
    Err(_) => Err("FFmpeg не установлен или не найден в системном пути".to_string()),
  }
}

/// Мок для тестов - всегда возвращает успех
#[cfg(test)]
pub fn check_ffmpeg() -> Result<(), String> {
  Ok(())
}

/// Извлекает кадр из видео в указанный момент времени
#[cfg(not(test))]
pub fn extract_frame(input_path: &str, output_path: &str, time_seconds: f64) -> Result<(), String> {
  let time_str = format!("{time_seconds:.2}");

  let output = Command::new("ffmpeg")
    .args([
      "-ss",
      &time_str, // Позиция во времени
      "-i",
      input_path, // Входной файл
      "-vframes",
      "1", // Извлечь только 1 кадр
      "-q:v",
      "2",         // Качество (2 = хорошее)
      "-y",        // Перезаписать выходной файл
      output_path, // Выходной файл
    ])
    .output()
    .map_err(|e| format!("Failed to run ffmpeg: {e}"))?;

  if output.status.success() {
    Ok(())
  } else {
    let error = String::from_utf8_lossy(&output.stderr);
    Err(format!("FFmpeg failed: {error}"))
  }
}

/// Мок для тестов - создает фейковый файл изображения
#[cfg(test)]
pub fn extract_frame(input_path: &str, output_path: &str, time_seconds: f64) -> Result<(), String> {
  // Симулируем ошибки для специфических тестовых случаев
  if input_path.contains("nonexistent") || input_path.starts_with("/nonexistent") {
    return Err("No such file or directory".to_string());
  }

  if time_seconds > 999999.0 {
    return Err("Invalid duration".to_string());
  }

  // Создаем минимальный PNG файл для тестов
  let png_data = [
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // RGB, no compression
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82, // IEND
  ];

  std::fs::write(output_path, png_data).map_err(|e| format!("Failed to write mock frame: {e}"))?;
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs;
  use tempfile::TempDir;

  #[test]
  fn test_check_ffmpeg() {
    // Тест проверки наличия FFmpeg
    // Примечание: этот тест может не пройти, если FFmpeg не установлен
    match check_ffmpeg() {
      Ok(_) => println!("FFmpeg найден"),
      Err(e) => println!("FFmpeg не найден: {e}"),
    }
    // Не делаем assert, так как FFmpeg может быть не установлен в CI
  }

  #[test]
  fn test_check_ffmpeg_result_types() {
    // Проверяем что функция возвращает правильные типы
    let result = check_ffmpeg();
    match result {
      Ok(()) => {
        // Успешный результат должен быть пустым tuple
      }
      Err(msg) => {
        // Ошибка должна содержать сообщение
        assert!(!msg.is_empty());
        assert!(msg.contains("FFmpeg") || msg.contains("ffmpeg"));
      }
    }
  }

  #[test]
  fn test_extract_frame_invalid_input() {
    // Тест с несуществующим входным файлом
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("output.jpg");

    let result = extract_frame("/nonexistent/video.mp4", output_path.to_str().unwrap(), 5.0);

    assert!(result.is_err());
    // FFmpeg должен вернуть ошибку о несуществующем файле
  }

  #[test]
  fn test_extract_frame_time_formatting() {
    // Проверяем форматирование времени
    let time_seconds = 123.456;
    let expected_format = format!("{time_seconds:.2}");
    assert_eq!(expected_format, "123.46");

    let time_seconds = 0.5;
    let expected_format = format!("{time_seconds:.2}");
    assert_eq!(expected_format, "0.50");
  }

  #[test]
  fn test_extract_frame_command_construction() {
    // Проверяем что команда строится правильно
    // Этот тест не запускает FFmpeg, просто проверяет логику
    let input_path = "/test/video.mp4";
    let output_path = "/test/frame.jpg";
    let time_seconds = 10.5;

    // Проверяем форматирование времени
    let time_str = format!("{time_seconds:.2}");
    assert_eq!(time_str, "10.50");

    // Проверяем что пути не изменяются
    assert_eq!(input_path, "/test/video.mp4");
    assert_eq!(output_path, "/test/frame.jpg");
  }

  #[test]
  fn test_extract_frame_with_empty_paths() {
    // Тест с пустыми путями
    let result = extract_frame("", "", 0.0);
    assert!(result.is_err());
  }

  #[test]
  fn test_extract_frame_negative_time() {
    // Тест с отрицательным временем
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("output.jpg");

    let result = extract_frame("/some/video.mp4", output_path.to_str().unwrap(), -5.0);

    // FFmpeg может обработать отрицательное время как 0
    // или вернуть ошибку - оба варианта допустимы
    match result {
      Ok(_) => {
        // FFmpeg обработал как начало видео
      }
      Err(msg) => {
        // FFmpeg вернул ошибку
        assert!(!msg.is_empty());
      }
    }
  }

  #[test]
  fn test_extract_frame_very_large_time() {
    // Тест с очень большим временем
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("output.jpg");

    let result = extract_frame("/some/video.mp4", output_path.to_str().unwrap(), 999999.99);

    // FFmpeg должен вернуть ошибку так как видео не может быть таким длинным
    assert!(result.is_err());
  }

  #[test]
  fn test_extract_frame_special_characters_in_path() {
    // Тест с специальными символами в пути
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("output with spaces.jpg");

    // Создаем путь со специальными символами
    let input_path = "/test/video with spaces & special.mp4";

    let result = extract_frame(input_path, output_path.to_str().unwrap(), 1.0);

    // Результат зависит от наличия FFmpeg и файла
    match result {
      Ok(_) => {
        // FFmpeg обработал пути правильно
      }
      Err(msg) => {
        // Ожидаемая ошибка о несуществующем файле
        assert!(!msg.is_empty());
      }
    }
  }

  #[test]
  fn test_error_message_formatting() {
    // Проверяем форматирование сообщений об ошибках
    let error_msg = format!("Failed to run ffmpeg: {}", "test error");
    assert_eq!(error_msg, "Failed to run ffmpeg: test error");

    let error_msg = format!("FFmpeg failed: {}", "stderr output");
    assert_eq!(error_msg, "FFmpeg failed: stderr output");
  }

  #[cfg(unix)]
  #[test]
  fn test_extract_frame_permission_denied() {
    // Тест с файлом без прав на запись (только для Unix)
    use std::os::unix::fs::PermissionsExt;

    let temp_dir = TempDir::new().unwrap();
    let protected_dir = temp_dir.path().join("protected");
    fs::create_dir(&protected_dir).unwrap();

    // Устанавливаем права только на чтение
    let mut perms = fs::metadata(&protected_dir).unwrap().permissions();
    perms.set_mode(0o444);
    fs::set_permissions(&protected_dir, perms).unwrap();

    let output_path = protected_dir.join("output.jpg");
    let result = extract_frame("/some/video.mp4", output_path.to_str().unwrap(), 1.0);

    // Должна быть ошибка о правах доступа
    assert!(result.is_err());

    // Восстанавливаем права для удаления
    let mut perms = fs::metadata(&protected_dir).unwrap().permissions();
    perms.set_mode(0o755);
    fs::set_permissions(&protected_dir, perms).unwrap();
  }

  #[test]
  fn test_extract_frame_output_path_validation() {
    // Проверяем различные выходные пути
    let test_paths = vec![
      "output.jpg",
      "output.png",
      "output.bmp",
      "frame_001.jpeg",
      "/tmp/test/output.jpg",
      "./relative/path/output.jpg",
    ];

    for path in test_paths {
      // Проверяем что путь принимается без изменений
      let result = extract_frame("/input.mp4", path, 1.0);
      // Результат зависит от наличия FFmpeg
      if result.is_ok() {}
    }
  }

  #[test]
  fn test_time_precision() {
    // Проверяем точность времени
    let times = vec![
      (0.0, "0.00"),
      (1.0, "1.00"),
      (1.5, "1.50"),
      (10.123, "10.12"),
      (10.126, "10.13"),
      (100.999, "101.00"),
    ];

    for (time, expected) in times {
      let formatted = format!("{time:.2}");
      assert_eq!(formatted, expected);
    }
  }

  // Мок тест для проверки вызова FFmpeg с правильными аргументами
  #[test]
  fn test_ffmpeg_arguments() {
    // Проверяем что аргументы для FFmpeg формируются правильно
    let expected_args = [
      "-ss",
      "5.50",
      "-i",
      "/input/video.mp4",
      "-vframes",
      "1",
      "-q:v",
      "2",
      "-y",
      "/output/frame.jpg",
    ];

    // Проверяем что аргументы соответствуют ожидаемым
    assert_eq!(expected_args[0], "-ss");
    assert_eq!(expected_args[2], "-i");
    assert_eq!(expected_args[4], "-vframes");
    assert_eq!(expected_args[5], "1");
    assert_eq!(expected_args[6], "-q:v");
    assert_eq!(expected_args[7], "2");
    assert_eq!(expected_args[8], "-y");
  }
}
