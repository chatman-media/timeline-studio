//! Типы для дополнительных команд

use serde::{Deserialize, Serialize};

/// Возможности FFmpeg
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FfmpegCapabilities {
  pub version: String,
  pub hardware_acceleration: HardwareAcceleration,
}

/// Поддержка аппаратного ускорения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareAcceleration {
  pub cuda: bool,
  pub nvenc: bool,
  pub qsv: bool,
  pub amf: bool,
  pub videotoolbox: bool,
}

/// Информация об использовании памяти кэшем
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheMemoryUsage {
  pub total_bytes: u64,
  pub preview_bytes: u64,
  pub metadata_bytes: u64,
  pub render_bytes: u64,
}

/// Кэшированные метаданные медиафайла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedMediaMetadata {
  pub duration: f64,
  pub resolution: Option<(u32, u32)>,
  pub fps: Option<f64>,
  pub bitrate: Option<u64>,
  pub video_codec: Option<String>,
  pub audio_codec: Option<String>,
}

/// Информация о кэше рендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderCacheInfo {
  pub render_cache_size: u64,
  pub total_cache_size: u64,
  pub cache_hit_rate: f64,
}

/// Конфигурация кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheConfig {
  pub size_mb: Option<u64>,
  pub preview_quality: Option<u8>,
}
