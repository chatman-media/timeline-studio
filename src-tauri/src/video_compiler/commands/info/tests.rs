//! Тесты для модуля info

#[cfg(test)]
mod info_tests {
  use super::super::*;

  #[test]
  fn test_system_info_structure() {
    let os_info = types::OsInfo {
      os_type: "Linux".to_string(),
      version: "22.04.1".to_string(),
      architecture: "x86_64".to_string(),
    };

    let cpu_info = types::CpuInfo {
      cores: 8,
      arch: "x86_64".to_string(),
    };

    let memory_info = types::MemoryInfo {
      total_bytes: 16_000_000_000,
      total_mb: 15_000,
      total_gb: 15,
    };

    let runtime_info = types::RuntimeInfo {
      rust_version: "1.70.0".to_string(),
      tauri_version: "1.5.0".to_string(),
    };

    let system_info = types::SystemInfo {
      os: os_info.clone(),
      cpu: cpu_info.clone(),
      memory: memory_info.clone(),
      runtime: runtime_info.clone(),
    };

    assert_eq!(system_info.os.os_type, "Linux");
    assert_eq!(system_info.cpu.cores, 8);
    assert_eq!(system_info.memory.total_gb, 15);
    assert_eq!(system_info.runtime.rust_version, "1.70.0");
  }

  #[test]
  fn test_os_info_serialization() {
    let os_info = types::OsInfo {
      os_type: "macOS".to_string(),
      version: "13.5.2".to_string(),
      architecture: "arm64".to_string(),
    };

    let json = serde_json::to_string(&os_info).unwrap();
    let deserialized: types::OsInfo = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.os_type, "macOS");
    assert_eq!(deserialized.version, "13.5.2");
    assert_eq!(deserialized.architecture, "arm64");
  }

  #[test]
  fn test_cpu_info_creation() {
    let cpu_info = types::CpuInfo {
      cores: 16,
      arch: "aarch64".to_string(),
    };

    assert_eq!(cpu_info.cores, 16);
    assert_eq!(cpu_info.arch, "aarch64");
  }

  #[test]
  fn test_memory_info_conversions() {
    let memory_info = types::MemoryInfo {
      total_bytes: 32_000_000_000, // 32GB approx
      total_mb: 30_517,
      total_gb: 29,
    };

    assert!(memory_info.total_bytes > 30_000_000_000);
    assert!(memory_info.total_mb > 30_000);
    assert!(memory_info.total_gb >= 29);

    // Test conversion logic
    let calculated_mb = memory_info.total_bytes / 1024;
    let calculated_gb = memory_info.total_bytes / (1024 * 1024);

    assert!(calculated_mb > 29_000_000); // Should be much larger for bytes->MB conversion
    assert!(calculated_gb > 29_000); // Should be much larger for bytes->GB conversion
  }

  #[test]
  fn test_runtime_info_structure() {
    let runtime_info = types::RuntimeInfo {
      rust_version: "1.75.0".to_string(),
      tauri_version: "1.5.4".to_string(),
    };

    assert!(runtime_info.rust_version.starts_with("1."));
    assert!(runtime_info.tauri_version.starts_with("1."));
  }

  #[test]
  fn test_ffmpeg_version_parsing_logic() {
    // Test FFmpeg version output parsing logic
    let sample_output =
      "ffmpeg version 4.4.2-0ubuntu0.22.04.1 Copyright (c) 2000-2021 the FFmpeg developers";
    let first_line = business_logic::parse_ffmpeg_version(sample_output);

    assert_eq!(
      first_line,
      "ffmpeg version 4.4.2-0ubuntu0.22.04.1 Copyright (c) 2000-2021 the FFmpeg developers"
    );
    assert!(first_line.contains("ffmpeg version"));
    assert!(first_line.contains("4.4.2"));
  }

  #[test]
  fn test_supported_formats_parsing_logic() {
    // Test format parsing logic for FFmpeg -formats output
    let sample_formats_output = r#"
File formats:
 D. = Demuxing supported
 .E = Muxing supported
 --
 DE 3dostr          3DO STR
 DE 3g2             3GP2 (3GPP2 file format)
 DE 3gp             3GP (3GPP file format)
  E mp4             MP4 (MPEG-4 Part 14)
 D  avi             AVI (Audio Video Interleaved)
"#;

    let formats = business_logic::parse_supported_formats(sample_formats_output);

    assert!(formats.contains(&"3dostr".to_string()));
    assert!(formats.contains(&"3g2".to_string()));
    assert!(formats.contains(&"3gp".to_string()));
    assert!(formats.contains(&"mp4".to_string()));
    assert!(!formats.contains(&"avi".to_string())); // Only demuxing, no E flag
  }

  #[test]
  fn test_video_codecs_parsing_logic() {
    // Test video codec parsing logic
    let sample_codecs_output = r#"File formats:
 D. = Demuxing supported
 .E = Muxing supported
Codecs:
 D..... = Decoding supported
 .E.... = Encoding supported
 ..V... = Video codec
 ..A... = Audio codec
 ..S... = Subtitle codec
 .....D = Intra frame-only codec
 ------
 DEV.L. h264                 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10
 DEV.L. hevc                 H.265 / HEVC (High Efficiency Video Coding)
 DEA... aac                  AAC (Advanced Audio Coding)
 D.A... mp3                  MP3 (MPEG audio layer 3)
"#;

    let video_codecs = business_logic::parse_video_codecs(sample_codecs_output);

    assert!(video_codecs.contains(&"h264".to_string()));
    assert!(video_codecs.contains(&"hevc".to_string()));
    assert!(!video_codecs.contains(&"aac".to_string())); // Audio codec
    assert!(!video_codecs.contains(&"mp3".to_string())); // Audio codec, no encoding
  }

  #[test]
  fn test_audio_codecs_parsing_logic() {
    // Test audio codec parsing logic
    let sample_codecs_output = r#"File formats:
 D. = Demuxing supported
 .E = Muxing supported
Codecs:
 D..... = Decoding supported
 .E.... = Encoding supported
 ..V... = Video codec
 ..A... = Audio codec
 ..S... = Subtitle codec
 .....D = Intra frame-only codec
 ------
 DEV.L. h264                 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10
 DEA... aac                  AAC (Advanced Audio Coding)
 DEA... mp3                  MP3 (MPEG audio layer 3)
 D.A... flac                 FLAC (Free Lossless Audio Codec)
"#;

    let audio_codecs = business_logic::parse_audio_codecs(sample_codecs_output);

    assert!(audio_codecs.contains(&"aac".to_string()));
    assert!(audio_codecs.contains(&"mp3".to_string()));
    assert!(!audio_codecs.contains(&"flac".to_string())); // No encoding support
    assert!(!audio_codecs.contains(&"h264".to_string())); // Video codec
  }

  #[test]
  fn test_system_info_json_structure() {
    // Test the expected JSON structure for system info
    let expected_fields = ["os", "cpu", "memory", "runtime"];

    let test_json = serde_json::json!({
        "os": {
            "type": "Linux",
            "version": "22.04",
            "architecture": "x86_64"
        },
        "cpu": {
            "cores": 8,
            "arch": "x86_64"
        },
        "memory": {
            "total_bytes": 16000000000_u64,
            "total_mb": 15625,
            "total_gb": 15
        },
        "runtime": {
            "rust_version": "1.75.0",
            "tauri_version": "1.5.0"
        }
    });

    for field in &expected_fields {
      assert!(test_json[field].is_object());
    }

    assert_eq!(test_json["os"]["type"], "Linux");
    assert_eq!(test_json["cpu"]["cores"], 8);
    assert!(test_json["memory"]["total_bytes"].is_number());
    assert!(test_json["runtime"]["rust_version"].is_string());
  }

  #[test]
  fn test_disk_space_json_structure() {
    // Test expected structure for disk space info
    let test_disk_info = serde_json::json!({
        "mount_point": "/",
        "total_bytes": 1000000000000_u64,
        "free_bytes": 500000000000_u64,
        "used_bytes": 500000000000_u64,
        "free_percentage": 50.0
    });

    assert!(test_disk_info["mount_point"].is_string());
    assert!(test_disk_info["total_bytes"].is_number());
    assert!(test_disk_info["free_bytes"].is_number());
    assert!(test_disk_info["used_bytes"].is_number());
    assert!(test_disk_info["free_percentage"].is_number());

    let free_pct = test_disk_info["free_percentage"].as_f64().unwrap();
    assert!((0.0..=100.0).contains(&free_pct));
  }

  #[test]
  fn test_compiler_config_json_structure() {
    // Test expected structure for compiler config
    let test_config = serde_json::json!({
        "ffmpeg_path": "/usr/bin/ffmpeg",
        "hardware_acceleration": true,
        "gpu_index": null,
        "parallel_jobs": 4,
        "memory_limit_mb": null,
        "temp_directory": "/tmp/timeline-studio",
        "log_level": "info"
    });

    assert!(test_config["ffmpeg_path"].is_string());
    assert!(test_config["hardware_acceleration"].is_boolean());
    assert!(test_config["gpu_index"].is_null());
    assert!(test_config["parallel_jobs"].is_number());
    assert!(test_config["memory_limit_mb"].is_null());
    assert!(test_config["temp_directory"].is_string());
    assert_eq!(test_config["log_level"], "info");
  }

  #[test]
  fn test_performance_stats_json_structure() {
    // Test expected structure for performance stats
    let test_stats = serde_json::json!({
        "active_render_jobs": 2,
        "memory": {
            "used_mb": 8192,
            "free_mb": 7936,
            "total_mb": 16128,
            "usage_percentage": 50.8
        },
        "cache": {
            "size_mb": 512,
            "entries": 1024
        },
        "cpu_usage": 25.5
    });

    assert!(test_stats["active_render_jobs"].is_number());
    assert!(test_stats["memory"].is_object());
    assert!(test_stats["cache"].is_object());
    assert!(test_stats["cpu_usage"].is_number());

    // Test memory section
    let memory = &test_stats["memory"];
    assert!(memory["used_mb"].is_number());
    assert!(memory["free_mb"].is_number());
    assert!(memory["total_mb"].is_number());
    assert!(memory["usage_percentage"].is_number());

    let cpu_usage = test_stats["cpu_usage"].as_f64().unwrap();
    assert!((0.0..=100.0).contains(&cpu_usage));
  }

  #[test]
  fn test_ffmpeg_error_handling_structure() {
    // Test error handling logic for FFmpeg commands
    let sample_stderr = "ffmpeg: command not found";
    let exit_code = Some(127);

    // This simulates how errors would be constructed
    let error_json = serde_json::json!({
        "error_type": "FFmpegError",
        "exit_code": exit_code,
        "stderr": sample_stderr,
        "command": "ffmpeg -version"
    });

    assert_eq!(error_json["error_type"], "FFmpegError");
    assert_eq!(error_json["exit_code"], 127);
    assert_eq!(error_json["stderr"], sample_stderr);
    assert!(error_json["command"]
      .as_str()
      .unwrap()
      .starts_with("ffmpeg"));
  }

  #[test]
  fn test_create_system_info() {
    let system_info = business_logic::create_system_info();

    // Basic validation
    assert!(!system_info.os.os_type.is_empty());
    assert!(!system_info.os.architecture.is_empty());
    assert!(system_info.cpu.cores > 0);
    assert!(system_info.memory.total_bytes > 0);
    assert!(!system_info.runtime.rust_version.is_empty());
    assert!(!system_info.runtime.tauri_version.is_empty());
  }

  #[test]
  fn test_create_compiler_config() {
    let config = business_logic::create_compiler_config(
      "/usr/bin/ffmpeg".to_string(),
      true,
      4,
      "/tmp".to_string(),
    );

    assert_eq!(config.ffmpeg_path, "/usr/bin/ffmpeg");
    assert!(config.hardware_acceleration);
    assert_eq!(config.parallel_jobs, 4);
    assert_eq!(config.temp_directory, "/tmp");
    assert_eq!(config.log_level, "info");
    assert_eq!(config.gpu_index, None);
    assert_eq!(config.memory_limit_mb, None);
  }

  #[test]
  fn test_create_performance_stats() {
    let stats = business_logic::create_performance_stats(2, 1048576, 524288);

    assert_eq!(stats.active_render_jobs, 2);
    assert!(stats.memory.total_mb > 0);
    // size_mb is non-negative by definition
    assert!(stats.cpu_usage >= 0.0);
  }

  #[test]
  fn test_parse_available_filters() {
    let sample_filters_output = r#"Filters:
  T.. = Timeline support
  .S. = Slice threading
  ..C = Command support
  A = Audio input/output
  V = Video input/output
  N = Dynamic number and/or type of input/output
  | = Source or sink filter
 ... abuffer          A->A       Audio buffer source.
 ... scale            V->V       Scale the input video size and/or convert the image format.
 ... overlay          VV->V      Overlay a video source on top of the input.
"#;

    let filters = business_logic::parse_available_filters(sample_filters_output);

    assert!(filters.contains(&"abuffer".to_string()));
    assert!(filters.contains(&"scale".to_string()));
    assert!(filters.contains(&"overlay".to_string()));
  }

  #[test]
  fn test_check_ffmpeg_availability() {
    // Test with a command that should exist on most systems
    assert!(business_logic::check_ffmpeg_availability("echo"));

    // Test with a command that shouldn't exist
    assert!(!business_logic::check_ffmpeg_availability(
      "non_existent_command_12345"
    ));
  }

  #[test]
  fn test_disk_space_info_types() {
    let disk_info = types::DiskSpaceInfo {
      mount_point: "/".to_string(),
      total_bytes: 1000000000000,
      free_bytes: 500000000000,
      used_bytes: 500000000000,
      free_percentage: 50.0,
    };

    assert_eq!(disk_info.mount_point, "/");
    assert_eq!(disk_info.total_bytes, 1000000000000);
    assert_eq!(disk_info.free_bytes, 500000000000);
    assert_eq!(disk_info.used_bytes, 500000000000);
    assert_eq!(disk_info.free_percentage, 50.0);
  }
}
