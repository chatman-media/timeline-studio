# AI Director - Архитектура системы интеллектуального анализа

## Обзор

AI Director - это комплексная система автоматического анализа медиа-контента, использующая искусственный интеллект для определения ключевых моментов, настроения, качества и структуры видео. Система состоит из нескольких специализированных движков (engines), каждый из которых отвечает за свой аспект анализа.

**Версия**: 5.0
**Последнее обновление**: Ноябрь 2025

## Компоненты системы

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Director                               │
│                     (Orchestrator)                               │
│                                                                  │
│  analyze_media_comprehensive() {                                │
│    1. Audio Analysis     → UnifiedAudioAnalyzer                 │
│    2. Scene Detection    → SceneEngine                          │
│    3. Vision Analysis    → VisionService + VLM                  │
│    4. Moment Detection   → MomentEngine                         │
│    5. Content Analysis   → ContentEngine                        │
│    6. Integration        → Aggregate & Insights                 │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Audio Engine │    │Scene Engine  │    │Vision Service│
│              │    │              │    │    + VLM     │
│ - Transcrip- │    │ - Cut        │    │              │
│   tion       │    │   detection  │    │ - Object     │
│ - Quality    │    │ - Transition │    │   detection  │
│   metrics    │    │   analysis   │    │ - Face       │
│ - Silence    │    │ - Scene      │    │   detection  │
│   detection  │    │   classify   │    │ - Emotion    │
│              │    │              │    │   via VLM    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                  ┌──────────────────────┐
                  │ Integration Layer    │
                  │                      │
                  │ - Cross-reference    │
                  │   findings           │
                  │ - Generate insights  │
                  │ - Calculate scores   │
                  └──────────────────────┘
```

## 1. UnifiedAudioAnalyzer

### Назначение
Анализ аудиодорожки видео для определения качества звука, тишины, громкости и транскрипции.

### Основные функции

- **Transcription**: Преобразование речи в текст через Whisper API
- **Quality Analysis**: Оценка качества звука (шум, искажения)
- **Silence Detection**: Определение пауз и тишины
- **Volume Analysis**: Анализ громкости и динамического диапазона

### Технологии
- **FFmpeg**: Извлечение аудиодорожки
- **Whisper API**: Транскрипция (OpenAI/Groq)
- **Custom DSP**: Анализ качества звука

### Выходные данные

```rust
pub struct AudioAnalysisResult {
  transcription: Option<String>,
  language: Option<String>,
  quality_score: f64,        // 0.0-1.0
  silence_segments: Vec<TimeRange>,
  avg_volume_db: f64,
  peak_volume_db: f64,
}
```

## 2. SceneEngine

### Назначение
Детекция границ сцен, анализ переходов и классификация типов сцен.

### Основные функции

- **Cut Detection**: Определение резких смен кадра (hard cuts)
- **Transition Detection**: Определение плавных переходов (dissolve, fade)
- **Scene Classification**: Классификация типов сцен (диалог, действие, пейзаж)
- **Shot Analysis**: Анализ композиции кадра

### Алгоритмы

- **Pixel Difference**: Сравнение соседних кадров по пикселям
- **Histogram Comparison**: Сравнение гистограмм цветов
- **Edge Detection**: Анализ границ объектов
- **Motion Vectors**: Анализ движения в кадре

### Выходные данные

```rust
pub struct SceneDetectionResult {
  scenes: Vec<Scene>,
  transitions: Vec<Transition>,
  total_scenes: usize,
  avg_scene_duration: f64,
}

pub struct Scene {
  start_time: f64,
  end_time: f64,
  scene_type: SceneType,  // Dialog, Action, Landscape, etc.
  composition: CompositionAnalysis,
}
```

## 3. VisionService + Vision Language Models

### Назначение
Анализ видеокадров через Vision Language Models (VLM) для определения объектов, лиц, эмоций и настроения.

### Поддерживаемые провайдеры

| Провайдер | Модели | Vision | Cost | Рекомендация |
|-----------|---------|--------|------|--------------|
| **Ollama** | moondream2, llava, llama3.2-vision | ✅ | $0 | ⭐ Default |
| **DeepSeek** | deepseek-vl | ✅ | ~$0.01/video | 💰 Best value |
| **OpenAI** | gpt-4o, gpt-4-turbo | ✅ | ~$0.08/video | 🎯 High quality |
| **Claude** | claude-4.5-sonnet, opus | ✅ | ~$0.12/video | 👑 Premium |

### Архитектура VLM Pipeline

```
Video → FFmpeg Frame Extraction → Base64 Encoding → VLM API
  │                                                      │
  │                                                      ▼
  │                                          ┌────────────────────┐
  │                                          │ VLM Analysis       │
  │                                          │ - Objects          │
  │                                          │ - Scene type       │
  │                                          │ - Mood/emotion     │
  │                                          │ - Description      │
  │                                          └────────────────────┘
  │                                                      │
  └──────────────────────────────────────────────────────┘
                         │
                         ▼
            Aggregate Results → Overall Summary
```

### Конфигурация

```rust
pub struct VisionAnalysisConfig {
  provider: AIProvider,  // Ollama/DeepSeek/OpenAI/Claude
  model: String,         // "moondream2", "gpt-4o", etc.
  num_frames: usize,     // 3-15 frames
  temperature: f64,      // 0.3-0.9
  max_tokens: u32,       // 512-2048
}
```

### Multimodal Content Flow

```rust
// 1. Извлечение кадра
let frame_bytes = extract_frame_at_timestamp(video, 10.5)?;

// 2. Кодирование в base64
let base64_data = BASE64.encode(&frame_bytes);

// 3. Создание мультимодального сообщения
let message = AIMessage {
  role: "user",
  content: AIMessageContent::Multimodal(vec![
    AIContentPart::Text {
      text: "Describe this frame: objects, mood, scene type"
    },
    AIContentPart::Image {
      source: AIImageSource::Base64 {
        media_type: "image/jpeg",
        data: base64_data
      }
    }
  ])
};

// 4. Отправка к провайдеру
let response = provider_manager.send_request(api_key, request)?;

// 5. Парсинг результата
let frame_analysis: FrameAnalysis = parse_vlm_response(response)?;
```

### Выходные данные

```rust
pub struct VLMAnalysisResult {
  frames: Vec<FrameAnalysis>,
  overall_summary: String,
  themes: Vec<String>,        // Objects occurring >30%
  processing_time_ms: u64,
}

pub struct FrameAnalysis {
  timestamp: f64,
  description: String,
  detected_objects: Vec<String>,
  scene_type: Option<String>,
  mood: Option<String>,        // ← Emotion from VLM
}
```

### Обработка эмоций

VLM возвращает `mood` (настроение) для каждого кадра. Система поддерживает два способа определения эмоций:

**1. VLM-based Emotion Detection** (текущий):
```
Video Frame → VLM API → mood: "happy" | "sad" | "neutral" | ...
```

**2. YOLO-based Face Detection** (альтернативный):
```
Video Frame → YOLO Face Model → FaceAttributes { emotion: Option<String> }
              → EmotionDetector → Temporal Smoothing
```

**Примечание**: YOLO Face модели требуют отдельную обученную модель для распознавания эмоций (FER - Facial Expression Recognition), которая пока не реализована. VLM approach более гибкий и не требует специальной модели.

## 4. MomentEngine

### Назначение
Определение ключевых моментов в видео, которые заслуживают внимания.

### Основные функции

- **Peak Detection**: Определение пиков активности (звук + движение)
- **Highlight Scoring**: Оценка важности каждого момента
- **Emotional Moments**: Определение эмоционально значимых моментов
- **Action Sequences**: Определение динамичных сцен

### Метрики важности

```rust
pub struct MomentScore {
  audio_energy: f64,      // 0.0-1.0
  visual_activity: f64,   // 0.0-1.0
  emotion_intensity: f64, // 0.0-1.0
  scene_change: f64,      // 0.0-1.0
  combined_score: f64,    // Weighted average
}
```

### Выходные данные

```rust
pub struct MomentDetectionResult {
  key_moments: Vec<KeyMoment>,
  highlight_timeline: Vec<HighlightSegment>,
  importance_curve: Vec<(f64, f64)>,  // (time, score)
}

pub struct KeyMoment {
  timestamp: f64,
  duration: f64,
  score: MomentScore,
  tags: Vec<String>,  // "action", "dialogue", "transition"
}
```

## 5. ContentEngine

### Назначение
Классификация контента, определение жанра, настроения и качества.

### Основные функции

- **Genre Classification**: Определение жанра (vlog, tutorial, music, etc.)
- **Mood Analysis**: Определение общего настроения видео
- **Quality Assessment**: Оценка технического качества
- **Content Rating**: Оценка контента по категориям

### Выходные данные

```rust
pub struct ContentAnalysisResult {
  genre: ContentGenre,
  mood: Vec<Mood>,           // Multiple moods with weights
  quality_metrics: QualityMetrics,
  categories: Vec<String>,
  suitability: ContentRating,
}

pub struct QualityMetrics {
  video_quality: f64,        // Resolution, bitrate, codec
  audio_quality: f64,        // Sample rate, bitrate, clarity
  production_value: f64,     // Editing, effects, transitions
  overall_quality: f64,      // Combined score
}
```

## 6. Integration Layer

### Назначение
Объединение результатов всех движков для получения целостной картины.

### Основные функции

- **Cross-Reference**: Сопоставление данных из разных источников
- **Insight Generation**: Генерация высокоуровневых инсайтов
- **Score Calculation**: Расчёт итоговых оценок
- **Recommendation Generation**: Генерация рекомендаций по улучшению

### Примеры интеграции

**Пример 1: Emotion + Audio + Scene**
```
VLM mood="happy" + Audio laughter + Scene type="dialogue"
→ Insight: "Humorous conversation moment"
```

**Пример 2: Silence + Scene Change + Low Visual Activity**
```
Audio silence + Hard cut transition + Minimal motion
→ Insight: "Contemplative pause, good for emphasis"
```

## Event-Driven Architecture

AI Director With Events поддерживает real-time уведомления о прогрессе анализа.

### События

```rust
pub enum AIAnalysisEvent {
  AnalysisStarted {
    analysis_id: String,
    file_path: String,
    analysis_type: String,
  },

  ProgressUpdate {
    analysis_id: String,
    stage: String,           // "audio", "scene", "vision", etc.
    progress_pct: f64,       // 0.0-100.0
    message: String,
    estimated_time_sec: u64,
  },

  StageCompleted {
    analysis_id: String,
    stage: String,
    duration_ms: u64,
    success: bool,
    error: Option<String>,
  },

  AnalysisCompleted {
    analysis_id: String,
    result: ComprehensiveAnalysisResult,
    total_duration_ms: u64,
  },

  AnalysisFailed {
    analysis_id: String,
    error: String,
    stage: String,
  },
}
```

### Подписка на события (Frontend)

```typescript
import { listen } from '@tauri-apps/api/event'

// Подписка на progress updates
const unlisten = await listen<ProgressUpdate>(
  'ai-analysis-progress',
  (event) => {
    console.log(`${event.payload.stage}: ${event.payload.progress_pct}%`)
    console.log(event.payload.message)
  }
)

// Подписка на completion
await listen<AnalysisCompleted>(
  'ai-analysis-completed',
  (event) => {
    console.log('Analysis complete!')
    console.log(event.payload.result)
  }
)
```

## Performance Modes

AI Director поддерживает 3 режима производительности:

| Mode | Speed | Quality | Use Case |
|------|-------|---------|----------|
| **Fast** | ⚡⚡⚡ | ⭐⭐ | Быстрый preview |
| **Balanced** | ⚡⚡ | ⭐⭐⭐ | Обычная работа (default) |
| **Quality** | ⚡ | ⭐⭐⭐⭐⭐ | Production analysis |

### Различия режимов

**Fast Mode:**
- Audio: Whisper Tiny модель
- Vision: 3 кадра, moondream2
- Scene: Упрощённый алгоритм
- Moment: Базовая детекция
- Время: ~30 сек для 10-мин видео

**Balanced Mode:**
- Audio: Whisper Base модель
- Vision: 5 кадров, llava или deepseek-vl
- Scene: Полный анализ
- Moment: Полная детекция
- Время: ~2 мин для 10-мин видео

**Quality Mode:**
- Audio: Whisper Large модель
- Vision: 10-15 кадров, gpt-4o или claude-4.5-sonnet
- Scene: Детальный анализ с motion vectors
- Moment: Расширенная детекция с эмоциями
- Время: ~5-8 мин для 10-мин видео

## Конфигурация

### Полный пример конфигурации

```rust
pub struct AIDirectorConfig {
  // Performance mode
  performance_mode: AudioPerformanceMode,  // Fast/Balanced/Quality

  // Engine toggles
  enable_audio_analysis: bool,
  enable_scene_detection: bool,
  enable_vision_analysis: bool,
  enable_vision_language_model: bool,  // ← VLM
  enable_moment_detection: bool,
  enable_content_analysis: bool,

  // VLM Configuration
  ai_provider: Option<AIProvider>,     // Ollama/DeepSeek/OpenAI/Claude
  ai_model: Option<String>,            // Model name
  vlm_model: Option<String>,           // Vision model
  vlm_num_frames: usize,               // 3-15
  vlm_temperature: f64,                // 0.3-0.9
  vlm_max_tokens: u32,                 // 512-2048

  // Limits
  max_processing_time: Option<u64>,    // Timeout in seconds
  quality_threshold: f64,              // Minimum quality (0.0-1.0)

  // Features
  enable_caching: bool,
  enable_mcp_agents: bool,
}
```

## Пример использования

### Rust (Backend)

```rust
use crate::analysis::services::ai_director::AIDirector;

let config = AIDirectorConfig {
  performance_mode: AudioPerformanceMode::Balanced,
  enable_vision_language_model: true,
  ai_provider: Some(AIProvider::Ollama),
  ai_model: Some("moondream2".to_string()),
  vlm_num_frames: 5,
  ..Default::default()
};

let director = AIDirector::new(config);

let result = director
  .analyze_media_comprehensive("video.mp4")
  .await?;

println!("Scenes: {}", result.scene_analysis.scenes.len());
println!("Key moments: {}", result.moment_analysis.key_moments.len());
println!("Vision summary: {}",
  result.vision_analysis.overall_summary
);
```

### TypeScript (Frontend)

```typescript
import { useAIDirector } from '@/features/ai-director/hooks/use-ai-director'

function AnalysisComponent() {
  const { analyzeComprehensive, state } = useAIDirector()

  const runAnalysis = async () => {
    const config: AIDirectorConfig = {
      performance_mode: 'Balanced',
      enable_vision_language_model: true,
      vlm_provider: 'Ollama',
      vlm_model: 'moondream2',
      vlm_num_frames: 5,
    }

    await analyzeComprehensive('video.mp4', config)
  }

  return (
    <div>
      {state.isAnalyzing && (
        <div>Progress: {state.progress}%</div>
      )}

      {state.currentResult && (
        <div>
          <h3>Analysis Complete</h3>
          <p>Scenes: {state.currentResult.scene_analysis.scenes.length}</p>
          <p>Mood: {state.currentResult.content_analysis.mood}</p>
        </div>
      )}
    </div>
  )
}
```

## Дополнительные ресурсы

- [VLM Integration Guide](../05_development/ru/vlm-integration.md)
- [AI Provider Manager](../../src-tauri/src/video_compiler/commands/ai_api_proxy/provider_manager.rs)
- [Vision Analyzer](../../src-tauri/src/analysis/services/vision_analyzer.rs)
- [Emotion Detector](../../src-tauri/src/montage_planner/services/emotion_detector.rs)
