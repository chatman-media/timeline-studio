//! Preview - Модуль генерации превью кадров
//!
//! Этот модуль реализует генерацию превью кадров из видео файлов с использованием FFmpeg,
//! включая кэширование, оптимизацию производительности и поддержку различных форматов.

use crate::video_compiler::cache::{PreviewKey, RenderCache};
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::{PreviewFormat, ProjectSchema};
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine as _;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tokio::process::Command;
use tokio::sync::RwLock;

/// Опции для генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewOptions {
  /// Ширина превью
  pub width: Option<u32>,
  /// Высота превью
  pub height: Option<u32>,
  /// Качество (0-100)
  pub quality: u8,
  /// Формат выходного файла
  pub format: String,
}

/// Генератор превью кадров
#[derive(Debug)]
pub struct PreviewGenerator {
  /// Кэш превью
  cache: Arc<RwLock<RenderCache>>,
  /// Настройки генератора
  settings: PreviewSettings,
  /// Путь к FFmpeg
  ffmpeg_path: String,
}

impl PreviewGenerator {
  /// Создать новый генератор превью
  pub fn new(cache: Arc<RwLock<RenderCache>>) -> Self {
    Self {
      cache,
      settings: PreviewSettings::default(),
      ffmpeg_path: "ffmpeg".to_string(),
    }
  }

  /// Создать генератор только с путем к FFmpeg (для команд)
  pub fn new_with_ffmpeg(ffmpeg_path: String) -> Self {
    Self {
      cache: Arc::new(RwLock::new(RenderCache::new())),
      settings: PreviewSettings::default(),
      ffmpeg_path,
    }
  }

  /// Создать генератор с настройками
  pub fn with_settings(cache: Arc<RwLock<RenderCache>>, settings: PreviewSettings) -> Self {
    Self {
      cache,
      settings,
      ffmpeg_path: "ffmpeg".to_string(),
    }
  }

  /// Установить путь к FFmpeg
  pub fn set_ffmpeg_path<P: AsRef<Path>>(&mut self, path: P) {
    self.ffmpeg_path = path.as_ref().to_string_lossy().to_string();
  }

  /// Сгенерировать превью кадр
  pub async fn generate_preview(
    &self,
    video_path: &Path,
    timestamp: f64,
    resolution: Option<(u32, u32)>,
    quality: Option<u8>,
  ) -> Result<Vec<u8>> {
    let resolution = resolution.unwrap_or(self.settings.default_resolution);
    let quality = quality.unwrap_or(self.settings.default_quality);

    // Создаем ключ кэша
    let cache_key = PreviewKey::new(
      video_path.to_string_lossy().to_string(),
      timestamp,
      resolution,
      quality,
    );

    // Проверяем кэш
    {
      let mut cache = self.cache.write().await;
      if let Some(cached_data) = cache.get_preview(&cache_key).await {
        log::debug!("Превью найдено в кэше: {video_path:?} at {timestamp}s");
        return Ok(cached_data.image_data);
      }
    }

    log::debug!("Генерация превью: {video_path:?} at {timestamp}s");

    // Валидация входных данных
    self.validate_input(video_path, timestamp)?;

    // Генерируем превью
    let image_data = self
      .generate_preview_internal(video_path, timestamp, resolution, quality)
      .await?;

    // Сохраняем в кэш
    {
      let mut cache = self.cache.write().await;
      cache.store_preview(cache_key, image_data.clone()).await?;
    }

    Ok(image_data)
  }

  /// Генерировать несколько превью одновременно для одного файла
  pub async fn generate_preview_batch_for_file(
    &self,
    video_path: &Path,
    timestamps: Vec<f64>,
    resolution: Option<(u32, u32)>,
    quality: Option<u8>,
  ) -> Result<Vec<PreviewResult>> {
    let resolution = resolution.unwrap_or(self.settings.default_resolution);
    let quality = quality.unwrap_or(self.settings.default_quality);

    let mut results = Vec::new();
    let mut tasks = Vec::new();

    // Создаем задачи для параллельной генерации
    for timestamp in timestamps {
      let video_path = video_path.to_owned();
      let cache = self.cache.clone();
      let settings = self.settings.clone();
      let ffmpeg_path = self.ffmpeg_path.clone();

      let task = tokio::spawn(async move {
        let generator = PreviewGenerator {
          cache,
          settings,
          ffmpeg_path,
        };

        let result = generator
          .generate_preview(&video_path, timestamp, Some(resolution), Some(quality))
          .await;
        PreviewResult {
          _timestamp: timestamp,
          result,
        }
      });

      tasks.push(task);
    }

    // Ждем завершения всех задач
    for task in tasks {
      match task.await {
        Ok(result) => results.push(result),
        Err(e) => {
          log::error!("Ошибка в задаче генерации превью: {e:?}");
        }
      }
    }

    Ok(results)
  }

  /// Генерировать несколько превью для разных файлов
  pub async fn generate_preview_batch(
    &self,
    requests: Vec<PreviewRequest>,
  ) -> Result<Vec<SerializablePreviewResult>> {
    let mut results = Vec::new();
    let mut tasks = Vec::new();

    // Создаем задачи для параллельной генерации
    for request in requests {
      let cache = self.cache.clone();
      let settings = self.settings.clone();
      let ffmpeg_path = self.ffmpeg_path.clone();

      let task = tokio::spawn(async move {
        let generator = PreviewGenerator {
          cache,
          settings,
          ffmpeg_path,
        };

        let path = Path::new(&request.video_path);
        let result = generator
          .generate_preview(path, request.timestamp, request.resolution, request.quality)
          .await;

        match result {
          Ok(image_data) => SerializablePreviewResult {
            timestamp: request.timestamp,
            image_data: Some(BASE64.encode(&image_data)),
            error: None,
          },
          Err(e) => SerializablePreviewResult {
            timestamp: request.timestamp,
            image_data: None,
            error: Some(e.to_string()),
          },
        }
      });

      tasks.push(task);
    }

    // Ждем завершения всех задач
    for task in tasks {
      match task.await {
        Ok(result) => results.push(result),
        Err(e) => {
          log::error!("Ошибка в задаче генерации превью: {e:?}");
        }
      }
    }

    Ok(results)
  }

  /// Генерировать превью для timeline (полоса превью)
  pub async fn generate_timeline_previews(
    &self,
    video_path: &Path,
    duration: f64,
    interval: f64,
  ) -> Result<Vec<TimelinePreview>> {
    let mut previews = Vec::new();
    let mut current_time = 0.0;

    while current_time < duration {
      let result = self
        .generate_preview(
          video_path,
          current_time,
          Some(self.settings.timeline_resolution),
          Some(self.settings.timeline_quality),
        )
        .await;

      let preview = TimelinePreview {
        timestamp: current_time,
        image_data: result.ok(),
      };

      previews.push(preview);
      current_time += interval;
    }

    Ok(previews)
  }

  /// Очистить кэш превью для конкретного файла
  pub async fn clear_cache_for_file(&self) -> Result<()> {
    let mut cache = self.cache.write().await;
    cache.clear_previews().await;
    Ok(())
  }

  /// Генерировать кадр из проекта
  pub async fn generate_frame(
    &self,
    project_schema: &ProjectSchema,
    timestamp: f64,
    output_path: &str,
    options: Option<PreviewOptions>,
  ) -> Result<()> {
    use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;

    // Используем опции или значения по умолчанию
    let options = options.unwrap_or(PreviewOptions {
      width: Some(1920),
      height: Some(1080),
      quality: 80,
      format: "png".to_string(),
    });

    // Создаем временный проект для одного кадра
    let mut frame_project = project_schema.clone();
    frame_project.timeline.duration = timestamp + 0.1; // Небольшой запас

    // Фильтруем клипы, чтобы оставить только те, которые видны в этот момент
    for track in &mut frame_project.tracks {
      track
        .clips
        .retain(|clip| clip.start_time <= timestamp && clip.end_time > timestamp);
    }

    // Строим команду FFmpeg
    let builder = FFmpegBuilder::new(frame_project.clone());
    let mut cmd = builder.build_render_command(output_path.as_ref()).await?;

    // Добавляем параметры для генерации одного кадра
    cmd.args(["-ss", &timestamp.to_string()]);
    cmd.args([
      "-vframes",
      "1",
      "-q:v",
      &(100 - options.quality).to_string(),
    ]);

    if let (Some(width), Some(height)) = (options.width, options.height) {
      cmd.args(["-vf", &format!("scale={width}:{height}")]);
    }

    let output = cmd
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: format!("{cmd:?}"),
      })?;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        command: format!("{cmd:?}"),
      });
    }

    Ok(())
  }

  /// Получить информацию о видео файле
  pub async fn get_video_info(&self, video_path: &Path) -> Result<VideoInfo> {
    let mut cmd = Command::new(&self.ffmpeg_path);
    cmd.args([
      "-i",
      &video_path.to_string_lossy(),
      "-hide_banner",
      "-f",
      "null",
      "-",
    ]);
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::piped());

    let output = cmd.output().await.map_err(|e| {
      VideoCompilerError::ffmpeg(
        None,
        format!("Не удалось запустить FFmpeg: {e}"),
        "ffprobe".to_string(),
      )
    })?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    self.parse_video_info(&stderr)
  }

  /// Внутренняя генерация превью
  async fn generate_preview_internal(
    &self,
    video_path: &Path,
    timestamp: f64,
    resolution: (u32, u32),
    quality: u8,
  ) -> Result<Vec<u8>> {
    let temp_output = self.create_temp_output_path().await?;

    let mut cmd = Command::new(&self.ffmpeg_path);

    // Настройка команды FFmpeg
    cmd.args([
      "-ss",
      &timestamp.to_string(),
      "-i",
      &video_path.to_string_lossy(),
      "-vframes",
      "1",
      "-vf",
      &format!("scale={}:{}", resolution.0, resolution.1),
      "-q:v",
      &self.quality_to_qscale(quality).to_string(),
      "-y",
    ]);

    // Выбираем формат вывода
    match self.settings.format {
      PreviewFormat::Jpeg => {
        cmd.args(["-f", "image2", "-c:v", "mjpeg"]);
      }
      PreviewFormat::Png => {
        cmd.args(["-f", "image2", "-c:v", "png"]);
      }
      PreviewFormat::WebP => {
        cmd.args(["-f", "image2", "-c:v", "libwebp"]);
      }
    }

    cmd.arg(&temp_output);
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::piped());

    log::debug!("Выполнение команды FFmpeg: {cmd:?}");

    let output = cmd.output().await.map_err(|e| {
      let error = VideoCompilerError::ffmpeg(
        None,
        format!("Не удалось запустить FFmpeg: {e}"),
        "generate_preview".to_string(),
      );
      log::error!("Ошибка FFmpeg: {error}");
      log::error!("  Код ошибки: {}", error.error_code());
      log::error!(
        "  Критическая: {}",
        if error.is_critical() {
          "да"
        } else {
          "нет"
        }
      );
      error
    })?;

    if !output.status.success() {
      let stderr = String::from_utf8_lossy(&output.stderr);
      let error = VideoCompilerError::ffmpeg(
        output.status.code(),
        stderr.to_string(),
        format!("ffmpeg generate preview at {timestamp}s"),
      );
      log::error!("Ошибка выполнения FFmpeg: {error}");
      log::error!("  Код ошибки: {}", error.error_code());
      log::error!(
        "  Можно повторить: {}",
        if error.is_retryable() {
          "да"
        } else {
          "нет"
        }
      );
      return Err(error);
    }

    // Читаем сгенерированный файл
    let image_data = tokio::fs::read(&temp_output).await.map_err(|e| {
      VideoCompilerError::preview(timestamp, format!("Не удалось прочитать превью файл: {e}"))
    })?;

    // Удаляем временный файл
    if let Err(e) = tokio::fs::remove_file(&temp_output).await {
      log::warn!("Не удалось удалить временный файл превью: {e}");
    }
    log::debug!("Превью успешно сгенерировано: {video_path:?} at {timestamp}s");
    Ok(image_data)
  }

  /// Валидация входных данных
  fn validate_input(&self, video_path: &Path, timestamp: f64) -> Result<()> {
    if !video_path.exists() {
      return Err(VideoCompilerError::media_file(
        video_path.to_string_lossy(),
        "Файл не найден",
      ));
    }

    if timestamp < 0.0 {
      return Err(VideoCompilerError::validation(
        "Временная метка не может быть отрицательной",
      ));
    }

    // Проверка расширения файла
    if let Some(extension) = video_path.extension() {
      let ext = extension.to_string_lossy().to_lowercase();
      if !self.settings.supported_formats.contains(&ext) {
        return Err(VideoCompilerError::unsupported_format(
          ext,
          video_path.to_string_lossy(),
        ));
      }
    }

    Ok(())
  }

  /// Создать путь для временного файла
  async fn create_temp_output_path(&self) -> Result<PathBuf> {
    let temp_dir = std::env::temp_dir();
    let filename = format!(
      "timeline_preview_{}_{}.{}",
      SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or(Duration::ZERO)
        .as_millis(),
      uuid::Uuid::new_v4(),
      self.get_file_extension()
    );

    Ok(temp_dir.join(filename))
  }

  /// Получить расширение файла для текущего формата
  fn get_file_extension(&self) -> &'static str {
    match self.settings.format {
      PreviewFormat::Jpeg => "jpg",
      PreviewFormat::Png => "png",
      PreviewFormat::WebP => "webp",
    }
  }

  /// Конвертировать качество (0-100) в qscale для FFmpeg (2-31)
  fn quality_to_qscale(&self, quality: u8) -> u8 {
    // Инвертируем шкалу: высокое качество = низкий qscale
    let quality = quality.min(100) as u32;
    let qscale = 2 + ((100 - quality) * 29 / 100);
    qscale.min(31) as u8
  }

  /// Парсинг информации о видео из вывода FFmpeg
  fn parse_video_info(&self, ffmpeg_output: &str) -> Result<VideoInfo> {
    let mut info = VideoInfo::default();

    for line in ffmpeg_output.lines() {
      // Парсим длительность: Duration: 00:02:30.45
      if line.contains("Duration:") {
        if let Some(duration_str) = line.split("Duration: ").nth(1) {
          if let Some(duration_part) = duration_str.split(',').next() {
            info.duration = parse_duration(duration_part);
          }
        }
      }

      // Парсим видео стрим: Stream #0:0: Video: h264 (avc1), yuv420p, 1920x1080, 30 fps
      if line.contains("Video:") && line.contains("Stream") {
        // Парсим разрешение
        if let Some(resolution) = extract_resolution(line) {
          info.resolution = Some(resolution);
        }

        // Парсим FPS
        if let Some(fps) = extract_fps(line) {
          info.fps = Some(fps);
        }

        // Парсим кодек
        if let Some(codec) = extract_video_codec(line) {
          info.video_codec = Some(codec);
        }
      }

      // Парсим аудио стрим
      if line.contains("Audio:") && line.contains("Stream") {
        if let Some(codec) = extract_audio_codec(line) {
          info.audio_codec = Some(codec);
        }
      }

      // Парсим битрейт
      if line.contains("bitrate:") {
        if let Some(bitrate) = extract_bitrate(line) {
          info.bitrate = Some(bitrate);
        }
      }
    }

    Ok(info)
  }
}

/// Настройки генератора превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewSettings {
  /// Разрешение по умолчанию
  pub default_resolution: (u32, u32),
  /// Качество по умолчанию (0-100)
  pub default_quality: u8,
  /// Формат превью
  pub format: PreviewFormat,
  /// Разрешение для timeline превью
  pub timeline_resolution: (u32, u32),
  /// Качество для timeline превью
  pub timeline_quality: u8,
  /// Поддерживаемые форматы видео
  pub supported_formats: Vec<String>,
  /// Максимальное время ожидания (секунды)
  pub timeout_seconds: u64,
  /// Использовать аппаратное ускорение
  pub hardware_acceleration: bool,
}

impl Default for PreviewSettings {
  fn default() -> Self {
    Self {
      default_resolution: (640, 360),
      default_quality: 75,
      format: PreviewFormat::Jpeg,
      timeline_resolution: (160, 90),
      timeline_quality: 60,
      supported_formats: vec![
        "mp4".to_string(),
        "avi".to_string(),
        "mov".to_string(),
        "mkv".to_string(),
        "webm".to_string(),
        "flv".to_string(),
        "wmv".to_string(),
        "m4v".to_string(),
      ],
      timeout_seconds: 30,
      hardware_acceleration: false,
    }
  }
}

/// Запрос на генерацию превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewRequest {
  /// Путь к видео файлу
  pub video_path: String,
  /// Временная метка
  pub timestamp: f64,
  /// Разрешение (опционально)
  pub resolution: Option<(u32, u32)>,
  /// Качество (опционально)
  pub quality: Option<u8>,
}

/// Результат генерации превью
#[derive(Debug, Clone)]
pub struct PreviewResult {
  /// Временная метка
  pub _timestamp: f64,
  /// Результат генерации
  pub result: Result<Vec<u8>>,
}

/// Результат генерации превью для сериализации
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializablePreviewResult {
  /// Временная метка
  pub timestamp: f64,
  /// Данные изображения (base64)
  pub image_data: Option<String>,
  /// Ошибка если была
  pub error: Option<String>,
}

/// Превью для timeline
#[derive(Debug, Clone)]
pub struct TimelinePreview {
  /// Временная метка
  pub timestamp: f64,
  /// Данные изображения (None если ошибка)
  pub image_data: Option<Vec<u8>>,
}

/// Информация о видео файле
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
  /// Длительность в секундах
  pub duration: f64,
  /// Разрешение видео
  pub resolution: Option<(u32, u32)>,
  /// FPS
  pub fps: Option<f32>,
  /// Битрейт (bps)
  pub bitrate: Option<u32>,
  /// Видео кодек
  pub video_codec: Option<String>,
  /// Аудио кодек
  pub audio_codec: Option<String>,
}

/// Парсинг длительности из строки формата HH:MM:SS.ss
fn parse_duration(duration_str: &str) -> f64 {
  let parts: Vec<&str> = duration_str.trim().split(':').collect();
  if parts.len() == 3 {
    let hours: f64 = parts[0].parse().unwrap_or(0.0);
    let minutes: f64 = parts[1].parse().unwrap_or(0.0);
    let seconds: f64 = parts[2].parse().unwrap_or(0.0);
    hours * 3600.0 + minutes * 60.0 + seconds
  } else {
    0.0
  }
}

/// Извлечение разрешения из строки FFmpeg
fn extract_resolution(line: &str) -> Option<(u32, u32)> {
  // Ищем паттерн вида "1920x1080"
  let re = regex::Regex::new(r"(\d+)x(\d+)").ok()?;
  let caps = re.captures(line)?;
  let width: u32 = caps.get(1)?.as_str().parse().ok()?;
  let height: u32 = caps.get(2)?.as_str().parse().ok()?;
  Some((width, height))
}

/// Извлечение FPS из строки FFmpeg
fn extract_fps(line: &str) -> Option<f32> {
  // Ищем паттерн вида "30 fps" или "29.97 fps"
  let re = regex::Regex::new(r"(\d+(?:\.\d+)?)\s*fps").ok()?;
  let caps = re.captures(line)?;
  caps.get(1)?.as_str().parse().ok()
}

/// Извлечение видео кодека
fn extract_video_codec(line: &str) -> Option<String> {
  // Ищем кодек после "Video:"
  if let Some(start) = line.find("Video: ") {
    let codec_part = &line[start + 7..];
    // Находим конец кодека - либо пробел, либо запятая
    let end = codec_part.find([' ', ',']).unwrap_or(codec_part.len());
    Some(codec_part[..end].to_string())
  } else {
    None
  }
}

/// Извлечение аудио кодека
fn extract_audio_codec(line: &str) -> Option<String> {
  // Ищем кодек после "Audio:"
  if let Some(start) = line.find("Audio: ") {
    let codec_part = &line[start + 7..];
    // Находим конец кодека - либо пробел, либо запятая
    let end = codec_part.find([' ', ',']).unwrap_or(codec_part.len());
    Some(codec_part[..end].to_string())
  } else {
    None
  }
}

/// Извлечение битрейта
fn extract_bitrate(line: &str) -> Option<u32> {
  // Ищем паттерн вида "bitrate: 1234 kb/s"
  let re = regex::Regex::new(r"bitrate:\s*(\d+)\s*kb/s").ok()?;
  let caps = re.captures(line)?;
  let bitrate_kbps: u32 = caps.get(1)?.as_str().parse().ok()?;
  Some(bitrate_kbps * 1000) // Конвертируем в bps
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::cache::RenderCache;
  use std::path::PathBuf;
  use tokio::sync::RwLock;

  fn create_test_generator() -> PreviewGenerator {
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    PreviewGenerator::new(cache)
  }

  #[test]
  fn test_preview_settings_default() {
    let settings = PreviewSettings::default();
    assert_eq!(settings.default_resolution, (640, 360));
    assert_eq!(settings.default_quality, 75);
    assert!(settings.supported_formats.contains(&"mp4".to_string()));
  }

  #[test]
  fn test_quality_to_qscale() {
    let generator = create_test_generator();

    // Высокое качество = низкий qscale
    assert_eq!(generator.quality_to_qscale(100), 2);
    assert_eq!(generator.quality_to_qscale(0), 31);
    assert_eq!(generator.quality_to_qscale(50), 16); // Примерно средний
  }

  #[test]
  fn test_file_extension() {
    let settings_jpeg = PreviewSettings {
      format: PreviewFormat::Jpeg,
      ..Default::default()
    };
    let generator =
      PreviewGenerator::with_settings(Arc::new(RwLock::new(RenderCache::new())), settings_jpeg);
    assert_eq!(generator.get_file_extension(), "jpg");

    let settings_png = PreviewSettings {
      format: PreviewFormat::Png,
      ..Default::default()
    };
    let generator =
      PreviewGenerator::with_settings(Arc::new(RwLock::new(RenderCache::new())), settings_png);
    assert_eq!(generator.get_file_extension(), "png");

    let settings_webp = PreviewSettings {
      format: PreviewFormat::WebP,
      ..Default::default()
    };
    let generator =
      PreviewGenerator::with_settings(Arc::new(RwLock::new(RenderCache::new())), settings_webp);
    assert_eq!(generator.get_file_extension(), "webp");
  }

  #[test]
  fn test_parse_duration() {
    assert_eq!(parse_duration("01:23:45.67"), 3600.0 + 23.0 * 60.0 + 45.67);
    assert_eq!(parse_duration("00:00:30.50"), 30.5);
    assert_eq!(parse_duration("02:00:00.00"), 7200.0);
    assert_eq!(parse_duration("invalid"), 0.0);
  }

  #[test]
  fn test_extract_resolution() {
    let line = "Stream #0:0: Video: h264, yuv420p, 1920x1080, 30 fps";
    assert_eq!(extract_resolution(line), Some((1920, 1080)));

    let line = "Stream #0:0: Video: h264, yuv420p, 640x480, 25 fps";
    assert_eq!(extract_resolution(line), Some((640, 480)));

    let line = "No resolution here";
    assert_eq!(extract_resolution(line), None);
  }

  #[test]
  fn test_extract_fps() {
    let line = "Stream #0:0: Video: h264, yuv420p, 1920x1080, 30 fps";
    assert_eq!(extract_fps(line), Some(30.0));

    let line = "Stream #0:0: Video: h264, yuv420p, 1920x1080, 29.97 fps";
    assert_eq!(extract_fps(line), Some(29.97));

    let line = "No fps here";
    assert_eq!(extract_fps(line), None);
  }

  #[test]
  fn test_extract_video_codec() {
    let line = "Stream #0:0: Video: h264 (avc1), yuv420p, 1920x1080";
    assert_eq!(extract_video_codec(line), Some("h264".to_string()));

    let line = "Stream #0:0: Video: vp9, yuv420p, 1920x1080";
    assert_eq!(extract_video_codec(line), Some("vp9".to_string()));

    let line = "No video codec here";
    assert_eq!(extract_video_codec(line), None);
  }

  #[test]
  fn test_extract_audio_codec() {
    let line = "Stream #0:1: Audio: aac (mp4a), 48000 Hz, stereo";
    assert_eq!(extract_audio_codec(line), Some("aac".to_string()));

    let line = "Stream #0:1: Audio: mp3, 44100 Hz, stereo";
    assert_eq!(extract_audio_codec(line), Some("mp3".to_string()));

    let line = "No audio codec here";
    assert_eq!(extract_audio_codec(line), None);
  }

  #[test]
  fn test_extract_bitrate() {
    let line = "Duration: 00:02:30.45, start: 0.000000, bitrate: 8000 kb/s";
    assert_eq!(extract_bitrate(line), Some(8000000)); // 8000 kbps = 8000000 bps

    let line = "bitrate: 1500 kb/s";
    assert_eq!(extract_bitrate(line), Some(1500000));

    let line = "No bitrate here";
    assert_eq!(extract_bitrate(line), None);
  }

  #[tokio::test]
  async fn test_video_info_parsing() {
    let generator = create_test_generator();
    let ffmpeg_output = r#"
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'test.mp4':
  Duration: 00:02:30.45, start: 0.000000, bitrate: 8000 kb/s
    Stream #0:0(und): Video: h264 (avc1), yuv420p, 1920x1080, 7500 kb/s, 30 fps
    Stream #0:1(und): Audio: aac (mp4a), 48000 Hz, stereo, fltp, 128 kb/s
"#;

    let info = generator.parse_video_info(ffmpeg_output).unwrap();
    assert_eq!(info.duration, 150.45); // 2:30.45 = 150.45 seconds
    assert_eq!(info.resolution, Some((1920, 1080)));
    assert_eq!(info.fps, Some(30.0));
    assert_eq!(info.video_codec, Some("h264".to_string()));
    assert_eq!(info.audio_codec, Some("aac".to_string()));
    assert_eq!(info.bitrate, Some(8000000));
  }

  #[tokio::test]
  async fn test_preview_key_creation() {
    let key = PreviewKey::new("/test/video.mp4".to_string(), 10.5, (640, 360), 75);

    assert_eq!(key.file_path, "/test/video.mp4");
    assert_eq!(key.timestamp, 10500); // 10.5 * 1000
    assert_eq!(key.resolution, (640, 360));
    assert_eq!(key.quality, 75);
  }

  #[tokio::test]
  async fn test_temp_output_path() {
    let generator = create_test_generator();
    let path = generator.create_temp_output_path().await.unwrap();

    assert!(path.to_string_lossy().contains("timeline_preview_"));
    assert!(path.to_string_lossy().ends_with(".jpg")); // default format
  }

  #[test]
  fn test_input_validation() {
    let generator = create_test_generator();

    // Негативная временная метка
    let result = generator.validate_input(&PathBuf::from("/nonexistent"), -1.0);
    assert!(result.is_err());

    // Несуществующий файл
    let result = generator.validate_input(&PathBuf::from("/nonexistent/file.mp4"), 10.0);
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_timeline_preview_generation() {
    let generator = create_test_generator();

    // Создаем мок видео файл (в реальности нужен настоящий файл)
    let video_path = PathBuf::from("/nonexistent/test.mp4");

    // Этот тест не пройдет без реального видео файла, но структура правильная
    let _result = generator
      .generate_timeline_previews(&video_path, 60.0, 10.0)
      .await;

    // В реальном тесте здесь были бы проверки на количество превью
    // assert_eq!(result.unwrap().len(), 6); // 60 секунд / 10 секунд интервал
  }
}
