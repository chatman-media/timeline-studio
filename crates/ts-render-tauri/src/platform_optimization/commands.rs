//! Tauri команды для оптимизации под платформы

use super::{business_logic, types::*};

/// Оптимизировать видео для конкретной платформы
#[tauri::command]
pub async fn ffmpeg_optimize_for_platform(
  params: PlatformOptimizationParams,
) -> Result<PlatformOptimizationResult, String> {
  business_logic::optimize_for_platform_logic(&params).await
}

/// Генерировать миниатюру видео
#[tauri::command]
pub async fn generate_video_thumbnail(
  input_path: String,
  output_path: String,
  width: u32,
  height: u32,
  timestamp: f64,
) -> Result<ThumbnailGenerationResult, String> {
  let params = PlatformThumbnailParams {
    input_path,
    output_path,
    width,
    height,
    timestamp,
    quality: None,
  };

  business_logic::generate_thumbnail_logic(&params).await
}

/// Генерировать миниатюру с расширенными параметрами
#[tauri::command]
pub async fn generate_video_thumbnail_advanced(
  params: PlatformThumbnailParams,
) -> Result<ThumbnailGenerationResult, String> {
  business_logic::generate_thumbnail_logic(&params).await
}

/// Получить метаданные видеофайла
#[tauri::command]
pub async fn get_video_metadata(input_path: String) -> Result<PlatformVideoMetadata, String> {
  business_logic::get_video_metadata(&input_path)
}

/// Проверить совместимость видео с платформой
#[tauri::command]
pub async fn check_platform_compatibility(
  input_path: String,
  platform: String,
) -> Result<PlatformCompatibilityResult, String> {
  // Получаем метаданные видео
  let metadata = business_logic::get_video_metadata(&input_path)?;

  // Получаем профиль платформы
  let profile = match platform.as_str() {
    "youtube" => PlatformProfile::youtube(),
    "instagram" => PlatformProfile::instagram(),
    "tiktok" => PlatformProfile::tiktok(),
    _ => {
      return Err(format!("Неизвестная платформа: {}", platform));
    }
  };

  // Проверяем совместимость
  Ok(business_logic::check_platform_compatibility(
    &metadata, &profile,
  ))
}

/// Получить профиль оптимизации для платформы
#[tauri::command]
pub async fn get_platform_profile(platform: String) -> Result<PlatformProfile, String> {
  match platform.as_str() {
    "youtube" => Ok(PlatformProfile::youtube()),
    "instagram" => Ok(PlatformProfile::instagram()),
    "tiktok" => Ok(PlatformProfile::tiktok()),
    _ => Err(format!("Неизвестная платформа: {}", platform)),
  }
}

/// Оптимизировать для YouTube
#[tauri::command]
pub async fn optimize_for_youtube(
  input_path: String,
  output_path: String,
) -> Result<PlatformOptimizationResult, String> {
  let profile = PlatformProfile::youtube();
  let params = PlatformOptimizationParams {
    input_path,
    output_path,
    target_width: profile.max_width,
    target_height: profile.max_height,
    target_bitrate: profile.max_bitrate,
    target_framerate: profile.max_framerate,
    audio_codec: profile.audio_codec,
    video_codec: profile.preferred_codec,
    crop_to_fit: false,
  };

  business_logic::optimize_for_platform_logic(&params).await
}

/// Оптимизировать для Instagram
#[tauri::command]
pub async fn optimize_for_instagram(
  input_path: String,
  output_path: String,
) -> Result<PlatformOptimizationResult, String> {
  let profile = PlatformProfile::instagram();
  let params = PlatformOptimizationParams {
    input_path,
    output_path,
    target_width: profile.max_width,
    target_height: profile.max_height,
    target_bitrate: profile.max_bitrate,
    target_framerate: profile.max_framerate,
    audio_codec: profile.audio_codec,
    video_codec: profile.preferred_codec,
    crop_to_fit: true, // Instagram обычно требует квадратный формат
  };

  business_logic::optimize_for_platform_logic(&params).await
}

/// Оптимизировать для TikTok
#[tauri::command]
pub async fn optimize_for_tiktok(
  input_path: String,
  output_path: String,
) -> Result<PlatformOptimizationResult, String> {
  let profile = PlatformProfile::tiktok();
  let params = PlatformOptimizationParams {
    input_path,
    output_path,
    target_width: profile.max_width,
    target_height: profile.max_height,
    target_bitrate: profile.max_bitrate,
    target_framerate: profile.max_framerate,
    audio_codec: profile.audio_codec,
    video_codec: profile.preferred_codec,
    crop_to_fit: true, // TikTok вертикальный формат
  };

  business_logic::optimize_for_platform_logic(&params).await
}

/// Генерировать миниатюру для платформы (команда из оригинального файла)
#[tauri::command]
pub async fn ffmpeg_generate_platform_thumbnail(
  input_path: String,
  output_path: String,
  width: u32,
  height: u32,
  timestamp: f64,
) -> Result<ThumbnailGenerationResult, String> {
  let params = PlatformThumbnailParams {
    input_path,
    output_path,
    width,
    height,
    timestamp,
    quality: None,
  };

  business_logic::generate_thumbnail_logic(&params).await
}

/// Пакетная оптимизация для нескольких платформ
#[tauri::command]
pub async fn ffmpeg_batch_optimize_platforms(
  input_path: String,
  platforms: Vec<String>,
) -> Result<Vec<PlatformOptimizationResult>, String> {
  let mut results = Vec::new();

  for platform in platforms {
    let output_path = format!(
      "{}_{}_{}",
      input_path.trim_end_matches(".mp4"),
      platform,
      ".mp4"
    );

    let result = match platform.as_str() {
      "youtube" => optimize_for_youtube(input_path.clone(), output_path).await,
      "instagram" => optimize_for_instagram(input_path.clone(), output_path).await,
      "tiktok" => optimize_for_tiktok(input_path.clone(), output_path).await,
      _ => Err(format!("Неизвестная платформа: {}", platform)),
    };

    match result {
      Ok(res) => results.push(res),
      Err(e) => {
        results.push(PlatformOptimizationResult {
          success: false,
          output_path: "".to_string(),
          file_size: 0,
          duration: 0.0,
          width: 0,
          height: 0,
          bitrate: 0,
          compression_ratio: 0.0,
          processing_time: 0.0,
          message: e,
        });
      }
    }
  }

  Ok(results)
}

/// Анализировать соответствие платформе
#[tauri::command]
pub async fn ffmpeg_analyze_platform_compliance(
  input_path: String,
  platform: String,
) -> Result<PlatformCompatibilityResult, String> {
  check_platform_compatibility(input_path, platform).await
}

/// Создать прогрессивное видео
#[tauri::command]
pub async fn ffmpeg_create_progressive_video(
  input_path: String,
  output_path: String,
) -> Result<PlatformOptimizationResult, String> {
  let params = PlatformOptimizationParams {
    input_path,
    output_path,
    target_width: 1920,
    target_height: 1080,
    target_bitrate: 5000,
    target_framerate: 30,
    audio_codec: "aac".to_string(),
    video_codec: "h264".to_string(),
    crop_to_fit: false,
  };

  business_logic::optimize_for_platform_logic(&params).await
}
