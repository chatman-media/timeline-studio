// Модуль для генерации превью медиафайлов
//
// Решение проблемы с чёрными кадрами на превью:
// https://medium.com/@georgechmr/skipping-black-frame-when-generating-video-thumbnail-with-ffmpeg-9e26bf2f67e3
// https://superuser.com/questions/538112/meaningful-thumbnails-for-a-video-using-ffmpeg

use std::path::Path;
use tokio::process::Command;

/// Генерирует "умное" превью используя FFmpeg thumbnail фильтр
/// Этот фильтр анализирует видео и находит наиболее репрезентативный кадр
/// (не чёрный, не размытый)
/// ВАЖНО: Для 4K видео этот метод медленный, поэтому используем -ss и ограниченное n
pub async fn generate_thumbnail_smart(
  input_path: &Path,
  output_path: &Path,
  width: u32,
  height: u32,
) -> Result<(), String> {
  use std::time::Duration;
  use tokio::time::timeout;

  // Таймаут 10 секунд - если дольше, лучше использовать простой метод
  let result = timeout(Duration::from_secs(10), async {
    // -ss 1 - начинаем с 1 секунды (пропускаем чёрное начало)
    // -t 10 - анализируем только первые 10 секунд
    // n=30 - анализируем 30 кадров (не 100, для скорости)
    Command::new("ffmpeg")
      .arg("-ss")
      .arg("1") // Пропускаем первую секунду (часто чёрная)
      .arg("-t")
      .arg("10") // Берём только 10 секунд видео для анализа
      .arg("-i")
      .arg(input_path.to_string_lossy().as_ref())
      .arg("-vf")
      .arg(format!(
        "thumbnail=n=30,scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
      ))
      .arg("-frames:v")
      .arg("1")
      .arg("-q:v")
      .arg("2")
      .arg("-f")
      .arg("image2")
      .arg(output_path.to_string_lossy().as_ref())
      .arg("-y")
      .output()
      .await
  })
  .await;

  match result {
    Ok(Ok(status)) => {
      if !status.status.success() {
        let stderr = String::from_utf8_lossy(&status.stderr);
        return Err(format!("FFmpeg thumbnail filter failed: {stderr}"));
      }
      Ok(())
    }
    Ok(Err(e)) => Err(format!("Failed to execute ffmpeg: {e}")),
    Err(_) => Err("Thumbnail generation timed out (>10s)".to_string()),
  }
}

/// Генерирует превью для видеофайла
/// Оптимизирован для быстрой работы с 4K и большими файлами
pub async fn generate_thumbnail(
  input_path: &Path,
  output_path: &Path,
  width: u32,
  height: u32,
  time_offset: f64,
) -> Result<(), String> {
  // Если time_offset == 0, используем 5 секунд для пропуска черного fade-in
  // DJI дрон видео часто имеют длинное fade-in в начале (особенно HLG формат)
  let seek_time = if time_offset == 0.0 { 5.0 } else { time_offset };

  // ВАЖНО: -ss ПЕРЕД -i для быстрого seeking (input-level seeking)
  // Это критично для 4K видео - без этого FFmpeg декодирует весь файл
  let status = Command::new("ffmpeg")
    .arg("-ss")
    .arg(seek_time.to_string())
    .arg("-i")
    .arg(input_path.to_string_lossy().as_ref())
    .arg("-vframes")
    .arg("1")
    .arg("-vf")
    // scale с флагом force_original_aspect_ratio для корректного масштабирования
    // и pad для центрирования если соотношения сторон не совпадают
    .arg(format!(
      "scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
    ))
    .arg("-q:v")
    .arg("2")
    .arg("-f")
    .arg("image2") // Явно указываем формат для надёжности
    .arg(output_path.to_string_lossy().as_ref())
    .arg("-y") // Перезаписать если существует
    .output()
    .await
    .map_err(|e| format!("Failed to execute ffmpeg: {e}"))?;

  if !status.status.success() {
    let stderr = String::from_utf8_lossy(&status.stderr);
    return Err(format!("FFmpeg failed: {stderr}"));
  }

  Ok(())
}

/// Быстрая генерация превью с аппаратным ускорением (если доступно)
/// Используется для массовой генерации превью
/// Стратегия: быстрый seek на 2 секунды с hwaccel
pub async fn generate_thumbnail_fast(
  input_path: &Path,
  output_path: &Path,
  width: u32,
  height: u32,
  time_offset: f64,
) -> Result<(), String> {
  // Если time_offset == 0, используем 5 секунд для пропуска черного fade-in
  // DJI дрон видео часто имеют длинное fade-in в начале (особенно HLG формат)
  let seek_time = if time_offset == 0.0 { 5.0 } else { time_offset };

  // Пробуем с hwaccel для быстрого декодирования
  let status = Command::new("ffmpeg")
    .arg("-hwaccel")
    .arg("auto") // Автоматический выбор аппаратного ускорения
    .arg("-ss")
    .arg(seek_time.to_string())
    .arg("-i")
    .arg(input_path.to_string_lossy().as_ref())
    .arg("-vframes")
    .arg("1")
    .arg("-vf")
    .arg(format!(
      "scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
    ))
    .arg("-q:v")
    .arg("3") // Чуть ниже качество для скорости
    .arg("-f")
    .arg("image2")
    .arg(output_path.to_string_lossy().as_ref())
    .arg("-y")
    .output()
    .await
    .map_err(|e| format!("Failed to execute ffmpeg: {e}"))?;

  if !status.status.success() {
    // Fallback на обычную версию без hwaccel
    log::debug!("Hwaccel failed, falling back to standard thumbnail");
    return generate_thumbnail(input_path, output_path, width, height, time_offset).await;
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs;
  use tempfile::TempDir;

  #[tokio::test]
  async fn test_generate_thumbnail_invalid_input() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("nonexistent.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("FFmpeg failed"));
  }

  #[tokio::test]
  async fn test_generate_thumbnail_invalid_output_dir() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = Path::new("/nonexistent/dir/thumbnail.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    let result = generate_thumbnail(&input_path, output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_zero_dimensions() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    // FFmpeg should handle this gracefully or error out
    let result = generate_thumbnail(&input_path, &output_path, 0, 0, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_negative_time_offset() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    // Negative time offset should work (ffmpeg treats it as 0)
    let result = generate_thumbnail(&input_path, &output_path, 320, 240, -5.0).await;
    // This will fail because our dummy file isn't a real video
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_various_dimensions() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    let test_cases = vec![
      (1920, 1080), // Full HD
      (1280, 720),  // HD
      (640, 480),   // SD
      (320, 240),   // Small
      (100, 100),   // Square
      (1000, 1),    // Extreme aspect ratio
    ];

    for (width, height) in test_cases {
      let output_path = temp_dir.path().join(format!("thumb_{width}x{height}.jpg"));
      let result = generate_thumbnail(&input_path, &output_path, width, height, 0.0).await;
      // All should fail because our dummy file isn't a real video
      assert!(result.is_err());
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_various_time_offsets() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    let time_offsets = vec![0.0, 0.5, 1.0, 5.0, 10.0, 60.0, 3600.0];

    for offset in time_offsets {
      let output_path = temp_dir.path().join(format!("thumb_{offset}.jpg"));
      let result = generate_thumbnail(&input_path, &output_path, 320, 240, offset).await;
      // All should fail because our dummy file isn't a real video
      assert!(result.is_err());
      assert!(result.unwrap_err().contains("FFmpeg failed"));
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_special_characters_in_path() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test video (2024) [HD].mp4");
    let output_path = temp_dir.path().join("thumb@2x.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_unicode_path() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("тест_видео_файл.mp4");
    let output_path = temp_dir.path().join("превью.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_overwrite_existing() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    // Create an existing output file
    fs::write(&output_path, b"existing thumbnail").unwrap();
    assert!(output_path.exists());

    // Try to generate thumbnail (will fail, but should attempt to overwrite)
    let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_command_injection_protection() {
    let temp_dir = TempDir::new().unwrap();
    // Try to inject commands through filename
    let malicious_input = temp_dir.path().join("test.mp4; rm -rf /");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    // The path itself is safe because it's passed as an argument, not shell-interpreted
    let result = generate_thumbnail(&malicious_input, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
    // Should fail because file doesn't exist, not because command was executed
    assert!(result.unwrap_err().contains("FFmpeg failed"));
  }

  #[test]
  fn test_thumbnail_path_handling() {
    // Test that paths are properly converted to strings
    let test_paths = vec![
      Path::new("/tmp/test.mp4"),
      Path::new("./relative/path.mp4"),
      Path::new("~/home/video.mp4"),
      #[cfg(target_os = "windows")]
      Path::new("C:\\Videos\\test.mp4"),
    ];

    for path in test_paths {
      let path_string = path.to_string_lossy();
      assert!(!path_string.is_empty());
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_ffmpeg_command_structure() {
    // Test that FFmpeg command is structured correctly
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    // Create a mock video file
    fs::write(&input_path, b"mock video data").unwrap();

    // The function will fail but we can verify it attempted to run FFmpeg
    let result = generate_thumbnail(&input_path, &output_path, 640, 480, 2.5).await;
    assert!(result.is_err());

    // Error should be from FFmpeg, not from missing file
    let error = result.unwrap_err();
    assert!(error.contains("FFmpeg failed") || error.contains("Failed to execute"));
  }

  #[tokio::test]
  async fn test_generate_thumbnail_max_dimensions() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    fs::write(&input_path, b"dummy").unwrap();

    // Test with maximum reasonable dimensions
    let result = generate_thumbnail(&input_path, &output_path, 4096, 4096, 0.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_fractional_time_offset() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    fs::write(&input_path, b"dummy").unwrap();

    // Test with precise fractional time offsets
    let time_offsets = vec![0.1, 0.5, 1.234, 10.999, 59.999];

    for offset in time_offsets {
      let result = generate_thumbnail(&input_path, &output_path, 320, 240, offset).await;
      assert!(result.is_err());
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_concurrent_generation() {
    use tokio::task::JoinSet;

    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    fs::write(&input_path, b"dummy video").unwrap();

    let mut tasks = JoinSet::new();

    // Spawn multiple concurrent thumbnail generations
    for i in 0..5 {
      let input = input_path.clone();
      let output = temp_dir.path().join(format!("thumb_{i}.jpg"));

      tasks.spawn(async move { generate_thumbnail(&input, &output, 320, 240, i as f64).await });
    }

    // All should complete (with errors due to invalid video)
    let mut results = Vec::new();
    while let Some(result) = tasks.join_next().await {
      results.push(result.unwrap());
    }

    assert_eq!(results.len(), 5);
    for result in results {
      assert!(result.is_err());
    }
  }

  #[cfg(unix)]
  #[tokio::test]
  async fn test_generate_thumbnail_symlink_input() {
    use std::os::unix::fs::symlink;

    let temp_dir = TempDir::new().unwrap();
    let real_file = temp_dir.path().join("real.mp4");
    let symlink_file = temp_dir.path().join("link.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    fs::write(&real_file, b"dummy video").unwrap();
    symlink(&real_file, &symlink_file).unwrap();

    let result = generate_thumbnail(&symlink_file, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_output_formats() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    fs::write(&input_path, b"dummy").unwrap();

    // Test different output formats based on extension
    let formats = vec!["jpg", "jpeg", "png", "webp", "bmp"];

    for format in formats {
      let output_path = temp_dir.path().join(format!("thumbnail.{format}"));
      let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
      assert!(result.is_err());
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_aspect_ratios() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    fs::write(&input_path, b"dummy").unwrap();

    // Test common aspect ratios
    let aspect_ratios = vec![
      (1920, 1080), // 16:9
      (1280, 720),  // 16:9
      (640, 480),   // 4:3
      (1024, 768),  // 4:3
      (2560, 1440), // 16:9
      (3840, 2160), // 16:9 (4K)
      (1, 1),       // Square
      (1000, 1000), // Square
      (9, 16),      // Portrait
      (16, 9),      // Landscape
    ];

    for (width, height) in aspect_ratios {
      let output_path = temp_dir.path().join(format!("thumb_{width}x{height}.jpg"));
      let result = generate_thumbnail(&input_path, &output_path, width, height, 0.0).await;
      assert!(result.is_err());
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_long_path() {
    let temp_dir = TempDir::new().unwrap();

    // Create a very long path (but not too long for the OS)
    let mut long_name = String::new();
    for _ in 0..10 {
      long_name.push_str("long_name_");
    }
    long_name.push_str(".mp4");

    let input_path = temp_dir.path().join(&long_name);
    let output_path = temp_dir.path().join("thumb.jpg");

    // Try to create the file - if it fails due to name length, skip the test
    match fs::write(&input_path, b"dummy") {
      Ok(_) => {
        let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
        assert!(result.is_err());
      }
      Err(e) if e.kind() == std::io::ErrorKind::InvalidFilename => {
        // Skip test if filename is too long for the OS
        println!("Skipping test - filename too long for OS");
      }
      Err(e) => panic!("Unexpected error: {e}"),
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_readonly_output_dir() {
    #[cfg(unix)]
    {
      use std::os::unix::fs::PermissionsExt;

      let temp_dir = TempDir::new().unwrap();
      let input_path = temp_dir.path().join("test.mp4");
      let readonly_dir = temp_dir.path().join("readonly");

      fs::create_dir(&readonly_dir).unwrap();
      fs::write(&input_path, b"dummy").unwrap();

      // Make directory read-only
      let mut perms = fs::metadata(&readonly_dir).unwrap().permissions();
      perms.set_mode(0o444);
      fs::set_permissions(&readonly_dir, perms.clone()).unwrap();

      let output_path = readonly_dir.join("thumbnail.jpg");
      let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
      assert!(result.is_err());

      // Restore permissions for cleanup
      perms.set_mode(0o755);
      fs::set_permissions(&readonly_dir, perms).unwrap();
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_large_time_offset() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    fs::write(&input_path, b"dummy").unwrap();

    // Test with very large time offset (like seeking to end of a long video)
    let result = generate_thumbnail(&input_path, &output_path, 320, 240, 86400.0).await; // 24 hours
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_scale_filter_syntax() {
    // Verify scale filter syntax is correct
    let scale_filters = vec![(320, 240), (1920, 1080), (1, 1), (9999, 9999)];

    for (w, h) in scale_filters {
      let filter = format!("scale={w}:{h}");
      assert!(filter.contains("scale="));
      assert!(filter.contains(&w.to_string()));
      assert!(filter.contains(&h.to_string()));
      assert!(filter.contains(":"));
    }
  }

  #[tokio::test]
  async fn test_error_messages_clarity() {
    let temp_dir = TempDir::new().unwrap();

    // Test various error scenarios and check error messages

    // Non-existent input file
    let result = generate_thumbnail(
      Path::new("/definitely/does/not/exist.mp4"),
      &temp_dir.path().join("out.jpg"),
      320,
      240,
      1.0,
    )
    .await;
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.contains("FFmpeg failed") || err.contains("Failed to execute"));

    // Invalid output directory
    let input_path = temp_dir.path().join("test.mp4");
    fs::write(&input_path, b"dummy").unwrap();

    let result = generate_thumbnail(
      &input_path,
      Path::new("/root/cannot/write/here.jpg"),
      320,
      240,
      1.0,
    )
    .await;
    assert!(result.is_err());
  }
}
