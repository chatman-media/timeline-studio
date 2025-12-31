/**
 * AI Director Analysis Progress Types
 * Детальные типы для отслеживания прогресса анализа по файлам и анализаторам
 */

// ============================================================================
// Analyzer Types
// ============================================================================

export type AnalyzerType =
  // Video analyzers
  | "scene_detection"
  | "object_detection"
  | "face_detection"
  | "motion_analysis"
  | "composition_analysis"
  // Audio analyzers
  | "audio_quality"
  | "speech_recognition"
  | "speech_detection" // Alias for speech_recognition in v3 UI
  | "music_detection"
  | "sound_events"
  | "silence_detection"
  // Content analyzers
  | "mood_analysis"
  | "content_classification"
  | "quality_assessment"
  | "visual_quality" // Alias for quality_assessment in v3 UI
  | "moment_detection"
  | "person_recognition" // Person recognition in v3 UI
  | "vlm_analysis"

// ============================================================================
// VLM Model Types
// ============================================================================

/** Поддерживаемые Vision Language Models для анализа */
export type VlmModelType =
  | "moondream2" // Быстрая, легкая модель (по умолчанию)
  | "llava" // LLaVA - Large Language and Vision Assistant
  | "llava:13b" // LLaVA 13B - более мощная версия
  | "llava:34b" // LLaVA 34B - самая мощная версия
  | "llama3.2-vision" // Llama 3.2 Vision - новая модель от Meta
  | "llama3.2-vision:11b" // Llama 3.2 Vision 11B
  | "llama3.2-vision:90b" // Llama 3.2 Vision 90B

export interface VlmModelInfo {
  id: VlmModelType
  displayName: string
  description: string
  size: "small" | "medium" | "large" | "xlarge"
  /** Рекомендуемое количество фреймов */
  recommendedFrames: number
  /** Приблизительная скорость (фреймов/сек) */
  estimatedSpeed: number
}

/** Информация о доступных VLM моделях */
export const VLM_MODELS: Record<VlmModelType, VlmModelInfo> = {
  moondream2: {
    id: "moondream2",
    displayName: "Moondream 2",
    description: "Быстрая и легкая модель для базового анализа изображений",
    size: "small",
    recommendedFrames: 5,
    estimatedSpeed: 2.0,
  },
  llava: {
    id: "llava",
    displayName: "LLaVA 7B",
    description: "Универсальная модель для анализа видео и изображений",
    size: "medium",
    recommendedFrames: 4,
    estimatedSpeed: 1.0,
  },
  "llava:13b": {
    id: "llava:13b",
    displayName: "LLaVA 13B",
    description: "Улучшенная точность для детального анализа",
    size: "large",
    recommendedFrames: 3,
    estimatedSpeed: 0.5,
  },
  "llava:34b": {
    id: "llava:34b",
    displayName: "LLaVA 34B",
    description: "Максимальная точность, требует мощный GPU",
    size: "xlarge",
    recommendedFrames: 2,
    estimatedSpeed: 0.2,
  },
  "llama3.2-vision": {
    id: "llama3.2-vision",
    displayName: "Llama 3.2 Vision",
    description: "Новейшая модель от Meta для vision-задач",
    size: "medium",
    recommendedFrames: 4,
    estimatedSpeed: 1.2,
  },
  "llama3.2-vision:11b": {
    id: "llama3.2-vision:11b",
    displayName: "Llama 3.2 Vision 11B",
    description: "Баланс скорости и качества",
    size: "large",
    recommendedFrames: 3,
    estimatedSpeed: 0.6,
  },
  "llama3.2-vision:90b": {
    id: "llama3.2-vision:90b",
    displayName: "Llama 3.2 Vision 90B",
    description: "Максимальное качество, требует много VRAM",
    size: "xlarge",
    recommendedFrames: 2,
    estimatedSpeed: 0.1,
  },
}

/** Опции конфигурации VLM анализа */
export interface VlmAnalysisOptions {
  /** Модель для использования */
  model: VlmModelType
  /** Количество фреймов для анализа (переопределяет рекомендованное) */
  numFrames?: number
  /** Temperature для генерации (0.0-1.0) */
  temperature?: number
  /** Максимальное количество токенов */
  maxTokens?: number
}

export interface AnalyzerMetadata {
  type: AnalyzerType
  displayName: string
  category: "video" | "audio" | "content"
  description: string
  estimatedDuration: number // в секундах
  icon?: string
}

// ============================================================================
// Analyzer Progress
// ============================================================================

export type AnalyzerStatus = "pending" | "running" | "completed" | "error" | "skipped"

export interface AnalyzerProgress {
  type: AnalyzerType
  status: AnalyzerStatus
  progress: number // 0-100
  startTime?: string
  endTime?: string
  duration?: number // в миллисекундах
  details?: string
  result?: AnalyzerResult
  error?: string
}

export interface AnalyzerResult {
  type: AnalyzerType
  success: boolean
  data?: any
  metadata?: {
    processingTime: number
    itemsFound?: number // кол-во найденных сцен/объектов/моментов
    confidence?: number
    [key: string]: any
  }
}

// ============================================================================
// File Analysis Progress
// ============================================================================

export type FileAnalysisStatus = "pending" | "analyzing" | "completed" | "error" | "cancelled"

export interface FileAnalysisProgress {
  /** Unique file ID (alias for fileId for backward compatibility) */
  id?: string
  fileId: string
  filePath: string
  fileName: string
  status: FileAnalysisStatus
  progress: number // 0-100 (общий прогресс по файлу)
  analyzers: AnalyzerProgress[]
  startTime?: string
  endTime?: string
  duration?: number // в миллисекундах
  error?: string
  /** Current analysis stage (for UI display) */
  currentStage?: string
  /** Estimated time remaining in seconds */
  eta?: number
  // Статистика
  stats?: {
    totalAnalyzers: number
    completedAnalyzers: number
    failedAnalyzers: number
    skippedAnalyzers: number
  }
  /** Результаты анализа (для completed анализов из storage) */
  result?: any // ComprehensiveAnalysisResult
}

// ============================================================================
// Batch Analysis Progress
// ============================================================================

export type BatchAnalysisStatus = "idle" | "running" | "completed" | "error" | "cancelled"

export interface BatchAnalysisProgress {
  /** Unique batch ID */
  id?: string
  /** Batch ID (for backward compatibility) */
  batchId?: string
  status: BatchAnalysisStatus
  files?: FileAnalysisProgress[]
  startTime?: string
  endTime?: string
  duration?: number
  /** Configuration mode used for this batch */
  configMode?: string
  /** Direct access fields for convenience */
  totalFiles?: number
  completedFiles?: number
  progress?: number // 0-100
  estimatedTimeRemaining?: number // in seconds
  currentFilePath?: string
  // Общая статистика
  stats?: {
    totalFiles: number
    completedFiles: number
    failedFiles: number
    totalProgress: number // 0-100 (средний прогресс всех файлов)
  }
}

// ============================================================================
// Analysis Configuration
// ============================================================================

export interface AnalysisConfig {
  /** Включенные анализаторы */
  enabledAnalyzers: Set<AnalyzerType>
  /** Настройки для каждого анализатора */
  analyzerSettings?: Partial<Record<AnalyzerType, any>>
  /** Параллельная обработка файлов */
  parallelFiles?: number // макс кол-во файлов одновременно (default: 2)
  /** Таймаут на файл */
  fileTimeout?: number // в секундах
}

// ============================================================================
// Analysis Events (для real-time обновлений)
// ============================================================================

export type AnalysisProgressEvent =
  // Batch events
  | {
      type: "batch_started"
      batchId: string
      totalFiles: number
    }
  | {
      type: "batch_progress"
      batchId: string
      progress: number
    }
  | {
      type: "batch_completed"
      batchId: string
      duration: number
    }
  | {
      type: "batch_error"
      batchId: string
      error: string
    }
  // File events
  | {
      type: "file_started"
      batchId: string
      fileId: string
      filePath: string
    }
  | {
      type: "file_progress"
      batchId: string
      fileId: string
      progress: number
    }
  | {
      type: "file_completed"
      batchId: string
      fileId: string
      duration: number
    }
  | {
      type: "file_error"
      batchId: string
      fileId: string
      error: string
    }
  // Analyzer events
  | {
      type: "analyzer_started"
      batchId: string
      fileId: string
      analyzer: AnalyzerType
    }
  | {
      type: "analyzer_progress"
      batchId: string
      fileId: string
      analyzer: AnalyzerType
      progress: number
      details?: string
    }
  | {
      type: "analyzer_completed"
      batchId: string
      fileId: string
      analyzer: AnalyzerType
      result: AnalyzerResult
      duration: number
    }
  | {
      type: "analyzer_error"
      batchId: string
      fileId: string
      analyzer: AnalyzerType
      error: string
    }

// ============================================================================
// Helper Functions
// ============================================================================

export const ANALYZER_METADATA: Record<AnalyzerType, AnalyzerMetadata> = {
  // Video
  scene_detection: {
    type: "scene_detection",
    displayName: "Scene Detection",
    category: "video",
    description: "Определение сцен и переходов",
    estimatedDuration: 30,
  },
  object_detection: {
    type: "object_detection",
    displayName: "Object Detection",
    category: "video",
    description: "Распознавание объектов (YOLO)",
    estimatedDuration: 60,
  },
  face_detection: {
    type: "face_detection",
    displayName: "Face Detection",
    category: "video",
    description: "Детекция лиц",
    estimatedDuration: 45,
  },
  motion_analysis: {
    type: "motion_analysis",
    displayName: "Motion Analysis",
    category: "video",
    description: "Анализ движения",
    estimatedDuration: 40,
  },
  composition_analysis: {
    type: "composition_analysis",
    displayName: "Composition Analysis",
    category: "video",
    description: "Оценка композиции кадра",
    estimatedDuration: 35,
  },
  // Audio
  audio_quality: {
    type: "audio_quality",
    displayName: "Audio Quality",
    category: "audio",
    description: "Оценка качества звука",
    estimatedDuration: 20,
  },
  speech_recognition: {
    type: "speech_recognition",
    displayName: "Speech Recognition",
    category: "audio",
    description: "Распознавание речи (Whisper)",
    estimatedDuration: 90,
  },
  music_detection: {
    type: "music_detection",
    displayName: "Music Detection",
    category: "audio",
    description: "Детекция музыки",
    estimatedDuration: 25,
  },
  sound_events: {
    type: "sound_events",
    displayName: "Sound Events",
    category: "audio",
    description: "Определение звуковых событий",
    estimatedDuration: 30,
  },
  silence_detection: {
    type: "silence_detection",
    displayName: "Silence Detection",
    category: "audio",
    description: "Детекция тишины",
    estimatedDuration: 15,
  },
  speech_detection: {
    type: "speech_detection",
    displayName: "Speech Detection",
    category: "audio",
    description: "Определение речевых сегментов",
    estimatedDuration: 30,
  },
  // Content
  person_recognition: {
    type: "person_recognition",
    displayName: "Person Recognition",
    category: "video",
    description: "Распознавание персон",
    estimatedDuration: 55,
  },
  visual_quality: {
    type: "visual_quality",
    displayName: "Visual Quality",
    category: "video",
    description: "Оценка визуального качества",
    estimatedDuration: 30,
  },
  mood_analysis: {
    type: "mood_analysis",
    displayName: "Mood Analysis",
    category: "content",
    description: "Определение настроения",
    estimatedDuration: 50,
  },
  content_classification: {
    type: "content_classification",
    displayName: "Content Classification",
    category: "content",
    description: "Классификация контента",
    estimatedDuration: 40,
  },
  quality_assessment: {
    type: "quality_assessment",
    displayName: "Quality Assessment",
    category: "content",
    description: "Общая оценка качества",
    estimatedDuration: 35,
  },
  moment_detection: {
    type: "moment_detection",
    displayName: "Moment Detection",
    category: "content",
    description: "Поиск ключевых моментов",
    estimatedDuration: 45,
  },
  vlm_analysis: {
    type: "vlm_analysis",
    displayName: "VLM Analysis",
    category: "content",
    description: "Vision Language Model (LLaVA/GPT-4V)",
    estimatedDuration: 120,
  },
}

/**
 * Получить метаданные анализатора по типу
 */
export function getAnalyzerMetadata(type: AnalyzerType): AnalyzerMetadata {
  return ANALYZER_METADATA[type]
}

/**
 * Получить все анализаторы определенной категории
 */
export function getAnalyzersByCategory(category: "video" | "audio" | "content"): AnalyzerMetadata[] {
  return Object.values(ANALYZER_METADATA).filter((meta) => meta.category === category)
}

/**
 * Вычислить общий прогресс файла на основе прогресса анализаторов
 */
export function calculateFileProgress(analyzers: AnalyzerProgress[]): number {
  if (analyzers.length === 0) return 0

  const totalProgress = analyzers.reduce((sum, analyzer) => sum + analyzer.progress, 0)
  return Math.round(totalProgress / analyzers.length)
}

/**
 * Вычислить общий прогресс batch на основе прогресса файлов
 */
export function calculateBatchProgress(files: FileAnalysisProgress[]): number {
  if (files.length === 0) return 0

  const totalProgress = files.reduce((sum, file) => sum + file.progress, 0)
  return Math.round(totalProgress / files.length)
}

/**
 * Создать начальный прогресс файла
 */
export function createInitialFileProgress(
  fileId: string,
  filePath: string,
  fileName: string,
  enabledAnalyzers: AnalyzerType[],
): FileAnalysisProgress {
  return {
    fileId,
    filePath,
    fileName,
    status: "pending",
    progress: 0,
    analyzers: enabledAnalyzers.map((type) => ({
      type,
      status: "pending",
      progress: 0,
    })),
    stats: {
      totalAnalyzers: enabledAnalyzers.length,
      completedAnalyzers: 0,
      failedAnalyzers: 0,
      skippedAnalyzers: 0,
    },
  }
}

/**
 * Обновить прогресс анализатора в файле
 */
export function updateAnalyzerProgress(
  fileProgress: FileAnalysisProgress,
  analyzerType: AnalyzerType,
  update: Partial<AnalyzerProgress>,
): FileAnalysisProgress {
  const updatedAnalyzers = fileProgress.analyzers.map((analyzer) =>
    analyzer.type === analyzerType ? { ...analyzer, ...update } : analyzer,
  )

  const stats = {
    totalAnalyzers: updatedAnalyzers.length,
    completedAnalyzers: updatedAnalyzers.filter((a) => a.status === "completed").length,
    failedAnalyzers: updatedAnalyzers.filter((a) => a.status === "error").length,
    skippedAnalyzers: updatedAnalyzers.filter((a) => a.status === "skipped").length,
  }

  return {
    ...fileProgress,
    analyzers: updatedAnalyzers,
    progress: calculateFileProgress(updatedAnalyzers),
    stats,
  }
}

/**
 * Извлечь список анализаторов из ComprehensiveAnalysisResult
 * Определяет какие анализаторы были выполнены на основе заполненных полей
 */
export function extractAnalyzersFromResult(
  result: any, // ComprehensiveAnalysisResult from Rust
): AnalyzerProgress[] {
  const analyzers: AnalyzerProgress[] = []

  // Audio analyzers
  if (result.audio_analysis) {
    analyzers.push({
      type: "audio_quality",
      status: "completed",
      progress: 100,
    })

    // Если есть транскрипция
    if (result.audio_analysis.transcription) {
      analyzers.push({
        type: "speech_recognition",
        status: "completed",
        progress: 100,
      })
    }
  }

  // Scene detection
  if (result.scene_analysis && result.scene_analysis.scenes && result.scene_analysis.scenes.length > 0) {
    analyzers.push({
      type: "scene_detection",
      status: "completed",
      progress: 100,
      result: {
        type: "scene_detection",
        success: true,
        metadata: {
          itemsFound: result.scene_analysis.scenes.length,
          processingTime: 0,
        },
      },
    })
  }

  // Vision analysis (objects, faces)
  if (result.vision_analysis) {
    if (result.vision_analysis.objects_detected && result.vision_analysis.objects_detected.length > 0) {
      analyzers.push({
        type: "object_detection",
        status: "completed",
        progress: 100,
        result: {
          type: "object_detection",
          success: true,
          metadata: {
            itemsFound: result.vision_analysis.objects_detected.length,
            processingTime: 0,
          },
        },
      })
    }

    if (result.vision_analysis.faces_count > 0) {
      analyzers.push({
        type: "face_detection",
        status: "completed",
        progress: 100,
        result: {
          type: "face_detection",
          success: true,
          metadata: {
            itemsFound: result.vision_analysis.faces_count,
            processingTime: 0,
          },
        },
      })
    }
  }

  // Vision Language Model analysis
  if (result.vision_language_model_analysis) {
    analyzers.push({
      type: "vlm_analysis",
      status: "completed",
      progress: 100,
    })
  }

  // Moment detection
  if (result.moment_analysis && result.moment_analysis.key_moments && result.moment_analysis.key_moments.length > 0) {
    analyzers.push({
      type: "moment_detection",
      status: "completed",
      progress: 100,
      result: {
        type: "moment_detection",
        success: true,
        metadata: {
          itemsFound: result.moment_analysis.key_moments.length,
          processingTime: 0,
        },
      },
    })
  }

  // Content analysis
  if (result.content_analysis) {
    analyzers.push({
      type: "content_classification",
      status: "completed",
      progress: 100,
    })

    if (result.content_analysis.mood) {
      analyzers.push({
        type: "mood_analysis",
        status: "completed",
        progress: 100,
      })
    }

    if (result.content_analysis.quality) {
      analyzers.push({
        type: "quality_assessment",
        status: "completed",
        progress: 100,
      })
    }
  }

  return analyzers
}

/**
 * Создать FileAnalysisProgress из ComprehensiveAnalysisResult
 * Используется при загрузке сохраненных анализов из storage
 */
export function createFileProgressFromResult(
  result: any, // ComprehensiveAnalysisResult from Rust
  filePath: string,
): FileAnalysisProgress {
  const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || filePath
  const analyzers = extractAnalyzersFromResult(result)

  return {
    id: result.analysis_id,
    fileId: result.analysis_id,
    fileName,
    filePath,
    status: result.status === "Completed" ? "completed" : "error",
    progress: 100,
    analyzers,
    stats: {
      totalAnalyzers: analyzers.length,
      completedAnalyzers: analyzers.filter((a) => a.status === "completed").length,
      failedAnalyzers: analyzers.filter((a) => a.status === "error").length,
      skippedAnalyzers: analyzers.filter((a) => a.status === "skipped").length,
    },
    startTime: result.started_at,
    endTime: result.completed_at,
    duration: result.total_duration_ms,
    // Сохраняем результаты анализа для использования в UI
    result,
  }
}
