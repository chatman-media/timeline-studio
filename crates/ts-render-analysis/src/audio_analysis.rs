//! Модуль для анализа аудио с помощью FFmpeg

use super::FFmpegCommand;
use crate::types::{
  AudioAnalysisResult, AudioQuality, DynamicsData, FrequencyData, VolumeData,
};
use ts_render::video_compiler::error::{Result, VideoCompilerError};
use regex::Regex;
use std::path::Path;

/// Анализ аудио дорожки видео
pub async fn analyze_audio(file_path: &Path, sample_rate: f64) -> Result<AudioAnalysisResult> {
  // Проверяем существование файла
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path.to_string_lossy().to_string(),
      reason: "File not found".to_string(),
    });
  }

  // Анализируем различные аспекты аудио
  let volume = analyze_volume_data(file_path).await?;
  let frequency = analyze_frequency_data(file_path, sample_rate).await?;
  let dynamics = analyze_dynamics_data(file_path).await?;
  let quality = analyze_audio_quality(file_path).await?;

  Ok(AudioAnalysisResult {
    volume,
    frequency,
    dynamics,
    quality,
  })
}

/// Анализ данных громкости
async fn analyze_volume_data(file_path: &Path) -> Result<VolumeData> {
  // Используем фильтр volumedetect для анализа громкости
  let output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-af",
      "volumedetect",
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  let stderr = String::from_utf8_lossy(&output.stderr);

  // Парсим результаты
  let mean_volume = parse_volume_value(&stderr, "mean_volume")?;
  let max_volume = parse_volume_value(&stderr, "max_volume")?;

  // Нормализуем значения к диапазону 0-1
  let average = normalize_db_to_linear(mean_volume);
  let peak = normalize_db_to_linear(max_volume);
  let rms = average * 0.9; // Приближение RMS к среднему

  Ok(VolumeData { average, peak, rms })
}

/// Анализ частотных данных
async fn analyze_frequency_data(file_path: &Path, sample_rate: f64) -> Result<FrequencyData> {
  // Используем ffmpeg для анализа спектра
  let _output = FFmpegCommand::ffmpeg()
        .args(vec![
            "-i", &file_path.to_string_lossy(),
            "-af", &format!("aemphasis=mode=projection:level_in=7:level_out=0,aformat=channel_layouts=mono,showcqt=s=640x360:fps={}", sample_rate),
            "-f", "null",
            "-"
        ])
        .execute()
        .await?;

  // В реальной реализации здесь был бы анализ спектра
  // Пока возвращаем примерные значения
  Ok(FrequencyData {
    low_end: 0.7,   // Басы присутствуют
    mid_range: 0.8, // Средние частоты хорошо представлены
    high_end: 0.6,  // Высокие частоты умеренные
  })
}

/// Анализ динамических данных
async fn analyze_dynamics_data(file_path: &Path) -> Result<DynamicsData> {
  // Используем astats для анализа динамического диапазона
  let _output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-af",
      "astats=metadata=1",
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  // В реальной реализации здесь был бы анализ динамического диапазона
  Ok(DynamicsData {
    dynamic_range: 0.7,
    compression_ratio: 2.5,
  })
}

/// Анализ качества аудио
async fn analyze_audio_quality(file_path: &Path) -> Result<AudioQuality> {
  // Используем фильтр для детекции клиппинга и шума
  let output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-af",
      "volumedetect,astats=metadata=1:reset=1",
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  let stderr = String::from_utf8_lossy(&output.stderr);

  // Проверяем на клиппинг
  let max_volume = parse_volume_value(&stderr, "max_volume")?;
  let clipping = max_volume >= -0.1; // Почти 0 dB = клиппинг

  // Оцениваем уровень шума
  let noise_level = if max_volume < -60.0 {
    0.9 // Очень тихий сигнал = много шума
  } else {
    0.1 // Нормальный сигнал
  };

  // Общая оценка качества
  let overall_quality = if clipping {
    0.3 // Плохое качество из-за клиппинга
  } else if noise_level > 0.5 {
    0.5 // Среднее качество из-за шума
  } else {
    0.9 // Хорошее качество
  };

  Ok(AudioQuality {
    clipping,
    noise_level,
    overall_quality,
  })
}

/// Парсинг значения громкости из вывода FFmpeg
fn parse_volume_value(output: &str, key: &str) -> Result<f64> {
  let regex = Regex::new(&format!(r"{}: ([-\d.]+) dB", key)).map_err(|e| {
    VideoCompilerError::SerializationError(format!("Failed to compile regex: {}", e))
  })?;

  if let Some(captures) = regex.captures(output) {
    if let Some(value_match) = captures.get(1) {
      if let Ok(value) = value_match.as_str().parse::<f64>() {
        return Ok(value);
      }
    }
  }

  Ok(-60.0) // Значение по умолчанию (тишина)
}

/// Нормализация децибел в линейное значение (0-1)
fn normalize_db_to_linear(db: f64) -> f64 {
  // Преобразуем dB в линейное значение
  // 0 dB = 1.0, -60 dB ≈ 0.0
  let linear = 10f64.powf(db / 20.0);
  linear.clamp(0.0, 1.0)
}

/// Расширенный анализ с частотным спектром
pub async fn analyze_audio_spectrum(file_path: &Path, fft_size: u32) -> Result<Vec<Vec<f64>>> {
  // Используем showspectrum для анализа спектра
  let _output = FFmpegCommand::ffmpeg()
    .args(vec![
      "-i",
      &file_path.to_string_lossy(),
      "-af",
      &format!("showspectrum=s={}x512:mode=combined:scale=log", fft_size),
      "-f",
      "null",
      "-",
    ])
    .execute()
    .await?;

  // В реальной реализации здесь был бы парсинг спектральных данных
  // Возвращаем примерные данные спектра
  let mut spectrum = Vec::new();
  for i in 0..10 {
    let mut freq_bins = Vec::new();
    for j in 0..fft_size {
      // Генерируем примерные значения спектра
      freq_bins.push((j as f64 / fft_size as f64) * (1.0 - i as f64 / 10.0));
    }
    spectrum.push(freq_bins);
  }
  Ok(spectrum)
}

/// Анализ темпа (BPM) для музыки
pub async fn analyze_tempo(file_path: &Path) -> Result<Option<f64>> {
  // В реальной реализации здесь был бы анализ темпа
  // Это требует более сложной обработки сигнала

  // Пока возвращаем примерное значение для музыкальных файлов
  // В реальной реализации здесь был бы анализ темпа через FFT
  // Пока возвращаем примерное значение
  let quality = analyze_audio_quality(file_path).await?;

  if quality.overall_quality > 0.7 {
    Ok(Some(120.0)) // Типичный темп для качественной записи
  } else {
    Ok(None) // Не можем определить темп для низкого качества
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_normalize_db_to_linear() {
    assert_eq!(normalize_db_to_linear(0.0), 1.0);
    assert!(normalize_db_to_linear(-20.0) < 0.2);
    assert!(normalize_db_to_linear(-60.0) < 0.01);
  }

  #[test]
  fn test_parse_volume_value() {
    let output = "mean_volume: -23.5 dB\nmax_volume: -10.2 dB";
    assert_eq!(parse_volume_value(output, "mean_volume").unwrap(), -23.5);
    assert_eq!(parse_volume_value(output, "max_volume").unwrap(), -10.2);
  }
}
