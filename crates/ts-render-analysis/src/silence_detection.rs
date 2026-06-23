//! Модуль для детекции тишины в аудио с помощью FFmpeg

use super::FFmpegCommand;
use crate::types::{SilenceDetectionResult, SilenceSegment};
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use regex::Regex;
use std::path::Path;

/// Детекция участков тишины в аудио
pub async fn detect_silence(
  file_path: &Path,
  threshold_db: f64,
  min_duration: f64,
) -> Result<SilenceDetectionResult> {
  // Проверяем существование файла
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path.to_string_lossy().to_string(),
      reason: "File not found".to_string(),
    });
  }

  // Используем фильтр silencedetect для обнаружения тишины
  let output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-af",
      &format!("silencedetect=noise={}dB:d={}", threshold_db, min_duration),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  // Парсим вывод для извлечения информации о тишине
  let stderr = String::from_utf8_lossy(&output.stderr);
  let silences = parse_silence_detection_output(&stderr)?;

  // Получаем общую длительность для расчета процента речи
  let metadata = super::analysis::get_video_metadata(file_path).await?;
  let total_duration = metadata.duration;

  // Вычисляем статистику
  let total_silence_duration: f64 = silences.iter().map(|s| s.duration).sum();
  let speech_percentage = if total_duration > 0.0 {
    ((total_duration - total_silence_duration) / total_duration * 100.0).clamp(0.0, 100.0)
  } else {
    0.0
  };

  Ok(SilenceDetectionResult {
    silences,
    total_silence_duration,
    speech_percentage,
  })
}

/// Расширенная детекция тишины с дополнительными параметрами
pub async fn detect_silence_advanced(
  file_path: &Path,
  threshold_db: f64,
  min_duration: f64,
  peak_threshold: Option<f64>,
  mono: bool,
) -> Result<SilenceDetectionResult> {
  // Проверяем существование файла
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path.to_string_lossy().to_string(),
      reason: "File not found".to_string(),
    });
  }

  // Строим фильтр с дополнительными параметрами
  let mut filter = format!("silencedetect=noise={}dB:d={}", threshold_db, min_duration);

  // Добавляем пороговое значение пиков если указано
  if let Some(peak) = peak_threshold {
    filter.push_str(&format!(":peak={}", peak));
  }

  // Добавляем конвертацию в моно если требуется
  if mono {
    filter = format!("aformat=channel_layouts=mono,{}", filter);
  }

  let output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-af",
      &filter,
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  let stderr = String::from_utf8_lossy(&output.stderr);
  let mut silences = parse_silence_detection_output(&stderr)?;

  // Вычисляем уверенность для каждого сегмента на основе длительности
  for silence in &mut silences {
    // Чем длиннее тишина, тем выше уверенность
    silence.confidence = (silence.duration / 10.0).clamp(0.5, 1.0);
  }

  // Получаем общую длительность
  let metadata = super::analysis::get_video_metadata(file_path).await?;
  let total_duration = metadata.duration;

  let total_silence_duration: f64 = silences.iter().map(|s| s.duration).sum();
  let speech_percentage = if total_duration > 0.0 {
    ((total_duration - total_silence_duration) / total_duration * 100.0).clamp(0.0, 100.0)
  } else {
    0.0
  };

  Ok(SilenceDetectionResult {
    silences,
    total_silence_duration,
    speech_percentage,
  })
}

/// Парсинг вывода FFmpeg для извлечения информации о тишине
fn parse_silence_detection_output(stderr: &str) -> Result<Vec<SilenceSegment>> {
  let mut silences = Vec::new();
  let mut current_silence_start: Option<f64> = None;

  // Регулярные выражения для поиска начала и конца тишины
  let silence_start_regex = Regex::new(r"silence_start: ([\d.]+)").map_err(|e| {
    VideoCompilerError::SerializationError(format!("Failed to compile regex: {}", e))
  })?;

  let silence_end_regex = Regex::new(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)")
    .map_err(|e| {
      VideoCompilerError::SerializationError(format!("Failed to compile regex: {}", e))
    })?;

  for line in stderr.lines() {
    // Ищем начало тишины
    if let Some(captures) = silence_start_regex.captures(line) {
      if let Some(start_match) = captures.get(1) {
        if let Ok(start_time) = start_match.as_str().parse::<f64>() {
          current_silence_start = Some(start_time);
        }
      }
    }

    // Ищем конец тишины
    if let Some(captures) = silence_end_regex.captures(line) {
      if let (Some(end_match), Some(duration_match)) = (captures.get(1), captures.get(2)) {
        if let (Ok(end_time), Ok(duration)) = (
          end_match.as_str().parse::<f64>(),
          duration_match.as_str().parse::<f64>(),
        ) {
          // Используем сохраненное начало или вычисляем из конца и длительности
          let start_time = current_silence_start.unwrap_or(end_time - duration);

          silences.push(SilenceSegment {
            start_time,
            end_time,
            duration,
            confidence: 0.9, // Высокая уверенность для обнаруженной тишины
          });

          current_silence_start = None;
        }
      }
    }
  }

  // Сортируем по времени начала
  silences.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());

  Ok(silences)
}

/// Удаление участков тишины из аудио/видео файла
pub async fn remove_silence(
  input_path: &Path,
  output_path: &Path,
  threshold_db: f64,
  min_duration: f64,
  preserve_gaps: f64, // Минимальный промежуток для сохранения
) -> Result<()> {
  // Сначала детектируем тишину
  let silence_result = detect_silence(input_path, threshold_db, min_duration).await?;

  if silence_result.silences.is_empty() {
    // Нет тишины для удаления - просто копируем файл
    tokio::fs::copy(input_path, output_path)
      .await
      .map_err(|e| VideoCompilerError::IoError {
        operation: "copy file".to_string(),
        path: input_path.to_string_lossy().to_string(),
        details: e.to_string(),
      })?;
    return Ok(());
  }

  // Строим сложный фильтр для удаления тишины
  let mut select_parts = Vec::new();
  let mut last_end = 0.0;

  for silence in &silence_result.silences {
    // Добавляем участок до тишины
    if silence.start_time > last_end {
      select_parts.push(format!("between(t,{},{})", last_end, silence.start_time));
    }

    // Проверяем, нужно ли сохранить небольшой промежуток
    if silence.duration > preserve_gaps {
      // Сохраняем небольшую часть тишины для естественности
      let gap_start = silence.start_time;
      let gap_end = silence.start_time + preserve_gaps;
      select_parts.push(format!("between(t,{},{})", gap_start, gap_end));
    }

    last_end = silence.end_time;
  }

  // Добавляем последний участок после последней тишины
  select_parts.push(format!("gte(t,{})", last_end));

  // Объединяем все части в один фильтр select
  let select_filter = select_parts.join("+");

  // Строим полный фильтр для видео и аудио
  let filter_complex = format!(
    "[0:v]select='{}',setpts=N/FRAME_RATE/TB[v];[0:a]aselect='{}',asetpts=N/SR/TB[a]",
    select_filter, select_filter
  );

  // Выполняем команду FFmpeg
  FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &input_path.to_string_lossy(),
      "-filter_complex",
      &filter_complex,
      "-map",
      "[v]",
      "-map",
      "[a]",
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-y",
    ])
    .arg(output_path.to_string_lossy())
    .execute()
    .await?;

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_parse_silence_detection_output() {
    let sample_output = r#"
[silencedetect @ 0x7fa8d8f04340] silence_start: 1.48
[silencedetect @ 0x7fa8d8f04340] silence_end: 3.52 | silence_duration: 2.04
[silencedetect @ 0x7fa8d8f04340] silence_start: 15.3
[silencedetect @ 0x7fa8d8f04340] silence_end: 18.7 | silence_duration: 3.4
"#;

    let silences = parse_silence_detection_output(sample_output).unwrap();

    assert_eq!(silences.len(), 2);

    assert_eq!(silences[0].start_time, 1.48);
    assert_eq!(silences[0].end_time, 3.52);
    assert_eq!(silences[0].duration, 2.04);

    assert_eq!(silences[1].start_time, 15.3);
    assert_eq!(silences[1].end_time, 18.7);
    assert_eq!(silences[1].duration, 3.4);
  }

  #[test]
  fn test_parse_silence_detection_empty() {
    let sample_output = "No silence detected";
    let silences = parse_silence_detection_output(sample_output).unwrap();
    assert_eq!(silences.len(), 0);
  }

  #[test]
  fn test_parse_silence_detection_partial() {
    // Тест с неполными данными (только начало без конца)
    let sample_output = r#"
[silencedetect @ 0x7fa8d8f04340] silence_start: 1.48
Some other output
"#;
    let silences = parse_silence_detection_output(sample_output).unwrap();
    // Должен игнорировать неполные данные
    assert_eq!(silences.len(), 0);
  }
}
