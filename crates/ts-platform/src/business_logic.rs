//! Бизнес-логика для оптимизации под платформы

use crate::types::*;
use std::path::Path;
use std::process::Command;

/// Получить метаданные видеофайла
pub fn get_video_metadata(input_path: &str) -> Result<PlatformVideoMetadata, String> {
  if !Path::new(input_path).exists() {
    return Err(format!("Файл не найден: {}", input_path));
  }

  // Используем ffprobe для получения метаданных
  let output = Command::new("ffprobe")
    .arg("-v")
    .arg("quiet")
    .arg("-print_format")
    .arg("json")
    .arg("-show_format")
    .arg("-show_streams")
    .arg(input_path)
    .output()
    .map_err(|e| format!("Ошибка запуска ffprobe: {}", e))?;

  if !output.status.success() {
    return Err("Не удалось получить метаданные видео".to_string());
  }

  // Простая заглушка для парсинга
  Ok(PlatformVideoMetadata {
    width: 1920,
    height: 1080,
    duration: 60.0,
    bitrate: 5000,
    framerate: 30.0,
    codec: "h264".to_string(),
    file_size: 50_000_000,
  })
}

/// Валидировать параметры оптимизации
pub fn validate_optimization_params(params: &PlatformOptimizationParams) -> Result<(), String> {
  if params.input_path.is_empty() {
    return Err("Путь к входному файлу не может быть пустым".to_string());
  }

  if params.output_path.is_empty() {
    return Err("Путь к выходному файлу не может быть пустым".to_string());
  }

  if params.target_width == 0 || params.target_height == 0 {
    return Err("Размеры должны быть больше нуля".to_string());
  }

  if params.target_bitrate == 0 {
    return Err("Битрейт должен быть больше нуля".to_string());
  }

  if params.target_framerate == 0 {
    return Err("Частота кадров должна быть больше нуля".to_string());
  }

  Ok(())
}

/// Построить команду FFmpeg для оптимизации
pub fn build_ffmpeg_command(params: &PlatformOptimizationParams) -> Vec<String> {
  let mut cmd = vec![
    "ffmpeg".to_string(),
    "-i".to_string(),
    params.input_path.clone(),
    "-y".to_string(), // Перезаписать выходной файл
    "-c:v".to_string(),
    params.video_codec.clone(),
    "-c:a".to_string(),
    params.audio_codec.clone(),
    "-b:v".to_string(),
    format!("{}k", params.target_bitrate),
    "-r".to_string(),
    params.target_framerate.to_string(),
    "-movflags".to_string(),
    "+faststart".to_string(), // Оптимизация для веб-стриминга
  ];

  // Настройка разрешения и обрезки
  if params.crop_to_fit {
    let scale_filter = format!(
      "scale={}:{}:force_original_aspect_ratio=increase,crop={}:{}",
      params.target_width, params.target_height, params.target_width, params.target_height
    );
    cmd.extend(["-vf".to_string(), scale_filter]);
  } else {
    cmd.extend([
      "-vf".to_string(),
      format!("scale={}:{}", params.target_width, params.target_height),
    ]);
  }

  // Дополнительные настройки качества для H.264
  if params.video_codec == "h264" {
    cmd.extend([
      "-preset".to_string(),
      "medium".to_string(),
      "-crf".to_string(),
      "23".to_string(),
    ]);
  }

  cmd.push(params.output_path.clone());
  cmd
}

/// Выполнить оптимизацию для платформы
pub async fn optimize_for_platform_logic(
  params: &PlatformOptimizationParams,
) -> Result<PlatformOptimizationResult, String> {
  let start_time = std::time::Instant::now();

  // Валидация параметров
  validate_optimization_params(params)?;

  // Проверка существования входного файла
  if !Path::new(&params.input_path).exists() {
    return Err(format!("Входной файл не найден: {}", params.input_path));
  }

  // Получаем метаданные исходного файла
  let original_metadata = get_video_metadata(&params.input_path)?;

  // Строим команду FFmpeg
  let cmd_args = build_ffmpeg_command(params);

  // Выполняем команду (заглушка)
  let output = Command::new(&cmd_args[0])
    .args(&cmd_args[1..])
    .output()
    .map_err(|e| format!("Ошибка выполнения FFmpeg: {}", e))?;

  if !output.status.success() {
    let error_msg = String::from_utf8_lossy(&output.stderr);
    return Err(format!("Ошибка FFmpeg: {}", error_msg));
  }

  let processing_time = start_time.elapsed().as_secs_f64();

  // Получаем размер выходного файла
  let output_size = std::fs::metadata(&params.output_path)
    .map(|m| m.len())
    .unwrap_or(0);

  let compression_ratio = if original_metadata.file_size > 0 {
    output_size as f64 / original_metadata.file_size as f64
  } else {
    1.0
  };

  Ok(PlatformOptimizationResult {
    success: true,
    output_path: params.output_path.clone(),
    file_size: output_size,
    duration: original_metadata.duration,
    width: params.target_width,
    height: params.target_height,
    bitrate: params.target_bitrate,
    compression_ratio,
    processing_time,
    message: "Оптимизация завершена успешно".to_string(),
  })
}

/// Валидировать параметры генерации миниатюры
pub fn validate_thumbnail_params(params: &PlatformThumbnailParams) -> Result<(), String> {
  if params.input_path.is_empty() {
    return Err("Путь к входному файлу не может быть пустым".to_string());
  }

  if params.output_path.is_empty() {
    return Err("Путь к выходному файлу не может быть пустым".to_string());
  }

  if params.width == 0 || params.height == 0 {
    return Err("Размеры миниатюры должны быть больше нуля".to_string());
  }

  if params.timestamp < 0.0 {
    return Err("Временная метка не может быть отрицательной".to_string());
  }

  Ok(())
}

/// Генерировать миниатюру
pub async fn generate_thumbnail_logic(
  params: &PlatformThumbnailParams,
) -> Result<ThumbnailGenerationResult, String> {
  // Валидация параметров
  validate_thumbnail_params(params)?;

  // Проверка существования входного файла
  if !Path::new(&params.input_path).exists() {
    return Err(format!("Входной файл не найден: {}", params.input_path));
  }

  // Строим команду FFmpeg для генерации миниатюры
  let mut cmd = Command::new("ffmpeg");
  cmd
    .arg("-i")
    .arg(&params.input_path)
    .arg("-ss")
    .arg(params.timestamp.to_string())
    .arg("-vframes")
    .arg("1")
    .arg("-vf")
    .arg(format!("scale={}:{}", params.width, params.height))
    .arg("-y")
    .arg(&params.output_path);

  // Выполняем команду
  let output = cmd
    .output()
    .map_err(|e| format!("Ошибка выполнения FFmpeg: {}", e))?;

  if !output.status.success() {
    let error_msg = String::from_utf8_lossy(&output.stderr);
    return Err(format!("Ошибка генерации миниатюры: {}", error_msg));
  }

  // Получаем размер файла миниатюры
  let file_size = std::fs::metadata(&params.output_path)
    .map(|m| m.len())
    .unwrap_or(0);

  Ok(ThumbnailGenerationResult {
    success: true,
    thumbnail_path: params.output_path.clone(),
    width: params.width,
    height: params.height,
    file_size,
    message: "Миниатюра создана успешно".to_string(),
  })
}

/// Проверить совместимость с платформой
pub fn check_platform_compatibility(
  metadata: &PlatformVideoMetadata,
  profile: &PlatformProfile,
) -> PlatformCompatibilityResult {
  let mut issues = Vec::new();
  let mut recommendations = Vec::new();

  // Проверяем разрешение
  if metadata.width > profile.max_width || metadata.height > profile.max_height {
    issues.push(format!(
      "Разрешение {}x{} превышает максимальное {}x{}",
      metadata.width, metadata.height, profile.max_width, profile.max_height
    ));
    recommendations.push(format!(
      "Уменьшите разрешение до {}x{}",
      profile.max_width, profile.max_height
    ));
  }

  // Проверяем битрейт
  if metadata.bitrate > profile.max_bitrate {
    issues.push(format!(
      "Битрейт {} kbps превышает максимальный {} kbps",
      metadata.bitrate, profile.max_bitrate
    ));
    recommendations.push(format!("Уменьшите битрейт до {} kbps", profile.max_bitrate));
  }

  // Проверяем частоту кадров
  if metadata.framerate > profile.max_framerate as f64 {
    issues.push(format!(
      "Частота кадров {} fps превышает максимальную {} fps",
      metadata.framerate, profile.max_framerate
    ));
    recommendations.push(format!(
      "Уменьшите частоту кадров до {} fps",
      profile.max_framerate
    ));
  }

  // Проверяем длительность
  if let Some(max_duration) = profile.max_duration {
    if metadata.duration > max_duration {
      issues.push(format!(
        "Длительность {:.1}с превышает максимальную {:.1}с",
        metadata.duration, max_duration
      ));
      recommendations.push(format!("Обрежьте видео до {:.1} секунд", max_duration));
    }
  }

  let compatible = issues.is_empty();
  let estimated_processing_time = metadata.duration * 0.1; // Примерная оценка

  PlatformCompatibilityResult {
    platform: profile.platform.clone(),
    compatible,
    issues,
    recommendations,
    estimated_processing_time,
  }
}
