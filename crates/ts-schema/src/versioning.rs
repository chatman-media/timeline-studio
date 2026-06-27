//! Версионирование и политика обратной совместимости `ProjectSchema` (#375).
//!
//! Раньше `ProjectSchema.version` был свободной строкой, захардкоженной в `"1.0.0"`,
//! без semver-схемы, без проверки на загрузке и без задокументированных гарантий —
//! совместимость держалась неявно на serde-дефолтах для отсутствующих полей.
//! Внешние интеграции (postim.life) кодогенерят типы из `timeline emit-schema` и
//! строят продукт против этого контракта, поэтому им нужен явный версионный контракт.
//!
//! # Политика (источник истины — [`SCHEMA_VERSION`])
//!
//! Версия схемы — **semver** `MAJOR.MINOR.PATCH`:
//! - **PATCH** — правки, не меняющие форму (доки, дефолты). Полностью совместимо.
//! - **MINOR** — **только аддитивные** изменения: новые опциональные поля / варианты
//!   enum, которые старые загрузчики игнорируют, а новые читают через serde-дефолты.
//!   Проект с тем же MAJOR всегда читается, даже если MINOR новее/старее.
//! - **MAJOR** — ломающие изменения: удаление/переименование полей, смена типа,
//!   несовместимая семантика. Поднимается ЯВНО и сигнализирует о необходимости миграции.
//!
//! Правило загрузки: проект совместим ⇔ его MAJOR равен MAJOR текущей [`SCHEMA_VERSION`].
//! Чужой MAJOR (и новее, и старее) отвергается до появления явных миграций —
//! см. [`is_compatible`] / [`check_compatibility`].

/// Текущая версия схемы `ProjectSchema` (semver). Единственный источник истины:
/// дефолт новых проектов и база для проверки совместимости на загрузке.
///
/// Поднимать MAJOR только при ломающих изменениях формы (см. политику модуля).
pub const SCHEMA_VERSION: &str = "1.0.0";

/// Разобрать строку semver в `(major, minor, patch)`.
///
/// Терпимо к pre-release/build-суффиксам (`1.2.0-rc.1`, `1.2.0+meta`): берётся
/// числовая часть каждого компонента. Возвращает `None`, если major/minor/patch
/// не парсятся как числа или компонентов меньше трёх.
pub fn parse_semver(version: &str) -> Option<(u64, u64, u64)> {
  // Отрезаем build-метаданные (`+...`) и pre-release (`-...`) от patch-хвоста.
  let core = version.split('+').next().unwrap_or(version);
  let core = core.split('-').next().unwrap_or(core);
  let mut parts = core.split('.');
  let major = parts.next()?.trim().parse().ok()?;
  let minor = parts.next()?.trim().parse().ok()?;
  let patch = parts.next()?.trim().parse().ok()?;
  if parts.next().is_some() {
    return None; // больше трёх компонентов — не валидный semver
  }
  Some((major, minor, patch))
}

/// MAJOR-компонент текущей [`SCHEMA_VERSION`].
pub fn current_major() -> u64 {
  parse_semver(SCHEMA_VERSION)
    .expect("SCHEMA_VERSION must be valid semver")
    .0
}

/// Совместим ли проект данной версии с текущей схемой.
///
/// `true` ⇔ версия — валидный semver и её MAJOR равен текущему. MINOR/PATCH
/// игнорируются (аддитивные изменения безопасны внутри одного MAJOR).
pub fn is_compatible(version: &str) -> bool {
  matches!(parse_semver(version), Some((major, _, _)) if major == current_major())
}

/// Проверить совместимость версии проекта, вернув человекочитаемую ошибку.
///
/// Используется на загрузке/валидации. Различает три случая: пустая версия,
/// невалидный semver и несовместимый MAJOR (с подсказкой о миграции).
pub fn check_compatibility(version: &str) -> Result<(), String> {
  if version.trim().is_empty() {
    return Err("Версия схемы проекта не может быть пустой".to_string());
  }
  match parse_semver(version) {
    None => Err(format!(
      "Невалидная версия схемы '{version}': ожидается semver MAJOR.MINOR.PATCH (например, {SCHEMA_VERSION})"
    )),
    Some((major, _, _)) => {
      let cur = current_major();
      if major == cur {
        Ok(())
      } else {
        Err(format!(
          "Несовместимая версия схемы проекта: '{version}' (major {major}) против текущей {SCHEMA_VERSION} (major {cur}). \
           Требуется миграция проекта."
        ))
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn schema_version_is_valid_semver() {
    assert!(parse_semver(SCHEMA_VERSION).is_some());
  }

  #[test]
  fn parses_plain_and_suffixed_semver() {
    assert_eq!(parse_semver("1.2.3"), Some((1, 2, 3)));
    assert_eq!(parse_semver("2.0.0-rc.1"), Some((2, 0, 0)));
    assert_eq!(parse_semver("1.4.0+build.7"), Some((1, 4, 0)));
  }

  #[test]
  fn rejects_malformed_semver() {
    for bad in ["", "1", "1.0", "1.0.0.0", "v1.0.0", "abc", "1.x.0"] {
      assert_eq!(parse_semver(bad), None, "should reject {bad:?}");
    }
  }

  #[test]
  fn same_major_is_compatible_regardless_of_minor_patch() {
    let major = current_major();
    assert!(is_compatible(&format!("{major}.0.0")));
    assert!(is_compatible(&format!("{major}.9.5")));
    assert!(is_compatible(SCHEMA_VERSION));
  }

  #[test]
  fn different_major_is_incompatible() {
    let next = current_major() + 1;
    assert!(!is_compatible(&format!("{next}.0.0")));
    assert!(check_compatibility(&format!("{next}.0.0")).is_err());
  }

  #[test]
  fn check_compatibility_distinguishes_cases() {
    assert!(check_compatibility("").is_err()); // пустая
    assert!(check_compatibility("not-semver").is_err()); // невалидная
    assert!(check_compatibility(SCHEMA_VERSION).is_ok()); // текущая
  }
}
