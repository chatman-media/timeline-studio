/**
 * Privacy Processor - Face blurring and anonymization
 */
use anyhow::Result;
use image::{DynamicImage, GenericImage, GenericImageView, ImageBuffer, Rgba};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// Определяем свой BoundingBox так как у YOLO другой формат
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  pub x1: f32,
  pub y1: f32,
  pub x2: f32,
  pub y2: f32,
}

/// Типы размытия
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BlurType {
  /// Гауссово размытие
  Gaussian { radius: f32 },
  /// Боксовое размытие
  Box { size: u32 },
  /// Пикселизация
  Pixelate { pixel_size: u32 },
  /// Черная полоса на глазах
  EyeBar { height_ratio: f32 },
  /// Полная замена цветом
  SolidColor { color: [u8; 4] },
  /// Мозаика
  Mosaic { tile_size: u32 },
}

/// Настройки приватности
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacySettings {
  /// Тип размытия
  pub blur_type: BlurType,
  /// Расширение области размытия (1.0 = без расширения)
  pub expand_ratio: f32,
  /// Сохранять ли оригинальные метаданные
  pub preserve_metadata: bool,
  /// Применять ли адаптивное размытие
  pub adaptive_blur: bool,
}

impl Default for PrivacySettings {
  fn default() -> Self {
    Self {
      blur_type: BlurType::Gaussian { radius: 20.0 },
      expand_ratio: 1.2,
      preserve_metadata: false,
      adaptive_blur: true,
    }
  }
}

/// Privacy процессор
pub struct PrivacyProcessor {
  settings: PrivacySettings,
}

impl PrivacyProcessor {
  /// Создать новый процессор
  pub fn new(settings: PrivacySettings) -> Self {
    Self { settings }
  }

  /// Размыть лица на изображении
  pub fn blur_faces(
    &self,
    image: &DynamicImage,
    face_boxes: &[BoundingBox],
  ) -> Result<DynamicImage> {
    let mut result = image.clone();

    for bbox in face_boxes {
      // Расширяем bbox согласно настройкам
      let expanded_bbox = self.expand_bbox(bbox, image.width(), image.height());

      // Применяем размытие
      match &self.settings.blur_type {
        BlurType::Gaussian { radius } => {
          self.apply_gaussian_blur(&mut result, &expanded_bbox, *radius)?;
        }
        BlurType::Box { size } => {
          self.apply_box_blur(&mut result, &expanded_bbox, *size)?;
        }
        BlurType::Pixelate { pixel_size } => {
          self.apply_pixelation(&mut result, &expanded_bbox, *pixel_size)?;
        }
        BlurType::EyeBar { height_ratio } => {
          self.apply_eye_bar(&mut result, &expanded_bbox, *height_ratio)?;
        }
        BlurType::SolidColor { color } => {
          self.apply_solid_color(&mut result, &expanded_bbox, *color)?;
        }
        BlurType::Mosaic { tile_size } => {
          self.apply_mosaic(&mut result, &expanded_bbox, *tile_size)?;
        }
      }
    }

    Ok(result)
  }

  /// Расширить bbox
  fn expand_bbox(&self, bbox: &BoundingBox, img_width: u32, img_height: u32) -> BoundingBox {
    let width = bbox.x2 - bbox.x1;
    let height = bbox.y2 - bbox.y1;

    let expand_x = width * (self.settings.expand_ratio - 1.0) / 2.0;
    let expand_y = height * (self.settings.expand_ratio - 1.0) / 2.0;

    BoundingBox {
      x1: (bbox.x1 - expand_x).max(0.0),
      y1: (bbox.y1 - expand_y).max(0.0),
      x2: (bbox.x2 + expand_x).min(img_width as f32),
      y2: (bbox.y2 + expand_y).min(img_height as f32),
    }
  }

  /// Применить гауссово размытие
  fn apply_gaussian_blur(
    &self,
    image: &mut DynamicImage,
    bbox: &BoundingBox,
    radius: f32,
  ) -> Result<()> {
    use imageproc::filter::gaussian_blur_f32;

    // Извлекаем область лица
    let x = bbox.x1 as u32;
    let y = bbox.y1 as u32;
    let width = (bbox.x2 - bbox.x1) as u32;
    let height = (bbox.y2 - bbox.y1) as u32;

    if width == 0 || height == 0 {
      return Ok(());
    }

    // Получаем подизображение
    let face_region = image.crop_imm(x, y, width, height);

    // Применяем размытие
    let blurred = gaussian_blur_f32(&face_region.to_rgba8(), radius);

    // Копируем обратно
    image.copy_from(&blurred, x, y)?;

    Ok(())
  }

  /// Применить боксовое размытие
  fn apply_box_blur(&self, image: &mut DynamicImage, bbox: &BoundingBox, size: u32) -> Result<()> {
    let x = bbox.x1 as u32;
    let y = bbox.y1 as u32;
    let width = (bbox.x2 - bbox.x1) as u32;
    let height = (bbox.y2 - bbox.y1) as u32;

    if width == 0 || height == 0 {
      return Ok(());
    }

    // Простое боксовое размытие
    let face_region = image.crop_imm(x, y, width, height);
    let rgba = face_region.to_rgba8();
    let mut blurred = ImageBuffer::new(width, height);

    let kernel_size = size as i32;
    let half_kernel = kernel_size / 2;

    for (px, py, pixel) in blurred.enumerate_pixels_mut() {
      let mut r_sum = 0u32;
      let mut g_sum = 0u32;
      let mut b_sum = 0u32;
      let mut a_sum = 0u32;
      let mut count = 0u32;

      for ky in -half_kernel..=half_kernel {
        for kx in -half_kernel..=half_kernel {
          let sx = (px as i32 + kx).clamp(0, width as i32 - 1) as u32;
          let sy = (py as i32 + ky).clamp(0, height as i32 - 1) as u32;

          let src_pixel = rgba.get_pixel(sx, sy);
          r_sum += src_pixel[0] as u32;
          g_sum += src_pixel[1] as u32;
          b_sum += src_pixel[2] as u32;
          a_sum += src_pixel[3] as u32;
          count += 1;
        }
      }

      *pixel = Rgba([
        (r_sum / count) as u8,
        (g_sum / count) as u8,
        (b_sum / count) as u8,
        (a_sum / count) as u8,
      ]);
    }

    image.copy_from(&blurred, x, y)?;
    Ok(())
  }

  /// Применить пикселизацию
  fn apply_pixelation(
    &self,
    image: &mut DynamicImage,
    bbox: &BoundingBox,
    pixel_size: u32,
  ) -> Result<()> {
    let x = bbox.x1 as u32;
    let y = bbox.y1 as u32;
    let width = (bbox.x2 - bbox.x1) as u32;
    let height = (bbox.y2 - bbox.y1) as u32;

    if width == 0 || height == 0 || pixel_size == 0 {
      return Ok(());
    }

    // Пикселизация через уменьшение и увеличение
    for py in (0..height).step_by(pixel_size as usize) {
      for px in (0..width).step_by(pixel_size as usize) {
        // Вычисляем средний цвет блока
        let mut r_sum = 0u32;
        let mut g_sum = 0u32;
        let mut b_sum = 0u32;
        let mut a_sum = 0u32;
        let mut count = 0u32;

        for dy in 0..pixel_size.min(height - py) {
          for dx in 0..pixel_size.min(width - px) {
            let pixel = image.get_pixel(x + px + dx, y + py + dy);
            r_sum += pixel[0] as u32;
            g_sum += pixel[1] as u32;
            b_sum += pixel[2] as u32;
            a_sum += pixel[3] as u32;
            count += 1;
          }
        }

        if count > 0 {
          let avg_color = Rgba([
            (r_sum / count) as u8,
            (g_sum / count) as u8,
            (b_sum / count) as u8,
            (a_sum / count) as u8,
          ]);

          // Заполняем блок средним цветом
          for dy in 0..pixel_size.min(height - py) {
            for dx in 0..pixel_size.min(width - px) {
              image.put_pixel(x + px + dx, y + py + dy, avg_color);
            }
          }
        }
      }
    }

    Ok(())
  }

  /// Применить черную полосу на глаза
  fn apply_eye_bar(
    &self,
    image: &mut DynamicImage,
    bbox: &BoundingBox,
    height_ratio: f32,
  ) -> Result<()> {
    let x = bbox.x1 as u32;
    let y = bbox.y1 as u32;
    let width = (bbox.x2 - bbox.x1) as u32;
    let height = (bbox.y2 - bbox.y1) as u32;

    if width == 0 || height == 0 {
      return Ok(());
    }

    // Полоса на глаза обычно в верхней трети лица
    let bar_y = y + (height as f32 * 0.25) as u32;
    let bar_height = (height as f32 * height_ratio) as u32;

    // Черная полоса
    let black = Rgba([0, 0, 0, 255]);

    for py in bar_y..bar_y + bar_height {
      for px in x..x + width {
        if py < image.height() {
          image.put_pixel(px, py, black);
        }
      }
    }

    Ok(())
  }

  /// Применить сплошной цвет
  fn apply_solid_color(
    &self,
    image: &mut DynamicImage,
    bbox: &BoundingBox,
    color: [u8; 4],
  ) -> Result<()> {
    let x = bbox.x1 as u32;
    let y = bbox.y1 as u32;
    let width = (bbox.x2 - bbox.x1) as u32;
    let height = (bbox.y2 - bbox.y1) as u32;

    if width == 0 || height == 0 {
      return Ok(());
    }

    let fill_color = Rgba(color);

    // Заполняем область цветом
    for py in y..y + height {
      for px in x..x + width {
        if px < image.width() && py < image.height() {
          image.put_pixel(px, py, fill_color);
        }
      }
    }

    Ok(())
  }

  /// Применить мозаику
  fn apply_mosaic(
    &self,
    image: &mut DynamicImage,
    bbox: &BoundingBox,
    tile_size: u32,
  ) -> Result<()> {
    // Мозаика - это вариация пикселизации с случайным смещением
    self.apply_pixelation(image, bbox, tile_size)
  }

  /// Размыть лица из файла
  pub fn blur_faces_in_file(
    &self,
    input_path: &PathBuf,
    output_path: &PathBuf,
    face_boxes: &[BoundingBox],
  ) -> Result<()> {
    let image = image::open(input_path)?;
    let blurred = self.blur_faces(&image, face_boxes)?;
    blurred.save(output_path)?;
    Ok(())
  }

  /// Получить настройки
  pub fn get_settings(&self) -> &PrivacySettings {
    &self.settings
  }

  /// Обновить настройки
  pub fn update_settings(&mut self, settings: PrivacySettings) {
    self.settings = settings;
  }
}

/// Дополнительные функции приватности
impl PrivacyProcessor {
  /// Проверить, нужно ли размывать лицо на основе размера
  pub fn should_blur_face(&self, bbox: &BoundingBox, min_face_size: f32) -> bool {
    let face_width = bbox.x2 - bbox.x1;
    let face_height = bbox.y2 - bbox.y1;
    let face_area = face_width * face_height;

    face_area >= min_face_size * min_face_size
  }

  /// Применить адаптивное размытие (сильнее для больших лиц)
  pub fn get_adaptive_blur_strength(&self, bbox: &BoundingBox, image_size: (u32, u32)) -> f32 {
    if !self.settings.adaptive_blur {
      return 1.0;
    }

    let face_width = bbox.x2 - bbox.x1;
    let face_height = bbox.y2 - bbox.y1;
    let face_area = face_width * face_height;

    let image_area = image_size.0 as f32 * image_size.1 as f32;
    let face_ratio = face_area / image_area;

    // Чем больше лицо, тем сильнее размытие
    (face_ratio * 10.0).clamp(0.5, 2.0)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_privacy_processor_creation() {
    let settings = PrivacySettings::default();
    let processor = PrivacyProcessor::new(settings.clone());
    assert_eq!(processor.get_settings().expand_ratio, 1.2);
  }

  #[test]
  fn test_bbox_expansion() {
    let processor = PrivacyProcessor::new(PrivacySettings::default());
    let bbox = BoundingBox {
      x1: 100.0,
      y1: 100.0,
      x2: 200.0,
      y2: 200.0,
    };

    let expanded = processor.expand_bbox(&bbox, 500, 500);
    assert!(expanded.x1 < bbox.x1);
    assert!(expanded.y1 < bbox.y1);
    assert!(expanded.x2 > bbox.x2);
    assert!(expanded.y2 > bbox.y2);
  }

  #[test]
  fn test_blur_types() {
    let types = vec![
      BlurType::Gaussian { radius: 10.0 },
      BlurType::Box { size: 5 },
      BlurType::Pixelate { pixel_size: 10 },
      BlurType::EyeBar { height_ratio: 0.3 },
      BlurType::SolidColor {
        color: [0, 0, 0, 255],
      },
      BlurType::Mosaic { tile_size: 8 },
    ];

    for blur_type in types {
      let settings = PrivacySettings {
        blur_type,
        ..Default::default()
      };
      let processor = PrivacyProcessor::new(settings);
      assert!(processor.get_settings().expand_ratio > 0.0);
    }
  }

  #[test]
  fn test_should_blur_face() {
    let processor = PrivacyProcessor::new(PrivacySettings::default());

    let small_face = BoundingBox {
      x1: 0.0,
      y1: 0.0,
      x2: 20.0,
      y2: 20.0,
    };

    let large_face = BoundingBox {
      x1: 0.0,
      y1: 0.0,
      x2: 100.0,
      y2: 100.0,
    };

    assert!(!processor.should_blur_face(&small_face, 50.0));
    assert!(processor.should_blur_face(&large_face, 50.0));
  }

  #[test]
  fn test_adaptive_blur_strength() {
    let settings = PrivacySettings {
      adaptive_blur: true,
      ..Default::default()
    };
    let processor = PrivacyProcessor::new(settings);

    let small_face = BoundingBox {
      x1: 0.0,
      y1: 0.0,
      x2: 50.0,
      y2: 50.0,
    };

    let large_face = BoundingBox {
      x1: 0.0,
      y1: 0.0,
      x2: 300.0,
      y2: 300.0,
    };

    let small_strength = processor.get_adaptive_blur_strength(&small_face, (1000, 1000));
    let large_strength = processor.get_adaptive_blur_strength(&large_face, (1000, 1000));

    assert!(large_strength > small_strength);
  }
}
