# AI Director: Unified Analysis Migration Guide

**Дата**: 2 ноября 2025
**Версия**: 4.0-unified-engines
**Автор**: Claude Code

## Обзор

Этот документ описывает полную миграцию системы анализа Timeline Studio с разрозненных фронтенд-сервисов на унифицированную backend архитектуру с использованием AI Director.

## Что изменилось

### Старая архитектура (до v4.0)

```
Frontend (TypeScript)
├── domains/ai-services/
│   ├── services/scene-analysis-engine.ts
│   ├── services/content-intelligence-service.ts
│   ├── services/content-pipeline/
│   └── services/engines/
│       ├── scene-analysis/
│       └── content-classification/
└── Прямые вызовы Tauri commands
```

**Проблемы:**
- Дублирование логики между frontend и backend
- Несогласованные типы
- Сложность поддержки
- Ограниченная производительность

### Новая архитектура (v4.0+)

```
Backend (Rust)
└── src-tauri/src/analysis/
    ├── types/unified_types.rs          # 🆕 Unified type system
    ├── engines/                         # 🆕 Analysis engines
    │   ├── scene_engine.rs              # Scene detection & analysis
    │   ├── moment_engine.rs             # Key moment detection
    │   └── content_engine.rs            # Content classification
    ├── services/
    │   ├── ai_director.rs               # 🔄 Orchestrator (updated)
    │   ├── unified_audio_analyzer.rs    # Audio analysis
    │   └── vision_service.rs            # 🆕 Vision analysis
    └── commands/
        ├── ai_director_commands.rs      # 🔄 AI Director API (updated)
        ├── scene_commands.rs            # 🆕 Scene API
        ├── vision_commands.rs           # 🆕 Vision API
        └── content_commands.rs          # 🆕 Content API

Frontend (TypeScript)
└── Единая точка входа через AI Director
```

**Преимущества:**
- Централизованная логика на backend
- Типобезопасность через Specta
- Лучшая производительность
- Простота использования

## Phase 1: Backend Migration (Завершена)

### Task 0: Unified Types

**Создан**: `src-tauri/src/analysis/types/unified_types.rs`

**Основные типы:**

```rust
// Основной тип сцены
pub struct SceneAnalysis {
    pub id: String,
    pub file_id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub duration: f64,
    pub scene_type: SceneType,
    pub confidence: f64,
    pub visual: Option<VisualCharacteristics>,
    pub audio: Option<AudioCharacteristics>,
    pub objects: Vec<String>,
    pub persons: Vec<String>,
}

// Ключевой момент
pub struct KeyMoment {
    pub id: String,
    pub scene_id: String,
    pub timestamp: f64,
    pub duration: f64,
    pub moment_type: MomentType,
    pub importance_score: f64,
    pub scoring: MomentScoring,
    pub description: Option<String>,
}

// Типы сцен
pub enum SceneType {
    Intro,
    Action,
    Dialog,
    Transition,
    Ending,
    Custom(String),
}

// Типы моментов
pub enum MomentType {
    ActionClimax,
    DialogueHighlight,
    EmotionalPeak,
    VisualHighlight,
    TransitionPoint,
    UserDefined(String),
}
```

### Task 1-2: Scene Engine

**Создан**: `src-tauri/src/analysis/engines/scene_engine.rs`

**Функциональность:**
- Детекция сцен из видео
- Классификация типов сцен
- Анализ переходов
- Статистика

**API** (7 команд):
```rust
configure_scene_engine(config)
detect_scenes(file_id, frames)
detect_scenes_from_video(video_path, config)
analyze_scene_transitions(scenes)
classify_scene_type(visual, audio)
get_scene_statistics(scenes)
merge_scenes(scenes, indices)
```

### Task 3-4: Vision Service

**Создан**: `src-tauri/src/analysis/services/vision_service.rs`

**Функциональность:**
- Анализ изображений
- Детекция объектов (YOLO)
- Детекция лиц (RetinaFace)
- Извлечение визуальных характеристик

**API** (8 команд):
```rust
configure_vision_service(config)
analyze_frame(image_data, options)
analyze_video_frames(video_path, frame_indices)
detect_objects_in_frame(image_data)
detect_faces_in_frame(image_data)
extract_visual_features(image_data)
batch_analyze_frames(frames_data)
get_vision_capabilities()
```

### Task 5: Moment Engine

**Обновлен**: `src-tauri/src/analysis/engines/moment_engine.rs`

**Функциональность:**
- Детекция ключевых моментов
- Scoring (визуальный, аудио, эмоциональный)
- Приоритизация моментов

**Унификация:**
- Объединил `moment_analyzer.rs` и `moment_detector.rs`
- Использует unified types
- Интегрирован с AI Director

### Task 6-7: Content Engine

**Создан**: `src-tauri/src/analysis/engines/content_engine.rs`

**Функциональность:**
- Классификация контента (категории, жанры, темы)
- Анализ композиции (rule of thirds, balance, focus)
- Анализ настроения (mood, energy level)
- Оценка качества (visual, audio, composition)

**API** (8 команд):
```rust
configure_content_engine(config)
set_composition_weights(weights)
classify_content(scenes)
analyze_composition(visual)
analyze_scenes_composition(scenes)
analyze_mood(scenes)
calculate_quality(scenes)
analyze_content_comprehensive(scenes)
```

### Task 8: AI Director Integration

**Обновлен**: `src-tauri/src/analysis/services/ai_director.rs`

**Новая структура:**

```rust
pub struct AIDirector {
    unified_audio_analyzer: Arc<UnifiedAudioAnalyzer>,
    scene_engine: Arc<RwLock<SceneEngine>>,
    moment_engine: Arc<RwLock<MomentEngine>>,
    content_engine: Arc<RwLock<ContentEngine>>,
}
```

**Основная функция:**

```rust
pub async fn analyze_media_comprehensive(
    &self,
    media_path: &Path,
    config: Option<AIDirectorConfig>,
) -> Result<ComprehensiveAnalysisResult>
```

**Процесс анализа:**

1. **Audio Analysis** (UnifiedAudioAnalyzer)
   - FFmpeg analysis
   - Montage analysis
   - Transcription (опционально)

2. **Scene Detection** (SceneEngine)
   - Детекция сцен
   - Классификация типов
   - Анализ переходов

3. **Vision Analysis** (агрегация из сцен)
   - Объекты
   - Лица
   - Композиция
   - Качество

4. **Moment Detection** (MomentEngine)
   - Ключевые моменты
   - Importance scoring
   - Типизация

5. **Content Analysis** (ContentEngine)
   - Классификация
   - Mood анализ
   - Quality scoring
   - Композиция

6. **Integration & Insights**
   - Объединение результатов
   - Генерация insights
   - Рекомендации для монтажа

**API** (7 команд):
```rust
ai_director_analyze_comprehensive(path, config)
ai_director_analyze_quick(path)
ai_director_analyze_batch(paths, config)
ai_director_get_capabilities()
ai_director_get_default_config(mode) // "fast", "balanced", "quality"
ai_director_validate_config(config)
ai_director_health_check()
```

### Task 9: Frontend Type Sync

**Обновлен**: `src-tauri/src/specta_export.rs`

**Экспортируемые типы:**
- `ComprehensiveAnalysisResult`
- `AIDirectorConfig`
- `SystemCapabilities`
- `SceneAnalysis`
- `KeyMoment`
- `VisualCharacteristics`
- `AudioCharacteristics`
- И все вложенные типы

**Команды для экспорта:**
- 7 AI Director команд
- 3 legacy Content Classification команды

## Результаты Phase 1

### Статистика

- **Файлов создано**: 8
- **Файлов обновлено**: 4
- **Строк кода**: ~8,600
- **Unit тестов**: 35+
- **Tauri команд**: 30
- **Движков**: 4 (Scene, Moment, Content, Vision)
- **Прогресс**: 100% Phase 1

### Архитектурные улучшения

1. **Унифицированная система типов**
   - Все типы определены в Rust
   - Автоматическая синхронизация с TypeScript через Specta
   - Полная типобезопасность

2. **Модульная архитектура движков**
   - Каждый движок независим
   - Builder pattern для конфигурации
   - Arc<RwLock<>> для thread-safety

3. **AI Director как оркестратор**
   - Единая точка входа
   - Управление всеми движками
   - Гибкая конфигурация

4. **Производительность**
   - Async/await throughout
   - Параллельная обработка
   - Метрики производительности

## Использование

### Быстрый анализ

```typescript
import { invoke } from '@tauri-apps/api/core';

// Быстрый анализ (только audio)
const result = await invoke('ai_director_analyze_quick', {
  videoPath: '/path/to/video.mp4'
});

console.log('Analysis completed:', result.status);
console.log('Audio analysis:', result.audio_analysis);
```

### Comprehensive анализ

```typescript
// Получить preset конфигурацию
const config = await invoke('ai_director_get_default_config', {
  mode: 'balanced' // 'fast', 'balanced', 'quality'
});

// Кастомизация
config.enable_mood_analysis = true;
config.max_key_moments = 100;

// Валидация
const validation = await invoke('ai_director_validate_config', { config });
if (!validation.isValid) {
  console.error('Config errors:', validation.errors);
  console.warn('Config warnings:', validation.warnings);
}

// Запуск анализа
const result = await invoke('ai_director_analyze_comprehensive', {
  videoPath: '/path/to/video.mp4',
  config
});

// Результаты
console.log('Status:', result.status);
console.log('Scenes:', result.scene_analysis);
console.log('Key moments:', result.moment_analysis);
console.log('Content:', result.content_analysis);
console.log('Insights:', result.combined_insights);
console.log('Recommendations:', result.editing_recommendations);
console.log('Performance:', result.performance_metrics);
```

### Пакетный анализ

```typescript
const results = await invoke('ai_director_analyze_batch', {
  filePaths: [
    '/path/to/video1.mp4',
    '/path/to/video2.mp4',
    '/path/to/video3.mp4'
  ],
  config: config // опционально
});

results.forEach((result, index) => {
  console.log(`File ${index + 1}:`, result.status);
});
```

### Health Check

```typescript
const health = await invoke('ai_director_health_check');

console.log('Overall status:', health.overallStatus); // "healthy", "warning", "error"
console.log('Services:', health.services);
// {
//   audio_analysis: "healthy",
//   scene_detection: "healthy",
//   moment_detection: "healthy",
//   content_classification: "healthy",
//   transcription: "unavailable",
//   gpu_acceleration: "available"
// }
```

### Проверка возможностей

```typescript
const capabilities = await invoke('ai_director_get_capabilities');

if (capabilities.audioAnalysis) {
  console.log('Audio analysis available');
}

if (capabilities.transcription) {
  console.log('Transcription available (Whisper)');
}

if (capabilities.gpuAcceleration) {
  console.log('GPU acceleration available');
}
```

## Конфигурация

### AIDirectorConfig

```rust
pub struct AIDirectorConfig {
    // Режим производительности
    pub performance_mode: AudioPerformanceMode, // Fast, Balanced, Quality

    // Включить/выключить движки
    pub enable_audio_analysis: bool,
    pub enable_scene_detection: bool,
    pub enable_vision_analysis: bool,
    pub enable_moment_detection: bool,
    pub enable_content_classification: bool,
    pub enable_composition_analysis: bool,
    pub enable_mood_analysis: bool,
    pub enable_quality_analysis: bool,

    // Детальные опции
    pub enable_face_detection: bool,
    pub enable_object_detection: bool,
    pub enable_emotion_analysis: bool,

    // Лимиты
    pub max_processing_time: Option<u64>, // секунды
    pub quality_threshold: f64,
    pub max_key_moments: Option<u32>,

    // Дополнительно
    pub enable_caching: bool,
    pub generate_editing_recommendations: bool,
    pub enable_mcp_agents: bool, // Будущая функциональность
}
```

### Preset режимы

#### Fast
```rust
AIDirectorConfig {
    performance_mode: Fast,
    enable_audio_analysis: true,
    enable_scene_detection: false,
    enable_vision_analysis: false,
    enable_moment_detection: false,
    enable_content_classification: false,
    max_processing_time: Some(30),
    // ... все остальные false
}
```

#### Balanced
```rust
AIDirectorConfig {
    performance_mode: Balanced,
    enable_audio_analysis: true,
    enable_scene_detection: true,
    enable_vision_analysis: true,
    enable_moment_detection: true,
    enable_content_classification: true,
    enable_quality_analysis: true,
    max_processing_time: Some(120),
    // ... mood_analysis: false
}
```

#### Quality
```rust
AIDirectorConfig {
    performance_mode: Quality,
    // Все включено
    max_processing_time: Some(600),
}
```

## Результаты анализа

### ComprehensiveAnalysisResult

```typescript
interface ComprehensiveAnalysisResult {
  analysis_id: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed' | 'PartiallyCompleted';

  // Результаты движков
  audio_analysis?: UnifiedAudioAnalysisResult;
  scene_analysis?: SceneAnalysisResult;
  vision_analysis?: VisionAnalysisResult;
  moment_analysis?: MomentAnalysisResult;
  content_analysis?: ContentAnalysisResult;

  // Объединенные insights
  combined_insights: AnalysisInsights;

  // Метаданные
  performance_metrics: PerformanceMetrics;
  editing_recommendations: EditingRecommendation[];
  errors: string[];
  metadata: AnalysisMetadata;
}
```

### AnalysisInsights

```typescript
interface AnalysisInsights {
  key_moments: KeyMomentInsight[];
  emotional_timeline: EmotionalSegment[];
  transitions: TransitionRecommendation[];
  overall_quality: number;
  main_subjects: string[];
  content_mood: string;
}
```

### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  total_processing_time: number; // ms
  audio_analysis_time: number;
  scene_analysis_time: number;
  vision_analysis_time: number;
  moment_analysis_time: number;
  content_analysis_time: number;
  integration_time: number;
  memory_used: number; // MB
  success_rate: number; // 0.0 - 1.0
}
```

## Migration Path (для существующего кода)

### Если вы использовали старый Content Intelligence

**Было:**
```typescript
import { ContentIntelligenceService } from '@/domains/ai-services';

const service = new ContentIntelligenceService();
const result = await service.analyzeContent(video);
```

**Стало:**
```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('ai_director_analyze_comprehensive', {
  videoPath: video.path,
  config: { enable_content_classification: true }
});

// Результат в result.content_analysis
```

### Если вы использовали Scene Analysis

**Было:**
```typescript
import { SceneAnalysisEngine } from '@/domains/ai-services';

const engine = new SceneAnalysisEngine();
const scenes = await engine.detectScenes(video);
```

**Стало:**
```typescript
const result = await invoke('ai_director_analyze_comprehensive', {
  videoPath: video.path,
  config: { enable_scene_detection: true }
});

// Сцены в result.scene_analysis.scenes
```

## Troubleshooting

### Проблема: Analysis fails with "FFmpeg not available"

**Решение:**
```typescript
const health = await invoke('ai_director_health_check');
if (health.services.audio_analysis !== 'healthy') {
  console.error('FFmpeg is not installed or not in PATH');
  // Показать пользователю инструкции по установке FFmpeg
}
```

### Проблема: Analysis timeout

**Решение:**
```typescript
const config = await invoke('ai_director_get_default_config', { mode: 'fast' });
config.max_processing_time = 600; // Увеличить до 10 минут

// Или использовать quick analysis
const result = await invoke('ai_director_analyze_quick', { videoPath });
```

### Проблема: Too many key moments

**Решение:**
```typescript
const config = await invoke('ai_director_get_default_config', { mode: 'balanced' });
config.max_key_moments = 20; // Ограничить
```

## Best Practices

1. **Всегда валидируйте конфигурацию**
   ```typescript
   const validation = await invoke('ai_director_validate_config', { config });
   if (!validation.isValid) {
     // Обработать ошибки
   }
   ```

2. **Используйте preset режимы**
   ```typescript
   // Для UI preview - fast
   // Для normal editing - balanced
   // Для final export - quality
   ```

3. **Проверяйте capabilities перед анализом**
   ```typescript
   const caps = await invoke('ai_director_get_capabilities');
   if (!caps.transcription && config.enable_transcription) {
     // Отключить transcription или показать warning
   }
   ```

4. **Обрабатывайте PartiallyCompleted статус**
   ```typescript
   if (result.status === 'PartiallyCompleted') {
     console.warn('Some engines failed:', result.errors);
     // Но используем успешные результаты
   }
   ```

5. **Используйте метрики для оптимизации**
   ```typescript
   console.log(`Analysis took ${result.performance_metrics.total_processing_time}ms`);
   if (result.performance_metrics.total_processing_time > 60000) {
     // Предложить пользователю использовать fast mode
   }
   ```

## Roadmap

### Phase 2: Frontend Integration (Planned)
- Обновить `use-analysis.ts` hooks
- Создать React компоненты для AI Director
- Dashboard для comprehensive results
- Real-time progress через events

### Phase 3: Advanced Features (Future)
- MCP Agents integration
- ML model updates
- Cloud processing
- Collaborative analysis

## Поддержка

- GitHub Issues: https://github.com/your-repo/timeline-studio/issues
- Документация: `/docs/ru/05_development/`
- Примеры: `/docs/ru/09_examples/ai-director-usage.md`

---

**Версия документа**: 1.0
**Дата обновления**: 2 ноября 2025
**Следующее обновление**: Phase 2 completion
