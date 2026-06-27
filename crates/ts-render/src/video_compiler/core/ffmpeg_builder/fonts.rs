//! Кросс-платформенное разрешение пути к шрифту для ffmpeg `drawtext` (`fontfile=`).
//!
//! Раньше путь к шрифту жёстко зашивался под macOS (`/System/Library/Fonts/*`),
//! из-за чего прожиг субтитров падал на headless Linux/Docker (#374). Здесь логические
//! семейства (Arial/Times New Roman/Courier New) сопоставляются с конкретными файлами,
//! доступными на текущей ОС, с приоритетом:
//!   1. каталог из env `TIMELINE_FONTS_DIR` (bundled-шрифты),
//!   2. известные системные пути (Linux: Liberation/DejaVu, macOS, Windows),
//!   3. безопасный дефолт для текущей ОС.
//!
//! На Linux основным подстановочным набором служат шрифты **Liberation**
//! (метрически совместимы с Arial/Times/Courier) с откатом на **DejaVu** —
//! оба ставятся в `docker/Dockerfile.headless`.

use std::path::Path;

/// Класс шрифта по начертанию — к нему сводятся логические имена семейств.
#[derive(Clone, Copy)]
enum FontKind {
  Sans,
  Serif,
  Mono,
}

fn classify(font_family: &str) -> FontKind {
  match font_family {
    "Times New Roman" | "Times" | "Georgia" | "serif" => FontKind::Serif,
    "Courier New" | "Courier" | "Consolas" | "Menlo" | "monospace" => FontKind::Mono,
    // Arial/Helvetica/Verdana/sans-serif и всё неизвестное → sans
    _ => FontKind::Sans,
  }
}

impl FontKind {
  /// Имена файлов, которые ищем в `TIMELINE_FONTS_DIR`.
  fn env_filenames(self) -> &'static [&'static str] {
    match self {
      FontKind::Sans => &[
        "LiberationSans-Regular.ttf",
        "DejaVuSans.ttf",
        "Arial.ttf",
        "Helvetica.ttc",
      ],
      FontKind::Serif => &[
        "LiberationSerif-Regular.ttf",
        "DejaVuSerif.ttf",
        "Times New Roman.ttf",
        "Times.ttc",
      ],
      FontKind::Mono => &[
        "LiberationMono-Regular.ttf",
        "DejaVuSansMono.ttf",
        "Courier New.ttf",
        "Courier.ttc",
      ],
    }
  }

  /// Известные абсолютные пути по платформам (проверяются на существование по порядку).
  fn candidates(self) -> &'static [&'static str] {
    match self {
      FontKind::Sans => &[
        // Linux — Liberation (метрически совместим с Arial), затем DejaVu
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        // macOS
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
        // Windows
        "C:\\Windows\\Fonts\\arial.ttf",
      ],
      FontKind::Serif => &[
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
        "/usr/share/fonts/liberation/LiberationSerif-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/dejavu/DejaVuSerif.ttf",
        "/System/Library/Fonts/Times.ttc",
        "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
        "C:\\Windows\\Fonts\\times.ttf",
      ],
      FontKind::Mono => &[
        "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
        "/usr/share/fonts/liberation/LiberationMono-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/dejavu/DejaVuSansMono.ttf",
        "/System/Library/Fonts/Courier.ttc",
        "/System/Library/Fonts/Supplemental/Courier New.ttf",
        "C:\\Windows\\Fonts\\cour.ttf",
      ],
    }
  }

  /// Безопасный дефолт для текущей ОС, когда ни один файл не найден.
  /// Возвращает правдоподобный путь (нужного начертания и расширения),
  /// чтобы `fontfile=` оставался валидным выражением даже без установленных шрифтов.
  fn default_path(self) -> &'static str {
    if cfg!(target_os = "macos") {
      match self {
        FontKind::Sans => "/System/Library/Fonts/Helvetica.ttc",
        FontKind::Serif => "/System/Library/Fonts/Times.ttc",
        FontKind::Mono => "/System/Library/Fonts/Courier.ttc",
      }
    } else if cfg!(target_os = "windows") {
      match self {
        FontKind::Sans => "C:\\Windows\\Fonts\\arial.ttf",
        FontKind::Serif => "C:\\Windows\\Fonts\\times.ttf",
        FontKind::Mono => "C:\\Windows\\Fonts\\cour.ttf",
      }
    } else {
      // Linux/прочее — Liberation (ставится в Dockerfile.headless)
      match self {
        FontKind::Sans => "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        FontKind::Serif => "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
        FontKind::Mono => "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
      }
    }
  }
}

/// Разрешить путь к файлу шрифта для логического семейства, пригодный для
/// ffmpeg `drawtext=fontfile='<path>'`. Никогда не паникует и всегда возвращает
/// непустой путь нужного начертания.
pub fn resolve_font_path(font_family: &str) -> String {
  let dir = std::env::var("TIMELINE_FONTS_DIR").ok();
  resolve_font_path_in(font_family, dir.as_deref())
}

/// Ядро разрешения с явным каталогом bundled-шрифтов (вместо чтения env) —
/// чтобы тесты не мутировали глобальное окружение (CI крейтов многопоточный).
fn resolve_font_path_in(font_family: &str, fonts_dir: Option<&str>) -> String {
  let kind = classify(font_family);

  // 1. Bundled-каталог (postim.life / Docker могут смонтировать свои шрифты).
  if let Some(dir) = fonts_dir {
    if !dir.is_empty() {
      for name in kind.env_filenames() {
        let p = Path::new(dir).join(name);
        if p.exists() {
          return p.to_string_lossy().into_owned();
        }
      }
    }
  }

  // 2. Известные системные пути — берём первый существующий.
  for cand in kind.candidates() {
    if Path::new(cand).exists() {
      return (*cand).to_string();
    }
  }

  // 3. Дефолт для текущей ОС (может не существовать, но валиден по форме).
  kind.default_path().to_string()
}

#[cfg(test)]
mod tests {
  use super::*;

  fn has_font_ext(p: &str) -> bool {
    p.ends_with(".ttf") || p.ends_with(".ttc") || p.ends_with(".otf")
  }

  #[test]
  fn resolves_known_families_to_valid_paths() {
    for family in ["Arial", "Times New Roman", "Courier New", "Unknown Font"] {
      let path = resolve_font_path(family);
      assert!(!path.is_empty(), "empty path for {family}");
      assert!(has_font_ext(&path), "bad extension for {family}: {path}");
      assert!(
        path.starts_with('/') || path.contains('\\'),
        "not an absolute path for {family}: {path}"
      );
    }
  }

  #[test]
  fn unknown_family_falls_back_to_sans() {
    // Неизвестное семейство и явный sans дают один и тот же дефолт начертания.
    assert_eq!(resolve_font_path("Unknown Font"), resolve_font_path("Arial"));
  }

  #[test]
  fn distinct_kinds_resolve_distinctly_by_default() {
    // Без установленных шрифтов sans/serif/mono дают разные дефолтные пути.
    let sans = resolve_font_path("Arial");
    let serif = resolve_font_path("Times New Roman");
    let mono = resolve_font_path("Courier New");
    // Хотя бы одно из начертаний должно отличаться от sans (на любой ОС дефолты различны).
    assert!(serif != sans || mono != sans);
  }

  #[test]
  fn bundled_dir_is_honored_when_file_present() {
    // Каталог с реальным файлом нужного имени → берём его. Без мутации env:
    // зовём ядро напрямую (CI крейтов многопоточный, глобальный env гонялся бы).
    let dir = std::env::temp_dir().join("ts_fonts_test_374");
    let _ = std::fs::create_dir_all(&dir);
    let font = dir.join("LiberationSans-Regular.ttf");
    std::fs::write(&font, b"stub").unwrap();
    let resolved = resolve_font_path_in("Arial", Some(&dir.to_string_lossy()));
    let _ = std::fs::remove_file(&font);
    assert_eq!(resolved, font.to_string_lossy());
  }

  #[test]
  fn empty_or_missing_bundled_dir_falls_through() {
    // Пустой каталог-override не должен ломать разрешение — падаем на системные/дефолт.
    let p = resolve_font_path_in("Arial", Some(""));
    assert!(has_font_ext(&p));
  }
}
