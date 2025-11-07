# AI Director Architecture

**Версия**: 4.0-unified-engines
**Статус**: Production Ready
**Дата**: 2 ноября 2025

## Обзор

AI Director - это центральный оркестратор всех анализов в Timeline Studio, объединяющий audio, video, scene, moment и content analysis в единый унифицированный workflow.

## Архитектурная диаграмма

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   AI Director Client (TypeScript)                    │  │
│  │   - invoke('ai_director_analyze_comprehensive')      │  │
│  │   - Type-safe через Specta bindings                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                         Tauri IPC
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Rust)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AI Director Service                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  analyze_media_comprehensive()                  │  │  │
│  │  │                                                  │  │  │
│  │  │  1. Audio Analysis    ──────────────┐          │  │  │
│  │  │  2. Scene Detection   ──────────────┤          │  │  │
│  │  │  3. Vision Analysis   ──────────────┤          │  │  │
│  │  │  4. Moment Detection  ──────────────┤          │  │  │
│  │  │  5. Content Analysis  ──────────────┤          │  │  │
│  │  │  6. Integration & Insights ◄────────┘          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                               │
│              ┌───────────────┼───────────────┐              │
│              ▼               ▼               ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │UnifiedAudio │  │SceneEngine  │  │MomentEngine │         │
│  │Analyzer     │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│              ▼                               ▼               │
│  ┌─────────────┐                  ┌─────────────┐         │
│  │VisionService│                  │ContentEngine│         │
│  │             │                  │             │         │
│  └─────────────┘                  └─────────────┘         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Unified Type System (unified_types.rs)      │  │
│  │  SceneAnalysis │ KeyMoment │ VisualCharacteristics   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Компоненты

### 1. AI Director Core

**Файл**: `src-tauri/src/analysis/services/ai_director.rs`

**Ответственность**:
- Оркестрация всех analysis engines
- Управление конфигурацией
- Агрегация результатов
- Генерация insights

**Структура**:
```rust
pub struct AIDirector {
    unified_audio_analyzer: Arc<UnifiedAudioAnalyzer>,
    scene_engine: Arc<RwLock<SceneEngine>>,
    moment_engine: Arc<RwLock<MomentEngine>>,
    content_engine: Arc<RwLock<ContentEngine>>,
    default_config: AIDirectorConfig,
}
```

**Ключевые методы**:
- `analyze_media_comprehensive()` - полный анализ
- `analyze_media_quick()` - быстрый анализ
- `get_system_capabilities()` - проверка возможностей

### 2. Analysis Engines

#### 2.1 Scene Engine

**Файл**: `src-tauri/src/analysis/engines/scene_engine.rs`

**Функции**:
- Детекция boundaries сцен
- Классификация типов (Intro, Action, Dialog, Transition, Ending)
- Анализ переходов между сценами
- Статистика

**Конфигурация**:
```rust
pub struct SceneEngineConfig {
    pub min_scene_duration: f64,        // 2.0 sec
    pub transition_threshold: f64,       // 0.3
    pub similarity_threshold: f64,       // 0.7
    pub enable_audio_features: bool,     // true
}
```

#### 2.2 Moment Engine

**Файл**: `src-tauri/src/analysis/engines/moment_engine.rs`

**Функции**:
- Детекция key moments
- Importance scoring (visual + audio + emotional)
- Типизация моментов (ActionClimax, DialogueHighlight, EmotionalPeak)

**Scoring система**:
```rust
pub struct MomentScoring {
    pub overall_score: f64,
    pub visual_score: f64,
    pub audio_score: f64,
    pub emotional_score: f64,
    pub positional_score: f64,
}
```

#### 2.3 Content Engine

**Файл**: `src-tauri/src/analysis/engines/content_engine.rs`

**Функции**:
- Content classification (категории, жанры, темы)
- Composition analysis (rule of thirds, balance, focus, symmetry)
- Mood analysis (настроение, energy level, emotional intensity)
- Quality scoring (overall, visual, audio, composition)

**Composition weights**:
```rust
pub struct CompositionWeights {
    pub rule_of_thirds: f64,  // 0.3
    pub balance: f64,          // 0.25
    pub focus_clarity: f64,    // 0.25
    pub symmetry: f64,         // 0.2
}
```

#### 2.4 Vision Service

**Файл**: `src-tauri/src/analysis/services/vision_service.rs`

**Функции**:
- Frame analysis
- Object detection (YOLO)
- Face detection (RetinaFace)
- Visual features extraction

#### 2.5 Unified Audio Analyzer

**Файл**: `src-tauri/src/analysis/services/unified_audio_analyzer.rs`

**Функции**:
- FFmpeg-based analysis
- Montage-ready analysis
- Transcription (Whisper)
- Audio quality metrics

### 3. Unified Type System

**Файл**: `src-tauri/src/analysis/types/unified_types.rs`

**Основные типы**:

```rust
// Scene representation
pub struct SceneAnalysis {
    pub id: String,
    pub file_id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub duration: f64,
    pub scene_type: SceneType,
    pub confidence: f64,
    pub key_frames: Vec<f64>,
    pub description: Option<String>,
    pub visual: Option<VisualCharacteristics>,
    pub audio: Option<AudioCharacteristics>,
    pub objects: Vec<String>,
    pub persons: Vec<String>,
    pub transition: Option<SceneTransition>,
}

// Key moment
pub struct KeyMoment {
    pub id: String,
    pub scene_id: String,
    pub file_id: String,
    pub timestamp: f64,
    pub duration: f64,
    pub moment_type: MomentType,
    pub importance_score: f64,
    pub scoring: MomentScoring,
    pub description: Option<String>,
    pub tags: Vec<String>,
}

// Visual characteristics
pub struct VisualCharacteristics {
    pub dominant_colors: Vec<String>,  // Hex colors
    pub brightness: f64,
    pub contrast: f64,
    pub saturation: f64,
    pub motion_level: f64,
    pub composition_score: f64,
    pub sharpness: f64,
    pub noise_level: f64,
}

// Audio characteristics
pub struct AudioCharacteristics {
    pub has_speech: bool,
    pub has_music: bool,
    pub volume_level: f64,
    pub clarity: f64,
    pub dominant_frequencies: Vec<f64>,
}
```

**Type synchronization (via tauri-specta)**:
- Все типы имеют `#[derive(specta::Type)]` для auto-generation
- TypeScript bindings генерируются в `src/types/generated/tauri-bindings.ts`
- Полная type safety между frontend и backend
- Single source of truth в Rust - никаких дублирующих TypeScript типов

**Генерация типов**:
```bash
# Регенерировать TypeScript bindings
cd src-tauri
cargo run --bin export_types

# Bindings обновляются в src/types/generated/tauri-bindings.ts
```

**Использование в TypeScript**:
```typescript
// Автоматически сгенерированные типы
import type {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  SceneAnalysis,
  KeyMoment,
  AnalysisStatus
} from "@/types/generated/tauri-bindings"

// TypeScript знает все поля благодаря specta
function processAnalysis(result: ComprehensiveAnalysisResult) {
  console.log(result.scenes.length) // Full type safety
}
```

### 4. Tauri Commands API

**Файл**: `src-tauri/src/analysis/commands/ai_director_commands.rs`

**Commands** (7):

```rust
// Primary analysis
ai_director_analyze_comprehensive(path, config?) -> ComprehensiveAnalysisResult
ai_director_analyze_quick(path) -> ComprehensiveAnalysisResult
ai_director_analyze_batch(paths[], config?) -> ComprehensiveAnalysisResult[]

// Configuration
ai_director_get_default_config(mode) -> AIDirectorConfig
ai_director_validate_config(config) -> ConfigValidationResult

// System
ai_director_get_capabilities() -> SystemCapabilities
ai_director_health_check() -> HealthCheckResult
```

## Data Flow

### Comprehensive Analysis Flow

```
1. Frontend Request
   ↓
   invoke('ai_director_analyze_comprehensive', { videoPath, config })
   ↓
2. AI Director Initialization
   ↓
   - Validate config
   - Initialize engines
   - Start performance tracking
   ↓
3. Parallel Engine Execution
   ↓
   ┌─────────────────────────────────────┐
   │ Audio Analysis (UnifiedAudioAnalyzer)│
   │ - FFmpeg metrics                     │
   │ - Montage segments                   │
   │ - Transcription (if enabled)         │
   └─────────────────────────────────────┘
   ↓
   ┌─────────────────────────────────────┐
   │ Scene Detection (SceneEngine)        │
   │ - Detect scene boundaries            │
   │ - Classify scene types               │
   │ - Analyze transitions                │
   └─────────────────────────────────────┘
   ↓ (scenes)
   ┌─────────────────────────────────────┐
   │ Vision Analysis (aggregate)          │
   │ - Extract objects from scenes        │
   │ - Count faces                        │
   │ - Calculate avg composition          │
   └─────────────────────────────────────┘
   ↓ (scenes)
   ┌─────────────────────────────────────┐
   │ Moment Detection (MomentEngine)      │
   │ - Identify key moments               │
   │ - Score importance                   │
   │ - Apply limits                       │
   └─────────────────────────────────────┘
   ↓ (scenes)
   ┌─────────────────────────────────────┐
   │ Content Analysis (ContentEngine)     │
   │ - Classify content                   │
   │ - Analyze composition                │
   │ - Determine mood                     │
   │ - Score quality                      │
   └─────────────────────────────────────┘
   ↓
4. Integration & Insights
   ↓
   - Combine all results
   - Generate unified insights
   - Create recommendations
   - Calculate performance metrics
   ↓
5. Return ComprehensiveAnalysisResult
   ↓
6. Frontend Processing
```

## Configuration System

### AIDirectorConfig

```rust
pub struct AIDirectorConfig {
    // Performance mode
    pub performance_mode: AudioPerformanceMode,

    // Engine toggles
    pub enable_audio_analysis: bool,
    pub enable_scene_detection: bool,
    pub enable_vision_analysis: bool,
    pub enable_face_detection: bool,
    pub enable_object_detection: bool,
    pub enable_moment_detection: bool,
    pub enable_content_classification: bool,
    pub enable_composition_analysis: bool,
    pub enable_mood_analysis: bool,
    pub enable_quality_analysis: bool,
    pub enable_emotion_analysis: bool,

    // Limits
    pub max_processing_time: Option<u64>,
    pub quality_threshold: f64,
    pub max_key_moments: Option<u32>,

    // Features
    pub enable_caching: bool,
    pub generate_editing_recommendations: bool,
    pub enable_mcp_agents: bool,
}
```

### Preset Modes

| Mode | Speed | Engines Enabled | Use Case |
|------|-------|----------------|----------|
| **Fast** | ~30s | Audio only | Quick preview, UI responsiveness |
| **Balanced** | ~2min | Audio + Scene + Vision + Moment + Content (no mood) | Normal editing workflow |
| **Quality** | ~10min | All engines | Final export, detailed analysis |

## Performance Considerations

### Optimization Strategies

1. **Parallel Execution**
   - Audio analysis runs independently
   - Scene detection feeds into other engines
   - Vision/Moment/Content run in parallel after scenes

2. **Caching**
   - Scene detection results cached
   - Vision features cached per frame
   - Audio analysis cached per file

3. **Progressive Enhancement**
   - Fast mode for immediate feedback
   - Upgrade to balanced for editing
   - Quality mode for final touches

4. **Resource Management**
   - Arc<RwLock<>> for thread-safe sharing
   - Async/await for non-blocking operations
   - Memory limits via configuration

### Performance Metrics

```rust
pub struct PerformanceMetrics {
    pub total_processing_time: u64,
    pub audio_analysis_time: u64,
    pub scene_analysis_time: u64,
    pub vision_analysis_time: u64,
    pub moment_analysis_time: u64,
    pub content_analysis_time: u64,
    pub integration_time: u64,
    pub memory_used: u64,
    pub success_rate: f64,
}
```

## Error Handling

### Graceful Degradation

```rust
// Если один engine fails, остальные продолжают работу
pub enum AnalysisStatus {
    Pending,
    InProgress,
    Completed,         // Все engines успешны
    Failed,            // Все engines failed
    PartiallyCompleted // Некоторые engines успешны
}
```

### Error Reporting

```rust
pub struct ComprehensiveAnalysisResult {
    // ...
    pub errors: Vec<String>,  // Список ошибок от failed engines
    pub success_rate: f64,    // Процент успешных engines
}
```

## Security

### Path Validation

```rust
// Проверка существования файла
if !path.exists() {
    return Err("File not found");
}

// Проверка расширения
let allowed_extensions = ["mp4", "mov", "avi", "mkv"];
```

### Resource Limits

```rust
// Timeout protection
if let Some(max_time) = config.max_processing_time {
    // Set timeout for analysis
}

// Memory limits
if config.enable_caching && memory_used > threshold {
    // Clear cache
}
```

## Testing

### Unit Tests

- Scene Engine: 7 tests
- Moment Engine: 5 tests
- Content Engine: 5 tests
- AI Director: 3 tests
- Commands: 6 tests

**Total**: 35+ unit tests

### Integration Tests

Planned for Phase 2:
- End-to-end analysis workflow
- Multi-file batch processing
- Error recovery scenarios
- Performance benchmarks

## Future Enhancements

### Phase 2
- Real-time progress events
- Frontend integration hooks
- Dashboard components
- Result visualization

### Phase 3
- MCP Agents integration
- Cloud processing support
- Advanced ML models
- Collaborative analysis

## Dependencies

### Rust Crates
- `tauri` - Desktop framework
- `tokio` - Async runtime
- `serde` - Serialization
- `specta` - Type generation
- `anyhow` - Error handling
- `log` - Logging

### External Services
- FFmpeg - Audio/Video processing
- ONNX Runtime - ML inference
- Whisper - Transcription (optional)

## Monitoring

### Health Check

```rust
pub struct HealthCheckResult {
    pub overall_status: String,  // "healthy", "warning", "error"
    pub services: HashMap<String, String>,
    pub last_check: String,
}
```

### Capabilities

```rust
pub struct SystemCapabilities {
    pub audio_analysis: bool,
    pub video_analysis: bool,
    pub scene_detection: bool,
    pub vision_analysis: bool,
    pub face_recognition: bool,
    pub object_detection: bool,
    pub moment_detection: bool,
    pub content_classification: bool,
    pub transcription: bool,
    pub gpu_acceleration: bool,
}
```

## References

- **Migration Guide**: `/docs/ru/05_development/ai-director-migration-guide.md` - Complete type migration guide
- **API Documentation**: `/docs/ru/04_api_reference/ai-director-api.md`
- **Usage Examples**: `/docs/ru/09_examples/ai-director-usage.md` - Practical code examples
- **Tauri Specta**: https://github.com/specta-rs/tauri-specta - Type generation library

---

**Архитектура версия**: 4.1-tauri-bindings
**Последнее обновление**: 8 ноября 2025
**Статус**: Production Ready with Type Safety
