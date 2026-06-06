//! Common - Общие типы и утилиты

use serde::{Deserialize, Serialize};
use std::fmt;

/// Соотношение сторон видео
#[derive(Serialize, Deserialize, Debug, Clone, Default, PartialEq)]
pub enum AspectRatio {
  #[default]
  Ratio16x9, // 16:9 (широкоформатное)
  Ratio4x3,    // 4:3 (стандартное)
  Ratio21x9,   // 21:9 (ультраширокое)
  Ratio1x1,    // 1:1 (квадратное)
  Ratio9x16,   // 9:16 (вертикальное для мобильных)
  Custom(f32), // Произвольное соотношение
}

impl fmt::Display for AspectRatio {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    let s = match self {
      AspectRatio::Ratio16x9 => "16:9".to_string(),
      AspectRatio::Ratio4x3 => "4:3".to_string(),
      AspectRatio::Ratio21x9 => "21:9".to_string(),
      AspectRatio::Ratio1x1 => "1:1".to_string(),
      AspectRatio::Ratio9x16 => "9:16".to_string(),
      AspectRatio::Custom(ratio) => format!("{ratio:.2}:1"),
    };
    write!(f, "{s}")
  }
}

impl AspectRatio {
  /// Преобразовать в строку для FFmpeg
  pub fn to_ffmpeg_string(&self) -> String {
    format!("{self}")
  }
}

/// Разрешение видео
#[derive(Serialize, Deserialize, Debug, Clone, Default, PartialEq)]
pub struct Resolution {
  pub width: u32,
  pub height: u32,
}

impl Resolution {
  pub fn new(width: u32, height: u32) -> Self {
    Self { width, height }
  }

  /// Стандартные разрешения
  pub fn hd() -> Self {
    Self {
      width: 1280,
      height: 720,
    }
  }

  pub fn full_hd() -> Self {
    Self {
      width: 1920,
      height: 1080,
    }
  }

  pub fn uhd_4k() -> Self {
    Self {
      width: 3840,
      height: 2160,
    }
  }
}

/// Позиция в 2D пространстве
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Position2D {
  pub x: f32,
  pub y: f32,
}

/// Размер в 2D пространстве
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Size2D {
  pub width: f32,
  pub height: f32,
}

/// Режим подгонки контента
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum FitMode {
  /// Заполнить весь контейнер (может обрезать)
  Fill,
  /// Вписать полностью (могут быть полосы)
  Fit,
  /// Растянуть до размеров контейнера
  Stretch,
  /// Оригинальный размер
  None,
}

/// Выравнивание по горизонтали
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum AlignX {
  Left,
  Center,
  Right,
}

/// Выравнивание по вертикали
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum AlignY {
  Top,
  Center,
  Bottom,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_aspect_ratio_default() {
    let ratio = AspectRatio::default();
    assert_eq!(ratio, AspectRatio::Ratio16x9);
  }

  #[test]
  fn test_aspect_ratio_display() {
    assert_eq!(AspectRatio::Ratio16x9.to_string(), "16:9");
    assert_eq!(AspectRatio::Ratio4x3.to_string(), "4:3");
    assert_eq!(AspectRatio::Ratio21x9.to_string(), "21:9");
    assert_eq!(AspectRatio::Ratio1x1.to_string(), "1:1");
    assert_eq!(AspectRatio::Ratio9x16.to_string(), "9:16");
    assert_eq!(AspectRatio::Custom(2.35).to_string(), "2.35:1");
    assert_eq!(AspectRatio::Custom(1.778).to_string(), "1.78:1");
  }

  #[test]
  fn test_aspect_ratio_to_ffmpeg_string() {
    assert_eq!(AspectRatio::Ratio16x9.to_ffmpeg_string(), "16:9");
    assert_eq!(AspectRatio::Ratio4x3.to_ffmpeg_string(), "4:3");
    assert_eq!(AspectRatio::Custom(2.0).to_ffmpeg_string(), "2.00:1");
  }

  #[test]
  fn test_aspect_ratio_equality() {
    assert_eq!(AspectRatio::Ratio16x9, AspectRatio::Ratio16x9);
    assert_ne!(AspectRatio::Ratio16x9, AspectRatio::Ratio4x3);
    assert_eq!(AspectRatio::Custom(1.5), AspectRatio::Custom(1.5));
    assert_ne!(AspectRatio::Custom(1.5), AspectRatio::Custom(1.6));
  }

  #[test]
  fn test_aspect_ratio_serialization() {
    let ratio = AspectRatio::Ratio21x9;
    let serialized = serde_json::to_string(&ratio).unwrap();
    let deserialized: AspectRatio = serde_json::from_str(&serialized).unwrap();
    assert_eq!(ratio, deserialized);

    // Test custom ratio
    let custom = AspectRatio::Custom(2.4);
    let serialized = serde_json::to_string(&custom).unwrap();
    let deserialized: AspectRatio = serde_json::from_str(&serialized).unwrap();
    assert_eq!(custom, deserialized);
  }

  #[test]
  fn test_resolution_new() {
    let res = Resolution::new(1920, 1080);
    assert_eq!(res.width, 1920);
    assert_eq!(res.height, 1080);
  }

  #[test]
  fn test_resolution_presets() {
    let hd = Resolution::hd();
    assert_eq!(hd.width, 1280);
    assert_eq!(hd.height, 720);

    let full_hd = Resolution::full_hd();
    assert_eq!(full_hd.width, 1920);
    assert_eq!(full_hd.height, 1080);

    let uhd_4k = Resolution::uhd_4k();
    assert_eq!(uhd_4k.width, 3840);
    assert_eq!(uhd_4k.height, 2160);
  }

  #[test]
  fn test_resolution_default() {
    let res = Resolution::default();
    assert_eq!(res.width, 0);
    assert_eq!(res.height, 0);
  }

  #[test]
  fn test_resolution_serialization() {
    let res = Resolution::new(2560, 1440);
    let serialized = serde_json::to_string(&res).unwrap();
    assert!(serialized.contains("2560"));
    assert!(serialized.contains("1440"));

    let deserialized: Resolution = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.width, res.width);
    assert_eq!(deserialized.height, res.height);
  }

  #[test]
  fn test_position2d() {
    let pos = Position2D { x: 10.5, y: 20.3 };
    assert_eq!(pos.x, 10.5);
    assert_eq!(pos.y, 20.3);

    // Test serialization
    let serialized = serde_json::to_string(&pos).unwrap();
    let deserialized: Position2D = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.x, pos.x);
    assert_eq!(deserialized.y, pos.y);
  }

  #[test]
  fn test_position2d_negative_values() {
    let pos = Position2D {
      x: -100.0,
      y: -50.5,
    };
    assert_eq!(pos.x, -100.0);
    assert_eq!(pos.y, -50.5);
  }

  #[test]
  fn test_size2d() {
    let size = Size2D {
      width: 640.0,
      height: 480.0,
    };
    assert_eq!(size.width, 640.0);
    assert_eq!(size.height, 480.0);

    // Test serialization
    let serialized = serde_json::to_string(&size).unwrap();
    let deserialized: Size2D = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.width, size.width);
    assert_eq!(deserialized.height, size.height);
  }

  #[test]
  fn test_fit_mode_variants() {
    let modes = vec![FitMode::Fill, FitMode::Fit, FitMode::Stretch, FitMode::None];

    for mode in modes {
      let serialized = serde_json::to_string(&mode).unwrap();
      let deserialized: FitMode = serde_json::from_str(&serialized).unwrap();
      match (mode, deserialized) {
        (FitMode::Fill, FitMode::Fill) => {} // Valid enum variant comparison,
        (FitMode::Fit, FitMode::Fit) => {}   // Valid enum variant comparison,
        (FitMode::Stretch, FitMode::Stretch) => {} // Valid enum variant comparison,
        (FitMode::None, FitMode::None) => {} // Valid enum variant comparison,
        _ => panic!("FitMode serialization mismatch"),
      }
    }
  }

  #[test]
  fn test_align_x_variants() {
    let alignments = vec![AlignX::Left, AlignX::Center, AlignX::Right];

    for align in alignments {
      let serialized = serde_json::to_string(&align).unwrap();
      let deserialized: AlignX = serde_json::from_str(&serialized).unwrap();
      match (align, deserialized) {
        (AlignX::Left, AlignX::Left) => {} // Valid enum variant comparison,
        (AlignX::Center, AlignX::Center) => {} // Valid enum variant comparison,
        (AlignX::Right, AlignX::Right) => {} // Valid enum variant comparison,
        _ => panic!("AlignX serialization mismatch"),
      }
    }
  }

  #[test]
  fn test_align_y_variants() {
    let alignments = vec![AlignY::Top, AlignY::Center, AlignY::Bottom];

    for align in alignments {
      let serialized = serde_json::to_string(&align).unwrap();
      let deserialized: AlignY = serde_json::from_str(&serialized).unwrap();
      match (align, deserialized) {
        (AlignY::Top, AlignY::Top) => {} // Valid enum variant comparison,
        (AlignY::Center, AlignY::Center) => {} // Valid enum variant comparison,
        (AlignY::Bottom, AlignY::Bottom) => {} // Valid enum variant comparison,
        _ => panic!("AlignY serialization mismatch"),
      }
    }
  }

  #[test]
  fn test_aspect_ratio_edge_cases() {
    // Test very small custom ratio
    let small = AspectRatio::Custom(0.001);
    assert_eq!(small.to_string(), "0.00:1");

    // Test very large custom ratio
    let large = AspectRatio::Custom(999.999);
    assert_eq!(large.to_string(), "1000.00:1");

    // Test negative ratio (should still work)
    let negative = AspectRatio::Custom(-1.5);
    assert_eq!(negative.to_string(), "-1.50:1");
  }

  #[test]
  fn test_resolution_aspect_ratio_calculation() {
    let res_16x9 = Resolution::new(1920, 1080);
    let ratio = res_16x9.width as f32 / res_16x9.height as f32;
    assert!((ratio - 16.0 / 9.0).abs() < 0.001);

    let res_4x3 = Resolution::new(1024, 768);
    let ratio = res_4x3.width as f32 / res_4x3.height as f32;
    assert!((ratio - 4.0 / 3.0).abs() < 0.001);
  }

  #[test]
  fn test_all_types_clone() {
    // Test that all types implement Clone correctly
    let aspect = AspectRatio::Ratio16x9;
    let _aspect_clone = aspect.clone();

    let res = Resolution::new(1920, 1080);
    let res_clone = res.clone();
    assert_eq!(res.width, res_clone.width);
    assert_eq!(res.height, res_clone.height);

    let pos = Position2D { x: 1.0, y: 2.0 };
    let pos_clone = pos.clone();
    assert_eq!(pos.x, pos_clone.x);
    assert_eq!(pos.y, pos_clone.y);

    let size = Size2D {
      width: 100.0,
      height: 200.0,
    };
    let size_clone = size.clone();
    assert_eq!(size.width, size_clone.width);
    assert_eq!(size.height, size_clone.height);

    let fit = FitMode::Fill;
    let _fit_clone = fit.clone();

    let align_x = AlignX::Center;
    let _align_x_clone = align_x.clone();

    let align_y = AlignY::Center;
    let _align_y_clone = align_y.clone();
  }
}
