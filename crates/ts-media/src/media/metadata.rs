// Модуль для получения метаданных медиафайлов

use super::ffmpeg::check_ffmpeg;
use super::types::{
  AudioMetadata, FfprobeFormat, FfprobeStream, ImageMetadata, MediaFile, MediaMetadata, ProbeData,
  VideoMetadata,
};
use std::path::Path;
use std::process::Command;
use std::str;
use std::time::{SystemTime, UNIX_EPOCH};

/// Получение метаданных медиафайла с помощью FFmpeg
pub fn get_media_metadata(file_path: String) -> Result<MediaFile, String> {
  // Проверяем наличие FFmpeg
  check_ffmpeg()?;

  // Проверяем существование файла
  if !Path::new(&file_path).exists() {
    return Err(format!("Файл не найден: {file_path}"));
  }

  // Получаем информацию о файле в формате JSON
  let output = Command::new("ffprobe")
    .args([
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      &file_path,
    ])
    .output()
    .map_err(|e| format!("Ошибка выполнения ffprobe: {e}"))?;

  let output_str =
    str::from_utf8(&output.stdout).map_err(|e| format!("Ошибка декодирования вывода: {e}"))?;

  // Парсим JSON
  let probe_data: serde_json::Value =
    serde_json::from_str(output_str).map_err(|e| format!("Ошибка парсинга JSON: {e}"))?;

  // Получаем имя файла из пути
  let file_name = Path::new(&file_path)
    .file_name()
    .and_then(|name| name.to_str())
    .unwrap_or("unknown")
    .to_string();

  // Определяем тип медиафайла
  let streams = probe_data["streams"].as_array();
  let format = probe_data["format"].as_object();

  // Флаги для типа файла
  let mut is_video = false;
  let mut is_audio = false;
  let mut is_image = false;

  // Создаем структуры для потоков и формата
  let mut ffprobe_streams: Vec<FfprobeStream> = Vec::new();
  let mut ffprobe_format = FfprobeFormat {
    duration: None,
    size: None,
    bit_rate: None,
    format_name: None,
  };

  if let (Some(streams_array), Some(format_obj)) = (streams, format) {
    // Заполняем информацию о формате
    parse_format_data(format_obj, &mut ffprobe_format);

    // Обрабатываем потоки
    for (i, stream) in streams_array.iter().enumerate() {
      let parsed_stream = parse_stream_data(stream, i);

      // Определяем тип файла по codec_type
      if parsed_stream.codec_type == "video" {
        // Проверяем, является ли это embedded picture в аудио файле
        let is_attached_pic = stream
          .get("disposition")
          .and_then(|d| d.get("attached_pic"))
          .and_then(|v| v.as_i64())
          == Some(1);

        if !is_attached_pic {
          // Это не attached picture - определяем по наличию duration
          // Если duration > 0 или duration отсутствует - это видео
          // Если duration == 0 - это изображение
          if let Some(duration) = ffprobe_format.duration {
            if duration > 0.0 {
              is_video = true;
            } else {
              is_image = true;
            }
          } else {
            // Если duration нет, считаем видео (безопасный fallback для .mp4)
            is_video = true;
          }
        }
        // attached_pic игнорируем - это обложка аудио
      } else if parsed_stream.codec_type == "audio" {
        is_audio = true;
      }

      ffprobe_streams.push(parsed_stream);
    }

    // Если тип еще не определен, но есть размеры - это изображение
    if !is_video && !is_audio && !is_image && !ffprobe_streams.is_empty() {
      if let (Some(_width), Some(_height)) = (ffprobe_streams[0].width, ffprobe_streams[0].height) {
        is_image = true;
      }
    }
  }

  // Определяем время создания
  let creation_time = extract_creation_time(format);

  // Получаем текущее время в формате ISO 8601
  let now = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_secs();

  // Создаем структуру MediaFile
  let media_file = MediaFile {
    id: file_path.clone(),
    name: file_name,
    path: file_path,
    is_video,
    is_audio,
    is_image,
    size: ffprobe_format.size.unwrap_or(0),
    duration: ffprobe_format.duration,
    start_time: now,
    creation_time: creation_time.unwrap_or_else(generate_iso8601_timestamp),
    probe_data: ProbeData {
      streams: ffprobe_streams,
      format: ffprobe_format,
    },
    thumbnail_path: None,
  };

  Ok(media_file)
}

/// Парсит данные формата из JSON
fn parse_format_data(
  format_obj: &serde_json::Map<String, serde_json::Value>,
  ffprobe_format: &mut FfprobeFormat,
) {
  ffprobe_format.duration = format_obj
    .get("duration")
    .and_then(|v| v.as_str())
    .and_then(|s| s.parse::<f64>().ok());

  ffprobe_format.size = format_obj
    .get("size")
    .and_then(|v| v.as_str())
    .and_then(|s| s.parse::<u64>().ok());

  ffprobe_format.bit_rate = format_obj
    .get("bit_rate")
    .and_then(|v| v.as_str())
    .map(String::from);

  ffprobe_format.format_name = format_obj
    .get("format_name")
    .and_then(|v| v.as_str())
    .map(String::from);
}

/// Парсит данные потока из JSON
fn parse_stream_data(stream: &serde_json::Value, index: usize) -> FfprobeStream {
  let stream_index = stream
    .get("index")
    .and_then(|v| v.as_u64())
    .map(|v| v as u32)
    .unwrap_or(index as u32);

  let codec_type = stream
    .get("codec_type")
    .and_then(|v| v.as_str())
    .unwrap_or("unknown")
    .to_string();

  let codec_name = stream
    .get("codec_name")
    .and_then(|v| v.as_str())
    .map(String::from);

  let width = stream
    .get("width")
    .and_then(|v| v.as_u64())
    .map(|v| v as u32);

  let height = stream
    .get("height")
    .and_then(|v| v.as_u64())
    .map(|v| v as u32);

  let bit_rate = stream
    .get("bit_rate")
    .and_then(|v| v.as_str())
    .map(String::from);

  let r_frame_rate = stream
    .get("r_frame_rate")
    .and_then(|v| v.as_str())
    .map(String::from);

  let sample_rate = stream
    .get("sample_rate")
    .and_then(|v| v.as_str())
    .map(String::from);

  let channels = stream
    .get("channels")
    .and_then(|v| v.as_u64())
    .map(|v| v as u8);

  let display_aspect_ratio = stream
    .get("display_aspect_ratio")
    .and_then(|v| v.as_str())
    .map(String::from);

  FfprobeStream {
    index: stream_index,
    codec_type,
    codec_name,
    width,
    height,
    bit_rate,
    r_frame_rate,
    sample_rate,
    channels,
    display_aspect_ratio,
  }
}

/// Извлекает время создания из метаданных формата
fn extract_creation_time(
  format: Option<&serde_json::Map<String, serde_json::Value>>,
) -> Option<String> {
  format?
    .get("tags")
    .and_then(|tags| tags.get("creation_time"))
    .and_then(|v| v.as_str())
    .map(String::from)
}

/// Генерирует текущее время в формате ISO 8601
fn generate_iso8601_timestamp() -> String {
  let now = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default();

  let secs = now.as_secs();
  let nanos = now.subsec_nanos();

  format!("{secs}.{nanos:09}Z")
}

/// Асинхронная функция для извлечения метаданных
#[allow(dead_code)] // Used in tests
pub async fn extract_metadata(file_path: &Path) -> Result<MediaMetadata, String> {
  use tokio::process::Command;

  // Проверяем существование файла
  if !file_path.exists() {
    return Err(format!("File not found: {file_path:?}"));
  }

  // Выполняем ffprobe асинхронно
  let output = Command::new("ffprobe")
    .args([
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      file_path.to_str().unwrap(),
    ])
    .output()
    .await
    .map_err(|e| format!("Failed to execute ffprobe: {e}"))?;

  if !output.status.success() {
    return Err(format!(
      "ffprobe failed: {}",
      String::from_utf8_lossy(&output.stderr)
    ));
  }

  let output_str =
    std::str::from_utf8(&output.stdout).map_err(|e| format!("Failed to decode output: {e}"))?;

  let probe_data: serde_json::Value =
    serde_json::from_str(output_str).map_err(|e| format!("Failed to parse JSON: {e}"))?;

  // Извлекаем потоки
  let streams = probe_data["streams"].as_array();
  let format = probe_data["format"].as_object();

  // Определяем тип медиа по потокам
  let video_stream = streams.and_then(|s| {
    s.iter()
      .find(|stream| stream["codec_type"].as_str() == Some("video"))
  });

  let audio_stream = streams.and_then(|s| {
    s.iter()
      .find(|stream| stream["codec_type"].as_str() == Some("audio"))
  });

  // Если есть видеопоток
  if let Some(video) = video_stream {
    let duration = format
      .and_then(|f| f.get("duration"))
      .and_then(|d| d.as_str())
      .and_then(|d| d.parse::<f64>().ok());

    // Проверяем, это изображение или видео
    if duration.unwrap_or(0.0) == 0.0 {
      // Это изображение
      Ok(MediaMetadata::Image(ImageMetadata {
        width: video
          .get("width")
          .and_then(|v| v.as_u64())
          .map(|v| v as u32),
        height: video
          .get("height")
          .and_then(|v| v.as_u64())
          .map(|v| v as u32),
        format: video
          .get("codec_name")
          .and_then(|v| v.as_str())
          .map(String::from),
        size: format
          .and_then(|f| f.get("size"))
          .and_then(|v| v.as_str())
          .and_then(|s| s.parse::<u64>().ok()),
        creation_time: extract_creation_time(format),
      }))
    } else {
      // Это видео
      Ok(MediaMetadata::Video(VideoMetadata {
        duration,
        width: video
          .get("width")
          .and_then(|v| v.as_u64())
          .map(|v| v as u32),
        height: video
          .get("height")
          .and_then(|v| v.as_u64())
          .map(|v| v as u32),
        fps: video
          .get("r_frame_rate")
          .and_then(|v| v.as_str())
          .and_then(|fps| fps.split('/').next())
          .and_then(|n| n.parse::<f64>().ok()),
        codec: video
          .get("codec_name")
          .and_then(|v| v.as_str())
          .map(String::from),
        bitrate: video
          .get("bit_rate")
          .and_then(|v| v.as_str())
          .and_then(|b| b.parse::<u64>().ok()),
        size: format
          .and_then(|f| f.get("size"))
          .and_then(|v| v.as_str())
          .and_then(|s| s.parse::<u64>().ok()),
        creation_time: extract_creation_time(format),
      }))
    }
  } else if let Some(audio) = audio_stream {
    // Только аудио
    Ok(MediaMetadata::Audio(AudioMetadata {
      duration: format
        .and_then(|f| f.get("duration"))
        .and_then(|v| v.as_str())
        .and_then(|d| d.parse::<f64>().ok()),
      sample_rate: audio
        .get("sample_rate")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<u32>().ok()),
      channels: audio
        .get("channels")
        .and_then(|v| v.as_u64())
        .map(|c| c as u8),
      codec: audio
        .get("codec_name")
        .and_then(|v| v.as_str())
        .map(String::from),
      bitrate: audio
        .get("bit_rate")
        .and_then(|v| v.as_str())
        .and_then(|b| b.parse::<u64>().ok()),
      size: format
        .and_then(|f| f["size"].as_str())
        .and_then(|s| s.parse::<u64>().ok()),
      creation_time: extract_creation_time(format),
    }))
  } else {
    Err("No supported media streams found".to_string())
  }
}

#[cfg(test)]
mod tests;
