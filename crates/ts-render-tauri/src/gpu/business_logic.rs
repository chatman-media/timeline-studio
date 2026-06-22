//! Бизнес-логика для работы с GPU

use super::types::*;

/// Создать информацию о рекомендованном GPU
pub fn create_recommended_gpu_info(encoder: GpuEncoder) -> GpuInfo {
  GpuInfo {
    name: format!("{encoder:?} Encoder"),
    driver_version: None,
    memory_total: None,
    memory_used: None,
    utilization: None,
    encoder_type: encoder,
    supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
  }
}

/// Создать статус использования GPU
pub fn create_gpu_usage_status(
  hardware_acceleration_enabled: bool,
  gpu_index: Option<usize>,
  current_gpu: Option<GpuInfo>,
  available_gpus: usize,
) -> GpuUsageStatus {
  GpuUsageStatus {
    hardware_acceleration_enabled,
    gpu_index,
    current_gpu,
    available_gpus,
  }
}

/// Создать результат бенчмарка GPU (заглушка)
pub fn create_benchmark_result_stub() -> GpuBenchmarkResult {
  GpuBenchmarkResult {
    gpu: None,
    encoding_speed: 0.0,
    decoding_speed: 0.0,
    supported_codecs: Vec::new(),
    score: 0.0,
  }
}

/// Получить стандартные поддерживаемые кодеки для GPU
pub fn get_standard_gpu_codecs() -> Vec<String> {
  vec!["h264".to_string(), "hevc".to_string()]
}

/// Преобразовать строку в тип кодировщика
pub fn parse_encoder_type(encoder_type: &str) -> GpuEncoder {
  match encoder_type {
    "nvenc" => GpuEncoder::Nvenc,
    "amf" => GpuEncoder::Amf,
    "qsv" => GpuEncoder::QuickSync,
    "videotoolbox" => GpuEncoder::VideoToolbox,
    "vaapi" => GpuEncoder::Vaapi,
    _ => GpuEncoder::Software,
  }
}

/// Создать детали GPU кодировщика
pub fn create_gpu_encoder_details(encoder: &GpuEncoder, encoder_type: &str) -> GpuEncoderDetails {
  GpuEncoderDetails {
    h264_codec_name: encoder.h264_codec_name().to_string(),
    is_hardware: encoder.is_hardware(),
    encoder_type: encoder_type.to_string(),
  }
}

/// Рассчитать использование памяти GPU в процентах
pub fn calculate_gpu_memory_usage(total_mb: u64, used_mb: u64) -> f64 {
  if total_mb == 0 {
    return 0.0;
  }
  (used_mb as f64 / total_mb as f64) * 100.0
}

/// Проверить валидность процента использования GPU
pub fn is_valid_utilization(utilization: f64) -> bool {
  (0.0..=100.0).contains(&utilization)
}

/// Определить рекомендуемый индекс GPU
pub fn determine_gpu_index(has_recommendation: bool) -> Option<usize> {
  if has_recommendation {
    Some(0) // Всегда возвращаем 0 как индекс рекомендованного GPU
  } else {
    None
  }
}

/// Создать информацию о возможностях GPU
pub fn create_gpu_capabilities_info(
  available_encoders: Vec<String>,
  hardware_acceleration_supported: bool,
  recommended_encoder: Option<String>,
  current_gpu: Option<String>,
) -> GpuCapabilitiesInfo {
  GpuCapabilitiesInfo {
    available_encoders,
    hardware_acceleration_supported,
    recommended_encoder,
    current_gpu,
  }
}
