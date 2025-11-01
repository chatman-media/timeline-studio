#!/usr/bin/env node

/**
 * Demo script для тестирования Simple Audio Analysis Integration
 * 
 * Демонстрирует упрощенный audio analysis без сложных зависимостей
 */

import { invoke } from '@tauri-apps/api/core';
import { writeFileSync } from 'fs';

const DEMO_CONFIG = {
  testVideo: "/path/to/test/video.mp4", // Замените на реальный путь
  outputDir: "./analysis-results",
  iterations: 5,
};

console.log("🎵 Simple Audio Analysis Integration Demo");
console.log("=========================================");

async function main() {
  try {
    // 1. Проверяем возможности системы
    console.log("\n1. Проверка возможностей Simple Audio Analysis...");
    const capabilities = await invoke('get_simple_audio_analysis_capabilities');
    console.log("Capabilities:", JSON.stringify(capabilities, null, 2));
    
    // 2. Проверяем статус системы
    console.log("\n2. Проверка статуса системы...");
    const status = await invoke('get_simple_audio_analysis_status');
    console.log("Status:", JSON.stringify(status, null, 2));
    
    if (status.overall_status === 'unavailable') {
      console.warn("⚠️  Система аудио анализа недоступна - проверьте установку FFmpeg");
      return;
    }
    
    // 3. Демо анализа (если есть тестовый файл)
    if (DEMO_CONFIG.testVideo !== "/path/to/test/video.mp4") {
      console.log("\n3. Запуск simple audio analysis...");
      
      const analysisStart = Date.now();
      const result = await invoke('analyze_audio_simple', {
        videoPath: DEMO_CONFIG.testVideo,
        enableTranscription: false,
        enableMusicAnalysis: true,
        enableEmotionDetection: true
      });
      const analysisTime = Date.now() - analysisStart;
      
      console.log(`   ✅ Simple analysis completed in ${analysisTime}ms`);
      
      // Показываем результаты
      console.log("\n4. Анализ результатов...");
      console.log("Basic Audio Info:");
      console.log(`  - Has Audio: ${result.basic_analysis.has_audio}`);
      console.log(`  - Duration: ${result.basic_analysis.duration_seconds.toFixed(1)}s`);
      console.log(`  - Estimated Quality: ${(result.basic_analysis.estimated_quality * 100).toFixed(1)}%`);
      console.log(`  - Likely Speech: ${result.basic_analysis.likely_has_speech}`);
      console.log(`  - Likely Music: ${result.basic_analysis.likely_has_music}`);
      console.log(`  - Overall Loudness: ${(result.basic_analysis.overall_loudness * 100).toFixed(1)}%`);
      
      console.log("\nAnalysis Metadata:");
      console.log(`  - Version: ${result.analysis_metadata.analysis_version}`);
      console.log(`  - Processing Time: ${result.analysis_metadata.processing_time_ms}ms`);
      console.log(`  - Components Used: ${result.analysis_metadata.components_used.join(', ')}`);
      
      // Сохраняем результаты
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const resultsPath = `${DEMO_CONFIG.outputDir}/simple-audio-analysis-${timestamp}.json`;
      writeFileSync(resultsPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        test_video: DEMO_CONFIG.testVideo,
        analysis_result: result,
        demo_performance: {
          analysis_time_ms: analysisTime
        }
      }, null, 2));
      console.log(`\n📄 Результаты сохранены: ${resultsPath}`);
      
      // 5. Бенчмарк производительности
      console.log("\n5. Запуск бенчмарка производительности...");
      const benchmarkResult = await invoke('benchmark_simple_audio_analysis', {
        testFilePath: DEMO_CONFIG.testVideo,
        iterations: DEMO_CONFIG.iterations
      });
      
      console.log("Benchmark Results:");
      console.log(`  - Total Iterations: ${benchmarkResult.total_iterations}`);
      console.log(`  - Successful Runs: ${benchmarkResult.successful_runs}`);
      console.log(`  - Success Rate: ${(benchmarkResult.success_rate * 100).toFixed(1)}%`);
      console.log(`  - Average Time: ${benchmarkResult.average_time_ms}ms`);
      console.log(`  - Total Time: ${benchmarkResult.total_time_ms}ms`);
      console.log(`  - Performance Rating: ${benchmarkResult.performance_rating.toUpperCase()}`);
      
    } else {
      console.log("\n3. ⏭️  Пропускаем анализ - установите DEMO_CONFIG.testVideo");
    }
    
    console.log("\n✅ Simple Audio Analysis Integration Demo завершен!");
    console.log("\n🔄 Возможности Simple Audio Analysis:");
    console.log("  • FFprobe Detection - основная информация о файле");
    console.log("  • Basic Audio Analysis - простой анализ аудио");
    console.log("  • Performance Benchmarking - тестирование производительности");
    console.log("  • System Capability Detection - проверка доступности инструментов");
    console.log("  • Graceful Degradation - работа даже при ограниченных возможностях");
    
  } catch (error) {
    console.error("❌ Ошибка в Simple Demo:", error);
    process.exit(1);
  }
}

// Демо преимуществ Simple версии
function demoSimpleAdvantages() {
  console.log("\n🚀 Преимущества Simple Audio Analysis");
  console.log("====================================");
  
  console.log("Reliability:");
  console.log("  ✅ Minimal dependencies - только FFprobe/FFmpeg");
  console.log("  ✅ No complex ML models - быстрая инициализация");
  console.log("  ✅ Graceful fallbacks - работает даже при ограничениях");
  console.log("  ✅ Cross-platform - работает везде где есть FFmpeg");
  
  console.log("\nPerformance:");
  console.log("  ⚡ Fast startup - нет загрузки тяжелых моделей");
  console.log("  ⚡ Low memory usage - минимальное потребление ресурсов");
  console.log("  ⚡ Quick analysis - базовая информация за секунды");
  console.log("  ⚡ Predictable performance - стабильное время выполнения");
  
  console.log("\nIntegration:");
  console.log("  🔧 Simple API - понятные команды без сложностей");
  console.log("  🔧 JSON results - легко парсится и используется");
  console.log("  🔧 Error handling - четкие сообщения об ошибках");
  console.log("  🔧 Extensible design - можно легко добавить функции");
}

// Демо use cases для Simple версии
function demoUseCases() {
  console.log("\n💼 Use Cases для Simple Audio Analysis");
  console.log("=====================================");
  
  console.log("Real-time Operations:");
  console.log("  📺 Timeline Scrubbing - быстрая проверка наличия аудио");
  console.log("  🎬 File Import - валидация медиа файлов");
  console.log("  📊 Project Overview - быстрая статистика по проекту");
  console.log("  🔍 File Browser - отображение аудио информации");
  
  console.log("\nBatch Processing:");
  console.log("  📦 Bulk Import - анализ множества файлов");
  console.log("  📈 Project Statistics - общая статистика проекта");
  console.log("  🧹 File Validation - проверка целостности медиа");
  console.log("  📋 Metadata Extraction - сбор базовой информации");
  
  console.log("\nFallback Scenarios:");
  console.log("  🛡️  When ML models unavailable - простой анализ");
  console.log("  🛡️  Low-resource environments - экономия ресурсов");
  console.log("  🛡️  Quick previews - быстрая оценка файлов");
  console.log("  🛡️  Error recovery - восстановление после сбоев");
}

// Запуск всех демо
async function runAllDemos() {
  await main();
  demoSimpleAdvantages();
  demoUseCases();
}

if (import.meta.main) {
  runAllDemos().catch(console.error);
}