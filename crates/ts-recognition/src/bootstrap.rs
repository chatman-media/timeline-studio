//! Bootstrap весов ONNX-моделей для headless-режима (M3 #122).
//!
//! Авто-загружает `yolo*.onnx` и другие веса из официальных источников
//! в директорию `$TIMELINE_MODELS_DIR` (или `data_local_dir()/timeline-studio/models/`).
//!
//! ```no_run
//! use ts_recognition::bootstrap::ModelBootstrap;
//! # async fn run() -> anyhow::Result<()> {
//! let b = ModelBootstrap::new();
//! let statuses = b.list();
//! for s in &statuses { println!("{}: {}", s.name, if s.present { "ok" } else { "missing" }); }
//! b.download("yolo11n").await?;
//! # Ok(()) }
//! ```

use anyhow::{Context, Result};
use serde::Serialize;
use std::path::{Path, PathBuf};

/// Статус одной модели.
#[derive(Debug, Clone, Serialize)]
pub struct ModelStatus {
  /// Короткое имя (yolo11n, yolo11n-seg, …)
  pub name: String,
  /// Имя файла (yolo11n.onnx)
  pub filename: String,
  /// Полный путь
  pub path: PathBuf,
  /// Файл существует и не пустой
  pub present: bool,
  /// Размер на диске (байт), 0 если не present
  pub size_bytes: u64,
  /// Canonical URL для загрузки
  pub url: String,
}

/// Реестр моделей.
struct ModelEntry {
  name: &'static str,
  filename: &'static str,
  url: &'static str,
}

// Ultralytics YOLO v11 — nano-размер достаточно для headless-агента
const MODELS: &[ModelEntry] = &[
  ModelEntry {
    name: "yolo11n",
    filename: "yolo11n.onnx",
    url: "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.onnx",
  },
  ModelEntry {
    name: "yolo11n-seg",
    filename: "yolo11n-seg.onnx",
    url: "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n-seg.onnx",
  },
  ModelEntry {
    name: "yolo11n-face",
    filename: "yolo11n-face.onnx",
    url: "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n-face.onnx",
  },
  ModelEntry {
    name: "yolov8n",
    filename: "yolov8n.onnx",
    url: "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx",
  },
  ModelEntry {
    name: "yolov8n-seg",
    filename: "yolov8n-seg.onnx",
    url: "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n-seg.onnx",
  },
  ModelEntry {
    name: "yolov8n-face",
    filename: "yolov8n-face.onnx",
    url: "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n-face.onnx",
  },
];

/// Вернуть директорию с весами моделей.
///
/// Приоритет:
/// 1. `TIMELINE_MODELS_DIR` — env-переменная (используется в Docker/CI)
/// 2. `<data_local_dir>/timeline-studio/models/` — платформенный дефолт
pub fn models_dir() -> PathBuf {
  if let Ok(dir) = std::env::var("TIMELINE_MODELS_DIR") {
    return PathBuf::from(dir);
  }
  dirs::data_local_dir()
    .unwrap_or_else(|| PathBuf::from("/tmp"))
    .join("timeline-studio")
    .join("models")
}

/// Bootstrap менеджер — список и загрузка весов ONNX.
pub struct ModelBootstrap {
  dir: PathBuf,
}

impl ModelBootstrap {
  /// Создать с дефолтной директорией (`models_dir()`).
  pub fn new() -> Self {
    Self { dir: models_dir() }
  }

  /// Создать с явной директорией.
  pub fn with_dir(dir: impl Into<PathBuf>) -> Self {
    Self { dir: dir.into() }
  }

  /// Получить директорию моделей.
  pub fn dir(&self) -> &Path {
    &self.dir
  }

  /// Список всех зарегистрированных моделей с их статусом.
  pub fn list(&self) -> Vec<ModelStatus> {
    MODELS
      .iter()
      .map(|m| {
        let path = self.dir.join(m.filename);
        let (present, size_bytes) = match std::fs::metadata(&path) {
          Ok(meta) if meta.len() > 0 => (true, meta.len()),
          _ => (false, 0),
        };
        ModelStatus {
          name: m.name.to_string(),
          filename: m.filename.to_string(),
          path,
          present,
          size_bytes,
          url: m.url.to_string(),
        }
      })
      .collect()
  }

  /// Загрузить одну модель по имени (например `"yolo11n"`).
  ///
  /// Если файл уже существует — пропускает загрузку.
  pub async fn download(&self, name: &str) -> Result<ModelStatus> {
    let entry = MODELS
      .iter()
      .find(|m| m.name == name)
      .with_context(|| format!("unknown model '{name}'; run `timeline models list` to see available"))?;

    let path = self.dir.join(entry.filename);

    // Уже есть — возвращаем статус без загрузки
    if let Ok(meta) = std::fs::metadata(&path) {
      if meta.len() > 0 {
        log::info!("model {} already present at {}", name, path.display());
        return Ok(ModelStatus {
          name: name.to_string(),
          filename: entry.filename.to_string(),
          path: path.clone(),
          present: true,
          size_bytes: meta.len(),
          url: entry.url.to_string(),
        });
      }
    }

    // Создаём директорию при необходимости
    std::fs::create_dir_all(&self.dir)
      .with_context(|| format!("cannot create models dir {}", self.dir.display()))?;

    log::info!("downloading {} from {}", name, entry.url);

    // HTTP-загрузка через reqwest (streaming)
    let client = reqwest::Client::builder()
      .user_agent("timeline-studio/bootstrap")
      .timeout(std::time::Duration::from_secs(300)) // модели до ~140 МБ
      .connect_timeout(std::time::Duration::from_secs(30))
      .build()?;

    let resp = client
      .get(entry.url)
      .send()
      .await
      .with_context(|| format!("GET {} failed", entry.url))?;

    if !resp.status().is_success() {
      anyhow::bail!(
        "download {} returned HTTP {}",
        entry.url,
        resp.status()
      );
    }

    let bytes = resp
      .bytes()
      .await
      .with_context(|| format!("reading body from {}", entry.url))?;

    let size_bytes = bytes.len() as u64;

    // Атомарная запись: пишем в .tmp, затем rename — защита от corrupt-файла при сбое
    let tmp_path = path.with_extension("onnx.tmp");
    std::fs::write(&tmp_path, &bytes)
      .with_context(|| format!("writing temp model to {}", tmp_path.display()))?;
    std::fs::rename(&tmp_path, &path)
      .with_context(|| format!("renaming {} -> {}", tmp_path.display(), path.display()))?;

    log::info!("model {} saved ({} bytes) -> {}", name, size_bytes, path.display());

    Ok(ModelStatus {
      name: name.to_string(),
      filename: entry.filename.to_string(),
      path,
      present: true,
      size_bytes,
      url: entry.url.to_string(),
    })
  }

  /// Загрузить только nano-варианты (самые маленькие, подходят для headless-агента).
  pub async fn download_nano(&self) -> Result<Vec<ModelStatus>> {
    let nano = ["yolo11n", "yolo11n-seg", "yolo11n-face"];
    let mut results = Vec::new();
    for name in nano {
      results.push(self.download(name).await?);
    }
    Ok(results)
  }

  /// Загрузить все зарегистрированные модели.
  pub async fn download_all(&self) -> Result<Vec<ModelStatus>> {
    let mut results = Vec::new();
    for m in MODELS {
      results.push(self.download(m.name).await?);
    }
    Ok(results)
  }
}

impl Default for ModelBootstrap {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  /// Проверяем, что models_dir() уважает env-переменную.
  /// Не вызываем set_var (data race при parallel test runner) —
  /// тестируем саму логику через with_dir + проверяем дефолт через dirs.
  #[test]
  fn models_dir_fallback_is_sensible() {
    // Без env-переменной → платформенный дефолт (не пустой путь)
    let path = models_dir();
    assert!(!path.as_os_str().is_empty());
    assert!(path.to_string_lossy().contains("timeline-studio"));
  }

  #[test]
  fn with_dir_overrides_default() {
    let b = ModelBootstrap::with_dir("/custom/models");
    assert_eq!(b.dir(), Path::new("/custom/models"));
  }

  #[test]
  fn list_returns_all_models() {
    let b = ModelBootstrap::with_dir("/tmp/nonexistent-models-dir");
    let statuses = b.list();
    assert_eq!(statuses.len(), MODELS.len());
    // Все отсутствуют (директория не существует)
    assert!(statuses.iter().all(|s| !s.present));
  }

  #[test]
  fn list_detects_present_model() {
    let dir = tempfile::tempdir().unwrap();
    let b = ModelBootstrap::with_dir(dir.path());
    // Пишем пустышку
    std::fs::write(dir.path().join("yolo11n.onnx"), b"fake-onnx-data").unwrap();
    let statuses = b.list();
    let yolo = statuses.iter().find(|s| s.name == "yolo11n").unwrap();
    assert!(yolo.present);
    assert!(yolo.size_bytes > 0);
  }

  #[test]
  fn download_unknown_model_errors() {
    let b = ModelBootstrap::with_dir("/tmp/models");
    // Синхронный тест через tokio runtime
    let rt = tokio::runtime::Runtime::new().unwrap();
    let result = rt.block_on(b.download("nonexistent-model-xyz"));
    assert!(result.is_err());
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("nonexistent-model-xyz"));
  }

  #[test]
  fn skip_if_already_present() {
    let dir = tempfile::tempdir().unwrap();
    let b = ModelBootstrap::with_dir(dir.path());
    std::fs::write(dir.path().join("yolo11n.onnx"), b"already-here").unwrap();
    let rt = tokio::runtime::Runtime::new().unwrap();
    // Должен вернуть Ok без HTTP-запроса (файл уже есть)
    let result = rt.block_on(b.download("yolo11n"));
    assert!(result.is_ok());
    let status = result.unwrap();
    assert!(status.present);
  }
}
