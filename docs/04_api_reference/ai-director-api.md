# Документация API AI Director

**Версия**: 5.0-unified-rust
**Статус**: Готов к продакшену
**Последнее обновление**: 3 ноября 2025

## Обзор

Функциональность AI в Timeline Studio была перенесена в **унифицированный Rust бэкенд** (AI Director) с TypeScript привязками для интеграции с фронтендом.

**⚠️ УВЕДОМЛЕНИЕ О МИГРАЦИИ**: Старые AI сервисы на TypeScript (`domains/ai-services`) устарели. Используйте новый API AI Director.

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (TypeScript)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   React Hooks (use-ai-director.ts)                   │  │
│  │   - Полная типобезопасность через Specta привязки    │  │
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
│  │  │  1. Анализ аудио      (UnifiedAudioAnalyzer)   │  │  │
│  │  │  2. Детекция сцен     (SceneEngine)            │  │  │
│  │  │  3. Анализ видения    (VisionService)          │  │  │
│  │  │  4. Детекция моментов (MomentEngine)           │  │  │
│  │  │  5. Анализ контента   (ContentEngine)          │  │  │
│  │  │  6. Интеграция и инсайты                        │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Быстрый старт

### Backend (Rust)

```rust
use crate::analysis::services::ai_director::{AIDirector, AIDirectorConfig};

// Создание экземпляра AI Director
let director = AIDirector::new();

// Получение конфигурации по умолчанию для сбалансированного режима
let config = AIDirectorConfig::balanced();

// Запуск комплексного анализа
let result = director
    .analyze_media_comprehensive(&video_path, Some(config))
    .await?;

println!("Анализ завершен! Найдено {} сцен", result.scene_analysis.total_scenes);
```

### Frontend (TypeScript/React)

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('AiDirectorApi')

import { useAIDirector } from "@/features/ai-director"

function VideoAnalyzer() {
  const {
    state,
    analyzeComprehensive,
    getDefaultConfig
  } = useAIDirector()

  const handleAnalyze = async (videoPath: string) => {
    // Получение сбалансированной конфигурации
    const config = await getDefaultConfig("balanced")

    // Запуск анализа
    const result = await analyzeComprehensive(videoPath, config)

    logger.infoSync("Анализ завершен:", result)
  }

  return (
    <div>
      <button onClick={() => handleAnalyze("/path/to/video.mp4")}>
        Анализировать видео
      </button>

      {state.isAnalyzing && (
        <p>Прогресс: {state.analysisProgress}%</p>
      )}

      {state.currentResult && (
        <pre>{JSON.stringify(state.currentResult, null, 2)}</pre>
      )}
    </div>
  )
}
```

---

## Справочник по API

### Tauri команды (7)

Все команды доступны через TypeScript привязки:

#### 1. `ai_director_analyze_comprehensive`

**Полный комплексный анализ со всеми движками.**

```typescript
import { commands } from "@/types/generated/tauri-bindings"

const result = await commands.aiDirectorAnalyzeComprehensive(
  "/path/to/video.mp4",
  {
    performance_mode: "Balanced",
    enable_audio_analysis: true,
    enable_scene_detection: true,
    enable_vision_analysis: true,
    enable_moment_detection: true,
    enable_content_classification: true,
    // ... другие параметры конфигурации
  }
)
```

**Возвращает**: `ComprehensiveAnalysisResult`
- `analysis_status`: "Completed" | "PartiallyCompleted" | "Failed"
- `scene_analysis`: Результаты детекции сцен
- `vision_analysis`: Результаты детекции объектов/лиц
- `moment_analysis`: Ключевые моменты
- `audio_analysis`: Метрики аудио
- `content_analysis`: Классификация контента, настроение, качество
- `performance`: Метрики производительности
- `errors`: Массив сообщений об ошибках

---

#### 2. `ai_director_analyze_quick`

**Быстрый анализ (только аудио, ~30 секунд).**

```typescript
const result = await commands.aiDirectorAnalyzeQuick("/path/to/video.mp4")
```

Эквивалентно `analyze_comprehensive` с предустановленным режимом `Fast`.

---

#### 3. `ai_director_analyze_batch`

**Пакетный анализ нескольких файлов.**

```typescript
const results = await commands.aiDirectorAnalyzeBatch(
  ["/video1.mp4", "/video2.mp4", "/video3.mp4"],
  config // опционально
)

// Возвращает массив ComprehensiveAnalysisResult
```

---

#### 4. `ai_director_get_default_config`

**Получение предустановленной конфигурации.**

```typescript
const fastConfig = await commands.aiDirectorGetDefaultConfig("fast")
const balancedConfig = await commands.aiDirectorGetDefaultConfig("balanced")
const qualityConfig = await commands.aiDirectorGetDefaultConfig("quality")
```

**Режимы**:
- `"fast"`: Только аудио (~30с)
- `"balanced"`: Аудио + Сцены + Видение + Моменты (~2мин)
- `"quality"`: Все движки (~10мин)
- `"custom"`: По умолчанию со всеми включенными движками

---

#### 5. `ai_director_validate_config`

**Валидация конфигурации перед анализом.**

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('AiDirectorApi')

const validation = await commands.aiDirectorValidateConfig(config)

if (!validation.is_valid) {
  logger.errorSync("Ошибки конфигурации:", validation.errors)
  logger.warnSync("Предупреждения конфигурации:", validation.warnings)
} else {
  logger.infoSync("Ориентировочное время:", validation.estimated_time, "мс")
  logger.infoSync("Ориентировочная память:", validation.estimated_memory, "байт")
}
```

---

#### 6. `ai_director_get_capabilities`

**Проверка возможностей системы.**

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('AiDirectorApi')

const capabilities = await commands.aiDirectorGetCapabilities()

logger.infoSync("Анализ аудио:", capabilities.audio_analysis)
logger.infoSync("Детекция сцен:", capabilities.scene_detection)
logger.infoSync("GPU ускорение:", capabilities.gpu_acceleration)
```

---

#### 7. `ai_director_health_check`

**Проверка здоровья всех движков.**

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('AiDirectorApi')

const health = await commands.aiDirectorHealthCheck()

logger.infoSync("Общий статус:", health.overall_status) // "healthy" | "warning" | "error"
logger.infoSync("Сервисы:", health.services)
```

---

## React хуки

### `useAIDirector()`

**Основной хук для интеграции с AI Director.**

```typescript
import { useAIDirector } from "@/features/ai-director"

const {
  // Состояние
  state: {
    isAnalyzing: boolean,
    analysisProgress: number,
    currentResult: ComprehensiveAnalysisResult | null,
    error: string | null,
    lastAnalyzedPath: string | null
  },

  // Методы анализа
  analyzeComprehensive: (path: string, config?: AIDirectorConfig) => Promise<Result>,
  analyzeQuick: (path: string) => Promise<Result>,
  analyzeBatch: (paths: string[], config?) => Promise<Result[]>,

  // Конфигурация
  getDefaultConfig: (mode: "fast" | "balanced" | "quality") => Promise<Config>,
  validateConfig: (config: Config) => Promise<ValidationResult>,

  // Система
  getCapabilities: () => Promise<Capabilities>,
  healthCheck: () => Promise<Health>,

  // Управление состоянием
  clearAnalysis: () => void
} = useAIDirector()
```

---

## Конфигурация

### AIDirectorConfig

```typescript
interface AIDirectorConfig {
  // Режим производительности
  performance_mode: "Fast" | "Balanced" | "Quality"

  // Переключатели движков
  enable_audio_analysis: boolean
  enable_scene_detection: boolean
  enable_vision_analysis: boolean
  enable_face_detection: boolean
  enable_object_detection: boolean
  enable_moment_detection: boolean
  enable_content_classification: boolean
  enable_composition_analysis: boolean
  enable_mood_analysis: boolean
  enable_quality_analysis: boolean
  enable_emotion_analysis: boolean

  // Ограничения
  max_processing_time?: number // миллисекунды
  quality_threshold: number // 0.0 - 1.0
  max_key_moments?: number

  // Функции
  enable_caching: boolean
  generate_editing_recommendations: boolean
  enable_mcp_agents: boolean
}
```

### Предустановленные режимы

| Режим | Время | Движки | Применение |
|------|------|---------|----------|
| **Fast** | ~30с | Только аудио | Быстрый просмотр |
| **Balanced** | ~2мин | Аудио + Сцены + Видение + Моменты + Контент | Обычный рабочий процесс |
| **Quality** | ~10мин | Все движки | Финальный экспорт |

---

## Типы результатов

### ComprehensiveAnalysisResult

```typescript
interface ComprehensiveAnalysisResult {
  file_path: string
  duration: number
  analysis_status: "Completed" | "PartiallyCompleted" | "Failed"

  // Результаты движков
  scene_analysis?: SceneAnalysisResult
  vision_analysis?: VisionAnalysisResult
  moment_analysis?: MomentAnalysisResult
  audio_analysis?: AudioAnalysisResult
  content_analysis?: ContentAnalysisResult

  // Метаданные
  performance?: PerformanceMetrics
  errors: string[]
  success_rate: number
}
```

### SceneAnalysisResult

```typescript
interface SceneAnalysisResult {
  scenes: SceneAnalysis[]
  total_scenes: number
  avg_scene_duration: number
  scene_types_distribution: Record<string, number>
}

interface SceneAnalysis {
  id: string
  file_id: string
  start_time: number
  end_time: number
  duration: number
  scene_type: "Intro" | "Action" | "Dialog" | "Transition" | "Ending"
  confidence: number
  key_frames: number[]
  description?: string
  visual?: VisualCharacteristics
  audio?: AudioCharacteristics
  objects: string[]
  persons: string[]
  transition?: SceneTransition
}
```

---

## Руководство по миграции

### С старых TypeScript сервисов

**Раньше (Устарело):**
```typescript
// ❌ Старый подход
import { SceneAnalysisEngine } from "@/domains/ai-services/services/engines/scene-analysis"
import { AIIntelligenceOrchestrator } from "@/domains/ai-services/services"

const engine = SceneAnalysisEngine.getInstance()
const result = await engine.analyzeScenes(mediaFile, options)
```

**Теперь (Новый Rust бэкенд):**
```typescript
// ✅ Новый подход
import { useAIDirector } from "@/features/ai-director"

const { analyzeComprehensive } = useAIDirector()
const result = await analyzeComprehensive(videoPath)
```

### Чеклист миграции

- [ ] Заменить `SceneAnalysisEngine` → `useAIDirector().analyzeComprehensive()`
- [ ] Заменить `ContentClassificationEngine` → Анализ контента AI Director
- [ ] Заменить `MomentDetector` → Анализ моментов AI Director
- [ ] Обновить импорты типов из `@/types/generated/tauri-bindings`
- [ ] Удалить старые импорты сервисов из `@/domains/ai-services`
- [ ] Обновить тесты для мокирования Tauri команд

---

## Лучшие практики

### 1. Используйте React хуки

Всегда используйте хук `useAIDirector` для консистентности:

```typescript
// ✅ Правильно
const { analyzeComprehensive } = useAIDirector()

// ❌ Избегайте прямых вызовов Tauri команд
import { commands } from "@/types/generated/tauri-bindings"
```

### 2. Обрабатывайте ошибки

AI Director использует graceful degradation (корректную деградацию):

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('AiDirectorApi')

const result = await analyzeComprehensive(videoPath)

if (result.analysis_status === "PartiallyCompleted") {
  logger.warnSync("Некоторые движки завершились с ошибкой:", result.errors)
  // Все еще доступны частичные результаты
}

if (result.success_rate < 0.5) {
  logger.errorSync("Более 50% движков завершились с ошибкой")
}
```

### 3. Используйте подходящий режим

Выбирайте правильный режим для вашего случая использования:

```typescript
// Быстрый просмотр
const fastResult = await analyzeQuick(videoPath)

// Обычное редактирование
const config = await getDefaultConfig("balanced")
const result = await analyzeComprehensive(videoPath, config)

// Финальный экспорт
const qualityConfig = await getDefaultConfig("quality")
const finalResult = await analyzeComprehensive(videoPath, qualityConfig)
```

### 4. Пакетная обработка

Для нескольких файлов используйте пакетный анализ:

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('AiDirectorApi')

const results = await analyzeBatch([
  "/video1.mp4",
  "/video2.mp4",
  "/video3.mp4"
], config)

// Обработка каждого результата
results.forEach((result, index) => {
  logger.infoSync(`Видео ${index + 1}: ${result.analysis_status}`)
})
```

---

## Производительность

### Бенчмарки времени

| Режим | Длина видео | Время обработки | Движки |
|------|--------------|-----------------|---------|
| Fast | 5 мин | ~30с | Только аудио |
| Balanced | 5 мин | ~2мин | 5 движков |
| Quality | 5 мин | ~10мин | Все движки |

### Советы по оптимизации

1. **Используйте кэширование**: Включите `enable_caching: true` в конфигурации
2. **Прогрессивное улучшение**: Начните с Fast, переходите к Balanced/Quality по необходимости
3. **Пакетная обработка**: Анализируйте несколько файлов параллельно
4. **Подходящие пороги**: Настройте `quality_threshold` в зависимости от потребностей

---

## Устранение неполадок

### Распространенные проблемы

**Проблема**: `ComprehensiveAnalysisResult` имеет статус `PartiallyCompleted`

**Решение**: Проверьте массив `errors` на конкретные сбои движков. Частичные результаты все еще пригодны для использования.

---

**Проблема**: Анализ занимает слишком много времени

**Решение**: Используйте режим `Fast` или установите ограничение `max_processing_time`:
```typescript
const config = {
  ...balancedConfig,
  max_processing_time: 120000 // 2 минуты
}
```

---

**Проблема**: Ошибки типов TypeScript

**Решение**: Перегенерируйте привязки:
```bash
cd src-tauri && cargo run --bin export_types
```

---

## Дополнительное чтение

- **Руководство по миграции**: `/docs/ru/05_development/ai-director-unified-migration-guide.md`
- **Архитектура**: `/docs/ru/03_architecture/ai-director-architecture.md`
- **Примеры использования**: `/docs/ru/09_examples/ai-director-usage.md`
- **Legacy API**: `/docs/99_archive/ai-domains-api-legacy.md`

---

**Версия**: 5.0-unified-rust
**Последнее обновление**: 3 ноября 2025
**Статус**: Готов к продакшену
