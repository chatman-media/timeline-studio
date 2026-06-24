//! Performance tests для UnifiedAudioAnalyzer
//!
//! Тестирует производительность различных режимов анализа на реальных файлах.
//! Запуск: cargo test --release -p timeline-studio-tauri performance_tests -- --nocapture --ignored

#[cfg(test)]
mod performance_tests {
  use crate::services::unified_audio_analyzer::UnifiedAudioAnalyzer;
  use crate::types::{AudioPerformanceMode, UnifiedAudioConfig};
  use std::path::PathBuf;
  use std::time::Instant;

  /// Получить путь к тестовому видео файлу
  fn get_test_video_path() -> Option<PathBuf> {
    // Пробуем несколько путей к тестовым файлам
    let possible_paths = vec![
      PathBuf::from("../test-data/Kate.mp4"),
      PathBuf::from("test-data/Kate.mp4"),
      PathBuf::from("../videos/VID_20210113_185239_001.mp4"),
      PathBuf::from("videos/VID_20210113_185239_001.mp4"),
    ];

    for path in possible_paths {
      if path.exists() {
        return Some(path);
      }
    }

    // Попробуем абсолютный путь
    let workspace_root = std::env::current_dir().ok()?;
    let absolute_path = workspace_root.join("../test-data/Kate.mp4");
    if absolute_path.exists() {
      return Some(absolute_path);
    }

    None
  }

  /// Performance тест для Fast режима
  #[tokio::test]
  #[ignore] // Запускать только вручную с --ignored
  async fn test_performance_fast_mode() {
    let video_path = match get_test_video_path() {
      Some(path) => path,
      None => {
        eprintln!("SKIP: No test video file found");
        return;
      }
    };

    println!("\n=== Performance Test: Fast Mode ===");
    println!("Test file: {:?}", video_path);

    let analyzer = UnifiedAudioAnalyzer::new();
    let config = UnifiedAudioConfig {
      enable_ffmpeg_analysis: true,
      enable_montage_analysis: false,
      enable_transcription: false,
      performance_mode: AudioPerformanceMode::Fast,
      max_processing_time_seconds: Some(30),
      ..Default::default()
    };

    let start = Instant::now();
    let result = analyzer
      .analyze_comprehensive(&video_path, Some(config))
      .await;
    let elapsed = start.elapsed();

    match result {
      Ok(analysis) => {
        println!("Status: SUCCESS");
        println!("Processing time: {:?}", elapsed);
        println!(
          "Reported time: {} ms",
          analysis.analysis_metadata.processing_time_ms
        );
        println!(
          "Engines used: {:?}",
          analysis.analysis_metadata.engines_used
        );
        println!(
          "Success rate: {:.1}%",
          analysis.analysis_metadata.success_rate * 100.0
        );
        println!("Has audio: {}", analysis.basic_metrics.has_audio);
        println!("Duration: {:.2}s", analysis.basic_metrics.duration.seconds);

        // Performance assertion: Fast mode должен быть < 10 секунд
        assert!(
          elapsed.as_secs() < 10,
          "Fast mode took too long: {:?}",
          elapsed
        );
      }
      Err(e) => {
        println!("Status: FAILED - {}", e);
      }
    }
  }

  /// Performance тест для Balanced режима
  #[tokio::test]
  #[ignore]
  async fn test_performance_balanced_mode() {
    let video_path = match get_test_video_path() {
      Some(path) => path,
      None => {
        eprintln!("SKIP: No test video file found");
        return;
      }
    };

    println!("\n=== Performance Test: Balanced Mode ===");
    println!("Test file: {:?}", video_path);

    let analyzer = UnifiedAudioAnalyzer::new();
    let config = UnifiedAudioConfig {
      enable_ffmpeg_analysis: true,
      enable_montage_analysis: true,
      enable_transcription: false,
      performance_mode: AudioPerformanceMode::Balanced,
      max_processing_time_seconds: Some(120),
      ..Default::default()
    };

    let start = Instant::now();
    let result = analyzer
      .analyze_comprehensive(&video_path, Some(config))
      .await;
    let elapsed = start.elapsed();

    match result {
      Ok(analysis) => {
        println!("Status: SUCCESS");
        println!("Processing time: {:?}", elapsed);
        println!(
          "Reported time: {} ms",
          analysis.analysis_metadata.processing_time_ms
        );
        println!(
          "Engines used: {:?}",
          analysis.analysis_metadata.engines_used
        );
        println!(
          "Success rate: {:.1}%",
          analysis.analysis_metadata.success_rate * 100.0
        );

        // FFmpeg analysis details
        if let Some(ffmpeg) = &analysis.ffmpeg_analysis {
          println!("FFmpeg analysis: present");
          println!(
            "  Peak volume: {:.2} dB",
            ffmpeg.volume_analysis.peak_volume.to_db()
          );
        }

        // Montage analysis details
        if let Some(montage) = &analysis.montage_analysis {
          println!("Montage analysis: present");
          println!("  Dynamic range: {:.2}", montage.dynamic_range);
          println!("  Speech probability: {:.2}", montage.speech_probability);
        }

        // Performance assertion: Balanced mode должен быть < 30 секунд
        assert!(
          elapsed.as_secs() < 30,
          "Balanced mode took too long: {:?}",
          elapsed
        );
      }
      Err(e) => {
        println!("Status: FAILED - {}", e);
      }
    }
  }

  /// Performance тест для Quality режима (полный анализ)
  #[tokio::test]
  #[ignore]
  async fn test_performance_quality_mode() {
    let video_path = match get_test_video_path() {
      Some(path) => path,
      None => {
        eprintln!("SKIP: No test video file found");
        return;
      }
    };

    println!("\n=== Performance Test: Quality Mode ===");
    println!("Test file: {:?}", video_path);

    let analyzer = UnifiedAudioAnalyzer::new();
    let config = UnifiedAudioConfig {
      enable_ffmpeg_analysis: true,
      enable_montage_analysis: true,
      enable_transcription: true, // Включаем Whisper
      performance_mode: AudioPerformanceMode::Quality,
      max_processing_time_seconds: Some(600),
      ..Default::default()
    };

    let start = Instant::now();
    let result = analyzer
      .analyze_comprehensive(&video_path, Some(config))
      .await;
    let elapsed = start.elapsed();

    match result {
      Ok(analysis) => {
        println!("Status: SUCCESS");
        println!("Processing time: {:?}", elapsed);
        println!(
          "Reported time: {} ms",
          analysis.analysis_metadata.processing_time_ms
        );
        println!(
          "Engines used: {:?}",
          analysis.analysis_metadata.engines_used
        );
        println!(
          "Success rate: {:.1}%",
          analysis.analysis_metadata.success_rate * 100.0
        );

        // Transcription details
        if let Some(transcription) = &analysis.transcription_analysis {
          println!("Transcription: present");
          println!("  Language: {:?}", transcription.detected_language);
          println!("  Confidence: {:.2}", transcription.confidence_score);
          println!("  Text length: {} chars", transcription.full_text.len());
          println!("  Word count: {}", transcription.words.len());
        } else {
          println!("Transcription: not available (Whisper not installed?)");
        }

        // Performance assertion: Quality mode может занять до 2 минут
        assert!(
          elapsed.as_secs() < 120,
          "Quality mode took too long: {:?}",
          elapsed
        );
      }
      Err(e) => {
        println!("Status: FAILED - {}", e);
      }
    }
  }

  /// Benchmark тест с несколькими итерациями
  #[tokio::test]
  #[ignore]
  async fn test_benchmark_multiple_iterations() {
    let video_path = match get_test_video_path() {
      Some(path) => path,
      None => {
        eprintln!("SKIP: No test video file found");
        return;
      }
    };

    println!("\n=== Benchmark Test: 3 Iterations ===");
    println!("Test file: {:?}", video_path);

    let analyzer = UnifiedAudioAnalyzer::new();

    let result = analyzer.benchmark_performance(&video_path, 3).await;

    match result {
      Ok(benchmark) => {
        println!("Status: SUCCESS");
        println!(
          "Total iterations: {} / {}",
          benchmark.successful_iterations, benchmark.total_iterations
        );
        println!("Total time: {} ms", benchmark.total_time_ms);
        println!(
          "Average processing time: {} ms",
          benchmark.average_processing_time_ms
        );
        println!("Success rate: {:.1}%", benchmark.success_rate * 100.0);

        // Assertions
        assert!(benchmark.success_rate >= 0.66, "Too many failed iterations");
        assert!(
          benchmark.average_processing_time_ms < 60000,
          "Average processing time too high: {} ms",
          benchmark.average_processing_time_ms
        );
      }
      Err(e) => {
        println!("Status: FAILED - {}", e);
      }
    }
  }

  /// Тест системных capabilities
  #[tokio::test]
  #[ignore]
  async fn test_system_capabilities() {
    println!("\n=== System Capabilities Test ===");

    let analyzer = UnifiedAudioAnalyzer::new();
    let capabilities = analyzer.check_system_capabilities().await;

    println!("FFmpeg available: {}", capabilities.ffmpeg_available);
    println!("FFprobe available: {}", capabilities.ffprobe_available);
    println!(
      "Montage Planner available: {}",
      capabilities.montage_planner_available
    );
    println!("Whisper available: {}", capabilities.whisper_available);
    println!(
      "GPU acceleration available: {}",
      capabilities.gpu_acceleration_available
    );
    println!("Summary: {}", capabilities.summary());
    println!(
      "Can run comprehensive: {}",
      capabilities.can_run_comprehensive()
    );

    // FFmpeg должен быть доступен
    assert!(
      capabilities.ffmpeg_available,
      "FFmpeg should be available for tests"
    );
  }

  /// Тест recommended config
  #[tokio::test]
  #[ignore]
  async fn test_recommended_configs() {
    println!("\n=== Recommended Configs Test ===");

    let analyzer = UnifiedAudioAnalyzer::new();

    let fast_config = analyzer
      .get_recommended_config(AudioPerformanceMode::Fast)
      .await;
    println!("Fast config:");
    println!("  FFmpeg: {}", fast_config.enable_ffmpeg_analysis);
    println!("  Montage: {}", fast_config.enable_montage_analysis);
    println!("  Transcription: {}", fast_config.enable_transcription);
    println!("  Max time: {:?}s", fast_config.max_processing_time_seconds);

    let quality_config = analyzer
      .get_recommended_config(AudioPerformanceMode::Quality)
      .await;
    println!("\nQuality config:");
    println!("  FFmpeg: {}", quality_config.enable_ffmpeg_analysis);
    println!("  Montage: {}", quality_config.enable_montage_analysis);
    println!("  Transcription: {}", quality_config.enable_transcription);
    println!(
      "  Max time: {:?}s",
      quality_config.max_processing_time_seconds
    );

    // Assertions
    assert!(!fast_config.enable_transcription);
    assert!(quality_config.max_processing_time_seconds.unwrap_or(0) > 300);
  }

  /// Сравнительный тест всех режимов
  #[tokio::test]
  #[ignore]
  async fn test_compare_all_modes() {
    let video_path = match get_test_video_path() {
      Some(path) => path,
      None => {
        eprintln!("SKIP: No test video file found");
        return;
      }
    };

    println!("\n=== Compare All Modes ===");
    println!("Test file: {:?}\n", video_path);

    let analyzer = UnifiedAudioAnalyzer::new();
    let mut results = Vec::new();

    // Fast mode
    let fast_config = UnifiedAudioConfig {
      enable_ffmpeg_analysis: true,
      enable_montage_analysis: false,
      enable_transcription: false,
      performance_mode: AudioPerformanceMode::Fast,
      ..Default::default()
    };
    let start = Instant::now();
    let fast_result = analyzer
      .analyze_comprehensive(&video_path, Some(fast_config))
      .await;
    let fast_time = start.elapsed();
    results.push(("Fast", fast_time, fast_result.is_ok()));

    // Balanced mode
    let balanced_config = UnifiedAudioConfig {
      enable_ffmpeg_analysis: true,
      enable_montage_analysis: true,
      enable_transcription: false,
      performance_mode: AudioPerformanceMode::Balanced,
      ..Default::default()
    };
    let start = Instant::now();
    let balanced_result = analyzer
      .analyze_comprehensive(&video_path, Some(balanced_config))
      .await;
    let balanced_time = start.elapsed();
    results.push(("Balanced", balanced_time, balanced_result.is_ok()));

    // Print comparison
    println!("Mode Comparison:");
    println!("{:-<50}", "");
    for (mode, time, success) in &results {
      let status = if *success { "OK" } else { "FAIL" };
      println!("{:12} | {:>10.2?} | {}", mode, time, status);
    }
    println!("{:-<50}", "");

    // Fast должен быть быстрее Balanced
    if results[0].2 && results[1].2 {
      assert!(
        results[0].1 < results[1].1,
        "Fast mode should be faster than Balanced"
      );
    }
  }
}
