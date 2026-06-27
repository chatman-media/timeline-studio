//! Headless-инициализация Video Compiler (#345, финал cutover).
//!
//! Перенесено из монолитного `src-tauri/src/video_compiler/mod.rs` без изменения логики.
//! Обе функции Tauri-free (используют `tokio::process`, `ServiceContainer`,
//! `RenderCache`, `CompilerSettings`), поэтому живут в этом крейте — движок драйвится
//! CLI/агентом без Tauri-рантайма. `lib.rs` хоста вызывает `ts_render_services::initialize()`.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use ts_render::video_compiler::core::cache::RenderCache;
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};
use ts_render::video_compiler::CompilerSettings;

use crate::services::ServiceContainer;
use crate::state::VideoCompilerState;

/// Проверка зависимостей Video Compiler и возврат пути к FFmpeg
pub async fn check_dependencies() -> Result<String> {
  // Список возможных путей к FFmpeg в разных системах
  let ffmpeg_paths = vec![
    "ffmpeg",                                     // По умолчанию в PATH
    "/usr/bin/ffmpeg",                            // Linux стандартный путь
    "/usr/local/bin/ffmpeg",                      // macOS через brew (Intel)
    "/opt/homebrew/bin/ffmpeg",                   // macOS через brew (Apple Silicon)
    "/snap/bin/ffmpeg",                           // Linux через snap
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe", // Windows стандартный путь
    "C:\\ffmpeg\\bin\\ffmpeg.exe",                // Windows альтернативный путь
  ];

  // Пробуем найти FFmpeg
  for path in &ffmpeg_paths {
    log::debug!("Проверка FFmpeg по пути: {path}");

    let output = tokio::process::Command::new(path)
      .arg("-version")
      .output()
      .await;

    if let Ok(output) = output {
      if output.status.success() {
        log::info!("FFmpeg найден по пути: {path}");

        // Извлекаем версию FFmpeg
        if let Ok(version_str) = String::from_utf8(output.stdout) {
          if let Some(version_line) = version_str.lines().next() {
            log::info!("Версия FFmpeg: {version_line}");
          }
        }

        return Ok(path.to_string());
      }
    }
  }

  // Если не нашли FFmpeg, пробуем which/where команду
  let which_cmd = if cfg!(target_os = "windows") {
    "where"
  } else {
    "which"
  };

  if let Ok(output) = tokio::process::Command::new(which_cmd)
    .arg("ffmpeg")
    .output()
    .await
  {
    if output.status.success() {
      if let Ok(path_str) = String::from_utf8(output.stdout) {
        let path = path_str.trim().to_string();
        log::info!("FFmpeg найден через {which_cmd}: {path}");
        return Ok(path);
      }
    }
  }

  Err(VideoCompilerError::DependencyMissing(
    "FFmpeg не найден в системе. Установите FFmpeg для работы Video Compiler.\n\
     Инструкции по установке:\n\
     - macOS: brew install ffmpeg\n\
     - Ubuntu/Debian: sudo apt install ffmpeg\n\
     - Windows: скачайте с https://ffmpeg.org/download.html"
      .to_string(),
  ))
}

/// Инициализация Video Compiler модуля
pub async fn initialize() -> Result<VideoCompilerState> {
  log::info!("Инициализация Video Compiler модуля");

  // Проверяем зависимости и получаем путь к FFmpeg
  let ffmpeg_path = check_dependencies().await?;
  log::info!("FFmpeg найден по пути: {ffmpeg_path}");

  // Создаем временную директорию если не существует
  let temp_dir = std::env::temp_dir().join("timeline-studio");
  if !temp_dir.exists() {
    tokio::fs::create_dir_all(&temp_dir)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
  }

  // Создаем контейнер сервисов с правильным путем к FFmpeg
  let services = match ServiceContainer::new(
    ffmpeg_path.clone(),
    temp_dir.clone(),
    2, // max_concurrent_jobs
  )
  .await
  {
    Ok(container) => container,
    Err(e) => {
      log::error!("Ошибка создания контейнера сервисов: {e:?}");
      return Err(e);
    }
  };

  // Инициализируем сервисы
  if let Err(e) = services.initialize_all().await {
    log::error!("Ошибка инициализации сервисов: {e:?}");
  }

  let services = Arc::new(services);

  // Создаем состояние
  let state = VideoCompilerState {
    services,
    active_jobs: Arc::new(RwLock::new(HashMap::new())),
    active_pipelines: Arc::new(RwLock::new(HashMap::new())),
    cache_manager: Arc::new(RwLock::new(RenderCache::new())),
    ffmpeg_path: Arc::new(RwLock::new(ffmpeg_path.clone())),
    settings: Arc::new(RwLock::new(CompilerSettings {
      temp_directory: temp_dir,
      ..CompilerSettings::default()
    })),
  };

  log::info!("Video Compiler модуль успешно инициализирован с FFmpeg: {ffmpeg_path}");
  Ok(state)
}
