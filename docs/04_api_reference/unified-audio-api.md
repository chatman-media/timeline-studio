# Документация API Unified Audio Analysis

**Версия**: 2.0-unified
**Статус**: Готов к продакшену
**Последнее обновление**: 25 ноября 2025

## Обзор

Unified Audio Analysis - это современная система анализа аудио в Timeline Studio, объединяющая три движка анализа (FFmpeg, Montage Planner, Whisper) в единый унифицированный API.

**⚠️ УВЕДОМЛЕНИЕ О МИГРАЦИИ**: Старые отдельные API для аудио анализа устарели. Используйте новый Unified Audio API.

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (TypeScript)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   React Hooks (use-timeline-ai-analysis.ts)          │  │
│  │   - Типобезопасность через Specta привязки           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                         Tauri IPC
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Rust)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           UnifiedAudioAnalyzer Service                │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  analyze_comprehensive()                        │  │  │
│  │  │                                                 │  │  │
│  │  │  1. Basic Metrics     (всегда доступно)        │  │  │
│  │  │  2. FFmpeg Analysis   (volume, frequency)      │  │  │
│  │  │  3. Montage Analysis  (beat, speech, music)    │  │  │
│  │  │  4. Transcription     (Whisper STT)            │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Быстрый старт

### Backend (Rust)

```rust
use crate::analysis::services::unified_audio_analyzer::UnifiedAudioAnalyzer;
use crate::analysis::types::{UnifiedAudioConfig, AudioPerformanceMode};

// Создание анализатора
let analyzer = UnifiedAudioAnalyzer::new();

// Получение рекомендуемой конфигурации
let config = analyzer.get_recommended_config(AudioPerformanceMode::Balanced).await;

// Запуск комплексного анализа
let result = analyzer
    .analyze_comprehensive(&video_path, Some(config))
    .await?;

println!("Анализ завершен! Движки: {:?}", result.analysis_metadata.engines_used);
println!("Качество: {:.1}%", result.overall_quality_score() * 100.0);
```

### Frontend (TypeScript/React)

```typescript
import { invoke } from "@tauri-apps/api/core";

// Comprehensive анализ
const resultJson = await invoke<string>("analyze_audio_unified", {
  filePath: "/path/to/video.mp4",
  config: JSON.stringify({
    enable_ffmpeg_analysis: true,
    enable_montage_analysis: true,
    enable_transcription: false,
    performance_mode: "Balanced"
  })
});

const result = JSON.parse(resultJson);
console.log("Движки:", result.analysis_metadata.engines_used);
console.log("Качество:", result.basic_metrics.estimated_quality);
```

---

## Справочник по API

### Tauri команды (10)

Все команды доступны через TypeScript привязки:

---

#### 1. `analyze_audio_unified`

**Полный комплексный анализ с unified типами.**

```typescript
const resultJson = await invoke<string>("analyze_audio_unified", {
  filePath: "/path/to/video.mp4",
  config: JSON.stringify({
    enable_ffmpeg_analysis: true,
    enable_montage_analysis: true,
    enable_transcription: false,
    performance_mode: "Balanced",
    max_processing_time_seconds: 300
  })
});

const result: UnifiedAudioAnalysisResult = JSON.parse(resultJson);
```

**Параметры**:
- `file_path: string` - Путь к видео/аудио файлу
- `config?: string` - JSON-сериализованный `UnifiedAudioConfig` (optional)

**Возвращает**: `UnifiedAudioAnalysisResult` (JSON string)

---

#### 2. `analyze_audio_quick`

**Быстрый анализ с базовыми метриками.**

```typescript
const resultJson = await invoke<string>("analyze_audio_quick", {
  filePath: "/path/to/video.mp4"
});

const basicMetrics: AudioBasicMetrics = JSON.parse(resultJson);
console.log("Длительность:", basicMetrics.duration.seconds, "с");
console.log("Каналы:", basicMetrics.channels);
```

**Параметры**:
- `file_path: string` - Путь к файлу

**Возвращает**: `AudioBasicMetrics` (JSON string)

---

#### 3. `analyze_audio_with_fallback`

**Анализ с fallback на доступные движки.**

```typescript
const resultJson = await invoke<string>("analyze_audio_with_fallback", {
  filePath: "/path/to/video.mp4",
  preferredEngines: ["ffmpeg", "montage", "whisper"]
});

const result: UnifiedAudioAnalysisResult = JSON.parse(resultJson);
```

**Параметры**:
- `file_path: string` - Путь к файлу
- `preferred_engines: string[]` - Список предпочтительных движков: `"ffmpeg"`, `"montage"`, `"whisper"`

**Возвращает**: `UnifiedAudioAnalysisResult` (JSON string)

---

#### 4. `get_audio_system_capabilities`

**Проверка возможностей системы.**

```typescript
const capsJson = await invoke<string>("get_audio_system_capabilities");
const capabilities: AudioSystemCapabilities = JSON.parse(capsJson);

console.log("FFmpeg:", capabilities.ffmpeg_available);
console.log("FFprobe:", capabilities.ffprobe_available);
console.log("Montage:", capabilities.montage_planner_available);
console.log("Whisper:", capabilities.whisper_available);
console.log("GPU:", capabilities.gpu_acceleration_available);
```

**Возвращает**: `AudioSystemCapabilities` (JSON string)

---

#### 5. `get_recommended_audio_config`

**Получение рекомендуемой конфигурации для файла.**

```typescript
const configJson = await invoke<string>("get_recommended_audio_config", {
  filePath: "/path/to/video.mp4",
  performanceMode: "balanced" // "fast" | "balanced" | "quality"
});

const config: UnifiedAudioConfig = JSON.parse(configJson);
```

**Параметры**:
- `file_path: string` - Путь к файлу
- `performance_mode: string` - Режим: `"fast"`, `"balanced"`, `"quality"`

**Возвращает**: `UnifiedAudioConfig` (JSON string)

---

#### 6. `analyze_audio_batch`

**Пакетный анализ нескольких файлов.**

```typescript
const resultsJson = await invoke<string>("analyze_audio_batch", {
  filePaths: ["/video1.mp4", "/video2.mp4", "/video3.mp4"],
  config: JSON.stringify({
    performance_mode: "Fast",
    enable_ffmpeg_analysis: true
  })
});

const results: UnifiedAudioAnalysisResult[] = JSON.parse(resultsJson);
```

**Параметры**:
- `file_paths: string[]` - Массив путей к файлам
- `config?: string` - JSON-сериализованный `UnifiedAudioConfig` (optional)

**Возвращает**: `UnifiedAudioAnalysisResult[]` (JSON string)

---

#### 7. `benchmark_unified_audio_analysis`

**Бенчмарк производительности анализа.**

```typescript
const benchmarkJson = await invoke<string>("benchmark_unified_audio_analysis", {
  testFilePath: "/path/to/test-video.mp4",
  iterations: 3
});

const benchmark: BenchmarkResult = JSON.parse(benchmarkJson);
console.log("Среднее время:", benchmark.average_processing_time_ms, "мс");
console.log("Success rate:", benchmark.success_rate * 100, "%");
```

**Параметры**:
- `test_file_path: string` - Путь к тестовому файлу
- `iterations: number` - Количество итераций

**Возвращает**: `BenchmarkResult` (JSON string)

---

#### 8. `get_unified_audio_analysis_status`

**Получение статуса системы анализа.**

```typescript
const statusJson = await invoke<string>("get_unified_audio_analysis_status");
const status: SystemStatus = JSON.parse(statusJson);
```

**Возвращает**: `SystemStatus` (JSON string)

---

#### 9. `analyze_audio_transcription_unified`

**Только транскрипция через Whisper.**

```typescript
const transcriptionJson = await invoke<string>("analyze_audio_transcription_unified", {
  filePath: "/path/to/video.mp4",
  performanceMode: "balanced", // optional
  enableWordTimestamps: true    // optional
});

const transcription: AudioTranscriptionAnalysis = JSON.parse(transcriptionJson);
console.log("Текст:", transcription.full_text);
console.log("Язык:", transcription.detected_language);
console.log("Слов:", transcription.words.length);
```

**Параметры**:
- `file_path: string` - Путь к файлу
- `performance_mode?: string` - `"fast"`, `"balanced"`, `"quality"`
- `enable_word_timestamps?: boolean` - Включить временные метки слов

**Возвращает**: `AudioTranscriptionAnalysis` (JSON string)

---

#### 10. `check_whisper_availability_unified`

**Проверка доступности Whisper.**

```typescript
const whisperJson = await invoke<string>("check_whisper_availability_unified");
const whisperStatus = JSON.parse(whisperJson);

console.log("Whisper доступен:", whisperStatus.whisper_available);
console.log("Локальный Whisper:", whisperStatus.local_whisper);
```

**Возвращает**: `WhisperAvailability` (JSON string)

---

## Типы данных

### UnifiedAudioConfig

```typescript
interface UnifiedAudioConfig {
  // Включение движков
  enable_ffmpeg_analysis: boolean;   // FFmpeg volume/frequency
  enable_montage_analysis: boolean;  // Beat/speech detection
  enable_transcription: boolean;     // Whisper STT

  // Режим производительности
  performance_mode: "Fast" | "Balanced" | "Quality" | "Custom";

  // Ограничения
  max_processing_time_seconds?: number;
  enable_caching: boolean;

  // Детальные конфигурации (optional)
  ffmpeg_config?: AudioFFmpegConfig;
  montage_config?: AudioMontageConfig;
  whisper_config?: AudioWhisperConfig;
}
```

### AudioPerformanceMode

| Режим | Время | Движки | Применение |
|------|------|---------|----------|
| **Fast** | ~5-10с | Basic + FFmpeg | Быстрый просмотр |
| **Balanced** | ~20с | Basic + FFmpeg + Montage | Обычная работа |
| **Quality** | ~20-120с | Все включая Whisper | Полный анализ |

### UnifiedAudioAnalysisResult

```typescript
interface UnifiedAudioAnalysisResult {
  // Базовые метрики (всегда доступны)
  basic_metrics: AudioBasicMetrics;

  // Опциональные результаты движков
  ffmpeg_analysis?: AudioFFmpegAnalysis;
  montage_analysis?: AudioMontageAnalysis;
  transcription_analysis?: AudioTranscriptionAnalysis;

  // Метаданные
  analysis_metadata: AudioAnalysisMetadata;
}
```

### AudioBasicMetrics

```typescript
interface AudioBasicMetrics {
  duration: AudioDuration;        // { seconds: number }
  has_audio: boolean;
  sample_rate: AudioSampleRate;   // { hz: number }
  channels: number;
  overall_volume: AudioVolume;    // { level: number }
  estimated_quality: number;      // 0.0 - 1.0
  file_size_bytes?: number;
  codec?: string;
  bitrate?: number;
}
```

### AudioFFmpegAnalysis

```typescript
interface AudioFFmpegAnalysis {
  volume_analysis: {
    peak_volume: AudioVolume;
    average_volume: AudioVolume;
    rms_volume: AudioVolume;
    dynamic_range: number;
    loudness_lufs?: number;
    volume_histogram: VolumeHistogramBin[];
  };
  frequency_analysis: {
    dominant_frequencies: AudioFrequency[];
    frequency_distribution: FrequencyDistribution;
    spectral_centroid: AudioFrequency;
    spectral_rolloff: AudioFrequency;
    zero_crossing_rate: number;
  };
  dynamics_analysis: {
    crest_factor: number;
    dynamic_range: number;
    compression_ratio: number;
    attack_time: AudioDuration;
    release_time: AudioDuration;
  };
  quality_metrics: {
    overall_score: number;
    noise_level: number;
    clipping_detected: boolean;
    distortion_level: number;
    signal_to_noise_ratio: number;
    issues: AudioQualityIssue[];
  };
}
```

### AudioMontageAnalysis

```typescript
interface AudioMontageAnalysis {
  dynamic_range: number;
  speech_probability: number;      // 0.0 - 1.0
  music_probability: number;       // 0.0 - 1.0
  overall_quality_score: number;

  // Сегменты контента
  content_segments: AudioContentSegment[];
  silence_segments: AudioSilenceSegment[];

  // Музыкальный анализ
  beat_detection?: AudioBeatAnalysis;
  tempo_analysis?: AudioTempoAnalysis;
  key_detection?: AudioKeyDetection;

  // Эмоциональный анализ
  emotional_tone?: AudioEmotionalTone;
  energy_level: number;
  valence: number;
}
```

### AudioTranscriptionAnalysis

```typescript
interface AudioTranscriptionAnalysis {
  // Unified API (новая архитектура)
  engine_name: string;
  full_text: string;
  detected_language?: string;
  total_duration?: AudioDuration;
  segments: TranscriptionSegment[];
  words: TranscriptionWord[];
  confidence_score: number;
  processing_time: AudioDuration;

  // Legacy fields (для совместимости)
  transcription_text?: string;
  language_detected?: string;
  overall_confidence?: number;
  speech_rate?: number;
  model_used?: string;
  provider_used?: string;
}

interface TranscriptionSegment {
  start_time: AudioTimestamp;
  end_time: AudioTimestamp;
  text: string;
  confidence: number;
  language?: string;
  speaker_id?: string;
}

interface TranscriptionWord {
  word: string;
  start_time: AudioTimestamp;
  end_time: AudioTimestamp;
  confidence: number;
}
```

### AudioAnalysisMetadata

```typescript
interface AudioAnalysisMetadata {
  analysis_version: string;        // "2.0-unified"
  processing_time_ms: number;
  engines_used: string[];          // ["basic", "ffmpeg", "montage"]
  config_used: UnifiedAudioConfig;
  total_engines_available: number;
  analysis_timestamp: string;      // ISO 8601
  success_rate: number;            // 0.0 - 1.0
}
```

---

## Производительность

### Бенчмарки (на реальных данных)

| Режим | Время | Движки | Результат |
|------|------|---------|----------|
| **Fast** | 5.21с | Basic | 100% success |
| **Balanced** | 19.24с | Basic + Montage | 100% success |
| **Quality** | 19.99с | Basic + Montage | 100% success* |

*Без Whisper. С Whisper время увеличивается до 1-2 минут.

### Системные возможности

```
FFmpeg:    ✅ Доступен
FFprobe:   ✅ Доступен
Montage:   ✅ Доступен
Whisper:   ❌ Требует установки
GPU:       ✅ Доступен (Metal на macOS)
```

### Советы по оптимизации

1. **Используйте подходящий режим**:
   - `Fast` - для предпросмотра и импорта
   - `Balanced` - для редактирования
   - `Quality` - для финального экспорта

2. **Включите кэширование**: `enable_caching: true`

3. **Batch обработка**: Анализируйте несколько файлов одним вызовом

4. **Ограничивайте время**: Используйте `max_processing_time_seconds`

---

## Обработка ошибок

### AudioAnalysisError

```typescript
enum AudioAnalysisError {
  FileNotFound = "File not found",
  UnsupportedFormat = "Unsupported format",
  FFmpegError = "FFmpeg analysis error",
  MontageError = "Montage analysis error",
  WhisperError = "Whisper analysis error",
  ConfigurationError = "Configuration error",
  TimeoutError = "Analysis timeout",
  InsufficientMemory = "Insufficient memory",
  ConversionError = "Type conversion error",
  ProcessingError = "Processing error"
}
```

### Пример обработки

```typescript
try {
  const resultJson = await invoke<string>("analyze_audio_unified", {
    filePath: videoPath,
    config: JSON.stringify(config)
  });
  const result = JSON.parse(resultJson);

  // Проверка success rate
  if (result.analysis_metadata.success_rate < 1.0) {
    console.warn("Некоторые движки не завершились успешно");
    console.warn("Использованные:", result.analysis_metadata.engines_used);
  }
} catch (error) {
  if (error.includes("File not found")) {
    console.error("Файл не найден");
  } else if (error.includes("timeout")) {
    console.error("Анализ превысил лимит времени");
  } else {
    console.error("Ошибка анализа:", error);
  }
}
```

---

## Лучшие практики

### 1. Проверяйте capabilities перед анализом

```typescript
const caps = JSON.parse(
  await invoke<string>("get_audio_system_capabilities")
);

if (!caps.ffmpeg_available) {
  console.error("FFmpeg не установлен");
  return;
}

const config = {
  enable_ffmpeg_analysis: caps.ffmpeg_available,
  enable_montage_analysis: caps.montage_planner_available,
  enable_transcription: caps.whisper_available
};
```

### 2. Используйте рекомендуемую конфигурацию

```typescript
const configJson = await invoke<string>("get_recommended_audio_config", {
  filePath: videoPath,
  performanceMode: "balanced"
});

const result = await invoke<string>("analyze_audio_unified", {
  filePath: videoPath,
  config: configJson
});
```

### 3. Обрабатывайте частичные результаты

```typescript
const result = JSON.parse(resultJson);

// Базовые метрики всегда доступны
console.log("Duration:", result.basic_metrics.duration.seconds);

// Опциональные анализы
if (result.ffmpeg_analysis) {
  console.log("Peak volume:", result.ffmpeg_analysis.volume_analysis.peak_volume);
}

if (result.montage_analysis) {
  console.log("BPM:", result.montage_analysis.beat_detection?.bpm);
}

if (result.transcription_analysis) {
  console.log("Текст:", result.transcription_analysis.full_text);
}
```

### 4. Batch обработка для нескольких файлов

```typescript
const files = ["/video1.mp4", "/video2.mp4", "/video3.mp4"];

// Используйте batch вместо последовательных вызовов
const resultsJson = await invoke<string>("analyze_audio_batch", {
  filePaths: files,
  config: JSON.stringify({ performance_mode: "Fast" })
});

const results = JSON.parse(resultsJson);
results.forEach((result, i) => {
  console.log(`${files[i]}: ${result.basic_metrics.duration.seconds}с`);
});
```

---

## Breaking Changes

### Версия 2.0-unified (November 2024)

#### ⚠️ Удалённые API

| Legacy API | Статус | Замена |
|-----------|--------|--------|
| `analyze_audio_ffmpeg` | ❌ Удалён | `analyze_audio_unified` |
| `analyze_audio_montage` | ❌ Удалён | `analyze_audio_unified` |
| `transcribe_audio_whisper` | ❌ Удалён | `analyze_audio_transcription_unified` |
| `get_audio_capabilities` | ❌ Удалён | `get_audio_system_capabilities` |

#### ⚠️ Изменённые типы

**AudioAnalysisResult → UnifiedAudioAnalysisResult**
```typescript
// ❌ Старый тип
interface AudioAnalysisResult {
  volume: number;
  frequency: number[];
  quality: number;
}

// ✅ Новый тип
interface UnifiedAudioAnalysisResult {
  basic_metrics: AudioBasicMetrics;
  ffmpeg_analysis?: AudioFFmpegAnalysis;
  montage_analysis?: AudioMontageAnalysis;
  transcription_analysis?: AudioTranscriptionAnalysis;
  analysis_metadata: AudioAnalysisMetadata;
}
```

**f32 → f64 (Montage Planner)**
```rust
// ❌ Старый тип (Montage Planner)
pub dynamic_range: f32;

// ✅ Новый тип (Unified)
pub dynamic_range: AudioFloat; // f64
```

**Volume representation**
```typescript
// ❌ Старый формат
volume: 0.75  // raw number

// ✅ Новый формат
overall_volume: { level: 0.75 }  // AudioVolume struct
```

#### ⚠️ Изменённые endpoints

| Старый endpoint | Новый endpoint | Изменения |
|----------------|----------------|-----------|
| `analyze_audio` | `analyze_audio_unified` | Другой формат ответа |
| `get_transcription` | `analyze_audio_transcription_unified` | Unified типы |
| `check_whisper` | `check_whisper_availability_unified` | Расширенный ответ |

#### ⚠️ Удалённые поля

- `AudioTranscriptionAnalysis.confidence` → Используйте `confidence_score`
- `AudioTranscriptionAnalysis.language_detected` → Используйте `detected_language`
- `AudioTranscriptionAnalysis.transcription_text` → Используйте `full_text`
- `AudioTranscriptionAnalysis.word_segments` → Используйте `words`

---

## Миграция с legacy API

### Раньше (Устарело):

```typescript
// ❌ Старый подход - отдельные вызовы
const ffmpegResult = await invoke("analyze_audio_ffmpeg", { path });
const montageResult = await invoke("analyze_audio_montage", { path });
const whisperResult = await invoke("transcribe_audio_whisper", { path });
```

### Теперь (Unified API):

```typescript
// ✅ Новый подход - единый вызов
const result = await invoke<string>("analyze_audio_unified", {
  filePath: path,
  config: JSON.stringify({
    enable_ffmpeg_analysis: true,
    enable_montage_analysis: true,
    enable_transcription: true
  })
});
```

### Чеклист миграции

- [ ] Заменить отдельные вызовы анализа на `analyze_audio_unified`
- [ ] Обновить типы на unified структуры
- [ ] Использовать `AudioPerformanceMode` вместо ручных настроек
- [ ] Проверить обработку ошибок с новыми типами
- [ ] Удалить legacy imports

---

## Дополнительное чтение

- **Архитектура**: `/docs/03_architecture/audio-analysis-architecture.md`
- **Задача рефакторинга**: `/docs/08_tasks/active/audio-analysis-architecture-refactoring-plan.md`
- **Performance тесты**: `/src-tauri/src/analysis/services/performance_tests.rs`
- **Unit тесты**: `/src-tauri/src/analysis/types/tests.rs`

---

**Версия**: 2.0-unified
**Последнее обновление**: 25 ноября 2025
**Статус**: Готов к продакшену
