//! Утилиты для тестирования video_compiler
//!
//! Вспомогательные функции и макросы для упрощения написания тестов.

#![allow(dead_code)]

use crate::video_compiler::error::{Result, VideoCompilerError};
use std::fs;
use std::path::{Path, PathBuf};
use tempfile::{tempdir, TempDir};

/// Создает временную директорию для тестов
pub fn create_test_dir() -> Result<TempDir> {
  tempdir().map_err(|e| VideoCompilerError::Io(e.to_string()))
}

/// Создает временный файл с заданным содержимым
pub fn create_test_file(dir: &Path, name: &str, content: &[u8]) -> Result<PathBuf> {
  let file_path = dir.join(name);
  fs::write(&file_path, content).map_err(|e| VideoCompilerError::Io(e.to_string()))?;
  Ok(file_path)
}

/// Создает фейковый видео файл для тестирования
pub fn create_fake_video_file(dir: &Path, name: &str) -> Result<PathBuf> {
  // Минимальный валидный MP4 файл (пустой mdat)
  let mp4_header = vec![
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
    0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x00, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x6D, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08, 0x6D, 0x64, 0x61, 0x74, // mdat box
  ];
  create_test_file(dir, name, &mp4_header)
}

/// Создает фейковый аудио файл для тестирования
pub fn create_fake_audio_file(dir: &Path, name: &str) -> Result<PathBuf> {
  // Минимальный WAV заголовок
  let wav_header = vec![
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // размер файла - 8
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6D, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // размер fmt chunk
    0x01, 0x00, // PCM
    0x02, 0x00, // 2 канала
    0x44, 0xAC, 0x00, 0x00, // 44100 Hz
    0x10, 0xB1, 0x02, 0x00, // byte rate
    0x04, 0x00, // block align
    0x10, 0x00, // bits per sample
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x00, 0x00, 0x00, // размер данных
  ];
  create_test_file(dir, name, &wav_header)
}

/// Создает набор медиафайлов для тестирования
pub fn create_test_media_files(dir: &Path) -> Result<Vec<PathBuf>> {
  let files = vec![
    create_fake_video_file(dir, "video1.mp4")?,
    create_fake_video_file(dir, "video2.mp4")?,
    create_fake_video_file(dir, "video3.mov")?,
    create_fake_audio_file(dir, "audio1.wav")?,
    create_fake_audio_file(dir, "audio2.wav")?,
  ];

  Ok(files)
}

/// Макрос для проверки результатов с подробным сообщением об ошибке
#[macro_export]
macro_rules! assert_result_ok {
  ($result:expr) => {
    match $result {
      Ok(val) => val,
      Err(e) => panic!("Expected Ok, got Err: {:?}", e),
    }
  };
  ($result:expr, $msg:expr) => {
    match $result {
      Ok(val) => val,
      Err(e) => panic!("{}: {:?}", $msg, e),
    }
  };
}

/// Макрос для проверки определенного типа ошибки
#[macro_export]
macro_rules! assert_error_type {
  ($result:expr, $error_pattern:pat) => {
    match $result {
      Err($error_pattern) => (),
      Err(e) => panic!(
        "Expected error pattern {}, got {:?}",
        stringify!($error_pattern),
        e
      ),
      Ok(_) => panic!("Expected error, got Ok"),
    }
  };
}

/// Утилита для запуска асинхронных тестов
pub fn run_async_test<F, T>(test: F) -> T
where
  F: std::future::Future<Output = T>,
{
  tokio::runtime::Runtime::new().unwrap().block_on(test)
}

/// Создает FFmpeg команду для тестирования с мок выводом
pub fn create_mock_ffmpeg_output(
  success: bool,
  stdout: &str,
  stderr: &str,
) -> std::process::Output {
  std::process::Output {
    status: if success {
      #[cfg(unix)]
      {
        use std::os::unix::process::ExitStatusExt;
        std::process::ExitStatus::from_raw(0)
      }
      #[cfg(windows)]
      {
        use std::os::windows::process::ExitStatusExt;
        std::process::ExitStatus::from_raw(0)
      }
    } else {
      #[cfg(unix)]
      {
        use std::os::unix::process::ExitStatusExt;
        std::process::ExitStatus::from_raw(1)
      }
      #[cfg(windows)]
      {
        use std::os::windows::process::ExitStatusExt;
        std::process::ExitStatus::from_raw(1)
      }
    },
    stdout: stdout.as_bytes().to_vec(),
    stderr: stderr.as_bytes().to_vec(),
  }
}

/// Проверяет, что вектор содержит определенный элемент
pub fn assert_contains<T: PartialEq + std::fmt::Debug>(vec: &[T], item: &T) {
  if !vec.contains(item) {
    panic!("Vector {vec:?} does not contain {item:?}");
  }
}

/// Проверяет, что строка содержит подстроку
pub fn assert_str_contains(haystack: &str, needle: &str) {
  if !haystack.contains(needle) {
    panic!("String '{haystack}' does not contain '{needle}'");
  }
}

/// Утилита для сравнения float значений с погрешностью
pub fn assert_float_eq(a: f64, b: f64, epsilon: f64) {
  if (a - b).abs() > epsilon {
    panic!("Float values not equal: {a} != {b} (epsilon: {epsilon})");
  }
}

/// Создает временный проект для тестирования
pub fn setup_test_project() -> Result<(TempDir, crate::video_compiler::schema::ProjectSchema)> {
  let temp_dir = create_test_dir()?;
  let project = crate::video_compiler::tests::fixtures::create_complex_project();
  Ok((temp_dir, project))
}

/// Утилита для логирования в тестах
pub fn init_test_logger() {
  let _ = env_logger::builder()
    .is_test(true)
    .filter_level(log::LevelFilter::Debug)
    .try_init();
}

/// Измеряет время выполнения замыкания
pub fn measure_time<F, R>(f: F) -> (R, std::time::Duration)
where
  F: FnOnce() -> R,
{
  let start = std::time::Instant::now();
  let result = f();
  let duration = start.elapsed();
  (result, duration)
}

/// Асинхронная версия measure_time
pub async fn measure_time_async<F, R>(f: F) -> (R, std::time::Duration)
where
  F: std::future::Future<Output = R>,
{
  let start = std::time::Instant::now();
  let result = f.await;
  let duration = start.elapsed();
  (result, duration)
}
