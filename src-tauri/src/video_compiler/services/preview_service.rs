//! Сервис генерации превью

use crate::video_compiler::{
  error::{Result, VideoCompilerError},
  ffmpeg_builder::FFmpegBuilder,
  ffmpeg_executor::FFmpegExecutor,
  preview::PreviewGenerator,
  schema::{Clip, ProjectSchema},
  services::{FfmpegService, Service},
};
use async_trait::async_trait;
use std::{
  collections::HashMap,
  path::{Path, PathBuf},
  sync::Arc,
};
use tokio::sync::RwLock;

/// Тип превью
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PreviewType {
  Frame,
  Thumbnail,
  Waveform,
  Storyboard,
}

/// Параметры генерации превью
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct PreviewRequest {
  pub preview_type: PreviewType,
  pub source_path: PathBuf,
  pub timestamp: Option<f64>,
  pub resolution: Option<(u32, u32)>,
  pub quality: Option<u8>,
}

/// Результат генерации превью
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct PreviewResult {
  pub preview_type: PreviewType,
  pub data: Vec<u8>,
  pub format: String,
  pub resolution: (u32, u32),
  pub timestamp: Option<f64>,
}

/// Трейт для сервиса превью
#[async_trait]
pub trait PreviewService: Service + Send + Sync {
  /// Сгенерировать превью кадра
  async fn generate_frame_preview(
    &self,
    video_path: &Path,
    timestamp: f64,
    resolution: Option<(u32, u32)>,
  ) -> Result<Vec<u8>>;

  /// Сгенерировать миниатюры для видео
  async fn generate_video_thumbnails(
    &self,
    video_path: &Path,
    count: usize,
    resolution: Option<(u32, u32)>,
  ) -> Result<Vec<Vec<u8>>>;

  /// Сгенерировать раскадровку
  async fn generate_storyboard(
    &self,
    project: &ProjectSchema,
    columns: u32,
    rows: u32,
    thumbnail_size: (u32, u32),
  ) -> Result<Vec<u8>>;

  /// Сгенерировать волновую форму аудио
  async fn generate_waveform(
    &self,
    audio_path: &Path,
    width: u32,
    height: u32,
    color: &str,
  ) -> Result<Vec<u8>>;

  /// Сгенерировать JSON данные waveform для peaks.js
  async fn generate_waveform_data_json(
    &self,
    audio_path: &Path,
    pixels_per_second: u32,
    bits: u8,
  ) -> Result<String>;

  /// Пакетная генерация превью
  async fn batch_generate_previews(
    &self,
    requests: Vec<PreviewRequest>,
  ) -> Result<Vec<PreviewResult>>;

  /// Получить превью из кэша
  async fn get_cached_preview(&self, key: &str) -> Result<Option<PreviewResult>>;

  /// Сохранить превью в кэш
  async fn cache_preview(&self, key: &str, result: &PreviewResult) -> Result<()>;

  /// Сгенерировать кадр для проекта
  async fn generate_frame(
    &self,
    project: &ProjectSchema,
    timestamp: f64,
    output_path: &str,
    options: Option<crate::video_compiler::core::preview::PreviewOptions>,
  ) -> Result<()>;

  /// Пакетная генерация превью для файла
  async fn generate_preview_batch_for_file(
    &self,
    video_path: &Path,
    timestamps: Vec<f64>,
    resolution: Option<(u32, u32)>,
    quality: Option<u8>,
  ) -> Result<Vec<Vec<u8>>>;
}

/// Реализация сервиса превью
pub struct PreviewServiceImpl {
  preview_cache: Arc<RwLock<HashMap<String, PreviewResult>>>,
  temp_dir: PathBuf,
}

impl PreviewServiceImpl {
  pub fn new(_ffmpeg_service: Arc<dyn FfmpegService>) -> Self {
    let temp_dir = std::env::temp_dir().join("timeline-studio-preview");

    Self {
      preview_cache: Arc::new(RwLock::new(HashMap::new())),
      temp_dir,
    }
  }

  /// Генерировать уникальный ключ для кэша
  fn generate_cache_key(
    &self,
    preview_type: PreviewType,
    source: &Path,
    timestamp: Option<f64>,
    resolution: Option<(u32, u32)>,
  ) -> String {
    format!(
      "{:?}:{}:{}:{}",
      preview_type,
      source.to_string_lossy(),
      timestamp.unwrap_or(0.0),
      resolution
        .map(|(w, h)| format!("{w}x{h}"))
        .unwrap_or_default()
    )
  }

  /// Создает storyboard композицию из массива thumbnails
  async fn create_storyboard_composition_internal(
    &self,
    thumbnails: &[Vec<u8>],
    columns: u32,
    rows: u32,
    thumbnail_size: (u32, u32),
  ) -> Result<Vec<u8>> {
    // Создаем временную директорию для композиции
    let temp_dir_path = std::env::temp_dir().join(format!("storyboard_{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&temp_dir_path).map_err(|e| {
      VideoCompilerError::Io(format!("Не удалось создать временную директорию: {e}"))
    })?;

    let (thumb_width, thumb_height) = thumbnail_size;
    let total_width = columns * thumb_width;
    let total_height = rows * thumb_height;

    // Сохраняем все thumbnails как временные файлы
    let mut thumbnail_paths = Vec::new();
    for (i, thumbnail_data) in thumbnails.iter().enumerate() {
      let thumb_path = temp_dir_path.join(format!("thumb_{i}.jpg"));
      tokio::fs::write(&thumb_path, thumbnail_data)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
      thumbnail_paths.push(thumb_path);
    }

    // Создаем FFmpeg команду для композиции storyboard
    let output_path = temp_dir_path.join("storyboard.jpg");

    // Используем FFmpeg filter для создания сетки из изображений
    let mut cmd = std::process::Command::new("ffmpeg");
    cmd.arg("-y"); // Перезаписывать выходной файл

    // Добавляем все thumbnail файлы как входы
    for thumb_path in &thumbnail_paths {
      cmd.arg("-i").arg(thumb_path);
    }

    // Создаем filter для tile композиции
    let filter = format!("tile={columns}x{rows}:margin=2:padding=2");

    cmd.args([
      "-filter_complex",
      &filter,
      "-s",
      &format!("{total_width}x{total_height}"),
      "-q:v",
      "2", // Высокое качество JPEG
      output_path.to_str().unwrap(),
    ]);

    // Выполняем команду
    let output = cmd.output().map_err(|e| {
      VideoCompilerError::Io(format!("Не удалось запустить FFmpeg для storyboard: {e}"))
    })?;

    if !output.status.success() {
      let stderr = String::from_utf8_lossy(&output.stderr);
      log::warn!("FFmpeg storyboard предупреждение: {stderr}");

      // Если композиция не удалась, создаем простую плитку вручную
      return self
        .create_simple_storyboard_fallback_internal(thumbnails, columns, rows, thumbnail_size)
        .await;
    }

    // Читаем результат
    let storyboard_data = tokio::fs::read(&output_path)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    // Удаляем временную директорию
    let _ = std::fs::remove_dir_all(&temp_dir_path);

    Ok(storyboard_data)
  }

  /// Fallback метод для создания простого storyboard без композиции
  async fn create_simple_storyboard_fallback_internal(
    &self,
    thumbnails: &[Vec<u8>],
    _columns: u32,
    _rows: u32,
    _thumbnail_size: (u32, u32),
  ) -> Result<Vec<u8>> {
    // Простой fallback: возвращаем первый thumbnail
    // В будущем можно реализовать композицию через image-rs или подобное
    log::info!("Используется fallback для storyboard - возвращается первый thumbnail");

    if let Some(first_thumbnail) = thumbnails.first() {
      Ok(first_thumbnail.clone())
    } else {
      // Создаем пустое изображение
      Ok(vec![
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9,
      ])
    }
  }
}

#[async_trait]
impl Service for PreviewServiceImpl {
  async fn initialize(&self) -> Result<()> {
    log::info!("Инициализация сервиса превью");

    // Создаем временную директорию
    tokio::fs::create_dir_all(&self.temp_dir)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    Ok(())
  }

  async fn health_check(&self) -> Result<()> {
    let cache_size = self.preview_cache.read().await.len();
    log::debug!("Превью в кэше: {}", cache_size);
    Ok(())
  }

  async fn shutdown(&self) -> Result<()> {
    log::info!("Остановка сервиса превью");

    // Очищаем кэш
    self.preview_cache.write().await.clear();

    // Удаляем временные файлы
    if self.temp_dir.exists() {
      let _ = tokio::fs::remove_dir_all(&self.temp_dir).await;
    }

    Ok(())
  }
}

#[async_trait]
impl PreviewService for PreviewServiceImpl {
  async fn generate_frame_preview(
    &self,
    video_path: &Path,
    timestamp: f64,
    resolution: Option<(u32, u32)>,
  ) -> Result<Vec<u8>> {
    // Проверяем корректность timestamp
    if timestamp < 0.0 {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Некорректное время кадра: {timestamp}"
      )));
    }

    // Проверяем существование файла
    if !video_path.exists() {
      return Err(VideoCompilerError::MediaFileError {
        path: video_path.to_string_lossy().to_string(),
        reason: "Видео файл не найден".to_string(),
      });
    }

    // Проверяем кэш
    let cache_key =
      self.generate_cache_key(PreviewType::Frame, video_path, Some(timestamp), resolution);

    match self.get_cached_preview(&cache_key).await {
      Ok(Some(cached)) => {
        log::debug!("Превью найдено в кэше для {video_path:?} на {timestamp}");
        return Ok(cached.data);
      }
      Ok(None) => {
        log::debug!("Превью не найдено в кэше, генерируем новое");
      }
      Err(e) => {
        log::warn!("Ошибка при проверке кэша: {e}, продолжаем генерацию");
      }
    }

    // Генерируем превью
    let cache = Arc::new(RwLock::new(crate::video_compiler::cache::RenderCache::new()));
    let generator = PreviewGenerator::new(cache);

    let preview_data = generator
      .generate_preview(
        std::path::Path::new(video_path),
        timestamp,
        resolution,
        Some(85),
      )
      .await
      .map_err(|e| {
        log::error!("Ошибка генерации превью для {video_path:?}: {e}");
        match e {
          VideoCompilerError::FFmpegError { .. } => VideoCompilerError::PreviewError {
            timestamp,
            reason: format!("FFmpeg не смог сгенерировать кадр: {e}"),
          },
          VideoCompilerError::TimeoutError { .. } => VideoCompilerError::PreviewError {
            timestamp,
            reason: "Превышено время ожидания генерации превью".to_string(),
          },
          _ => e,
        }
      })?;

    // Проверяем размер полученных данных
    if preview_data.is_empty() {
      return Err(VideoCompilerError::PreviewError {
        timestamp,
        reason: "Получен пустой результат превью".to_string(),
      });
    }

    // Сохраняем в кэш
    let result = PreviewResult {
      preview_type: PreviewType::Frame,
      data: preview_data.clone(),
      format: "jpeg".to_string(),
      resolution: resolution.unwrap_or((0, 0)),
      timestamp: Some(timestamp),
    };

    if let Err(e) = self.cache_preview(&cache_key, &result).await {
      log::warn!("Не удалось сохранить превью в кэш: {e}");
      // Не прерываем выполнение, если кэш не работает
    }

    Ok(preview_data)
  }

  async fn generate_video_thumbnails(
    &self,
    video_path: &Path,
    count: usize,
    resolution: Option<(u32, u32)>,
  ) -> Result<Vec<Vec<u8>>> {
    // Создаем временную директорию для миниатюр
    let temp_dir = self
      .temp_dir
      .join(format!("thumbs_{}", uuid::Uuid::new_v4()));
    tokio::fs::create_dir_all(&temp_dir)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    // Используем FFmpegBuilder для генерации миниатюр
    let project = ProjectSchema::new("thumbnails".to_string());
    let builder = FFmpegBuilder::new(project);
    let output_pattern = temp_dir.join("thumb_%03d.jpg");

    let cmd = builder
      .build_thumbnails_command(
        video_path,
        output_pattern.to_str().unwrap(),
        count as u32,
        resolution,
      )
      .await?;

    // Выполняем команду
    let executor = FFmpegExecutor::new();
    let _result = executor.execute(cmd).await?;

    // Читаем сгенерированные файлы
    let mut thumbnails = Vec::new();
    for i in 1..=count {
      let thumb_path = temp_dir.join(format!("thumb_{i:03}.jpg"));
      if thumb_path.exists() {
        let data = tokio::fs::read(&thumb_path)
          .await
          .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
        thumbnails.push(data);
      }
    }

    // Удаляем временную директорию
    let _ = tokio::fs::remove_dir_all(&temp_dir).await;

    Ok(thumbnails)
  }

  async fn generate_storyboard(
    &self,
    project: &ProjectSchema,
    columns: u32,
    rows: u32,
    thumbnail_size: (u32, u32),
  ) -> Result<Vec<u8>> {
    // Собираем все клипы из проекта
    let mut clips: Vec<&Clip> = Vec::new();
    for track in &project.tracks {
      for clip in &track.clips {
        clips.push(clip);
      }
    }

    // Сортируем клипы по времени начала
    clips.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());

    // Ограничиваем количество превью
    let total_thumbnails = (columns * rows) as usize;
    let step = std::cmp::max(1, clips.len() / total_thumbnails);

    // Генерируем превью для выбранных клипов
    let mut thumbnails = Vec::new();
    for i in (0..clips.len()).step_by(step).take(total_thumbnails) {
      let clip = clips[i];
      if let crate::video_compiler::schema::timeline::ClipSource::File(path) = &clip.source {
        let preview = self
          .generate_frame_preview(Path::new(path), clip.source_start, Some(thumbnail_size))
          .await?;
        thumbnails.push(preview);
      }
    }

    // Создаем композитное изображение storyboard
    if thumbnails.is_empty() {
      return Ok(Vec::new());
    }

    // Если только один thumbnail, возвращаем его
    if thumbnails.len() == 1 {
      return Ok(thumbnails[0].clone());
    }

    // Создаем storyboard композицию
    let storyboard_result = self
      .create_storyboard_composition_internal(&thumbnails, columns, rows, thumbnail_size)
      .await;

    match storyboard_result {
      Ok(storyboard) => Ok(storyboard),
      Err(e) => {
        log::warn!("Не удалось создать storyboard композицию: {e:?}. Возвращаем первый thumbnail.");
        Ok(thumbnails[0].clone())
      }
    }
  }

  async fn generate_waveform(
    &self,
    audio_path: &Path,
    width: u32,
    height: u32,
    color: &str,
  ) -> Result<Vec<u8>> {
    // Проверяем кэш
    let cache_key = format!(
      "waveform:{}:{}x{}:{}",
      audio_path.to_string_lossy(),
      width,
      height,
      color
    );

    if let Some(cached) = self.get_cached_preview(&cache_key).await? {
      return Ok(cached.data);
    }

    // Генерируем waveform с помощью FFmpeg
    let output_path = self
      .temp_dir
      .join(format!("waveform_{}.png", uuid::Uuid::new_v4()));

    // Используем FFmpegBuilder для создания команды
    let project = ProjectSchema::new("waveform".to_string());
    let builder = FFmpegBuilder::new(project);
    let cmd = builder
      .build_waveform_command(audio_path, &output_path, (width, height), color)
      .await?;

    // Выполняем команду через FFmpegExecutor
    let executor = FFmpegExecutor::new();
    let _result = executor.execute(cmd).await?;

    // Читаем результат
    let waveform_data = tokio::fs::read(&output_path)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    // Удаляем временный файл
    let _ = tokio::fs::remove_file(&output_path).await;

    // Сохраняем в кэш
    let result = PreviewResult {
      preview_type: PreviewType::Waveform,
      data: waveform_data.clone(),
      format: "png".to_string(),
      resolution: (width, height),
      timestamp: None,
    };

    self.cache_preview(&cache_key, &result).await?;

    Ok(waveform_data)
  }

  async fn generate_waveform_data_json(
    &self,
    audio_path: &Path,
    pixels_per_second: u32,
    bits: u8,
  ) -> Result<String> {
    use super::super::core::ffmpeg::FFmpegCommand;
    use std::process::Stdio;
    use tokio::io::AsyncReadExt;
    use tokio::process::Command;

    log::info!("Generating waveform JSON for {:?}", audio_path);

    if !audio_path.exists() {
      return Err(VideoCompilerError::MediaFileError {
        path: audio_path.to_string_lossy().to_string(),
        reason: "Audio file not found".to_string(),
      });
    }

    // Step 1: Get audio metadata using ffprobe
    let probe_output = FFmpegCommand::ffprobe()
      .args(vec![
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-show_format",
        &audio_path.to_string_lossy(),
      ])
      .execute()
      .await?;

    let probe_json: serde_json::Value =
      serde_json::from_slice(&probe_output.stdout).map_err(|e| {
        VideoCompilerError::ProcessingError {
          operation: "ffprobe_parse".to_string(),
          details: format!("Failed to parse ffprobe output: {}", e),
        }
      })?;

    // Extract audio stream metadata
    let audio_stream = probe_json["streams"]
      .as_array()
      .and_then(|streams| {
        streams.iter().find(|s| s["codec_type"].as_str() == Some("audio"))
      })
      .ok_or_else(|| VideoCompilerError::MediaFileError {
        path: audio_path.to_string_lossy().to_string(),
        reason: "No audio stream found".to_string(),
      })?;

    let sample_rate = audio_stream["sample_rate"]
      .as_str()
      .and_then(|s| s.parse::<u32>().ok())
      .unwrap_or(48000);

    let channels = audio_stream["channels"]
      .as_u64()
      .map(|c| c as u32)
      .unwrap_or(2);

    let duration = probe_json["format"]["duration"]
      .as_str()
      .and_then(|s| s.parse::<f64>().ok())
      .unwrap_or(0.0);

    if duration == 0.0 {
      return Err(VideoCompilerError::ProcessingError {
        operation: "duration_check".to_string(),
        details: "Audio file has zero duration".to_string(),
      });
    }

    let samples_per_pixel = sample_rate / pixels_per_second;
    let total_pixels = ((duration * pixels_per_second as f64).ceil() as usize).max(1);

    log::info!(
      "Audio metadata: sample_rate={}, channels={}, duration={:.2}s, total_pixels={}",
      sample_rate,
      channels,
      duration,
      total_pixels
    );

    // Step 2: Extract PCM audio data using FFmpeg
    // Convert to mono, 16-bit PCM, little-endian
    let mut ffmpeg_child = Command::new("ffmpeg")
      .args(&[
        "-i", &audio_path.to_string_lossy(),
        "-f", "s16le",          // 16-bit signed PCM, little-endian
        "-ac", "1",             // Convert to mono
        "-ar", &sample_rate.to_string(), // Keep original sample rate
        "-",                     // Output to stdout
      ])
      .stdout(Stdio::piped())
      .stderr(Stdio::null())
      .spawn()
      .map_err(|e| VideoCompilerError::ProcessingError {
        operation: "ffmpeg_spawn".to_string(),
        details: format!("Failed to spawn FFmpeg: {}", e),
      })?;

    let mut stdout = ffmpeg_child.stdout.take().ok_or_else(|| {
      VideoCompilerError::ProcessingError {
        operation: "ffmpeg_stdout".to_string(),
        details: "Failed to capture FFmpeg stdout".to_string(),
      }
    })?;

    // Read all PCM data
    let mut pcm_data = Vec::new();
    stdout.read_to_end(&mut pcm_data).await.map_err(|e| {
      VideoCompilerError::ProcessingError {
        operation: "read_pcm".to_string(),
        details: format!("Failed to read PCM data: {}", e),
      }
    })?;

    // Wait for FFmpeg to complete
    let status = ffmpeg_child.wait().await.map_err(|e| {
      VideoCompilerError::ProcessingError {
        operation: "ffmpeg_wait".to_string(),
        details: format!("FFmpeg process failed: {}", e),
      }
    })?;

    if !status.success() {
      return Err(VideoCompilerError::ProcessingError {
        operation: "ffmpeg_execution".to_string(),
        details: format!("FFmpeg exited with status: {}", status),
      });
    }

    log::info!("Extracted {} bytes of PCM data", pcm_data.len());

    // Step 3: Convert PCM bytes to i16 samples
    let samples: Vec<i16> = pcm_data
      .chunks_exact(2)
      .map(|chunk| i16::from_le_bytes([chunk[0], chunk[1]]))
      .collect();

    if samples.is_empty() {
      return Err(VideoCompilerError::ProcessingError {
        operation: "pcm_conversion".to_string(),
        details: "No audio samples extracted".to_string(),
      });
    }

    log::info!("Converted to {} audio samples", samples.len());

    // Step 4: Calculate min/max for each pixel
    let mut waveform_data = Vec::with_capacity(total_pixels * 2); // min/max pairs

    for pixel_index in 0..total_pixels {
      let start_sample = (pixel_index * samples_per_pixel as usize).min(samples.len());
      let end_sample = ((pixel_index + 1) * samples_per_pixel as usize).min(samples.len());

      if start_sample >= samples.len() {
        // No more samples, fill with silence
        waveform_data.push(0);
        waveform_data.push(0);
        continue;
      }

      let pixel_samples = &samples[start_sample..end_sample];

      if pixel_samples.is_empty() {
        waveform_data.push(0);
        waveform_data.push(0);
        continue;
      }

      let min_sample = *pixel_samples.iter().min().unwrap_or(&0);
      let max_sample = *pixel_samples.iter().max().unwrap_or(&0);

      // Convert to 8-bit or 16-bit format
      if bits == 8 {
        // Convert from i16 (-32768 to 32767) to i8 (-128 to 127)
        let min_8bit = (min_sample / 256) as i8;
        let max_8bit = (max_sample / 256) as i8;
        waveform_data.push(min_8bit as i32);
        waveform_data.push(max_8bit as i32);
      } else {
        // Keep as 16-bit
        waveform_data.push(min_sample as i32);
        waveform_data.push(max_sample as i32);
      }
    }

    log::info!("Generated waveform data with {} points", waveform_data.len() / 2);

    // Step 5: Create JSON in audiowaveform format
    let json_data = serde_json::json!({
      "version": 2,
      "channels": 1, // We converted to mono
      "sample_rate": sample_rate,
      "samples_per_pixel": samples_per_pixel,
      "bits": bits,
      "length": waveform_data.len(),
      "data": waveform_data,
    });

    Ok(json_data.to_string())
  }

  async fn batch_generate_previews(
    &self,
    requests: Vec<PreviewRequest>,
  ) -> Result<Vec<PreviewResult>> {
    let mut results = Vec::new();

    for request in requests {
      let result = match request.preview_type {
        PreviewType::Frame => {
          let data = self
            .generate_frame_preview(
              &request.source_path,
              request.timestamp.unwrap_or(0.0),
              request.resolution,
            )
            .await?;

          PreviewResult {
            preview_type: PreviewType::Frame,
            data,
            format: "jpeg".to_string(),
            resolution: request.resolution.unwrap_or((0, 0)),
            timestamp: request.timestamp,
          }
        }
        PreviewType::Waveform => {
          let (width, height) = request.resolution.unwrap_or((1920, 200));
          let data = self
            .generate_waveform(&request.source_path, width, height, "#00ff00")
            .await?;

          PreviewResult {
            preview_type: PreviewType::Waveform,
            data,
            format: "png".to_string(),
            resolution: (width, height),
            timestamp: None,
          }
        }
        _ => {
          return Err(VideoCompilerError::InvalidParameter(format!(
            "Неподдерживаемый тип превью: {:?}",
            request.preview_type
          )));
        }
      };

      results.push(result);
    }

    Ok(results)
  }

  async fn get_cached_preview(&self, key: &str) -> Result<Option<PreviewResult>> {
    let cache = self.preview_cache.read().await;
    Ok(cache.get(key).cloned())
  }

  async fn cache_preview(&self, key: &str, result: &PreviewResult) -> Result<()> {
    let mut cache = self.preview_cache.write().await;

    // Ограничиваем размер кэша
    if cache.len() > 1000 {
      // Удаляем старые записи (простая стратегия FIFO)
      let keys_to_remove: Vec<String> = cache.keys().take(100).cloned().collect();

      for key in keys_to_remove {
        cache.remove(&key);
      }
    }

    cache.insert(key.to_string(), result.clone());
    Ok(())
  }

  async fn generate_frame(
    &self,
    project: &ProjectSchema,
    timestamp: f64,
    output_path: &str,
    options: Option<crate::video_compiler::core::preview::PreviewOptions>,
  ) -> Result<()> {
    log::debug!(
      "Генерация кадра проекта {} на {}",
      project.metadata.name,
      timestamp
    );

    // Используем опции по умолчанию или переданные
    let opts = options.unwrap_or_else(|| crate::video_compiler::core::preview::PreviewOptions {
      width: Some(1280),
      height: Some(720),
      format: "jpeg".to_string(),
      quality: 85,
    });

    // Находим первый клип в таймлайне, который активен в указанное время
    let mut source_file = None;
    let mut clip_offset = 0.0;

    for track in &project.tracks {
      for clip in &track.clips {
        if clip.start_time <= timestamp && timestamp <= clip.end_time {
          if let crate::video_compiler::schema::timeline::ClipSource::File(path) = &clip.source {
            source_file = Some(path.clone());
            clip_offset = timestamp - clip.start_time + clip.source_start;
            break;
          }
        }
      }
      if source_file.is_some() {
        break;
      }
    }

    if let Some(file_path) = source_file {
      // Проверяем существование файла
      if !Path::new(&file_path).exists() {
        return Err(VideoCompilerError::MediaFileError {
          path: file_path.clone(),
          reason: "Файл не найден".to_string(),
        });
      }

      // Генерируем кадр из файла
      let size = (opts.width.unwrap_or(1280), opts.height.unwrap_or(720));
      let preview = self
        .generate_frame_preview(Path::new(&file_path), clip_offset, Some(size))
        .await
        .map_err(|e| {
          log::error!("Ошибка генерации кадра из {file_path}: {e}");
          VideoCompilerError::PreviewError {
            timestamp,
            reason: format!("Не удалось сгенерировать кадр: {e}"),
          }
        })?;

      // Создаем директорию для вывода если нужно
      if let Some(parent) = Path::new(output_path).parent() {
        tokio::fs::create_dir_all(parent)
          .await
          .map_err(|e| VideoCompilerError::Io(format!("Не удалось создать директорию: {e}")))?;
      }

      // Сохраняем результат в файл
      tokio::fs::write(output_path, preview)
        .await
        .map_err(|e| VideoCompilerError::Io(format!("Не удалось сохранить превью: {e}")))?;
    } else {
      // Если нет активного клипа, создаем черный кадр
      log::debug!("Нет активного клипа на времени {timestamp}, создаем черный кадр");

      // Создаем директорию для вывода если нужно
      if let Some(parent) = Path::new(output_path).parent() {
        tokio::fs::create_dir_all(parent)
          .await
          .map_err(|e| VideoCompilerError::Io(format!("Не удалось создать директорию: {e}")))?;
      }

      // Создаем минимальный черный JPEG
      // JPEG заголовок для черного изображения 1x1
      let black_jpeg = vec![
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06,
        0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B,
        0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31,
        0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF,
        0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00,
        0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B,
        0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05,
        0x04, 0x04, 0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21,
        0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
        0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0A,
        0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35, 0x36, 0x37,
        0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56,
        0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93,
        0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9,
        0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6,
        0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
        0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7,
        0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD0,
        0x03, 0xFF, 0xD9,
      ];

      tokio::fs::write(output_path, black_jpeg)
        .await
        .map_err(|e| VideoCompilerError::Io(format!("Не удалось сохранить черный кадр: {e}")))?;
    }

    Ok(())
  }

  async fn generate_preview_batch_for_file(
    &self,
    video_path: &Path,
    timestamps: Vec<f64>,
    resolution: Option<(u32, u32)>,
    _quality: Option<u8>,
  ) -> Result<Vec<Vec<u8>>> {
    log::debug!(
      "Пакетная генерация превью для {:?}, {} кадров",
      video_path,
      timestamps.len()
    );

    let mut results = Vec::new();

    // Генерируем каждый кадр отдельно
    for timestamp in timestamps {
      let preview = self
        .generate_frame_preview(video_path, timestamp, resolution)
        .await?;
      results.push(preview);
    }

    Ok(results)
  }
}

#[cfg(test)]
#[path = "preview_service_tests.rs"]
mod tests;
