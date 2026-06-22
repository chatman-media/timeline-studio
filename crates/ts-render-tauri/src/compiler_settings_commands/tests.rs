//! Тесты для настроек компилятора

#[cfg(test)]
mod compiler_settings_tests {
  use super::super::business_logic;
  use super::super::types::*;
  use ts_render::video_compiler::core::error::VideoCompilerError;

  #[test]
  fn test_validate_compiler_settings_valid() {
    let settings = CompilerSettings {
      ffmpeg_path: "/usr/bin/ffmpeg".to_string(),
      parallel_jobs: 4,
      memory_limit_mb: 4096,
      temp_directory: "/tmp".to_string(),
      log_level: "info".to_string(),
      hardware_acceleration: true,
    };

    let result = business_logic::validate_compiler_settings(&settings);
    assert!(result.is_ok());
  }

  #[test]
  fn test_validate_ffmpeg_path_empty() {
    let result = business_logic::validate_ffmpeg_path("");
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert_eq!(msg, "FFmpeg path cannot be empty");
      }
      _ => panic!("Expected InvalidParameter error"),
    }
  }

  #[test]
  fn test_validate_ffmpeg_path_windows() {
    if cfg!(windows) {
      let result = business_logic::validate_ffmpeg_path("C:\\tools\\ffmpeg");
      assert!(result.is_err());
      match result.err().unwrap() {
        VideoCompilerError::InvalidParameter(msg) => {
          assert!(msg.contains("ffmpeg.exe"));
        }
        _ => panic!("Expected InvalidParameter error"),
      }
    }
  }

  #[test]
  fn test_validate_ffmpeg_path_valid() {
    let result = business_logic::validate_ffmpeg_path("/usr/bin/ffmpeg");
    assert!(result.is_ok());

    let result = business_logic::validate_ffmpeg_path("ffmpeg");
    assert!(result.is_ok());

    if cfg!(windows) {
      let result = business_logic::validate_ffmpeg_path("C:\\tools\\ffmpeg.exe");
      assert!(result.is_ok());
    }
  }

  #[test]
  fn test_validate_parallel_jobs() {
    // Test zero jobs
    let result = business_logic::validate_parallel_jobs(0);
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert_eq!(msg, "Parallel jobs must be at least 1");
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Test too many jobs
    let result = business_logic::validate_parallel_jobs(65);
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert_eq!(msg, "Parallel jobs cannot exceed 64");
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Test valid values
    assert!(business_logic::validate_parallel_jobs(1).is_ok());
    assert!(business_logic::validate_parallel_jobs(8).is_ok());
    assert!(business_logic::validate_parallel_jobs(64).is_ok());
  }

  #[test]
  fn test_validate_memory_limit() {
    // Test too low
    let result = business_logic::validate_memory_limit(256);
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert_eq!(msg, "Memory limit must be at least 512 MB");
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Test too high
    let result = business_logic::validate_memory_limit(2000000);
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert_eq!(msg, "Memory limit cannot exceed 1 TB");
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Test valid values
    assert!(business_logic::validate_memory_limit(512).is_ok());
    assert!(business_logic::validate_memory_limit(4096).is_ok());
    assert!(business_logic::validate_memory_limit(32768).is_ok());
  }

  #[test]
  fn test_validate_temp_directory() {
    // Test empty
    let result = business_logic::validate_temp_directory("");
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert_eq!(msg, "Temp directory cannot be empty");
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Test invalid characters
    let result = business_logic::validate_temp_directory("/tmp\0invalid");
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("invalid characters"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Test valid paths
    assert!(business_logic::validate_temp_directory("/tmp").is_ok());
    assert!(business_logic::validate_temp_directory("C:\\Temp").is_ok());
    assert!(business_logic::validate_temp_directory("./temp").is_ok());
  }

  #[test]
  fn test_validate_log_level() {
    // Test invalid level
    let result = business_logic::validate_log_level("verbose");
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("Invalid log level"));
        assert!(msg.contains("trace, debug, info, warn, error, off"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }

    // Test valid levels
    assert!(business_logic::validate_log_level("trace").is_ok());
    assert!(business_logic::validate_log_level("debug").is_ok());
    assert!(business_logic::validate_log_level("info").is_ok());
    assert!(business_logic::validate_log_level("warn").is_ok());
    assert!(business_logic::validate_log_level("error").is_ok());
    assert!(business_logic::validate_log_level("off").is_ok());

    // Test case insensitive
    assert!(business_logic::validate_log_level("INFO").is_ok());
    assert!(business_logic::validate_log_level("Debug").is_ok());
  }

  #[test]
  fn test_create_default_settings() {
    let settings = business_logic::create_default_settings();

    // Validate default settings are valid
    let result = business_logic::validate_compiler_settings(&settings);
    assert!(result.is_ok());

    // Check some expected defaults
    assert_eq!(settings.ffmpeg_path, "ffmpeg");
    assert!(settings.parallel_jobs > 0);
    assert!(settings.memory_limit_mb >= 512);
    assert!(!settings.temp_directory.is_empty());
    assert_eq!(settings.log_level, "info");
  }

  #[test]
  fn test_create_recommended_settings() {
    let recommended = business_logic::create_recommended_settings();

    // Check that recommendations are reasonable
    assert!(recommended.cpu_cores > 0);
    assert!(recommended.parallel_jobs > 0);
    assert!(recommended.parallel_jobs <= recommended.cpu_cores);
    assert!(recommended.parallel_jobs <= 8); // Should be capped at 8

    // Validate recommended settings
    let result = business_logic::validate_compiler_settings(&recommended.settings);
    assert!(result.is_ok());
  }

  #[test]
  fn test_export_import_settings() {
    let original = CompilerSettings {
      ffmpeg_path: "/custom/ffmpeg".to_string(),
      parallel_jobs: 6,
      memory_limit_mb: 8192,
      temp_directory: "/custom/temp".to_string(),
      log_level: "debug".to_string(),
      hardware_acceleration: false,
    };

    // Export to JSON
    let json = business_logic::export_settings_to_json(&original).unwrap();
    assert!(json.contains("custom/ffmpeg"));
    assert!(json.contains("8192"));

    // Import back
    let imported = business_logic::import_settings_from_json(&json).unwrap();
    assert_eq!(imported, original);
  }

  #[test]
  fn test_import_invalid_json() {
    let result = business_logic::import_settings_from_json("not json");
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::SerializationError(msg) => {
        assert!(msg.contains("Failed to import"));
      }
      _ => panic!("Expected SerializationError"),
    }
  }

  #[test]
  fn test_import_invalid_settings() {
    let json = r#"{
      "ffmpeg_path": "",
      "parallel_jobs": 0,
      "memory_limit_mb": 256,
      "temp_directory": "/tmp",
      "log_level": "info",
      "hardware_acceleration": false
    }"#;

    let result = business_logic::import_settings_from_json(json);
    assert!(result.is_err());
  }

  #[test]
  fn test_create_quality_presets() {
    let presets = business_logic::create_quality_presets();

    assert_eq!(presets.len(), 4);

    // Check preset names
    let names: Vec<&str> = presets.iter().map(|p| p.name.as_str()).collect();
    assert!(names.contains(&"Low"));
    assert!(names.contains(&"Medium"));
    assert!(names.contains(&"High"));
    assert!(names.contains(&"Ultra"));

    // Check bitrates are increasing
    let bitrates: Vec<u32> = presets.iter().map(|p| p.bitrate_kbps).collect();
    for i in 1..bitrates.len() {
      assert!(bitrates[i] > bitrates[i - 1]);
    }
  }

  #[test]
  fn test_check_ffmpeg_available() {
    // Default path should be considered available
    assert!(business_logic::check_ffmpeg_available("ffmpeg"));
    assert!(business_logic::check_ffmpeg_available(""));

    // Non-existent path should not be available
    assert!(!business_logic::check_ffmpeg_available(
      "/definitely/not/a/real/path/ffmpeg"
    ));
  }

  #[test]
  fn test_calculate_optimal_parallel_jobs() {
    // Test various scenarios
    assert_eq!(business_logic::calculate_optimal_parallel_jobs(1, 2), 1);
    assert_eq!(business_logic::calculate_optimal_parallel_jobs(4, 8), 3);
    assert_eq!(business_logic::calculate_optimal_parallel_jobs(16, 32), 8); // Capped at 8
    assert_eq!(business_logic::calculate_optimal_parallel_jobs(8, 4), 2); // Limited by memory
    assert_eq!(business_logic::calculate_optimal_parallel_jobs(2, 1), 1); // Very low resources
  }

  #[test]
  fn test_format_memory_size() {
    assert_eq!(business_logic::format_memory_size(512), "512 MB");
    assert_eq!(business_logic::format_memory_size(1024), "1.0 GB");
    assert_eq!(business_logic::format_memory_size(2048), "2.0 GB");
    assert_eq!(business_logic::format_memory_size(4096), "4.0 GB");
    assert_eq!(business_logic::format_memory_size(8192), "8.0 GB");
    assert_eq!(business_logic::format_memory_size(16384), "16 GB");
    assert_eq!(business_logic::format_memory_size(32768), "32 GB");
  }

  #[test]
  fn test_normalize_temp_path() {
    assert_eq!(business_logic::normalize_temp_path("/tmp/"), "/tmp");
    assert_eq!(business_logic::normalize_temp_path("/tmp"), "/tmp");
    assert_eq!(business_logic::normalize_temp_path("C:\\Temp\\"), "C:/Temp");
    assert_eq!(business_logic::normalize_temp_path("  /tmp  "), "/tmp");
    assert_eq!(business_logic::normalize_temp_path("/"), "/");
  }

  #[test]
  fn test_settings_changed() {
    let settings1 = CompilerSettings {
      ffmpeg_path: "/usr/bin/ffmpeg".to_string(),
      parallel_jobs: 4,
      memory_limit_mb: 4096,
      temp_directory: "/tmp".to_string(),
      log_level: "info".to_string(),
      hardware_acceleration: true,
    };

    let settings2 = settings1.clone();
    assert!(!business_logic::settings_changed(&settings1, &settings2));

    let mut settings3 = settings1.clone();
    settings3.parallel_jobs = 8;
    assert!(business_logic::settings_changed(&settings1, &settings3));
  }

  #[test]
  fn test_merge_settings() {
    let current = CompilerSettings {
      ffmpeg_path: "/usr/bin/ffmpeg".to_string(),
      parallel_jobs: 4,
      memory_limit_mb: 4096,
      temp_directory: "/tmp".to_string(),
      log_level: "info".to_string(),
      hardware_acceleration: true,
    };

    let updates = CompilerSettings {
      ffmpeg_path: "/usr/bin/ffmpeg".to_string(), // Same
      parallel_jobs: 8,                           // Changed
      memory_limit_mb: 4096,                      // Same
      temp_directory: "/var/tmp".to_string(),     // Changed
      log_level: "debug".to_string(),             // Changed
      hardware_acceleration: true,                // Same
    };

    let merged = business_logic::merge_settings(&current, &updates);

    assert_eq!(merged.ffmpeg_path, "/usr/bin/ffmpeg");
    assert_eq!(merged.parallel_jobs, 8);
    assert_eq!(merged.memory_limit_mb, 4096);
    assert_eq!(merged.temp_directory, "/var/tmp");
    assert_eq!(merged.log_level, "debug");
    assert!(merged.hardware_acceleration);
  }

  #[test]
  fn test_compiler_settings_serialization() {
    let settings = CompilerSettings {
      ffmpeg_path: "/usr/bin/ffmpeg".to_string(),
      parallel_jobs: 8,
      memory_limit_mb: 4096,
      temp_directory: "/tmp".to_string(),
      log_level: "debug".to_string(),
      hardware_acceleration: true,
    };

    let json = serde_json::to_string(&settings).unwrap();
    assert!(json.contains("ffmpeg"));
    assert!(json.contains("4096"));

    let deserialized: CompilerSettings = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized, settings);
  }

  #[test]
  fn test_quality_preset_serialization() {
    let preset = QualityPreset {
      name: "Test Preset".to_string(),
      description: "Test description".to_string(),
      bitrate_kbps: 5000,
      resolution: "1920x1080".to_string(),
      fps: 30,
      codec: "h264".to_string(),
    };

    let json = serde_json::to_string(&preset).unwrap();
    assert!(json.contains("Test Preset"));
    assert!(json.contains("5000"));

    let deserialized: QualityPreset = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized, preset);
  }

  #[test]
  fn test_recommended_settings_serialization() {
    let recommended = business_logic::create_recommended_settings();

    let json = serde_json::to_string(&recommended).unwrap();
    assert!(json.contains("cpu_cores"));
    assert!(json.contains("memory_gb"));

    let deserialized: RecommendedSettings = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.cpu_cores, recommended.cpu_cores);
  }
}
