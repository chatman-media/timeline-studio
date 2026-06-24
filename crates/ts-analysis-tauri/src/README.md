# Analysis Module

AI-powered медиа анализ для Timeline Studio. Включает AI Director, Scene Engine, Vision Service, Content Engine и Audio Analysis.

## Обзор

Analysis module предоставляет comprehensive AI-powered анализ медиафайлов:
- **AI Director** - Orchestration всех анализов с recommendation engine
- **Scene Engine** - Автоматическая детекция и классификация сцен
- **Vision Service** - Object/face detection через YOLO и RetinaFace
- **Content Engine** - Content classification, composition и mood analysis
- **Audio Analyzer** - Unified audio analysis с FFmpeg, Montage Planner и Whisper

## Архитектура

```
┌─────────────────────────────────────────┐
│ Frontend (React)                        │
│ - features/ai-chat                      │
│ - features/recognition                  │
│ - features/smart-montage-planner        │
└─────────────┬───────────────────────────┘
              │ Tauri IPC
              ↓
┌─────────────────────────────────────────┐
│ Analysis Module (Rust)                  │
│ ┌─────────────────────────────────────┐ │
│ │ AI Director                         │ │
│ │  - Orchestrates all engines         │ │
│ │  - Comprehensive analysis           │ │
│ │  - Editing recommendations          │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Scene Engine                        │ │
│ │  - Scene detection                  │ │
│ │  - Scene classification             │ │
│ │  - Transition analysis              │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Vision Service                      │ │
│ │  - YOLO object detection            │ │
│ │  - RetinaFace face detection        │ │
│ │  - FaceNet embeddings               │ │
│ │  - Color analysis                   │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Content Engine                      │ │
│ │  - Content classification           │ │
│ │  - Composition analysis             │ │
│ │  - Mood detection                   │ │
│ │  - Quality scoring                  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Unified Audio Analyzer              │ │
│ │  - FFmpeg basic metrics             │ │
│ │  - Montage Planner analysis         │ │
│ │  - Whisper transcription            │ │
│ │  - Fallback strategy                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Структура файлов

```
analysis/
├── README.md                            # Этот файл
├── mod.rs                               # Главный модуль + project commands
├── commands/
│   ├── mod.rs                           # Re-exports всех команд
│   ├── ai_director_commands.rs          # AI Director Tauri commands
│   ├── ai_director_v2_commands.rs       # AI Director v2 with events
│   ├── scene_commands.rs                # Scene Engine commands
│   ├── vision_commands.rs               # Vision Service commands
│   ├── content_commands.rs              # Content Engine commands
│   ├── unified_audio_commands.rs        # Audio analysis commands
│   ├── content_classification_commands.rs
│   ├── script_generation_commands.rs
│   └── real_analysis_commands.rs
├── engines/
│   ├── scene_engine.rs                  # Scene detection & analysis
│   ├── content_engine.rs                # Content classification
│   └── moment_engine.rs                 # Key moment detection
├── services/
│   ├── ai_director.rs                   # Main AI Director service
│   ├── ai_director_with_events.rs       # Event-driven version
│   ├── scene_detector.rs                # Scene detection logic
│   ├── vision_analyzer.rs               # Vision analysis
│   ├── unified_audio_analyzer.rs        # Unified audio analysis
│   ├── content_classification_engine.rs
│   ├── moment_analyzer.rs
│   ├── real_analysis_engine.rs
│   └── script_generator.rs
├── types/
│   ├── mod.rs                           # Type exports
│   ├── unified_types.rs                 # Main analysis types
│   ├── audio_analysis.rs                # Audio types
│   ├── audio_core.rs                    # Core audio types
│   └── content_classification.rs
├── adapters/
│   ├── ffmpeg_adapter.rs                # FFmpeg integration
│   ├── whisper_adapter.rs               # Whisper integration
│   └── montage_adapter.rs               # Montage Planner adapter
├── database/
│   ├── mod.rs                           # Database module
│   ├── queries.rs                       # SQL queries
│   └── migrations.rs                    # Schema migrations
└── models/
    └── mod.rs                           # ML model management
```

## Core Types / Основные типы

### AI Director Config

```rust
pub struct AIDirectorConfig {
    pub performance_mode: AudioPerformanceMode,
    pub enable_audio_analysis: bool,
    pub enable_scene_detection: bool,
    pub enable_video_analysis: bool,
    pub enable_vision_analysis: bool,
    pub enable_face_detection: bool,
    pub enable_face_analysis: bool,
    pub enable_object_detection: bool,
    pub enable_object_analysis: bool,
    pub enable_emotion_analysis: bool,
    pub enable_moment_detection: bool,
    pub enable_content_classification: bool,
    pub enable_composition_analysis: bool,
    pub enable_mood_analysis: bool,
    pub enable_quality_analysis: bool,
    pub max_processing_time: Option<u32>,
    pub generate_editing_recommendations: bool,
    pub enable_mcp_agents: bool,
}
```

### Comprehensive Analysis Result

```rust
pub struct ComprehensiveAnalysisResult {
    pub file_path: String,
    pub duration: Option<f64>,
    pub scenes: Vec<SceneAnalysis>,
    pub audio: Option<UnifiedAudioAnalysis>,
    pub video: Option<VideoAnalysis>,
    pub vision: Option<VisionAnalysis>,
    pub content_classification: Option<ContentClassification>,
    pub moments: Vec<KeyMoment>,
    pub editing_recommendations: Vec<EditingRecommendation>,
    pub quality_score: f64,
    pub processing_time_ms: u64,
}
```

### Scene Analysis

```rust
pub struct SceneAnalysis {
    pub id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub duration: f64,
    pub scene_type: SceneType,
    pub confidence: f64,
    pub visual: Option<VisualCharacteristics>,
    pub audio: Option<AudioCharacteristics>,
    pub persons: Vec<PersonDetection>,
    pub objects: Vec<ObjectDetection>,
    pub text_regions: Vec<TextRegion>,
    pub composition: Option<CompositionScore>,
    pub mood: Option<MoodAnalysis>,
    pub quality: f64,
}
```

## API Commands / Tauri Команды

### 1. AI Director Commands

**Файл:** `commands/ai_director_commands.rs`

#### Comprehensive Analysis / Полный анализ

```rust
// Главная команда для анализа видео
ai_director_analyze_comprehensive(
  video_path: String,
  config: Option<AIDirectorConfig>
) -> Result<ComprehensiveAnalysisResult, String>
```

**Frontend пример:**
```typescript
import { invoke } from "@tauri-apps/api/core"

const result = await invoke("ai_director_analyze_comprehensive", {
  videoPath: "/path/to/video.mp4",
  config: {
    performanceMode: "balanced",
    enableSceneDetection: true,
    enableVisionAnalysis: true,
    enableAudioAnalysis: true,
  }
})
```

#### Quick Analysis / Быстрый анализ

```rust
// Быстрый анализ без тяжелых операций
ai_director_analyze_quick(
  video_path: String
) -> Result<ComprehensiveAnalysisResult, String>
```

#### Batch Analysis / Пакетный анализ

```rust
// Анализ нескольких файлов
ai_director_analyze_batch(
  file_paths: Vec<String>,
  config: Option<AIDirectorConfig>
) -> Result<Vec<ComprehensiveAnalysisResult>, String>
```

#### System Capabilities / Возможности системы

```rust
// Получить доступные возможности AI Director
ai_director_get_capabilities() -> Result<SystemCapabilities, String>

// Структура возможностей
pub struct SystemCapabilities {
  pub audio_analysis: bool,        // FFmpeg available
  pub scene_detection: bool,       // Scene engine ready
  pub vision_analysis: bool,       // Vision models loaded
  pub face_recognition: bool,      // Face detection available
  pub object_detection: bool,      // YOLO available
  pub moment_detection: bool,      // Moment analyzer ready
  pub content_classification: bool,
  pub transcription: bool,         // Whisper available
  pub gpu_acceleration: bool,      // GPU support
}
```

#### Configuration Helpers / Конфигурация

```rust
// Получить конфигурацию по умолчанию
ai_director_get_default_config(
  mode: String  // "fast" | "balanced" | "quality"
) -> Result<AIDirectorConfig, String>

// Валидация конфигурации
ai_director_validate_config(
  config: AIDirectorConfig
) -> Result<ConfigValidationResult, String>

// Health check системы
ai_director_health_check() -> Result<HealthCheckResult, String>
```

**Режимы конфигурации:**
- **fast** - Только audio analysis, ~30 секунд
- **balanced** - Audio + Scene + Vision, ~120 секунд
- **quality** - Все возможности включены, ~600 секунд

### 2. Scene Engine Commands

**Файл:** `commands/scene_commands.rs`

#### Scene Analysis / Анализ сцен

```rust
// Анализ сцен из UnifiedMediaFile
analyze_scenes_command(
  media: UnifiedMediaFile
) -> Result<Vec<SceneAnalysis>, String>

// Анализ сцен по пути к файлу
analyze_scenes_by_path_command(
  file_path: String
) -> Result<Vec<SceneAnalysis>, String>
```

**Frontend пример:**
```typescript
const scenes = await invoke("analyze_scenes_by_path_command", {
  filePath: "/path/to/video.mp4"
})

console.log(`Found ${scenes.length} scenes`)
scenes.forEach(scene => {
  console.log(`Scene ${scene.id}: ${scene.sceneType} (${scene.duration}s)`)
})
```

#### Transition Analysis / Анализ переходов

```rust
// Анализ переходов между сценами
analyze_scene_transitions_command(
  scenes: Vec<SceneAnalysis>
) -> Result<Vec<TransitionInfo>, String>
```

#### Scene Filtering / Фильтрация сцен

```rust
// Фильтрация сцен по параметрам
filter_scenes_command(
  scenes: Vec<SceneAnalysis>,
  query: SceneQueryParams
) -> Result<Vec<SceneAnalysis>, String>

// Параметры фильтрации
pub struct SceneQueryParams {
  pub scene_type: Option<String>,
  pub min_confidence: Option<f64>,
  pub min_duration: Option<f64>,
  pub max_duration: Option<f64>,
  pub has_persons: Option<bool>,
  pub has_objects: Option<bool>,
  pub min_motion: Option<f64>,
  pub max_motion: Option<f64>,
}
```

#### Scene Statistics / Статистика

```rust
// Получить статистику по сценам
get_scene_statistics_command(
  scenes: Vec<SceneAnalysis>
) -> Result<SceneStatistics, String>

pub struct SceneStatistics {
  pub total_scenes: usize,
  pub total_duration: f64,
  pub average_duration: f64,
  pub min_duration: f64,
  pub max_duration: f64,
  pub average_confidence: f64,
  pub scene_type_distribution: HashMap<String, usize>,
  pub scenes_with_persons: usize,
  pub scenes_with_objects: usize,
  pub average_motion: Option<f64>,
}
```

#### Quick Estimation / Быстрая оценка

```rust
// Оценка количества сцен без полного анализа
estimate_scene_count_command(
  file_path: String,
  min_duration: Option<f32>
) -> Result<usize, String>
```

#### Configuration / Конфигурация

```rust
// Настройка Scene Engine
configure_scene_engine(
  config: SceneAnalysisConfig
) -> Result<bool, String>

pub struct SceneAnalysisConfig {
  pub enable_ai_classification: bool,
  pub enable_visual_analysis: bool,
  pub enable_audio_analysis: bool,
  pub enable_transition_analysis: bool,
  pub min_scene_duration: Option<f32>,
  pub max_scene_duration: Option<f32>,
  pub scene_change_threshold: Option<f32>,
}
```

### 3. Vision Service Commands

**Файл:** `commands/vision_commands.rs`

#### Initialization / Инициализация

```rust
// Инициализация Vision Service
initialize_vision_service(
  config: Option<VisionConfigDto>
) -> Result<String, String>

// Конфигурация без реинициализации
configure_vision_service(
  config: VisionConfigDto
) -> Result<String, String>

pub struct VisionConfigDto {
  pub enable_object_detection: bool,
  pub enable_face_detection: bool,
  pub enable_face_embeddings: bool,
  pub enable_color_analysis: bool,
  pub yolo_model: String,           // "yolov8n" | "yolov8s" | "yolov8m" | "yolov8l" | "yolov8x"
  pub object_confidence: f32,
  pub retinaface_model: String,     // "mobilenet" | "resnet50" | "resnet50-enhanced"
  pub facenet_model: String,        // "facenet-128d" | "facenet-512d" | "arcface-512d"
}
```

#### Object Detection / Детекция объектов

```rust
// Детекция объектов через YOLO
detect_objects(
  image_path: String
) -> Result<Vec<ObjectDetection>, String>

// Batch детекция объектов
detect_objects_batch(
  image_paths: Vec<String>
) -> Result<Vec<Vec<ObjectDetection>>, String>
```

**Frontend пример:**
```typescript
const objects = await invoke("detect_objects", {
  imagePath: "/path/to/frame.jpg"
})

objects.forEach(obj => {
  console.log(`${obj.class}: ${obj.confidence} at (${obj.bbox.x}, ${obj.bbox.y})`)
})
```

#### Face Detection / Детекция лиц

```rust
// Детекция лиц через RetinaFace
detect_faces(
  image_path: String
) -> Result<Vec<FaceDetection>, String>

// Batch детекция лиц
detect_faces_batch(
  image_paths: Vec<String>
) -> Result<Vec<Vec<FaceDetection>>, String>

// Генерация face embeddings через FaceNet
generate_face_embeddings(
  image_path: String
) -> Result<Vec<FaceEmbedding>, String>
```

#### Color Analysis / Анализ цвета

```rust
// Анализ цветовой палитры
analyze_colors(
  image_path: String
) -> Result<ColorAnalysis, String>

pub struct ColorAnalysis {
  pub dominant_colors: Vec<RgbColor>,
  pub color_palette: Vec<RgbColor>,
  pub brightness: f32,
  pub saturation: f32,
  pub color_temperature: String,  // "warm" | "cool" | "neutral"
}
```

#### Comprehensive Image Analysis / Полный анализ

```rust
// Полный анализ изображения (объекты + лица + цвета)
analyze_image_comprehensive(
  image_path: String
) -> Result<ImageAnalysisResult, String>

pub struct ImageAnalysisResult {
  pub objects: Vec<ObjectDetection>,
  pub faces: Vec<FaceDetection>,
  pub colors: ColorAnalysis,
  pub embeddings: Vec<FaceEmbedding>,
}
```

### 4. Content Engine Commands

**Файл:** `commands/content_commands.rs`

#### Configuration / Конфигурация

```rust
// Настройка Content Engine
configure_content_engine(
  config: ContentConfigDto
) -> Result<String, String>

pub struct ContentConfigDto {
  pub enable_classification: bool,
  pub enable_composition: bool,
  pub enable_mood: bool,
  pub enable_quality: bool,
  pub confidence_threshold: f64,
}

// Установка весов композиции
set_composition_weights(
  weights: CompositionWeights
) -> Result<String, String>
```

#### Content Classification / Классификация контента

```rust
// Классификация контента из сцен
classify_content(
  scenes: Vec<SceneAnalysis>
) -> Result<ContentClassification, String>

pub struct ContentClassification {
  pub primary_category: String,  // "vlog", "tutorial", "entertainment", etc.
  pub genre: String,
  pub themes: Vec<String>,
  pub target_audience: String,
  pub content_rating: String,
  pub confidence: f64,
}
```

#### Composition Analysis / Анализ композиции

```rust
// Анализ визуальной композиции
analyze_composition(
  visual: VisualCharacteristics
) -> Result<CompositionScore, String>

// Анализ композиции для нескольких сцен
analyze_scenes_composition(
  scenes: Vec<SceneAnalysis>
) -> Result<Vec<CompositionScore>, String>

pub struct CompositionScore {
  pub overall: f64,
  pub balance: f64,
  pub rule_of_thirds: f64,
  pub symmetry: f64,
  pub depth: f64,
  pub leading_lines: f64,
  pub color_harmony: f64,
}
```

#### Mood Analysis / Анализ настроения

```rust
// Анализ настроения сцены
analyze_mood(
  scene: SceneAnalysis
) -> Result<MoodAnalysis, String>

// Batch анализ настроения
analyze_scenes_mood(
  scenes: Vec<SceneAnalysis>
) -> Result<Vec<MoodAnalysis>, String>

pub struct MoodAnalysis {
  pub primary_mood: String,    // "happy", "sad", "energetic", "calm", etc.
  pub secondary_moods: Vec<String>,
  pub energy_level: f64,       // 0.0 - 1.0
  pub valence: f64,            // Negative to Positive
  pub arousal: f64,            // Calm to Excited
  pub confidence: f64,
}
```

#### Quality Scoring / Оценка качества

```rust
// Оценка качества сцены
score_quality(
  scene: SceneAnalysis
) -> Result<QualityScore, String>

// Batch оценка качества
score_scenes_quality(
  scenes: Vec<SceneAnalysis>
) -> Result<Vec<QualityScore>, String>

pub struct QualityScore {
  pub overall: f64,
  pub technical: f64,          // Focus, exposure, noise
  pub aesthetic: f64,          // Composition, color
  pub content: f64,            // Subject interest, clarity
  pub production: f64,         // Professional look
}
```

### 5. Unified Audio Commands

**Файл:** `commands/unified_audio_commands.rs`

#### Comprehensive Audio Analysis / Полный аудио анализ

```rust
// Unified audio analysis с конфигурацией
analyze_audio_unified(
  file_path: String,
  config: Option<String>  // JSON-serialized UnifiedAudioConfig
) -> Result<String, String>  // Returns JSON

pub struct UnifiedAudioConfig {
  pub performance_mode: AudioPerformanceMode,
  pub enable_ffmpeg_analysis: bool,
  pub enable_montage_analysis: bool,
  pub enable_transcription: bool,
  pub enable_advanced_features: bool,
  pub sample_rate: Option<u32>,
  pub channels: Option<u16>,
}
```

**Frontend пример:**
```typescript
const config = {
  performanceMode: "balanced",
  enableFfmpegAnalysis: true,
  enableMontageAnalysis: true,
  enableTranscription: false,
}

const result = await invoke("analyze_audio_unified", {
  filePath: "/path/to/audio.mp3",
  config: JSON.stringify(config)
})

const analysis = JSON.parse(result)
console.log("Duration:", analysis.duration)
console.log("Loudness:", analysis.loudness)
```

#### Quick Audio Analysis / Быстрый анализ

```rust
// Базовые метрики без тяжелых операций
analyze_audio_quick(
  file_path: String
) -> Result<String, String>  // Returns JSON with basic metrics
```

#### Fallback Analysis / Анализ с fallback

```rust
// Анализ с fallback на доступные engines
analyze_audio_with_fallback(
  file_path: String,
  preferred_engines: Vec<String>  // ["ffmpeg", "montage", "whisper"]
) -> Result<String, String>
```

#### Batch Audio Analysis / Пакетный анализ

```rust
// Анализ нескольких аудио файлов
analyze_audio_batch(
  file_paths: Vec<String>,
  config: Option<String>
) -> Result<String, String>  // Returns JSON array
```

#### System Capabilities / Возможности системы

```rust
// Получить возможности audio analysis
get_audio_system_capabilities() -> Result<String, String>

// Получить рекомендуемую конфигурацию
get_recommended_audio_config(
  file_path: String,
  performance_mode: String  // "fast" | "balanced" | "quality"
) -> Result<String, String>
```

### 6. Project Management Commands

**Файл:** `mod.rs`

#### Project Lifecycle / Жизненный цикл проекта

```rust
// Создать analysis проект
create_analysis_project(
  project_config: String  // JSON config
) -> Result<String, String>

// Получить проект
get_analysis_project(
  project_id: String
) -> Result<String, String>

// Получить прогресс
get_analysis_project_progress(
  project_id: String
) -> Result<String, String>

// Обновить прогресс
update_analysis_progress(
  project_id: String,
  progress: f32
) -> Result<String, String>
```

#### Media Files / Медиа файлы

```rust
// Получить файлы проекта
get_analysis_project_media_files(
  project_id: String
) -> Result<String, String>
```

#### Results / Результаты

```rust
// Получить сцены проекта
get_project_scenes(
  project_id: String
) -> Result<String, String>

// Получить key moments
get_project_key_moments(
  project_id: String
) -> Result<String, String>
```

## Frontend Integration / Интеграция с фронтендом

### AI Chat Feature

**Frontend:** `src/features/ai-chat/`

Использует AI Director для анализа видео и генерации рекомендаций.

```typescript
import { invoke } from "@tauri-apps/api/core"

// Анализ видео для chat context
const analysis = await invoke("ai_director_analyze_comprehensive", {
  videoPath: currentVideo.path,
  config: {
    performanceMode: "balanced",
    enableSceneDetection: true,
    enableContentClassification: true,
    generateEditingRecommendations: true,
  }
})

// Использование результатов в AI chat
const recommendations = analysis.editingRecommendations
const sceneInfo = analysis.scenes.map(s => `${s.sceneType} (${s.duration}s)`)
```

### Recognition Feature

**Frontend:** `src/features/recognition/`

Использует Vision Service для object/face detection.

```typescript
// Детекция объектов на текущем frame
const objects = await invoke("detect_objects", {
  imagePath: currentFrame.path
})

// Детекция лиц
const faces = await invoke("detect_faces", {
  imagePath: currentFrame.path
})

// Полный анализ
const imageAnalysis = await invoke("analyze_image_comprehensive", {
  imagePath: currentFrame.path
})
```

### Smart Montage Planner

**Frontend:** `src/features/smart-montage-planner/`

Использует Scene Engine и Content Engine для создания монтажных планов.

```typescript
// Анализ сцен видео
const scenes = await invoke("analyze_scenes_by_path_command", {
  filePath: video.path
})

// Классификация контента
const classification = await invoke("classify_content", {
  scenes: scenes
})

// Анализ композиции
const compositionScores = await invoke("analyze_scenes_composition", {
  scenes: scenes
})

// Фильтрация лучших сцен
const bestScenes = await invoke("filter_scenes_command", {
  scenes: scenes,
  query: {
    minConfidence: 0.8,
    minDuration: 2.0,
    hasPersons: true,
  }
})
```

## Performance / Производительность

### Performance Modes / Режимы производительности

**Fast Mode** (~30 секунд):
- Только basic audio metrics
- Без scene detection
- Без vision analysis
- Подходит для быстрого preview

**Balanced Mode** (~120 секунд):
- Audio analysis
- Scene detection
- Basic vision analysis
- Moment detection
- Рекомендуется для production

**Quality Mode** (~600 секунд):
- Все возможности включены
- Emotion analysis
- Advanced composition
- MCP agents
- Для финальной обработки

### Optimization Tips / Оптимизация

1. **Используйте batch команды** для множественных файлов
2. **Проверяйте capabilities** перед анализом
3. **Кэшируйте результаты** анализа
4. **Используйте quick analysis** для preview
5. **Настраивайте confidence thresholds** для точности

### Capabilities Check / Проверка возможностей

```typescript
// Проверить что доступно перед анализом
const capabilities = await invoke("ai_director_get_capabilities")

if (!capabilities.visionAnalysis) {
  console.warn("Vision models not loaded, skipping object detection")
}

if (!capabilities.gpuAcceleration) {
  console.warn("GPU not available, processing will be slower")
}
```

## Best Practices / Лучшие практики

### 1. Всегда проверяйте capabilities

❌ **НЕ делайте так:**
```typescript
// Предполагаем что все модели загружены
const result = await invoke("ai_director_analyze_comprehensive", {
  videoPath: path,
  config: { enableVisionAnalysis: true }
})
```

✅ **Делайте так:**
```typescript
const capabilities = await invoke("ai_director_get_capabilities")

const config = {
  enableVisionAnalysis: capabilities.visionAnalysis,
  enableFaceDetection: capabilities.faceRecognition,
  enableObjectDetection: capabilities.objectDetection,
}

const result = await invoke("ai_director_analyze_comprehensive", {
  videoPath: path,
  config
})
```

### 2. Используйте подходящий режим

❌ **НЕ делайте так:**
```typescript
// Quality mode для preview
const config = await invoke("ai_director_get_default_config", {
  mode: "quality"  // Слишком медленно для preview!
})
```

✅ **Делайте так:**
```typescript
// Fast mode для preview, quality для финального экспорта
const mode = isPreview ? "fast" : "quality"
const config = await invoke("ai_director_get_default_config", { mode })
```

### 3. Обрабатывайте ошибки

❌ **НЕ делайте так:**
```typescript
const scenes = await invoke("analyze_scenes_by_path_command", {
  filePath: path
})
```

✅ **Делайте так:**
```typescript
try {
  const scenes = await invoke("analyze_scenes_by_path_command", {
    filePath: path
  })

  if (scenes.length === 0) {
    console.warn("No scenes detected, file may be too short or corrupted")
  }

} catch (error) {
  console.error("Scene analysis failed:", error)

  // Fallback to quick analysis
  const quickResult = await invoke("estimate_scene_count_command", {
    filePath: path,
    minDuration: 2.0
  })
}
```

### 4. Batch обработка для множественных файлов

❌ **НЕ делайте так:**
```typescript
for (const file of files) {
  const result = await invoke("analyze_audio_unified", {
    filePath: file.path
  })
  results.push(result)
}
```

✅ **Делайте так:**
```typescript
const results = await invoke("analyze_audio_batch", {
  filePaths: files.map(f => f.path),
  config: JSON.stringify(audioConfig)
})
```

## Testing / Тестирование

### Unit Tests

Тесты находятся в соответствующих файлах:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_ai_director_capabilities() {
        let state = AIDirectorState::new();
        let result = ai_director_get_capabilities(State::from(&state)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_scene_analysis() {
        let state = SceneEngineState::new();
        // Test scene analysis...
    }
}
```

### Integration Tests

E2E тесты на фронтенде проверяют интеграцию с Tauri commands:

```typescript
import { test, expect } from "@playwright/test"

test("AI Director analysis", async ({ page }) => {
  // Test comprehensive analysis workflow
  const result = await page.evaluate(async () => {
    return await window.__TAURI__.invoke("ai_director_analyze_quick", {
      videoPath: "/test/sample.mp4"
    })
  })

  expect(result.scenes.length).toBeGreaterThan(0)
  expect(result.qualityScore).toBeGreaterThan(0)
})
```

## Related Modules / Связанные модули

- **Frontend Features:**
  - `src/features/ai-chat/` - AI Assistant интеграция
  - `src/features/recognition/` - Object/face recognition UI
  - `src/features/smart-montage-planner/` - Montage planning

- **Backend Modules:**
  - `src-tauri/src/recognition/` - YOLO/RetinaFace models
  - `src-tauri/src/video_compiler/` - Video compilation
  - `src-tauri/src/state/` - State management

## Changelog / История изменений

### v3.0.0 (2024-11-18)
- ✅ Unified Audio Analyzer с FFmpeg + Montage + Whisper
- ✅ Scene Engine с AI classification
- ✅ Vision Service с YOLO и RetinaFace
- ✅ Content Engine с composition analysis

### v3.15.0 (2024-11-24)
- ✅ AI Director Dashboard
- ✅ Comprehensive analysis API
- ✅ Performance modes (fast/balanced/quality)
- ✅ Capabilities checking
- ✅ Health monitoring

## License / Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.
