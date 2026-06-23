//! Бизнес-логика для анализа видео (тестируемые функции)

use super::types::*;

/// Парсинг JSON метаданных от ffprobe
pub fn parse_ffprobe_metadata(json_output: &str) -> Result<VideoMetadata, String> {
  let probe_data: serde_json::Value =
    serde_json::from_str(json_output).map_err(|e| format!("Ошибка парсинга JSON: {e}"))?;

  let format = probe_data.get("format").ok_or("Не найдена секция format")?;
  let streams = probe_data
    .get("streams")
    .and_then(|s| s.as_array())
    .ok_or("Не найдена секция streams")?;

  let video_stream = streams
    .iter()
    .find(|s| s.get("codec_type").and_then(|t| t.as_str()) == Some("video"))
    .ok_or("Видеопоток не найден")?;

  let audio_stream = streams
    .iter()
    .find(|s| s.get("codec_type").and_then(|t| t.as_str()) == Some("audio"));

  let duration = format
    .get("duration")
    .and_then(|d| d.as_str())
    .and_then(|d| d.parse::<f64>().ok())
    .unwrap_or(0.0);

  let width = video_stream
    .get("width")
    .and_then(|w| w.as_u64())
    .unwrap_or(0) as u32;

  let height = video_stream
    .get("height")
    .and_then(|h| h.as_u64())
    .unwrap_or(0) as u32;

  let fps = parse_fps_from_string(
    video_stream
      .get("r_frame_rate")
      .and_then(|f| f.as_str())
      .unwrap_or("0/1"),
  );

  let bitrate = format
    .get("bit_rate")
    .and_then(|b| b.as_str())
    .and_then(|b| b.parse::<u64>().ok())
    .unwrap_or(0);

  let codec = video_stream
    .get("codec_name")
    .and_then(|c| c.as_str())
    .unwrap_or("unknown")
    .to_string();

  let format_name = format
    .get("format_name")
    .and_then(|f| f.as_str())
    .unwrap_or("unknown")
    .to_string();

  let file_size = format
    .get("size")
    .and_then(|s| s.as_str())
    .and_then(|s| s.parse::<u64>().ok())
    .unwrap_or(0);

  let has_audio = audio_stream.is_some();
  let audio_codec = audio_stream
    .and_then(|s| s.get("codec_name"))
    .and_then(|c| c.as_str())
    .map(|c| c.to_string());

  let audio_channels = audio_stream
    .and_then(|s| s.get("channels"))
    .and_then(|c| c.as_u64())
    .map(|c| c as u32);

  let audio_sample_rate = audio_stream
    .and_then(|s| s.get("sample_rate"))
    .and_then(|r| r.as_str())
    .and_then(|r| r.parse::<u32>().ok());

  Ok(VideoMetadata {
    duration,
    width,
    height,
    fps,
    bitrate,
    codec,
    format: format_name,
    has_audio,
    audio_codec,
    audio_channels,
    audio_sample_rate,
    file_size,
  })
}

/// Парсинг FPS из строки вида "30/1" или "24000/1001"
pub fn parse_fps_from_string(fps_str: &str) -> f64 {
  let parts: Vec<&str> = fps_str.split('/').collect();
  if parts.len() == 2 {
    let num: f64 = parts[0].parse().unwrap_or(0.0);
    let den: f64 = parts[1].parse().unwrap_or(1.0);
    if den != 0.0 {
      num / den
    } else {
      0.0
    }
  } else {
    fps_str.parse().unwrap_or(0.0)
  }
}

/// Расчет качественных метрик видео на основе полученных данных
/// Использует реальный анализ через FFmpeg вместо mock данных
pub async fn calculate_quality_metrics_async(
  video_path: &std::path::Path,
  sample_rate: f64,
  enable_noise_detection: bool,
  enable_stability_check: bool,
) -> ts_render::video_compiler::error::Result<QualityAnalysisResult> {
  // Используем реальный анализ качества из ffmpeg модуля
  ts_render_analysis::quality::analyze_video_quality(
    video_path,
    sample_rate,
    enable_noise_detection,
    enable_stability_check,
  )
  .await
}

/// Синхронная fallback функция для совместимости
/// DEPRECATED: Используйте calculate_quality_metrics_async для реального анализа
pub fn calculate_quality_metrics(
  enable_noise_detection: bool,
  enable_stability_check: bool,
  mock_analysis_data: Option<&serde_json::Value>,
) -> QualityAnalysisResult {
  log::warn!(
    "Использование устаревшей fallback функции calculate_quality_metrics. Рекомендуется использовать calculate_quality_metrics_async."
  );

  // Возвращаем базовые mock данные только для совместимости
  let base_quality = if let Some(data) = mock_analysis_data {
    data.get("quality").and_then(|q| q.as_f64()).unwrap_or(0.75)
  } else {
    0.75 // Default value
  };

  let mut issues = Vec::new();

  let brightness = 0.6;
  if brightness < 0.4 {
    issues.push("Низкая яркость в некоторых кадрах".to_string());
  }

  let noise_level = if enable_noise_detection { 0.2 } else { 0.1 };
  if noise_level > 0.15 {
    issues.push("Обнаружен шум в видео".to_string());
  }

  let stability = if enable_stability_check { 0.85 } else { 0.9 };
  if stability < 0.8 {
    issues.push("Нестабильность камеры".to_string());
  }

  QualityAnalysisResult {
    overall: base_quality,
    sharpness: 0.8,
    brightness,
    contrast: 0.7,
    saturation: 0.65,
    noise: noise_level,
    stability,
    issues,
  }
}

/// Генерация тестовых сцен на основе параметров
pub fn generate_scene_detection_result(
  threshold: f64,
  min_scene_length: f64,
  video_duration: f64,
) -> SceneDetectionResult {
  // Базовое количество сцен зависит от порога
  let base_scene_count = if threshold < 0.3 {
    6 // Низкий порог - больше сцен
  } else if threshold < 0.6 {
    4 // Средний порог
  } else {
    2 // Высокий порог - меньше сцен
  };

  let mut scenes = Vec::new();
  let scene_duration = video_duration / base_scene_count as f64;

  for i in 0..base_scene_count {
    let start_time = i as f64 * scene_duration;
    let end_time = ((i + 1) as f64 * scene_duration).min(video_duration);
    let duration = end_time - start_time;

    // Проверяем минимальную длительность сцены
    if duration >= min_scene_length {
      scenes.push(Scene {
        start_time,
        end_time,
        confidence: 0.7 + (threshold * 0.3), // Выше порог = выше уверенность
        thumbnail_path: None,
      });
    }
  }

  let total_scenes = scenes.len() as u32;
  let average_scene_length = if total_scenes > 0 {
    scenes
      .iter()
      .map(|s| s.end_time - s.start_time)
      .sum::<f64>()
      / total_scenes as f64
  } else {
    0.0
  };

  SceneDetectionResult {
    scenes,
    total_scenes,
    average_scene_length,
  }
}

/// Анализ тишины в аудио на основе параметров
pub fn analyze_silence_patterns(
  threshold_db: f64,
  min_duration: f64,
  total_duration: f64,
) -> SilenceDetectionResult {
  let mut silences = Vec::new();

  // Генерируем паттерны тишины на основе порога
  let silence_frequency = if threshold_db < -40.0 {
    0.1 // Строгий порог - мало тишины
  } else if threshold_db < -25.0 {
    0.2 // Средний порог
  } else {
    0.4 // Мягкий порог - больше тишины
  };

  let silence_count = ((total_duration * silence_frequency) / min_duration) as usize;

  for i in 0..silence_count {
    let start_time = (i as f64 + 1.0) * (total_duration / (silence_count + 1) as f64);
    let duration = min_duration + (i as f64 * 0.5); // Увеличиваем длительность
    let end_time = start_time + duration;

    if end_time <= total_duration {
      silences.push(SilenceSegment {
        start_time,
        end_time,
        duration,
        confidence: 0.8 + (threshold_db.abs() / 100.0), // Выше порог = выше уверенность
      });
    }
  }

  let total_silence_duration: f64 = silences.iter().map(|s| s.duration).sum();
  let speech_percentage: f64 =
    ((total_duration - total_silence_duration) / total_duration * 100.0).clamp(0.0, 100.0);

  SilenceDetectionResult {
    silences,
    total_silence_duration,
    speech_percentage,
  }
}

/// Генерация результата анализа движения
pub fn generate_motion_analysis_result(sensitivity: f64) -> MotionAnalysisResult {
  let motion_intensity = (sensitivity * 0.8).min(1.0);

  let camera_movement = CameraMovement {
    panning: sensitivity * 0.3,
    tilting: sensitivity * 0.2,
    zooming: sensitivity * 0.1,
    stability: (1.0 - sensitivity * 0.4).max(0.0),
  };

  let object_movement = sensitivity * 0.6;

  // Генерируем профиль движения
  let mut motion_profile = Vec::new();
  for i in 0..10 {
    motion_profile.push(MotionPoint {
      timestamp: i as f64 * 6.0, // Каждые 6 секунд
      intensity: motion_intensity * (0.5 + (i as f64 * 0.1).sin() * 0.5),
    });
  }

  MotionAnalysisResult {
    motion_intensity,
    camera_movement,
    object_movement,
    motion_profile,
  }
}

/// Генерация результата извлечения ключевых кадров
pub fn generate_keyframe_extraction_result(
  interval: f64,
  max_frames: u32,
) -> KeyFrameExtractionResult {
  let mut key_frames = Vec::new();

  for i in 0..max_frames.min(10) {
    key_frames.push(KeyFrame {
      timestamp: i as f64 * interval,
      image_path: format!("keyframe_{i:03}.jpg"),
      confidence: 0.8 + (i as f64 * 0.02),
      description: Some(format!("Ключевой кадр {}", i + 1)),
    });
  }

  KeyFrameExtractionResult {
    key_frames,
    thumbnail_path: "thumbnail.jpg".to_string(),
  }
}

/// Генерация результата анализа аудио
pub fn generate_audio_analysis_result(sample_rate: f64) -> AudioAnalysisResult {
  let base_quality = (sample_rate / 10.0).min(1.0);

  let volume = VolumeData {
    average: base_quality * 0.6,
    peak: base_quality * 0.9,
    rms: base_quality * 0.7,
  };

  let frequency = FrequencyData {
    low_end: base_quality * 0.5,
    mid_range: base_quality * 0.8,
    high_end: base_quality * 0.6,
  };

  let dynamics = DynamicsData {
    dynamic_range: base_quality * 0.7,
    compression_ratio: 2.0 + sample_rate * 0.1,
  };

  let quality = AudioQuality {
    clipping: sample_rate > 8.0,
    noise_level: (1.0 - base_quality) * 0.3,
    overall_quality: base_quality,
  };

  AudioAnalysisResult {
    volume,
    frequency,
    dynamics,
    quality,
  }
}

/// Генерация результата быстрого анализа
pub fn generate_quick_analysis_result() -> serde_json::Value {
  serde_json::json!({
    "duration": 120.0,
    "fps": 30.0,
    "resolution": "1920x1080",
    "has_audio": true,
    "estimated_quality": 0.8,
    "motion_level": "medium",
    "audio_quality": "good",
    "scene_count": 4,
    "timestamp": chrono::Utc::now().timestamp()
  })
}
