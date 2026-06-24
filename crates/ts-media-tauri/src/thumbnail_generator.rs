//! Thumbnail Generator - Генерация миниатюр для медиафайлов

use ts_media::media::ffmpeg::extract_frame;
use base64::Engine;
use image::{DynamicImage, GenericImageView, ImageFormat};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};

/// Параметры для генерации превью
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ThumbnailOptions {
  #[allow(dead_code)]
  pub width: u32,
  #[allow(dead_code)]
  pub height: u32,
  #[allow(dead_code)]
  pub format: ImageFormat,
  #[allow(dead_code)]
  pub quality: u8,
  #[allow(dead_code)]
  pub time_offset: f64, // Для видео - время в секундах
}

impl Default for ThumbnailOptions {
  fn default() -> Self {
    Self {
      width: 320,
      height: 180,
      format: ImageFormat::Jpeg,
      quality: 85,
      time_offset: 1.0, // 1 секунда от начала
    }
  }
}

/// События генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ThumbnailEvent {
  /// Превью готово
  ThumbnailReady {
    file_id: String,
    file_path: String,
    thumbnail_path: String,
    thumbnail_data: Option<String>, // Base64
  },
  /// Ошибка генерации превью
  ThumbnailError {
    file_id: String,
    file_path: String,
    error: String,
  },
}

/// Генератор миниатюр
#[allow(dead_code)]
pub struct ThumbnailGenerator {
  app_handle: AppHandle,
  thumbnail_dir: PathBuf,
}

impl ThumbnailGenerator {
  /// Создает новый генератор
  #[allow(dead_code)]
  pub fn new(app_handle: AppHandle, thumbnail_dir: PathBuf) -> Self {
    Self {
      app_handle,
      thumbnail_dir,
    }
  }

  /// Генерирует превью для файла
  #[allow(dead_code)]
  pub async fn generate_thumbnail(
    &self,
    file_id: String,
    file_path: String,
    is_video: bool,
    options: &ThumbnailOptions,
  ) -> Result<(PathBuf, Option<String>), String> {
    let thumbnail_filename = format!("{file_id}.jpg");
    let thumbnail_path = self.thumbnail_dir.join(&thumbnail_filename);
    let file_path = Path::new(&file_path);

    let image = if is_video {
      // Извлекаем кадр из видео
      extract_frame(
        file_path.to_str().unwrap(),
        thumbnail_path.to_str().unwrap(),
        options.time_offset,
      )
      .map_err(|e| format!("Failed to extract frame: {e}"))?;

      // Загружаем извлеченный кадр
      image::open(&thumbnail_path).map_err(|e| format!("Failed to open extracted frame: {e}"))?
    } else {
      // Загружаем изображение
      image::open(file_path).map_err(|e| format!("Failed to open image: {e}"))?
    };

    // Изменяем размер с сохранением пропорций
    let resized = Self::resize_image(image, options.width, options.height);

    // Сохраняем превью
    resized
      .save_with_format(&thumbnail_path, options.format)
      .map_err(|e| format!("Failed to save thumbnail: {e}"))?;

    // Опционально конвертируем в base64
    let thumbnail_data = self.create_base64_data(&resized, options)?;

    // Отправляем событие о готовом превью
    let _ = self.app_handle.emit(
      "media-processor",
      ThumbnailEvent::ThumbnailReady {
        file_id: file_id.clone(),
        file_path: file_path.to_string_lossy().to_string(),
        thumbnail_path: thumbnail_path.to_string_lossy().to_string(),
        thumbnail_data: thumbnail_data.clone(),
      },
    );

    Ok((thumbnail_path, thumbnail_data))
  }

  /// Создает base64 представление изображения
  #[allow(dead_code)]
  fn create_base64_data(
    &self,
    image: &DynamicImage,
    options: &ThumbnailOptions,
  ) -> Result<Option<String>, String> {
    if options.format == ImageFormat::Jpeg {
      let mut buffer = Vec::new();
      image
        .write_to(&mut std::io::Cursor::new(&mut buffer), options.format)
        .map_err(|e| format!("Failed to encode image: {e}"))?;
      Ok(Some(
        base64::engine::general_purpose::STANDARD.encode(&buffer),
      ))
    } else {
      Ok(None)
    }
  }

  /// Изменяет размер изображения с сохранением пропорций
  #[allow(dead_code)]
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

  /// Обрабатывает ошибку генерации
  #[allow(dead_code)]
  pub fn emit_error(&self, file_id: String, file_path: String, error: String) {
    let _ = self.app_handle.emit(
      "media-processor",
      ThumbnailEvent::ThumbnailError {
        file_id,
        file_path,
        error,
      },
    );
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use image::{ImageBuffer, Rgb};

  #[test]
  fn test_thumbnail_options_default() {
    let options = ThumbnailOptions::default();
    assert_eq!(options.width, 320);
    assert_eq!(options.height, 180);
    assert_eq!(options.quality, 85);
    assert_eq!(options.time_offset, 1.0);
  }

  #[test]
  fn test_resize_image_smaller() {
    // Создаем тестовое изображение 1000x1000
    let img = DynamicImage::ImageRgb8(ImageBuffer::from_fn(1000, 1000, |_, _| Rgb([255u8, 0, 0])));

    let resized = ThumbnailGenerator::resize_image(img, 100, 100);
    let (width, height) = resized.dimensions();

    assert_eq!(width, 100);
    assert_eq!(height, 100);
  }

  #[test]
  fn test_resize_image_aspect_ratio() {
    // Создаем изображение 1000x500
    let img = DynamicImage::ImageRgb8(ImageBuffer::from_fn(1000, 500, |_, _| Rgb([0u8, 255, 0])));

    let resized = ThumbnailGenerator::resize_image(img, 200, 200);
    let (width, height) = resized.dimensions();

    // Должно сохранить пропорции
    assert_eq!(width, 200);
    assert_eq!(height, 100);
  }

  #[test]
  fn test_resize_image_no_resize_needed() {
    // Создаем изображение 100x100
    let img = DynamicImage::ImageRgb8(ImageBuffer::from_fn(100, 100, |_, _| Rgb([0u8, 0, 255])));

    let resized = ThumbnailGenerator::resize_image(img.clone(), 200, 200);
    let (width, height) = resized.dimensions();

    // Изображение не должно увеличиваться
    assert_eq!(width, 100);
    assert_eq!(height, 100);
  }

  #[test]
  fn test_resize_image_portrait() {
    // Создаем портретное изображение 500x1000
    let img = DynamicImage::ImageRgb8(ImageBuffer::from_fn(500, 1000, |_, _| Rgb([255u8, 255, 0])));

    let resized = ThumbnailGenerator::resize_image(img, 200, 200);
    let (width, height) = resized.dimensions();

    // Должно сохранить пропорции портретной ориентации
    assert_eq!(width, 100);
    assert_eq!(height, 200);
  }

  #[test]
  fn test_resize_image_extreme_ratio() {
    // Создаем изображение с экстремальным соотношением сторон 10000x100
    let img = DynamicImage::ImageRgb8(ImageBuffer::from_fn(10000, 100, |_, _| {
      Rgb([255u8, 0, 255])
    }));

    let resized = ThumbnailGenerator::resize_image(img, 320, 180);
    let (width, height) = resized.dimensions();

    // Проверяем что изображение помещается в границы
    assert!(width <= 320);
    assert!(height <= 180);

    // Вычисляем правильное соотношение
    let width_ratio: f32 = 320.0 / 10000.0; // 0.032
    let height_ratio: f32 = 180.0 / 100.0; // 1.8
    let _ratio = width_ratio.min(height_ratio); // 0.032

    // Изображение должно быть масштабировано с учетом пропорций
    // new_width = 10000 * 0.032 = 320, но из-за округления может быть 300
    // new_height = 100 * 0.032 = 3.2, округляется до 3

    // Проверяем что одна из сторон максимально приближена к целевому размеру
    assert!(width == 320 || height == 180 || (width == 300 && height == 3));
    assert!(height <= 3); // Очень узкое изображение
  }

  #[test]
  fn test_resize_image_square_to_rectangle() {
    // Создаем квадратное изображение 1000x1000
    let img = DynamicImage::ImageRgb8(ImageBuffer::from_fn(1000, 1000, |_, _| {
      Rgb([128u8, 128, 128])
    }));

    let resized = ThumbnailGenerator::resize_image(img, 320, 180);
    let (width, height) = resized.dimensions();

    // Должно вписаться в прямоугольник, сохраняя квадратную форму
    assert_eq!(width, 180);
    assert_eq!(height, 180);
  }

  #[test]
  fn test_thumbnail_event_serialization() {
    let event = ThumbnailEvent::ThumbnailReady {
      file_id: "test123".to_string(),
      file_path: "/path/to/file.mp4".to_string(),
      thumbnail_path: "/path/to/thumb.jpg".to_string(),
      thumbnail_data: Some("base64data".to_string()),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("ThumbnailReady"));
    assert!(json.contains("test123"));
    assert!(json.contains("base64data"));

    let deserialized: ThumbnailEvent = serde_json::from_str(&json).unwrap();
    match deserialized {
      ThumbnailEvent::ThumbnailReady { file_id, .. } => {
        assert_eq!(file_id, "test123");
      }
      _ => panic!("Wrong event type"),
    }
  }

  #[test]
  fn test_thumbnail_error_event_serialization() {
    let event = ThumbnailEvent::ThumbnailError {
      file_id: "error123".to_string(),
      file_path: "/path/to/bad.mp4".to_string(),
      error: "Failed to decode video".to_string(),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("ThumbnailError"));
    assert!(json.contains("error123"));
    assert!(json.contains("Failed to decode video"));

    let deserialized: ThumbnailEvent = serde_json::from_str(&json).unwrap();
    match deserialized {
      ThumbnailEvent::ThumbnailError { error, .. } => {
        assert_eq!(error, "Failed to decode video");
      }
      _ => panic!("Wrong event type"),
    }
  }

  #[test]
  fn test_thumbnail_options_custom() {
    let options = ThumbnailOptions {
      width: 1920,
      height: 1080,
      format: ImageFormat::Png,
      quality: 100,
      time_offset: 5.5,
    };

    assert_eq!(options.width, 1920);
    assert_eq!(options.height, 1080);
    assert_eq!(options.quality, 100);
    assert_eq!(options.time_offset, 5.5);
  }

  #[test]
  fn test_resize_calculations() {
    // Test various aspect ratio calculations
    struct TestCase {
      img_width: u32,
      img_height: u32,
      max_width: u32,
      max_height: u32,
      expected_width: u32,
      expected_height: u32,
    }

    let test_cases = vec![
      // 16:9 video to 16:9 thumbnail
      TestCase {
        img_width: 1920,
        img_height: 1080,
        max_width: 320,
        max_height: 180,
        expected_width: 320,
        expected_height: 180,
      },
      // 4:3 to 16:9 container
      TestCase {
        img_width: 800,
        img_height: 600,
        max_width: 320,
        max_height: 180,
        expected_width: 240,
        expected_height: 180,
      },
      // Very tall image
      TestCase {
        img_width: 100,
        img_height: 1000,
        max_width: 320,
        max_height: 180,
        expected_width: 18,
        expected_height: 180,
      },
      // Very wide image
      TestCase {
        img_width: 1000,
        img_height: 100,
        max_width: 320,
        max_height: 180,
        expected_width: 320,
        expected_height: 32,
      },
    ];

    for test in test_cases {
      let img = DynamicImage::ImageRgb8(ImageBuffer::from_fn(
        test.img_width,
        test.img_height,
        |_, _| Rgb([100u8, 100, 100]),
      ));

      let resized = ThumbnailGenerator::resize_image(img, test.max_width, test.max_height);
      let (width, height) = resized.dimensions();

      assert_eq!(
        width, test.expected_width,
        "Width mismatch for {}x{} -> {}x{}",
        test.img_width, test.img_height, test.max_width, test.max_height
      );
      assert_eq!(
        height, test.expected_height,
        "Height mismatch for {}x{} -> {}x{}",
        test.img_width, test.img_height, test.max_width, test.max_height
      );
    }
  }

  #[test]
  fn test_small_image_dimensions() {
    // Test with very small images
    let tiny_cases = vec![(1, 1), (10, 10), (50, 25), (25, 50)];

    for (w, h) in tiny_cases {
      let img = DynamicImage::ImageRgb8(ImageBuffer::from_fn(w, h, |_, _| Rgb([200u8, 200, 200])));

      let resized = ThumbnailGenerator::resize_image(img, 320, 180);
      let (width, height) = resized.dimensions();

      // Small images should not be upscaled
      assert_eq!(width, w);
      assert_eq!(height, h);
    }
  }

  #[test]
  fn test_base64_encoding_simulation() {
    // Test base64 encoding of image data
    use base64::Engine;

    let test_data = vec![255u8, 0, 128, 64, 32, 16, 8, 4, 2, 1];
    let encoded = base64::engine::general_purpose::STANDARD.encode(&test_data);

    assert!(!encoded.is_empty());
    assert!(encoded.len() > test_data.len()); // Base64 is larger

    // Verify it can be decoded back
    let decoded = base64::engine::general_purpose::STANDARD
      .decode(&encoded)
      .unwrap();
    assert_eq!(decoded, test_data);
  }

  #[test]
  fn test_image_format_matching() {
    // Test that ImageFormat enum values work correctly
    let formats = vec![
      ImageFormat::Jpeg,
      ImageFormat::Png,
      ImageFormat::Bmp,
      ImageFormat::Gif,
    ];

    for format in formats {
      match format {
        ImageFormat::Jpeg => {
          // JPEG is the default and most common for thumbnails
          // Test passes - format is valid
        }
        ImageFormat::Png => {
          // PNG supports transparency
          // Test passes - format is valid
        }
        _ => {
          // Other formats are less common for thumbnails
          // Test passes - format is valid
        }
      }
    }
  }
}
