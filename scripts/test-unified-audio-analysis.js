#!/usr/bin/env node

/**
 * Демонстрационный скрипт для Unified Audio Analysis System
 * 
 * Демонстрирует современную unified audio analysis с f64 типами
 * и отсутствием legacy adapter layer
 */

import { invoke } from '@tauri-apps/api/core';
import { writeFileSync } from 'fs';

const DEMO_CONFIG = {
  testVideo: "/path/to/test/video.mp4", // Замените на реальный путь
  outputDir: "./analysis-results",
  benchmarkIterations: 3,
};

console.log("🎵 Unified Audio Analysis System Demo");
console.log("===================================");
console.log("Modern f64 unified types, no legacy adapters");

async function main() {
  try {
    // 1. Проверяем capabilities unified системы
    console.log("\n1. Checking Unified Audio Analysis Capabilities...");
    const capabilities = await invoke('get_audio_system_capabilities');
    console.log("System Capabilities:");
    console.log(`  - FFmpeg Available: ${capabilities.ffmpeg_available}`);
    console.log(`  - FFprobe Available: ${capabilities.ffprobe_available}`);
    console.log(`  - Montage Planner Available: ${capabilities.montage_planner_available}`);
    console.log(`  - Whisper Available: ${capabilities.whisper_available}`);
    console.log(`  - GPU Acceleration: ${capabilities.gpu_acceleration_available}`);
    console.log(`  - Summary: ${capabilities.summary()}`);
    console.log(`  - Can Run Comprehensive: ${capabilities.can_run_comprehensive()}`);
    
    // 2. Получаем рекомендованную конфигурацию
    console.log("\n2. Getting Recommended Configurations...");
    
    const fastConfig = await invoke('get_recommended_audio_config', {
      performanceMode: 'Fast'
    });
    console.log("Fast Mode Config:");
    console.log(`  - FFmpeg: ${fastConfig.enable_ffmpeg_analysis}`);
    console.log(`  - Montage: ${fastConfig.enable_montage_analysis}`);
    console.log(`  - Transcription: ${fastConfig.enable_transcription}`);
    console.log(`  - Max Time: ${fastConfig.max_processing_time_seconds}s`);
    
    const qualityConfig = await invoke('get_recommended_audio_config', {
      performanceMode: 'Quality'
    });
    console.log("Quality Mode Config:");
    console.log(`  - FFmpeg: ${qualityConfig.enable_ffmpeg_analysis}`);
    console.log(`  - Montage: ${qualityConfig.enable_montage_analysis}`);
    console.log(`  - Transcription: ${qualityConfig.enable_transcription}`);
    console.log(`  - Max Time: ${qualityConfig.max_processing_time_seconds}s`);
    
    // 3. Проверяем статус unified системы
    console.log("\n3. Checking Unified System Status...");
    const status = await invoke('get_unified_audio_analysis_status');
    console.log("System Status:");
    console.log(`  - Overall Status: ${status.overall_status}`);
    console.log(`  - Supported Engines: ${status.supported_engines.join(', ')}`);
    console.log(`  - Platform: ${status.system_info.platform}`);
    console.log(`  - Architecture: ${status.system_info.architecture}`);
    console.log(`  - Package Version: ${status.system_info.package_version}`);
    
    if (status.overall_status === 'unavailable') {
      console.warn("⚠️  Unified audio analysis система недоступна");
      console.log("   Убедитесь что FFmpeg установлен и доступен");
      return;
    }
    
    // 4. Quick analysis demo (если есть тестовый файл)
    if (DEMO_CONFIG.testVideo !== "/path/to/test/video.mp4") {
      console.log("\n4. Running Quick Audio Analysis...");
      
      const quickStart = Date.now();
      const quickResult = await invoke('analyze_audio_quick', {
        videoPath: DEMO_CONFIG.testVideo
      });
      const quickTime = Date.now() - quickStart;
      
      console.log(`   ✅ Quick analysis completed in ${quickTime}ms`);
      console.log("   Basic Metrics:");
      console.log(`     - Has Audio: ${quickResult.basic_metrics.has_audio}`);
      console.log(`     - Duration: ${quickResult.basic_metrics.duration.seconds.toFixed(1)}s`);
      console.log(`     - Sample Rate: ${quickResult.basic_metrics.sample_rate.hz} Hz`);
      console.log(`     - Channels: ${quickResult.basic_metrics.channels}`);
      console.log(`     - Overall Volume: ${(quickResult.basic_metrics.overall_volume.level * 100).toFixed(1)}%`);
      console.log(`     - Estimated Quality: ${(quickResult.basic_metrics.estimated_quality * 100).toFixed(1)}%`);
      
      // Show available insights
      console.log(`   Available Insights: ${quickResult.available_insights().join(', ')}`);
      console.log(`   Overall Quality Score: ${(quickResult.overall_quality_score() * 100).toFixed(1)}%`);
      
      // Show analysis metadata
      console.log("   Analysis Metadata:");
      console.log(`     - Version: ${quickResult.analysis_metadata.analysis_version}`);
      console.log(`     - Processing Time: ${quickResult.analysis_metadata.processing_time_ms}ms`);
      console.log(`     - Engines Used: ${quickResult.analysis_metadata.engines_used.join(', ')}`);
      console.log(`     - Success Rate: ${(quickResult.analysis_metadata.success_rate * 100).toFixed(1)}%`);
      
      // 5. Comprehensive analysis demo
      console.log("\n5. Running Comprehensive Audio Analysis...");
      
      const comprehensiveStart = Date.now();
      const comprehensiveResult = await invoke('analyze_audio_unified', {
        videoPath: DEMO_CONFIG.testVideo,
        config: qualityConfig
      });
      const comprehensiveTime = Date.now() - comprehensiveStart;
      
      console.log(`   ✅ Comprehensive analysis completed in ${comprehensiveTime}ms`);
      
      // Show FFmpeg analysis if available
      if (comprehensiveResult.ffmpeg_analysis) {
        console.log("   FFmpeg Analysis:");
        const ffmpeg = comprehensiveResult.ffmpeg_analysis;
        console.log(`     - Peak Volume: ${(ffmpeg.volume_analysis.peak_volume.level * 100).toFixed(1)}%`);
        console.log(`     - Dynamic Range: ${ffmpeg.volume_analysis.dynamic_range.toFixed(1)} dB`);
        console.log(`     - Dominant Frequencies: ${ffmpeg.frequency_analysis.dominant_frequencies.length}`);
        console.log(`     - Quality Score: ${(ffmpeg.quality_metrics.overall_score * 100).toFixed(1)}%`);
        console.log(`     - Issues Detected: ${ffmpeg.quality_metrics.issues.length}`);
        
        if (ffmpeg.quality_metrics.issues.length > 0) {
          console.log("     - Issues:");
          ffmpeg.quality_metrics.issues.forEach(issue => {
            console.log(`       • ${issue.issue_type}: ${issue.description} (${issue.severity})`);
          });
        }
      }
      
      // 6. Fallback analysis demo
      console.log("\n6. Testing Fallback Analysis...");
      
      const fallbackStart = Date.now();
      const fallbackResult = await invoke('analyze_audio_with_fallback', {
        videoPath: DEMO_CONFIG.testVideo,
        config: null  // Use default config
      });
      const fallbackTime = Date.now() - fallbackStart;
      
      console.log(`   ✅ Fallback analysis completed in ${fallbackTime}ms`);
      console.log(`   Engines Used: ${fallbackResult.analysis_metadata.engines_used.join(', ')}`);
      console.log(`   Success Rate: ${(fallbackResult.analysis_metadata.success_rate * 100).toFixed(1)}%`);
      
      // 7. Performance benchmark
      console.log("\n7. Running Performance Benchmark...");
      
      const benchmarkResult = await invoke('benchmark_unified_audio_analysis', {
        testVideoPath: DEMO_CONFIG.testVideo,
        iterations: DEMO_CONFIG.benchmarkIterations
      });
      
      console.log("Benchmark Results:");
      console.log(`  - Total Iterations: ${benchmarkResult.total_iterations}`);
      console.log(`  - Successful Runs: ${benchmarkResult.successful_runs}`);
      console.log(`  - Success Rate: ${(benchmarkResult.success_rate * 100).toFixed(1)}%`);
      console.log(`  - Average Time: ${benchmarkResult.average_time_ms}ms`);
      console.log(`  - Min Time: ${benchmarkResult.min_time_ms}ms`);
      console.log(`  - Max Time: ${benchmarkResult.max_time_ms}ms`);
      console.log(`  - Performance Rating: ${benchmarkResult.performance_rating.toUpperCase()}`);
      
      // Save comprehensive results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const resultsPath = `${DEMO_CONFIG.outputDir}/unified-audio-analysis-${timestamp}.json`;
      writeFileSync(resultsPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        test_video: DEMO_CONFIG.testVideo,
        system_capabilities: capabilities,
        system_status: status,
        quick_analysis: {
          result: quickResult,
          performance: { analysis_time_ms: quickTime }
        },
        comprehensive_analysis: {
          result: comprehensiveResult,
          performance: { analysis_time_ms: comprehensiveTime }
        },
        fallback_analysis: {
          result: fallbackResult,
          performance: { analysis_time_ms: fallbackTime }
        },
        benchmark_results: benchmarkResult,
        demo_config: DEMO_CONFIG
      }, null, 2));
      console.log(`\n📄 Comprehensive results saved: ${resultsPath}`);
      
    } else {
      console.log("\n4. ⏭️  Skipping analysis demos - set DEMO_CONFIG.testVideo");
      console.log("   To test with actual file:");
      console.log("   1. Replace DEMO_CONFIG.testVideo with real video path");
      console.log("   2. Run script again");
    }
    
    console.log("\n✅ Unified Audio Analysis Demo completed!");
    console.log("\n🚀 Key Features Demonstrated:");
    console.log("  • Unified f64 Type System - consistent precision across all components");
    console.log("  • Modern Architecture - no legacy adapters, direct integration");
    console.log("  • Comprehensive Analysis - FFmpeg, Montage, Whisper coordination");
    console.log("  • Performance Modes - Fast, Balanced, Quality configurations");
    console.log("  • Graceful Degradation - works with whatever engines are available");
    console.log("  • System Capabilities Detection - automatic feature detection");
    console.log("  • Batch Processing Support - multiple files analysis");
    console.log("  • Performance Benchmarking - built-in performance testing");
    console.log("  • Rich Metadata - detailed analysis information and insights");
    
  } catch (error) {
    console.error("❌ Error in Unified Audio Analysis Demo:", error);
    process.exit(1);
  }
}

// Demo architectural advantages
function demoUnifiedAdvantages() {
  console.log("\n🏗️  Unified Architecture Advantages");
  console.log("==================================");
  
  console.log("Type System Benefits:");
  console.log("  ✅ f64 Precision Everywhere - максимальная точность расчетов");
  console.log("  ✅ Zero Type Conversion Overhead - прямая интеграция компонентов");
  console.log("  ✅ Compile-time Type Safety - исключены runtime ошибки типов");
  console.log("  ✅ Consistent API - один interface для всех engines");
  
  console.log("\nPerformance Benefits:");
  console.log("  ⚡ Direct Integration - нет промежуточных adapter слоев");
  console.log("  ⚡ Async Coordination - параллельная обработка engines");
  console.log("  ⚡ Smart Caching - automatic результаты кэширования");
  console.log("  ⚡ Performance Modes - оптимизация под use case");
  
  console.log("\nMaintainability Benefits:");
  console.log("  🔧 Modern Rust Architecture - type-safe, memory-safe код");
  console.log("  🔧 Comprehensive Testing - встроенное тестирование всех компонентов");
  console.log("  🔧 Rich Error Handling - детальные error messages и recovery");
  console.log("  🔧 Future-proof Design - легко добавлять новые engines");
  
  console.log("\nUser Experience Benefits:");
  console.log("  💻 Rich Insights - detailed audio analysis metadata");
  console.log("  💻 Flexible Configuration - multiple performance modes");
  console.log("  💻 Reliable Fallbacks - работает даже при partial availability");
  console.log("  💻 Progress Tracking - real-time analysis progress");
}

// Demo use cases
function demoUseCases() {
  console.log("\n💼 Unified Audio Analysis Use Cases");
  console.log("===================================");
  
  console.log("Professional Video Editing:");
  console.log("  🎬 Quality Assessment - comprehensive audio quality analysis");
  console.log("  🎬 Content Classification - автоматическая classification");
  console.log("  🎬 Montage Planning - intelligent montage recommendations");
  console.log("  🎬 Post-production QA - quality assurance automation");
  
  console.log("\nContent Management:");
  console.log("  📚 Media Library Analysis - bulk content analysis");
  console.log("  📚 Search & Discovery - content-based поиск");
  console.log("  📚 Metadata Extraction - automatic metadata generation");
  console.log("  📚 Compliance Checking - content standards validation");
  
  console.log("\nReal-time Applications:");
  console.log("  📺 Live Streaming - real-time audio monitoring");
  console.log("  📺 Video Conferencing - quality optimization");
  console.log("  📺 Broadcast Monitoring - automatic quality assurance");
  console.log("  📺 Interactive Media - responsive content adaptation");
  
  console.log("\nDevelopment & Testing:");
  console.log("  🧪 Performance Benchmarking - audio processing optimization");
  console.log("  🧪 Quality Regression Testing - automated quality validation");
  console.log("  🧪 Feature Development - rapid prototyping support");
  console.log("  🧪 System Integration - comprehensive testing framework");
}

// Запуск всех демо
async function runAllDemos() {
  await main();
  demoUnifiedAdvantages();
  demoUseCases();
}

if (import.meta.main) {
  runAllDemos().catch(console.error);
}