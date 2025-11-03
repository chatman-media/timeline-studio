# AI Director Dashboard Integration Guide

**Версия**: 1.0
**Статус**: In Progress
**Дата создания**: 3 ноября 2025

## Обзор

Данный документ описывает интеграцию нового **AI Director** бэкенда с существующим **Analysis Dashboard** UI.

---

## Текущее состояние

### ✅ Завершено

#### Backend (Rust)
- [x] AI Director сервис с 4 движками (8,600+ строк кода)
- [x] 30 Tauri команд для анализа
- [x] Unified Audio Analyzer
- [x] Scene Engine (детекция сцен)
- [x] Moment Engine (ключевые моменты)
- [x] Content Engine (классификация контента)
- [x] Vision Service (распознавание объектов/лиц)
- [x] Graceful degradation (частичные результаты при ошибках)
- [x] 35+ модульных тестов
- [x] TypeScript bindings через Specta

#### Frontend Hooks
- [x] `useAIDirector()` - основной хук для прямого вызова команд
- [x] `useAIDirectorAnalysis()` - хук с real-time событиями
- [x] `AIDirectorProgress` - компонент прогресса
- [x] TypeScript типы (76 KB автогенерируемых привязок)

#### Documentation
- [x] API документация (EN + RU, 1540+ строк)
- [x] Migration guide для старых TypeScript сервисов
- [x] Architecture documentation
- [x] Лучшие практики и troubleshooting

### 🚧 В процессе

#### Analysis Dashboard Integration
- [ ] Обновить `use-analysis.ts` для использования AI Director API
- [ ] Создать маппинг между старыми и новыми типами данных
- [ ] Добавить роутинг `/analysis` в приложение
- [ ] Интегрировать dashboard с main navigation

---

## Архитектурные различия

### Старая архитектура (Project-based)

**Файл**: `/src/features/analysis-dashboard/hooks/use-analysis.ts`

```typescript
// Project-centric API
const {
  createProject,
  startAnalysis,
  getProject,
  getProjectScenes,
  getProjectMoments
} = useAnalysis()

// Workflow
1. createProject(name, config, files) → project_id
2. startAnalysis(project_id)
3. Poll getProgress(project_id) каждые 2 секунды
4. После завершения: getProjectScenes(), getProjectMoments()
```

**Типы**:
- `AnalysisProject` - контейнер проекта
- `AnalysisConfig` - 20+ параметров конфигурации
- `AnalysisProgress` - статус проекта
- `AnalysisScene` - детализированная сцена (30+ полей)
- `KeyMoment` - ключевой момент (25+ полей)

**Tauri команды** (старые, НЕ реализованы):
```rust
"create_analysis_project"
"get_analysis_project"
"start_project_analysis"
"get_analysis_project_progress"
"get_project_scenes"
"get_project_key_moments"
"get_project_statistics"
"search_project_data"
```

---

### Новая архитектура (AI Director)

**Файлы**:
- `/src/features/ai-director/hooks/use-ai-director.ts` - прямые команды
- `/src/features/ai-director/hooks/use-ai-director-analysis.ts` - event-based

```typescript
// File-centric API с real-time событиями
const {
  analyzeComprehensive,
  analyzeQuick,
  analyzeBatch,
  state
} = useAIDirector()

// Workflow
1. analyzeComprehensive(videoPath, config) → ComprehensiveAnalysisResult
2. Real-time события через Tauri:
   - "analysis-started"
   - "analysis-progress" (автоматически)
   - "analysis-stage-completed"
   - "analysis-completed"
   - "analysis-error"
```

**Типы** (из TypeScript bindings):
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

**Tauri команды** (✅ реализованы в Rust):
```rust
"ai_director_analyze_comprehensive"   // Полный анализ
"ai_director_analyze_quick"           // Быстрый анализ (~30s)
"ai_director_analyze_batch"           // Пакетный анализ
"ai_director_get_default_config"      // Preset конфигурации
"ai_director_validate_config"         // Валидация
"ai_director_get_capabilities"        // Системные возможности
"ai_director_health_check"            // Проверка здоровья
```

---

## Стратегия интеграции

### Вариант 1: Адаптер (рекомендуется)

Создать адаптер, который преобразует AI Director API в project-based интерфейс.

**Преимущества**:
- Минимальные изменения в UI компонентах
- Обратная совместимость
- Постепенная миграция

**Файл**: `/src/features/analysis-dashboard/hooks/use-analysis-adapter.ts`

```typescript
/**
 * Адаптер между AI Director API и старым project-based интерфейсом
 */
export function useAnalysisAdapter(): UseAnalysisReturn {
  const { analyzeComprehensive, state } = useAIDirector()

  // Эмуляция project storage через localStorage/indexedDB
  const [projects, setProjects] = useState<AnalysisProject[]>([])

  const createProject = async (name, description, config, files) => {
    const projectId = crypto.randomUUID()
    const project: AnalysisProject = {
      id: projectId,
      name,
      description,
      status: AnalysisStatus.Created,
      config: mapConfigToAIDirector(config),
      files,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setProjects(prev => [...prev, project])
    return projectId
  }

  const startAnalysis = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return false

    // Анализ каждого файла через AI Director
    for (const file of project.files) {
      const result = await analyzeComprehensive(
        file.file_path,
        mapConfigToAIDirector(project.config)
      )

      // Сохранение результатов в project storage
      await saveAnalysisResults(projectId, file.id, result)
    }

    return true
  }

  const getProjectScenes = async (projectId: string) => {
    const results = await loadAnalysisResults(projectId)

    // Преобразование SceneAnalysisResult → AnalysisScene[]
    return results.flatMap(result =>
      mapScenesToDashboardFormat(result.scene_analysis)
    )
  }

  const getProjectMoments = async (projectId: string) => {
    const results = await loadAnalysisResults(projectId)

    // Преобразование MomentAnalysisResult → KeyMoment[]
    return results.flatMap(result =>
      mapMomentsToDashboardFormat(result.moment_analysis)
    )
  }

  // ... остальные методы

  return {
    dashboardData,
    loading: state.isAnalyzing,
    error: state.error,
    createProject,
    startAnalysis,
    getProjectScenes,
    getProjectMoments,
    // ... остальные методы
  }
}

// Helper functions
function mapConfigToAIDirector(config: AnalysisConfig): AIDirectorConfig {
  return {
    performance_mode: config.quality_mode === QualityMode.Fast ? "Fast"
                    : config.quality_mode === QualityMode.Detailed ? "Quality"
                    : "Balanced",
    enable_audio_analysis: config.enable_audio_analysis,
    enable_scene_detection: config.enable_scene_detection,
    enable_vision_analysis: config.enable_object_detection || config.enable_person_recognition,
    enable_face_detection: config.enable_person_recognition,
    enable_object_detection: config.enable_object_detection,
    enable_moment_detection: true, // Всегда включено
    enable_content_classification: true, // Всегда включено
    enable_emotion_analysis: config.enable_emotion_analysis,
    max_processing_time: config.max_processing_time,
    quality_threshold: 0.5,
    enable_caching: true,
    generate_editing_recommendations: true,
    enable_mcp_agents: false,
  }
}

function mapScenesToDashboardFormat(sceneResult?: SceneAnalysisResult): AnalysisScene[] {
  if (!sceneResult?.scenes) return []

  return sceneResult.scenes.map(scene => ({
    id: scene.id,
    project_id: scene.file_id, // Используем file_id как project_id
    file_id: scene.file_id,
    start_time: scene.start_time,
    end_time: scene.end_time,
    duration: scene.duration,
    scene_type: mapSceneType(scene.scene_type),
    confidence: scene.confidence,

    // Visual characteristics
    dominant_colors: scene.visual?.dominant_colors || [],
    brightness: scene.visual?.brightness || 0,
    contrast: scene.visual?.contrast || 0,
    saturation: scene.visual?.saturation || 0,
    motion_level: scene.visual?.motion_intensity || 0,
    composition_score: scene.visual?.composition_score || 0,
    rule_of_thirds_compliance: 0, // Нет в AI Director
    visual_balance: 0, // Нет в AI Director

    // Quality metrics
    quality_score: scene.visual?.quality_score || 0,
    sharpness: scene.visual?.sharpness || 0,
    noise_level: scene.visual?.noise_level || 0,
    stability: scene.visual?.stability || 0,

    // Objects & persons
    persons_present: scene.persons,
    objects_detected: scene.objects,
    has_text: false, // Нет в AI Director
    has_faces: scene.persons.length > 0,

    // Audio characteristics
    emotional_tone: mapEmotionalTone(scene.audio?.dominant_emotions),
    energy_level: scene.audio?.energy || 0,

    // Metadata
    auto_description: scene.description,
    tags: [...scene.objects, ...scene.persons],
    representative_frame: scene.key_frames[0] || 0,
    keyframes: scene.key_frames,
    created_at: new Date().toISOString(),
  }))
}

function mapMomentsToDashboardFormat(momentResult?: MomentAnalysisResult): KeyMoment[] {
  if (!momentResult?.moments) return []

  return momentResult.moments.map(moment => ({
    id: crypto.randomUUID(),
    project_id: moment.file_id,
    file_id: moment.file_id,
    scene_id: moment.scene_id,
    timestamp: moment.timestamp,
    duration: moment.duration,
    moment_type: mapMomentType(moment.moment_type),
    importance_score: moment.importance_score,

    scoring_factors: {
      emotion_intensity: moment.scoring_factors.emotion_intensity,
      emotion_variety: moment.scoring_factors.emotion_variety,
      emotional_change: moment.scoring_factors.emotional_change,
      visual_quality: moment.scoring_factors.visual_quality,
      composition_quality: moment.scoring_factors.composition_quality,
      color_vibrancy: moment.scoring_factors.color_vibrancy,
      motion_interest: moment.scoring_factors.motion_interest,
      audio_clarity: moment.scoring_factors.audio_clarity,
      audio_dynamics: moment.scoring_factors.audio_dynamics,
      speech_quality: moment.scoring_factors.speech_quality,
      music_sync: moment.scoring_factors.music_sync,
      person_prominence: moment.scoring_factors.person_prominence,
      object_interest: moment.scoring_factors.object_interest,
      scene_uniqueness: moment.scoring_factors.scene_uniqueness,
      narrative_importance: moment.scoring_factors.narrative_importance,
      overall_quality: moment.scoring_factors.overall_quality,
      stability: moment.scoring_factors.stability,
      focus_quality: moment.scoring_factors.focus_quality,
      lighting_quality: moment.scoring_factors.lighting_quality,
      weighted_score: moment.scoring_factors.weighted_score,
      confidence: moment.scoring_factors.confidence,
      ranking_position: moment.scoring_factors.ranking_position,
    },

    description: moment.description,
    auto_description: moment.auto_description,
    involved_persons: moment.involved_persons,
    involved_objects: moment.involved_objects,
    associated_emotions: moment.associated_emotions,
    content_tags: moment.content_tags,
    mood_tags: moment.mood_tags,
    technical_tags: moment.technical_tags,
    is_bookmarked: moment.is_bookmarked,
    is_hidden: false,
    thumbnail_frame: moment.thumbnail_frame,
    preview_start: moment.preview_start,
    preview_end: moment.preview_end,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
}

function mapSceneType(sceneType: string): SceneType {
  const mapping: Record<string, SceneType> = {
    "Intro": SceneType.Static,
    "Action": SceneType.Dynamic,
    "Dialog": SceneType.Medium,
    "Transition": SceneType.Static,
    "Ending": SceneType.Static,
  }
  return mapping[sceneType] || SceneType.Static
}

function mapMomentType(momentType: string): MomentType {
  const mapping: Record<string, MomentType> = {
    "HighEnergy": MomentType.ActionClimax,
    "EmotionalPeak": MomentType.EmotionalPeak,
    "DialogueHighlight": MomentType.DialogueHighlight,
    "VisuallyStunning": MomentType.VisualStunning,
    "AudioPeak": MomentType.AudioPeak,
    "QualityPeak": MomentType.QualityPeak,
  }
  return mapping[momentType] || MomentType.UserDefined
}

function mapEmotionalTone(emotions?: string[]): EmotionalTone | undefined {
  if (!emotions || emotions.length === 0) return undefined

  return {
    primary_emotion: emotions[0],
    intensity: 0.7, // Default
    confidence: 0.8, // Default
    secondary_emotions: emotions.slice(1).map(emotion => ({
      emotion,
      intensity: 0.5,
    })),
  }
}

// Storage helpers (можно использовать IndexedDB или Tauri Store)
async function saveAnalysisResults(projectId: string, fileId: string, result: ComprehensiveAnalysisResult) {
  const key = `analysis_${projectId}_${fileId}`
  localStorage.setItem(key, JSON.stringify(result))
}

async function loadAnalysisResults(projectId: string): Promise<ComprehensiveAnalysisResult[]> {
  const results: ComprehensiveAnalysisResult[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(`analysis_${projectId}_`)) {
      const data = localStorage.getItem(key)
      if (data) {
        results.push(JSON.parse(data))
      }
    }
  }

  return results
}
```

---

### Вариант 2: Прямая миграция (более радикальный)

Полностью переписать Dashboard компоненты для работы напрямую с AI Director API.

**Преимущества**:
- Чистая архитектура без legacy кода
- Прямое использование новых возможностей
- Меньше промежуточных слоев

**Недостатки**:
- Требует переписывания всех компонентов
- Риск поломки существующего функционала
- Больше времени на миграцию

---

## План реализации (Вариант 1)

### Этап 1: Создание адаптера ✅ NEXT

**Задачи**:
1. [ ] Создать `use-analysis-adapter.ts`
2. [ ] Реализовать маппинг типов
3. [ ] Реализовать project storage (localStorage/IndexedDB)
4. [ ] Покрыть тестами

**Файлы**:
- `/src/features/analysis-dashboard/hooks/use-analysis-adapter.ts` - новый
- `/src/features/analysis-dashboard/utils/type-mappers.ts` - новый
- `/src/features/analysis-dashboard/utils/storage.ts` - новый

### Этап 2: Обновление Dashboard компонентов

**Задачи**:
1. [ ] Обновить `analysis-dashboard.tsx` для использования адаптера
2. [ ] Обновить импорты в остальных компонентах
3. [ ] Протестировать UI workflow

**Файлы для изменения**:
- `/src/features/analysis-dashboard/components/analysis-dashboard.tsx`
- `/src/features/analysis-dashboard/components/create-project-dialog.tsx`
- `/src/features/analysis-dashboard/components/project-card.tsx`
- `/src/features/analysis-dashboard/components/scene-browser.tsx`
- `/src/features/analysis-dashboard/components/moment-browser.tsx`

### Этап 3: Добавление роутинга

**Задачи**:
1. [ ] Создать `/src/app/(app)/analysis/page.tsx`
2. [ ] Добавить в main navigation
3. [ ] Добавить breadcrumbs

**Файлы**:
- `/src/app/(app)/analysis/page.tsx` - новый
- `/src/components/layout/main-nav.tsx` - обновить
- Navigation меню - обновить

### Этап 4: Тестирование и документация

**Задачи**:
1. [ ] E2E тесты для workflow
2. [ ] Обновить User Guide
3. [ ] Обновить Screenshots

---

## Маппинг данных

### Конфигурация

| Старое поле | Новое поле | Примечания |
|-------------|------------|------------|
| `quality_mode` | `performance_mode` | Fast/Balanced/Quality |
| `enable_scene_detection` | `enable_scene_detection` | 1:1 |
| `enable_person_recognition` | `enable_face_detection` | Renamed |
| `enable_object_detection` | `enable_object_detection` | 1:1 |
| `enable_emotion_analysis` | `enable_emotion_analysis` | 1:1 |
| `enable_audio_analysis` | `enable_audio_analysis` | 1:1 |
| `enable_quality_analysis` | _(всегда включено)_ | Удалено |
| `enable_text_recognition` | _(не поддерживается)_ | Будущая функция |
| `frame_skip` | _(внутренняя логика)_ | Автоматически |
| `resolution_scale` | _(внутренняя логика)_ | Автоматически |
| `use_gpu` | _(автодетект)_ | Автоматически |

### Сцены

| Старое поле | Новое поле | Источник |
|-------------|------------|----------|
| `scene_type` | `scene_type` | SceneAnalysis |
| `confidence` | `confidence` | SceneAnalysis |
| `dominant_colors` | `dominant_colors` | SceneAnalysis.visual |
| `brightness` | `brightness` | SceneAnalysis.visual |
| `contrast` | `contrast` | SceneAnalysis.visual |
| `saturation` | `saturation` | SceneAnalysis.visual |
| `motion_level` | `motion_intensity` | SceneAnalysis.visual |
| `composition_score` | `composition_score` | SceneAnalysis.visual |
| `quality_score` | `quality_score` | SceneAnalysis.visual |
| `persons_present` | `persons` | SceneAnalysis |
| `objects_detected` | `objects` | SceneAnalysis |
| `emotional_tone` | `dominant_emotions` | SceneAnalysis.audio |
| `energy_level` | `energy` | SceneAnalysis.audio |
| `keyframes` | `key_frames` | SceneAnalysis |

**Отсутствующие поля в AI Director**:
- `rule_of_thirds_compliance` - может быть добавлено позже
- `visual_balance` - может быть добавлено позже
- `has_text` - Text Recognition (планируется)
- `user_rating`, `user_description` - UI-only, хранить локально

### Моменты

| Старое поле | Новое поле | Источник |
|-------------|------------|----------|
| `moment_type` | `moment_type` | MomentAnalysis |
| `importance_score` | `importance_score` | MomentAnalysis |
| `scoring_factors.*` | `scoring_factors.*` | MomentAnalysis (1:1 mapping) |
| `description` | `description` | MomentAnalysis |
| `involved_persons` | `involved_persons` | MomentAnalysis |
| `involved_objects` | `involved_objects` | MomentAnalysis |
| `associated_emotions` | `associated_emotions` | MomentAnalysis |
| `content_tags` | `content_tags` | MomentAnalysis |
| `mood_tags` | `mood_tags` | MomentAnalysis |
| `technical_tags` | `technical_tags` | MomentAnalysis |

**Отсутствующие поля в AI Director**:
- `user_notes`, `user_rating` - UI-only, хранить локально
- `is_hidden` - UI-only

---

## Real-time события

AI Director поддерживает real-time события через Tauri:

```typescript
// В компоненте Dashboard
const { isAnalyzing, currentProgress, errors } = useAIDirectorAnalysis()

// События автоматически обновляют UI:
// - "analysis-started" → isAnalyzing = true
// - "analysis-progress" → currentProgress обновляется
// - "analysis-stage-completed" → отображение завершенного этапа
// - "analysis-completed" → isAnalyzing = false, result готов
// - "analysis-error" → добавление в errors[]
```

**Прогресс по этапам**:
1. **Initialization** (0-5%)
2. **Audio Analysis** (5-25%) - UnifiedAudioAnalyzer
3. **Scene Detection** (25-45%) - SceneEngine
4. **Vision Analysis** (45-65%) - VisionService
5. **Moment Detection** (65-85%) - MomentEngine
6. **Content Classification** (85-95%) - ContentEngine
7. **Integration** (95-100%) - Сводка результатов

---

## Отличия в возможностях

### ✅ Новые возможности AI Director

1. **Graceful Degradation**
   - Если один движок падает, остальные продолжают работу
   - Возвращается `PartiallyCompleted` с доступными результатами
   - Поле `success_rate` показывает % успешных движков

2. **Preset конфигурации**
   - Fast (~30s) - только аудио
   - Balanced (~2min) - аудио + сцены + видение + моменты
   - Quality (~10min) - все движки

3. **Пакетный анализ**
   - `analyzeBatch([path1, path2, path3])` - параллельный анализ

4. **Health Check**
   - Проверка доступности всех движков
   - GPU acceleration статус
   - System capabilities

5. **Расширенные метрики**
   - Performance timing для каждого движка
   - Детальные scoring factors (20+ параметров)
   - Confidence scores для всех детекций

### ❌ Функции старого API (не реализованы в AI Director)

1. **Project Management**
   - Нет встроенного project storage
   - Нет multi-file projects как единой сущности
   - Решение: Адаптер с localStorage/IndexedDB

2. **User Annotations**
   - Нет `user_rating`, `user_notes`, `user_description`
   - Решение: Хранить локально в браузере

3. **Text Recognition**
   - `enable_text_recognition` не реализовано
   - Планируется в будущих версиях

4. **Search API**
   - `search_project_data()` не реализовано
   - Решение: Client-side поиск по загруженным данным

---

## Примеры использования

### Создание проекта и анализ

```typescript
import { useAnalysisAdapter } from "@/features/analysis-dashboard/hooks/use-analysis-adapter"

function CreateProjectDialog() {
  const { createProject, startAnalysis, getProjectScenes } = useAnalysisAdapter()

  const handleCreateAndAnalyze = async () => {
    // 1. Создать проект
    const projectId = await createProject(
      "My Video Analysis",
      "Test project",
      {
        enable_scene_detection: true,
        enable_person_recognition: true,
        enable_audio_analysis: true,
        quality_mode: QualityMode.Balanced,
        // ... остальные параметры
      },
      [
        { file_path: "/path/to/video1.mp4", /* ... */ },
        { file_path: "/path/to/video2.mp4", /* ... */ }
      ]
    )

    // 2. Запустить анализ (автоматически вызывает AI Director для каждого файла)
    await startAnalysis(projectId)

    // 3. Получить результаты
    const scenes = await getProjectScenes(projectId)
    console.log("Found scenes:", scenes)
  }
}
```

### Отображение прогресса

```typescript
import { AIDirectorProgress } from "@/features/ai-director/components/ai-director-progress"

function AnalysisDashboard() {
  return (
    <div>
      <AIDirectorProgress showOnlyWhenActive />
      {/* ... остальной UI */}
    </div>
  )
}
```

---

## Следующие шаги

1. ✅ **Создать адаптер** - `use-analysis-adapter.ts`
2. **Реализовать storage** - Project + Results storage
3. **Обновить Dashboard** - Использовать адаптер
4. **Добавить роутинг** - `/analysis` route
5. **E2E тесты** - Полный workflow
6. **Документация** - User guide с screenshots

---

## Вопросы и решения

### Q: Зачем нужен адаптер, если есть новый AI Director API?

**A**: Analysis Dashboard уже имеет сложный UI с множеством компонентов (ProjectCard, SceneBrowser, MomentBrowser, Statistics, etc.). Адаптер позволяет использовать весь этот UI без переписывания, просто подменяя источник данных.

### Q: Где хранить projects?

**A**: Три варианта:
1. **localStorage** - простое решение для MVP
2. **IndexedDB** - для больших объемов данных
3. **Tauri Store** - для нативного персистентного хранения

Рекомендация: Начать с localStorage, мигрировать на Tauri Store.

### Q: Как работает real-time прогресс?

**A**: AI Director emit-ит Tauri события во время анализа:
- Backend (Rust) → `emit("analysis-progress", {...})`
- Frontend → `listen("analysis-progress", callback)`
- Hook `useAIDirectorAnalysis` автоматически подписывается на эти события

### Q: Что делать с отсутствующими функциями (text recognition, search)?

**A**:
- **Text Recognition**: Добавить в roadmap, пока disabled
- **Search**: Реализовать client-side поиск по загруженным результатам

---

**Автор**: AI Director Migration Team
**Версия документа**: 1.0
**Последнее обновление**: 3 ноября 2025
