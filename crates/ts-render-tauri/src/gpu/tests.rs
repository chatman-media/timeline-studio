//! Тесты для модуля GPU

#[cfg(test)]
mod gpu_tests {
  use super::super::*;

  #[test]
  fn test_gpu_info_structure_creation() {
    let gpu_info = GpuInfo {
      name: "NVIDIA GeForce RTX 4090".to_string(),
      driver_version: Some("535.86.05".to_string()),
      memory_total: Some(24576), // 24GB in MB
      memory_used: Some(2048),   // 2GB in MB
      utilization: Some(45.5),
      encoder_type: GpuEncoder::Nvenc,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string(), "av1".to_string()],
    };

    assert_eq!(gpu_info.name, "NVIDIA GeForce RTX 4090");
    assert_eq!(gpu_info.driver_version, Some("535.86.05".to_string()));
    assert_eq!(gpu_info.memory_total, Some(24576));
    assert_eq!(gpu_info.memory_used, Some(2048));
    assert_eq!(gpu_info.utilization, Some(45.5));
    assert_eq!(gpu_info.encoder_type, GpuEncoder::Nvenc);
    assert_eq!(gpu_info.supported_codecs.len(), 3);
    assert!(gpu_info.supported_codecs.contains(&"h264".to_string()));
    assert!(gpu_info.supported_codecs.contains(&"hevc".to_string()));
    assert!(gpu_info.supported_codecs.contains(&"av1".to_string()));
  }

  #[test]
  fn test_gpu_encoder_types() {
    // Test different GPU encoder types
    let nvenc = GpuEncoder::Nvenc;
    let quicksync = GpuEncoder::QuickSync;
    let vaapi = GpuEncoder::Vaapi;
    let videotoolbox = GpuEncoder::VideoToolbox;
    let amf = GpuEncoder::Amf;
    let software = GpuEncoder::Software;

    assert_eq!(nvenc.h264_codec_name(), "h264_nvenc");
    assert_eq!(quicksync.h264_codec_name(), "h264_qsv");
    assert_eq!(vaapi.h264_codec_name(), "h264_vaapi");
    assert_eq!(videotoolbox.h264_codec_name(), "h264_videotoolbox");
    assert_eq!(amf.h264_codec_name(), "h264_amf");
    assert_eq!(software.h264_codec_name(), "libx264");
  }

  #[test]
  fn test_recommended_gpu_creation_logic() {
    // Test logic for creating recommended GPU info
    let encoder = GpuEncoder::Nvenc;
    let gpu_info = business_logic::create_recommended_gpu_info(encoder.clone());

    assert_eq!(gpu_info.name, "Nvenc Encoder");
    assert_eq!(gpu_info.driver_version, None);
    assert_eq!(gpu_info.memory_total, None);
    assert_eq!(gpu_info.memory_used, None);
    assert_eq!(gpu_info.utilization, None);
    assert_eq!(gpu_info.encoder_type, GpuEncoder::Nvenc);
    assert_eq!(gpu_info.supported_codecs, vec!["h264", "hevc"]);
  }

  #[test]
  fn test_gpu_usage_status_creation() {
    let status = business_logic::create_gpu_usage_status(true, Some(0), None, 2);

    assert!(status.hardware_acceleration_enabled);
    assert_eq!(status.gpu_index, Some(0));
    assert!(status.current_gpu.is_none());
    assert_eq!(status.available_gpus, 2);
  }

  #[test]
  fn test_gpu_benchmark_stub() {
    let benchmark = business_logic::create_benchmark_result_stub();

    assert!(benchmark.gpu.is_none());
    assert_eq!(benchmark.encoding_speed, 0.0);
    assert_eq!(benchmark.decoding_speed, 0.0);
    assert!(benchmark.supported_codecs.is_empty());
    assert_eq!(benchmark.score, 0.0);
  }

  #[test]
  fn test_gpu_encoder_string_mapping() {
    // Test string to encoder mapping
    let test_cases = vec![
      ("nvenc", GpuEncoder::Nvenc),
      ("amf", GpuEncoder::Amf),
      ("qsv", GpuEncoder::QuickSync),
      ("videotoolbox", GpuEncoder::VideoToolbox),
      ("vaapi", GpuEncoder::Vaapi),
      ("unknown", GpuEncoder::Software),
      ("", GpuEncoder::Software),
    ];

    for (input, expected) in test_cases {
      let result = business_logic::parse_encoder_type(input);
      assert_eq!(result, expected, "Failed for input: {input}");
    }
  }

  #[test]
  fn test_gpu_encoder_details_creation() {
    let encoder = GpuEncoder::Nvenc;
    let details = business_logic::create_gpu_encoder_details(&encoder, "nvenc");

    assert_eq!(details.h264_codec_name, "h264_nvenc");
    assert!(details.is_hardware);
    assert_eq!(details.encoder_type, "nvenc");
  }

  #[test]
  fn test_gpu_memory_calculations() {
    // Test GPU memory usage calculations
    let total_memory_mb = 24576; // 24GB
    let used_memory_mb = 8192; // 8GB
    let usage_percentage =
      business_logic::calculate_gpu_memory_usage(total_memory_mb, used_memory_mb);

    assert!((33.0..=34.0).contains(&usage_percentage)); // ~33.33%

    // Test edge cases
    let zero_usage = business_logic::calculate_gpu_memory_usage(total_memory_mb, 0);
    let full_usage = business_logic::calculate_gpu_memory_usage(total_memory_mb, total_memory_mb);
    let zero_total = business_logic::calculate_gpu_memory_usage(0, 100);

    assert_eq!(zero_usage, 0.0);
    assert_eq!(full_usage, 100.0);
    assert_eq!(zero_total, 0.0);
  }

  #[test]
  fn test_gpu_utilization_validation() {
    // Test GPU utilization percentage validation
    let valid_utilizations = [0.0, 25.5, 50.0, 75.8, 100.0];
    let invalid_utilizations = [-10.0, 150.0, -1.0, 101.0];

    for util in &valid_utilizations {
      assert!(
        business_logic::is_valid_utilization(*util),
        "Utilization {util} should be valid"
      );
    }

    for util in &invalid_utilizations {
      assert!(
        !business_logic::is_valid_utilization(*util),
        "Utilization {util} should be invalid"
      );
    }
  }

  #[test]
  fn test_gpu_index_determination() {
    assert_eq!(business_logic::determine_gpu_index(true), Some(0));
    assert_eq!(business_logic::determine_gpu_index(false), None);
  }

  #[test]
  fn test_standard_gpu_codecs() {
    let codecs = business_logic::get_standard_gpu_codecs();

    assert_eq!(codecs.len(), 2);
    assert!(codecs.contains(&"h264".to_string()));
    assert!(codecs.contains(&"hevc".to_string()));
    assert!(!codecs.contains(&"av1".to_string()));
  }

  #[test]
  fn test_gpu_info_serialization() {
    let gpu_info = GpuInfo {
      name: "Intel Arc A770".to_string(),
      driver_version: Some("31.0.101.4255".to_string()),
      memory_total: Some(16384), // 16GB
      memory_used: Some(1024),   // 1GB
      utilization: Some(30.0),
      encoder_type: GpuEncoder::QuickSync,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
    };

    // Test serialization
    let json = serde_json::to_string(&gpu_info).unwrap();
    assert!(json.contains("Intel Arc A770"));
    assert!(json.contains("QuickSync"));
    assert!(json.contains("31.0.101.4255"));

    // Test deserialization
    let deserialized: GpuInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.name, "Intel Arc A770");
    assert_eq!(deserialized.encoder_type, GpuEncoder::QuickSync);
    assert_eq!(deserialized.memory_total, Some(16384));
    assert_eq!(deserialized.utilization, Some(30.0));
  }

  #[test]
  fn test_gpu_capabilities_info_creation() {
    let info = business_logic::create_gpu_capabilities_info(
      vec!["h264_nvenc".to_string(), "hevc_nvenc".to_string()],
      true,
      Some("h264_nvenc".to_string()),
      Some("NVIDIA GeForce RTX 3090".to_string()),
    );

    assert_eq!(info.available_encoders.len(), 2);
    assert!(info.hardware_acceleration_supported);
    assert_eq!(info.recommended_encoder, Some("h264_nvenc".to_string()));
    assert_eq!(
      info.current_gpu,
      Some("NVIDIA GeForce RTX 3090".to_string())
    );
  }

  #[test]
  fn test_gpu_usage_status_serialization() {
    let status = GpuUsageStatus {
      hardware_acceleration_enabled: true,
      gpu_index: Some(1),
      current_gpu: None,
      available_gpus: 3,
    };

    let json = serde_json::to_string(&status).unwrap();
    assert!(json.contains("hardware_acceleration_enabled"));
    assert!(json.contains("gpu_index"));
    assert!(json.contains("available_gpus"));

    let deserialized: GpuUsageStatus = serde_json::from_str(&json).unwrap();
    assert!(deserialized.hardware_acceleration_enabled);
    assert_eq!(deserialized.gpu_index, Some(1));
    assert_eq!(deserialized.available_gpus, 3);
  }

  #[test]
  fn test_benchmark_result_serialization() {
    let benchmark = GpuBenchmarkResult {
      gpu: None,
      encoding_speed: 120.5,
      decoding_speed: 200.0,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
      score: 8.5,
    };

    let json = serde_json::to_string(&benchmark).unwrap();
    let deserialized: GpuBenchmarkResult = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.encoding_speed, 120.5);
    assert_eq!(deserialized.decoding_speed, 200.0);
    assert_eq!(deserialized.score, 8.5);
    assert_eq!(deserialized.supported_codecs.len(), 2);
  }

  #[test]
  fn test_encoder_details_serialization() {
    let details = GpuEncoderDetails {
      h264_codec_name: "h264_nvenc".to_string(),
      is_hardware: true,
      encoder_type: "nvenc".to_string(),
    };

    let json = serde_json::to_string(&details).unwrap();
    let deserialized: GpuEncoderDetails = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.h264_codec_name, "h264_nvenc");
    assert!(deserialized.is_hardware);
    assert_eq!(deserialized.encoder_type, "nvenc");
  }
}
