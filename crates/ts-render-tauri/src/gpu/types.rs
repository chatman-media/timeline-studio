//! Типы для работы с GPU

use serde::{Deserialize, Serialize};

/// Информация о возможностях GPU
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuCapabilitiesInfo {
  pub available_encoders: Vec<String>,
  pub hardware_acceleration_supported: bool,
  pub recommended_encoder: Option<String>,
  pub current_gpu: Option<String>,
}

/// Статус использования GPU
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuUsageStatus {
  pub hardware_acceleration_enabled: bool,
  pub gpu_index: Option<usize>,
  pub current_gpu: Option<ts_render::video_compiler::core::gpu::GpuInfo>,
  pub available_gpus: usize,
}

/// Результаты бенчмарка GPU
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuBenchmarkResult {
  pub gpu: Option<ts_render::video_compiler::core::gpu::GpuInfo>,
  pub encoding_speed: f64,
  pub decoding_speed: f64,
  pub supported_codecs: Vec<String>,
  pub score: f64,
}

/// Детали GPU кодировщика
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuEncoderDetails {
  pub h264_codec_name: String,
  pub is_hardware: bool,
  pub encoder_type: String,
}

// Re-export основных типов из core::gpu для удобства
pub use ts_render::video_compiler::core::gpu::{GpuEncoder, GpuInfo};
