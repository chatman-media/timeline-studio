#!/usr/bin/env node

/**
 * Demo script для тестирования Audio Analysis Integration
 * 
 * Демонстрирует объединение FFmpeg, Montage Planner и Whisper
 * для comprehensive audio analysis
 */

import { invoke } from '@tauri-apps/api/core';
import { writeFileSync } from 'fs';

const DEMO_CONFIG = {
  testVideo: "/path/to/test/video.mp4", // Замените на реальный путь
  outputDir: "./analysis-results",
  iterations: 3,
};

console.log("🎵 Audio Analysis Integration Demo");
console.log("=====================================");

async function main() {
  try {
    // 1. Проверяем статус системы audio analysis
    console.log("\n1. Проверка статуса Audio Analysis System...");
    const status = await invoke('get_audio_analysis_status');
    console.log("Status:", JSON.stringify(status, null, 2));
    
    if (status.overall_status === 'limited') {
      console.warn("⚠️  Ограниченная функциональность - некоторые сервисы недоступны");
    }
    
    // 2. Получаем доступные конфигурации
    console.log("\n2. Получение доступных конфигураций...");
    const configs = await invoke('get_audio_analysis_configs');
    console.log(`Найдено ${configs.length} конфигураций:`);
    configs.forEach((config, i) => {
      console.log(`  ${i + 1}. ${config.name} - ${config.description}`);
      console.log(`     Время: ~${config.estimated_time_minutes} мин`);
    });
    
    // 3. Получаем поддерживаемые языки
    console.log("\n3. Поддерживаемые языки транскрипции...");
    const languages = await invoke('get_supported_transcription_languages');
    console.log(`Поддерживается ${languages.length} языков:`);
    languages.slice(0, 5).forEach(lang => {
      console.log(`  - ${lang.name} (${lang.code}) - ${lang.native_name}`);
    });
    
    // 4. Демо анализа (если есть тестовый файл)
    if (DEMO_CONFIG.testVideo !== "/path/to/test/video.mp4") {
      console.log("\n4. Запуск comprehensive audio analysis...");
      
      // Тест быстрого анализа
      console.log("   Testing FAST mode...");
      const fastStart = Date.now();
      const fastResult = await invoke('analyze_audio_comprehensive', {
        videoPath: DEMO_CONFIG.testVideo,
        enableTranscription: false,
        enableMusicAnalysis: true,
        enableEmotionDetection: false,
        performanceMode: 'fast'
      });
      const fastTime = Date.now() - fastStart;
      console.log(`   ✅ Fast analysis completed in ${fastTime}ms`);
      
      // Тест стандартного анализа
      console.log("   Testing BALANCED mode...");
      const balancedStart = Date.now();
      const balancedResult = await invoke('analyze_audio_comprehensive', {
        videoPath: DEMO_CONFIG.testVideo,
        enableTranscription: true,
        enableMusicAnalysis: true,
        enableEmotionDetection: true,
        performanceMode: 'balanced'
      });
      const balancedTime = Date.now() - balancedStart;
      console.log(`   ✅ Balanced analysis completed in ${balancedTime}ms`);
      
      // Анализ результатов
      console.log("\n5. Анализ результатов...");
      console.log("Fast Result Overview:");
      console.log(`  - FFmpeg Quality: ${(fastResult.ffmpeg_analysis.quality.overall_quality * 100).toFixed(1)}%`);
      console.log(`  - Energy Level: ${fastResult.montage_analysis.energy_level.toFixed(1)}`);
      console.log(`  - Music Presence: ${fastResult.montage_analysis.music_presence.toFixed(1)}%`);
      console.log(`  - Speech Presence: ${fastResult.montage_analysis.speech_presence.toFixed(1)}%`);
      
      console.log("\nBalanced Result Overview:");
      console.log(`  - Overall Quality: ${(balancedResult.audio_insights.overall_quality * 100).toFixed(1)}%`);
      console.log(`  - Content Type: ${balancedResult.audio_insights.dominant_audio_type}`);
      console.log(`  - Recommendations: ${balancedResult.audio_insights.editing_recommendations.length}`);
      console.log(`  - Key Moments: ${balancedResult.audio_insights.key_moments.length}`);
      
      if (balancedResult.transcription_result) {
        console.log(`  - Speech Duration: ${balancedResult.transcription_result.total_speech_duration.toFixed(1)}s`);
        console.log(`  - Speech Clarity: ${(balancedResult.transcription_result.overall_clarity * 100).toFixed(1)}%`);
        console.log(`  - Speech Segments: ${balancedResult.transcription_result.speech_segments.length}`);
      }
      
      if (balancedResult.music_analysis) {
        console.log(`  - Music Quality: ${(balancedResult.music_analysis.overall_music_quality * 100).toFixed(1)}%`);
        console.log(`  - Music Segments: ${balancedResult.music_analysis.music_segments.length}`);
        console.log(`  - Instruments: ${balancedResult.music_analysis.dominant_instruments.join(', ')}`);
      }
      
      // Сохраняем детальные результаты
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const resultsPath = `${DEMO_CONFIG.outputDir}/audio-analysis-${timestamp}.json`;
      writeFileSync(resultsPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        test_video: DEMO_CONFIG.testVideo,
        performance_comparison: {
          fast_mode: {
            time_ms: fastTime,
            result: fastResult
          },
          balanced_mode: {
            time_ms: balancedTime,
            result: balancedResult
          }
        }
      }, null, 2));
      console.log(`\n📄 Детальные результаты сохранены: ${resultsPath}`);
      
      // 6. Тест анализа сегмента
      console.log("\n6. Тестирование анализа сегмента...");
      const segmentResult = await invoke('analyze_audio_segment', {
        videoPath: DEMO_CONFIG.testVideo,
        startTime: 10.0,
        duration: 5.0
      });
      console.log("Segment Analysis:");
      console.log(`  - Energy: ${segmentResult.features.energy_level.toFixed(1)}`);
      console.log(`  - Vocal Presence: ${segmentResult.features.vocal_presence.toFixed(1)}%`);
      console.log(`  - Rhythmic Strength: ${segmentResult.features.rhythmic_strength.toFixed(1)}`);
      
    } else {
      console.log("\n4. ⏭️  Пропускаем анализ - установите DEMO_CONFIG.testVideo");
    }
    
    // 7. Бенчмарк производительности (если есть файл)
    if (DEMO_CONFIG.testVideo !== "/path/to/test/video.mp4") {
      console.log("\n7. Запуск бенчмарка производительности...");
      const benchmarkResult = await invoke('benchmark_audio_analysis', {
        testFilePath: DEMO_CONFIG.testVideo,
        iterations: DEMO_CONFIG.iterations
      });
      
      console.log("Benchmark Results:");
      console.log(`  - Total Iterations: ${benchmarkResult.total_iterations}`);
      console.log(`  - Successful Runs: ${benchmarkResult.successful_runs}`);
      console.log(`  - Success Rate: ${(benchmarkResult.success_rate * 100).toFixed(1)}%`);
      console.log(`  - Average Time: ${benchmarkResult.average_time_ms}ms`);
      console.log(`  - Performance Rating: ${benchmarkResult.performance_rating.toUpperCase()}`);
    }
    
    console.log("\n✅ Audio Analysis Integration Demo завершен!");
    console.log("\n🔄 Системные возможности:");
    console.log("  • FFmpeg Audio Analysis - детальный анализ аудио");
    console.log("  • Montage Planner Integration - анализ ритма и эмоций");
    console.log("  • Whisper Speech Recognition - транскрипция речи");
    console.log("  • Unified Audio Insights - объединённые рекомендации");
    console.log("  • Performance Optimization - адаптивные режимы");
    
  } catch (error) {
    console.error("❌ Ошибка в Demo:", error);
    process.exit(1);
  }
}

// Демо интеграции с Real-time Audio Analysis
async function demoRealTimeFeatures() {
  console.log("\n🎬 Real-time Audio Features Demo");
  console.log("===============================");
  
  try {
    // Демонстрируем возможности real-time анализа
    console.log("Real-time capabilities:");
    console.log("  ⚡ Segment-based analysis for timeline scrubbing");
    console.log("  🎵 Live beat detection for rhythm-based editing");
    console.log("  🗣️  Speech/music classification for auto-editing");
    console.log("  📊 Audio quality monitoring during playback");
    console.log("  🎯 Smart cut suggestions based on audio features");
    
    // Показываем integration points
    console.log("\nIntegration Points:");
    console.log("  📺 Timeline Studio - audio-aware editing");
    console.log("  🤖 AI Orchestrator - intelligent suggestions");
    console.log("  🎚️  Audio Mixer - quality-based adjustments");
    console.log("  📝 Subtitle Editor - speech-synchronized timing");
    console.log("  🎬 Montage Planner - rhythm-based cuts");
    
  } catch (error) {
    console.error("Real-time demo error:", error);
  }
}

// Демо архитектурных возможностей
function demoArchitecturalFeatures() {
  console.log("\n🏗️  Architectural Features");
  console.log("========================");
  
  console.log("Component Integration:");
  console.log("  🧠 AudioAnalysisIntegrator - unified analysis coordinator");
  console.log("  ⚙️  UnifiedAudioConfig - centralized configuration");
  console.log("  📊 ComprehensiveAudioResult - structured insights");
  console.log("  🎛️  Performance Modes - adaptive quality/speed balance");
  
  console.log("\nService Coordination:");
  console.log("  📈 FFmpeg - technical audio analysis");
  console.log("  🎼 Montage Planner - musical and emotional analysis");
  console.log("  🗣️  Whisper Service - speech recognition and transcription");
  console.log("  🔄 Real Analysis Engine - ONNX-powered audio processing");
  
  console.log("\nSmart Features:");
  console.log("  🎯 Auto-provider selection (Local → OpenAI → Fallback)");
  console.log("  🔧 Graceful degradation when services unavailable");
  console.log("  📊 Quality-based recommendations and insights");
  console.log("  ⚡ Performance optimization for different use cases");
}

// Запуск всех демо
async function runAllDemos() {
  await main();
  await demoRealTimeFeatures();
  demoArchitecturalFeatures();
}

if (import.meta.main) {
  runAllDemos().catch(console.error);
}