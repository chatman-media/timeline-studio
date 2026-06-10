# AI Services Domain - API Reference

## Table of Contents

- [React Hooks](#react-hooks)
- [Services](#services)
- [State Machines](#state-machines)
- [Backend Commands](#backend-commands)
- [Types](#types)

---

## React Hooks

AI Services предоставляет хуки для работы с AI сервисами. Все хуки используют singleton UnifiedOrchestrator и не требуют дополнительных провайдеров.

### useUnifiedAnalysis()

Унифицированный анализ медиа через AI Director.

```typescript
import { useUnifiedAnalysis } from "@/domains/ai-services"

function MyComponent() {
  const {
    startAnalysis,
    cancelAnalysis,
    analysisResult,
    isAnalyzing,
    progress,
    error
  } = useUnifiedAnalysis()

  // Запуск анализа
  const handleAnalyze = async () => {
    await startAnalysis(videoPath, {
      aiDirectorConfig: { mode: "balanced" },
      skipMontageAnalysis: false
    })
  }

  return (
    <div>
      {isAnalyzing && <ProgressBar value={progress} />}
      {analysisResult && <AnalysisViewer data={analysisResult} />}
    </div>
  )
}
```

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `startAnalysis` | `(path: string, config?: Config) => Promise<void>` | Запуск анализа |
| `cancelAnalysis` | `() => void` | Отмена анализа |
| `analysisResult` | `UnifiedContentAnalysis \| null` | Результат анализа |
| `isAnalyzing` | `boolean` | Статус анализа |
| `progress` | `number` | Прогресс 0-100 |
| `error` | `string \| null` | Ошибка |

---

### useAnalysisStorage()

Сохранение и загрузка результатов анализа.

```typescript
import { useAnalysisStorage } from "@/domains/ai-services"

function AnalysisManager() {
  const {
    saveAnalysis,
    loadAnalysis,
    deleteAnalysis,
    listAnalyses
  } = useAnalysisStorage()

  // Сохранение анализа
  const handleSave = async (analysis: UnifiedContentAnalysis) => {
    await saveAnalysis(analysis, { projectId: currentProjectId })
  }

  // Загрузка анализа
  const handleLoad = async (analysisId: string) => {
    const analysis = await loadAnalysis(analysisId)
    return analysis
  }

  // Получение списка анализов
  const analyses = await listAnalyses(currentProjectId)
}
```

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `saveAnalysis` | `(analysis: Analysis, options?: SaveOptions) => Promise<void>` | Сохранение |
| `loadAnalysis` | `(analysisId: string) => Promise<Analysis>` | Загрузка |
| `deleteAnalysis` | `(analysisId: string) => Promise<void>` | Удаление |
| `listAnalyses` | `(projectId?: string) => Promise<AnalysisInfo[]>` | Список анализов |

---

### useAIDirectorEvents()

Подписка на события AI Director.

```typescript
import { useAIDirectorEvents } from "@/domains/ai-services"

function AnalysisMonitor() {
  useAIDirectorEvents({
    onAnalysisStarted: (event) => {
      console.log("Analysis started:", event.analysisId)
    },
    onAnalysisProgress: (event) => {
      console.log("Progress:", event.progress, "%")
    },
    onAnalysisCompleted: (event) => {
      console.log("Completed:", event.result)
    },
    onAnalysisError: (event) => {
      console.error("Error:", event.error)
    }
  })

  return <div>Monitoring analysis...</div>
}
```

---

### useAIDirectorAnalysisProgress()

Отслеживание прогресса анализа.

```typescript
import { useAIDirectorAnalysisProgress } from "@/domains/ai-services"

function AnalysisProgressBar({ analysisId }: { analysisId: string }) {
  const { progress, stage, timeRemaining } = useAIDirectorAnalysisProgress(analysisId)

  return (
    <div>
      <ProgressBar value={progress} />
      <p>Stage: {stage}</p>
      <p>Time remaining: {timeRemaining}s</p>
    </div>
  )
}
```

---

### useAIDirectorAnalysisCompleted()

Обработка завершения анализа.

```typescript
import { useAIDirectorAnalysisCompleted } from "@/domains/ai-services"

function AnalysisNotifier() {
  useAIDirectorAnalysisCompleted((result) => {
    console.log("Analysis completed:", result)
    showNotification("Analysis complete!")
  })

  return null
}
```

---

## Services

### UnifiedOrchestrator

Координатор AI операций.

```typescript
import { unifiedOrchestrator, UnifiedOrchestrator } from "@/domains/ai-services"

// Comprehensive анализ
const result = await unifiedOrchestrator.analyzeComprehensive(videoPath, {
  aiDirectorConfig: { mode: "balanced" },
  montageOptions: { enable_audio_analysis: true },
  skipMontageAnalysis: false
})

// Batch анализ
const batchResults = await unifiedOrchestrator.analyzeBatch(videoPaths, config)

// Генерация плана монтажа
const plan = await unifiedOrchestrator.generateMontagePlan(videoIds, options)

// Оптимизация плана
const optimized = await unifiedOrchestrator.optimizeMontagePlan(plan, preferences)

// Валидация плана
const validation = await unifiedOrchestrator.validateMontagePlan(plan)

// Статистика плана
const stats = await unifiedOrchestrator.calculatePlanStatistics(plan)

// Workflow management
const workflow = unifiedOrchestrator.getWorkflow(workflowId)
const activeWorkflows = unifiedOrchestrator.getActiveWorkflows()
unifiedOrchestrator.cancelWorkflow(workflowId)
unifiedOrchestrator.cleanupCompletedWorkflows()

// Health check
const health = await unifiedOrchestrator.healthCheck()
const status = await unifiedOrchestrator.getSystemStatus()
```

---

### AIDirectorService

Сервис для работы с AI Director backend.

```typescript
import { aiDirectorService } from "@/domains/ai-services"

// Comprehensive анализ
const result = await aiDirectorService.analyzeComprehensive(videoPath, config)

// Быстрый анализ
const quickResult = await aiDirectorService.analyzeQuick(videoPath)

// Batch анализ
const batchResults = await aiDirectorService.analyzeBatch(filePaths, config)

// Audio анализ
const audioResult = await aiDirectorService.analyzeAudioComprehensive(videoPath, {
  enableFFmpeg: true,
  enableMontage: true,
  enableTranscription: false,
  performanceMode: "balanced"
})

// Video анализ
const videoResult = await aiDirectorService.analyzeVideoComprehensive(videoPath, {
  enableObjectDetection: true,
  enableFaceDetection: true,
  enableEmotionAnalysis: true,
  enableCompositionAnalysis: true,
  qualityThreshold: 50.0,
  maxMoments: 50
})

// Capabilities
const capabilities = await aiDirectorService.getCapabilities()
const audioCapabilities = await aiDirectorService.getAudioAnalysisCapabilities()

// Configuration
const config = await aiDirectorService.getDefaultConfig("balanced")
const validation = await aiDirectorService.validateConfig(config)

// Health
const health = await aiDirectorService.healthCheck()
const isAvailable = await aiDirectorService.checkAvailability()
const systemStatus = await aiDirectorService.getSystemStatus()
```

---

### AnalysisStorageService

Персистентное хранение результатов анализа.

```typescript
import { analysisStorageService } from "@/domains/ai-services"

// Сохранение
await analysisStorageService.saveAnalysis(analysis, { projectId: "..." })

// Загрузка
const analysis = await analysisStorageService.loadAnalysis(analysisId)

// Список
const analyses = await analysisStorageService.listAnalyses(projectId)

// Удаление
await analysisStorageService.deleteAnalysis(analysisId)
```

---

### AIEventBridge

Синхронизация событий между Tauri и TypeScript.

```typescript
import { aiEventBridge, TAURI_EVENTS } from "@/domains/ai-services"

// Подписка на события
const unsubscribe = aiEventBridge.subscribe(TAURI_EVENTS.ANALYSIS_PROGRESS, (event) => {
  console.log("Progress:", event.payload)
})

// Отписка
unsubscribe()
```

---

### MediaAnalysisFactory

Фабрика для создания сервисов анализа.

```typescript
import { createMediaAnalysisFactory, getMediaAnalysisFactory } from "@/domains/ai-services"

const factory = createMediaAnalysisFactory()

// Создание сервисов
const ffmpegService = factory.createFFmpegService()
const visionService = factory.createVisionService()
const contentService = factory.createContentAnalysisService()

// Проверка доступности
const isFFmpegAvailable = await factory.isFFmpegAvailable()
const availableServices = await factory.getAvailableServices()
```

---

### Script Generation Services

Генерация скриптов для видео.

```typescript
import {
  ScriptGenerationEngine,
  DialogueGenerator,
  TemplateEngine
} from "@/domains/ai-services"

// Script Generation
const engine = new ScriptGenerationEngine()
const script = await engine.generateScript({
  analysisResult,
  targetDuration: 60,
  style: "casual"
})

// Dialogue Generation
const dialogueGen = new DialogueGenerator()
const dialogues = await dialogueGen.generateDialogues(scenes)

// Template Engine
const templateEngine = new TemplateEngine()
const rendered = await templateEngine.render(template, context)
```

---

## State Machines

### chatMachine

XState машина для AI чата.

**States:**
- `idle` - Готов к использованию
- `sending` - Отправка сообщения
- `receiving` - Получение ответа
- `streaming` - Streaming ответа
- `error` - Ошибка

**Events:**
- `SEND_MESSAGE` - Отправить сообщение
- `CANCEL` - Отменить запрос
- `CLEAR_HISTORY` - Очистить историю
- `SET_MODEL` - Изменить модель

---

### aiIntelligenceMachine

XState машина для AI интеллекта с интеграцией AI Director.

**States:**
- `idle` - Готов
- `analyzing` - Анализ контента
- `generating` - Генерация адаптаций
- `completed` - Завершено
- `error` - Ошибка

**Events:**
- `ANALYZE_CONTENT` - Запуск анализа
- `GENERATE_ADAPTATIONS` - Генерация адаптаций
- `CANCEL` - Отмена
- `RESET` - Сброс

---

### montagePlannerMachine

XState машина для планирования монтажа.

**States:**
- `idle` - Готов
- `analyzing` - Анализ видео
- `planning` - Генерация плана
- `optimizing` - Оптимизация
- `ready` - План готов
- `applying` - Применение к таймлайну
- `error` - Ошибка

**Events:**
- `ANALYZE` - Запуск анализа
- `GENERATE_PLAN` - Генерация плана
- `OPTIMIZE` - Оптимизация
- `APPLY` - Применить к таймлайну
- `CANCEL` - Отмена

---

## Backend Commands

### AI Director Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `ai_director_analyze_comprehensive` | `{ videoPath, config? }` | Comprehensive анализ |
| `ai_director_analyze_quick` | `{ videoPath }` | Быстрый анализ |
| `ai_director_analyze_batch` | `{ filePaths, config? }` | Batch анализ |
| `ai_director_get_capabilities` | `{}` | Получить capabilities |
| `ai_director_get_default_config` | `{ mode }` | Конфигурация по умолчанию |
| `ai_director_validate_config` | `{ config }` | Валидация конфигурации |
| `ai_director_health_check` | `{}` | Health check |

### Content Intelligence Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `ffmpeg_detect_scenes` | `{ videoPath }` | Детекция сцен в видео |
| `ffmpeg_analyze_quality` | `{ videoPath }` | Анализ качества видео |
| `ffmpeg_detect_silence` | `{ videoPath }` | Обнаружение тишины |
| `ffmpeg_analyze_motion` | `{ videoPath }` | Анализ движения |
| `ffmpeg_extract_keyframes` | `{ videoPath, options? }` | Извлечение ключевых кадров |
| `ffmpeg_analyze_audio` | `{ videoPath }` | Анализ аудиодорожки |
| `ffmpeg_quick_analysis` | `{ filePath }` | Быстрый анализ |

### Recognition Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `init_yolo_processor` | `{ modelPath, device }` | Инициализация YOLO |
| `detect_objects_in_image` | `{ processorId, imagePath }` | Детекция объектов |
| `analyze_video_with_yolo` | `{ processorId, videoPath, options? }` | YOLO анализ видео |
| `init_retinaface_processor` | `{}` | Инициализация RetinaFace |
| `detect_faces_with_landmarks` | `{ imagePath }` | Детекция лиц |
| `init_facenet_processor` | `{}` | Инициализация FaceNet |
| `generate_face_embedding` | `{ imagePath }` | Генерация эмбеддинга |
| `calculate_cosine_similarity` | `{ embedding1, embedding2 }` | Схожесть эмбеддингов |

### Montage Planner Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `analyze_montage_videos` | `{ videoIds, options }` | Анализ видео для монтажа |
| `generate_montage_plan` | `{ analysis, preferences }` | Генерация плана |
| `optimize_montage_plan` | `{ plan, preferences }` | Оптимизация плана |
| `validate_montage_plan` | `{ plan }` | Валидация плана |
| `calculate_plan_statistics` | `{ plan }` | Статистика плана |

### Audio Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `unified_audio_analyze_comprehensive` | `{ videoPath, config }` | Comprehensive аудио анализ |
| `unified_audio_analyze_quick` | `{ videoPath }` | Быстрый аудио анализ |
| `unified_audio_analyze_batch` | `{ filePaths, config? }` | Batch аудио анализ |
| `unified_audio_get_capabilities` | `{}` | Capabilities аудио системы |
| `whisper_transcribe_openai` | `{ audioPath, options }` | Whisper транскрипция |

### Chat Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `save_simple_api_key` | `{ serviceName, apiKey }` | Сохранение API ключа |
| `get_decrypted_api_key` | `{ serviceName }` | Получение ключа |
| `validate_api_key` | `{ serviceName, apiKey }` | Валидация ключа |
| `list_api_keys` | `{}` | Список ключей |
| `delete_api_key` | `{ serviceName }` | Удаление ключа |

---

## Types

### UnifiedContentAnalysis

```typescript
interface UnifiedContentAnalysis {
  analysisId: string
  videoPath: string
  status: "pending" | "in_progress" | "completed" | "failed"
  createdAt: string
  processingTimeMs: number
  videoInfo: {
    duration: number
    fps: number
    resolution: { width: number; height: number }
    codec: string
    fileSize: number
  }
  qualityMetrics: {
    overall: number
    video: number
    audio: number
    technical: number
  }
  scenes?: Scene[]
  keyMoments?: KeyMoment[]
  objects?: DetectedObject[]
  faces?: FaceDetection[]
  audioAnalysis?: AudioAnalysisResult
}
```

### ComprehensiveAnalysisResult

```typescript
interface ComprehensiveAnalysisResult {
  analysis_id: string
  status: "pending" | "in_progress" | "completed" | "failed"
  audio_analysis?: AudioAnalysisResult
  scene_analysis?: SceneAnalysisResult
  video_analysis?: VideoAnalysisResult
  object_detection?: ObjectDetectionResult
  face_recognition?: FaceRecognitionResult
  started_at: string
  completed_at: string
  total_duration_ms: number
  errors: string[]
}
```

### AnalysisWorkflow

```typescript
interface AnalysisWorkflow {
  workflowId: string
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled"
  videoPath: string
  startTime: Date
  endTime?: Date
  stages: {
    aiDirector: StageStatus
    montagePlanner: StageStatus
    integration: StageStatus
  }
  results: {
    comprehensive?: ComprehensiveAnalysisResult
    montage?: MontageAnalysisResult
    unified?: UnifiedContentAnalysis
  }
  errors: Array<{ stage: string; error: string; timestamp: Date }>
}
```

### AIDirectorConfig

```typescript
interface AIDirectorConfig {
  mode: "fast" | "balanced" | "quality" | "custom"
  audio?: {
    enable_ffmpeg_analysis?: boolean
    enable_montage_analysis?: boolean
    enable_transcription?: boolean
  }
  video?: {
    enable_object_detection?: boolean
    enable_face_detection?: boolean
    enable_emotion_analysis?: boolean
    enable_composition_analysis?: boolean
  }
  performance?: {
    max_concurrent?: number
    timeout_ms?: number
  }
}
```

### ScriptGenerationResult

```typescript
interface ScriptGenerationResult {
  script: GeneratedScript
  alternatives: ScriptAlternative[]
  quality: ScriptQuality
  improvements: ScriptImprovement[]
}
```

### MontagePlan

```typescript
interface MontagePlan {
  id: string
  name: string
  style: MontageStyle
  total_duration: number
  segments: MontageSegment[]
  transitions: MontageTransition[]
  audio_mix: AudioMixConfig
  metadata: PlanMetadata
}
```
