//! FFmpeg Builder - Модульная структура для построения команд FFmpeg
//!
//! Этот модуль разделен на несколько подмодулей для лучшей организации:
//! - `builder` - Основная логика построителя
//! - `filters` - Построение фильтров (видео, аудио, эффекты)
//! - `inputs` - Обработка входных источников
//! - `outputs` - Конфигурация выходных параметров
//! - `effects` - Обработка эффектов и переходов
//! - `subtitles` - Обработка субтитров
//! - `templates` - Обработка шаблонов
//! - `advanced` - Расширенные операции FFmpeg

pub mod advanced;
pub mod builder;
pub mod effects;
pub mod filters;
pub mod inputs;
pub mod outputs;
pub mod subtitles;
pub mod templates;

// Re-export main types
pub use builder::FFmpegBuilder;

/// Является ли путь статичным изображением (фото) по расширению.
///
/// Такие входы FFmpeg обязан зацикливать (`-loop 1` + `-t`), иначе из одного кадра
/// получится клип длиной ~1 кадр вместо нужной длительности. `gif` намеренно исключён —
/// анимированные gif декодируются как последовательность видео-кадров.
pub(crate) fn is_image_path(path: &str) -> bool {
  let ext = std::path::Path::new(path)
    .extension()
    .and_then(|e| e.to_str())
    .map(|e| e.to_ascii_lowercase());
  matches!(
    ext.as_deref(),
    Some("jpg" | "jpeg" | "png" | "bmp" | "webp" | "tif" | "tiff" | "heic" | "heif")
  )
}

#[cfg(test)]
mod mod_tests {
  use super::is_image_path;

  #[test]
  fn test_is_image_path() {
    assert!(is_image_path("/tmp/photo.jpg"));
    assert!(is_image_path("/tmp/photo.JPEG"));
    assert!(is_image_path("a.png"));
    assert!(is_image_path("/x/y.webp"));
    assert!(!is_image_path("/tmp/clip.mp4"));
    assert!(!is_image_path("/tmp/music.mp3"));
    assert!(!is_image_path("/tmp/anim.gif"));
    assert!(!is_image_path("/tmp/noext"));
  }
}
