# AI Director Domain - API Reference

## Table of Contents

- [AIDirectorService](#aidirectorservice)
  - [Core Analysis Methods](#core-analysis-methods)
  - [Audio Analysis Methods](#audio-analysis-methods)
  - [Video Analysis Methods](#video-analysis-methods)
  - [Configuration Methods](#configuration-methods)
  - [System Methods](#system-methods)
- [React Hooks](#react-hooks)
  - [useAIDirectorEvents](#useaidirectorevents)
- [State Machines](#state-machines)
  - [aiDirectorMachine](#aidirectormachine)
- [Tauri Commands](#tauri-commands)
- [Types Reference](#types-reference)

---

## AIDirectorService

Singleton сервис для работы с AI Director backend. Все методы асинхронные.

```typescript
import { aiDirectorService } from "@/domains/ai-director"
```

### Core Analysis Methods

#### analyzeComprehensive()

Комплексный анализ видео с полной конфигурацией.

```typescript
async analyzeComprehensive(
  videoPath: string,
  config?: AIDirectorConfig
): Promise<ComprehensiveAnalysisResult>
```

**Parameters:**
- `videoPath` - Абсолютный путь к видео файлу
- `config?` - Конфигурация анализа (опционально)

**Returns:** `ComprehensiveAnalysisResult` с результатами всех включённых анализаторов

**Example:**
```typescript
const result = await aiDirectorService.analyzeComprehensive("/path/video.mp4", {
  performance_mode: "balanced",
  enable_audio_analysis: true,
  enable_scene_detection: true,
  enable_video_analysis: true,
  enable_object_detection: true,
  enable_face_recognition: true,
  enable_transcription: false,
  timeout_seconds: 300
})

console.log("Scenes:", result.scene_analysis?.scenes)
console.log("Objects:", result.object_detection?.objects)
console.log("Duration:", result.total_duration_ms, "ms")
```

---

#### analyzeQuick()

Быстрый анализ с preset конфигурацией (fast mode).

```typescript
async analyzeQuick(
  videoPath: string
): Promise<ComprehensiveAnalysisResult>
```

**Parameters:**
- `videoPath` - Абсолютный путь к видео файлу

**Returns:** `ComprehensiveAnalysisResult` с базовыми метриками

**Example:**
```typescript
const result = await aiDirectorService.analyzeQuick("/path/video.mp4")
console.log("Quick analysis completed:", result.analysis_id)
```

---

#### analyzeBatch()

Пакетный анализ нескольких видео файлов.

```typescript
async analyzeBatch(
  filePaths: string[],
  config?: AIDirectorConfig
): Promise<ComprehensiveAnalysisResult[]>
```

**Parameters:**
- `filePaths` - Массив абсолютных путей к видео файлам
- `config?` - Конфигурация анализа (опционально)

**Returns:** Массив `ComprehensiveAnalysisResult[]`

**Example:**
```typescript
const paths = ["/path/video1.mp4", "/path/video2.mp4", "/path/video3.mp4"]
const results = await aiDirectorService.analyzeBatch(paths, {
  performance_mode: "fast",
  enable_audio_analysis: true
})

results.forEach((result, index) => {
  console.log(`Video ${index + 1}:`, result.status)
})
```

---

### Audio Analysis Methods

#### analyzeAudioComprehensive()

Комплексный анализ аудио дорожки через Unified Audio System.

```typescript
async analyzeAudioComprehensive(
  videoPath: string,
  config?: {
    enableFFmpeg?: boolean
    enableMontage?: boolean
    enableTranscription?: boolean
    performanceMode?: "fast" | "balanced" | "quality"
  }
): Promise<UnifiedAudioAnalysisResult>
```

**Parameters:**
- `videoPath` - Абсолютный путь к видео файлу
- `config?` - Конфигурация аудио анализа

**Returns:** `UnifiedAudioAnalysisResult` с аудио метриками

**Example:**
```typescript
const audioResult = await aiDirectorService.analyzeAudioComprehensive(
  "/path/video.mp4",
  {
    enableFFmpeg: true,
    enableMontage: true,
    enableTranscription: true,
    performanceMode: "balanced"
  }
)

console.log("Duration:", audioResult.duration)
console.log("Loudness:", audioResult.loudness, "dB")
console.log("Tempo:", audioResult.tempo, "BPM")
console.log("Silence:", audioResult.silence_percentage, "%")
console.log("Transcription:", audioResult.transcription)
```

---

#### analyzeAudioQuick()

Быстрый анализ аудио (только FFmpeg метрики).

```typescript
async analyzeAudioQuick(
  videoPath: string
): Promise<UnifiedAudioAnalysisResult>
```

**Parameters:**
- `videoPath` - Абсолютный путь к видео файлу

**Returns:** `UnifiedAudioAnalysisResult` с базовыми метриками

**Example:**
```typescript
const audioResult = await aiDirectorService.analyzeAudioQuick("/path/video.mp4")
console.log("Quick audio analysis:", audioResult.loudness)
```

---

#### analyzeAudioBatch()

Пакетный анализ аудио для нескольких файлов.

```typescript
async analyzeAudioBatch(
  filePaths: string[],
  config?: {
    performanceMode?: "fast" | "balanced" | "quality"
  }
): Promise<UnifiedAudioAnalysisResult[]>
```

**Parameters:**
- `filePaths` - Массив абсолютных путей
- `config?` - Конфигурация (режим производительности)

**Returns:** Массив `UnifiedAudioAnalysisResult[]`

**Example:**
```typescript
const paths = ["/video1.mp4", "/video2.mp4"]
const results = await aiDirectorService.analyzeAudioBatch(paths, {
  performanceMode: "fast"
})
```

---

#### getAudioAnalysisCapabilities()

Получить доступные возможности аудио анализа.

```typescript
async getAudioAnalysisCapabilities(): Promise<{
  ffmpegAvailable: boolean
  montageAvailable: boolean
  whisperAvailable: boolean
  gpuAvailable: boolean
}>
```

**Returns:** Объект с флагами доступности компонентов

**Example:**
```typescript
const caps = await aiDirectorService.getAudioAnalysisCapabilities()
if (caps.whisperAvailable) {
  console.log("Transcription is available")
}
```

---

### Video Analysis Methods

#### analyzeVideoComprehensive()

Комплексный анализ видео (объекты, лица, эмоции, композиция).

```typescript
async analyzeVideoComprehensive(
  videoPath: string,
  options?: {
    enableObjectDetection?: boolean
    enableFaceDetection?: boolean
    enableEmotionAnalysis?: boolean
    enableCompositionAnalysis?: boolean
    enableAudioAnalysis?: boolean
    qualityThreshold?: number
    maxMoments?: number
  }
): Promise<VideoAnalysisResult>
```

**Parameters:**
- `videoPath` - Абсолютный путь к видео файлу
- `options?` - Опции видео анализа

**Returns:** `VideoAnalysisResult` с результатами видео анализа

**Example:**
```typescript
const videoResult = await aiDirectorService.analyzeVideoComprehensive(
  "/path/video.mp4",
  {
    enableObjectDetection: true,
    enableFaceDetection: true,
    enableEmotionAnalysis: true,
    enableCompositionAnalysis: true,
    qualityThreshold: 60.0,
    maxMoments: 50
  }
)

console.log("Resolution:", videoResult.width, "x", videoResult.height)
console.log("FPS:", videoResult.fps)
console.log("Duration:", videoResult.duration)
```

---

### Configuration Methods

#### getCapabilities()

Получить системные возможности AI Director.

```typescript
async getCapabilities(): Promise<SystemCapabilities>
```

**Returns:** `SystemCapabilities` с флагами доступных функций

**Example:**
```typescript
const caps = await aiDirectorService.getCapabilities()
console.log("Audio analysis:", caps.audio_analysis)
console.log("Object detection:", caps.object_detection)
console.log("Face recognition:", caps.face_recognition)
console.log("GPU acceleration:", caps.gpu_acceleration)
console.log("Transcription:", caps.transcription)
console.log("MCP agents:", caps.mcp_agents)
```

---

#### getDefaultConfig()

Получить конфигурацию по умолчанию для режима.

```typescript
async getDefaultConfig(
  mode: "fast" | "balanced" | "quality" | "custom"
): Promise<AIDirectorConfig>
```

**Parameters:**
- `mode` - Режим производительности

**Returns:** `AIDirectorConfig` с preset значениями

**Example:**
```typescript
const config = await aiDirectorService.getDefaultConfig("balanced")
console.log("Config:", config)

// Кастомизация
config.enable_transcription = true
config.timeout_seconds = 600
```

---

#### validateConfig()

Валидация конфигурации перед запуском анализа.

```typescript
async validateConfig(
  config: AIDirectorConfig
): Promise<ConfigValidationResult>
```

**Parameters:**
- `config` - Конфигурация для валидации

**Returns:** `ConfigValidationResult` с результатами валидации

**Example:**
```typescript
const config = await aiDirectorService.getDefaultConfig("quality")
config.timeout_seconds = 10 // слишком мало

const validation = await aiDirectorService.validateConfig(config)
if (!validation.is_valid) {
  console.error("Errors:", validation.errors)
  console.warn("Warnings:", validation.warnings)
}

console.log("Estimated time:", validation.estimated_time, "seconds")
console.log("Estimated memory:", validation.estimated_memory, "MB")
```

---

#### getConfiguration()

Получить текущую конфигурацию (balanced mode).

```typescript
async getConfiguration(): Promise<AIDirectorConfig>
```

**Returns:** `AIDirectorConfig` текущей конфигурации

**Example:**
```typescript
const currentConfig = await aiDirectorService.getConfiguration()
```

---

#### updateConfiguration()

Обновить конфигурацию (TODO: требует backend команды).

```typescript
async updateConfiguration(
  config: Partial<AIDirectorConfig>
): Promise<void>
```

**Parameters:**
- `config` - Частичная конфигурация для обновления

**Example:**
```typescript
await aiDirectorService.updateConfiguration({
  enable_transcription: true,
  performance_mode: "quality"
})
```

---

#### resetConfiguration()

Сбросить конфигурацию к defaults (TODO: требует backend команды).

```typescript
async resetConfiguration(): Promise<void>
```

**Example:**
```typescript
await aiDirectorService.resetConfiguration()
```

---

### System Methods

#### healthCheck()

Проверка здоровья AI Director сервисов.

```typescript
async healthCheck(): Promise<HealthCheckResult>
```

**Returns:** `HealthCheckResult` со статусом сервисов

**Example:**
```typescript
const health = await aiDirectorService.healthCheck()
console.log("Overall status:", health.overall_status) // "healthy" | "warning" | "error"
console.log("Services:", health.services)
console.log("Last check:", health.last_check)
```

---

#### checkAvailability()

Проверить доступность AI Director.

```typescript
async checkAvailability(): Promise<boolean>
```

**Returns:** `true` если AI Director доступен

**Example:**
```typescript
const isAvailable = await aiDirectorService.checkAvailability()
if (!isAvailable) {
  console.error("AI Director is not available")
  return
}
```

---

#### getSystemStatus()

Получить полный системный статус.

```typescript
async getSystemStatus(): Promise<{
  capabilities: SystemCapabilities
  health: HealthCheckResult
  audioCapabilities: any
}>
```

**Returns:** Объект с capabilities, health, audioCapabilities

**Example:**
```typescript
const status = await aiDirectorService.getSystemStatus()
console.log("System status:", status)
```

---

#### getVersionInfo()

Получить информацию о версии AI Director.

```typescript
async getVersionInfo(): Promise<{
  version: string
  buildDate: string
  capabilities: string[]
}>
```

**Returns:** Объект с версией, датой сборки и capabilities

**Example:**
```typescript
const version = await aiDirectorService.getVersionInfo()
console.log("AI Director version:", version.version)
console.log("Build date:", version.buildDate)
console.log("Capabilities:", version.capabilities)
```

---

## React Hooks

### useAIDirectorEvents()

Hook для подписки на Tauri события AI Director.

```typescript
function useAIDirectorEvents(
  callbacks?: AIDirectorEventCallbacks
): UseAIDirectorEventsReturn
```

**Parameters:**
- `callbacks?` - Объект с callback функциями для событий

**Returns:**
```typescript
interface UseAIDirectorEventsReturn {
  isListening: boolean
  lastProgress: AnalysisProgress | null
  lastError: AnalysisError | null
  errors: AnalysisError[]
  clearErrors: () => void
}
```

**Callbacks Interface:**
```typescript
interface AIDirectorEventCallbacks {
  // V1 Events
  onAnalysisStarted?: (payload: any) => void
  onAnalysisProgress?: (progress: AnalysisProgress) => void
  onAnalysisCompleted?: (result: AnalysisCompleted) => void
  onAnalysisError?: (error: AnalysisError) => void
  onAnalysisStageCompleted?: (stage: AnalysisStageCompleted) => void

  // V2 Events (batch analysis)
  onFileAnalysisStarted?: (payload: any) => void
  onFileAnalysisProgress?: (payload: any) => void
  onFileAnalysisCompleted?: (payload: any) => void
  onBatchAnalysisStarted?: (payload: any) => void
  onBatchAnalysisProgress?: (payload: any) => void
  onBatchAnalysisCompleted?: (payload: any) => void
  onAnalyzerStarted?: (payload: any) => void
  onAnalyzerProgress?: (payload: any) => void
  onAnalyzerCompleted?: (payload: any) => void
}
```

**Event Constants:**
```typescript
export const AI_DIRECTOR_EVENTS = {
  // V1 Events
  ANALYSIS_STARTED: "analysis-started",
  ANALYSIS_PROGRESS: "analysis-progress",
  ANALYSIS_COMPLETED: "analysis-completed",
  ANALYSIS_ERROR: "analysis-error",
  ANALYSIS_STAGE_COMPLETED: "analysis-stage-completed",

  // V2 Events
  FILE_ANALYSIS_STARTED: "file-analysis-started",
  FILE_ANALYSIS_PROGRESS: "file-analysis-progress",
  FILE_ANALYSIS_COMPLETED: "file-analysis-completed",
  BATCH_ANALYSIS_STARTED: "batch-analysis-started",
  BATCH_ANALYSIS_PROGRESS: "batch-analysis-progress",
  BATCH_ANALYSIS_COMPLETED: "batch-analysis-completed",
  ANALYZER_STARTED: "analyzer-started",
  ANALYZER_PROGRESS: "analyzer-progress",
  ANALYZER_COMPLETED: "analyzer-completed",
} as const
```

**Example:**
```typescript
import { useAIDirectorEvents } from "@/domains/ai-director"

function AnalysisMonitor() {
  const {
    isListening,
    lastProgress,
    lastError,
    errors,
    clearErrors
  } = useAIDirectorEvents({
    onAnalysisStarted: (event) => {
      console.log("Analysis started:", event.analysisId)
    },

    onAnalysisProgress: (progress) => {
      console.log(`Stage: ${progress.stage}`)
      console.log(`Progress: ${(progress.progress * 100).toFixed(1)}%`)
      if (progress.estimatedTimeRemaining) {
        console.log(`ETA: ${progress.estimatedTimeRemaining}s`)
      }
    },

    onAnalysisStageCompleted: (stage) => {
      console.log(`Stage ${stage.stage} completed in ${stage.duration_ms}ms`)
      if (!stage.success && stage.error) {
        console.error("Stage failed:", stage.error)
      }
    },

    onAnalysisCompleted: (result) => {
      console.log("Analysis complete!")
      console.log("Total time:", result.total_duration_ms, "ms")
      console.log("Stages:", result.stages_completed)
      if (result.errors.length > 0) {
        console.error("Errors during analysis:", result.errors)
      }
    },

    onAnalysisError: (error) => {
      console.error(`Error in ${error.stage}:`, error.error)
    },

    // Batch events
    onBatchAnalysisStarted: (event) => {
      console.log("Batch started:", event.batchId)
    },

    onBatchAnalysisProgress: (event) => {
      console.log(`Batch progress: ${event.completed}/${event.total}`)
    },

    onBatchAnalysisCompleted: (event) => {
      console.log("Batch complete:", event.results)
    }
  })

  return (
    <div>
      <p>Listening: {isListening ? "Yes" : "No"}</p>

      {lastProgress && (
        <div>
          <h3>Current Progress</h3>
          <p>Stage: {lastProgress.stage}</p>
          <ProgressBar value={lastProgress.progress * 100} />
          {lastProgress.message && <p>{lastProgress.message}</p>}
        </div>
      )}

      {errors.length > 0 && (
        <div>
          <h3>Errors ({errors.length})</h3>
          <button onClick={clearErrors}>Clear All</button>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>
                <strong>{error.stage}:</strong> {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {lastError && (
        <Alert severity="error">
          Error in {lastError.stage}: {lastError.error}
        </Alert>
      )}
    </div>
  )
}
```

---

## State Machines

### aiDirectorMachine

XState v5 машина для управления состоянием AI Director.

**States:**
- `loading` - Загрузка capabilities
- `idle` - Готов к использованию
- `analyzing` - Comprehensive анализ
- `quickAnalyzing` - Quick анализ
- `batchAnalyzing` - Batch анализ
- `gettingCapabilities` - Получение capabilities
- `gettingConfig` - Получение конфигурации
- `validatingConfig` - Валидация конфигурации
- `healthChecking` - Health check
- `refreshing` - Обновление статуса
- `error` - Состояние ошибки

**Events:**
```typescript
type AIDirectorEvent =
  // Analysis commands
  | { type: "START_COMPREHENSIVE_ANALYSIS"; videoPath: string; config?: AIDirectorConfig }
  | { type: "START_QUICK_ANALYSIS"; videoPath: string }
  | { type: "START_BATCH_ANALYSIS"; filePaths: string[]; config?: AIDirectorConfig }
  | { type: "CANCEL_ANALYSIS"; analysisId: string }

  // System commands
  | { type: "GET_CAPABILITIES" }
  | { type: "GET_DEFAULT_CONFIG"; mode: string }
  | { type: "VALIDATE_CONFIG"; config: AIDirectorConfig }
  | { type: "HEALTH_CHECK" }

  // Analysis events (from Tauri)
  | { type: "ANALYSIS_PROGRESS"; progress: AnalysisProgress }
  | { type: "ANALYSIS_ERROR"; error: AnalysisError }
  | { type: "ANALYSIS_COMPLETED"; result: ComprehensiveAnalysisResult }
  | { type: "ANALYSIS_STAGE_COMPLETED"; stage: AnalysisStageCompleted }

  // UI commands
  | { type: "CLEAR_ERRORS" }
  | { type: "CLEAR_RESULTS" }
  | { type: "SET_AUTO_REFRESH"; enabled: boolean }
  | { type: "REFRESH_STATUS" }
```

**Context:**
```typescript
interface AIDirectorContext {
  // Configuration
  config: AIDirectorConfig | null
  capabilities: SystemCapabilities | null
  health: HealthCheckResult | null

  // Current analysis
  currentAnalysis: ComprehensiveAnalysisResult | null
  analysisProgress: AnalysisProgress | null

  // Results history
  results: ComprehensiveAnalysisResult[]

  // Error handling
  errors: AnalysisError[]

  // UI state
  isLoading: boolean
  autoRefresh: boolean
  lastUpdate: string | null
}
```

**Example:**
```typescript
import { useMachine } from "@xstate/react"
import { aiDirectorMachine } from "@/domains/ai-director"

function AIDirectorDashboard() {
  const [state, send] = useMachine(aiDirectorMachine)

  const handleAnalyze = () => {
    send({
      type: "START_COMPREHENSIVE_ANALYSIS",
      videoPath: "/path/to/video.mp4",
      config: {
        performance_mode: "balanced",
        enable_audio_analysis: true,
        enable_video_analysis: true
      }
    })
  }

  return (
    <div>
      <p>State: {state.value}</p>
      <p>Loading: {state.context.isLoading ? "Yes" : "No"}</p>

      <button
        onClick={handleAnalyze}
        disabled={state.matches("analyzing")}
      >
        Analyze Video
      </button>

      {state.context.currentAnalysis && (
        <div>
          <h3>Current Analysis</h3>
          <pre>{JSON.stringify(state.context.currentAnalysis, null, 2)}</pre>
        </div>
      )}

      {state.context.analysisProgress && (
        <div>
          <h3>Progress</h3>
          <ProgressBar value={state.context.analysisProgress.progress * 100} />
          <p>Stage: {state.context.analysisProgress.stage}</p>
        </div>
      )}

      <button onClick={() => send({ type: "GET_CAPABILITIES" })}>
        Refresh Capabilities
      </button>

      <button onClick={() => send({ type: "HEALTH_CHECK" })}>
        Health Check
      </button>

      <button onClick={() => send({ type: "CLEAR_ERRORS" })}>
        Clear Errors
      </button>
    </div>
  )
}
```

---

## Tauri Commands

Прямые Tauri команды (для advanced usage). Обычно используйте `aiDirectorService` вместо прямых команд.

### Core Commands

```typescript
import {
  aiDirectorAnalyzeComprehensive,
  aiDirectorAnalyzeQuick,
  aiDirectorAnalyzeBatch,
  aiDirectorGetCapabilities,
  aiDirectorGetDefaultConfig,
  aiDirectorValidateConfig,
  aiDirectorHealthCheck
} from "@/domains/ai-director"
```

| Function | Tauri Command | Description |
|----------|---------------|-------------|
| `aiDirectorAnalyzeComprehensive(videoPath, config?)` | `ai_director_v2_analyze_comprehensive` | Comprehensive анализ |
| `aiDirectorAnalyzeQuick(videoPath)` | `ai_director_v2_analyze_quick` | Quick анализ |
| `aiDirectorAnalyzeBatch(filePaths, config?)` | `ai_director_v2_analyze_batch` | Batch анализ |
| `aiDirectorGetCapabilities()` | `ai_director_get_capabilities` | Системные capabilities |
| `aiDirectorGetDefaultConfig(mode)` | `ai_director_get_default_config` | Default конфигурация |
| `aiDirectorValidateConfig(config)` | `ai_director_validate_config` | Валидация конфигурации |
| `aiDirectorHealthCheck()` | `ai_director_health_check` | Health check |

### Audio Commands

```typescript
import {
  unifiedAudioAnalyzeComprehensive,
  unifiedAudioAnalyzeQuick,
  unifiedAudioAnalyzeBatch,
  unifiedAudioGetCapabilities
} from "@/domains/ai-director"
```

| Function | Tauri Command | Description |
|----------|---------------|-------------|
| `unifiedAudioAnalyzeComprehensive(videoPath, config)` | `unified_audio_analyze_comprehensive` | Comprehensive аудио |
| `unifiedAudioAnalyzeQuick(videoPath)` | `unified_audio_analyze_quick` | Quick аудио |
| `unifiedAudioAnalyzeBatch(filePaths, config?)` | `unified_audio_analyze_batch` | Batch аудио |
| `unifiedAudioGetCapabilities()` | `unified_audio_get_capabilities` | Аудио capabilities |

### Video Commands

```typescript
import { analyzeVideoComprehensive } from "@/domains/ai-director"
```

| Function | Tauri Command | Description |
|----------|---------------|-------------|
| `analyzeVideoComprehensive(videoPath, options)` | `analyze_video_comprehensive` | Comprehensive видео |

---

## Types Reference

### AIDirectorConfig

```typescript
interface AIDirectorConfig {
  /** Режим производительности */
  performance_mode: "fast" | "balanced" | "quality"

  /** Включить аудио анализ */
  enable_audio_analysis: boolean

  /** Включить детекцию сцен */
  enable_scene_detection: boolean

  /** Включить анализ видео */
  enable_video_analysis: boolean

  /** Включить детекцию объектов */
  enable_object_detection: boolean

  /** Включить распознавание лиц */
  enable_face_recognition: boolean

  /** Включить транскрипцию */
  enable_transcription: boolean

  /** Таймаут анализа (секунды) */
  timeout_seconds?: number

  /** Максимальное использование памяти (MB) */
  max_memory_mb?: number

  // Extended fields (v2)
  enable_face_detection?: boolean
  enable_face_analysis?: boolean
  enable_motion_analysis?: boolean
  enable_composition_analysis?: boolean
  enable_moment_detection?: boolean
  enable_content_classification?: boolean
  enable_mood_analysis?: boolean
  enable_quality_analysis?: boolean
  enable_vision_language_model?: boolean
  generate_editing_recommendations?: boolean
  enable_mcp_agents?: boolean
}
```

### ComprehensiveAnalysisResult

```typescript
interface ComprehensiveAnalysisResult {
  analysis_id: string
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled"

  audio_analysis?: UnifiedAudioAnalysisResult
  scene_analysis?: SceneAnalysisResult
  video_analysis?: VideoAnalysisResult
  object_detection?: ObjectDetectionResult
  face_recognition?: FaceRecognitionResult

  started_at: string
  completed_at?: string
  total_duration_ms?: number
  errors: string[]
}
```

### UnifiedAudioAnalysisResult

```typescript
interface UnifiedAudioAnalysisResult {
  duration: number
  loudness: number
  tempo: number
  silence_percentage: number
  transcription?: string
  metrics?: Record<string, number>
}
```

### SceneAnalysisResult

```typescript
interface SceneAnalysisResult {
  scenes: Array<{
    start_time: number
    end_time: number
    confidence: number
    description?: string
  }>
  scene_count: number
}
```

### VideoAnalysisResult

```typescript
interface VideoAnalysisResult {
  width: number
  height: number
  fps: number
  duration: number
  bitrate?: number
  codec?: string
}
```

### ObjectDetectionResult

```typescript
interface ObjectDetectionResult {
  objects: Array<{
    label: string
    confidence: number
    bbox: [number, number, number, number]
    timestamp: number
  }>
  total_objects: number
}
```

### FaceRecognitionResult

```typescript
interface FaceRecognitionResult {
  faces: Array<{
    person_id?: string
    confidence: number
    bbox: [number, number, number, number]
    timestamp: number
  }>
  total_faces: number
}
```

### SystemCapabilities

```typescript
interface SystemCapabilities {
  audio_analysis: boolean
  video_analysis: boolean
  face_recognition: boolean
  object_detection: boolean
  transcription: boolean
  gpu_acceleration: boolean
  mcp_agents: boolean
}
```

### HealthCheckResult

```typescript
interface HealthCheckResult {
  overall_status: "healthy" | "warning" | "error"
  services: Record<string, string>
  last_check: string
}
```

### ConfigValidationResult

```typescript
interface ConfigValidationResult {
  is_valid: boolean
  warnings: string[]
  errors: string[]
  estimated_time: number      // seconds
  estimated_memory: number    // MB
}
```

### AnalysisProgress

```typescript
interface AnalysisProgress {
  analysisId: string
  stage: string  // "initialization" | "audio" | "video" | "integration" | "complete"
  progress: number  // 0.0 - 1.0
  message?: string
  estimatedTimeRemaining?: number  // seconds
}
```

### AnalysisError

```typescript
interface AnalysisError {
  analysisId: string
  stage: string
  error: string
}
```

### AnalysisStageCompleted

```typescript
interface AnalysisStageCompleted {
  analysisId: string
  stage: string
  duration_ms: number
  success: boolean
  error?: string
}
```

### AnalysisCompleted

```typescript
interface AnalysisCompleted {
  analysisId: string
  success: boolean
  total_duration_ms: number
  stages_completed: string[]
  errors: string[]
}
```
